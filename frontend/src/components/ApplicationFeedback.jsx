// Step 5 of the loop ("Umpan balik"): what an application tells the seeker
// after it is sent — HR's structured rejection reason, which required skills
// are still missing, exact standing, and a way straight back into learning.
import { useState } from 'react'
import { ArrowRight, BarChart3 } from 'lucide-react'
import useStore from '../store/useStore'
import { fetchApplicationRank } from '../services/api'
import { KC, topBtn } from './_design'
import { ProofChip } from './ProofUI'

export default function ApplicationFeedback({ app }) {
    const { setTargetJob } = useStore()
    const [rank, setRank] = useState(null)
    const [loadingRank, setLoadingRank] = useState(false)

    const proof = app.skill_proof || []
    const missing = proof.filter((p) => p.status === 'missing')
    const reason = app.rejection_reason

    const showRank = async () => {
        setLoadingRank(true)
        try {
            setRank(await fetchApplicationRank(app.application_id || app.id))
        } catch {
            setRank({ error: true })
        } finally {
            setLoadingRank(false)
        }
    }

    return (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {reason && (
                <div style={{ padding: '10px 12px', background: KC.roseSoft, border: '1px solid #F87171', borderRadius: 9, fontSize: 12.5, color: '#991B1B' }}>
                    Alasan dari HR: <b>{reason.label}</b>
                </div>
            )}

            {proof.length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: KC.mute, marginBottom: 6, textTransform: 'uppercase' }}>
                        Skill wajib lowongan ini
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {proof.map((p) => <ProofChip key={p.name} name={p.name} status={p.status} compact />)}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {missing.length > 0 && (
                    <button style={{ ...topBtn(KC.orange, '#fff'), padding: '8px 12px', fontSize: 12 }}
                        onClick={() => setTargetJob(app.job_id)}>
                        Pelajari {missing.length} skill yang kurang <ArrowRight size={13} />
                    </button>
                )}
                {!rank && (
                    <button style={{ ...topBtn(), padding: '8px 12px', fontSize: 12 }} onClick={showRank} disabled={loadingRank}>
                        <BarChart3 size={13} /> {loadingRank ? 'Memuat…' : 'Lihat peringkatku'}
                    </button>
                )}
                {rank && !rank.error && (
                    <span style={{ fontSize: 12.5 }}>
                        Posisi saat ini: <b>#{rank.rank}</b> dari {rank.total_applicants} pelamar
                        <span style={{ color: KC.mute }}> · dari skor saat masing-masing melamar; bisa berubah saat ada pelamar baru</span>
                    </span>
                )}
                {rank?.error && <span style={{ fontSize: 12, color: KC.mute }}>Peringkat belum tersedia.</span>}
            </div>
        </div>
    )
}
