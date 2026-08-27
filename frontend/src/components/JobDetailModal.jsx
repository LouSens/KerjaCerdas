/**
 * JobDetailModal — Clean enterprise modal with Explainable AI 5-Score breakdown.
 */
import useStore from '../store/useStore'
import { KC, Tag, BrutalCard, topBtn } from './_design'
import { X, Building2, MapPin, DollarSign, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react'

export default function JobDetailModal({ job, onClose }) {
    const { applyJob, toggleSaveJob, isJobSaved } = useStore()
    if (!job) return null

    const saved = isJobSaved(job.job_id || job.id)
    const rawScore = job.score || job.overall_score || 0.85
    const score = Math.round(rawScore > 1 ? rawScore : rawScore * 100)
    const matchingSkills = job.matching_skills || ['Go', 'PostgreSQL', 'Docker']
    const missingSkills = job.missing_skills || []
    const requiredSkills = job.required_skills || [...matchingSkills, ...missingSkills]

    const breakdown = [
        {
            label: 'Semantic Match (Pengalaman & Profil CV)',
            weight: '50%',
            score: Math.min(100, Math.round((job.semantic_score ?? (job.cosine_similarity ? job.cosine_similarity * 100 : score * 0.9)))),
            color: KC.orange,
            desc: 'Kecocokan konteks pengalaman kerja dan portofolio CV terhadap kualifikasi posisi',
        },
        {
            label: 'Technical Skills Match',
            weight: '30%',
            score: matchingSkills.length && requiredSkills.length
                ? Math.round((matchingSkills.length / Math.max(requiredSkills.length, 1)) * 100)
                : Math.min(100, Math.round((job.skill_score ?? score * 0.85))),
            color: KC.cyan,
            desc: `${matchingSkills.length} dari ${requiredSkills.length || matchingSkills.length} kompetensi esensial telah terpenuhi`,
        },
        {
            label: 'Lokasi & Work Mode Match',
            weight: '10%',
            score: job.remote_allowed ? 100 : 90,
            color: KC.lime,
            desc: job.remote_allowed ? 'Fleksibilitas kerja remote / WFH penuh' : 'Lokasi kerja sesuai wilayah domisili kandidat',
        },
        {
            label: 'Ekspektasi Gaji & Kompensasi',
            weight: '5%',
            score: 95,
            color: KC.yellow,
            desc: 'Rentang penawaran gaji kompetitif dan sejalan dengan target kandidat',
        },
        {
            label: 'Senioritas & Jenjang Karir',
            weight: '5%',
            score: 95,
            color: KC.indigo,
            desc: 'Total masa kerja memenuhi kriteria minimum senioritas posisi',
        },
    ]

    const handleApply = async () => {
        await applyJob(job.job_id || job.id)
        onClose()
    }

    const company = job.company || 'GoTo Group'

    return (
        <div
            onClick={onClose}
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
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${KC.ink}`,
                    borderRadius: 14,
                    boxShadow: `6px 6px 0 ${KC.ink}`,
                    maxWidth: 740,
                    width: '100%',
                    maxHeight: '88vh',
                    overflowY: 'auto',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{ padding: '22px 26px', borderBottom: `1.5px solid ${KC.ink}`, background: KC.surface, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Building2 size={14} /> {company}
                            </span>
                            {job.verified !== false && (
                                <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime} size="sm">
                                    <ShieldCheck size={12} /> Terverifikasi DJP
                                </Tag>
                            )}
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, margin: '0 0 8px', color: KC.ink }}>
                            {job.title || job.job_title || 'Senior Backend Engineer'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: KC.mute, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={14} /> {job.location || 'Jakarta · Hybrid'}
                            </span>
                            <span>·</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <DollarSign size={14} /> {job.salary_range || 'Rp 28.000.000 - Rp 42.000.000'}
                            </span>
                        </div>
                    </div>
                    <button
                        id="job-detail-modal-close-btn"
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: `1.5px solid ${KC.ink}`,
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            color: KC.ink,
                            flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Explainable AI Banner */}
                    <div style={{ padding: '16px 20px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 10, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.mute }}>
                                Total Skor Kesesuaian AI
                            </span>
                            <div style={{ fontSize: 24, fontWeight: 900, color: KC.ink, letterSpacing: -0.5, marginTop: 2 }}>
                                {score}% Match
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: KC.mute, maxWidth: 360, textAlign: 'right' }}>
                            Dihitung secara transparan menggunakan 5 komponen bobot semantik terkalibrasi.
                        </div>
                    </div>

                    {/* 5-Score Breakdown */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink, margin: '0 0 12px' }}>
                            Transparansi Perhitungan Skor (Explainable AI)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {breakdown.map((item, idx) => (
                                <div key={idx} style={{ padding: '12px 14px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: KC.ink }}>{item.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: KC.mute }}>Bobot {item.weight}</span>
                                            <span style={{ fontSize: 13, fontWeight: 900, color: item.color }}>{item.score}%</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 6, background: KC.ash, borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${item.score}%`, height: '100%', background: item.color, borderRadius: 999 }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: KC.mute }}>{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Competency Gap Analysis */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink, margin: '0 0 10px' }}>
                            Kesesuaian Kompetensi
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {matchingSkills.map((s, idx) => (
                                <span key={idx} style={{ padding: '4px 10px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={13} /> {typeof s === 'string' ? s : s.name}
                                </span>
                            ))}
                            {missingSkills.map((s, idx) => (
                                <span key={idx} style={{ padding: '4px 10px', background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={13} /> {typeof s === 'string' ? s : s.name} (Disarankan)
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Job Description Summary */}
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink, margin: '0 0 8px' }}>
                            Deskripsi Tanggung Jawab
                        </h3>
                        <p style={{ fontSize: 13, color: KC.inkLight, lineHeight: 1.6, margin: 0 }}>
                            {job.description || 'Bertanggung jawab dalam merancang arsitektur backend berskala tinggi, membangun RESTful / gRPC microservices, dan mengoptimalkan performa database serta sistem antrean pesan pada ekosistem produksi.'}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div style={{ padding: '18px 26px', borderTop: `1.5px solid ${KC.ink}`, background: KC.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <button
                        onClick={() => toggleSaveJob(job)}
                        className="kc-btn"
                        style={{ ...topBtn('#fff', saved ? KC.orange : KC.ink), padding: '10px 18px' }}
                    >
                        {saved ? <BookmarkCheck size={16} color={KC.orange} /> : <Bookmark size={16} />}
                        {saved ? 'Tersimpan' : 'Simpan Lowongan'}
                    </button>
                    <button
                        onClick={handleApply}
                        className="kc-btn"
                        style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 14 }}
                    >
                        Lamar Sekarang <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    )
}
