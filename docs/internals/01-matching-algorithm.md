# Matching Algorithm — Deep Dive

Core files:
- `backend/app/services/matching/matcher.py` — scoring, banding, explanations
- `backend/app/services/matching/embeddings/gemini.py` — embedding client
- `backend/app/config/settings.py` — thresholds, top-k, (partially unused) weights
- `backend/app/db/models.py` — `vector(768)` pgvector columns

The pipeline is a **bi-encoder semantic ranker with structured boosts and band-based presentation**. It runs in three stages: embed → score → band.

---

## 1. Embedding Stage (offline, at write time)

**Model:** `gemini-embedding-001`, requested at `output_dimensionality=768`.
The native model is 3072-dim; Gemini applies **Matryoshka Representation Learning (MRL)** truncation, so the first 768 dims retain most of the semantic signal. 768 was chosen to match the `vector(768)` pgvector column (a 3072-dim write crashes with a dimension mismatch — this happened; see git history).

**Task types matter:** documents are embedded with `task_type="RETRIEVAL_DOCUMENT"`, queries with `"RETRIEVAL_QUERY"`. Gemini optimizes the two spaces to be asymmetric-retrieval-compatible (like DPR/GTR-style dual encoders).

**What text is embedded** (`_build_seeker_text` / `_build_job_text` in `matcher.py`):

```
Seeker:  {headline}
         Keahlian: {skill1, skill2, ...}
         Pengalaman: {title @ company | ...}
         Pendidikan: {degree major @ institution | ...}
         Catatan: {resume_text}

Job:     {title}
         {description}
         Skill wajib: {required_skills}
         Nice to have: {nice_to_have_skills}
         Tanggung jawab: {responsibilities}
```

Embeddings are computed when a profile/job is created or updated (`embed_seeker` / `embed_job`) and stored on the row. Job re-embedding triggers on `description` or `required_skills` changes (`routers/employer.py`).

## 2. Scoring Stage (online, per request)

Both directions share the same shape (`match_jobs_for_seeker` ~line 236, `match_seekers_for_job` ~line 335):

```python
base_score = 0.60 * max(cosine, 0.0) + 0.40 * skill_overlap
score      = base_score + loc_boost + sal_boost + exp_boost
```

**Components:**

| Component | Definition | Notes |
|---|---|---|
| `cosine` | cosine similarity of the two 768-dim vectors, floored at 0 | computed in pure Python (`cosine()` helper), **in memory over all rows** — pgvector is used for storage, not ANN search |
| `skill_overlap` | `|seeker_skills ∩ required_skills| / |required_skills|` | **case-insensitive exact string match**; skill `level`/`years` are ignored |
| `loc_boost` | `+0.15` | only when a location filter is active AND (job region == filter OR filter ∈ seeker preferred regions) |
| `sal_boost` | `+0.10` | only when salary filter active AND `job.salary_max >= filter.salary_min` (seeker direction only) |
| `exp_boost` | `+0.10` | seeker direction: `job.experience_years_min <= filter.experience_min`; employer direction: seeker years ≥ job minimum |

**Boosts are conditional on filters** — with no filters set, ranking is purely `0.60·cos + 0.40·overlap`. Max possible score with all boosts: 1.35 (uncalibrated; see research notes).

> ⚠️ **Config drift, worth knowing:** `settings.py` defines `matching_cosine_weight=0.50, matching_skill_weight=0.30, matching_region_weight=0.10, matching_salary_weight=0.05, matching_experience_weight=0.05`, and `matcher.py` has a `_weights()` normalizer — but **the live scoring paths do not use them**; the `0.60/0.40/+0.15/+0.10/+0.10` constants are hardcoded. Changing the settings values does nothing today. Unify before tuning.

## 3. Banding & Presentation Stage

Raw scores are mapped to **confidence bands** (`_band_label`, single source of truth for both sides):

| Band | Condition | Seeker-facing framing |
|---|---|---|
| `strong` | `score ≥ 0.65` (`band_strong_threshold`) | "Skill kamu nyambung kuat…" |
| `possible` | `score ≥ 0.45` (`band_possible_threshold`) | worth a look, some gaps |
| `stretch` | below | growth option |

