import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, ScoreDonut, topBtn, DesignStyles, useIsMobile } from './_design'
import JobDetailModal from './JobDetailModal'

const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 85 ? 'strong' : pct >= 70 ? 'possible' : 'stretch'
}

const DEMO_MATCH_FEED = [
    {
        id: 'job-goto-backend',
        title: 'Senior Backend Engineer',
        company: 'GoTo Group',
        company_name: 'GoTo Group',
        location: 'Jakarta',
        work_type: 'Hybrid',
        salary_range: 'Rp 28.000.000 – Rp 42.000.000',
        score: 94,
        overall_score: 94,
        band: 'strong',
        verified_djp: true,
        matching_skills: ['Go', 'PostgreSQL', 'gRPC'],
        missing_skills: [],
        ai_summary: 'Penguasaan arsitektur microservices Go dan throughput tinggi selaras dengan spesifikasi posisi.',
        semantic_score: 96,
        skill_score: 100,
        location_score: 90,
        salary_score: 95,
        seniority_score: 95,
    },
    {
        id: 'job-traveloka-fullstack',
        title: 'Full-Stack Developer',
        company: 'Traveloka',
        company_name: 'Traveloka',
        location: 'Jakarta',
        work_type: 'Remote',
        salary_range: 'Rp 22.000.000 – Rp 35.000.000',
        score: 88,
        overall_score: 88,
        band: 'strong',
        verified_djp: false,
        matching_skills: ['React', 'Node.js', 'PostgreSQL'],
        missing_skills: ['TypeScript'],
        ai_summary: 'Kompetensi fullstack modern cocok dengan sistem reservasi microfrontend.',
        semantic_score: 88,
        skill_score: 85,
        location_score: 95,
        salary_score: 90,
        seniority_score: 90,
    },
    {
        id: 'job-mandiri-devops',
        title: 'DevOps Platform Engineer',
        company: 'Bank Mandiri Digital',
        company_name: 'Bank Mandiri Digital',
        location: 'Jakarta',
        work_type: 'Onsite',
        salary_range: 'Rp 25.000.000 – Rp 38.000.000',
        score: 78,
        overall_score: 78,
        band: 'possible',
        verified_djp: true,
        matching_skills: ['Docker', 'Go'],
        missing_skills: ['Kubernetes', 'CI/CD Pipeline'],
        ai_summary: 'Fondasi kontainerisasi kuat. Gap Kubernetes dan CI/CD dapat ditutup dalam 44 jam belajar terarah.',
        semantic_score: 78,
        skill_score: 70,
        location_score: 90,
        salary_score: 85,
        seniority_score: 80,
    },
]

