import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, DesignStyles, BandLegend, ScoreDonut, topBtn, BAND_META, BAND_ORDER } from './_design'
import { Filter, SlidersHorizontal, RefreshCw, Bookmark, BookmarkCheck, Building2, MapPin, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react'
import JobDetailModal from './JobDetailModal'

const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch'
}

const FACETS = {
    location: {
        label: 'Lokasi',
        options: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Denpasar'],
        match: (m, v) => new RegExp(v, 'i').test(m.location || m.region_code || ''),
    },
    workMode: {
        label: 'Mode Kerja',
        options: ['Onsite', 'Hybrid', 'Remote'],
        match: (m, v) => {
            if (v === 'Remote') return m.remote_allowed || /remote/i.test(m.location || '')
            if (v === 'Hybrid') return /hybrid/i.test(m.location || '')
            if (v === 'Onsite') return !m.remote_allowed && !/remote|hybrid/i.test(m.location || '')
            return true
        }
    },
    role: {
        label: 'Divisi / Spesialisasi',
        options: ['Backend', 'Frontend', 'Full-Stack', 'Data', 'DevOps', 'Product'],
        match: (m, v) => new RegExp(v, 'i').test(m.title || m.job_title || ''),
    },
    experience: {
        label: 'Tingkat Pengalaman',
        options: ['Fresh grad', '1-3 thn', '3-5 thn', '5+ thn'],
        match: (m, v) => {
            const exp = typeof m.experience_years_min === 'number'
                ? m.experience_years_min
                : parseInt(String(m.experience_range || '').match(/\d+/)?.[0] || '0')
            if (v === 'Fresh grad') return exp <= 1
            if (v === '1-3 thn') return exp >= 1 && exp <= 3
            if (v === '3-5 thn') return exp >= 3 && exp <= 5
            if (v === '5+ thn') return exp >= 5
            return true
        },
    },
}

const DEFAULT_FACETS = {
    location: new Set(),
    workMode: new Set(),
    role: new Set(),
    experience: new Set(),
}

