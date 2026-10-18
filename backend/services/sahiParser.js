/**
 * sahiParser.js — Structure-Aware Hierarchical Indexing (SAHI), the paper's core
 * contribution, implemented faithfully to Algorithm 1 (EXSY70415, §3.1.2).
 *
 * The parser operates DETERMINISTICALLY on raw statutory text using regular
 * expressions targeting Pakistani legal formatting. For every provision it emits:
 *   • a hierarchical BREADCRUMB   — e.g. "Constitution of Pakistan, Part II, Chapter 1, Article 10A"
 *   • a SEMANTIC ANCHOR           — the provision heading ("the main legal concept
 *                                   covered by that chunk"), taken directly from the
 *                                   nearest detected heading, with NO external LLM.
 *   • the ANNOTATED CHUNK TEXT    — "[breadcrumb] heading: full_text"  (Algorithm 1,
 *                                   line 25) — this is what gets embedded, so the
 *                                   vector carries the structural + topical context.
 *   • metadata {chunk_id, breadcrumb, semantic_anchor, source_doc, token_count,...}
 *
 * Robustness measures for messy PDF-extracted text:
 *   1. Table-of-Contents skip — the body starts at the first provision that is
 *      actually followed by substantive text (TOC entries are heading-only).
 *   2. Footnote-bracket stripping — "1[59." → Article 59 (a glued footnote marker).
 *   3. Monotonic provision numbering — section/article numbers increase globally in
 *      all four statutes, so a lower number mid-provision is an illustration /
 *      sub-clause / cross-reference, not a new section, and is kept as body text.
 *   4. Page markers / footnote-definition lines removed before parsing.
 * Imperfect parses on noisy source text are expected and tolerated (paper §4.2).
 */

