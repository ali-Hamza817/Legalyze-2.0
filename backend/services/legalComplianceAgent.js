const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Agentic Legal Compliance Service
 * Handles advanced tasks like document classification and referential verification
 */

/**
 * Classify the uploaded document to ensure it is a valid legal document
 * @param {string} text - Extracted document text
 * @returns {Promise<Object>} - Classification result { isLegal, classification, confidence, reasoning }
 */
async function classifyLegalDocument(text) {
    try {
        const prompt = `Classify this document based on its legal nature. 
        We only accept: Judge Orders, Government Notifications, FIRs (First Information Reports), or generic Legal Documents (Agreements, Deeds, etc.).
        
        TEXT (Excerpt):
        "${text.substring(0, 5000)}"
        
        TASK:
        1. Determine if this is a valid legal document.
        2. Specifically classify it (Order/Notification/FIR/LegalDoc).
        3. Provide confidence and brief reasoning.
        
        Return JSON object:
        {
            "isLegal": true|false,
            "classification": "Judge Order|Government Notification|FIR|Legal Document|Not Legal",
            "confidence": 0-100,
            "reasoning": "..."
        }`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a legal document classifier specialized in Pakistani law.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error('Error in document classification:', error);
        return { isLegal: true, classification: 'Legal Document', confidence: 50, reasoning: 'Fallback due to error' };
    }
}

/**
 * Verify external references (Articles, Statutes, SROs) mentioned in the document
 * @param {string} text - Document text
 * @returns {Promise<Array>} - List of verified references
 */
async function verifyLegalReferences(text) {
    try {
        const prompt = `Identify and verify all legal references (Articles of Constitution, Section numbers of Statutes, SRO numbers) mentioned in this text.
        
        TEXT:
        "${text.substring(0, 10000)}"
        
        TASK:
        1. Extract the reference name (e.g., Article 199, Section 144).
        2. Identify the source (Constitution 1973, PPC, CrPC, etc.).
        3. Verify if the reference is likely valid or miscited.
        
        Return JSON object with 'references' array:
        {
            "references": [
                { "reference": "...", "source": "...", "status": "VALID|MISCITED|UNKNOWN", "context": "..." }
            ]
        }`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a legal research assistant.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(response.choices[0].message.content);
        return data.references || [];
    } catch (error) {
        console.error('Error verifying references:', error);
        return [];
    }
}

module.exports = {
    classifyLegalDocument,
    verifyLegalReferences
};
