/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most relevant chunks from documents based on query embedding
 */
function findRelevantChunks(documents, queryEmbedding, topK = 5) {
    const allChunks = [];
    
    // Collect all chunks from all documents
    for (const doc of documents) {
        for (const chunk of doc.chunks) {
            allChunks.push({
                documentId: doc._id,
                documentName: doc.originalName,
                text: chunk.text,
                embedding: chunk.embedding,
                chunkIndex: chunk.chunkIndex
            });
        }
    }
    
    // Calculate similarity for each chunk
    const chunksWithScores = allChunks.map(chunk => ({
        ...chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));
    
    // Sort by similarity (descending) and take top K
    chunksWithScores.sort((a, b) => b.similarity - a.similarity);
    
    return chunksWithScores.slice(0, topK);
}

module.exports = {
    cosineSimilarity,
    findRelevantChunks
};
