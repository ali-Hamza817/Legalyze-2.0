"""Central configuration and paths for Legalyze 2.0."""
from __future__ import annotations
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    # Reuse the Legalyze 1.0 backend .env for the OpenAI key if present.
    _here = Path(__file__).resolve()
    for cand in (_here.parents[2] / "backend" / ".env", _here.parents[1] / ".env"):
        if cand.exists():
            load_dotenv(cand, override=False)
except Exception:
    pass

ROOT = Path(__file__).resolve().parents[1]          # .../Legalyze-2.0
DATA = ROOT / "data"
RAW = DATA / "raw"
CORPUS = DATA / "corpus"
STATUS = DATA / "status"
BENCHMARK = DATA / "benchmark"
INDEX = DATA / "index"
for _d in (RAW, CORPUS, STATUS, BENCHMARK, INDEX):
    _d.mkdir(parents=True, exist_ok=True)

# ---- models (used only when a key is available; otherwise offline fallback) ----
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENAI_BASE = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
GEN_MODEL = os.environ.get("L2_GEN_MODEL", "gpt-4o-mini")
EMBED_MODEL = os.environ.get("L2_EMBED_MODEL", "text-embedding-3-small")
EMBED_DIM = int(os.environ.get("L2_EMBED_DIM", "1024"))

def has_openai() -> bool:
    return OPENAI_API_KEY.startswith("sk-")

# ---- retrieval knobs (fixed defaults from the spec) ----
RRF_K = 60                # Reciprocal Rank Fusion smoothing constant
TOP_K = 8                 # provisions passed to synthesis
BM25_K1 = 1.5
BM25_B = 0.75

USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120 Safari/537.36")

# Sentinel string the system must emit when the corpus cannot establish a fact.
NOT_ESTABLISHED = "The indexed authoritative sources do not establish this fact."
