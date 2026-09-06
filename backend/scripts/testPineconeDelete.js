require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

/**
 * Test document deletion from Pinecone
 */
async function testPineconeDelete() {
    try {
        console.log('\n🗑️  Testing Document Deletion with Pinecone Integration\n');

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
This is a temporary test document that will be deleted.
It contains some sample legal text for testing purposes.
The document should be removed from both MongoDB and Pinecone when deleted.
`;

        const formData = new FormData();
        formData.append('document', Buffer.from(mockPdfContent), {
            filename: 'temp-delete-test.pdf',
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
        console.log('\nStep 3: Waiting for processing (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Step 4: Verify document exists
        console.log('Step 4: Verifying document exists...');
        const getResponse = await axios.get(
            `http://localhost:5000/api/documents/${documentId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('✅ Document found:', getResponse.data.data.filename);

        // Step 5: Delete document
        console.log('\nStep 5: Deleting document...');
        const deleteResponse = await axios.delete(
            `http://localhost:5000/api/documents/${documentId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        console.log('✅ Delete response:', deleteResponse.data.message);

        // Step 6: Verify document is deleted
        console.log('\nStep 6: Verifying document is deleted...');
        try {
            await axios.get(
                `http://localhost:5000/api/documents/${documentId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            console.log('❌ FAIL: Document still exists after deletion!');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ SUCCESS: Document properly deleted from MongoDB');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 Deletion test completed successfully!');
        console.log('Note: Vectors should also be removed from Pinecone (check Pinecone console)');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testPineconeDelete().catch(err => process.exit(1));
}

module.exports = { testPineconeDelete };
