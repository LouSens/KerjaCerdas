import { useState, useEffect } from 'react'
import { searchJobs } from '../services/api'
import useStore from '../store/useStore'
import { BrutalCard, KC, topBtn, Tag, DesignStyles } from './_design'

export default function SeekerSearch() {
    const [query, setQuery] = useState('')
    const [filters, setFilters] = useState({
        region: '',
        job_type: '',
        experience_min: '',
        salary_min: '',
        remote_allowed: false
    })
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const { matches, runAgent, navigate } = useStore()

    // Ambil semua data loker saat pertama kali mount
    useEffect(() => {
        handleSearch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            const cleanFilters = {}
            if (filters.region) cleanFilters.region = filters.region
            if (filters.job_type) cleanFilters.job_type = filters.job_type
            if (filters.experience_min) cleanFilters.experience_min = parseInt(filters.experience_min)
            if (filters.salary_min) cleanFilters.salary_min = parseInt(filters.salary_min)
            if (filters.remote_allowed) cleanFilters.remote_allowed = true

            const res = await searchJobs(query, 0, 20, cleanFilters)
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

                <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari posisi, kata kunci, atau skill..."
                            className="kc-input"
                            style={{ flex: 1, padding: 16, fontSize: 18, border: `4px solid ${KC.ink}`, borderRadius: 0, boxShadow: `4px 4px 0 ${KC.ink}` }}
                        />
                        <button type="submit" className="kc-btn" disabled={loading} style={{ ...topBtn(KC.cyan, KC.ink), padding: '0 32px', fontSize: 18 }}>
                            {loading ? 'Mencari...' : '🔍 Cari'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 16, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8 }}>
                        <select
                            value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })}
                            style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600 }}>
                            <option value="">Semua Lokasi</option>
                            <option value="3171">Jakarta</option>
                            <option value="3273">Bandung</option>
                            <option value="3578">Surabaya</option>
                        </select>
                        <select
                            value={filters.job_type} onChange={e => setFilters({ ...filters, job_type: e.target.value })}
                            style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600 }}>
                            <option value="">Semua Tipe Pekerjaan</option>
                            <option value="onsite">On-Site</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                        <select
                            value={filters.experience_min} onChange={e => setFilters({ ...filters, experience_min: e.target.value })}
                            style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600 }}>
                            <option value="">Pengalaman</option>
                            <option value="0">Fresh Graduate (0 thn)</option>
                            <option value="2">Junior (1-2 thn)</option>
                            <option value="5">Mid-Level (3-5 thn)</option>
                            <option value="10">Senior (&gt; 5 thn)</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Min Gaji (Rp)"
                            value={filters.salary_min}
                            onChange={e => setFilters({ ...filters, salary_min: e.target.value })}
                            style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600, width: 140 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
                            <input type="checkbox" checked={filters.remote_allowed} onChange={e => setFilters({ ...filters, remote_allowed: e.target.checked })} style={{ width: 18, height: 18 }} />
                            Remote OK
                        </label>
                    </div>
                </form>

                <div className="kc-grid-3">
                    {results.map(job => {
                        const aiScore = getAiScore(job.id)
                        return (
                            <BrutalCard key={job.id} color="#fff">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{job.title}</h3>
                                        <p style={{ margin: '4px 0', fontSize: 14, color: KC.mute }}>{job.location} • {job.job_type}</p>
                                        {job.verified && <div style={{ marginTop: 4 }}><Tag color={KC.lime} size="sm">✓ Terverifikasi</Tag></div>}
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
                                        onClick={async () => {
                                            await runAgent({ explicitIntent: 'skill_gap', targetJobId: job.id })
                                            navigate('seeker-skill-gap')
                                        }}
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
