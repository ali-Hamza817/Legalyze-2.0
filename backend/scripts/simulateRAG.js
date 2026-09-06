const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:5005/api';
const TEST_EMAIL = `test.rag.${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'Password123!';

// Create a dummy PDF file for testing
const createDummyPDF = () => {
    const filePath = path.join(__dirname, 'test_document.pdf');
    // Simple PDF header/footer to make it a valid-ish PDF structure for testing
    const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Legalyze RAG Test Document) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000117 00000 n
0000000240 00000 n
0000000327 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
421
%%EOF`;
    fs.writeFileSync(filePath, content);
    return filePath;
};

const runSimulation = async () => {
    console.log('🚀 Starting Legalyze RAG Simulation...\n');

    try {
        // 1. Signup
        console.log('1️⃣  Simulating User Signup...');
        const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
            firstName: 'RAG',
            lastName: 'Tester',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            dateOfBirth: '1990-01-01'
        });
        console.log('✅ Signup successful!');
        
        // 2. Login (to get token)
        console.log('\n2️⃣  Simulating User Login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful! Token received.');

        // 3. Upload Document
        console.log('\n3️⃣  Simulating Document Upload (S3 + Encryption)...');
        const pdfPath = createDummyPDF();
        const formData = new FormData();
        formData.append('document', fs.createReadStream(pdfPath));

        const uploadResponse = await axios.post(`${API_URL}/documents/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        const documentId = uploadResponse.data.data.id;
        console.log(`✅ Document uploaded! ID: ${documentId}`);
        console.log('   (Document is being processed in background...)');

        // Wait for processing (simulated delay)
        console.log('   Waiting 15 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // 4. Chat with RAG
        console.log('\n4️⃣  Simulating RAG Chat...');
        const chatResponse = await axios.post(`${API_URL}/chat`, {
            message: "What is this document about?",
            documentIds: [documentId]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Chat response received!');
        console.log('🤖 AI Response:', chatResponse.data.data.message);

        // Cleanup
        fs.unlinkSync(pdfPath);
        console.log('\n✨ Simulation completed successfully!');

    } catch (error) {
        console.error('\n❌ Simulation Failed:', error.response ? error.response.data : error.message);
    }
};

runSimulation();
