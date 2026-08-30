/**
 * ApplicationsPage — Real enterprise milestone tracker for submitted job applications.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'
import { Send, FileSearch, PhoneCall, CheckCircle2, XCircle, Building2, Calendar, Clock, RefreshCw, Briefcase, ChevronRight } from 'lucide-react'

const STAGES = [
    { key: 'applied', label: 'Terkirim', icon: Send, color: KC.cyan, bg: KC.cyanSoft },
    { key: 'reviewed', label: 'Ditinjau HR', icon: FileSearch, color: KC.yellow, bg: KC.yellowSoft },
    { key: 'interview', label: 'Wawancara', icon: PhoneCall, color: KC.orange, bg: KC.orangeSoft },
    { key: 'hired', label: 'Diterima', icon: CheckCircle2, color: KC.lime, bg: KC.limeSoft },
]

export default function ApplicationsPage() {
    const { applications, applicationsLoading, loadApplications, navigate } = useStore()
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (typeof loadApplications === 'function') {
            loadApplications()
        }
    }, []) // eslint-disable-line

    const handleRefresh = async () => {
        setRefreshing(true)
        if (typeof loadApplications === 'function') {
            await loadApplications()
        }
        setRefreshing(false)
    }

    const list = applications || []

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Riwayat & Status Lamaran
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Pantau transparansi tahapan proses rekrutmen aktif Anda secara real-time dari database
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        className="kc-btn"
                        onClick={handleRefresh}
                        disabled={refreshing || applicationsLoading}
                        style={{ ...topBtn('#fff', KC.ink), opacity: refreshing ? 0.7 : 1 }}
                        title="Segarkan data dari server"
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Segarkan
                    </button>
                    <button className="kc-btn" onClick={() => navigate('seeker-match')} style={topBtn(KC.orange, '#fff')}>
                        Lamar Posisi Baru →
                    </button>
                </div>
            </header>

            {/* Empty State */}
            {!applicationsLoading && list.length === 0 && (
                <BrutalCard color="#FFFFFF" padding={40}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: KC.yellowSoft, display: 'grid', placeItems: 'center', border: `1.5px solid ${KC.ink}` }}>
                            <Briefcase size={26} color={KC.ink} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: KC.ink, margin: 0 }}>
                            Belum Ada Lamaran Aktif
                        </h2>
                        <p style={{ fontSize: 14, color: KC.mute, maxWidth: 460, margin: 0, lineHeight: 1.5 }}>
                            Anda belum mengirimkan lamaran pekerjaan. Temukan lowongan yang selaras dengan profil kompetensi Anda dan lamar sekarang.
                        </p>
                        <button
                            className="kc-btn"
                            onClick={() => navigate('seeker-match')}
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 13, marginTop: 8 }}
                        >
                            Jelajahi Rekomendasi Karir AI →
                        </button>
                    </div>
                </BrutalCard>
            )}

            {/* Application List */}
            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {list.map((app, idx) => {
                    const normalizedStatus = (app.status || 'applied').toLowerCase()
                    const isRejected = normalizedStatus === 'rejected'
                    const isHired = normalizedStatus === 'hired' || normalizedStatus === 'offered'

                    let activeIdx = STAGES.findIndex(s => s.key === normalizedStatus)
                    if (isHired) activeIdx = 3
                    if (activeIdx < 0) activeIdx = 0

                    const activeStage = isRejected
                        ? { key: 'rejected', label: 'Ditolak', icon: XCircle, color: '#DC2626', bg: '#FEE2E2' }
                        : isHired
                        ? { key: 'hired', label: 'Diterima', icon: CheckCircle2, color: KC.lime, bg: KC.limeSoft }
                        : STAGES[activeIdx]

                    return (
                        <BrutalCard key={app.id || app.application_id || idx} color="#FFFFFF" padding={22}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Building2 size={14} /> {app.company || 'Perusahaan Mitra'}
                                        </span>
                                        <Tag color={activeStage.bg} ink={activeStage.color} border={activeStage.color} size="sm">
                                            {activeStage.label}
                                        </Tag>
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', color: KC.ink, letterSpacing: -0.3 }}>
                                        {app.title}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: KC.mute, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={13} /> Dikirim: {app.applied_at || 'Baru saja'}
                                        </span>
                                        {app.updated_at && app.updated_at !== app.applied_at && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={13} /> Pembaruan: {app.updated_at}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stepper Timeline */}
                            {!isRejected ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '14px 0 16px', position: 'relative' }}>
                                    {STAGES.map((stage, sIdx) => {
                                        const isDone = sIdx <= activeIdx
                                        const isCurrent = sIdx === activeIdx
                                        const IconComp = stage.icon

                                        return (
                                            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                                                <div
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: '50%',
                                                        border: `1.5px solid ${isDone ? KC.ink : KC.borderMuted}`,
                                                        background: isCurrent ? stage.color : isDone ? KC.ink : KC.surfaceAlt,
                                                        color: isDone ? '#fff' : KC.mute,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        boxShadow: isCurrent ? `2px 2px 0 ${KC.ink}` : 'none',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                >
                                                    <IconComp size={15} />
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? KC.ink : KC.mute }}>
                                                    {stage.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #F87171', borderRadius: 8, fontSize: 12, color: '#991B1B', margin: '12px 0' }}>
                                    <b>Tahapan Selesai:</b> Proses seleksi untuk posisi ini telah ditutup.
                                </div>
                            )}

                            {/* Real Status Note from Recruiter / DB */}
                            {app.note && (
                                <div style={{ padding: '12px 14px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                                    <b>Catatan Tahapan Rekruter:</b> {app.note}
                                </div>
                            )}
                        </BrutalCard>
                    )
                })}
            </div>
        </div>
    )
}
