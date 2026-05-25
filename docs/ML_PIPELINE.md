# KerjaCerdas ML Pipeline Documentation

> **ANTIGRAVITY PROTOCOL §5** — Full ML Pipeline Reference
> Referenced by: `src/ml/pipeline/*.py`, `config/ml_config.yaml`

## Pipeline Overview

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  01_ingest   │──▶│02_preprocess│──▶│03_feature   │──▶│  04_train   │
│   BPS, API   │   │  Normalize  │   │  eng        │   │  IndoBERT   │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                              │
                  ┌─────────────┐   ┌─────────────┐          │
                  │  06_deploy   │◀──│05_evaluate  │◀─────────┘
                  │  ONNX+API   │   │  nDCG ≥ 0.82│
                  └─────────────┘   └─────────────┘
```

## Phase 1: Data Ingestion (`01_ingest.py`)
- **Sources:** BPS Labor Statistics Open Data, JobStreet API, LinkedIn Skills Taxonomy
- **Output format:** Parquet (columnar, compressed)
- **Files produced:** `raw/jobs_{date}.parquet`, `raw/seekers_{date}.parquet`
- **Schema:** job_id, title, company, region_code, skills[], salary_range, kbji_code

## Phase 2: Preprocessing (`02_preprocess.py`)
- Normalize Indonesian text (lowercase, strip HTML/tags)
- Handle multilingual terms: Bahasa Indonesia + Javanese/Sundanese
- Map job titles → BPS KBJI occupation codes
- Remove PII from seeker profiles (GDPR-compliant)
- **Output:** `processed/jobs_clean.parquet`

## Phase 3: Feature Engineering (`03_feature_eng.py`)
- **Text features:** TF-IDF (sparse) + IndoBERT embeddings (768-dim dense)
- **Structured features:** salary_band, region_code, experience_years
- **Graph features:** Skill co-occurrence network centrality scores
- **Regional features:** Labor demand index per kabupaten/kota
- **Output:** `features/feature_matrix.npz` + `feature_store/`

## Phase 4: Model Training (`04_train.py`)
- **Base:** `indobert-base-uncased` fine-tuned on Indonesian job descriptions
- **Bi-Encoder:** Dual tower — job embedding ↔ seeker embedding → cosine similarity
- **Cross-Encoder:** Reranks top-50 candidates for precision
- **Tracking:** All experiments logged (RULE-03)
- **Seeds:** `random.seed(42)`, `torch.manual_seed(42)`, `numpy.random.seed(42)`
- **Output:** `models/bert_matcher_v{version}.pt`

## Phase 5: Evaluation (`05_evaluate.py`)
- **Metrics:** Precision@5, Recall@10, nDCG@10, MRR
- **Target:** nDCG@10 ≥ 0.82
- **Fairness audit:** Match rate by region (Java vs outer islands), gender, education
- **Output:** `reports/eval_report_{date}.json`

## Phase 6: Deployment (`06_deploy.py`)
- Export trained model to ONNX for faster inference
- Serve via FastAPI (integrated with `src/api/main.py`)
- A/B test: 10% traffic routed to new model version
- Monitor: latency, distribution drift, user feedback loop

## Configuration

All hyperparameters are defined in `config/ml_config.yaml` and loaded by the pipeline steps. Never hardcode values in pipeline scripts (RULE-01).
