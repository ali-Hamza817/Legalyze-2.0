const fs = require('fs');
const path = require('path');

function normalizeFile(txtName) {
    const txtPath = path.join(__dirname, 'supporting_documentation', txtName);
    if (!fs.existsSync(txtPath)) {
        console.error(`ERROR: ${txtPath} not found.`);
        return;
    }

    console.log(`Normalizing whitespace in ${txtName}...`);
    let text = fs.readFileSync(txtPath, 'utf-8');
    
    const originalLen = text.length;

    // Replace non-breaking spaces and other Unicode spaces with standard spaces
    text = text.replace(/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ');
    
    // Normalize carriage returns and make sure line endings are clean
    text = text.replace(/\r\n/g, '\n');
    
    // Replace multiple spaces on a line with a single space
    text = text.split('\n').map(line => {
        return line.replace(/[ \t]+/g, ' ');
    }).join('\n');

    fs.writeFileSync(txtPath, text, 'utf-8');
    console.log(`Normalized ${originalLen} chars down to ${text.length} chars in ${txtName}.`);
}

function main() {
    normalizeFile('Pakistan Penal Code.txt');
    normalizeFile('Code of Criminal Procedure.txt');
    normalizeFile('Qanun-e-Shahadat Order.txt');
    normalizeFile('Constitution of Pakistan.txt');
}

main();
