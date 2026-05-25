import {
    LayoutDashboard, Search, BarChart3, ShieldCheck, Bookmark,
    Building2, Briefcase, Users, Upload, LogOut, Bot, Crown,
} from 'lucide-react'
import useStore from '../store/useStore'

const SEEKER_NAV = [
    { id: 'seeker-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seeker-profile', label: 'Upload CV', icon: Upload },
    { id: 'seeker-match', label: 'Job Match', icon: Search },
    { id: 'seeker-skill-gap', label: 'Skill Gap', icon: BarChart3 },
    { id: 'seeker-saved', label: 'Tersimpan', icon: Bookmark },
    { id: 'seeker-verification', label: 'Verifikasi', icon: ShieldCheck },
]

const EMPLOYER_NAV = [
    { id: 'employer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employer-jobs', label: 'Lowongan', icon: Briefcase },
    { id: 'employer-post-job', label: 'Pasang Lowongan', icon: Upload },
    { id: 'employer-candidates', label: 'Top Kandidat', icon: Users },
    { id: 'employer-verification', label: 'Verifikasi NPWP', icon: ShieldCheck },
]



export default function Sidebar() {
    const { userRole, user, activeView, navigate, logout } = useStore()

    const nav = userRole === 'employer' ? EMPLOYER_NAV : SEEKER_NAV

    const roleLabel = userRole === 'employer' ? 'Employer / HR' : 'Pencari Kerja'

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-60 bg-kc-dark text-white flex flex-col z-40 border-r-2 border-kc-dark">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-1">
                    <span className="font-black text-base text-white">kerja</span>
                    <span className="font-black text-base text-kc-orange">cerdas</span>
                </div>
                <p className="text-[10px] text-white/40 font-mono mt-1 uppercase">{roleLabel}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {nav.map(item => {
                    const Icon = item.icon
                    const active = activeView === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                                active
                                    ? 'bg-white/10 text-white font-semibold'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{item.label}</span>
                            {item.id === 'employer-candidates' && (
                                <span className="ml-auto bg-kc-yellow text-kc-dark text-[10px] font-bold px-1.5 py-0.5">PRO</span>
                            )}
                        </button>
                    )
                })}
            </nav>

            {/* Upgrade CTA */}
            <div className="px-4 py-3 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown size={12} className="text-kc-yellow" />
                        <span className="text-xs font-semibold">Upgrade ke Pro</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                        {userRole === 'employer'
                            ? 'Unlock top-50 kandidat per lowongan.'
                            : 'Buka top-20 match, prioritas AI advisor.'}
                    </p>
                    <button className="mt-2 text-[10px] text-kc-yellow font-semibold hover:underline">
                        Lihat Paket
                    </button>
                </div>
            </div>

            {/* User + Logout */}
            <div className="px-4 py-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-kc-cyan border border-white/20 flex items-center justify-center text-kc-dark font-bold text-xs">
                        {(user.name || 'U').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{user.name || 'User'}</p>
                        <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-3 w-full flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
                >
                    <LogOut size={12} />
                    <span>Keluar</span>
                </button>
            </div>
        </aside>
    )
}
