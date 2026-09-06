# Legalyze: Comprehensive Technical Architecture Analysis

**Date**: April 19, 2026  
**System**: Agentic AI Legal Tech Platform for Pakistani Law  
**Built At**: National University of Sciences and Technology (NUST), Islamabad

---

## Executive Summary

Legalyze is a **MERN stack (MongoDB + Express + React + Node.js) agentic AI platform** designed to provide comprehensive legal assistance for Pakistani law. It leverages **GPT-4o**, **Pinecone vector embeddings**, and **constitutional compliance engines** to help lawyers and citizens navigate complex legal procedures. The system combines intelligent document processing, constitutional analysis, case strategy generation, and document drafting into a cohesive workflow.

---

## 1. CORE ARCHITECTURE

### 1.1 Tech Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER                         │
│  React + Vite + Material-UI (frontend/)               │
│  - Real-time chat interface                             │
│  - Multi-step case building wizard                       │
│  - Admin dashboard with analytics                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              EXPRESS API SERVER (Port 5000)              │
│  - RESTful endpoints for all operations                  │
│  - Rate limiting & JWT authentication                    │
│  - Real-time state management                            │
│  - Document processing pipelines                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              MONGODB ATLAS (Persistence)                │
│  - User profiles & authentication                        │
│  - Conversations & message history                       │
│  - Generated documents & reports                         │
│  - Case building sessions                               │
│  - System prompts (dynamic AI configuration)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PINECONE    │  │  OPENAI API  │  │  AWS S3      │
│ (Vector DB)  │  │  (GPT-4o)    │  │  (Storage)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 Backend File Structure

```
backend/
├── server.js                      # Express app initialization with 10-min timeout
├── config/                        # Configurations
│   ├── db.js                     # MongoDB connection
│   ├── openai.js                 # OpenAI client (GPT-4o)
│   ├── passport.js               # Google OAuth strategy
│   ├── s3.js                     # AWS S3 client
│   ├── documentTemplates.js      # Legal document templates (5+ pre-arrest bail, etc.)
├── models/                        # MongoDB schemas
│   ├── User.js                   # User accounts with extracted facts
│   ├── Conversation.js           # Chat histories with message persistence
│   ├── Document.js               # Uploaded legal documents
│   ├── Case.js                   # Case management
│   ├── GeneratedDocument.js      # PDFs + HTML documents
│   ├── ComplianceCheck.js        # Constitutional compliance results
│   ├── CaseBuildingSession.js    # Wizard progress tracking
│   ├── SystemPrompt.js           # Dynamic AI personas (admin-editable)
│   └── Judgment.js               # Supreme Court precedents
├── routes/                        # API endpoints
│   ├── auth.js                   # Login/signup (email + Google OAuth)
│   ├── chat.js                   # Agentic RAG query processing
│   ├── documents.js              # Upload, extract, index
│   ├── generate.js               # Smart document generation
│   ├── constitutionalCompliance.js # Compliance checking
│   ├── caseBuilding.js           # 7-step case wizard
│   ├── judgments.js              # Precedent search
│   └── admin.js                  # System administration
├── middleware/                    # Security & auth
│   ├── auth.js                   # JWT protect middleware
│   └── adminMiddleware.js        # Super admin access control
├── services/                      # Core business logic
│   ├── LegalAgentService.js      # Main agentic orchestrator
│   ├── pineconeService.js        # Vector store operations
│   ├── pakistanLegalPrompts.js   # Dynamic PM prompts from DB
│   ├── intentDetector.js         # User intent classification
│   ├── factExtractor.js          # Extract facts from chat
│   ├── fieldMapper.js            # Map facts to document fields
│   ├── searchService.js          # Hybrid search (keyword + vector)
│   ├── constitutionalComplianceService.js # Multi-law compliance
│   ├── judgmentScraper.js        # Index Supreme Court judgments
│   ├── workflowOrchestrator.js   # LWOE: document processing pipeline
│   ├── sentenceExtractor.js      # Parse document structure
│   └── pdfReportGenerator.js     # Generate compliance PDFs
├── utils/                         # Utilities
│   ├── documentProcessor.js      # Text extraction + embeddings
│   ├── pdfGenerator.js           # Puppeteer PDF creation
│   ├── htmlGenerator.js          # Template rendering
│   └── sendEmail.js              # Email notifications
└── scripts/                       # Admin utilities
    ├── indexConstitution.js      # Seed Constitution to Pinecone
    ├── testPineconeUpload.js     # Verify indexing
    └── seedAdmin.js              # Create superadmin
```

### 1.3 Frontend Structure

```
frontend/
├── src/
│   ├── App.jsx                   # Main router (7 pages + admin)
│   ├── context/
│   │   ├── AuthContext.jsx       # Global auth state (user, token, login/logout)
│   │   └── ThemeContext.jsx      # Dark/light mode
│   ├── pages/
│   │   ├── LandingPage.jsx       # Public homepage
│   │   ├── SignIn.jsx            # Email + Google OAuth login
│   │   ├── SignUp.jsx            # Registration with email validation
│   │   ├── ChatInterface.jsx     # Main chat page (agentic RAG)
│   │   ├── VerifyEmail.jsx       # Email verification
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx     # System overview
│   │   │   ├── Analytics.jsx     # Historical trends
│   │   │   ├── UserManagement.jsx # Suspend/activate users
│   │   │   ├── PromptEngineering.jsx # Edit system prompts (locked with code)
│   │   │   └── KnowledgeBase.jsx # Manage indexed documents
│   ├── components/
│   │   ├── CaseBuildingWizard.jsx # 7-step legal case builder
│   │   ├── AdminLayout.jsx       # Sidebar navigation
│   │   ├── ThemeSwitcher.jsx     # Theme selection
│   │   └── ChatMessage.jsx       # Message rendering
│   ├── utils/
│   │   ├── api.js                # Axios interceptor with JWT auto-inject
│   │   └── animations.js         # Framer Motion animations
│   └── styles/
│       └── theme.js              # Material-UI theming
```

