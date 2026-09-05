import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { fetchCandidatesForJob } from '../services/api'
import { KC, BrutalCard, topBtn, DesignStyles, useIsMobile } from './_design'
import {
    Users,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Sparkles,
    Inbox,
    Edit3,
    Send,
    FileSearch,
    PhoneCall,
    AlertCircle,
    X,
} from 'lucide-react'

const STAGE_OPTIONS = [
    { key: 'applied', label: 'Terkirim', color: KC.cyan, bg: KC.cyanSoft, icon: Send },
    { key: 'reviewed', label: 'Ditinjau HR', color: KC.yellow, bg: KC.yellowSoft, icon: FileSearch },
    { key: 'interview', label: 'Wawancara', color: KC.orange, bg: KC.orangeSoft, icon: PhoneCall },
    { key: 'offered', label: 'Ditawari', color: KC.orange, bg: KC.orangeSoft, icon: Send },
    { key: 'hired', label: 'Diterima', color: KC.lime, bg: KC.limeSoft, icon: CheckCircle2 },
    { key: 'rejected', label: 'Ditolak', color: '#DC2626', bg: '#FEE2E2', icon: AlertCircle },
]

const ALLOWED_NEXT = {
    applied: ['reviewed', 'interview', 'rejected'],
    reviewed: ['interview', 'offered', 'rejected'],
    interview: ['offered', 'rejected'],
    offered: ['hired', 'rejected'],
    hired: [],
    rejected: [],
    saved: [],
}

const canMoveTo = (current, target) =>
    current === target || (ALLOWED_NEXT[current] || []).includes(target)

const DEFAULT_CURATED_CANDIDATES = [
    {
        id: 'cand-1',
        name: 'Rina Pertiwi',
        score: 94,
        band: 'strong',
        verified: true,
        headline: 'Senior Backend Engineer · 6 thn · Bukalapak',
        location_edu: 'Jakarta · Hybrid · S1 Teknik Informatika ITB',
        matching_skills: ['Go', 'PostgreSQL', 'gRPC', 'Kafka', 'Kubernetes'],
        missing_skills: [],
        explanation: 'Stack 100% selaras. Berpengalaman menangani throughput skala 100k RPS pada payment gateway.',
        email: 'rina.pertiwi@example.com',
        phone: '+62 812-•••-4471',
    },
    {
        id: 'cand-2',
        name: 'Andika Pratama',
        score: 90,
        band: 'strong',
        verified: true,
        headline: 'Backend Tech Lead · 7 thn · Bibit',
        location_edu: 'Jakarta · Remote · S1 Ilmu Komputer UI',
        matching_skills: ['Go', 'PostgreSQL', 'Redis'],
        missing_skills: ['Kafka'],
        explanation: 'Pengalaman arsitektur terdistribusi kuat. Gap Apache Kafka dapat diadaptasi dalam tempo singkat.',
        email: 'andika.pratama@example.com',
        phone: '+62 811-•••-2098',
    },
    {
        id: 'cand-3',
        name: 'Sari Ningrum',
        score: 76,
        band: 'possible',
        verified: false,
        headline: 'Staff Software Engineer · 8 thn · GoTo Group',
        location_edu: 'Bandung · Hybrid · S1 Teknik Elektro ITB',
        matching_skills: ['Go', 'Microservices', 'Docker'],
        missing_skills: ['gRPC'],
        explanation: 'Kandidat memiliki fondasi kuat dalam ekosistem microservices internal, adaptasi gRPC diperkirakan cepat.',
        email: 'sari.ningrum@example.com',
        phone: '+62 813-•••-7712',
    },
    {
        id: 'cand-4',
        name: 'Bayu Wicaksono',
        score: 72,
        band: 'possible',
        verified: false,
        headline: 'Backend Developer · 4 thn · Tokopedia',
        location_edu: 'Jakarta · Hybrid · S1 Sistem Informasi Binus',
        matching_skills: ['Go', 'PostgreSQL'],
        missing_skills: ['Kubernetes', 'gRPC'],
        explanation: 'Pengalaman microservices level menengah, memenuhi kriteria utama Go dan basis data relational.',
        email: 'bayu.w@example.com',
        phone: '+62 812-•••-9901',
    },
    {
        id: 'cand-5',
        name: 'Deni Kurniawan',
        score: 58,
        band: 'stretch',
        verified: false,
        headline: 'Java Backend Specialist · 5 thn · Mandiri Sekuritas',
        location_edu: 'Surabaya · Remote · S1 Informatika ITS',
        matching_skills: ['PostgreSQL', 'Docker'],
        missing_skills: ['Go', 'gRPC'],
        explanation: 'Latar belakang performa backend Java tingkat tinggi, potensi transfer kompetensi ke Go dalam 4-6 minggu.',
        email: 'deni.k@example.com',
        phone: '+62 819-•••-3344',
    },
]

