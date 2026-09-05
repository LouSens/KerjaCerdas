import { useState } from 'react'
import useStore from '../store/useStore'
import JobDetailModal from './JobDetailModal'
import { KC, ScoreDonut, topBtn, DesignStyles, useIsMobile } from './_design'

const DEMO_SAVED_JOBS = [
    {
        id: 'sj-traveloka-1',
        job_id: 'sj-traveloka-1',
        company: 'Traveloka',
        company_name: 'Traveloka',
        title: 'Full-Stack Developer',
        location: 'Jakarta · Remote',
        work_type: 'Remote',
        salary_range: 'Rp 22–35 jt',
        score: 88,
        band: 'strong',
        matching_skills: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
        id: 'sj-mandiri-2',
        job_id: 'sj-mandiri-2',
        company: 'Bank Mandiri Digital',
        company_name: 'Bank Mandiri Digital',
        title: 'DevOps Platform Engineer',
        location: 'Jakarta · Onsite',
        work_type: 'Onsite',
        salary_range: 'Rp 25–38 jt',
        score: 78,
        band: 'possible',
        matching_skills: ['Docker', 'Go'],
    },
]

export default function SavedJobsPage() {
    const isMobile = useIsMobile()
    const { savedJobs, unbookmarkJob, bookmarkJob, navigate } = useStore()
    const [selectedJob, setSelectedJob] = useState(null)

    const list = (savedJobs && savedJobs.length > 0) ? savedJobs : DEMO_SAVED_JOBS

    const handleRemove = (job) => {
        const id = job.id || job.job_id
        unbookmarkJob(id)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D08)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />
                <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

                {/* Desktop Top Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Lowongan Tersimpan
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            {list.length} lowongan · skor kecocokan dihitung ulang setiap profil Anda diperbarui
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('seeker-match')}
                        className="kc-btn"
                        style={{ ...topBtn('#fff', KC.ink), padding: '11px 17px', fontSize: 12.5 }}
                    >
                        Kembali ke Match
                    </button>
                </div>

                {/* 2-Column Grid (1fr 1fr) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    {list.map((job, idx) => {
                        const score = job.score ? Math.round(job.score > 1 ? job.score : job.score * 100) : (idx === 0 ? 88 : 78)
                        const isStrong = score >= 85

                        return (
                            <div
                                key={job.job_id || job.id || idx}
                                style={{
                                    background: '#fff',
                                    border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 13,
                                    boxShadow: `3px 3px 0 ${KC.ink}`,
                                    padding: 22,
                                    animation: 'kcUp .4s both',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, marginBottom: 16 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                                            <span style={{ font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                {job.company || job.company_name}
                                            </span>
                                            <span style={{
                                                padding: '3px 9px',
                                                background: isStrong ? '#ECFDF5' : '#FEF3C7',
                                                border: `1px solid ${isStrong ? '#10B981' : '#F59E0B'}`,
                                                borderRadius: 999,
                                                font: '800 10px/1.3 "Plus Jakarta Sans", sans-serif',
                                                color: isStrong ? '#065F46' : '#B45309',
                                            }}>
                                                {isStrong ? 'Strong Fit' : 'Possible Fit'}
                                            </span>
                                        </div>
                                        <div style={{ font: '900 20px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.7px', color: KC.ink, marginBottom: 7 }}>
                                            {job.title}
                                        </div>
                                        <div style={{ font: '600 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                            {job.location} · {job.salary_range || 'Rp 22–35 jt'}
                                        </div>
                                    </div>

                                    {/* 66px Donut Ring */}
                                    <svg width="66" height="66" viewBox="0 0 66 66" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                                        <circle cx="33" cy="33" r="27" fill="none" stroke="#E2E8F0" strokeWidth="5" />
                                        <circle
                                            cx="33" cy="33" r="27" fill="none"
                                            stroke={isStrong ? '#10B981' : '#F59E0B'} strokeWidth="5"
                                            strokeLinecap="round" strokeDasharray="169.6"
                                            strokeDashoffset={169.6 - (169.6 * (score / 100))}
                                        />
                                        <text x="33" y="33" textAnchor="middle" dominantBaseline="central" transform="rotate(90 33 33)" style={{ font: '900 18px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                            {score}
                                        </text>
                                    </svg>
                                </div>

                                {/* Score Rise Alert / Gap Alert */}
                                {idx === 0 ? (
                                    <div style={{ padding: '11px 14px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 9, font: '700 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#065F46', marginBottom: 16 }}>
                                        ▲ Naik 3% setelah CV Anda diperbarui pada 2 Sep
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => navigate('seeker-skill-gap')}
                                        style={{ padding: '11px 14px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 9, font: '700 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#B45309', marginBottom: 16, cursor: 'pointer' }}
                                    >
                                        2 gap wajib · tutup untuk naik ke 89% →
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        onClick={() => handleRemove(job)}
                                        className="kc-btn"
                                        style={{ ...topBtn('#FFF1EB', '#9A3412', KC.orange), padding: '11px 15px', fontSize: 12 }}
                                    >
                                        Tersimpan ✓
                                    </button>
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="kc-btn"
                                        style={{ ...topBtn(idx === 0 ? KC.orange : '#fff', idx === 0 ? '#fff' : KC.ink), flex: 1, padding: '11px 15px', fontSize: 12.5 }}
                                    >
                                        {idx === 0 ? 'Lamar Sekarang →' : 'Lihat Rencana Belajar'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Smart Empty State Callout */}
                <div style={{
                    background: '#fff', border: '1.5px dashed #CBD5E1', borderRadius: 13,
                    padding: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                }}>
                    <div>
                        <div style={{ font: '900 16px/1.25 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                            Empty state cerdas
                        </div>
                        <p style={{ font: '400 13px/1.6 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', margin: 0, maxWidth: 600 }}>
                            Ketika daftar simpanan kosong atau tidak berubah lama, sistem menawarkan 3 lowongan Strong Fit yang belum pernah dibuka — bukan halaman kosong tanpa jalan keluar.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('seeker-match')}
                        className="kc-btn"
                        style={{ ...topBtn(KC.ink, '#fff', KC.orange), padding: '13px 20px', fontSize: 13, flexShrink: 0 }}
                    >
                        Buka Feed Match →
                    </button>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 09)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Mobile Header */}
            <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.9, color: KC.ink, margin: '0 0 5px', lineHeight: 1.1 }}>
                    Tersimpan
                </h1>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                    {list.length} lowongan · skor disegarkan tiap profil diperbarui
                </div>
            </div>

            {/* Saved Jobs List Mobile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {list.map((job, idx) => {
                    const score = job.score ? Math.round(job.score > 1 ? job.score : job.score * 100) : (idx === 0 ? 88 : 78)
                    const isStrong = score >= 85

                    return (
                        <div
                            key={job.job_id || job.id || idx}
                            style={{
                                background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                                padding: 15, animation: 'kcUp .4s both',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11, marginBottom: 12 }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                                            {job.company || job.company_name}
                                        </span>
                                        <span style={{
                                            padding: '3px 7px',
                                            background: isStrong ? '#ECFDF5' : '#FEF3C7',
                                            border: `1px solid ${isStrong ? '#10B981' : '#F59E0B'}`,
                                            borderRadius: 999, fontSize: 9.5, fontWeight: 800,
                                            color: isStrong ? '#065F46' : '#B45309',
                                        }}>
                                            {isStrong ? 'Strong Fit' : 'Possible Fit'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.5, color: KC.ink, marginBottom: 4, lineHeight: 1.2 }}>
                                        {job.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                        {job.location} · {job.salary_range || 'Rp 22–35 jt'}
                                    </div>
                                </div>

                                <ScoreDonut value={score} size={52} color={isStrong ? '#10B981' : '#F59E0B'} />
                            </div>

                            {/* Alert banners */}
                            {idx === 0 ? (
                                <div style={{
                                    padding: '9px 11px', background: '#ECFDF5', border: '1px solid #10B981',
                                    borderRadius: 8, fontSize: 10.5, fontWeight: 700, color: '#065F46', marginBottom: 12,
                                }}>
                                    ▲ Naik 3% setelah CV Anda diperbarui
                                </div>
                            ) : (
                                <div
                                    onClick={() => navigate('seeker-skill-gap')}
                                    style={{
                                        padding: '9px 11px', background: '#FEF3C7', border: '1px solid #F59E0B',
                                        borderRadius: 8, fontSize: 10.5, fontWeight: 700, color: '#B45309', marginBottom: 12,
                                        cursor: 'pointer',
                                    }}
                                >
                                    2 gap wajib · tutup untuk naik ke 89% →
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 9 }}>
                                <button
                                    onClick={() => handleRemove(job)}
                                    className="kc-btn"
                                    style={{
                                        flex: 'none', padding: '11px 13px', background: '#FFF1EB',
                                        border: `1.5px solid ${KC.orange}`, borderRadius: 9,
                                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 11.5,
                                        fontWeight: 800, color: '#9A3412', cursor: 'pointer',
                                        minHeight: 44, display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    Tersimpan ✓
                                </button>
                                <button
                                    onClick={() => setSelectedJob(job)}
                                    className="kc-btn"
                                    style={{
                                        flex: 1, padding: '11px 13px', background: idx === 0 ? KC.orange : '#fff',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                        color: idx === 0 ? '#fff' : KC.ink, cursor: 'pointer', minHeight: 44,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {idx === 0 ? 'Lamar Sekarang →' : 'Lihat Detail'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Smart Empty State Mobile */}
            <div style={{
                marginTop: 16, padding: 15, background: '#fff',
                border: '1.5px dashed #CBD5E1', borderRadius: 12, textAlign: 'center',
            }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                    Kehabisan ide simpanan?
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12, lineHeight: 1.5 }}>
                    Empty state cerdas: sistem menyarankan 3 lowongan Strong Fit yang belum pernah Anda buka.
                </div>
                <button
                    onClick={() => navigate('seeker-match')}
                    className="kc-btn"
                    style={{
                        padding: '10px 15px', background: KC.ink, borderRadius: 9,
                        fontSize: 11.5, fontWeight: 800, color: '#fff', minHeight: 40,
                        border: 'none', cursor: 'pointer',
                    }}
                >
                    Buka Feed Match →
                </button>
            </div>
        </div>
    )
}
