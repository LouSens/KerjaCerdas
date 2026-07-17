import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, Tag, DesignStyles, BAND_META } from './_design'

// Server band wins; fall back to the 0.65 / 0.45 cutoffs on the 0–100 score.
const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch'
}

export default function SeekerDashboard() {
    const { user, matches, navigate, runAgent, agentLoading, seekerId, profile, recommendedCourses, missingSkills, computeProfileCompleteness } = useStore()

    const [selectedJob, setSelectedJob] = useState(null)
    const hasProfile = Boolean(seekerId || profile?.skills?.length > 0)

    useEffect(() => {
        if (hasProfile && !matches.length && !agentLoading) runAgent({ message: 'show my top matches' })
    }, [hasProfile]) // eslint-disable-line react-hooks/exhaustive-deps

    const topMatches = (matches.length ? matches : DEMO_MATCHES).slice(0, 3)
    const avg = matches.length
        ? Math.round(matches.reduce((s, m) => {
            const raw = m.overall_score ?? m.score ?? 0.8;
            return s + (raw > 1 ? raw : raw * 100);
        }, 0) / matches.length)
        : 87

    const completionPct = computeProfileCompleteness()

    const handleCariCepat = () => {
        navigate('seeker-search')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        Halo, {user.name || 'Pejuang'} 👋
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {matches.length} match · {matches.length ? 'baru diperbarui' : 'klik refresh buat ngitung ulang'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={topBtn('#fff')}>📄 Upload CV</button>
                    <button className="kc-btn" onClick={handleCariCepat} style={topBtn('#fff')}>🔍 Cari cepat</button>
                    <button className="kc-btn" onClick={() => runAgent({ explicitIntent: 'match_jobs' })} disabled={agentLoading} style={{ ...topBtn(KC.orange, '#fff'), opacity: agentLoading ? 0.6 : 1 }}>
                        {agentLoading ? 'Memproses…' : 'Refresh Match →'}
                    </button>
                </div>
            </header>

            {!hasProfile ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${KC.ink}` }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Belum ada data CV</h2>
                    <p style={{ color: KC.mute, marginBottom: 24, fontSize: 14 }}>Upload CV kamu dalam format PDF agar sistem AI bisa mengekstrak skill dan mencarikan pekerjaan yang cocok.</p>
                    <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{ ...topBtn(KC.orange, '#fff'), padding: '12px 24px', fontSize: 16 }}>
                        Mulai Upload CV →
                    </button>
                </div>
            ) : (
            <div className="kc-grid-4 kc-stagger">
                <FilledStat label="Match Score Avg" value={`${avg}%`} sub="+4 dari minggu lalu" color={KC.orange} dark onClick={() => navigate('seeker-match')} />
                <FilledStat label="Top-5 Match Aktif" value={String(Math.min(5, matches.length || 5))} sub="2 baru hari ini" color={KC.cyan} onClick={() => navigate('seeker-match')} />
                <FilledStat label="Skill Gap" value={String(missingSkills?.length || '—')} sub={missingSkills?.slice(0,2).join(', ') || 'Jalankan match dulu'} color={KC.yellow} onClick={() => navigate('seeker-skill-gap')} />
                <FilledStat label="Kursus Rekomendasi" value={String(recommendedCourses?.length || '—')} sub="dari analisis skill gap" color={KC.lime} onClick={() => navigate('seeker-skill-gap')} />
            </div>
            )}

            <div className="kc-grid-main">
                {!hasProfile ? (
                    <div>
                        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${KC.ink}` }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Belum ada data CV</h2>
                            <p style={{ color: KC.mute, marginBottom: 24, fontSize: 14 }}>Upload CV kamu dalam format PDF agar AI kami bisa mengenali skill dan mencarikan pekerjaan yang cocok untukmu.</p>
                            <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{ ...topBtn(KC.orange, '#fff'), padding: '12px 24px', fontSize: 16 }}>
                                Mulai Upload CV →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: 0 }}>Top 3 Match Hari Ini</h2>
                            <button onClick={() => navigate('seeker-match')} style={linkBtn}>Lihat semua 5 →</button>
                        </div>
                        <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                            {topMatches.map((m, i) => (
                                <DashMatchCard key={m.job_id || i} match={m} />
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color="#fff" padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Kelengkapan Profil</h3>
                            <span style={{ fontSize: 18, fontWeight: 900, color: KC.orange }}>{completionPct}%</span>
                        </div>
                        <div style={{ height: 10, background: KC.ash, border: `1.5px solid ${KC.ink}`, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                            <div style={{ width: `${completionPct}%`, height: '100%', background: `repeating-linear-gradient(45deg, ${KC.orange} 0 8px, ${KC.orangeDeep} 8px 16px)` }} />
                        </div>
                        {[['CV uploaded', !!seekerId], ['Skills ('+( profile.skills?.length||0)+')', (profile.skills?.length||0)>0], ['Verifikasi KTP', false], ['Verifikasi Ijazah', false], ['Portfolio link', false]].map(([l, ok], i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: ok ? KC.ink : KC.mute, marginTop: 6 }}>
                                <span style={{ width: 18, height: 18, borderRadius: 5, background: ok ? KC.lime : '#fff', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', fontSize: 11 }}>{ok ? '✓' : ''}</span>
                                {l}
                            </div>
                        ))}
                    </BrutalCard>

                    {seekerId ? (
                        <BrutalCard color={KC.orange} padding={18} style={{ color: '#fff' }}>
                            <div style={{ fontSize: 22 }}>🛡️</div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 6px' }}>Verifikasi ijazah biar dapet badge ✓</h3>
                            <p style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5, margin: 0 }}>Profil terverifikasi 3x lebih sering di-shortlist HR. Data terenkripsi.</p>
                            <button className="kc-btn" onClick={() => navigate('seeker-verification')} style={{ marginTop: 12, width: '100%', padding: '10px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                                Mulai Verifikasi
                            </button>
                        </BrutalCard>
                    ) : (
                        <BrutalCard color={KC.orange} padding={18} style={{ color: '#fff' }}>
                            <div style={{ fontSize: 22 }}>📄</div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 6px' }}>Upload CV biar AI bisa matching</h3>
                            <p style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5, margin: 0 }}>Drop PDF, AI kenali otomatis: skill, experience, preferensi gaji.</p>
                            <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{ marginTop: 12, width: '100%', padding: '10px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                                Upload CV →
                            </button>
                        </BrutalCard>
                    )}

                    <BrutalCard color={KC.cyan} padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 18 }}>🤖</div>
                            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>career advisor</div>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>"Buat resume yang lebih kuat di section Kafka & event-driven systems."</p>
                        <button onClick={() => useStore.getState().toggleFloatingAdvisor()} style={{ ...linkBtn, marginTop: 8 }}>Lanjut chat →</button>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}

function DashMatchCard({ match }) {
    const navigate = useStore(s => s.navigate)
    const band = bandOf(match)
    const meta = BAND_META[band]
    const companyRaw = match.company || 'Company'
    const company = (companyRaw.length === 36 && companyRaw.includes('-')) ? 'Perusahaan Mitra' : companyRaw
    const matchingSkills = match.matching_skills || []
    const missingSkills = match.missing_skills || []
    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            {/* Band is the headline — no score donut, no rank sticker. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: KC.mute }}>{company} ✓</span>
                        <Tag color={meta.color} size="sm" style={{ marginLeft: 'auto' }}>{meta.label}</Tag>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.15, margin: 0 }}>
                        {match.title || match.job_title || 'Posisi'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 12, fontWeight: 700, color: KC.mute, flexWrap: 'wrap' }}>
                        <span>📍 {match.location || 'Jakarta'}</span>
                        <span>💰 {match.salary_range || 'Competitive'}</span>
                        <span>⏱ {match.experience_range || '3-5 thn'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {matchingSkills.slice(0, 3).map(t => <Tag key={t} color={KC.lime} size="sm">{t}</Tag>)}
                        {missingSkills.slice(0, 2).map(t => <Tag key={t} color={KC.orangeSoft} size="sm">+ {t}</Tag>)}
                    </div>
                    {match.explanation && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            <b>AI · </b>{match.explanation}
                        </div>
                    )}
                </div>
                <button className="kc-btn" onClick={() => navigate('seeker-match')} style={{ padding: '8px 14px', background: KC.orange, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    Lihat →
                </button>
            </div>
        </BrutalCard>
    )
}

const topBtn = (bg, fg = KC.ink) => ({
    padding: '10px 16px', background: bg, color: fg, border: `2px solid ${KC.ink}`,
    borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
})
const linkBtn = { background: 'transparent', border: 'none', color: KC.ink, fontWeight: 800, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: 0 }

const DEMO_MATCHES = [
    { job_id: 'd1', band: 'strong', score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', experience_range: '4-7 thn', matching_skills: ['Go', 'PostgreSQL', 'gRPC'], missing_skills: ['Kafka'], explanation: 'Skill kamu nyambung kuat sama kebutuhan tim payment. Posisi yang pas buat kamu lamar.' },
    { job_id: 'd2', band: 'strong', score: 89, title: 'Tech Lead · Payments', company: 'Xendit', location: 'Jakarta · Remote', salary_range: 'Rp 35-50jt', experience_range: '6+ thn', matching_skills: ['Go', 'Node', 'AWS'], missing_skills: ['Kafka', 'Terraform'] },
    { job_id: 'd3', band: 'possible', score: 85, title: 'Staff Engineer', company: 'GoTo Financial', location: 'Jakarta · Hybrid', salary_range: 'Rp 40-60jt', experience_range: '7+ thn', matching_skills: ['Microservices', 'K8s'], missing_skills: ['Redis'] },
]
