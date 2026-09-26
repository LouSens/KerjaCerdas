/**
 * KerjaCerdas — API client.
 *
 * The Vite dev server proxies `/api/*` and `/health` to the FastAPI
 * backend on :8000 (see vite.config.js). All calls go through one tiny
 * `request()` helper so error handling is consistent.
 */

import toast from 'react-hot-toast'

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim()
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/+$/, '')}/api/v1` : '/api/v1'

let _inMemoryToken = null

export function setAuthToken(token) {
    _inMemoryToken = token || null
}

export function _authHeader() {
    if (_inMemoryToken) {
        return { Authorization: `Bearer ${_inMemoryToken}` }
    }
    try {
        const rawV4 = localStorage.getItem('kerjacerdas-v4')
        const tokenV4 = rawV4 ? JSON.parse(rawV4)?.state?.authToken : null
        if (tokenV4) {
            _inMemoryToken = tokenV4
            return { Authorization: `Bearer ${tokenV4}` }
        }

        const rawV3 = localStorage.getItem('kerjacerdas-v3')
        const tokenV3 = rawV3 ? JSON.parse(rawV3)?.state?.authToken : null
        if (tokenV3) {
            _inMemoryToken = tokenV3
            return { Authorization: `Bearer ${tokenV3}` }
        }
        return {}
    } catch {
        return {}
    }
}

let _onUnauthorized = null

export function setUnauthorizedHandler(fn) {
    _onUnauthorized = fn
}

async function request(path, opts = {}) {
    const res = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
            ..._authHeader(),
            ...(opts.headers || {}),
        },
        ...opts,
    })
    if (!res.ok) {
        const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register')

        // Auto-logout on token expiry for authenticated routes only (debounced by toast ID)
        if (res.status === 401 && !isAuthEndpoint) {
            try {
                const hadToken = Boolean(_authHeader()?.Authorization)
                if (hadToken) {
                    toast.error('Sesi Anda telah berakhir, silakan masuk kembali.', { id: 'session-expired' })
                }
                if (typeof _onUnauthorized === 'function') {
                    _onUnauthorized()
                } else {
                    setAuthToken(null)
                }
            } catch { /* ignore */ }
        }
        if (res.status === 403 && !isAuthEndpoint) {
            toast.error('Akses ditolak: Anda tidak memiliki izin.', { id: 'forbidden-access' })
        }
        // Try to surface FastAPI's `detail` so the UI can show real messages.
        let detail = `${res.status} ${res.statusText}`
        try {
            const body = await res.json()
            if (body?.detail) {
                detail = typeof body.detail === 'string'
                    ? body.detail
                    : (Array.isArray(body.detail) ? body.detail.map(d => d.msg).join(', ') : JSON.stringify(body.detail))
            }
        } catch {
            try { const t = await res.text(); if (t) detail += ` — ${t.slice(0, 200)}` } catch { /* ignore */ }
        }
        const err = new Error(detail)
        err.status = res.status
        throw err
    }
    if (res.status === 204) return null
    return res.json()
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginUser = ({ email, password }) =>
    request(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

// DEMO_MODE only (404 otherwise): the seeded accounts offered as one-click logins.
export const fetchDemoAccounts = () => request(`${API_BASE}/auth/demo-accounts`)
export const demoLoginUser = (email) =>
    request(`${API_BASE}/auth/demo-login`, { method: 'POST', body: JSON.stringify({ email }) })

export const registerUser = ({ name, email, password, role }) =>
    request(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    })

// ── Agent (unified entrypoint for match / skill-gap / advisor) ──────────────
export async function invokeAgent({ message, seekerId, seeker, targetJobId, explicitIntent, sessionId, filters }) {
    return request(`${API_BASE}/agent/invoke`, {
        method: 'POST',
        body: JSON.stringify({
            user_message: message ?? '',
            seeker_id: seekerId,
            seeker,
            target_job_id: targetJobId ?? null,
            explicit_intent: explicitIntent ?? null,
            session_id: sessionId,
            filters: filters ?? {},
        }),
    })
}

// ── Jobs feed ───────────────────────────────────────────────────────────────
export const fetchJobs = (limit = 20) => request(`${API_BASE}/jobs?limit=${limit}`)
export const fetchJob = (id) => request(`${API_BASE}/jobs/${id}`)

// ── Seeker profile ──────────────────────────────────────────────────────────
export const fetchSeekerProfile = () => request(`${API_BASE}/seeker/profile`)
export const updateSeekerProfile = (data) =>
    request(`${API_BASE}/seeker/profile`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

// ── Seeker skill gap (AI-powered) ───────────────────────────────────────────
export const triggerSkillGap = (targetJobId = null) =>
    request(`${API_BASE}/seeker/skill-gap`, {
        method: 'POST',
        body: JSON.stringify({ target_job_id: targetJobId }),
    })

export const fetchLatestSkillGap = () =>
    request(`${API_BASE}/seeker/skill-gap/latest`)

// ── Seeker bookmarks (saved jobs) ───────────────────────────────────────────
export const fetchBookmarks = () => request(`${API_BASE}/seeker/bookmarks`)
export const addBookmark = (jobId) =>
    request(`${API_BASE}/seeker/bookmarks`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId }),
    })
export const removeBookmark = (jobId) =>
    request(`${API_BASE}/seeker/bookmarks/${jobId}`, { method: 'DELETE' })

// ── Uploads (PDF → Gemini → schema) ─────────────────────────────────────────
export async function uploadCV({ userId, file, confirmOffline = false, confirmScanned = false }) {
    const fd = new FormData()
    fd.append('user_id', userId)
    fd.append('file', file)
    fd.append('confirm_offline', confirmOffline ? 'true' : 'false')
    // Explicit consent to send a scan/photo of the CV as an image, because
    // a PDF with no text layer cannot be redacted before it leaves us.
    fd.append('confirm_scanned', confirmScanned ? 'true' : 'false')
    const res = await fetch(`${API_BASE}/uploads/cv`, {
        method: 'POST',
        headers: { ..._authHeader() },
        body: fd,
    })
    if (!res.ok) throw new Error(`Upload CV failed: ${res.status}`)
    return res.json()
}


export async function uploadJobPack({ userId, file }) {
    const fd = new FormData()
    fd.append('user_id', userId)
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/uploads/job-pack`, {
        method: 'POST',
        headers: { ..._authHeader() },
        body: fd,
    })
    if (!res.ok) throw new Error(`Upload job-pack failed: ${res.status}`)
    return res.json()
}

