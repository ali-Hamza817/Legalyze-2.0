# FACTS.md — Legalyze Project: Single Source of Truth

> **Read this file first.** It is a complete, self-contained briefing on the Legalyze project, the
> Q1 survey paper, the proposed research direction, and all working conventions. If you are an AI
> assistant (Claude) opening a freshly cloned copy of this repository on the author's cluster, read
> this file in full before doing anything else; it tells you what exists, what the rules are, and
> what to do next. Everything here reflects the state as of **2026-10-23**.

---

## 0. TL;DR — what to do next

The author (Ali Hamza) wants to continue the research direction that **extends the Legalyze platform
by transferring the methodology of Ren et al. (2026) to Pakistani law and fusing it with Legalyze's
structure-aware retrieval**, evaluated **fully automatically (no human annotation)**, on the author's
**own compute cluster (512 GB RAM, no cloud GPU rental)**. The detailed plan is in
`research/research_direction.tex` (compiled: `research/research_direction.pdf`). The next concrete
engineering step is to build the automated synthetic-data + fine-tuning + fully-automatic-evaluation
pipeline described in Sections 6–8 below.

---

## 1. Who and what

- **Author:** Ali Hamza, MS Software Engineering (MSSE), Military College of Signals (MCS),
  National University of Sciences and Technology (NUST), Islamabad, Pakistan.
  Email for authorship: `ahamza.msse25mcs@student.nust.edu.pk`.
- **Legalyze:** an open-source, structure-aware, agentic RAG platform for **Pakistani** legal
  intelligence. The published paper is **Hamza et al. (2026), "Legalyze: An Open-Source
  Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence", Expert Systems**
  (Wiley), DOI `10.1111/exsy.70415`. The PDF is in this repo (see Section 3).
- **Legalyze 2.0:** the next-version system being built in this repository (backend + frontend +
  Python engine). The 1.0 React UI must be preserved; 2.0 is integrated as a new mode behind it.
- **Base paper for the new research direction:** **Ren et al. (2026), "Automated Data Synthesis and
  Retrieval-Augmented Generation for Legal Large Language Models", Knowledge-Based Systems**,
  DOI `10.1016/j.knosys.2026.116267`. PDF: `Ren et al.pdf` at repo root.

---

## 2. Repository map (key locations)

```
Legalyze 2.0/                              <- git repo root (remote: github.com/ali-Hamza817/Legalyze-2.0)
├── FACTS.md                               <- THIS FILE
├── Ren et al.pdf                          <- BASE PAPER (Ren et al. 2026), 12 pages
├── EXSY70415.pdf                          <- Published Legalyze paper (Hamza et al. 2026)
├── Final Accepted Research Paper/         <- Legalyze paper (accepted copy)
├── paper/                                 <- Legalyze paper assets (manuscript, reviews, submission, tables, experiments)
│   └── manuscript/Legalyze_Published_Manuscript.pdf
├── Legal Corpus/                          <- Pakistani statutes (Constitution, PPC, CrPC, QSO) as PDFs
├── Legalyze_2_0_Implementation_Research_Specification.pdf
├── backend/                               <- Node/Express backend (port 5000). SECRETS in backend/.env are GITIGNORED.
├── frontend/                              <- React/Vite frontend (port 3000)
├── Legalyze-2.0/ (engine)                 <- Python 2.0 engine (SAHI ingestion etc.)
└── research/                              <- Legalyze research-direction plan (the ACTIVE work)
    ├── research_direction.tex             <- THE RESEARCH PLAN (Ren -> Legalyze) + automatic-eval design
    ├── research_direction.pdf             <- compiled (6 pages)
    └── references.bib                     <- 40 VERIFIED references (citation source for the plan)
```

**The Q1 SURVEY PAPER is a SEPARATE publication and is NOT part of this repository.** The author
maintains it elsewhere; it is gitignored here. Only the Legalyze research-direction plan lives in this
repo, in `research/`.

**Secrets:** `backend/.env`, `frontend/.env` are gitignored and are NOT in the repo. They hold the
MongoDB Atlas URI, OpenAI key, Pinecone key, AWS, and JWT secrets. Never commit them. If the cluster
needs them, the author provides them out of band.

---

