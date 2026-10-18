# Legalyze 2.0

**A structure-aware, hybrid-retrieval, agentic international legal-intelligence
system that grounds answers in authoritative UN legal sources, models treaty
applicability and temporal status, connects relevant jurisprudence, and verifies
citations before generation.**

Legalyze 2.0 is the successor to Legalyze 1.0 (a Pakistan-specific system). It is
a **separate project from the thesis** and generalises the 1.0 architecture
(SAHI, hybrid BM25 + semantic retrieval, RRF, agentic reasoning) from a single
national jurisdiction to **heterogeneous international legal instruments**.

> Built to the fixed blueprint in `../Legalyze_2_0_Implementation_Research_Specification.pdf`.
> Scope: international law / the UN ecosystem. English. Evidence-backed legal
> **information, not legal advice.**

---

## What it does (the research contribution)

1. **SAHI 2.0** — generalised structure-aware indexing. Every provision gets a
   deterministic path *Instrument → Part/Chapter → Article → Paragraph → Annex*
   and never loses article/paragraph identity.
2. **Hybrid retrieval + RRF** — lexical BM25 + dense semantic retrieval fused by
   Reciprocal Rank Fusion (k = 60), with structural pinning and metadata filtering.
3. **Temporal + applicability reasoning** (the core new capability) — answers
   *"was State X a party to Treaty Y on date D?"* from the participation **event's
   effective date**, never from today's status, and never conflating signature,
   ratification and entry into force.
4. **Eight single-responsibility agents** orchestrated end-to-end.
5. **Citation verification** on four axes (source identity, provision identity,
   semantic support, temporal relevance) — *no evidence = no claim.*
6. **Fixed answer format** and an **evaluation harness** (6 systems, 8 ablations,
   8 metrics) over a 10-category benchmark.

---

## Architecture → code map (Spec §17)

| Layer | Spec | Module |
|-------|------|--------|
| 1. Source acquisition | official UN/ICJ sources + provenance | `legalyze2/corpus/acquire.py` |
| 2. Normalization | clean text, metadata, dates | `corpus/sahi.py` (`_norm`), `engines/temporal_engine.py` |
| 3. Legal structure | instrument/provision hierarchy, SAHI 2.0 paths | `corpus/sahi.py`, `models.py` |
| 4. Indexing | lexical + vector + metadata/status store | `store/lexical_index.py`, `store/vector_index.py`, `store/corpus_store.py` |
| 5. Retrieval | BM25 + semantic + RRF + metadata filtering | `retrieval/pipeline.py`, `retrieval/rrf.py` |
| 6. Reasoning | the exact agents | `agents/specialists.py`, `agents/orchestrator.py` |
| 7. Verification | claim/evidence/citation verification | `agents/specialists.py` → `CitationVerificationAgent` |
| 8. Answer | structured, citation-backed response | `answer.py`, `AnswerSynthesisAgent` |
| 9. Evaluation | benchmark, metrics, ablations | `eval/`, `scripts/run_eval.py` |

**The 8 agents (Spec §8):** Orchestrator · Instrument Identification ·
Applicability · Temporal Reasoning · Treaty Status · Jurisprudence ·
Citation Verification · Answer Synthesis — all in `legalyze2/agents/`.

**The 12-step retrieval order (Spec §7)** is implemented across
`retrieval/pipeline.py` (steps 1–7) and `agents/orchestrator.py` (steps 8–12).

---

## Corpus (Spec §4, P0)

Fetched from authoritative sources with full provenance (URL, retrieval
timestamp, SHA-256):

| Instrument | Source | Parsed |
|------------|--------|--------|
| Charter of the United Nations | un.org | 111 articles, 19 chapters |
| Statute of the International Court of Justice | icj-cij.org | 70 articles |
| Vienna Convention on the Law of Treaties (1969) | legal.un.org | 85 articles, 8 parts |
| ICJ jurisprudence (Nicaragua 1986; Gabčíkovo-Nagymaros 1997) | icj-cij.org | case metadata |

→ **542 structurally-indexed provisions.**

---

## Integrated into the Legalyze product ("International Law" mode)

Legalyze 2.0 is wired **behind the existing Legalyze UI** — no new page, no
restyle. In the chat workspace a header toggle switches between **Pakistan Law**
(the original 1.0 flow, untouched) and **International Law** (this engine).

