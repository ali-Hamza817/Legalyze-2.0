# Pinecone RAG Integration - Testing Guide

## Prerequisites

1. **Add Pinecone configuration to `.env` file:**
   ```env
   PINECONE_API_KEY=<your-pinecone-api-key>
   PINECONE_INDEX_NAME=legal-documents
   PINECONE_ENVIRONMENT=us-east-1
   ```

2. **Ensure backend server is running:**
   ```bash
   npm start
   ```

3. **Ensure test user exists** (email: `test@example.com`, password: `Test123!@#`)
   - If not, create one through the signup endpoint or seed script

## Test Scripts

### 1. Test Document Upload & Pinecone Indexing

Tests that documents are properly uploaded, processed, and indexed in Pinecone.

```bash
node scripts/testPineconeUpload.js
```

**What it tests:**
- User authentication
- Document upload to S3
- Text extraction and chunking
- Embedding generation (1024 dimensions)
- Vector storage in Pinecone
- Document status tracking

**Expected output:**
- ✅ Document uploaded successfully
- ✅ Document processed and indexed in Pinecone
- Document ID for further testing

---

### 2. Test RAG Query with Pinecone

Tests that chat queries retrieve relevant context from Pinecone and generate accurate responses.

```bash
node scripts/testPineconeRAG.js
```

**What it tests:**
- Document upload and indexing
- Query embedding generation
- Pinecone vector similarity search
- Context retrieval and formatting
- AI response generation with document context

**Expected output:**
- ✅ Salary query correctly references document content
- ✅ Termination query correctly references document content
- AI responses contain specific information from uploaded document

---

### 3. Test Document Deletion from Pinecone

Tests that deleting documents also removes vectors from Pinecone.

```bash
node scripts/testPineconeDelete.js
```

**What it tests:**
- Document upload and indexing
- Document deletion from S3
- Vector deletion from Pinecone
- Document deletion from MongoDB
- Verification of complete cleanup

**Expected output:**
- ✅ Document deleted from MongoDB
- ✅ Document not accessible after deletion
- Vectors removed from Pinecone (check Pinecone console)

---

## Manual End-to-End Testing

### Using the Frontend Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend** (if applicable):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow:**
   - Login to the application
   - Navigate to Documents section
   - Upload a legal document (PDF or DOCX)
   - Wait for processing (~30 seconds)
   - Verify document shows as "Processed" and "Pinecone Indexed"
   - Start a chat conversation
   - Attach the uploaded document
   - Ask specific questions about the document content
   - Verify AI responses reference the document accurately
   - Delete the document
   - Verify it's removed from the list

---

## Verification Checklist

- [ ] Document upload works without errors
- [ ] Documents are processed and indexed in Pinecone
- [ ] `chunkCount` and `pineconeIndexed` fields are set correctly
- [ ] Chat queries retrieve relevant context from Pinecone
- [ ] AI responses contain accurate information from documents
- [ ] Document deletion removes vectors from Pinecone
- [ ] No MongoDB chunks field errors in logs
- [ ] Pinecone console shows vectors being created and deleted

---

## Troubleshooting

### Error: "Pinecone API key is invalid"
- Check that `PINECONE_API_KEY` is correctly set in `.env`
- Ensure no trailing spaces or quotes

### Error: "Index not found"
- Verify `PINECONE_INDEX_NAME` matches your Pinecone index name
- Check index exists in Pinecone console

### Documents not being indexed
- Check backend logs for processing errors
- Verify OpenAI API key is valid
- Ensure S3 upload is working

### RAG queries return empty context
- Verify documents show `pineconeIndexed: true`
- Check that `documentIds` are being passed in chat requests
- Review Pinecone console for indexed vectors

---

## Architecture Overview

**Document Upload Flow:**
1. Client uploads document → Backend API
2. File saved to S3
3. Document record created in MongoDB
4. Text extraction (PDF/DOCX)
5. Text chunking (1000 chars with overlap)
6. Embedding generation (OpenAI, 1024 dimensions)
7. Vectors upserted to Pinecone with metadata
8. Document marked as `processed` and `pineconeIndexed`

**RAG Query Flow:**
1. User sends chat message with documentIds
2. Query embedding generated (1024 dimensions)
3. Pinecone queried for top K similar vectors (filtered by userId and documentIds)
4. Relevant chunks retrieved with metadata
5. Context formatted and added to OpenAI prompt
6. AI generates response using document context

**Document Deletion Flow:**
1. Client requests document deletion
2. Vectors deleted from Pinecone (by documentId filter)
3. File deleted from S3
4. Document deleted from MongoDB

---

## Next Steps

After successful testing:
- Delete test documents to clean up Pinecone
- Monitor Pinecone usage in dashboard
- Consider implementing batch cleanup scripts
- Add error recovery mechanisms
- Implement retry logic for Pinecone operations
