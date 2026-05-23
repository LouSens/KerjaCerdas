import { useEffect, useState } from 'react'
import {
    Search, BarChart3, Bot, LayoutDashboard, Bookmark, Home, Menu, X, Zap,
    LogIn, UserPlus, LogOut, ChevronDown, Building2, Shield, User, ShieldCheck
} from 'lucide-react'
import useStore from '../store/useStore'
import { healthCheck } from '../services/api'

/**
 * Header — Top navigation with branding, role-aware tabs, auth controls,
 * API status, and mobile menu. Styled with a premium, sleek SaaS aesthetic.
 */
export default function Header() {
    const {
        activeTab, setActiveTab, apiStatus, setApiStatus,
        savedJobs, isMobileMenuOpen, setMobileMenuOpen,
        isAuthenticated, userRole, user, openAuthModal, logout
    } = useStore()
    const [scrolled, setScrolled] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

    useEffect(() => {
        healthCheck()
            .then(() => setApiStatus('connected'))
            .catch(() => setApiStatus('offline'))
    }, [setApiStatus])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const getTabs = () => {
        const commonStart = [{ id: 'home', label: 'Beranda', icon: Home }]

        if (isAuthenticated && userRole === 'employer') {
            return [
                ...commonStart,
                { id: 'employer', label: 'Dashboard', icon: Building2 },
                { id: 'advisor', label: 'AI Advisor', icon: Bot },
                { id: 'privacy', label: 'Privasi', icon: Shield },
            ]
        }

        return [
            ...commonStart,
            { id: 'match', label: 'Cari Kerja', icon: Search },
            { id: 'gap', label: 'Skill Gap', icon: BarChart3 },
            { id: 'advisor', label: 'AI Advisor', icon: Bot },
            { id: 'verification', label: 'Verifikasi', icon: ShieldCheck },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'saved', label: 'Tersimpan', icon: Bookmark, badge: savedJobs.length },
        ]
    }

    const tabs = getTabs()

    const handleTabClick = (tabId) => {
        setActiveTab(tabId)
        setMobileMenuOpen(false)
        setShowUserMenu(false)
    }

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-surface-200/60 ${scrolled ? 'py-3 shadow-sm' : 'py-5'}`}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        
                        {/* 1. Logo (Left) */}
                        <button
                            onClick={() => handleTabClick('home')}
                            className="flex-shrink-0 flex items-center gap-3 group focus:outline-none"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                                <Zap className="w-5 h-5 fill-white/20" strokeWidth={2.5} />
                            </div>
                            <div className="text-left hidden sm:block">
                                <h1 className="text-xl font-extrabold tracking-tight text-surface-900">
                                    Kerja<span className="text-brand-600">Cerdas</span>
                                </h1>
                                <p className="text-[10px] text-surface-500 font-semibold -mt-0.5 tracking-wider uppercase">
                                    AI Job Matching
                                </p>
                            </div>
                        </button>

                        {/* 2. Desktop Navigation Tabs (Center) */}
                        <nav className="hidden xl:flex justify-center items-center gap-1 px-3 bg-surface-50/50 rounded-full border border-surface-100 p-1 shadow-sm">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        onClick={() => handleTabClick(tab.id)}
                                        className={`group relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-black rounded-xl border-[2px] focus:outline-none transition-all duration-300 ${
                                            isActive 
                                              ? 'text-ink bg-[#B8FF6D] border-ink shadow-[2px_2px_0px_#111827]' 
                                              : 'text-ink/70 border-transparent hover:text-ink hover:border-ink hover:bg-white hover:shadow-[2px_2px_0px_#111827] hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'}`} strokeWidth={2.5} />
                                        <span>{tab.label}</span>
                                        {tab.badge > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm ring-2 ring-white transform scale-100 transition-transform group-hover:scale-110">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </nav>

                        {/* 3. Right Side Controls (Right) */}
                        <div className="flex-shrink-0 flex items-center justify-end gap-4">

                            {!isAuthenticated ? (
                                <div className="hidden xl:flex items-center gap-2">
                                    <button
                                        onClick={() => openAuthModal('login')}
                                        className="text-sm font-black text-ink px-4 py-2.5 rounded-xl border-[2px] border-transparent hover:border-ink hover:bg-[#FF90E8] hover:shadow-[2px_2px_0px_#111827] hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        Masuk
                                    </button>
                                    <button
                                        onClick={() => openAuthModal('register', 'seeker')}
                                        className="bg-[#00E5FF] text-ink text-sm font-black px-5 py-2.5 rounded-xl border-[2px] border-ink shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1 transition-all flex items-center gap-2"
                                    >
                                        Daftar Gratis
                                    </button>
                                </div>
                            ) : (
                                <div className="relative hidden xl:block">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-xl bg-white border-[2px] border-ink shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-0.5 transition-all focus:outline-none"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-ink border-[2px] border-ink ${
                                            userRole === 'employer' ? 'bg-[#B8FF6D]' : 'bg-[#FFC900]'
                                        }`}>
                                            {(user.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left hidden md:block">
                                            <p className="text-sm font-black text-ink truncate max-w-[120px] leading-tight">{user.name}</p>
                                            <p className="text-[10px] font-bold text-ink/70 uppercase tracking-wider leading-tight">
                                                {userRole === 'employer' ? 'Employer' : 'Pencari Kerja'}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                                    </button>

                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-surface-200/60 shadow-xl overflow-hidden z-50 animate-fade-in-up origin-top-right">
                                                <div className="p-5 border-b border-surface-100 bg-surface-50/50">
                                                    <p className="text-sm font-bold truncate text-surface-900">{user.name}</p>
                                                    <p className="text-xs font-medium text-surface-500 truncate mt-0.5">{user.email}</p>
                                                </div>

                                                <div className="flex flex-col p-2 space-y-1">
                                                    <button
                                                        onClick={() => { handleTabClick(userRole === 'employer' ? 'employer' : 'dashboard'); setShowUserMenu(false) }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4 text-surface-400" strokeWidth={2.5} />
                                                        Dashboard
                                                    </button>
                                                    <button
                                                        onClick={() => { handleTabClick('privacy'); setShowUserMenu(false) }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-100 hover:text-surface-900 transition-colors"
                                                    >
                                                        <Shield className="w-4 h-4 text-surface-400" strokeWidth={2.5} />
                                                        Privasi
                                                    </button>
                                                    <div className="h-px bg-surface-100 my-1"></div>
                                                    <button
                                                        onClick={() => { logout(); setShowUserMenu(false) }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4 text-rose-500" strokeWidth={2.5} />
                                                        Keluar Akun
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Mobile Hamburger Touch Target */}
                            <button
                                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden relative z-50 p-2.5 -mr-2 bg-transparent rounded-full hover:bg-surface-100 focus:outline-none transition-colors text-surface-700"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" strokeWidth={2.5} /> : <Menu className="w-6 h-6" strokeWidth={2.5} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* OVERLAY for Mobile Menu */}
            <div 
                className={`fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setMobileMenuOpen(false)} 
            />

            {/* MOBILE MENU (Sleek drawer from right) */}
            <div className={`fixed top-0 right-0 h-full w-[85vw] sm:w-[350px] bg-white z-50 shadow-2xl transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden flex flex-col pt-20 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Scrollable Tabs */}
                <div className="flex-1 overflow-y-auto w-full flex flex-col p-6 space-y-2">
                    <span className="text-xs font-bold tracking-wider text-surface-400 uppercase mb-2 pl-2">Menu Utama</span>
                    
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-semibold transition-all ${
                                    isActive
                                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 shadow-sm'
                                    : 'bg-transparent text-surface-700 hover:bg-surface-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand-100/50 text-brand-600' : 'bg-surface-100 text-surface-500 group-hover:text-surface-700'}`}>
                                        <Icon className="w-5 h-5" strokeWidth={2.5} />
                                    </div>
                                    {tab.label}
                                </div>
                                {tab.badge > 0 && (
                                    <span className="min-w-[1.5rem] h-6 px-2 flex items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Footer Account Section */}
                <div className="flex-shrink-0 bg-surface-50/80 p-6 border-t border-surface-100">
                    {!isAuthenticated ? (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { openAuthModal('register', 'seeker'); setMobileMenuOpen(false) }}
                                className="w-full bg-brand-600 px-4 py-3.5 rounded-xl text-base font-semibold text-white shadow-md hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" strokeWidth={2.5} /> Daftar Gratis
                            </button>
                            <button
                                onClick={() => { openAuthModal('login'); setMobileMenuOpen(false) }}
                                className="w-full bg-white border border-surface-200 px-4 py-3.5 rounded-xl text-base font-semibold text-surface-700 shadow-sm hover:bg-surface-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-5 h-5" strokeWidth={2.5} /> Masuk Akun
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner ${
                                    userRole === 'employer' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-brand-400 to-brand-600'
                                }`}>
                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-surface-900 truncate">{user.name}</p>
                                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mt-0.5">
                                        {userRole === 'employer' ? 'Employer' : 'Pencari Kerja'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { logout(); setMobileMenuOpen(false) }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-surface-200 bg-white text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors shadow-sm"
                            >
                                <LogOut className="w-4 h-4" strokeWidth={2.5} />
                                Keluar Akun
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
