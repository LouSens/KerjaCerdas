import { useState, useEffect } from 'react'
import { searchJobs } from '../services/api'
import useStore from '../store/useStore'
import { KC, DesignStyles, topBtn, useIsMobile } from './_design'
import JobDetailModal from './JobDetailModal'

const DEMO_SEARCH_RESULTS = [
    {
        id: 'sr-goto-1',
        title: 'Senior Backend Engineer',
        company: 'GoTo Group',
        company_name: 'GoTo Group',
        location: 'Jakarta',
        work_type: 'Hybrid',
        salary_range: 'Rp 28 jt – Rp 42 jt',
        skills_text: 'Go, PostgreSQL, gRPC',
        matching_skills: ['Go', 'PostgreSQL', 'gRPC'],
        score: 94,
        band: 'strong',
    },
    {
        id: 'sr-buka-2',
        title: 'Backend Engineer',
        company: 'Bukalapak',
        company_name: 'Bukalapak',
        location: 'Jakarta',
        work_type: 'Remote',
        salary_range: 'Rp 26 jt – Rp 38 jt',
        skills_text: 'Go, Redis, gRPC',
        matching_skills: ['Go', 'Redis', 'gRPC'],
        score: 91,
        band: 'strong',
    },
    {
        id: 'sr-mandiri-3',
        title: 'DevOps Platform Engineer',
        company: 'Bank Mandiri Digital',
        company_name: 'Bank Mandiri Digital',
        location: 'Jakarta',
        work_type: 'Onsite',
        salary_range: 'Rp 25 jt – Rp 38 jt',
        skills_text: 'Kubernetes, CI/CD, AWS',
        matching_skills: ['Kubernetes', 'CI/CD', 'AWS'],
        score: 78,
        band: 'possible',
    },
    {
        id: 'sr-bibit-4',
        title: 'Data Engineer',
        company: 'Bibit',
        company_name: 'Bibit',
        location: 'Jakarta',
        work_type: 'Hybrid',
        salary_range: 'Rp 24 jt – Rp 34 jt',
        skills_text: 'Python, Airflow, dbt',
        matching_skills: ['Python', 'Airflow', 'dbt'],
        score: 64,
        band: 'stretch',
    },
]

