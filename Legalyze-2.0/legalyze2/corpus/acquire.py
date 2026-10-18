"""Source Acquisition Layer (Spec §17.1).

Fetches authoritative P0 sources from official UN/ICJ endpoints, preserving
provenance: source URL, retrieval timestamp, and a SHA-256 of the raw bytes.
Never fabricates or rewrites source text.
"""
from __future__ import annotations
import hashlib
from datetime import datetime, timezone
from pathlib import Path
import requests

from .. import config
from ..models import Provenance

# Fixed P0 sources (Spec §4).
SOURCES = {
    "un_charter": {
        "url": "https://www.un.org/en/about-us/un-charter/full-text",
        "file": "un_charter.html", "institution": "United Nations",
        "document_id": "UN Charter (1945)",
    },
    "icj_statute": {
        "url": "https://www.icj-cij.org/statute",
        "file": "icj_statute.html", "institution": "International Court of Justice",
        "document_id": "Statute of the ICJ (1945)",
    },
    "vclt_1969": {
        "url": "https://legal.un.org/ilc/texts/instruments/english/conventions/1_1_1969.pdf",
        "file": "vclt_1969.pdf", "institution": "United Nations (ILC / depositary)",
        "document_id": "VCLT (1969), 1155 UNTS 331",
    },
}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch(key: str, force: bool = False) -> Provenance:
    src = SOURCES[key]
    dest = config.RAW / src["file"]
    if force or not dest.exists() or dest.stat().st_size == 0:
        r = requests.get(src["url"], headers={"User-Agent": config.USER_AGENT},
                         timeout=45, allow_redirects=True)
        r.raise_for_status()
        dest.write_bytes(r.content)
    raw = dest.read_bytes()
    prov = Provenance(
        source_url=src["url"], retrieved_at=_now(),
        document_id=src["document_id"], institution=src["institution"],
        sha256=hashlib.sha256(raw).hexdigest(),
        note=f"Authoritative source; {len(raw)} bytes; local copy {dest.name}",
    )
    return prov


def fetch_all(force: bool = False) -> dict[str, Provenance]:
    return {k: fetch(k, force=force) for k in SOURCES}


def raw_path(key: str) -> Path:
    return config.RAW / SOURCES[key]["file"]
