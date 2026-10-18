"""Retrieval pipeline — fixed order (Spec §7, steps 1–7).

    1. normalize question
    2. detect date / historical-time requirement
    3. identify candidate legal instruments
    4. retrieve structurally relevant provisions (direct Article references)
    5. lexical BM25 retrieval
    6. semantic retrieval
    7. fuse with RRF (+ metadata filtering by candidate instrument)

Steps 8–12 (status metadata, jurisprudence, verification, generation, citation)
are performed by the engines/agents driven by the Orchestrator.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field

from .. import config
from ..models import RetrievedChunk
from ..store import corpus_store, lexical_index, vector_index
from ..engines import temporal_engine as T
from . import rrf

# instrument aliases → instrument_id (Spec §7 step 3)
_ALIASES = {
    "un charter": "UN_CHARTER", "charter of the united nations": "UN_CHARTER",
    "the charter": "UN_CHARTER", "un_charter": "UN_CHARTER",
    "icj statute": "ICJ_STATUTE", "statute of the international court": "ICJ_STATUTE",
    "statute of the court": "ICJ_STATUTE", "international court of justice": "ICJ_STATUTE",
    "the court's statute": "ICJ_STATUTE",
    "vienna convention": "VCLT", "law of treaties": "VCLT", "vclt": "VCLT",
    "vienna convention on the law of treaties": "VCLT",
}


@dataclass
class RetrievalResult:
    question: str
    normalized: str
    needs_temporal: bool
    dates: list[str]
    candidate_instruments: list[str]
    chunks: list[RetrievedChunk]
    lexical: list[tuple[str, float]] = field(default_factory=list)
    semantic: list[tuple[str, float]] = field(default_factory=list)
    structural: list[str] = field(default_factory=list)


def _normalize(q: str) -> str:
    return re.sub(r"\s+", " ", q).strip()


def identify_instruments(q: str) -> list[str]:
    ql = q.lower()
    found = []
    for alias, iid in _ALIASES.items():
        if alias in ql and iid not in found:
            found.append(iid)
    return found


def _structural_hits(q: str, candidates: list[str]) -> list[str]:
    """Step 4 — direct 'Article N' (optionally with paragraph) references."""
    hits: list[str] = []
    provs = corpus_store.all_provisions()
    scope = candidates or list({p.instrument_id for p in provs})
    for m in re.finditer(r"article\s+(\d+)\s*(?:\(?\s*(\d+)\s*\)?)?", q, re.I):
        art, para = m.group(1), m.group(2)
        for p in provs:
            if p.instrument_id in scope and p.article == art:
                if para and p.paragraph == para:
                    hits.insert(0, p.provision_id)
                elif not para:
                    hits.append(p.provision_id)
    # de-dupe preserve order
    seen, out = set(), []
    for h in hits:
        if h not in seen:
            seen.add(h); out.append(h)
    return out


def retrieve(question: str, top_k: int = None,
             use_lexical: bool = True, use_semantic: bool = True,
             use_structure: bool = True) -> RetrievalResult:
    top_k = top_k or config.TOP_K
    norm = _normalize(question)                                      # 1
    dates = T.extract_dates(norm)                                    # 2
    needs_temporal = T.has_temporal_requirement(norm)               # 2
    candidates = identify_instruments(norm)                          # 3

    structural = _structural_hits(norm, candidates) if use_structure else []   # 4
    lex = lexical_index.BM25().search(norm, top_k=25) if use_lexical else []    # 5
    sem = vector_index.VectorIndex().search(norm, top_k=25) if use_semantic else []  # 6

    # 7 — fuse; seed structural hits as a high-priority ranked list
    lists = []
    if structural:
        lists.append([(pid, 1.0) for pid in structural])
    if lex:
        lists.append(lex)
    if sem:
        lists.append(sem)
    fused = rrf.fuse(*lists) if lists else []

    # metadata filtering: prefer candidate-instrument provisions when detected
    prov_of = {p.provision_id: p for p in corpus_store.all_provisions()}
    if candidates:
        in_scope = [(pid, s) for pid, s in fused if prov_of.get(pid) and prov_of[pid].instrument_id in candidates]
        out_scope = [(pid, s) for pid, s in fused if (pid, s) not in in_scope]
        fused = in_scope + out_scope

    # an explicit "Article N(¶p)" reference is authoritative — pin those first
    if structural:
        pinned = [(pid, dict(fused).get(pid, 1.0)) for pid in structural]
        rest = [(pid, s) for pid, s in fused if pid not in set(structural)]
        fused = pinned + rest

    chunks: list[RetrievedChunk] = []
    for pid, score in fused[:top_k]:
        p = prov_of.get(pid)
        if not p:
            continue
        chunks.append(RetrievedChunk(
            provision_id=p.provision_id, instrument_id=p.instrument_id,
            structural_path=p.structural_path, text=p.exact_text,
            source_location=p.source_location, score=round(score, 6),
            source_stream="fused"))
    return RetrievalResult(question=question, normalized=norm,
                           needs_temporal=needs_temporal, dates=dates,
                           candidate_instruments=candidates, chunks=chunks,
                           lexical=lex, semantic=sem, structural=structural)
