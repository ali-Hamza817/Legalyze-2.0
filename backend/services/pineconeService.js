const { Pinecone } = require('@pinecone-database/pinecone');

// Lazy initialization of Pinecone client
let pinecone = null;
let isInitialized = false;

/**
 * Initialize Pinecone client (lazy loading)
 */
function initializePinecone() {
    if (isInitialized && pinecone) {
        return pinecone;
    }
    
    const apiKey = process.env.PINECONE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('PINECONE_API_KEY is not configured. Please set it in your .env file.');
    }
    
    pinecone = new Pinecone({
        apiKey: apiKey
    });
    isInitialized = true;
    return pinecone;
}

/**
 * Get the Pinecone index instance
 */
function getIndex() {
    const client = initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME?.trim() || 'legal-documents';
    return client.index(indexName);
}

/**
 * Upsert document chunks as vectors to Pinecone
 * @param {string} documentId - MongoDB document ID
 * @param {string} documentName - Original document name
 * @param {string} userId - User ID for filtering
 * @param {Array} chunks - Array of chunks with text and embedding
 * @param {string} namespace - Optional namespace (default: 'user-uploads')
 */
async function upsertVectors(documentId, documentName, userId, chunks, namespace = 'user-uploads') {
    try {
        const index = getIndex();
        
        console.log('--- PINECONE UPSERT DEBUG ---');
        console.log(`DocumentId: ${documentId}`);
        console.log(`UserId being stored: ${userId.toString()}`);
        console.log(`Namespace: ${namespace}`);
        console.log(`Chunk count: ${chunks.length}`);
        console.log('-----------------------------');
        
        // Prepare vectors for upsert
        const vectors = chunks.map((chunk, index) => ({
            id: `${documentId}_chunk_${chunk.chunkIndex}`,
            values: chunk.embedding,
            metadata: {
                userId: userId.toString(),
                documentId: documentId.toString(),
                documentName: documentName,
                chunkIndex: chunk.chunkIndex,
                text: chunk.text.substring(0, 40000), // Pinecone metadata limit
                ...(chunk.metadata || {})
            }
        }));

        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.namespace(namespace).upsert(batch);
        }

        console.log(`✅ Upserted ${vectors.length} vectors for document ${documentId} to namespace: ${namespace}`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone upsert error:', error);
        throw new Error(`Failed to upsert vectors to Pinecone: ${error.message}`);
    }
}

/**
 * Query Pinecone for similar vectors
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {number} topK - Number of results to return
 * @param {string} userId - User ID for filtering
 * @param {Array} documentIds - Optional array of document IDs to filter by
 * @param {string} chatId - Optional chat ID
 * @param {string} namespace - Optional namespace (default: 'user-uploads')
 */
async function queryVectors(queryEmbedding, topK = 5, userId, documentIds = null, chatId = null, namespace = 'user-uploads') {
    try {
        const index = getIndex();
        
        // Build filter - CRITICAL for RAG accuracy
        const filter = { userId: userId.toString() };
        
        console.log('--- PINECONE QUERY DEBUG ---');
        console.log(`Namespace: ${namespace}`);
        console.log(`UserId Filter: ${filter.userId}`);
        
        if (documentIds && documentIds.length > 0) {
            filter.documentId = { $in: documentIds.map(id => id.toString()) };
            console.log(`Document IDs Filter: ${JSON.stringify(filter.documentId.$in)}`);
        } else if (chatId) {
            filter.chatId = chatId.toString();
            console.log(`Chat ID Filter: ${filter.chatId}`);
        }
        console.log(`Full Filter: ${JSON.stringify(filter)}`);
        console.log('----------------------------');

        // Query Pinecone
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
            filter: filter
        });

        // Format results to match existing structure
        const relevantChunks = queryResponse.matches.map(match => ({
            documentId: match.metadata.documentId,
            documentName: match.metadata.documentName,
            text: match.metadata.text,
            chunkIndex: match.metadata.chunkIndex,
            similarity: match.score
        }));

        console.log(`🔍 Found ${relevantChunks.length} relevant chunks from Pinecone`);
        return relevantChunks;
        
    } catch (error) {
        console.error('❌ Pinecone query error:', error);
        throw new Error(`Failed to query vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Delete all vectors for a document
 * @param {string} documentId - MongoDB document ID
 * @param {string} namespace - Optional namespace (default: 'user-uploads')
 */
async function deleteVectors(documentId, namespace = 'user-uploads') {
    try {
        const index = getIndex();
        
        // Delete by filter (all chunks for this document)
        await index.namespace(namespace).deleteMany({
            documentId: documentId.toString()
        });

        console.log(`🗑️  Deleted all vectors for document ${documentId} from namespace: ${namespace}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Pinecone delete error:', error);
        throw new Error(`Failed to delete vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Delete all vectors for a user (utility function)
 * @param {string} userId - User ID
 */
async function deleteUserVectors(userId) {
    try {
        const index = getIndex();
        
        // Delete by filter (all vectors for this user)
        await index.deleteMany({
            userId: userId.toString()
        });

        console.log(`🗑️  Deleted all vectors for user ${userId}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Pinecone delete user vectors error:', error);
        throw new Error(`Failed to delete user vectors from Pinecone: ${error.message}`);
    }
}

/**
 * Get vector count for a document
 * @param {string} documentId - MongoDB document ID
 */
async function getDocumentVectorCount(documentId) {
    try {
        const index = getIndex();
        
        // Query with zero vector to get count (we only care about metadata)
        const stats = await index.describeIndexStats();
        
        // Note: Pinecone doesn't provide exact counts per metadata filter easily
        // This is a limitation - we'll trust our MongoDB chunkCount field
        return { success: true, note: 'Use MongoDB chunkCount field for accurate count' };
        
    } catch (error) {
        console.error('❌ Pinecone stats error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Query Constitution namespace for constitutional articles
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {number} topK - Number of results to return
 */
async function queryConstitution(queryEmbedding, topK = 10) {
    try {
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        // Query Constitution namespace (no user filtering needed)
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });

        // Format results with constitutional metadata
        const articles = queryResponse.matches.map(match => ({
            articleNumber: match.metadata.articleNumber,
            heading: match.metadata.heading,
            part: match.metadata.part,
            partName: match.metadata.partName,
            chapter: match.metadata.chapter,
            text: match.metadata.text,
            similarity: match.score,
            id: match.id
        }));

        console.log(`🏛️  Found ${articles.length} relevant constitutional articles`);
        return articles;
        
    } catch (error) {
        console.error('❌ Pinecone Constitution query error:', error);
        throw new Error(`Failed to query Constitution from Pinecone: ${error.message}`);
    }
}

/**
 * Query Authoritative Laws namespace for legal provisions
 * @param {Array} queryEmbedding - Query vector embedding
 * @param {number} topK - Number of results to return
 */
async function queryAuthoritativeLaws(queryEmbedding, topK = 15) {
    try {
        const index = getIndex();
        const namespace = 'authoritative-laws';
        
        // Query authoritative-laws namespace
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });

        // Format results with legal metadata
        const results = queryResponse.matches.map(match => ({
            source: match.metadata.source,
            shortName: match.metadata.shortName,
            sectionType: match.metadata.sectionType,
            sectionNumber: match.metadata.sectionNumber,
            fullCitation: match.metadata.fullCitation,
            text: match.metadata.text,
            isAuthoritative: match.metadata.isAuthoritative,
            lawType: match.metadata.lawType,
            similarity: match.score,
            id: match.id
        }));

        console.log(`⚖️  Found ${results.length} relevant legal provisions from authoritative-laws`);
        return results;
        
    } catch (error) {
        console.error('❌ Pinecone authoritative laws query error:', error);
        throw new Error(`Failed to query authoritative laws: ${error.message}`);
    }
}

