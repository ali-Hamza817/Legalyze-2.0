"""Fixed answer format (Spec §10) and its text renderer.

    Conclusion → Legal basis → Applicability/status → Interpretation →
    Evidence (citations) → Uncertainty
"""
from __future__ import annotations
from .models import Answer


def render(ans: Answer) -> str:
    L = []
    L.append("CONCLUSION")
    L.append("  " + (ans.conclusion or "").strip())
    L.append("")
    if ans.legal_basis:
        L.append("LEGAL BASIS")
        for b in ans.legal_basis:
            L.append("  • " + b)
        L.append("")
    if ans.applicability:
        L.append("APPLICABILITY / STATUS")
        L.append("  " + ans.applicability.strip())
        L.append("")
    if ans.interpretation:
        L.append("INTERPRETATION")
        L.append("  " + ans.interpretation.strip())
        L.append("")
    if ans.citations:
        L.append("EVIDENCE")
        for c in ans.citations:
            mark = "✓" if c.supported else "✗"
            L.append(f"  [{mark}] {c.claim}")
            L.append(f"       source: {c.source_location}  ({c.provision_id})")
            if c.quote:
                L.append(f"       “{c.quote.strip()[:200]}”")
        L.append("")
    L.append("UNCERTAINTY")
    L.append("  " + (ans.uncertainty.strip() if ans.uncertainty else "None noted."))
    return "\n".join(L)
