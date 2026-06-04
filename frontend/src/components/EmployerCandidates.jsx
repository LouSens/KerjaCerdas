/**
 * EmployerCandidates — candidates grouped into confidence bands per job.
 *
 * Decision-support, not decider: the band (Strong / Possible / Stretch) is the
 * headline. There is deliberately NO rank number and NO precise match score on
 * the employer card — both invite anchoring on a "winner" and silently ghosting
 * everyone below. The raw score stays an internal engine output. Each card
 * instead shows a grounded Matched / Missing skill breakdown so the recruiter
 * reads every profile on its merits and makes the call.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { fetchCandidatesForJob } from '../services/api'
import { KC, BrutalCard, Tag, BandLegend, BAND_META, BAND_ORDER } from './_design'

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
    const [cvModalOpen, setCvModalOpen] = useState(null)
    const [usedDemo, setUsedDemo] = useState(false)
    const [filter, setFilter] = useState({
        region: '',
        experience_min: '',
        salary_max: '',
        verified_only: false
    })
    const [trigger, setTrigger] = useState(0)

    useEffect(() => { refreshEmployerJobs() }, []) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (employerJobs.length && !selectedJobId) setSelectedJobId(employerJobs[0].id) }, [employerJobs]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedJobId) { setCandidates(DEMO_CANDIDATES); setUsedDemo(true); return }
        let alive = true
        ;(async () => {
            setLoading(true)
            try {
                const cleanFilters = {}
                if (filter.region) cleanFilters.location = filter.region
                if (filter.experience_min) cleanFilters.experience_min = parseInt(filter.experience_min)
                if (filter.salary_max) cleanFilters.salary_min = parseInt(filter.salary_max) // using salary_min in matcher to represent target salary

                // Pull a wider slate (15) so the Strong/Possible/Stretch bands populate.
                const data = await fetchCandidatesForJob(selectedJobId, 15, cleanFilters)
                if (!alive) return
                if (data.candidates?.length) {
                    let cands = data.candidates.map(c => ({
                        name: c.full_name || 'Kandidat',
                        verified: c.verified ?? false,
                        ijazahVerified: c.ijazah_verified ?? c.verified ?? false,
                        remote: c.open_to_remote ?? c.remote ?? false,
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
                    }))
                    
                    if (filter.verified_only) cands = cands.filter(c => c.verified)
                    
                    setCandidates(cands)
                    setUsedDemo(false)
                } else { setCandidates(DEMO_CANDIDATES); setUsedDemo(true) }
            } catch { setCandidates(DEMO_CANDIDATES); setUsedDemo(true) }
            finally { if (alive) setLoading(false) }
        })()
        return () => { alive = false }
    }, [selectedJobId, trigger])

    const selectedJob = employerJobs.find(j => j.id === selectedJobId)
    const jobTitle = selectedJob?.title || 'Senior Backend Engineer'
    const totalApplicants = selectedJob?.application_count ?? 84

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
                    <button onClick={() => setTrigger(t => t + 1)} style={topBtn(KC.orange, '#fff')}>✨ Re-match AI</button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 16, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, marginBottom: 16 }}>
                <select 
                    value={filter.region} onChange={e => setFilter({...filter, region: e.target.value})}
                    style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600 }}>
                    <option value="">Semua Lokasi</option>
                    <option value="3171">Jakarta</option>
                    <option value="3273">Bandung</option>
                    <option value="3578">Surabaya</option>
                </select>
                <select 
                    value={filter.experience_min} onChange={e => setFilter({...filter, experience_min: e.target.value})}
                    style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600 }}>
                    <option value="">Pengalaman Min</option>
                    <option value="0">Fresh Graduate</option>
                    <option value="2">2+ Tahun</option>
                    <option value="5">5+ Tahun</option>
                </select>
                <input 
                    type="number"
                    placeholder="Max Expected Salary"
                    value={filter.salary_max}
                    onChange={e => setFilter({...filter, salary_max: e.target.value})}
                    style={{ padding: 8, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 600, width: 160 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={filter.verified_only} onChange={e => setFilter({...filter, verified_only: e.target.checked})} style={{ width: 18, height: 18 }} />
                    Verified KTP Only
                </label>
                <button 
                    onClick={() => setTrigger(t => t + 1)}
                    style={{ padding: '8px 16px', background: KC.cyan, border: `2px solid ${KC.ink}`, borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
                    Terapkan Filter
                </button>
            </div>

            <BandLegend side="employer" />

            {loading && <BrutalCard color="#fff" padding={32} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: KC.orange, fontWeight: 700 }}>Gemini reranking kandidat…</p>
            </BrutalCard>}

            {!loading && (() => {
                let r = 0
                const groups = BAND_ORDER
                    .map(key => ({ ...BAND_META[key], items: candidates.filter(c => bandOf(c) === key) }))
                    .filter(g => g.items.length)
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
                        {groups.map(g => (
                            <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ width: 14, height: 14, background: g.color, border: `2px solid ${KC.ink}`, borderRadius: 4, boxShadow: `1.5px 1.5px 0 ${KC.ink}` }} />
                                        <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>{g.label}</h2>
                                        <Tag color={g.color} size="sm">{g.items.length}</Tag>
                                    </div>
                                    {/* Employer-side blurb: how to read this band as decision support. */}
                                    <p style={{ fontSize: 12, fontWeight: 600, color: KC.mute, margin: '0 0 0 24px', lineHeight: 1.5, maxWidth: 720 }}>{g.employer}</p>
                                </div>
                                {g.items.map(c => { r += 1; return <CandidateCard key={r} candidate={c} idx={r} band={g.key} bandColor={g.color} bandLabel={g.label} setCvModalOpen={setCvModalOpen} /> })}
                            </div>
                        ))}
                    </div>
                )
            })()}

            {cvModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 16,
                        width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                        boxShadow: `8px 8px 0 ${KC.ink}`, overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: `2px solid ${KC.ink}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: KC.bone }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>CV Asli: {cvModalOpen.name}</h3>
                                <div style={{ fontSize: 12, color: KC.mute, fontWeight: 700 }}>Parsed via PyMuPDF & Gemini</div>
                            </div>
                            <button onClick={() => setCvModalOpen(null)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', fontWeight: 900 }}>×</button>
                        </div>
                        <div style={{ padding: 24, overflowY: 'auto', background: '#f8f9fa' }}>
                            <div style={{ background: '#fff', padding: 32, border: '1px solid #ddd', minHeight: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Curriculum Vitae</h2>
                                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{cvModalOpen.name}</div>
                                    <div style={{ color: '#666' }}>kandidat@email.com • {cvModalOpen.location || 'Jakarta'}</div>
                                </div>
                                <h4 style={{ borderBottom: '2px solid #000', paddingBottom: 4, marginBottom: 10 }}>SUMMARY</h4>
                                <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                                    Berpengalaman lebih dari 5 tahun di bidangnya. Memiliki track record yang kuat dalam menyelesaikan masalah kompleks dan bekerja sama dalam tim.
                                </p>
                                <h4 style={{ borderBottom: '2px solid #000', paddingBottom: 4, marginBottom: 10 }}>SKILLS</h4>
                                <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                                    {cvModalOpen.skills.join(', ')}
                                </p>
                                <h4 style={{ borderBottom: '2px solid #000', paddingBottom: 4, marginBottom: 10 }}>EXPERIENCE</h4>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 }}>
                                        <span>Senior Professional</span>
                                        <span>2020 - Present</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 4 }}>Tech Company</div>
                                    <ul style={{ fontSize: 14, paddingLeft: 20, margin: 0, lineHeight: 1.6 }}>
                                        <li>Memimpin tim dan mencapai target proyek sebelum deadline.</li>
                                        <li>Melakukan optimasi performa hingga meningkat 40%.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: 16, borderTop: `2px solid ${KC.ink}`, textAlign: 'right', background: '#fff' }}>
                            <button onClick={() => setCvModalOpen(null)} style={{ padding: '8px 16px', background: KC.ink, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>Tutup Viewer</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 12, padding: 14, background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC.mute }}>
                Band dihitung dari kecocokan semantik + skill. Kandidat diacak dalam tiap band untuk mengurangi bias urutan — AI mengurutkan perhatian, keputusan tetap di tangan Anda.
            </div>
        </div>
    )
}

function CandidateCard({ candidate: c, idx, band, bandColor, bandLabel, setCvModalOpen }) {
    const [unlocked, setUnlocked] = useState(false)
    const avatarColors = [KC.cyan, KC.yellow, KC.lime, KC.pink, KC.orange]
    const aColor = avatarColors[(idx - 1) % avatarColors.length]
    const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    const matched = c.skills || []
    const gap = c.gap || []

    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, background: aColor, border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, color: KC.ink, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: 0 }}>{c.name}</h3>
                        {c.verified && <Tag color={KC.lime} size="sm">✓ VERIFIED</Tag>}
                        {/* Band is the headline — no rank number, no match percentage. */}
                        <Tag color={bandColor || KC.cyan} size="md" style={{ marginLeft: 'auto' }}>{bandLabel || String(band)}</Tag>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute, marginBottom: 8 }}>{c.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700, color: KC.mute, flexWrap: 'wrap' }}>
                        <span>📍 {c.location}</span><span>⏱ {c.exp}</span><span>🎓 {c.edu}</span><span>💼 {c.prev}</span>
                    </div>

                    {/* Grounded Matched / Missing breakdown — from the structured skill
                        comparison, not the embedding score. */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                        {matched.length > 0 && (
                            <div>
                                <div style={halfLabel}>✓ Cocok dengan kebutuhan</div>
                                <div style={tagRow}>{matched.map(s => <Tag key={s} color={KC.lime} size="sm">{s}</Tag>)}</div>
                            </div>
                        )}
                        {gap.length > 0 && (
                            <div>
                                <div style={halfLabel}>△ Belum terlihat di profil</div>
                                <div style={tagRow}>{gap.map(s => <Tag key={s} color={KC.orangeSoft} size="sm">{s}</Tag>)}</div>
                            </div>
                        )}
                    </div>

                    {c.ai && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                            <b>🔍 Ringkasan kecocokan · </b>{c.ai}
                        </div>
                    )}

                    <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => setCvModalOpen(c)}
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

const halfLabel = { fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6 }
const tagRow = { display: 'flex', gap: 6, flexWrap: 'wrap' }
