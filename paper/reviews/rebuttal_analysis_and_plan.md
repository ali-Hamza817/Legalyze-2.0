# Rebuttal Analysis & Comprehensive Implementation Plan
**Journal:** Wiley *Expert Systems*  
**Manuscript Title:** Legalyze: An Open-Source Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence  
**Authors:** Ali Hamza, Maaz Bin Rizwan, Maemoona Kayani, Shafa-at Ali Sheikh  
**Institution:** National University of Sciences and Technology (NUST), Islamabad, Pakistan  

> [!CAUTION]
> **Research Integrity Notice:** This document does NOT contain any fabricated, placeholder, or invented experimental results. Every numerical value in this plan is either (a) directly computed by a script against real data in this repository, or (b) explicitly marked as "TO BE COMPUTED" with a script provided to generate it. No value should be written into the manuscript until the corresponding experiment has been genuinely executed and verified.

---

## Part 1: Detailed Reviewer Comments & Technical Analysis

This section analyzes the scientific and methodological critique raised by the reviewers, detailing what they are requesting and the technical implications of their comments.

### 🔬 Reviewer 1 Critique

#### Point 1.1: Experimental Design & Numerical Mismatch
* **Reviewer's Critique:** Section 4 and Table 2 state that "200 randomly selected AI-generated statements" were assessed by three legal reviewers. However, there is no explanation of:
  1. How the underlying questions were created.
  2. How many questions produced those statements.
  3. Whether the same questions were evaluated for all three configurations.
  4. How statements were extracted from multi-sentence answers.
  5. Whether the 200 statements were evaluated per system or shared.
  6. **Numerical Issue:** A sample of exactly 200 binary-labeled statements cannot yield hallucination rates of 54.6%, 22.8%, or 5.5% directly, as the rates must change in 0.5% increments.
* **What it means:** The reviewer suspects the evaluation is poorly defined or that the numbers are improperly averaged without description.
* **Our Solution:**
  - Document the actual query generation process with full transparency.
  - Explain whether the same 200 queries were used across all three configurations.
  - Detail the statement extraction process.
  - **Resolve the Math Discrepancy:** This is the critical point. The ONLY valid explanation is if there were 3 reviewers × 200 statements = 600 independent judgments. **But this explanation is only valid if the evaluation was actually conducted this way.** If instead:
    - Reviewers discussed disagreements → we cannot claim 600 independent observations
    - Majority voting was used → the effective N is still 200
    - One final consensus label existed → the effective N is still 200
  
  **⚠️ ACTION REQUIRED FROM AUTHORS:** Confirm exactly how the evaluation was conducted. If the 600-judgment pooling is accurate, we state it clearly. If not, we must honestly describe the actual procedure and acknowledge the numerical approximation or re-run the evaluation.

#### Point 1.2: Definition of Hallucination (Grounding vs. Correctness)
* **Reviewer's Critique:** Equation (3) defines a hallucination purely as a proposition that cannot be traced to a retrieved source. This is insufficient because:
  1. A proposition may be traceable to a retrieved passage that is outdated, inapplicable to the jurisdiction, or incorrectly interpreted.
  2. A legally correct proposition may require synthesis across multiple passages.
  3. The evaluation must distinguish factual correctness, citation existence, citation entailment, and jurisdictional applicability.
* **What it means:** The evaluation is currently too simplistic and ignores the complex nature of legal truth.
* **Our Solution:**
  - Introduce multi-dimensional metrics. These are *definitions* (not experimental results), so they can be added:
    - **Answer Correctness (AC):** Proportion of legally/factually true assertions.
    - **Citation Precision (CP):** Proportion of cited sources that entail the assertion.
    - **Citation Recall (CR):** Proportion of required authoritative provisions cited.
    - **Support Coverage (SC):** Proportion of generated sentences grounded in evidence.
  - **⚠️ However:** We can only *report values* for these metrics if we actually conduct the multi-dimensional evaluation. If the original evaluation only measured binary hallucination (yes/no), we should:
    - Define the metrics mathematically in the manuscript (this is a contribution).
    - If time permits, re-evaluate a subset of responses using the multi-dimensional rubric.
    - Otherwise, state this as a limitation and future work.
  - Describe the adjudication policy for precedent conflicts (Article 189 of the 1973 Constitution). This is a design decision in the system, not an experimental result, so it can be stated.
  - Soften the reasoning bottleneck claim in Section 5.

#### Point 1.3: Ablation Studies & Direct Retrieval Metrics
* **Reviewer's Critique:** Table 2 compares Legalyze against Zero-Shot and Standard RAG, changing multiple variables (SAHI, dual-stream, RRF) simultaneously. The authors must conduct a proper ablation and report direct retrieval quality metrics (Recall@k, MRR, nDCG).
* **What it means:** This is the most important revision. The experimental evaluation must prove each component's contribution.
* **Our Solution:**
  - **This experiment MUST be actually run.** We need to:
    1. Create a ground-truth evaluation set: a set of queries with known correct legal provisions.
    2. Run each retrieval configuration against these queries.
    3. Compute Recall@5, Recall@10, Precision@5, MRR, nDCG from the actual retrieval results.
  - The system already has the infrastructure for this:
    - [searchService.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/services/searchService.js) implements hybrid search with RRF.
    - [pineconeService.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/services/pineconeService.js) provides vector search.
    - MongoDB text search provides BM25-like keyword search.
  - **We will write an evaluation script** that runs each configuration and computes metrics from real retrieval results. This requires the live Pinecone + MongoDB infrastructure.
  - **⚠️ REQUIREMENT:** The backend services (Pinecone, MongoDB, OpenAI) must be accessible to run these experiments.

