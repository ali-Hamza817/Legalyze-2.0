/**
 * HTML Document Generator
 * Generates HTML documents directly without PDF conversion
 */

const { toWords } = require('number-to-words');

/**
 * Generate House Rent Agreement HTML
 * @param {Object} formData - Form data containing all agreement fields
 * @returns {String} - HTML string
 */
const generateRentAgreementHTML = (formData) => {
    // Helper to safely convert number to words
    const safeToWords = (num) => {
        if (!num || isNaN(parseInt(num))) return '_______ Rupees';
        try {
            return toWords(parseInt(num)).toUpperCase() + ' RUPEES';
        } catch (e) {
            return '_______ Rupees';
        }
    };

    const rentInWords = safeToWords(formData.monthlyRent);
    
    // Create HTML template with EXACT user text
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>House Rent Agreement</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #000;
        }
        .title { 
            text-align: center; 
            font-weight: bold; 
            text-decoration: underline; 
            margin-bottom: 30px; 
            font-size: 16pt; 
        }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        p { margin-bottom: 20px; text-align: justify; }
        .center { text-align: center; font-weight: bold; margin: 20px 0; }
        .signature-section { 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-between;
            page-break-inside: avoid; 
        }
        .signature-box { width: 45%; }
        .witnesses { margin-top: 50px; }
        .witness-row { margin-bottom: 40px; }
        @media print {
            body { margin: 0; padding: 15mm; }
            .page-break { page-break-after: always; }
        }
    </style>
</head>
<body>
    <div class="title">RENT AGREEMENT</div>

    <p>This Rent Agreement is made on this <span class="bold underline">${formData.dateOfAgreement || '__________'}</span> (date of rent agreement) by <span class="bold underline">${formData.landlordName || '________________'}</span> (name of the landlord), S/o <span class="bold underline">${formData.landlordFatherName || '_______________'}</span> (father's name of the landlord), Address: <span class="bold underline">${formData.landlordAddress || '___________________________________________________'}</span> (residential address of the landlord), herein after called the Lessor/Owner, Party of the First Part;</p>

    <p class="center">AND</p>

    <p><span class="bold underline">${formData.companyName || '_____________________________'}</span> (Name of the proposed company), through its proposed director <span class="bold underline">${formData.directorName || '__________'}</span> (name of the director), called Lessee/Tenant, Party of the Second Part.</p>

    <p>The expressions "Lessor/Owner" and "Lessee/Tenant" shall mean and include their legal heirs, successors, assigns, representatives, etc. Whereas the Lessor/Owner is the owner and in possession of the property No: <span class="bold underline">${formData.propertyAddress || '______________'}</span> (registered address of the company) and has agreed to let out one office room and one toilet & bathroom set on said property to the Lessee/Tenant, and the Lessee/Tenant has agreed to take the same on rent of Rs. <span class="bold underline">${formData.monthlyRent || '______'}</span>/- (<span class="bold underline">${rentInWords}</span>) per month.</p>

    <p class="center">NOW THIS RENT AGREEMENT WITNESSETH AS UNDER:-</p>

    <p>1. That the Tenant/Lessee shall pay a monthly rent of RS. <span class="bold underline">${formData.monthlyRent || '_________'}</span>/- (<span class="bold underline">${rentInWords}</span>) per month, excluding electricity and water charges.</p>

    <p>2. That the Tenant/Lessee shall not sub-let any part of the above-demised premises to anyone else under any circumstances without the consent of the Owner.</p>

    <p>3. That the Tenant/Lessee shall abide by all by-laws, rules, and regulations of the local authorities in respect of the demised premises and shall not carry out any illegal activities in the said demised premises.</p>

    <p>4. That this lease is granted for a period of Eleven (11) months only, commencing from <span class="bold underline">${formData.leaseStartDate || '___________'}</span> (date lease commences), and this lease may be extended further by mutual consent of both parties on the basis of the prevailing rental value in the market.</p>

    <p>5. That the Lessee shall pay electricity and water charges in proportion to consumption as per the meter to the Lessor/Owner.</p>

    <p>6. That the Tenant/Lessee shall not make any structural changes to the rented premises except for temporary decorations, wooden partitions/cabins, air-conditioners, etc., without the prior consent of the Owner.</p>

    <p>7. That the Tenant/Lessee shall not make additions or alterations to the said premises without the written consent of the Owner, nor shall the Lessee sublet part or the entire premises to any person(s)/firm(s)/company(s).</p>

    <p style="text-align: right; font-style: italic;">(Contd: 2/-)</p>
    <div class="page-break"></div>

    <p>8. That the Tenant/Lessee shall permit the Lessor/Owner or his authorized agent to enter the said tenanted premises for inspection/general checking or to carry out repair work at any reasonable time.</p>

    <p>9. That the Tenant/Lessee shall keep the said premises in a clean and hygienic condition and shall not do or cause to be done any act which may be a nuisance to others.</p>

    <p>10. That the Tenant/Lessee shall carry out all minor day-to-day repairs at his/her own cost.</p>

    <p>11. That this Agreement may be terminated before the expiry of the tenancy period by serving one month's prior notice by either party.</p>

    <p>12. That the Lessee shall use the above-said premises for official purposes only.</p>

    <p>13. That the Lessee/Tenant shall not store or keep any offensive, dangerous, explosive, or highly inflammable articles in the said premises and shall not use the same for any unlawful activities.</p>

    <p>14. That the Lessee shall pay one month's advance rent to the Lessor; the same shall be adjusted against the monthly rent.</p>

    <p>15. That both parties have read and understood all the contents of this agreement and have signed the same without any force or pressure from any side.</p>

    <p>IN WITNESS WHEREOF the Lessor/Owner and the Tenant/Lessee have hereunto subscribed their hands at <span class="bold underline">${formData.signingPlace || '______'}</span> (place) on this the <span class="bold underline">${formData.signingDate || '_____________'}</span> (date of rent agreement) in the presence of the following witnesses:</p>

    <div class="witnesses">
        <p class="bold">WITNESSES:-</p>
        <div class="witness-row">1. <span class="bold underline">${formData.witness1Name || '____________________'}</span></div>
        <div class="witness-row">2. <span class="bold underline">${formData.witness2Name || '____________________'}</span></div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <p class="bold underline">${formData.landlordName || '___________'}</p>
            <p>(name of the landlord)</p>
            <p style="margin-top: 20px;">Lessor</p>
        </div>
        <div class="signature-box" style="text-align: right;">
            <p class="bold underline">${formData.companyName || '_________________'}</p>
            <p>(name of the proposed company)</p>
            <p style="margin-top: 20px;">Lessee</p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
};

