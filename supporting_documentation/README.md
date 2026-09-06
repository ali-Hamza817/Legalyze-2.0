# Supporting Documentation - Legalyze

## An Open-Source Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence

This folder contains legal documents and statutory resources that support the Legalyze research and implementation.

## Contents

### Constitutional & Legislative Documents

- **Constitution of Pakistan.txt** - The 1973 Constitution of Pakistan (with amendments)
- **Pakistan Panel Code.pdf** - Main statutory code for criminal law
- **THE CODE OF CRIMINAL PROCEDURE, 1898.pdf** - Criminal procedural law
- **THE CODE OF CIVIL PROCEDURE, 1908.pdf** - Civil procedural law
- **THE LIMITATION ACT, 1908.pdf** - Statute of limitations for legal cases
- **THE QANUN-E-SHAHADAT, 1984.pdf** - Islamic law of evidence

### Supreme Court Rules

- **Supreme Court Rules.pdf** - Procedural rules for Pakistan's Supreme Court

---

## Purpose

These documents are referenced in the Legalyze system for:

1. **Constitutional Compliance Engine** - Auditing case facts against Constitutional articles
2. **RAG System Knowledge Base** - Semantic and lexical indexing of legal statutes
3. **Research Reference** - Supporting materials for the academic research paper

---

## Usage in Legalyze

The system indexes these documents using:

- **Pinecone Vector Database**: Semantic embeddings (1024-dimensional) for similarity search
- **MongoDB Full-Text Search**: Lexical indexing for precise keyword matching
- **Structure-Aware Hierarchical Indexing (SAHI)**: Preserving legal hierarchy (Part > Chapter > Section > Article)

---

## Research Paper Reference

These documents are cited in the research paper:  
**"Bridging the Judicial Backlog in Pakistan through Agentic Retrieval-Augmented Generation for Automated Judicial Decision Support"**

Developed at: **National University of Sciences and Technology (NUST), Islamabad, Pakistan**

---

**Last Updated**: April 19, 2026
