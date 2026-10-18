"""Phase 4 — build lexical (BM25) and semantic (vector) indices.

    python scripts/build_index.py
"""
import _bootstrap  # noqa: F401
from legalyze2 import config
from legalyze2.store import lexical_index, vector_index


def main():
    print("Building BM25 lexical index ...")
    print("  ", lexical_index.build())
    print(f"Building vector index (backend: {'openai' if config.has_openai() else 'offline-hash'}) ...")
    print("  ", vector_index.build())
    print("Indices ready.")


if __name__ == "__main__":
    main()