// ── Employer profile ─────────────────────────────────────────────────────────
export const fetchEmployerProfile = () => request(`${API_BASE}/employer/profile`)
export const updateEmployerProfile = (data) =>
    request(`${API_BASE}/employer/profile`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

// ── Employer jobs (auth-scoped to current employer) ─────────────────────────
export const fetchEmployerJobs = () => request(`${API_BASE}/employer/jobs`)
export const createEmployerJob = (data) =>
    request(`${API_BASE}/employer/jobs`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

// ── Employer candidates (reverse-matching) ──────────────────────────────────
export const fetchCandidatesForJob = (jobId, topK = 5, filters = {}) =>
    request(`${API_BASE}/employer/jobs/${jobId}/candidates`, {
        method: 'POST',
        body: JSON.stringify({ top_k: topK, filters }),
    })

// ── Employer post-job AI estimation (live preview) ──────────────────────────
export const estimateJobPool = (payload) => request(`${API_BASE}/employer/jobs/estimate`, {
    method: 'POST', body: JSON.stringify(payload),
})

// ── Seeker applications ──────────────────────────────────────────────────────
// `extra` = { source: 'board'|'link' } — 'link' means the job's QR / share link
export const applyToJob = (jobId, coverLetter = '', extra = {}) =>
    request(`${API_BASE}/seeker/apply`, {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter, ...extra }),
    })

export const fetchApplications = () => request(`${API_BASE}/seeker/applications`)

