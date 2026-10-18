const mongoose = require('mongoose');

/**
 * LegalProvision — the MongoDB side of Legalyze's dual-stream retrieval.
 *
 * Each document mirrors one authoritative-law chunk that also lives in Pinecone
 * (same chunk, same `pineconeId`). The MongoDB full-text index on this collection
 * is the LEXICAL (BM25) stream of the paper's Dual-Stream Discovery; Pinecone is
 * the SEMANTIC stream. Because both sides key on `pineconeId`, a provision found
 * by both streams is recognised as the same document when fused by RRF.
 *
 * No embeddings are stored here — this collection exists purely to serve exact
 * keyword / statute-reference matching that dense vectors miss.
 */
const legalProvisionSchema = new mongoose.Schema({
    // Shared id with the Pinecone vector — the RRF fusion key across both streams.
    pineconeId: { type: String, required: true, unique: true, index: true },
    namespace: { type: String, index: true }, // 'authoritative-laws' | 'constitution-pakistan'

    // SAHI structural annotation (the breadcrumb + anchor).
    source: String,       // e.g. "Pakistan Penal Code, 1860"
    sourceDoc: String,    // e.g. "Pakistan Penal Code"
    shortName: { type: String, index: true }, // "PPC", "Constitution", ...
    sectionType: String,  // ARTICLE | SECTION | RULE | ORDER | CLAUSE | GENERAL
    sectionNumber: String,
    fullCitation: String, // "SECTION 383 (PPC)"
    breadcrumb: String,   // "Pakistan Penal Code, Chapter XVII, Section 383"  (SAHI path)
    semanticAnchor: String, // the provision heading — SAHI's "main legal concept" anchor
    annotatedText: String,  // "[breadcrumb] heading: fulltext" — exact string that gets embedded
    tokenCount: Number,
    lawType: String,      // CONSTITUTIONAL | STATUTORY
    isAuthoritative: { type: Boolean, default: true },
    vectorized: { type: Boolean, default: false, index: true }, // embedded into Pinecone yet?

    // Constitution-specific structure (when namespace = constitution-pakistan)
    articleNumber: String,
    heading: String,
    part: String,
    partName: String,
    chapter: String,

    chunkIndex: Number,
    text: { type: String, required: true }, // the exact provision text (lexically indexed)
}, { timestamps: true, collection: 'legalprovisions' });

// The lexical stream: one text index over the provision text plus its structural
// labels, with citation/heading weighted far above the body so exact references
// ("Section 383", an article heading) rank first — this is what BM25 is good at.
legalProvisionSchema.index(
    { fullCitation: 'text', heading: 'text', breadcrumb: 'text', text: 'text' },
    {
        name: 'legal_text_idx',
        default_language: 'english',
        weights: { fullCitation: 12, heading: 8, breadcrumb: 6, text: 1 },
    }
);

module.exports = mongoose.models.LegalProvision
    || mongoose.model('LegalProvision', legalProvisionSchema);
