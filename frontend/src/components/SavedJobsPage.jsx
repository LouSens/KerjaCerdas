import { Bookmark, MapPin, Building2, Wallet, Clock, Trash2, BarChart3, ArrowLeft, Search } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * SavedJobsPage — Displays all bookmarked/saved jobs with actions.
 * Persisted to localStorage via Zustand persist middleware.
 */
export default function SavedJobsPage() {
    const { savedJobs, toggleSaveJob, selectJob, analyzeGap, setActiveTab } = useStore()

    /**
     * Formats salary range to Indonesian Rupiah string.
     */
    const formatSalary = (min, max) => {
        const fmt = (v) => `${(v / 1_000_000).toFixed(0)}`
        return `Rp ${fmt(min)}–${fmt(max)} juta`
    }

    /**
     * Formats ISO date to relative time display.
     */
    const formatDate = (isoString) => {
        if (!isoString) return ''
        const diff = Date.now() - new Date(isoString).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Baru saja'
        if (mins < 60) return `${mins} menit lalu`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} jam lalu`
        return `${Math.floor(hours / 24)} hari lalu`
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Bookmark className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-bold">Lowongan Tersimpan</h2>
                        {savedJobs.length > 0 && (
                            <span className="badge-warning">{savedJobs.length}</span>
                        )}
                    </div>
                    <p className="text-sm text-surface-400">
                        Lowongan yang kamu simpan untuk ditinjau nanti
                    </p>
                </div>
            </div>

            {/* Empty state */}
            {savedJobs.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                        <Bookmark className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Belum Ada Lowongan Tersimpan</h3>
                    <p className="text-sm text-surface-400 max-w-md mx-auto leading-relaxed mb-6">
                        Klik ikon bookmark <Bookmark className="w-3.5 h-3.5 inline mx-0.5" /> pada kartu lowongan
                        untuk menyimpannya di sini.
                    </p>
                    <button
                        onClick={() => setActiveTab('match')}
                        className="btn-glow inline-flex items-center gap-2 text-sm"
                    >
                        <Search className="w-4 h-4" />
                        Cari Pekerjaan
                    </button>
                </div>
            )}

            {/* Saved jobs list */}
            {savedJobs.length > 0 && (
                <div className="space-y-3">
                    {savedJobs.map((job, i) => {
                        const score = Math.round((job.match_score || 0) * 100)
                        return (
                            <div
                                key={job.job_id}
                                className="glass-card-hover p-5 animate-slide-up"
                                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Score */}
                                    <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                        <span className="text-sm font-bold text-brand-400 tabular-nums">{score}%</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">{job.title}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-surface-400 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {job.company}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {job.region_name || job.region_code}
                                            </span>
                                            {job.salary_min && (
                                                <span className="flex items-center gap-1 text-emerald-400/80">
                                                    <Wallet className="w-3 h-3" />
                                                    {formatSalary(job.salary_min, job.salary_max)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-1 mt-2.5">
                                            {(job.required_skills || []).slice(0, 5).map((skill, si) => (
                                                <span key={si} className="skill-tag">{skill}</span>
                                            ))}
                                            {(job.required_skills || []).length > 5 && (
                                                <span className="text-[10px] text-surface-500 self-center">
                                                    +{job.required_skills.length - 5}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                                            <button
                                                onClick={() => { selectJob(job); analyzeGap(job.required_skills || []); setActiveTab('gap') }}
                                                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                                            >
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                Skill Gap
                                            </button>
                                            <span className="text-surface-700">·</span>
                                            <button
                                                onClick={() => toggleSaveJob(job)}
                                                className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 font-medium transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Hapus
                                            </button>
                                            {job.savedAt && (
                                                <>
                                                    <span className="text-surface-700">·</span>
                                                    <span className="flex items-center gap-1 text-[10px] text-surface-500">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(job.savedAt)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
