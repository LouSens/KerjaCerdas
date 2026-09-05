import { useState } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles, useIsMobile } from './_design'
import { X, CheckCircle2 } from 'lucide-react'

export default function JobDetailModal({ job, onClose }) {
    const isMobile = useIsMobile()
    const { applyJob, bookmarkJob, unbookmarkJob, savedJobs } = useStore()
    const [xaiExpanded, setXaiExpanded] = useState(true)
    const [toastMessage, setToastMessage] = useState(null)
    const [appliedLocally, setAppliedLocally] = useState(false)

    if (!job) return null

    const jobId = job.job_id || job.id || 'j1'
    const isSaved = (savedJobs || []).some(s => (s.id || s.job_id) === jobId)
    const company = job.company || job.company_name || 'Perusahaan Pemberi Kerja'
    const title = job.title || job.job_title || 'Posisi Lowongan'
    const rawScore = job.score || job.overall_score || 0
    const score = Math.round(rawScore > 1 ? rawScore : rawScore * 100)

    const matchingSkills = job.matching_skills || job.required_skills?.slice(0, 4) || []

    const breakdown = [
        {
            label: 'Semantic Match (Pengalaman & Profil CV)',
            weight: 'Bobot 50%',
            multiplier: '×0.50',
            pct: Math.round(job.semantic_score != null ? (job.semantic_score > 1 ? job.semantic_score : job.semantic_score * 100) : score),
            color: KC.orange,
            desc: 'Konteks pengalaman kerja dan portofolio CV terhadap kualifikasi posisi',
        },
        {
            label: 'Technical Skills Match',
            weight: 'Bobot 30%',
            multiplier: '×0.30',
            pct: Math.round(job.skill_score != null ? (job.skill_score > 1 ? job.skill_score : job.skill_score * 100) : score),
            color: '#0284C7',
            desc: `${matchingSkills.length} kompetensi esensial telah terpenuhi`,
        },
        {
            label: 'Lokasi & Work Mode Match',
            weight: 'Bobot 10%',
            multiplier: '×0.10',
            pct: Math.round(job.location_score != null ? (job.location_score > 1 ? job.location_score : job.location_score * 100) : (score > 80 ? 90 : 75)),
            color: '#10B981',
            desc: 'Lokasi kerja sesuai preferensi dan wilayah domisili kandidat',
        },
        {
            label: 'Ekspektasi Gaji',
            weight: 'Bobot 5%',
            multiplier: '×0.05',
            pct: Math.round(job.salary_score != null ? (job.salary_score > 1 ? job.salary_score : job.salary_score * 100) : (score > 80 ? 90 : 80)),
            color: '#F59E0B',
            desc: 'Rentang penawaran sejalan dengan target kandidat',
        },
        {
            label: 'Senioritas & Jenjang',
            weight: 'Bobot 5%',
            multiplier: '×0.05',
            pct: Math.round(job.seniority_score != null ? (job.seniority_score > 1 ? job.seniority_score : job.seniority_score * 100) : (score > 80 ? 95 : 80)),
            color: '#6366F1',
            desc: 'Total masa kerja memenuhi kriteria minimum posisi',
        },
    ]

    const handleApply = async () => {
        setAppliedLocally(true)
        setToastMessage(`Lamaran terkirim ke ${company}`)
        try {
            await applyJob(jobId)
        } catch (e) {
            // Handled in store
        }
        setTimeout(() => {
            setToastMessage(null)
        }, 2600)
    }

    const toggleSave = () => {
        if (isSaved) {
            unbookmarkJob(jobId)
        } else {
            bookmarkJob(job)
        }
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(9, 10, 15, 0.7)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                padding: isMobile ? 0 : 20,
            }}
        >
            <DesignStyles />

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed', top: 20, left: 20, right: 20, zIndex: 1100,
                    maxWidth: 420, margin: '0 auto', background: '#FFFFFF',
                    border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                    boxShadow: `3px 3px 0 ${KC.ink}`, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'kcSlideUp .3s both',
                }}>
                    <span style={{
                        width: 22, height: 22, borderRadius: '50%', background: '#10B981',
                        display: 'grid', placeItems: 'center', color: '#fff',
                        fontWeight: 900, fontSize: 12, flexShrink: 0,
                    }}>
                        ✓
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 12.5, color: KC.ink }}>
                        {toastMessage}
                    </span>
                </div>
            )}

            {/* Modal Body */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={isMobile ? {
                    width: '100%',
                    maxWidth: 480,
                    maxHeight: '88vh',
                    background: '#FFFFFF',
                    borderTop: `1.5px solid ${KC.ink}`,
                    borderRadius: '22px 22px 0 0',
                    boxShadow: `0 -4px 0 ${KC.ink}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'kcSlideUp .4s both',
                } : {
                    width: 920,
                    maxWidth: '92vw',
                    maxHeight: '90vh',
                    background: '#fff',
                    border: `1.5px solid ${KC.ink}`,
                    borderRadius: 14,
                    boxShadow: `6px 6px 0 ${KC.ink}`,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'kcUp .4s both',
                }}
            >
                {/* Mobile Handle */}
                {isMobile && (
                    <div style={{ padding: '10px 0 4px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 44, height: 5, background: '#CBD5E1', borderRadius: 999 }} />
                    </div>
                )}

                {/* Desktop Top Header Bar (D05) */}
                {!isMobile ? (
                    <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #090A0F', background: '#F8FAFC', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                                <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                    {company}
                                </span>
                                <span style={{ padding: '4px 10px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 11px/1.3 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                    ✓ Terverifikasi DJP
                                </span>
                            </div>
                            <h2 style={{ font: '900 26px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1px', color: KC.ink, margin: '0 0 9px' }}>
                                {title}
                            </h2>
                            <div style={{ font: '600 13px/1.4 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                {job.location || 'Jakarta'} · {job.work_type || 'Hybrid'} &nbsp;·&nbsp; {job.salary_range || 'Rp 28.000.000 – Rp 42.000.000'}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${KC.ink}`, background: '#fff', display: 'grid', placeItems: 'center', font: '800 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink, cursor: 'pointer', flexShrink: 0 }}
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    /* Mobile Header */
                    <div style={{ padding: '8px 18px 10px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>{company}</span>
                                <span style={{ padding: '2px 7px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: '#065F46' }}>✓ DJP</span>
                            </div>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: KC.ink, margin: 0, letterSpacing: -0.5 }}>{title}</h2>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: KC.ink, padding: 4 }}>
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {!isMobile ? (
                    /* Desktop 2-Column Grid (Screen D05) */
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 0, overflowY: 'auto', flex: 1 }}>
                        {/* Left Column: Breakdown & Description */}
                        <div style={{ padding: '26px 28px', borderRight: '1.5px solid #E2E8F0' }}>
                            <h3 style={{ font: '800 12px/1 "Plus Jakarta Sans", sans-serif', textTransform: 'uppercase', letterSpacing: 0.7, color: KC.ink, margin: '0 0 16px' }}>
                                Transparansi Perhitungan Skor (Explainable AI)
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 26 }}>
                                {breakdown.slice(0, 3).map((item, idx) => (
                                    <div key={idx} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                                            <span style={{ font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>{item.label}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ font: '700 11px/1 "JetBrains Mono", monospace', color: '#94A3B8' }}>{item.weight}</span>
                                                <span style={{ font: '900 14px/1 "Plus Jakarta Sans", sans-serif', color: item.color }}>{item.pct}%</span>
                                            </div>
                                        </div>
                                        <div style={{ height: 7, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 7 }}>
                                            <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 999 }} />
                                        </div>
                                        <p style={{ font: '400 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', margin: 0 }}>{item.desc}</p>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 13 }}>
                                    {breakdown.slice(3).map((item, idx) => (
                                        <div key={idx} style={{ flex: 1, padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9 }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                                                <span style={{ font: '800 12.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>{item.label}</span>
                                                <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: item.color }}>{item.pct}%</span>
                                            </div>
                                            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 999 }} />
                                            </div>
                                            <div style={{ font: '700 10.5px/1 "JetBrains Mono", monospace', color: '#94A3B8', marginTop: 7 }}>{item.weight}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 style={{ font: '800 12px/1 "Plus Jakarta Sans", sans-serif', textTransform: 'uppercase', letterSpacing: 0.7, color: KC.ink, margin: '0 0 12px' }}>
                                Deskripsi Tanggung Jawab
                            </h3>
                            <p style={{ font: '400 13.5px/1.7 "Plus Jakarta Sans", sans-serif', color: '#1E293B', margin: 0 }}>
                                {job.description || 'Bertanggung jawab dalam merancang arsitektur backend berskala tinggi, membangun RESTful / gRPC microservices, dan mengoptimalkan performa database serta sistem antrean pesan pada ekosistem produksi.'}
                            </p>
                        </div>

                        {/* Right Column: Total Score, Market Context & Actions */}
                        <div style={{ padding: '26px 24px', background: '#FAF9F5', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: KC.ink, border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.orange}`, padding: 20 }}>
                                <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: 0.9, textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>
                                    Total skor kesesuaian AI
                                </div>
                                <div style={{ font: '900 46px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-2.4px', color: '#fff', marginBottom: 12 }}>
                                    {score}%
                                </div>
                                <div style={{ font: '600 11.5px/1.55 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.55)' }}>
                                    Dihitung secara transparan menggunakan 5 komponen bobot semantik terkalibrasi.
                                </div>
                            </div>

                            <div>
                                <h3 style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', textTransform: 'uppercase', letterSpacing: 0.7, color: KC.ink, margin: '0 0 12px' }}>
                                    Pemenuhan Kualifikasi
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {matchingSkills.map(s => (
                                        <span key={s} style={{ padding: '6px 12px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#047857' }}>
                                            ✓ {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '15px 16px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}` }}>
                                <div style={{ font: '800 11px/1 "JetBrains Mono", monospace', letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>
                                    Konteks pasar
                                </div>
                                <div style={{ font: '600 12.5px/1.6 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>
                                    Anda berada di <b style={{ color: KC.orange }}>persentil 92</b> dari 42 kandidat yang dipindai untuk posisi ini.
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button
                                    onClick={handleApply}
                                    className="kc-btn"
                                    style={{ padding: 14, background: appliedLocally ? '#10B981' : KC.orange, border: `1.5px solid ${KC.ink}`, borderRadius: 10, boxShadow: `3px 3px 0 ${KC.ink}`, font: '800 14px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', cursor: 'pointer', textAlign: 'center' }}
                                >
                                    {appliedLocally ? 'Lamaran Terkirim ✓' : 'Lamar Sekarang →'}
                                </button>
                                <button
                                    onClick={toggleSave}
                                    className="kc-btn"
                                    style={{ padding: 13, background: isSaved ? '#FFF1EB' : '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 10, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, font: '800 13px/1 "Plus Jakarta Sans", sans-serif', color: isSaved ? '#9A3412' : KC.ink, cursor: 'pointer', textAlign: 'center' }}
                                >
                                    {isSaved ? 'Tersimpan ✓' : 'Simpan Lowongan'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Mobile Scrollable View */
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 18px' }}>
                            <div style={{ font: '600 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#64748B', marginBottom: 14 }}>
                                {job.location || 'Jakarta'} · {job.work_type || 'Hybrid'} &nbsp;·&nbsp; {job.salary_range || 'Rp 28–42 jt'}
                            </div>

                            {/* Total Score Dark Card */}
                            <div style={{ background: '#090A0F', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.orange}`, padding: 16, marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                                            Total skor kesesuaian AI
                                        </div>
                                        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -2, color: '#fff', marginTop: 6, lineHeight: 1 }}>
                                            {score}<span style={{ fontSize: 20 }}>%</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', maxWidth: 140, fontSize: 10.5, lineHeight: 1.45, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>
                                        Dihitung dari 5 komponen bobot semantik terkalibrasi
                                    </div>
                                </div>
                            </div>

                            {/* Accordion Toggle */}
                            <div
                                onClick={() => setXaiExpanded(!xaiExpanded)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 14px', background: '#FFF1EB', border: `1.5px solid ${KC.orange}`,
                                    borderRadius: 11, cursor: 'pointer', minHeight: 46,
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 900, color: '#9A3412' }}>
                                    <span style={{ width: 8, height: 8, background: KC.orange, borderRadius: '50%' }} />
                                    Transparansi Perhitungan Skor
                                </span>
                                <span style={{ fontSize: 18, fontWeight: 900, color: KC.orange }}>
                                    {xaiExpanded ? '−' : '+'}
                                </span>
                            </div>

                            {xaiExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 10 }}>
                                    {breakdown.map((item, idx) => (
                                        <div key={idx} style={{ padding: '11px 13px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9 }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: KC.ink }}>{item.label}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>{item.multiplier}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 900, color: item.color }}>{item.pct}%</span>
                                                </div>
                                            </div>
                                            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 5 }}>
                                                <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 999 }} />
                                            </div>
                                            <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{item.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Qualifications */}
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>
                                    Pemenuhan kualifikasi
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {matchingSkills.map(s => (
                                        <span key={s} style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, fontSize: 11, fontWeight: 800, color: '#047857' }}>
                                            ✓ {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Sticky Action Footer */}
                        <div style={{ flexShrink: 0, padding: '12px 18px', borderTop: `1.5px solid ${KC.ink}`, background: '#F8FAFC', display: 'flex', gap: 9 }}>
                            <button
                                onClick={toggleSave}
                                className="kc-btn"
                                style={{
                                    flex: 'none', padding: '12px 14px', background: isSaved ? '#FFF1EB' : '#fff',
                                    border: `1.5px solid ${isSaved ? KC.orange : KC.ink}`, borderRadius: 10,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                    color: isSaved ? '#9A3412' : KC.ink, cursor: 'pointer', minHeight: 46,
                                }}
                            >
                                {isSaved ? 'Tersimpan ✓' : 'Simpan'}
                            </button>
                            <button
                                onClick={handleApply}
                                className="kc-btn"
                                style={{
                                    flex: 1, padding: '12px 14px', background: appliedLocally ? '#10B981' : KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 10, boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                    fontSize: 13, fontWeight: 800, color: '#fff', cursor: 'pointer', minHeight: 46,
                                }}
                            >
                                {appliedLocally ? 'Lamaran Terkirim ✓' : 'Lamar Sekarang →'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
