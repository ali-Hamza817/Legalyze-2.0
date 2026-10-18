/**
 * Reciprocal Rank Fusion (RRF) — Legalyze retrieval fusion.
 *
 * Implements the exact formula from the Legalyze paper (Eq. 1, Cormack et al. 2009):
 *
 *            RRF(d) = Σ_L  1 / (k + rank_L(d)) ,   k = 60
 *
 * Fusion uses only each item's RANK within its own ranked list, never the raw
 * score. This is deliberate: BM25 scores and cosine similarities live on totally
 * different scales and must not be added directly. A document that is ranked
 * highly in several streams accumulates reciprocal-rank mass and is promoted
 * above a document that is ranked highly in only one stream.
 */

const RRF_K = 60; // standard smoothing constant (paper value)

/**
 * Fuse any number of ranked lists into one ranking by Reciprocal Rank Fusion.
 *
 * @param {Array<Array<any>>} rankedLists  Each inner array is ALREADY ordered
 *                                         best-first (rank 1 = index 0).
 * @param {Object}  [opts]
 * @param {number}  [opts.k=60]            Smoothing constant.
 * @param {(item:any)=>string} [opts.key]  Maps an item to its stable id
 *                                         (so the same document across lists is matched).
 * @returns {Array<{id:string, rrfScore:number, rank:number, streams:number[], item:any}>}
 *          Fused results, best-first. `streams` lists the indexes of the input
 *          lists the id appeared in; `item` is the first-seen representation.
 */
function reciprocalRankFusion(rankedLists, opts = {}) {
    const k = Number.isFinite(opts.k) ? opts.k : RRF_K;
    const key = opts.key || ((x) => String(x));

    const scores = new Map();   // id -> accumulated reciprocal-rank score
    const items = new Map();    // id -> representative item (first seen)
    const streams = new Map();  // id -> Set of list indexes it appeared in

    rankedLists.forEach((list, listIdx) => {
        if (!Array.isArray(list)) return;
        list.forEach((item, i) => {
            const rank = i + 1;                 // rank is 1-based
            const id = key(item);
            if (id === undefined || id === null) return;
            scores.set(id, (scores.get(id) || 0) + 1 / (k + rank));
            if (!items.has(id)) items.set(id, item);
            if (!streams.has(id)) streams.set(id, new Set());
            streams.get(id).add(listIdx);
        });
    });

    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id, rrfScore], idx) => ({
            id,
            rrfScore,
            rank: idx + 1,
            streams: Array.from(streams.get(id)).sort((a, b) => a - b),
            item: items.get(id),
        }));
}

module.exports = { reciprocalRankFusion, RRF_K };