---

## 2. AI/AGENTIC LAYER

### 2.1 Agentic Orchestration Flow

The **LegalAgentService** is the central intelligence hub:

```javascript
// Main entry point: /api/chat POST
async processQuery(userQuery, options) {
  // 1. INTENT CLASSIFICATION & ROUTING
  const routing = await classifyAndRoute(userQuery);
  // Routes to: research, compliance, intake
  // Domains: criminal, constitutional, civil, family, business
  
  // 2. PARALLEL INFORMATION RETRIEVAL (3 tools)
  Tool 1: Authoritative Laws (PPC, CrPC, Constitution)
            ↓ Pinecone: 'authoritative-laws' namespace
  
  Tool 2: Precedents (Supreme Court Judgments)
            ↓ Pinecone: 'judgments' namespace
  
  Tool 3: User Documents (Case Context)
            ↓ Pinecone: 'user-uploads' namespace
            ↓ Fallback: MongoDB extractedText
            ↓ Fallback: S3 live PDF extraction
  
  // 3. CONTEXT SYNTHESIS
  Aggregate all tool outputs into formatted context
  
  // 4. RESPONSE GENERATION
  System Prompt (from DB) + Context + Query
    ↓ GPT-4o API call
  ↓ Final legal response
}
```

### 2.2 System Prompts (Database-Driven)

**Model**: `SystemPrompt` (MongoDB)

```json
{
  "key": "LAWYER_PERSONA",
  "title": "Primary Legal Expert",
  "content": "You are Legalyze AI, specialized in Pakistani law...",
  "description": "Master prompt for all legal interactions",
  "lastUpdated": "2026-04-19T10:00:00Z"
}
```

**Admin Control**: 
- `/api/admin/prompts` - View all prompts
- `/api/admin/prompts/:id` PUT - Update prompt (locked with secret code)
- `/api/admin/seed-prompts` - Reset to defaults

**Key Prompts**:
1. **LAWYER_PERSONA** - Base legal consultant identity
2. **CONSTITUTIONAL_ANALYZER** - Multi-law compliance checker
3. **CASE_STRATEGIST** - Case building strategies
4. **DOCUMENT_GENERATOR** - Template-based generation

### 2.3 Intent Detection & Routing

The system automatically routes queries:

```javascript
// From /services/pakistanLegalPrompts.js
detectCaseType(message) {
  Keywords:
    Criminal → fir, bail, 302 PPC, police, remand
    Constitutional → writ, 199, fundamental rights
    Civil → suit, property, injunction, contract
    Family → divorce, khula, custody, maintenance
  
  Returns: criminal | constitutional | civil | family
}
```

**Routing Matrix**:

| User Query | Detected Domain | Tools Activated | Route |
|-----------|-----------------|-----------------|-------|
| "My father is detained without FIR" | Criminal | Laws, Precedents | research |
| "Government seizing our property" | Constitutional | All 3 tools | compliance |
| "Need to draft rent agreement" | Civil | User-docs, Laws | drafting |

---

## 3. KEY FEATURES

### 3.1 Constitutional Compliance Engine

**Purpose**: Verify if legal documents comply with Pakistan's Constitution and statutory laws.

**Flow**:
```
User uploads PDF/DOCX
    ↓ S3 storage
    ↓ Text extraction (PDF-parse, mammoth)
    ↓ Agentic Classification (is it legal?)
    ↓ Reference Verification (find relevant articles)
    ↓ RAPID SCAN V2: Thematic compliance matching
       │
       ├─ Import Constitution → Pinecone ('constitution-pakistan' namespace)
       ├─ Import Authoritative Laws → Pinecone ('authoritative-laws' namespace)
       ├─ Generate embedding for each sentence/paragraph
       ├─ Match against Constitution articles
       ├─ Match against PPC/CrPC/CPC sections
       └─ Assign YES/NO/PARTIAL with confidence scores
    ↓ Generate comprehensive JSON report
    ↓ Convert to PDF with violations highlighted
    ↓ Save to S3 + MongoDB
    ↓ Create chat conversation with persistent report
```

**Output**: Detailed compliance report showing:
- Overall status: FULLY_COMPLIANT / PARTIALLY_COMPLIANT / NON_COMPLIANT
- Article-by-article analysis
- Identified violations with severity (HIGH/MEDIUM/LOW)
- Recommended corrections with specific replacement text
- Constitutional provisions violated

**Key Services**:
- `constitutionalComplianceService.js` - Enhanced multi-law analysis
- `complianceMatchingEngine.js` - Sentence-level matching
- `complianceReportGenerator.js` - Report formatting

### 3.2 Case Building Wizard (7 Steps)

A guided workflow for lawyers to build complete case strategies:

