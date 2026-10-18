/**
 * ingestJudgments.js — ingest Supreme Court judgments into MongoDB (lexical stream).
 *
 * Reads every `enriched_*.json` file in `Legal Corpus/judgments/` (arrays of
 * judgment records gathered from the Pakistan Case Law database: metadata +
 * headnote {summary, laws, keywords, questions}) and upserts them into the
 * `Judgment` collection, which carries the $text index used by the lexical
 * (BM25) stream in searchService.hybridSearch.
 *
 * MongoDB ingestion needs NO embeddings, so this runs regardless of OpenAI
 * credit state. Pinecone (semantic) embedding is a separate step: embedJudgments.js.
 *
 *   node scripts/ingestJudgments.js
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Judgment = require('../models/Judgment');

const DIR = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments');

function inferCaseType(r) {
    const h = r.headnote || {};
    const s = `${r.title || ''} ${(h.keywords || []).join(' ')} ${h.summary || ''}`.toLowerCase();
    if (/review petition/.test(s)) return 'Review';
    if (/\bbail\b|murder|qatl|\b302\b|narcotic|acquit|convict|\bfir\b|cr\.?p\.?c|criminal|anti-?terror|hudood/.test(s)) return 'Criminal';
    if (/\btax\b|revenue|income tax|customs|sales tax|\bduty\b|inland revenue|tariff/.test(s)) return 'Taxation';
    if (/constitution|fundamental right|article 199|\bwrit\b|suo motu|ultra vires/.test(s)) return 'Constitutional';
    if (/khula|dower|dowry|custody|nikah|guardian|\bfamily\b|maintenance|talaq/.test(s)) return 'Family';
    if (/\bcompany\b|companies|banking|\bcontract\b|commercial|arbitration|insolvency/.test(s)) return 'Commercial';
    return 'Civil';
}

function toDoc(r) {
    const h = r.headnote || {};
    const ratio = [
        h.summary,
        h.questions && h.questions.length ? `Legal questions: ${h.questions.join(' | ')}` : '',
    ].filter(Boolean).join('\n\n');
    return {
        citation: r.citation,
        caseTitle: r.title,
        caseNumber: r.id != null ? String(r.id) : undefined,
        court: 'Supreme Court of Pakistan',
        bench: r.judges,
        judge: r.author,
        caseType: inferCaseType(r),
        decisionDate: r.date ? new Date(r.date) : undefined,
        summary: h.summary,
        ratio: ratio || h.summary || r.title,
        statutes: h.laws || [],
        keywords: h.keywords || [],
        pdfUrl: r.url,
        textLength: (h.summary || '').length,
        indexed: !!h.summary, // only truly searchable once we have the headnote
    };
}

async function run() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    if (!fs.existsSync(DIR)) throw new Error(`dataset dir not found: ${DIR}`);

    const files = fs.readdirSync(DIR).filter((f) => /^enriched_.*\.json$/.test(f)).sort();
    if (!files.length) throw new Error(`no enriched_*.json files in ${DIR}`);

    let recs = [];
    for (const f of files) {
        const arr = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
        recs = recs.concat(Array.isArray(arr) ? arr : [arr]);
    }

    // de-duplicate by citation (same case can be reported in PLD + SCMR)
    const seen = new Set();
    recs = recs.filter((r) => {
        if (!r.citation || seen.has(r.citation)) return false;
        seen.add(r.citation);
        return true;
    });

    console.log(`📚 ${recs.length} unique judgments from ${files.length} file(s)`);

    await mongoose.connect(process.env.MONGODB_URI);

    const ops = recs.map((r) => ({
        updateOne: { filter: { citation: r.citation }, update: { $set: toDoc(r) }, upsert: true },
    }));
    if (ops.length) {
        const res = await Judgment.bulkWrite(ops, { ordered: false });
        console.log(`✅ upserted ${res.upsertedCount || 0}, modified ${res.modifiedCount || 0}, matched ${res.matchedCount || 0}`);
    }

    // The Judgment collection already carries a `ratio_text` index (from the
    // model's `ratio: { text: true }`), which powers the lexical ($text) stream —
    // and `ratio` now holds each judgment's full headnote. MongoDB allows only
    // one text index per collection, so we do NOT create another here.
    const total = await Judgment.countDocuments({ court: 'Supreme Court of Pakistan' });
    const withRatio = await Judgment.countDocuments({ court: 'Supreme Court of Pakistan', indexed: true });
    console.log(`\n✨ Judgment collection: ${total} SC judgments (${withRatio} with headnote/ratio, lexically searchable).`);

    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ ingestJudgments failed:', e); process.exit(1); });
