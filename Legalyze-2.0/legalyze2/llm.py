"""LLM + embedding access.

Uses OpenAI (via plain HTTP, no SDK dependency) when an API key is present.
Falls back to a deterministic, offline embedding/generation path so the whole
system is runnable and testable without network or spend. The fallback never
invents legal facts — generation in offline mode is extractive only.
"""
from __future__ import annotations
import hashlib
import json
import re
import numpy as np
import sys
import requests

from . import config


# --------------------------------------------------------------------------- #
#  Embeddings                                                                  #
# --------------------------------------------------------------------------- #
def _hash_embed(text: str, dim: int = config.EMBED_DIM) -> list[float]:
    """Deterministic offline embedding: hashed token bag projected to `dim`.
    Good enough to make semantic retrieval *function* offline; the real
    text-embedding-3-small model is used automatically when a key is present.
    """
    vec = np.zeros(dim, dtype=np.float64)
    toks = re.findall(r"[a-z0-9]+", text.lower())
    for tok in toks:
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % dim] += 1.0
        vec[(h // dim) % dim] += 0.5        # a second bucket reduces collisions
    n = np.linalg.norm(vec)
    return (vec / n).tolist() if n else vec.tolist()


def embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if config.has_openai():
        try:
            r = requests.post(
                f"{config.OPENAI_BASE}/embeddings",
                headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
                json={"model": config.EMBED_MODEL, "input": texts,
                      "dimensions": config.EMBED_DIM},
                timeout=60,
            )
            r.raise_for_status()
            data = sorted(r.json()["data"], key=lambda d: d["index"])
            return [d["embedding"] for d in data]
        except Exception as e:                # graceful degradation
            print(f"[llm] embedding API failed ({e}); using offline fallback", file=sys.stderr)
    return [_hash_embed(t) for t in texts]


def embed_one(text: str) -> list[float]:
    return embed([text])[0]


# --------------------------------------------------------------------------- #
#  Chat / generation                                                          #
# --------------------------------------------------------------------------- #
def chat(system: str, user: str, *, json_mode: bool = False,
         temperature: float = 0.0, max_tokens: int = 900) -> str:
    if config.has_openai():
        try:
            payload = {
                "model": config.GEN_MODEL,
                "messages": [{"role": "system", "content": system},
                             {"role": "user", "content": user}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}
            r = requests.post(
                f"{config.OPENAI_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
                json=payload, timeout=90,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[llm] chat API failed ({e}); using offline fallback", file=sys.stderr)
    return _offline_chat(system, user, json_mode)


def chat_json(system: str, user: str, **kw) -> dict:
    raw = chat(system, user, json_mode=True, **kw)
    try:
        return json.loads(raw)
    except Exception:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return {}


def _offline_chat(system: str, user: str, json_mode: bool) -> str:  # noqa: ARG001
    """Deterministic, non-inventing fallback.

    For JSON asks it returns an empty object so callers apply their own
    rule-based defaults. For prose it returns an extractive stitch of the
    supplied evidence block (never adds facts of its own).
    """
    if json_mode:
        return "{}"
    # For prose we return empty so callers fall back to their own deterministic,
    # extractive path (which never invents facts) rather than a generic stitch.
    return ""


# --------------------------------------------------------------------------- #
#  Cosine helpers                                                             #
# --------------------------------------------------------------------------- #
def cosine(a: list[float], b: list[float]) -> float:
    va, vb = np.asarray(a), np.asarray(b)
    na, nb = np.linalg.norm(va), np.linalg.norm(vb)
    return float(va.dot(vb) / (na * nb)) if na and nb else 0.0
