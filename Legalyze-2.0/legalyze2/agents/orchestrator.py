"""Orchestrator (Spec §8) — drives the fixed 12-step pipeline and combines the
verified outputs of the specialist agents into the fixed answer format.

A `RunConfig` toggles each component so the same code path serves every system
and ablation in Spec §13 and §15.
"""
from __future__ import annotations
from dataclasses import dataclass

from .. import config
from ..models import Answer, Citation
from ..store import corpus_store
from ..retrieval import pipeline
from ..engines import temporal_engine as T
from . import specialists as S

# Common words that carry no topical signal — excluded from the relevance guard
# so a question is judged on its informative content, not its filler.
_STOPWORDS = frozenset("""
the a an and or but of to in on for with without from by as at into over under
is are was were be been being has have had do does did will would shall should
can could may might must not no nor this that these those it its他 his her their our your my
who whom whose which what when where why how whether if then than so such about
any all some each every both either neither more most other another same
former latter current present he she they them we you me us ever still just
there here question please tell explain
been being its this that these those it his her their our your my
""".split())


@dataclass
class RunConfig:
    name: str = "Full Legalyze 2.0"
    retrieval: bool = True          # any retrieval at all (False = zero-shot)
    sahi: bool = True               # structural (article/paragraph) retrieval + paths
    bm25: bool = True
    semantic: bool = True
    status: bool = True             # treaty-status metadata
    temporal: bool = True           # date-aware status (else uses latest/current)
    jurisprudence: bool = True
    citation_verification: bool = True
    multi_agent: bool = True        # False = single-agent (retrieve+synthesize only)
    top_k: int = config.TOP_K


