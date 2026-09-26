"""Seed application OUTCOMES so the target -> learn -> apply -> feedback loop has
real data behind it: HR rejections with a reason code, interviews with
HR-confirmed skills, and a hire. Called at the end of scripts.seed_all.

Create-only: an outcome is written only when that (job, seeker) application
does not exist yet. Reseeding never rewinds a decision HR made since — a hire,
a rejection or a skill confirmation stays as HR left it. Same for the seeded
learning plan: created once, never overwritten.

Demo reading of the result (digital-job stories: see seed_digital.py):
  maya.sari@example.com       rejected at "Admin & Kasir Klinik" (skill_kurang) —
                              sees the reason + missing skills -> learning plan
  hr@kliniksehat.id           3 applicants on "Admin & Kasir Klinik": ranked list,
                              skill map, one HR-confirmed candidate
"""

from __future__ import annotations

from backend.app.agents.graph.nodes import recommend_courses_offline
from backend.app.db.schemas import Application, ApplicationStatus, SkillGapResult
from backend.app.db.schemas_proof import ApplicationStatusEvent, SkillEvidence
from backend.app.services.matching.evidence import skill_key, skill_snapshot
from backend.app.services.matching.matcher import score_pair
from scripts.seed_digital import DIGITAL_OUTCOMES, DIGITAL_TARGETS

PATH = {  # legal pipeline walk to each end state
    "applied": [],
    "interview": ["reviewed", "interview"],
    "hired": ["reviewed", "interview", "offered", "hired"],
    "rejected": ["rejected"],
}

# (seeker email, employer key, job title, end status, reason code, HR-confirmed skills, note)
OUTCOMES = [
    ("maya.sari@example.com", "klinik_sehat", "Admin & Kasir Klinik", "rejected", "skill_kurang", [],
     "Terima kasih sudah melamar. Kami butuh kandidat yang sudah terbiasa administrasi pasien dan kasir."),
    ("maya.sari@example.com", "gadai_amanah", "Customer Service Representative", "applied", "", [], ""),
    ("rudi.hartono@example.com", "klinik_sehat", "Admin & Kasir Klinik", "interview", "", ["Kasir", "Customer Service"],
     "Wawancara lanjutan dengan kepala klinik minggu depan."),
    ("bambang.suryanto@example.com", "klinik_sehat", "Admin & Kasir Klinik", "applied", "", [], ""),
    ("bambang.suryanto@example.com", "kelontong_makmur", "Kasir & Staff Gudang Toko", "hired", "",
     ["Kasir", "Stok Barang"], "Selamat bergabung — mulai Senin pukul 08.00."),
    ("yeni.marlina@example.com", "warung_bahari", "Kasir & Pelayan Warung Makan", "rejected", "skill_kurang", [], ""),
    ("andi.pratama@example.com", "bpr_sentosa", "Junior Data Analyst (Banking)", "rejected", "posisi_terisi", [], ""),
    *DIGITAL_OUTCOMES,
]

# Seekers whose learning plan should already point at a target job on first login.
TARGETS = [("maya.sari@example.com", "klinik_sehat", "Admin & Kasir Klinik"), *DIGITAL_TARGETS]


async def seed_outcomes(repos, emp_by_key: dict) -> int:
    users = {u.email: u for u in await repos.users.list()}
    seekers = {s.user_id: s for s in await repos.seekers.list()}
    jobs = await repos.jobs.list()
    apps = {(a.job_id, a.seeker_id): a for a in await repos.applications.list()}
    events = await repos.status_events.list()

    def job_for(emp_key: str, title: str):
        emp = emp_by_key.get(emp_key)
        return next((j for j in jobs if emp and j.employer_id == emp.id and j.title == title), None)

    def seeker_for(email: str):
        user = users.get(email)
        return seekers.get(user.id) if user else None

    count = 0
    for email, emp_key, title, end, reason, confirmed, note in OUTCOMES:
        seeker, job = seeker_for(email), job_for(emp_key, title)
        if not seeker or not job:
            print(f"[outcomes] skip {email} -> {title}: not seeded")
            continue
        if (job.id, seeker.id) in apps:
            continue  # already exists: HR may have acted on it since — leave it alone

        for name in confirmed:  # HR confirmation after the interview = strongest proof
            key = skill_key(name)
            skill = next((s for s in seeker.skills if skill_key(s.name) == key), None)
            if skill:
                skill.proof_level, skill.proof_date = "hr_confirmed", None
        if confirmed:
            await repos.seekers.upsert(seeker)

        live = score_pair(seeker, job)
        app = Application(
            job_id=job.id, seeker_id=seeker.id, status=ApplicationStatus(end), note=note,
            cover_letter="Saya tertarik dengan posisi ini.", match_score=live["score"],
            skill_snapshot=skill_snapshot(seeker.skills),
        )
        await repos.applications.upsert(app)
        apps[(job.id, seeker.id)] = app

        for name in confirmed:
            await repos.skill_evidence.upsert(SkillEvidence(
                seeker_id=seeker.id, skill=skill_key(name), source="hr", source_id=app.id,
                employer_id=job.employer_id, confirmed=True))

        prev = "applied"
        for step in PATH[end]:
            seen = any(e.application_id == app.id and e.to_status == step for e in events)
            if not seen:
                ev = ApplicationStatusEvent(
                    application_id=app.id, job_id=job.id, from_status=prev, to_status=step,
                    match_score=app.match_score, reason_code=reason if step == "rejected" else "")
                await repos.status_events.upsert(ev)
                events.append(ev)
            prev = step
        count += 1

    for email, emp_key, title in TARGETS:
        seeker, job = seeker_for(email), job_for(emp_key, title)
        if not seeker or not job:
            continue
        have = {skill_key(s.name) for s in seeker.skills}
        missing = [r for r in job.required_skills if skill_key(r) not in have]
        matching = [r for r in job.required_skills if skill_key(r) in have]
        if any(g.seeker_id == seeker.id for g in await repos.skill_gaps.list()):
            continue  # the seeker already has a plan — never overwrite it
        await repos.skill_gaps.upsert(SkillGapResult(
            seeker_id=seeker.id, target_job_id=job.id, missing_skills=missing, matching_skills=matching,
            gap_severity="high" if len(missing) * 2 >= len(job.required_skills) else "medium",
            match_percentage=round(100 * len(matching) / max(1, len(job.required_skills)), 1),
            recommended_courses=await recommend_courses_offline(missing), estimated_readiness_months=1,
            summary=f"Gap {len(missing)} skill untuk posisi {job.title}.",
        ))

    print(f"[outcomes] {count} application outcomes seeded")
    return count