// Exact standing among this job's applicants, computed from the score stored at apply time.
export const fetchApplicationRank = (applicationId) =>
    request(`${API_BASE}/seeker/applications/${applicationId}/rank`)

// ── Jobs search ──────────────────────────────────────────────────────────────
export const searchJobs = (q = '', offset = 0, limit = 20, filters = {}) => {
    let url = `${API_BASE}/jobs?q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}`;
    if (filters.region) url += `&region=${encodeURIComponent(filters.region)}`;
    if (filters.job_type) url += `&job_type=${encodeURIComponent(filters.job_type)}`;
    if (filters.experience_min) url += `&experience_min=${filters.experience_min}`;
    if (filters.salary_min) url += `&salary_min=${filters.salary_min}`;
    if (filters.remote_allowed !== undefined) url += `&remote_allowed=${filters.remote_allowed}`;
    if (filters.industry) url += `&industry=${encodeURIComponent(filters.industry)}`;
    return request(url);
}

// Distinct regions actually present among active jobs (with live counts) —
// used to populate the location filter dynamically instead of a hardcoded
// city list that silently doesn't match what jobs actually exist.
export const fetchJobRegions = () => request(`${API_BASE}/jobs/regions`)

// Distinct employer industries actually present among active jobs (with live
// counts) — powers the category/division filter from real data so it isn't
// skewed toward whichever industry happens to dominate the seed pool.
export const fetchJobIndustries = () => request(`${API_BASE}/jobs/industries`)

// ── Events (fire-and-forget analytics) ────────────────────────────────────
export const trackEvent = (eventType, extra = {}) =>
    request(`${API_BASE}/events/track`, {
        method: 'POST',
        body: JSON.stringify({ event_type: eventType, ...extra }),
    }).catch(() => { /* silent — tracking must never break UX */ })

// ── A/B Experiments ─────────────────────────────────────────────────────────
export const fetchExperimentAssignments = () =>
    request(`${API_BASE}/experiments/assignments`)

// ── Health ──────────────────────────────────────────────────────────────────
export const healthCheck = () => request(RAW_API_URL ? `${RAW_API_URL.replace(/\/+$/, '')}/health` : '/health')

// ── Employer: application management & status transitions ───────────────────
export const fetchEmployerApplications = (jobId = null) => {
    const qs = jobId ? `?job_id=${encodeURIComponent(jobId)}` : ''
    return request(`${API_BASE}/employer/applications${qs}`)
}

