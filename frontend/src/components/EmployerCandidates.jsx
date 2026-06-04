/**
 * EmployerCandidates — Top-5 AI-ranked candidates per job.
 * Matches design: rank stickers, ScoreDonut, AI reasoning panel, encrypted-trust filters.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { fetchCandidatesForJob } from '../services/api'
import { KC, BrutalCard, RankSticker, ScoreDonut, Tag, BrutalChip } from './_design'

const BANDS = [
    { key: 'strong', label: 'Strong fit', color: KC.lime },
    { key: 'possible', label: 'Possible fit', color: KC.yellow },
    { key: 'stretch', label: 'Stretch', color: KC.cyan },
]
// Use the server-assigned band; fall back to thresholds on the 0–100 score
// (mirrors the backend's 0.65 / 0.45 cutoffs) so this view works standalone.
const bandOf = (c) => c.band || (c.score >= 65 ? 'strong' : c.score >= 45 ? 'possible' : 'stretch')

const DEMO_CANDIDATES = [
    { name: 'Rina Pertiwi', band: 'strong', verified: true, score: 94, title: 'Senior Backend Engineer · 6 thn exp', location: 'Jakarta', exp: '6 thn', edu: 'S1 ITB', prev: 'Bukalapak', skills: ['Go', 'PostgreSQL', 'gRPC', 'Kafka', 'K8s'], gap: [], ai: 'Stack 100% overlap. Pernah handle 100K RPS di Bukalapak payment.' },
    { name: 'Andika Pratama', band: 'strong', verified: true, score: 91, title: 'Backend Lead · 7 thn exp', location: 'Jakarta', exp: '7 thn', edu: 'S1 UI', prev: 'Bibit', skills: ['Go', 'PostgreSQL', 'Redis', 'gRPC'], gap: ['Kafka'], ai: 'Leadership kuat, gap Kafka ditutup 2 minggu.' },
    { name: 'Sari Ningrum', band: 'possible', verified: true, score: 87, title: 'Staff Backend · 8 thn exp', location: 'Bandung', exp: '8 thn', edu: 'S1 ITB', prev: 'GoTo', skills: ['Go', 'Microservices', 'K8s'], gap: ['gRPC'], ai: 'Microservices depth tinggi.' },
    { name: 'Bayu Wicaksono', band: 'possible', verified: true, score: 83, title: 'Senior SWE · 5 thn exp', location: 'Jakarta', exp: '5 thn', edu: 'S1 UGM', prev: 'Tokopedia', skills: ['Go', 'PostgreSQL', 'gRPC'], gap: ['Kafka', 'K8s'], ai: 'Stack fit, willing remote.' },
    { name: 'Mira Anggraini', band: 'stretch', verified: false, score: 80, title: 'Backend Engineer · 4 thn exp', location: 'Jakarta', exp: '4 thn', edu: 'S1 ITS', prev: 'Xendit', skills: ['Node', 'TypeScript', 'PostgreSQL'], gap: ['Go', 'gRPC'], ai: 'Belum verifikasi KTP, kandidat under-rated.' },
]

export default function EmployerCandidates() {
    const { employerJobs, refreshEmployerJobs } = useStore()
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedJobId, setSelectedJobId] = useState(null)
    const [usedDemo, setUsedDemo] = useState(false)
    const [filter, setFilter] = useState('all')

    useEffect(() => { refreshEmployerJobs() }, []) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (employerJobs.length && !selectedJobId) setSelectedJobId(employerJobs[0].id) }, [employerJobs]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedJobId) { setCandidates(DEMO_CANDIDATES); setUsedDemo(true); return }
        let alive = true
        ;(async () => {
            setLoading(true)
            try {
                const data = await fetchCandidatesForJob(selectedJobId, 15)
                if (!alive) return
                if (data.candidates?.length) {
                    setCandidates(data.candidates.map(c => ({
                        name: c.full_name || 'Kandidat',
                        verified: c.verified ?? false,
                        band: c.band,
                        score: Math.round((c.score ?? c.overall_score ?? 0) > 1 ? (c.score ?? c.overall_score ?? 0) : (c.score ?? c.overall_score ?? 0) * 100),
                        title: c.headline || '—',
                        location: c.region_code || 'Jakarta',
                        exp: c.experience_years ? `${c.experience_years} thn` : '—',
                        edu: c.education_level || 'S1',
                        prev: c.previous_company || '—',
                        skills: (c.matching_skills || c.skills || []).map(s => typeof s === 'string' ? s : s.name),
                        gap: c.missing_skills || [],
                        ai: c.explanation || c.reasoning || 'AI analisis tersedia.',
                    })))
                    setUsedDemo(false)
                } else { setCandidates(DEMO_CANDIDATES); setUsedDemo(true) }
            } catch { setCandidates(DEMO_CANDIDATES); setUsedDemo(true) }
            finally { if (alive) setLoading(false) }
        })()
        return () => { alive = false }
    }, [selectedJobId])

    const selectedJob = employerJobs.find(j => j.id === selectedJobId)
    const jobTitle = selectedJob?.title || 'Senior Backend Engineer'
    const totalApplicants = selectedJob?.application_count ?? 84

    const filtered = filter === 'verified' ? candidates.filter(c => c.verified) : candidates

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Kandidat</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Untuk: {jobTitle} · {totalApplicants} lamaran · diurutkan AI ke dalam band · keputusan tetap di tangan Anda
                        {usedDemo && <Tag color={KC.yellow} size="sm" style={{ marginLeft: 8 }}>DEMO</Tag>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={selectedJobId || ''} onChange={(e) => setSelectedJobId(e.target.value)} style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                        {employerJobs.length === 0 && <option value="">{jobTitle} ({totalApplicants})</option>}
                        {employerJobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.application_count ?? 0})</option>)}
                    </select>
                    <button onClick={() => setSelectedJobId(selectedJobId)} style={topBtn(KC.orange, '#fff')}>✨ Re-match AI</button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <BrutalChip active={filter === 'all'} onClick={() => setFilter('all')}>All ({candidates.length})</BrutalChip>
                <BrutalChip active={filter === 'verified'} onClick={() => setFilter('verified')}>✓ Verified KTP</BrutalChip>
                <BrutalChip>✓ Ijazah verified</BrutalChip>
                <BrutalChip>{'> 5 thn exp'}</BrutalChip>
                <BrutalChip>Jakarta</BrutalChip>
                <BrutalChip>Remote ok</BrutalChip>
            </div>

            {loading && <BrutalCard color="#fff" padding={32} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: KC.orange, fontWeight: 700 }}>Gemini reranking kandidat…</p>
            </BrutalCard>}

            {!loading && (() => {
                let r = 0
                const groups = BANDS
                    .map(b => ({ ...b, items: filtered.filter(c => bandOf(c) === b.key) }))
                    .filter(g => g.items.length)
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
                        {groups.map(g => (
                            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ width: 14, height: 14, background: g.color, border: `2px solid ${KC.ink}`, borderRadius: 4, boxShadow: `1.5px 1.5px 0 ${KC.ink}` }} />
                                    <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>{g.label}</h2>
                                    <Tag color={g.color} size="sm">{g.items.length}</Tag>
                                </div>
                                {g.items.map(c => { r += 1; return <CandidateCard key={r} candidate={c} rank={r} band={g.key} bandColor={g.color} /> })}
                            </div>
                        ))}
                    </div>
                )
            })()}

            <div style={{ marginTop: 12, padding: 14, background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC.mute }}>
                Band dihitung dari kecocokan semantik + skill. Kandidat diacak dalam tiap band untuk mengurangi bias urutan — AI mengurutkan perhatian, keputusan tetap di tangan Anda.
            </div>
        </div>
    )
}

function CandidateCard({ candidate: c, rank, band, bandColor }) {
    const [unlocked, setUnlocked] = useState(false)
    const accent = c.score >= 90 ? KC.orange : c.score >= 85 ? KC.yellow : c.score >= 80 ? KC.cyan : KC.lime
    const avatarColors = [KC.cyan, KC.yellow, KC.lime, KC.pink, KC.orange]
    const aColor = avatarColors[(rank - 1) % avatarColors.length]
    const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    
    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            <RankSticker rank={rank} />
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, background: aColor, border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, color: KC.ink, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: 0 }}>{c.name}</h3>
                        {c.verified && <Tag color={KC.lime} size="sm">✓ VERIFIED</Tag>}
                        {band && <Tag color={bandColor || KC.cyan} size="sm">{String(band).toUpperCase()}</Tag>}
                        <div style={{ marginLeft: 'auto' }}><ScoreDonut value={c.score} size={42} color={accent} label="" /></div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute, marginBottom: 8 }}>{c.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700, color: KC.mute, flexWrap: 'wrap' }}>
                        <span>📍 {c.location}</span><span>⏱ {c.exp}</span><span>🎓 {c.edu}</span><span>💼 {c.prev}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                        {c.skills.map(s => <Tag key={s} color={KC.lime} size="sm">{s}</Tag>)}
                        {c.gap.map(s => <Tag key={s} color={KC.orangeSoft} size="sm">{s} (gap)</Tag>)}
                    </div>
                    
                    {c.ai && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                            <b>✨ AI Copilot · </b>{c.ai}
                        </div>
                    )}
                    
                    <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => alert("Membuka PDF Viewer CV Asli... (Simulasi UI AI Copilot Split-Screen)")}
                            style={{ 
                                padding: '8px 16px', background: '#fff', color: KC.ink, 
                                border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 13, 
                                cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` 
                            }}>
                            📄 Lihat CV Asli
                        </button>

                        {!unlocked ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button 
                                    onClick={() => setUnlocked(true)}
                                    style={{ 
                                        padding: '8px 16px', background: KC.pink, color: KC.ink, 
                                        border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 13, 
                                        cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` 
                                    }}>
                                    🔒 Buka Kontak (Rp 50.000)
                                </button>
                                <span style={{ fontSize: 10, fontWeight: 700, color: KC.mute }}>Termasuk: ✓ SIVIL & KTP Verified</span>
                            </div>
                        ) : (
                            <a 
                                href={`https://wa.me/6281234567890?text=Halo%20${encodeURIComponent(c.name)},%20kami%20dari%20perusahaan%20melihat%20profil%20Anda%20di%20KerjaCerdas...`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    display: 'inline-block', padding: '8px 16px', background: '#25D366', color: '#fff', 
                                    border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 13, 
                                    textDecoration: 'none', boxShadow: `2px 2px 0 ${KC.ink}` 
                                }}>
                                📞 Unlock Kontak
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </BrutalCard>
    )
}

const topBtn = (bg, fg = KC.ink) => ({ padding: '8px 14px', background: bg, color: fg, border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` })