| Piece | File |
|-------|------|
| Engine as a local JSON service | `Legalyze-2.0/service.py` (POST `/ask`, port 8100) |
| Backend bridge route | `backend/routes/international.js` → `/api/international` |
| Engine auto-start on backend boot | `backend/services/legalyze2Engine.js` |
| Frontend API client | `frontend/src/utils/api.js` → `internationalAPI` |
| Mode toggle + answer rendering | `frontend/src/pages/ChatInterface.jsx` (`InternationalAnswer`) |

**To run the whole product with International Law mode:**

```bash
# 1) build the 2.0 corpus + index once (if not already done)
cd Legalyze-2.0 && python scripts/build_corpus.py && python scripts/build_index.py

# 2) start the product as usual — the backend auto-starts the 2.0 engine
cd ../backend && npm start        # boots Node API + spawns python service.py on :8100
cd ../frontend && npm run dev      # http://localhost:3000
```

Then sign in, open the chat, flip the header toggle to **International Law**, and
ask e.g. *"What does Article 2(4) of the UN Charter prohibit?"* The engine can
also be started manually (`cd Legalyze-2.0 && python service.py`), and autostart
disabled with `LEGALYZE2_AUTOSTART=false`. If the engine is offline the chat
shows a clear message telling you how to start it.

---

## Run the engine standalone (CLI / eval)

```bash
cd Legalyze-2.0
pip install -r requirements.txt

python scripts/build_corpus.py     # Phase 1-3: acquire + SAHI 2.0 parse + store
python scripts/build_index.py      # Phase 4: BM25 + vector index
python scripts/ask.py "What does Article 2(4) of the UN Charter prohibit?"
python scripts/ask.py "Was State A (illustrative) a party to the Vienna Convention on 1 January 2010?"
python scripts/run_eval.py         # Phase 10-11: systems + ablations + metrics
```

### Offline-first
The system runs with **no network or API spend**: BM25 is in-house, semantic
retrieval falls back to a deterministic embedding, and agents fall back to
extractive (never-inventing) generation. When a working
`OPENAI_API_KEY` is present (read from `../backend/.env` or the environment) it
automatically uses `text-embedding-3-small` for semantic retrieval and
`gpt-4o-mini` for the agents. During this build the key was **quota-limited
(HTTP 429)**, so the demo ran fully on the offline path — the architecture is
identical; retrieval quality improves markedly with a working embedding key.

---

## Honest limitations (read before citing any numbers)

Per the spec's own rules (never invent treaty metadata; keep the benchmark fixed;
report failures honestly), the following are **scaffolding, not validated results**:

- **Treaty-status data is an illustrative seed.** `data/status/participation.json`
  uses clearly-labelled placeholder states ("State A (illustrative)" …) to exercise
  every branch of the temporal engine. Replace it with verified **UN Treaty
  Collection** records (each has a `verified` flag and `source_record`) before any
  research use. The engine correctly answers *"not established"* when data is absent.
- **The benchmark is an authored seed** (16 items, all 10 categories). The spec
  requires a **human-reviewed** benchmark; expand and verify it with legal
  reviewers before final evaluation.
- **`run_eval.py` numbers characterise the harness**, not a validated finding.
  They show the intended ablation pattern (each component contributes; the full
  system is best) but were produced on the seed benchmark with the offline
  fallback. Re-run with real data, a reviewer-graded benchmark, and a working
  model key to report research results.

---

## Data model (Spec §5)

`legalyze2/models.py`: `Instrument`, `Provision`, `StateParticipation`,
`Reservation`, `Declaration`, `Objection`, `Case`, `UNDocument` — each with
mandatory provenance. Persisted as JSON under `data/`.

## Directory layout

```
Legalyze-2.0/
  legalyze2/            core package (config, models, llm, corpus, store, retrieval, engines, agents, answer)
  data/  raw/ corpus/ status/ benchmark/ index/    fetched sources, parsed corpus, status seed, benchmark, indices
  scripts/  build_corpus.py  build_index.py  ask.py  run_eval.py
  eval/     systems.py  metrics.py
```

## Implementation status (Spec §16 phases)

Phases 1–8 (corpus → schema → SAHI 2.0 → retrieval → status → temporal → agents →
citation verification): **implemented and runnable.**
Phase 9 (benchmark): **seed authored; needs reviewer expansion.**
Phase 10–11 (experiments/analysis): **harness implemented; run with real data/key.**
Phase 12 (paper): out of scope for the code build.
