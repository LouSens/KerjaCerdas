// Ranked applicants for one job: proof chips, pipeline status, notes,
// AI interview questions, "skill terbukti" confirmation, CSV export.
// Every tier, including Spark, ranks and reveals ALL applicants: ranking is a
// free computation, so a cap saved nothing and only hid people. The
// rest show as locked. The cap limits how many are opened, not which — a
// late-arriving better candidate must not be hidden behind the paywall.
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Lock, MessageSquareText, StickyNote } from 'lucide-react'
import useStore from '../store/useStore'
import { BAND_META, BrutalCard, KC, topBtn } from './_design'
import { ProofChip, ProofLegend } from './ProofUI'
import HiringToolsModal from './HiringToolsModal'
import { downloadApplicantsCsv } from '../services/api'

const STAGES = { applied: 'Terkirim', reviewed: 'Ditinjau', interview: 'Wawancara', offered: 'Ditawari', hired: 'Diterima', rejected: 'Ditolak' }
const NEXT = { applied: ['reviewed', 'interview', 'rejected'], reviewed: ['interview', 'offered', 'rejected'], interview: ['offered', 'rejected'], offered: ['hired', 'rejected'] }
const SOURCE = { link: 'via link/QR', board: 'via papan lowongan' }

export default function ApplicantList({ job }) {
    const { employerApplications, employerApplicationsLoading, changeApplicationStatus, openUpgradeModal } = useStore()
    const [tool, setTool] = useState(null)
    const items = job ? employerApplications.filter((a) => a.job_id === job.id) : employerApplications
    const anyLocked = items.some((a) => a.locked)

    const exportCsv = async () => {
        try {
            const blob = await downloadApplicantsCsv(job.id)
            const url = URL.createObjectURL(blob)
            const a = Object.assign(document.createElement('a'), { href: url, download: `pelamar-${job.title}.csv` })
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            if (e.status === 402) openUpgradeModal({ plan: 'beacon', jobId: job.id })
            else toast.error(e.message)
        }
    }

    const setNote = (app) => {
        const note = window.prompt('Catatan untuk lamaran ini:', app.note || '')
        if (note !== null) changeApplicationStatus(app.id, app.status, note).catch(() => {})
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <ProofLegend />
                {job && <button style={topBtn()} onClick={exportCsv}><Download size={14} /> Ekspor CSV</button>}
            </div>
            {anyLocked && (
                <BrutalCard color={KC.yellowSoft} padding={14}>
                    <b>Semua pelamar diperingkat di setiap paket, termasuk Lite.</b> Pro menambah pertanyaan wawancara AI, ekspor CSV, dan pencarian kandidat yang belum melamar.
                    <button style={{ ...topBtn(KC.orange, '#fff'), marginLeft: 10 }} onClick={() => openUpgradeModal({ plan: 'beacon', jobId: job?.id })}>Beli Pro</button>
                </BrutalCard>
            )}
            {employerApplicationsLoading && <p>Memuat pelamar…</p>}
            {!employerApplicationsLoading && items.length === 0 && (
                <BrutalCard color={KC.surface}>
                    Belum ada pelamar. Bagikan link / QR lowongan di Instagram, grup WhatsApp, atau poster di toko —
                    lihat menu <b>Lowongan Saya</b>.
                </BrutalCard>
            )}
            {items.map((app, idx) => app.locked ? (
                <BrutalCard key={app.id} color={KC.surfaceAlt} padding={14}>
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: KC.mute }}><Lock size={14} /> Pelamar #{idx + 1} terkunci · {SOURCE[app.source] || ''} · {app.applied_at}</span>
                </BrutalCard>
            ) : (
                <BrutalCard key={app.id} padding={16}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: 900, fontSize: 16 }}>#{idx + 1} {app.seeker_name}</div>
                            <div style={{ fontSize: 13, color: KC.mute }}>
                                {app.headline || '—'} · {SOURCE[app.source] || ''} · {app.applied_at}
                                {app.email_verified ? ' · email ✓' : ''}
                            </div>
                            {app.seeker_email && <div style={{ fontSize: 13, marginTop: 2 }}>{app.seeker_email}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{Math.round((app.match_score || 0) * 100)}</div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: BAND_META[app.band]?.border || KC.mute }}>{BAND_META[app.band]?.badgeLabel}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
                        {/* Not compact: HR needs to read the proof level, not just the colour. */}
                        {(app.skill_proof || []).map((p) => <ProofChip key={p.name} name={p.name} status={p.status} />)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>Status: {STAGES[app.status] || app.status}</span>
                        {(NEXT[app.status] || []).map((s) => (
                            <button key={s} style={{ ...topBtn(), padding: '6px 11px', fontSize: 12 }} onClick={() => changeApplicationStatus(app.id, s, app.note || '').catch(() => {})}>→ {STAGES[s]}</button>
                        ))}
                        <button style={{ ...topBtn(), padding: '6px 11px', fontSize: 12 }} onClick={() => setNote(app)}><StickyNote size={13} /> Catatan</button>
                        <button style={{ ...topBtn(KC.ink, '#fff'), padding: '6px 11px', fontSize: 12 }} onClick={() => setTool(app)}><MessageSquareText size={13} /> Wawancara & konfirmasi skill</button>
                    </div>
                    {app.note && <p style={{ fontSize: 13, color: KC.inkLight, margin: '8px 0 0' }}>Catatan: {app.note}</p>}
                </BrutalCard>
            ))}
            {tool && <HiringToolsModal app={tool} onClose={() => setTool(null)} />}
        </div>
    )
}
