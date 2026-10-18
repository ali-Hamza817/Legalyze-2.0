/**
 * parseCaseLawUpdates.js — parser for the official Supreme Court of Pakistan
 * Research Centre "Quarterly Case Law Update" PDFs.
 *
 * Both the older (numbered "Synopsis of Contents" + detailed body) and the newer
 * (concise, citation-led) editions share one universal per-case pivot: the
 * "Present:" bench line. We segment each edition's body on genuine case-starts
 * (a numbered title OR a reported citation that has a "Present" within a few lines),
 * which excludes inline cross-citations quoted inside a holding.
 *
 * Exports parseEdition(absPdfPath) -> { quarter, cases:[{citation,title,bench,
 * principle,summary,category,judgmentUrl,sourceQuarter}] }.
 *
 * Run directly for a DRY RUN (no DB writes):  node scripts/parseCaseLawUpdates.js
 */
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const DIR = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments', 'scp_case_law_updates');

const CITE = /((?:PLD\s+)?(?:19|20)\d{2}\s+(?:PLD\s+)?(?:Supreme\s+Court|SCMR|SCP|PLC(?:\s*\(?C\.?S\.?\)?)?|CLC|YLR|MLD|PTD|PCr\.?L?J|PLJ|GBLR)\s+\d{1,4})/i;
const CITE_G = new RegExp(CITE.source, 'gi');
const NUM_TITLE = /^(\d{1,3})\.\s*(.*\S)/;        // "1. Title ...." or "1.Title"
const URL_RE = /https?:\/\/[^\s)]+?\.pdf/i;
const JUDG_URL = /https?:\/\/www\.supremecourt\.gov\.pk\/downloads_?judgements\/[^\s)]+?\.pdf/i;

const SKIP = [
    /^research\s+centre$/i, /^supreme\s+court\s+of\s+pakistan\.?$/i,
    /^www\.supremecourt\.gov\.pk/i, /^\d+\s*\/\s*\d+$/, /^online\s+edition$/i,
    /^(synopsis\s+of\s+contents|table\s+of\s+contents|contents)$/i,
    /^quarterly$/i, /^case\s+law\s+update$/i, /^published\s+by/i, /^available\s+online/i,
    /^volume\b/i,
]; // NOTE: "Foreign Superior Courts" is intentionally NOT skipped — used as a section marker

function isSkip(l) { return !l || SKIP.some((re) => re.test(l)); }

function quarterFromName(f) {
    return f.replace(/_/g, ' ').replace(/\.pdf$/i, '').replace(/Case Law Update/i, '').replace(/CLUD/i, '').trim();
}

function classify(text) {
    const t = text.toLowerCase();
    const has = (...w) => w.some((x) => t.includes(x));
    if (has('khula', 'dower', 'dissolution of marriage', 'maintenance of', 'custody', 'guardian', 'nikah', 'family court', 'conjugal')) return 'Family';
    if (has('income tax', 'sales tax', 'customs act', 'fbr', 'inland revenue', 'tax ordinance', 'taxable', 'duty drawback')) return 'Taxation';
    if (has('qatl', 's.302', '302 ppc', 'penal code', 'bail', 'acquit', 'narcotic', 'anti-terrorism', 'f.i.r', 'convicted', 'prosecution', 'crl.', 'criminal')) return 'Criminal';
    if (has('article 184', 'article 199', 'article 10a', 'constitution', 'fundamental right', 'election', 'disqualif', 'vires', 'parliament', 'writ', 'service tribunal')) return 'Constitutional';
    return 'Other';
}

const TITLE_VS = / v\.?s?\.? | versus /i;
const CASENO = /^(civil|criminal|crl|c\.?\s*p|c\.?\s*a|j\.?\s*p|const|suo\s*motu|reference|review|h\.?r\.?c|c\.?m\.?a)\b.*\bno\.?\b/i;

function cleanTitle(s) {
    return s.replace(/https?:\/\/\S+/gi, '')
        .replace(/\S*(?:judgements|gements)\/\S*/gi, '')   // URL fragments split across lines
        .replace(/\S*\.pdf\b/gi, '').replace(/\bads_\S*/gi, '').replace(/_?judgements?\b/gi, '')
        .replace(/\.{3,}\s*\d*\s*$/g, '').replace(/\.{2,}/g, ' ')
        .replace(/\bResearch\s+Centr\s*e\b/gi, '').replace(/\s*\d+\s*$/, '')
        .replace(CITE_G, '').replace(/\s+/g, ' ').replace(/^[,.\s]+|[,.\s]+$/g, '').trim().slice(0, 180);
}