// A rejection must carry `reasonCode` (one of the backend's REJECTION_REASONS);
// the API refuses a bare "rejected" with 422. The code is shown to the seeker.
export const updateApplicationStatus = (applicationId, status, note = null, reasonCode = null) =>
    request(`${API_BASE}/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
            status,
            ...(note !== null ? { note } : {}),
            ...(reasonCode ? { reason_code: reasonCode } : {}),
        }),
    })

// Mirrors services/hiring/rejection.py — the codes HR can pick when rejecting.
export const REJECTION_REASONS = [
    ['skill_kurang', 'Skill inti belum memadai'],
    ['pengalaman_kurang', 'Pengalaman relevan belum cukup'],
    ['lokasi', 'Lokasi / kesediaan pindah tidak cocok'],
    ['gaji', 'Ekspektasi gaji di luar anggaran'],
    ['posisi_terisi', 'Posisi sudah terisi kandidat lain'],
    ['tidak_hadir', 'Tidak hadir / tidak merespons'],
    ['dokumen', 'Dokumen / syarat administratif'],
    ['lainnya', 'Alasan lain'],
]

// ── Partnership & Enterprise Inquiries ──────────────────────────────────────
export const submitPartnershipInquiry = (data) =>
    request(`${API_BASE}/inquiries`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const fetchPartnershipInquiries = (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`${API_BASE}/inquiries${qs ? `?${qs}` : ''}`)
}


// ── Email verification (the only in-house identity check; no NIK/KTP) ──────
export const fetchVerificationStatus = () => request(`${API_BASE}/verify/status`)
export const sendEmailOtp = () => request(`${API_BASE}/verify/email/send`, { method: 'POST' })
export const verifyEmailOtp = (code) =>
    request(`${API_BASE}/verify/email/verify`, { method: 'POST', body: JSON.stringify({ code }) })

// ── Skill quizzes (✓ Terbukti badges) ────────────────────────────────────────
export const fetchQuizSkills = (jobId = null) =>
    request(`${API_BASE}/quiz/skills${jobId ? `?job_id=${encodeURIComponent(jobId)}` : ''}`)
export const startQuiz = (skill) =>
    request(`${API_BASE}/quiz/start`, { method: 'POST', body: JSON.stringify({ skill }) })
export const submitQuiz = (attemptId, answers) =>
    request(`${API_BASE}/quiz/submit`, {
        method: 'POST', body: JSON.stringify({ attempt_id: attemptId, answers }),
    })
export const abandonQuiz = (attemptId, elapsedSeconds = null) =>
    request(`${API_BASE}/quiz/abandon`, {
        method: 'POST', body: JSON.stringify({ attempt_id: attemptId, elapsed_seconds: elapsedSeconds }),
    })

// ── Public job links (/j/<code>) ────────────────────────────────────────────
export const fetchPublicJob = (code) => request(`${API_BASE}/public/jobs/${encodeURIComponent(code)}`)
export const publicJobQrUrl = (code) =>
    `${API_BASE}/public/jobs/${encodeURIComponent(code)}/qr.svg?origin=${encodeURIComponent(window.location.origin)}`
export const reportJob = (code, reason, detail = '') =>
    request(`${API_BASE}/public/jobs/${encodeURIComponent(code)}/report`, {
        method: 'POST', body: JSON.stringify({ reason, detail }),
    })

// ── Employer jobs: edit / appeal / hiring tools / trust ─────────────────────
export const updateEmployerJob = (jobId, data) =>
    request(`${API_BASE}/employer/jobs/${jobId}`, { method: 'PATCH', body: JSON.stringify(data) })
export const appealJob = (jobId, message) =>
    request(`${API_BASE}/employer/jobs/${jobId}/appeal`, {
        method: 'POST', body: JSON.stringify({ message }),
    })
export const fetchInterviewKit = (applicationId) =>
    request(`${API_BASE}/employer/applications/${applicationId}/interview-kit`)
export const confirmSkills = (applicationId, skills) =>
    request(`${API_BASE}/employer/applications/${applicationId}/confirm-skills`, {
        method: 'POST', body: JSON.stringify({ skills }),
    })
export async function downloadApplicantsCsv(jobId) {
    const res = await fetch(`${API_BASE}/employer/jobs/${jobId}/applicants.csv`, { headers: { ..._authHeader() } })
    if (!res.ok) {
        let detail = `${res.status}`
        try { detail = (await res.json()).detail || detail } catch { /* ignore */ }
        const err = new Error(detail); err.status = res.status; throw err
    }
    return res.blob()
}
export const fetchEmployerTrust = () => request(`${API_BASE}/employer/trust`)
export const requestAdminReview = (links) =>
    request(`${API_BASE}/employer/trust/review-request`, {
        method: 'POST', body: JSON.stringify({ links }),
    })

// ── Plans (Spark / Beacon / Lighthouse / Prism) — manual payment ────────────
export const fetchPlans = () => request(`${API_BASE}/billing/plans`)
export const fetchMyPlans = () => request(`${API_BASE}/billing/me`)
export const createPlanOrder = (plan, jobId = null) =>
    request(`${API_BASE}/billing/orders`, {
        method: 'POST', body: JSON.stringify({ plan, job_id: jobId }),
    })

// ── Admin (ADMIN_EMAILS only) ───────────────────────────────────────────────
export const adminFetch = (path) => request(`${API_BASE}/admin${path}`)
export const adminPost = (path, body = {}) =>
    request(`${API_BASE}/admin${path}`, { method: 'POST', body: JSON.stringify(body) })