```
Step 0: CASE INTAKE
├─ Provide factual background
├─ Select client position (petitioner/respondent)
├─ Select court level (district/high/supreme)
└─ Trigger AI case analysis

Step 1: CLASSIFICATION
├─ AI determines case type (criminal/civil/constitutional)
├─ Extract key legal issues
├─ Extract key facts
└─ Suggest applicable petition template

Step 2: RELEVANT LAWS
├─ Search Constitution + PPC + CrPC + CPC
├─ Display 6-8 most relevant sections
├─ Show practical application of each
└─ Build statutory foundation

Step 3: PRECEDENTS
├─ Query Supreme Court case law database
├─ Hybrid search (keyword + semantic)
├─ Show matching ratios (legal principles)
└─ Provide strategic relevance explanation

Step 4: STRATEGY
├─ Generate strategic memorandum (500+ words)
├─ Address weaknesses in opponent's case
├─ Suggest aggressive + defensive positions
└─ Cite precedents and constitutional provisions

Step 5: FILING DETAILS
├─ Dynamic form based on petition type
├─ Field sections: Personal, Court, Court, Evidence, etc.
├─ Auto-populate from extracted facts
└─ Manual override capability

Step 6: DRAFTING
├─ Generate professional petition following High Court standards
├─ Use Handlebars template rendering
├─ Insert field data into legal document
├─ Format as HTML (displayable) + PDF-exportable
```

**Models**:
- `CaseBuildingSession` - Tracks wizard progress
- `PETITION_TEMPLATES` - Pre-built templates for 5+ document types

**Document Types Generated**:
1. Writ Petition U/S 199 (Fundamental Rights)
2. Bail Application U/S 497 CrPC
3. Civil Suit (property/contract)
4. Divorce Application (family law)
5. Pre-Arrest Bail Petition
6. Affidavits
7. Early Hearing Applications

### 3.3 Retrieval-Augmented Generation (RAG) System

**Purpose**: Ground AI responses in authentic Pakistani legal sources.

**Three Namespaces in Pinecone**:

1. **authoritative-laws** (Global Legal Library)
   - Constitution of Pakistan (1973)
   - Pakistan Penal Code (PPC)
   - Code of Criminal Procedure (CrPC)
   - Code of Civil Procedure (CPC)
   - Islamic Law provisions
   - Seeding: `/scripts/indexAuthoritativeLaws.js`

2. **constitution-pakistan** (Constitutional Articles)
   - All 280 articles
   - Part II → Fundamental Rights (Articles 8-28A)
   - Part III → Federal Government (Articles 41-164)
   - Part IV → Islamic Provisions (Articles 227-232)
   - Seeding: `/scripts/indexConstitution.js`

3. **user-uploads** (Personal Case Documents)
   - Client-provided case files
   - Previous judgments
   - Correspondence
   - Metadata: userId, documentId, chatId
   - Fallback: MongoDB `extractedText` field

4. **judgments** (Supreme Court Precedents)
   - 50,000+ court judgments
   - Indexed with: citation, ratio decidendi, statutes applied
   - Seeding: `judgmentScraper.js` (ongoing)

**Query Flow**:
```javascript
// User asks: "What are my rights if police arrest without FIR?"
const userQuery = "..."

// 1. Generate embedding (text-embedding-3-small, 1024 dims)
const embedding = await generateEmbedding(userQuery)

// 2. Query Pinecone with auto-detection
const results = await pineconeService.queryVectors(
  embedding,
  topK: 5,
  userId,
  documentIds,
  namespace: 'user-uploads'  // Or 'authoritative-laws'
)

// 3. Format results
results = [
  { documentId, text, similarity: 0.87, source: 'Constitution Article 10' },
  { documentId, text, similarity: 0.84, source: 'CrPC Section 61' },
  ...
]

// 4. Pass to LLM with system prompt
system: "You are Pakistani legal expert. Use provided context."
response: "According to Article 10 of Constitution: [exact quote]..."
```

**Fallback Mechanism**:
If Pinecone query fails or returns 0 chunks:
1. Try MongoDB `Document.extractedText`
2. Fallback to S3 live PDF extraction
3. Finally, general LLM knowledge (if authorized)

### 3.4 Document Processing & Indexing

**Pipeline (Workflow Orchestrator)**:

```javascript
// /services/workflowOrchestrator.js
async processUpload(documentId, buffer, mimeType, userId) {
  // 1. TEXT EXTRACTION
  text = await extractText(buffer, mimeType)
  // Supports: PDF, DOCX, Images (OCR)
  
  // 2. DEEP METADATA EXTRACTION (LWOE)
  metadata = extractLWOE(text)  // Last Writer Out Extraction
  // Returns: parties, court, judge, dates, statutes, outcome
  
  // 3. STRUCTURAL CHUNKING
  chunks = splitTextStructurally(text)
  // Segments: by section headings, paragraphs, preserves context
  
  // 4. EMBEDDING GENERATION
  for (chunk of chunks) {
    chunk.embedding = await generateEmbedding(chunk.text)
  }
  
  // 5. PINECONE INDEXING
  upsertVectors(documentId, chunks, 'user-uploads' namespace)
  
  // 6. MONGODB PERSISTENCE
  Document.update({
    extractedText: text,
    metadata: metadata,
    processed: true,
    pineconeIndexed: true
  })
  
  // 7. CHAT CONTEXT LINKING
  Link document to conversation for future RAG queries
}
```

**Chat-Scoped RAG Auto-Resolution**:
When user asks question in a chat:
1. Check if specific documents linked to chat
2. If not, auto-resolve from conversation history
3. Fallback: Attach user's most recent upload (within 15 mins)
4. This ensures documents are always available for context

---

## 4. DATA FLOW ARCHITECTURE

### 4.1 User Journey: Chat → Compliance → Case Building