export default function SeekerMatchResults() {
    const { matches, agentLoading, runAgent, toggleSaveJob, isJobSaved, seekerId, profile, navigate } = useStore()
    const [facets, setFacets] = useState(DEFAULT_FACETS)
    const [showFilters, setShowFilters] = useState(true)
    const [selectedJob, setSelectedJob] = useState(null)

    const baseList = matches.length ? matches : DEMO_MATCHES
    const activeCount = Object.values(facets).reduce((n, s) => n + s.size, 0)
    const list = (activeCount === 0
        ? baseList
        : baseList.filter(m => Object.entries(facets).some(([k, sel]) => {
            if (sel.size === 0) return false
            return [...sel].some(v => FACETS[k].match(m, v))
        }))
    ).slice(0, 5)

    const toggleFacet = (key, value) => {
        setFacets(prev => {
            const next = { ...prev, [key]: new Set(prev[key]) }
            next[key].has(value) ? next[key].delete(value) : next[key].add(value)
            return next
        })
    }

    const resetAll = () => setFacets({
        location: new Set(),
        workMode: new Set(),
        role: new Set(),
        experience: new Set(),
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Top Bar */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Pencocokan Lowongan AI
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {agentLoading ? 'Menganalisis puluhan ribu data lowongan…' : `Menampilkan Top-${list.length} hasil kecocokan berbasis kapabilitas riil`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => setShowFilters(v => !v)} style={topBtn('#fff')}>
                        <SlidersHorizontal size={14} /> Filter Kriteria {activeCount > 0 && `(${activeCount})`}
                    </button>
                    <button
                        className="kc-btn"
                        disabled={agentLoading}
                        onClick={() => runAgent({ explicitIntent: 'match_jobs' })}
                        style={{ ...topBtn(KC.orange, '#fff'), opacity: agentLoading ? 0.6 : 1 }}
                    >
                        <RefreshCw size={14} className={agentLoading ? 'animate-spin' : ''} />
                        {agentLoading ? 'Mengevaluasi…' : 'Hitung Ulang Match'}
                    </button>
                </div>
            </header>

            {/* Filter Section */}
            {showFilters && (
                <BrutalCard color="#FFFFFF" padding={18}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Filter size={14} color={KC.ink} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>Penyaringan Multi-Dimensi</span>
                        </div>
                        {activeCount > 0 && (
                            <button onClick={resetAll} style={{ background: 'none', border: 'none', color: KC.orange, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Reset Filter ({activeCount})
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        {Object.entries(FACETS).map(([key, facet]) => (
                            <div key={key}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 6 }}>
                                    {facet.label}
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {facet.options.map(opt => {
                                        const active = facets[key].has(opt)
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => toggleFacet(key, opt)}
                                                style={{
                                                    padding: '4px 9px',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    borderRadius: 6,
                                                    border: `1px solid ${active ? KC.ink : KC.borderMuted}`,
                                                    background: active ? KC.ink : KC.surface,
                                                    color: active ? '#fff' : KC.inkLight,
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                    transition: 'all 0.12s ease',
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </BrutalCard>
            )}

            {/* Band Legend */}
            <BandLegend side="seeker" />

            {/* Match Cards Grouped by Band */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {BAND_ORDER.map(bandKey => {
                    const bandInfo = BAND_META[bandKey]
                    const items = list.filter(m => bandOf(m) === bandKey)
                    if (!items.length) return null

                    return (
                        <div key={bandKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: bandInfo.color }} />
                                <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.3, margin: 0, color: KC.ink }}>
                                    {bandInfo.label} ({items.length})
                                </h2>
                                <span style={{ fontSize: 12, color: KC.mute }}>— {bandInfo.seeker}</span>
                            </div>

                            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {items.map((m, idx) => {
                                    const raw = m.overall_score ?? m.score ?? 0.85
                                    const pct = Math.round(raw > 1 ? raw : raw * 100)
                                    const saved = isJobSaved(m.job_id || m.id)
                                    const matchingSkills = m.matching_skills || ['Go', 'PostgreSQL', 'Docker']
                                    const missingSkills = m.missing_skills || []

                                    return (
                                        <BrutalCard key={m.job_id || idx} color="#FFFFFF" padding={18}>
                                            <div className="kc-card-split">
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                            <Building2 size={14} /> {m.company || 'GoTo Group'}
                                                        </span>
                                                        <Tag color={bandInfo.bg} ink={bandInfo.color} border={bandInfo.border} size="sm">
                                                            {bandInfo.badgeLabel}
                                                        </Tag>
                                                        {m.verified && (
                                                            <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime} size="sm">
                                                                Terverifikasi DJP
                                                            </Tag>
                                                        )}
                                                    </div>

                                                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px', color: KC.ink, letterSpacing: -0.4, wordBreak: 'break-word' }}>
                                                        {m.title || m.job_title || 'Senior Backend Engineer'}
                                                    </h3>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: KC.mute, marginBottom: 12, flexWrap: 'wrap' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <MapPin size={14} /> {m.location || 'Jakarta · Hybrid'}
                                                        </span>
                                                        <span>·</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <DollarSign size={14} /> {m.salary_range || 'Rp 28.000.000 - Rp 42.000.000'}
                                                        </span>
                                                    </div>

                                                    {/* Skills Pills */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                                        <span style={{ fontSize: 11, fontWeight: 800, color: KC.mute, textTransform: 'uppercase', marginRight: 4 }}>
                                                            Keahlian Sesuai:
                                                        </span>
                                                        {matchingSkills.map((s, sIdx) => (
                                                            <span key={sIdx} style={{ padding: '3px 8px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#047857' }}>
                                                                ✓ {typeof s === 'string' ? s : s.name}
                                                            </span>
                                                        ))}
                                                        {missingSkills.slice(0, 2).map((s, sIdx) => (
                                                            <span key={sIdx} style={{ padding: '3px 8px', background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                                                                + {typeof s === 'string' ? s : s.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Score Donut & Action */}
                                                <div className="kc-card-actions">
                                                    <ScoreDonut value={pct} size={52} color={bandInfo.color} />
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                        <button
                                                            onClick={() => toggleSaveJob(m)}
                                                            className="kc-btn"
                                                            style={{ ...topBtn('#fff', saved ? KC.orange : KC.ink), padding: '8px 12px' }}
                                                            title={saved ? 'Tersimpan' : 'Simpan lowongan'}
                                                        >
                                                            {saved ? <BookmarkCheck size={15} color={KC.orange} /> : <Bookmark size={15} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedJob(m)}
                                                            className="kc-btn"
                                                            style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 13 }}
                                                        >
                                                            Detail & Lamar <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </BrutalCard>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const DEMO_MATCHES = [
    { job_id: 'j1', company: 'GoTo Group', title: 'Senior Backend Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 28jt - Rp 42jt', score: 0.94, band: 'strong', verified: true, matching_skills: ['Go', 'PostgreSQL', 'gRPC', 'Kubernetes'], missing_skills: [] },
    { job_id: 'j2', company: 'Traveloka', title: 'Full-Stack Developer', location: 'Jakarta · Remote', salary_range: 'Rp 22jt - Rp 35jt', score: 0.88, band: 'strong', verified: true, matching_skills: ['React', 'Node.js', 'PostgreSQL'], missing_skills: ['TypeScript'] },
    { job_id: 'j3', company: 'Bank Mandiri Digital', title: 'DevOps Platform Engineer', location: 'Jakarta · Onsite', salary_range: 'Rp 25jt - Rp 38jt', score: 0.78, band: 'possible', verified: true, matching_skills: ['Kubernetes', 'CI/CD'], missing_skills: ['Terraform'] },
    { job_id: 'j4', company: 'Bukalapak', title: 'Data Platform Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 24jt - Rp 36jt', score: 0.74, band: 'possible', verified: false, matching_skills: ['Python', 'SQL'], missing_skills: ['Spark'] },
    { job_id: 'j5', company: 'Tiket.com', title: 'Lead Site Reliability Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 35jt - Rp 50jt', score: 0.62, band: 'stretch', verified: true, matching_skills: ['Linux', 'Networking'], missing_skills: ['Golang', 'Prometheus'] },
]
