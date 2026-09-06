/**
 * Pakistan Legal System Prompts
 * 
 * This module provides centralized, Pakistan-specific legal context
 * for all AI interactions in the Legalyze system.
 * 
 * Case Types Covered:
 * - Criminal (Bail, FIRs, Section 22-A Petitions)
 * - Constitutional (Writ Petitions, Fundamental Rights)
 * - Civil (Suits, Injunctions)
 * - Family (Divorce, Custody, Inheritance)
 */

/**
 * Pakistan Legal System Prompts (Dynamic Version)
 * 
 * Now fetches core personas from MongoDB SystemPrompt collection.
 * Falls back to hardcoded defaults if DB is unreachable/empty.
 */

const SystemPrompt = require('../models/SystemPrompt');

// Hardcoded fallbacks (Minimal set to ensure system works if DB fails)
const FALLBACK_CONTEXT = {
    identity: `You are Legalyze AI, specialized in Pakistani law. Answer only legal questions.`,
    jurisdictionRules: `Use only Pakistani statutes (PPC, CrPC, Constitution 1973).`,
    citationGuidance: `Cite relevant sections (e.g., Section 302 PPC).`,
    responseFormat: `1. Issue 2. Law 3. Procedure`
};

/**
 * Get the complete Pakistan-focused system prompt (Dynamic)
 * @param {Object} options - Configuration options
 */
async function getPakistanSystemPrompt(options = {}) {
    const { hasDocumentContext = false, hasPendingDocs = false, caseType = null } = options;

    try {
        // Fetch the master Lawyer Persona from DB
        const promptDoc = await SystemPrompt.findOne({ key: 'LAWYER_PERSONA' });
        const baseContent = promptDoc ? promptDoc.content : FALLBACK_CONTEXT.identity;

        let prompt = baseContent + '\n\n';

        // Add Context Specific Instructions (These are logic-based, keep here or move to separate keys if needed)
        if (hasDocumentContext) {
            prompt += `
DOCUMENT ANALYSIS MODE:
1. You have FULL ACCESS to the user's provided document excerpts.
2. YOU MUST summarize, analyze, and explain this content when asked.
3. Quote specific sections to support your answers.
4. Do not refuse to read or summarize the document.
5. If info is missing, state it clearly.`;
        } else if (hasPendingDocs) {
            prompt += `
STATUS: Document processing in progress. Ask user to wait briefly.`;
        } else {
            prompt += `
GENERAL CONSULTATION MODE:
Provide guidance based on user description and Pakistani law. Ask clarifying questions if needed.`;
        }

        return prompt;

    } catch (err) {
        console.error('Error fetching system prompt:', err);
        return FALLBACK_CONTEXT.identity + '\n' + FALLBACK_CONTEXT.jurisdictionRules;
    }
}

/**
 * Detect case type from user message
 * (Kept static as this is classification logic, not persona)
 */
function detectCaseType(message) {
    const lowerMessage = message.toLowerCase();
    const patterns = {
        criminal: ['fir', 'bail', 'criminal', 'murder', 'police', '302', '420', 'remand'],
        constitutional: ['writ', 'fundamental right', 'constitution', '199', 'high court'],
        civil: ['suit', 'injunction', 'contract', 'property', 'stay order'],
        family: ['divorce', 'khula', 'custody', 'maintenance', 'family court']
    };

    for (const [caseType, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            return caseType;
        }
    }
    return null;
}

module.exports = {
    getPakistanSystemPrompt,
    detectCaseType,
    // Export fallback for seeding if needed elsewhere, though admin.js has its own seed list
    PAKISTAN_LEGAL_CONTEXT: FALLBACK_CONTEXT 
};