export default function SeekerSearch() {
    const isMobile = useIsMobile()
    const [query, setQuery] = useState('backend engineer')
    const [filterPanelOpen, setFilterPanelOpen] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState('Jakarta')
    const [selectedModes, setSelectedModes] = useState(['Remote', 'Hybrid'])
    const [minSalary, setMinSalary] = useState(25)
    const [selectedBands, setSelectedBands] = useState(['strong', 'possible'])
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedJob, setSelectedJob] = useState(null)

    useEffect(() => {
        handleSearch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            const res = await searchJobs(query, 0, 10, {
                region: selectedLocation === 'Jakarta' ? '3171' : undefined,
                salary_min: minSalary * 1_000_000,
            })
            setResults(res?.items && res.items.length ? res.items : DEMO_SEARCH_RESULTS)
        } catch (err) {
            setResults(DEMO_SEARCH_RESULTS)
        } finally {
            setLoading(false)
        }
    }

    const toggleMode = (m) => {
        setSelectedModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    }

    const toggleBand = (b) => {
        setSelectedBands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])
    }

    const resetFilters = () => {
        setSelectedLocation('')
        setSelectedModes([])
        setMinSalary(10)
        setSelectedBands(['strong', 'possible', 'stretch'])
    }

    const displayList = results.length > 0 ? results : DEMO_SEARCH_RESULTS
    const activeFilterCount = (selectedLocation ? 1 : 0) + selectedModes.length + (minSalary > 10 ? 1 : 0)

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D07)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <DesignStyles />
                <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

                {/* Desktop Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Cari Lowongan
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            Jalur manual — hasil tidak diurutkan oleh skor AI. Skor tetap ditampilkan sebagai konteks.
                        </p>
                    </div>
                    <span style={{ padding: '8px 14px', background: '#E0F2FE', border: '1.5px solid #0284C7', borderRadius: 8, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#075985', flexShrink: 0 }}>
                        Dual-Track Search
                    </span>
                </div>

                {/* Big Search Input Bar */}
                <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                        padding: '15px 18px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`,
                    }}>
                        <div style={{ width: 15, height: 15, border: '2.5px solid #64748B', borderRadius: '50%', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ketik kata kunci lowongan atau nama posisi…"
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                width: '100%', font: '700 14px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink,
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="kc-btn"
                        style={{
                            padding: '15px 26px', background: KC.orange, border: `1.5px solid ${KC.ink}`,
                            borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`, font: '800 14px/1 "Plus Jakarta Sans", sans-serif',
                            color: '#fff', cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        {loading ? 'Mencari…' : 'Cari'}
                    </button>
                </div>

                {/* 2-Column Grid: Left Sticky Filter (288px) + Right Results */}
                <div style={{ display: 'grid', gridTemplateColumns: '288px minmax(0, 1fr)', gap: 24 }}>
                    {/* Left Sticky Filter Panel */}
                    <div style={{
                        background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 22, alignSelf: 'flex-start',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Filter</span>
                            <button
                                onClick={resetFilters}
                                style={{ background: 'none', border: 'none', font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange, cursor: 'pointer', padding: 0 }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Location */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Lokasi
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                            {['Jakarta', 'Bandung', 'Surabaya'].map(loc => {
                                const on = selectedLocation === loc
                                return (
                                    <span
                                        key={loc}
                                        onClick={() => setSelectedLocation(on ? '' : loc)}
                                        style={{
                                            padding: '8px 13px',
                                            background: on ? KC.ink : '#FEF3C7',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            borderRadius: 999,
                                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                            color: on ? '#fff' : '#B45309',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {loc}
                                    </span>
                                )
                            })}
                        </div>

                        {/* Work Mode */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Mode kerja
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                            {['Remote', 'Hybrid', 'Onsite'].map(mode => {
                                const on = selectedModes.includes(mode)
                                return (
                                    <span
                                        key={mode}
                                        onClick={() => toggleMode(mode)}
                                        style={{
                                            padding: '8px 13px',
                                            background: on ? KC.ink : '#FEF3C7',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            borderRadius: 999,
                                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                            color: on ? '#fff' : '#B45309',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {mode}
                                    </span>
                                )
                            })}
                        </div>

                        {/* Salary Slider */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
                            <span style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Gaji minimum</span>
                            <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>Rp {minSalary} jt</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={minSalary}
                            onChange={(e) => setMinSalary(Number(e.target.value))}
                            style={{ width: '100%', accentColor: KC.orange, cursor: 'pointer', marginBottom: 22 }}
                        />

                        {/* Confidence Band Checkboxes */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Confidence band
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                            {[
                                { id: 'strong', label: 'Strong Fit', color: '#10B981' },
                                { id: 'possible', label: 'Possible Fit', color: '#F59E0B' },
                                { id: 'stretch', label: 'Stretch Fit', color: '#0284C7' },
                            ].map(b => {
                                const on = selectedBands.includes(b.id)
                                return (
                                    <span
                                        key={b.id}
                                        onClick={() => toggleBand(b.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 9,
                                            font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                            color: on ? '#334155' : '#94A3B8', cursor: 'pointer',
                                        }}
                                    >
                                        <span style={{
                                            width: 17, height: 17, borderRadius: 5,
                                            background: on ? b.color : '#fff',
                                            border: `1.5px solid ${on ? b.color : '#CBD5E1'}`,
                                            display: 'grid', placeItems: 'center', color: '#fff',
                                            font: '900 10px/1 "Plus Jakarta Sans", sans-serif',
                                        }}>
                                            {on ? '✓' : ''}
                                        </span>
                                        {b.label}
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Results Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ font: '700 12.5px/1 "JetBrains Mono", monospace', color: '#64748B' }}>
                                {displayList.length} hasil · {activeFilterCount} filter aktif
                            </span>
                            <span style={{ font: '800 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                Urutkan: Relevansi ▾
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {displayList.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    style={{
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 12,
                                        boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: '19px 21px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 20,
                                        animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                                            <span style={{ font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                {item.company || item.company_name}
                                            </span>
                                            <span style={{
                                                padding: '3px 9px',
                                                background: item.score >= 85 ? '#ECFDF5' : item.score >= 70 ? '#FEF3C7' : '#E0F2FE',
                                                border: `1px solid ${item.score >= 85 ? '#10B981' : item.score >= 70 ? '#F59E0B' : '#0284C7'}`,
                                                borderRadius: 999,
                                                font: '800 10px/1.3 "Plus Jakarta Sans", sans-serif',
                                                color: item.score >= 85 ? '#065F46' : item.score >= 70 ? '#B45309' : '#075985',
                                            }}>
                                                {item.score >= 85 ? 'Strong Fit' : item.score >= 70 ? 'Possible Fit' : 'Stretch Fit'}
                                            </span>
                                        </div>
                                        <div style={{ font: '900 19px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.7px', color: KC.ink, marginBottom: 7 }}>
                                            {item.title}
                                        </div>
                                        <div style={{ font: '600 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                            {item.location} · {item.work_type} &nbsp;·&nbsp; {item.salary_range || 'Rp 25 jt – Rp 38 jt'} &nbsp;·&nbsp; {item.skills_text || (item.matching_skills || []).join(', ')}
                                        </div>
                                    </div>

                                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            textAlign: 'center', padding: '9px 13px',
                                            background: item.score >= 85 ? '#ECFDF5' : item.score >= 70 ? '#FEF3C7' : '#E0F2FE',
                                            border: `1.5px solid ${item.score >= 85 ? '#10B981' : item.score >= 70 ? '#F59E0B' : '#0284C7'}`,
                                            borderRadius: 9,
                                        }}>
                                            <div style={{ font: '900 18px/1 "Plus Jakarta Sans", sans-serif', color: item.score >= 85 ? '#065F46' : item.score >= 70 ? '#B45309' : '#075985' }}>
                                                {item.score}%
                                            </div>
                                            <div style={{ font: '800 8.5px/1.5 "Plus Jakarta Sans", sans-serif', color: item.score >= 85 ? '#059669' : item.score >= 70 ? '#B45309' : '#0284C7', letterSpacing: 0.5 }}>
                                                MATCH
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedJob(item)}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.ink, '#fff', KC.orange), padding: '11px 17px', fontSize: 12, whiteSpace: 'nowrap' }}
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 08)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Mobile Header */}
            <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.9, color: KC.ink, margin: '0 0 11px', lineHeight: 1.1 }}>
                    Cari Lowongan
                </h1>

                {/* Search Bar + Filter Toggle */}
                <div style={{ display: 'flex', gap: 9, marginBottom: 11 }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 9,
                        padding: '12px 13px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, minHeight: 46,
                    }}>
                        <div style={{ width: 13, height: 13, border: '2.5px solid #64748B', borderRadius: '50%', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Cari lowongan atau keahlian…"
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                width: '100%', fontSize: 13, fontWeight: 700, color: KC.ink,
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setFilterPanelOpen(v => !v)}
                        style={{
                            width: 46, height: 46, background: '#090A0F',
                            border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                            boxShadow: `2.5px 2.5px 0 ${KC.orange}`,
                            display: 'grid', placeItems: 'center', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 16 }}>
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2 }} />
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2, width: 11 }} />
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2, width: 6 }} />
                        </div>
                    </button>
                </div>

                {/* Collapsible Mobile Filter Drawer */}
                {filterPanelOpen && (
                    <div style={{
                        background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 14, marginBottom: 11, animation: 'kcSlideUp .3s both',
                    }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 11 }}>
                            Filter manual
                        </div>

                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 7 }}>Lokasi</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 13 }}>
                            {['Jakarta', 'Bandung', 'Surabaya'].map(loc => {
                                const on = selectedLocation === loc
                                return (
                                    <span
                                        key={loc}
                                        onClick={() => setSelectedLocation(on ? '' : loc)}
                                        style={{
                                            padding: '8px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                            background: on ? KC.ink : '#FEF3C7',
                                            color: on ? '#fff' : '#B45309',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            cursor: 'pointer', minHeight: 38, display: 'inline-flex', alignItems: 'center',
                                        }}
                                    >
                                        {loc}
                                    </span>
                                )
                            })}
                        </div>

                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 7 }}>Mode kerja</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 13 }}>
                            {['Remote', 'Hybrid', 'Onsite'].map(mode => {
                                const on = selectedModes.includes(mode)
                                return (
                                    <span
                                        key={mode}
                                        onClick={() => toggleMode(mode)}
                                        style={{
                                            padding: '8px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                            background: on ? KC.ink : '#FEF3C7',
                                            color: on ? '#fff' : '#B45309',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            cursor: 'pointer', minHeight: 38, display: 'inline-flex', alignItems: 'center',
                                        }}
                                    >
                                        {mode}
                                    </span>
                                )
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>Gaji minimum</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: KC.orange }}>Rp {minSalary} jt</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={minSalary}
                            onChange={(e) => setMinSalary(Number(e.target.value))}
                            style={{ width: '100%', accentColor: KC.orange, cursor: 'pointer', marginBottom: 14 }}
                        />

                        <div style={{ display: 'flex', gap: 9 }}>
                            <button
                                onClick={resetFilters}
                                style={{
                                    flex: 'none', padding: '11px 14px', background: '#fff',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    fontSize: 11.5, fontWeight: 800, color: KC.ink, cursor: 'pointer',
                                }}
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => { setFilterPanelOpen(false); handleSearch(); }}
                                style={{
                                    flex: 1, padding: '11px 14px', background: KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                Terapkan · {displayList.length} hasil
                            </button>
                        </div>
                    </div>
                )}

                {/* Subtitle & Sort */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                        {displayList.length} hasil · {activeFilterCount} filter aktif
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: KC.ink }}>
                        Relevansi ▾
                    </span>
                </div>
            </div>

            {/* Mobile Dual-Track Banner */}
            <div style={{
                padding: '11px 13px', background: '#E0F2FE', border: '1.5px solid #0284C7',
                borderRadius: 11, fontSize: 11, lineHeight: 1.5, color: '#075985', fontWeight: 600,
            }}>
                <b>Dual-track:</b> hasil pencarian manual tidak dipengaruhi skor AI. Skor kecocokan tetap ditampilkan sebagai konteks, bukan urutan.
            </div>

            {/* Mobile Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {displayList.map((item, idx) => (
                    <div
                        key={item.id || idx}
                        onClick={() => setSelectedJob(item)}
                        style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14,
                            cursor: 'pointer', animation: 'kcUp .4s both',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11 }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5 }}>
                                    {item.company || item.company_name}
                                </div>
                                <div style={{ fontSize: 15.5, fontWeight: 900, letterSpacing: -0.5, color: KC.ink, marginBottom: 5, lineHeight: 1.2 }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
                                    {item.location} · {item.work_type} · {item.salary_range}
                                </div>
                            </div>
                            <div style={{
                                flexShrink: 0, textAlign: 'center', padding: '6px 8px',
                                background: item.score >= 85 ? '#ECFDF5' : '#FEF3C7',
                                border: `1px solid ${item.score >= 85 ? '#10B981' : '#F59E0B'}`,
                                borderRadius: 8,
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: item.score >= 85 ? '#065F46' : '#B45309' }}>
                                    {item.score}%
                                </div>
                                <div style={{ fontSize: 7.5, fontWeight: 800, color: item.score >= 85 ? '#059669' : '#B45309', letterSpacing: 0.3 }}>
                                    MATCH
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
