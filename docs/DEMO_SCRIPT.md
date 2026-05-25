# KerjaCerdas — Hackathon Demo Script

> **[!IMPORTANT]** Test this script end-to-end 3x before Demo Day (RULE §6).

## Pre-Demo Checklist

- [ ] All services running (`docker-compose up`)
- [ ] Frontend loads at `http://localhost:3000`
- [ ] API health check returns `healthy` at `http://localhost:8000/health`
- [ ] Demo mode enabled (`DEMO_MODE=true` in `.env`)
- [ ] Offline fallback working (mock data if ML unavailable)
- [ ] Presentation slides ready

## Demo Flow (5 minutes)

### Scene 1: The Problem (30s)

> "Indonesia has 7.9 million unemployed, yet companies struggle to find talent.
> 62% of graduates work outside their field of study.
> Current job portals use keyword search — they don't understand SKILLS."

### Scene 2: Enter KerjaCerdas (30s)

> "KerjaCerdas uses AI to solve this — matching seekers to jobs based on
> semantic skill understanding, not just keyword overlap."

Show: Landing page with the hero section. Click through to demonstrate the UI.

### Scene 3: Live Job Matching Demo (90s)

1. Fill in demo profile:
   - Name: **Budi Santoso**
   - Education: **S1 Informatika**
   - Experience: **1 tahun**
   - Skills: Select **Python**, **SQL**, **Excel**
   - Salary: **Rp 12.000.000**

2. Click **"⚡ Temukan Pekerjaan dengan AI"**
3. Show results: "The AI analyzed 50,000+ postings and found 6 matches"
4. Highlight top match: **Data Analyst @ Bank Mandiri — 91% match**
5. "Notice the match score and skill overlap — this isn't keyword matching, it's AI-powered semantic similarity"

### Scene 4: Skill Gap Analysis (60s)

1. Click on **Machine Learning Engineer @ Gojek** (84% match)
2. Show skill gap panel:
   - ✓ Skills you have: Python, SQL
   - ✗ Missing: TensorFlow, PyTorch, Docker
   - Severity: **HIGH**
3. Show course recommendations from Coursera, Dicoding
4. "The AI doesn't just say 'you're not qualified' — it shows you exactly WHAT to learn and WHERE"

### Scene 5: AI Career Advisor (60s)

1. Click **"Diskusi dengan AI Advisor"**
2. Type: "Karier apa yang cocok untuk saya?"
3. Show AI response with personalized advice
4. "This is powered by Google Gemini, with full context of the Indonesian job market"

### Scene 6: Architecture (30s)

> "Under the hood: 4 AI agents coordinated by an orchestrator.
> Gemini Embeddings for matching, Gemini for advice, all served via FastAPI.
> Built on our Antigravity Protocol for reproducibility."

### Closing (30s)

> "KerjaCerdas: Making Indonesia's job market smarter, one match at a time.
> Thank you — pertanyaan?"

## Rollback Plan

If live demo fails:
1. Switch to pre-recorded video (backup.mp4)
2. Show API responses via Postman screenshots
3. Walk through code architecture on slides
