const openai = require('../config/openai');
const pineconeService = require('./pineconeService');
const { generateEmbedding } = require('../utils/documentProcessor');
const { getPakistanSystemPrompt, detectCaseType } = require('./pakistanLegalPrompts');

/**
 * LegalAgentService
 * Agentic Orchestrator for Pakistani Legal RAG
 */
class LegalAgentService {
    /**
     * Main entry point for agentic processing
     * @param {string} userQuery - The user's legal query
     * @param {Object} options - Context options (conversationId, documentIds, etc.)
     */
    static async processQuery(userQuery, options = {}) {
        const { conversationId, documentIds = [], userId, history = [] } = options;
        
        console.log(`🤖 Agentic Service processing query: "${userQuery.substring(0, 50)}..."`);

        // 1. Intent Classification & Routing
        const routing = await this.classifyAndRoute(userQuery, history);
        console.log(`🎯 Route: ${routing.route} | Domain: ${routing.domain}`);

        // 2. Parallel Information Retrieval
        const retrievalTasks = [];
        
        // Tool 1: Authoritative Laws (Global Library)
        if (routing.tools.includes('authoritative-laws')) {
            retrievalTasks.push(this.retrieveAuthoritativeLaws(userQuery));
        }
        
        // Tool 2: Precedents (Supreme Court Judgments)
        if (routing.tools.includes('precedents')) {
            const searchService = require('./searchService');
            retrievalTasks.push(searchService.intelligentSearch(userQuery, {}, 3));
        }
        
        // Tool 3: User Documents (Case Context)
        // FORCE CHECK if documentIds are present (Explicit user intent or auto-resolved)
        if (documentIds.length > 0 || (conversationId && routing.tools.includes('user-documents'))) {
            console.log(`🔍 Force-checking User Documents: ${documentIds.length} docs found`);
            retrievalTasks.push(this.retrieveUserContext(userQuery, userId, documentIds, conversationId));
        }

        const retrievalResults = await Promise.all(retrievalTasks);
        
        // DEBUG: Log all retrieval results
        console.log('--- RETRIEVAL RESULTS DEBUG ---');
        retrievalResults.forEach((res, idx) => {
            console.log(`Result ${idx}: type=${res?.type}, dataCount=${res?.data?.length || 0}`);
            if (res?.data?.length > 0) {
                console.log(`  Sample: ${res.data[0]?.text?.substring(0, 100)}...`);
            }
        });
        console.log('-------------------------------');
        
        // 3. Context Synthesis
        const aggregatedContext = this.formatContext(retrievalResults, routing.tools);
        
        // DEBUG: Log the formatted context
        console.log('--- FORMATTED CONTEXT DEBUG ---');
        console.log(`Context length: ${aggregatedContext?.length || 0}`);
        console.log(`Context preview: ${aggregatedContext?.substring(0, 500)}...`);
        console.log('-------------------------------');

        // 4. Final Response Generation
        return await this.generateAgenticResponse(userQuery, aggregatedContext, routing, history, options);
    }

