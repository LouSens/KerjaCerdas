/**
 * KerjaCerdas — Global State Store (Zustand)
 *
 * Per Protocol §7: State management via Zustand.
 * Handles: auth, user roles (seeker/employer), profile, matches,
 * chat, saved jobs, employer job postings, UI state.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { matchJobs, analyzeSkillGap, getCareerAdvice } from '../services/api'
import toast from 'react-hot-toast'

const useStore = create(
    persist(
        (set, get) => ({
            // ══════════════════════════════════════════════════════════════════
            //  AUTH & USER
            // ══════════════════════════════════════════════════════════════════

            /** @type {'seeker'|'employer'|null} */
            userRole: null,
            isAuthenticated: false,
            showAuthModal: false,
            authTab: 'login', // 'login' | 'register'
            preferredAuthRole: null, // 'seeker' | 'employer' | null

            user: {
                id: null,
                name: '',
                email: '',
                avatar: null,
                role: null,
                createdAt: null,
            },

            /**
             * Opens the authentication modal.
             */
            openAuthModal: (tab = 'login', preferredRole = null) => set({
                showAuthModal: true,
                authTab: tab,
                preferredAuthRole: preferredRole,
            }),

            /**
             * Closes the authentication modal.
             */
            closeAuthModal: () => set({ showAuthModal: false, preferredAuthRole: null }),

            /**
             * Switches between login and register tabs.
             */
            setAuthTab: (tab) => set({ authTab: tab }),

            /**
             * Simulates user login. In production, this calls the auth API.
             */
            login: (email, password, role) => {
                // Demo: simulate successful login
                const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                set({
                    isAuthenticated: true,
                    userRole: role,
                    showAuthModal: false,
                    user: {
                        id: crypto.randomUUID(),
                        name,
                        email,
                        avatar: null,
                        role,
                        createdAt: new Date().toISOString(),
                    },
                })
                toast.success(`Selamat datang, ${name}! 🎉`)
            },

            /**
             * Simulates user registration. In production, this calls the auth API.
             */
            register: (name, email, password, role) => {
                set({
                    isAuthenticated: true,
                    userRole: role,
                    showAuthModal: false,
                    user: {
                        id: crypto.randomUUID(),
                        name,
                        email,
                        avatar: null,
                        role,
                        createdAt: new Date().toISOString(),
                    },
                })
                toast.success(`Akun berhasil dibuat! Selamat datang, ${name}! 🎉`)
            },

            /**
             * Logs the user out and resets auth state.
             */
            logout: () => {
                set({
                    isAuthenticated: false,
                    userRole: null,
                    user: { id: null, name: '', email: '', avatar: null, role: null, createdAt: null },
                    activeTab: 'home',
                })
                toast('Kamu telah logout', { icon: '👋' })
            },

            // ══════════════════════════════════════════════════════════════════
            //  NAVIGATION
            // ══════════════════════════════════════════════════════════════════

            activeTab: 'home',
            setActiveTab: (tab) => {
                const state = get()
                const { isAuthenticated, userRole, openAuthModal } = state

                const protectedTabs = ['match', 'gap', 'dashboard', 'saved', 'verification', 'advisor']
                const employerTabs = ['employer']

                // Protect seeker features
                if (protectedTabs.includes(tab)) {
                    if (!isAuthenticated) {
                        toast('Silakan Masuk untuk mengakses fitur ini', { icon: '🔒', id: 'auth-toast' })
                        openAuthModal('login', 'seeker')
                        return
                    }
                    if (userRole !== 'seeker') {
                        toast.error('Akses Ditolak: Fitur ini khusus untuk Pencari Kerja')
                        return
                    }
                }

                // Protect employer features
                if (employerTabs.includes(tab)) {
                    if (!isAuthenticated) {
                        toast('Silakan Masuk sebagai Pemberi Kerja', { icon: '🔒', id: 'auth-toast' })
                        openAuthModal('login', 'employer')
                        return
                    }
                    if (userRole !== 'employer') {
                        toast.error('Akses Ditolak: Fitur ini khusus untuk Pemberi Kerja')
                        return
                    }
                }

                set({ activeTab: tab })
            },

            // ══════════════════════════════════════════════════════════════════
            //  SEEKER PROFILE
            // ══════════════════════════════════════════════════════════════════

            profile: {
                name: '',
                skills: '',
                experience_years: 0,
                education_level: 'S1',
                region_code: '3171',
                salary_expectation: 10000000,
            },
            updateProfile: (field, value) =>
                set((s) => ({ profile: { ...s.profile, [field]: value } })),

            // ══════════════════════════════════════════════════════════════════
            //  JOB MATCHING (SEEKER)
            // ══════════════════════════════════════════════════════════════════

            matches: [],
            matchLoading: false,
            matchError: null,
            lastSearchTime: null,

            /**
             * Searches for matching jobs via the AI matching API.
             */
            searchJobs: async () => {
                const { profile } = get()
                set({ matchLoading: true, matchError: null })
                try {
                    const seekerProfile = {
                        ...profile,
                        skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
                    }
                    const data = await matchJobs(seekerProfile, 10)
                    set({
                        matches: data.matches || [],
                        matchLoading: false,
                        lastSearchTime: new Date().toISOString(),
                        activeTab: 'match',
                    })
                    toast.success(`${(data.matches || []).length} lowongan ditemukan!`)
                } catch (err) {
                    set({ matchError: err.message, matchLoading: false })
                    toast.error('Gagal mencari pekerjaan. Cek koneksi API.')
                }
            },

            // ══════════════════════════════════════════════════════════════════
            //  SKILL GAP
            // ══════════════════════════════════════════════════════════════════

            selectedJob: null,
            skillGap: null,
            skillGapLoading: false,

            selectJob: (job) => set({ selectedJob: job }),

            /**
             * Analyzes the skill gap between the seeker's skills and required skills.
             */
            analyzeGap: async (requiredSkills) => {
                const { profile } = get()
                set({ skillGapLoading: true })
                try {
                    const seekerSkills = profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
                    const data = await analyzeSkillGap(seekerSkills, requiredSkills)
                    set({ skillGap: data, skillGapLoading: false })
                    toast.success('Analisis skill gap selesai!')
                } catch {
                    set({ skillGapLoading: false })
                    toast.error('Gagal menganalisis skill gap')
                }
            },

            // ══════════════════════════════════════════════════════════════════
            //  SAVED JOBS (SEEKER)
            // ══════════════════════════════════════════════════════════════════

            savedJobs: [],

            /**
             * Toggles a job's saved/bookmark status.
             */
            toggleSaveJob: (job) => {
                const { savedJobs } = get()
                const exists = savedJobs.find((j) => j.job_id === job.job_id)
                if (exists) {
                    set({ savedJobs: savedJobs.filter((j) => j.job_id !== job.job_id) })
                    toast('Bookmark dihapus', { icon: '🗑️' })
                } else {
                    set({ savedJobs: [...savedJobs, { ...job, savedAt: new Date().toISOString() }] })
                    toast.success('Lowongan disimpan!')
                }
            },

            /**
             * Checks if a job is saved/bookmarked.
             */
            isJobSaved: (jobId) => {
                return get().savedJobs.some((j) => j.job_id === jobId)
            },

            // ══════════════════════════════════════════════════════════════════
            //  AI ADVISOR CHAT
            // ══════════════════════════════════════════════════════════════════

            chatMessages: [
                {
                    role: 'assistant',
                    content:
                        'Halo! 👋 Saya asisten karier AI KerjaCerdas. Saya bisa membantu kamu dengan:\n\n' +
                        '• **Saran karier** yang sesuai dengan skill kamu\n' +
                        '• **Tips CV** untuk pasar kerja Indonesia\n' +
                        '• **Negosiasi gaji** dan benchmark salary\n' +
                        '• **Roadmap belajar** untuk skill yang dibutuhkan\n\n' +
                        'Silakan ceritakan tentang diri kamu atau tanyakan apa saja! 😊',
                },
            ],
            chatInput: '',
            chatLoading: false,

            setChatInput: (val) => set({ chatInput: val }),

            /**
             * Sends a message to the AI advisor.
             */
            sendMessage: async (overrideMessage) => {
                const { chatInput, chatMessages, profile } = get()
                const message = overrideMessage || chatInput
                if (!message.trim()) return

                const userMsg = { role: 'user', content: message }
                set({
                    chatMessages: [...chatMessages, userMsg],
                    chatInput: '',
                    chatLoading: true,
                })

                try {
                    const seekerProfile = {
                        ...profile,
                        skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
                    }
                    const data = await getCareerAdvice(message, seekerProfile, chatMessages)
                    const assistantMsg = { role: 'assistant', content: data.response || data.response_text || 'Terima kasih atas pertanyaannya.' }
                    set((s) => ({
                        chatMessages: [...s.chatMessages, assistantMsg],
                        chatLoading: false,
                    }))
                } catch {
                    const errorMsg = {
                        role: 'assistant',
                        content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi. 🙏',
                    }
                    set((s) => ({
                        chatMessages: [...s.chatMessages, errorMsg],
                        chatLoading: false,
                    }))
                }
            },

            /**
             * Resets the chat conversation.
             */
            clearChat: () => set({
                chatMessages: [
                    {
                        role: 'assistant',
                        content: 'Chat direset! 🔄 Silakan tanyakan apa saja tentang karier kamu.',
                    },
                ],
            }),

            // ══════════════════════════════════════════════════════════════════
            //  EMPLOYER — JOB POSTINGS
            // ══════════════════════════════════════════════════════════════════

            postedJobs: [],

            /**
             * Adds a new job posting (employer).
             */
            postJob: (jobData) => {
                const newJob = {
                    ...jobData,
                    job_id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    posted_at: new Date().toISOString(),
                    status: 'active',
                    applicants: 0,
                    views: Math.floor(Math.random() * 50) + 5,
                }
                set((s) => ({ postedJobs: [newJob, ...s.postedJobs] }))
                toast.success('Lowongan berhasil dipublikasikan! 🎉')
            },

            /**
             * Removes a posted job (employer).
             */
            removePostedJob: (jobId) => {
                set((s) => ({
                    postedJobs: s.postedJobs.filter((j) => j.job_id !== jobId),
                }))
                toast('Lowongan dihapus', { icon: '🗑️' })
            },

            /**
             * Toggles job posting status between active and paused.
             */
            toggleJobStatus: (jobId) => {
                set((s) => ({
                    postedJobs: s.postedJobs.map((j) =>
                        j.job_id === jobId
                            ? { ...j, status: j.status === 'active' ? 'paused' : 'active' }
                            : j
                    ),
                }))
                toast.success('Status lowongan diperbarui')
            },

            // ══════════════════════════════════════════════════════════════════
            //  API STATUS
            // ══════════════════════════════════════════════════════════════════

            apiStatus: 'unknown',
            setApiStatus: (status) => set({ apiStatus: status }),

            // ══════════════════════════════════════════════════════════════════
            //  UI STATE
            // ══════════════════════════════════════════════════════════════════

            isMobileMenuOpen: false,
            setMobileMenuOpen: (val) => set({ isMobileMenuOpen: val }),
        }),
        {
            name: 'kerjacerdas-storage',
            partialize: (state) => ({
                profile: state.profile,
                savedJobs: state.savedJobs,
                isAuthenticated: state.isAuthenticated,
                userRole: state.userRole,
                user: state.user,
                postedJobs: state.postedJobs,
            }),
        }
    )
)

export default useStore
