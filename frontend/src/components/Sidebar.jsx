/**
 * Sidebar — persistent navigation for authenticated users.
 * Optimized with Enterprise Neobrutalism theme, categorized navigation groups,
 * live badge counters, and ergonomic compact layout.
 */
import {
    LayoutDashboard, Search, BarChart3, ShieldCheck, Bookmark,
    Building2, Briefcase, Users, Upload, LogOut, Crown,
    FileText, User, ClipboardList, Sparkles, PlusCircle, CheckCircle2,
} from 'lucide-react'
import useStore from '../store/useStore'

const SEEKER_GROUPS = [
    {
        title: 'Utama',
        items: [
            { id: 'seeker-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'seeker-search', label: 'Cari Lowongan', icon: Search },
            { id: 'seeker-match', label: 'Pencocokan AI', icon: Sparkles, badge: 'AI', badgeBg: '#FF4800' },
        ],
    },
    {
        title: 'Aktivitas & Karir',
        items: [
            { id: 'seeker-applications', label: 'Lamaran Saya', icon: ClipboardList, countKey: 'applications', defaultCount: 3 },
            { id: 'seeker-saved', label: 'Tersimpan', icon: Bookmark, countKey: 'savedJobs', defaultCount: 2 },
            { id: 'seeker-skill-gap', label: 'Skill Gap & Kursus', icon: BarChart3 },
        ],
    },
    {
        title: 'Profil & Kredibilitas',
        items: [
            { id: 'seeker-profile', label: 'Upload CV', icon: Upload },
            { id: 'seeker-verification', label: 'Verifikasi E-KYC', icon: ShieldCheck, statusKey: 'ktp_verified' },
        ],
    },
]

const EMPLOYER_GROUPS = [
    {
        title: 'Utama',
        items: [
            { id: 'employer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'employer-jobs', label: 'Lowongan Saya', icon: Briefcase, countKey: 'employerJobs', defaultCount: 4 },
        ],
    },
    {
        title: 'Rekrutmen & Talenta',
        items: [
            { id: 'employer-post-job', label: 'Pasang Lowongan', icon: PlusCircle },
            { id: 'employer-upload', label: 'Upload Job Pack', icon: FileText, badge: 'PDF' },
            { id: 'employer-candidates', label: 'Top Kandidat', icon: Users, badge: 'AI', badgeBg: '#FF4800' },
        ],
    },
    {
        title: 'Perusahaan & Legalitas',
        items: [
            { id: 'employer-verification', label: 'Verifikasi NPWP', icon: ShieldCheck, statusKey: 'npwp_verified' },
            { id: 'employer-profile', label: 'Profil Perusahaan', icon: Building2 },
        ],
    },
]

// Mobile bottom nav: 5 items max
const SEEKER_MOBILE_NAV = [
    { id: 'seeker-dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'seeker-search', label: 'Cari', icon: Search },
    { id: 'seeker-match', label: 'Match', icon: Sparkles },
    { id: 'seeker-applications', label: 'Lamaran', icon: ClipboardList },
    { id: 'seeker-verification', label: 'Verifikasi', icon: ShieldCheck },
]

const EMPLOYER_MOBILE_NAV = [
    { id: 'employer-dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'employer-jobs', label: 'Lowongan', icon: Briefcase },
    { id: 'employer-post-job', label: 'Pasang', icon: PlusCircle },
    { id: 'employer-candidates', label: 'Kandidat', icon: Users },
    { id: 'employer-profile', label: 'Profil', icon: Building2 },
]

export default function Sidebar() {
    const { userRole, user, activeView, navigate, logout, applications, savedJobs, employerJobs, profile } = useStore()

    const groups = userRole === 'employer' ? EMPLOYER_GROUPS : SEEKER_GROUPS
    const roleLabel = userRole === 'employer' ? 'Employer / HR' : 'Pencari Kerja'
    const roleBadgeBg = userRole === 'employer' ? '#FF4800' : '#00B8D9'

    // Compute live badge count or label
    const getBadge = (item) => {
        if (item.badge) {
            return { text: item.badge, bg: item.badgeBg || '#334155', color: '#FFFFFF' }
        }
        if (item.countKey === 'applications') {
            const count = (applications && applications.length) || item.defaultCount
            return count ? { text: String(count), bg: 'rgba(255,255,255,0.15)', color: '#FFFFFF' } : null
        }
        if (item.countKey === 'savedJobs') {
            const count = (savedJobs && savedJobs.length) || item.defaultCount
            return count ? { text: String(count), bg: 'rgba(255,255,255,0.15)', color: '#FFFFFF' } : null
        }
        if (item.countKey === 'employerJobs') {
            const count = (employerJobs && employerJobs.length) || item.defaultCount
            return count ? { text: String(count), bg: 'rgba(255,255,255,0.15)', color: '#FFFFFF' } : null
        }
        if (item.statusKey && profile?.[item.statusKey]) {
            return { text: '✓', bg: '#10B981', color: '#FFFFFF' }
        }
        return null
    }

    return (
        <aside
            className="desktop-sidebar fixed left-0 top-0 bottom-0 w-64 bg-[#090A0F] text-white flex flex-col z-40 border-r-2 border-[#090A0F]"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
        >
            {/* Brand Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <div
                        className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => navigate('home')}
                    >
                        <div style={{
                            width: 26, height: 26, borderRadius: 6, background: '#FF4800',
                            border: '1.5px solid #FFFFFF', display: 'grid', placeItems: 'center',
                            boxShadow: '1.5px 1.5px 0 #FFFFFF', transform: 'rotate(-3deg)',
                        }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                                <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-black text-lg tracking-tight text-white">
                            kerja<span className="text-[#FF4800]">cerdas</span>
                        </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                        <span style={{
                            padding: '2px 8px', fontSize: 10, fontWeight: 900,
                            background: roleBadgeBg, color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                            {roleLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Categorized Navigation Groups */}
            <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto custom-scrollbar">
                {groups.map((grp, gIdx) => (
                    <div key={gIdx}>
                        <div style={{
                            fontSize: 10,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            color: 'rgba(255,255,255,0.35)',
                            padding: '0 8px 4px',
                        }}>
                            {grp.title}
                        </div>
                        <div className="space-y-1">
                            {grp.items.map(item => {
                                const Icon = item.icon
                                const active = activeView === item.id
                                const badge = getBadge(item)

                                return (
                                    <button
                                        key={item.id}
                                        id={`sidebar-nav-${item.id}`}
                                        onClick={() => navigate(item.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            fontWeight: active ? 800 : 600,
                                            background: active ? '#FAF9F5' : 'transparent',
                                            color: active ? '#090A0F' : 'rgba(255,255,255,0.7)',
                                            border: active ? '1.5px solid #FAF9F5' : '1.5px solid transparent',
                                            boxShadow: active ? '3px 3px 0 #FF4800' : 'none',
                                            transform: active ? 'translate(-1px, -1px)' : 'none',
                                            transition: 'all 0.12s ease',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                                                e.currentTarget.style.color = '#FFFFFF'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                                            <Icon
                                                size={16}
                                                strokeWidth={active ? 2.5 : 2}
                                                color={active ? '#FF4800' : 'currentColor'}
                                                style={{ flexShrink: 0 }}
                                            />
                                            <span className="truncate">{item.label}</span>
                                        </div>

                                        {badge && (
                                            <span style={{
                                                padding: '1px 6px',
                                                borderRadius: 999,
                                                fontSize: 10,
                                                fontWeight: 800,
                                                background: active ? (badge.bg === '#FF4800' ? '#FF4800' : '#090A0F') : badge.bg,
                                                color: active && badge.bg !== '#FF4800' ? '#FFFFFF' : badge.color,
                                                border: active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                                lineHeight: 1.2,
                                                flexShrink: 0,
                                            }}>
                                                {badge.text}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Streamlined Enterprise CTA */}
            <div className="px-3 py-2.5 border-t border-white/10">
                <div style={{
                    background: '#141724',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}>
                    <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-1.5">
                            <Crown size={13} className="text-[#FFC800] flex-shrink-0" />
                            <span className="text-xs font-black text-white truncate">KerjaCerdas PRO</span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {userRole === 'employer' ? 'Akses ATS & Kandidat' : 'Prioritas AI Advisor'}
                        </p>
                    </div>
                    <button
                        id="sidebar-upgrade-btn"
                        onClick={() => navigate('pricing')}
                        style={{
                            padding: '4px 8px',
                            background: '#FFC800',
                            color: '#090A0F',
                            border: '1px solid #090A0F',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 900,
                            cursor: 'pointer',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Upgrade →
                    </button>
                </div>
            </div>

            {/* Ergonomic User Bar + Logout */}
            <div className="px-3 py-2.5 border-t border-white/10 flex items-center justify-between gap-2 bg-[#090A0F]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div style={{
                        width: 28, height: 28, borderRadius: 6, background: '#00B8D9',
                        border: '1px solid #FFFFFF', display: 'grid', placeItems: 'center',
                        color: '#090A0F', fontWeight: 900, fontSize: 12, flexShrink: 0,
                    }}>
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-white truncate leading-tight">
                            {user?.name || 'Pengguna'}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono truncate leading-tight">
                            {user?.email || '—'}
                        </p>
                    </div>
                </div>
                <button
                    id="sidebar-logout-btn"
                    onClick={logout}
                    title="Keluar Akun"
                    style={{
                        padding: '6px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#FCA5A5',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#EF4444'
                        e.currentTarget.style.color = '#FFFFFF'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'
                        e.currentTarget.style.color = '#FCA5A5'
                    }}
                >
                    <LogOut size={13} />
                </button>
            </div>
        </aside>
    )
}

/**
 * MobileBottomNav — 5-tab bottom navigation bar visible on mobile.
 */
export function MobileBottomNav() {
    const { userRole, activeView, navigate, isAuthenticated } = useStore()
    if (!isAuthenticated) return null

    const mobileNav = userRole === 'employer' ? EMPLOYER_MOBILE_NAV : SEEKER_MOBILE_NAV

    return (
        <nav
            className="mobile-bottom-nav"
            style={{
                gridTemplateColumns: `repeat(${mobileNav.length}, 1fr)`,
                background: '#090A0F',
                borderTop: '2px solid #090A0F',
            }}
        >
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
                            color: active ? '#FF4800' : 'rgba(255,255,255,0.5)',
                            transition: 'color .15s', minWidth: 0,
                        }}
                    >
                        <Icon size={18} />
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>{item.label}</span>
                        {active && (
                            <span style={{
                                width: 4, height: 4, borderRadius: '50%', background: '#FF4800',
                                marginTop: -2,
                            }} />
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
