"""Treaty-status engine (Spec §5, §9) — participation and date-aware status.

Answers "what was the legal status of <state> with respect to <instrument> on
<date>?" strictly from recorded participation events, never from today's status
alone, and never conflating signature with ratification or entry into force.

If the corpus holds no participation record for the pair, the engine returns
status = "unknown" so the answer layer can emit NOT_ESTABLISHED.
"""
from __future__ import annotations
from dataclasses import dataclass

from . import temporal_engine as T
from ..store import corpus_store

# consent-to-be-bound events (make a state a *party*, subject to entry into force)
_CONSENT = {"ratification", "accession", "approval", "acceptance", "succession"}


@dataclass
class StatusResult:
    instrument_id: str
    state: str
    as_of: str | None
    status: str                 # party | signatory_only | not_yet_in_force | withdrawn | not_a_party | unknown
    bound: bool | None          # True/False, or None when unknown
    effective_date: str | None  # date the binding effect began (if a party)
    basis_events: list[dict]    # the participation events relied on (with sources)
    explanation: str
    reservations: list[dict]
    declarations: list[dict]
    objections: list[dict]


def _norm_state(s: str) -> str:
    return (s or "").strip().lower()


def participation_for(instrument_id: str, state: str):
    ns = _norm_state(state)
    return [p for p in corpus_store.participation()
            if p.instrument_id == instrument_id and _norm_state(p.state) == ns]


def _mods(instrument_id: str, state: str):
    ns = _norm_state(state)
    res = [r for r in corpus_store.reservations()
           if r.instrument_id == instrument_id and _norm_state(r.state) == ns]
    dec = [d for d in corpus_store.declarations()
           if d.instrument_id == instrument_id and _norm_state(d.state) == ns]
    obj = [o for o in corpus_store.objections()
           if o.instrument_id == instrument_id and _norm_state(o.state) == ns]
    return res, dec, obj


def status_as_of(instrument_id: str, state: str, as_of: str | None) -> StatusResult:
    inst = corpus_store.instrument(instrument_id)
    treaty_eif = inst.entry_into_force_date if inst else None
    events = participation_for(instrument_id, state)

    def _ev(e):
        return {"action_type": e.action_type, "action_date": e.action_date,
                "effective_date": e.effective_date, "source_record": e.source_record,
                "verified": e.verified}

    res, dec, obj = _mods(instrument_id, state)
    res_d = [{"text": r.reservation_text, "date": r.date, "source": r.source_record} for r in res]
    dec_d = [{"text": d.declaration_text, "date": d.date, "source": d.source_record} for d in dec]
    obj_d = [{"text": o.objection_text, "date": o.date, "source": o.source_record} for o in obj]

    if not events:
        return StatusResult(instrument_id, state, as_of, "unknown", None, None, [],
                            "No participation record for this state and instrument is indexed.",
                            res_d, dec_d, obj_d)

    # withdrawal effective on/before the requested date ends party status
    withdrawal = next((e for e in events if e.action_type == "withdrawal"
                       and (as_of is None or T.le(e.effective_date or e.action_date, as_of))), None)

    consent = next((e for e in events if e.action_type in _CONSENT), None)
    signature = next((e for e in events if e.action_type == "signature"), None)

    if consent:
        # a state is bound from the LATER of its own effective date and treaty EIF
        state_eff = consent.effective_date or consent.action_date
        effective = T.later(state_eff, treaty_eif)
        if withdrawal:
            return StatusResult(instrument_id, state, as_of, "withdrawn", False, effective,
                                [_ev(consent), _ev(withdrawal)],
                                f"{state} had consented to be bound (effective {effective}) but "
                                f"withdrew, effective {withdrawal.effective_date or withdrawal.action_date}.",
                                res_d, dec_d, obj_d)
        if as_of is None or T.le(effective, as_of):
            return StatusResult(instrument_id, state, as_of, "party", True, effective,
                                [_ev(consent)],
                                f"{state} became a party effective {effective} "
                                f"(by {consent.action_type} on {consent.action_date}).",
                                res_d, dec_d, obj_d)
        return StatusResult(instrument_id, state, as_of, "not_yet_in_force", False, effective,
                            [_ev(consent)],
                            f"{state} expressed consent by {consent.action_type} on "
                            f"{consent.action_date}, but the treaty was not in force for it "
                            f"until {effective} — after the requested date {as_of}.",
                            res_d, dec_d, obj_d)

    if signature:
        return StatusResult(instrument_id, state, as_of, "signatory_only", False, None,
                            [_ev(signature)],
                            f"{state} had only signed (on {signature.action_date}); signature "
                            f"does not make a state a party and is not ratification or entry "
                            f"into force.", res_d, dec_d, obj_d)

    return StatusResult(instrument_id, state, as_of, "not_a_party", False, None,
                        [_ev(e) for e in events],
                        "No consent-to-be-bound or signature event applies as of the requested date.",
                        res_d, dec_d, obj_d)
