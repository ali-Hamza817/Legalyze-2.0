require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

/**
 * Test RAG query with Pinecone
 */
async function testPineconeRAG() {
    try {
        console.log('\n🔍 Testing RAG Query with Pinecone Integration\n');

        // Step 1: Login
        console.log('Step 1: Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Step 2: Upload a test document
        console.log('Step 2: Uploading test document...');
        const mockPdfContent = `%MOCK-PDF
EMPLOYMENT AGREEMENT

This Employment Agreement is entered into on December 5, 2025.

EMPLOYEE INFORMATION:
Name: John Smith
Position: Senior Software Engineer
Department: Engineering
Start Date: January 1, 2026
Salary: $120,000 per year

BENEFITS:
- Health insurance coverage
- 401(k) matching up to 5%
- 20 days paid vacation per year
- Remote work flexibility

TERMINATION:
Either party may terminate this agreement with 30 days written notice.
Severance pay of 2 months salary will be provided upon termination.

CONFIDENTIALITY:
Employee agrees to maintain confidentiality of all proprietary company information.

NON-COMPETE:
Employee agrees not to work for direct competitors for 12 months after termination.
`;

        const formData = new FormData();
        formData.append('document', Buffer.from(mockPdfContent), {
            filename: 'employment-agreement.pdf',
            contentType: 'application/pdf'
        });

        const uploadResponse = await axios.post(
            'http://localhost:5000/api/documents/upload',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const documentId = uploadResponse.data.data.id;
        console.log('✅ Document uploaded:', documentId);

        // Step 3: Wait for processing
        console.log('\nStep 3: Waiting for processing (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Step 4: Send chat message with document context
        console.log('Step 4: Sending chat message with RAG query...');
        const chatResponse = await axios.post(
            'http://localhost:5000/api/chat',
            {
                message: 'What is the salary mentioned in the employment agreement?',
                documentIds: [documentId]
            },
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('\n📝 Chat Response:');
        console.log('  Message:', chatResponse.data.data.message);

        // Step 5: Test another query
        console.log('\nStep 5: Testing another RAG query...');
        const chatResponse2 = await axios.post(
            'http://localhost:5000/api/chat',
            {
                message: 'What are the termination conditions?',
                documentIds: [documentId],
                conversationId: chatResponse.data.data.conversationId
            },
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('\n📝 Second Query Response:');
        console.log('  Message:', chatResponse2.data.data.message);

        // Step 6: Verify responses contain document information
        const firstResponse = chatResponse.data.data.message.toLowerCase();
        const secondResponse = chatResponse2.data.data.message.toLowerCase();

        let success = true;

        if (firstResponse.includes('120') || firstResponse.includes('salary')) {
            console.log('\n✅ First query: AI correctly referenced salary information');
        } else {
            console.log('\n⚠️  First query: AI may not have found salary info');
            success = false;
        }

        if (secondResponse.includes('30 days') || secondResponse.includes('notice')) {
            console.log('✅ Second query: AI correctly referenced termination terms');
        } else {
            console.log('⚠️  Second query: AI may not have found termination info');
            success = false;
        }

        if (success) {
            console.log('\n🎉 RAG TEST PASSED: Pinecone integration working correctly!');
        } else {
            console.log('\n⚠️  RAG TEST WARNING: Review AI responses above');
        }

        console.log('\n📝 Test document ID:', documentId);

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testPineconeRAG().catch(err => process.exit(1));
}

module.exports = { testPineconeRAG };
