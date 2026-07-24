import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, DesignStyles, BandLegend, BAND_META, BAND_ORDER } from './_design'
import JobDetailModal from './JobDetailModal'

// Server-assigned band wins; fall back to the 0.65 / 0.45 cutoffs on the 0–100
// score so demo data (and any pre-band payload) still groups sensibly.
const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch'
}

// ── LinkedIn-style multi-facet filters ─────────────────────────────────────
// Auto-matching to seeker profile still happens server-side. These filters
// narrow the already-ranked top list — they don't replace AI scoring.
const FACETS = {
    location: {
        label: 'Lokasi', accent: KC.cyan,
        options: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Denpasar', 'Medan'],
        match: (m, v) => new RegExp(v, 'i').test(m.location || m.region_code || ''),
    },
    workMode: {
        label: 'Mode Kerja', accent: KC.pink,
        options: ['Onsite', 'Hybrid', 'Remote'],
        match: (m, v) => {
            if (v === 'Remote') {
                return m.remote_allowed || /remote/i.test(m.location || '');
            }
            if (v === 'Hybrid') {
                return /hybrid/i.test(m.location || '');
            }
            if (v === 'Onsite') {
                return !m.remote_allowed && !/remote|hybrid/i.test(m.location || '');
            }
            return true;
        }
    },
    type: {
        label: 'Tipe Kerja', accent: KC.lime,
        options: ['Full-time', 'Contract', 'Part-time', 'Internship', 'Freelance'],
        match: (m, v) => {
            const typeStr = m.work_type || m.employment_type || 'Full-time';
            return new RegExp(v, 'i').test(typeStr);
        }
    },
    role: {
        label: 'Role / Industri', accent: KC.yellow,
        options: ['Backend', 'Frontend', 'Data', 'Mobile', 'Design', 'Product', 'DevOps', 'Marketing'],
        match: (m, v) => new RegExp(v, 'i').test(m.title || m.job_title || m.industry || ''),
    },
    experience: {
        label: 'Pengalaman', accent: KC.orange,
        options: ['Fresh grad', '1-3 thn', '3-5 thn', '5-8 thn', '8+ thn'],
        match: (m, v) => {
            const exp = typeof m.experience_years_min === 'number'
                ? m.experience_years_min
                : parseInt(String(m.experience_range || '').match(/\d+/)?.[0] || '0')
            if (v === 'Fresh grad') return exp <= 1
            if (v === '1-3 thn') return exp >= 1 && exp <= 3
            if (v === '3-5 thn') return exp >= 3 && exp <= 5
            if (v === '5-8 thn') return exp >= 5 && exp <= 8
            if (v === '8+ thn') return exp >= 8
            return true
        },
    },
    salary: {
        label: 'Gaji Min', accent: KC.cyan,
        options: ['Rp 5jt+', 'Rp 10jt+', 'Rp 15jt+', 'Rp 25jt+', 'Rp 40jt+'],
        match: (m, v) => {
            const min = parseInt(v.replace(/\D/g, '')) || 0
            const got = typeof m.salary_min === 'number' && m.salary_min > 0
                ? (m.salary_min / 1000000)
                : parseInt(String(m.salary_range || '').match(/\d+/)?.[0] || '0')
            return got >= min
        },
    },
    verified: {
        label: 'Trust', accent: KC.lime,
        options: ['Employer verified', 'Posted < 7 hari'],
        match: (m, v) => v === 'Employer verified' ? !!m.verified : !!m.recent,
    },
}

const DEFAULT_FACETS = {
    location: new Set(), workMode: new Set(), type: new Set(),
    role: new Set(), experience: new Set(), salary: new Set(), verified: new Set(),
}

