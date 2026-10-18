/**
 * ingestFullJudgments.js — attach the verbatim full-judgment text to the MongoDB
 * records, from the original signed PDFs downloaded by downloadFullJudgments.js.
 *
 * Matches each PDF in full_judgments/ to the Judgment whose pdfUrl basename equals
 * the file name, extracts the text (pdf-parse), writes a .txt sidecar under
 * full_judgments/text/, and updates the record (fullText, fullTextChars, pageCount,
 * hasFullText, localPdf). Scanned/image-only PDFs (no extractable text) are flagged.
 *
 *   node scripts/ingestFullJudgments.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const pdf = require('pdf-parse');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Judgment = require('../models/Judgment');

const ROOT = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments');
const DIR = path.join(ROOT, 'full_judgments');
const TXT = path.join(DIR, 'text');
const MAX_STORE = 400000; // cap text stored inline in Mongo

const nameFor = (u) => { try { return path.basename(new URL(u).pathname).replace(/[^\w.-]+/g, '_'); } catch { return ''; } };

async function run() {
    if (!fs.existsSync(DIR)) throw new Error(`not found: ${DIR}`);
    if (!fs.existsSync(TXT)) fs.mkdirSync(TXT, { recursive: true });
    await mongoose.connect(process.env.MONGODB_URI);

    const withUrl = await Judgment.find({ pdfUrl: { $exists: true, $ne: null } }).select('_id pdfUrl');
    const byName = new Map();
    withUrl.forEach((j) => { const n = nameFor(j.pdfUrl); if (n) byName.set(n, j._id); });

    const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
    let matched = 0, unmatched = 0, scanned = 0, done = 0;
    const ops = [];
    for (const f of files) {
        let text = '', pages = 0;
        try { const d = await pdf(fs.readFileSync(path.join(DIR, f))); text = (d.text || '').trim(); pages = d.numpages; }
        catch (e) { console.log(`  parse err ${f}: ${e.message}`); continue; }
        fs.writeFileSync(path.join(TXT, f.replace(/\.pdf$/i, '.txt')), text);
        const hasText = text.length > 500;
        if (!hasText) scanned++;
        const id = byName.get(f);
        if (!id) { unmatched++; continue; }
        matched++;
        ops.push({
            updateOne: {
                filter: { _id: id },
                update: {
                    $set: {
                        fullText: text.slice(0, MAX_STORE),
                        fullTextChars: text.length,
                        pageCount: pages,
                        hasFullText: hasText,
                        localPdf: path.join('full_judgments', f),
                    },
                },
            },
        });
        done++;
    }
    if (ops.length) { const r = await Judgment.bulkWrite(ops, { ordered: false }); console.log(`✅ updated ${r.modifiedCount || 0} records with full text`); }
    console.log(`PDFs: ${files.length} | matched to records: ${matched} | unmatched: ${unmatched} | scanned/no-text (flagged): ${scanned}`);
    console.log(`📊 records now carrying full text: ${await Judgment.countDocuments({ hasFullText: true })}`);
    console.log(`🗂  text sidecars written to: ${TXT}`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ ingestFullJudgments failed:', e); process.exit(1); });
