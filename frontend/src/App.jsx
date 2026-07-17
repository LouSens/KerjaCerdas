import { useEffect, useState } from 'react'

import useStore from './store/useStore'

import PublicHeader from './components/PublicHeader'
import Sidebar, { MobileBottomNav } from './components/Sidebar'
import FloatingAdvisor from './components/FloatingAdvisor'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'

// Public views
import LandingHero from './components/LandingHero'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import PricingPage from './components/PricingPage'
import AboutPage from './components/AboutPage'

// Seeker views
import SeekerDashboard from './components/SeekerDashboard'
import SeekerMatchResults from './components/SeekerMatchResults'
import SkillGapPanel from './components/SkillGapPanel'
import SavedJobsPage from './components/SavedJobsPage'
import VerificationDashboard from './components/VerificationDashboard'
import CVUploader from './components/CVUploader'
import SeekerSearch from './components/SeekerSearch'

// Employer views
import EmployerDashboard from './components/EmployerDashboard'
import EmployerJobs from './components/EmployerJobs'
import EmployerPostJob from './components/EmployerPostJob'
import EmployerCandidates from './components/EmployerCandidates'
import EmployerVerification from './components/EmployerVerification'
import JobPackUploader from './components/JobPackUploader'
import EmployerProfile from './components/EmployerProfile'
import OnboardingWizard from './components/OnboardingWizard'


/**
 * App — role-aware shell.
 *   • Unauthenticated → PublicHeader + marketing pages.
 *   • Authenticated   → Sidebar + role-scoped content area + FloatingAdvisor.
 */
export default function App() {
    const { isAuthenticated, userRole, sidebarCollapsed, activeView, matches, checkApi, seekerId, profile } = useStore()
    const [showOnboarding, setShowOnboarding] = useState(false)

    useEffect(() => { checkApi() }, [checkApi])

    // Show onboarding wizard for new seekers who haven't uploaded a CV yet
    useEffect(() => {
        if (isAuthenticated && userRole === 'seeker' && !seekerId && !(profile?.skills?.length > 0)) {
            const timer = setTimeout(() => setShowOnboarding(true), 800)
            return () => clearTimeout(timer)
        }
    }, [isAuthenticated, userRole, seekerId, profile?.skills?.length])

    return (
        <div className="min-h-screen bg-kc-cream font-sans text-kc-dark">
            <AuthModal />
            {showOnboarding && (
                <OnboardingWizard onClose={() => setShowOnboarding(false)} />
            )}

            {!isAuthenticated ? <PublicLayout view={activeView} /> : (
                <div className="flex">
                    <Sidebar />
                    <main
                        className="mobile-main flex-1 min-h-screen transition-[margin] duration-200 ml-60"
                    >
                        <div className="max-w-5xl mx-auto px-6 py-8">
                            <AuthedView view={activeView} userRole={userRole} matches={matches} />
                        </div>
                    </main>
                    <MobileBottomNav />
                    <FloatingAdvisor />
                </div>
            )}
        </div>
    )
}

function PublicLayout({ view }) {
    if (view === 'home') return <LandingHero />
    return (
        <>
            <PublicHeader />
            <main className="pt-20">
                {view === 'pricing' && <PricingPage />}
                {view === 'about' && <AboutPage />}
                {view === 'privacy' && <PrivacyPolicyPage />}
            </main>
            <Footer />
        </>
    )
}

function AuthedView({ view, userRole, matches }) {
    if (userRole === 'seeker') {
        if (view === 'seeker-dashboard')    return <SeekerDashboard />
        if (view === 'seeker-match')        return <SeekerMatchResults />
        if (view === 'seeker-skill-gap')    return <SkillGapPanel />
        if (view === 'seeker-saved')        return <SavedJobsPage />
        if (view === 'seeker-verification') return <VerificationDashboard />
        if (view === 'seeker-profile')      return <CVUploader />
        if (view === 'seeker-search')       return <SeekerSearch />
    }

    if (userRole === 'employer') {
        if (view === 'employer-dashboard')    return <EmployerDashboard />
        if (view === 'employer-jobs')         return <EmployerJobs />
        if (view === 'employer-post-job')     return <EmployerPostJob />
        if (view === 'employer-candidates')   return <EmployerCandidates />
        if (view === 'employer-verification') return <EmployerVerification />
        if (view === 'employer-upload')       return <JobPackUploader />
        if (view === 'employer-profile')      return <EmployerProfile />
    }


    if (view === 'pricing') return <PricingPage />
    if (view === 'about') return <AboutPage />
    if (view === 'privacy') return <PrivacyPolicyPage />
    if (view === 'home') {
        if (userRole === 'seeker') return <SeekerDashboard />
        if (userRole === 'employer') return <EmployerDashboard />
        return <p className="text-sm text-kc-gray">Silakan buka menu dari sidebar.</p>
    }

    return <p className="text-sm text-kc-gray">Halaman tidak ditemukan untuk peran Anda.</p>
}