```
┌──────────────────┐
│  User Login      │
│  (Email/Google)  │
└────────┬─────────┘
         │
         ↓
    ┌────────────────────────────┐
    │  Upload Legal Document     │
    │  (PDF/DOCX)  ← S3 storage  │
    └────────┬───────────────────┘
             │
      ┌──────┴─────────┐
      │                │
      ↓                ↓
   Chat RAG    Constitutional Compliance
   (General)   (Detailed Analysis)
   
   Query: "What to do   Upload: "FIR Notice"
   if arrested?"        → Extract + Analyze
       ↓                 → Check vs. Constitution
   - Auto-resolve        → Generate Report
     documents        → Save to S3/Mongo
   - Agentic query      → Create chat conv.
   - GPT-4o response
   - Save to history


      ┌──────────────────────┐
      │  Case Building Wizard │
      │  (7-Step Process)     │
      └─────────┬────────────┘
               │
         ┌─────┴─────────────────┐
         │                       │
    Step 0-4              Step 5-6
    Analysis              Drafting
    │                     │
    ├─ Extract facts      ├─ Auto-fill from facts
    ├─ Find laws          ├─ Manual override
    ├─ Find precedents    ├─ Generate petition
    ├─ Build strategy     └─ Export PDF
    └─ Save progress


      ┌────────────────────┐
      │  Admin Actions     │
      │  (Super Admin Only)│
      └────────┬───────────┘
               │
         ┌─────┴──────────────┐
         │                    │
    Edit Prompts       Manage Users
    │                  │
    ├─ Lock with code  ├─ Suspend accounts
    ├─ Live update     ├─ View analytics
    └─ See impact      └─ Monitor RAG
```

### 4.2 Document Lifecycle

```
UPLOAD PHASE
├─ User selects file (PDF/DOCX/Image)
├─ Frontend validates size (<10MB)
├─ POST /api/documents/upload
├─ Backend:
│  ├─ Generate S3 key: documents/{userId}/{timestamp}_{uuid}/{filename}
│  ├─ Upload to S3 (auto-encrypt AES256)
│  ├─ Create Document record in MongoDB
│  └─ Return document ID + metadata

PROCESSING PHASE (Asynchronous via workflowOrchestrator)
├─ Extract text (PDF → text, DOCX → text, Image → OCR)
├─ Parse document structure (sections, chapters, headings)
├─ Extract LWOE metadata (parties, court, dates, statutes)
├─ Create structural chunks (50-1000 tokens per chunk)
├─ Generate embeddings (text-embedding-3-small, 1024 dims)
├─ Upsert to Pinecone (user-uploads namespace)
├─ Save extractedText to MongoDB (for fallback)
├─ Update Document.processed = true

RAG QUERY PHASE
├─ User asks question in chat
├─ System auto-resolves documents for that chat
├─ Generate query embedding
├─ Search Pinecone: userId + documentIds filters
├─ Return top 5-10 most similar chunks
├─ Format as context for LLM
├─ Return answer citing sources

CLEANUP PHASE
├─ User can delete document
├─ Delete from Pinecone (by filter)
├─ Delete from S3
├─ Mark as deleted in MongoDB (soft delete)
└─ Update Conversation docs list
```

---

## 5. KEY DATABASE MODELS

### 5.1 User Model

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (bcrypt-hashed, select: false),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  
  // Authentication
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  verificationToken: String,
  verificationTokenExpire: Date,
  
  // Google OAuth
  googleId: String (unique, sparse),
  profilePicture: String,
  
  // Authorization
  role: StringEnum (user | admin | superadmin),
  disabledFeatures: [String],  // e.g., ['compliance', 'chat']
  
  // AI-Extracted Facts (Smart Document Generation)
  extractedFacts: {
    personal: { name, fatherName, cnic, address, phone, email },
    financial: { monthlyRent, securityDeposit, monthlyIncome, salary },
    property: { propertyAddress, propertyType, propertySize },
    company: { companyName, directorName, companyAddress, designation },
    dates: { agreementDate, leaseStartDate, leaseEndDate, joiningDate },
    witnesses: { witness1Name, witness1Address, witness2Name, witness2Address },
    other: { signingPlace, jurisdiction, duration }
  },
  factsLastUpdated: Date,
  
  lastLogin: Date,
  timestamps: { createdAt, updatedAt }
}
```

### 5.2 Conversation Model (Chat History)

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  title: String (AI-generated from first message),
  
  messages: [{
    role: String (user | assistant | system),
    content: String,
    timestamp: Date,
    metadata: {
      generationIntent: Boolean,
      documentType: String,
      complianceCheckId: ObjectId,
      isStrictReport: Boolean
    },
    files: [{ filename, id, processed }]
  }],
  
  documentIds: [ObjectId (ref: Document)],  // Linked uploaded files
  isActive: Boolean,
  
  timestamps: { createdAt, updatedAt }
}
```

