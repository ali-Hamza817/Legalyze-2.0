const { queryConstitutionWithProvenance } = require('./pineconeService');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Compliance Matching Engine
 * Core logic for sentence-level constitutional compliance checking
 * Provides YES/NO/PARTIAL decisions with confidence scores and provenance
 */

/**
 * Match a sentence from uploaded document to authoritative legal provisions
 * @param {Object} sentence - Sentence object with text and metadata
 * @param {number} topK - Number of top matches to retrieve
 * @returns {Array} - Array of matches with legal provisions
 */
async function matchSentenceToAuthoritativeLaws(sentence, topK = 5) {
    try {
        const { generateEmbedding } = require('../utils/documentProcessor');
        const { queryVectorsWithFilter } = require('./pineconeService');
        
        const queryEmbedding = await generateEmbedding(sentence.text);
        
        // Query Authoritative Laws namespace for semantically similar provisions
        const results = await queryVectorsWithFilter(
            queryEmbedding, 
            topK, 
            { isAuthoritative: true }, 
            'authoritative-laws'
        );
        
        return results.map(match => ({
            legalText: match.metadata.text,
            article: match.metadata.sectionNumber || "N/A",
            sectionType: match.metadata.sectionType || "Section",
            fullCitation: match.metadata.fullCitation || `${match.metadata.shortName} Section ${match.metadata.sectionNumber}`,
            shortName: match.metadata.shortName,
            source: match.metadata.source,
            lawType: match.metadata.lawType,
            similarity_score: match.score,
            pineconeId: match.id
        }));
    } catch (error) {
        console.error('Error matching sentence to authoritative laws:', error);
        return [];
    }
}

/**
 * Determine compliance decision: YES, NO, or PARTIAL
 * Uses GPT-4 for nuanced legal analysis
 */
async function determineCompliance(uploadedText, lawMatch, context = {}) {
    try {
        const prompt = `You are Pakistan's leading legal expert. Analyze whether the uploaded document text complies with the Authoritative Law.
        
UPLOADED DOCUMENT TEXT:
"${uploadedText}"

RELEVANT LEGAL PROVISION:
${lawMatch.fullCitation}: ${lawMatch.source}
"${lawMatch.legalText}"

INSTRUCTIONS:
1. Determine if the uploaded text is:
   - YES: Fully compliant (aligns with or upholds the legal provision)
   - NO: Non-compliant (contradicts or violates the legal provision)
   - PARTIAL: Partially compliant (some alignment but with gaps, ambiguities, or conditions)

2. Provide a 1-2 sentence rationale explaining your decision. Cite the specific law (e.g., PPC, Constitution, CrPC).

3. Assign a confidence score (0-100).

Return ONLY valid JSON:
{
  "decision": "YES|NO|PARTIAL",
  "confidence": 0-100,
  "rationale": "brief explanation citing ${lawMatch.shortName}"
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a legal expert providing precise, factual compliance analysis. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 500,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Validate result
        if (!['YES', 'NO', 'PARTIAL'].includes(result.decision)) {
            throw new Error('Invalid decision value');
        }
        
        return {
            decision: result.decision,
            confidence: Math.min(100, Math.max(0, result.confidence || 70)),
            rationale: result.rationale || 'Analysis completed.'
        };
        
    } catch (error) {
        console.error('Error determining compliance:', error);
        
        // Fallback to similarity-based decision
        return fallbackComplianceDecision(lawMatch.similarity_score);
    }
}

/**
 * Fallback compliance decision based on similarity score
 */
function fallbackComplianceDecision(similarityScore) {
    if (similarityScore >= 0.85) {
        return {
            decision: 'YES',
            confidence: Math.round(similarityScore * 100),
            rationale: 'High semantic similarity indicates compliance.'
        };
    } else if (similarityScore >= 0.70) {
        return {
            decision: 'PARTIAL',
            confidence: Math.round(similarityScore * 100),
            rationale: 'Moderate similarity suggests partial compliance or ambiguity.'
        };
    } else {
        return {
            decision: 'NO',
            confidence: Math.round(similarityScore * 100),
            rationale: 'Low similarity may indicate non-compliance or irrelevance.'
        };
    }
}

/**
 * Calculate refined confidence score
 * Combines similarity score with text comparison factors
 */
function calculateConfidenceScore(similarityScore, additionalFactors = {}) {
    let baseScore = similarityScore * 100;
    
    // Adjust based on text length similarity
    if (additionalFactors.textLengthRatio) {
        const lengthRatio = additionalFactors.textLengthRatio;
        if (lengthRatio < 0.3 || lengthRatio > 3.0) {
            baseScore *= 0.9; // Reduce confidence if lengths very different
        }
    }
    
    // Adjust based on keyword overlap
    if (additionalFactors.keywordOverlap) {
        baseScore *= (1 + additionalFactors.keywordOverlap * 0.1);
    }
    
    return Math.min(100, Math.max(0, Math.round(baseScore)));
}

/**
 * Generate detailed rationale for a compliance decision
 */
async function generateRationale(uploadedText, lawMatch, decision, confidence) {
    try {
        const prompt = `Explain why this document text is ${decision.toLowerCase()} with ${lawMatch.fullCitation} (${lawMatch.source}).
        
Document text: "${uploadedText}"

Legal Provision: "${lawMatch.legalText}"

Provide a concise 2-3 sentence explanation that:
1. Identifies the key legal principle in the referenced law
2. Shows how the document text relates to it
3. Justifies the ${decision} decision

Be specific and factual.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a legal expert providing clear, factual explanations.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating rationale:', error);
        return `The document text shows ${decision === 'YES' ? 'alignment' : decision === 'NO' ? 'contradiction' : 'partial alignment'} with ${lawMatch.fullCitation}.`;
    }
}

