const fs = require('fs');
const path = require('path');
const pdf = require('e:/Masters in Software Engineering (MSSE 32) at Military College of Signals/Agentic AI/Legalyze-FullStack/backend/node_modules/pdf-parse');

async function extractPDFText(pdfName, txtName) {
    const pdfPath = path.join(__dirname, 'supporting_documentation', pdfName);
    const txtPath = path.join(__dirname, 'supporting_documentation', txtName);

    console.log(`Extracting text from ${pdfPath}...`);
    if (!fs.existsSync(pdfPath)) {
        console.error(`ERROR: ${pdfPath} not found.`);
        return;
    }

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text || '';
        
        console.log(`Successfully extracted ${text.length} characters from ${pdfName}.`);
        fs.writeFileSync(txtPath, text, 'utf-8');
        console.log(`Saved text to ${txtPath}.`);
    } catch (err) {
        console.error(`ERROR extracting ${pdfName}:`, err.message);
    }
}

async function main() {
    // Extract Pakistan Penal Code
    await extractPDFText('Pakistan Panel Code.pdf', 'Pakistan Penal Code.txt');
    
    // Extract Code of Criminal Procedure
    await extractPDFText('THE CODE OF CRIMINAL PROCEDURE, 1898.pdf', 'Code of Criminal Procedure.txt');
    
    // Extract Qanun-e-Shahadat Order
    await extractPDFText('THE QANUN-E-SHAHADAT, 1984.pdf', 'Qanun-e-Shahadat Order.txt');
}

main();