const isBench = (l) => /^\[?\s*present\b/i.test(l) || /\bPresent\s*:/.test(l) || /^coram\b/i.test(l);
const isMeta = (l) => URL_RE.test(l) || CASENO.test(l) || CITE.test(l) || NUM_TITLE.test(l);

function extractUrl(blockText) {
    const ns = blockText.replace(/\s+/g, '');
    const m = ns.match(/https?:\/\/www\.supremecourt\.gov\.pk\/downloads_?judgements\/[^\s]*?\.pdf/i)
        || ns.match(/https?:\/\/[^\s]*?\.pdf/i);
    return m ? m[0] : '';
}

function parseText(text, quarter) {
    const rawLines = text.replace(/\r/g, '').split('\n').map((s) => s.replace(/\s+/g, ' ').trim());
    const lines = rawLines.filter((l) => !isSkip(l));
    // Use ONLY the exact body section heading "Foreign Superior Courts" (the TOC
    // version carries trailing dot-leaders + a page number, so it won't match).
    const foreignFrom = lines.map((l, i) => (/^foreign\s+superior\s+courts$/i.test(l) ? i : -1)).filter((i) => i >= 0).pop();
    // The Foreign section always follows the domestic cases, so only honor a heading
    // found in the back half; an early match is a TOC/running-header false positive.
    const foreignStart = (foreignFrom == null || foreignFrom < lines.length * 0.45) ? Infinity : foreignFrom;

    // Case anchor = a "Present/Coram" bench line. Everything hangs off it.
    const benchIdx = [];
    for (let i = 0; i < lines.length; i++) if (isBench(lines[i])) benchIdx.push(i);

    // For each bench line, the title starts at the first party-vs-party line just above it.
    const titleStartFor = (p) => {
        let t = p - 1, titleTop = p;
        // collect contiguous title lines (party vs party, possibly wrapped) immediately above Present
        while (t >= 0 && p - t <= 6) {
            const l = lines[t];
            if (isBench(l)) break;
            if (URL_RE.test(l) || CASENO.test(l) || /^\[/.test(l)) { break; }
            titleTop = t;
            if (TITLE_VS.test(l) || NUM_TITLE.test(l) || CITE.test(l)) { break; } // reached the head of the title
            t--;
        }
        return titleTop;
    };

    const cases = [];
    for (let bi = 0; bi < benchIdx.length; bi++) {
        const p = benchIdx[bi];
        const start = titleStartFor(p);
        // summary runs until the next case's title-start
        const nextStart = bi + 1 < benchIdx.length ? titleStartFor(benchIdx[bi + 1]) : lines.length;
        // metadata lines sit just above the title (case no / citation / url)
        const metaTop = Math.max(0, start - 3);
        const headSeg = lines.slice(metaTop, p);       // title + meta
        const tailSeg = lines.slice(p, nextStart);     // bench + summary
        const headText = headSeg.join(' ');
        const blockText = headSeg.concat(tailSeg).join(' ');

        // title
        let title = '';
        for (let k = start; k < p; k++) { const l = lines[k]; if (URL_RE.test(l) || CASENO.test(l)) continue; title += ' ' + l.replace(NUM_TITLE, '$2'); }
        title = cleanTitle(title);

        const cm = headText.match(CITE_G) || blockText.match(CITE_G);
        const citation = cm ? cm[0].replace(/\s+/g, ' ').trim() : '';
        const cnm = headText.match(/((?:civil|criminal|crl\.?|c\.?\s*p\.?|c\.?\s*a\.?|j\.?\s*p\.?|const\.?|suo\s*motu|reference|review|h\.?r\.?c\.?)[^.]*?no\.?\s*[\d/\-ILK ]+(?:of\s*)?(?:19|20)?\d{2,4})/i);
        const caseNumber = cnm ? cnm[1].replace(/\s+/g, ' ').trim() : '';
        const judgmentUrl = extractUrl(blockText);

        // bench + summary
        const benchParts = [];
        let firstOnPresent = lines[p].replace(/^\[?\s*(present|coram)\s*:?/i, '').trim();
        if (firstOnPresent) benchParts.push(firstOnPresent);
        let k = 1;
        for (; k < tailSeg.length; k++) { if (/justice|\bJJ?\b|mr\.|mrs\.|\]/i.test(tailSeg[k]) && benchParts.join(' ').length < 260) benchParts.push(tailSeg[k]); else break; }
        const bench = benchParts.join(' ').replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 260);
        const summary = tailSeg.slice(k).join(' ').replace(/\s+/g, ' ').trim();

        const jurisdiction = (start >= foreignStart) ? 'Foreign' : 'Pakistan';
        if (title.length < 6 && !citation && !caseNumber) continue;
        if (summary.length < 40) continue; // drop stubs with no holding text
        cases.push({ citation, caseNumber, title, bench, summary: summary.slice(0, 6000), category: classify(blockText), judgmentUrl, jurisdiction, sourceQuarter: quarter });
    }
    return cases;
}

async function parseEdition(absPath) {
    const d = await pdf(fs.readFileSync(absPath));
    const quarter = quarterFromName(path.basename(absPath));
    return { quarter, pages: d.numpages, cases: parseText(d.text, quarter) };
}

async function dryRun() {
    const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
    let pk = 0, foreign = 0, withUrl = 0; const byCat = {};
    for (const f of files) {
        const { quarter, pages, cases } = await parseEdition(path.join(DIR, f));
        const dom = cases.filter((c) => c.jurisdiction === 'Pakistan');
        foreign += cases.length - dom.length; pk += dom.length;
        dom.forEach((c) => { byCat[c.category] = (byCat[c.category] || 0) + 1; if (c.judgmentUrl) withUrl++; });
        console.log(`\n### ${quarter}  —  ${dom.length} PK cases (+${cases.length - dom.length} foreign) (${pages}p)`);
        dom.slice(0, 3).forEach((c) => console.log(`   • [${c.category}] ${c.citation || c.caseNumber || '(no cite)'} — ${c.title.slice(0, 62)}${c.judgmentUrl ? '  [URL]' : ''}`));
        if (dom.length > 3) console.log(`   … +${dom.length - 3} more`);
    }
    console.log(`\n==================== DRY RUN TOTALS ====================`);
    console.log(`Quarters: ${files.length}   |   Pakistan SC cases: ${pk}   |   foreign (excluded): ${foreign}   |   with judgment URL: ${withUrl}`);
    console.log(`By category (Pakistan only):`, JSON.stringify(byCat));
    console.log(`(No database writes.)`);
}

module.exports = { parseEdition, parseText };
if (require.main === module) dryRun().catch((e) => { console.error('parse failed:', e); process.exit(1); });
