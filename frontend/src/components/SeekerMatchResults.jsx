import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, RankSticker, ScoreDonut, Tag, DesignStyles } from './_design'

// ── LinkedIn-style multi-facet filters ─────────────────────────────────────
// Auto-matching to seeker profile still happens server-side. These filters
// narrow the already-ranked top list — they don't replace AI scoring.
const FACETS = {
    location: {
        label: 'Lokasi', accent: KC.cyan,
        options: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Denpasar', 'Medan'],
        match: (m, v) => new RegExp(v, 'i').test(m.location || m.region_code || ''),
    },
    workMode: {
        label: 'Mode Kerja', accent: KC.pink,
        options: ['Onsite', 'Hybrid', 'Remote'],
        match: (m, v) => new RegExp(v, 'i').test(m.location || m.work_type || ''),
    },
    type: {
        label: 'Tipe Kerja', accent: KC.lime,
        options: ['Full-time', 'Contract', 'Part-time', 'Internship', 'Freelance'],
        match: (m, v) => new RegExp(v, 'i').test(m.work_type || m.employment_type || 'Full-time'),
    },
    role: {
        label: 'Role / Industri', accent: KC.yellow,
        options: ['Backend', 'Frontend', 'Data', 'Mobile', 'Design', 'Product', 'DevOps', 'Marketing'],
        match: (m, v) => new RegExp(v, 'i').test(m.title || m.job_title || m.industry || ''),
    },
    experience: {
        label: 'Pengalaman', accent: KC.orange,
        options: ['Fresh grad', '1-3 thn', '3-5 thn', '5-8 thn', '8+ thn'],
        match: (m, v) => {
            const exp = parseInt(String(m.experience_range || '').replace(/\D/g, '')) || 0
            if (v === 'Fresh grad') return exp <= 1
            if (v === '1-3 thn') return exp >= 1 && exp <= 3
            if (v === '3-5 thn') return exp >= 3 && exp <= 5
            if (v === '5-8 thn') return exp >= 5 && exp <= 8
            if (v === '8+ thn') return exp >= 8
            return true
        },
    },
    salary: {
        label: 'Gaji Min', accent: KC.cyan,
        options: ['Rp 5jt+', 'Rp 10jt+', 'Rp 15jt+', 'Rp 25jt+', 'Rp 40jt+'],
        match: (m, v) => {
            const min = parseInt(v.replace(/\D/g, '')) || 0
            const got = parseInt(String(m.salary_range || '').replace(/\D/g, '')) || 0
            return got >= min
        },
    },
    verified: {
        label: 'Trust', accent: KC.lime,
        options: ['Employer verified', 'Posted < 7 hari'],
        match: (m, v) => v === 'Employer verified' ? !!m.verified : !!m.recent,
    },
}

const DEFAULT_FACETS = {
    location: new Set(), workMode: new Set(), type: new Set(),
    role: new Set(), experience: new Set(), salary: new Set(), verified: new Set(),
}