#### Point 1.4: SAHI Technical Details & Pseudocode
* **Reviewer's Critique:** The paper doesn't explain how SAHI's semantic anchors and hierarchical breadcrumbs are generated. Provide a formal algorithm/pseudocode and evaluate the hierarchy extraction accuracy.
* **What it means:** SAHI is treated as a "black box." It needs a formal algorithmic definition and accuracy evaluation.
* **Our Solution:**
  - The algorithmic description (pseudocode) is a documentation task — it describes the existing implementation in [structureAwareChunker.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/services/structureAwareChunker.js) and [indexConstitution.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/scripts/indexConstitution.js). This can be added to the manuscript.
  - **Parser accuracy MUST be actually measured.** We will:
    1. Write a script that runs the `parseConstitution()` function from [indexConstitution.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/scripts/indexConstitution.js) against the actual [Constitution of Pakistan.txt](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/supporting_documentation/Constitution%20of%20Pakistan.txt) (6,346 lines, 451KB).
    2. Create a manual ground-truth annotation for a subset (e.g., 50 articles) with known Part/Chapter/Article numbers.
    3. Compare parser output vs ground truth and compute precision/recall for structural element detection.
    4. **Report only the actually measured accuracy.**

#### Point 1.5: RRF Relevance Claim
* **Reviewer's Critique:** The claim that RRF mathematically makes evidence "much more likely to be relevant" is not generally guaranteed.
* **Our Solution:**
  - Soften wording. This is a text edit, not an experimental claim. Replace with language like "empirically correlates with higher relevance in our evaluation."

---

### 🔬 Reviewer 2 Critique

#### Point 2.1: Methodological Transparency (Reviewers & Blinding)
* **Reviewer's Critique:** The "independent qualified legal reviewers" are not sufficiently characterized.
* **Our Solution:**
  - **⚠️ ACTION REQUIRED FROM AUTHORS:** Provide the actual reviewer demographics (qualifications, years of experience, practice areas). Only state what is true.
  - **⚠️ ACTION REQUIRED FROM AUTHORS:** Confirm whether the evaluation was truly double-blind (shuffled, anonymized responses) or not. Only state what was actually done.
  - **Fleiss' Kappa:** Do NOT invent a value. If the raw reviewer labels (per-statement, per-reviewer) are available, we will compute κ using a script. If they are not available, we state this as a limitation.

#### Point 2.2: Statistical Significance
* **Reviewer's Critique:** Provide statistical significance tests and 95% confidence intervals.
* **Our Solution:**
  - **These CAN be computed** from the raw hallucination counts in Table 2, which are already in the manuscript. The Chi-squared test and confidence intervals are purely mathematical operations on the existing data. We will:
    1. Write a Python script that computes Chi-squared from the contingency table.
    2. Compute 95% Wilson confidence intervals.
    3. Report only the computed values.
  - **⚠️ NOTE:** The computation depends on knowing the exact denominator (200 statements or 600 pooled judgments). The authors must confirm this.

#### Point 2.3: Benchmark Selection
* **Reviewer's Critique:** Explain why Zero-Shot GPT-4o and Standard RAG were chosen.
* **Our Solution:**
  - This is a justification paragraph, not experimental data. It can be written:
    - Zero-Shot: isolates base model capability without retrieval.
    - Standard RAG: isolates the contribution of SAHI/RRF by using flat chunking + single-stream vector search.
    - Fine-tuned models: omitted because no instruction-tuning corpus for Pakistani law exists.

#### Point 2.4: Reproducibility & Data Availability
* **Reviewer's Critique:** Is the 1.2M-token corpus publicly available?
* **Our Solution:**
  - The [supporting_documentation/](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/supporting_documentation) directory contains:
    - Constitution of Pakistan.txt (451KB) ✅
    - Pakistan Panel Code.pdf (1.6MB) ✅
    - Supreme Court Rules.pdf ✅
    - Code of Criminal Procedure, 1898 ✅
    - Code of Civil Procedure, 1908 ✅
    - Limitation Act, 1908 ✅
    - Qanun-e-Shahadat, 1984 ✅
  - **⚠️ NOTE:** Verify whether any of these contain copyrighted judgment texts that cannot legally be redistributed. If so, revise the Data Availability Statement accordingly (e.g., "statutes are publicly available; anonymized judgment extracts are available upon request").

---

## Part 2: What Can Be Genuinely Computed Right Now

