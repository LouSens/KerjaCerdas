/**
 * EmployerCandidates — Clean enterprise candidate evaluation with Confidence Bands.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { fetchCandidatesForJob } from '../services/api'
import { KC, BrutalCard, Tag, BandLegend, topBtn, DesignStyles, BAND_META, BAND_ORDER } from './_design'
import { Users, ShieldCheck, CheckCircle2, AlertCircle, FileText, Lock, ChevronRight, Building2, MapPin, Sparkles, Filter, X } from 'lucide-react'

const bandOf = (c) => c.band || (c.score >= 65 ? 'strong' : c.score >= 45 ? 'possible' : 'stretch')

const DEMO_CANDIDATES = [
    { name: 'Rina Pertiwi', band: 'strong', verified: true, score: 94, title: 'Senior Backend Engineer · 6 tahun pengalaman', location: 'Jakarta · Hybrid', exp: '6 thn', edu: 'S1 Teknik Informatika ITB', prev: 'Bukalapak', skills: ['Go', 'PostgreSQL', 'gRPC', 'Kafka', 'Kubernetes'], gap: [], ai: 'Stack 100% selaras. Berpengalaman menangani throughput skala 100k RPS pada payment gateway.' },
    { name: 'Andika Pratama', band: 'strong', verified: true, score: 91, title: 'Backend Tech Lead · 7 tahun pengalaman', location: 'Jakarta · Remote', exp: '7 thn', edu: 'S1 Ilmu Komputer UI', prev: 'Bibit', skills: ['Go', 'PostgreSQL', 'Redis', 'gRPC'], gap: ['Kafka'], ai: 'Pengalaman arsitektur terdistribusi kuat. Gap Apache Kafka dapat diadaptasi dalam tempo singkat.' },
    { name: 'Sari Ningrum', band: 'possible', verified: true, score: 87, title: 'Staff Software Engineer · 8 tahun pengalaman', location: 'Bandung · Hybrid', exp: '8 thn', edu: 'S1 Teknik Elektro ITB', prev: 'GoTo Group', skills: ['Go', 'Microservices', 'Docker'], gap: ['gRPC'], ai: 'Kedalaman arsitektur microservices sangat baik dengan rekam jejak kepemimpinan proyek engineering.' },
    { name: 'Bayu Wicaksono', band: 'possible', verified: true, score: 83, title: 'Senior Backend Developer · 5 tahun pengalaman', location: 'Jakarta · Onsite', exp: '5 thn', edu: 'S1 Ilmu Komputer UGM', prev: 'Tokopedia', skills: ['Go', 'PostgreSQL', 'gRPC'], gap: ['Kubernetes'], ai: 'Kesesuaian stack inti solid dan bersedia bekerja secara on-site di kantor pusat.' },
    { name: 'Mira Anggraini', band: 'stretch', verified: false, score: 80, title: 'Software Engineer · 4 tahun pengalaman', location: 'Jakarta · Hybrid', exp: '4 thn', edu: 'S1 Sistem Informasi ITS', prev: 'Xendit', skills: ['Node.js', 'TypeScript', 'PostgreSQL'], gap: ['Go', 'gRPC'], ai: 'Memiliki fundamental software engineering yang kuat dan rekam jejak cepat dalam menguasai teknologi baru.' },
]

export default function EmployerCandidates() {
    const { employerJobs, refreshEmployerJobs, selectedCandidateJobId } = useStore()
    const [candidates, setCandidates] = useState(DEMO_CANDIDATES)
    const [selectedJobId, setSelectedJobId] = useState(selectedCandidateJobId || null)
    const [cvModalOpen, setCvModalOpen] = useState(null)

    useEffect(() => {
        refreshEmployerJobs()
    }, []) // eslint-disable-line

    useEffect(() => {
        if (employerJobs.length && !selectedJobId) {
            setSelectedJobId(selectedCandidateJobId || employerJobs[0].id)
        }
    }, [employerJobs, selectedCandidateJobId])

    const selectedJob = employerJobs.find(j => j.id === selectedJobId) || { title: 'Senior Backend Engineer' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Evaluasi Kandidat Terkurasi
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Posisi: <b>{selectedJob.title}</b> · Pengelompokan berbasis sinyal kompetensi riil (Confidence Bands)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <select
                        value={selectedJobId || ''}
                        onChange={e => setSelectedJobId(e.target.value)}
                        style={{
                            padding: '9px 14px',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13,
                            background: '#fff',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                        }}
                    >
                        {(employerJobs.length ? employerJobs : [{ id: 'd1', title: 'Senior Backend Engineer' }, { id: 'd2', title: 'Product Designer' }]).map(j => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Band Legend */}
            <BandLegend side="employer" />

            {/* Candidate List Grouped by Band */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {BAND_ORDER.map(bandKey => {
                    const bandInfo = BAND_META[bandKey]
                    const items = candidates.filter(c => bandOf(c) === bandKey)
                    if (!items.length) return null

                    return (
                        <div key={bandKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: bandInfo.color }} />
                                <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.3, margin: 0, color: KC.ink }}>
                                    {bandInfo.label} ({items.length} Kandidat)
                                </h2>
                                <span style={{ fontSize: 12, color: KC.mute }}>— {bandInfo.employer}</span>
                            </div>

                            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {items.map((cand, idx) => (
                                    <BrutalCard key={idx} color="#FFFFFF" padding={20}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                            <div style={{ flex: 1, minWidth: 280 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: KC.ink }}>
                                                        {cand.name}
                                                    </h3>
                                                    <Tag color={bandInfo.bg} ink={bandInfo.color} border={bandInfo.border} size="sm">
                                                        {bandInfo.badgeLabel}
                                                    </Tag>
                                                    {cand.verified && (
                                                        <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime} size="sm">
                                                            <ShieldCheck size={12} /> Terverifikasi Dukcapil
                                                        </Tag>
                                                    )}
                                                </div>

                                                <div style={{ fontSize: 13, fontWeight: 600, color: KC.inkLight, marginBottom: 8 }}>
                                                    {cand.title} · Sebelumnya di <b>{cand.prev}</b>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute, marginBottom: 12 }}>
                                                    <span>{cand.location}</span>
                                                    <span>·</span>
                                                    <span>Pendidikan: {cand.edu}</span>
                                                </div>

                                                {/* Skills matching / missing */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                    {cand.skills.map((s, sIdx) => (
                                                        <span key={sIdx} style={{ padding: '3px 8px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#047857' }}>
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                    {cand.gap.map((s, sIdx) => (
                                                        <span key={sIdx} style={{ padding: '3px 8px', background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                                                            + {s}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* AI Grounded Reasoning */}
                                                <div style={{ padding: '10px 12px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                    <Sparkles size={14} color={KC.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                                                    <span><b>Analisis AI:</b> {cand.ai}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                                                <button
                                                    onClick={() => setCvModalOpen(cand)}
                                                    className="kc-btn"
                                                    style={{ ...topBtn('#fff', KC.ink), padding: '8px 14px', fontSize: 12 }}
                                                >
                                                    <FileText size={14} /> Lihat CV Lengkap
                                                </button>
                                                <button
                                                    onClick={() => toast.success(`Akses kontak resmi ${cand.name} terbuka!`)}
                                                    className="kc-btn"
                                                    style={{ ...topBtn(KC.orange, '#fff'), padding: '8px 16px', fontSize: 12 }}
                                                >
                                                    <Lock size={13} /> Unlock Kontak (Rp 50.000)
                                                </button>
                                            </div>
                                        </div>
                                    </BrutalCard>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* CV Viewer Modal */}
            {cvModalOpen && (
                <div
                    onClick={() => setCvModalOpen(null)}
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
                            boxShadow: `6px 6px 0 ${KC.ink}`,
                            maxWidth: 580,
                            width: '100%',
                            padding: 24,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: KC.ink }}>{cvModalOpen.name}</h3>
                                <span style={{ fontSize: 12, color: KC.mute }}>{cvModalOpen.title}</span>
                            </div>
                            <button onClick={() => setCvModalOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ fontSize: 13, color: KC.inkLight, lineHeight: 1.6, marginBottom: 16 }}>
                            <p><b>Riwayat Pengalaman:</b> 6 tahun di {cvModalOpen.prev} menangani arsitektur backend berskala tinggi, microservices gRPC, dan caching multi-region.</p>
                            <p><b>Pendidikan:</b> {cvModalOpen.edu}</p>
                            <p><b>Keahlian Teknis:</b> {cvModalOpen.skills.join(', ')}</p>
                        </div>
                        <button
                            onClick={() => { toast.success(`Kontak ${cvModalOpen.name} telah di-unlock!`); setCvModalOpen(null) }}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), width: '100%', padding: '10px 0', fontSize: 13 }}
                        >
                            Buka Kontak & Jadwalkan Wawancara →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