## 3. The published Legalyze system (Hamza et al. 2026)

Legalyze is the **structure-centric** reference system. Its core ideas:

- **SAHI — Structure-Aware Hierarchical Indexing.** Each statute is parsed with its hierarchy intact.
  Every chunk carries a **breadcrumb** recording its exact place in the law (e.g.
  `Constitution -> Part II -> Chapter 1 -> Article 10A`) plus a short **semantic anchor** describing
  the provision. This preserves provenance so every retrieved passage arrives with its address and can
  be cited precisely.
- **Dual-stream hybrid retrieval:** a **lexical** stream (BM25, MongoDB) that catches exact statutory
  references and a **semantic** stream (dense vectors, Pinecone) that catches meaning, combined by
  **Reciprocal Rank Fusion (RRF, k=60)** (Cormack et al. 2009).
- **Agentic, citation-grounded responses.**
- **Corpus already ingested (from earlier work):** ~1,488 statute provisions (Constitution 266, PPC
  577, CrPC 479, QSO 166) + ~436 judgments (258 full judgments downloaded). Priority order for
  indexing: Constitution, then PPC, then CrPC, then QSO, then Supreme Court judgments
  (constitutional first).
- **Judgment corpus rule:** use the **official SCP quarterly Case Law Updates** (public domain). Do
  **NOT** scrape `pakistancaselaw.com` — its robots.txt prohibits bulk/dataset scraping (cites PECA
  2016).

Stack: Node/Express backend (:5000), React/Vite frontend (:3000), MongoDB Atlas, Pinecone (index
`legal-documents`, 1024-dim, `text-embedding-3-small`), Python 2.0 engine (:8100). Auth uses JWT
access (2h) + refresh (30d) tokens with token-version revocation; security hardening includes helmet,
express-mongo-sanitize, hpp, rate limiting, AES-256-GCM encryption, and a CORS whitelist.

---

## 4. The Q1 survey paper (SEPARATE publication, NOT in this repo)

The survey described below is maintained by the author **outside this repository** and is gitignored
here. It is kept in FACTS.md only as background; its Legalyze offshoot (the research direction) lives
in `research/`.

- **Title:** "Legal AI: From Case-Based Reasoning to Reliable, Structure-Aware Retrieval-Augmented
  Generation." Single author: Ali Hamza.
- **Status:** COMPLETE. `main.pdf` is **31 pages**, two-column, with **19 tables + 2 figures + 1
  equation**, **0 undefined references, 0 overfull lines, no em-dashes**. The abstract is still a
  placeholder from an earlier draft; **a new abstract is still owed by the author.**
- **12-section structure:** (1) Introduction; (2) Literature Search and Survey Methodology;
  (3) Foundations of Legal AI (1991–2016); (4) Legal Language Models and Benchmarks (2017–2023);
  (5) The Emergence of RAG for Law (2020–2026); (6) Retrieval Architectures for Legal Intelligence;
  (7) Reliability, Hallucination, and Legal Citation Verification; (8) Comparative Analysis of
  Contemporary Legal AI Systems; (9) Jurisdiction, Document Structure, and Multilingual Legal AI;
  (10) Open Challenges and Future Research Directions; (11) Conclusion; (12) References.
- **How the survey was built:** the author pasted polished prose section by section; the assistant
  integrated it **verbatim** (not rewritten), merged duplicate section drafts without duplication,
  removed copy-paste artifacts, drew conceptual pipelines as TikZ figures, and auto-numbered tables
  via `\ref{}`.
