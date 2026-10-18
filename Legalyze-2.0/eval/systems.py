"""Systems under comparison (Spec §13) and required ablations (Spec §15).

Do not change these comparisons — they are the experimental protocol.
"""
from __future__ import annotations
from legalyze2.agents.orchestrator import RunConfig

# ---- §13 systems ---------------------------------------------------------- #
SYSTEMS = [
    RunConfig(name="Zero-shot LLM", retrieval=False, sahi=False, bm25=False,
              semantic=False, status=False, temporal=False, jurisprudence=False,
              citation_verification=False, multi_agent=False),
    RunConfig(name="Standard RAG", retrieval=True, sahi=False, bm25=True,
              semantic=True, status=False, temporal=False, jurisprudence=False,
              citation_verification=False, multi_agent=False),
    RunConfig(name="Legalyze 1.0 (transfer)", retrieval=True, sahi=True, bm25=True,
              semantic=True, status=False, temporal=False, jurisprudence=False,
              citation_verification=True, multi_agent=True),
    RunConfig(name="Legalyze 2.0 without SAHI", retrieval=True, sahi=False, bm25=True,
              semantic=True, status=True, temporal=True, jurisprudence=True,
              citation_verification=True, multi_agent=True),
    RunConfig(name="Legalyze 2.0 without status/temporal", retrieval=True, sahi=True,
              bm25=True, semantic=True, status=False, temporal=False,
              jurisprudence=True, citation_verification=True, multi_agent=True),
    RunConfig(name="Full Legalyze 2.0", retrieval=True, sahi=True, bm25=True,
              semantic=True, status=True, temporal=True, jurisprudence=True,
              citation_verification=True, multi_agent=True),
]

# ---- §15 ablations (each removes one component from Full 2.0) -------------- #
def _full(**kw):
    base = dict(retrieval=True, sahi=True, bm25=True, semantic=True, status=True,
                temporal=True, jurisprudence=True, citation_verification=True,
                multi_agent=True)
    base.update(kw)
    return RunConfig(**base)


ABLATIONS = [
    _full(name="− hierarchical structure (no SAHI)", sahi=False),
    _full(name="− BM25 (semantic only)", bm25=False),
    _full(name="− semantic (BM25 only)", semantic=False),
    _full(name="− treaty-status metadata", status=False),
    _full(name="− temporal reasoning", temporal=False),
    _full(name="− jurisprudence retrieval", jurisprudence=False),
    _full(name="− citation verification", citation_verification=False),
    _full(name="single-agent orchestration", multi_agent=False),
]
