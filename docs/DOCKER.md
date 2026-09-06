# 🏛️ Legalyze - Agentic AI for Pakistani Legal System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development Setup](#local-development-setup)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)
- [Research Paper](#research-paper)

---

## 🎯 Overview

**Legalyze** is a sovereign agentic AI framework designed to transform judicial workflows in Pakistan by automating legal research, document analysis, and case drafting through intelligent Retrieval-Augmented Generation (RAG).

**Problem Solved**: Legal research in Pakistan is labor-intensive, taking days of manual work. Legalyze reduces this from hours of manual labor to mere **minutes of verified AI synthesis**.

### 🔑 Key Statistics
- **Reduces Research-Drafting Latency**: Hours → Minutes
- **Constitutional Compliance**: Automated Article-by-Article auditing
- **Smart Case Buildup**: 7-step interactive AI-guided wizard
- **Dual-Database RAG**: Semantic (Pinecone) + Lexical (MongoDB) retrieval

---

## ✨ Core Features

### 🧙‍♂️ Adaptive Case Buildup Wizard
- **Iterative AI Dialogue**: Step-by-step case preparation guidance
- **Fact-to-Statute Mapping**: Auto-identifies relevant PPC/CrPC sections
- **Temporal Analysis**: Automatically builds chronological timelines
- **Dynamic Petition Generation**: Creates formal legal documents with verified citations

### ⚖️ Constitutional Compliance Engine
- **Article-by-Article Auditing**: Cross-references facts against 1973 Constitution
- **Violation Detection**: Automatically flags fundamental rights breaches
- **Loophole Discovery**: Identifies procedural gaps that could cause dismissal
- **Intelligent Recommendations**: Suggests corrective measures

### 🔍 Structure-Aware Hierarchical Indexing (SAHI)
- Preserves legal context hierarchy (Part > Chapter > Section > Article)
- Eliminates context drift typical in generic RAG systems
- Maintains jurisdictional precision with breadcrumb tracking

### 📊 Deep Metadata Extraction
- **Party Identification**: Distinguishes Petitioner, Respondent, Witnesses
- **Forum Validation**: Recommends correct judicial tier
- **Intelligence Extraction**: Pulls legal insights from unstructured documents

### 🤖 Agentic RAG System
- **Intent Classification**: Intelligently routes queries
- **Parallel Retrieval**: Simultaneous Pinecone (semantic) + MongoDB (lexical) search
- **Context Synthesis**: Combines retrieved documents with legal reasoning
- **Hallucination Prevention**: Every claim backed by source document IDs

---

## 📥 Prerequisites

### For Docker Setup (Recommended for Reviewers)
- **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Verify: `docker --version`
  - Verify Compose: `docker-compose --version`
- **Git**: [Install Git](https://git-scm.com/downloads)

### For Local Development
- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **npm**: v9+ (comes with Node.js)
- **MongoDB Atlas**: Free account ([Create here](https://www.mongodb.com/cloud/atlas))
- **Pinecone**: Free vector DB account ([Sign up](https://www.pinecone.io/))
- **OpenAI API Key**: [Get API key](https://platform.openai.com/account/api-keys)
- **AWS S3 Credentials**: For document storage

---

## 🚀 Quick Start with Docker (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/ali-Hamza817/Legalyze.git
cd Legalyze
```

### Step 2: Create Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your credentials:

```env
# REQUIRED - Database
MONGODB_URI=<your-mongodb-atlas-connection-string>

# REQUIRED - AI & Vector DB
OPENAI_API_KEY=<your-openai-api-key>
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX_NAME=legal-documents
PINECONE_ENVIRONMENT=us-east-1

# REQUIRED - Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# JWT Secret
JWT_SECRET=your-long-random-secret-key-here

# Server URLs
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
REACT_APP_API_URL=http://localhost:5000
```

### Step 3: Run with Docker Compose

```bash
# Start all services (backend + frontend + networks)
docker-compose up --build

# Run in background (detached mode)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 4: Access the Application

- **Frontend**: Open browser → http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Step 5: Seed Test Data (Optional)

```bash
# Access the backend container
docker-compose exec backend npm run seed

# This creates test users:
# Email: admin@legalyze.com | Password: Admin@123
# Email: john.doe@legalyze.com | Password: John@123
```

---

## 💻 Local Development Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (use .env.example as template)
cp ../.env .env

# Seed the database with test users
npm run seed

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│  Frontend: React 18 + Vite + Material-UI            │
│  (Served via Node.js on port 3000)                  │
├─────────────────────────────────────────────────────┤
│  Backend: Node.js + Express                         │
│  (API Server on port 5000)                          │
│  ├─ Authentication & Authorization                  │
│  ├─ Document Processing & RAG                       │
│  ├─ Constitutional Compliance Checking              │
│  └─ Case Building Wizard Orchestration              │
├─────────────────────────────────────────────────────┤
│  Persistent Data Layer                              │
│  ├─ MongoDB Atlas (Metadata & Lexical Data)         │
│  └─ Pinecone (Vector Embeddings - 1024 dims)        │
├─────────────────────────────────────────────────────┤
│  External Services                                  │
│  ├─ OpenAI GPT-4o (AI Intelligence)                │
│  ├─ AWS S3 (Document Storage)                       │
│  └─ Google OAuth 2.0 (Authentication)               │
└─────────────────────────────────────────────────────┘
```

### Database Models

| Model | Purpose |
|-------|---------|
| **User** | User accounts, roles, authentication |
| **Conversation** | Chat history with document context |
| **Document** | Uploaded files, processing status |
| **ComplianceCheck** | Constitutional audit results |
| **CaseBuildingSession** | Case wizard progress |
| **SystemPrompt** | AI behavior configuration |
| **GeneratedDocument** | AI-created legal documents |
| **TimelineEvent** | Extracted temporal data |

---

## 📡 API Documentation

### Health Check
```bash
GET /api/health
```

### Authentication
```bash
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me (Protected)
POST /api/auth/logout (Protected)
```

### Chat & RAG
```bash
POST /api/chat              # Send message with document context
GET /api/chat/conversations # Get user's conversations
GET /api/chat/conversations/:id
DELETE /api/chat/conversations/:id
```

### Document Management
```bash
POST /api/documents/upload           # Upload document
GET /api/documents                   # List user's documents
GET /api/documents/:id               # Get document metadata
DELETE /api/documents/:id            # Delete document
```

### Case Building
```bash
POST /api/case-building/start        # Start new case
PUT /api/case-building/:id/progress  # Update case progress
GET /api/case-building/:id           # Get case details
```

### Constitutional Compliance
```bash
POST /api/constitutional-compliance/check   # Check document compliance
GET /api/constitutional-compliance/:id     # Get compliance report
```

### Document Generation
```bash
POST /api/generate/petition          # Generate legal petition
POST /api/smart-generate/strategy    # Generate case strategy
```

---

## 🔐 Environment Variables

See [.env.example](.env.example) for complete reference.

### Required for Docker/Local

| Variable | Description | Where to Get |
|----------|-------------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |
| `OPENAI_API_KEY` | OpenAI GPT-4o key | [OpenAI Platform](https://platform.openai.com/) |
| `PINECONE_API_KEY` | Vector DB credentials | [Pinecone Console](https://app.pinecone.io/) |
| `AWS_ACCESS_KEY_ID` | AWS credentials | [AWS IAM](https://console.aws.amazon.com/iam/) |
| `JWT_SECRET` | JWT signing key | Generate your own |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth for social login |
| `EMAIL_USER` | For sending notifications |

---

## 🧪 Testing

### Test Document Upload & RAG
```bash
cd backend
node scripts/testPineconeUpload.js
node scripts/testPineconeRAG.js
```

### Test Constitutional Compliance
```bash
node scripts/testEnhancedCompliance.js
```

### Test Case Building Wizard
```bash
node scripts/testGenerate.js
```

---

## 📦 Docker Commands Reference

### Start Services
```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Manage Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build
```

### Access Container Shell
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

### View Container Status
```bash
docker-compose ps
```

---

## 🐛 Troubleshooting

### Docker Issues

| Issue | Solution |
|-------|----------|
| Port 3000/5000 already in use | Change ports in docker-compose.yml or stop conflicting services |
| Container exits immediately | Check logs: `docker-compose logs backend` |
| Modules not installing | Delete `node_modules` and rebuild: `docker-compose up --build` |
| Connection refused | Ensure backend is healthy: `docker-compose ps` |

### Backend Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Verify MONGODB_URI in .env |
| OpenAI API error | Check OPENAI_API_KEY is valid |
| Pinecone not indexing | Verify PINECONE_API_KEY and PINECONE_INDEX_NAME |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Cannot reach backend | Verify REACT_APP_API_URL in .env matches backend port |
| Theme doesn't load | Clear browser cache and localStorage |
| Build fails | Delete `node_modules` and `dist`, reinstall |

---

## 📚 Documentation

- [System Architecture Documentation](./system_documentation.md)
- [Backend README](./backend/README.md)
- [Testing Guide](./backend/TESTING_GUIDE.md)
- [IvorySand Theme Implementation](./IVORYSAND_IMPLEMENTATION.md)

---

## 🎓 For Researchers & Reviewers

### Running for Research
1. Clone the repo
2. Copy `.env.example` to `.env` and add your credentials
3. Run `docker-compose up --build`
4. Access the application at http://localhost:3000
5. Sign in with test credentials:
   - Email: `admin@legalyze.com`
   - Password: `Admin@123`

### Examining the Code
- **Frontend**: `frontend/src/` - React components and pages
- **Backend**: `backend/` - Node.js services and routes
- **AI Services**: `backend/services/` - LegalAgentService, RAG, Compliance
- **Models**: `backend/models/` - MongoDB schemas
- **Configuration**: `.env.example` - All required settings

### Key Files for Research
- `backend/services/LegalAgentService.js` - Agentic orchestration
- `backend/services/RAGService.js` - Retrieval-Augmented Generation
- `backend/services/ComplianceService.js` - Constitutional compliance checking
- `backend/routes/caseBuilding.js` - Case building wizard implementation

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔬 Research Paper

This project is developed as part of a Master's thesis on **Agentic AI for Pakistani Legal Systems** at:

**National University of Sciences and Technology (NUST)**  
Islamabad, Pakistan  

For academic inquiries, please contact the development team.

---

## 📞 Support

### Need Help?

1. **Check Documentation**: Start with [system_documentation.md](./system_documentation.md)
2. **Review Logs**: `docker-compose logs -f`
3. **Check Issues**: [GitHub Issues](https://github.com/ali-Hamza817/Legalyze/issues)
4. **Testing**: Run test scripts in `backend/scripts/`

### Common Questions

**Q: How long does a document take to process?**  
A: Usually 30-60 seconds depending on document length.

**Q: Can I use this for production?**  
A: Yes, it's production-ready. Ensure you set `NODE_ENV=production` and use secure credentials.

**Q: What about data privacy?**  
A: All data stays in your MongoDB and S3. External APIs (OpenAI, Pinecone) handle data according to their privacy policies.

**Q: Can I modify the AI prompts?**  
A: Yes! Use the Admin panel to update system prompts without restarting.

---

## 🙏 Acknowledgments

Developed and researched at **Military College of Signals, NUST**, Rawalpindi, Pakistan.

© 2026 Legalyze Team | Sovereign AI for Pakistani Law

---

**Last Updated**: April 19, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