/**
 * Upsert Constitution articles to Pinecone namespace
 * @param {Array} vectors - Array of vectors with metadata
 */
async function upsertConstitution(vectors) {
    try {
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.namespace(namespace).upsert(batch);
        }

        console.log(`✅ Upserted ${vectors.length} Constitution articles to Pinecone`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone Constitution upsert error:', error);
        throw new Error(`Failed to upsert Constitution to Pinecone: ${error.message}`);
    }
}

/**
 * Query constitution index with full provenance metadata
 * Used by compliance matching engine
 */
async function queryConstitutionWithProvenance(queryText, topK = 5) {
    try {
        const { generateEmbedding } = require('../utils/documentProcessor');
        const queryEmbedding = await generateEmbedding(queryText);
        
        const index = getIndex();
        const namespace = 'constitution-pakistan';
        
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });
        
        return queryResponse.matches || [];
    } catch (error) {
        console.error('Error querying constitution with provenance:', error);
        return [];
    }
}

/**
 * Upsert raw vectors directly to Pinecone (used for judgment indexing)
 * @param {Array} vectors - Array of { id, values, metadata }
 * @param {string} namespace - Optional namespace
 */
async function upsertRawVectors(vectors, namespace = null) {
    try {
        const index = getIndex();
        
        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            if (namespace) {
                await index.namespace(namespace).upsert(batch);
            } else {
                await index.upsert(batch);
            }
        }

        console.log(`✅ Upserted ${vectors.length} raw vectors to Pinecone`);
        return { success: true, vectorCount: vectors.length };
        
    } catch (error) {
        console.error('❌ Pinecone raw upsert error:', error);
        throw new Error(`Failed to upsert raw vectors: ${error.message}`);
    }
}

/**
 * Query vectors with custom filter (used for judgment search)
 * @param {Array} queryEmbedding - Query vector
 * @param {number} topK - Number of results
 * @param {Object} filter - Custom filter object
 * @param {string} namespace - Optional namespace
 */
async function queryVectorsWithFilter(queryEmbedding, topK = 10, filter = {}, namespace = null) {
    try {
        const index = getIndex();
        
        const queryOptions = {
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        };

        if (filter && Object.keys(filter).length > 0) {
            queryOptions.filter = filter;
        }

        let queryResponse;
        if (namespace) {
            queryResponse = await index.namespace(namespace).query(queryOptions);
        } else {
            queryResponse = await index.query(queryOptions);
        }

        return queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            metadata: match.metadata
        }));
        
    } catch (error) {
        console.error('❌ Pinecone query with filter error:', error);
        throw new Error(`Failed to query with filter: ${error.message}`);
    }
}

module.exports = {
    upsertVectors,
    queryVectors,
    deleteVectors,
    deleteUserVectors,
    getDocumentVectorCount,
    queryConstitution,
    upsertConstitution,
    queryConstitutionWithProvenance,
    upsertRawVectors,
    queryVectorsWithFilter,
    queryAuthoritativeLaws
};