export default function SeekerMatchResults() {
    const { matches, agentLoading, runAgent, toggleSaveJob, isJobSaved, seekerId, profile, navigate, trackEvent } = useStore()
    const [facets, setFacets] = useState(DEFAULT_FACETS)
    const [showFilters, setShowFilters] = useState(true)
    const [selectedJob, setSelectedJob] = useState(null)

    const hasProfile = Boolean(seekerId || profile?.skills?.length > 0)

    if (!hasProfile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />
                <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${KC.ink}` }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Belum ada data CV</h2>
                    <p style={{ color: KC.mute, marginBottom: 24, fontSize: 14, maxWidth: 360, margin: '0 auto 24px' }}>Sistem tidak bisa mencarikan lowongan yang pas kalau data profil atau CV kamu masih kosong.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{ padding: '12px 24px', background: KC.orange, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                            Upload CV Sekarang →
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Empty state when we have a profile but no matches yet
    if (!agentLoading && matches.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />
                <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                    <div>
                        <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>Top 5 Match Untukmu</h1>
                        <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>Belum ada match — jalankan AI dulu</p>
                    </div>
                </header>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                    padding: '60px 32px', textAlign: 'center',
                    background: '#fff', border: `3px solid ${KC.ink}`, borderRadius: 16,
                    boxShadow: `6px 6px 0 ${KC.ink}`, animation: 'kc-fade-up .4s ease',
                }}>
                    <div style={{ fontSize: 64, lineHeight: 1 }}>🤖</div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px' }}>Match kamu belum dijalankan</h2>
                        <p style={{ fontSize: 14, color: KC.mute, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
                            CV sudah terdeteksi. Klik tombol di bawah dan AI akan mencari top-5 lowongan
                            paling cocok dengan profilmu dalam ~8 detik.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button className="kc-btn" onClick={() => runAgent({ explicitIntent: 'match_jobs' })} style={{
                            padding: '14px 28px', background: KC.orange, color: '#fff',
                            border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 15, fontWeight: 900,
                            cursor: 'pointer', boxShadow: `4px 4px 0 ${KC.ink}`,
                        }}>
                            🚀 Jalankan AI Match →
                        </button>
                        <button className="kc-btn" onClick={() => navigate('seeker-profile')} style={{
                            padding: '14px 24px', background: '#fff', color: KC.ink,
                            border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 15, fontWeight: 800,
                            cursor: 'pointer', boxShadow: `4px 4px 0 ${KC.ink}`,
                        }}>
                            📄 Update CV
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                        {[['~8s', 'Waktu proses'], ['5', 'Top matches'], ['12.480+', 'Lowongan aktif']].map(([val, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 900 }}>{val}</div>
                                <div style={{ fontSize: 11, color: KC.mute, fontWeight: 700 }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const baseList = matches.length ? matches : DEMO_MATCHES
    const activeCount = Object.values(facets).reduce((n, s) => n + s.size, 0)
    const list = (activeCount === 0
        ? baseList
        : baseList.filter(m => Object.entries(facets).some(([k, sel]) => {
            if (sel.size === 0) return false
            return [...sel].some(v => FACETS[k].match(m, v))
        }))
    ).slice(0, 5)

    const toggleFacet = (key, value) => {
        setFacets(prev => {
            const next = { ...prev, [key]: new Set(prev[key]) }
            next[key].has(value) ? next[key].delete(value) : next[key].add(value)
            return next
        })
    }
    const resetAll = () => setFacets({
        location: new Set(), workMode: new Set(), type: new Set(),
        role: new Set(), experience: new Set(), salary: new Set(), verified: new Set(),
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        {agentLoading ? 'AI lagi nyari yang cocok…' : 'Top 5 Match Untukmu'}
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {agentLoading
                            ? 'AI sedang mencocokkan profilmu dengan puluhan ribu lowongan aktif'
                            : 'Dicocokkan otomatis oleh AI · gunakan filter untuk menyaring hasil'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {!agentLoading && (
                        <button className="kc-btn" onClick={() => setShowFilters(v => !v)} style={topBtn('#fff')}>
                            ⚙️ Filter {activeCount > 0 && <span style={{ marginLeft: 6, padding: '2px 6px', background: KC.orange, color: '#fff', borderRadius: 4, fontSize: 10, fontWeight: 900 }}>{activeCount}</span>}
                        </button>
                    )}
                    <button
                        className="kc-btn"
                        disabled={agentLoading}
                        onClick={async () => {
                            const activeFilters = {};
                            if (facets.location.size > 0) {
                                activeFilters.location = [...facets.location][0];
                            }
                            if (facets.salary.size > 0) {
                                const val = [...facets.salary][0];
                                const millions = parseInt(val.replace(/\D/g, '')) || 0;
                                activeFilters.salary_min = millions * 1000000;
                            }
                            if (facets.experience.size > 0) {
                                const val = [...facets.experience][0];
                                if (val === 'Fresh grad') activeFilters.experience_min = 0;
                                else {
                                    const num = parseInt(val.replace(/\D/g, '')) || 0;
                                    activeFilters.experience_min = num;
                                }
                            }
                            await runAgent({ explicitIntent: 'match_jobs', filters: activeFilters });
                        }}
                        style={topBtn(KC.orange, '#fff')}
                    >
                        {agentLoading ? 'Memproses…' : 'Re-Match'}
                    </button>
                </div>
            </header>

            {agentLoading ? (
                <MatchSkeleton inline />
            ) : (
                <>
                    {/* ── Faceted filter panel (LinkedIn-style) ────────────────── */}
                    {showFilters && (
                        <BrutalCard color="#fff" padding={20} style={{ animation: 'kc-fade-up .25s ease both' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Tag color={KC.yellow}>filter pintar</Tag>
                                    <span style={{ fontSize: 12, color: KC.mute, fontWeight: 700 }}>
                                        {list.length} hasil dari {baseList.length} match
                                    </span>
                                </div>
                                <button className="kc-btn" onClick={resetAll} disabled={activeCount === 0} style={{ ...topBtn('#fff'), opacity: activeCount === 0 ? 0.45 : 1, padding: '6px 12px', fontSize: 11 }}>
                                    Reset semua
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
                                {Object.entries(FACETS).map(([key, facet]) => (
                                    <FacetGroup key={key} facet={facet} selected={facets[key]} onToggle={(v) => toggleFacet(key, v)} />
                                ))}
                            </div>

                            {activeCount > 0 && (
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1.5px dashed ${KC.ink}`, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute }}>Aktif:</span>
                                    {Object.entries(facets).flatMap(([k, sel]) =>
                                        [...sel].map(v => (
                                            <button key={`${k}-${v}`} onClick={() => toggleFacet(k, v)} style={{
                                                padding: '4px 10px', background: FACETS[k].accent, color: KC.ink,
                                                border: `1.5px solid ${KC.ink}`, borderRadius: 999,
                                                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                            }}>
                                                {v} ×
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </BrutalCard>
                    )}

                    <BandLegend side="seeker" />

                    {(() => {
                        const groups = BAND_ORDER
                            .map(key => ({ ...BAND_META[key], items: list.filter(m => bandOf(m) === key) }))
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
                                            <p style={{ fontSize: 12, fontWeight: 600, color: KC.mute, margin: '0 0 0 24px', lineHeight: 1.5 }}>{g.seeker}</p>
                                        </div>
                                        <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {g.items.map((m, i) => (
                                                <MatchCard key={m.job_id || `${g.key}-${i}`} match={m} band={g.key} bandColor={g.color} bandLabel={g.label}
                                                    saved={isJobSaved(m.job_id || m.id)} onSave={() => toggleSaveJob(m)}
                                                    onView={() => {
                                                        trackEvent?.('job_viewed', { job_id: m.job_id, band: g.key })
                                                        setSelectedJob(m)
                                                    }} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}

                    <div style={{ marginTop: 12, padding: 14, background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC.mute }}>
                        Hanya 5 hasil teratas yang ditampilkan. <span onClick={() => useStore.getState().navigate('pricing')} style={{ color: KC.ink, textDecoration: 'underline', cursor: 'pointer' }}>Upgrade ke Pro</span> buat akses top-20 + insight mingguan.
                    </div>

                    <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
                </>
            )}
        </div>
    )
}

function MatchCard({ match, band, bandColor, bandLabel, saved, onSave, onView }) {
    const navigate = useStore(s => s.navigate)
    const companyRaw = match.company || 'Company'
    const company = (companyRaw.length === 36 && companyRaw.includes('-')) ? 'Perusahaan Mitra' : companyRaw
    const matchingSkills = match.matching_skills || []
    const missingSkills = match.missing_skills || []
    return (
        <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
            {/* No score donut, no rank sticker — the band is the only headline,
                and we never show how this seeker stacks against rivals. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{ width: 28, height: 28, background: KC.cyan, border: `1.5px solid ${KC.ink}`, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12 }}>{company[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: KC.mute }}>{company}</div>
                        {match.verified && <Tag color={KC.lime} size="sm">✓ Terverifikasi</Tag>}
                        <Tag color={bandColor || KC.cyan} size="md" style={{ marginLeft: 'auto' }}>{bandLabel || String(band)}</Tag>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15, margin: 0 }}>
                        {match.title || match.job_title || 'Posisi'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 12, fontWeight: 700, color: KC.mute, flexWrap: 'wrap' }}>
                        <span>📍 {match.location || 'Jakarta'}</span>
                        <span>💰 {match.salary_range || 'Competitive'}</span>
                        <span>⏱ {match.experience_range || '3-5 thn'}</span>
                        <span>💼 {match.work_type || 'Full-time'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                        {matchingSkills.map(s => typeof s === 'string' ? s : s.name || '').slice(0, 4).map(t => <Tag key={t} color={KC.lime} size="sm">{t}</Tag>)}
                        {missingSkills.map(s => typeof s === 'string' ? s : s.name || '').slice(0, 2).map(t => <Tag key={t} color={KC.orangeSoft} size="sm">+ {t}</Tag>)}
                    </div>
                    {match.explanation && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
                            <b>✨ AI · </b>{match.explanation}
                        </div>
                    )}
                    {/* Stretch → the gap becomes a concrete to-do with a hook into Skill-Gap. */}
                    {band === 'stretch' && missingSkills.length > 0 && (
                        <button className="kc-btn" onClick={() => navigate('seeker-skill-gap')} style={{ ...topBtn(KC.cyan), marginTop: 12 }}>
                            Lihat skill yang perlu dilengkapi →
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="kc-btn" onClick={onSave} aria-label={saved ? 'Unsave' : 'Save'} style={{ width: 38, height: 38, background: saved ? KC.yellow : '#fff', border: `2px solid ${KC.ink}`, borderRadius: 9, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`, fontSize: 16 }}>
                        {saved ? '★' : '☆'}
                    </button>
                    <button className="kc-btn" onClick={onView} style={topBtn(KC.orange, '#fff')}>Lihat →</button>
                </div>
            </div>
        </BrutalCard>
    )
}

function MatchSkeleton({ inline }) {
    const [stageIdx, setStageIdx] = useState(2)
    useEffect(() => {
        const t = setInterval(() => setStageIdx(i => Math.min(3, i + 1)), 1800)
        return () => clearInterval(t)
    }, [])

    const stageDefs = [
        { l: 'Membaca CV', dur: 'Selesai' },
        { l: 'Mengenali Profil', dur: 'Selesai' },
        { l: 'Mencari Kecocokan', dur: 'Proses…' },
        { l: 'Pilih Terbaik', dur: 'Antre' },
    ]

    const content = (
        <>
            <BrutalCard color="#fff" padding={20}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
                    {stageDefs.map((st, i) => {
                        const ok = i < stageIdx, loading = i === stageIdx
                        const bg = ok ? KC.lime : loading ? KC.yellow : KC.bone
                        return (
                            <div key={i} className="kc-card" style={{ padding: 14, background: bg, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {ok && <div style={{ width: 22, height: 22, background: KC.ink, color: '#fff', borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 900 }}>✓</div>}
                                    {loading && <div className="kc-spin" />}
                                    {!ok && !loading && <div style={{ width: 22, height: 22, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 6 }} />}
                                    <div style={{ fontSize: 13, fontWeight: 900 }}>{st.l}</div>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginTop: 6 }}>{st.dur}</div>
                            </div>
                        )
                    })}
                </div>
            </BrutalCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <BrutalCard key={i} color="#fff" padding={20}>
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', gap: 16, alignItems: 'center' }}>
                            <div className="kc-shim" style={{ width: 60, height: 60, borderRadius: '50%' }} />
                            <div>
                                <div className="kc-shim" style={{ width: 120, height: 14, borderRadius: 6, marginBottom: 10 }} />
                                <div className="kc-shim" style={{ width: '60%', height: 22, borderRadius: 6, marginBottom: 12 }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[50, 70, 60, 80].map((w, j) => <div key={j} className="kc-shim" style={{ width: w, height: 12, borderRadius: 999 }} />)}
                                </div>
                            </div>
                            <div className="kc-shim" style={{ width: 90, height: 38, borderRadius: 8 }} />
                        </div>
                    </BrutalCard>
                ))}
            </div>
        </>
    )

    if (inline) return content

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>AI lagi nyari yang cocok…</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>AI sedang mencocokkan profilmu dengan puluhan ribu lowongan aktif</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    <span className="kc-ping" /> ESTIMASI 8 DETIK
                </div>
            </header>
            {content}
        </div>
    )
}

function FacetGroup({ facet, selected, onToggle }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, background: facet.accent, border: `1.5px solid ${KC.ink}`, borderRadius: 3 }} />
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>{facet.label}</span>
                {selected.size > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '1px 6px', background: KC.ink, color: '#fff', borderRadius: 999 }}>{selected.size}</span>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {facet.options.map(opt => {
                    const on = selected.has(opt)
                    return (
                        <button key={opt} onClick={() => onToggle(opt)} className="kc-btn" style={{
                            padding: '5px 10px', fontSize: 11, fontWeight: 800,
                            background: on ? KC.ink : '#fff', color: on ? '#fff' : KC.ink,
                            border: `1.5px solid ${KC.ink}`, borderRadius: 999,
                            cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: on ? `2px 2px 0 ${facet.accent}` : 'none',
                        }}>
                            {opt}{on && ' ✓'}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

const topBtn = (bg, fg = KC.ink) => ({
    padding: '8px 14px', background: bg, color: fg, border: `2px solid ${KC.ink}`,
    borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
})

const DEMO_MATCHES = [
    { job_id: 'd1', band: 'strong', score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', experience_range: '4-7 thn', matching_skills: ['Go', 'PostgreSQL', 'gRPC', 'Microservices'], missing_skills: ['Kafka'], explanation: 'Skill kamu—Go, PostgreSQL, gRPC—nyambung kuat sama kebutuhan tim payment. Posisi yang pas buat kamu lamar.' },
    { job_id: 'd2', band: 'strong', score: 89, title: 'Tech Lead · Payments Infrastructure', company: 'Xendit', location: 'Jakarta · Remote', salary_range: 'Rp 35-50jt', experience_range: '6+ thn', matching_skills: ['Go', 'Node', 'AWS', 'PostgreSQL'], missing_skills: ['Kafka', 'Terraform'], explanation: 'Pengalaman fintech & leadership-mu nyambung kuat. Posisi yang pas buat kamu lamar.' },
    { job_id: 'd3', band: 'possible', score: 85, title: 'Staff Engineer', company: 'GoTo Financial', location: 'Jakarta · Hybrid', salary_range: 'Rp 40-60jt', experience_range: '7+ thn', matching_skills: ['Microservices', 'K8s', 'Go'], missing_skills: ['Redis'], explanation: 'Kamu udah punya pondasi yang cocok lewat Microservices, K8s, Go. Lengkapi Redis biar makin siap.' },
    { job_id: 'd4', band: 'possible', score: 81, title: 'Backend Lead · Wealth', company: 'Bibit', location: 'Jakarta · Hybrid', salary_range: 'Rp 30-45jt', experience_range: '5+ thn', matching_skills: ['Node', 'TypeScript'], missing_skills: ['Go', 'gRPC'], explanation: 'Kamu udah punya pondasi yang cocok lewat Node, TypeScript. Lengkapi Go, gRPC biar makin siap.' },
    { job_id: 'd5', band: 'stretch', score: 78, title: 'Sr. Software Engineer', company: 'Ruangguru', location: 'Jakarta · Remote', salary_range: 'Rp 25-38jt', experience_range: '4+ thn', matching_skills: ['Node', 'PostgreSQL'], missing_skills: ['Go', 'K8s'], explanation: 'Lowongan ini sedikit di luar jangkauanmu sekarang—anggap sebagai tujuan. Mulai dari Go, K8s, dan ini jadi target yang realistis.' },
]