Then a deliberate anti-false-precision step: **results are shuffled within each band** using a stable seed (job_id for seeker view, seeker_id for employer view). Order is deterministic across requests but tiny score deltas (0.612 vs 0.608) never imply a ranking the model can't actually support. The employer card **never displays the numeric score** — band only.

**Explanations:**
- Seeker side: template-based Bahasa Indonesia (`_seeker_summary`) driven by band + matched/missing skill lists. No LLM call — zero cost, zero hallucination.
- Employer side: evidence summary (`_candidate_summary`, matched/missing skills) plus an optional ≤15-word LLM evaluation via `gemini-3.1-flash-lite` when an API key is present.

## 4. Serving Paths

| Entry point | Flow |
|---|---|
| `POST /api/v1/agent/invoke` | fetch all jobs (repo cache 300 s) → rank in memory → **token gate:** if `max_score < 0.10`, skip the LLM entirely and return a cheap templated reply |
| `POST /api/v1/employer/jobs/{id}/candidates` | rank all seekers against one job |
| `POST /api/v1/employer/jobs/estimate` | no-LLM heuristic (skill overlap + location) to preview candidate-pool size while composing a job |

`matching_top_k = 10` limits returned results.

---

# Extra Insights

1. **It's a hybrid ranker, not pure vector search.** The 40% exact-skill term anchors the semantic score against embedding noise — a job needing "Figma, User Research" won't rank a backend dev highly just because both texts "sound tech." Conversely the 60% semantic term rescues matches where skill vocabularies differ.

2. **The in-memory scan is O(N) per request.** At 21 jobs / 20 seekers this is microseconds. At 100k jobs it's a real problem: every request embeds the query (≈100 ms Gemini latency) then scans every row in Python. The pgvector column already exists — the natural evolution is `ORDER BY embedding <=> query LIMIT K` with an HNSW index, then rescoring the top-K with the full formula.

3. **Boost cliffs.** `salary_max ≥ filter` is binary: a job 1 rupiah above threshold gets +0.10, one 1 rupiah below gets nothing. Same for experience. Smooth utility functions (e.g., sigmoid over salary gap) would remove rank instability near thresholds.

4. **Skill matching is string equality.** "PostgreSQL" ≠ "Postgres", "JavaScript" ≠ "JS", "Bahasa Inggris" ≠ "English". Every miss both lowers `skill_overlap` and pollutes the "missing skills" explanation. This is likely the single highest-ROI fix (see research §2).

5. **Bands are honest UX.** Shuffle-within-band + hidden numeric scores is a genuinely good pattern — it communicates model uncertainty instead of manufacturing precision, and it removes position bias *within* a band from feedback data, which will matter if you ever train on clicks (research §4).

6. **Scores are not calibrated.** 0.65 doesn't mean "65% chance of a good hire" — thresholds were picked by inspection. Fine for presentation bands; not fine if scores ever gate automated decisions.

---

# Suggested Research Directions

Ordered roughly by ROI-to-effort.

### 1. Two-stage retrieval: ANN + rerank
Use pgvector HNSW (`CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)`) to retrieve top-200, then apply the full hybrid formula only on that set. Standard retrieve-then-rerank; removes the O(N) scan. *Read: pgvector docs on HNSW recall/ef_search tradeoffs.*

### 2. Skill normalization via taxonomy
Map free-text skills to a canonical taxonomy before overlap: **ESCO** (EU, has Indonesian translations), **O*NET**, or Kemnaker's KBJI occupation codes (already stored on jobs, currently unused in scoring!). Cheap version: curated synonym dictionary + lowercase/lemmatize. Better: embed skill names themselves and match with a similarity threshold (≥0.85) instead of equality. Also weight skills by `level`/`years` (currently ignored) — a "beginner Python, 0.5 yr" matching a senior requirement shouldn't count as full overlap.

