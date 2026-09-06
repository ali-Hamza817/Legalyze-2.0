# Legalyze — Research Paper

**Legalyze: An Open-Source Structure-Aware Agentic RAG Platform for High-Precision Legal Intelligence**

- **Authors:** Ali Hamza\* (first / corresponding), Maaz Bin Rizwan, Maemoona Kayani, Shafa-at Ali Sheikh
- **Venue:** *Expert Systems* — Wiley
- **Year:** 2026
- **Template:** `wiley-article` class (Overleaf / Wiley), Vancouver numerical references (`num-refs`)

This folder holds the **final, published version** of the paper and its supporting
material. Every intermediate revision, submission zip, and reviewer-round artifact
lives only in the original `Legalyze-FullStack` archive folder, not here.

## Layout

| Path | Contents |
|------|----------|
| `manuscript/main.tex` | Final manuscript source. Self-contained: it embeds the `wiley-article.cls` via `filecontents*` and uses an inline `thebibliography` (the separate `references.bib` is kept for reference only — it is **not** `\input` by `main.tex`). |
| `manuscript/wiley-article.cls` | Stand-alone copy of the journal class. |
| `manuscript/references.bib` | Bibliography database from an earlier draft; retained for provenance. |
| `manuscript/Legalyze_Published_Manuscript.pdf` | Compiled final PDF (minor-revision / accepted version). |
| `manuscript/*.png` | The 8 figures referenced by `main.tex`, kept beside it so the source compiles unmodified (filenames — including trailing spaces — match the `\includegraphics` calls). |
| `tables/` | LaTeX source (`table_1.tex` … `table_5.tex`) and compiled PDFs for the five tables. |
| `experiments/` | Reproducibility scripts and result files for the SAHI parser evaluation, enhanced-parser evaluation, retrieval statistics, and Pinecone index stats. |
| `supplementary/` | Blinded labeling sheet, merged human labels, raw model outputs, SAHI parser ground truth, statistical analysis report, hallucination-rate figure, and a corpus sample. |
| `reviews/` | Response sheet to reviewers (PDF + DOCX), letter to the editor on table integration, and the working rebuttal notes (`rebuttal_responses.md`, `rebuttal_analysis_and_plan.md`). |
| `submission/` | Journal submission package: cover letter, title page, highlights, declaration of interest. |
| `publication/` | Publication announcement and two-column first-page proof (PDF + PNG). |

## Building the PDF

`main.tex` compiles as-is with a modern TeX distribution (it writes out its own
`.cls`, and the figures sit next to it):

```bash
cd manuscript
latexmk -pdf main.tex        # or: pdflatex main.tex  (run twice for refs)
```
