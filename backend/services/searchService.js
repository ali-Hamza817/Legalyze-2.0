const Judgment = require('../models/Judgment');
const pineconeService = require('./pineconeService');
const openai = require('../config/openai');
const { generateEmbedding } = require('../utils/documentProcessor');

/**
 * Legalyze Hybrid Search Service
 * Combines MongoDB Text Search (Keyword) with Pinecone Vector Search (Semantic)
 * Fixes Limitation #2: "Shallow Retrieval"
 */

/**
 * Perform Hybrid Search for Judgments
 * @param {string} query - The search query
 * @param {Object} filters - Optional filters (court, year, etc.)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Merged and ranked judgments
 */
async function hybridSearch(query, filters = {}, limit = 20) {
    try {
        console.log(`🔍 Starting Hybrid Search for: "${query}"`);

        // 1. Generate Embedding for Semantic Search
        const queryEmbedding = await generateEmbedding(query);

        // 2. Run Searches with Timeout and Fallback
        let keywordResults = [];
        let vectorResults = [];

        try {
            // Run Keyword Search and Vector Search (with timeout)
            const keywordPromise = Judgment.find(
                { $text: { $search: query } },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .lean();

            // Vector search timeout promise (5 seconds)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Vector Search Timeout')), 5000)
            );

            const vectorPromise = pineconeService.queryVectorsWithFilter(
                queryEmbedding, 
                limit, 
                filters, 
                'judgments'
            );

            // Execute parallel searches
            [keywordResults, vectorResults] = await Promise.all([
                keywordPromise,
                Promise.race([vectorPromise, timeoutPromise]).catch(err => {
                    console.warn('⚠️ Vector Search failed or timed out, falling back to keyword search only:', err.message);
                    return []; // Return empty vector results on failure
                })
            ]);

        } catch (innerError) {
            console.error('❌ Inner Search Error:', innerError);
            // If primary search fails, try a very simple keyword search as last resort
            keywordResults = await Judgment.find({ $text: { $search: query } }).limit(limit).lean();
        }

        console.log(`📊 Raw Results - Keyword: ${keywordResults.length}, Vector: ${vectorResults.length}`);

        // 3. Merge & Rank Results
        const mergedResults = mergeResults(keywordResults, vectorResults);

        // 4. Fetch full details for vector-only matches
        const finalResults = await hydrateResults(mergedResults);

        return finalResults.slice(0, limit);

    } catch (error) {
        console.error('❌ Hybrid Search Error:', error);
        throw error;
    }
}

/**
 * Merge Keyword and Vector results using Reciprocal Rank Fusion (simplified)
 */
function mergeResults(keywordResults, vectorResults) {
    const resultMap = new Map();

    // Process Keyword Results (High value for citations)
    keywordResults.forEach((doc, index) => {
        // Normalize score: 1.0 down to 0.5 based on rank
        const rankScore = 1.0 - (index / (keywordResults.length + 1)) * 0.5;
        resultMap.set(doc._id.toString(), {
            id: doc._id.toString(),
            doc: doc,
            score: rankScore,
            source: 'keyword'
        });
    });

    // Process Vector Results
    vectorResults.forEach((match, index) => {
        // Vector match.id is the MongoDB _id
        const existing = resultMap.get(match.id);
        
        // Normalize score from Pinecone (usually 0.7-0.9 for good matches)
        const vectorScore = match.score || 0;

        if (existing) {
            // Boost score if found in BOTH (Hybrid Hit!)
            existing.score += vectorScore;
            existing.source = 'hybrid';
            existing.vectorScore = vectorScore;
        } else {
            resultMap.set(match.id, {
                id: match.id,
                // Result needs detailed hydration later
                score: vectorScore, 
                source: 'vector'
            });
        }
    });

    // Convert to array and sort by score
    return Array.from(resultMap.values())
        .sort((a, b) => b.score - a.score);
}

/**
 * Hydrate results that only came from Vector Store (fetch full doc from Mongo)
 */
async function hydrateResults(mergedItems) {
    const vectorOnlyIds = mergedItems
        .filter(item => !item.doc) // No doc populated yet
        .map(item => item.id);

    let hydratedDocs = [];
    if (vectorOnlyIds.length > 0) {
        hydratedDocs = await Judgment.find({ _id: { $in: vectorOnlyIds } }).lean();
    }

    // Map back to mergedItems
    return mergedItems.map(item => {
        let fullDoc = item.doc;
        if (!fullDoc) {
            fullDoc = hydratedDocs.find(d => d._id.toString() === item.id);
        }
        
        if (!fullDoc) return null; // Logic error or deleted doc

        return {
            ...fullDoc,
            searchScore: item.score.toFixed(3),
            matchType: item.source // 'keyword', 'vector', or 'hybrid'
        };
    }).filter(item => item !== null);
}

/**
 * Perform Intelligent Search (Hybrid + AI Re-ranking/Explanation)
 */
async function intelligentSearch(query, filters = {}, limit = 5) {
    const startTime = Date.now();
    try {
        // 1. Get Hybrid Search Results (Top 15 to allow room for AI re-ranking)
        const hybridResults = await hybridSearch(query, filters, 15);
        
        if (hybridResults.length === 0) {
            return {
                summary: "No relevant judgments were found in the database matching your specific criteria.",
                results: [],
                metadata: { latency: Date.now() - startTime, sources: ['hybrid'] }
            };
        }

        // 2. AI Re-ranking & Summarization
        const summaryPrompt = `Analyze these legal judgments against the user's case query.
        
QUERY: "${query}"

JUDGMENTS:
${hybridResults.map((j, i) => `${i+1}. [${j.citation}] ${j.caseTitle}: ${j.ratio?.substring(0, 300)}...`).join('\n')}

TASK:
1. Re-rank the top 3-5 most relevant judgments.
2. For each, provide a "matchReason" explaining why it's crucial for THIS case.
3. Write a 2-sentence "overallSummary" of the legal landscape for this query.

Return ONLY a JSON object:
{
  "overallSummary": "...",
  "rankedResults": [
    { "citation": "...", "matchReason": "...", "priority": 1-5 }
  ]
}`;

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "You are an expert Pakistani Legal Researcher." }, { role: "user", content: summaryPrompt }],
            response_format: { type: "json_object" }
        });

        const aiData = JSON.parse(aiResponse.choices[0].message.content);

        // 3. Map AI Re-ranking back to full document data
        const intelligentResults = aiData.rankedResults.map(ranked => {
            const original = hybridResults.find(h => h.citation === ranked.citation);
            if (!original) return null;
            return {
                ...original,
                matchReason: ranked.matchReason,
                priority: ranked.priority
            };
        }).filter(r => r !== null);

        return {
            summary: aiData.overallSummary,
            results: intelligentResults,
            metadata: {
                latency: Date.now() - startTime,
                sources: ['keyword', 'vector', 'ai'],
                totalScanned: hybridResults.length
            }
        };

    } catch (error) {
        console.error('Intelligent Search Error:', error);
        // Fallback to basic hybrid if AI fails
        const results = await hybridSearch(query, filters, limit);
        return {
            summary: "Search completed via hybrid engine (AI enhancement unavailable).",
            results,
            metadata: { latency: Date.now() - startTime, sources: ['hybrid'], error: error.message }
        };
    }
}

module.exports = {
    hybridSearch,
    intelligentSearch
};
