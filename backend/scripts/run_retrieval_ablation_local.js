/**
 * Local VSM-based Retrieval Ablation Study for Legalyze
 * 
 * To ensure 100% reliability and local execution (no API key/quota dependency),
 * this script implements two distinct local retrieval models over the actual
 * Constitution of Pakistan text:
 * 1. Lexical (BM25): Term-based exact matching model.
 * 2. Dense/VSM: Cosine similarity over subword character 3-gram vectors.
 *    Subword n-gram vectors represent a standard VSM baseline in IR that matches
 *    linguistic roots, prefixes, and suffixes (synonym-like semantic grouping).
 * 
 * Evaluates 6 configurations:
 * 1. Flat Lexical Only
 * 2. Flat Dense Only
 * 3. Flat Hybrid (Lexical + Dense via RRF)
 * 4. SAHI Lexical Only
 * 5. SAHI Dense Only
 * 6. Legalyze Full (SAHI + Hybrid via RRF)
 * 
 * Computes: Recall@5, Recall@10, Precision@5, MRR, nDCG@5, nDCG@10.
 * Saves results to backend/scripts/ablation_results.json.
 */

const fs = require('fs');
const path = require('path');
const { parseConstitutionEnhanced } = require('./enhanced_parser');

const CONSTITUTION_FILE = path.join(__dirname, '../../supporting_documentation/Constitution of Pakistan.txt');

// Ground-truth query set mapping to target article numbers
const EVAL_SUITE = [
    { query: "What is the official state religion of Pakistan?", target: "2" },
    { query: "Loyalty to State and obedience to Constitution and law", target: "5" },
    { query: "What constitutes high treason under the law?", target: "6" },
    { query: "laws inconsistent with or in derogation of fundamental rights to be void", target: "8" },
    { query: "Security of person: no person shall be deprived of life or liberty", target: "9" },
    { query: "clean and healthy environment fundamental right article", target: "9A" },
    { query: "Safeguards as to arrest and detention guidelines", target: "10" },
    { query: "Right to fair trial in civil and criminal proceedings", target: "10A" },
    { query: "Slavery, forced labour and child labor prohibited", target: "11" },
    { query: "Protection against retrospective punishment and double jeopardy", target: "12" },
    { query: "Inviolability of dignity of man and prohibition of torture", target: "14" },
    { query: "Freedom of association and political party formation", target: "17" },
    { query: "Freedom of trade, business or profession licensing", target: "18" },
    { query: "Freedom of speech and expression and right to information", target: "19" },
    { query: "Right to free and compulsory education for children aged five to sixteen", target: "25A" },
    { query: "What are the qualifications for membership of Majlis-e-Shoora?", target: "62" },
    { query: "What is disqualification on grounds of defection from political party?", target: "63A" },
    { query: "What is the ordinance-making power of the President?", target: "89" },
    { query: "Decisions of Supreme Court binding on other courts in Pakistan", target: "189" },
    { query: "High Court jurisdiction to issue writs under Article 199", target: "199" }
];

// Helper to compute subword character n-grams (3-grams) for Dense/VSM similarity
function getCharNGrams(text, n = 3) {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const ngrams = {};
    for (let i = 0; i < cleaned.length - n + 1; i++) {
        const gram = cleaned.substring(i, i + n);
        ngrams[gram] = (ngrams[gram] || 0) + 1;
    }
    return ngrams;
}

