/**
 * ApplicationsPage — Clean enterprise milestone tracker for submitted job applications.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'
import { Send, FileSearch, PhoneCall, CheckCircle2, XCircle, Building2, Calendar, ChevronRight, Clock } from 'lucide-react'

const STAGES = [
    { key: 'applied', label: 'Terkirim', icon: Send, color: KC.cyan, bg: KC.cyanSoft },
    { key: 'reviewed', label: 'Ditinjau HR', icon: FileSearch, color: KC.yellow, bg: KC.yellowSoft },
    { key: 'interview', label: 'Wawancara', icon: PhoneCall, color: KC.orange, bg: KC.orangeSoft },
    { key: 'hired', label: 'Diterima', icon: CheckCircle2, color: KC.lime, bg: KC.limeSoft },
]

const DEMO_APPLICATIONS = [
    { id: 'app1', title: 'Senior Backend Engineer', company: 'GoTo Group', status: 'interview', applied_at: '2026-08-20', updated_at: '2026-08-25', note: 'Jadwal wawancara teknis pada 28 Agustus 2026 pukul 14:00 WIB via Google Meet.' },
    { id: 'app2', title: 'Full-Stack Developer', company: 'Traveloka', status: 'reviewed', applied_at: '2026-08-22', updated_at: '2026-08-24', note: 'Berkas dan portofolio Anda sedang dalam proses tinjauan oleh Hiring Manager.' },
    { id: 'app3', title: 'DevOps Platform Engineer', company: 'Bank Mandiri Digital', status: 'applied', applied_at: '2026-08-26', updated_at: '2026-08-26', note: 'Lamaran berhasil terkirim ke sistem rekrutmen institusi.' },
]

export default function ApplicationsPage() {
    const { applications, loadApplications, navigate } = useStore()

    useEffect(() => {
        if (typeof loadApplications === 'function') loadApplications()
    }, []) // eslint-disable-line

    const list = applications?.length ? applications : DEMO_APPLICATIONS

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
                        Pantau transparansi tahapan proses rekrutmen aktif Anda secara berkala
                    </p>
                </div>
                <button className="kc-btn" onClick={() => navigate('seeker-match')} style={topBtn(KC.orange, '#fff')}>
                    Lamar Posisi Baru →
                </button>
            </header>

            {/* Application List */}
            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {list.map((app, idx) => {
                    const currentStageIdx = STAGES.findIndex(s => s.key === app.status)
                    const activeIdx = currentStageIdx >= 0 ? currentStageIdx : 0
                    const activeStage = STAGES[activeIdx]

                    return (
                        <BrutalCard key={app.id || idx} color="#FFFFFF" padding={22}>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: KC.mute }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={13} /> Dikirim: {app.applied_at || '26 Agu 2026'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stepper Timeline */}
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

                            {/* Status Note */}
                            {app.note && (
                                <div style={{ padding: '12px 14px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                                    <b>Catatan Tahapan:</b> {app.note}
                                </div>
                            )}
                        </BrutalCard>
                    )
                })}
            </div>
        </div>
    )
}
