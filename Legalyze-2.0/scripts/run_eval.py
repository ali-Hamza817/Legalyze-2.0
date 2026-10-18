"""Phase 10-11 — run all baselines and ablations over the fixed benchmark and
report metrics. Does NOT change the evaluation protocol.

    python scripts/run_eval.py

NOTE: with the offline fallback (no LLM/embedding quota) and the illustrative
status seed, these numbers characterise the *harness*, not a validated result.
Populate real UN Treaty Collection data and a reviewer-graded benchmark, and run
with a working embedding/LLM key, before reporting research findings.
"""
import _bootstrap  # noqa: F401
import json
from legalyze2 import config
from legalyze2.agents.orchestrator import Orchestrator
from eval import systems, metrics


def load_benchmark():
    items = []
    with open(config.BENCHMARK / "benchmark.jsonl", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


def run_configs(configs, items):
    results = {}
    for cfg in configs:
        orch = Orchestrator(cfg)
        rows = []
        for it in items:
            ans = orch.run(it["question"])
            rows.append(metrics.score_item(it, ans))
        results[cfg.name] = metrics.aggregate(rows)
    return results


def _fmt(v):
    return "  -  " if v is None else f"{v:>5.2f}"


def _table(title, results):
    cols = ["answer_accuracy", "hallucinated", "citation_precision", "citation_recall",
            "retrieval_recall_at_k", "structural_retrieval_accuracy",
            "temporal_accuracy", "applicability_accuracy"]
    short = ["Acc", "Halluc", "CitP", "CitR", "R@k", "Struct", "Temp", "Applic"]
    print("\n" + "=" * 118)
    print(title)
    print("=" * 118)
    print(f"{'System':38}" + "".join(f"{s:>9}" for s in short))
    print("-" * 118)
    for name, agg in results.items():
        print(f"{name:38}" + "".join(f"{_fmt(agg[c]):>9}" for c in cols))


def main():
    items = load_benchmark()
    print(f"Benchmark items: {len(items)} | LLM/embeddings: "
          f"{'openai' if config.has_openai() else 'offline'} "
          f"(fallback active if quota exhausted)")
    sys_res = run_configs(systems.SYSTEMS, items)
    abl_res = run_configs(systems.ABLATIONS, items)
    _table("SYSTEMS UNDER COMPARISON (Spec §13)   [Halluc lower = better]", sys_res)
    _table("ABLATIONS — each removes one component from Full Legalyze 2.0 (Spec §15)", abl_res)
    out = {"systems": sys_res, "ablations": abl_res, "n_items": len(items)}
    (config.DATA / "eval_results.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"\nSaved: {config.DATA / 'eval_results.json'}")


if __name__ == "__main__":
    main()