### Experiment 1: SAHI Parser Accuracy Evaluation
**Status:** ✅ CAN BE RUN LOCALLY — no external services needed.

The `parseConstitution()` function in [indexConstitution.js](file:///e:/Masters%20in%20Software%20Engineering%20%28MSSE%2032%29%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze-FullStack/backend/scripts/indexConstitution.js) parses the Constitution text file. We can:
1. Run the parser on the actual 451KB Constitution file.
2. Create a ground-truth set of known articles (Article numbers, Part assignments, Chapter assignments).
3. Compute precision and recall of structural element detection.

**Script to write:** `research_paper/experiments/eval_sahi_parser.js`

### Experiment 2: Chi-squared Tests & Confidence Intervals
**Status:** ✅ CAN BE COMPUTED — pure math on existing Table 2 data.

Given the hallucination counts from Table 2, we compute:
- Pearson's Chi-squared test statistic and p-value
- 95% Wilson confidence intervals for each proportion

**Script to write:** `research_paper/experiments/compute_statistics.py`

**⚠️ DEPENDS ON:** Authors confirming the exact sample size (N=200 per reviewer, or N=600 pooled).

### Experiment 3: Ablation Study & Retrieval Metrics
**Status:** ⚠️ REQUIRES LIVE SERVICES (Pinecone + MongoDB + OpenAI API).

This is the most important experiment. We need to:
1. Define a ground-truth query set with known relevant provisions.
2. Run each retrieval configuration (Dense-only, BM25-only, Hybrid, Hybrid+RRF, SAHI+Dense, SAHI+Lexical, Full Legalyze).
3. Compute Recall@k, Precision@k, MRR, nDCG from actual retrieval results.

**Script to write:** `research_paper/experiments/run_ablation_study.js`

**⚠️ REQUIREMENT:** This cannot be faked. It requires:
- The Pinecone index to be populated with the legal corpus.
- MongoDB to be accessible with judgment data.
- OpenAI API to generate query embeddings.

### Experiment 4: Fleiss' Kappa
**Status:** ❓ DEPENDS ON DATA AVAILABILITY.

If the raw reviewer annotations (per-statement, per-reviewer labels) exist, we compute Fleiss' κ. If they don't exist, we cannot report this metric and must state it as a limitation.

**Script to write (if data exists):** `research_paper/experiments/compute_fleiss_kappa.py`

---

## Part 3: Step-by-Step Implementation Plan

### Phase 1: Run Experiments That Can Be Run Now

#### Step 1.1: SAHI Parser Accuracy (Local, no external dependencies)
- Write and run `eval_sahi_parser.js` against the Constitution file.
- Compute and record precision/recall for Part, Chapter, Article detection.
- Only report the actual measured numbers.

#### Step 1.2: Statistical Tests (Local computation)
- Write and run `compute_statistics.py` with the actual Table 2 data.
- Compute Chi-squared, p-values, and 95% CIs.
- Only report the computed values.
- **⚠️ First confirm with authors:** Is the denominator 200 or 600?

### Phase 2: Run Ablation Study (Requires Live Infrastructure)

#### Step 2.1: Create Ground-Truth Query Set
- Define 50 queries with known correct legal provisions.
- Map each query to its authoritative statutory section.

#### Step 2.2: Run Each Retrieval Configuration
- Configuration 1: Dense-only (Pinecone semantic search)
- Configuration 2: BM25/Keyword-only (MongoDB text search)
- Configuration 3: Hybrid (Dense + BM25, no RRF)
- Configuration 4: Hybrid + RRF (no SAHI breadcrumbs)
- Configuration 5-7: SAHI variants
- Compute Recall@5, Recall@10, Precision@5, MRR, nDCG from actual results.

### Phase 3: Update Manuscript with Real Results
- Only after experiments are run and values are computed.
- Insert the actual computed values into the LaTeX.
- Add pseudocode/algorithm block (documentation, not experimental).
- Add benchmark justification paragraph.
- Add data availability statement.
- Soften overclaiming language.

### Phase 4: Verification
- Verify LaTeX compilation.
- Cross-check all reported numbers against experiment logs.

---

## Part 4: Integrity Checklist

| Item | Can we claim it? | Basis |
|------|-----------------|-------|
| SAHI parser accuracy | ✅ After running eval script | Measured against ground truth |
| Chi-squared tests | ✅ After computation | Mathematical calculation on Table 2 data |
| 95% Confidence intervals | ✅ After computation | Mathematical calculation on Table 2 data |
| Fleiss' Kappa | ❓ Only if raw annotations exist | Computed from reviewer labels |
| Ablation table values | ✅ Only after running ablation | Measured from live system |
| Recall@k, MRR, nDCG | ✅ Only after running ablation | Measured from live system |
| Reviewer demographics | ✅ Only if true | Stated by authors |
| Double-blind protocol | ✅ Only if actually done | Stated by authors |
| Data availability | ✅ After verification | Files checked in repository |
| Benchmark justification | ✅ Always | Argumentative, not experimental |
| SAHI pseudocode | ✅ Always | Documents existing code |
| Softened claims | ✅ Always | Text edits |
