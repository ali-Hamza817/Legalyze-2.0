const puppeteer = require('puppeteer');
const { toWords } = require('number-to-words');

/**
 * Generate House Rent Agreement PDF from form data
 * @param {Object} formData - Form data containing all agreement fields
 * @returns {Buffer} - PDF buffer
 */
const generateRentAgreementPDF = async (formData) => {
    // Helper to safely convert number to words
    const safeToWords = (num) => {
        if (!num || isNaN(parseInt(num))) return '_______';
        try {
            return toWords(parseInt(num)).toUpperCase();
        } catch (e) {
            return '_______';
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
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
        .bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        p { margin-bottom: 15px; text-align: justify; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 40%; }
        .witnesses { margin-top: 30px; }
    </style>
</head>
<body>
    <div class="title">RENT AGREEMENT</div>

    <p>This Rent Agreement is made on this <span class="bold underline">${formData.dateOfAgreement || '__________'}</span> (date of rent agreement) by <span class="bold underline">${formData.landlordName || '________________'}</span> (name of the landlord) S/o <span class="bold underline">${formData.landlordFatherName || '_______________'}</span> (father’s name of the landlord), Add: <span class="bold underline">${formData.landlordAddress || '___________________________________________________'}</span> (residential address of the landlord). Herein after called the Lessor / Owner, Party Of the first part</p>

    <p style="text-align: center; font-weight: bold;">AND</p>

    <p><span class="bold underline">${formData.companyName || '_____________________________'}</span> (Name of the proposed company), through its proposed director <span class="bold underline">${formData.directorName || '__________'}</span> (name of the director) called Lessee/Tenant, Party of the Second Part</p>

    <p>That the expression of the term , Lessor/Owner and the Lessee/Tenant Shall mean and include their legal heirs successors , assigns , representative etc. Whereas the Lessor /Owner is the owner and in possession of the property No: <span class="bold underline">${formData.propertyAddress || '______________'}</span> (registered address of the company) and has agreed to let out the one office Room, one Toilet & Bathroom Set on said property, to the Lessee/Tenant and the Lessee/Tenant has agreed to take the same on rent of Rs. <span class="bold underline">${formData.monthlyRent || '______'}</span>/- (In words) per month.</p>

    <p style="text-align: center; font-weight: bold; margin: 20px 0;">NOW THIS RENT AGREEMENT WITNESSETH AS UNDER:-</p>

    <p>1. That the Tenant/Lessee shall pay as the monthly rent of RS. <span class="bold underline">${formData.monthlyRent || '_________'}</span>/- (In words) per month, excluding electricity and water charge.</p>

    <p>2. That the Tenant /Lessee shall not sub–let any part of the above said demised premised premises to anyone else under any circumstances without the consent of Owner.</p>

    <p>3. That the Tenant / Lessee shall abide by all the bye - laws , rules and regulation, of the local authorities in respect of the demised premises and shall not do any illegal activities in the said demised premises.</p>

    <p>4. That this Lease is granted for a period of Eleven (11) months only commencing from <span class="bold underline">${formData.leaseStartDate || '___________'}</span> (date of rent commencing from) and this lease can be extended further by both the parties with their mutual consent on the basis of prevailing rental value in the market .</p>

    <p>5. That the Lessee shall pay Electricity & Water charge as per the proportionate consumption of the meter to the Lessor /Owner.</p>

    <p>6. That the Tenant/Lessee shall not be entitled to make structure in the rented premises except the installation of temporary decoration, wooden partition/ cabin, air – conditioners etc. without the prior consent of the owner.</p>

    <p>7. That the Tenant/lessee can neither make addition/alteration in the said premises without the written consent of the owner, nor the lessee can sublet part or entire premises to any person(s)/firm(s)/company(s).</p>

    <p>Contd: 2/-</p>
    <div style="page-break-after: always;"></div>

    <p>8. That the Tenant/Lessee shall permit the Lessor/Owner or his Authorized agent to enter in to the said tenanted premises for inspection/general checking or to carry out the repair work, at any reasonable time.</p>

    <p>9. That the Tenant/Lessee shall keep the said premises in clean & hygienic condition and shall not do or causes to be done any act which may be a nuisance to other.</p>

    <p>10. That the Tenant/Lessees shall carry on all day to day minor repairs at his/her own cost.</p>

    <p>11. That this Agreement may be terminated before the expiry of this tenancy period by serving One month prior notice by either party for this intention .</p>

    <p>12. That the Lessee shall use the above said premises for Official Purpose Only.</p>

    <p>13. That the Lessee/Tenant Shall not store/Keep any offensive, dangerous, explosive or highly Inflammable articles in the said premises and shall not use the same for any unlawful activities .</p>

    <p>14. That the Lessee shall pay the one month’s advance rent to the Lessor the same shall be adjusted in monthly rent.</p>

    <p>15. That both the parties have read over and understood all the contents of this agreement and have signed the same without any force or pressure from any side.</p>

    <p>In WITNESS WHEREOF the lessor/Owner and the Tenant / Lessee have hereunto subscribed their hand at <span class="bold underline">${formData.signingPlace || '______'}</span> (place) on this the <span class="bold underline">${formData.signingDate || '_____________'}</span> (date of rent agreement) year first above Mentioned in presents of the following Witnesses</p>

    <div class="witnesses">
        <p>WITNESSES:-</p>
        <p>1. ____________________</p>
        <p>2. ____________________</p>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <p class="bold underline">${formData.landlordName || '___________'}</p>
            <p>(name of the landlord)</p>
            <p>Lessor</p>
        </div>
        <div class="signature-box">
            <p class="bold underline">${formData.companyName || '_________________'}</p>
            <p>(name of the proposed Company)</p>
            <p>Lessee</p>
        </div>
    </div>
</body>
</html>
    `;

    return await generatePDFFromHTML(html);
};

/**
 * Generate Generic PDF for other document types
 * @param {string} title - Document title
 * @param {Object} formData - Form data
 * @returns {Buffer} - PDF buffer
 */
const generateGenericPDF = async (title, formData) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        .title { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 30px; font-size: 16pt; }
        .field-row { margin-bottom: 10px; }
        .label { font-weight: bold; }
        .value { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="title">${title.toUpperCase()}</div>
    <p>This document was generated by Legalyze AI.</p>
    <hr/>
    ${Object.entries(formData).map(([key, value]) => `
        <div class="field-row">
            <span class="label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
            <span class="value">${value}</span>
        </div>
    `).join('')}
    <hr/>
    <p>This is a legally binding document generated on ${new Date().toLocaleDateString()}.</p>
</body>
</html>
    `;
    return await generatePDFFromHTML(html);
};

// Helper function to generate PDF from HTML
const generatePDFFromHTML = async (html) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
    });
    
    await browser.close();
    return pdfBuffer;
};

module.exports = { generateRentAgreementPDF, generateGenericPDF };
