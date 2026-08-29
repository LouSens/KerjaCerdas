/**
 * KerjaCerdas — Zustand store (v4).
 *
 * Changes from v3:
 * - Gamification completely removed (3.1)
 * - Applications tracking added and loaded on login (3.2)
 * - Router bridge (_setRouterNavigate / _routerNavigate) added for react-router-dom URL sync (2.1)
 * - navigate() now also pushes to the browser URL via the router bridge
 * - selectedCandidateJobId added so employer dashboard can pass job context to candidates view (2.3)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import {
    invokeAgent,
    healthCheck,
    uploadCV,
    uploadJobPack,
    fetchJobs,
    fetchEmployerJobs,
    fetchSeekerProfile,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    loginUser,
    registerUser,
    setAuthToken,
    fetchApplications,
    applyToJob,
    fetchEmployerProfile,
    updateEmployerProfile,
    trackEvent,
    fetchExperimentAssignments,
    triggerSkillGap,
    fetchLatestSkillGap,
} from '../services/api'

const PUBLIC_VIEWS = new Set(['home', 'pricing', 'about', 'privacy'])

const ALLOWED_VIEWS = {
    seeker: new Set([
        'seeker-dashboard', 'seeker-match', 'seeker-skill-gap',
        'seeker-verification', 'seeker-saved', 'seeker-profile',
        'seeker-search', 'seeker-applications',
    ]),
    employer: new Set([
        'employer-dashboard', 'employer-jobs', 'employer-candidates',
        'employer-post-job', 'employer-verification', 'employer-upload', 'employer-profile',
    ]),
}

// ── React Router bridge ──────────────────────────────────────────────────────
// Allows Zustand navigate() to push to browser URL without React hooks.
let _routerNavigate = null

// ── VIEW → PATH map (mirrors App.jsx) ───────────────────────────────────────
const VIEW_TO_PATH = {
    'home':                  '/',
    'pricing':               '/harga',
    'about':                 '/tentang',
    'privacy':               '/privasi',
    'seeker-dashboard':      '/dashboard',
    'seeker-match':          '/lowongan',
    'seeker-skill-gap':      '/skill-gap',
    'seeker-saved':          '/tersimpan',
    'seeker-verification':   '/verifikasi',
    'seeker-profile':        '/profil',
    'seeker-search':         '/cari',
    'seeker-applications':   '/lamaran',
    'employer-dashboard':    '/employer/dashboard',
    'employer-jobs':         '/employer/lowongan',
    'employer-post-job':     '/employer/pasang',
    'employer-candidates':   '/employer/kandidat',
    'employer-verification': '/employer/verifikasi',
    'employer-upload':       '/employer/upload',
    'employer-profile':      '/employer/profil',
}

const useStore = create(
    persist(
        (set, get) => ({
            // ─── Router bridge ───────────────────────────────────────────
            _setRouterNavigate: (fn) => { _routerNavigate = fn },

            // ─── Auth ────────────────────────────────────────────────────
            isAuthenticated: false,
            userRole: null, // 'seeker' | 'employer' | 'admin' | null
            user: { id: null, name: '', email: '', role: null, createdAt: null },
            authToken: null,

            showAuthModal: false,
            authTab: 'login',
            preferredAuthRole: null,

            openAuthModal: (tab = 'login', preferredRole = null) =>
                set({ showAuthModal: true, authTab: tab, preferredAuthRole: preferredRole }),
            closeAuthModal: () => set({ showAuthModal: false, preferredAuthRole: null }),
            setAuthTab: (tab) => set({ authTab: tab }),

            login: async (email, password) => {
                const res = await loginUser({ email, password })
                const { access_token, user } = res
                setAuthToken(access_token)
                const resolvedRole = user.role
                const homeView = resolvedRole === 'employer'
                    ? 'employer-dashboard'
                    : 'seeker-dashboard'
                set({
                    isAuthenticated: true,
                    userRole: resolvedRole,
                    user: { id: user.id, name: user.name, email: user.email, role: resolvedRole, createdAt: new Date().toISOString() },
                    authToken: access_token,
                    showAuthModal: false,
                    activeView: homeView,
                    seekerId: null,
                    matches: [],
                    applications: [],
                })
                const displayName = (user.name || '').trim() || (resolvedRole === 'employer' ? 'Tim HR' : 'Pencari Kerja')
                toast.success(`Selamat datang, ${displayName}!`, { id: 'auth-success' })

                const store = get()
                store.navigate(homeView)
                if (resolvedRole === 'seeker') {
                    store.syncSavedJobs()
                    store.loadSeekerProfile()
                    store.loadApplications()
                } else if (resolvedRole === 'employer') {
                    store.refreshEmployerJobs()
                    store.loadEmployerProfile()
                }
                store.loadExperiments()
                return res
            },

            register: async (name, email, password, role) => {
                const res = await registerUser({ name, email, password, role })
                const { access_token, user } = res
                setAuthToken(access_token)
                const homeView = user.role === 'employer' ? 'employer-dashboard' : 'seeker-dashboard'
                set({
                    isAuthenticated: true,
                    userRole: user.role,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: new Date().toISOString() },
                    authToken: access_token,
                    showAuthModal: false,
                    activeView: homeView,
                    seekerId: null,
                    matches: [],
                    applications: [],
                })
                const displayName = (user.name || '').trim() || (user.role === 'employer' ? 'Tim HR' : 'Pencari Kerja')
                toast.success(`Akun dibuat — selamat datang, ${displayName}!`, { id: 'auth-success' })
                const store = get()
                store.navigate(homeView)
                if (user.role === 'employer') {
                    store.refreshEmployerJobs()
                    store.loadEmployerProfile()
                }
                store.loadExperiments()
                return res
            },

            logout: () => {
                setAuthToken(null)
                set({
                    isAuthenticated: false,
                    userRole: null,
                    user: { id: null, name: '', email: '', role: null, createdAt: null },
                    activeView: 'home',
                    floatingAdvisorOpen: false,
                    seekerId: null,
                    matches: [],
                    authToken: null,
                    savedJobs: [],
                    applications: [],
                    experiments: {},
                    advisorLog: [
                        { role: 'assistant', content: 'Halo! Saya advisor karier KerjaCerdas. Tanya apa saja seputar pekerjaan, skill, atau CV kamu.' },
                    ],
                })
            },

            // ─── Navigation (role-aware + URL sync) ─────────────────────
            activeView: 'home',
            sidebarCollapsed: false,
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

            // selectedCandidateJobId: so employer dashboard passes job context to candidates page
            selectedCandidateJobId: null,

            navigate: (view) => {
                const { isAuthenticated, userRole, openAuthModal } = get()
                if (view === 'home') {
                    set({ activeView: 'home' })
                    if (_routerNavigate) {
                        _routerNavigate('/')
                    }
                    window.scrollTo({ top: 0, behavior: 'instant' })
                    return
                }
                if (view === 'pricing') {
                    set({ activeView: 'home' })
                    if (_routerNavigate) {
                        _routerNavigate('/')
                    }
                    setTimeout(() => {
                        const el = document.getElementById('harga')
                        if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 76
                            window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                    }, 120)
                    return
                }
                if (PUBLIC_VIEWS.has(view)) {
                    set({ activeView: view })
                    if (_routerNavigate && VIEW_TO_PATH[view]) {
                        _routerNavigate(VIEW_TO_PATH[view])
                    }
                    return
                }
                if (!isAuthenticated) {
                    toast('Silakan masuk dulu', { icon: '🔒' })
                    openAuthModal('login', view.startsWith('employer') ? 'employer' : 'seeker')
                    return
                }
                const allowed = ALLOWED_VIEWS[userRole]
                if (!allowed || !allowed.has(view)) {
                    toast.error('Fitur ini tidak tersedia untuk peran Anda')
                    return
                }
                set({ activeView: view })
                if (_routerNavigate && VIEW_TO_PATH[view]) {
                    _routerNavigate(VIEW_TO_PATH[view])
                }
            },

            // Navigate to candidates page with a specific job pre-selected
            navigateToCandidates: (jobId) => {
                set({ selectedCandidateJobId: jobId })
                get().navigate('employer-candidates')
            },

            // ─── Floating advisor ────────────────────────────────────────
            floatingAdvisorOpen: false,
            toggleFloatingAdvisor: () => set((s) => ({ floatingAdvisorOpen: !s.floatingAdvisorOpen })),

            // ─── Seeker profile + matching ───────────────────────────────
            profile: {
                full_name: '', headline: '', region_code: '3171',
                skills: [], experience: [], education: [],
                salary_expectation_min: 0, salary_expectation_max: 0,
            },
            updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

            loadSeekerProfile: async () => {
                try {
                    const data = await fetchSeekerProfile()
                    set({
                        profile: {
                            full_name: data.full_name || '',
                            headline: data.headline || '',
                            region_code: data.region_code || '3171',
                            skills: data.skills || [],
                            experience: data.experience || [],
                            education: data.education || [],
                            salary_expectation_min: data.salary_expectation_min || 0,
                            salary_expectation_max: data.salary_expectation_max || 0,
                            // Verification status from backend
                            ktp_verified: data.ktp_verified || false,
                            ijazah_verified: data.ijazah_verified || false,
                            phone_verified: data.phone_verified || false,
                        },
                        seekerId: data.id,
                    })
                } catch (err) {
                    // Profile doesn't exist yet (404) is expected for new users
                    if (err?.status && err.status !== 404) {
                        console.error('Failed to load seeker profile:', err)
                    }
                }
            },

            seekerId: null,
            profileDirty: false,
            matches: [],
            missingSkills: [],
            matchingSkills: [],
            recommendedCourses: [],
            agentLoading: false,
            agentError: null,
            advisorLog: [
                { role: 'assistant', content: 'Halo! Saya advisor karier KerjaCerdas. Tanya apa saja seputar pekerjaan, skill, atau CV kamu.' },
            ],
            advisorInput: '',
            setAdvisorInput: (v) => set({ advisorInput: v }),
            advisorSessionId: null,
            targetJobTitle: null,

            // ─── Skill gap ───────────────────────────────────────────────
            skillGapResult: null,
            skillGapLoading: false,
            skillGapError: null,

            runSkillGap: async (targetJobId = null) => {
                set({ skillGapLoading: true, skillGapError: null })
                try {
                    const res = await triggerSkillGap(targetJobId)
                    set({ skillGapResult: res, skillGapLoading: false })
                    return res
                } catch (e) {
                    set({ skillGapLoading: false, skillGapError: e.message })
                    console.warn('Skill gap analysis notification:', e?.message || e)
                }
            },

            loadSkillGap: async () => {
                set({ skillGapLoading: true, skillGapError: null })
                try {
                    const res = await fetchLatestSkillGap()
                    set({ skillGapResult: res || null, skillGapLoading: false })
                    return res
                } catch (e) {
                    if (e.status !== 404) {
                        set({ skillGapError: e.message })
                    }
                    set({ skillGapLoading: false })
                }
            },

            runAgent: async ({ message, targetJobId, explicitIntent, filters } = {}) => {
                const { seekerId, profile, advisorLog, advisorSessionId } = get()
                const userMsg = message ? { role: 'user', content: message } : null
                if (userMsg) set({ advisorLog: [...advisorLog, userMsg], advisorInput: '' })
                set({ agentLoading: true, agentError: null })
                try {
                    const activeSessionId = advisorSessionId || seekerId || 'demo'
                    const payload = seekerId
                        ? { seekerId, message, targetJobId, explicitIntent, sessionId: activeSessionId, filters }
                        : { seeker: { ...profile, user_id: 'demo' }, message, targetJobId, explicitIntent, sessionId: 'demo', filters }
                    const res = await invokeAgent(payload)
                    set({
                        agentLoading: false,
                        matches: res.matches || [],
                        missingSkills: res.missing_skills || [],
                        matchingSkills: res.matching_skills || [],
                        recommendedCourses: res.recommended_courses || [],
                        targetJobTitle: res.target_job_title || null,
                        ...(res.seeker_id ? { seekerId: res.seeker_id } : {}),
                        profileDirty: false,
                    })
                    if (res.final_response && message) {
                        set((s) => ({ advisorLog: [...s.advisorLog, { role: 'assistant', content: res.final_response }] }))
                    }
                    return res
                } catch (e) {
                    set({ agentLoading: false, agentError: e.message })
                    console.warn('AI Agent inference notification:', e?.message || e)
                    // If user was actively chatting, respond inside the chat UI instead of an alarming global red toast
                    if (message) {
                        set((s) => ({
                            advisorLog: [
                                ...s.advisorLog,
                                {
                                    role: 'assistant',
                                    content: 'Saat ini asisten AI sedang menyelesaikan antrean permintaan analisis. Rekomendasi karir dan skor keselarasan profil Anda tetap dapat diakses langsung melalui dashboard.'
                                }
                            ]
                        }))
                    }
                }
            },

            // ─── Applications tracking (3.2) ─────────────────────────────
            applications: [],
            applicationsLoading: false,

            loadApplications: async () => {
                set({ applicationsLoading: true })
                try {
                    const data = await fetchApplications()
                    set({ applications: Array.isArray(data) ? data : [], applicationsLoading: false })
                } catch (err) {
                    console.error('Failed to load applications:', err)
                    set({ applicationsLoading: false })
                }
            },

            applyJob: async (jobId, coverLetter = '') => {
                try {
                    const res = await applyToJob(jobId, coverLetter)
                    if (res.already_applied) {
                        toast('Sudah melamar ke lowongan ini', { icon: '✓' })
                    } else {
                        toast.success('Lamaran terkirim!')
                        // Refresh applications after applying
                        get().loadApplications()
                    }
                    return res
                } catch (e) {
                    toast.error('Gagal melamar: ' + e.message)
                }
            },

            // ─── CV upload ───────────────────────────────────────────────
            cvUploading: false,
            uploadResume: async (file) => {
                if (!file) return
                const { user } = get()
                set({ cvUploading: true })
                try {
                    const res = await uploadCV({ userId: user.id || 'demo', file })
                    set({ seekerId: res.seeker_id, cvUploading: false })
                    toast.success(res.parsed_offline
                        ? 'CV diparse (mode offline) — tambah GEMINI_API_KEY untuk hasil lebih akurat.'
                        : `CV diparse: ${res.summary?.skills_count || 0} skill terdeteksi`)

                    await get().loadSeekerProfile()

                    const updated = get().profile
                    const name = updated?.full_name || 'Rekan'

                    set({
                        profileDirty: true,
                        advisorSessionId: `${res.seeker_id}_${Date.now()}`,
                        advisorLog: [
                            { role: 'assistant', content: `Halo ${name}! Saya AI Advisor KerjaCerdas. CV kamu sudah dianalisis. Ada yang bisa saya bantu terkait peluang karier atau skill gap kamu?` }
                        ]
                    })
                    return res
                } catch (e) {
                    set({ cvUploading: false })
                    toast.error('Upload CV gagal: ' + e.message)
                }
            },

            // ─── Employer job-pack upload ────────────────────────────────
            jobPackUploading: false,
            jobPackResult: null,
            uploadJobPack: async (file) => {
                if (!file) return
                const { user } = get()
                set({ jobPackUploading: true, jobPackResult: null })
                try {
                    const res = await uploadJobPack({ userId: user.id || 'demo', file })
                    set({ jobPackUploading: false, jobPackResult: res })
                    toast.success(`${res.created_job_ids?.length || 0} lowongan berhasil dibuat dari PDF`)
                    get().refreshEmployerJobs()
                    return res
                } catch (e) {
                    set({ jobPackUploading: false })
                    toast.error('Upload job-pack gagal: ' + e.message)
                }
            },

            // ─── Saved jobs ───────────────────────────────────────────────
            savedJobs: [],

            syncSavedJobs: async () => {
                try {
                    const data = await fetchBookmarks()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    set({
                        savedJobs: items.map(b => ({
                            job_id: b.job_id,
                            title: b.title || '—',
                            company: b.company || '—',
                            salary_range: b.salary_range || (b.salary_min
                                ? `Rp ${(b.salary_min / 1e6).toFixed(0)}–${(b.salary_max / 1e6).toFixed(0)}jt`
                                : null),
                            location: b.region_code
                                ? (b.remote_allowed ? `${b.region_code} · Remote` : b.region_code)
                                : null,
                            remote_allowed: b.remote_allowed || false,
                            savedAt: b.saved_at,
                        }))
                    })
                } catch (err) {
                    if (err?.status && err.status !== 404) {
                        console.error('Failed to sync saved jobs:', err)
                    }
                }
            },

            toggleSaveJob: async (job) => {
                const { savedJobs, isAuthenticated, userRole } = get()
                const id = job.job_id || job.id
                const exists = savedJobs.find(j => (j.job_id || j.id) === id)

                if (exists) {
                    set({ savedJobs: savedJobs.filter(j => (j.job_id || j.id) !== id) })
                } else {
                    set({ savedJobs: [...savedJobs, { ...job, job_id: id, savedAt: new Date().toISOString() }] })
                }

                if (isAuthenticated && userRole === 'seeker') {
                    try {
                        if (exists) {
                            await removeBookmark(id)
                        } else {
                            await addBookmark(id)
                        }
                    } catch (e) {
                        set({ savedJobs })
                        toast.error('Gagal simpan: ' + e.message)
                    }
                }
            },

            isJobSaved: (id) => get().savedJobs.some(j => (j.job_id || j.id) === id),

            computeProfileCompleteness: () => {
                const { profile, seekerId } = get()
                let score = 0
                if (seekerId) score += 20
                if ((profile.skills || []).length > 0) score += 25
                if ((profile.experience || []).length > 0) score += 25
                if ((profile.education || []).length > 0) score += 20
                if (profile.salary_expectation_min > 0) score += 10
                return score
            },

            // ─── Public jobs feed ────────────────────────────────────────
            jobs: [],
            jobsLoading: false,
            refreshJobs: async () => {
                set({ jobsLoading: true })
                try {
                    const data = await fetchJobs()
                    set({ jobs: data.items || [], jobsLoading: false })
                } catch (err) {
                    console.error('Failed to fetch public jobs:', err)
                    set({ jobsLoading: false })
                }
            },

            // ─── Employer-scoped jobs feed ───────────────────────────────
            employerJobs: [],
            employerJobsLoading: false,
            employerProfile: null,
            refreshEmployerJobs: async () => {
                set({ employerJobsLoading: true })
                try {
                    const data = await fetchEmployerJobs()
                    set({ employerJobs: data.items || [], employerJobsLoading: false })
                } catch (err) {
                    console.error('Failed to fetch employer jobs:', err)
                    set({ employerJobsLoading: false })
                }
            },

            loadEmployerProfile: async () => {
                try {
                    const data = await fetchEmployerProfile()
                    set({ employerProfile: data })
                } catch (err) {
                    // Profile might not exist yet (404)
                    if (err?.status && err.status !== 404) {
                        console.error('Failed to load employer profile:', err)
                    }
                }
            },

            // ─── A/B Experiments ─────────────────────────────────────────
            experiments: {},
            loadExperiments: async () => {
                try {
                    const data = await fetchExperimentAssignments()
                    set({ experiments: data || {} })
                } catch (err) {
                    console.warn('Non-critical: Failed to load experiment assignments:', err)
                }
            },
            getExperiment: (name) => get().experiments[name] ?? null,

            // ─── Event Tracking ──────────────────────────────────────────
            trackEvent: (eventType, extra = {}) => {
                const { user, experiments } = get()
                const abVariant = experiments[extra.experiment] ?? null
                trackEvent(eventType, {
                    session_id: user?.id || 'anonymous',
                    ab_variant: abVariant,
                    ...extra,
                })
            },

            // ─── API health ──────────────────────────────────────────────
            apiStatus: 'unknown',
            checkApi: async () => {
                try { await healthCheck(); set({ apiStatus: 'connected' }) }
                catch { set({ apiStatus: 'offline' }) }
            },

            // ─── UI ──────────────────────────────────────────────────────
            isMobileMenuOpen: false,
            setMobileMenuOpen: (v) => set({ isMobileMenuOpen: v }),
        }),
        {
            name: 'kerjacerdas-v4',
            partialize: (s) => ({
                isAuthenticated: s.isAuthenticated,
                userRole: s.userRole,
                user: s.user,
                profile: s.profile,
                seekerId: s.seekerId,
                savedJobs: s.savedJobs,
                sidebarCollapsed: s.sidebarCollapsed,
                authToken: s.authToken,
                selectedCandidateJobId: s.selectedCandidateJobId,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.authToken) {
                    setAuthToken(state.authToken)
                }
            },
        }
    )
)

export default useStore
