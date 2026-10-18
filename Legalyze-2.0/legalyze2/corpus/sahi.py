"""SAHI 2.0 — Structure-Aware Hierarchical Indexing, generalized (Spec §6).

Turns authoritative source text into `Provision` chunks that each carry a
deterministic structural path:

    Instrument -> Part/Chapter -> Article -> Paragraph/Subparagraph -> Annex

Rules honoured:
  * every provision keeps its exact text, structural path, instrument id,
    provision id, neighbours and source location;
  * no chunk ever loses article or paragraph identity;
  * parsing is deterministic (regex / DOM over official formatting), no LLM.
"""
from __future__ import annotations
import re
from bs4 import BeautifulSoup
from pypdf import PdfReader

from ..models import Instrument, Provision, Provenance
from . import acquire

_PARA = re.compile(r"(?m)^\s*(\d+)\.\s+")

_PUNCT = {
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", "−": "-", " ": " ",
    " ": " ", " ": " ", " ": " ", "ﬁ": "fi", "ﬂ": "fl",
}


def _norm(s: str) -> str:
    for k, v in _PUNCT.items():
        s = s.replace(k, v)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def _link_neighbors(provs: list[Provision]) -> None:
    for i, p in enumerate(provs):
        nb = []
        if i > 0:
            nb.append(provs[i - 1].provision_id)
        if i + 1 < len(provs):
            nb.append(provs[i + 1].provision_id)
        p.neighbors = nb


def _emit(provs, inst, article, heading, para, text, *, part, chapter, crumb, src):
    text = _norm(text)
    if not text:
        return
    pid = f"{inst.instrument_id}::art-{article}" + (f"::para-{para}" if para else "")
    path = crumb + f" › Article {article}"
    if heading:
        path += f": {heading}"
    if para:
        path += f" › ¶{para}"
    provs.append(Provision(
        provision_id=pid, instrument_id=inst.instrument_id, structural_path=path,
        part=part, chapter=chapter, article=article, paragraph=para,
        heading=heading, exact_text=text, source_location=src))


def _emit_article(provs, inst, article, heading, body, *, part, chapter, crumb, src):
    """Paragraph-split an article body; always retains article identity."""
    body = body.strip()
    marks = list(_PARA.finditer(body))
    if len(marks) >= 2:
        chapeau = body[:marks[0].start()].strip()
        if chapeau:
            _emit(provs, inst, article, heading, None, chapeau,
                  part=part, chapter=chapter, crumb=crumb, src=src)
        for i, m in enumerate(marks):
            end = marks[i + 1].start() if i + 1 < len(marks) else len(body)
            _emit(provs, inst, article, heading, m.group(1), body[m.end():end],
                  part=part, chapter=chapter, crumb=crumb, src=src)
    else:
        _emit(provs, inst, article, heading, None, body,
              part=part, chapter=chapter, crumb=crumb, src=src)


# --------------------------------------------------------------------------- #
#  UN Charter (HTML, DOM-based to recover <ol> paragraph numbering)           #
# --------------------------------------------------------------------------- #
def parse_un_charter(prov: Provenance) -> tuple[Instrument, list[Provision]]:
    soup = BeautifulSoup(open(acquire.raw_path("un_charter"), encoding="utf-8",
                              errors="ignore").read(), "html.parser")
    inst = Instrument(
        instrument_id="UN_CHARTER", title="Charter of the United Nations",
        instrument_type="charter", issuing_body="United Nations",
        adoption_date="1945-06-26", entry_into_force_date="1945-10-24",
        source_url=prov.source_url, provenance=prov)
    provs: list[Provision] = []
    chapter = None
    # headings: h2 = chapter, h3 = article
    heads = soup.find_all(["h2", "h3"])
    ch_re = re.compile(r"Chapter\s+([IVXLC]+):\s*(.+)", re.I)
    art_re = re.compile(r"Article\s+(\d+)\s*$")
    for h in heads:
        txt = h.get_text(" ", strip=True)
        mc = ch_re.match(txt)
        ma = art_re.match(txt)
        if mc and h.name == "h2":
            chapter = f"{mc.group(1)}: {mc.group(2).strip()}"
            continue
        if ma and h.name == "h3":
            article = ma.group(1)
            crumb = inst.title + (f" › Chapter {chapter}" if chapter else "")
            # collect siblings until next h2/h3
            para = 0
            wrote_chapeau = False
            sib = h.find_next_sibling()
            while sib and sib.name not in ("h2", "h3"):
                if sib.name == "p":
                    t = sib.get_text(" ", strip=True)
                    if t:
                        # a lead <p> before any list is the chapeau (unnumbered)
                        _emit(provs, inst, article, "", None if not wrote_chapeau else None,
                              t, part=None, chapter=chapter, crumb=crumb, src=prov.source_url)
                        wrote_chapeau = True
                elif sib.name == "ol":
                    for li in sib.find_all("li", recursive=False):
                        para += 1
                        _emit(provs, inst, article, "", str(para),
                              li.get_text(" ", strip=True),
                              part=None, chapter=chapter, crumb=crumb, src=prov.source_url)
                elif sib.name == "ul":
                    for li in sib.find_all("li", recursive=False):
                        _emit(provs, inst, article, "", None,
                              li.get_text(" ", strip=True),
                              part=None, chapter=chapter, crumb=crumb, src=prov.source_url)
                sib = sib.find_next_sibling()
    _link_neighbors(provs)
    return inst, provs


