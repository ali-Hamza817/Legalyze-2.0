# Legalyze: System Architecture Diagrams & Flow Charts

---

## 1. SYSTEM ARCHITECTURE (Detailed Component View)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    CLIENT LAYER (BROWSER)                  ┃
┃                                                             ┃
┃  ┌─────────────────┐    ┌──────────────────┐              ┃
┃  │ React 18 + Vite │───▶│ Material-UI      │              ┃
┃  │ - Chat UI       │    │ Components       │              ┃
┃  │ - Wizard (7-St.)│    │ - Responsive     │              ┃
┃  │ - Admin Panel   │    │ - Dark/Light     │              ┃
┃  └─────────────────┘    └──────────────────┘              ┃
┃           │                       │                       ┃
┃           └───────────┬───────────┘                       ┃
┃                       │                                   ┃
┃           AuthContext + State Management                 ┃
┃           (Login, User, Preferences)                     ┃
┃           localStorage: JWT Bearer Token                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                           │
                           │ HTTPS/TLS
                           │ /api/* endpoints
                           ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   BACKEND API LAYER                        ┃
┃                 (Express.js, Node.js)                      ┃
┃                                                            ┃
┃  PORT: 5000  |  Timeout: 10 minutes  |  Env: production   ┃
┃                                                            ┃
┃  ┌────────────────────────────────────────────────────────┐┃
┃  │                    MIDDLEWARE STACK                    ││
┃  │ ┌─────────────────┬──────────────┬──────────────────┐ ││
┃  │ │ CORS: origin=*  │ Rate Limiter │ JWT Verify       │ ││
┃  │ │ (should limit   │ 5000 req/15m │ (Bearer token)   │ ││
┃  │ │  for prod)      │             │                  │ ││
┃  │ └─────────────────┴──────────────┴──────────────────┘ ││
┃  │ ┌──────────────────────────────────────────────────────┐ ││
┃  │ │           Input Validation (express-validator)       ││
┃  │ │ Email format, password strength, file MIME types    ││
┃  │ └──────────────────────────────────────────────────────┘ ││
┃  └────────────────────────────────────────────────────────┘┃
┃                           │                                ┃
┃  ┌────────┬──────────┬──────────┬────────┬────────────┐   ┃
┃  │  /api/ │  /api/   │  /api/   │ /api/  │   /api/    │   ┃
┃  │  auth  │  chat    │ documents│generate│ compliance │   ┃
┃  │        │          │          │        │            │   ┃
┃  └──┬─────┴───┬──────┴────┬─────┴────┬───┴────────────┘   ┃
┃     │         │           │          │                   ┃
┃  ┌──▼──┬──────▼───┬────────▼──┬───────▼────────┬────────┐ ┃
┃  │Auth │  Chat    │ Document  │ Case Building  │ Compli.│ ┃
┃  │Route│  Route   │  Route    │ Route          │ Route  │ ┃
┃  └─────┴──────────┴───────────┴────────────────┴────────┘ ┃
┃           │                                                 ┃
┃  ┌────────┴──────────────────────────────────────────────┐ ┃
┃  │              SERVICE LAYER                            │ ┃
┃  │ ┌────────────────────────────────────────────────────┐│ ┃
┃  │ │  LegalAgentService (Main Orchestrator)            ││ ┃
┃  │ │  - processQuery() - Intent classification        ││ ┃
┃  │ │  - Parallel retrieval (laws + docs + judgments)  ││ ┃
┃  │ │  - Context synthesis & LLM call                  ││ ┃
┃  │ │  - Fallback mechanisms                          ││ ┃
┃  │ └────────────────────────────────────────────────────┘│ ┃
┃  │ ┌────────────────────────────────────────────────────┐│ ┃
┃  │ │  PineconeService (Vector DB Access)              ││ ┃
┃  │ │  - queryVectors() - Semantic search              ││ ┃
┃  │ │  - upsertVectors() - Index documents             ││ ┃
┃  │ │  - Namespace filtering (user/law/judgment)       ││ ┃
┃  │ └────────────────────────────────────────────────────┘│ ┃
┃  │ ┌────────────────────────────────────────────────────┐│ ┃
┃  │ │  ConstitutionalComplianceService                 ││ ┃
┃  │ │  - checkCompliance() - Multi-law analysis        ││ ┃
┃  │ │  - findRelevantProvisions() - Find 15 laws       ││ ┃
┃  │ │  - generateReport() - JSON + PDF output          ││ ┃
┃  │ └────────────────────────────────────────────────────┘│ ┃
┃  │ ┌────────────────────────────────────────────────────┐│ ┃
┃  │ │  DocumentProcessor (Extraction & Embedding)      ││ ┃
┃  │ │  - Extract text (PDF/DOCX/OCR)                   ││ ┃
┃  │ │  - Structural chunking                          ││ ┃
┃  │ │  - Generate embeddings (1024 dim)                ││ ┃
┃  │ └────────────────────────────────────────────────────┘│ ┃
┃  │ ┌────────────────────────────────────────────────────┐│ ┃
┃  │ │  Other Services:                                 ││ ┃
┃  │ │  - FactExtractor - Extract from conversations    ││ ┃
┃  │ │  - FieldMapper - Map facts to document fields    ││ ┃
┃  │ │  - IntentDetector - Detect user intent           ││ ┃
┃  │ │  - PDFGenerator - Generate PDFs with Puppeteer   ││ ┃
┃  │ │  - TemplateRenderer - Convert templates → HTML   ││ ┃
┃  │ └────────────────────────────────────────────────────┘│ ┃
┃  └────────────────────────────────────────────────────────┘ ┃
┃                                                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    │                    │                    │
    ↓                    ↓                    ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  MongoDB     │  │  Pinecone    │  │  OpenAI API  │
│  Atlas       │  │  (Vectors)   │  │  (LLM)       │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Users        │  │ Constitution │  │ GPT-4o       │
│ Chats        │  │ Laws (PPC)   │  │ GPT-4o-mini  │
│ Documents    │  │ Judgments    │  │ Embeddings   │
│ Compliance   │  │ User-uploads │  │              │
│ Reports      │  │ (4 NS)       │  │              │
│ Cases        │  └──────────────┘  └──────────────┘
│ Sessions     │
│ Prompts      │
└──────────────┘

    │
    │ (Fallback)
    ↓
┌──────────────┐
│  AWS S3      │
│  Private Bucket
├──────────────┤
│ Documents    │
│ Reports      │
│ Generated    │
│ PDFs         │
│ (AES256      │
│  encrypted)  │
└──────────────┘


```

---

## 2. DATA FLOW ARCHITECTURE: How Information Flows Through System

```
SCENARIO 1: USER UPLOADS DOCUMENT → CHAT RETRIEVAL
══════════════════════════════════════════════════════════════

User: "I have this FIR notice. What can I do?"
  │
  ├─ Uploads PDF to frontend UI
  │
  └─ POST /api/documents/upload
     │
     ├─ Validation: File size <10MB, MIME type check
     │
     ├─ AWS S3 Upload
     │  │ Storage Key: documents/{userId}/{timestamp}_{uuid}/{filename}
     │  └─ Return S3 Key + URL
     │
     ├─ Create Document record in MongoDB
     │  │ Fields: filename, s3Key, s3Url, fileSize, processed=false
     │  └─ Return documentId
     │
     └─ Async Process via WorkflowOrchestrator:
        ├─ Extract text from PDF
        │  │ Tool: pdf-parse
        │  └─ Output: full text (10,000+ words)
        │
        ├─ Extract LWOE metadata
        │  │ Parse: parties, court, dates, statutes, outcome
        │  └─ Update Document record
        │
        ├─ Structural chunking
        │  │ Split by sections/paragraphs (preserve context)
        │  │ Create chunks: ~500-1000 tokens each
        │  └─ Generate 15-20 chunks from document
        │
        ├─ Generate embeddings
        │  │ For each chunk:
        │  ├─ Call OpenAI /embeddings
        │  ├─ Model: text-embedding-3-small
        │  └─ Receive: 1024-dimensional vector
        │
        ├─ Upsert to Pinecone
        │  │ Namespace: 'user-uploads' (filter by userId)
        │  │ Metadata: {documentId, userId, chunkIndex, text}
        │  └─ Index complete
        │
        └─ Update MongoDB Document
           └─ Set: processed=true, pineconeIndexed=true, chunkCount=15

Now user asks in chat:
  │
  ├─ User: "Does this FIR mention my fundamental rights?"
  │
  └─ POST /api/chat
     │
     ├─ Auth: Verify JWT token
     │
     ├─ Auto-resolve documents:
     │  ├─ Check: documentIds in request?
     │  ├─ If not: Query Pinecone for recent uploads by userId
     │  └─ Return: [documentId_1, documentId_2]
     │
     ├─ Call LegalAgentService.processQuery()
     │  │
     │  ├─ STEP 1: Intent Classification
     │  │  │ System: "Classify this query into domain"
     │  │  │ Query: "Does this FIR mention my fundamental rights?"
     │  │  │ GPT-4o-mini response: { domain: "constitutional", action: "check_rights" }
     │  │  └─ Routing: constitutional branch activated
     │  │
     │  ├─ STEP 2: Parallel Retrieval (3 tools fire simultaneously)
     │  │  │
     │  │  ├─ Tool 1: User Documents
     │  │  │  │ Query embedding: "What are fundamental rights in FIR?"
     │  │  │  │ Pinecone search: 'user-uploads' namespace, userId filter
     │  │  │  │ Return: Top 3 similar chunks from uploaded FIR
     │  │  │  └─ Example chunk: "Police arrested without Article 10 compliance"
     │  │  │
     │  │  ├─ Tool 2: Constitution Articles
     │  │  │  │ Pinecone search: 'constitution-pakistan' namespace
     │  │  │  │ Return: Top 5 articles matching "fundamental rights"
     │  │  │  └─ Examples: Article 9 (Protection), Article 10 (Safeguards), Article 14 (Dignity)
     │  │  │
     │  │  └─ Tool 3: Authoritative Laws
     │  │     │ Pinecone search: 'authoritative-laws' namespace
     │  │     │ Filter: isAuthoritative = true
     │  │     │ Return: Top 5 CrPC/PPC sections on arrest
     │  │     └─ Examples: CrPC Section 55 (search), CrPC Section 61 (arrest)
     │  │
     │  ├─ STEP 3: Context Synthesis
     │  │  │ Format all results:
     │  │  │ "CONTEXT:
     │  │  │  - Constitution Article 10: 'Every person arrested shall be
     │  │  │    produced before magistrate within 24 hours...'
     │  │  │  - CrPC Section 55: Police cannot search without...'
     │  │  │  - From your FIR: 'Arrested without notice, no reason given'"
     │  │  │
     │  │  └─ ReadyForLLM ✓
     │  │
     │  └─ STEP 4: Response Generation
     │     │ System: "You are Legalyze AI, expert in Pakistani law"
     │     │ Context: [formatted above]
     │     │ User: "Does this FIR mention my fundamental rights?"
     │     │
     │     │ GPT-4o:
     │     │   "Your FIR appears to violate Article 10 of the Constitution.
     │     │    Under Article 10, you must be produced before a magistrate
     │     │    within 24 hours of arrest. Additionally, CrPC Section 55
     │     │    specifies police search procedures..."
     │     │
     │     └─ Return response to frontend
     │
     ├─ Extract Facts: AI identifies "arrest", "24 hours", "magistrate"
     │  └─ Update User.extractedFacts for future document generation
     │
     ├─ Detect Intent: System detects "generate bail petition" suggestion
     │  └─ Flag: hasGenerationIntent=true, documentType="BAIL_497"
     │
     ├─ Save to Conversation
     │  │ Add message: { role: "user", content: "..." }
     │  │ Add message: { role: "assistant", content: "..." }
     │  │ Link documents: documentIds
     │  └─ Save to MongoDB
     │
     └─ Response to Frontend:
        {
          "messageId": "msg_789",
          "response": "Your FIR appears to violate...",
          "generationData": {
            "hasGenerationIntent": true,
            "documentType": "BAIL_497",
            "suggestedTemplate": "Bail Application u/s 497 CrPC"
          },
          "sources": ["Article 10 Constitution", "CrPC Section 55"]
        }

User clicks "Generate Bail Petition"
  │
  └─ POST /api/smart-generate
     │
     ├─ Retrieve User.extractedFacts
     │  │ Facts: name, CNIC, arrest date, case number, etc.
     │  └─ Check completeness: 60% fields ready
     │
     ├─ Fetch Document Template: BAIL_497
     │  │ Template: Handlebars with {{name}}, {{cnic}}, {{arrestDate}}, etc.
     │  └─ Partial fields auto-filled, others left blank for user
     │
     ├─ Map facts to fields:
     │  │ {name: "Ahmed", cnic: "12345-6789012-3", arrestDate: "2026-04-01"}
     │  └─ Merge with template variables
     │
     ├─ Generate HTML from template
     │  │ Handlebars render with field data
     │  └─ Return: Professional formatted bail petition (HTML)
     │
     ├─ Create GeneratedDocument in MongoDB
     │  │ Fields: userId, documentType, htmlContent, formData, s3Key
     │  └─ Save to DB
     │
     └─ Response to Frontend:
        {
          "documentId": "gen_456",
          "html": "<html><body>...petition HTML...</body></html>",
          "viewToken": "eyJhbGc..." (1-hour JWT),
          "shareUrl": "https://legalyze.example/view/gen_456?token=..."
        }


SCENARIO 2: CONSTITUTIONAL COMPLIANCE CHECK
══════════════════════════════════════════════════════════════

User uploads notice document
  │
  └─ POST /api/constitutional-compliance/check
     │
     ├─ Upload notice PDF to S3
     │  └─ Store with key: compliance/{userId}/{timestamp}/notice.pdf
     │
     ├─ Extract text from PDF
     │  │ Tool: pdf-parse
     │  └─ Full text extracted
     │
     ├─ Agentic Classification
     │  │ Query: "Is this a legal document?" (rule out contracts, etc.)
     │  │ GPT-4o-mini: { isLegal: true, docType: "arrest_notice" }
     │  └─ Proceed ✓
     │
     ├─ Find Relevant Constitutional Provisions
     │  │ Query Pinecone: 'authoritative-laws' namespace with top-K=15
     │  │ Laws to match: Constitution + PPC + CrPC + ICCPR equivalents
     │  └─ Return: 15 relevant sections
     │
     ├─ Multi-Law Compliance Analysis (AI-powered)
     │  │ System: "Check if notice complies with each law"
     │  │ For each provision:
     │  │  ├─ Extract relevant part from notice
     │  │  ├─ Compare against constitutional requirement
     │  │  │  Prompt: "Does this text comply with Article X? Answer: YES/NO/PARTIAL"
     │  │  │  Result: "NO - violates Article 10 (24-hour rule)"
     │  │  └─ Record violation
     │  │
     │  └─ Generate JSON report:
     │     {
     │       "complianceStatus": "NON_COMPLIANT",
     │       "complianceScore": 35,
     │       "violations": [
     │         {
     │           "article": "Article 10",
     │           "requirement": "Produce before magistrate within 24 hours",
     │           "finding": "Notice issued but no timeline specified",
     │           "severity": "HIGH"
     │         },
     │         {
     │           "article": "CrPC Section 55",
     │           "requirement": "...",
     │           "finding": "...",
     │           "severity": "MEDIUM"
     │         }
     │       ]
     │     }
     │
     ├─ Generate PDF Report with Violations
     │  │ Tool: puppeteer (HTML → PDF)
     │  │ Content: Executive summary + detailed analysis + recommendations
     │  └─ Save to S3 with key: compliance/{userId}/{reportId}.pdf
     │
     ├─ Save ComplianceCheck Record in MongoDB
     │  │ Fields: documentName, s3Url, complianceStatus, complianceScore, detailedAnalysis, reportText
     │  └─ Link to user
     │
     ├─ Link to Conversation
     │  │ Create new conversation
     │  │ Add system message: "Here is your compliance report..."
     │  │ Embed report as markdown table
     │  └─ Save markdown for future reference
     │
     └─ Response to Frontend:
        {
          "complianceStatus": "NON_COMPLIANT",
          "score": 35,
          "reportPdf": "https://s3.amazonaws.com/.../report.pdf",
          "violations": [...]
        }


SCENARIO 3: CASE BUILDING WIZARD (7-Step Flow)
══════════════════════════════════════════════════════════════

User: Let me build a case strategy

Step 0: INTAKE
  └─ POST /api/case-building/create-session
     ├─ Create CaseBuildingSession record
     ├─ Save: facts, clientPosition, courtLevel, urgency
     └─ Return: sessionId, step=0

Step 1: CLASSIFICATION (AI analyzes case)
  └─ POST /api/case-building/analyze
     ├─ System: "Classify this case"
     ├─ Input: Case facts from Step 0
     ├─ GPT-4o: Determines criminal vs. civil vs. constitutional
     ├─ Extract: Legal issues, jurisdiction, parties
     └─ Save: classification results to session

Step 2: RELEVANT LAWS (Search statutes)
  └─ POST /api/case-building/find-laws
     ├─ Query Pinecone: 'authoritative-laws' namespace
     ├─ Top-K: 8 most relevant sections (PPC/CrPC/CPC)
     ├─ For each law: explain application to case
     └─ Save: relevantLaws array to session

Step 3: PRECEDENTS (Search case law)
  └─ POST /api/case-building/find-precedents
     ├─ Query Pinecone: 'judgments' namespace
     ├─ Hybrid search: keyword + semantic similarity
     ├─ Return: 8 precedents with ratios (legal principles)
     └─ Save: precedents array to session

Step 4: STRATEGY (AI generates memorandum)
  └─ POST /api/case-building/generate-strategy
     ├─ Input: Facts + Laws + Precedents from previous steps
     ├─ GPT-4o: Write 500+ word strategic memorandum
     │  System: "You are Pakistani legal strategist. Address weaknesses..."
     │  Context: Laws + precedents + facts
     │  Output: Aggressive + defensive strategies, cited authorities
     ├─ Save: strategy text to session
     └─ Response: Strategy displayed to user

Step 5: FILING DETAILS (Form fields)
  └─ Dynamic form based on petition type
     ├─ Field sections: Personal, Court, Evidence, etc.
     ├─ Auto-populate from User.extractedFacts
     ├─ User can override/add values
     └─ Save: factualFields map to session

Step 6: DRAFTING (Generate petition)
  └─ POST /api/smart-generate or /api/generate
     ├─ Fetch template: e.g., WRIT_PETITION_199
     ├─ Map facts to template variables
     ├─ Render HTML via Handlebars
     ├─ Generate PDF via puppeteer
     ├─ Create GeneratedDocument record
     └─ Return: HTML + PDF for export

Final: Export & Share
  └─ User downloads PDF or shares via token URL


SCENARIO 4: ADMIN ACTIONS
══════════════════════════════════════════════════════════════

Super Admin: Edit legal AI prompt

POST /api/admin/verify-secret
  ├─ Validate secret code (e.g., "LEGAL2024")
  └─ If valid → unlock prompt editor

POST /api/admin/prompts/:promptId PUT
  ├─ Update SystemPrompt in MongoDB
  │  New content: "You are Legalyze AI, specialized in..."
  │
  └─ On next user query:
     ├─ Service loads latest prompt from DB
     ├─ LegalAgentService uses updated system prompt
     └─ All subsequent responses use new instructions

GET /api/admin/analytics
  ├─ Query MongoDB for historical data
  ├─ Aggregate: users, chats, documents, compliance checks
  └─ Return: CSV/JSON for dashboard visualization


```

---

## 3. AGENTIC RAG ORCHESTRATION FLOW

```
┌──────────────────────────────────────────────────────────┐
│           USER QUERY ENTERS SYSTEM                       │
│    "What are my options if arrested without FIR?"        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ LegalAgentService.          │
        │ processQuery(message, opts) │
        └────────────┬────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
   [INTENT CLASSIFICATION]  [FALLBACK: General legal knowledge]
        │                     (Low priority)
        │ System prompt:
        │ "Classify domain"
        │
        │ GPT-4o-mini:
        │ Returns:
        │ {
        │   domain: "criminal",
        │   action: "legal_advice",
        │   intent: "understand_rights"
        │ }
        │
        ↓
   ┌─────────────────────────────────────────┐
   │ PARALLEL RETRIEVAL STAGE                │
   │ (3 tools fire simultaneously)            │
   ├─────────────────────────────────────────┤
   │                                         │
   │ TOOL 1: User Documents                  │
   │ ├─ Query: "arrest without FIR rights"  │
   │ ├─ Pinecone: user-uploads namespace     │
   │ ├─ Filter: userId + documentIds         │
   │ ├─ Top-K: 5 chunks                      │
   │ └─ Result: Relevant parts of FIR/orders │
   │                                         │
   │ TOOL 2: Constitution                    │
   │ ├─ Query: "arrest detention rights"    │
   │ ├─ Pinecone: constitution-pakistan      │
   │ ├─ Filter: None (global)                │
   │ ├─ Top-K: 5 articles                    │
   │ └─ Result: Articles 9,10,14,16,25       │
   │                                         │
   │ TOOL 3: Authoritative Laws              │
   │ ├─ Query: "arrest without FIR procedure"│
   │ ├─ Pinecone: authoritative-laws         │
   │ ├─ Filter: isAuthoritative=true         │
   │ ├─ Top-K: 5 sections                    │
   │ └─ Result: CrPC 54-61, 154-160          │
   │                                         │
   └─────────────────────────────────────────┘
        │
        ↓
   ┌────────────────────────────────┐
   │ CONTEXT SYNTHESIS              │
   │ Format all retrieval results    │
   │ into structured prompt context  │
   └────────────┬───────────────────┘
                │
                ↓
       ┌─────────────────────────────────┐
       │ USER QUERY CONTEXT:             │
       │                                 │
       │ "CONTEXT FROM LEGAL SOURCES:    │
       │                                 │
       │ 1. CONSTITUTION ARTICLE 10:     │
       │    'Every person arrested shall │
       │     be produced before magistr. │
       │     within 24 hours...'         │
       │                                 │
       │ 2. CRPC SECTION 61:             │
       │    'Police may not compel a     │
       │     person to accompany unless  │
       │     legally authorized...'      │
       │                                 │
       │ 3. YOUR DOCUMENT (FIR):         │
       │    'Arrested Ahmed without      │
       │     written notice of charges...'│
       │                                 │
       │ Now answer: What are my options │
       │ if arrested without FIR?        │
       └─────────────────────────────────┘
                │
                ↓
       ┌────────────────────────────────┐
       │ GPT-4o RESPONSE GENERATION      │
       │                                │
       │ System Prompt (from DB):        │
       │ "You are Legalyze AI, special- │
       │  ized in Pakistani law..."     │
       │                                │
       │ + Context (above)              │
       │ + User Query                   │
       │                                │
       │ = Full Request to OpenAI       │
       │   /chat/completions            │
       └────────────┬───────────────────┘
                    │
                    ↓
           ┌────────────────────────┐
           │  OpenAI GPT-4o Response:│
           │                        │
           │  "Under Article 10 of  │
           │   the Constitution...  │
           │   CrPC Section 155...  │
           │   You can file a bail  │
           │   petition u/s 497 or  │
           │   petition for habeas  │
           │   corpus..."           │
           │                        │
           └────────────┬───────────┘
                        │
        ┌───────────────┴──────────────┐
        │                              │
        ↓                              ↓
   [FACT EXTRACTION]        [INTENT DETECTION]
   AI identifies facts:      AI detects user intent:
   - "24 hours"             "Generate bail petition"
   - "magistrate"           │
   - "habeas corpus"        └─ Suggest template
                               "BAIL_497"
   ├─ Store in
   │  User.extractedFacts
   │
   └─ Use for auto-fill
      in next document

        │
        ↓
   [SAVE TO CONVERSATION]
   ├─ Message: user query
   ├─ Message: assistant response
   ├─ Metadata: sources cited
   └─ Link: document IDs

        │
        ↓
   [RETURN TO USER]
   {
     "response": "Under Article 10...",
     "sources": ["Article 10", "CrPC 61"],
     "generationHint": {
       "type": "BAIL_497",
       "isReady": true
     }
   }

```

---

## 4. DATABASE RELATIONSHIP DIAGRAM

```
┌────────────────────────┐
│      USER             │
├────────────────────────┤
│ _id (PK)              │
│ email (unique)        │
│ password (bcrypt)     │
│ firstName             │
│ role (admin/user)     │
│ extractedFacts {}     │
└───────┬────────────────┘
        │ Owns 1-to-M relationship
        │
        ├──────────────┬─────────────┬────────────────┐
        │              │             │                │
        ↓              ↓             ↓                ↓
    ┌─────────┐  ┌───────────┐  ┌─────────┐  ┌──────────────┐
    │DOCUMENT │  │CONV.      │  │CASE     │  │COMPLIANCE    │
    ├─────────┤  ├───────────┤  ├─────────┤  ├──────────────┤
    │user (FK)│  │user (FK)  │  │user(FK) │  │user (FK)     │
    │filename │  │messages[]│  │title    │  │documentName│
    │s3Key    │  │documents │  │docs[]   │  │status      │
    │         │  │         │  │status   │  │score       │
    └────┬────┘  └────┬────┘  └────┬────┘  └──────────────┘
         │            │            │
         │            │            │
         └──M-to-1────┤────M-to-1──┘
                      │
                      ↓
            ┌───────────────────┐
            │GENERATED DOCUMENT│
            ├───────────────────┤
            │user (FK)          │
            │s3Key              │
            │htmlContent        │
            │documentType       │
            └───────────────────┘


            OTHER MODELS:
            
    ┌──────────────────────┐    ┌─────────────────────┐
    │CASE_BUILDING_SESSION │    │SYSTEM_PROMPT        │
    ├──────────────────────┤    ├─────────────────────┤
    │user (FK)             │    │key (unique)         │
    │caseDetails {}        │    │content              │
    │relevantLaws []       │    │title                │
    │precedents []         │    │lastUpdated          │
    │strategy              │    │                     │
    │currentStep (0-6)     │    │ [Shared across all] │
    │status                │    │ [users - global]    │
    └──────────────────────┘    └─────────────────────┘
    
    ┌──────────────────────┐    ┌──────────────────────┐
    │JUDGMENT              │    │CONVERSATION MESSAGE │
    ├──────────────────────┤    ├──────────────────────┤
    │citation              │    │role (user/assistant)│
    │caseName              │    │content               │
    │court                 │    │timestamp             │
    │date                  │    │metadata {}           │
    │ratio                 │    │files []              │
    │statutes []           │    │                      │
    └──────────────────────┘    └──────────────────────┘

```

---

## 5. API CALL LIFECYCLE

```
REQUEST PHASE
═════════════════════════════════════════════════════════════

Frontend (React):
  ├─ User action (click "Ask AI", "Upload", "Generate")
  │
  ├─ Form validation
  │  └─ Email format? File size? Required fields?
  │
  └─ Prepare request:
     {
       url: "https://api.example.com/api/chat",
       method: "POST",
       headers: {
         "Authorization": "Bearer {JWT_TOKEN}",
         "Content-Type": "application/json"
       },
       data: {
         message: "What is bail?",
         conversationId: "conv_123"
       }
     }


TRANSMISSION PHASE
═════════════════════════════════════════════════════════════

HTTP Interceptor (axios):
  ├─ Attach JWT from localStorage
  │
  ├─ Send HTTPS request
  │  └─ TLS encryption in transit
  │
  └─ Request arrives at backend


BACKEND PROCESSING PHASE
═════════════════════════════════════════════════════════════

Express Middleware Stack:
  │
  ├─ CORS Middleware: Verify origin ✓
  │
  ├─ Rate Limiter: Check IP limit (5000/15min) ✓
  │
  ├─ Route Matching: Match "POST /api/chat" ✓
  │
  ├─ JWT Middleware (protect):
  │  ├─ Extract token from Authorization header
  │  ├─ Verify signature using JWT_SECRET
  │  ├─ Check token expiration (if set)
  │  └─ On success: Set req.user object ✓
  │
  ├─ Express Validator Middleware:
  │  ├─ Validate message is not empty
  │  ├─ Validate conversationId format (optional)
  │  └─ If error: Return 400
  │
  └─ Route Handler: /api/chat (POST)
     │
     ├─ Fetch conversation from MongoDB
     │  │ await Conversation.findById(conversationId)
     │  │ if not found: Create new
     │  └─ Return: messages[], documentIds[]
     │
     ├─ Auto-resolve documents:
     │  ├─ if documentIds empty:
     │  │  └─ Query Pinecone for recent uploads
     │  └─ Return: resolved documentIds
     │
     ├─ Call LegalAgentService.processQuery()
     │  │
     │  ├─ Intent Classification (GPT-4o-mini)
     │  │  └─ return: domain, action
     │  │
     │  ├─ Parallel Retrieval (Promise.all)
     │  │  ├─ queryVectors (user-uploads namespace)
     │  │  ├─ queryAuthoritativeLaws (laws namespace)
     │  │  └─ queryJudgments (judgments namespace)
     │  │
     │  ├─ Context Synthesis
     │  │  └─ Format all results into prompt context
     │  │
     │  └─ LLM Response (GPT-4o)
     │     ├─ System prompt (from DB)
     │     ├─ + Context
     │     ├─ + User message
     │     └─ return: single response
     │
     ├─ Fact Extraction (AI):
     │  ├─ Parse response for facts
     │  └─ Update User.extractedFacts
     │
     ├─ Intent Detection:
     │  ├─ Does response suggest document generation?
     │  └─ return: generationData
     │
     ├─ Save to MongoDB:
     │  ├─ Conversation.messages.push(user message)
     │  ├─ Conversation.messages.push(assistant message)
     │  ├─ Generate auto-title (GPT-4o-mini)
     │  └─ Save to DB
     │
     └─ Prepare Response:
        {
          "success": true,
          "messageId": "msg_456",
          "response": "Full AI response...",
          "sources": [...],
          "generationData": {
            "hasGenerationIntent": true,
            "documentType": "BAIL_497"
          }
        }


RESPONSE PHASE
═════════════════════════════════════════════════════════════

Backend response sent to frontend:
  ├─ HTTP Status: 200 OK
  │
  ├─ JSON body: { success, response, generationData }
  │
  └─ Network transmission (TLS encrypted)


FRONTEND CALLBACK PHASE
═════════════════════════════════════════════════════════════

React component receives response:
  ├─ Parse JSON
  │
  ├─ Error handling:
  │  ├─ 401 → Token expired → Re-login
  │  ├─ 429 → Rate limited → Show "Please wait"
  │  ├─ 500 → Server error → Show error message
  │  └─ Success → continue
  │
  ├─ Update UI state:
  │  ├─ Add message to chat display
  │  ├─ Show AI response with sources
  │  ├─ If generationData: Show "Generate Document" button
  │  └─ Animate new message
  │
  └─ User sees response in real-time


OPTIONAL: DOCUMENT GENERATION
═════════════════════════════════════════════════════════════

User clicks: "Generate Bail Petition"
  │
  └─ POST /api/smart-generate
     ├─ Fetch User.extractedFacts
     ├─ Load template: BAIL_497
     ├─ Render HTML via Handlebars
     ├─ Save to GeneratedDocument
     ├─ Generate 1-hour view token
     └─ Response: viewUrl + shareToken

     User can now:
     ├─ View HTML in browser
     ├─ Download as PDF
     └─ Share via token link (no login needed)

```

---

## 6. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                  GITHUB REPO                            │
│  - Source code for frontend + backend                   │
│  - Version control + CI/CD                              │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ↓                     ↓
    ┌──────────────┐      ┌──────────────┐
    │ Vercel       │      │ AWS/Heroku   │
    │ (Frontend)   │      │ (Backend)    │
    ├──────────────┤      ├──────────────┤
    │frontend/   │      │Docker image  │
    │npm build     │      │Node.js app   │
    │→ dist/       │      │Express on    │
    │→ CDN         │      │port 5000     │
    │              │      │              │
    │URL:          │      │URL:          │
    │legalyze.com  │      │api.legalyze.com
    └──────┬───────┘      └─────┬────────┘
           │                    │
           └────────┬───────────┘
                    │ HTTPS/TLS
                    │ /api/* requests
                    ↓
        ┌────────────────────────┐
        │ API Gateway / Load      │
        │ Balancer                │
        │ (Optional: CloudFlare)  │
        └────────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
    ┌────────────────┐    ┌────────────────┐
    │ MongoDB Atlas  │    │ AWS S3         │
    │ (Managed DB)   │    │ (Private Bucket)
    ├────────────────┤    ├────────────────┤
    │ Cluster 0      │    │ Documents/     │
    │ Replica set    │    │ Compliance/    │
    │ 3 nodes        │    │ Generated/     │
    │ Sharded        │    │                │
    │ (if scaled)    │    │ AES256         │
    └────────────────┘    │ Encrypted      │
                          │                │
    ┌────────────────┐    │ Presigned URLs │
    │ Pinecone       │    │ (1-hr expiry)  │
    │ (Vector DB)    │    └────────────────┘
    ├────────────────┤
    │ Dedicated      │
    │ P2 Index       │    
    │ 4 namespaces   │
    └────────────────┘
         │
         └─ Embedding queries
            + metadata filtering


MONITORING & LOGGING
═════════════════════════════════════════════════════════════

┌──────────────────┐
│ Sentry / Rollbar │  Error tracking + alerts
└──────────────────┘

┌──────────────────┐
│ CloudWatch / ELK │  Centralized logging
└──────────────────┘

┌──────────────────┐
│ Prometheus /     │  Metrics: API latency,
│ Grafana          │  error rate, token usage
└──────────────────┘

┌──────────────────┐
│ PagerDuty        │  On-call alerts
└──────────────────┘

```

---

**End of Architecture Diagrams Document**

*These diagrams represent the complete system design for Legalyze, from data flow through deployment*