/**
 * Full compliance mapping for a single sentence
 * Returns complete mapping object with provenance
 */
async function createComplianceMapping(sentence, uploadedDocMeta = {}) {
    try {
        // Step 1: Find matching legal provisions
        const lawMatches = await matchSentenceToAuthoritativeLaws(sentence, 3);
        
        if (lawMatches.length === 0) {
            return null; // No relevant legal provision found
        }
        
        // Use top match
        const bestMatch = lawMatches[0];
        
        // Step 2: Determine compliance
        const complianceResult = await determineCompliance(
            sentence.text,
            bestMatch
        );
        
        // Step 3: Generate detailed rationale
        const rationale = await generateRationale(
            sentence.text,
            bestMatch,
            complianceResult.decision,
            complianceResult.confidence
        );
        
        // Step 4: Create full mapping object
        return {
            mapping_id: sentence.sentenceId,
            uploaded_text_snippet: sentence.text,
            snippet_location: {
                startChar: sentence.startChar,
                endChar: sentence.endChar,
                page: sentence.page,
                paragraph: sentence.paragraph,
                line: sentence.line
            },
            constitution_match: {
                text: bestMatch.legalText,
                article: bestMatch.fullCitation,
                articleHeading: bestMatch.shortName,
                source: bestMatch.source,
                lawType: bestMatch.lawType,
                file: bestMatch.source
            },
            decision: complianceResult.decision,
            confidence: complianceResult.confidence,
            similarity_score: bestMatch.similarity_score,
            rationale: rationale,
            provenance: {
                pinecone_chunk_id: bestMatch.pineconeId,
                retrieval_score: bestMatch.similarityScore,
                query_used: sentence.text.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            },
            alternative_matches: lawMatches.slice(1).map(m => ({
                article: m.fullCitation,
                similarity: m.similarity_score
            }))
        };
    } catch (error) {
        console.error('Error creating compliance mapping:', error);
        return null;
    }
}

/**
 * Process all sentences and create complete compliance mappings
 */
async function processDocumentCompliance(sentences, uploadedDocMeta = {}, options = {}) {
    const mappings = [];
    const batchSize = options.batchSize || 5;
    const maxSentences = options.maxSentences || 100;
    
    console.log(`📊 Processing ${Math.min(sentences.length, maxSentences)} sentences for compliance...`);
    
    const sentencesToProcess = sentences.slice(0, maxSentences);
    
    for (let i = 0; i < sentencesToProcess.length; i += batchSize) {
        const batch = sentencesToProcess.slice(i, i + batchSize);
        
        console.log(`   Processing sentences ${i + 1}-${Math.min(i + batchSize, sentencesToProcess.length)}...`);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(sentence => createComplianceMapping(sentence, uploadedDocMeta))
        );
        
        // Add non-null results
        mappings.push(...batchResults.filter(m => m !== null));
        
        // Rate limiting delay
        if (i + batchSize < sentencesToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`✅ Created ${mappings.length} compliance mappings`);
    
    return mappings;
}

