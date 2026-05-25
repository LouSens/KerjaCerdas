import { useEffect } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, ScoreDonut, RankSticker, Tag, DesignStyles } from './_design'

export default function SeekerDashboard() {
    const { user, matches, navigate, runAgent, agentLoading, seekerId } = useStore()

    useEffect(() => {
        if (!matches.length && !agentLoading) runAgent({ message: 'show my top matches' })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const topMatches = (matches.length ? matches : DEMO_MATCHES).slice(0, 3)
    const avg = matches.length
        ? Math.round(matches.reduce((s, m) => s + (m.overall_score ?? m.score / 100 ?? 0.8), 0) / matches.length * 100)
        : 87

    const handleCariCepat = () => {
        runAgent({ message: 'refresh my matches' })
        navigate('seeker-match')
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
                        {matches.length} match · {matches.length ? 'fresh dari Gemini' : 'klik refresh buat ngitung ulang'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={topBtn('#fff')}>📄 Upload CV</button>
                    <button className="kc-btn" onClick={handleCariCepat} style={topBtn('#fff')}>🔍 Cari cepat</button>
                    <button className="kc-btn" onClick={() => runAgent({ message: 'refresh my matches' })} disabled={agentLoading} style={{ ...topBtn(KC.orange, '#fff'), opacity: agentLoading ? 0.6 : 1 }}>
                        {agentLoading ? 'Memproses…' : 'Refresh Match →'}
                    </button>
                </div>
            </header>

            <div className="kc-grid-4 kc-stagger">
                <FilledStat label="Match Score Avg" value={`${avg}%`} sub="+4 dari minggu lalu" color={KC.orange} dark onClick={() => navigate('seeker-match')} />
                <FilledStat label="Top-5 Match Aktif" value={String(Math.min(5, matches.length || 5))} sub="2 baru hari ini" color={KC.cyan} onClick={() => navigate('seeker-match')} />
                <FilledStat label="Skill Gap" value="3" sub="Kafka, Redis, k8s" color={KC.yellow} onClick={() => navigate('seeker-skill-gap')} />
                <FilledStat label="Profile Views (HR)" value="14" sub="+7 hari ini" color={KC.lime} onClick={() => navigate('seeker-profile')} />
            </div>

            <div className="kc-grid-main">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: 0 }}>Top 3 Match Hari Ini</h2>
                        <button onClick={() => navigate('seeker-match')} style={linkBtn}>Lihat semua 5 →</button>
                    </div>
                    <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                        {topMatches.map((m, i) => (
                            <DashMatchCard key={m.job_id || i} rank={i + 1} match={m} />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color="#fff" padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Kelengkapan Profil</h3>
                            <span style={{ fontSize: 18, fontWeight: 900, color: KC.orange }}>78%</span>
                        </div>
                        <div style={{ height: 10, background: KC.ash, border: `1.5px solid ${KC.ink}`, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                            <div style={{ width: '78%', height: '100%', background: `repeating-linear-gradient(45deg, ${KC.orange} 0 8px, ${KC.orangeDeep} 8px 16px)` }} />
                        </div>
                        {[['CV uploaded', true], ['Skills (14)', true], ['Verifikasi KTP', true], ['Verifikasi Ijazah', false], ['Portfolio link', false]].map(([l, ok], i) => (
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
                            <p style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5, margin: 0 }}>Drop PDF, Gemini parse otomatis: skill, experience, preferensi gaji.</p>
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

function DashMatchCard({ rank, match }) {
    const navigate = useStore(s => s.navigate)
    const score = Math.round((match.overall_score ?? match.score / 100 ?? 0.85) * 100)
    const accent = score >= 90 ? KC.orange : score >= 85 ? KC.yellow : score >= 80 ? KC.cyan : KC.lime
    const company = match.company || 'Company'
    const matchingSkills = match.matching_skills || []
    const missingSkills = match.missing_skills || []
    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            <RankSticker rank={rank} />
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <ScoreDonut value={score} size={60} color={accent} />
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute, marginBottom: 4 }}>{company} ✓</div>
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
    { job_id: 'd1', score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', experience_range: '4-7 thn', matching_skills: ['Go', 'PostgreSQL', 'gRPC'], missing_skills: ['Kafka'], explanation: 'Pengalaman scale 100K RPS-mu match banget sama tim payment.' },
    { job_id: 'd2', score: 89, title: 'Tech Lead · Payments', company: 'Xendit', location: 'Jakarta · Remote', salary_range: 'Rp 35-50jt', experience_range: '6+ thn', matching_skills: ['Go', 'Node', 'AWS'], missing_skills: ['Kafka', 'Terraform'] },
    { job_id: 'd3', score: 85, title: 'Staff Engineer', company: 'GoTo Financial', location: 'Jakarta · Hybrid', salary_range: 'Rp 40-60jt', experience_range: '7+ thn', matching_skills: ['Microservices', 'K8s'], missing_skills: ['Redis'] },
]