export default function SeekerMatchResults() {
    const { matches, agentLoading, runAgent, toggleSaveJob, isJobSaved } = useStore()
    const [facets, setFacets] = useState(DEFAULT_FACETS)
    const [showFilters, setShowFilters] = useState(true)

    if (agentLoading) return <MatchSkeleton />

    const baseList = matches.length ? matches : DEMO_MATCHES
    const activeCount = Object.values(facets).reduce((n, s) => n + s.size, 0)
    const list = (activeCount === 0
        ? baseList
        : baseList.filter(m => Object.entries(facets).every(([k, sel]) => {
            if (sel.size === 0) return true
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
        location: new Set(), workMode: new Set(), type: new Set(),
        role: new Set(), experience: new Set(), salary: new Set(), verified: new Set(),
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>Top 5 Match Untukmu</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Auto-matched ke profilmu pakai Gemini · filter di bawah cuma narrow hasil
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => setShowFilters(v => !v)} style={topBtn('#fff')}>
                        ⚙️ Filter {activeCount > 0 && <span style={{ marginLeft: 6, padding: '2px 6px', background: KC.orange, color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 900 }}>{activeCount}</span>}
                    </button>
                    <button className="kc-btn" onClick={() => runAgent({ message: 're-match my profile' })} style={topBtn(KC.orange, '#fff')}>
                        ✨ Re-match
                    </button>
                </div>
            </header>

            {/* ── Faceted filter panel (LinkedIn-style) ────────────────── */}
            {showFilters && (
                <BrutalCard color="#fff" padding={20} style={{ animation: 'kc-fade-up .25s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Tag color={KC.yellow}>filter pintar</Tag>
                            <span style={{ fontSize: 12, color: KC.mute, fontWeight: 700 }}>
                                {list.length} hasil dari {baseList.length} match
                            </span>
                        </div>
                        <button className="kc-btn" onClick={resetAll} disabled={activeCount === 0} style={{ ...topBtn('#fff'), opacity: activeCount === 0 ? 0.45 : 1, padding: '6px 12px', fontSize: 11 }}>
                            Reset semua
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
                        {Object.entries(FACETS).map(([key, facet]) => (
                            <FacetGroup key={key} facet={facet} selected={facets[key]} onToggle={(v) => toggleFacet(key, v)} />
                        ))}
                    </div>

                    {activeCount > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1.5px dashed ${KC.ink}`, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute }}>Aktif:</span>
                            {Object.entries(facets).flatMap(([k, sel]) =>
                                [...sel].map(v => (
                                    <button key={`${k}-${v}`} onClick={() => toggleFacet(k, v)} style={{
                                        padding: '4px 10px', background: FACETS[k].accent, color: KC.ink,
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 999,
                                        fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                    }}>
                                        {v} ×
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </BrutalCard>
            )}

            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                {list.map((m, i) => (
                    <MatchCard key={m.job_id || i} rank={i + 1} match={m}
                        saved={isJobSaved(m.job_id || m.id)} onSave={() => toggleSaveJob(m)} />
                ))}
            </div>

            <div style={{ marginTop: 12, padding: 14, background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC.mute }}>
                Hanya 5 hasil teratas yang ditampilkan. <span style={{ color: KC.ink, textDecoration: 'underline', cursor: 'pointer' }}>Upgrade ke Pro</span> buat akses top-20 + insight mingguan.
            </div>
        </div>
    )
}

function MatchCard({ rank, match, saved, onSave }) {
    const score = Math.round((match.overall_score ?? match.score / 100 ?? 0.85) * 100)
    const accent = score >= 90 ? KC.orange : score >= 85 ? KC.yellow : score >= 80 ? KC.cyan : KC.lime
    const company = match.company || 'Company'
    const matchingSkills = match.matching_skills || []
    const missingSkills = match.missing_skills || []
    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            <RankSticker rank={rank} />
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <ScoreDonut value={score} size={60} color={accent} />
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 28, height: 28, background: KC.cyan, border: `1.5px solid ${KC.ink}`, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12 }}>{company[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute }}>{company} ✓</div>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15, margin: 0 }}>
                        {match.title || match.job_title || 'Posisi'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 12, fontWeight: 700, color: KC.mute, flexWrap: 'wrap' }}>
                        <span>📍 {match.location || 'Jakarta'}</span>
                        <span>💰 {match.salary_range || 'Competitive'}</span>
                        <span>⏱ {match.experience_range || '3-5 thn'}</span>
                        <span>💼 {match.work_type || 'Full-time'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                        {matchingSkills.slice(0, 4).map(t => <Tag key={t} color={KC.lime} size="sm">{t}</Tag>)}
                        {missingSkills.slice(0, 2).map(t => <Tag key={t} color={KC.orangeSoft} size="sm">+ {t}</Tag>)}
                    </div>
                    {match.explanation && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                            <b>✨ AI · </b>{match.explanation}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="kc-btn" onClick={onSave} aria-label={saved ? 'Unsave' : 'Save'} style={{ width: 38, height: 38, background: saved ? KC.yellow : '#fff', border: `2px solid ${KC.ink}`, borderRadius: 9, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`, fontSize: 16 }}>
                        {saved ? '★' : '☆'}
                    </button>
                    <button className="kc-btn" style={topBtn(KC.orange, '#fff')}>Lihat →</button>
                </div>
            </div>
        </BrutalCard>
    )
}

function MatchSkeleton() {
    const [stageIdx, setStageIdx] = useState(2)
    useEffect(() => {
        const t = setInterval(() => setStageIdx(i => Math.min(3, i + 1)), 1800)
        return () => clearInterval(t)
    }, [])

    const stageDefs = [
        { l: 'Parse CV', dur: '1.2s' },
        { l: 'Embed profil', dur: '2.4s' },
        { l: 'Vector search', dur: '~3s' },
        { l: 'LLM rerank', dur: 'queue' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>AI lagi nyari yang cocok…</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>Gemini embed CV-mu, bandingin sama 12.480 lowongan aktif</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    <span className="kc-ping" /> ESTIMASI 8 DETIK
                </div>
            </header>

            <BrutalCard color="#fff" padding={20}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
                    {stageDefs.map((st, i) => {
                        const ok = i < stageIdx, loading = i === stageIdx
                        const bg = ok ? KC.lime : loading ? KC.yellow : KC.bone
                        return (
                            <div key={i} className="kc-card" style={{ padding: 14, background: bg, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {ok && <div style={{ width: 22, height: 22, background: KC.ink, color: '#fff', borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 900 }}>✓</div>}
                                    {loading && <div className="kc-spin" />}
                                    {!ok && !loading && <div style={{ width: 22, height: 22, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 6 }} />}
                                    <div style={{ fontSize: 13, fontWeight: 900 }}>{st.l}</div>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>{st.dur}</div>
                            </div>
                        )
                    })}
                </div>
            </BrutalCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <BrutalCard key={i} color="#fff" padding={20}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', gap: 16, alignItems: 'center' }}>
                            <div className="kc-shim" style={{ width: 60, height: 60, borderRadius: '50%' }} />
                            <div>
                                <div className="kc-shim" style={{ width: 120, height: 14, borderRadius: 6, marginBottom: 10 }} />
                                <div className="kc-shim" style={{ width: '60%', height: 22, borderRadius: 6, marginBottom: 12 }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[50, 70, 60, 80].map((w, j) => <div key={j} className="kc-shim" style={{ width: w, height: 12, borderRadius: 999 }} />)}
                                </div>
                            </div>
                            <div className="kc-shim" style={{ width: 90, height: 38, borderRadius: 8 }} />
                        </div>
                    </BrutalCard>
                ))}
            </div>
        </div>
    )
}

function FacetGroup({ facet, selected, onToggle }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, background: facet.accent, border: `1.5px solid ${KC.ink}`, borderRadius: 3 }} />
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>{facet.label}</span>
                {selected.size > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '1px 6px', background: KC.ink, color: '#fff', borderRadius: 999 }}>{selected.size}</span>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {facet.options.map(opt => {
                    const on = selected.has(opt)
                    return (
                        <button key={opt} onClick={() => onToggle(opt)} className="kc-btn" style={{
                            padding: '5px 10px', fontSize: 11, fontWeight: 800,
                            background: on ? KC.ink : '#fff', color: on ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`, borderRadius: 999,
                            cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: on ? `2px 2px 0 ${facet.accent}` : 'none',
                        }}>
                            {opt}{on && ' ✓'}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

const topBtn = (bg, fg = KC.ink) => ({
    padding: '8px 14px', background: bg, color: fg, border: `2px solid ${KC.ink}`,
    borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
})

const DEMO_MATCHES = [
    { job_id: 'd1', score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', experience_range: '4-7 thn', matching_skills: ['Go', 'PostgreSQL', 'gRPC', 'Microservices'], missing_skills: ['Kafka'], explanation: 'Pengalaman scale 100K RPS-mu match banget sama tim payment. Bahasa Go di CV terkonfirmasi dari 3 proyek terakhir.' },
    { job_id: 'd2', score: 89, title: 'Tech Lead · Payments Infrastructure', company: 'Xendit', location: 'Jakarta · Remote', salary_range: 'Rp 35-50jt', experience_range: '6+ thn', matching_skills: ['Go', 'Node', 'AWS', 'PostgreSQL'], missing_skills: ['Kafka', 'Terraform'], explanation: 'Cocok dari sisi domain fintech & leadership. Stack overlap 85% kecuali Kafka.' },
    { job_id: 'd3', score: 85, title: 'Staff Engineer', company: 'GoTo Financial', location: 'Jakarta · Hybrid', salary_range: 'Rp 40-60jt', experience_range: '7+ thn', matching_skills: ['Microservices', 'K8s', 'Go'], missing_skills: ['Redis'] },
    { job_id: 'd4', score: 81, title: 'Backend Lead · Wealth', company: 'Bibit', location: 'Jakarta · Hybrid', salary_range: 'Rp 30-45jt', experience_range: '5+ thn', matching_skills: ['Node', 'TypeScript'], missing_skills: ['Go', 'gRPC'] },
    { job_id: 'd5', score: 78, title: 'Sr. Software Engineer', company: 'Ruangguru', location: 'Jakarta · Remote', salary_range: 'Rp 25-38jt', experience_range: '4+ thn', matching_skills: ['Node', 'PostgreSQL'], missing_skills: ['Go', 'K8s'] },
]
