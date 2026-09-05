import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import JobDetailModal from './JobDetailModal'
import { KC, ScoreDonut, topBtn, DesignStyles, useIsMobile } from './_design'

export default function SavedJobsPage() {
    const isMobile = useIsMobile()
    const { savedJobs, syncSavedJobs, unbookmarkJob, bookmarkJob, navigate } = useStore()
    const [selectedJob, setSelectedJob] = useState(null)

    useEffect(() => {
        if (typeof syncSavedJobs === 'function') {
            syncSavedJobs()
        }
    }, [syncSavedJobs])

    const list = savedJobs || []

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

                {/* List or Empty State */}
                {list.length === 0 ? (
                    <div style={{
                        background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 14,
                        boxShadow: `3px 3px 0 ${KC.ink}`, padding: '48px 32px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 14 }}>🔖</div>
                        <div style={{ font: '900 20px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 8 }}>
                            Belum Ada Lowongan Tersimpan
                        </div>
                        <div style={{ font: '500 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', maxWidth: 460, margin: '0 auto 22px' }}>
                            Anda belum menandai lowongan favorit. Simpan lowongan yang menarik saat menjelajahi hasil pencocokan atau pencarian untuk memantau perkembangan skor dan mendaftar kemudian.
                        </div>
                        <button
                            onClick={() => navigate('seeker-match')}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '12px 22px', fontSize: 13 }}
                        >
                            Jelajahi Feed Rekomendasi AI →
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        {list.map((job, idx) => {
                            const score = job.score ? Math.round(job.score > 1 ? job.score : job.score * 100) : (job.overall_score ? Math.round(job.overall_score * 100) : 85)
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
                                                {job.location || 'Jakarta'} · {job.salary_range || 'Kompetitif'}
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

                                    {job.missing_skills && job.missing_skills.length > 0 ? (
                                        <div
                                            onClick={() => navigate('seeker-skill-gap')}
                                            style={{ padding: '11px 14px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 9, font: '700 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#B45309', marginBottom: 16, cursor: 'pointer' }}
                                        >
                                            {job.missing_skills.length} skill gap perlu dipelajari →
                                        </div>
                                    ) : (
                                        <div style={{ padding: '11px 14px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 9, font: '700 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#065F46', marginBottom: 16 }}>
                                            ✓ Kualifikasi kompetensi esensial telah terpenuhi
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
                                            style={{ ...topBtn(KC.orange, '#fff'), flex: 1, padding: '11px 15px', fontSize: 12.5 }}
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

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
            {list.length === 0 ? (
                <div style={{
                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                    borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                    padding: '32px 20px', textAlign: 'center',
                }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔖</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: KC.ink, marginBottom: 6 }}>
                        Belum Ada Lowongan Tersimpan
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>
                        Simpan lowongan yang menarik saat menjelajahi feed AI untuk memantau perkembangan skor kecocokan Anda.
                    </div>
                    <button
                        onClick={() => navigate('seeker-match')}
                        className="kc-btn"
                        style={{
                            width: '100%', padding: '12px 16px', background: KC.orange,
                            border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                            boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12.5, fontWeight: 800,
                            color: '#fff', cursor: 'pointer',
                        }}
                    >
                        Buka Feed Rekomendasi AI →
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {list.map((job, idx) => {
                        const score = job.score ? Math.round(job.score > 1 ? job.score : job.score * 100) : (job.overall_score ? Math.round(job.overall_score * 100) : 85)
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
                                            {job.location || 'Jakarta'} · {job.salary_range || 'Kompetitif'}
                                        </div>
                                    </div>

                                    <ScoreDonut value={score} size={52} color={isStrong ? '#10B981' : '#F59E0B'} />
                                </div>

                                {job.missing_skills && job.missing_skills.length > 0 ? (
                                    <div
                                        onClick={() => navigate('seeker-skill-gap')}
                                        style={{
                                            padding: '9px 11px', background: '#FEF3C7', border: '1px solid #F59E0B',
                                            borderRadius: 8, fontSize: 10.5, fontWeight: 700, color: '#B45309', marginBottom: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {job.missing_skills.length} skill gap perlu dipelajari →
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '9px 11px', background: '#ECFDF5', border: '1px solid #10B981',
                                        borderRadius: 8, fontSize: 10.5, fontWeight: 700, color: '#065F46', marginBottom: 12,
                                    }}>
                                        ✓ Kualifikasi kompetensi esensial terpenuhi
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
                                            flex: 1, padding: '11px 13px', background: KC.orange,
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                            boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                            color: '#fff', cursor: 'pointer', minHeight: 44,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        Lihat Detail
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

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