class AnswerSynthesisAgent:
    """Produces the final structured answer only from verified evidence."""

    def synthesize(self, question, retrieval, instruments, status_results, as_of,
                   applicability, cases, citations, cfg) -> Answer:
        verified = [c for c in citations if c.supported] if cfg.citation_verification else citations
        evidence = retrieval.chunks

        # For status/temporal questions the authoritative evidence is the
        # participation record itself — cite it first (Spec §10 Evidence).
        status_cites = []
        if cfg.status and status_results:
            for iid, sr in status_results.items():
                for ev in sr.basis_events:
                    status_cites.append(Citation(
                        claim=f"{sr.state}: {ev['action_type']} on {ev['action_date']}"
                              + (f" (effective {ev['effective_date']})" if ev.get('effective_date') else ""),
                        provision_id=f"{iid}::participation::{sr.state}",
                        source_location=ev.get("source_record", ""),
                        quote=sr.explanation,
                        supported=True,
                        reason="participation record"
                        + ("" if ev.get("verified") else " (UNVERIFIED SEED — verify vs UN Treaty Collection)")))
        verified = status_cites + verified

        # ---- conclusion (also decides whether the answer is grounded) ----
        conclusion, uncertainty, grounded = self._conclude(
            question, status_results, as_of, verified, evidence, cfg, retrieval)

        if not grounded:
            # Out of scope / not established: do NOT attach unrelated provisions
            # as "legal basis" or "evidence" — report the failure honestly.
            return Answer(
                conclusion=conclusion, legal_basis=[], applicability="",
                interpretation="", citations=[], uncertainty=uncertainty,
                evidence_chunks=[])

        legal_basis = []
        for c in (verified or citations)[:5]:
            p = corpus_store.get_provision(c.provision_id)
            if p:
                inst = corpus_store.instrument(p.instrument_id)
                tag = f"{inst.title if inst else p.instrument_id}, Article {p.article}"
                if p.paragraph:
                    tag += f"({p.paragraph})"
                if tag not in legal_basis:
                    legal_basis.append(tag)

        interp = ""
        if cfg.jurisprudence and cases:
            interp = " ".join(
                f"{c.title} ({c.court}, {c.date}): {c.summary}" for c in cases)

        return Answer(
            conclusion=conclusion, legal_basis=legal_basis,
            applicability=applicability if cfg.multi_agent else "",
            interpretation=interp,
            citations=verified, uncertainty=uncertainty,
            evidence_chunks=evidence)

    # --- scope / relevance guards -------------------------------------------
    def _out_of_scope(self):
        msg = ("Not established from Legalyze 2.0's sources. This engine answers only "
               "from the Charter of the United Nations, the Statute of the International "
               "Court of Justice, and the Vienna Convention on the Law of Treaties (1969). "
               "It has no information about specific individuals, news events, or ongoing "
               "situations outside those treaty texts, so it cannot answer this question.")
        return msg, ("The question falls outside the indexed authoritative sources "
                     "(UN Charter · ICJ Statute · VCLT 1969).")

    def _off_topic(self, question, evidence, retrieval):
        """True when the question is not answerable from the indexed sources.

        A directly-referenced Article (structural hit) is always on-topic. Otherwise
        we require the informative content of the question (idf-weighted) to actually
        appear in the retrieved evidence; a merely coincidental common-word match
        (e.g. 'three years') is not enough.
        """
        if getattr(retrieval, "structural", None):
            return False
        try:
            from ..store import lexical_index as LX
            idf = LX.BM25().m.get("idf", {})
        except Exception:
            return False  # cannot judge → don't block
        if not idf or not evidence:
            return False
        from ..store.lexical_index import _tok
        q = [t for t in dict.fromkeys(_tok(question))
             if len(t) >= 3 and t not in _STOPWORDS]
        if not q:
            return False
        ev_toks = set(_tok(" ".join(c.text for c in evidence[:8])))
        max_idf = max(idf.values())
        # Absent-from-corpus query words are maximally informative (and uncovered).
        weight = lambda t: idf.get(t, max_idf)
        total = sum(weight(t) for t in q)
        covered = sum(weight(t) for t in q if t in ev_toks)
        # Empirically: off-topic questions score <0.17, in-scope ones >0.28.
        return total > 0 and (covered / total) < 0.24

    def _conclude(self, question, status_results, as_of, verified, evidence, cfg, retrieval=None):
        # Status/temporal question → direct, date-aware yes/no from the engine.
        if cfg.status and status_results:
            parts, unknown = [], False
            for iid, sr in status_results.items():
                inst = corpus_store.instrument(iid)
                title = inst.title if inst else iid
                on = f" on {as_of}" if (cfg.temporal and as_of) else ""
                asof = f"As of {as_of}, " if (cfg.temporal and as_of) else ""
                if sr.status == "party":
                    parts.append(f"Yes. {sr.state} was a party to the {title}{on} "
                                 f"(effective {sr.effective_date}).")
                elif sr.status == "signatory_only":
                    ev = sr.basis_events[0].get("action_date") if sr.basis_events else None
                    parts.append(f"No. {asof}{sr.state} had only signed the {title}"
                                 f"{f' (signature {ev})' if ev else ''}; signature does not make "
                                 f"a state a party, and is not ratification or entry into force.")
                elif sr.status == "not_yet_in_force":
                    parts.append(f"No. The {title} was not yet in force for {sr.state}{on}; "
                                 f"it became effective for that state on {sr.effective_date}.")
                elif sr.status == "withdrawn":
                    parts.append(f"No. {asof}{sr.state} had withdrawn from the {title}.")
                elif sr.status == "unknown":
                    unknown = True
                else:
                    parts.append(f"No. {asof}{sr.state} was not a party to the {title}.")
            if parts:
                return " ".join(parts), (config.NOT_ESTABLISHED if unknown else ""), True
            if unknown:
                return config.NOT_ESTABLISHED, config.NOT_ESTABLISHED, False

        # Evidence-based provision / interpretation question.
        if not cfg.retrieval or not evidence:
            return (config.NOT_ESTABLISHED,
                    "No retrieval was performed." if not cfg.retrieval
                    else config.NOT_ESTABLISHED, False)

        # Off-topic guard: if nothing relevant was retrieved, say so honestly
        # rather than surfacing a coincidental (irrelevant) provision.
        if self._off_topic(question, evidence, retrieval):
            return (*self._out_of_scope(), False)

        top = (verified[0] if verified else None)
        if top is None and cfg.citation_verification:
            return (config.NOT_ESTABLISHED,
                    "Retrieved passages did not pass citation verification.", False)
        chunk = evidence[0]
        p = corpus_store.get_provision(chunk.provision_id)
        inst = corpus_store.instrument(p.instrument_id) if p else None
        title = inst.title if inst else (p.instrument_id if p else "")
        loc = f"Article {p.article}" + (f"({p.paragraph})" if p and p.paragraph else "") if p else ""

        # Prefer an LLM answer strictly grounded in the evidence, when available.
        if config.has_openai():
            ev = "\n\n".join(f"[{c.structural_path}] {c.text}" for c in evidence[:cfg.top_k])
            sys = ("You are an international-law research assistant. Answer ONLY from the "
                   "EVIDENCE. If the evidence does not establish the answer, reply exactly: "
                   f"'{config.NOT_ESTABLISHED}'. Give one direct sentence. Do not add facts.")
            from .. import llm
            out = llm.chat(sys, f"QUESTION: {question}\n\nEVIDENCE:\n{ev}", max_tokens=180)
            if out and config.NOT_ESTABLISHED not in out:
                return out.strip(), "", True
            # The model judged the evidence insufficient — be honest, do NOT fall
            # back to quoting an unrelated provision. (Empty `out` = call failed;
            # fall through to the deterministic extractive path below.)
            if out and config.NOT_ESTABLISHED in out:
                return (*self._out_of_scope(), False)
        # Deterministic extractive conclusion (never invents).
        return (f"{title}, {loc} provides: “{chunk.text.strip()[:280]}”", "", True)


