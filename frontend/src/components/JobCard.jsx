import { MapPin, Clock, GraduationCap, Bookmark, BarChart3, ArrowRight, Building2, Wallet } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * JobCard — Displays a single job match result with score ring,
 * company info, skills, salary, bookmark toggle, and skill gap action.
 */
export default function JobCard({ job, index }) {
    const { selectJob, setActiveTab, analyzeGap, toggleSaveJob, isJobSaved } = useStore()
    const score = Math.round((job.match_score || 0) * 100)
    const saved = isJobSaved(job.job_id)

    /**
     * Gets the score color class based on percentage.
     */
    const getScoreColor = (s) => {
        if (s >= 85) return 'text-emerald-600'
        if (s >= 70) return 'text-brand-600'
        if (s >= 50) return 'text-amber-600'
        return 'text-red-600'
    }

    /**
     * Gets the ring color hex based on percentage.
     */
    const getRingColor = (s) => {
        if (s >= 85) return '#059669' // emerald-600
        if (s >= 70) return '#f03a08' // brand-600
        if (s >= 50) return '#d97706' // amber-600
        return '#dc2626' // red-600
    }

    /**
     * Gets the score label text.
     */
    const getScoreLabel = (s) => {
        if (s >= 85) return 'Sangat Cocok'
        if (s >= 70) return 'Cocok'
        if (s >= 50) return 'Cukup Cocok'
        return 'Kurang Cocok'
    }

    /**
     * Formats salary range in Indonesian Rupiah.
     */
    const formatSalary = (min, max) => {
        const fmt = (v) => `${(v / 1_000_000).toFixed(0)}`
        return `Rp ${fmt(min)}–${fmt(max)} juta`
    }

    /**
     * Handles navigating to skill gap analysis.
     */
    const handleAnalyze = () => {
        selectJob(job)
        analyzeGap(job.required_skills || [])
        setActiveTab('gap')
    }

    return (
        <div
            className="bg-white border-[3px] border-ink rounded-[1.5rem] p-5 sm:p-6 shadow-[4px_4px_0px_#111827] hover:shadow-[8px_8px_0px_#111827] hover:-translate-y-1 transition-all group animate-slide-up relative overflow-hidden"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
        >
            {/* Index Badge */}
            <div className="absolute top-0 right-0 bg-ink text-white font-black text-xs px-3 py-1 pb-1.5 rounded-bl-xl border-b-[3px] border-l-[3px] border-ink shadow-[-2px_2px_0px_rgba(0,0,0,0.1)] z-10">
                #{index + 1}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 mt-2 sm:mt-0">
                {/* Score Ring Section */}
                <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:gap-1.5">
                    <div
                        className="score-ring shadow-[2px_2px_0px_#111827]"
                        style={{
                            '--score': score,
                            '--ring-color': getRingColor(score),
                        }}
                    >
                        <span className={`text-base font-black ${getScoreColor(score)}`}>{score}%</span>
                    </div>
                    <div className="flex flex-col sm:items-center">
                        <span className={`text-[10px] sm:text-[9px] font-black uppercase tracking-wider ${getScoreColor(score)} opacity-90`}>
                            {getScoreLabel(score)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-black text-lg sm:text-xl text-ink group-hover:text-brand-600 transition-colors truncate">
                                    {job.title}
                                </h3>
                                {index === 0 && (
                                    <span className="bg-[#B8FF6D] border-2 border-ink shadow-[2px_2px_0px_#111827] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transform -rotate-2">★ Top Match</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-ink/70 flex-wrap">
                                <span className="flex items-center gap-1.5 border-2 border-ink rounded-lg px-2 py-0.5 bg-surface-50 shadow-[2px_2px_0px_#111827]">
                                    <Building2 className="w-3.5 h-3.5 text-ink" />
                                    {job.company}
                                </span>
                                <span className="flex items-center gap-1.5 border-2 border-ink rounded-lg px-2 py-0.5 bg-surface-50 shadow-[2px_2px_0px_#111827]">
                                    <MapPin className="w-3.5 h-3.5 text-ink" />
                                    {job.region_name || job.region_code}
                                </span>
                            </div>
                        </div>

                        {/* Bookmark button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleSaveJob(job) }}
                            className={`w-10 h-10 shrink-0 border-[3px] border-ink rounded-xl flex items-center justify-center transition-all shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none ${saved ? 'bg-[#FF90E8] text-ink' : 'bg-white text-ink hover:bg-surface-100'}`}
                            aria-label={saved ? 'Remove bookmark' : 'Save job'}
                        >
                            <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Info pills */}
                    <div className="flex flex-wrap gap-2.5 mt-5">
                        {job.salary_min && (
                            <span className="flex items-center gap-1.5 text-xs font-black text-ink bg-[#B8FF6D] border-[3px] border-ink shadow-[2px_2px_0px_#111827] px-3 py-1.5 rounded-xl tabular-nums">
                                <Wallet className="w-4 h-4" />
                                {formatSalary(job.salary_min, job.salary_max)}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs font-black text-ink bg-white border-[3px] border-ink shadow-[2px_2px_0px_#111827] px-3 py-1.5 rounded-xl">
                            <GraduationCap className="w-4 h-4 text-ink" />
                            {job.education_min || 'S1'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-black text-ink bg-white border-[3px] border-ink shadow-[2px_2px_0px_#111827] px-3 py-1.5 rounded-xl">
                            <Clock className="w-4 h-4 text-ink" />
                            {job.experience_years_min || 0}+ thn
                        </span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mt-5">
                        {(job.required_skills || []).slice(0, 6).map((skill, i) => (
                            <span key={i} className="text-[10px] md:text-xs font-bold text-ink bg-surface-100 border-2 border-ink rounded-lg px-2.5 py-1 uppercase tracking-tight shadow-[1px_1px_0px_#111827]">{skill}</span>
                        ))}
                        {(job.required_skills || []).length > 6 && (
                            <span className="text-[10px] md:text-xs font-bold text-surface-500 self-center uppercase tracking-tight">
                                +{job.required_skills.length - 6} Lainnya
                            </span>
                        )}
                    </div>

                    {/* Explanation */}
                    {job.explanation && (
                        <div className="mt-4 bg-[#FFC900]/10 border-[3px] border-ink shadow-[4px_4px_0px_#111827] rounded-xl p-3 sm:p-4">
                            <p className="text-xs sm:text-sm font-bold text-ink leading-relaxed">
                                <span className="mr-2">💡</span>
                                {job.explanation}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-6 pt-5 border-t-[3px] border-surface-200">
                        <button
                            onClick={handleAnalyze}
                            className="flex items-center justify-center flex-1 sm:flex-none gap-2 text-xs sm:text-sm text-ink bg-[#00E5FF] hover:bg-[#00E5FF]/80 font-black border-[3px] border-ink shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all rounded-xl px-4 py-2 group/btn uppercase tracking-tight"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analisis Gap
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => { selectJob(job); setActiveTab('advisor') }}
                            className="flex items-center justify-center flex-1 sm:flex-none gap-2 text-xs sm:text-sm text-ink bg-surface-100 hover:bg-surface-200 font-black border-[3px] border-ink shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all rounded-xl px-4 py-2 group/ai uppercase tracking-tight"
                        >
                            <span className="group-hover/ai:animate-bounce text-base">🤖</span> AI Advisor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
