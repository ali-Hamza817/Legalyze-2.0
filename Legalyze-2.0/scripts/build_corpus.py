"""Phase 1-3 — acquire the P0 corpus, parse with SAHI 2.0, persist.

    python scripts/build_corpus.py
"""
import _bootstrap  # noqa: F401
from legalyze2.corpus import acquire, sahi
from legalyze2.store import corpus_store


def main(force: bool = False):
    print("Phase 1 — acquiring authoritative P0 sources ...")
    prov = acquire.fetch_all(force=force)
    for k, p in prov.items():
        print(f"  {k:12} {p.document_id:32} sha256={p.sha256[:12]}…")

    print("Phase 2/3 — parsing with SAHI 2.0 ...")
    instruments, provisions = [], []
    for key, parser in sahi.PARSERS.items():
        inst, provs = parser(prov[key])
        instruments.append(inst)
        provisions.extend(provs)
        arts = len({p.article for p in provs})
        print(f"  {inst.instrument_id:12} {len(provs):4} provisions / {arts} articles")

    corpus_store.save_corpus(instruments, provisions)
    print("\nCorpus stored. Store stats:")
    for k, v in corpus_store.stats().items():
        print(f"  {k:22} {v}")


if __name__ == "__main__":
    import sys
    main(force="--force" in sys.argv)