- **Build (author's local copy only):** `latexmk -pdf main.tex` inside the author's local survey
  folder. Requires a TeX distribution with `natbib`, `tikz`, `tabularx`, `booktabs`, `titlesec`,
  `hyperref`. The research-direction template in `research/` builds the same way:
  `cd research && latexmk -pdf research_direction.tex`.

---

## 5. CRITICAL working rules (do not violate)

1. **NO EM-DASHES, ever, in any paper.** The author strongly dislikes them. Use a colon (before a
   list/explanation), a comma (short aside), or parentheses (parenthetical). In LaTeX this means
   **never write `---`**. En-dashes (`--`) for numeric ranges like `1991--2026` are fine. Before any
   commit of LaTeX, run `grep -rn -- "---" sections/ figures/ *.tex` and confirm it is empty.
2. **Simple, connected English.** Plain words, short clear sentences that flow. The author judges
   writing quality harshly and prefers to supply prose himself.
3. **Integrate only the author's content, verbatim.** Do not rewrite his pasted text. When a section
   arrives in two draft versions, **merge both without duplication** (his explicit instruction). Drop
   obvious artifacts: web source chips ("ACL Anthology", "ScienceDirect", "Worked for 31s"),
   author-facing meta-notes ("Editorial checks", "Important checks before submission", "References
   cited in Sections X"), and orphan truncation fragments. Keep his "Methodological note" statements.
4. **No fake citations.** Every reference must be verified against its original source (Crossref API
   `api.crossref.org/works/{DOI}`, or arXiv) before being added to `references.bib`. This rule already
   caught several bad rows in the seed spreadsheet. `references.bib` currently holds **40 verified
   entries**; do not add an unverified one.
5. **Formatting:** two-column, full-width tables (`table*` + `tabularx` with ragged-right `X`
   columns), full-width figures (`figure*` / `\resizebox`), `natbib` + `plainnat` author-year
   citations, acronyms brace-protected in bib titles (e.g. `{LEGAL-BERT}`, `{RAG}`) so `plainnat`
   does not lowercase them.
6. **Never change the Legalyze 1.0 React UI.** Integrate 2.0 as a new mode behind it.

---

## 6. The research direction (the active task): Ren et al. → Pakistani Legalyze

**Framing (the headline contribution).** This is not a re-run of Ren et al. on Pakistan. It is the
**fusion** of two philosophies the survey itself contrasts: Ren et al. is **model- and data-centric**
(Chinese law); Legalyze is **structure-centric** (Pakistani law). The proposal transfers Ren's
methodology to a low-resource jurisdiction **and** runs it over Legalyze's structure-aware index, to
test whether a well-adapted generator over a structure-aware index beats either philosophy alone.

**What Ren et al. (2026) does (the base methodology):**
1. Automated synthetic legal question–answer generation from legal texts.
2. Quality curation of that synthetic data via an **LLM-as-judge + an enhanced Elo-ranking** filter.
3. **Fine-tuning the retriever and the generator** on the curated data.
4. RAG inference, evaluated on **LawBench** (Chinese).

**Enhanced research questions (RQ-A … RQ-E):**
- **RQ-A** Can an LLM, grounded in SAHI-retrieved Pakistani provisions/judgments, produce legally
  faithful synthetic QA usable for fine-tuning in a low-resource setting?
- **RQ-B** Does LLM-judge + Elo curation of synthetic data beat unfiltered synthetic data downstream?
- **RQ-C** Fine-tune retriever only vs generator only vs both — which is best for citation precision
  and legal correctness?
- **RQ-D** (headline) Does **SAHI + synthetic-data fine-tuning** beat (i) SAHI alone and (ii) a
  Ren-style fine-tuned pipeline over **flat** chunks?
- **RQ-E** How do gains differ across **English / Urdu / Roman Urdu**?

**Component transfer (what to build), with the key control at each step:**
| Ren component | Pakistani-Legalyze adaptation | Control |
|---|---|---|
| Synthetic QA generation | Prompt an LLM with SAHI-retrieved provisions (Constitution, PPC, CrPC, QSO) + judgments; emit question, answer, and the breadcrumb as the gold citation | Ground every answer in a retrieved passage; reject ungrounded items |
| LLM-judge + Elo curation | Judge on legal correctness + citation support (not fluency); auto-verify the cited provision against SAHI ground truth; Elo-rank | Use a different judge model + a deterministic citation-resolution check |
| Fine-tune retriever | Parameter-efficient contrastive fine-tune of the dense embedder on (query, gold-passage) pairs; keep BM25 + RRF | Retriever-first = cheapest change, largest citation gain |
| Fine-tune generator | Light QLoRA on a 7–8B open model; keep evidence external via SAHI | Measure hallucination before/after fine-tuning |
| Benchmark | Build a held-out, auto-labelled Pakistani QA set ("PakLawBench") with statute-retrieval, citation, and application tasks, split by language | No public analogue exists; the benchmark is itself a contribution |

**Baseline ladder (each row isolates one idea):**
- **B1** Base LLM, no retrieval.
- **B2** Vanilla RAG (flat chunks, off-the-shelf retriever).
- **B3** Ren-style: flat chunks + synthetic-data fine-tuned retriever/generator.
- **B4** Legalyze SAHI (structure-aware, no fine-tuning).
- **B5** PROPOSED: SAHI + curated synthetic-data fine-tuning.

**Metric families (reported separately, never collapsed):** retrieval (Recall@k, nDCG, MRR, passage
precision); answer (legal correctness, citation precision/recall, citation support/entailment,
hallucination/unsupported-claim rate); failure attribution (retrieval miss vs reasoning error);
multilingual (all metrics per language); operational (latency, cost). Empty result tables **T1–T5**
are in `research_direction.tex` ready to fill. **Report measured values only; never fabricate numbers.**

---

## 7. Fully automatic evaluation — NO human annotation (the author's firm requirement)

The author does not want a human-annotation stage. This is fully supported, and is actually **more
faithful** to Ren et al. (whose own evaluation uses an LLM-judge + Elo, not a human panel).

**Why it works:** because the corpus is structure-aware, the **gold passage and gold citation for
every synthetic item are known by construction** from the breadcrumb that generated it. So retrieval
and citation metrics need no labels at all. Build the held-out eval set the same way as the training
data and the ground truth is attached automatically.

**Automatic source of ground truth for each metric:**
| Metric | Automatic method |
|---|---|
| Retrieval (Recall@k, nDCG, MRR) | Gold passage known from the generating provision; pure code |
| Citation existence / resolution | Deterministic lookup in the indexed corpus |
| Citation precision / recall | Compare system's cited passage with the known gold passage |
| Citation support (entailment) | NLI model or LLM-as-judge |
| Legal correctness | LLM-as-judge vs the known gold answer (as Ren does) |
| Hallucination / unsupported-claim rate | Unresolved citation = fabricated; claim not entailed by its citation = unsupported |
| Multilingual consistency | Metamorphic test: same question in EN/UR/Roman-UR should retrieve the same provision |

**Optional (can be skipped):** validate the LLM-judge on ~50 items against one reviewer and report
agreement (Cohen's κ). A few hours, not hundreds. If skipped, report the evaluation as fully automatic.

**Honest framing to put in the paper (one sentence):** "Legal correctness is assessed automatically by
a held-out LLM-judge (optionally validated on a small expert sample); large-scale expert evaluation is
left to future work." This is a disclosed limitation, not a flaw.

This design is written up as a section in `research_direction.tex` (subsection "Fully automatic
evaluation without human annotation", Table: automatic sources of ground truth).

---

## 8. Compute plan — the author's OWN cluster (no rental)

- **Hardware:** the author runs everything on his **own cluster (>512 GB RAM)**. No cloud GPU rental.
  Monetary compute cost is therefore effectively zero; plan around local resources.
- **Fine-tuning:** parameter-efficient (QLoRA/LoRA) on a 7–8B open model (e.g. Llama-3.1-8B,
  Qwen2.5-7B) for the generator; contrastive fine-tune of a small multilingual bi-encoder
  (e5 / bge / multilingual-e5) for the retriever. Both are light; large RAM helps data pipelines and
  CPU-side indexing. If the cluster has GPUs, use them; otherwise QLoRA of a 7–8B model is still
  feasible but slower.
- **Synthetic generation + judging (the only possible paid part):** use a low-cost API model under the
  **Batch API** (50% cost). Current Anthropic pricing (verified 2026-10): **Claude Haiku 5.5 =
  $0.10/$0.50 per 1M input/output tokens** (cheapest), Sonnet 5.5 = $2/$10, Opus 5.5 = $4/$20.
  Generating ~40k synthetic items with Haiku + Batch is on the order of **$7–15**. The author can also
  run a **local** open model for generation/judging to make this $0.
- **Retriever-first strategy:** fine-tune the embedder before the generator; it is the cheapest change
  with the largest expected citation-precision gain, and may be sufficient on its own.
- **Infra already in place:** Pinecone (`legal-documents` index) and MongoDB Atlas; tens of thousands
  of vectors fit comfortably.

---

## 9. Verified references (full list in `research/references.bib`)

The 40 verified bib keys include, among others: `ashley1991`, `ashley1992`, `chalkidis2017`,
`chalkidis2020`, `chalkidis2022`, `guha2023`, `zheng2021`, `rabelo2022`, `goebel2023/2024/2026`,
`sovrano2020`, `zhu2022`, `lewis2020`, `sansone2022`, `feng2024`, `yang2026`, `premasiri2025`,
`wiggers2024`, `benedetto2025`, `buffa2025` (JusBuild), `ren2026` (BASE PAPER),
`zhang2025`, `dahl2024`, `magesh2025`, `silva2026`, `afane2026`, `kelsall2025`, `chi2026`, `zhao2026`,
`dugac2025`, `tritto2025`, `kim2025`, `le2026`, `italiani2025`, `butler2026`, `pipitone2024`
(LegalBench-RAG), `cormack2009` (RRF), `ref312025` (Ali et al., the other Pakistani RAG framework),
`hamza2026` (LEGALYZE, the author's own paper). Full title/author/DOI for each is in `research/references.bib`.

**Two base papers on disk:**
- `Ren et al.pdf` (repo root) = `ren2026`, the base methodology.
- `EXSY70415.pdf` and `paper/manuscript/Legalyze_Published_Manuscript.pdf` = `hamza2026`, Legalyze.

---

## 10. How to continue (for a fresh Claude on the cluster)

1. Read this `FACTS.md`, then skim `research/research_direction.pdf` (the plan) and
   `Ren et al.pdf` (the base method).
2. Confirm the environment: TeX distribution for the paper; Python + a fine-tuning stack
   (transformers/peft/sentence-transformers) for the pipeline; the ingested corpus (SAHI) and the
   Pinecone/MongoDB credentials (author supplies `.env`, which is gitignored).
3. Build, in order: (a) the synthetic-QA generator grounded in SAHI breadcrumbs; (b) the LLM-judge +
   Elo curation; (c) retriever fine-tuning; (d) generator QLoRA; (e) the **fully automatic** evaluation
   harness (Section 7) and the B1–B5 baselines; then fill tables T1–T5 in `research_direction.tex`.
4. Keep every working rule in Section 5 (no em-dashes; verify citations; faithful integration).
5. The author still owes a new **abstract** for the survey.

---

## 11. What this conversation produced (chronological summary)

1. Built a Q1 legal-AI survey from a verified-literature spreadsheet, enforcing the no-fake-citation
   rule (Crossref/arXiv verification caught several bad rows).
2. Added two TikZ figures (evolution timeline; a three-way Buffa/Ren/Hamza pipeline comparison) and a
   three-system comparison, then fixed reference formatting (leaked `<scp>` tags, lowercased acronyms,
   an "Unknown" author resolved to Ali et al.).
3. On request, removed ALL em-dashes, converted the paper to two-column, and made figures and tables
   full-width.
4. The author then supplied a rewritten paper as a Word doc and, later, section-by-section pasted
   content under a new 12-section structure and new title; the assistant rebuilt the paper verbatim,
   merging duplicate Section 2 / Section 4 / Section 8 / Section 10 drafts without duplication, and
   drew conceptual pipelines (retrieval architecture; multilingual architecture) as TikZ figures. Two
   new references (Cormack 2009 RRF; Pipitone & Houir Alami 2024 LegalBench-RAG) were verified and
   added. Final survey: 31 pages, clean.
5. Designed the research direction (Ren et al. → Pakistani Legalyze) and wrote
   `research_direction.tex` (a standalone compiled template with enhanced RQs, methodology transfer,
   a baseline ladder, separated metrics, empty result tables T1–T5, and hypotheses).
6. Produced a compute-cost estimate, then, per the author's firm preference, redesigned the
   evaluation to be **fully automatic with no human annotation** (Section 7) and noted the work runs
   on the author's **own 512 GB cluster** (no rental).
7. Pushed everything to GitHub with this `FACTS.md` as the handoff document.

---

*End of FACTS.md. If anything here conflicts with a later explicit instruction from Ali Hamza, his
instruction wins; then update this file.*