### 5.3 Document Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  caseId: ObjectId (ref: Case),
  
  filename: String,
  originalName: String,
  s3Key: String (unique),
  s3Url: String,
  fileSize: Number,
  mimeType: String (application/pdf | application/vnd.openxmlformats-officedocument.wordprocessingml.document),
  
  // Processing Status
  processed: Boolean (default: false),
  pineconeIndexed: Boolean (default: false),
  chunkCount: Number,
  processingError: String,
  
  // Deep Metadata (LWOE)
  docType: String,  // "FIR", "Judgment", "Notice", etc.
  metadata: {
    parties: { petitioner, respondent },
    court: { name, judge, jurisdiction },
    dates: { documentDate, incidentDate },
    statutes: [String],  // e.g., ["302 PPC", "497 CrPC"]
    outcome: String,
    keyIssues: [String]
  },
  
  // Summaries
  summary: {
    facts: String,
    legalIssues: [String],
    reliefSought: String
  },
  
  // Persistence
  extractedText: String,  // Full text for fallback
  chatId: String (index for chat-scoped RAG),
  isLegal: Boolean (default: true),
  
  timestamps: { createdAt, updatedAt }
}
```

### 5.4 ComplianceCheck Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  
  documentName: String,
  s3Key: String,
  s3Url: String,
  fileSize: Number,
  mimeType: String,
  
  // Results
  complianceStatus: String (FULLY_COMPLIANT | PARTIALLY_COMPLIANT | NON_COMPLIANT),
  complianceScore: Number (0-100),
  executiveSummary: String (3-5 sentences),
  
  // Analysis Details
  detailedAnalysis: String (JSON stringified),
  constitutionalProvisions: [{
    articleNumber: String,
    heading: String,
    part: String,
    relevance: String,
    alignment: String (YES | NO | PARTIAL)
  }],
  
  potentialIssues: [{
    issue: String,
    severity: String (HIGH | MEDIUM | LOW),
    constitutionalArticle: String,
    recommendation: String
  }],
  
  recommendations: String,
  reportText: String (full formatted report),
  
  timestamps: { createdAt, updatedAt }
}
```

### 5.5 CaseBuildingSession Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  title: String,
  
  caseDetails: {
    facts: String,
    caseType: String (criminal | civil | constitutional | family | other),
    clientPosition: String (petitioner | respondent | appellant),
    courtLevel: String (district | sessions | highcourt | supreme),
    urgency: String (low | normal | high | urgent)
  },
  
  // AI Analysis Results
  extractedFacts: {
    parties: [{ name, role }],
    dates: [{ date, event }],
    locations: [{ place, relevance }],
    keyEvents: [{ description, importance }],
    evidence: [{ type, description }],
    keyFacts: [String]
  },
  
  classification: {
    caseType: String,
    legalIssues: [String],
    applicableLaws: [{ section, law, relevance }],
    urgencyLevel: String,
    initialAdvice: String
  },
  
  // Search Results
  relevantLaws: [{
    section: String,
    law: String,
    description: String,
    relevance: String,
    elements: [String]
  }],
  
  precedents: [{
    citation: String,
    caseName: String,
    court: String,
    date: String,
    ratio: String,
    application: String
  }],
  
  strategy: String (full memorandum),
  
  // Filing & Generation
  selectedTemplateId: String,
  factualFields: Map<String, String>,
  documents: [{
    type: String,
    content: String,
    createdAt: Date
  }],
  
  // Progress
  currentStep: Number (0-6),
  status: String (in_progress | completed | archived),
  
  timestamps: { createdAt, updatedAt }
}
```

### 5.6 SystemPrompt Model (AI Configuration)

```javascript
{
  _id: ObjectId,
  key: String (unique),  // e.g., "LAWYER_PERSONA"
  title: String,
  content: String (the actual prompt text, 500-5000 chars),
  description: String,
  lastUpdated: Date,
  timestamps: { createdAt, updatedAt }
}
```

**Currently Seeded Prompts**:
1. **LAWYER_PERSONA** - "You are Legalyze AI, specialized in Pakistani law..."
2. **CONSTITUTIONAL_ANALYZER** - Multi-law compliance methodology
3. **CASE_STRATEGIST** - Strategic case analysis
4. **DOCUMENT_GENERATOR** - Template-based document generation

---

## 6. FRONTEND STACK & COMPONENTS

### 6.1 Tech Stack

- **Framework**: React 18 + Vite (hot module replacement)
- **UI Library**: Material-UI (MUI v5) with custom theming
- **State Management**: React Context (Auth, Theme)
- **HTTP Client**: Axios with JWT interceptor
- **Animations**: Framer Motion
- **Forms**: React Hook Form
- **Markdown**: react-markdown
- **PDF Export**: html2pdf.js

### 6.2 Key Pages & Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **LandingPage** | Public homepage | Feature showcase, CTA buttons |
| **SignIn/SignUp** | Authentication | Email + Google OAuth, validation |
| **ChatInterface** | Main app | Persistent chat, document upload, compliance checker trigger |
| **CaseBuildingWizard** | 7-step case builder | Multi-step form, session persistence, PDF export |
| **AdminDashboard** | System overview | User count, API usage, document stats |
| **PromptEngineering** | Prompt management | Edit system prompts (locked with code) |
| **UserManagement** | User admin | Suspend/activate, view profiles |
| **Analytics** | Historical trends | User growth, chat volume, compliance checks |

### 6.3 Auth Flow

```javascript
// Frontend
SignIn Component
  └─ If Google: redirect to ${API_BASE}/api/auth/google
  └─ If Email: POST /api/auth/login with email/password

// Backend
GET /api/auth/google
  └─ Passport Google OAuth initiation

GET /api/auth/google/callback
  └─ User authenticated
  └─ Generate JWT: sign({ id: userId }, JWT_SECRET)
  └─ Redirect: ${FRONTEND_URL}/auth/google/success?token=...&userId=...

// Frontend Recovery
GoogleAuthSuccess.jsx
  └─ Extract token from URL params
  └─ Store in localStorage
  └─ Update AuthContext
  └─ Redirect to /chat

// Protected Routes
API Interceptor (api.js)
  └─ Attach: Authorization: Bearer ${token}
  └─ Middleware: protect() checks JWT validity
  └─ If invalid/expired: 401 response
  └─ User must re-login
