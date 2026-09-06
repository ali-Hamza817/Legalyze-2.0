# Pinecone Configuration Required

Add the following environment variables to your `.env` file in the backend directory:

```env
# Pinecone Configuration
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX_NAME=legal-documents
PINECONE_ENVIRONMENT=us-east-1
```

This configuration is required for the Pinecone vector storage integration to work properly.
