/**
 * ApplicationsPage — shows the seeker's application history with a milestone/
 * timeline interface. State transitions: Applied → Reviewed → Interview → Hired / Rejected.
 * Section 3.2: loadApplications() now called on login; this view renders that data.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, DesignStyles } from './_design'

const STATUS_TIMELINE = [
    { key: 'saved',     label: 'Tersimpan',  icon: '🔖', color: KC.ash },
    { key: 'applied',   label: 'Melamar',    icon: '📤', color: KC.cyan },
    { key: 'reviewed',  label: 'Ditinjau',   icon: '👀', color: KC.yellow },
    { key: 'interview', label: 'Interview',  icon: '📞', color: KC.orange },
    { key: 'hired',     label: 'Diterima',   icon: '🎉', color: KC.lime },
    { key: 'rejected',  label: 'Ditolak',    icon: '✗',  color: '#f87171' },
]

const STATUS_INDEX = Object.fromEntries(STATUS_TIMELINE.map((s, i) => [s.key, i]))

function MilestoneBar({ status }) {
    const active = STATUS_TIMELINE.find(s => s.key === status)
    const activeIdx = STATUS_INDEX[status] ?? 1
    const isTerminal = status === 'rejected'
    const steps = STATUS_TIMELINE.slice(0, isTerminal ? undefined : -1).filter(s => s.key !== 'rejected' || isTerminal)

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 14, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {STATUS_TIMELINE.filter(s => s.key !== 'saved' && s.key !== 'rejected').map((s, i) => {
                const stepIdx = STATUS_INDEX[s.key]
                const done = stepIdx < activeIdx
                const current = s.key === status
                const isLast = i === 3

                return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1, minWidth: 0 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: current ? s.color : done ? KC.lime : '#fff',
                            border: `2px solid ${current ? s.color : done ? KC.lime : KC.ash}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 900,
                            boxShadow: current ? `0 0 0 3px ${s.color}44` : 'none',
                            transition: 'all 0.3s',
                        }}>
                            {done ? '✓' : s.icon}
                        </div>
                        <div style={{
                            fontSize: 10, fontWeight: 800, textAlign: 'center', marginTop: 4,
                            color: current ? s.color : done ? KC.lime : KC.ash,
                            position: 'absolute', transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                        }} />
                        {!isLast && (
                            <div style={{
                                flex: 1, height: 2, minWidth: 20,
                                background: done ? KC.lime : KC.ash,
                                margin: '0 2px',
                                transition: 'background 0.3s',
                            }} />
                        )}
                    </div>
                )
            })}
            {status === 'rejected' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fef2f2', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#ef4444' }}>✗</div>
            )}
        </div>
    )
}

function ApplicationCard({ app }) {
    const [expanded, setExpanded] = useState(false)
    const st = STATUS_TIMELINE.find(s => s.key === app.status) || STATUS_TIMELINE[1]
    const appliedDate = app.applied_at
        ? new Date(app.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'

    return (
        <BrutalCard color="#fff" padding={20}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: KC.mute }}>{app.company || 'Perusahaan'}</span>
                        <Tag color={st.color} size="sm">{st.icon} {st.label}</Tag>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.3, margin: '0 0 6px' }}>
                        {app.title || 'Posisi'}
                    </h3>
                    <div style={{ fontSize: 12, fontWeight: 700, color: KC.mute }}>
                        📅 Melamar: {appliedDate}
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                        padding: '8px 14px', background: '#fff', color: KC.ink,
                        border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800,
                        fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                        whiteSpace: 'nowrap'
                    }}
                >
                    {expanded ? 'Tutup ▴' : 'Detail ▾'}
                </button>
            </div>

            {/* Milestone bar */}
            <MilestoneBar status={app.status} />

            {/* Status labels row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {STATUS_TIMELINE.filter(s => s.key !== 'saved' && s.key !== 'rejected').map(s => {
                    const activeIdx = STATUS_INDEX[app.status] ?? 1
                    const stepIdx = STATUS_INDEX[s.key]
                    const done = stepIdx <= activeIdx
                    return (
                        <div key={s.key} style={{ fontSize: 9, fontWeight: 800, color: done ? KC.ink : KC.ash, textAlign: 'center', flex: 1, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            {s.label}
                        </div>
                    )
                })}
            </div>

            {expanded && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1.5px dashed ${KC.ash}`, animation: 'kc-fade-up .2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                        <div>
                            <b>Status</b>
                            <div style={{ color: KC.mute, marginTop: 2 }}>{st.icon} {st.label}</div>
                        </div>
                        <div>
                            <b>Application ID</b>
                            <div style={{ color: KC.mute, marginTop: 2, fontSize: 10, fontFamily: 'monospace' }}>{app.application_id?.slice(0, 8) || '—'}…</div>
                        </div>
                        <div>
                            <b>Tanggal</b>
                            <div style={{ color: KC.mute, marginTop: 2 }}>{appliedDate}</div>
                        </div>
                    </div>
                    {app.status === 'applied' && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, color: KC.mute }}>
                            💡 Lamaran sedang dalam antrian review oleh tim HR perusahaan. Rata-rata respon 3–7 hari kerja.
                        </div>
                    )}
                    {app.status === 'interview' && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: KC.orangeSoft, border: `1.5px solid ${KC.orange}`, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                            🎉 Selamat! Kamu dipanggil interview. Periksa email atau WA untuk detail jadwal.
                        </div>
                    )}
                    {app.status === 'hired' && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: KC.lime + '33', border: `1.5px solid ${KC.lime}`, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                            🎊 Kamu diterima! Segera hubungi HR untuk onboarding. Selamat berkarier!
                        </div>
                    )}
                    {app.status === 'rejected' && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
                            Lamaran tidak berhasil kali ini. Jangan menyerah — analisis skill gap kamu dan coba lagi!
                        </div>
                    )}
                </div>
            )}
        </BrutalCard>
    )
}

export default function ApplicationsPage() {
    const { applications, applicationsLoading, loadApplications, navigate } = useStore()

    useEffect(() => {
        loadApplications()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const grouped = {
        active: applications.filter(a => !['rejected', 'hired'].includes(a.status)),
        hired: applications.filter(a => a.status === 'hired'),
        rejected: applications.filter(a => a.status === 'rejected'),
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1">Lamaran Saya</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {applications.length} lamaran terkirim · lacak status secara real-time
                    </p>
                </div>
                <button onClick={() => navigate('seeker-match')} style={{
                    padding: '10px 18px', background: KC.orange, color: '#fff',
                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800,
                    fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                }}>
                    + Lamar Lowongan Baru
                </button>
            </header>

            {applicationsLoading && (
                <div style={{ textAlign: 'center', padding: 40, color: KC.mute }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <p style={{ fontWeight: 700 }}>Memuat data lamaran…</p>
                </div>
            )}

            {!applicationsLoading && applications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${KC.ink}` }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Belum ada lamaran</h2>
                    <p style={{ color: KC.mute, marginBottom: 24, fontSize: 14 }}>
                        Mulai lamar pekerjaan dari halaman Match atau pencarian untuk melacak statusnya di sini.
                    </p>
                    <button onClick={() => navigate('seeker-match')} style={{
                        padding: '12px 24px', background: KC.orange, color: '#fff',
                        border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800,
                        fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`,
                    }}>
                        Cari Lowongan →
                    </button>
                </div>
            )}

            {!applicationsLoading && grouped.active.length > 0 && (
                <section>
                    <h2 style={{ fontSize: 17, fontWeight: 900, marginBottom: 12 }}>
                        Sedang Berlangsung <span style={{ fontSize: 13, color: KC.mute }}>({grouped.active.length})</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {grouped.active.map(a => <ApplicationCard key={a.application_id} app={a} />)}
                    </div>
                </section>
            )}

            {!applicationsLoading && grouped.hired.length > 0 && (
                <section>
                    <h2 style={{ fontSize: 17, fontWeight: 900, marginBottom: 12, color: '#16a34a' }}>
                        🎉 Diterima <span style={{ fontSize: 13, color: KC.mute }}>({grouped.hired.length})</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {grouped.hired.map(a => <ApplicationCard key={a.application_id} app={a} />)}
                    </div>
                </section>
            )}

            {!applicationsLoading && grouped.rejected.length > 0 && (
                <section>
                    <h2 style={{ fontSize: 17, fontWeight: 900, marginBottom: 12, color: '#dc2626' }}>
                        Tidak Lolos <span style={{ fontSize: 13, color: KC.mute }}>({grouped.rejected.length})</span>
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {grouped.rejected.map(a => <ApplicationCard key={a.application_id} app={a} />)}
                    </div>
                </section>
            )}
        </div>
    )
}
