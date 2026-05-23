/**
 * KerjaCerdas — API client.
 *
 * The Vite dev server proxies `/api/*` and `/health` to the FastAPI
 * backend on :8000 (see vite.config.js). All calls go through one tiny
 * `request()` helper so error handling is consistent.
 */

const API_BASE = '/api/v1'

export function _authHeader() {
    try {
        const raw = localStorage.getItem('kerjacerdas-v3')
        const token = raw ? JSON.parse(raw)?.state?.authToken : null
        return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
        return {}
    }
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
    return res.json()
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginUser = ({ email, password }) =>
    request(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

export const registerUser = ({ name, email, password, role }) =>
    request(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    })

// ── Agent (unified entrypoint for match / skill-gap / advisor) ──────────────
export async function invokeAgent({ message, seekerId, seeker, targetJobId, sessionId }) {
    return request(`${API_BASE}/agent/invoke`, {
        method: 'POST',
        body: JSON.stringify({
            user_message: message ?? '',
            seeker_id: seekerId,
            seeker,
            target_job_id: targetJobId ?? null,
            session_id: sessionId,
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

// ── Seeker gamification ─────────────────────────────────────────────────────
export const fetchGamification = () => request(`${API_BASE}/seeker/gamification`)

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
export async function uploadCV({ userId, file }) {
    const fd = new FormData()
    fd.append('user_id', userId)
    fd.append('file', file)
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
export const fetchCandidatesForJob = (jobId, topK = 5) =>
    request(`${API_BASE}/employer/jobs/${jobId}/candidates`, {
        method: 'POST',
        body: JSON.stringify({ top_k: topK }),
    })

// ── Verification (mock e-KYC / SIVIL / NPWP) ────────────────────────────────
export const verifyIdentity = (payload) => request(`${API_BASE}/verify/identity`, {
    method: 'POST', body: JSON.stringify(payload),
})
export const verifyEducation = (payload) => request(`${API_BASE}/verify/education`, {
    method: 'POST', body: JSON.stringify(payload),
})
export const verifyNPWP = (payload) => request(`${API_BASE}/verify/npwp`, {
    method: 'POST', body: JSON.stringify(payload),
})

// ── Employer post-job AI estimation (live preview) ──────────────────────────
export const estimateJobPool = (payload) => request(`${API_BASE}/employer/jobs/estimate`, {
    method: 'POST', body: JSON.stringify(payload),
})

// ── Verification documents (encrypted file_ids visible only to owner) ───────
export const listVerificationDocs = () => request(`${API_BASE}/verify/documents`)



// ── Health ──────────────────────────────────────────────────────────────────
export const healthCheck = () => request('/health')
