# Legalyze Manuscript Revision Walkthrough & Verification Report
**Manuscript ID:** 2961684  
**Journal:** *Expert Systems* (Wiley)  
**Title:** Legalyze: An Open-Source Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence  
**Authors:** Ali Hamza, Maaz Bin Rizwan, Maemoona Kayani, Shafa-at Ali Sheikh  
**Status:** Revisions Complete | Fully Compiled PDF Ready | All 7 Reviewer Comments Fully Moderated & Resolved  

---

## 🎯 Overview & Revision Objectives

This document provides a comprehensive walkthrough of the structural, statistical, and textual revisions applied to the manuscript **Legalyze** in response to the decision letter and reviewer feedback from *Expert Systems*.

All edits have been integrated directly into the authoritative LaTeX source file [`Actual Final Submission/Latex/main.tex`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/Latex/main.tex) and highlighted using blue text via `\rev{...}` formatting macro.

---

## 📋 Comprehensive Breakdown of Reviewer Comments & Solutions

Below is the detailed item-by-item breakdown of the reviewer comments and the exact technical, statistical, and textual solutions implemented:

### 1. Comment 1: Table & Figure Cross-Referencing & `??` References
* **Reviewer Criticism:** The manuscript contained broken references displaying as `??` in the text because tables were detached or formatted using custom `\captionof` / `labelformat=empty` commands, breaking LaTeX cross-referencing keys.
* **Implemented Solution:**
  * Re-integrated all **5 tables** directly into `main.tex` body:
    * `Table 1`: Literature Review (`\label{tab:litreview}`)
    * `Table 2`: Factual Groundedness vs. Legal Accuracy Matrix (`\label{tab:matrix}`)
    * `Table 3`: Hallucination Rate by Domain (`\label{tab:hr}`)
    * `Table 4`: Qualitative Query Execution Comparison (`\label{tab:sample_comparison}`)
    * `Table 5`: Retrieval Ablation Study (`\label{tab:ablation}`)
  * Converted Figures 7 (`fig:corpus`) and 8 (`fig:hr`) into proper `\begin{figure}[H]` environments without suppressing label formatting.
  * Verified 0 broken references (`??`) in the compiled PDF.

---

### 2. Comment 2: Paired Experimental Design & Statistical Re-Analysis
* **Reviewer Criticism:** The evaluation used the exact same 67 queries across all 3 systems (Zero-Shot, Standard RAG, Legalyze), constituting a repeated-measures (paired) design. Using an un-paired Pearson Chi-Squared ($\chi^2$) test was methodologically flawed. Additionally, the reviewer asked why per-configuration Fleiss' Kappa ($\kappa = 0.615\text{--}0.718$) appeared lower than the overall pooled Kappa ($\kappa = 0.743$).
* **Implemented Solution:**
  * **Cochran's Q Test:** Applied to the consensus-adjudicated dataset ($N = 67$ queries across 3 systems):
    $$Q = 37.57, \quad df = 2, \quad p = 6.93 \times 10^{-9}$$
    Confirming statistically significant differences across all 3 systems under a repeated-measures framework.
  * **Pairwise McNemar Tests (Exact Binomial):**
    * Zero-Shot vs. Standard RAG: $p = 7.53 \times 10^{-4}$
    * **Zero-Shot vs. Legalyze:** $p = 5.40 \times 10^{-9}$
    * Standard RAG vs. Legalyze: $p = 4.43 \times 10^{-3}$
  * **Generalized Estimating Equations (GEE Logistic Regression):** Executed on all $N = 603$ pooled reviewer judgments with query-level clustering (exchangeable correlation structure, robust sandwich SE):
    * **Standard RAG vs. Legalyze:** Odds Ratio ($\text{OR}$) $= 5.13$ [$95\%\text{ CI: } 1.76, 14.92$], $p = 0.003$
    * **Zero-Shot vs. Legalyze:** $\text{OR} = 20.88$ [$95\%\text{ CI: } 7.29, 59.81$], $p = 1.52 \times 10^{-8}$
    *(Legalyze reduces odds of hallucination by $20.9\times$ vs Zero-Shot and $5.1\times$ vs Standard RAG).*
  * **Fleiss' Kappa Paradox Explanation:** Added a dedicated paragraph explaining the **Prevalence Effect** (Feinstein & Cicchetti, 1990): in highly skewed single configurations (e.g., 94.5% traceable for Legalyze), chance agreement ($P_e$) is deflated, whereas pooling all 3 systems balances the Y/N marginal distribution and yields the true overall agreement ($\kappa = 0.743$).

---

