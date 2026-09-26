// Ranked applicants for one job: proof chips, pipeline status, notes,
// AI interview questions, "skill terbukti" confirmation, CSV export.
// Every applicant is ranked and shown, best match first — screening is never
// capped. A rejection must carry one of the fixed reason codes; the seeker
// sees that reason, which is what turns a rejection into a next step.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Lock, MessageSquareText, StickyNote } from 'lucide-react'
import useStore from '../store/useStore'
import { BAND_META, BrutalCard, KC, selectStyle, topBtn } from './_design'
import { ProofChip, ProofLegend } from './ProofUI'
import HiringToolsModal from './HiringToolsModal'
import ApplicantSkillMap from './ApplicantSkillMap'
import { downloadApplicantsCsv, REJECTION_REASONS } from '../services/api'

const STAGES = { applied: 'Terkirim', reviewed: 'Ditinjau', interview: 'Wawancara', offered: 'Ditawari', hired: 'Diterima', rejected: 'Ditolak' }
const NEXT = { applied: ['reviewed', 'interview', 'rejected'], reviewed: ['interview', 'offered', 'rejected'], interview: ['offered', 'rejected'], offered: ['hired', 'rejected'] }
// Button text says the ACTION, not the destination state ("→ Ditinjau" read like a label).
const ACTION = { reviewed: 'Tandai ditinjau', interview: 'Undang wawancara', offered: 'Beri tawaran', hired: 'Terima kerja', rejected: 'Tolak…' }
const SOURCE = { link: 'via link lamaran', board: 'via papan lowongan' }
const ELLIPSIS = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

export default function ApplicantList({ job }) {
    const { employerApplications, employerApplicationsLoading, changeApplicationStatus } = useStore()
    const [tool, setTool] = useState(null)
    const [rejecting, setRejecting] = useState(null) // application id awaiting a reason
    const [reason, setReason] = useState('skill_kurang')
    const items = job ? employerApplications.filter((a) => a.job_id === job.id) : employerApplications

    const move = (app, status) => {
        if (status === 'rejected') {
            setRejecting(app.id)
            return
        }
        changeApplicationStatus(app.id, status, app.note || '').catch(() => {})
    }
    const confirmReject = (app) => {
        changeApplicationStatus(app.id, 'rejected', app.note || '', reason)
            .then(() => setRejecting(null))
            .catch(() => {})
    }

    const exportCsv = async () => {
        try {
            const blob = await downloadApplicantsCsv(job.id)
            const url = URL.createObjectURL(blob)
            const a = Object.assign(document.createElement('a'), { href: url, download: `pelamar-${job.title}.csv` })
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            toast.error(e.message)
        }
    }

    const setNote = (app) => {
        const note = window.prompt('Pesan untuk pelamar ini (tampil di Lamaran Saya milik pelamar):', app.note || '')
        if (note !== null) changeApplicationStatus(app.id, app.status, note).catch(() => {})
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <ProofLegend />
                {job && <button style={topBtn()} onClick={exportCsv}><Download size={14} /> Ekspor CSV</button>}
            </div>
            {job && <ApplicantSkillMap job={job} items={items.filter((a) => !a.locked)} />}
            {employerApplicationsLoading && <p>Memuat pelamar…</p>}
            {!employerApplicationsLoading && items.length === 0 && (
                <BrutalCard color={KC.surface}>
                    Belum ada pelamar. Tempel link lamaran di iklan lowongan Anda — ambil link-nya di menu <b>Lowongan Saya</b>.
                </BrutalCard>
            )}
            {items.map((app, idx) => app.locked ? (
                <BrutalCard key={app.id} color={KC.surfaceAlt} padding={14}>
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: KC.mute }}><Lock size={14} /> Pelamar #{idx + 1} terkunci · {SOURCE[app.source] || ''} · {app.applied_at}</span>
                </BrutalCard>
            ) : (
                <BrutalCard key={app.id} padding={16}>
                    {/* Score column never wraps below: the text column shrinks and truncates instead. */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 900, fontSize: 16, ...ELLIPSIS }}>#{idx + 1} {app.seeker_name}</div>
                            <div title={app.headline || ''} style={{ fontSize: 13, color: KC.mute, ...ELLIPSIS }}>
                                {app.headline || '—'}
                            </div>
                            <div style={{ fontSize: 12, color: KC.mute, ...ELLIPSIS }}>
                                {[SOURCE[app.source], app.applied_at, app.email_verified ? 'email ✓' : ''].filter(Boolean).join(' · ')}
                            </div>
                            {app.seeker_email && <div style={{ fontSize: 13, marginTop: 2, ...ELLIPSIS }}>{app.seeker_email}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 84 }}>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{Math.round((app.match_score || 0) * 100)}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: BAND_META[app.band]?.border || KC.mute }}>{BAND_META[app.band]?.badgeLabel}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
                        {/* Not compact: HR needs to read the proof level, not just the colour. */}
                        {(app.skill_proof || []).map((p) => <ProofChip key={p.name} name={p.name} status={p.status} />)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 999, background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}` }}>{STAGES[app.status] || app.status}</span>
                        {(NEXT[app.status] || []).map((s) => (
                            <button key={s} style={{ ...topBtn(s === 'rejected' ? '#fff' : '#fff', s === 'rejected' ? '#B91C1C' : KC.ink, s === 'rejected' ? '#B91C1C' : KC.ink), padding: '6px 11px', fontSize: 12 }} onClick={() => move(app, s)}>{ACTION[s]}</button>
                        ))}
                        <button style={{ ...topBtn(), padding: '6px 11px', fontSize: 12 }} onClick={() => setNote(app)}><StickyNote size={13} /> Pesan untuk pelamar</button>
                        <button style={{ ...topBtn(KC.ink, '#fff'), padding: '6px 11px', fontSize: 12 }} onClick={() => setTool(app)}><MessageSquareText size={13} /> Wawancara & konfirmasi skill</button>
                    </div>
                    {rejecting === app.id && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, padding: 10, background: KC.roseSoft, border: '1px solid #FCA5A5', borderRadius: 9 }}>
                            <span style={{ fontSize: 13, fontWeight: 800 }}>Alasan penolakan (dilihat pelamar):</span>
                            <select value={reason} onChange={(e) => setReason(e.target.value)} style={selectStyle({ padding: '7px 34px 7px 10px', fontSize: 13, width: 260 })}>
                                {REJECTION_REASONS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                            </select>
                            <button style={{ ...topBtn(KC.rose, '#fff'), padding: '6px 11px', fontSize: 12 }} onClick={() => confirmReject(app)}>Tolak</button>
                            <button style={{ ...topBtn(), padding: '6px 11px', fontSize: 12 }} onClick={() => setRejecting(null)}>Batal</button>
                        </div>
                    )}
                    {app.note && <p style={{ fontSize: 13, color: KC.inkLight, margin: '8px 0 0' }}>Pesan ke pelamar: {app.note}</p>}
                </BrutalCard>
            ))}
            {tool && <HiringToolsModal app={tool} onClose={() => setTool(null)} />}
        </div>
    )
}
