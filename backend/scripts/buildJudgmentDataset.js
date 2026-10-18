/**
 * buildJudgmentDataset.js — turn gathered judgment records into the dataset.
 *
 * Reads every `*.json` array in `Legal Corpus/judgments/data/` (records gathered
 * from the Pakistan Case Law database, each with a `category` of constitutional |
 * criminal | family and a `headnote`), then:
 *   1. writes a clean PDF per judgment into `Legal Corpus/judgments/<category>/`,
 *   2. upserts the judgment into MongoDB (the lexical stream).
 *
 * Pinecone (semantic) embedding is the separate embedJudgments.js step (needs OpenAI).
 *
 *   node scripts/buildJudgmentDataset.js
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Judgment = require('../models/Judgment');

const ROOT = path.join(__dirname, '..', '..', 'Legal Corpus', 'judgments');
const DATA = path.join(ROOT, 'data');

const CATEGORY_TO_CASETYPE = {
    constitutional: 'Constitutional',
    criminal: 'Criminal',
    family: 'Family',
};

function safeName(s) {
    return String(s).replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 80);
}

function makePdf(rec, outPath) {
    return new Promise((resolve, reject) => {
        const h = rec.headnote || {};
        const doc = new PDFDocument({ margin: 54, size: 'A4', bufferPages: true });
        const stream = fs.createWriteStream(outPath);
        doc.pipe(stream);

        doc.fillColor('#111').font('Helvetica-Bold').fontSize(15).text(rec.title || rec.citation, { align: 'left' });
        doc.moveDown(0.4);
        doc.font('Helvetica').fontSize(9.5).fillColor('#555')
            .text(`${rec.citation || ''}   |   ${rec.court || 'Supreme Court of Pakistan'}   |   ${rec.date || rec.year || ''}   |   ${rec.result || ''}`);
        if (rec.judges) doc.text(`Bench: ${rec.judges}`);
        if (rec.author) doc.text(`Authored by: ${rec.author}`);
        doc.text(`Category: ${rec.category || ''}`);

        doc.moveDown(0.9).fillColor('#111').font('Helvetica-Bold').fontSize(12).text('Headnote / Ratio Decidendi');
        doc.moveDown(0.3).font('Helvetica').fontSize(10.5).fillColor('#222')
            .text(h.summary || '(headnote not available)', { align: 'justify', lineGap: 2 });

        if (Array.isArray(h.laws) && h.laws.length) {
            doc.moveDown(0.8).font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Statutes & Provisions Referred');
            doc.moveDown(0.2).font('Helvetica').fontSize(10).fillColor('#222').list(h.laws, { bulletRadius: 1.5, lineGap: 1 });
        }
        if (Array.isArray(h.keywords) && h.keywords.length) {
            doc.moveDown(0.6).font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Keywords');
            doc.moveDown(0.2).font('Helvetica').fontSize(10).fillColor('#222').text(h.keywords.join(' · '));
        }
        if (Array.isArray(h.questions) && h.questions.length) {
            doc.moveDown(0.6).font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Legal Questions');
            doc.moveDown(0.2).font('Helvetica').fontSize(10).fillColor('#222').list(h.questions, { bulletRadius: 1.5, lineGap: 1 });
        }
        doc.moveDown(1.2).font('Helvetica-Oblique').fontSize(8).fillColor('#999')
            .text(`Source: Pakistan Case Law database — ${rec.url || ''}. Compiled for the Legalyze legal corpus.`);
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

function toDoc(rec) {
    const h = rec.headnote || {};
    const ratio = [h.summary, h.questions && h.questions.length ? `Legal questions: ${h.questions.join(' | ')}` : '']
        .filter(Boolean).join('\n\n');
    return {
        citation: rec.citation,
        caseTitle: rec.title,
        caseNumber: rec.id != null ? String(rec.id) : undefined,
        court: 'Supreme Court of Pakistan',
        bench: rec.judges,
        judge: rec.author,
        caseType: CATEGORY_TO_CASETYPE[rec.category] || 'Other',
        decisionDate: rec.date ? new Date(rec.date) : undefined,
        summary: h.summary,
        ratio: ratio || h.summary || rec.title,
        statutes: h.laws || [],
        keywords: h.keywords || [],
        pdfUrl: rec.url,
        textLength: (h.summary || '').length,
        indexed: !!h.summary,
    };
}

async function run() {
    if (!fs.existsSync(DATA)) throw new Error(`data dir not found: ${DATA}`);
    const files = fs.readdirSync(DATA).filter((f) => f.endsWith('.json')).sort();
    if (!files.length) throw new Error(`no *.json files in ${DATA}`);

    let recs = [];
    for (const f of files) {
        const arr = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
        recs = recs.concat(Array.isArray(arr) ? arr : [arr]);
    }
    // de-dup by citation
    const seen = new Set();
    recs = recs.filter((r) => r.citation && !seen.has(r.citation) && seen.add(r.citation));

    // 1) PDFs
    const perCat = {};
    for (const r of recs) {
        const cat = r.category || 'other';
        const dir = path.join(ROOT, cat);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const out = path.join(dir, `${safeName(r.citation)}.pdf`);
        await makePdf(r, out);
        perCat[cat] = (perCat[cat] || 0) + 1;
    }
    console.log('📄 PDFs written per category:', JSON.stringify(perCat));

    // 2) MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    const ops = recs.map((r) => ({
        updateOne: { filter: { citation: r.citation }, update: { $set: toDoc(r) }, upsert: true },
    }));
    const res = await Judgment.bulkWrite(ops, { ordered: false });
    console.log(`✅ Mongo upserted ${res.upsertedCount || 0}, modified ${res.modifiedCount || 0}, matched ${res.matchedCount || 0}`);

    const byType = await Judgment.aggregate([
        { $match: { court: 'Supreme Court of Pakistan' } },
        { $group: { _id: '$caseType', n: { $sum: 1 } } }, { $sort: { n: -1 } },
    ]);
    console.log('📊 Judgment collection by caseType:', JSON.stringify(byType));
    console.log(`✨ total SC judgments: ${await Judgment.countDocuments({ court: 'Supreme Court of Pakistan' })}`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ buildJudgmentDataset failed:', e); process.exit(1); });
