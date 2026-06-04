import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, DesignStyles } from './_design'

export default function EmployerJobs() {
    const { user, employerJobs, refreshEmployerJobs, navigate } = useStore()
    const [openJobId, setOpenJobId] = useState(null)

    useEffect(() => { refreshEmployerJobs() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const display = employerJobs && employerJobs.length ? employerJobs : DEMO_JOBS

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        Daftar Lowongan
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        {employerJobs?.length || 0} lowongan terdaftar (Aktif & Draft)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="kc-btn" onClick={() => navigate('employer-dashboard')} style={topBtn('#fff')}>← Kembali ke Dashboard</button>
                    <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn(KC.orange, '#fff')}>+ Pasang Lowongan</button>
                </div>
            </header>

            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {display.map((j, i) => (
                    <JobRow key={j.id || i} job={j} open={openJobId === (j.id || i)} onToggle={() => setOpenJobId(openJobId === (j.id || i) ? null : (j.id || i))} />
                ))}
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
                        <div><b>Stage</b><div style={{ color: KC.mute, marginTop: 2 }}>{isDraft ? 'Draft · Belum dipublish' : 'Active · screening'}</div></div>
                        <div><b>Apply rate</b><div style={{ color: KC.mute, marginTop: 2 }}>{isDraft ? '—' : '14 / hari'}</div></div>
                        <div><b>Avg match</b><div style={{ color: KC.mute, marginTop: 2 }}>{isDraft ? '—' : '82%'}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <button className="kc-btn" onClick={() => navigate('employer-post-job')} style={topBtn('#fff')}>✏ Edit lowongan</button>
                        {!isDraft && <button className="kc-btn" onClick={() => navigate('employer-candidates')} style={topBtn(KC.orange, '#fff')}>Lihat 5 kandidat →</button>}
                    </div>
                </div>
            )}
        </BrutalCard>
    )
}

const pill = (bg) => ({ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: bg, border: `1.5px solid ${KC.ink}`, borderRadius: 999, letterSpacing: 0.6 })
const topBtn = (bg, fg = KC.ink) => ({ padding: '8px 14px', background: bg, color: fg, border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` })

const DEMO_JOBS = [
    { id: 'd1', title: 'Senior Backend Engineer', location: 'Jakarta · Hybrid', salary_range: 'Rp 28-42jt', age: '5 hari', app: 84, top: 5 },
    { id: 'd2', title: 'Product Designer', location: 'Jakarta · Remote', salary_range: 'Rp 18-26jt', age: '12 hari', app: 142, top: 5 },
    { id: 'd3', title: 'Tech Lead · Payments', location: 'Jakarta · Hybrid', salary_range: 'Rp 35-50jt', age: '2 hari', app: 38, top: 5 },
    { id: 'd4', title: 'QA Automation Engineer', location: 'Bandung · Onsite', salary_range: 'Rp 15-22jt', age: '—', app: 23, top: 4, is_active: false },
]
