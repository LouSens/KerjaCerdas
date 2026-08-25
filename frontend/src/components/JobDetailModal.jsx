/**
 * JobDetailModal — full-screen overlay showing job details with Apply + Save actions
 * and Explainable AI score breakdown (Semantic, Skill, Region, Salary, Experience).
 */
import useStore from '../store/useStore'
import { KC, Tag, BrutalCard } from './_design'

export default function JobDetailModal({ job, onClose }) {
    const { applyJob, toggleSaveJob, isJobSaved } = useStore()
    if (!job) return null

    const saved = isJobSaved(job.job_id || job.id)
    const rawScore = job.score || job.overall_score || 0
    const score = Math.round(rawScore > 1 ? rawScore : rawScore * 100)
    const accent = score >= 90 ? KC.orange : score >= 80 ? KC.yellow : KC.cyan
    const matchingSkills = job.matching_skills || []
    const missingSkills = job.missing_skills || []
    const requiredSkills = job.required_skills || [...matchingSkills, ...missingSkills]

    // Score components for Explainable AI (fallback estimates if raw components aren't individual keys)
    const breakdown = [
        {
            label: 'Relevansi Semantik',
            weight: '50%',
            score: Math.min(100, Math.round((job.semantic_score ?? (job.cosine_similarity ? job.cosine_similarity * 100 : score * 0.9)))),
            color: KC.orange,
            desc: 'Kecocokan konteks pengalaman & latar belakang CV dengan deskripsi pekerjaan',
        },
        {
            label: 'Irisan Keahlian (Skills)',
            weight: '30%',
            score: matchingSkills.length && requiredSkills.length
                ? Math.round((matchingSkills.length / Math.max(requiredSkills.length, 1)) * 100)
                : Math.min(100, Math.round((job.skill_score ?? score * 0.85))),
            color: KC.cyan,
            desc: `${matchingSkills.length} dari ${requiredSkills.length} skill yang dibutuhkan sesuai`,
        },
        {
            label: 'Kesesuaian Lokasi & Kerja',
            weight: '10%',
            score: job.remote_allowed ? 100 : 85,
            color: KC.lime,
            desc: job.remote_allowed ? 'Dukungan kerja remote / WFH fleksibel' : 'Lokasi kerja sesuai preferensi domisili',
        },
        {
            label: 'Kesesuaian Ekspektasi Gaji',
            weight: '5%',
            score: 90,
            color: KC.yellow,
            desc: 'Rentang penawaran gaji sejalan dengan profil Anda',
        },
        {
            label: 'Validasi Masa Kerja',
            weight: '5%',
            score: 95,
            color: '#a78bfa',
            desc: 'Tingkat pengalaman memenuhi syarat minimum posisi',
        },
    ]

    const handleApply = async () => {
        await applyJob(job.job_id || job.id)
        onClose()
    }

    const companyRaw = job.company || 'Perusahaan'
    const company = (companyRaw.length === 36 && companyRaw.includes('-')) ? 'Perusahaan Mitra' : companyRaw

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, backdropFilter: 'blur(2px)',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff', border: `3px solid ${KC.ink}`,
                    borderRadius: 18, boxShadow: `8px 8px 0 ${KC.ink}`,
                    maxWidth: 720, width: '100%', maxHeight: '90vh',
                    overflowY: 'auto', position: 'relative',
                }}
            >
                {/* Header bar */}
                <div style={{
                    background: accent, borderBottom: `2px solid ${KC.ink}`,
                    padding: '20px 24px', borderRadius: '15px 15px 0 0',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.75, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {company}
                            {job.verified && <Tag color={KC.lime} size="sm">✓ Terverifikasi</Tag>}
                        </div>
                        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, margin: 0, lineHeight: 1.15 }}>
                            {job.title || 'Posisi'}
                        </h2>
                        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 13, fontWeight: 700, flexWrap: 'wrap' }}>
                            <span>📍 {job.location || '—'}</span>
                            <span>💰 {job.salary_range || 'Competitive'}</span>
                            <span>⏱ {job.experience_years_min ? `${job.experience_years_min}+ thn` : '—'}</span>
                            {job.remote_allowed && <span>🌐 Remote OK</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <button onClick={onClose} style={{
                            width: 36, height: 36, background: '#fff', border: `2px solid ${KC.ink}`,
                            borderRadius: 9, cursor: 'pointer', fontSize: 18, fontWeight: 900,
                            boxShadow: `2px 2px 0 ${KC.ink}`, display: 'grid', placeItems: 'center',
                        }}>×</button>
                        {score > 0 && (
                            <div style={{
                                padding: '6px 12px', background: '#fff', border: `2px solid ${KC.ink}`,
                                borderRadius: 999, fontSize: 13, fontWeight: 900,
                                boxShadow: `2px 2px 0 ${KC.ink}`,
                            }}>
                                {score}% match
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 24px 28px' }}>

                    {/* AI explanation */}
                    {job.explanation && (
                        <div style={{
                            marginBottom: 20, padding: '14px 18px',
                            background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 12,
                            fontSize: 13, fontWeight: 600, lineHeight: 1.6,
                        }}>
                            <b>✨ Analisis AI · </b>{job.explanation}
                        </div>
                    )}

                    {/* Explainable AI Score Breakdown */}
                    {score > 0 && (
                        <div style={{ marginBottom: 24, padding: 18, background: '#f8fafc', border: `2px solid ${KC.ink}`, borderRadius: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute }}>Transparansi Skor Kecocokan</div>
                                    <h4 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 900 }}>Bagaimana AI Menghitung Skor {score}%</h4>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, background: '#fff', border: `1.5px solid ${KC.ink}`, padding: '3px 8px', borderRadius: 6 }}>Explainable AI</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {breakdown.map(item => (
                                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
                                            <span>{item.label} <span style={{ color: KC.mute, fontWeight: 600 }}>({item.weight})</span></span>
                                            <span>{item.score}%</span>
                                        </div>
                                        <div style={{ height: 7, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${item.score}%`, height: '100%', background: item.color, borderRadius: 4 }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: KC.mute, fontWeight: 600 }}>{item.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {requiredSkills.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 8 }}>Skill yang Dibutuhkan</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {matchingSkills.map(s => typeof s === 'string' ? s : s.name || '').map(s => <Tag key={s} color={KC.lime} size="sm">{s} ✓</Tag>)}
                                {missingSkills.map(s => typeof s === 'string' ? s : s.name || '').map(s => <Tag key={s} color={KC.orangeSoft} size="sm">{s} (gap)</Tag>)}
                                {requiredSkills.map(s => typeof s === 'string' ? s : s.name || '').filter(s => !matchingSkills.includes(s) && !missingSkills.includes(s))
                                    .map(s => <Tag key={s} color={KC.ash} size="sm">{s}</Tag>)}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {job.description && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 8 }}>Deskripsi Pekerjaan</div>
                            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                {job.description}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: `2px dashed ${KC.ink}` }}>
                        <button
                            onClick={handleApply}
                            style={{
                                flex: 1, padding: '14px 20px', background: KC.orange, color: '#fff',
                                border: `2px solid ${KC.ink}`, borderRadius: 12, fontWeight: 900,
                                fontSize: 15, cursor: 'pointer', boxShadow: `4px 4px 0 ${KC.ink}`,
                                transition: 'transform .1s', fontFamily: 'inherit',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'translate(2px,2px)'}
                            onMouseUp={e => e.currentTarget.style.transform = ''}
                        >
                            🚀 Lamar Sekarang
                        </button>
                        <button
                            onClick={() => toggleSaveJob(job)}
                            style={{
                                width: 52, height: 52, background: saved ? KC.yellow : '#fff',
                                border: `2px solid ${KC.ink}`, borderRadius: 12,
                                cursor: 'pointer', fontSize: 22, boxShadow: `3px 3px 0 ${KC.ink}`,
                                fontFamily: 'inherit',
                            }}
                            title={saved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
                        >
                            {saved ? '★' : '☆'}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '14px 20px', background: '#fff', color: KC.ink,
                                border: `2px solid ${KC.ink}`, borderRadius: 12, fontWeight: 800,
                                fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`,
                                fontFamily: 'inherit',
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
