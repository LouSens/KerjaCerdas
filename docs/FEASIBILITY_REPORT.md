# 🛡️ Real-World Feasibility & Anti-Hallucination Framework

> **Project:** KerjaCerdas (Smart Work)
> **Objective:** Ensuring a rational, data-grounded, and robust AI implementation for Indonesia's labor market.

## 1. Preventing Hallucinations: The "Grounding" Strategy

Hallucination is typically a failure of *Generative* models. For a high-stakes domain like job matching, we use a **Hybrid Architecture** that prioritizes *Retrieval* over *Generation*.

### A. Semantic Retrieval (Gemini Embeddings) — No Generative Risk
The matching engine is **non-generative**. It doesn't "invent" job matches.
- **Embedding Architecture**: Converts seeker profiles and job descriptions into fixed 3072-dimensional vectors using Gemini Embeddings.
- **Cosine Similarity**: Mathematically identifies the closest matches in the database.
- **Why this works**: The model can only return jobs that *actually exist* in our PostgreSQL database. It literally cannot hallucinate a fake job because it is restricted to a fixed retrieval set. By leveraging state-of-the-art LLM embeddings rather than a traditional ML pipeline, we eliminate the heavy maintenance burden of retraining models.

### B. Retrieval-Augmented Generation (RAG) for Advice
When the **Advisor Agent** or **Skill Gap Agent** provides career guidance, it is "clamped" to real data:
1. **The Retrieval Step**: Before answering, the agent queries our **KBJI (Indonesian Standard Classification of Occupations)** knowledge base and the **DIKTI Accredited Course Catalog**.
2. **The Prompt Constraint**: The LLM (Gemini 2.0) is instructed to *only* use the retrieved context. If a skill requirement isn't in the BPS labor statistics, the model is told explicitly to state it doesn't know, rather than guessing.

---

## 2. Rational Implementation from Datasets

To implement this rationally, the model must be trained on high-fidelity, localized datasets rather than generic "Silicon Valley" job data.

### A. The Dataset Mix
| Source | Purpose | Real-World Utility |
|--------|---------|--------------------|
| **BPS Labor Statistics** | Labor market trends | Ensures we understand Indonesia's regional demands (e.g., specific needs in Kalimantan vs. Java). |
| **JobStreet/LinkedIn ID Scrapes** | Skill-job mapping | Provides the ground-truth "Skill Adjacency" (which skills are actually required for local roles). |
| **KBJI (BPS) Codes** | Occupation Taxonomy | Standardizes 10,000+ job titles into a consistent hierarchy, preventing "title inflation" matching. |

### B. The Matching Engine (Gemini LLM & Embeddings)
We do not use a traditional ML pipeline (which is hard to maintain and requires constant fine-tuning). Instead:
- **Zero-Shot Semantic Matching**: We rely on Gemini's vast pre-trained understanding of global and Indonesian labor terms (e.g., *magang*, *kontrak*, *harian lepas*) and local skill acronyms.
- **LLM-Powered Scoring**: Agents intelligently weigh factors like regional relevance and skill gaps dynamically without needing constant dataset retraining.

---

## 3. The "Rationality" Check: Evaluation & Metrics

How do we *know* it works before we go live?

1. **Precision@5 (Human Benchmark)**: We have domain experts (HR specialists) manually review the top 5 matches for 100 sample seekers. Our goal is **≥ 90% correlation** between AI ranking and Human expert ranking.
2. **nDCG@10 (Normalized Discounted Cumulative Gain)**: A standard information retrieval metric that measures not just *if* a match is found, but if the *best* match is at the very top.
3. **Bias Audit**: We explicitly measure the "java-centricity" of the model. If a seeker in Makassar gets worse matches than one in Jakarta for the same skills, we adjust the **Regional Weighting** logic.

---

## 4. Real-World Failure Modes & Safeguards

| Failure Mode | Safeguard |
|--------------|-----------|
| **Niche Skill Isolation** | If a seeker has a very rare skill with no matches, we fall back to "Broad Category Matching" (KBJI code level). |
| **Outdated Course Links** | The **Data Agent** performs a nightly "Link Health Check" to ensure recommended courses haven't disappeared. |
| **Low Confidence Score** | If the Orchestrator detects a match confidence < 0.70, it adds a disclaimer: *"Hasil ini didasarkan pada kecocokan parsial; mohon tinjau secara manual."* |

---

## 5. Implementation Roadmap (PoC to MVP)

1. **Phase 1 (Current)**: Demo with high-quality mock data + RAG-ready prompt engineering.
2. **Phase 2 (Integration)**: Mass ingestion of 2025 BPS and JobStreet data into our vector database using Gemini Embeddings.
3. **Phase 3 (Validation)**: Blind A/B test with real users.
4. **Phase 4 (Deployment)**: Production rollout with caching and optimized API routing.

---
<div align="center">
*This strategy ensures KerjaCerdas remains a reliable platform rather than a "stochastic parrot."*
</div>
