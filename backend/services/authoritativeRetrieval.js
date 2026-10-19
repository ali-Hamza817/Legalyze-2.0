/**
 * authoritativeRetrieval.js — Legalyze Dual-Stream Discovery over the
 * authoritative legal corpus (statutes + Constitution).
 *
 * This is the genuine implementation of the paper's retrieval pipeline for the
 * core legal Q&A:
 *
 *   LEXICAL stream  = BM25-style MongoDB $text search over `legalprovisions`
 *   SEMANTIC stream = Pinecone vector search (authoritative-laws + constitution)
 *   FUSION          = Reciprocal Rank Fusion, RRF(d)=Σ_L 1/(k+rank_L(d)), k=60
 *
 * Both streams run in parallel and are fused by RANK (never by raw score), keyed
 * on the shared Pinecone id. A provision found by both streams is promoted. The
 * top fused provisions are hydrated from MongoDB so every passage carries its
 * structural breadcrumb + citation (SAHI) into the context given to the LLM.
 */
const pineconeService = require('./pineconeService');
const { generateEmbedding } = require('../utils/documentProcessor');
const { reciprocalRankFusion, RRF_K } = require('./rankFusion');
const LegalProvision = require('../models/LegalProvision');

/**
 * @param {string} query
 * @param {number} topK  how many fused provisions to return
 * @returns {Promise<{ type:'laws', data:Array, meta:Object }>}
 */
async function retrieveAuthoritative(query, topK = 8) {
    // --- semantic stream (Pinecone), both authoritative namespaces ---
    const semanticPromise = (async () => {
        try {
            const embedding = await generateEmbedding(query);
            const [laws, constitution] = await Promise.all([
                pineconeService.queryAuthoritativeLaws(embedding, 15).catch(() => []),
                pineconeService.queryConstitution(embedding, 10).catch(() => []),
            ]);
            return { laws, constitution };
        } catch (e) {
            console.warn('⚠️ Semantic stream failed:', e.message);
            return { laws: [], constitution: [] };
        }
    })();

    // --- lexical stream (MongoDB $text / BM25) ---
    const lexicalPromise = (async () => {
        try {
            return await LegalProvision.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' }, pineconeId: 1 }
            ).sort({ score: { $meta: 'textScore' } }).limit(20).lean();
        } catch (e) {
            console.warn('⚠️ Lexical stream failed:', e.message);
            return [];
        }
    })();

    const [{ laws, constitution }, lexical] = await Promise.all([semanticPromise, lexicalPromise]);

    // Build ranked id-lists (already best-first). Stream order matters for debug:
    //   0 = semantic/authoritative-laws, 1 = semantic/constitution, 2 = lexical
    const listSemLaws = laws.map((r) => ({ id: r.id }));
    const listSemConst = constitution.map((r) => ({ id: r.id }));
    const listLexical = lexical.map((r) => ({ id: r.pineconeId }));

    const fused = reciprocalRankFusion([listSemLaws, listSemConst, listLexical], {
        k: RRF_K,
        key: (x) => x.id,
    }).filter((f) => f.id); // drop any null ids

    const topIds = fused.slice(0, topK).map((f) => f.id);
    if (topIds.length === 0) {
        return { type: 'laws', data: [], meta: { k: RRF_K, semantic: laws.length + constitution.length, lexical: lexical.length, fused: 0 } };
    }

    // Hydrate the winners from MongoDB (consistent SAHI metadata + full text).
    const provisions = await LegalProvision.find({ pineconeId: { $in: topIds } }).lean();
    const byId = new Map(provisions.map((p) => [p.pineconeId, p]));

    const data = fused.slice(0, topK).map((f) => {
        const p = byId.get(f.id) || {};
        const inSemantic = f.streams.includes(0) || f.streams.includes(1);
        const inLexical = f.streams.includes(2);
        const matchType = inSemantic && inLexical ? 'hybrid' : inSemantic ? 'semantic' : 'lexical';
        return {
            id: f.id,
            source: p.source,
            shortName: p.shortName,
            fullCitation: p.fullCitation,
            breadcrumb: p.breadcrumb,
            semanticAnchor: p.semanticAnchor,
            sectionNumber: p.sectionNumber,
            lawType: p.lawType,
            text: p.text || '',
            rrfScore: Number(f.rrfScore.toFixed(5)),
            matchType,
        };
    }).filter((d) => d.text);

    return {
        type: 'laws',
        data,
        meta: {
            k: RRF_K,
            semantic: laws.length + constitution.length,
            lexical: lexical.length,
            fused: fused.length,
            hybridHits: data.filter((d) => d.matchType === 'hybrid').length,
        },
    };
}

module.exports = { retrieveAuthoritative };
