"""Mandatory data model (Spec §5) plus the retrieval/answer value objects.

Every entity preserves authoritative provenance. Dates are ISO-8601 strings
(YYYY-MM-DD) or None; parsing/ordering is done by the temporal engine.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional


# --------------------------------------------------------------------------- #
#  Provenance — attached to every authoritative record (Spec §4 corpus rule)   #
# --------------------------------------------------------------------------- #
@dataclass
class Provenance:
    source_url: str
    retrieved_at: str                       # ISO timestamp of acquisition
    document_id: str = ""                   # official identifier where available
    institution: str = ""                   # issuing / depositary body
    sha256: str = ""                        # hash of the raw source
    note: str = ""


# --------------------------------------------------------------------------- #
#  Core legal entities (Spec §5)                                              #
# --------------------------------------------------------------------------- #
@dataclass
class Instrument:
    instrument_id: str
    title: str
    instrument_type: str                    # treaty | statute | charter | convention | case | un_document
    issuing_body: str
    adoption_date: Optional[str] = None
    entry_into_force_date: Optional[str] = None
    source_url: str = ""
    provenance: Optional[Provenance] = None


@dataclass
class Provision:
    provision_id: str                       # e.g. UN_CHARTER::art-2::para-4
    instrument_id: str
    structural_path: str                    # SAHI 2.0 breadcrumb (human readable)
    part: Optional[str] = None
    chapter: Optional[str] = None
    article: Optional[str] = None
    paragraph: Optional[str] = None
    annex: Optional[str] = None
    heading: str = ""
    exact_text: str = ""
    source_location: str = ""               # URL (+ fragment/page) of the exact text
    neighbors: list[str] = field(default_factory=list)   # adjacent provision_ids
    version_status: str = "in force"        # document version / status metadata


# ---- treaty participation & modifications (Spec §5) ----
@dataclass
class StateParticipation:
    instrument_id: str
    state: str
    action_type: str                        # signature|ratification|accession|approval|acceptance|succession|withdrawal|entry_into_force
    action_date: Optional[str] = None       # date the event occurred
    effective_date: Optional[str] = None    # date the legal effect began (may differ)
    source_record: str = ""
    verified: bool = False                   # True only after reviewer verification


@dataclass
class Reservation:
    instrument_id: str
    state: str
    reservation_text: str
    date: Optional[str] = None
    source_record: str = ""
    verified: bool = False


@dataclass
class Declaration:
    instrument_id: str
    state: str
    declaration_text: str
    date: Optional[str] = None
    source_record: str = ""
    verified: bool = False


@dataclass
class Objection:
    instrument_id: str
    state: str
    objection_text: str
    date: Optional[str] = None
    source_record: str = ""
    verified: bool = False


@dataclass
class Case:
    case_id: str
    title: str
    court: str
    date: Optional[str] = None
    case_number: str = ""
    instrument_links: list[str] = field(default_factory=list)
    summary: str = ""
    source_url: str = ""
    provenance: Optional[Provenance] = None


@dataclass
class UNDocument:
    document_id: str
    title: str
    date: Optional[str]
    document_type: str
    body: str
    source_url: str = ""
    provenance: Optional[Provenance] = None


# --------------------------------------------------------------------------- #
#  Retrieval / answer value objects                                           #
# --------------------------------------------------------------------------- #
@dataclass
class RetrievedChunk:
    provision_id: str
    instrument_id: str
    structural_path: str
    text: str
    source_location: str
    score: float = 0.0
    source_stream: str = ""                 # lexical | semantic | fused


@dataclass
class Citation:
    claim: str
    provision_id: str
    source_location: str
    quote: str
    supported: bool = False
    reason: str = ""


@dataclass
class Answer:
    conclusion: str
    legal_basis: list[str] = field(default_factory=list)
    applicability: str = ""
    interpretation: str = ""
    citations: list[Citation] = field(default_factory=list)
    uncertainty: str = ""
    evidence_chunks: list[RetrievedChunk] = field(default_factory=list)

    def to_dict(self):
        return asdict(self)


def to_dict(obj) -> dict:
    return asdict(obj)
