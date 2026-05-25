import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, FilledStat, Tag, DesignStyles } from './_design'

export default function EmployerDashboardV2() {
    const { user, employerJobs, refreshEmployerJobs, navigate } = useStore()
    const [openJobId, setOpenJobId] = useState(null)

    useEffect(() => { refreshEmployerJobs() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const activeJobs = (employerJobs || []).filter(j => j.is_active !== false)
    const display = activeJobs.length ? activeJobs.slice(0, 4) : DEMO_JOBS

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        Halo, {user.name || 'Employer'} 👋
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {activeJobs.length || 4} lowongan aktif · 287 lamaran masuk · Top kandidat di-refresh tiap 6 jam
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('employer-candidates')} style={topBtn('#fff')}>📊 Metrik</button>
                    <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn(KC.orange, '#fff')}>+ Pasang Lowongan</button>
                </div>
            </header>

            <div className="kc-grid-4 kc-stagger">
                <FilledStat label="Lowongan Aktif" value={String(activeJobs.length || 4)} sub="/ 10 quota (Growth)" color={KC.ink} dark onClick={() => navigate('employer-jobs')} />
                <FilledStat label="Total Lamaran" value="287" sub="+34 minggu ini" color={KC.cyan} onClick={() => navigate('employer-candidates')} />
                <FilledStat label="Top-5 Diakses" value="23×" sub="plan: ∞ (Growth)" color={KC.yellow} onClick={() => navigate('employer-candidates')} />
                <FilledStat label="Time-to-Hire" value="12d" sub="↓ 8d vs rata-rata" color={KC.lime} onClick={() => navigate('employer-candidates')} />
            </div>

            <div className="kc-grid-main">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: 0 }}>Lowongan Aktif Saya</h2>
                        <button className="kc-btn" onClick={() => navigate('employer-jobs')} style={linkBtn}>Lihat semua →</button>
                    </div>
                    <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {display.map((j, i) => (
                            <JobRow key={j.id || i} job={j} open={openJobId === (j.id || i)} onToggle={() => setOpenJobId(openJobId === (j.id || i) ? null : (j.id || i))} />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color={KC.yellow} padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>Plan saat ini</span>
                            <Tag color={KC.ink} ink="#fff" size="sm">GROWTH</Tag>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: '8px 0 4px' }}>
                            Rp 1.5jt<span style={{ fontSize: 13, fontWeight: 700, color: KC.mute }}>/bulan</span>
                        </div>
                        {[['Lowongan', `${activeJobs.length || 4} / 10`], ['Top-N kandidat', 'Top-10'], ['API access', '—'], ['ATS Integration', '—']].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                                <span>{k}</span><span><b>{v}</b></span>
                            </div>
                        ))}
                        <button className="kc-btn" onClick={() => navigate('pricing')} style={{ ...topBtn(KC.ink, '#fff'), width: '100%', marginTop: 12 }}>Upgrade ke Scale →</button>
                    </BrutalCard>

                    <BrutalCard color="#fff" padding={18}>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: '0 0 4px' }}>Lamaran Masuk · 14 hari</h3>
                        <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginBottom: 12 }}>Total <b>+92</b> · puncak hari Selasa</div>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 70 }}>
                            {[12, 8, 15, 22, 18, 6, 4, 11, 9, 14, 21, 17, 7, 5].map((h, i) => (
                                <div key={i} className="kc-bar" style={{ flex: 1, height: `${(h / 22) * 100}%`, background: h > 18 ? KC.orange : KC.cyan, border: `1.5px solid ${KC.ink}`, borderRadius: 4, animationDelay: `${i * 0.04}s` }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: KC.mute, marginTop: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                            <span>−14d</span><span>today</span>
                        </div>
                    </BrutalCard>

                    <BrutalCard color={KC.lime} padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>✓</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800 }}>NPWP Terverifikasi</div>
                                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>Diverifikasi 12 Mei · valid hingga 2027</div>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}

function JobRow({ job, open, onToggle }) {
    const navigate = useStore(s => s.navigate)
    const isDraft = job.is_active === false || job.status === 'draft'
    return (
        <BrutalCard color="#fff" padding={16}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 18, alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{job.title}</h4>
                        {isDraft
                            ? <span style={pill(KC.ash)}>DRAFT</span>
                            : <span style={pill(KC.lime)}>● LIVE</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: KC.mute, marginTop: 4 }}>
                        {job.location || 'Jakarta'} · {job.salary_range || (job.salary_min ? `Rp ${(job.salary_min / 1e6).toFixed(0)}-${(job.salary_max / 1e6).toFixed(0)}jt` : 'Competitive')} · {job.age || '—'}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{job.application_count ?? job.app ?? 0}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: KC.mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>lamaran</div>
                </div>
                <div style={{ textAlign: 'center', padding: '4px 10px', background: KC.orange, color: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{job.top ?? 5}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>top match</div>
                </div>
                <button className="kc-btn" onClick={onToggle} aria-expanded={open} style={topBtn('#fff')}>
                    {open ? 'Tutup' : 'Detail'} {open ? '▴' : '▾'}
                </button>
                <button className="kc-btn" onClick={() => navigate('employer-candidates')} style={topBtn(KC.ink, '#fff')}>👤 Kandidat</button>
            </div>

            {open && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1.5px dashed ${KC.ink}`, animation: 'kc-fade-up .25s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, fontSize: 12 }}>
                        <div><b>Stage</b><div style={{ color: KC.mute, marginTop: 2 }}>Active · screening</div></div>
                        <div><b>Apply rate</b><div style={{ color: KC.mute, marginTop: 2 }}>14 / hari</div></div>
                        <div><b>Avg match</b><div style={{ color: KC.mute, marginTop: 2 }}>82%</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn('#fff')}>✏ Edit lowongan</button>
                        <button className="kc-btn" onClick={() => navigate('employer-candidates')} style={topBtn(KC.orange, '#fff')}>Lihat 5 kandidat →</button>
                    </div>
                </div>
            )}
        </BrutalCard>
    )
}

const pill = (bg) => ({ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: bg, border: `1.5px solid ${KC.ink}`, borderRadius: 999, letterSpacing: 0.6 })
const topBtn = (bg, fg = KC.ink) => ({ padding: '8px 14px', background: bg, color: fg, border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` })
const linkBtn = { background: 'transparent', border: 'none', color: KC.ink, fontWeight: 800, fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: 0 }

const DEMO_JOBS = [
    { id: 'd1', title: 'Senior Backend Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', age: '5 hari', app: 84, top: 5 },
    { id: 'd2', title: 'Product Designer', location: 'Jakarta · Remote', salary_range: 'Rp 18-26jt', age: '12 hari', app: 142, top: 5 },
    { id: 'd3', title: 'Tech Lead · Payments', location: 'Jakarta · Hybrid', salary_range: 'Rp 35-50jt', age: '2 hari', app: 38, top: 5 },
    { id: 'd4', title: 'QA Automation Engineer', location: 'Bandung · Onsite', salary_range: 'Rp 15-22jt', age: '—', app: 23, top: 4, is_active: false },
]
