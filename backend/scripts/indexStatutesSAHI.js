/**
 * indexStatutesSAHI.js — ingest the four authoritative Pakistani statutes into the
 * LEXICAL stream (MongoDB) using the faithful SAHI parser (Algorithm 1).
 *
 * Priority / indexing order (as the paper specifies):
 *   1. Constitution of Pakistan   2. Pakistan Penal Code
 *   3. Code of Criminal Procedure 4. Qanun-e-Shahadat Order
 *
 * For every provision it stores the SAHI annotation — breadcrumb, semantic anchor,
 * and the exact ANNOTATED chunk text ("[breadcrumb] heading: fulltext") that the
 * semantic stream will embed. No OpenAI is used here; embedding into Pinecone is the
 * separate (credit-dependent) step `embedStatutesSAHI.js`.
 *
 * This is a CLEAN REBUILD: it clears the previous statute provisions first.
 *
 *   node scripts/indexStatutesSAHI.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const LegalProvision = require('../models/LegalProvision');
const { parseStatute, STATUTES } = require('../services/sahiParser');

const DIR = path.join(__dirname, '..', '..', 'supporting_documentation');
const STATUTE_NAMESPACES = ['authoritative-laws', 'constitution-pakistan'];

function toDoc(c) {
    return {
        pineconeId: c.chunkId,                 // RRF fusion key shared with Pinecone
        namespace: c.namespace,
        source: c.source,
        sourceDoc: c.sourceDoc,
        shortName: c.shortName,
        sectionType: c.sectionType,
        sectionNumber: c.number,
        articleNumber: c.number,
        fullCitation: c.fullCitation,
        breadcrumb: c.breadcrumb,
        semanticAnchor: c.semanticAnchor,
        heading: c.heading,
        part: c.part, partName: c.partName, chapter: c.chapter,
        lawType: c.lawType,
        isAuthoritative: true,
        annotatedText: c.annotatedText,        // exact string the embedder will use
        tokenCount: c.tokenCount,
        chunkIndex: c.chunkIndex,
        text: c.text,                          // raw provision text (lexically indexed)
        vectorized: false,
    };
}

async function run() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });

    const before = await LegalProvision.countDocuments({ namespace: { $in: STATUTE_NAMESPACES } });
    console.log(`🧹 Clean rebuild — removing ${before} existing statute provisions…`);
    await LegalProvision.deleteMany({ namespace: { $in: STATUTE_NAMESPACES } });

    let grand = 0;
    const perDoc = {};
    for (const cfg of STATUTES) {               // STATUTES is already in priority order
        const raw = fs.readFileSync(path.join(DIR, cfg.file), 'utf8');
        const chunks = parseStatute(raw, cfg);
        const ops = chunks.map((c) => ({
            updateOne: { filter: { pineconeId: c.chunkId }, update: { $set: toDoc(c) }, upsert: true },
        }));
        const res = await LegalProvision.bulkWrite(ops, { ordered: false });
        const n = (res.upsertedCount || 0) + (res.modifiedCount || 0);
        perDoc[cfg.shortName] = chunks.length;
        grand += chunks.length;
        console.log(`  📘 ${cfg.shortName.padEnd(13)} → ${String(chunks.length).padStart(4)} provisions ingested (${cfg.namespace})`);
    }

    const total = await LegalProvision.countDocuments({ namespace: { $in: STATUTE_NAMESPACES } });
    console.log(`\n📊 Per statute: ${JSON.stringify(perDoc)}`);
    console.log(`✅ MongoDB lexical stream rebuilt: ${total} statute provisions (${grand} parsed).`);

    // sanity: show one fully-annotated record
    const sample = await LegalProvision.findOne({ pineconeId: 'ppc_section_302' }).lean();
    if (sample) {
        console.log('\n🔎 Sample record (PPC s.302):');
        console.log('   breadcrumb    :', sample.breadcrumb);
        console.log('   semanticAnchor:', sample.semanticAnchor);
        console.log('   annotatedText :', (sample.annotatedText || '').slice(0, 160) + '…');
        console.log('   vectorized    :', sample.vectorized, '(→ embed step pending OpenAI credits)');
    }
    console.log('\nNext (needs OpenAI credits): node scripts/embedStatutesSAHI.js  — embeds annotatedText into Pinecone.');
    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ indexStatutesSAHI failed:', e); process.exit(1); });
