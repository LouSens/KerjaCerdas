import { useState, useEffect } from 'react'
import { searchJobs } from '../services/api'
import useStore from '../store/useStore'
import { BrutalCard, KC, topBtn, Tag, DesignStyles } from './_design'
import { Search, MapPin, Briefcase, DollarSign, Building2, Filter, ArrowRight } from 'lucide-react'
import JobDetailModal from './JobDetailModal'

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
    const [selectedJob, setSelectedJob] = useState(null)
    const { matches, navigate } = useStore()

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

    const selectStyle = {
        padding: '9px 12px',
        border: `1.5px solid ${KC.ink}`,
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 13,
        background: '#fff',
        fontFamily: 'inherit',
        cursor: 'pointer',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Eksplorasi Lowongan
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Pencarian lowongan kerja terverifikasi di seluruh Indonesia berdasarkan kata kunci dan preferensi
                    </p>
                </div>
            </header>

            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} color={KC.mute} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari berdasarkan posisi, keahlian, atau nama perusahaan…"
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                fontSize: 14,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 10,
                                background: '#fff',
                                fontFamily: 'inherit',
                                fontWeight: 600,
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button type="submit" className="kc-btn" disabled={loading} style={{ ...topBtn(KC.orange, '#fff'), padding: '0 24px', fontSize: 14 }}>
                        {loading ? 'Mencari…' : 'Cari Lowongan'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })} style={selectStyle}>
                        <option value="">Semua Lokasi</option>
                        <option value="3171">DKI Jakarta</option>
                        <option value="3273">Bandung</option>
                        <option value="3578">Surabaya</option>
                    </select>

                    <select value={filters.job_type} onChange={e => setFilters({ ...filters, job_type: e.target.value })} style={selectStyle}>
                        <option value="">Semua Mode Kerja</option>
                        <option value="onsite">On-Site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                    </select>

                    <select value={filters.experience_min} onChange={e => setFilters({ ...filters, experience_min: e.target.value })} style={selectStyle}>
                        <option value="">Tingkat Pengalaman</option>
                        <option value="0">Fresh Graduate (0 thn)</option>
                        <option value="2">Junior (1-2 thn)</option>
                        <option value="5">Mid-Level (3-5 thn)</option>
                        <option value="10">Senior (&gt; 5 thn)</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => {
                            setQuery('')
                            setFilters({ region: '', job_type: '', experience_min: '', salary_min: '', remote_allowed: false })
                        }}
                        style={{ background: 'none', border: 'none', color: KC.mute, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                    >
                        Reset Filter
                    </button>
                </div>
            </form>

            {/* Results Grid */}
            <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute, marginBottom: 14 }}>
                    Ditemukan {results.length} lowongan aktif
                </div>

                <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {results.map((job, idx) => (
                        <BrutalCard key={job.id || idx} color="#FFFFFF" padding={18}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Building2 size={13} /> {job.company || 'Perusahaan Mitra'}
                                        </span>
                                        {job.verified && (
                                            <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime} size="sm">
                                                DJP Verified
                                            </Tag>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', color: KC.ink, letterSpacing: -0.3 }}>
                                        {job.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={13} /> {job.location || 'Jakarta'}
                                        </span>
                                        <span>·</span>
                                        <span>{job.salary_range || 'Gaji Kompetitif'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(job)}
                                    className="kc-btn"
                                    style={{ ...topBtn('#fff', KC.ink), padding: '8px 16px', fontSize: 12 }}
                                >
                                    Detail Lowongan <ArrowRight size={13} />
                                </button>
                            </div>
                        </BrutalCard>
                    ))}
                </div>
            </div>
        </div>
    )
}
