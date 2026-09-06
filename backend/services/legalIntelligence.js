const openai = require('../config/openai');

/**
 * Legal Document Intelligence Service
 * Handles classification, summarization, and clause mapping.
 */

/**
 * Classify document type based on content
 * @param {string} text - First 2000 chars of text
 * @returns {Promise<string>} Document type (e.g. 'Bail Petition', 'Agreement')
 */
const classifyDocument = async (text) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { 
                    role: 'system', 
                    content: `You are an expert legal document classifier specialized EXCLUSIVELY in Pakistani legal documents.
You must classify documents according to Pakistani legal system standards.
Consider all Pakistani courts: Supreme Court, High Courts, District Courts, Family Courts, and Tribunals.` 
                },
                { 
                    role: 'user', 
                    content: `Classify this Pakistani legal document into one of these categories:
                    
CRIMINAL:
- Bail Application (Pre-arrest or Post-arrest)
- FIR (First Information Report)
- Section 22-A Petition
- Quashment Petition
- Criminal Complaint
- Challan

CONSTITUTIONAL:
- Writ Petition (Habeas Corpus, Mandamus, Certiorari)
- Constitutional Petition
- Intra Court Appeal

CIVIL:
- Civil Suit
- Injunction Application
- Recovery Suit
- Specific Performance Suit
- Partition Suit
- Declaration Suit

FAMILY:
- Khula Application
- Dissolution of Marriage
- Maintenance/Nafqa Application
- Custody/Hizanat Petition
- Guardianship Petition
- Dower Recovery

OTHERS:
- Rent Agreement
- Employment Contract
- Power of Attorney
- Affidavit
- Court Order
- Judgment
- Legal Notice
- Sale Deed
- Other

Return ONLY the category name from the list above.

Text:
${text.substring(0, 1500)}` 
                }
            ],
            temperature: 0
        });
        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error('Classification error:', e);
        return 'Unknown';
    }
};

/**
 * Generate a legal summary
 * @param {string} text - Document text (truncated if needed)
 * @returns {Promise<Object>} Structured summary
 */
const generateSummary = async (text) => {
    try {
        const prompt = `
        Analyze this legal document (Pakistani context) and provide a JSON summary with:
        - facts: Brief background facts
        - legalIssues: List of main legal questions
        - reliefSought: What is being asked?
        - type: Document type
        
        Text:
        ${text.substring(0, 4000)}
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (e) {
        console.error('Summarization error:', e);
        return { error: 'Failed to summarize' };
    }
};

/**
 * Deep Metadata Extraction (LWOE)
 * Extracts structured data: Parties, Court, Dates, Statutes
 * @param {string} text - Document text
 * @returns {Promise<Object>} Metadata object
 */
const extractDeepMetadata = async (text) => {
    try {
        const prompt = `
        You are a senior legal analyst. Extract the following details from this Pakistani legal document into a strict JSON format:
        
        1. parties: { petitioner: "Name", respondent: "Name" }
        2. court: { name: "Court Name", judge: "Judge Name" (if available), jurisdiction: "City/Province" }
        3. dates: { documentDate: "YYYY-MM-DD", incidentDate: "YYYY-MM-DD" (if applicable) }
        4. statutes: ["List of specific sections/laws like '302 PPC'", "'497 CrPC'"]
        5. outcome: "Brief outcome" (if judgment/order, else null)
        6. keyIssues: ["List of 3-5 main legal issues"]

        Text:
        ${text.substring(0, 5000)}
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (e) {
        console.error('Deep Extraction error:', e);
        return {};
    }
};

/**
 * Generate Timeline Events
 * Extracts chronological events from the document
 * @param {string} text - Document text
 * @param {string} documentDate - ISO date string of document
 * @returns {Promise<Array>} List of timeline events
 */
const generateTimeline = async (text, documentDate) => {
    try {
        const prompt = `
        Extract a chronological timeline of significant legal events from this text.
        The document itself is dated ${documentDate || 'unknown'}.
        
        Return a JSON array of objects:
        [
            {
                "date": "YYYY-MM-DD" (approximate if not exact),
                "title": "Short Title (e.g. FIR Registered)",
                "description": "Brief description",
                "type": "Incident" | "Hearing" | "Order" | "Filing" | "Other"
            }
        ]
        
        Focus on:
        1. Date of Incident/Offense
        2. date of FIR
        3. Dates of previous court orders/hearings
        4. Upcoming dates mentioned (next hearing)

        Text:
        ${text.substring(0, 4000)}
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result.events || result.timeline || (Array.isArray(result) ? result : []);
    } catch (e) {
        console.error('Timeline Generation error:', e);
        return [];
    }
};

/**
 * Detect AI Context Mode based on Document Type
 * @param {string} docType - Classified document type
 * @returns {string} Context Mode (CASE_ANALYSIS | ISSUE_SPOTTING | DRAFT_IMPROVEMENT | WORKFLOW_PLANNING)
 */
const detectContextMode = (docType) => {
    const modes = {
        'Judgment': 'CASE_ANALYSIS',
        'Court Order': 'WORKFLOW_PLANNING',
        'FIR': 'ISSUE_SPOTTING',
        'Evidence': 'ISSUE_SPOTTING',
        'Witness Statement': 'ISSUE_SPOTTING',
        'Legal Notice': 'DRAFT_IMPROVEMENT',
        'Bail Application': 'DRAFT_IMPROVEMENT',
        'Petition': 'DRAFT_IMPROVEMENT',
        'Agreement': 'DRAFT_IMPROVEMENT'
    };
    return modes[docType] || 'GENERAL_ASSISTANCE';
};

module.exports = {
    classifyDocument,
    generateSummary,
    extractDeepMetadata,
    generateTimeline,
    detectContextMode
};
