import useStore from '../store/useStore'
import { Search, Loader2 } from 'lucide-react'

export default function SearchForm() {
    const { runAgent, agentLoading, advisorInput, setAdvisorInput } = useStore()

    const submit = (e) => {
        e.preventDefault()
        if (!advisorInput.trim() || agentLoading) return
        runAgent({ message: advisorInput })
    }

    return (
        <form onSubmit={submit} className="flex gap-2">
            <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kc-gray" />
                <input
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    placeholder="Cari posisi, skill, atau perusahaan..."
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-kc-dark text-xs font-mono bg-white focus:outline-none focus:border-kc-orange"
                />
            </div>
            <button
                type="submit"
                disabled={agentLoading}
                className="bg-kc-dark text-white font-bold text-xs px-4 border-2 border-kc-dark hover:bg-kc-orange transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {agentLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Match
            </button>
        </form>
    )
}
