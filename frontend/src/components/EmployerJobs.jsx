import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, topBtn, Tag, DesignStyles } from './_design'
import { Plus, Users, ChevronDown, ChevronUp, Edit3, ArrowLeft, ArrowRight, Building2, MapPin } from 'lucide-react'

export default function EmployerJobs() {
    const { employerJobs, refreshEmployerJobs, navigate } = useStore()
    const [openJobId, setOpenJobId] = useState(null)

    useEffect(() => {
        refreshEmployerJobs()
    }, []) // eslint-disable-line

    const display = employerJobs && employerJobs.length ? employerJobs : DEMO_JOBS

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Manajemen Lowongan
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {display.length} posisi terdaftar · Pantau statistik pelamar dan kurasi talenta aktif
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('employer-dashboard')} style={topBtn('#fff')}>
                        <ArrowLeft size={14} /> Kembali ke Dashboard
                    </button>
                    <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn(KC.orange, '#fff')}>
                        <Plus size={14} /> Pasang Lowongan Baru
                    </button>
                </div>
            </header>

            {/* Job List */}
            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {display.map((job, idx) => {
                    const isOpen = openJobId === (job.id || idx)
                    const isLive = job.is_active !== false

                    return (
                        <BrutalCard key={job.id || idx} color="#FFFFFF" padding={20}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ padding: '2px 8px', background: isLive ? KC.limeSoft : KC.surfaceAlt, border: `1px solid ${isLive ? KC.lime : KC.borderMuted}`, borderRadius: 6, fontSize: 10, fontWeight: 800, color: isLive ? '#047857' : KC.mute }}>
                                            {isLive ? '● LIVE' : 'DRAFT'}
                                        </span>
                                        <span style={{ fontSize: 12, color: KC.mute }}>
                                            {job.age || 'Aktif'}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', color: KC.ink, letterSpacing: -0.3 }}>
                                        {job.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute }}>
                                        <span>{job.location || 'Jakarta · Hybrid'}</span>
                                        <span>·</span>
                                        <span>{job.salary_range || 'Rp 28.000.000 - Rp 42.000.000'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: KC.ink }}>{job.application_count || job.app || 84}</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: KC.mute, textTransform: 'uppercase' }}>Pelamar</div>
                                    </div>
                                    <button
                                        onClick={() => setOpenJobId(isOpen ? null : (job.id || idx))}
                                        className="kc-btn"
                                        style={{ ...topBtn('#fff', KC.ink), padding: '8px 12px', fontSize: 12 }}
                                    >
                                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Detail Ringkas
                                    </button>
                                    <button
                                        onClick={() => navigate('employer-candidates')}
                                        className="kc-btn"
                                        style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 12 }}
                                    >
                                        <Users size={14} /> Review Kandidat
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${KC.ash}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
                                    <div style={{ display: 'flex', gap: 20, color: KC.mute }}>
                                        <span>Kategori: <b>Software Engineering</b></span>
                                        <span>Konversi Lamaran: <b>14 / minggu</b></span>
                                        <span>Tingkat Kecocokan: <b>88% Rata-rata</b></span>
                                    </div>
                                    <button onClick={() => navigate('employer-post-job')} style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 11 }}>
                                        <Edit3 size={12} /> Edit Lowongan
                                    </button>
                                </div>
                            )}
                        </BrutalCard>
                    )
                })}
            </div>
        </div>
    )
}

const DEMO_JOBS = [
    { id: 'd1', title: 'Senior Backend Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 28jt - Rp 42jt', age: 'Dipublikasi 3 hari lalu', app: 94 },
    { id: 'd2', title: 'Product Designer (UI/UX)', location: 'Jakarta · Remote', salary_range: 'Rp 18jt - Rp 26jt', age: 'Dipublikasi 7 hari lalu', app: 112 },
    { id: 'd3', title: 'Tech Lead Infrastructure', location: 'Jakarta · Hybrid', salary_range: 'Rp 35jt - Rp 50jt', age: 'Dipublikasi 12 hari lalu', app: 58 },
    { id: 'd4', title: 'Data Platform Engineer', location: 'Bandung · Onsite', salary_range: 'Rp 20jt - Rp 32jt', age: 'Draft tersimpan', app: 0, is_active: false },
]