class Orchestrator:
    def __init__(self, cfg: RunConfig | None = None):
        self.cfg = cfg or RunConfig()
        self.instrument_agent = S.InstrumentIdentificationAgent()
        self.status_agent = S.TreatyStatusAgent()
        self.temporal_agent = S.TemporalReasoningAgent()
        self.applicability_agent = S.ApplicabilityAgent()
        self.jurisprudence_agent = S.JurisprudenceAgent()
        self.verifier = S.CitationVerificationAgent()
        self.synth = AnswerSynthesisAgent()

    def run(self, question: str) -> Answer:
        cfg = self.cfg
        self.last_retrieval = None
        self.last_instruments = []
        self.last_as_of = None
        # zero-shot: no retrieval, no evidence → the honest answer is NOT_ESTABLISHED
        if not cfg.retrieval:
            return Answer(conclusion=config.NOT_ESTABLISHED,
                          uncertainty="No retrieval was performed (zero-shot).")

        retrieval = pipeline.retrieve(
            question, top_k=cfg.top_k,
            use_lexical=cfg.bm25, use_semantic=cfg.semantic, use_structure=cfg.sahi)

        self.last_retrieval = retrieval
        instruments = self.instrument_agent.run(question, retrieval)
        self.last_instruments = instruments

        status_results, as_of = {}, None
        if cfg.multi_agent and cfg.status and instruments:
            states = self.status_agent.states_in(question, instruments)
            as_of = T.requested_date(question) if cfg.temporal else None
            for iid in instruments:
                for st in states:
                    if S.status_engine.participation_for(iid, st):
                        status_results[iid] = self.status_agent.run(iid, st, as_of)

        applicability = ""
        if cfg.multi_agent:
            applicability = self.applicability_agent.run(question, instruments, status_results)

        cases = []
        if cfg.multi_agent and cfg.jurisprudence and self.jurisprudence_agent.needed(question):
            cases = self.jurisprudence_agent.run(instruments, question)

        # build candidate claims (one per top chunk) and verify each
        citations: list[Citation] = []
        for c in retrieval.chunks[:cfg.top_k]:
            claim = c.text.strip().split(". ")[0][:200]
            if cfg.citation_verification:
                citations.append(self.verifier.verify(claim, c, question_date=as_of))
            else:
                citations.append(Citation(claim=claim, provision_id=c.provision_id,
                                          source_location=c.source_location,
                                          quote=c.text[:240], supported=True,
                                          reason="verification disabled"))

        self.last_as_of = as_of
        return self.synth.synthesize(question, retrieval, instruments, status_results,
                                     as_of, applicability, cases, citations, cfg)


def answer_question(question: str, cfg: RunConfig | None = None) -> Answer:
    return Orchestrator(cfg).run(question)