```

---

## 7. SECURITY ARCHITECTURE

### 7.1 Authentication & Authorization

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Network** | HTTPS/TLS | Encrypted in transit (AWS) |
| **Auth** | JWT (stateless) | Token stored in localStorage (XSS risk mitigation: httpOnly recommended for prod) |
| **Password** | bcrypt (12 rounds) | Industry-standard hashing |
| **Email Verification** | Token-based | SHA256 hash, 24-hour expiry |
| **Google OAuth** | Passport.js | Exchange code for ID + access token |
| **Admin Access** | Role-based (superadmin) | Locked endpoints require role check |
| **Prompt Editing** | Secret code validation | POST /api/admin/verify-secret compares code |

### 7.2 Input Validation

**Frontend**:
- Email regex validation
- Password strength (8+ chars, uppercase, lowercase, number)
- File size validation (<10MB)
- Form field sanitization

**Backend**:
- express-validator middleware
- Type checking (mimeType enum)
- Buffer size limits (50MB for JSON)
- Rate limiting per IP

### 7.3 Rate Limiting

```javascript
// Global limiter: 5000 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: 'Too many requests...'
})

// Auth limiter: 500 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
})

app.use(limiter)
app.use('/api/auth', authLimiter)
```

### 7.4 CORS Configuration

```javascript
app.use(cors({
  origin: '*',  // Configure for production!
  optionsSuccessStatus: 200
}))
```

⚠️ **Production Recommendation**: Set `origin` to specific domain:
```javascript
origin: process.env.FRONTEND_URL
```

### 7.5 Data Security

| Data Type | Storage | Encryption | Access |
|-----------|---------|-----------|--------|
| User Passwords | MongoDB | bcrypt (never readable) | Auth middleware only |
| JWT Tokens | Browser localStorage | No (just token in URL) | Attached to API requests |
| Uploaded Documents | AWS S3 | AES256 (server-side) | Presigned URLs (1-hour expiry) |
| Extracted Text | MongoDB | No (plain text) | User + Admin |
| Compliance Reports | S3 + MongoDB | AES256 (S3) | Private to user |
| System Prompts | MongoDB | No (admin-only) | Super admin only |

---

## 8. EXTERNAL INTEGRATIONS

### 8.1 OpenAI API (GPT-4o)

**Configuration**: `config/openai.js`

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})
```

**Usage Points**:

| Endpoint | Model | Use Case | Max Tokens |
|----------|-------|----------|-----------|
| `/chat/completions` | gpt-4o | Main legal reasoning | 4096 |
| `/chat/completions` | gpt-4o-mini | Intent detection, classification | 2000 |
| `/embeddings` | text-embedding-3-small | Generate vectors (1024 dims) | N/A |

**Cost Optimization**:
- Use `gpt-4o-mini` for classification tasks (cheaper)
- Use `gpt-4o` only for complex legal analysis
- Batch embeddings for better throughput

### 8.2 Pinecone (Vector Database)

**Configuration**: Environment variables
```
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=legal-documents
```

**Namespaces**:

| Namespace | Content | Seeding | Search Volume |
|-----------|---------|---------|----------------|
| `authoritative-laws` | Constitution + PPC/CrPC/CPC | Manual via scripts | Low (5-10 queries/day per user) |
| `constitution-pakistan` | All 280 articles | `/scripts/indexConstitution.js` | Low |
| `user-uploads` | Client documents | Auto on document upload | High (per-chat) |
| `judgments` | Supreme Court judgments | `/scripts/indexJudgments.js` | Medium (case building) |

**Query Operations**:

```javascript
// POST /api/chat - Auto-resolve documents
pineconeService.queryVectors(embedding, topK=5, userId, documentIds, chatId, 'user-uploads')

// POST /api/constitutional-compliance/check - Find legal provisions
pineconeService.queryAuthoritativeLaws(embedding, topK=15)

// POST /api/case-building/find-laws
pinecone.query({ vector: embedding, topK: 5, filter: { isAuthoritative: true } })
```

### 8.3 AWS S3 (Document Storage)

**Configuration**: `config/s3.js` + environment variables
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=legalyze-documents
```

**Folder Structure**:
```
legalyze-documents/
├── documents/{userId}/{timestamp}_{uuid}/
│   ├── {filename}.pdf        # Original upload
│   └── {filename}.docx
├── compliance/{userId}/{timestamp}_{uuid}/
│   ├── report_{reportId}.pdf # Compliance report
│   └── report_{reportId}.json
└── generated/{userId}/{timestamp}_{uuid}/
    ├── {documentType}_{timestamp}.html
    └── {documentType}_{timestamp}.pdf
```

**Security**:
- Server-side AES256 encryption
- Presigned URLs (1-hour expiry) for downloads
- Bucket policy: Private (no public access)
- Access via IAM credentials only

### 8.4 Google OAuth 2.0

**Configuration**: `config/passport.js`

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=${BACKEND_URL}/api/auth/google/callback
```

**Flow**:
1. User clicks "Sign in with Google"
2. Frontend redirects to `/api/auth/google`
3. Passport initiates OAuth flow
4. User authenticates with Google
5. Callback: `/api/auth/google/callback`
6. Passport verifies & creates/updates User
7. Backend generates JWT
8. Redirect with token to frontend

**Auto-Creation**:
- If user exists → update profilePicture
- If new user → create with email + randomized password

### 8.5 MongoDB Atlas

**Configuration**: `config/db.js`

```
MONGODB_URI=<your-mongodb-atlas-connection-string>
```

**Collections**:
1. users
2. conversations
3. documents
4. cases
5. compliance_checks
6. generated_documents
7. case_building_sessions
8. judgments
9. system_prompts
10. system_settings

**Indexes**:
- `users`: email (unique), timestamps
- `documents`: user + processed + pineconeIndexed
- `conversations`: user + timestamps
- `compliance_checks`: user + status + timestamps
- Full-text: documents (title + content)

---

