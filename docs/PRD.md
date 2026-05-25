# KerjaCerdas — Product Requirements Document (PRD)

> **Version:** 0.1.0 | **Status:** Hackathon MVP | **Last Updated:** 2026-03-10

## 1. Problem Statement

Indonesia has **7.9 million unemployed** (BPS, 2025) with a severe mismatch between job seekers' skills and market demands. 62% of graduates work in fields unrelated to their education. Current job portals use keyword-based search which fails to capture semantic skill relevance and provides no upskilling guidance.

## 2. Solution

**KerjaCerdas** ("Smart Work") is an AI-powered job matching platform that:
- Uses **Semantic Embeddings** to semantically match seeker skills to job requirements
- Provides **skill gap analysis** powered by Google Gemini LLM
- Offers **personalized career advice** via LLM agent in Bahasa Indonesia
- Covers all **34 provinces** with regional labor demand weighting

## 3. Target Users

| Persona | Description | Key Need |
|---------|-------------|----------|
| Fresh Graduate | S1/D3, 0-1 yr experience | Find first job aligned with skills |
| Career Switcher | 2-5 yrs, wants new field | Understand skill gaps for target role |
| Regional Job Seeker | Outside Java island | Find local opportunities, remote options |

## 4. Core Features (MVP)

### 4.1 AI Job Matching
- Seeker inputs profile (skills, experience, education, region, salary)
- Embeddings model retrieves top-K job matches from 50,000+ postings
- Weighted scoring system incorporating skill overlap, region, salary, and experience
- Returns match score, skill overlap %, and explanation in Bahasa

### 4.2 Skill Gap Analysis
- Compare seeker skills vs target job requirements
- Identify missing and matching skills
- Recommend courses from Indonesian platforms (Prakerja, Dicoding, Coursera ID)
- Estimate time-to-readiness

### 4.3 AI Career Advisor
- Chat-based career counselor in Bahasa Indonesia
- Context-aware: knows seeker profile and Indonesia job market
- Provides actionable advice (CV tips, salary negotiation, career paths)

## 5. Success Metrics

| Metric | Target | How |
|--------|--------|-----|
| nDCG@10 | ≥ 0.82 | Offline evaluation on labeled test set |
| Match Precision@5 | ≥ 0.80 | Manual annotation by domain experts |
| API Latency (p95) | < 500ms | APM monitoring |
| Fair Match Rate | < 15% gap | Java vs outer island match rates |

## 6. Tech Stack

See `PROTOCOL.md §7` for locked technology decisions.

## 7. Release Plan

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| Week 0 | 2026-03-03 | Protocol + project scaffold |
| Week 1 | 2026-03-10 | Data ingestion + Semantic Embeddings pipeline |
| Week 2 | 2026-03-17 | API + agent orchestration |
| Week 3 | 2026-03-24 | Frontend MVP + integration |
| Week 4 | 2026-03-31 | Demo polish + evaluation |
| Demo Day | 2026-04-05 | KerjaCerdas v0.1 live demo |
