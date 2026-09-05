/**
 * ApplicationsPage — Real milestone timeline tracking for submitted job applications (Frame 10).
 */
import { useEffect } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles } from './_design'

export default function ApplicationsPage() {
    const { applications, loadApplications } = useStore()

    useEffect(() => {
        if (typeof loadApplications === 'function') {
            loadApplications()
        }
    }, [loadApplications])

    const list = (applications && applications.length > 0) ? applications : DEMO_APPLICATIONS

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Header (Frame 10) */}
            <div>
                <h1 style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: -0.9,
                    color: KC.ink, margin: '0 0 5px', lineHeight: 1.1,
                }}>
                    Lamaran Saya
                </h1>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                    {list.length} lamaran aktif · pelacakan tahapan real-time
                </div>
            </div>

            {/* Application List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {list.map((app, idx) => {
                    // Status mapping
                    const status = (app.status || 'applied').toLowerCase()
                    const stageIndex = app.stageIndex ?? (
                        status === 'hired' ? 4 :
                        status === 'interview' || status === 'shortlisted' ? 3 :
                        status === 'reviewed' ? 2 : 1
                    )
                    const isShortlisted = status === 'shortlisted' || status === 'interview'
                    const isReviewed = status === 'reviewed'

                    const company = app.company || (idx === 0 ? 'GoTo Group' : idx === 1 ? 'Traveloka' : 'Bibit')
                    const title = app.title || (idx === 0 ? 'Senior Backend Engineer' : idx === 1 ? 'Full-Stack Developer' : 'Backend Engineer')
                    const badgeText = isShortlisted ? 'Shortlisted' : isReviewed ? 'Ditinjau' : 'Terkirim'

                    return (
                        <div
                            key={app.id || idx}
                            style={{
                                background: '#FFFFFF', border: `1.5px solid ${idx === 2 ? '#CBD5E1' : KC.ink}`,
                                borderRadius: 13, boxShadow: idx === 2 ? 'none' : `3px 3px 0 ${KC.ink}`,
                                padding: 15, opacity: idx === 2 ? 0.85 : 1, animation: 'kcUp .4s both',
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                                        {company}
                                    </div>
                                    <div style={{ fontSize: 15.5, fontWeight: 900, letterSpacing: -0.5, color: KC.ink }}>
                                        {title}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '5px 10px',
                                    background: isShortlisted ? '#EEF2FF' : isReviewed ? '#FEF3C7' : '#F1F5F9',
                                    border: `1px solid ${isShortlisted ? '#6366F1' : isReviewed ? '#F59E0B' : '#CBD5E1'}`,
                                    borderRadius: 999, fontSize: 10, fontWeight: 800,
                                    color: isShortlisted ? '#3730A3' : isReviewed ? '#B45309' : '#475569',
                                    flexShrink: 0, whiteSpace: 'nowrap',
                                }}>
                                    {badgeText}
                                </span>
                            </div>

                            {/* 4-Step Milestone Stepper (Frame 10) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
                                {/* Step 1: Terkirim */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: '#10B981', border: `1.5px solid ${KC.ink}`,
                                    display: 'grid', placeItems: 'center', fontSize: 11,
                                    fontWeight: 900, color: '#fff', flexShrink: 0,
                                }}>
                                    ✓
                                </div>

                                <div style={{ flex: 1, height: 3, background: stageIndex >= 2 ? (stageIndex >= 3 ? '#10B981' : '#F59E0B') : '#E2E8F0' }} />

                                {/* Step 2: Ditinjau */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: stageIndex >= 3 ? '#10B981' : stageIndex === 2 ? '#F59E0B' : '#fff',
                                    border: `1.5px solid ${stageIndex >= 2 ? KC.ink : '#CBD5E1'}`,
                                    boxShadow: stageIndex === 2 ? '0 0 0 4px rgba(245,158,11,.2)' : 'none',
                                    display: 'grid', placeItems: 'center', fontSize: stageIndex >= 3 ? 11 : 10,
                                    fontWeight: 900, color: stageIndex >= 2 ? '#fff' : '#94A3B8', flexShrink: 0,
                                }}>
                                    {stageIndex >= 3 ? '✓' : 2}
                                </div>

                                <div style={{ flex: 1, height: 3, background: stageIndex >= 3 ? '#6366F1' : '#E2E8F0' }} />

                                {/* Step 3: Wawancara */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: stageIndex === 3 ? '#6366F1' : '#fff',
                                    border: `1.5px solid ${stageIndex >= 3 ? KC.ink : '#CBD5E1'}`,
                                    boxShadow: stageIndex === 3 ? '0 0 0 4px rgba(99,102,241,.2)' : 'none',
                                    display: 'grid', placeItems: 'center', fontSize: 10,
                                    fontWeight: 900, color: stageIndex === 3 ? '#fff' : '#94A3B8', flexShrink: 0,
                                }}>
                                    3
                                </div>

                                <div style={{ flex: 1, height: 3, background: '#E2E8F0' }} />

                                {/* Step 4: Hasil */}
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: '#fff', border: '1.5px solid #CBD5E1',
                                    display: 'grid', placeItems: 'center', fontSize: 10,
                                    fontWeight: 900, color: '#94A3B8', flexShrink: 0,
                                }}>
                                    4
                                </div>
                            </div>

                            {/* Stepper Labels */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3,
                                marginBottom: idx === 0 ? 12 : 0,
                            }}>
                                <span>Terkirim</span>
                                <span style={{ color: stageIndex === 2 ? '#B45309' : undefined }}>Ditinjau</span>
                                <span style={{ color: stageIndex === 3 ? '#3730A3' : undefined }}>Wawancara</span>
                                <span>Hasil</span>
                            </div>

                            {/* Notice box */}
                            {idx === 0 && (
                                <div style={{
                                    padding: '11px 12px', background: '#EEF2FF', border: '1px solid #6366F1',
                                    borderRadius: 9, fontSize: 11.5, lineHeight: 1.5, color: '#3730A3', fontWeight: 600,
                                }}>
                                    Jadwal wawancara teknis: <b>8 Sep 2026, 14:00 WIB</b> · Google Meet
                                </div>
                            )}

                            {idx === 2 && (
                                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 10 }}>
                                    Dikirim 2 hari lalu · rata-rata respons rekruter 4 hari
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const DEMO_APPLICATIONS = [
    {
        id: 'app1', company: 'GoTo Group', title: 'Senior Backend Engineer',
        status: 'shortlisted', stageIndex: 3,
    },
    {
        id: 'app2', company: 'Traveloka', title: 'Full-Stack Developer',
        status: 'reviewed', stageIndex: 2,
    },
    {
        id: 'app3', company: 'Bibit', title: 'Backend Engineer',
        status: 'applied', stageIndex: 1,
    },
]
