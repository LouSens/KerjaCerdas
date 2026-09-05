import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, Tag, topBtn, DesignStyles } from './_design'
import { Briefcase, Users, Plus, ArrowRight, ShieldCheck, TrendingUp, Building2, MapPin } from 'lucide-react'

function formatRelativeAge(iso) {
    if (!iso) return null
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (Number.isNaN(days) || days < 0) return null
    if (days === 0) return 'hari ini'
    if (days === 1) return '1 hari lalu'
    return `${days} hari lalu`
}

function formatSalaryRange(min, max) {
    if (!min && !max) return null
    const fmt = (n) => `Rp ${Math.round(n / 1_000_000)}jt`
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    return fmt(min || max)
}

export default function EmployerDashboard() {
    const { user, employerJobs, refreshEmployerJobs, navigate, navigateToCandidates, employerProfile, loadEmployerProfile } = useStore()
    const [openJobId, setOpenJobId] = useState(null)

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerProfile()
    }, []) // eslint-disable-line

    const activeJobs = (employerJobs || []).filter(j => j.is_active !== false)
    const totalApplications = activeJobs.reduce((sum, j) => sum + (j.application_count || 0), 0)
    const display = activeJobs.slice(0, 4)
    const verified = employerProfile?.verified === 'verified'

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
                        Selamat datang kembali, <b>{employerProfile?.company_name || 'Perusahaan Anda'}</b> · {display.length} lowongan aktif terpublikasi
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

            {/* Metric KPI Grid — only metrics the backend actually computes.
                A per-job "avg match rate" and a "shortlisted" count were shown
                here before, but no endpoint ever populates either field, so
                they always rendered the same fabricated numbers regardless of
                real data. */}
            <div className="kc-grid-2-col kc-stagger">
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

                    {display.length === 0 ? (
                        <BrutalCard color="#FFFFFF" padding={24} style={{ textAlign: 'center', color: KC.mute }}>
                            Belum ada lowongan aktif. Pasang lowongan pertama untuk mulai menerima pelamar.
                        </BrutalCard>
                    ) : (
                        <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {display.map((j, idx) => (
                                <BrutalCard key={j.id || idx} color="#FFFFFF" padding={18}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ padding: '2px 8px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#047857' }}>
                                                    ● LIVE
                                                </span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color: KC.mute }}>
                                                    Dipublikasi {formatRelativeAge(j.created_at) || '—'}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: KC.ink }}>
                                                {j.title}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute, flexWrap: 'wrap' }}>
                                                <span>{j.remote_allowed ? 'Remote' : j.region_code || '—'}</span>
                                                <span>·</span>
                                                <span>{formatSalaryRange(j.salary_min, j.salary_max) || '—'}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: KC.ink }}>{j.application_count ?? 0}</div>
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
                    )}
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

                    {/* Trust / Verification Status — reflects the employer's real
                        `verified` field (unverified/pending/verified/failed) instead
                        of unconditionally claiming NPWP was verified. */}
                    <BrutalCard color="#FFFFFF" padding={20}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: verified ? KC.limeSoft : '#FEF3C7', border: `1px solid ${verified ? KC.lime : '#F59E0B'}`, display: 'grid', placeItems: 'center', color: verified ? KC.lime : '#F59E0B', flexShrink: 0 }}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px', color: KC.ink }}>
                                    {verified ? 'NPWP Terverifikasi' : 'NPWP Belum Diverifikasi'}
                                </h4>
                                <p style={{ fontSize: 12, color: KC.mute, lineHeight: 1.4, margin: '0 0 10px' }}>
                                    {verified
                                        ? 'Entitas institusi terdaftar pada pangkalan data DJP Online (mode demo).'
                                        : 'Lengkapi verifikasi NPWP agar profil perusahaan Anda tampak lebih tepercaya.'}
                                </p>
                                <button onClick={() => navigate('employer-verification')} style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 11 }}>
                                    {verified ? 'Lihat Sertifikasi Legalitas →' : 'Verifikasi Sekarang →'}
                                </button>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}
