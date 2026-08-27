import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, Tag, topBtn, DesignStyles } from './_design'
import { Briefcase, Users, Sparkles, Eye, Plus, ArrowRight, ShieldCheck, TrendingUp, Building2, MapPin } from 'lucide-react'

export default function EmployerDashboard() {
    const { user, employerJobs, refreshEmployerJobs, navigate, navigateToCandidates, employerProfile, loadEmployerProfile } = useStore()
    const [openJobId, setOpenJobId] = useState(null)

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerProfile()
    }, []) // eslint-disable-line

    const activeJobs = (employerJobs || []).filter(j => j.is_active !== false)
    const totalApplications = activeJobs.reduce((sum, j) => sum + (j.application_count || 0), 0) || 287
    const display = activeJobs.length ? activeJobs.slice(0, 4) : DEMO_JOBS
    const avgTopMatch = activeJobs.length
        ? Math.round(activeJobs.reduce((s, j) => s + (j.top_match_avg || 84), 0) / activeJobs.length)
        : 84

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Dashboard Rekrutmen
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Selamat datang kembali, <b>{employerProfile?.company_name || 'GoTo Group'}</b> · {display.length} lowongan aktif terpublikasi
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('employer-candidates')} style={topBtn('#fff')}>
                        <Users size={14} /> Top Kandidat AI
                    </button>
                    <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn(KC.orange, '#fff')}>
                        <Plus size={14} /> Pasang Lowongan Baru
                    </button>
                </div>
            </header>

            {/* Metric KPI Grid */}
            <div className="kc-grid-4 kc-stagger">
                <FilledStat
                    label="Lowongan Aktif"
                    value={String(display.length)}
                    sub={`Dari 10 kuota terdaftar`}
                    icon={<Briefcase size={16} />}
                    accent={KC.ink}
                    onClick={() => navigate('employer-jobs')}
                />
                <FilledStat
                    label="Total Pelamar Masuk"
                    value={String(totalApplications)}
                    sub="Pada seluruh posisi aktif"
                    icon={<Users size={16} />}
                    accent={KC.cyan}
                    onClick={() => navigate('employer-candidates')}
                />
                <FilledStat
                    label="Avg Match Rate AI"
                    value={`${avgTopMatch}%`}
                    sub="Kesesuaian kandidat teratas"
                    icon={<Sparkles size={16} />}
                    accent={KC.yellow}
                    onClick={() => navigate('employer-candidates')}
                />
                <FilledStat
                    label="Kandidat Shortlisted"
                    value="42"
                    sub="Tersimpan dalam review"
                    icon={<Eye size={16} />}
                    accent={KC.lime}
                    onClick={() => navigate('employer-candidates')}
                />
            </div>

            {/* Main Content Layout */}
            <div className="kc-grid-main">
                {/* Left Column: Active Vacancies */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, margin: 0, color: KC.ink }}>
                                Lowongan Aktif Perusahaan
                            </h2>
                            <p style={{ fontSize: 12, color: KC.mute, margin: '2px 0 0' }}>
                                Manajemen pipeline pelamar dan hasil kurasi kecocokan AI
                            </p>
                        </div>
                        <button onClick={() => navigate('employer-jobs')} style={{ background: 'none', border: 'none', color: KC.orange, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                            Lihat Semua →
                        </button>
                    </div>

                    <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {display.map((j, idx) => (
                            <BrutalCard key={j.id || idx} color="#FFFFFF" padding={18}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ padding: '2px 8px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#047857' }}>
                                                ● LIVE
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: KC.mute }}>
                                                Dipublikasi {j.age || '5 hari lalu'}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: KC.ink }}>
                                            {j.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute }}>
                                            <span>{j.location || 'Jakarta · Hybrid'}</span>
                                            <span>·</span>
                                            <span>{j.salary_range || 'Rp 28jt - Rp 42jt'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: KC.ink }}>{j.app || 84}</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: KC.mute, textTransform: 'uppercase' }}>Pelamar</div>
                                        </div>
                                        <button
                                            onClick={() => navigate('employer-candidates')}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 14px', fontSize: 12 }}
                                        >
                                            Review Kandidat →
                                        </button>
                                    </div>
                                </div>
                            </BrutalCard>
                        ))}
                    </div>
                </div>

                {/* Right Column: Plan & Verification Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Subscription Card */}
                    <BrutalCard color="#FFFFFF" padding={20}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>Paket Layanan</span>
                            <Tag color={KC.indigoSoft} ink={KC.indigo} border={KC.indigo} size="sm">
                                GROWTH TIER
                            </Tag>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: KC.ink, letterSpacing: -0.5, margin: '4px 0 10px' }}>
                            Rp 1.500.000 <span style={{ fontSize: 12, color: KC.mute, fontWeight: 600 }}>/bulan</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: KC.inkLight, borderTop: `1px solid ${KC.ash}`, paddingTop: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Kuota Lowongan</span><b>{display.length} / 10 Digunakan</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Kurasi Kandidat</span><b>Top-10 AI Ranking</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Integrasi ATS</span><b>Mendukung Ekspor CSV</b>
                            </div>
                        </div>
                    </BrutalCard>

                    {/* Trust / Verification Status */}
                    <BrutalCard color="#FFFFFF" padding={20}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: KC.limeSoft, border: `1px solid ${KC.lime}`, display: 'grid', placeItems: 'center', color: KC.lime, flexShrink: 0 }}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px', color: KC.ink }}>NPWP Terverifikasi Resmi</h4>
                                <p style={{ fontSize: 12, color: KC.mute, lineHeight: 1.4, margin: '0 0 10px' }}>
                                    Entitas institusi terdaftar pada pangkalan data DJP Online.
                                </p>
                                <button onClick={() => navigate('employer-verification')} style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 11 }}>
                                    Lihat Sertifikasi Legalitas →
                                </button>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}

const DEMO_JOBS = [
    { id: 'd1', title: 'Senior Backend Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 28jt - Rp 42jt', age: '3 hari lalu', app: 94 },
    { id: 'd2', title: 'Product Designer (UI/UX)', location: 'Jakarta · Remote', salary_range: 'Rp 18jt - Rp 26jt', age: '7 hari lalu', app: 112 },
    { id: 'd3', title: 'Tech Lead Infrastructure', location: 'Jakarta · Hybrid', salary_range: 'Rp 35jt - Rp 50jt', age: '12 hari lalu', app: 58 },
    { id: 'd4', title: 'Data Platform Engineer', location: 'Bandung · Onsite', salary_range: 'Rp 20jt - Rp 32jt', age: '14 hari lalu', app: 23 },
]
