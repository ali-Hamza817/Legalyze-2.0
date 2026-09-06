require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

/**
 * Test document upload and Pinecone indexing
 */
async function testPineconeUpload() {
    try {
        console.log('\n📤 Testing Document Upload with Pinecone Integration\n');

        // Step 1: Login to get auth token
        console.log('Step 1: Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'Test123!@#'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        // Step 2: Create a test PDF buffer with mock content
        console.log('Step 2: Preparing test document...');
        const mockPdfContent = `%MOCK-PDF
This is a test legal document for Pinecone RAG testing.

Terms and Conditions:
1. The first party agrees to provide services as described.
2. The second party agrees to pay within 30 days of invoice.
3. This agreement is governed by the laws of Virginia.

Termination Clause:
Either party may terminate this agreement with 60 days written notice.

Confidentiality:
Both parties agree to maintain confidentiality of proprietary information.
`;

        // Step 3: Upload document
        console.log('Step 3: Uploading document...');
        const formData = new FormData();
        formData.append('document', Buffer.from(mockPdfContent), {
            filename: 'test-contract.pdf',
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

        console.log('✅ Document uploaded successfully');
        console.log('📋 Document ID:', uploadResponse.data.data.id);
        console.log('📄 Filename:', uploadResponse.data.data.filename);
        
        const documentId = uploadResponse.data.data.id;

        // Step 4: Wait for processing
        console.log('\nStep 4: Waiting for document processing (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Step 5: Check document status
        console.log('Step 5: Checking document status...');
        const docResponse = await axios.get(
            `http://localhost:5000/api/documents/${documentId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('\n📊 Document Status:');
        console.log('  - Processed:', docResponse.data.data.processed);
        console.log('  - Pinecone Indexed:', docResponse.data.data.pineconeIndexed);
        console.log('  - Chunk Count:', docResponse.data.data.chunkCount);

        if (docResponse.data.data.processed && docResponse.data.data.pineconeIndexed) {
            console.log('\n✅ SUCCESS: Document processed and indexed in Pinecone!');
        } else {
            console.log('\n⚠️  WARNING: Document not fully processed');
            if (docResponse.data.data.processingError) {
                console.log('Error:', docResponse.data.data.processingError);
            }
        }

        console.log('\n🎉 Test completed successfully!');
        console.log('📝 Document ID for further testing:', documentId);
        return documentId;

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testPineconeUpload().catch(err => process.exit(1));
}

module.exports = { testPineconeUpload };
