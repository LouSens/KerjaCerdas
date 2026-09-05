import { useEffect } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles, topBtn, useIsMobile } from './_design'

const DEMO_EMPLOYER_JOBS = [
    {
        id: 'ej-backend-1',
        title: 'Senior Backend Engineer (Go)',
        location: 'Jakarta',
        work_type: 'Hybrid',
        salary: 'Rp 28–42 jt',
        status: 'active',
        created_days_ago: 6,
        candidates_count: 42,
        strong_count: 2,
        possible_count: 2,
        unlocked_count: 3,
        interview_count: 2,
    },
    {
        id: 'ej-data-2',
        title: 'Product Data Analyst',
        location: 'Jakarta',
        work_type: 'Onsite',
        salary: 'Rp 18–26 jt',
        status: 'active',
        created_days_ago: 2,
        candidates_count: 28,
        strong_count: 1,
        possible_count: 5,
        unlocked_count: 0,
        interview_count: 0,
    },
]

export default function EmployerDashboard() {
    const isMobile = useIsMobile()
    const { employerJobs, refreshEmployerJobs, navigate, navigateToCandidates, employerProfile, loadEmployerProfile } = useStore()

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerProfile()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const companyName = employerProfile?.company_name || 'GoTo Group'
    const companyInitial = companyName ? companyName[0].toUpperCase() : 'G'

    const activeList = (employerJobs && employerJobs.length > 0)
        ? employerJobs.map((j, i) => ({
            id: j.id || `ej-${i}`,
            title: j.title || 'Posisi Rekrutmen',
            location: j.region_code || j.location || 'Jakarta',
            work_type: j.remote_allowed ? 'Remote' : (j.work_type || 'Hybrid'),
            salary: j.salary_min && j.salary_max ? `Rp ${Math.round(j.salary_min / 1000000)}–${Math.round(j.salary_max / 1000000)} jt` : 'Rp 28–42 jt',
            status: j.is_active === false ? 'draft' : 'active',
            created_days_ago: i === 0 ? 6 : 2,
            candidates_count: j.application_count ?? (i === 0 ? 42 : 28),
            strong_count: i === 0 ? 2 : 1,
            possible_count: i === 0 ? 2 : 5,
            unlocked_count: i === 0 ? 3 : 0,
            interview_count: i === 0 ? 2 : 0,
        }))
        : DEMO_EMPLOYER_JOBS

    const handleReviewCandidates = (jobId) => {
        useStore.setState({ selectedCandidateJobId: jobId })
        navigate('employer-candidates')
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D09)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />

                {/* Desktop Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', padding: '3px 10px', background: KC.orange,
                            borderRadius: 999, fontWeight: 900, fontSize: 10, lineHeight: 1.6,
                            letterSpacing: 0.6, textTransform: 'uppercase', color: '#fff', marginBottom: 10,
                        }}>
                            Employer / HR
                        </div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Dashboard Rekrutmen
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            {companyName} · {activeList.length} lowongan, {activeList.filter(j => j.status === 'active').length} aktif · periode 30 hari terakhir
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 11, flexShrink: 0 }}>
                        <button
                            onClick={() => navigate('employer-upload')}
                            className="kc-btn"
                            style={{ ...topBtn('#fff', KC.ink), padding: '11px 17px', fontSize: 12.5 }}
                        >
                            Upload Job Pack
                        </button>
                        <button
                            onClick={() => navigate('employer-post-job')}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '11px 17px', fontSize: 12.5 }}
                        >
                            + Pasang Lowongan
                        </button>
                    </div>
                </div>

                {/* Horizontal Recruitment Funnel Card (Decision 04) */}
                <div style={{
                    background: KC.ink, border: `1.5px solid ${KC.ink}`,
                    borderRadius: 14, boxShadow: `4px 4px 0 ${KC.orange}`,
                    padding: '26px 28px', animation: 'kcUp .4s both',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <span style={{ font: '800 11px/1 "JetBrains Mono", monospace', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>
                            Funnel rekrutmen · reverse matching
                        </span>
                        <span style={{ padding: '5px 12px', background: 'rgba(16,185,129,.2)', border: '1px solid #10B981', borderRadius: 999, font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>
                            time-to-shortlist 1,4 hari
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
                        <div style={{ flex: 1, paddingRight: 20 }}>
                            <div style={{ font: '900 42px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2px', color: '#fff', marginBottom: 9 }}>184</div>
                            <div style={{ font: '700 11px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 11 }}>Profil dipindai AI</div>
                            <div style={{ height: 11, background: '#fff', borderRadius: 999 }} />
                        </div>
                        <div style={{ width: 22, textAlign: 'center', font: '900 17px/1 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.25)', paddingBottom: 22 }}>→</div>
                        <div style={{ flex: 1, padding: '0 20px' }}>
                            <div style={{ font: '900 42px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2px', color: '#10B981', marginBottom: 9 }}>37</div>
                            <div style={{ font: '700 11px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 11 }}>Strong Fit</div>
                            <div style={{ height: 11, background: 'rgba(255,255,255,.14)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '20%', background: '#10B981', borderRadius: 999 }} />
                            </div>
                        </div>
                        <div style={{ width: 22, textAlign: 'center', font: '900 17px/1 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.25)', paddingBottom: 22 }}>→</div>
                        <div style={{ flex: 1, padding: '0 20px' }}>
                            <div style={{ font: '900 42px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2px', color: KC.orange, marginBottom: 9 }}>12</div>
                            <div style={{ font: '700 11px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 11 }}>Kontak dibuka</div>
                            <div style={{ height: 11, background: 'rgba(255,255,255,.14)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '6.5%', background: KC.orange, borderRadius: 999 }} />
                            </div>
                        </div>
                        <div style={{ width: 22, textAlign: 'center', font: '900 17px/1 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.25)', paddingBottom: 22 }}>→</div>
                        <div style={{ flex: 1, paddingLeft: 20 }}>
                            <div style={{ font: '900 42px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2px', color: '#6366F1', marginBottom: 9 }}>8</div>
                            <div style={{ font: '700 11px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 11 }}>Wawancara</div>
                            <div style={{ height: 11, background: 'rgba(255,255,255,.14)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '4.3%', background: '#6366F1', borderRadius: 999 }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.12)', font: '600 12.5px/1.6 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.55)' }}>
                        Konversi kontak-dibuka → wawancara <b style={{ color: '#fff' }}>67%</b>. Angka ini yang menjustifikasi harga Rp 50.000 per unlock: HR membayar setelah melihat bukti kompetensi, bukan sebelum.
                    </div>
                </div>

                {/* 2-Column Layout: Active Jobs (Left) + Growth Quota & Legal Info (Right 300px) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 22 }}>
                    {/* Left Column: Active Vacancies */}
                    <div>
                        <h2 style={{ font: '900 19px/1.15 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.6px', color: KC.ink, margin: '0 0 14px' }}>
                            Lowongan Aktif
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {activeList.map((job) => (
                                <div
                                    key={job.id}
                                    style={{
                                        background: '#fff', border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: '20px 22px', animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 16 }}>
                                        <div>
                                            <div style={{ font: '900 18px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.6px', color: KC.ink, marginBottom: 7 }}>
                                                {job.title}
                                            </div>
                                            <div style={{ font: '600 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                                {job.location} · {job.work_type} · {job.salary} · dipasang {job.created_days_ago} hari lalu
                                            </div>
                                        </div>
                                        <span style={{ padding: '4px 11px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46', flexShrink: 0 }}>
                                            Aktif
                                        </span>
                                    </div>

                                    {/* 5-Metric Strip */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '16px 0', borderTop: '1px dashed #E2E8F0', borderBottom: '1px dashed #E2E8F0', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ font: '900 22px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink, letterSpacing: '-0.9px' }}>{job.candidates_count}</div>
                                            <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Kandidat</div>
                                        </div>
                                        <div>
                                            <div style={{ font: '900 22px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981', letterSpacing: '-0.9px' }}>{job.strong_count}</div>
                                            <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Strong</div>
                                        </div>
                                        <div>
                                            <div style={{ font: '900 22px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B', letterSpacing: '-0.9px' }}>{job.possible_count}</div>
                                            <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Possible</div>
                                        </div>
                                        <div>
                                            <div style={{ font: '900 22px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange, letterSpacing: '-0.9px' }}>{job.unlocked_count}</div>
                                            <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Unlocked</div>
                                        </div>
                                        <div>
                                            <div style={{ font: '900 22px/1 "Plus Jakarta Sans", sans-serif', color: '#6366F1', letterSpacing: '-0.9px' }}>{job.interview_count}</div>
                                            <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 6 }}>Interview</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            onClick={() => navigate('employer-post-job')}
                                            className="kc-btn"
                                            style={{ ...topBtn('#fff', KC.ink), padding: '11px 16px', fontSize: 12 }}
                                        >
                                            Edit Lowongan
                                        </button>
                                        <button
                                            onClick={() => handleReviewCandidates(job.id)}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.orange, '#fff'), padding: '11px 16px', fontSize: 12 }}
                                        >
                                            Lihat {job.candidates_count} Kandidat AI →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (300px) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 20 }}>
                            <div style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 16 }}>
                                Kuota plan Growth
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ font: '700 12px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Unlock kontak</span>
                                        <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>8<span style={{ color: '#94A3B8' }}>/20</span></span>
                                    </div>
                                    <div style={{ height: 7, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '40%', background: KC.orange, borderRadius: 999 }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ font: '700 12px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Slot lowongan</span>
                                        <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>4<span style={{ color: '#94A3B8' }}>/10</span></span>
                                    </div>
                                    <div style={{ height: 7, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '40%', background: KC.ink, borderRadius: 999 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #E2E8F0', font: '600 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                Reset 1 Okt 2026
                            </div>
                        </div>

                        <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 12, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', display: 'grid', placeItems: 'center', color: '#fff', font: '900 13px/1 "Plus Jakarta Sans", sans-serif', flexShrink: 0 }}>✓</span>
                                <span style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>NPWP Terverifikasi</span>
                            </div>
                            <p style={{ font: '400 12px/1.6 "Plus Jakarta Sans", sans-serif', color: '#047857', margin: 0 }}>
                                Lowongan Anda tampil dengan lencana verifikasi pada kartu match kandidat — menaikkan tingkat respons.
                            </p>
                        </div>

                        <div style={{ background: '#FFF1EB', border: `1.5px solid ${KC.orange}`, borderRadius: 12, padding: 20 }}>
                            <div style={{ font: '900 14px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 9 }}>
                                1 lowongan perlu ditinjau
                            </div>
                            <p style={{ font: '400 12px/1.6 "Plus Jakarta Sans", sans-serif', color: '#9A3412', margin: '0 0 14px' }}>
                                Draf "Frontend Engineer (React)" belum dipublikasikan · estimasi 31 kandidat cocok.
                            </p>
                            <button
                                onClick={() => navigate('employer-post-job')}
                                className="kc-btn"
                                style={{ ...topBtn('#fff', KC.ink), padding: '10px 15px', fontSize: 12 }}
                            >
                                Lanjutkan Draf →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 13)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Mobile Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
                <div>
                    <div style={{
                        display: 'inline-flex', padding: '3px 8px', background: KC.orange,
                        borderRadius: 999, fontWeight: 900, fontSize: 9,
                        letterSpacing: 0.6, textTransform: 'uppercase', color: '#FFFFFF',
                        marginBottom: 6,
                    }}>
                        Employer / HR
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.8, color: KC.ink, margin: 0, lineHeight: 1.15 }}>
                        {companyName}
                    </h1>
                </div>

                <div style={{
                    width: 38, height: 38, borderRadius: 11, background: '#090A0F',
                    border: `1.5px solid ${KC.ink}`, boxShadow: `2px 2px 0 ${KC.orange}`,
                    display: 'grid', placeItems: 'center', fontWeight: 900,
                    fontSize: 16, color: '#FFFFFF',
                }}>
                    {companyInitial}
                </div>
            </div>

            {/* Mobile Funnel Card */}
            <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 14, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 16 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 13 }}>
                    Funnel rekrutmen · 30 hari
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Kandidat terkurasi AI</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>184</span>
                        </div>
                        <div style={{ height: 9, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '100%', background: '#090A0F', borderRadius: 999 }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Strong Fit</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#10B981' }}>37</span>
                        </div>
                        <div style={{ height: 9, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '20%', background: '#10B981', borderRadius: 999 }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Kontak dibuka</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: KC.orange }}>12</span>
                        </div>
                        <div style={{ height: 9, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '6.5%', background: KC.orange, borderRadius: 999 }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Wawancara terjadwal</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#6366F1' }}>8</span>
                        </div>
                        <div style={{ height: 9, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '4.3%', background: '#6366F1', borderRadius: 999 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile 2 Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <div style={{ background: '#090A0F', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.orange}`, padding: 14 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>
                        Time-to-shortlist
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1.2, color: '#fff', margin: '9px 0 4px' }}>
                        1,4<span style={{ fontSize: 14 }}> hari</span>
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#10B981' }}>
                        ▼ dari 11 hari manual
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: '#64748B' }}>
                        Lowongan aktif
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1.2, color: KC.ink, margin: '9px 0 4px' }}>
                        {activeList.length}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94A3B8' }}>
                        1 perlu ditinjau
                    </div>
                </div>
            </div>

            {/* Mobile Active Jobs List */}
            <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.6, color: KC.ink, margin: '4px 0 0' }}>
                Lowongan Saya
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {activeList.map((job) => (
                    <div
                        key={job.id}
                        onClick={() => handleReviewCandidates(job.id)}
                        style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14,
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
                            <div>
                                <div style={{ fontSize: 14.5, fontWeight: 900, color: KC.ink, marginBottom: 4, lineHeight: 1.25 }}>
                                    {job.title}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>
                                    {job.location} · {job.work_type} · dipasang {job.created_days_ago} hari lalu
                                </div>
                            </div>
                            <span style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: '#065F46', flexShrink: 0 }}>
                                Aktif
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, paddingTop: 11, borderTop: '1px dashed #E2E8F0' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: KC.ink }}>{job.candidates_count}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Kandidat</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>{job.strong_count}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Strong</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B' }}>{job.possible_count}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Possible</div>
                            </div>
                            <div style={{ alignSelf: 'center', fontSize: 11.5, fontWeight: 800, color: KC.orange, flexShrink: 0 }}>
                                Lihat →
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Post Job Button */}
            <button
                onClick={() => navigate('employer-post-job')}
                className="kc-btn"
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 4, padding: 14, background: KC.orange, border: `1.5px solid ${KC.ink}`,
                    borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`, font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                    color: '#FFFFFF', minHeight: 48, cursor: 'pointer',
                }}
            >
                + Pasang Lowongan Baru
            </button>
        </div>
    )
}
