"""Corpus + status persistence (JSON) with typed accessors.

Holds instruments, provisions and the full treaty-status record set
(participation, reservations, declarations, objections) plus cases.
"""
from __future__ import annotations
import json
from dataclasses import asdict
from functools import lru_cache

from .. import config
from ..models import (Instrument, Provision, StateParticipation, Reservation,
                      Declaration, Objection, Case, Provenance)

INSTR_F = config.CORPUS / "instruments.json"
PROV_F = config.CORPUS / "provisions.json"
PART_F = config.STATUS / "participation.json"
RES_F = config.STATUS / "reservations.json"
DECL_F = config.STATUS / "declarations.json"
OBJ_F = config.STATUS / "objections.json"
CASE_F = config.CORPUS / "cases.json"


def _dump(path, rows):
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def _load(path):
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


# ---------------------------------------------------------------- writers ---- #
def save_corpus(instruments: list[Instrument], provisions: list[Provision]) -> None:
    _dump(INSTR_F, [asdict(i) for i in instruments])
    _dump(PROV_F, [asdict(p) for p in provisions])
    _clear_caches()


def save_cases(cases: list[Case]) -> None:
    _dump(CASE_F, [asdict(c) for c in cases])
    _clear_caches()


def save_status(participation=None, reservations=None, declarations=None, objections=None):
    if participation is not None:
        _dump(PART_F, [asdict(x) for x in participation])
    if reservations is not None:
        _dump(RES_F, [asdict(x) for x in reservations])
    if declarations is not None:
        _dump(DECL_F, [asdict(x) for x in declarations])
    if objections is not None:
        _dump(OBJ_F, [asdict(x) for x in objections])
    _clear_caches()


# ---------------------------------------------------------------- readers ---- #
def _prov_from(d) -> Provision:
    return Provision(**d)


@lru_cache(maxsize=1)
def all_provisions() -> list[Provision]:
    return [_prov_from(d) for d in _load(PROV_F)]


@lru_cache(maxsize=1)
def all_instruments() -> list[Instrument]:
    out = []
    for d in _load(INSTR_F):
        if isinstance(d.get("provenance"), dict):
            d["provenance"] = Provenance(**d["provenance"])
        out.append(Instrument(**d))
    return out


@lru_cache(maxsize=1)
def _prov_by_id() -> dict[str, Provision]:
    return {p.provision_id: p for p in all_provisions()}


def get_provision(pid: str) -> Provision | None:
    return _prov_by_id().get(pid)


def instrument(iid: str) -> Instrument | None:
    for i in all_instruments():
        if i.instrument_id == iid:
            return i
    return None


@lru_cache(maxsize=1)
def participation() -> list[StateParticipation]:
    return [StateParticipation(**d) for d in _load(PART_F)]


@lru_cache(maxsize=1)
def reservations() -> list[Reservation]:
    return [Reservation(**d) for d in _load(RES_F)]


@lru_cache(maxsize=1)
def declarations() -> list[Declaration]:
    return [Declaration(**d) for d in _load(DECL_F)]


@lru_cache(maxsize=1)
def objections() -> list[Objection]:
    return [Objection(**d) for d in _load(OBJ_F)]


@lru_cache(maxsize=1)
def cases() -> list[Case]:
    out = []
    for d in _load(CASE_F):
        if isinstance(d.get("provenance"), dict):
            d["provenance"] = Provenance(**d["provenance"])
        out.append(Case(**d))
    return out


def _clear_caches():
    for fn in (all_provisions, all_instruments, _prov_by_id, participation,
               reservations, declarations, objections, cases):
        fn.cache_clear()


def stats() -> dict:
    return {
        "instruments": len(all_instruments()),
        "provisions": len(all_provisions()),
        "participation_records": len(participation()),
        "reservations": len(reservations()),
        "declarations": len(declarations()),
        "objections": len(objections()),
        "cases": len(cases()),
    }
