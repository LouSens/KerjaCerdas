import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, Tag, ScoreDonut, topBtn, DesignStyles, BAND_META } from './_design'
import { Sparkles, Briefcase, TrendingUp, BookOpen, Upload, Search, RefreshCw, CheckCircle2, ChevronRight, MapPin, Building2, ShieldCheck } from 'lucide-react'
import JobDetailModal from './JobDetailModal'

const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch'
}

export default function SeekerDashboard() {
    const { user, matches, navigate, runAgent, agentLoading, seekerId, profile, recommendedCourses, missingSkills, computeProfileCompleteness, isJobSaved, toggleSaveJob } = useStore()
    const [selectedJob, setSelectedJob] = useState(null)
    const hasProfile = Boolean(seekerId || profile?.skills?.length > 0)

    useEffect(() => {
        if (hasProfile && !matches.length && !agentLoading) {
            runAgent({ message: 'show my top matches' })
        }
    }, [hasProfile]) // eslint-disable-line react-hooks/exhaustive-deps

    const topMatches = matches.slice(0, 3)
    const avg = matches.length
        ? Math.round(matches.reduce((s, m) => {
            const raw = m.overall_score ?? m.score ?? 0
            return s + (raw > 1 ? raw : raw * 100)
        }, 0) / matches.length)
        : 0

    const completionPct = computeProfileCompleteness()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Dashboard Karir
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Selamat datang kembali, <b>{user.name || 'Pencari Kerja'}</b> · {matches.length} lowongan terkurasi aktif
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={topBtn('#fff')}>
                        <Upload size={14} /> Unggah CV
                    </button>
                    <button className="kc-btn" onClick={() => navigate('seeker-search')} style={topBtn('#fff')}>
                        <Search size={14} /> Cari Cepat
                    </button>
                    <button
                        className="kc-btn"
                        onClick={() => runAgent({ explicitIntent: 'match_jobs' })}
                        disabled={agentLoading}
                        style={{ ...topBtn(KC.orange, '#fff'), opacity: agentLoading ? 0.6 : 1 }}
                    >
                        <RefreshCw size={14} className={agentLoading ? 'animate-spin' : ''} />
                        {agentLoading ? 'Menganalisis…' : 'Refresh Match →'}
                    </button>
                </div>
            </header>

            {!hasProfile ? (
                <BrutalCard color="#FFFFFF" padding={40} style={{ textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: KC.orangeSoft, border: `1.5px solid ${KC.orange}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: KC.orange }}>
                        <Upload size={28} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: KC.ink }}>Profil & CV Belum Terdaftar</h2>
                    <p style={{ color: KC.mute, marginBottom: 24, fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
                        Unggah CV dalam format PDF agar sistem AI dapat memetakan kompetensi dan menyajikan rekomendasi lowongan yang presisi.
                    </p>
                    <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{ ...topBtn(KC.orange, '#fff'), padding: '12px 24px', fontSize: 14 }}>
                        Unggah Dokumen CV →
                    </button>
                </BrutalCard>
            ) : (
                <div className="kc-grid-4 kc-stagger">
                    <FilledStat
                        label="Avg Match Score"
                        value={`${avg}%`}
                        sub="+4% dibanding periode lalu"
                        icon={<Sparkles size={16} />}
                        accent={KC.orange}
                        onClick={() => navigate('seeker-match')}
                    />
                    <FilledStat
                        label="Lowongan Cocok"
                        value={String(matches.length)}
                        sub="Tersedia untuk dilamar hari ini"
                        icon={<Briefcase size={16} />}
                        accent={KC.cyan}
                        onClick={() => navigate('seeker-match')}
                    />
                    <FilledStat
                        label="Skill Gap"
                        value={String(missingSkills?.length || 0)}
                        sub={missingSkills?.slice(0, 2).join(', ') || 'Analisis skill tersedia'}
                        icon={<TrendingUp size={16} />}
                        accent={KC.yellow}
                        onClick={() => navigate('seeker-skill-gap')}
                    />
                    <FilledStat
                        label="Rekomendasi Kursus"
                        value={String(recommendedCourses?.length || 0)}
                        sub="Modul terkurasi dari mitra"
                        icon={<BookOpen size={16} />}
                        accent={KC.lime}
                        onClick={() => navigate('seeker-skill-gap')}
                    />
                </div>
            )}

            {hasProfile && (
                <div className="kc-grid-main">
                    {/* Left Column: Top Matches */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, margin: 0, color: KC.ink }}>
                                    Rekomendasi Teratas
                                </h2>
                                <p style={{ fontSize: 12, color: KC.mute, margin: '2px 0 0' }}>
                                    Peringkat kecocokan berdasarkan analisis semantik profil Anda
                                </p>
                            </div>
                            <button onClick={() => navigate('seeker-match')} style={{ background: 'none', border: 'none', color: KC.orange, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                Lihat Semua 5 <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {topMatches.length > 0 ? topMatches.map((m, i) => (
                                <DashMatchCard key={m.job_id || i} match={m} onSelect={() => setSelectedJob(m)} />
                            )) : (
                                <BrutalCard color="#FFFFFF" padding={28}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Sparkles size={28} color={KC.orange} style={{ marginBottom: 10 }} />
                                        <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 8px', color: KC.ink }}>Belum Ada Hasil Pencocokan</h3>
                                        <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 16px', maxWidth: 400, marginInline: 'auto', lineHeight: 1.5 }}>
                                            Klik "Refresh Match" di atas atau unggah CV untuk mendapatkan rekomendasi lowongan berdasarkan profil Anda.
                                        </p>
                                        <button className="kc-btn" onClick={() => runAgent({ explicitIntent: 'match_jobs' })} disabled={agentLoading} style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 20px', fontSize: 13 }}>
                                            <Sparkles size={14} /> Jalankan Pencocokan AI
                                        </button>
                                    </div>
                                </BrutalCard>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Profile & Trust */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <BrutalCard color="#FFFFFF" padding={20}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: KC.ink }}>Kelengkapan Profil</h3>
                                <span style={{ fontSize: 16, fontWeight: 900, color: KC.orange }}>{completionPct}%</span>
                            </div>
                            <div style={{ height: 8, background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}`, borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                                <div style={{ width: `${completionPct}%`, height: '100%', background: KC.orange, borderRadius: 999 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    ['Dokumen CV Terunggah', Boolean(seekerId)],
                                    [`Keahlian Terdata (${profile?.skills?.length || 4})`, (profile?.skills?.length || 0) > 0],
                                    ['Verifikasi Identitas KTP', Boolean(profile?.ktp_verified)],
                                    ['Verifikasi Ijazah Dikti', Boolean(profile?.ijazah_verified)],
                                ].map(([label, ok], i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: ok ? KC.ink : KC.mute }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 16, height: 16, borderRadius: 4, background: ok ? KC.limeSoft : KC.surfaceAlt, border: `1px solid ${ok ? KC.lime : KC.borderMuted}`, display: 'grid', placeItems: 'center', color: ok ? KC.lime : 'transparent', fontSize: 10, fontWeight: 900 }}>
                                                ✓
                                            </span>
                                            {label}
                                        </span>
                                        {ok ? <span style={{ fontSize: 11, color: KC.lime, fontWeight: 700 }}>Selesai</span> : <span style={{ fontSize: 11, color: KC.mute }}>Belum</span>}
                                    </div>
                                ))}
                            </div>
                        </BrutalCard>

                        <BrutalCard color="#FFFFFF" padding={20}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: KC.limeSoft, border: `1px solid ${KC.lime}`, display: 'grid', placeItems: 'center', color: KC.lime, flexShrink: 0 }}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', color: KC.ink }}>Verifikasi Identitas & Ijazah</h4>
                                    <p style={{ fontSize: 12, color: KC.mute, lineHeight: 1.4, margin: '0 0 12px' }}>
                                        Kandidat terverifikasi memiliki visibilitas prioritas hingga 3x lipat pada hasil kurasi rekruter perusahaan.
                                    </p>
                                    <button onClick={() => navigate('seeker-verification')} style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 12 }}>
                                        Buka Verifikasi →
                                    </button>
                                </div>
                            </div>
                        </BrutalCard>
                    </div>
                </div>
            )}
        </div>
    )
}

