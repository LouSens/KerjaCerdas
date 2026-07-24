/**
 * KerjaCerdas — Zustand store.
 *
 * Single source of truth for: auth (seeker / employer / admin), profile,
 * matches, chat, saved jobs, uploads, sidebar + floating advisor UI state.
 *
 * The router is *role-based*. Pre-login, only `home`, `pricing`, `about`,
 * `privacy` are reachable. Post-login, allowed views depend on `userRole`.
 *
 * Saved jobs are persisted both locally (localStorage via Zustand persist)
 * and synced to the backend /seeker/bookmarks endpoint for cross-device access.
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
    fetchApplications,
    applyToJob,
    fetchEmployerProfile,
    updateEmployerProfile,
    trackEvent,
    fetchExperimentAssignments,
} from '../services/api'

const PUBLIC_VIEWS = new Set(['home', 'pricing', 'about', 'privacy'])


const ALLOWED_VIEWS = {
    seeker: new Set([
        'seeker-dashboard', 'seeker-match', 'seeker-skill-gap',
        'seeker-verification', 'seeker-saved', 'seeker-profile', 'seeker-search',
    ]),
    employer: new Set([
        'employer-dashboard', 'employer-jobs', 'employer-candidates',
        'employer-post-job', 'employer-verification', 'employer-upload', 'employer-profile',
    ]),
}

const useStore = create(
    persist(
        (set, get) => ({
            // ─── Auth ────────────────────────────────────────────────────
            isAuthenticated: false,
            userRole: null, // 'seeker' | 'employer' | 'admin' | null
            user: { id: null, name: '', email: '', role: null, createdAt: null },
            authToken: null,  // JWT token — set by real login (real auth flow)

            showAuthModal: false,
            authTab: 'login',
            preferredAuthRole: null,

            openAuthModal: (tab = 'login', preferredRole = null) =>
                set({ showAuthModal: true, authTab: tab, preferredAuthRole: preferredRole }),
            closeAuthModal: () => set({ showAuthModal: false, preferredAuthRole: null }),
            setAuthTab: (tab) => set({ authTab: tab }),

            // Hits backend /auth/login → JWT + user.
            login: async (email, password) => {
                const res = await loginUser({ email, password })
                const { access_token, user } = res
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
                })
                toast.success(`Selamat datang, ${user.name}!`)

                // Post-login side effects: hydrate data from backend
                const store = get()
                if (resolvedRole === 'seeker') {
                    store.syncSavedJobs()
                    store.loadSeekerProfile()
                } else if (resolvedRole === 'employer') {
                    store.refreshEmployerJobs()
                    store.loadEmployerProfile()
                }
                // Fetch A/B experiment assignments for this user
                store.loadExperiments()
                return res
            },

            // Hits backend /auth/register → JWT + user.
            register: async (name, email, password, role) => {
                const res = await registerUser({ name, email, password, role })
                const { access_token, user } = res
                set({
                    isAuthenticated: true,
                    userRole: user.role,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: new Date().toISOString() },
                    authToken: access_token,
                    showAuthModal: false,
                    activeView: user.role === 'employer' ? 'employer-dashboard' : 'seeker-dashboard',
                    seekerId: null,
                    matches: [],
                })
                toast.success(`Akun ${user.role} dibuat — selamat datang ${user.name}!`)
                if (user.role === 'employer') {
                    get().refreshEmployerJobs()
                    get().loadEmployerProfile()
                }
                // Fetch A/B experiment assignments for this user
                get().loadExperiments()
                return res
            },

            logout: () => {
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
                    experiments: {},
                    advisorLog: [
                        { role: 'assistant', content: 'Halo! Saya advisor karier KerjaCerdas. Tanya apa saja seputar pekerjaan, skill, atau CV kamu.' },
                    ],
                })
                // toast removed as per user request
            },

            // ─── Navigation (role-aware) ─────────────────────────────────
            activeView: 'home',
            sidebarCollapsed: false,
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

            navigate: (view) => {
                const { isAuthenticated, userRole, openAuthModal } = get()
                if (PUBLIC_VIEWS.has(view)) return set({ activeView: view })
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
            },

            // ─── Floating advisor (bottom-right bubble) ──────────────────
            floatingAdvisorOpen: false,
            toggleFloatingAdvisor: () => set((s) => ({ floatingAdvisorOpen: !s.floatingAdvisorOpen })),

            // ─── Seeker profile + matching ───────────────────────────────
            profile: {
                full_name: '', headline: '', region_code: '3171',
                skills: [], experience: [], education: [],
                salary_expectation_min: 0, salary_expectation_max: 0,
            },
            updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

            // Load seeker profile from backend and hydrate store
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
                        },
                        seekerId: data.id,
                    })
                } catch {
                    // Profile doesn't exist yet — normal for new users
                }
            },

            seekerId: null,
            matches: [],
            missingSkills: [],
            matchingSkills: [],
            recommendedCourses: [],
            applications: [],
            agentLoading: false,
            agentError: null,
            advisorLog: [
                { role: 'assistant', content: 'Halo! Saya advisor karier KerjaCerdas. Tanya apa saja seputar pekerjaan, skill, atau CV kamu.' },
            ],
            advisorInput: '',
            setAdvisorInput: (v) => set({ advisorInput: v }),
            advisorSessionId: null,

            runAgent: async ({ message, targetJobId, explicitIntent } = {}) => {
                const { seekerId, profile, advisorLog, advisorSessionId } = get()
                const userMsg = message ? { role: 'user', content: message } : null
                if (userMsg) set({ advisorLog: [...advisorLog, userMsg], advisorInput: '' })
                set({ agentLoading: true, agentError: null })
                try {
                    const activeSessionId = advisorSessionId || seekerId || 'demo'
                    const payload = seekerId
                        ? { seekerId, message, targetJobId, explicitIntent, sessionId: activeSessionId }
                        : { seeker: { ...profile, user_id: 'demo' }, message, targetJobId, explicitIntent, sessionId: 'demo' }
                    const res = await invokeAgent(payload)
                    set({
                        agentLoading: false,
                        matches: res.matches || [],
                        missingSkills: res.missing_skills || [],
                        matchingSkills: res.matching_skills || [],
                        recommendedCourses: res.recommended_courses || [],
                        ...(res.seeker_id ? { seekerId: res.seeker_id } : {}),
                    })
                    if (res.final_response && message) {
                        set((s) => ({ advisorLog: [...s.advisorLog, { role: 'assistant', content: res.final_response }] }))
                    }
                    return res
                } catch (e) {
                    set({ agentLoading: false, agentError: e.message })
                    console.error('Agent gagal — cek backend', e)
                }
            },

            loadApplications: async () => {
                try {
                    const data = await fetchApplications()
                    set({ applications: Array.isArray(data) ? data : [] })
                } catch {
                    // Silently ignore
                }
            },

            applyJob: async (jobId, coverLetter = '') => {
                try {
                    const res = await applyToJob(jobId, coverLetter)
                    if (res.already_applied) {
                        toast('Sudah melamar ke lowongan ini', { icon: '✓' })
                    } else {
                        toast.success('Lamaran terkirim! +50 XP')
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
                        : `CV diparse: ${res.summary.skills_count} skill terdeteksi`)
                    
                    // Reload full profile from backend after CV upload
                    await get().loadSeekerProfile()
                    
                    const updated = get().profile
                    const name = updated?.full_name || 'Rekan'
                    
                    set({
                        advisorSessionId: `${res.seeker_id}_${Date.now()}`,
                        advisorLog: [
                            { role: 'assistant', content: `Halo ${name}! Saya AI Advisor KerjaCerdas. Saya telah menganalisis CV baru yang Anda unggah. Ada yang bisa saya bantu terkait peluang karier atau skill gap Anda?` }
                        ]
                    })
                } catch (e) {
                    set({ cvUploading: false })
                    toast.error('Upload CV gagal: ' + e.message)
                }
            },

            // ─── Employer job-pack upload ────────────────────────────────
            jobPackUploading: false,
            uploadJobPack: async (file) => {
                if (!file) return
                const { user } = get()
                set({ jobPackUploading: true })
                try {
                    const res = await uploadJobPack({ userId: user.id || 'demo', file })
                    set({ jobPackUploading: false })
                    toast.success(`${res.created_job_ids.length} lowongan dibuat`)
                    get().refreshEmployerJobs()  // refresh employer-scoped list
                } catch (e) {
                    set({ jobPackUploading: false })
                    toast.error('Upload job-pack gagal')
                }
            },

            // ─── Saved jobs — synced to backend ──────────────────────────
            savedJobs: [],

            // Load saved jobs from backend (called on login)
            syncSavedJobs: async () => {
                try {
                    const data = await fetchBookmarks()
                    const items = Array.isArray(data) ? data : (data.items || [])
                    set({
                        savedJobs: items.map(b => ({
                            job_id: b.job_id,
                            title: b.title || '—',
                            company: b.company || '—',
                            savedAt: b.saved_at,
                        }))
                    })
                } catch {
                    // Silently ignore — user may not have a seeker profile yet
                }
            },

            toggleSaveJob: async (job) => {
                const { savedJobs, isAuthenticated, userRole } = get()
                const id = job.job_id || job.id
                const exists = savedJobs.find(j => (j.job_id || j.id) === id)

                // Optimistic update
                if (exists) {
                    set({ savedJobs: savedJobs.filter(j => (j.job_id || j.id) !== id) })
                } else {
                    set({ savedJobs: [...savedJobs, { ...job, job_id: id, savedAt: new Date().toISOString() }] })
                }

                // Sync to backend if authenticated as seeker
                if (isAuthenticated && userRole === 'seeker') {
                    try {
                        if (exists) {
                            await removeBookmark(id)
                        } else {
                            await addBookmark(id)
                        }
                    } catch (e) {
                        // Revert optimistic update on failure
                        set({ savedJobs })
                        toast.error('Gagal simpan: ' + e.message)
                    }
                }
            },

            isJobSaved: (id) => get().savedJobs.some(j => (j.job_id || j.id) === id),

            computeProfileCompleteness: () => {
                const { profile, seekerId } = get()
                let score = 0
                if (seekerId) score += 20                           // CV uploaded
                if ((profile.skills || []).length > 0) score += 25  // Has skills
                if ((profile.experience || []).length > 0) score += 25 // Has experience
                if ((profile.education || []).length > 0) score += 20 // Has education
                if (profile.salary_expectation_min > 0) score += 10  // Salary set
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
                } catch {
                    set({ jobsLoading: false })
                }
            },

            // ─── Employer-scoped jobs feed ───────────────────────────────
            // Separate from public jobs — auth-gated, returns only this employer's postings
            employerJobs: [],
            employerJobsLoading: false,
            employerProfile: null,
            refreshEmployerJobs: async () => {
                set({ employerJobsLoading: true })
                try {
                    const data = await fetchEmployerJobs()
                    set({ employerJobs: data.items || [], employerJobsLoading: false })
                } catch {
                    set({ employerJobsLoading: false })
                }
            },

            loadEmployerProfile: async () => {
                try {
                    const data = await fetchEmployerProfile()
                    set({ employerProfile: data })
                } catch {
                    // Profile might not exist yet
                }
            },


            // ─ A/B Experiments ──────────────────────────────────────────
            // Keyed by experiment name, value is the assigned variant string.
            experiments: {},
            loadExperiments: async () => {
                try {
                    const data = await fetchExperimentAssignments()
                    set({ experiments: data || {} })
                } catch {
                    // Non-critical — app works without A/B data
                }
            },
            getExperiment: (name) => get().experiments[name] ?? null,

            // ─ Event Tracking ──────────────────────────────────────────
            // Fire-and-forget analytics. Called by components on key actions.
            trackEvent: (eventType, extra = {}) => {
                const { user, experiments } = get()
                const abVariant = experiments[extra.experiment] ?? null
                trackEvent(eventType, {
                    session_id: user?.id || 'anonymous',
                    ab_variant: abVariant,
                    ...extra,
                })
            },

            // ─ API health ──────────────────────────────────────────
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
            name: 'kerjacerdas-v3',
            partialize: (s) => ({
                isAuthenticated: s.isAuthenticated,
                userRole: s.userRole,
                user: s.user,
                profile: s.profile,
                seekerId: s.seekerId,
                savedJobs: s.savedJobs,
                sidebarCollapsed: s.sidebarCollapsed,
                authToken: s.authToken,
                activeView: s.activeView,
            }),
        }
    )
)

export default useStore