    /**
     * Classify intent to determine which tools to use
     */
    static async classifyAndRoute(query, history) {
        const prompt = `Analyze the user's legal query and determine the best RAG retrieval strategy.
        
QUERY: "${query}"

DOMAINS: criminal, constitutional, civil, family, business, general
STAGES: intake, research, compliance, drafting

PETITION TYPES: 
- WRIT_PETITION_199 (Use for fundamental rights violation, High Court jurisdiction, challenging govt/public body decisions, seeking stay orders against state actions)
- BAIL_APPLICATION_497 (Use for seeking release from custody, arrests, FIR related criminal matters)
- CIVIL_SUIT (Use for recovery of money, property disputes between private parties, specific performance of contract)

RESPONSE FORMAT: JSON
{
  "route": "research" | "compliance" | "intake",
  "domain": "criminal" | "constitutional" | "civil" | "family",
  "tools": ["authoritative-laws", "precedents", "user-documents"],
  "suggestedTemplateId": "WRIT_PETITION_199" | "BAIL_APPLICATION_497" | "CIVIL_SUIT" | null,
  "reasoning": "Briefly explain jurisdictional and procedural choice"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a legal dispatcher for the Legalyze Pakistan system." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    }

    /**
     * Retrieve from Global Legal Library
     */
    static async retrieveAuthoritativeLaws(query) {
        const embedding = await generateEmbedding(query);
        const results = await pineconeService.queryVectorsWithFilter(
            embedding,
            5,
            { isAuthoritative: true },
            'authoritative-laws'
        );
        return { type: 'laws', data: results };
    }

    /**
     * Retrieve from User's uploaded documents
     */
    static async retrieveUserContext(query, userId, documentIds, chatId) {
        console.log('--- RETRIEVE USER CONTEXT DEBUG ---');
        console.log(`UserId: ${userId}`);
        console.log(`DocumentIds: ${JSON.stringify(documentIds)}`);
        console.log(`ChatId: ${chatId}`);
        console.log('-----------------------------------');
        
        let results = [];
        
        // Try Pinecone first, but gracefully handle failures
        try {
            const embedding = await generateEmbedding(query);
            results = await pineconeService.queryVectors(
                embedding,
                5,
                userId,
                documentIds,
                chatId,
                'user-uploads'
            );
            console.log(`📄 Retrieved ${results.length} chunks from Pinecone`);
        } catch (pineconeError) {
            console.error(`⚠️ Pinecone query failed, falling back to MongoDB/S3: ${pineconeError.message}`);
            // Continue with fallback - results stays empty
        }
        
        // === FALLBACK: If Pinecone returns 0 chunks, read from MongoDB directly ===
        if (results.length === 0 && documentIds && documentIds.length > 0) {
            console.log('⚠️ Pinecone returned 0 chunks. Attempting MongoDB fallback...');
            const Document = require('../models/Document');
            
            try {
                // First try: Documents with extractedText already available
                const docs = await Document.find({ 
                    _id: { $in: documentIds },
                    extractedText: { $exists: true, $ne: '' }
                }).select('originalName extractedText');
                
                if (docs.length > 0) {
                    console.log(`✅ MongoDB Fallback: Found ${docs.length} documents with extracted text`);
                    return {
                        type: 'user-docs',
                        data: docs.map(doc => ({
                            documentId: doc._id.toString(),
                            documentName: doc.originalName,
                            text: doc.extractedText.substring(0, 15000),
                            chunkIndex: 0,
                            similarity: 1.0,
                            source: 'mongodb-fallback'
                        }))
                    };
                }
                
                // Second try: Live extraction from S3 for documents without extractedText
                console.log('⚠️ No extractedText found. Attempting S3 live extraction...');
                const docsWithS3 = await Document.find({ 
                    _id: { $in: documentIds },
                    s3Key: { $exists: true, $ne: '' }
                }).select('originalName s3Key mimeType');
                
                if (docsWithS3.length > 0) {
                    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
                    const { extractText } = require('../utils/documentProcessor');
                    
                    const s3Client = new S3Client({
                        region: process.env.AWS_REGION,
                        credentials: {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                        }
                    });
                    
                    const extractedDocs = [];
                    
                    for (const doc of docsWithS3) {
                        try {
                            console.log(`📥 Fetching from S3: ${doc.s3Key}`);
                            const response = await s3Client.send(new GetObjectCommand({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: doc.s3Key
                            }));
                            
                            const chunks = [];
                            for await (const chunk of response.Body) {
                                chunks.push(chunk);
                            }
                            const buffer = Buffer.concat(chunks);
                            
                            // Determine mimeType
                            const mimeType = doc.mimeType || 
                                (doc.s3Key.endsWith('.pdf') ? 'application/pdf' : 
                                 doc.s3Key.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                                 'application/pdf');
                            
                            const text = await extractText(buffer, mimeType);
                            
                            if (text && text.trim().length > 0) {
                                console.log(`✅ Live extracted ${text.length} chars from ${doc.originalName}`);
                                
                                // Save for future use
                                await Document.findByIdAndUpdate(doc._id, { extractedText: text });
                                
                                extractedDocs.push({
                                    documentId: doc._id.toString(),
                                    documentName: doc.originalName,
                                    text: text.substring(0, 15000),
                                    chunkIndex: 0,
                                    similarity: 1.0,
                                    source: 's3-live-extraction'
                                });
                            }
                        } catch (s3Err) {
                            console.error(`❌ S3 extraction failed for ${doc.originalName}:`, s3Err.message);
                        }
                    }
                    
                    if (extractedDocs.length > 0) {
                        return { type: 'user-docs', data: extractedDocs };
                    }
                }
                
            } catch (err) {
                console.error('❌ MongoDB/S3 fallback error:', err);
            }
        }
        
        if (results.length > 0) {
            console.log(`First chunk preview: ${results[0].text?.substring(0, 100)}...`);
        }
        
        return { type: 'user-docs', data: results };
    }

    /**
     * Format aggregated context for the LLM
     */
    static formatContext(results, tools) {
        let formatted = "=== AGENTIC RAG CONTEXT ===\n\n";
        
        results.forEach(res => {
            if (res.type === 'laws') {
                formatted += "--- AUTHORITATIVE PAKISTANI STATUTES ---\n";
                res.data.forEach(match => {
                    formatted += `[Source: ${match.metadata.source}]\nContent: ${match.metadata.text}\n\n`;
                });
            } else if (res.type === 'user-docs') {
                formatted += "--- USER CASE CONTEXT (Uploaded Documents) ---\n";
                res.data.forEach(match => {
                    formatted += `[Document: ${match.documentName}]\nExcerpt: ${match.text}\n\n`;
                });
            } else if (res.summary) { // Intelligent Search result
                formatted += "--- SUPREME COURT PRECEDENTS ---\n";
                formatted += `Summary: ${res.summary}\n`;
                res.results.forEach(j => {
                    formatted += `[Precedent: ${j.caseTitle} (${j.citation})]\nRatio: ${j.ratio}\n\n`;
                });
            }
        });

        return formatted;
    }

    /**
     * Generate the final cited response
     */
    static async generateAgenticResponse(query, context, routing, history, options) {
        // Now awaiting the dynamic prompt from DB
        const systemPrompt = await getPakistanSystemPrompt({
            caseType: routing.domain,
            hasDocumentContext: routing.tools.includes('user-documents')
        });

        // DEBUG: Inject Context directly into User Message for stronger attention
        let finalUserMessage = query;
        if (context && context.includes('USER CASE CONTEXT')) {
             console.log('📝 Injecting Document Context into User Message Block for Reliability...');
             finalUserMessage = `${context}\n\nUSER QUESTION: ${query}`;
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-5),
            { role: "user", content: finalUserMessage }
        ];

        console.log('--- DEBUG: GENERATE RESPONSE MESSAGES ---');
        console.log(JSON.stringify(messages, null, 2));
        console.log('-----------------------------------------');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.2, // Consistent, factual
            max_tokens: 2000
        });

        return {
            content: completion.choices[0].message.content,
            metadata: {
                route: routing.route,
                domain: routing.domain,
                toolsUsed: routing.tools,
                suggestedTemplateId: routing.suggestedTemplateId
            }
        };
    }
}

module.exports = LegalAgentService;