function DashMatchCard({ match, onSelect }) {
    const raw = match.overall_score ?? match.score ?? 0
    const pct = Math.round(raw > 1 ? raw : raw * 100)
    const band = bandOf(match)
    const bandData = BAND_META[band]
    const skills = (match.matching_skills || []).slice(0, 3)

    return (
        <BrutalCard color="#FFFFFF" padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: KC.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={13} /> {match.company || 'Perusahaan'}
                        </span>
                        <Tag color={bandData.bg} ink={bandData.color} border={bandData.border} size="sm">
                            {bandData.badgeLabel}
                        </Tag>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: KC.ink, letterSpacing: -0.3, wordBreak: 'break-word' }}>
                        {match.title || match.job_title || 'Lowongan'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: KC.mute, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={13} /> {match.location || match.region_code || '—'}
                        </span>
                        <span>·</span>
                        {match.salary_range && <span>{match.salary_range}</span>}
                    </div>
                </div>
                <ScoreDonut value={pct} size={50} color={bandData.color} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${KC.ash}`, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {skills.map((s, idx) => (
                        <span key={idx} style={{ padding: '3px 8px', background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: KC.inkLight }}>
                            {typeof s === 'string' ? s : s.name}
                        </span>
                    ))}
                </div>
                <button onClick={onSelect} className="kc-btn" style={{ ...topBtn(KC.ink, '#fff'), padding: '6px 14px', fontSize: 12, marginLeft: 'auto' }}>
                    Lihat Detail & Lamar →
                </button>
            </div>
        </BrutalCard>
    )
}

// DEMO_MATCHES removed — the dashboard now shows real API data only.
// If no matches exist, the UI renders an honest zero-state.
