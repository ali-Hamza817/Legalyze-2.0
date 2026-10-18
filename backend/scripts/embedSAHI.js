/**
 * embedSAHI.js — SEMANTIC stream builder. Embeds the SAHI-annotated chunks into
 * Pinecone, completing Legalyze's Dual-Stream (lexical MongoDB + semantic Pinecone)
 * so RRF can fuse them.
 *
 * Embedding order follows the paper's priority:
 *   1. Constitution of Pakistan   (namespace: constitution-pakistan)
 *   2. Pakistan Penal Code        \
 *   3. Code of Criminal Procedure  }  (namespace: authoritative-laws)
 *   4. Qanun-e-Shahadat Order     /
 *   5. Supreme Court judgments — CONSTITUTIONAL first  (namespace: judgments)
 *
 * It embeds the ANNOTATED text ("[breadcrumb] heading: body") — Algorithm 1, line 25
 * — with ONLY text-embedding-3-small (1024-d), the cheapest model. No GPT / heavy
 * models are used. It is idempotent & resumable: each record carries `vectorized`,
 * and a 429 (out of credits) stops cleanly so you can top up and re-run.
 *
 *   node scripts/embedSAHI.js [--statutes-only | --judgments-only]
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// override:true is essential — the shell profile exports a stale OPENAI_API_KEY that
// would otherwise shadow the real key in .env (dotenv won't overwrite an existing env var).
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
const LegalProvision = require('../models/LegalProvision');
const Judgment = require('../models/Judgment');
const { generateEmbedding } = require('../utils/documentProcessor');
const { upsertConstitution, upsertRawVectors } = require('../services/pineconeService');

const BATCH = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isQuota = (e) => e && (e.status === 429 || /quota|credit|429/i.test(String(e.message)));
// Embed with retry; rethrow only on quota/credit (so the run stops & resumes cleanly),
// return null on any other error so one bad record doesn't abort the whole corpus.
async function embedSafe(text) {
    try { return await generateEmbedding(text); }
    catch (e) { if (isQuota(e)) throw e; console.warn('   ⚠ skip (embed error):', String(e.message).slice(0, 90)); return null; }
}
const arg = process.argv.slice(2);
const only = arg.includes('--statutes-only') ? 'statutes' : arg.includes('--judgments-only') ? 'judgments' : 'all';

async function embedProvisions(filter, namespace, label) {
    const pending = await LegalProvision.find({ ...filter, $or: [{ vectorized: { $ne: true } }] })
        .sort({ chunkIndex: 1 }).lean();
    if (!pending.length) { console.log(`  ${label}: nothing pending.`); return 0; }
    console.log(`  ${label}: ${pending.length} to embed → namespace '${namespace}'`);
    let vectors = [], done = 0;
    const flush = async () => {
        if (!vectors.length) return;
        if (namespace === 'constitution-pakistan') await upsertConstitution(vectors);
        else await upsertRawVectors(vectors, namespace);
        await LegalProvision.updateMany({ pineconeId: { $in: vectors.map((v) => v.id) } }, { $set: { vectorized: true } });
        vectors = [];
    };
    for (const p of pending) {
        const embedding = await embedSafe((p.annotatedText || p.text).slice(0, 28000)); // cheap model only
        if (!embedding) continue;
        vectors.push({
            id: p.pineconeId,
            values: embedding,
            metadata: {
                source: p.source, shortName: p.shortName, sourceDoc: p.sourceDoc,
                sectionType: p.sectionType, sectionNumber: p.sectionNumber,
                fullCitation: p.fullCitation, breadcrumb: p.breadcrumb,
                semanticAnchor: p.semanticAnchor, lawType: p.lawType,
                part: p.part || '', chapter: p.chapter || '',
                text: (p.text || '').slice(0, 40000),
            },
        });
        done++;
        if (vectors.length >= BATCH) { await flush(); await sleep(400); if (done % 300 === 0) console.log(`     …${done}/${pending.length}`); }
    }
    await flush();
    console.log(`  ✅ ${label}: embedded ${done}.`);
    return done;
}

async function embedJudgments() {
    // CONSTITUTIONAL first, then the rest — most recent first within each type.
    const order = ['Constitutional', 'Criminal', 'Family', 'Taxation', 'Other'];
    let grand = 0;
    for (const t of order) {
        const pending = await Judgment.find({ caseType: t, indexed: true, $or: [{ vectorized: { $ne: true } }] }).lean();
        if (!pending.length) continue;
        console.log(`  Judgments [${t}]: ${pending.length} → namespace 'judgments'`);
        let vectors = [], done = 0;
        const flush = async () => {
            if (!vectors.length) return;
            await upsertRawVectors(vectors, 'judgments');
            await Judgment.updateMany({ _id: { $in: vectors.map((v) => new mongoose.Types.ObjectId(v.id)) } }, { $set: { vectorized: true } });
            vectors = [];
        };
        for (const j of pending) {
            const body = j.fullText || j.ratio || j.summary || j.caseTitle || '';
            const breadcrumb = `Supreme Court of Pakistan, ${j.caseType}, ${j.citation}`;
            const annotated = `[${breadcrumb}] ${j.caseTitle}: ${body}`.slice(0, 16000); // ~4k tokens, safe under 8192 limit
            const embedding = await embedSafe(annotated); // cheap model only
            if (!embedding) continue;
            vectors.push({
                id: j._id.toString(),
                values: embedding,
                metadata: {
                    citation: j.citation, caseTitle: j.caseTitle, caseType: j.caseType,
                    court: j.court || 'Supreme Court of Pakistan', breadcrumb,
                    sourceQuarter: j.sourceQuarter || '', hasFullText: !!j.hasFullText,
                    text: (j.ratio || j.summary || '').slice(0, 40000),
                },
            });
            done++; grand++;
            if (vectors.length >= BATCH) { await flush(); await sleep(400); }
        }
        await flush();
        console.log(`  ✅ Judgments [${t}]: embedded ${done}.`);
    }
    return grand;
}

async function run() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
    try {
        if (only !== 'judgments') {
            console.log('🏛️  Embedding statutes (priority order)…');
            await embedProvisions({ namespace: 'constitution-pakistan' }, 'constitution-pakistan', '1. Constitution');
            await embedProvisions({ namespace: 'authoritative-laws', shortName: 'PPC' }, 'authoritative-laws', '2. PPC');
            await embedProvisions({ namespace: 'authoritative-laws', shortName: 'CrPC' }, 'authoritative-laws', '3. CrPC');
            await embedProvisions({ namespace: 'authoritative-laws', shortName: 'QSO' }, 'authoritative-laws', '4. QSO');
        }
        if (only !== 'statutes') {
            console.log('⚖️  Embedding Supreme Court judgments (constitutional first)…');
            await embedJudgments();
        }
        console.log('\n✨ Semantic stream build complete (for the records processed).');
    } catch (e) {
        if (String(e.message || e).includes('429') || /quota|credit/i.test(String(e.message))) {
            console.error('\n⛔ OpenAI out of credits (429). Stopped cleanly — progress is saved (vectorized flags).');
            console.error('   Top up at https://platform.openai.com/settings/organization/billing and re-run: node scripts/embedSAHI.js');
        } else { console.error('❌ embedSAHI failed:', e); }
    } finally { await mongoose.disconnect(); }
}

run();
