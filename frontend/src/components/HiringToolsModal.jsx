// Per-applicant hiring tools: AI interview questions (Pro/Max) and
// the post-interview "skill terbukti" confirmation (HR proof = 100% weight).
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import useStore from '../store/useStore'
import { KC, topBtn } from './_design'
import { ProofChip } from './ProofUI'
import { confirmSkills, fetchInterviewKit } from '../services/api'

const AFTER_INTERVIEW = new Set(['interview', 'offered', 'hired', 'rejected'])

export default function HiringToolsModal({ app, onClose }) {
    const { openUpgradeModal, loadEmployerApplications } = useStore()
    const [kit, setKit] = useState(null)
    const [kitError, setKitError] = useState(null)
    const [marks, setMarks] = useState({})
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        fetchInterviewKit(app.id).then(setKit).catch((e) => setKitError(e))
    }, [app.id])

    const saveConfirmations = async () => {
        const skills = Object.entries(marks).map(([name, confirmed]) => ({ name, confirmed }))
        if (!skills.length) return
        setBusy(true)
        try {
            await confirmSkills(app.id, skills)
            toast.success('Konfirmasi skill tersimpan')
            loadEmployerApplications()
            onClose()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,10,15,0.55)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div role="dialog" aria-label="Alat wawancara" style={{ background: KC.paper, border: `1.5px solid ${KC.ink}`, borderRadius: 14, boxShadow: `5px 5px 0 ${KC.ink}`, width: '100%', maxWidth: 620, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18 }}>
                    {app.seeker_name}
                    <button aria-label="Tutup" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <div style={{ fontWeight: 800, marginTop: 14 }}>Pertanyaan wawancara</div>
                <p style={{ fontSize: 12, color: KC.mute, margin: '2px 0 8px' }}>Fokus pada skill yang baru diklaim. Kuis menyaring, wawancara memastikan.</p>
                {kitError?.status === 402 && (
                    <div style={{ background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 9, padding: 12, fontSize: 13 }}>
                        Pertanyaan wawancara AI tersedia di paket Pro atau Max.
                        <button style={{ ...topBtn(KC.orange, '#fff'), marginLeft: 8 }} onClick={() => { onClose(); openUpgradeModal({ plan: 'beacon', jobId: app.job_id }) }}>Beli Pro</button>
                    </div>
                )}
                {kitError && kitError.status !== 402 && <p style={{ color: KC.rose }}>{kitError.message}</p>}
                {!kit && !kitError && <p>Menyiapkan pertanyaan…</p>}
                {kit && (
                    <ol style={{ paddingLeft: 20, display: 'grid', gap: 6, fontSize: 14 }}>
                        {kit.questions.map((q, i) => <li key={i}>{q.question}{q.skill && <span style={{ color: KC.mute, fontSize: 12 }}> · {q.skill}</span>}</li>)}
                    </ol>
                )}

                <div style={{ fontWeight: 800, marginTop: 16 }}>Konfirmasi skill setelah wawancara</div>
                {!AFTER_INTERVIEW.has(app.status) ? (
                    <p style={{ fontSize: 13, color: KC.mute }}>Pindahkan status ke <b>Wawancara</b> dulu. Konfirmasi hanya setelah kandidat diwawancarai.</p>
                ) : (
                    <>
                        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                            {(app.skill_proof || []).map((p) => (
                                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <ProofChip name={p.name} status={p.status} compact />
                                    <span style={{ display: 'flex', gap: 6 }}>
                                        {[[true, 'Terbukti'], [false, 'Tidak terbukti']].map(([val, label]) => (
                                            <button key={label} onClick={() => setMarks((m) => ({ ...m, [p.name]: val }))}
                                                style={{ ...topBtn(marks[p.name] === val ? (val ? KC.lime : KC.rose) : '#fff', marks[p.name] === val ? '#fff' : KC.ink), padding: '5px 10px', fontSize: 12 }}>{label}</button>
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button style={{ ...topBtn(KC.ink, '#fff'), marginTop: 12 }} disabled={busy || !Object.keys(marks).length} onClick={saveConfirmations}>Simpan konfirmasi</button>
                    </>
                )}
            </div>
        </div>
    )
}
