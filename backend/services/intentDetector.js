const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Intent Detection Service
 * Detects when user wants to generate a document and identifies the document type
 */

const DOCUMENT_TYPES = {
    'house-rent': ['house rent', 'rental agreement', 'rent agreement', 'lease agreement', 'tenancy agreement'],
    'employment': ['employment contract', 'employment agreement', 'job contract', 'offer letter'],
    'nda': ['nda', 'non-disclosure agreement', 'confidentiality agreement'],
    'partnership': ['partnership agreement', 'partnership deed'],
    'sale': ['sale agreement', 'sale deed', 'purchase agreement'],
    'loan': ['loan agreement', 'promissory note'],
    'service': ['service agreement', 'service contract'],
    'freelance': ['freelance contract', 'freelance agreement'],
    'consulting': ['consulting agreement', 'consultancy contract']
};

/**
 * Detect if user wants to generate a document
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} Intent detection result
 */
async function detectIntent(userMessage, conversationHistory = []) {
    try {
        // PRE-CHECK: Exclude legal advice queries
        const lowerMessage = userMessage.toLowerCase();
        const legalHelpKeywords = [
            'fir', 'nominated', 'arrested', 'bail', 'police', 'case filed',
            'sued', 'court notice', 'lawyer', 'advocate', 'legal advice',
            'what should i do', 'how to respond', 'guidance', 'help me',
            'my friend', 'my client', 'accused', 'complaint', 'summon',
            'constitutional', 'writ', 'petition', 'section', 'article',
            'murder', 'theft', 'cheating', 'defamation', 'divorce', 'custody',
            'maintenance', 'inheritance', 'property dispute', 'injunction'
        ];
        
        // If message contains legal help keywords and NOT explicit generation phrases, skip detection
        const hasLegalHelpIntent = legalHelpKeywords.some(kw => lowerMessage.includes(kw));
        const hasExplicitGeneration = /\b(generate|create|draft|prepare|make)\s+(a|an|the|my)?\s*(agreement|contract|nda|deed|document)\b/i.test(userMessage);
        
        if (hasLegalHelpIntent && !hasExplicitGeneration) {
            console.log('⚖️ Intent Detector: Legal help query detected, skipping document generation');
            return {
                success: true,
                hasIntent: false,
                documentType: null,
                confidence: 0.95,
                reasoning: 'User is seeking legal advice/help, not document generation'
            };
        }

        const systemPrompt = `You are an intent detection system for a legal document generation platform.

IMPORTANT: Only detect document generation intent when user EXPLICITLY asks to create/generate a document.

DO NOT detect generation intent for:
- Legal advice questions (e.g., "what should I do if...", "how to respond to...")
- FIR/criminal case help
- Court case guidance
- General legal queries
- Situation analysis

ONLY detect generation intent when user says things like:
- "Generate a house rent agreement"
- "Create an NDA for me"
- "Draft an employment contract"
- "I want to make a partnership deed"

Document types: house-rent, employment, nda, partnership, sale, loan, service, freelance, consulting

Return JSON:
{
  "hasIntent": true/false,
  "documentType": "type" or null,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

CRITICAL: When in doubt, set hasIntent to FALSE. Better to miss a generation request than to override legal advice.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Changed from gpt-4 to support JSON response format
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-5), // Include last 5 messages for context
                { role: 'user', content: userMessage }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            success: true,
            hasIntent: result.hasIntent,
            documentType: result.documentType,
            confidence: result.confidence,
            reasoning: result.reasoning
        };

    } catch (error) {
        console.error('Error detecting intent:', error);
        
        // Fallback to simple keyword matching
        const fallbackResult = fallbackIntentDetection(userMessage);
        
        return {
            success: false,
            error: error.message,
            ...fallbackResult,
            usedFallback: true
        };
    }
}

/**
 * Fallback intent detection using keyword matching
 */
function fallbackIntentDetection(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for generation keywords
    const generationKeywords = ['generate', 'create', 'make', 'draft', 'prepare', 'need'];
    const hasGenerationIntent = generationKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!hasGenerationIntent) {
        return {
            hasIntent: false,
            documentType: null,
            confidence: 0.9
        };
    }
    
    // Try to match document type
    for (const [docType, keywords] of Object.entries(DOCUMENT_TYPES)) {
        for (const keyword of keywords) {
            if (lowerMessage.includes(keyword)) {
                return {
                    hasIntent: true,
                    documentType: docType,
                    confidence: 0.7,
                    reasoning: `Matched keyword: ${keyword}`
                };
            }
        }
    }
    
    // Found generation intent but couldn't identify document type
    return {
        hasIntent: true,
        documentType: null,
        confidence: 0.5,
        reasoning: 'Generation intent detected but document type unclear'
    };
}

/**
 * Get user-friendly document type name
 */
function getDocumentTypeName(documentType) {
    const names = {
        'house-rent': 'House Rent Agreement',
        'employment': 'Employment Contract',
        'nda': 'Non-Disclosure Agreement',
        'partnership': 'Partnership Agreement',
        'sale': 'Sale Agreement',
        'loan': 'Loan Agreement',
        'service': 'Service Agreement',
        'freelance': 'Freelance Contract',
        'consulting': 'Consulting Agreement'
    };
    
    return names[documentType] || documentType;
}

module.exports = {
    detectIntent,
    fallbackIntentDetection,
    getDocumentTypeName,
    DOCUMENT_TYPES
};
