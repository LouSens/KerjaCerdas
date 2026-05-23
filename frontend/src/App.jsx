import { useEffect } from 'react'
import useStore from './store/useStore'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import LandingHero from './components/LandingHero'
import SearchForm from './components/SearchForm'
import JobCard from './components/JobCard'
import SkillGapPanel from './components/SkillGapPanel'
import AdvisorChat from './components/AdvisorChat'
import DashboardPage from './components/DashboardPage'
import SavedJobsPage from './components/SavedJobsPage'
import EmployerDashboard from './components/EmployerDashboard'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import Footer from './components/Footer'
import VerificationDashboard from './components/VerificationDashboard'

/**
 * App — Root component with role-aware routing.
 */
export default function App() {
    const { activeTab, matches, matchError, isAuthenticated, userRole } = useStore()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [activeTab])

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-brand-500 selection:text-white">
            <AuthModal />
            <Header />

            <main className="flex-1 w-full bg-surface-50 relative pt-24 pb-12">
                {/* Subtle grid background to enhance brutalist neo-minimalist look */}
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4D4D8 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.4 }} />

                <div className="relative z-10">
                    {activeTab === 'home' && <LandingHero />}

                    {activeTab === 'privacy' && <PrivacyPolicyPage />}

                    {/* SEEKER TABS */}
                    {activeTab === 'match' && (!isAuthenticated || userRole === 'seeker') && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                            <SearchForm />

                            {matchError && (
                                <div className="p-5 border-[3px] border-ink bg-rose-100 rounded-2xl animate-fade-in shadow-[4px_4px_0px_#111827]">
                                    <p className="text-base font-black text-rose-600 uppercase tracking-tight">⚠️ Server Error / API Offline</p>
                                    <p className="text-sm text-rose-600 mt-2 font-bold opacity-90">
                                        Pastikan backend berjalan: <code className="text-rose-700 font-black bg-rose-200 border-2 border-rose-300 px-2 py-0.5 rounded-md ml-1 inline-block shadow-sm">uvicorn src.api.main:app --port 8000</code>
                                    </p>
                                </div>
                            )}

                            {matches.length > 0 && (
                                <div className="animate-fade-in">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-10">
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-black text-ink uppercase tracking-tight">
                                                Hasil Matching <span className="text-white bg-ink px-2 py-0.5 rounded-lg border-2 border-ink shadow-[2px_2px_0px_#B8FF6D] transform -rotate-2 inline-block ml-1">AI</span>
                                            </h2>
                                            <p className="text-sm font-bold text-ink/70 mt-2 uppercase tracking-wider">
                                                Ditemukan {matches.length} lowongan terbaik
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-2 bg-[#B8FF6D] border-[3px] border-ink px-3 py-1.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_#111827] uppercase tracking-widest text-ink">
                                            <span className="w-2.5 h-2.5 rounded-full bg-ink animate-pulse"></span>
                                            AI Powered
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {matches.map((job, i) => (
                                            <JobCard key={job.job_id || i} job={job} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {matches.length === 0 && !matchError && (
                                <div className="text-center py-20 animate-fade-in bg-white border-[3px] border-ink rounded-[2rem] shadow-[8px_8px_0px_#111827]">
                                    <div className="w-24 h-24 rounded-[2rem] bg-[#B8FF6D] border-[4px] border-ink flex items-center justify-center text-5xl mx-auto mb-6 shadow-[6px_6px_0px_#111827] transform -rotate-3 hover:rotate-0 transition-transform">
                                        🚀
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-ink mb-4 uppercase tracking-tight">
                                        Temukan Pekerjaan Impianmu
                                    </h3>
                                    <p className="text-base text-ink font-bold max-w-md mx-auto leading-relaxed opacity-80">
                                        Isi profil di atas dan klik <span className="text-ink font-black bg-[#FFC900] border-2 border-ink shadow-[2px_2px_0px_#111827] px-2 py-0.5 rounded-lg mx-1 inline-block transform rotate-1">"Temukan Pekerjaan"</span> untuk
                                        mendapatkan rekomendasi pekerjaan yang cocok dengan skill kamu.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'gap' && (!isAuthenticated || userRole === 'seeker') && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <SkillGapPanel />
                        </div>
                    )}

                    {activeTab === 'advisor' && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <AdvisorChat />
                        </div>
                    )}

                    {activeTab === 'verification' && (!isAuthenticated || userRole === 'seeker') && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <VerificationDashboard />
                        </div>
                    )}

                    {activeTab === 'dashboard' && (!isAuthenticated || userRole === 'seeker') && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <DashboardPage />
                        </div>
                    )}

                    {activeTab === 'saved' && (!isAuthenticated || userRole === 'seeker') && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <SavedJobsPage />
                        </div>
                    )}

                    {/* EMPLOYER TABS */}
                    {activeTab === 'employer' && isAuthenticated && userRole === 'employer' && (
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                            <EmployerDashboard />
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