## 9. COMPLETE USER FLOW DIAGRAM

```
NEW USER JOURNEY
═════════════════════════════════════════════════════════════════

[Landing Page]
   │ "Get Started"
   ↓
[Sign Up]
   │ Email + password validation
   │ Verification email sent
   ↓
[Verify Email Link] → [Email Confirmed] → [Ready to Login]
   │
   ↓
[Sign In]
   │ Email + password OR Google OAuth
   ↓
[Chat Dashboard]
   │
   ├─ Scenario A: LEGAL CONSULTATION
   │  ├─ Upload FIR/Judgment/Notice (PDF/DOCX)
   │  ├─ Backend: Extract + Pinecone Index
   │  ├─ Ask questions: "What are my bail options?"
   │  ├─ System:
   │  │  ├─ Auto-resolve documents
   │  │  ├─ Query: authoritative-laws (CrPC sections)
   │  │  ├─ Query: judgments (precedents)
   │  │  ├─ GPT-4o generates response
   │  │  └─ Saved to Conversation
   │  │
   │  └─ [Check Compliance] (Optional)
   │     ├─ Trigger: Constitutional Compliance Engine
   │     ├─ Generate detailed violation report
   │     ├─ Save PDF to S3
   │     └─ Chat now has report embedded
   │
   ├─ Scenario B: CASE BUILDING WIZARD
   │  ├─ [Case Intake] - Describe facts
   │  ├─ [Classification] - AI analyzes case type
   │  ├─ [Relevant Laws] - Find applicable sections
   │  ├─ [Precedents] - Search case law
   │  ├─ [Strategy] - Generate memorandum
   │  ├─ [Filing Details] - Fill form (auto-populated from facts)
   │  ├─ [Drafting] - Generate petition PDF
   │  └─ [Export] - Download as PDF or copy text
   │
   └─ Scenario C: ADMIN PANEL (Super Admin only)
      ├─ [Analytics] - View historical trends
      ├─ [User Management] - Suspend accounts
      ├─ [Prompt Engineering] - Edit AI personas (locked with code)
      ├─ [Knowledge Base] - Manage indexed documents
      └─ [System Info] - View infrastructure status


TECHNICAL REQUEST-RESPONSE FLOW
═════════════════════════════════════════════════════════════════

POST /api/chat
{
  "message": "What happens if I'm arrested without an FIR?",
  "conversationId": "conv_123",
  "documentIds": ["doc_456"]  // Optional, auto-resolved if not provided
}
     │
     ├─ Auth Middleware: Verify JWT token
     ├─ Chat Route Handler:
     │  ├─ Fetch Conversation (if exists)
     │  ├─ Auto-resolve documentIds (or use provided ones)
     │  ├─ Call LegalAgentService.processQuery(message, options)
     │  │
     │  └─ LegalAgentService:
     │     ├─ Intent Classification: "criminal" + "arrest without FIR"
     │     ├─ Parallel Retrieval:
     │     │  ├─ Query 1: Pinecone('authoritative-laws')  → CrPC Section 55-61
     │     │  ├─ Query 2: Pinecone('judgments')           → Similar cases
     │     │  └─ Query 3: Pinecone('user-uploads')        → User's documents
     │     │
     │     ├─ Format Context:
     │     │  "CONTEXT:\n
     │     │   - Constitution Article 10: 'Safeguards as to arrest and detention. Every
     │     │     person who is arrested and detained in custody shall be produced before
     │     │     a magistrate within a period of twenty-four hours...'
     │     │   - CrPC Section 61: 'Officer shall not compel person to accompany...'"
     │     │
     │     └─ Generate Response:
     │        System: "You are Legalyze AI, expert in Pakistani law..."
     │        Context: [formatted above]
     │        User: "What happens if..."
     │
     │        GPT-4o reply: "Under Article 10 of the Constitution of Pakistan,
     │        every person arrested must be produced before a magistrate within
     │        24 hours. If you are arrested without an FIR (First Information
     │        Report), this violates CrPC Section 154..."
     │
     ├─ Fact Extraction: Extract "arrest", "magistrate", "24 hours"
     ├─ Intent Detection: User might want bail → suggest templates
     ├─ Save to Conversation (both user msg + AI response)
     ├─ Generate chat title: "FIR & Arrest Rights"
     │
     └─ Response:
        {
          "success": true,
          "data": {
            "conversationId": "conv_123",
            "message": "Under Article 10...",
            "generationData": {
              "hasGenerationIntent": true,
              "documentType": "BAIL_APPLICATION_497",
              "canGenerate": true
            },
            "sources": [
              "Constitution Article 10",
              "CrPC Section 61"
            ]
          }
        }
```

---

## 10. DEPLOYMENT & OPERATIONS

### 10.1 Environment Variables

**Backend** (`backend/.env`):
```
# Database
MONGODB_URI=mongodb+srv://...

# API Keys
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=legalyze-documents

# Auth
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d

# URLs
FRONTEND_URL=https://legalyze.example.com
BACKEND_URL=https://api.legalyze.example.com

# Server
PORT=5000
NODE_ENV=production
```

**Frontend** (`frontend/.env`):
```
VITE_API_BASE_URL=https://api.legalyze.example.com
```

### 10.2 Build & Deployment

```bash
# Frontend
cd frontend
npm run build        # Vite build → dist/
npm run preview      # Test production build

# Backend
cd backend
npm install
npm start            # Node server on port 5000
# OR in docker: docker build -t legalyze-backend .
```

### 10.3 Scalability Considerations

