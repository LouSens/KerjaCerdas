import { useState } from 'react'
import useStore from '../store/useStore'
import JobDetailModal from './JobDetailModal'
import { KC, BrutalCard, topBtn, Tag, DesignStyles } from './_design'
import { Bookmark, Building2, MapPin, Trash2, ArrowRight, BookmarkCheck } from 'lucide-react'

export default function SavedJobsPage() {
    const { savedJobs, toggleSaveJob, navigate } = useStore()
    const [selectedJob, setSelectedJob] = useState(null)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Lowongan Tersimpan
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {savedJobs.length} posisi yang Anda simpan untuk dievaluasi atau dilamar nanti
                    </p>
                </div>
                <button className="kc-btn" onClick={() => navigate('seeker-match')} style={topBtn(KC.orange, '#fff')}>
                    Cari Lowongan Lain →
                </button>
            </header>

            {savedJobs.length === 0 ? (
                <BrutalCard color="#FFFFFF" padding={40} style={{ textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: KC.surfaceAlt, border: `1.5px solid ${KC.borderMuted}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: KC.mute }}>
                        <Bookmark size={24} />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6, color: KC.ink }}>Belum Ada Lowongan Tersimpan</h2>
                    <p style={{ color: KC.mute, marginBottom: 20, fontSize: 13, maxWidth: 380, margin: '0 auto 18px' }}>
                        Klik ikon bookmark pada daftar rekomendasi lowongan untuk menyimpannya di halaman ini.
                    </p>
                    <button onClick={() => navigate('seeker-match')} className="kc-btn" style={topBtn(KC.ink, '#fff')}>
                        Eksplorasi Rekomendasi Match →
                    </button>
                </BrutalCard>
            ) : (
                <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {savedJobs.map((job, idx) => (
                        <BrutalCard key={job.job_id || job.id || idx} color="#FFFFFF" padding={18}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Building2 size={13} /> {job.company || 'Perusahaan Mitra'}
                                        </span>
                                        <Tag color={KC.surfaceAlt} ink={KC.inkLight} border={KC.borderMuted} size="sm">
                                            Tersimpan
                                        </Tag>
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', color: KC.ink, letterSpacing: -0.3 }}>
                                        {job.title || job.job_title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: KC.mute }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={13} /> {job.location || 'Jakarta'}
                                        </span>
                                        <span>·</span>
                                        <span>{job.salary_range || 'Gaji Kompetitif'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <button
                                        onClick={() => toggleSaveJob(job)}
                                        className="kc-btn"
                                        style={{ ...topBtn('#fff', KC.rose, KC.borderMuted), padding: '8px 12px' }}
                                        title="Hapus bookmark"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="kc-btn"
                                        style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 12 }}
                                    >
                                        Detail & Lamar <ArrowRight size={13} />
                                    </button>
                                </div>
                            </div>
                        </BrutalCard>
                    ))}
                </div>
            )}
        </div>
    )
}
