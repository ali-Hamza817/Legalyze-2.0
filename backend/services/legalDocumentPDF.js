const PDFDocument = require('pdfkit');

/**
 * Legal Document PDF Generator
 * Generates professional Petitions, Applications, and Suits in A4 format
 */

/**
 * Generate Legal Document PDF
 * @param {Object} data - { document, session, user }
 * @returns {Promise<Buffer>} - PDF Buffer
 */
async function generateLegalDocumentPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const { document, session, user } = data;
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 90, bottom: 72, left: 72, right: 72 } // Larger top margin for legal look
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // --- HEADER (Mock High Court Style) ---
            doc.fontSize(14).font('Helvetica-Bold').text(document.type.toUpperCase(), { align: 'center' });
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').text('IN THE HIGH COURT OF THE RELEVANT JURISDICTION', { align: 'center' });
            doc.moveDown(2);

            // --- CONTENT PARSING ---
            const lines = document.content.split('\n');
            
            lines.forEach(line => {
                const trimmed = line.trim();
                
                // Handle different Markdown-like structures from OpenAI
                if (trimmed.startsWith('# ')) {
                    doc.moveDown(1);
                    doc.fontSize(14).font('Helvetica-Bold').text(trimmed.replace('# ', '').trim(), { align: 'center' });
                    doc.moveDown(0.5);
                } else if (trimmed.startsWith('## ')) {
                    doc.moveDown(0.8);
                    doc.fontSize(12).font('Helvetica-Bold').text(trimmed.replace('## ', '').trim());
                    doc.moveDown(0.4);
                } else if (trimmed.startsWith('### ')) {
                    doc.moveDown(0.5);
                    doc.fontSize(11).font('Helvetica-Bold').text(trimmed.replace('### ', '').trim());
                    doc.moveDown(0.3);
                } else if (trimmed.length > 0) {
                    // Standard legal paragraph
                    doc.fontSize(11).font('Helvetica').text(trimmed, { align: 'justify', lineHeight: 1.5 });
                    doc.moveDown(0.4);
                } else {
                    doc.moveDown(0.2);
                }
            });

            // --- FOOTER ---
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#999999').text(
                    `Drafted via Legalyze AI - Page ${i + 1} of ${pages.count}`,
                    72, 
                    770, 
                    { align: 'center', width: 451 }
                );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateLegalDocumentPDF
};