| Component | Current Bottleneck | Scaling Solution |
|-----------|-------------------|------------------|
| **Pinecone Queries** | 10 queries/sec limit | Pinecone Pro tier |
| **OpenAI API** | 3500 RPM limit | Batch API or higher tier |
| **MongoDB** | Single Atlas cluster | Sharding + replica sets |
| **S3 Storage** | Bandwidth costs | CloudFront CDN |
| **Server Memory** | Large PDF extraction | Worker queue (Bull.js) |
| **Session Persistence** | In-memory timers | Redis session store |

---

## 11. COMPLIANCE & LEGAL NOTES

### 11.1 Data Sovereignty

Per system documentation:
- **Constitution of Pakistan**: Processed locally via SAHI Indexer
- **Statutory repositories**: Kept in Pakistan's jurisdiction (MongoDB Atlas)
- **User documents**: Encrypted in S3 (AWS)
- **No cloud-based prosecution database reliance**: Uses local Pinecone instance

### 11.2 Disclaimer

As stated in README:
> This is an AI-powered legal guidance system. While it references authentic Pakistani statutes and precedents, users should always consult with qualified Pakistani advocates for legal advice. Legalyze AI is a supplementary tool, not a substitute for professional legal counsel.

---

## 12. TESTING & DEBUG SCRIPTS

Key utility scripts in `/backend/scripts/`:

1. **`indexConstitution.js`** - Seed Constitution articles to Pinecone
2. **`indexAuthoritativeLaws.js`** - Index PPC/CrPC/CPC sections
3. **`testPineconeUpload.js`** - Verify vector storage
4. **`seedAdmin.js`** - Create superadmin user
5. **`testLogin.js`** - Manual authentication testing
6. **`verify_login.js`** - Debug login flow
7. **`testRAGSystem.js`** - End-to-end RAG testing
8. **`testPDF.js`** - PDF generation testing

---

## 13. ARCHITECTURE SUMMARY

```
LEGALYZE SYSTEM ARCHITECTURE OVERVIEW
═════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                           │
│  React + Vite + MUI (frontend/)                            │
│  - Chat Interface (Agentic RAG)                              │
│  - Case Building Wizard (7 steps)                            │
│  - Admin Dashboard (Analytics, Prompts, Users)               │
│  - Auth (Email + Google OAuth)                               │
└──────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │   JWT Token (localStorage)             │
        │   Authorization: Bearer {token}        │
        └───────────────────┬───────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                      │
│                     Port: 5000                               │
│                                                              │
│  Routes:                                                    │
│  ├─ /auth          (signup, login, google oauth)            │
│  ├─ /chat          (agentic RAG queries)                    │
│  ├─ /documents     (upload, extract, link)                  │
│  ├─ /constitutional-compliance (check violations)           │
│  ├─ /case-building (7-step wizard)                          │
│  ├─ /generate      (smart doc generation)                   │
│  ├─ /judgments     (precedent search)                       │
│  └─ /admin         (super admin operations)                 │
│                                                              │
│  Middleware:                                                │
│  ├─ CORS (origin: *)                                        │
│  ├─ JWT protect (verify token validity)                     │
│  ├─ Rate limiter (5000 req/15min global, 500 for auth)      │
│  ├─ express-validator (input validation)                    │
│  └─ Error handler (global error management)                 │
└──────────────────────────────────────────────────────────────┘
    │              │               │              │
    ↓              ↓               ↓              ↓
 MongoDB      Pinecone          OpenAI           AWS S3
 (Data)      (Vectors)          (LLM)         (Storage)
 
 ├─Users     ├─Constitution   ├─GPT-4o      ├─Uploads
 ├─Chats     ├─Laws (PPC...)  ├─Embeddings  ├─Reports
 ├─Docs      ├─Judgments      └─Mini        ├─Generated
 ├─Cases     └─User-uploads                 └─PDFs
 ├─Reports
 └─Prompts
```

---

## 14. NEXT STEPS FOR DEVELOPERS

### Setup Local Environment:
```bash
# 1. Backend
cd backend
npm install
# Create .env file with MongoDB URI, OpenAI key, etc.
npm run dev

# 2. Frontend
cd ../frontend
npm install
npm run dev    # Vite dev server on :5173

# 3. Access
# http://localhost:5173 → API calls to :5000
```

### Key Files to Review:
1. **Architecture**: `backend/services/LegalAgentService.js` (main orchestrator)
2. **Compliance Engine**: `backend/services/constitutionalComplianceService.js`
3. **Case Building**: `frontend/src/components/CaseBuildingWizard.jsx`
4. **Chat Flow**: `backend/routes/chat.js`
5. **Models**: `backend/models/` (all schemas)

---

## 15. GLOSSARY

| Term | Definition |
|------|-----------|
| **Agentic** | AI system that orchestrates multiple tools (search, LLM, DB) autonomously |
| **RAG** | Retrieval-Augmented Generation: Fetch relevant context first, then generate response |
| **Pinecone** | Vector database for semantic search using embeddings |
| **Embedding** | Vector representation of text (1024 dimensions in this system) |
| **LWOE** | Last Writer Out Extraction: Deep metadata extraction from documents |
| **PPC** | Pakistan Penal Code |
| **CrPC** | Code of Criminal Procedure (Pakistan) |
| **JWT** | JSON Web Token: Stateless authentication token |
| **Namespace** | Isolated index in Pinecone for different document categories |
| **System Prompt** | Instructions stored in DB that configure AI behavior |
| **Compliance Check** | Compare document against Constitution + statutory laws |

---

**End of Comprehensive Technical Analysis**

*Created for the Legalyze project at National University of Sciences and Technology (NUST), Islamabad*  
*Last Updated: April 19, 2026*