### 3. Comment 3: Methodological & Terminology Precision
* **Reviewer Criticism:** The term "strict double-blind" was inaccurate because the research team knew system assignments (it was reviewer-blinded, single-blind to evaluators). Additionally, the reviewer asked how Zero-Shot responses were evaluated without retrieved passages and requested clarification on the unit of analysis (statements vs responses).
* **Implemented Solution:**
  * Replaced `strict double-blind` with **reviewer-blinded evaluation protocol** across Abstract, Introduction, Experimental Setup, and Results sections, accompanied by an explanatory footnote.
  * Clarified that for Zero-Shot responses, reviewers were presented with explicit placeholder text: *"(No retrieval passage --- this response was generated without source context.)"*.
  * Clarified unit of analysis: 67 legal queries executed across 3 systems yielded **201 complete system responses**, each receiving a single binary traceability annotation (Y/N) per reviewer ($201 \times 3 = 603$ total judgments).

---

### 4. Comment 4: Corpus Composition & Query Distribution
* **Reviewer Criticism:** The text incompletely described the corpus (omitting CrPC and Qanun-e-Shahadat Order in text summaries) and stated queries were "drawn uniformly" without providing exact domain counts.
* **Implemented Solution:**
  * Expanded corpus description in Analysis & Results to explicitly list all **five Pakistani legal sources**:
    1. Constitution of Pakistan (1973, 280 articles, 6 schedules)
    2. Pakistan Penal Code (PPC, 1860, 511 sections)
    3. Code of Criminal Procedure (CrPC, 1898)
    4. Qanun-e-Shahadat Order (1984 evidence statute)
    5. 250 Superior Court Rulings (2018–2024)
  * Provided exact query breakdown by domain: **24 Constitutional Law (35.8%)**, **23 Criminal Law/PPC (34.3%)**, and **20 Procedural Law/CrPC (29.9%)**.

---

### 5. Comment 5: Retrieval Ablation Surrogate Framing & Prose Consistency
* **Reviewer Criticism:** The 7-configuration retrieval ablation used character 3-gram VSM cosine similarity as a local proxy rather than production Pinecone vector embeddings, so labeling it "Legalyze Full" was inaccurate.
* **Implemented Solution:**
  * Renamed the configuration in Table 5 and prose text from `Legalyze Full` to **the offline SAHI Hybrid with RRF configuration** (`SAHI Hybrid + RRF†` in Table 5).
  * Added a dagger footnote ($\dagger$) in Table 5 and explicit text in Section 3.4 clarifying that this ablation evaluates an **offline surrogate pipeline** using 3-gram VSM dense proxies, distinguishing it from the production Pinecone setup.

---

### 6. Comment 6: System Scalability & 6 Missing Citations
* **Reviewer Criticism:** The paper lacked a discussion on the transferability/scalability of the system architecture to other legal domains and missed 6 relevant citations on representation alignment, out-of-distribution detection, and domain adaptation.
* **Implemented Solution:**
  * Added a new subsection/paragraph in Discussion titled **Scalability and Transferability**, connecting SAHI regex parsing and RRF dual-stream retrieval to multi-modal representation alignment, class-imbalanced OOD detection, and partial information decomposition.
  * Added all **6 requested bibliographical entries** (`rF1`–`rF6`) into `main.tex` and cited them in text:
    * *Fang et al. (AAAI 2026)* [`rF1`]
    * *Fang et al. (IEEE TMM 2023)* [`rF2`]
    * *Fang et al. (IEEE TMM 2024)* [`rF3`]
    * *Fang et al. (IEEE TETCI 2022)* [`rF4`]
    * *Fang et al. (arXiv 2024)* [`rF5`]
    * *Fang et al. (ICML 2026)* [`rF6`]

---

### 7. Comment 7: Softening Overclaims & Scope Boundaries (5 Moderation Revisions Applied)
* **Reviewer Criticism:** Statements like "ensures every claim is grounded", "professional-grade", "suitable for professional use", and "provides a new standard" overstated the system's current readiness and domain attribution.
* **Implemented Solution (5 Precise Wording Moderations):**
  1. **"research-grade 5.5%"** $\rightarrow$ Replaced in Section 6 Conclusion with:
     * `"reducing the pooled zero-shot hallucination rate from 54.7% to 5.5%"`
  2. **"allow legal practitioners to use AI in high-stakes settings"** $\rightarrow$ Replaced in Section 6 Conclusion with:
     * `"These results suggest potential for Legalyze as a research and decision-support aid, subject to human legal verification in high-stakes settings."`
  3. **"providing a strong empirical foundation for its use in professional legal practice"** $\rightarrow$ Replaced in Section 4 Results with:
     * `"providing encouraging empirical evidence for its potential as a legal research and decision-support aid under human expert verification."`
  4. **"ensures that every claim is grounded" / "ground every output"** $\rightarrow$ Replaced in Section 1 Intro & Section 6 Conclusion with:
     * Section 1: `"is designed to ground generated claims in verifiable statutory evidence."`
     * Section 6: `"is designed to ground generated outputs in verifiable legal sources."`
  5. **"Legalyze Full" in Ablation Prose** $\rightarrow$ Replaced in Section 4.3 Ablation Study prose with:
     * `"Combining the SAHI streams under the offline SAHI Hybrid with RRF configuration achieves..."`

