const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Fact Extraction Service
 * Extracts structured factual information from chat messages using OpenAI GPT-4
 */

const FACT_SCHEMA = {
    personal: {
        name: null,
        fatherName: null,
        cnic: null,
        address: null,
        phone: null,
        email: null
    },
    financial: {
        monthlyRent: null,
        securityDeposit: null,
        monthlyIncome: null,
        salary: null
    },
    property: {
        propertyAddress: null,
        propertyType: null,
        propertySize: null
    },
    company: {
        companyName: null,
        directorName: null,
        companyAddress: null,
        designation: null
    },
    dates: {
        agreementDate: null,
        leaseStartDate: null,
        leaseEndDate: null,
        joiningDate: null,
        effectiveDate: null
    },
    witnesses: {
        witness1Name: null,
        witness1Address: null,
        witness2Name: null,
        witness2Address: null
    },
    other: {
        signingPlace: null,
        jurisdiction: null,
        duration: null
    }
};

/**
 * Extract facts from a single message or conversation history
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} existingFacts - Previously extracted facts to merge with
 * @returns {Object} Extracted facts with confidence scores
 */
async function extractFacts(messages, existingFacts = {}) {
    try {
        // Prepare conversation context
        const conversationText = messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content)
            .join('\n');

        const systemPrompt = `You are a legal document assistant that extracts factual information from conversations.

Your task is to analyze the conversation and extract ONLY factual information that was explicitly stated by the user.

Extract the following types of information:
1. Personal Information: name, father's name, CNIC, address, phone, email
2. Financial Information: monthly rent, security deposit, monthly income, salary
3. Property Information: property address, property type, property size
4. Company Information: company name, director name, company address, designation
5. Dates: agreement date, lease start/end dates, joining date, effective date
6. Witnesses: witness names and addresses
7. Other: signing place, jurisdiction, duration

IMPORTANT RULES:
- Only extract information that was EXPLICITLY mentioned by the user
- Do not infer or assume information
- If a fact was mentioned multiple times, use the most recent value
- Return null for any field not mentioned
- Be precise with dates (convert to YYYY-MM-DD format if possible)
- Be precise with numbers (extract only numeric values for financial fields)

Return a JSON object with the extracted facts following this structure:
{
  "personal": { "name": "...", "fatherName": "...", ... },
  "financial": { "monthlyRent": 50000, ... },
  "property": { "propertyAddress": "...", ... },
  "company": { "companyName": "...", ... },
  "dates": { "agreementDate": "2024-01-15", ... },
  "witnesses": { "witness1Name": "...", ... },
  "other": { "signingPlace": "...", ... }
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Changed from gpt-4 to support JSON response format
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Conversation:\n${conversationText}\n\nExtract all factual information from this conversation.` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1 // Low temperature for consistent extraction
        });

        const extractedFacts = JSON.parse(response.choices[0].message.content);

        // Merge with existing facts (new facts override old ones)
        const mergedFacts = mergeFacts(existingFacts, extractedFacts);

        return {
            success: true,
            facts: mergedFacts,
            newlyExtracted: extractedFacts
        };

    } catch (error) {
        console.error('Error extracting facts:', error);
        return {
            success: false,
            error: error.message,
            facts: existingFacts // Return existing facts on error
        };
    }
}

/**
 * Merge new facts with existing facts
 * New facts override existing ones, but null values don't override existing values
 */
function mergeFacts(existingFacts, newFacts) {
    const merged = JSON.parse(JSON.stringify(existingFacts || FACT_SCHEMA));

    for (const category in newFacts) {
        if (!merged[category]) {
            merged[category] = {};
        }
        
        for (const field in newFacts[category]) {
            const newValue = newFacts[category][field];
            // Only update if new value is not null
            if (newValue !== null && newValue !== undefined && newValue !== '') {
                merged[category][field] = newValue;
            }
        }
    }

    return merged;
}

/**
 * Get a summary of extracted facts for user display
 */
function getFactsSummary(facts) {
    const summary = [];
    
    for (const category in facts) {
        for (const field in facts[category]) {
            const value = facts[category][field];
            if (value !== null && value !== undefined && value !== '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').trim();
                const capitalizedField = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                summary.push(`${capitalizedField}: ${value}`);
            }
        }
    }
    
    return summary;
}

/**
 * Check if we have enough facts to generate a specific document type
 */
function checkFactCompleteness(facts, documentType) {
    const requiredFields = getRequiredFields(documentType);
    const missingFields = [];
    const availableFields = [];

    for (const field of requiredFields) {
        const value = getFactValue(facts, field.path);
        if (!value) {
            missingFields.push(field.label);
        } else {
            availableFields.push({ label: field.label, value });
        }
    }

    return {
        isComplete: missingFields.length === 0,
        missingFields,
        availableFields,
        completionPercentage: Math.round((availableFields.length / requiredFields.length) * 100)
    };
}

/**
 * Get value from nested fact object using path
 */
function getFactValue(facts, path) {
    const parts = path.split('.');
    let value = facts;
    
    for (const part of parts) {
        value = value?.[part];
        if (value === null || value === undefined) return null;
    }
    
    return value;
}

/**
 * Define required fields for each document type
 */
function getRequiredFields(documentType) {
    const fieldDefinitions = {
        'house-rent': [
            { path: 'dates.agreementDate', label: 'Date of Agreement' },
            { path: 'personal.name', label: 'Landlord Name' },
            { path: 'personal.fatherName', label: 'Landlord Father Name' },
            { path: 'personal.address', label: 'Landlord Address' },
            { path: 'company.companyName', label: 'Company/Tenant Name' },
            { path: 'company.directorName', label: 'Director Name' },
            { path: 'property.propertyAddress', label: 'Property Address' },
            { path: 'financial.monthlyRent', label: 'Monthly Rent' },
            { path: 'dates.leaseStartDate', label: 'Lease Start Date' },
            { path: 'other.signingPlace', label: 'Signing Place' },
            { path: 'witnesses.witness1Name', label: 'Witness 1 Name' },
            { path: 'witnesses.witness2Name', label: 'Witness 2 Name' }
        ],
        'employment': [
            { path: 'personal.name', label: 'Employee Name' },
            { path: 'company.companyName', label: 'Company Name' },
            { path: 'company.designation', label: 'Designation' },
            { path: 'financial.salary', label: 'Salary' },
            { path: 'dates.joiningDate', label: 'Joining Date' }
        ],
        'nda': [
            { path: 'personal.name', label: 'Party A Name' },
            { path: 'company.companyName', label: 'Party B Name' },
            { path: 'dates.effectiveDate', label: 'Effective Date' }
        ]
        // Add more document types as needed
    };

    return fieldDefinitions[documentType] || [];
}

module.exports = {
    extractFacts,
    mergeFacts,
    getFactsSummary,
    checkFactCompleteness,
    getFactValue,
    FACT_SCHEMA
};
