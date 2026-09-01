import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import useStore from './store/useStore'

import PublicHeader from './components/PublicHeader'
import Sidebar, { MobileBottomNav } from './components/Sidebar'
import FloatingAdvisor from './components/FloatingAdvisor'
import EmployerHelpPanel from './components/EmployerHelpPanel'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import OnboardingWizard from './components/OnboardingWizard'

// Public views
import LandingHero from './components/LandingHero'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import AboutPage from './components/AboutPage'

// Seeker views
import SeekerDashboard from './components/SeekerDashboard'
import SeekerMatchResults from './components/SeekerMatchResults'
import SkillGapPanel from './components/SkillGapPanel'
import SavedJobsPage from './components/SavedJobsPage'
import VerificationDashboard from './components/VerificationDashboard'
import CVUploader from './components/CVUploader'
import SeekerSearch from './components/SeekerSearch'
import ApplicationsPage from './components/ApplicationsPage'

// Employer views
import EmployerDashboard from './components/EmployerDashboard'
import EmployerJobs from './components/EmployerJobs'
import EmployerPostJob from './components/EmployerPostJob'
import EmployerCandidates from './components/EmployerCandidates'
import EmployerVerification from './components/EmployerVerification'
import JobPackUploader from './components/JobPackUploader'
import EmployerProfile from './components/EmployerProfile'

// ── Route map: view key ↔ URL path ─────────────────────────────────────────
export const VIEW_TO_PATH = {
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

export const PATH_TO_VIEW = {
    '/':                     'home',
    '/harga':                'pricing',
    '/tentang':              'about',
    '/privasi':              'privacy',
    '/dashboard':            'seeker-dashboard',
    '/lowongan':             'seeker-match',
    '/skill-gap':            'seeker-skill-gap',
    '/tersimpan':            'seeker-saved',
    '/verifikasi':           'seeker-verification',
    '/profil':               'seeker-profile',
    '/cari':                 'seeker-search',
    '/lamaran':              'seeker-applications',
    '/employer/dashboard':   'employer-dashboard',
    '/employer/lowongan':    'employer-jobs',
    '/employer/pasang':      'employer-post-job',
    '/employer/kandidat':    'employer-candidates',
    '/employer/verifikasi':  'employer-verification',
    '/employer/upload':      'employer-upload',
    '/employer/profil':      'employer-profile',
}

/**
 * NavigationSync — bridges React Router ↔ Zustand store.
 * Keeps URL and activeView in sync without breaking existing store logic.
 */
function NavigationSync() {
    const location = useLocation()
    const reactNavigate = useNavigate()

    // Register the react-router navigate function into the store bridge
    useEffect(() => {
        useStore.getState()._setRouterNavigate(reactNavigate)
        return () => useStore.getState()._setRouterNavigate(null)
    }, [reactNavigate])

    // Sync activeView when URL changes (browser back/forward, direct navigation)
    useEffect(() => {
        const view = PATH_TO_VIEW[location.pathname]
        if (view && view !== useStore.getState().activeView) {
            useStore.setState({ activeView: view })
        }
    }, [location.pathname])

    return null
}

/**
 * ProtectedRoute — redirects to home if not authenticated or wrong role.
 */
function ProtectedRoute({ children, role }) {
    const { isAuthenticated, userRole } = useStore()
    if (!isAuthenticated) return <Navigate to="/" replace />
    if (role && userRole !== role) return <Navigate to="/" replace />
    return children
}

/**
 * AppShell — the authenticated layout wrapper (sidebar + main content).
 */
function AppShell({ children }) {
    const { seekerId, profile, isAuthenticated, userRole } = useStore()
    const showOnboarding = isAuthenticated && userRole === 'seeker' &&
        !seekerId && !(profile?.skills?.length > 0)

    return (
        <div className="flex min-h-screen bg-kc-cream w-full overflow-x-hidden">
            {showOnboarding && (
                <OnboardingWizard onClose={() => {
                    // Wizard closed — stay on current page
                }} />
            )}
            <Sidebar />
            <main className="mobile-main flex-1 min-h-screen transition-[margin] duration-200 md:ml-64 ml-0 w-full max-w-full overflow-x-hidden">
                <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 w-full box-border">
                    {children}
                </div>
            </main>
            <MobileBottomNav />
            <FloatingAdvisor />
            <EmployerHelpPanel />
        </div>
    )
}

/**
 * App — root component with react-router-dom Routes.
 * BrowserRouter is already in main.jsx.
 */
export default function App() {
    const { checkApi } = useStore()
    useEffect(() => { checkApi() }, [checkApi])

    return (
        <div className="min-h-screen bg-kc-cream font-sans text-kc-dark">
            <NavigationSync />
            <AuthModal />

            <Routes>
                {/* ── Public routes ───────────────────────────────────────────── */}
                <Route path="/" element={<LandingHero />} />
                <Route path="/harga" element={<Navigate to="/" replace />} />
                <Route path="/tentang" element={<AboutPage />} />
                <Route path="/privasi" element={<PrivacyPolicyPage />} />

                {/* ── Seeker routes ─────────────────────────── */}
                <Route path="/dashboard" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><SeekerDashboard /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/lowongan" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><SeekerMatchResults /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/skill-gap" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><SkillGapPanel /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/tersimpan" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><SavedJobsPage /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/verifikasi" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><VerificationDashboard /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/profil" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><CVUploader /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/cari" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><SeekerSearch /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/lamaran" element={
                    <ProtectedRoute role="seeker">
                        <AppShell><ApplicationsPage /></AppShell>
                    </ProtectedRoute>
                } />

                {/* ── Employer routes ───────────────────────── */}
                <Route path="/employer/dashboard" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerDashboard /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/lowongan" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerJobs /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/pasang" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerPostJob /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/kandidat" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerCandidates /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/verifikasi" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerVerification /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/upload" element={
                    <ProtectedRoute role="employer">
                        <AppShell><JobPackUploader /></AppShell>
                    </ProtectedRoute>
                } />
                <Route path="/employer/profil" element={
                    <ProtectedRoute role="employer">
                        <AppShell><EmployerProfile /></AppShell>
                    </ProtectedRoute>
                } />

                {/* ── Catch-all → home ──────────────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}
