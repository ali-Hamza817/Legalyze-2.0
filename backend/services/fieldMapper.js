/**
 * Field Mapping Service
 * Maps extracted facts to document template fields
 */

const { getFactValue, checkFactCompleteness } = require('./factExtractor');

/**
 * Map extracted facts to document template fields
 * @param {Object} facts - Extracted facts from conversation
 * @param {string} documentType - Type of document to generate
 * @returns {Object} Mapped fields ready for document generation
 */
function mapFactsToFields(facts, documentType) {
    const mappings = getFieldMappings(documentType);
    const mappedFields = {};
    
    for (const [fieldName, factPath] of Object.entries(mappings)) {
        const value = getFactValue(facts, factPath);
        mappedFields[fieldName] = value || '';
    }
    
    return mappedFields;
}

/**
 * Get field mappings for each document type
 * Maps template field names to fact paths
 */
function getFieldMappings(documentType) {
    const mappings = {
        'house-rent': {
            dateOfAgreement: 'dates.agreementDate',
            landlordName: 'personal.name',
            landlordFatherName: 'personal.fatherName',
            landlordAddress: 'personal.address',
            companyName: 'company.companyName',
            directorName: 'company.directorName',
            propertyAddress: 'property.propertyAddress',
            monthlyRent: 'financial.monthlyRent',
            leaseStartDate: 'dates.leaseStartDate',
            signingPlace: 'other.signingPlace',
            signingDate: 'dates.agreementDate', // Default to agreement date
            witness1Name: 'witnesses.witness1Name',
            witness2Name: 'witnesses.witness2Name'
        },
        'employment': {
            employeeName: 'personal.name',
            employeeFatherName: 'personal.fatherName',
            employeeAddress: 'personal.address',
            employeeCNIC: 'personal.cnic',
            companyName: 'company.companyName',
            designation: 'company.designation',
            salary: 'financial.salary',
            joiningDate: 'dates.joiningDate',
            signingPlace: 'other.signingPlace',
            signingDate: 'dates.agreementDate'
        },
        'nda': {
            partyAName: 'personal.name',
            partyBName: 'company.companyName',
            agreementDate: 'dates.agreementDate',
            effectiveDate: 'dates.effectiveDate',
            jurisdiction: 'other.jurisdiction'
        }
        // Add more document types as needed
    };
    
    return mappings[documentType] || {};
}

/**
 * Generate a user-friendly message about available and missing fields
 */
function generateFieldStatusMessage(facts, documentType) {
    const completeness = checkFactCompleteness(facts, documentType);
    const documentName = getDocumentTypeName(documentType);
    
    let message = `✅ **Yes, I can generate a ${documentName} for you!**\n\n`;
    
    // Show what we have
    if (completeness.availableFields.length > 0) {
        message += `**Information I have from our conversation (${completeness.availableFields.length} fields):**\n`;
        completeness.availableFields.forEach(field => {
            message += `✓ ${field.label}: ${field.value}\n`;
        });
        message += '\n';
    } else {
        message += `**Note:** I don't have any information yet from our conversation.\n\n`;
    }
    
    // Show what's missing - ALWAYS show ALL required fields
    if (completeness.missingFields.length > 0) {
        message += `**⚠️ Missing Required Information (${completeness.missingFields.length} fields):**\n`;
        message += `To generate a complete ${documentName}, I need the following details:\n\n`;
        completeness.missingFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
        });
        message += '\n';
        message += `**You have two options:**\n`;
        message += `1️⃣ Provide the missing details now, and I'll update the document\n`;
        message += `2️⃣ Generate the document anyway (missing fields will be left blank)\n`;
    } else {
        message += `✨ **Great news!** All required information is available!\n`;
        message += `You can generate the document now with complete information.`;
    }
    
    return {
        message,
        completeness,
        canGenerate: true // Can always generate, even with missing fields
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

/**
 * Validate mapped fields and provide suggestions
 */
function validateFields(mappedFields, documentType) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
    };
    
    // Check for critical missing fields
    const criticalFields = getCriticalFields(documentType);
    
    for (const field of criticalFields) {
        const value = mappedFields[field];
        // Check if field is missing or empty (handle both strings and numbers)
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            validation.warnings.push(`${field} is recommended but not provided`);
        }
    }
    
    // Validate date formats
    for (const [key, value] of Object.entries(mappedFields)) {
        if (key.toLowerCase().includes('date') && value) {
            if (!isValidDate(value)) {
                validation.errors.push(`${key} has invalid date format: ${value}`);
                validation.isValid = false;
            }
        }
    }
    
    // Validate numeric fields
    for (const [key, value] of Object.entries(mappedFields)) {
        if ((key.toLowerCase().includes('rent') || key.toLowerCase().includes('salary')) && value) {
            if (isNaN(value)) {
                validation.errors.push(`${key} should be a number: ${value}`);
                validation.isValid = false;
            }
        }
    }
    
    return validation;
}

/**
 * Get critical fields for each document type
 */
function getCriticalFields(documentType) {
    const critical = {
        'house-rent': ['landlordName', 'companyName', 'propertyAddress', 'monthlyRent'],
        'employment': ['employeeName', 'companyName', 'designation', 'salary'],
        'nda': ['partyAName', 'partyBName', 'effectiveDate']
    };
    
    return critical[documentType] || [];
}

/**
 * Simple date validation
 */
function isValidDate(dateString) {
    // Accept YYYY-MM-DD format or valid date strings
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

module.exports = {
    mapFactsToFields,
    getFieldMappings,
    generateFieldStatusMessage,
    validateFields,
    getDocumentTypeName
};
