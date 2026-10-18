/**
 * buildLexicalIndex.js — populate the MongoDB lexical stream from Pinecone.
 *
 * Legalyze's Dual-Stream Discovery needs a lexical (BM25) index alongside the
 * Pinecone semantic index. The authoritative-law chunks already live in Pinecone;
 * this script mirrors those exact chunks (same ids, same text, same SAHI metadata)
 * into the `legalprovisions` MongoDB collection so `$text` search can run over them.
 *
 * Safe + additive: it only reads Pinecone and writes one MongoDB collection. It
 * never changes any vector. Idempotent — re-running upserts by pineconeId.
 *
 *   node scripts/buildLexicalIndex.js
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Pinecone } = require('@pinecone-database/pinecone');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const LegalProvision = require('../models/LegalProvision');

const NAMESPACES = ['authoritative-laws', 'constitution-pakistan'];

function breadcrumbFor(ns, m) {
    if (ns === 'constitution-pakistan') {
        let b = 'Constitution of Pakistan, 1973';
        if (m.part) b += ` › Part ${m.part}${m.partName ? ' ' + m.partName : ''}`;
        if (m.chapter) b += ` › Chapter ${m.chapter}`;
        if (m.articleNumber) b += ` › Article ${m.articleNumber}`;
        if (m.heading) b += `: ${m.heading}`;
        return b;
    }
    // authoritative-laws
    const base = m.source || m.shortName || 'Authoritative law';
    if (m.sectionNumber && m.sectionNumber !== 'N/A') {
        return `${base} › ${m.sectionType || 'SECTION'} ${m.sectionNumber}`;
    }
    return `${base} › part ${m.chunkIndex != null ? m.chunkIndex : '?'}`;
}

function toProvision(ns, id, m) {
    const isConstitution = ns === 'constitution-pakistan';
    return {
        pineconeId: id,
        namespace: ns,
        source: m.source || (isConstitution ? 'Constitution of Pakistan, 1973' : undefined),
        shortName: m.shortName || (isConstitution ? 'Constitution' : undefined),
        sectionType: m.sectionType,
        sectionNumber: m.sectionNumber,
        fullCitation: m.fullCitation
            || (isConstitution && m.articleNumber ? `Article ${m.articleNumber} (Constitution)` : undefined),
        breadcrumb: breadcrumbFor(ns, m),
        lawType: m.lawType || (isConstitution ? 'CONSTITUTIONAL' : 'STATUTORY'),
        isAuthoritative: m.isAuthoritative !== undefined ? m.isAuthoritative : true,
        articleNumber: m.articleNumber,
        heading: m.heading,
        part: m.part,
        partName: m.partName,
        chapter: m.chapter,
        chunkIndex: typeof m.chunkIndex === 'number' ? m.chunkIndex : undefined,
        text: m.text || '',
    };
}

async function run() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY missing');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY.trim() });
    const indexName = (process.env.PINECONE_INDEX_NAME || 'legal-documents').trim();
    const index = pc.index(indexName);

    let grandTotal = 0;

    for (const ns of NAMESPACES) {
        const namespace = index.namespace(ns);
        console.log(`\n📥 Mirroring namespace '${ns}' ...`);

        // 1) enumerate all vector ids (paginated)
        const ids = [];
        let paginationToken;
        do {
            const page = await namespace.listPaginated({ limit: 100, paginationToken });
            (page.vectors || []).forEach((v) => ids.push(v.id));
            paginationToken = page.pagination && page.pagination.next;
        } while (paginationToken);
        console.log(`   found ${ids.length} vector ids`);

        // 2) fetch metadata in batches and upsert into Mongo
        let written = 0;
        for (let i = 0; i < ids.length; i += 100) {
            const batch = ids.slice(i, i + 100);
            const res = await namespace.fetch(batch);
            const records = res.records || res.vectors || {};
            const ops = [];
            for (const id of Object.keys(records)) {
                const m = records[id].metadata || {};
                if (!m.text) continue; // nothing lexical to index
                ops.push({
                    updateOne: {
                        filter: { pineconeId: id },
                        update: { $set: toProvision(ns, id, m) },
                        upsert: true,
                    },
                });
            }
            if (ops.length) {
                const r = await LegalProvision.bulkWrite(ops, { ordered: false });
                written += (r.upsertedCount || 0) + (r.modifiedCount || 0) + (r.matchedCount || 0);
            }
            if (i % 500 === 0) console.log(`   [${Math.min(i + 100, ids.length)}/${ids.length}] upserting...`);
        }
        console.log(`   ✅ ${ns}: ${written} provisions mirrored`);
        grandTotal += written;
    }

    console.log('\n🔧 Building full-text (lexical) index...');
    await LegalProvision.createIndexes();

    const count = await LegalProvision.countDocuments();
    console.log(`\n✨ Done. legalprovisions collection now holds ${count} provisions (processed ${grandTotal}).`);

    await mongoose.disconnect();
}

run().catch((e) => { console.error('❌ buildLexicalIndex failed:', e); process.exit(1); });
