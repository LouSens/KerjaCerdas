import { useState, useEffect } from 'react'
import { searchJobs } from '../services/api'
import useStore from '../store/useStore'
import { BrutalCard, KC, topBtn, DesignStyles } from './_design'
import JobCard from './JobCard' // assuming JobCard exists or we render manually

export default function SeekerSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const { matches, runAgent } = useStore()

    // Ambil semua data loker saat pertama kali mount
    useEffect(() => {
        handleSearch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            const res = await searchJobs(query)
            setResults(res.items || [])
        } catch (err) {
            console.error('Search failed', err)
        } finally {
            setLoading(false)
        }
    }

    // Helper untuk mengambil AI Match Score dari store global jika ada
    const getAiScore = (jobId) => {
        const match = matches.find(m => m.job_id === jobId)
        return match ? Math.round(match.score * 100) : null
    }

    return (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: KC.bone }}>
            <DesignStyles />
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, color: KC.ink }}>
                    Pencarian <span style={{ color: KC.orange }}>Manual</span>
                </h1>
                <p style={{ margin: '8px 0 24px', fontWeight: 600, color: KC.mute }}>
                    Jelajahi seluruh lowongan di luar zona nyaman CV Anda.
                </p>

                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari posisi, lokasi, atau sistem kerja (misal: WFH Barista Surabaya)..."
                        className="kc-input"
                        style={{ flex: 1, padding: 16, fontSize: 18, border: `4px solid ${KC.ink}`, borderRadius: 0, boxShadow: `4px 4px 0 ${KC.ink}` }}
                    />
                    <button type="submit" className="kc-btn" disabled={loading} style={{ ...topBtn(KC.cyan, KC.ink), padding: '0 32px', fontSize: 18 }}>
                        {loading ? 'Mencari...' : '🔍 Cari'}
                    </button>
                </form>

                <div className="kc-grid-3">
                    {results.map(job => {
                        const aiScore = getAiScore(job.id)
                        return (
                            <BrutalCard key={job.id} bg="#fff">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{job.title}</h3>
                                        <p style={{ margin: '4px 0', fontSize: 14, color: KC.mute }}>{job.location} • {job.job_type}</p>
                                    </div>
                                    {aiScore !== null ? (
                                        <div style={{ background: KC.lime, border: `2px solid ${KC.ink}`, padding: '4px 8px', fontWeight: 900, fontSize: 12, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                                            🤖 {aiScore}% Match
                                        </div>
                                    ) : (
                                        <div style={{ background: KC.ash, border: `2px solid ${KC.ink}`, padding: '4px 8px', fontWeight: 900, fontSize: 12 }}>
                                            N/A
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: 14, marginTop: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {job.description}
                                </p>
                                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                    <button 
                                        className="kc-btn" 
                                        onClick={() => runAgent({ explicitIntent: 'skill_gap', targetJobId: job.id })} 
                                        style={{ ...topBtn(KC.pink, KC.ink), flex: 1, padding: 8, fontSize: 14 }}
                                    >
                                        🧠 Cek Gap
                                    </button>
                                </div>
                            </BrutalCard>
                        )
                    })}
                </div>

                {!loading && results.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 64, border: `4px dashed ${KC.mute}` }}>
                        <h2 style={{ margin: 0, color: KC.mute }}>Tidak ada lowongan yang sesuai dengan kata kunci tersebut.</h2>
                    </div>
                )}
            </div>
        </div>
    )
}
