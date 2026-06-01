"""Superpower tools for the KerjaCerdas Autonomous Swarm v2.

These tools are bound to the Gemini LLM allowing it to autonomously search jobs, 
analyze gaps, prep for interviews, and review resumes.
"""
from __future__ import annotations

import json
from langchain_core.tools import tool

from backend.app.db.dependencies import get_repositories
from backend.app.services.matching.matcher import SemanticMatcher
from backend.app.db.schemas import SeekerProfile, JobPosting


@tool
async def search_jobs_tool(keyword: str, location: str = "") -> str:
    """Cari lowongan pekerjaan di database berdasarkan keyword dan lokasi.
    
    Gunakan tool ini jika kandidat meminta dicarikan pekerjaan tertentu (misal: "Remote React", "Barista Surabaya").
    Jangan panggil ini jika kandidat hanya minta saran karir biasa.
    """
    repos = get_repositories()
    jobs = await repos.jobs.list()
    
    results = []
    kw = keyword.lower()
    loc = location.lower()
    
    for j in jobs:
        if kw and kw not in j.title.lower() and kw not in j.description.lower():
            continue
        if loc and loc not in j.location.lower() and loc not in j.region_code.lower():
            continue
        results.append(j)
        
    if not results:
        return f"Tidak ditemukan lowongan untuk keyword '{keyword}' di '{location}'."
        
    # Return top 5 as JSON string
    top_5 = [{"id": j.id, "title": j.title, "company": j.employer_id, "salary": j.salary_range} for j in results[:5]]
    return f"Ditemukan {len(results)} lowongan. Top 5: {json.dumps(top_5)}"


@tool
async def analyze_skill_gap_tool(seeker_skills: list[str], target_job_requirements: list[str]) -> str:
    """Analisis kelemahan (skill gap) antara skill kandidat dengan syarat lowongan kerja.
    
    Gunakan tool ini jika kandidat bertanya "Apa yang kurang dari saya untuk pekerjaan ini?".
    """
    seeker_lower = [s.lower() for s in seeker_skills]
    missing = [req for req in target_job_requirements if req.lower() not in seeker_lower]
    matching = [req for req in target_job_requirements if req.lower() in seeker_lower]
    
    return json.dumps({
        "matching_skills": matching,
        "missing_skills": missing,
        "recommendation": "Sarankan kandidat untuk mengambil kursus online untuk missing_skills tersebut."
    })


@tool
async def interview_prep_tool(job_title: str) -> str:
    """Hasilkan pertanyaan simulasi wawancara (Mock Interview) untuk posisi tertentu.
    
    Gunakan tool ini jika kandidat akan menghadapi interview atau minta tips wawancara.
    """
    # In a real app, this might call another LLM prompt or a vector DB of questions.
    # For now, we return dynamic templates.
    title = job_title.lower()
    if "developer" in title or "engineer" in title:
        return "1. Ceritakan proyek teknis tersulit yang pernah Anda buat.\n2. Bagaimana cara Anda melakukan debugging pada kode yang error di production?"
    elif "marketing" in title or "sales" in title:
        return "1. Bagaimana strategi Anda meningkatkan conversion rate di campaign sebelumnya?\n2. Coba jual produk ini kepada saya."
    else:
        return f"1. Mengapa Anda tertarik dengan posisi {job_title} ini?\n2. Ceritakan pengalaman Anda menangani konflik di tempat kerja sebelumnya."


@tool
async def resume_review_tool(resume_text: str) -> str:
    """Berikan kritik tajam bergaya ATS (Applicant Tracking System) untuk profil/CV kandidat.
    
    Gunakan tool ini jika kandidat meminta CV/profil mereka di-review atau minta saran perbaikan profil.
    """
    if len(resume_text) < 50:
        return "Kritik ATS: Profil Anda sangat kosong. Tambahkan minimal 3 deskripsi pengalaman kerja dan 5 hard-skills agar terbaca oleh sistem."
    
    issues = []
    if "achieve" not in resume_text.lower() and "meningkatkan" not in resume_text.lower():
        issues.append("- Kurang metrik keberhasilan (Gunakan angka seperti 'Meningkatkan efisiensi 20%').")
    if "pengalaman" not in resume_text.lower() and "experience" not in resume_text.lower():
        issues.append("- Format pengalaman kerja tidak terstruktur dengan jelas.")
        
    if not issues:
        return "Kritik ATS: CV Anda sudah cukup bagus secara keyword. Pastikan format PDF mudah dibaca (jangan desain terlalu rumit)."
        
    return "Kritik ATS Ditemukan:\n" + "\n".join(issues)

# List of all tools to bind to the Supervisor
SUPERPOWER_TOOLS = [search_jobs_tool, analyze_skill_gap_tool, interview_prep_tool, resume_review_tool]
