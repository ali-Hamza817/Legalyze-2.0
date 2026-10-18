"""Vector index — dense semantic retrieval (Spec §7 step 6).

Embeds every provision (OpenAI text-embedding-3-small when a key is present,
deterministic offline embedding otherwise) and stores a local matrix for exact
cosine search. No external vector DB required.
"""
from __future__ import annotations
import json
import numpy as np

from .. import config, llm
from . import corpus_store

VEC_F = config.INDEX / "vectors.npy"
IDS_F = config.INDEX / "vector_ids.json"


def _doc_text(p) -> str:
    return f"{p.structural_path}\n{p.exact_text}"


def build(batch: int = 96) -> dict:
    provs = corpus_store.all_provisions()
    ids, mat = [], []
    for i in range(0, len(provs), batch):
        chunk = provs[i:i + batch]
        vecs = llm.embed([_doc_text(p) for p in chunk])
        for p, v in zip(chunk, vecs):
            ids.append(p.provision_id)
            mat.append(v)
    arr = np.asarray(mat, dtype=np.float32)
    # L2-normalise rows so cosine == dot product
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    arr = arr / norms
    np.save(VEC_F, arr)
    IDS_F.write_text(json.dumps(ids), encoding="utf-8")
    return {"vectors": len(ids), "dim": arr.shape[1] if len(ids) else 0,
            "backend": "openai" if config.has_openai() else "offline-hash"}


class VectorIndex:
    def __init__(self):
        self.mat = np.load(VEC_F)
        self.ids = json.loads(IDS_F.read_text(encoding="utf-8"))

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float]]:
        q = np.asarray(llm.embed_one(query), dtype=np.float32)
        n = np.linalg.norm(q)
        if n:
            q = q / n
        sims = self.mat @ q
        order = np.argsort(-sims)[:top_k]
        return [(self.ids[i], float(sims[i])) for i in order]


def exists() -> bool:
    return VEC_F.exists() and IDS_F.exists()
