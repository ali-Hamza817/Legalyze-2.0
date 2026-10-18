"""Reciprocal Rank Fusion (Spec §7 step 7).

RRF(d) = sum_L 1 / (k + rank_L(d)),  k = 60 (config.RRF_K).

Combines any number of ranked id-lists into one fused ranking. A document that
appears in several streams accumulates score and is promoted.
"""
from __future__ import annotations
from .. import config


def fuse(*ranked_lists: list[tuple[str, float]], k: int | None = None
         ) -> list[tuple[str, float]]:
    k = config.RRF_K if k is None else k
    scores: dict[str, float] = {}
    for lst in ranked_lists:
        for rank, (doc_id, _score) in enumerate(lst, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