export default function EmployerCandidates() {
    const {
        employerJobs,
        refreshEmployerJobs,
        selectedCandidateJobId,
        employerApplications,
        loadEmployerApplications,
        changeApplicationStatus,
    } = useStore()

    const isMobile = useIsMobile()
    const [activeTab, setActiveTab] = useState('sourcing') // 'sourcing' (Reverse Matching) | 'applications' (Real DB)
    const [selectedJobId, setSelectedJobId] = useState(selectedCandidateJobId || null)
    const [bandsExpanded, setBandsExpanded] = useState(false)
    const [unlockedMap, setUnlockedMap] = useState({})
    const [unlockingMap, setUnlockingMap] = useState({})
    const [noteModalApp, setNoteModalApp] = useState(null)
    const [noteText, setNoteText] = useState('')
    const [savingStatus, setSavingStatus] = useState(false)

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerApplications()
    }, []) // eslint-disable-line

    useEffect(() => {
        if (employerJobs.length && !selectedJobId) {
            setSelectedJobId(selectedCandidateJobId || employerJobs[0].id)
        }
    }, [employerJobs, selectedCandidateJobId])

    const selectedJob = employerJobs.find(j => j.id === selectedJobId) || (employerJobs.length ? employerJobs[0] : { title: 'Senior Backend Engineer (Go)' })

    const handleUnlock = (candId) => {
        setUnlockingMap(prev => ({ ...prev, [candId]: true }))
        setTimeout(() => {
            setUnlockingMap(prev => ({ ...prev, [candId]: false }))
            setUnlockedMap(prev => ({ ...prev, [candId]: true }))
        }, 700)
    }

    const filteredApplications = selectedJobId
        ? employerApplications.filter(a => a.job_id === selectedJobId)
        : employerApplications

    const handleUpdateStatus = async (appId, newStatus, currentNote = '') => {
        try {
            await changeApplicationStatus(appId, newStatus, currentNote)
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const openNoteModal = (app) => {
        setNoteModalApp(app)
        setNoteText(app.note || '')
    }

    const saveNoteModal = async () => {
        if (!noteModalApp) return
        setSavingStatus(true)
        try {
            await changeApplicationStatus(noteModalApp.id, noteModalApp.status, noteText)
            setNoteModalApp(null)
        } catch (err) {
            console.error('Failed to save note:', err)
        } finally {
            setSavingStatus(false)
        }
    }

    const strongCandidates = DEFAULT_CURATED_CANDIDATES.filter(c => c.band === 'strong')
    const possibleCandidates = DEFAULT_CURATED_CANDIDATES.filter(c => c.band === 'possible')
    const stretchCandidates = DEFAULT_CURATED_CANDIDATES.filter(c => c.band === 'stretch')

    // ==========================================
    // DESKTOP V2 LAYOUT (D10)
    // ==========================================
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1184, margin: '0 auto' }}>
                <DesignStyles />

                {/* D10 Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}`, marginBottom: 4 }}>
                    <div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Evaluasi Kandidat Terkurasi
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            Posisi: <b style={{ color: KC.ink }}>{selectedJob.title || 'Senior Backend Engineer (Go)'}</b> · pengelompokan berbasis sinyal kompetensi riil
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {employerJobs.length > 0 ? (
                            <select
                                value={selectedJobId || ''}
                                onChange={e => setSelectedJobId(e.target.value)}
                                style={{
                                    padding: '12px 16px',
                                    background: '#fff',
                                    border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                    font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                    color: KC.ink,
                                    cursor: 'pointer',
                                }}
                            >
                                {employerJobs.map(j => (
                                    <option key={j.id} value={j.id}>{j.title}</option>
                                ))}
                            </select>
                        ) : (
                            <div style={{ padding: '12px 16px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 9, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                Senior Backend Engineer (Go) ▾
                            </div>
                        )}
                    </div>
                </div>

                {/* Subnav Tabs */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        style={{
                            padding: '10px 18px',
                            background: activeTab === 'sourcing' ? KC.ink : '#fff',
                            color: activeTab === 'sourcing' ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 9,
                            boxShadow: activeTab === 'sourcing' ? `3px 3px 0 ${KC.orange}` : `2.5px 2.5px 0 ${KC.ink}`,
                            font: '800 13px/1 "Plus Jakarta Sans", sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Sparkles size={15} color={activeTab === 'sourcing' ? KC.orange : KC.ink} /> Reverse Matching (AI Pool)
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        style={{
                            padding: '10px 18px',
                            background: activeTab === 'applications' ? KC.ink : '#fff',
                            color: activeTab === 'applications' ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 9,
                            boxShadow: activeTab === 'applications' ? `3px 3px 0 ${KC.orange}` : `2.5px 2.5px 0 ${KC.ink}`,
                            font: '800 13px/1 "Plus Jakarta Sans", sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Inbox size={15} /> Pelamar Langsung ({filteredApplications.length})
                    </button>
                </div>

                {/* TAB: Reverse Matching */}
                {activeTab === 'sourcing' && (
                    <>
                        {/* Dark Pool Hero Card */}
                        <div
                            style={{
                                background: KC.ink,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 13,
                                boxShadow: `4px 4px 0 ${KC.orange}`,
                                padding: '22px 26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 32,
                                animation: 'kcUp .4s both',
                            }}
                        >
                            <div>
                                <div style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 11 }}>
                                    Kolam kandidat dipindai
                                </div>
                                <div style={{ font: '900 40px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2px', color: '#fff' }}>
                                    42 <span style={{ fontSize: 16, letterSpacing: '-0.3px', fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>profil aktif</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 14, flex: 'none' }}>
                                <div style={{ padding: '15px 22px', background: 'rgba(16,185,129,.15)', border: '1px solid #10B981', borderRadius: 11, textAlign: 'center' }}>
                                    <div style={{ font: '900 26px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981', letterSpacing: '-1.1px' }}>{strongCandidates.length}</div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Strong</div>
                                </div>
                                <div style={{ padding: '15px 22px', background: 'rgba(245,158,11,.15)', border: '1px solid #F59E0B', borderRadius: 11, textAlign: 'center' }}>
                                    <div style={{ font: '900 26px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B', letterSpacing: '-1.1px' }}>{possibleCandidates.length}</div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Possible</div>
                                </div>
                                <div style={{ padding: '15px 22px', background: 'rgba(2,132,199,.15)', border: '1px solid #0284C7', borderRadius: 11, textAlign: 'center' }}>
                                    <div style={{ font: '900 26px/1 "Plus Jakarta Sans", sans-serif', color: '#38BDF8', letterSpacing: '-1.1px' }}>{stretchCandidates.length}</div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Stretch</div>
                                </div>
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
                                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, animation: 'kcUp .3s both' }}>
                                    <div style={{ padding: '16px 18px', background: '#ECFDF5', border: '1px solid #059669', borderRadius: 9 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981' }} />
                                            <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Strong Fit</span>
                                        </div>
                                        <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                            Kandidat memenuhi kriteria esensial posisi. Sinyal kompetensi sangat relevan untuk dievaluasi.
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px 18px', background: '#FEF3C7', border: '1px solid #D97706', borderRadius: 9 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                                            <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Possible Fit</span>
                                        </div>
                                        <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                            Sebagian besar kriteria utama terpenuhi. Terdapat area pendukung yang dapat dipertimbangkan.
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px 18px', background: '#E0F2FE', border: '1px solid #0284C7', borderRadius: 9 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#0284C7' }} />
                                            <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Stretch Fit</span>
                                        </div>
                                        <span style={{ font: '400 12.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                                            Latar belakang memiliki keahlian yang dapat ditransfer dari industri serupa.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Strong Fit Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 10 }}>
                            <span style={{ width: 10, height: 10, background: '#10B981', borderRadius: '50%' }} />
                            <span style={{ font: '900 17px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                Strong Fit (Kecocokan Kuat)
                            </span>
                            <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                {strongCandidates.length} kandidat
                            </span>
                            <span style={{ flex: 1, height: 1.5, background: '#E2E8F0' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {strongCandidates.map(cand => {
                                const isUnlocked = !!unlockedMap[cand.id]
                                const isUnlocking = !!unlockingMap[cand.id]

                                return (
                                    <div
                                        key={cand.id}
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
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, flexWrap: 'wrap' }}>
                                                    <span style={{ font: '900 21px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.8px', color: KC.ink }}>
                                                        {cand.name}
                                                    </span>
                                                    <span style={{ padding: '3px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                        Strong Fit
                                                    </span>
                                                    {cand.verified && (
                                                        <span style={{ padding: '3px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#475569' }}>
                                                            ✓ Terverifikasi Dukcapil
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ font: '600 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 5 }}>
                                                    {cand.headline}
                                                </div>
                                                <div style={{ font: '600 12px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 15 }}>
                                                    {cand.location_edu}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 15 }}>
                                                    {cand.matching_skills.map((s, idx) => (
                                                        <span key={idx} style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                    {cand.missing_skills.map((s, idx) => (
                                                        <span key={idx} style={{ padding: '6px 12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                            + {s}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, font: '600 13px/1.6 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>
                                                    <b style={{ color: KC.orange }}>Analisis AI:</b> {cand.explanation}
                                                </div>

                                                {isUnlocked && (
                                                    <div style={{ marginTop: 15, padding: '16px 18px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 10, animation: 'kcUp .3s both' }}>
                                                        <div style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#059669', marginBottom: 11 }}>
                                                            Kontak terbuka · Rp 50.000 tercatat
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 26, font: '700 13px/1.5 "JetBrains Mono", monospace', color: '#065F46' }}>
                                                            <span>{cand.email}</span>
                                                            <span>{cand.phone}</span>
                                                        </div>
                                                        <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px dashed #10B981', font: '600 12.5px/1.55 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                            Ringkasan skill grounded terlampir · rekomendasi: jadwalkan wawancara teknis dalam 48 jam.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Donut & Actions */}
                                            <div style={{ flex: 'none', width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                                                <svg width="98" height="98" viewBox="0 0 98 98" style={{ transform: 'rotate(-90deg)' }}>
                                                    <circle cx="49" cy="49" r="40" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                                                    <circle
                                                        cx="49"
                                                        cy="49"
                                                        r="40"
                                                        fill="none"
                                                        stroke="#10B981"
                                                        strokeWidth="7"
                                                        strokeLinecap="round"
                                                        strokeDasharray="251.3"
                                                        strokeDashoffset={251.3 - (251.3 * cand.score) / 100}
                                                    />
                                                    <text
                                                        x="49"
                                                        y="49"
                                                        textAnchor="middle"
                                                        dominantBaseline="central"
                                                        transform="rotate(90 49 49)"
                                                        style={{ font: '900 27px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}
                                                    >
                                                        {cand.score}
                                                    </text>
                                                </svg>

                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ padding: 12, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 9, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink, textAlign: 'center', cursor: 'pointer' }}>
                                                        Lihat CV Lengkap
                                                    </div>
                                                    {!isUnlocked ? (
                                                        <div
                                                            onClick={() => handleUnlock(cand.id)}
                                                            style={{
                                                                padding: '13px 12px',
                                                                background: isUnlocking ? '#64748B' : KC.orange,
                                                                border: `1.5px solid ${KC.ink}`,
                                                                borderRadius: 9,
                                                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                                font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif',
                                                                color: '#fff',
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {isUnlocking ? 'Memproses…' : <>🔒 Unlock Kontak<br />Rp 50.000</>}
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '13px 12px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 9, font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46', textAlign: 'center' }}>
                                                            Kontak Terbuka ✓
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Possible Fit Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 14 }}>
                            <span style={{ width: 10, height: 10, background: '#F59E0B', borderRadius: '50%' }} />
                            <span style={{ font: '900 17px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                Possible Fit (Potensial)
                            </span>
                            <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                {possibleCandidates.length} kandidat
                            </span>
                            <span style={{ flex: 1, height: 1.5, background: '#E2E8F0' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {possibleCandidates.map(cand => {
                                const isUnlocked = !!unlockedMap[cand.id]
                                const isUnlocking = !!unlockingMap[cand.id]

                                return (
                                    <div
                                        key={cand.id}
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
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, flexWrap: 'wrap' }}>
                                                    <span style={{ font: '900 21px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.8px', color: KC.ink }}>
                                                        {cand.name}
                                                    </span>
                                                    <span style={{ padding: '3px 9px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                        Possible Fit
                                                    </span>
                                                    {cand.verified && (
                                                        <span style={{ padding: '3px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#475569' }}>
                                                            ✓ Terverifikasi Dukcapil
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ font: '600 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 5 }}>
                                                    {cand.headline}
                                                </div>
                                                <div style={{ font: '600 12px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 15 }}>
                                                    {cand.location_edu}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 15 }}>
                                                    {cand.matching_skills.map((s, idx) => (
                                                        <span key={idx} style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                    {cand.missing_skills.map((s, idx) => (
                                                        <span key={idx} style={{ padding: '6px 12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                            + {s}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, font: '600 13px/1.6 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>
                                                    <b style={{ color: KC.orange }}>Analisis AI:</b> {cand.explanation}
                                                </div>

                                                {isUnlocked && (
                                                    <div style={{ marginTop: 15, padding: '16px 18px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 10, animation: 'kcUp .3s both' }}>
                                                        <div style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#059669', marginBottom: 11 }}>
                                                            Kontak terbuka · Rp 50.000 tercatat
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 26, font: '700 13px/1.5 "JetBrains Mono", monospace', color: '#065F46' }}>
                                                            <span>{cand.email}</span>
                                                            <span>{cand.phone}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ flex: 'none', width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                                                <svg width="98" height="98" viewBox="0 0 98 98" style={{ transform: 'rotate(-90deg)' }}>
                                                    <circle cx="49" cy="49" r="40" fill="none" stroke="#E2E8F0" strokeWidth="7" />
                                                    <circle
                                                        cx="49"
                                                        cy="49"
                                                        r="40"
                                                        fill="none"
                                                        stroke="#F59E0B"
                                                        strokeWidth="7"
                                                        strokeLinecap="round"
                                                        strokeDasharray="251.3"
                                                        strokeDashoffset={251.3 - (251.3 * cand.score) / 100}
                                                    />
                                                    <text
                                                        x="49"
                                                        y="49"
                                                        textAnchor="middle"
                                                        dominantBaseline="central"
                                                        transform="rotate(90 49 49)"
                                                        style={{ font: '900 27px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}
                                                    >
                                                        {cand.score}
                                                    </text>
                                                </svg>

                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ padding: 12, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 9, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink, textAlign: 'center', cursor: 'pointer' }}>
                                                        Lihat CV Lengkap
                                                    </div>
                                                    {!isUnlocked ? (
                                                        <div
                                                            onClick={() => handleUnlock(cand.id)}
                                                            style={{
                                                                padding: '13px 12px',
                                                                background: isUnlocking ? '#64748B' : KC.orange,
                                                                border: `1.5px solid ${KC.ink}`,
                                                                borderRadius: 9,
                                                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                                font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif',
                                                                color: '#fff',
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {isUnlocking ? 'Memproses…' : <>🔒 Unlock Kontak<br />Rp 50.000</>}
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '13px 12px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 9, font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46', textAlign: 'center' }}>
                                                            Kontak Terbuka ✓
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* TAB: Real DB Applications (Desktop) */}
                {activeTab === 'applications' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredApplications.length === 0 ? (
                            <BrutalCard color="#FFFFFF" padding={36}>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: KC.cyanSoft, display: 'grid', placeItems: 'center', border: `1.5px solid ${KC.ink}` }}>
                                        <Inbox size={24} color={KC.ink} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: KC.ink, margin: 0 }}>
                                        Belum Ada Pelamar Langsung
                                    </h3>
                                    <p style={{ fontSize: 13, color: KC.mute, margin: 0, maxWidth: 440 }}>
                                        Pelamar yang mengirimkan lamaran dari portal pencarian atau hasil pencocokan akan otomatis muncul di sini secara real-time.
                                    </p>
                                </div>
                            </BrutalCard>
                        ) : (
                            filteredApplications.map((app, idx) => {
                                const currentOpt = STAGE_OPTIONS.find(s => s.key === app.status) || STAGE_OPTIONS[0]

                                return (
                                    <div
                                        key={app.id || idx}
                                        style={{
                                            background: '#fff',
                                            border: `1.5px solid ${KC.ink}`,
                                            borderRadius: 13,
                                            boxShadow: `3px 3px 0 ${KC.ink}`,
                                            padding: '20px 24px',
                                            animation: 'kcUp .4s both',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                                            <div>
                                                <div style={{ font: '900 18px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 4 }}>
                                                    {app.seeker_name}
                                                </div>
                                                <div style={{ font: '600 13px/1.4 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                    {app.headline || 'Pencari Kerja Aktif'} · Melamar pada: <b>{app.job_title}</b>
                                                </div>
                                            </div>
                                            <span style={{ padding: '6px 14px', background: currentOpt.bg, border: `1px solid ${currentOpt.color}`, borderRadius: 999, font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: currentOpt.color }}>
                                                {currentOpt.label}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>Ubah Tahapan Status:</span>
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleUpdateStatus(app.id, e.target.value, app.note)}
                                                style={{
                                                    padding: '8px 14px',
                                                    border: `1.5px solid ${KC.ink}`,
                                                    borderRadius: 8,
                                                    fontWeight: 700,
                                                    fontSize: 12.5,
                                                    background: currentOpt.bg,
                                                    color: currentOpt.color,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {STAGE_OPTIONS.map(opt => (
                                                    <option key={opt.key} value={opt.key} disabled={!canMoveTo(app.status, opt.key)}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => openNoteModal(app)}
                                                className="kc-btn"
                                                style={{ ...topBtn('#fff', KC.ink), padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <Edit3 size={13} /> Catatan Tahapan
                                            </button>
                                        </div>

                                        {app.note && (
                                            <div style={{ marginTop: 12, padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, fontSize: 12.5, color: '#334155' }}>
                                                <b>Catatan untuk Pelamar:</b> {app.note}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {/* Note Edit Modal */}
                {noteModalApp && (
                    <div
                        onClick={() => setNoteModalApp(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(9, 10, 15, 0.65)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 20,
                            backdropFilter: 'blur(3px)',
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#FFFFFF',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 14,
                                boxShadow: `4px 4px 0 ${KC.ink}`,
                                maxWidth: 500,
                                width: '100%',
                                padding: 24,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: KC.ink }}>Catatan Tahapan Rekruter</h3>
                                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Untuk: <b>{noteModalApp.seeker_name}</b></span>
                                </div>
                                <button onClick={() => setNoteModalApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Contoh: Jadwal wawancara teknis pada 8 Sep 2026 pukul 14:00 WIB via Google Meet."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 9,
                                    fontSize: 13,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                    marginBottom: 16,
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button onClick={() => setNoteModalApp(null)} style={{ ...topBtn('#fff', KC.ink), padding: '10px 16px', fontSize: 12.5 }}>
                                    Batal
                                </button>
                                <button onClick={saveNoteModal} disabled={savingStatus} style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 18px', fontSize: 12.5 }}>
                                    {savingStatus ? 'Menyimpan...' : 'Simpan Catatan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ==========================================
    // MOBILE LAYOUT (FRAME 15)
    // ==========================================
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DesignStyles />

            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
                    <div>
                        <h1 style={{ font: '900 21px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, margin: 0 }}>
                            Kandidat Terkurasi
                        </h1>
                        <div style={{ font: '600 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginTop: 4 }}>
                            {selectedJob.title || 'Senior Backend Engineer (Go)'} · 42 profil dipindai
                        </div>
                    </div>

                    {employerJobs.length > 0 && (
                        <select
                            value={selectedJobId || ''}
                            onChange={e => setSelectedJobId(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: 12,
                                background: '#fff',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                            }}
                        >
                            {employerJobs.map(j => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Subnav Tabs */}
                <div style={{ display: 'flex', gap: 8, borderBottom: '1.5px solid #CBD5E1', paddingBottom: 8, marginTop: 10 }}>
                    <button
                        onClick={() => setActiveTab('sourcing')}
                        style={{
                            padding: '8px 14px',
                            background: activeTab === 'sourcing' ? KC.ink : '#fff',
                            color: activeTab === 'sourcing' ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 8,
                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Sparkles size={14} color={activeTab === 'sourcing' ? KC.orange : KC.ink} /> Reverse Matching (AI)
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        style={{
                            padding: '8px 14px',
                            background: activeTab === 'applications' ? KC.ink : '#fff',
                            color: activeTab === 'applications' ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 8,
                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Inbox size={14} /> Pelamar Masuk ({filteredApplications.length})
                    </button>
                </div>
            </div>

            {/* TAB: Reverse Matching */}
            {activeTab === 'sourcing' && (
                <>
                    {/* Reverse Matching Talent Pool Breakdown */}
                    <div
                        style={{
                            background: KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12,
                            boxShadow: `3px 3px 0 ${KC.orange}`,
                            padding: 14,
                            animation: 'kcUp .4s both',
                        }}
                    >
                        <div style={{ font: '800 9.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 11 }}>
                            Reverse matching · kolam kandidat
                        </div>
                        <div style={{ display: 'flex', gap: 9 }}>
                            <div style={{ flex: 1, padding: '10px 9px', background: 'rgba(16,185,129,.15)', border: '1px solid #10B981', borderRadius: 9 }}>
                                <div style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>{strongCandidates.length}</div>
                                <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Strong</div>
                            </div>
                            <div style={{ flex: 1, padding: '10px 9px', background: 'rgba(245,158,11,.15)', border: '1px solid #F59E0B', borderRadius: 9 }}>
                                <div style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>{possibleCandidates.length}</div>
                                <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Possible</div>
                            </div>
                            <div style={{ flex: 1, padding: '10px 9px', background: 'rgba(2,132,199,.15)', border: '1px solid #0284C7', borderRadius: 9 }}>
                                <div style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: '#38BDF8' }}>{stretchCandidates.length}</div>
                                <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.6)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Stretch</div>
                            </div>
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
                                padding: '12px 14px',
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                cursor: 'pointer',
                                minHeight: 46,
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '900 12px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                <span style={{ width: 8, height: 8, background: KC.orange, borderRadius: '50%' }} />
                                Panduan Confidence Bands
                            </span>
                            <span style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                {bandsExpanded ? '−' : '+'}
                            </span>
                        </div>

                        {bandsExpanded && (
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, animation: 'kcSlideUp .3s both' }}>
                                <div style={{ padding: '11px 13px', background: '#ECFDF5', border: '1px solid #059669', borderRadius: 9 }}>
                                    <div style={{ font: '900 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', marginBottom: 4 }}>Strong Fit</div>
                                    <div style={{ font: '400 11px/1.45 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>Kandidat memenuhi kriteria esensial posisi. Sinyal kompetensi sangat relevan untuk dievaluasi.</div>
                                </div>
                                <div style={{ padding: '11px 13px', background: '#FEF3C7', border: '1px solid #D97706', borderRadius: 9 }}>
                                    <div style={{ font: '900 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#92400E', marginBottom: 4 }}>Possible Fit</div>
                                    <div style={{ font: '400 11px/1.45 "Plus Jakarta Sans", sans-serif', color: '#92400E' }}>Sebagian besar kriteria utama terpenuhi. Terdapat area pendukung yang dapat dipertimbangkan.</div>
                                </div>
                                <div style={{ padding: '11px 13px', background: '#E0F2FE', border: '1px solid #0284C7', borderRadius: 9 }}>
                                    <div style={{ font: '900 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#075985', marginBottom: 4 }}>Stretch Fit</div>
                                    <div style={{ font: '400 11px/1.45 "Plus Jakarta Sans", sans-serif', color: '#075985' }}>Latar belakang memiliki keahlian yang dapat ditransfer dari industri serupa.</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 1: Strong Fit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ width: 9, height: 9, background: '#10B981', borderRadius: '50%' }} />
                        <span style={{ font: '900 13.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Strong Fit</span>
                        <span style={{ font: '600 11px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>{strongCandidates.length} kandidat</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {strongCandidates.map(cand => {
                            const isUnlocked = !!unlockedMap[cand.id]
                            const isUnlocking = !!unlockingMap[cand.id]

                            return (
                                <div
                                    key={cand.id}
                                    style={{
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 13,
                                        boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: 15,
                                        animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11, marginBottom: 9 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                                                <span style={{ font: '900 15.5px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                                    {cand.name}
                                                </span>
                                                <span style={{ padding: '3px 7px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                    Strong Fit
                                                </span>
                                            </div>
                                            <div style={{ font: '600 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>
                                                {cand.headline}
                                            </div>
                                            <div style={{ font: '600 10.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginTop: 3 }}>
                                                {cand.location_edu}
                                            </div>
                                        </div>

                                        {/* Score Donut SVG */}
                                        <svg width="52" height="52" viewBox="0 0 52 52" style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
                                            <circle cx="26" cy="26" r="21" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                                            <circle
                                                cx="26"
                                                cy="26"
                                                r="21"
                                                fill="none"
                                                stroke="#10B981"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeDasharray="132"
                                                strokeDashoffset={132 - (132 * cand.score) / 100}
                                            />
                                            <text
                                                x="26"
                                                y="26"
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                transform="rotate(90 26 26)"
                                                style={{ font: '900 14px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}
                                            >
                                                {cand.score}
                                            </text>
                                        </svg>
                                    </div>

                                    {cand.verified && (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 10px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                                            ✓ Terverifikasi Dukcapil
                                        </div>
                                    )}

                                    {/* Skills */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                        {cand.matching_skills.map((s, idx) => (
                                            <span key={idx} style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                ✓ {s}
                                            </span>
                                        ))}
                                        {cand.missing_skills.map((s, idx) => (
                                            <span key={idx} style={{ padding: '4px 9px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                + {s}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Grounded AI Analysis */}
                                    <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9, font: '600 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 12 }}>
                                        <b style={{ color: KC.orange }}>Analisis AI:</b> {cand.explanation}
                                    </div>

                                    {/* Unlock Button & Reveal */}
                                    <div style={{ display: 'flex', gap: 9 }}>
                                        <button
                                            className="kc-btn"
                                            style={{
                                                flex: 'none',
                                                padding: '11px 13px',
                                                background: '#fff',
                                                border: `1.5px solid ${KC.ink}`,
                                                borderRadius: 9,
                                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                                                color: KC.ink,
                                                minHeight: 44,
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Lihat CV
                                        </button>
                                        {!isUnlocked ? (
                                            <button
                                                onClick={() => handleUnlock(cand.id)}
                                                disabled={isUnlocking}
                                                className="kc-btn"
                                                style={{
                                                    flex: 1,
                                                    padding: '11px 13px',
                                                    background: isUnlocking ? '#64748B' : KC.orange,
                                                    border: `1.5px solid ${KC.ink}`,
                                                    borderRadius: 9,
                                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                    font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    minHeight: 44,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {isUnlocking ? 'Memproses…' : '🔒 Unlock Kontak · Rp 50.000'}
                                            </button>
                                        ) : (
                                            <div style={{ flex: 1, padding: '11px 13px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 9, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Kontak Terbuka ✓
                                            </div>
                                        )}
                                    </div>

                                    {isUnlocked && (
                                        <div style={{ marginTop: 12, padding: 13, background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 10, animation: 'kcSlideUp .35s both' }}>
                                            <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#059669', marginBottom: 9 }}>
                                                Kontak terbuka
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: '700 12px/1.4 "JetBrains Mono", monospace', color: '#065F46' }}>
                                                <span>{cand.email}</span>
                                                <span>{cand.phone}</span>
                                            </div>
                                            <div style={{ marginTop: 11, paddingTop: 11, borderTop: '1px dashed #10B981', font: '600 11px/1.45 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                Ringkasan skill grounded terlampir · rekomendasi jadwalkan wawancara teknis.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Section 2: Possible Fit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <span style={{ width: 9, height: 9, background: '#F59E0B', borderRadius: '50%' }} />
                        <span style={{ font: '900 13.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Possible Fit</span>
                        <span style={{ font: '600 11px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>{possibleCandidates.length} kandidat</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {possibleCandidates.map(cand => {
                            const isUnlocked = !!unlockedMap[cand.id]
                            const isUnlocking = !!unlockingMap[cand.id]

                            return (
                                <div
                                    key={cand.id}
                                    style={{
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 13,
                                        boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: 15,
                                        animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11, marginBottom: 9 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                                                <span style={{ font: '900 15.5px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink }}>
                                                    {cand.name}
                                                </span>
                                                <span style={{ padding: '3px 7px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                    Possible Fit
                                                </span>
                                            </div>
                                            <div style={{ font: '600 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>
                                                {cand.headline}
                                            </div>
                                            <div style={{ font: '600 10.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginTop: 3 }}>
                                                {cand.location_edu}
                                            </div>
                                        </div>

                                        <svg width="52" height="52" viewBox="0 0 52 52" style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
                                            <circle cx="26" cy="26" r="21" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                                            <circle
                                                cx="26"
                                                cy="26"
                                                r="21"
                                                fill="none"
                                                stroke="#F59E0B"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeDasharray="132"
                                                strokeDashoffset={132 - (132 * cand.score) / 100}
                                            />
                                            <text
                                                x="26"
                                                y="26"
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                transform="rotate(90 26 26)"
                                                style={{ font: '900 14px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}
                                            >
                                                {cand.score}
                                            </text>
                                        </svg>
                                    </div>

                                    {/* Skills */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                        {cand.matching_skills.map((s, idx) => (
                                            <span key={idx} style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                ✓ {s}
                                            </span>
                                        ))}
                                        {cand.missing_skills.map((s, idx) => (
                                            <span key={idx} style={{ padding: '4px 9px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                + {s}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Unlock Button & Reveal */}
                                    <div style={{ display: 'flex', gap: 9 }}>
                                        <button
                                            className="kc-btn"
                                            style={{
                                                flex: 'none',
                                                padding: '11px 13px',
                                                background: '#fff',
                                                border: `1.5px solid ${KC.ink}`,
                                                borderRadius: 9,
                                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                                                color: KC.ink,
                                                minHeight: 44,
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Lihat CV
                                        </button>
                                        {!isUnlocked ? (
                                            <button
                                                onClick={() => handleUnlock(cand.id)}
                                                disabled={isUnlocking}
                                                className="kc-btn"
                                                style={{
                                                    flex: 1,
                                                    padding: '11px 13px',
                                                    background: isUnlocking ? '#64748B' : KC.orange,
                                                    border: `1.5px solid ${KC.ink}`,
                                                    borderRadius: 9,
                                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                                    font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    minHeight: 44,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {isUnlocking ? 'Memproses…' : '🔒 Unlock Kontak · Rp 50.000'}
                                            </button>
                                        ) : (
                                            <div style={{ flex: 1, padding: '11px 13px', background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 9, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Kontak Terbuka ✓
                                            </div>
                                        )}
                                    </div>

                                    {isUnlocked && (
                                        <div style={{ marginTop: 12, padding: 13, background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 10, animation: 'kcSlideUp .35s both' }}>
                                            <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#059669', marginBottom: 9 }}>
                                                Kontak terbuka
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: '700 12px/1.4 "JetBrains Mono", monospace', color: '#065F46' }}>
                                                <span>{cand.email}</span>
                                                <span>{cand.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* TAB: Real DB Applications */}
            {activeTab === 'applications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredApplications.length === 0 ? (
                        <BrutalCard color="#FFFFFF" padding={28}>
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: KC.cyanSoft, display: 'grid', placeItems: 'center', border: `1.5px solid ${KC.ink}` }}>
                                    <Inbox size={20} color={KC.ink} />
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 900, color: KC.ink, margin: 0 }}>
                                    Belum Ada Pelamar Langsung
                                </h3>
                                <p style={{ fontSize: 12, color: KC.mute, margin: 0, maxWidth: 360 }}>
                                    Pelamar yang mengirimkan lamaran dari portal kerja akan langsung muncul di sini.
                                </p>
                            </div>
                        </BrutalCard>
                    ) : (
                        filteredApplications.map((app, idx) => {
                            const currentOpt = STAGE_OPTIONS.find(s => s.key === app.status) || STAGE_OPTIONS[0]

                            return (
                                <div
                                    key={app.id || idx}
                                    style={{
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 13,
                                        boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: 16,
                                        animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                                        <div>
                                            <div style={{ font: '900 16px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 4 }}>
                                                {app.seeker_name}
                                            </div>
                                            <div style={{ font: '600 12px/1.3 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                {app.headline || 'Pencari Kerja Aktif'} · Posisi: <b>{app.job_title}</b>
                                            </div>
                                        </div>
                                        <span style={{ padding: '4px 9px', background: currentOpt.bg, border: `1px solid ${currentOpt.color}`, borderRadius: 999, font: '800 10px/1 "Plus Jakarta Sans", sans-serif', color: currentOpt.color }}>
                                            {currentOpt.label}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>Ubah Status:</span>
                                        <select
                                            value={app.status}
                                            onChange={(e) => handleUpdateStatus(app.id, e.target.value, app.note)}
                                            style={{
                                                padding: '6px 10px',
                                                border: `1.5px solid ${KC.ink}`,
                                                borderRadius: 6,
                                                fontWeight: 700,
                                                fontSize: 12,
                                                background: currentOpt.bg,
                                                color: currentOpt.color,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {STAGE_OPTIONS.map(opt => (
                                                <option key={opt.key} value={opt.key} disabled={!canMoveTo(app.status, opt.key)}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => openNoteModal(app)}
                                            className="kc-btn"
                                            style={{ ...topBtn('#fff', KC.ink), padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            <Edit3 size={12} /> Catatan Tahapan
                                        </button>
                                    </div>

                                    {app.note && (
                                        <div style={{ marginTop: 10, padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11.5, color: '#334155' }}>
                                            <b>Catatan untuk Pelamar:</b> {app.note}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Note Edit Modal */}
            {noteModalApp && (
                <div
                    onClick={() => setNoteModalApp(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(9, 10, 15, 0.65)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        backdropFilter: 'blur(3px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 14,
                            boxShadow: `4px 4px 0 ${KC.ink}`,
                            maxWidth: 480,
                            width: '100%',
                            padding: 20,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: KC.ink }}>Catatan Tahapan Rekruter</h3>
                                <span style={{ fontSize: 11.5, color: '#94A3B8' }}>Untuk: <b>{noteModalApp.seeker_name}</b></span>
                            </div>
                            <button onClick={() => setNoteModalApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Contoh: Jadwal wawancara teknis pada 8 Sep 2026 pukul 14:00 WIB via Google Meet."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 8,
                                fontSize: 12.5,
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                marginBottom: 14,
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setNoteModalApp(null)} style={{ ...topBtn('#fff', KC.ink), padding: '8px 14px', fontSize: 12 }}>
                                Batal
                            </button>
                            <button onClick={saveNoteModal} disabled={savingStatus} style={{ ...topBtn(KC.orange, '#fff'), padding: '8px 16px', fontSize: 12 }}>
                                {savingStatus ? 'Menyimpan...' : 'Simpan Catatan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
