// Anonymised talent pool (reverse matching). Candidates who have not applied
// are shown without name, employer/school names or contact — those would let a
// profile be re-identified. To reach them, share the job's apply link.
import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import useStore from '../store/useStore'
import { BAND_META, BAND_ORDER, BandLegend, BrutalCard, KC, topBtn } from './_design'
import { ProofChip } from './ProofUI'
import { fetchCandidatesForJob } from '../services/api'

export default function TalentSearch({ job }) {
    const { navigate } = useStore()
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(false)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (!job?.id) return undefined
        let alive = true
        setLoading(true)
        fetchCandidatesForJob(job.id, 15)
            .then((r) => alive && setCandidates(r?.candidates || []))
            .catch(() => alive && setCandidates([]))
            .finally(() => alive && setLoading(false))
        return () => { alive = false }
    }, [job?.id])

    if (!job) return <p style={{ color: KC.mute }}>Pasang lowongan dulu untuk melihat talent pool.</p>

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <BrutalCard color={KC.surface} padding={14}>
                <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                    <b>Pencari kerja yang cocok dengan lowongan ini tetapi belum melamar.</b> Nama dan kontak
                    mereka baru terlihat setelah mereka melamar sendiri (UU PDP) — kontak tidak pernah dijual.
                    Bagikan link lamaran agar mereka bisa melamar.
                </div>
                <button style={{ ...topBtn(), marginTop: 8 }} onClick={() => navigate('employer-jobs')}><Share2 size={14} /> Ambil link lamaran</button>
            </BrutalCard>
            <BandLegend side="employer" />
            {loading && <p>Mencari kandidat…</p>}
            {!loading && candidates.length === 0 && <p style={{ color: KC.mute }}>Belum ada kandidat yang cocok.</p>}
            {BAND_ORDER.map((band) => {
                const group = candidates.filter((c) => c.band === band)
                if (!group.length) return null
                return (
                    <div key={band} style={{ display: 'grid', gap: 8 }}>
                        <div style={{ fontWeight: 900, color: BAND_META[band].border }}>{BAND_META[band].label} · {group.length}</div>
                        {group.map((c) => (
                            <BrutalCard key={c.seeker_id} padding={14}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                    <b>{c.already_applied ? `${c.full_name} (sudah melamar)` : c.full_name}</b>
                                    <span style={{ fontSize: 13, color: KC.mute }}>{c.proven_skill_count || 0} skill terverifikasi</span>
                                </div>
                                <p style={{ fontSize: 13, color: KC.inkLight, margin: '6px 0' }}>{c.explanation}</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {(c.skill_proof || []).map((p) => <ProofChip key={p.name} name={p.name} status={p.status} compact />)}
                                </div>
                            </BrutalCard>
                        ))}
                    </div>
                )
            })}
        </div>
    )
}
