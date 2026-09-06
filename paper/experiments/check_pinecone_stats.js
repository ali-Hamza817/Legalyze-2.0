require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function checkIndexStats() {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index(process.env.PINECONE_INDEX_NAME || 'legal-documents');
    
    console.log('Fetching index stats for:', process.env.PINECONE_INDEX_NAME || 'legal-documents');
    try {
        const stats = await index.describeIndexStats();
        console.log('Index Stats:', JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error('Error fetching index stats:', e);
    }
}

checkIndexStats();