export default function SeekerMatchResults() {
    const isMobile = useIsMobile()
    const { matches, agentLoading, runAgent, navigate, savedJobs, bookmarkJob, unbookmarkJob } = useStore()
    const [selectedJob, setSelectedJob] = useState(null)
    const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'strong' | 'possible' | 'stretch'
    const [refreshing, setRefreshing] = useState(false)
    const [showFreshNotice, setShowFreshNotice] = useState(false)
    const [lastUpdatedText, setLastUpdatedText] = useState('Diperbarui 4 menit lalu')
    const [bandsExpanded, setBandsExpanded] = useState(false)
    const [savedMap, setSavedMap] = useState({})

    const baseList = matches.length > 0 ? matches : DEMO_MATCH_FEED

    // Filter by band
    const filteredList = activeFilter === 'all'
        ? baseList
        : baseList.filter(m => bandOf(m) === activeFilter)

    const strongMatches = baseList.filter(m => bandOf(m) === 'strong')
    const possibleMatches = baseList.filter(m => bandOf(m) === 'possible')
    const stretchMatches = baseList.filter(m => bandOf(m) === 'stretch')

    const handleRefresh = () => {
        setRefreshing(true)
        setTimeout(() => {
            setRefreshing(false)
            setShowFreshNotice(true)
            setLastUpdatedText('Diperbarui baru saja')
            runAgent({ explicitIntent: 'match_jobs' })
        }, 1100)
    }

    const toggleSaveJob = (job) => {
        const id = job.id || job.job_id
        const isSaved = savedMap[id] || (savedJobs || []).some(s => (s.id || s.job_id) === id)
        if (isSaved) {
            unbookmarkJob(id)
            setSavedMap(prev => ({ ...prev, [id]: false }))
        } else {
            bookmarkJob(job)
            setSavedMap(prev => ({ ...prev, [id]: true }))
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D04)
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
                            Hasil Pencocokan AI
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            {baseList.length} lowongan dari kolam aktif · dikelompokkan berdasarkan sinyal kompetensi riil, bukan kata kunci
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 11, flexShrink: 0, alignItems: 'center' }}>
                        <span style={{ font: '700 12px/1 "JetBrains Mono", monospace', color: '#94A3B8' }}>
                            {lastUpdatedText}
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || agentLoading}
                            className="kc-btn"
                            style={{ ...topBtn('#fff', KC.ink), padding: '11px 17px', fontSize: 12.5 }}
                        >
                            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform .5s ease' }}>↻</span>
                            {refreshing ? 'Memuat…' : 'Segarkan Kurasi'}
                        </button>
                    </div>
                </div>

                {/* Expandable Confidence Bands Guide */}
                <div>
                    <div
                        onClick={() => setBandsExpanded(!bandsExpanded)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '15px 19px',
                            background: '#fff',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12,
                            boxShadow: `3px 3px 0 ${KC.ink}`,
                            cursor: 'pointer',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, font: '900 14px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                            <span style={{ width: 9, height: 9, background: KC.orange, borderRadius: '50%' }} />
                            Panduan Evaluasi Kecocokan (Confidence Bands)
                        </span>
                        <span style={{ font: '900 21px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                            {bandsExpanded ? '−' : '+'}
                        </span>
                    </div>

                    {bandsExpanded && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 14, animation: 'kcSlideUp .3s both' }}>
                            <div style={{ padding: '16px 18px', background: '#ECFDF5', border: '1px solid #059669', borderRadius: 9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981' }} />
                                    <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Strong Fit</span>
                                </div>
                                <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                    Keahlian dan pengalaman Anda sangat selaras dengan kebutuhan lowongan ini.
                                </span>
                            </div>
                            <div style={{ padding: '16px 18px', background: '#FEF3C7', border: '1px solid #D97706', borderRadius: 9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                                    <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Possible Fit</span>
                                </div>
                                <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                    Kompetensi inti Anda relevan dengan potensi peningkatan pada beberapa keahlian pelengkap.
                                </span>
                            </div>
                            <div style={{ padding: '16px 18px', background: '#E0F2FE', border: '1px solid #0284C7', borderRadius: 9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0284C7' }} />
                                    <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Stretch Fit</span>
                                </div>
                                <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                    Posisi yang menantang untuk pengembangan karir dan peningkatan kapabilitas baru.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 1: Strong Fit */}
                {strongMatches.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                            <span style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }} />
                            <span style={{ font: '900 17px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                Strong Fit (Kecocokan Kuat)
                            </span>
                            <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                {strongMatches.length} lowongan
                            </span>
                            <span style={{ flex: 1, height: 1.5, background: '#E2E8F0' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {strongMatches.map((job, idx) => {
                                const jobScore = job.overall_score ?? job.score ?? 94
                                const sem = job.semantic_score || 96
                                const sk = job.skill_score || 100
                                const loc = job.location_score || 90
                                const sal = job.salary_score || 95
                                const sen = job.seniority_score || 95
                                const isSaved = savedMap[job.id] || (savedJobs || []).some(s => (s.id || s.job_id) === job.id)

                                return (
                                    <div
                                        key={job.id || idx}
                                        style={{
                                            background: '#fff',
                                            border: `1.5px solid ${KC.ink}`,
                                            borderRadius: 13,
                                            boxShadow: `3px 3px 0 ${KC.ink}`,
                                            padding: '22px 24px',
                                            animation: 'kcUp .4s both',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 26 }}>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9, flexWrap: 'wrap' }}>
                                                    <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                        {job.company || job.company_name}
                                                    </span>
                                                    <span style={{ padding: '3px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                        Strong Fit
                                                    </span>
                                                    {job.verified_djp && (
                                                        <span style={{ padding: '3px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#475569' }}>
                                                            ✓ Terverifikasi DJP
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ font: '900 23px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, marginBottom: 9 }}>
                                                    {job.title}
                                                </div>
                                                <div style={{ font: '600 13px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 16 }}>
                                                    {job.location} · {job.work_type} &nbsp;·&nbsp; {job.salary_range || 'Rp 28 jt – Rp 42 jt'}
                                                </div>

                                                {/* AI Analysis */}
                                                <div style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, font: '600 13px/1.6 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 16 }}>
                                                    <b style={{ color: KC.orange }}>Analisis AI:</b> {job.ai_summary || 'Penguasaan keahlian selaras dengan kriteria posisi rekrutmen.'}
                                                </div>

                                                {/* 5-Component Breakdown Micro-Bars (Desktop Proof) */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
                                                    <div>
                                                        <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Semantik</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
                                                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>{sem}</span>
                                                            <span style={{ font: '700 9.5px/1 "JetBrains Mono", monospace', color: '#CBD5E1' }}>×.50</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${sem}%`, background: KC.orange, borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Skill</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
                                                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#0284C7' }}>{sk}</span>
                                                            <span style={{ font: '700 9.5px/1 "JetBrains Mono", monospace', color: '#CBD5E1' }}>×.30</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${sk}%`, background: '#0284C7', borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Lokasi</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
                                                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>{loc}</span>
                                                            <span style={{ font: '700 9.5px/1 "JetBrains Mono", monospace', color: '#CBD5E1' }}>×.10</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${loc}%`, background: '#10B981', borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Gaji</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
                                                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>{sal}</span>
                                                            <span style={{ font: '700 9.5px/1 "JetBrains Mono", monospace', color: '#CBD5E1' }}>×.05</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${sal}%`, background: '#F59E0B', borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Senioritas</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
                                                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#6366F1' }}>{sen}</span>
                                                            <span style={{ font: '700 9.5px/1 "JetBrains Mono", monospace', color: '#CBD5E1' }}>×.05</span>
                                                        </div>
                                                        <div style={{ height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${sen}%`, background: '#6366F1', borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Ring Donut & Action Buttons */}
                                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: 150 }}>
                                                <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                                                    <circle cx="52" cy="52" r="43" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                                                    <circle
                                                        cx="52" cy="52" r="43" fill="none" stroke="#10B981" strokeWidth="7"
                                                        strokeLinecap="round" strokeDasharray="270.2"
                                                        strokeDashoffset={270.2 - (270.2 * (jobScore / 100))}
                                                    />
                                                    <text x="52" y="52" textAnchor="middle" dominantBaseline="central" transform="rotate(90 52 52)" style={{ font: '900 29px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                                        {jobScore}
                                                    </text>
                                                </svg>
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                                    <button
                                                        onClick={() => setSelectedJob(job)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn(KC.orange, '#fff'), padding: 12, fontSize: 12.5, width: '100%', textAlign: 'center' }}
                                                    >
                                                        Lihat Detail &amp; Lamar
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSaveJob(job)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn(isSaved ? '#FFF1EB' : '#fff', isSaved ? '#9A3412' : KC.ink, isSaved ? KC.orange : KC.ink), padding: 11, fontSize: 12, width: '100%', textAlign: 'center' }}
                                                    >
                                                        {isSaved ? 'Tersimpan ✓' : 'Simpan Lowongan'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Section 2: Possible Fit */}
                {possibleMatches.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                            <span style={{ width: 10, height: 10, background: '#F59E0B', borderRadius: '50%' }} />
                            <span style={{ font: '900 17px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                Possible Fit (Potensial)
                            </span>
                            <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                {possibleMatches.length} lowongan
                            </span>
                            <span style={{ flex: 1, height: 1.5, background: '#E2E8F0' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {possibleMatches.map((job, idx) => {
                                const jobScore = job.overall_score ?? job.score ?? 78
                                const isSaved = savedMap[job.id] || (savedJobs || []).some(s => (s.id || s.job_id) === job.id)

                                return (
                                    <div
                                        key={job.id || idx}
                                        style={{
                                            background: '#fff',
                                            border: `1.5px solid ${KC.ink}`,
                                            borderRadius: 13,
                                            boxShadow: `3px 3px 0 ${KC.ink}`,
                                            padding: '22px 24px',
                                            animation: 'kcUp .4s both',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 26 }}>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                                                    <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                        {job.company || job.company_name}
                                                    </span>
                                                    <span style={{ padding: '3px 9px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                        Possible Fit
                                                    </span>
                                                </div>
                                                <div style={{ font: '900 23px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, marginBottom: 9 }}>
                                                    {job.title}
                                                </div>
                                                <div style={{ font: '600 13px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 16 }}>
                                                    {job.location} · {job.work_type} &nbsp;·&nbsp; {job.salary_range || 'Rp 25 jt – Rp 38 jt'}
                                                </div>

                                                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
                                                    {(job.matching_skills || ['Docker', 'Go']).map(s => (
                                                        <span key={s} style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                    {(job.missing_skills || ['Kubernetes', 'CI/CD Pipeline']).map(s => (
                                                        <span key={s} style={{ padding: '6px 12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                            + {s}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div
                                                    onClick={() => navigate('seeker-skill-gap')}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        padding: '13px 17px',
                                                        background: '#FFF1EB',
                                                        border: `1.5px solid ${KC.orange}`,
                                                        borderRadius: 10,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <span style={{ font: '700 12.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#9A3412' }}>
                                                        Tutup {job.missing_skills?.length || 2} gap wajib → kecocokan naik ke <b>89%</b>
                                                    </span>
                                                    <span style={{ font: '800 12.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>
                                                        Lihat rencana belajar →
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: 150 }}>
                                                <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                                                    <circle cx="52" cy="52" r="43" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                                                    <circle
                                                        cx="52" cy="52" r="43" fill="none" stroke="#F59E0B" strokeWidth="7"
                                                        strokeLinecap="round" strokeDasharray="270.2"
                                                        strokeDashoffset={270.2 - (270.2 * (jobScore / 100))}
                                                    />
                                                    <text x="52" y="52" textAnchor="middle" dominantBaseline="central" transform="rotate(90 52 52)" style={{ font: '900 29px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                                        {jobScore}
                                                    </text>
                                                </svg>
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                                    <button
                                                        onClick={() => setSelectedJob(job)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn(KC.ink, '#fff', KC.orange), padding: 12, fontSize: 12.5, width: '100%', textAlign: 'center' }}
                                                    >
                                                        Lihat Detail
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSaveJob(job)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn(isSaved ? '#FFF1EB' : '#fff', isSaved ? '#9A3412' : KC.ink, isSaved ? KC.orange : KC.ink), padding: 11, fontSize: 12, width: '100%', textAlign: 'center' }}
                                                    >
                                                        {isSaved ? 'Tersimpan ✓' : 'Simpan Lowongan'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 05)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Header */}
            <div style={{ paddingBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.9, color: KC.ink, margin: 0, lineHeight: 1.1 }}>
                            Pencocokan AI
                        </h1>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>
                            {lastUpdatedText} · {baseList.length} lowongan
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || agentLoading}
                        style={{
                            padding: '9px 12px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 9, boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                            fontSize: 11.5, fontWeight: 800, color: KC.ink, cursor: 'pointer',
                            minHeight: 38, display: 'flex', alignItems: 'center', gap: 6,
                            fontFamily: 'inherit', flexShrink: 0,
                        }}
                    >
                        <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform .5s ease' }}>↻</span>
                        {refreshing ? 'Memuat…' : 'Refresh'}
                    </button>
                </div>

                {/* Horizontal Filter Pill Carousel */}
                <div style={{ display: 'flex', gap: 6, marginTop: 13, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
                    <button
                        onClick={() => setActiveFilter('all')}
                        style={{
                            padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                            whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                            background: activeFilter === 'all' ? KC.ink : '#FFFFFF',
                            color: activeFilter === 'all' ? '#FFFFFF' : KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                        }}
                    >
                        Semua {baseList.length}
                    </button>
                    <button
                        onClick={() => setActiveFilter('strong')}
                        style={{
                            padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                            whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                            background: activeFilter === 'strong' ? '#ECFDF5' : '#FFFFFF',
                            color: '#065F46',
                            border: '1.5px solid #10B981',
                        }}
                    >
                        ● Strong {strongMatches.length}
                    </button>
                    <button
                        onClick={() => setActiveFilter('possible')}
                        style={{
                            padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                            whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                            background: activeFilter === 'possible' ? '#FEF3C7' : '#FFFFFF',
                            color: '#B45309',
                            border: '1.5px solid #F59E0B',
                        }}
                    >
                        ● Possible {possibleMatches.length}
                    </button>
                    {stretchMatches.length > 0 && (
                        <button
                            onClick={() => setActiveFilter('stretch')}
                            style={{
                                padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                                background: activeFilter === 'stretch' ? '#E0F2FE' : '#FFFFFF',
                                color: '#075985',
                                border: '1.5px solid #0284C7',
                            }}
                        >
                            ● Stretch {stretchMatches.length}
                        </button>
                    )}
                </div>
            </div>

            {/* Fresh Notification */}
            {showFreshNotice && (
                <div style={{
                    background: '#090A0F', border: `1.5px solid ${KC.ink}`,
                    borderRadius: 12, boxShadow: `3px 3px 0 ${KC.orange}`,
                    padding: '13px 15px', animation: 'kcSlideUp .35s both',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 7, height: 7, background: KC.orange, borderRadius: '50%', animation: 'kcPulse 1.4s infinite' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                            Kurasi Terbaru
                        </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fff' }}>
                        {baseList[0]?.company || 'GoTo Group'} · {baseList[0]?.title || 'Senior Backend Engineer'} — {baseList[0]?.score || 94}% Strong Fit
                    </div>
                </div>
            )}

            {/* Mobile Feed Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredList.map((job, idx) => {
                    const jobScore = job.overall_score ?? job.score ?? 88
                    const band = bandOf(job)
                    const isStrong = band === 'strong'

                    return (
                        <div
                            key={job.id || idx}
                            onClick={() => setSelectedJob(job)}
                            style={{
                                background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                                padding: 15, cursor: 'pointer', animation: 'kcUp .4s both',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                                            {job.company || job.company_name}
                                        </span>
                                        <span style={{
                                            padding: '3px 7px', borderRadius: 999, fontSize: 9.5, fontWeight: 800,
                                            background: isStrong ? '#ECFDF5' : '#FEF3C7',
                                            border: `1px solid ${isStrong ? '#10B981' : '#F59E0B'}`,
                                            color: isStrong ? '#065F46' : '#B45309',
                                        }}>
                                            {isStrong ? 'Strong Fit' : 'Possible Fit'}
                                        </span>
                                        {job.verified_djp && (
                                            <span style={{ padding: '3px 7px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: '#475569' }}>
                                                ✓ DJP
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.6, color: KC.ink, marginBottom: 6, lineHeight: 1.2 }}>
                                        {job.title}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
                                        {job.location} · {job.work_type} · {job.salary_range || 'Rp 28–42 jt'}
                                    </div>
                                </div>
                                <svg width="58" height="58" viewBox="0 0 58 58" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                                    <circle cx="29" cy="29" r="23" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
                                    <circle
                                        cx="29" cy="29" r="23" fill="none"
                                        stroke={isStrong ? '#10B981' : '#F59E0B'} strokeWidth="4.5"
                                        strokeLinecap="round" strokeDasharray="144.5"
                                        strokeDashoffset={144.5 - (144.5 * (jobScore / 100))}
                                    />
                                    <text x="29" y="29" textAnchor="middle" dominantBaseline="central" transform="rotate(90 29 29)" style={{ font: '900 16px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                        {jobScore}
                                    </text>
                                </svg>
                            </div>

                            {/* AI Summary Quote */}
                            {job.ai_summary && (
                                <div style={{ marginTop: 12, padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 11.5, lineHeight: 1.5, color: '#334155', fontWeight: 600 }}>
                                    <b style={{ color: KC.orange }}>Analisis AI:</b> {job.ai_summary}
                                </div>
                            )}

                            {/* Skills Tags */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
                                {(job.matching_skills || ['Go', 'PostgreSQL']).map(s => (
                                    <span key={s} style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, fontSize: 10.5, fontWeight: 800, color: '#065F46' }}>
                                        ✓ {s}
                                    </span>
                                ))}
                                {(job.missing_skills || []).map(s => (
                                    <span key={s} style={{ padding: '4px 9px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, fontSize: 10.5, fontWeight: 800, color: '#B45309' }}>
                                        + {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
