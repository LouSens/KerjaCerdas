// "Peta skill pelamar" — for one job, how the applicant pool covers each
// required skill. Computed client-side from the per-applicant `skill_proof`
// the ranked list already carries, so it costs no extra request. It answers
// the HR question the ranking cannot: is the gap in my applicants, or in my
// requirement?
import { BarChart3 } from 'lucide-react'
import { BrutalCard, KC } from './_design'

const BUCKETS = [
    { key: 'confirmed', label: 'Dikonfirmasi HR', color: '#059669' },
    { key: 'listed', label: 'Ada di profil', color: '#F59E0B' },
    { key: 'missing', label: 'Belum ada', color: '#EF4444' },
]

function bucketOf(status) {
    if (status === 'hr_confirmed') return 'confirmed'
    if (status === 'missing') return 'missing'
    return 'listed' // claimed, quiz
}

export function skillCoverage(items, requiredSkills = []) {
    const rows = new Map(requiredSkills.map((s) => [s, { skill: s, confirmed: 0, listed: 0, missing: 0 }]))
    for (const app of items) {
        for (const p of app.skill_proof || []) {
            if (!rows.has(p.name)) rows.set(p.name, { skill: p.name, confirmed: 0, listed: 0, missing: 0 })
            rows.get(p.name)[bucketOf(p.status)] += 1
        }
    }
    return [...rows.values()]
}

export default function ApplicantSkillMap({ job, items }) {
    if (!items.length) return null
    const rows = skillCoverage(items, job.required_skills || [])
    if (!rows.length) return null
    const n = items.length
    const worst = rows.reduce((a, b) => (b.missing > a.missing ? b : a), rows[0])
    const worstPct = Math.round((worst.missing / n) * 100)

    return (
        <BrutalCard padding={16}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900, marginBottom: 4 }}>
                <BarChart3 size={16} /> Peta skill pelamar
            </div>
            <div style={{ fontSize: 12.5, color: KC.mute, marginBottom: 12 }}>
                {n} pelamar untuk {job.title}
                {worst.missing > 0 && <> · <b style={{ color: '#991B1B' }}>{worstPct}% belum punya {worst.skill}</b></>}
            </div>
            <div style={{ display: 'grid', gap: 9 }}>
                {rows.map((r) => (
                    <div key={r.skill}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}>
                            <span>{r.skill}</span>
                            <span style={{ color: KC.mute, fontWeight: 600 }}>{r.confirmed + r.listed}/{n} punya</span>
                        </div>
                        <div role="img" aria-label={`${r.skill}: ${r.confirmed} dikonfirmasi HR, ${r.listed} ada di profil, ${r.missing} belum ada`}
                            style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: KC.ash, gap: 2 }}>
                            {BUCKETS.map((b) => r[b.key] > 0 && (
                                <div key={b.key} style={{ width: `${(r[b.key] / n) * 100}%`, background: b.color }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 11.5, color: KC.mute }}>
                {BUCKETS.map((b) => (
                    <span key={b.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: b.color }} /> {b.label}
                    </span>
                ))}
            </div>
        </BrutalCard>
    )
}
