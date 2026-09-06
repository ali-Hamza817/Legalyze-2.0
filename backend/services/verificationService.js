const Judgment = require('../models/Judgment');

/**
 * Legalyze Citation Verification Service
 * Fixes Limitation #5: "Hallucinations"
 */

/**
 * Regex patterns for Pakistani Legal Citations
 * Matches formats like:
 * - PLD 2022 SC 1
 * - 2021 YLR 50
 * - 2020 SCMR 100
 * - PLD 2019 Lahore 50
 */
const CITATION_REGEX = /((?:PLD|SCMR|YLR|MLD|CLC|PCRLJ|PTD|PLJ|GBLR)\s+\d{4}\s+(?:SC|Lahore|Karachi|Peshawar|Quetta|Islamabad|Supreme Court|High Court|[A-Z][a-z]+)\s+\d+)/gi;

/**
 * Verify citations in a given text
 * @param {string} text - The AI-generated text containing citations
 * @returns {Promise<Object>} - Verification report
 */
async function verifyCitations(text) {
    if (!text) return { verified: [], unverified: [] };

    // 1. Extract unique citations
    const matches = text.match(CITATION_REGEX);
    if (!matches) return { verified: [], unverified: [] };

    const uniqueCitations = [...new Set(matches.map(c => c.trim()))];
    console.log(`🔎 Verifying ${uniqueCitations.length} citations...`);

    // 2. batch check against database (Optimized)
    const orConditions = uniqueCitations.map(citation => ({
        citation: { $regex: new RegExp(`^${citation}$`, 'i') }
    }));

    const foundDocs = await Judgment.find({ $or: orConditions })
        .select('citation')
        .lean();

    const results = uniqueCitations.map(citation => {
        // Find match in foundDocs (case insensitive comparison)
        const exists = foundDocs.some(doc => 
            doc.citation.toLowerCase() === citation.toLowerCase()
        );
        return {
            citation,
            verified: exists
        };
    });

    const verified = results.filter(r => r.verified).map(r => r.citation);
    const unverified = results.filter(r => !r.verified).map(r => r.citation);

    return {
        verified,
        unverified,
        total: uniqueCitations.length
    };
}

/**
 * Append verification warnings to text
 * @param {string} strategyText - Original strategy markdown
 * @returns {Promise<string>} - Annotated text
 */
async function annotateStrategy(strategyText) {
    const report = await verifyCitations(strategyText);

    if (report.total === 0) return strategyText;

    let annotation = '\n\n---\n### 🛡️ Citation Verification Report\n';
    
    if (report.verified.length > 0) {
        annotation += `✅ **Verified Cases:** ${report.verified.join(', ')}\n`;
    }
    
    if (report.unverified.length > 0) {
        annotation += `⚠️ **Unverified Cases (Potential Hallucinations):** ${report.unverified.join(', ')}\n`;
        annotation += `> *Note: These cases were cited by the AI but could not be found in the system database. Please verify manually.*\n`;
    } else {
        annotation += `✨ *All references verified against database.*\n`;
    }

    return strategyText + annotation;
}

module.exports = {
    verifyCitations,
    annotateStrategy
};
