// "Target berikutnya": the best current match, framed as the next step of the
// loop — how many required skills the seeker already has, which are missing,
// and one action to start learning for it. Replaces the old "Kurasi terbaru"
// banner, which only repeated the first card's title and score.
import { ArrowRight, Target } from 'lucide-react'
import useStore from '../store/useStore'
import { KC, topBtn } from './_design'

const pct = (v) => Math.round((v ?? 0) > 1 ? v : (v ?? 0) * 100)

export default function TargetSuggestion({ matches, onDetail }) {
    const { setTargetJob } = useStore()
    if (!matches?.length) return null
    const best = [...matches].sort((a, b) => (b.overall_score ?? b.score ?? 0) - (a.overall_score ?? a.score ?? 0))[0]
    const proof = best.skill_proof || []
    const have = proof.filter((p) => p.status !== 'missing').length
    const missing = proof.filter((p) => p.status === 'missing').map((p) => p.name)
    const id = best.id || best.job_id

    return (
        <div style={{ background: KC.ink, color: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 14, boxShadow: `4px 4px 0 ${KC.orange}`, padding: '16px 18px', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC.orange }}>
                <Target size={14} /> Target berikutnya
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{best.company || best.company_name}</div>
                    <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>{best.title}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{pct(best.overall_score ?? best.score)}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)', fontWeight: 700 }}>skor</div>
                </div>
            </div>
            {proof.length > 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>
                    Kamu sudah punya <b style={{ color: '#fff' }}>{have} dari {proof.length}</b> skill wajib
                    {missing.length > 0 && <> · kurang: <b style={{ color: '#FDBA74' }}>{missing.join(', ')}</b></>}
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ ...topBtn(KC.orange, '#fff', KC.orange), boxShadow: 'none' }} onClick={() => setTargetJob(id)}>
                    {missing.length ? 'Jadikan target & mulai belajar' : 'Jadikan target'} <ArrowRight size={14} />
                </button>
                <button style={{ ...topBtn('transparent', '#fff', 'rgba(255,255,255,.5)'), boxShadow: 'none' }} onClick={() => onDetail(best)}>
                    Detail lowongan
                </button>
            </div>
        </div>
    )
}
