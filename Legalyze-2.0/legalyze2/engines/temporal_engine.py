"""Temporal engine (Spec §9) — date extraction and date parsing.

Provides the date primitives used across the pipeline. The legal status-at-date
logic lives in `status_engine.status_as_of`, which this module feeds.
"""
from __future__ import annotations
import re
from datetime import date

_MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"], start=1)}

_TEMPORAL_WORDS = re.compile(
    r"\b(on|as of|at the time|when|historical|before|after|by\s+\d|prior to|"
    r"in\s+(19|20)\d{2}|during|since|until)\b", re.I)


def has_temporal_requirement(text: str) -> bool:
    """Spec §7 step 2 — does the question carry a date/historical-time need?"""
    return bool(extract_dates(text)) or bool(_TEMPORAL_WORDS.search(text))


def extract_dates(text: str) -> list[str]:
    """Return ISO dates (YYYY-MM-DD) and bare years (YYYY-01-01) found in text,
    in order of appearance. Bare years are normalised to Jan 1 of that year but
    flagged by callers as year-granularity."""
    out: list[str] = []
    # 1) "1 January 2010" / "January 1, 2010"
    for m in re.finditer(r"\b(\d{1,2})\s+([A-Za-z]+)\s+((?:19|20)\d{2})\b", text):
        d, mon, y = m.groups()
        if mon.lower() in _MONTHS:
            out.append(f"{int(y):04d}-{_MONTHS[mon.lower()]:02d}-{int(d):02d}")
    for m in re.finditer(r"\b([A-Za-z]+)\s+(\d{1,2}),?\s+((?:19|20)\d{2})\b", text):
        mon, d, y = m.groups()
        if mon.lower() in _MONTHS:
            iso = f"{int(y):04d}-{_MONTHS[mon.lower()]:02d}-{int(d):02d}"
            if iso not in out:
                out.append(iso)
    # 2) ISO dates
    for m in re.finditer(r"\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b", text):
        out.append(f"{m.group(1)}-{m.group(2)}-{m.group(3)}")
    # 3) bare years (only if no fuller date already captured)
    if not out:
        for m in re.finditer(r"\b((?:19|20)\d{2})\b", text):
            out.append(f"{m.group(1)}-01-01")
    # de-dupe preserving order
    seen, uniq = set(), []
    for d in out:
        if d not in seen:
            seen.add(d); uniq.append(d)
    return uniq


def requested_date(text: str) -> str | None:
    ds = extract_dates(text)
    return ds[0] if ds else None


def parse(iso: str | None) -> date | None:
    if not iso:
        return None
    try:
        y, m, d = iso.split("-")
        return date(int(y), int(m), int(d))
    except Exception:
        return None


def le(a: str | None, b: str | None) -> bool:
    """a <= b for ISO date strings; None-safe (unknown dates never satisfy)."""
    pa, pb = parse(a), parse(b)
    return bool(pa and pb and pa <= pb)


def later(a: str | None, b: str | None) -> str | None:
    pa, pb = parse(a), parse(b)
    if pa and pb:
        return a if pa >= pb else b
    return a or b
