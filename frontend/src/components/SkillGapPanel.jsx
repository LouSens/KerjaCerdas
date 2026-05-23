import { Target, CheckCircle2, XCircle, BookOpen, Clock, ArrowLeft, TrendingUp, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * SkillGapPanel — Shows skill gap analysis between seeker and target job.
 *
 * Displays: matching skills, missing skills, gap severity, course recommendations,
 * progress visualization, and estimated readiness timeline.
 * Connected to: POST /api/v1/skill-gap
 */
export default function SkillGapPanel() {
    const { selectedJob, skillGap, skillGapLoading, setActiveTab } = useStore()

    if (!selectedJob && !skillGap) {
        return (
            <div className="bg-white border-[3px] border-ink rounded-[2rem] p-10 text-center shadow-[8px_8px_0px_#111827] animate-fade-in relative overflow-hidden">
                <div className="w-20 h-20 rounded-2xl bg-[#00E5FF] border-[3px] border-ink flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#111827] transform -rotate-3">
                    <Target className="w-10 h-10 text-ink" />
                </div>
                <h3 className="text-2xl font-black text-ink mb-3 uppercase tracking-tight">Analisis Skill Gap</h3>
                <p className="text-base font-bold text-ink/80 max-w-md mx-auto leading-relaxed mb-8">
                    Pilih pekerjaan dari hasil pencarian untuk melihat <span className="text-[#00E5FF] bg-ink px-1 border-2 border-ink">skill apa</span> yang butuh kamu asah.
                </p>
                <button
                    onClick={() => setActiveTab('match')}
                    className="inline-flex items-center justify-center gap-2 bg-white text-ink font-black border-[3px] border-ink rounded-xl px-6 py-3 shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all uppercase"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={3} />
                    Kembali ke Pencarian
                </button>
            </div>
        )
    }

    if (skillGapLoading) {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Skeleton loading */}
                <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827]">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="skeleton w-14 h-14 rounded-2xl bg-surface-200" />
                        <div className="flex-1">
                            <div className="skeleton h-6 w-56 mb-3 rounded-lg bg-surface-200" />
                            <div className="skeleton h-4 w-40 rounded-lg bg-surface-200" />
                        </div>
                    </div>
                    <div className="skeleton h-20 rounded-2xl bg-surface-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827]"><div className="skeleton h-32 rounded-xl bg-surface-200" /></div>
                    <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827]"><div className="skeleton h-32 rounded-xl bg-surface-200" /></div>
                </div>
                <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827]"><div className="skeleton h-24 rounded-xl bg-surface-200" /></div>
            </div>
        )
    }

    const severityConfig = {
        low: {
            color: 'text-ink', bg: 'bg-[#B8FF6D]', border: 'border-ink',
            label: 'Ready to go!', icon: '🎯', shadow: 'shadow-[4px_4px_0px_#111827]'
        },
        medium: {
            color: 'text-ink', bg: 'bg-[#FFC900]', border: 'border-ink',
            label: 'Butuh sedikit Asahan', icon: '📈', shadow: 'shadow-[4px_4px_0px_#111827]'
        },
        high: {
            color: 'text-ink', bg: 'bg-[#FF90E8]', border: 'border-ink',
            label: 'Siap-siap Upskilling!', icon: '🚀', shadow: 'shadow-[4px_4px_0px_#111827]'
        },
    }

    const severity = severityConfig[skillGap?.gap_severity] || severityConfig.medium
    const matchPercent = skillGap?.match_percentage ?? (
        skillGap ? Math.round(
            (skillGap.matching_skills?.length /
                Math.max(skillGap.matching_skills?.length + skillGap.missing_skills?.length, 1)) * 100
        ) : 0
    )

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Back button */}
            <div className="mb-2">
                <button
                    onClick={() => setActiveTab('match')}
                    className="inline-flex items-center gap-2 bg-white text-ink text-sm font-black border-[3px] border-ink rounded-lg px-4 py-2 shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-0.5 transition-all uppercase"
                >
                    <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                    Kembali Ke Hasil
                </button>
            </div>

            {/* Job header + Severity */}
            {selectedJob && (
                <div className="bg-white border-[3px] border-ink rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_#111827] relative">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-5 mb-8">
                            <div className={`w-16 h-16 rounded-2xl ${severity.bg} flex items-center justify-center text-3xl border-[3px] border-ink shadow-[4px_4px_0px_#111827] transform -rotate-3`}>
                                {severity.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{selectedJob.title}</h3>
                                <p className="text-sm font-bold text-ink/70 mt-1 uppercase tracking-wider">{selectedJob.company} · {selectedJob.region_name || selectedJob.region_code}</p>
                            </div>
                        </div>

                        {/* Gap severity banner */}
                        <div className={`${severity.bg} border-[3px] ${severity.border} rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_#111827] relative`}>
                            {/* Tape effect */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white border-2 border-surface-200 shadow-sm opacity-50 transform rotate-2"></div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <div className={`text-lg md:text-xl font-black uppercase ${severity.color} tracking-tight`}>{severity.label}</div>
                                <div className={`text-4xl md:text-5xl font-black ${severity.color} tabular-nums transform rotate-2 bg-white px-3 py-1 border-[3px] border-ink shadow-[2px_2px_0px_#111827]`}>
                                    {Math.round(matchPercent)}%
                                </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-6 bg-white border-[3px] border-ink rounded-full overflow-hidden shadow-inner w-full relative">
                                <div
                                    className={`absolute top-0 left-0 bottom-0 bg-ink transition-all duration-1000 ease-out`}
                                    style={{ width: `${matchPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-3 text-xs md:text-sm font-black text-ink uppercase tracking-wider">
                                <span>0% = Belajar Banyak</span>
                                <span>100% = OP!</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary */}
            {skillGap?.summary && (
                <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827]">
                    <div className="flex items-start gap-4">
                        <div className="bg-[#FF90E8] border-[3px] border-ink p-2 rounded-xl shadow-[2px_2px_0px_#111827] transform -rotate-2">
                            <TrendingUp className="w-6 h-6 text-ink shrink-0" strokeWidth={3} />
                        </div>
                        <p className="text-base md:text-lg font-bold text-ink leading-relaxed mt-1">{skillGap.summary}</p>
                    </div>
                </div>
            )}

            {/* Skills comparison */}
            {skillGap && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matching skills */}
                    <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_#111827]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#B8FF6D] border-2 border-ink p-1.5 rounded-lg shadow-[2px_2px_0px_#111827] transform -rotate-3">
                                <CheckCircle2 className="w-5 h-5 text-ink" strokeWidth={3} />
                            </div>
                            <h4 className="text-xl font-black text-ink uppercase tracking-tight">Keahlian Masuk</h4>
                            <span className="ml-auto bg-ink text-white font-black text-sm px-2.5 py-1 rounded-lg border-2 border-ink shadow-[2px_2px_0px_#B8FF6D]">
                                {skillGap.matching_skills?.length || 0}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {(skillGap.matching_skills || []).map((skill, i) => (
                                <span key={i} className="bg-[#B8FF6D]/20 border-[3px] border-ink text-ink font-bold text-sm px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#111827] flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={3} /> {skill}
                                </span>
                            ))}
                            {(!skillGap.matching_skills || skillGap.matching_skills.length === 0) && (
                                <p className="text-sm font-bold text-ink/60 italic">Kosong melompong bossku</p>
                            )}
                        </div>
                    </div>

                    {/* Missing skills */}
                    <div className="bg-white border-[3px] border-ink rounded-[2rem] p-6 md:p-8 shadow-[6px_6px_0px_#111827]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-rose-400 border-2 border-ink p-1.5 rounded-lg shadow-[2px_2px_0px_#111827] transform rotate-3">
                                <XCircle className="w-5 h-5 text-ink" strokeWidth={3} />
                            </div>
                            <h4 className="text-xl font-black text-ink uppercase tracking-tight">Keahlian Kurang</h4>
                            <span className="ml-auto bg-ink text-white font-black text-sm px-2.5 py-1 rounded-lg border-2 border-ink shadow-[2px_2px_0px_rose-400]">
                                {skillGap.missing_skills?.length || 0}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {(skillGap.missing_skills || []).map((skill, i) => (
                                <span key={i} className="bg-rose-100 border-[3px] border-ink text-ink font-bold text-sm px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#111827] flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-600" strokeWidth={3} /> {skill}
                                </span>
                            ))}
                            {(!skillGap.missing_skills || skillGap.missing_skills.length === 0) && (
                                <p className="text-sm font-black text-ink bg-[#B8FF6D] border-[3px] border-ink px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#111827] transform rotate-1">
                                    Semua skill terpenuhi! 🎉
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Course recommendations */}
            {skillGap?.recommended_courses && skillGap.recommended_courses.length > 0 && (
                <div className="bg-white border-[3px] border-ink rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_#111827]">
                    <div className="p-6 md:p-8 border-b-[3px] border-ink bg-[#FF90E8]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white border-[3px] border-ink p-2 rounded-xl shadow-[2px_2px_0px_#111827]">
                                    <BookOpen className="w-6 h-6 text-ink" strokeWidth={3} />
                                </div>
                                <h4 className="text-xl md:text-2xl font-black text-ink uppercase tracking-tight">Kursus Sakti</h4>
                            </div>
                            <span className="text-sm font-black text-white bg-ink border-[3px] border-ink px-4 py-1.5 rounded-xl shadow-[2px_2px_0px_#111827]">
                                {skillGap.recommended_courses.length} Kursus
                            </span>
                        </div>
                    </div>
                    <div className="divide-y-[3px] divide-ink bg-white">
                        {skillGap.recommended_courses.map((course, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-[#FF90E8]/10 transition-colors group/course gap-4 sm:gap-6">
                                <div className="flex items-center gap-5 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-white border-[3px] border-ink flex items-center justify-center shrink-0 group-hover/course:shadow-[4px_4px_0px_#111827] group-hover/course:-translate-y-1 transition-all">
                                        <BookOpen className="w-5 h-5 text-ink" strokeWidth={3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base md:text-lg font-black text-ink truncate group-hover/course:text-[#FF90E8] transition-colors">{course.name}</p>
                                        <p className="text-sm font-bold text-ink/70 mt-1">{course.provider}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 sm:ml-4">
                                    <span className="bg-[#B8FF6D] text-ink font-black text-sm px-3 py-1.5 rounded-xl border-[3px] border-ink shadow-[2px_2px_0px_#111827] flex items-center gap-2">
                                        <Clock className="w-4 h-4" strokeWidth={3} />
                                        {course.duration}
                                    </span>
                                    <button className="w-10 h-10 rounded-xl bg-white border-[3px] border-ink flex items-center justify-center hover:bg-[#FFC900] hover:shadow-[2px_2px_0px_#111827] transition-all">
                                        <ExternalLink className="w-5 h-5 text-ink" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Estimated readiness */}
            {skillGap?.estimated_readiness_months > 0 && (
                <div className="bg-[#B8FF6D] border-[3px] border-ink rounded-[2rem] p-6 shadow-[6px_6px_0px_#111827] mt-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                            <div className="w-16 h-16 rounded-2xl bg-white border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0px_#111827] shrink-0">
                                <Clock className="w-8 h-8 text-ink" strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-ink opacity-80 uppercase tracking-widest mb-1">Estimasi Waktu Siap Tempur</p>
                                <p className="text-3xl md:text-4xl font-black text-ink uppercase tracking-tighter">
                                    ~{skillGap.estimated_readiness_months} Bulan
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('advisor')}
                            className="bg-white text-ink text-base md:text-lg font-black w-full sm:w-auto px-8 py-4 rounded-xl border-[3px] border-ink shadow-[4px_4px_0px_#111827] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111827] transition-all flex items-center justify-center gap-3 active:translate-y-0 active:shadow-none"
                        >
                            <span className="text-2xl animate-bounce">🤖</span> Tanya AI Roadmap
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
