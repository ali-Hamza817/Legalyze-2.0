"""Evaluation metrics (Spec §14).

All metrics are computed automatically against the benchmark's expected fields.
Answer accuracy is keyword/polarity based (deterministic conclusions), which is
appropriate for the offline research harness; a human-graded pass can replace it.
"""
from __future__ import annotations
from legalyze2 import config
from legalyze2.models import Answer


def _text(ans: Answer) -> str:
    return " ".join([ans.conclusion or "", ans.applicability or "",
                     ans.interpretation or ""]).lower()


def _polarity(conclusion: str) -> str | None:
    c = conclusion.strip().lower()
    if c.startswith("yes"):
        return "yes"
    if c.startswith("no"):
        return "no"
    return None


def score_item(item: dict, ans: Answer) -> dict:
    exp = item.get("expect", {})
    text = _text(ans)
    is_ne = config.NOT_ESTABLISHED.lower() in (ans.conclusion or "").lower()

    ev_ids = [c.provision_id for c in ans.evidence_chunks]
    cite_ids = [c.provision_id for c in ans.citations]
    all_ids = ev_ids + cite_ids

    # ---- retrieval recall@k / structural accuracy ----
    want_pid = exp.get("provision_id")
    retrieval_recall = None
    structural_acc = None
    if want_pid:
        retrieval_recall = want_pid in all_ids
        structural_acc = bool(ev_ids and ev_ids[0] == want_pid)

    # ---- answer accuracy ----
    ok = True
    if "polarity" in exp:
        ok = ok and (_polarity(ans.conclusion) == exp["polarity"])
    if exp.get("keywords"):
        hits = sum(1 for kw in exp["keywords"] if kw.lower() in text)
        ok = ok and (hits >= max(1, len(exp["keywords"]) // 2))
    if exp.get("instrument_id"):
        ok = ok and any(exp["instrument_id"] in cid for cid in all_ids) \
            or (exp["instrument_id"].lower().replace("_", " ") in text)
    if is_ne:                       # NOT_ESTABLISHED is never counted correct
        ok = False
    answer_accuracy = bool(ok)

    # ---- hallucination: asserted content with no supported citation ----
    supported = [c for c in ans.citations if c.supported]
    asserts = not is_ne and bool((ans.conclusion or "").strip())
    hallucinated = bool(asserts and not supported)

    # ---- citation precision / recall ----
    total_c = len(ans.citations)
    cp = (len(supported) / total_c) if total_c else None
    cr = 1.0 if supported else (0.0 if asserts else None)

    # ---- temporal accuracy ----
    temporal_acc = None
    if item.get("relevant_date") and "polarity" in exp:
        pol_ok = _polarity(ans.conclusion) == exp["polarity"]
        eff = exp.get("temporal_effective")
        eff_ok = (eff in (ans.conclusion or "")) if eff else True
        temporal_acc = bool(pol_ok and eff_ok)

    # ---- applicability accuracy ----
    applicability_acc = None
    if item.get("applicable_state"):
        applicability_acc = bool(ans.applicability) and \
            (_polarity(ans.conclusion) == exp.get("polarity", _polarity(ans.conclusion)))

    return {
        "answer_accuracy": answer_accuracy,
        "hallucinated": hallucinated,
        "citation_precision": cp,
        "citation_recall": cr,
        "retrieval_recall_at_k": retrieval_recall,
        "structural_retrieval_accuracy": structural_acc,
        "temporal_accuracy": temporal_acc,
        "applicability_accuracy": applicability_acc,
    }


def aggregate(rows: list[dict]) -> dict:
    keys = ["answer_accuracy", "hallucinated", "citation_precision", "citation_recall",
            "retrieval_recall_at_k", "structural_retrieval_accuracy",
            "temporal_accuracy", "applicability_accuracy"]
    out = {}
    for k in keys:
        vals = [float(r[k]) for r in rows if r.get(k) is not None]
        out[k] = round(sum(vals) / len(vals), 3) if vals else None
    out["n"] = len(rows)
    return out