/**
 * Generate Generic HTML for other document types
 * @param {string} title - Document title
 * @param {Object} formData - Form data
 * @returns {String} - HTML string
 */
const generateGenericHTML = (title, formData) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #000;
        }
        .title { 
            text-align: center; 
            font-weight: bold; 
            text-decoration: underline; 
            margin-bottom: 30px; 
            font-size: 16pt; 
        }
        .field-row { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 3px solid #6366f1; }
        .label { font-weight: bold; color: #4f46e5; }
        .value { margin-left: 20px; }
        hr { border: none; border-top: 2px solid #e5e7eb; margin: 30px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; }
    </style>
</head>
<body>
    <div class="title">${title.toUpperCase()}</div>
    <p>This document was generated by Legalyze AI.</p>
    <hr/>
    ${Object.entries(formData).map(([key, value]) => `
        <div class="field-row">
            <div class="label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</div>
            <div class="value">${value || 'Not provided'}</div>
        </div>
    `).join('')}
    <hr/>
    <div class="footer">
        <p>This is a legally binding document generated on ${new Date().toLocaleDateString()}.</p>
        <p>Generated by Legalyze - Your AI Legal Assistant</p>
    </div>
</body>
</html>
    `;
    return html;
};

/**
 * Generate Legal Document HTML using Handlebars templates
 * @param {string} templateId - ID of the template in registry
 * @param {Object} formData - Form data
 * @returns {String} - HTML string
 */
const generateLegalDocumentHTML = (templateId, formData) => {
    const Handlebars = require('handlebars');
    const templates = require('../config/documentTemplates');
    
    const templateDef = templates.find(t => t.id === templateId);
    
    if (!templateDef) {
        throw new Error(`Template ${templateId} not found`);
    }
    
    // Compile the Handlebars template
    const compileTemplate = Handlebars.compile(templateDef.template);
    const bodyHtml = compileTemplate(formData);
    
    // Wrap in standard legal document layout
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateDef.name}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.5; 
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        h2, h3 { text-align: center; text-decoration: underline; margin-bottom: 20px; color: #000; }
        p { margin-bottom: 15px; text-align: justify; }
        ul, ol { margin-bottom: 15px; padding-left: 30px; }
        li { margin-bottom: 5px; }
        strong { font-weight: bold; }
        
        /* Print styles */
        @media print {
            body { margin: 0; padding: 0; }
        }
    </style>
</head>
<body>
    ${bodyHtml}
</body>
</html>
    `;
};

module.exports = { 
    generateRentAgreementHTML, 
    generateGenericHTML,
    generateLegalDocumentHTML
};
