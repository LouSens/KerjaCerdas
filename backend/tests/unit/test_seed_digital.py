"""The digital-skills booth story is seeded consistently: every account, job and
course the demo (and the booth video) points at exists, and every required skill
of a digital job has a course — so the learning plan never falls back to a
generic search link during the demo."""

from __future__ import annotations

from scripts.seed_all import COURSES, EMPLOYERS, JOB_POSTINGS, SEEKERS
from scripts.seed_digital import DIGITAL_JOBS, DIGITAL_OUTCOMES, DIGITAL_TARGETS
from scripts.seed_outcomes import OUTCOMES, TARGETS

from backend.app.services.demo_accounts import DEMO_ACCOUNTS
from backend.app.services.matching.evidence import skill_key

EMPLOYER_KEYS = {e[0] for e in EMPLOYERS}
JOBS = {(j[0], j[1]) for j in JOB_POSTINGS}
SEEKER_EMAILS = [s["email"] for s in SEEKERS]


def test_seeker_emails_are_unique():
    assert len(SEEKER_EMAILS) == len(set(SEEKER_EMAILS))


def test_digital_jobs_are_seeded_at_existing_umkm():
    for job in DIGITAL_JOBS:
        assert job[0] in EMPLOYER_KEYS
        assert (job[0], job[1]) in JOBS
        assert job[8] == 0  # entry level: no prior experience required


def test_every_outcome_and_target_points_at_a_seeded_job_and_seeker():
    assert all(o in OUTCOMES for o in DIGITAL_OUTCOMES)
    assert all(t in TARGETS for t in DIGITAL_TARGETS)
    for email, emp, title, *_ in OUTCOMES + TARGETS:
        assert email in SEEKER_EMAILS
        assert (emp, title) in JOBS


def test_every_required_digital_skill_has_a_course():
    taught = {skill_key(s) for c in COURSES for s in c["skills_taught"]}
    for job in DIGITAL_JOBS:
        for skill in job[5]:
            assert skill_key(skill) in taught, f"no course for {skill} ({job[1]})"


def test_demo_accounts_are_seeded():
    employer_logins = {f"hr@{k.replace('_', '')}.id" for k in EMPLOYER_KEYS}
    for email, role, *_ in DEMO_ACCOUNTS:
        assert email in (SEEKER_EMAILS if role == "seeker" else employer_logins)