const ROMAN = '[IVXLCDM]+';
const PART_RE = new RegExp(`^PART\\s+(${ROMAN})\\b[.:\\-\\s]*(.*)$`, 'i');
const CHAPTER_RE = new RegExp(`^CHAPTER\\s+(\\d+[A-Z]*|${ROMAN}[A-Z]*)\\b[.:\\-\\s]*(.*)$`, 'i');
const UNIT_RE = /^(\d+[A-Z]*)\.\s+([A-Za-z(].*)$/;          // "10A. Right to fair trial …"
const FOOTNOTE_RE = /^\s*\d+\s*(?:Subs|Added|Ins|Omitted|Re-?numbered|Rep|Deleted|For\b|See\b|Cf\b|The\s+words?\b|Subs\.|Ins\.)/i;
const PAGE_RE = /^\s*(?:page\s+\d+\s+of\s+\d+|\d{1,4})\s*$/i;
const CLAUSE_HINT = /\(\s*\d+[a-z]?\s*\)|\(\s*[a-z]\s*\)/;   // "(1)" "(a)" — a body marker
const ABBR_END = /\b(?:etc|No|viz|i\.e|e\.g|Art|cl|sub|w\.e\.f|Govt|Mr|Mrs|Ltd|vs|Cr\.P\.C|P\.P\.C|Ss|s)$/i;

const approxTokens = (s) => Math.max(1, Math.ceil((s || '').length / 4));
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
const stripFn = (line) => line.replace(/^\s*\d*\s*\[\s*/, '').trim();   // "1[59." -> "59.", "[6A." -> "6A."

// provision-number ordering: 10 < 10A < 10B < 11
function provKey(n) { const m = String(n).match(/^(\d+)([A-Z]*)$/); return m ? [parseInt(m[1], 10), m[2] || ''] : [0, '']; }
function provGreater(a, b) { const [an, as] = provKey(a), [bn, bs] = provKey(b); return an !== bn ? an > bn : as > bs; }

const isHeader = (l) => PART_RE.test(l) || CHAPTER_RE.test(l) || UNIT_RE.test(stripFn(l));

/** Split a provision's first-line remainder into a clean heading + inline body. */
function splitHeadingBody(rest) {
    rest = clean(rest);
    let m = rest.match(/^(.{3,160}?)\.\s*[—–-]\s+(.*)$/);           // "Heading.— body"
    if (m) return { heading: m[1].trim(), body: m[2].trim() };
    m = rest.match(/^(.{3,160}?)\.\s+(\(\s*[0-9a-z]+\s*\).*)$/);    // "Heading. (1) body"
    if (m) return { heading: m[1].trim(), body: m[2].trim() };
    const segs = rest.split(/\.\s+/);                              // "Heading. Sentence body"
    if (segs.length > 1) {
        let h = segs[0], idx = 1;
        while (idx < segs.length && ABBR_END.test(h)) { h = h + '. ' + segs[idx]; idx++; }
        const body = segs.slice(idx).join('. ').trim();
        if (h.length <= 160) return { heading: h.trim(), body };
    }
    if (rest.length <= 160) return { heading: rest.replace(/\.$/, '').trim(), body: '' };
    return { heading: rest.slice(0, 120).trim(), body: rest.slice(120).trim() };
}

/** Remove page markers + footnote definitions, then find where the body begins. */
function preprocess(rawText, cfg) {
    const kept = rawText.replace(/\r/g, '').split('\n').map((s) => s.trim())
        .filter((t) => t && !PAGE_RE.test(t) && !FOOTNOTE_RE.test(t) && !(cfg.header && cfg.header.test(t)));
    let startIdx = 0;
    for (let i = 0; i < kept.length; i++) {
        const m = stripFn(kept[i]).match(UNIT_RE);
        if (!m) continue;
        const rest = stripFn(kept[i]).slice(stripFn(kept[i]).indexOf(m[2]));
        let bodyLen = 0;
        for (let j = i + 1; j < kept.length && !isHeader(kept[j]); j++) { bodyLen += kept[j].length; if (bodyLen > 200) break; }
        if (bodyLen > 150 || rest.length > 80 || CLAUSE_HINT.test(rest)) { startIdx = i; break; }
    }
    return { lines: kept, startIdx };
}

/**
 * parseStatute — Algorithm 1 applied to one document.
 * config = { shortName, source, sourceDoc, unitLabel('Article'|'Section'),
 *            namespace, idPrefix, lawType, header?(RegExp), defaultPart?, defaultPartName? }
 */
function parseStatute(rawText, cfg) {
    const { lines, startIdx } = preprocess(rawText, cfg);
    const unitLabel = cfg.unitLabel || 'Section';

    let currentPart = cfg.defaultPart || '';
    let currentPartName = cfg.defaultPartName || '';
    let currentChapter = '', currentChapterName = '';
    let current = null, buffer = [];
    const chunks = [];
    let chunkIdx = 0;

    const save = () => {
        if (!current) return;
        const bodyText = clean([current.inlineBody, ...buffer].filter(Boolean).join(' '));
        if (bodyText.length <= 20) { return; }                     // Algorithm 1, line 23
        const parts = [cfg.sourceDoc];
        if (currentPart) parts.push(`Part ${currentPart}${currentPartName ? ' (' + clean(currentPartName) + ')' : ''}`);
        if (currentChapter) parts.push(`Chapter ${currentChapter}${currentChapterName ? ' (' + clean(currentChapterName) + ')' : ''}`);
        parts.push(`${unitLabel} ${current.number}`);
        const breadcrumb = parts.join(', ');                       // Algorithm 1, line 24
        const semanticAnchor = clean(current.heading) || `${unitLabel} ${current.number}`;
        const annotatedText = `[${breadcrumb}] ${semanticAnchor}: ${bodyText}`;   // line 25
        const chunkId = `${cfg.idPrefix}_${unitLabel.toLowerCase()}_${current.number}`.replace(/[^a-z0-9_]/gi, '_');
        chunks.push({
            chunkId, sourceDoc: cfg.sourceDoc, shortName: cfg.shortName, source: cfg.source,
            namespace: cfg.namespace, lawType: cfg.lawType, sectionType: unitLabel.toUpperCase(),
            unitLabel, number: current.number, heading: semanticAnchor, semanticAnchor,
            part: currentPart || null, partName: clean(currentPartName) || null,
            chapter: currentChapter || null, chapterName: clean(currentChapterName) || null,
            breadcrumb, fullCitation: `${unitLabel.toUpperCase()} ${current.number} (${cfg.shortName})`,
            text: bodyText, annotatedText, tokenCount: approxTokens(annotatedText), chunkIndex: chunkIdx++,
        });
    };

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        const pm = line.match(PART_RE);
        if (pm) {
            save(); current = null; buffer = [];
            currentPart = pm[1].toUpperCase();
            currentPartName = clean(pm[2]) || (lines[i + 1] && !isHeader(lines[i + 1]) && lines[i + 1].length < 70 ? lines[++i] : '');
            currentChapter = ''; currentChapterName = '';
            continue;
        }
        const cm = line.match(CHAPTER_RE);
        if (cm) {
            save(); current = null; buffer = [];
            currentChapter = cm[1].toUpperCase();
            currentChapterName = clean(cm[2]) || (lines[i + 1] && !isHeader(lines[i + 1]) && lines[i + 1].length < 70 ? lines[++i] : '');
            continue;
        }
        const stripped = stripFn(line);
        const um = stripped.match(UNIT_RE);
        if (um) {
            const num = um[1], numeric = parseInt(num, 10);
            // Provision numbers increase globally in all four statutes, so a new
            // provision must advance the running number. A number that does NOT
            // advance is an illustration / sub-clause / cross-reference → body text.
            // (Duplicate chunk-ids that arise from the PDF emitting a provision twice
            // are resolved after parsing by keeping the longest-body copy.)
            const accept = !current || provGreater(num, current.number);
            if (numeric >= 1 && numeric <= 600 && accept) {
                save();
                const { heading, body } = splitHeadingBody(um[2]);
                current = { number: num, heading, inlineBody: body };
                buffer = [];
                continue;
            }
            // else: an illustration / sub-clause / cross-reference → body text
        }
        if (current) buffer.push(line);                            // Algorithm 1, line 18-19
    }
    save();                                                        // Algorithm 1, line 20
    // Resolve duplicate chunk-ids (a provision emitted twice by the PDF) by keeping
    // the richest copy — the one with the longest provision text.
    const best = new Map();
    for (const c of chunks) { const prev = best.get(c.chunkId); if (!prev || c.text.length > prev.text.length) best.set(c.chunkId, c); }
    return [...best.values()].sort((a, b) => a.chunkIndex - b.chunkIndex);
}

// Document configs, in the paper's priority/indexing order.
const STATUTES = [
    { file: 'Constitution of Pakistan.txt', shortName: 'Constitution', source: 'Constitution of the Islamic Republic of Pakistan, 1973', sourceDoc: 'Constitution of Pakistan', unitLabel: 'Article', namespace: 'constitution-pakistan', idPrefix: 'const', lawType: 'CONSTITUTIONAL', defaultPart: 'I', defaultPartName: 'Introductory', header: /^THE CONSTITUTION OF THE ISLAMIC REPUBLIC OF PAKISTAN$/i },
    { file: 'Pakistan Penal Code.txt', shortName: 'PPC', source: 'Pakistan Penal Code, 1860', sourceDoc: 'Pakistan Penal Code', unitLabel: 'Section', namespace: 'authoritative-laws', idPrefix: 'ppc', lawType: 'STATUTORY', header: /^THE PAKISTAN PENAL CODE$/i },
    { file: 'Code of Criminal Procedure.txt', shortName: 'CrPC', source: 'Code of Criminal Procedure, 1898', sourceDoc: 'Code of Criminal Procedure', unitLabel: 'Section', namespace: 'authoritative-laws', idPrefix: 'crpc', lawType: 'STATUTORY', header: /^THE CODE OF CRIMINAL PROCEDURE, 1898$/i },
    { file: 'Qanun-e-Shahadat Order.txt', shortName: 'QSO', source: 'Qanun-e-Shahadat Order, 1984', sourceDoc: 'Qanun-e-Shahadat Order', unitLabel: 'Article', namespace: 'authoritative-laws', idPrefix: 'qso', lawType: 'STATUTORY', header: /^THE QANUN-E-SHAHADAT, 1984$/i },
];

module.exports = { parseStatute, STATUTES, splitHeadingBody, provGreater };