---

## 🗺️ Section-by-Section Text Mapping Table

| Section in `main.tex` | Reviewer Comment | Applied Edit Summary | Highlighting in PDF |
|---|---|---|---|
| **Abstract** (Lines 114–141) | Comments 2, 3, 5, 7 | Added Cochran's Q and McNemar stats, fixed blinded protocol term, framed ablation as offline surrogate, softened commercial overclaims. | `\rev{...}` (Light Blue) |
| **Section 1: Introduction** (Lines 187–196) | Comments 2, 3, 7 | Updated stats citation to Cochran's Q and GEE OR, changed "strict double-blind" to "reviewer-blinded protocol", changed "ensures that all outputs" to "is designed to ground generated claims". | `\rev{...}` (Light Blue) |
| **Section 2: Literature Review** (Lines 274–286) | Comments 2, 7 | Softened groundings claim, updated statistical significance reference to Cochran's Q. | `\rev{...}` (Light Blue) |
| **Section 3.3: Analysis** (Lines 557–570) | Comment 4 | Added CrPC (1898) and Qanun-e-Shahadat Order (1984) into the 5-source corpus description. | `\rev{...}` (Light Blue) |
| **Section 3.3: Experimental Setup** (Lines 662–707) | Comments 3, 4 | Specified query distribution (24 Const, 23 Crim, 20 Proc), added reviewer-blinded protocol footnote, detailed zero-shot placeholder text. | `\rev{...}` (Light Blue) |
| **Section 4: Results & Figures** (Lines 719–745) | Comment 1 | Refactored Figures 7 & 8 into proper `\begin{figure}[H]` environments to eliminate `??` references. | Standard LaTeX |
| **Section 4: Results - Table 3** (Lines 746–775) | Comments 1, 7 | Integrated Table 3 directly into body text; replaced "strong empirical foundation for its use in professional legal practice" with "encouraging empirical evidence for its potential as a legal research and decision-support aid under human expert verification". | `\rev{...}` (Light Blue) |
| **Section 4: Statistics Subsection** (Lines 828–870) | Comment 2 | Replaced Pearson $\chi^2$ with Cochran's Q ($Q=37.57$), McNemar ($p=5.40\times 10^{-9}$), GEE ($\text{OR}=20.88$), and Fleiss' Kappa prevalence paradox note. | `\rev{...}` (Light Blue) |
| **Section 4.3: Retrieval Ablation** (Lines 940–958) | Comments 5, 7 | Renamed `Legalyze Full` to `SAHI Hybrid + RRF†` in Table 5; updated prose text to "Combining the SAHI streams under the offline SAHI Hybrid with RRF configuration achieves...". | `\rev{...}` (Light Blue) |
| **Section 5: Discussion** (Lines 996–1048) | Comments 6, 7 | Added "Scalability and Transferability" subsection with 6 citations; softened domain attribution and commercial claims. | `\rev{...}` (Light Blue) |
| **Section 6: Conclusion** (Lines 1065–1086) | Comments 2, 7 | Softened conclusion claims to "reducing the pooled zero-shot hallucination rate from 54.7% to 5.5%", "designed to ground generated outputs in verifiable legal sources", and "suggest potential for Legalyze as a research and decision-support aid, subject to human legal verification in high-stakes settings." | `\rev{...}` (Light Blue) |
| **`thebibliography`** (Lines 1243–1285) | Comment 6 | Added 6 new bibliography entries (`rF1` through `rF6`) by Fang et al. | Standard LaTeX |

---

## 🛠️ Verification & Compilation Output

The manuscript was compiled locally using **Tectonic v0.15.0** (standalone TeX engine):

```bash
.\tectonic.exe main.tex
# Result: Writing `main.pdf` (1.89 MiB / 1.98 MB uncompressed)
```

### Generated Final Deliverables:
1. **Walkthrough File:**
   * Path: [`Actual Final Submission/walkthrough.md`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/walkthrough.md)
2. **Compiled Manuscript PDF:**
   * Path: [`Actual Final Submission/Legalyze Revised Manuscript.pdf`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/Legalyze%20Revised%20Manuscript.pdf)
   * Size: 1,980,732 bytes (1.98 MB)
   * Status: Clean compilation, 0 broken references (`??`), all new revisions highlighted in blue (`\rev{...}`).
3. **Response Sheet Documents (DOCX & PDF):**
   * Path: [`Actual Final Submission/Response Sheet (Legalyze).pdf`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/Response%20Sheet%20%28Legalyze%29.pdf)
   * Path: [`Actual Final Submission/Response Sheet (Legalyze).docx`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/Response%20Sheet%20%28Legalyze%29.docx)
4. **Updated Overleaf Package ZIP:**
   * Path: [`Actual Final Submission/Legalyze_ReRevision_Overleaf.zip`](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/Actual%20Final%20Submission/Legalyze_ReRevision_Overleaf.zip)
