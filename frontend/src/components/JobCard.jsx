import { Bookmark, MapPin, Wallet } from 'lucide-react'
import useStore from '../store/useStore'

export default function JobCard({ match }) {
    const { toggleSaveJob, isJobSaved, runAgent } = useStore()
    if (!match) return null
    const saved = isJobSaved(match.job_id)
    const score = Math.round((match.score || 0) * 100)
    const tint = score >= 75 ? 'emerald' : score >= 50 ? 'amber' : 'rose'

    return (
        <article className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{match.title || `Job ${match.job_id.slice(0, 8)}`}</h3>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{match.explanation}</p>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full bg-${tint}-100 text-${tint}-700`}>
                    {score}%
                </span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
                {match.region_code && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {match.region_code}</span>}
                {match.salary_in_range != null && (
                    <span className="inline-flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> {match.salary_in_range ? 'masuk ekspektasi' : 'di luar ekspektasi'}
                    </span>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={() => runAgent({ targetJobId: match.job_id, message: 'Apa skill yang kurang untuk lowongan ini?' })}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                >
                    Cek skill gap →
                </button>
                <button
                    onClick={() => toggleSaveJob(match)}
                    className={`p-2 rounded-lg ${saved ? 'bg-amber-100 text-amber-700' : 'bg-surface-100 text-surface-500'}`}
                    aria-label="Save"
                >
                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
            </div>
        </article>
    )
}