// Helper to calculate cosine similarity between two n-gram frequency objects
function calculateNGramSimilarity(gramsA, gramsB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    // Union of keys
    const allKeys = new Set([...Object.keys(gramsA), ...Object.keys(gramsB)]);
    
    allKeys.forEach(key => {
        const valA = gramsA[key] || 0;
        const valB = gramsB[key] || 0;
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    });
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// BM25 Lexical Indexer
class BM25Indexer {
    constructor(k1 = 1.2, b = 0.75) {
        this.k1 = k1;
        this.b = b;
        this.documents = [];
        this.docLengths = [];
        this.avgDocLength = 0;
        this.df = {};
        this.idf = {};
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s\-]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    fit(docs) {
        this.documents = docs.map(d => ({
            id: d.id,
            articleNumber: d.articleNumber,
            terms: this.tokenize(d.text)
        }));
        
        this.docLengths = this.documents.map(d => d.terms.length);
        const totalLength = this.docLengths.reduce((sum, len) => sum + len, 0);
        this.avgDocLength = totalLength / this.documents.length;
        
        this.df = {};
        this.documents.forEach(doc => {
            const uniqueTerms = new Set(doc.terms);
            uniqueTerms.forEach(term => {
                this.df[term] = (this.df[term] || 0) + 1;
            });
        });
        
        const N = this.documents.length;
        this.idf = {};
        for (const [term, freq] of Object.entries(this.df)) {
            this.idf[term] = Math.log(1 + (N - freq + 0.5) / (freq + 0.5));
        }
    }

    search(queryText, limit = 10) {
        const queryTerms = this.tokenize(queryText);
        const scores = [];
        
        this.documents.forEach((doc, docIdx) => {
            let score = 0;
            const termCounts = {};
            doc.terms.forEach(term => {
                termCounts[term] = (termCounts[term] || 0) + 1;
            });
            
            const docLen = this.docLengths[docIdx];
            
            queryTerms.forEach(term => {
                if (this.idf[term]) {
                    const tf = termCounts[term] || 0;
                    const idf = this.idf[term];
                    const num = tf * (this.k1 + 1);
                    const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
                    score += idf * (num / denom);
                }
            });
            
            scores.push({
                id: doc.id,
                articleNumber: doc.articleNumber,
                score
            });
        });
        
        return scores.sort((a, b) => b.score - a.score).slice(0, limit);
    }
}

// Reciprocal Rank Fusion (RRF)
function fuseRankings(lexicalRank, denseRank, k = 60) {
    const rrfScores = {};
    
    lexicalRank.forEach((item, idx) => {
        const id = item.id;
        const rank = idx + 1;
        if (!rrfScores[id]) {
            rrfScores[id] = { id, articleNumber: item.articleNumber, score: 0 };
        }
        rrfScores[id].score += 1 / (k + rank);
    });
    
    denseRank.forEach((item, idx) => {
        const id = item.id;
        const rank = idx + 1;
        if (!rrfScores[id]) {
            rrfScores[id] = { id, articleNumber: item.articleNumber, score: 0 };
        }
        rrfScores[id].score += 1 / (k + rank);
    });
    
    return Object.values(rrfScores).sort((a, b) => b.score - a.score);
}

// Main Execution
async function runAblation() {
    console.log('='.repeat(70));
    console.log('LOCAL RAG RETRIEVAL ABLATION STUDY');
    console.log('='.repeat(70));
    
    // 1. Load and parse the Constitution text
    console.log('\n📖 Step 1: Loading and parsing Constitution...');
    const rawText = fs.readFileSync(CONSTITUTION_FILE, 'utf-8');
    
    // Generate SAHI Chunks
    const sahiRawChunks = parseConstitutionEnhanced(rawText);
    const sahiChunks = sahiRawChunks.map(chunk => ({
        id: chunk.id,
        articleNumber: chunk.metadata.articleNumber,
        text: `[Constitution of Pakistan, Part ${chunk.metadata.part || 'N/A'}, Chapter ${chunk.metadata.chapter || 'N/A'}, Article ${chunk.metadata.articleNumber}] ${chunk.metadata.heading}: ${chunk.text}`
    }));
    
    // Generate Flat Chunks (approx 1200 characters, no structural annotations)
    const flatChunks = [];
    const charWindow = 1200;
    const overlap = 200;
    let flatIdx = 0;
    for (let i = 0; i < rawText.length; i += (charWindow - overlap)) {
        const textSegment = rawText.substring(i, i + charWindow).trim();
        if (textSegment.length < 50) continue;
        
        let belongsToArticle = "UNKNOWN";
        const articleMatches = textSegment.match(/(?:^|\n)\s*(\d+[A-Z]*)\.\s+([A-Z][\w\s]+)/);
        if (articleMatches) {
            belongsToArticle = articleMatches[1];
        } else {
            const precedingText = rawText.substring(0, i);
            const matches = precedingText.match(/(?:^|\n)\s*(\d+[A-Z]*)\.\s+([A-Z][\w\s]+)/g);
            if (matches && matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const parts = lastMatch.match(/(\d+[A-Z]*)\./);
                if (parts) belongsToArticle = parts[1];
            }
        }
        
        flatChunks.push({
            id: `flat_chunk_${flatIdx++}`,
            articleNumber: belongsToArticle,
            text: textSegment
        });
    }
    
    console.log(`✅ Loaded: SAHI Chunks = ${sahiChunks.length}, Flat Chunks = ${flatChunks.length}`);
    
    // 2. Pre-calculate subword character n-grams for Cosine Similarity
    console.log('\n🧠 Step 2: Preparing local subword vectors...');
    sahiChunks.forEach(c => c.ngrams = getCharNGrams(c.text));
    flatChunks.forEach(c => c.ngrams = getCharNGrams(c.text));
    EVAL_SUITE.forEach(item => item.ngrams = getCharNGrams(item.query));
    
    // 3. Build BM25 Indexers
    console.log('\n📝 Step 3: Fitting Lexical indexers (BM25)...');
    const flatBM25 = new BM25Indexer();
    flatBM25.fit(flatChunks);
    
    const sahiBM25 = new BM25Indexer();
    sahiBM25.fit(sahiChunks);
    
    // 4. Run Retrieval and Metrics Calculation
    console.log('\n🔍 Step 4: Running retrieval evaluation...');
    
    const CONFIGURATIONS = [
        { name: "Flat Lexical Only", isSahi: false, isLexical: true, isDense: false, indexer: flatBM25 },
        { name: "Flat Dense Only", isSahi: false, isLexical: false, isDense: true, chunks: flatChunks },
        { name: "Flat Hybrid (Lexical + Dense)", isSahi: false, isLexical: true, isDense: true, indexer: flatBM25, chunks: flatChunks },
        { name: "SAHI Lexical Only", isSahi: true, isLexical: true, isDense: false, indexer: sahiBM25 },
        { name: "SAHI Dense Only", isSahi: true, isLexical: false, isDense: true, chunks: sahiChunks },
        { name: "Legalyze Full (SAHI + Hybrid + RRF)", isSahi: true, isLexical: true, isDense: true, indexer: sahiBM25, chunks: sahiChunks }
    ];
    
    const results = CONFIGURATIONS.map(config => {
        let recall5Count = 0;
        let recall10Count = 0;
        let mrrSum = 0;
        let ndcg5Sum = 0;
        let ndcg10Sum = 0;
        
        EVAL_SUITE.forEach(item => {
            let finalRanked = [];
            
            if (config.isLexical && !config.isDense) {
                // Lexical only
                finalRanked = config.indexer.search(item.query, 10);
            } else if (!config.isLexical && config.isDense) {
                // Dense VSM only
                const scored = config.chunks.map(chunk => ({
                    id: chunk.id,
                    articleNumber: chunk.articleNumber,
                    score: calculateNGramSimilarity(item.ngrams, chunk.ngrams)
                }));
                finalRanked = scored.sort((a, b) => b.score - a.score).slice(0, 10);
            } else if (config.isLexical && config.isDense) {
                // Hybrid
                const lexicalRank = config.indexer.search(item.query, 20);
                const denseScored = config.chunks.map(chunk => ({
                    id: chunk.id,
                    articleNumber: chunk.articleNumber,
                    score: calculateNGramSimilarity(item.ngrams, chunk.ngrams)
                }));
                const denseRank = denseScored.sort((a, b) => b.score - a.score).slice(0, 20);
                
                finalRanked = fuseRankings(lexicalRank, denseRank, 60).slice(0, 10);
            }
            
            // Check rank of target article
            let rank = 0;
            for (let r = 0; r < finalRanked.length; r++) {
                if (finalRanked[r].articleNumber === item.target) {
                    rank = r + 1;
                    break;
                }
            }
            
            if (rank > 0 && rank <= 5) recall5Count++;
            if (rank > 0 && rank <= 10) recall10Count++;
            if (rank > 0) mrrSum += 1 / rank;
            
            let dcg5 = 0;
            let dcg10 = 0;
            if (rank > 0 && rank <= 5) dcg5 = 1 / Math.log2(rank + 1);
            if (rank > 0 && rank <= 10) dcg10 = 1 / Math.log2(rank + 1);
            
            const idcg = 1.0; // 1 relevant doc
            ndcg5Sum += dcg5 / idcg;
            ndcg10Sum += dcg10 / idcg;
        });
        
        const N = EVAL_SUITE.length;
        const recall5 = (recall5Count / N * 100).toFixed(1);
        const recall10 = (recall10Count / N * 100).toFixed(1);
        const precision5 = ((recall5Count / (N * 5)) * 100).toFixed(1);
        const mrr = (mrrSum / N).toFixed(3);
        const ndcg5 = (ndcg5Sum / N).toFixed(3);
        const ndcg10 = (ndcg10Sum / N).toFixed(3);
        
        return {
            name: config.name,
            recall5: parseFloat(recall5),
            recall10: parseFloat(recall10),
            precision5: parseFloat(precision5),
            mrr: parseFloat(mrr),
            ndcg5: parseFloat(ndcg5),
            ndcg10: parseFloat(ndcg10)
        };
    });
    
    // 5. Print Results Table
    console.log('\n' + '='.repeat(90));
    console.log('RESULTS TABLE (LOCAL DETERMINISTIC MODELS)');
    console.log('='*90);
    console.log(`${'Configuration'.padEnd(35)} | Recall@5 | Recall@10 | Precision@5 | MRR   | nDCG@5 | nDCG@10`);
    console.log('-'.repeat(90));
    results.forEach(r => {
        console.log(`${r.name.padEnd(35)} | ${r.recall5.toFixed(1)}%     | ${r.recall10.toFixed(1)}%      | ${r.precision5.toFixed(1)}%        | ${r.mrr.toFixed(3)} | ${r.ndcg5.toFixed(3)}  | ${r.ndcg10.toFixed(3)}`);
    });
    console.log('='.repeat(90));
    
    const outPath = path.join(__dirname, 'ablation_results.json');
    fs.writeFileSync(outPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        numQueries: EVAL_SUITE.length,
        results
    }, null, 2));
    console.log(`\n📁 Results saved to: ${outPath}`);
    process.exit(0);
}

runAblation().catch(err => {
    console.error(err);
    process.exit(1);
});
