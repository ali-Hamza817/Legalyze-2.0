"""Lexical index — in-house BM25 (Okapi) over provisions (Spec §7 step 5).

No external dependency; deterministic and offline. Indexes exact text plus the
structural path and heading so that article/paragraph references match well.
"""
from __future__ import annotations
import json
import math
import re
from collections import Counter

from .. import config
from . import corpus_store

IDX_F = config.INDEX / "bm25.json"
_STOP = set("a an the of to in on for and or by with as at is are be this that "
            "which shall may not no than from its it their his her which who whom "
            "such any all each other into upon".split())


def _tok(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in _STOP and len(t) > 1]


def _doc_text(p) -> str:
    return f"{p.structural_path} {p.heading} {p.exact_text}"


def build() -> dict:
    provs = corpus_store.all_provisions()
    docs = []
    df = Counter()
    for p in provs:
        toks = _tok(_doc_text(p))
        docs.append({"id": p.provision_id, "len": len(toks), "tf": dict(Counter(toks))})
        for term in set(toks):
            df[term] += 1
    N = len(docs)
    avgdl = sum(d["len"] for d in docs) / N if N else 0.0
    idf = {t: math.log(1 + (N - n + 0.5) / (n + 0.5)) for t, n in df.items()}
    model = {"N": N, "avgdl": avgdl, "idf": idf, "docs": docs}
    IDX_F.write_text(json.dumps(model), encoding="utf-8")
    return {"documents": N, "vocab": len(idf), "avgdl": round(avgdl, 1)}


class BM25:
    def __init__(self):
        self.m = json.loads(IDX_F.read_text(encoding="utf-8"))

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float]]:
        q = _tok(query)
        idf, avgdl = self.m["idf"], self.m["avgdl"]
        k1, b = config.BM25_K1, config.BM25_B
        scored = []
        for d in self.m["docs"]:
            s = 0.0
            dl = d["len"] or 1
            tf = d["tf"]
            for term in q:
                if term not in tf:
                    continue
                f = tf[term]
                s += idf.get(term, 0.0) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl))
            if s > 0:
                scored.append((d["id"], s))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


def exists() -> bool:
    return IDX_F.exists()
