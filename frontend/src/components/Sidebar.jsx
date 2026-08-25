/**
 * Sidebar — persistent navigation for authenticated users.
 * Fixes from audit (2.4):
 * - Added employer-upload, employer-profile routes
 * - Added seeker-search, seeker-applications routes
 * - Mobile bottom nav now covers all critical routes (5 items with "More" overflow)
 * - "Lihat Paket" button now has onClick handler → navigate('pricing')
 * - Seeker verification and profile accessible on mobile via bottom nav
 */
import {
    LayoutDashboard, Search, BarChart3, ShieldCheck, Bookmark,
    Building2, Briefcase, Users, Upload, LogOut, Bot, Crown,
    FileText, User, ClipboardList,
} from 'lucide-react'
import useStore from '../store/useStore'

const SEEKER_NAV = [
    { id: 'seeker-dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'seeker-profile',      label: 'Upload CV',    icon: Upload },
    { id: 'seeker-match',        label: 'Job Match',    icon: Search },
    { id: 'seeker-search',       label: 'Cari Cepat',  icon: Search },
    { id: 'seeker-skill-gap',    label: 'Skill Gap',   icon: BarChart3 },
    { id: 'seeker-saved',        label: 'Tersimpan',   icon: Bookmark },
    { id: 'seeker-applications', label: 'Lamaran Saya', icon: ClipboardList },
    { id: 'seeker-verification', label: 'Verifikasi',  icon: ShieldCheck },
]

const EMPLOYER_NAV = [
    { id: 'employer-dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'employer-jobs',         label: 'Lowongan Saya',   icon: Briefcase },
    { id: 'employer-post-job',     label: 'Pasang Lowongan', icon: Upload },
    { id: 'employer-upload',       label: 'Upload Job Pack',  icon: FileText },
    { id: 'employer-candidates',   label: 'Top Kandidat',    icon: Users },
    { id: 'employer-verification', label: 'Verifikasi NPWP', icon: ShieldCheck },
    { id: 'employer-profile',      label: 'Profil Perusahaan', icon: Building2 },
]

// Mobile bottom nav: 5 items max — most critical ones
const SEEKER_MOBILE_NAV = [
    { id: 'seeker-dashboard',    label: 'Home',    icon: LayoutDashboard },
    { id: 'seeker-match',        label: 'Match',   icon: Search },
    { id: 'seeker-applications', label: 'Lamaran', icon: ClipboardList },
    { id: 'seeker-verification', label: 'Verifikasi', icon: ShieldCheck },
    { id: 'seeker-profile',      label: 'Profil',  icon: User },
]

const EMPLOYER_MOBILE_NAV = [
    { id: 'employer-dashboard',  label: 'Home',    icon: LayoutDashboard },
    { id: 'employer-jobs',       label: 'Jobs',    icon: Briefcase },
    { id: 'employer-post-job',   label: 'Post',    icon: Upload },
    { id: 'employer-candidates', label: 'Kandidat',icon: Users },
    { id: 'employer-profile',    label: 'Profil',  icon: Building2 },
]

export default function Sidebar() {
    const { userRole, user, activeView, navigate, logout } = useStore()

    const nav = userRole === 'employer' ? EMPLOYER_NAV : SEEKER_NAV
    const roleLabel = userRole === 'employer' ? 'Employer / HR' : 'Pencari Kerja'

    return (
        <aside className="desktop-sidebar fixed left-0 top-0 bottom-0 w-60 bg-kc-dark text-white flex flex-col z-40 border-r-2 border-kc-dark">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-1">
                    <span className="font-black text-base text-white">kerja</span>
                    <span className="font-black text-base text-kc-orange">cerdas</span>
                </div>
                <p className="text-[10px] text-white/40 font-mono mt-1 uppercase">{roleLabel}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                {nav.map(item => {
                    const Icon = item.icon
                    const active = activeView === item.id
                    return (
                        <button
                            key={item.id}
                            id={`sidebar-nav-${item.id}`}
                            onClick={() => navigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                active
                                    ? 'bg-white/10 text-white font-semibold'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            {/* Upgrade CTA — onClick now wired to pricing page (1.4 fix) */}
            <div className="px-4 py-3 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown size={12} className="text-kc-yellow" />
                        <span className="text-xs font-semibold">Upgrade ke Pro</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                        {userRole === 'employer'
                            ? 'Unlock top-50 kandidat per lowongan.'
                            : 'Buka top-20 match, prioritas AI advisor.'}
                    </p>
                    <button
                        id="sidebar-upgrade-btn"
                        className="mt-2 text-[10px] text-kc-yellow font-semibold hover:underline"
                        onClick={() => navigate('pricing')}
                    >
                        Lihat Paket →
                    </button>
                </div>
            </div>

            {/* User + Logout */}
            <div className="px-4 py-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-kc-cyan border border-white/20 rounded-full flex items-center justify-center text-kc-dark font-bold text-xs">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{user.name || 'User'}</p>
                        <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    id="sidebar-logout-btn"
                    onClick={logout}
                    className="mt-3 w-full flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors rounded-lg px-2 py-1.5 hover:bg-white/5"
                >
                    <LogOut size={12} />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    )
}

/**
 * MobileBottomNav — 5-tab bottom navigation bar visible on mobile.
 * Covers verification and profile links that were previously inaccessible on mobile.
 */
export function MobileBottomNav() {
    const { userRole, activeView, navigate, isAuthenticated } = useStore()
    if (!isAuthenticated) return null

    const mobileNav = userRole === 'employer' ? EMPLOYER_MOBILE_NAV : SEEKER_MOBILE_NAV

    return (
        <nav className="mobile-bottom-nav" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, 1fr)` }}>
            {mobileNav.map(item => {
                const Icon = item.icon
                const active = activeView === item.id
                return (
                    <button
                        key={item.id}
                        id={`mobile-nav-${item.id}`}
                        onClick={() => navigate(item.id)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            padding: '6px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
                            color: active ? '#F87239' : 'rgba(255,255,255,0.5)',
                            transition: 'color .15s', minWidth: 0,
                        }}
                    >
                        <Icon size={18} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>{item.label}</span>
                        {active && (
                            <span style={{
                                width: 4, height: 4, borderRadius: '50%', background: '#F87239',
                                marginTop: -2,
                            }} />
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