### 3. Cross-encoder reranking
Bi-encoders compress each side independently — they can't model interactions like "5 years Go but the job wants Go *for payments infra*." A cross-encoder (reads both texts jointly) on the top-20 fixes this. Options: multilingual **BGE-reranker-v2-m3**, or LLM-as-reranker (RankGPT-style listwise prompting with Gemini Flash — zero training, some latency/cost). *Read: Nogueira & Cho, "Passage Re-ranking with BERT" (2019); Sun et al., "RankGPT" (2023).*

### 4. Learning to Rank from your own events
`events.py` already logs `job_viewed`, `apply_clicked`, `band_clicked` with band + variant. Once volume exists: train a gradient-boosted LTR model (**LambdaMART** via XGBoost/LightGBM) on features you already compute (cosine, overlap, region match, salary gap, experience gap) with clicks/applies as labels. Correct for **position bias** with inverse-propensity weighting — your within-band shuffle is an unusual advantage here since it randomizes exposure within bands, giving you nearly unbiased click data per band. *Read: Joachims et al., "Unbiased Learning-to-Rank with Biased Feedback" (2017).*

### 5. Two-sided (reciprocal) matching
Job platforms are two-sided markets: a "strong" match a seeker will never accept (salary 3× below expectation) wastes both sides' time, and popular jobs get congested. Score `P(seeker applies) × P(employer responds)` instead of one-directional relevance, and add exposure caps per job. *Read: Palomares et al., "Reciprocal Recommender Systems" survey (2021); LinkedIn's economic-graph matching papers.*

### 6. Embedding fine-tuning / domain adaptation
Gemini embeddings are general-purpose. With a few thousand apply/hire pairs you can fine-tune an open multilingual model (e.g., **bge-m3**, **multilingual-e5**) with contrastive loss, mining **hard negatives** from "viewed but not applied." Self-hosting also removes per-call embedding costs and latency. Benchmark against Gemini on a held-out set first — don't assume fine-tuned-small beats frozen-large.

### 7. Score calibration
Map raw scores to outcome probabilities with **Platt scaling / isotonic regression** against downstream funnel data (apply → interview). Then bands become "≥60% historical interview rate" instead of magic numbers, and thresholds self-justify. *Read: Niculescu-Mizil & Caruana (2005).*

### 8. Fairness auditing
Before scaling: measure **exposure parity** across gender/age/region groups within each band; scan Indonesian job descriptions for gendered language (the "maks 25 tahun, berpenampilan menarik" pattern is endemic in the local market and often unlawful under Indonesian labor regs); consider counterfactual tests (swap names/gender markers in CV text, check score deltas). UU PDP 2022 also constrains which personal features may legally influence scoring. *Read: Singh & Joachims, "Fairness of Exposure in Rankings" (2018).*

### 9. Cold start & exploration
New jobs/seekers have no behavioral signal (content-based scoring covers this reasonably). If LTR (§4) is adopted, add an exploration policy — **Thompson sampling** over near-band-boundary items — so the feedback loop doesn't ossify early winners.

### 10. Matryoshka dimension study
768 was forced by the column type, not measured. Run recall@K on a labeled set at 256 / 512 / 768 / 1536 / 3072 dims. If 3072 wins materially, migrate the column (or store `halfvec(3072)` — half-precision halves storage and speeds HNSW).

### 11. Constraint modeling
Replace binary boosts with smooth utilities: `sal_fit = σ((salary_max − expectation_min)/σ_salary)`, experience as a saturating curve (2 yrs over minimum ≈ no extra credit, 2 yrs under ≈ steep penalty). Kills the cliff effects in §Insights-3. And actually wire `settings.matching_*_weight` into the formula so tuning doesn't require code edits.

### Evaluation harness (prerequisite for most of the above)
Build a golden set (~200 seeker-job pairs, human-labeled strong/possible/stretch — you have Indonesian-market-realistic seed data already). Track **nDCG@10** and **Recall@50** offline on every change; run online **interleaving** or A/B through the existing `experiments.py` framework (deterministic MD5 assignment is already in place). Guard metric: apply-rate on `stretch` band (if it rises toward `strong`'s, bands have lost meaning).