/**
 * Divide document into thematic chunks for high-speed analysis
 */
async function thematicChunking(text, maxChunks = 7) {
    try {
        const prompt = `Divide this legal document into ${maxChunks} distinct thematic sections for constitutional analysis. 
        Focus on sections that likely carry legal obligations, procedural directives, or fundamental rights implications.
        
        TEXT:
        ${text.substring(0, 15000)}
        
        Return ONLY a JSON object with a 'sections' array:
        {
          "sections": [
            { "title": "Section Title", "content": "Exact content snippet from the document" }
          ]
        }`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a legal document architect expert in Pakistani law.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0].message.content);
        return data.sections || [];
    } catch (error) {
        console.error('Error in thematic chunking:', error);
        // Fallback: simple text splitting if AI fails
        return [{ title: "Document Overview", content: text.substring(0, 5000) }];
    }
}

/**
 * High-speed thematic compliance analysis (Rapid Scan V2)
 */
async function processThematicCompliance(documentText, documentMeta = {}) {
    console.log('⚡ Starting high-speed thematic compliance scan...');
    const startTime = Date.now();
    
    // 1. Chunk the document
    const sections = await thematicChunking(documentText);
    console.log(`📊 Divided document into ${sections.length} thematic sections.`);

    // 2. Process all sections in parallel (No sequential delays!)
    const mappingPromises = sections.map(async (section, idx) => {
        // Find best legal match for this chunk
        const matches = await matchSentenceToAuthoritativeLaws({ text: section.content }, 3);
        if (matches.length === 0) return null;

        const bestMatch = matches[0];
        
        // Detailed compliance analysis for this chunk
        const analysisPrompt = `Critically analyze this document section for compliance with the Authoritative Laws of Pakistan.
        
        SECTION: "${section.title}"
        TEXT: "${section.content}"
        
        LEGAL PROVISION:
        ${bestMatch.fullCitation}: ${bestMatch.source}
        "${bestMatch.legalText}"
        
        TASK:
        1. Decide: YES (Compliant), NO (Violation), PARTIAL (Ambiguous).
        2. Identify specific "Loopholes" or "Conflicts".
        3. Provide a "Proposed Fix" (Exact citation-based correction).
        4. Generate an "Explainable Reasoning Chain" showing exactly how you reached this conclusion step-by-step.
        
        Return JSON object:
        {
          "decision": "YES|NO|PARTIAL",
          "confidence": 0-100,
          "rationale": "Overall summary cite ${bestMatch.shortName}",
          "reasoningChain": [
            "Step 1: Extracted core directive from document...",
            "Step 2: Compared against ${bestMatch.fullCitation}...",
            "Step 3: Identified divergence/alignment regarding...",
            "Step 4: Concluded status as..."
          ],
          "loophole": "State the conflict clearly",
          "proposedFix": "Corrected legal text"
        }`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: 'You are a Supreme Court constitutional expert.' }, { role: 'user', content: analysisPrompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            mapping_id: idx + 1,
            uploaded_text_snippet: section.content,
            section_title: section.title,
            decision: result.decision,
            confidence: result.confidence,
            rationale: result.rationale,
            reasoningChain: result.reasoningChain || [],
            loophole: result.loophole,
            proposedFix: result.proposedFix,
            constitution_match: {
                article: bestMatch.fullCitation,
                articleHeading: bestMatch.shortName,
                text: bestMatch.legalText,
                source: bestMatch.source,
                lawType: bestMatch.lawType
            },
            similarity_score: bestMatch.similarity_score || 0
        };
    });

    const results = await Promise.all(mappingPromises);
    const validMappings = results.filter(r => r !== null);

    console.log(`✅ Rapid Scan complete in ${(Date.now() - startTime) / 1000}s. Found ${validMappings.length} mappings.`);
    
    return validMappings;
}

module.exports = {
    matchSentenceToAuthoritativeLaws,
    determineCompliance,
    calculateConfidenceScore,
    generateRationale,
    createComplianceMapping,
    processDocumentCompliance,
    processThematicCompliance,
    thematicChunking
};
