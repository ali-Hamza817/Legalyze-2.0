/**
 * ingestCaseLawUpdates.js — ingest the official SCP Quarterly Case Law Updates
 * into MongoDB (the lexical / BM25 stream of Legalyze).
 *
 * Source: Legal Corpus/judgments/scp_case_law_updates/*.pdf (downloaded from
 * scp.gov.pk/ResearchCentrePublications — the Court's own public-domain digests).
 * Parsing is done by parseCaseLawUpdates.js. Only Pakistan SC cases are ingested;
 * foreign-court entries are skipped. Pinecone (semantic) embedding is the separate
 * embedJudgments.js step (needs OpenAI credits).
 *
 * Also writes, next to the PDFs:
 *   full_judgment_urls.txt   — the direct links to original signed judgments
 *   full_judgment_links.html — a clickable page for manual browser download
 *   parsed_cases.jsonl       — every parsed case (audit trail)
 *
 *   node scripts/ingestCaseLawUpdates.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Judgment = require('../models/Judgment');
const { parseEdition } = require('./parseCaseLawUpdates');

const DIR = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments', 'scp_case_law_updates');
const SOURCE = 'SCP Quarterly Case Law Update';

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (s) => norm(s).replace(/\s+/g, '-').slice(0, 60);

function keyFor(c) {
    if (c.citation) return norm(c.citation);
    return norm(c.title) || norm(c.caseNumber);
}

function better(a, b) { // pick the richer of two duplicate records
    const score = (c) => (c.citation ? 4 : 0) + (c.judgmentUrl ? 2 : 0) + Math.min(1, (c.summary || '').length / 400);
    return score(b) > score(a) ? b : a;
}

async function run() {
    const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
    const merged = new Map();
    let rawPk = 0, foreign = 0;
    const jsonl = [];
    for (const f of files) {
        const { cases } = await parseEdition(path.join(DIR, f));
        for (const c of cases) {
            if (c.jurisdiction !== 'Pakistan') { foreign++; continue; }
            rawPk++; jsonl.push(c);
            const k = keyFor(c);
            if (!k) continue;
            merged.set(k, merged.has(k) ? better(merged.get(k), c) : c);
        }
    }
    const cases = [...merged.values()];
    console.log(`Parsed ${rawPk} PK cases (${foreign} foreign skipped) → ${cases.length} unique after de-dup.`);

    // ---- artifacts ----
    fs.writeFileSync(path.join(DIR, 'parsed_cases.jsonl'), jsonl.map((c) => JSON.stringify(c)).join('\n'));
    const urls = [...new Set(cases.map((c) => c.judgmentUrl).filter(Boolean))].sort();
    fs.writeFileSync(path.join(DIR, 'full_judgment_urls.txt'), urls.join('\n'));
    const rows = cases.filter((c) => c.judgmentUrl)
        .map((c) => `<li><a href="${c.judgmentUrl}">${(c.citation || c.caseNumber || '').replace(/</g, '')} — ${(c.title || '').replace(/</g, '')}</a> <small>[${c.category} · ${c.sourceQuarter}]</small></li>`)
        .join('\n');
    fs.writeFileSync(path.join(DIR, 'full_judgment_links.html'),
        `<!doctype html><meta charset="utf-8"><title>SCP full judgments to download</title>` +
        `<style>body{font:15px/1.6 system-ui;max-width:900px;margin:30px auto;padding:0 16px}li{margin:6px 0}small{color:#667}</style>` +
        `<h1>Full signed judgments — ${urls.length} links</h1>` +
        `<p>Open each in your browser to download the original Supreme Court PDF (the site blocks automated download). Save them into <code>Legal Corpus/judgments/full_judgments/</code> and re-run ingestion to add full text.</p><ol>${rows}</ol>`);

    // ---- MongoDB ----
    if (!process.env.MONGODB_URI) { console.log('⚠ MONGODB_URI missing — wrote artifacts only, skipped DB.'); return; }
    await mongoose.connect(process.env.MONGODB_URI);
    const ops = cases.map((c) => {
        const citation = c.citation || c.caseNumber || `${slug(c.title)} (${c.sourceQuarter})`;
        const doc = {
            citation,
            caseTitle: c.title || citation,
            caseNumber: c.caseNumber || undefined,
            court: 'Supreme Court of Pakistan',
            bench: c.bench || undefined,
            caseType: ['Criminal', 'Constitutional', 'Family', 'Taxation', 'Other'].includes(c.category) ? c.category : 'Other',
            summary: c.summary,
            ratio: c.summary,
            pdfUrl: c.judgmentUrl || undefined,
            source: SOURCE,
            sourceQuarter: c.sourceQuarter,
            jurisdiction: 'Pakistan',
            textLength: (c.summary || '').length,
            indexed: !!(c.summary && c.summary.length > 40),
        };
        return { updateOne: { filter: { citation }, update: { $set: doc }, upsert: true } };
    });
    const res = await Judgment.bulkWrite(ops, { ordered: false });
    console.log(`✅ Mongo: upserted ${res.upsertedCount || 0}, modified ${res.modifiedCount || 0}, matched ${res.matchedCount || 0}`);

    const byType = await Judgment.aggregate([
        { $match: { source: SOURCE } },
        { $group: { _id: '$caseType', n: { $sum: 1 } } }, { $sort: { n: -1 } },
    ]);
    console.log('📊 Official-source judgments by caseType:', JSON.stringify(byType));
    console.log(`📎 Full-judgment links written: ${urls.length} → ${path.join(DIR, 'full_judgment_links.html')}`);
    console.log(`✨ total SCP-sourced judgments in Mongo: ${await Judgment.countDocuments({ source: SOURCE })}`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ ingestCaseLawUpdates failed:', e); process.exit(1); });
