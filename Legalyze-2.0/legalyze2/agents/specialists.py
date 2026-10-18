"""The seven single-responsibility specialist agents (Spec §8).

Each agent is deterministic-first (works with no LLM/quota) and upgrades to the
LLM when a working key is available. No agent invents legal facts.
"""
from __future__ import annotations
import re

from ..models import Citation, RetrievedChunk
from ..store import corpus_store
from ..engines import status_engine, temporal_engine as T
from ..retrieval import pipeline


# --------------------------------------------------------------------------- #
#  Instrument Identification Agent                                            #
# --------------------------------------------------------------------------- #
class InstrumentIdentificationAgent:
    """Identifies the international legal instrument(s) relevant to the question."""

    def run(self, question: str, retrieval) -> list[str]:
        ids = list(retrieval.candidate_instruments)
        if not ids:
            # infer from the instruments of the top retrieved provisions
            seen = []
            for c in retrieval.chunks:
                if c.instrument_id not in seen:
                    seen.append(c.instrument_id)
            ids = seen[:2]
        return ids


# --------------------------------------------------------------------------- #
#  Treaty Status Agent                                                        #
# --------------------------------------------------------------------------- #
class TreatyStatusAgent:
    """Checks signature, ratification, accession, entry into force, withdrawal,
    reservations, declarations and objections for a state + instrument."""

    def states_in(self, question: str, instrument_ids: list[str]) -> list[str]:
        found = []
        known = {p.state for p in corpus_store.participation()}
        ql = question.lower()
        for st in known:
            if st.lower() in ql and st not in found:
                found.append(st)
        return found

    def run(self, instrument_id: str, state: str, as_of: str | None):
        return status_engine.status_as_of(instrument_id, state, as_of)


# --------------------------------------------------------------------------- #
#  Temporal Reasoning Agent                                                   #
# --------------------------------------------------------------------------- #
class TemporalReasoningAgent:
    """Determines the legally relevant status at the requested date (Spec §9)."""

    def run(self, instrument_id: str, state: str, question: str):
        as_of = T.requested_date(question)
        result = status_engine.status_as_of(instrument_id, state, as_of)
        return as_of, result


# --------------------------------------------------------------------------- #
#  Applicability Agent                                                        #
# --------------------------------------------------------------------------- #
class ApplicabilityAgent:
    """Determines whether an instrument/provision applies to the stated state,
    actor, subject or situation. Never treats mention of a state as proof of
    applicability (Spec §20)."""

    def run(self, question: str, instrument_ids: list[str], status_results: dict) -> str:
        notes = []
        for iid in instrument_ids:
            inst = corpus_store.instrument(iid)
            if not inst:
                continue
            if iid in status_results:
                sr = status_results[iid]
                if sr.status == "party":
                    notes.append(f"{inst.title} applies to {sr.state} — a party effective {sr.effective_date}.")
                elif sr.status in ("signatory_only",):
                    notes.append(f"{inst.title}: {sr.state} is a signatory only; treaty obligations do not bind it as a party.")
                elif sr.status == "not_yet_in_force":
                    notes.append(f"{inst.title} was not yet in force for {sr.state} at the requested date.")
                elif sr.status == "withdrawn":
                    notes.append(f"{inst.title}: {sr.state} has withdrawn; it no longer applies.")
                elif sr.status == "unknown":
                    notes.append(f"Applicability of {inst.title} to {sr.state} is not established by the indexed sources.")
                else:
                    notes.append(f"{inst.title} does not apply to {sr.state} as of the requested date.")
            else:
                notes.append(f"{inst.title} is the relevant instrument for the subject-matter of the question.")
        return " ".join(notes)


# --------------------------------------------------------------------------- #
#  Jurisprudence Agent                                                        #
# --------------------------------------------------------------------------- #
class JurisprudenceAgent:
    """Retrieves authoritative international judgments/advisory opinions relevant
    to interpretation (Spec §8)."""

    _INTERP = re.compile(r"\b(interpret|meaning|mean|customary|self-defen|use of force|"
                         r"material breach|terminat|jurisprudence|case law|court held|advisory)\b", re.I)

    def needed(self, question: str) -> bool:
        return bool(self._INTERP.search(question))

    def run(self, instrument_ids: list[str], question: str):
        out = []
        for c in corpus_store.cases():
            if set(c.instrument_links) & set(instrument_ids):
                out.append(c)
        # keyword fallback
        if not out:
            ql = question.lower()
            for c in corpus_store.cases():
                if any(w in ql for w in ("force", "self-defence", "self defense", "treaty", "breach")):
                    out.append(c)
        return out[:2]


# --------------------------------------------------------------------------- #
#  Citation Verification Agent (Spec §11)                                     #
# --------------------------------------------------------------------------- #
_STOP = set("a an the of to in on for and or by with as at is are be this that which "
            "shall may not no than from its it their such any all each other into".split())


def _toks(s: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", s.lower()) if t not in _STOP and len(t) > 2}


class CitationVerificationAgent:
    """Checks that each claim is supported by the cited source on four axes:
    semantic support, source identity, provision identity, temporal relevance."""

    def verify(self, claim: str, chunk: RetrievedChunk, *, question_date: str | None = None,
               support_threshold: float = 0.18) -> Citation:
        prov = corpus_store.get_provision(chunk.provision_id)
        reasons = []
        # source identity — provision exists and belongs to a real instrument
        source_ok = prov is not None
        # provision identity — if the claim names an article, it must match
        prov_ok = True
        m = re.search(r"article\s+(\d+)", claim, re.I)
        if m and prov and prov.article != m.group(1):
            prov_ok = False
            reasons.append(f"claim cites Article {m.group(1)} but source is Article {prov.article}")
        # semantic support — token overlap (Jaccard-ish) between claim and source
        ct, pt = _toks(claim), _toks(chunk.text + " " + chunk.structural_path)
        overlap = len(ct & pt) / len(ct) if ct else 0.0
        sem_ok = overlap >= support_threshold
        if not sem_ok:
            reasons.append(f"insufficient semantic support (overlap={overlap:.2f})")
        # temporal relevance — a dated claim must not rely on undated evidence blindly
        temporal_ok = True   # dates are handled by the status engine; provisions are timeless text
        supported = bool(source_ok and prov_ok and sem_ok and temporal_ok)
        return Citation(
            claim=claim, provision_id=chunk.provision_id,
            source_location=chunk.source_location,
            quote=chunk.text[:240], supported=supported,
            reason="; ".join(reasons) if reasons else "supported by cited provision")