# --------------------------------------------------------------------------- #
#  Statute of the ICJ (HTML, line-based with ToC skip)                        #
# --------------------------------------------------------------------------- #
def _clean_lines(path) -> list[str]:
    soup = BeautifulSoup(open(path, encoding="utf-8", errors="ignore").read(),
                         "html.parser")
    for t in soup(["script", "style", "nav", "header", "footer", "form", "aside"]):
        t.extract()
    return [_norm(ln) for ln in soup.get_text("\n").splitlines() if ln.strip()]


def parse_icj_statute(prov: Provenance) -> tuple[Instrument, list[Provision]]:
    lines = _clean_lines(acquire.raw_path("icj_statute"))
    inst = Instrument(
        instrument_id="ICJ_STATUTE",
        title="Statute of the International Court of Justice",
        instrument_type="statute", issuing_body="International Court of Justice",
        adoption_date="1945-06-26", entry_into_force_date="1945-10-24",
        source_url=prov.source_url, provenance=prov)
    # start after the Table of Contents at the first standalone "Article 1"
    start = 0
    for i, ln in enumerate(lines):
        if re.match(r"^Article\s+1$", ln) and i > 3:
            start = i
            break
    body = lines[start:]
    provs: list[Provision] = []
    chapter = None
    cur_art = None
    buf: list[str] = []

    def flush():
        nonlocal buf, cur_art
        if cur_art and buf:
            crumb = inst.title + (f" › Chapter {chapter}" if chapter else "")
            _emit_article(provs, inst, cur_art, "", "\n".join(buf),
                          part=None, chapter=chapter, crumb=crumb, src=prov.source_url)
        buf = []

    ch_re = re.compile(r"^CHAPTER\s+([IVXLC]+)\s*$")
    art_re = re.compile(r"^Article\s+(\d+)\s*$")
    i = 0
    while i < len(body):
        ln = body[i]
        mc = ch_re.match(ln)
        ma = art_re.match(ln)
        if mc:
            flush(); cur_art = None
            title = body[i + 1] if i + 1 < len(body) and not art_re.match(body[i + 1]) else ""
            chapter = f"{mc.group(1)}: {title.title()}" if title else mc.group(1)
            i += 2 if title else 1
            continue
        if ma:
            flush(); cur_art = ma.group(1); i += 1
            continue
        if cur_art and not re.match(r"^(Back to|Share|Home|Print)\b", ln, re.I):
            buf.append(ln)
        i += 1
    flush()
    _link_neighbors(provs)
    return inst, provs


# --------------------------------------------------------------------------- #
#  Vienna Convention on the Law of Treaties (PDF)                            #
# --------------------------------------------------------------------------- #
def parse_vclt(prov: Provenance) -> tuple[Instrument, list[Provision]]:
    reader = PdfReader(acquire.raw_path("vclt_1969"))
    lines = []
    for pg in reader.pages:
        for ln in (pg.extract_text() or "").splitlines():
            ln = _norm(ln)
            if ln:
                lines.append(ln)
    inst = Instrument(
        instrument_id="VCLT", title="Vienna Convention on the Law of Treaties",
        instrument_type="convention",
        issuing_body="United Nations (depositary: Secretary-General)",
        adoption_date="1969-05-23", entry_into_force_date="1980-01-27",
        source_url=prov.source_url, provenance=prov)
    provs: list[Provision] = []
    part = None
    cur_art = heading = None
    buf: list[str] = []

    def flush():
        nonlocal buf, cur_art, heading
        if cur_art and buf:
            crumb = inst.title + (f" › Part {part}" if part else "")
            _emit_article(provs, inst, cur_art, heading or "", "\n".join(buf),
                          part=part, chapter=None, crumb=crumb, src=prov.source_url)
        buf = []; heading = None

    part_re = re.compile(r"^PART\s+([IVXLC]+)\s*\.?\s*(.*)$")
    art_re = re.compile(r"^Article\s+(\d+)\s*\.?\s*(.*)$")
    i = 0
    while i < len(lines):
        ln = lines[i]
        mp = part_re.match(ln)
        ma = art_re.match(ln)
        if mp:
            flush(); cur_art = None
            ptitle = mp.group(2).strip(". ")
            if not ptitle and i + 1 < len(lines) and not art_re.match(lines[i + 1]):
                ptitle = lines[i + 1].strip(". "); i += 1
            part = f"{mp.group(1)}: {ptitle.title()}" if ptitle else mp.group(1)
            i += 1
            continue
        if ma:
            flush()
            cur_art = ma.group(1)
            heading = ma.group(2).strip(". ")
            # VCLT prints the heading on the next line when absent inline
            if not heading and i + 1 < len(lines) and not art_re.match(lines[i + 1]) \
               and not part_re.match(lines[i + 1]) and len(lines[i + 1]) < 80:
                heading = lines[i + 1].strip(". "); i += 1
            i += 1
            continue
        if cur_art:
            buf.append(ln)
        i += 1
    flush()
    _link_neighbors(provs)
    return inst, provs


PARSERS = {
    "un_charter": parse_un_charter,
    "icj_statute": parse_icj_statute,
    "vclt_1969": parse_vclt,
}
