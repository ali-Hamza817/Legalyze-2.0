export const systemDocs = [
    {
        id: 'intro',
        title: '1. Introduction',
        content: `
# Introduction
### 1.1 Purpose of the Document
This document provides a comprehensive technical and functional overview of the Legalyze platform. It serves as a single source of truth for understanding the system's architecture, intelligence layer, and operational workflows.

### 1.2 Scope of the System
Legalyze is an AI-driven ecosystem designed for the legal industry in Pakistan. It automates legal research via Retrieval-Augmented Generation (RAG), conducts constitutional compliance checks, and assists in case drafting through a structured wizard.
        `
    },
    {
        id: 'overview',
        title: '2. System Overview',
        content: `
# System Overview
### 2.1 System Vision and Objectives
To modernize the legal practice in Pakistan by providing instant, accurate, and constitutionally-grounded legal assistance.

### 2.2 System Use Case Diagram
Below is a high-level overview of the major user roles and their interactions with the system modules.

    /* Diagram removed */


### 2.5 Target Users
- **Lawyers & Advocates**: For case preparation and research.
- **Law Firms**: For internal knowledge management.
- **Super Admins**: For platform oversight.
        `
    },
    {
        id: 'architecture',
        title: '4. System Architecture',
        content: `
# System Architecture
### 4.1 Detailed System Architecture Diagram
The system follows a MERN + RAG multi-tier architecture, integrating external AI and Cloud storage services.

    /* Diagram removed */


### 4.2 Logical Architecture
- **Presentation Layer**: React.js / Material UI.
- **Application Layer**: Node.js / Express.js.
- **Data Layer**: MongoDB / Pinecone / AWS S3.
        `
    },
    {
        id: 'ai-layer',
        title: '6. AI & Intelligence Layer',
        content: `
# AI and Intelligence Layer
### 6.1 RAG Pipeline Sequence Diagram
This interaction shows how the system "finds" legal truth using Retrieval-Augmented Generation.

    /* Diagram removed */


### 6.2 AI Design Philosophy
"Grounded Intelligence." The AI is not allowed to speak from its own generic knowledge alone; it must cite the Knowledge Base.
        `
    },
    {
        id: 'functional-modules',
        title: '5. Core Functional Modules',
        content: `
# Core Functional Modules
### 5.1 User Authentication and Authorization
Multi-layered security using JWT for sessions and Google OAuth 2.0.

### 5.2 Case Intake and Case Facts Analysis
A dedicated intake module that extracts and summarizes core facts from user descriptions.

### 5.5 Petition Drafting and Document Generation
Compiles user data into legal templates, rendered via Markdown and professional MUI components.
        `
    },
    {
        id: 'petition-mgmt',
        title: '7. Petition Management System',
        content: `
# Petition Management System
### 7.1 Supported Petition Types
- Writ Petitions (Article 199).
- Civil Revisions.
- Bail Applications.
- Family Matters.
        `
    },
    {
        id: 'admin-panel',
        title: '9. Admin Panel & Controls',
        content: `
# Admin Panel and System Control
### 9.1 Admin Roles and Privileges
- **Super Admin**: System Pulse, Financials, Global Settings.
- **Admin**: User management, Compliance oversight.
        `
    },
    {
        id: 'security-compliance',
        title: '11. Security & Compliance',
        content: `
# Security and Compliance
### 11.1 Data Security Measures
Encryption at rest (MongoDB Atlas/AWS S3) and in transit (HTTPS/SSL).

### 11.2 User Data Privacy
PII is strictly isolated and accessible only to authorized sessions.
        `
    },
    {
        id: 'future',
        title: '18. Future Enhancements',
        content: `
# Future Enhancements
### 18.1 Additional Petition Types
Expansion into Family Law, Rent Disputes, and Labour Law.

### 18.3 Multilingual Support (Urdu / English)
Full UI and document generation in the national language, Urdu.
        `
    }
];
