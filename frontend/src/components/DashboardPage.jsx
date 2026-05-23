import { BarChart3, Briefcase, Bookmark, TrendingUp, Clock, Target, Sparkles, ArrowRight } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * DashboardPage — Analytics overview showing user's job matching
 * activity, skill progress, and saved jobs summary.
 */
export default function DashboardPage() {
    const { profile, matches, savedJobs, setActiveTab, lastSearchTime } = useStore()

    const currentSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : []
    const avgScore = matches.length > 0
        ? Math.round(matches.reduce((acc, j) => acc + (j.match_score || 0), 0) / matches.length * 100)
        : 0

    /**
     * Formats an ISO date string to relative time (baru saja, 5 menit lalu, etc).
     */
    const formatRelativeTime = (isoString) => {
        if (!isoString) return 'Belum pernah'
        const diff = Date.now() - new Date(isoString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Baru saja'
        if (mins < 60) return `${mins} menit lalu`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} jam lalu`
        return `${Math.floor(hours / 24)} hari lalu`
    }

    const stats = [
        {
            label: 'Total Matches',
            value: matches.length,
            icon: Briefcase,
            bg: 'bg-[#B8FF6D]',
            textColor: 'text-ink',
        },
        {
            label: 'Rata-rata Skor',
            value: `${avgScore}%`,
            icon: TrendingUp,
            bg: 'bg-[#00E5FF]',
            textColor: 'text-ink',
        },
        {
            label: 'Tersimpan',
            value: savedJobs.length,
            icon: Bookmark,
            bg: 'bg-[#FF90E8]',
            textColor: 'text-ink',
        },
        {
            label: 'Skills Kamu',
            value: currentSkills.length,
            icon: Sparkles,
            bg: 'bg-[#FFC900]',
            textColor: 'text-ink',
        },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#FFC900] border-[3px] border-ink rounded-xl shadow-[2px_2px_0px_#111827] transform -rotate-3">
                        <BarChart3 className="w-6 h-6 text-ink" strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-black text-ink uppercase tracking-tight">Dashboard</h2>
                </div>
                <p className="text-sm font-bold text-ink/70">
                    {profile.name ? `Selamat datang bos, ${profile.name}!` : 'Ringkasan aktivitas pencarian kerja kamu.'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, bg, textColor }) => (
                    <div key={label} className="bg-white border-[3px] border-ink rounded-2xl p-5 hover:bg-surface-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827] transition-all duration-200">
                        <div className={`w-12 h-12 rounded-xl ${bg} border-[3px] border-ink flex items-center justify-center mb-4 shadow-[2px_2px_0px_#111827]`}>
                            <Icon className={`w-6 h-6 ${textColor}`} strokeWidth={3} />
                        </div>
                        <div className={`text-4xl font-black text-ink tabular-nums mb-1`}>{value}</div>
                        <div className="text-xs font-black text-ink/60 uppercase tracking-widest">{label}</div>
                    </div>
                ))}
            </div>

            {/* Profile Summary + Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <div className="bg-white border-[3px] border-ink rounded-3xl p-6 shadow-[8px_8px_0px_#111827]">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-ink uppercase tracking-widest">
                        <Target className="w-6 h-6 text-ink" strokeWidth={3} />
                        Profil Kamu
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-ink/70">Nama</span>
                            <span className="font-black text-ink px-2 bg-surface-100 border-2 border-surface-200 rounded-md">{profile.name || '—'}</span>
                        </div>
                        <div className="w-full border-t-[3px] border-dashed border-ink/20" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-ink/70">Pendidikan</span>
                            <span className="font-black text-ink px-2 bg-surface-100 border-2 border-surface-200 rounded-md">{profile.education_level}</span>
                        </div>
                        <div className="w-full border-t-[3px] border-dashed border-ink/20" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-ink/70">Pengalaman</span>
                            <span className="font-black text-ink px-2 bg-surface-100 border-2 border-surface-200 rounded-md">{profile.experience_years} tahun</span>
                        </div>
                        <div className="w-full border-t-[3px] border-dashed border-ink/20" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-ink/70">Gaji Target</span>
                            <span className="font-black text-ink bg-[#B8FF6D] px-2 py-1 rounded-lg border-2 border-ink shadow-[2px_2px_0px_#111827] transform rotate-1">
                                Rp {(profile.salary_expectation / 1_000_000).toFixed(0)} juta
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    {currentSkills.length > 0 && (
                        <div className="mt-6 pt-6 border-t-[3px] border-ink/20">
                            <p className="text-xs text-ink/60 font-black uppercase tracking-widest mb-3">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {currentSkills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-[#FF90E8] border-2 border-ink text-ink text-xs font-black rounded-lg shadow-[2px_2px_0px_#111827]">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setActiveTab('match')}
                        className="w-full mt-6 py-3 border-[3px] border-ink bg-white font-black text-ink uppercase tracking-widest rounded-xl hover:bg-[#00E5FF] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827] transition-all flex items-center justify-center gap-2"
                    >
                        Edit Profil
                        <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>

                {/* Activity Card */}
                <div className="bg-white border-[3px] border-ink rounded-3xl p-6 shadow-[8px_8px_0px_#111827] flex flex-col">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-ink uppercase tracking-widest">
                        <Clock className="w-6 h-6 text-ink" strokeWidth={3} />
                        Aktivitas Terkini
                    </h3>

                    <div className="space-y-4 flex-1">
                        {/* Last search */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border-2 border-ink/20 hover:border-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111827] transition-all">
                            <div className="w-12 h-12 rounded-xl bg-[#00E5FF] border-[3px] border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111827]">
                                <Briefcase className="w-6 h-6 text-ink" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-ink uppercase">Pencarian Terakhir</p>
                                <p className="text-xs font-bold text-ink/60">{formatRelativeTime(lastSearchTime)}</p>
                            </div>
                            <span className="text-sm text-ink font-black tabular-nums bg-white px-2 py-1 border-[3px] border-ink rounded-lg shadow-[2px_2px_0px_#111827]">{matches.length} KENA</span>
                        </div>

                        {/* Saved jobs count */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border-2 border-ink/20 hover:border-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111827] transition-all">
                            <div className="w-12 h-12 rounded-xl bg-[#FFC900] border-[3px] border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111827]">
                                <Bookmark className="w-6 h-6 text-ink" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-ink uppercase">Diincar</p>
                                <p className="text-xs font-bold text-ink/60">{savedJobs.length} lowongan</p>
                            </div>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className="text-xs text-ink bg-white border-2 border-ink px-3 py-1.5 rounded-lg hover:bg-[#B8FF6D] hover:shadow-[2px_2px_0px_#111827] font-black uppercase flex items-center gap-1 transition-all"
                            >
                                Sikat
                                <ArrowRight className="w-4 h-4" strokeWidth={3} />
                            </button>
                        </div>

                        {/* Top match */}
                        {matches.length > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border-2 border-ink/20 hover:border-ink hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111827] transition-all">
                                <div className="w-12 h-12 rounded-xl bg-[#FF90E8] border-[3px] border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111827]">
                                    <TrendingUp className="w-6 h-6 text-ink" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-ink truncate">{matches[0].title}</p>
                                    <p className="text-xs font-bold text-ink/60">{matches[0].company} — Mantul Boss</p>
                                </div>
                                <span className="text-sm text-ink font-black tabular-nums bg-[#B8FF6D] px-2 py-1 rounded-lg border-2 border-ink shadow-[2px_2px_0px_#111827] transform rotate-2">
                                    {Math.round((matches[0].match_score || 0) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            onClick={() => setActiveTab('gap')}
                            className="bg-white border-[3px] border-ink hover:bg-[#FFC900] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827] transition-all rounded-xl py-3 text-xs font-black uppercase text-ink flex items-center justify-center gap-2"
                        >
                            📊 Cek Gap Dong
                        </button>
                        <button
                            onClick={() => setActiveTab('advisor')}
                            className="bg-white border-[3px] border-ink hover:bg-[#00E5FF] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827] transition-all rounded-xl py-3 text-xs font-black uppercase text-ink flex items-center justify-center gap-2"
                        >
                            🤖 Tanya Suhu AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
