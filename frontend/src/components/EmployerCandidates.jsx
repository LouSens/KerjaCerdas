/**
 * EmployerCandidates — Real candidate management & evaluation with Confidence Bands.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { fetchCandidatesForJob } from '../services/api'
import { KC, BrutalCard, Tag, BandLegend, topBtn, DesignStyles, BAND_META, BAND_ORDER } from './_design'
import {
    CheckCircle2,
    AlertCircle,
    MapPin,
    Sparkles,
    X,
    Inbox,
    Edit3,
    Send,
    FileSearch,
    PhoneCall,
} from 'lucide-react'

const bandOf = (c) => c.band || (c.score >= 65 ? 'strong' : c.score >= 45 ? 'possible' : 'stretch')

const STAGE_OPTIONS = [
    { key: 'applied', label: 'Terkirim', color: KC.cyan, bg: KC.cyanSoft, icon: Send },
    { key: 'reviewed', label: 'Ditinjau HR', color: KC.yellow, bg: KC.yellowSoft, icon: FileSearch },
    { key: 'interview', label: 'Wawancara', color: KC.orange, bg: KC.orangeSoft, icon: PhoneCall },
    { key: 'offered', label: 'Ditawari', color: KC.orange, bg: KC.orangeSoft, icon: Send },
    { key: 'hired', label: 'Diterima', color: KC.lime, bg: KC.limeSoft, icon: CheckCircle2 },
    { key: 'rejected', label: 'Ditolak', color: '#DC2626', bg: '#FEE2E2', icon: AlertCircle },
]

// Mirrors APPLICATION_TRANSITIONS on the API. The pipeline only moves forward
// and `hired` / `rejected` are terminal, so stages that would be refused are
// disabled here rather than offered and then rejected with an error toast.
const ALLOWED_NEXT = {
    applied: ['reviewed', 'interview', 'rejected'],
    reviewed: ['interview', 'offered', 'rejected'],
    interview: ['offered', 'rejected'],
    offered: ['hired', 'rejected'],
    hired: [],
    rejected: [],
    saved: [],
}

const canMoveTo = (current, target) =>
    current === target || (ALLOWED_NEXT[current] || []).includes(target)

export default function EmployerCandidates() {
    const {
        employerJobs,
        refreshEmployerJobs,
        selectedCandidateJobId,
        employerApplications,
        employerApplicationsLoading,
        loadEmployerApplications,
        changeApplicationStatus,
    } = useStore()

    const [activeTab, setActiveTab] = useState('applications') // 'applications' | 'sourcing'
    const [candidates, setCandidates] = useState([])
    const [candidatesLoading, setCandidatesLoading] = useState(false)
    const [candidatesError, setCandidatesError] = useState(null)
    const [selectedJobId, setSelectedJobId] = useState(selectedCandidateJobId || null)
    const [noteModalApp, setNoteModalApp] = useState(null)
    const [noteText, setNoteText] = useState('')
    const [savingStatus, setSavingStatus] = useState(false)

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerApplications()
    }, []) // eslint-disable-line

    useEffect(() => {
        if (employerJobs.length && !selectedJobId) {
            setSelectedJobId(selectedCandidateJobId || employerJobs[0].id)
        }
    }, [employerJobs, selectedCandidateJobId])

    useEffect(() => {
        if (selectedJobId) {
            loadEmployerApplications(selectedJobId)
        }
    }, [selectedJobId]) // eslint-disable-line

    useEffect(() => {
        if (activeTab !== 'sourcing' || !selectedJobId) return undefined
        let cancelled = false
        setCandidatesLoading(true)
        setCandidatesError(null)
        setCandidates([])
        fetchCandidatesForJob(selectedJobId, 10)
            .then((data) => {
                if (!cancelled) setCandidates(data.candidates || [])
            })
            .catch((err) => {
                if (!cancelled) {
                    setCandidates([])
                    setCandidatesError(err.message || 'Kandidat tidak dapat dimuat saat ini.')
                }
            })
            .finally(() => {
                if (!cancelled) setCandidatesLoading(false)
            })
        return () => { cancelled = true }
    }, [activeTab, selectedJobId])

    const selectedJob = employerJobs.find(j => j.id === selectedJobId) || (employerJobs.length ? employerJobs[0] : { title: 'Semua Lowongan' })

    const filteredApplications = selectedJobId
        ? employerApplications.filter(a => a.job_id === selectedJobId)
        : employerApplications

    const handleUpdateStatus = async (appId, newStatus, currentNote = '') => {
        try {
            await changeApplicationStatus(appId, newStatus, currentNote)
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const openNoteModal = (app) => {
        setNoteModalApp(app)
        setNoteText(app.note || '')
    }

    const saveNoteModal = async () => {
        if (!noteModalApp) return
        setSavingStatus(true)
        try {
            await changeApplicationStatus(noteModalApp.id, noteModalApp.status, noteText)
            setNoteModalApp(null)
        } catch (err) {
            console.error('Failed to save note:', err)
        } finally {
            setSavingStatus(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}`, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Evaluasi Kandidat & Pelamar Masuk
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Posisi: <b>{selectedJob.title || 'Semua Posisi'}</b> · Kelola alur rekrutmen nyata & pantau sinyal kompetensi
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
                        {employerJobs.map(j => (
                            <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Sub-navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: `1.5px solid ${KC.ash}`, paddingBottom: 8 }}>
                <button
                    onClick={() => setActiveTab('applications')}
                    className="kc-btn"
                    style={{
                        ...topBtn(activeTab === 'applications' ? KC.ink : '#fff', activeTab === 'applications' ? '#fff' : KC.ink),
                        padding: '8px 16px',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Inbox size={15} /> Pelamar Masuk (Real DB)
                    <span style={{
                        padding: '1px 7px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        background: activeTab === 'applications' ? KC.orange : KC.ash,
                        color: activeTab === 'applications' ? '#fff' : KC.ink,
                    }}>
                        {filteredApplications.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('sourcing')}
                    className="kc-btn"
                    style={{
                        ...topBtn(activeTab === 'sourcing' ? KC.ink : '#fff', activeTab === 'sourcing' ? '#fff' : KC.ink),
                        padding: '8px 16px',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Sparkles size={15} color={activeTab === 'sourcing' ? '#fff' : KC.orange} /> AI Reverse Sourcing (Talent Pool)
                </button>
            </div>

            {/* TAB 1: Real Applicant Pipeline */}
            {activeTab === 'applications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredApplications.length === 0 ? (
                        <BrutalCard color="#FFFFFF" padding={32}>
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: KC.cyanSoft, display: 'grid', placeItems: 'center', border: `1.5px solid ${KC.ink}` }}>
                                    <Inbox size={22} color={KC.ink} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: KC.ink, margin: 0 }}>
                                    Belum Ada Pelamar untuk Posisi Ini
                                </h3>
                                <p style={{ fontSize: 13, color: KC.mute, margin: 0, maxWidth: 420 }}>
                                    Pelamar yang mengirimkan lamaran dari portal kerja akan langsung muncul di sini secara real-time.
                                </p>
                            </div>
                        </BrutalCard>
                    ) : (
                        <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {filteredApplications.map((app, idx) => {
                                const currentOpt = STAGE_OPTIONS.find(s => s.key === app.status) || STAGE_OPTIONS[0]
                                const IconComp = currentOpt.icon

                                return (
                                    <BrutalCard key={app.id || idx} color="#FFFFFF" padding={20}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: KC.ink }}>
                                                            {app.seeker_name}
                                                        </h3>
                                                        <Tag color={currentOpt.bg} ink={currentOpt.color} border={currentOpt.color} size="sm">
                                                            <IconComp size={12} /> {currentOpt.label}
                                                        </Tag>
                                                    </div>
                                                    <div style={{ fontSize: 13, color: KC.inkLight, fontWeight: 600, marginBottom: 4 }}>
                                                        {app.headline || 'Pencari Kerja Aktif'} · Posisi: <b>{app.job_title}</b>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: KC.mute, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                                        <span>Email: {app.seeker_email}</span>
                                                        <span>Telepon: {app.seeker_phone}</span>
                                                        <span>Dikirim: {app.applied_at}</span>
                                                    </div>
                                                </div>

                                                {/* Status Transition Selector */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: KC.mute }}>Ubah Status:</span>
                                                    <select
                                                        value={app.status}
                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value, app.note)}
                                                        style={{
                                                            padding: '6px 10px',
                                                            border: `1.5px solid ${KC.ink}`,
                                                            borderRadius: 6,
                                                            fontWeight: 700,
                                                            fontSize: 12,
                                                            background: currentOpt.bg,
                                                            color: currentOpt.color,
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {STAGE_OPTIONS.map(opt => (
                                                            <option
                                                                key={opt.key}
                                                                value={opt.key}
                                                                disabled={!canMoveTo(app.status, opt.key)}
                                                            >
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => openNoteModal(app)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                                                        title="Tulis atau perbarui catatan tahapan"
                                                    >
                                                        <Edit3 size={12} /> Catatan Tahapan
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {app.skills && app.skills.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {app.skills.map((sk, sIdx) => (
                                                        <span key={sIdx} style={{ padding: '2px 8px', background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: KC.inkLight }}>
                                                            {sk}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Real Stage Note Display */}
                                            {app.note && (
                                                <div style={{ padding: '10px 14px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                                                    <b>Catatan untuk Pelamar:</b> {app.note}
                                                </div>
                                            )}
                                        </div>
                                    </BrutalCard>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: AI Reverse Sourcing */}
            {activeTab === 'sourcing' && (
                <>
                    <BandLegend side="employer" />
                    <p style={{ margin: 0, fontSize: 12, color: KC.mute }}>
                        Hasil bersumber dari profil pencari kerja yang tersedia. Kontak, CV lengkap, dan status verifikasi tidak ditampilkan pada prototipe ini.
                    </p>
                    {candidatesLoading && (
                        <BrutalCard color="#FFFFFF" padding={24}>
                            <p style={{ margin: 0, fontSize: 13, color: KC.mute }}>Mencari kandidat yang relevan…</p>
                        </BrutalCard>
                    )}
                    {candidatesError && (
                        <BrutalCard color="#FFF7ED" padding={24}>
                            <p style={{ margin: 0, fontSize: 13, color: '#9A3412' }}>{candidatesError}</p>
                        </BrutalCard>
                    )}
                    {!candidatesLoading && !candidatesError && candidates.length === 0 && (
                        <BrutalCard color="#FFFFFF" padding={24}>
                            <p style={{ margin: 0, fontSize: 13, color: KC.mute }}>
                                Belum ada profil yang cocok untuk lowongan ini. Coba lengkapi kebutuhan keterampilan pada lowongan atau tambahkan profil demo yang relevan.
                            </p>
                        </BrutalCard>
                    )}
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
                                            <BrutalCard key={idx} color="#FFFFFF" padding={18}>
                                                <div className="kc-card-split">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                            <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: KC.ink }}>
                                                            {cand.full_name || 'Profil pencari kerja'}
                                                            </h3>
                                                            <Tag color={bandInfo.bg} ink={bandInfo.color} border={bandInfo.border} size="sm">
                                                                {bandInfo.badgeLabel}
                                                            </Tag>
                                                        </div>

                                                        <div style={{ fontSize: 13, fontWeight: 600, color: KC.inkLight, marginBottom: 6 }}>
                                                            {cand.headline || 'Profil keterampilan tersedia'}
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: KC.mute, marginBottom: 10, flexWrap: 'wrap' }}>
                                                            <MapPin size={13} />
                                                            <span>{cand.region_code || 'Lokasi belum diisi'}</span>
                                                        </div>

                                                        {/* Skills matching / missing */}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                                            {(cand.matching_skills || []).map((s, sIdx) => (
                                                                <span key={sIdx} style={{ padding: '3px 8px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#047857' }}>
                                                                    ✓ {s}
                                                                </span>
                                                            ))}
                                                            {(cand.missing_skills || []).map((s, sIdx) => (
                                                                <span key={sIdx} style={{ padding: '3px 8px', background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                                                                    + {s}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* AI Grounded Reasoning */}
                                                        <div style={{ padding: '10px 12px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                            <Sparkles size={14} color={KC.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                                                            <span><b>Alasan kecocokan:</b> {cand.explanation || 'Kecocokan dihitung dari keterampilan yang dicantumkan pada profil.'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </BrutalCard>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Note Edit Modal */}
            {noteModalApp && (
                <div
                    onClick={() => setNoteModalApp(null)}
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
                            maxWidth: 520,
                            width: '100%',
                            padding: 24,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: KC.ink }}>Catatan Tahapan Rekruter</h3>
                                <span style={{ fontSize: 12, color: KC.mute }}>Untuk pelamar: <b>{noteModalApp.seeker_name}</b> ({noteModalApp.job_title})</span>
                            </div>
                            <button onClick={() => setNoteModalApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 800, color: KC.ink, display: 'block', marginBottom: 6 }}>
                                Catatan ini akan tampil langsung di timeline pelacak lamaran pencari kerja:
                            </label>
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Contoh: Jadwal wawancara teknis pada 28 Agustus 2026 pukul 14:00 WIB via Google Meet (link dikirim via email)."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button
                                onClick={() => setNoteModalApp(null)}
                                className="kc-btn"
                                style={{ ...topBtn('#fff', KC.ink), padding: '8px 16px', fontSize: 12 }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={saveNoteModal}
                                disabled={savingStatus}
                                className="kc-btn"
                                style={{ ...topBtn(KC.orange, '#fff'), padding: '8px 18px', fontSize: 12 }}
                            >
                                {savingStatus ? 'Menyimpan...' : 'Simpan Catatan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
