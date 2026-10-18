/**
 * embedJudgments.js — embed ingested judgments into Pinecone (semantic stream).
 *
 * Reads `Judgment` records that have a headnote/ratio (indexed=true) but no
 * vector yet (vectorized!=true), embeds the ratio with OpenAI text-embedding-3-small
 * (1024-dim, same model as the rest of the index), and upserts to the Pinecone
 * `judgments` namespace with the vector id = the Judgment _id — exactly what
 * searchService.hybridSearch expects (it hydrates vector hits by _id). This makes
 * the judgment stream a genuine dual-stream (MongoDB $text + Pinecone) fused by RRF.
 *
 * REQUIRES OpenAI credits. If the account is out of quota this will fail at the
 * embedding step with 429 insufficient_quota — top up credits, then re-run; it is
 * idempotent (only embeds judgments not yet vectorized).
 *
 *   node scripts/embedJudgments.js
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const Judgment = require('../models/Judgment');
const { generateEmbedding } = require('../utils/documentProcessor');
const { upsertRawVectors } = require('../services/pineconeService');

const NAMESPACE = 'judgments';

async function run() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);

    const pending = await Judgment.find({
        court: 'Supreme Court of Pakistan',
        indexed: true,
        $or: [{ vectorized: { $exists: false } }, { vectorized: false }],
    }).lean();

    console.log(`🧮 ${pending.length} judgments to embed into Pinecone namespace '${NAMESPACE}'`);
    if (pending.length === 0) { await mongoose.disconnect(); return; }

    let vectors = [];
    let done = 0;
    for (const j of pending) {
        const text = (j.ratio || j.summary || j.caseTitle || '').toString();
        if (!text.trim()) continue;
        try {
            const embedding = await generateEmbedding(text); // OpenAI — needs credits
            vectors.push({
                id: j._id.toString(), // MUST equal Mongo _id so hybridSearch can hydrate
                values: embedding,
                metadata: {
                    citation: j.citation,
                    caseTitle: j.caseTitle,
                    caseType: j.caseType,
                    court: j.court,
                    text: text.substring(0, 40000),
                },
            });
            if (vectors.length >= 50) {
                await upsertRawVectors(vectors, NAMESPACE);
                const ids = vectors.map((v) => new mongoose.Types.ObjectId(v.id));
                await Judgment.updateMany({ _id: { $in: ids } }, { $set: { vectorized: true, chunkCount: 1 } });
                vectors = [];
            }
            done += 1;
            if (done % 20 === 0) console.log(`   embedded ${done}/${pending.length}`);
        } catch (e) {
            console.error(`   ❌ embed failed for ${j.citation}: ${e.message}`);
            throw e; // most likely OpenAI 429 — stop; re-run after topping up credits
        }
    }
    if (vectors.length) {
        await upsertRawVectors(vectors, NAMESPACE);
        const ids = vectors.map((v) => new mongoose.Types.ObjectId(v.id));
        await Judgment.updateMany({ _id: { $in: ids } }, { $set: { vectorized: true, chunkCount: 1 } });
    }

    console.log(`\n✨ Embedded ${done} judgments into Pinecone '${NAMESPACE}'.`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ embedJudgments failed:', e.message); process.exit(1); });
