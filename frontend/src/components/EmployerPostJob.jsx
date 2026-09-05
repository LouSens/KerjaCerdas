import { useEffect, useMemo, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, ScoreDonut, topBtn, DesignStyles } from './_design'
import { createEmployerJob, estimateJobPool } from '../services/api'
import { Sparkles, Building2, CheckCircle2, Users, Plus, X, ArrowRight, ShieldCheck } from 'lucide-react'

export default function EmployerPostJob() {
    const { navigate } = useStore()
    const [form, setForm] = useState({
        title: 'Senior Backend Engineer',
        department: 'Engineering',
        level: 'senior',
        location: 'Jakarta',
        work_type: 'hybrid',
        salary_min: '28000000',
        salary_max: '42000000',
        description: 'Merancang arsitektur backend berskala tinggi, microservices gRPC, dan mengoptimalkan performa database PostgreSQL.',
        required_skills: ['Go', 'PostgreSQL', 'Docker', 'Kubernetes'],
    })
    const [skillInput, setSkillInput] = useState('')
    const [publishing, setPublishing] = useState(false)
    const [estimate, setEstimate] = useState(null)
    const [estimating, setEstimating] = useState(false)

    // Live talent-pool estimate from the real backend endpoint, debounced so it
    // doesn't fire on every keystroke. Replaces a previously-hardcoded static
    // panel (pool_size: 340, match_score: 88) that never reflected the form.
    useEffect(() => {
        let cancelled = false
        setEstimating(true)
        const timer = setTimeout(() => {
            estimateJobPool({
                required_skills: form.required_skills,
                location: form.location,
                salary_min: Number(form.salary_min) || 0,
                salary_max: Number(form.salary_max) || 0,
            })
                .then((res) => { if (!cancelled) setEstimate(res) })
                .catch(() => { if (!cancelled) setEstimate(null) })
                .finally(() => { if (!cancelled) setEstimating(false) })
        }, 500)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [form.required_skills, form.location, form.salary_min, form.salary_max])

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
    const addSkill = () => {
        const s = skillInput.trim()
        if (s && !form.required_skills.includes(s)) {
            update('required_skills', [...form.required_skills, s])
            setSkillInput('')
        }
    }
    const removeSkill = (s) => update('required_skills', form.required_skills.filter(x => x !== s))

    const handlePublish = async () => {
        if (!form.title || !form.description) {
            toast.error('Judul dan deskripsi lowongan wajib diisi')
            return
        }
        setPublishing(true)
        try {
            await createEmployerJob({
                title: form.title,
                description: form.description,
                required_skills: form.required_skills,
                location: form.location,
                work_type: form.work_type,
                salary_min: Number(form.salary_min) || 0,
                salary_max: Number(form.salary_max) || 0,
            })
            toast.success('Lowongan berhasil dipublikasikan!')
            useStore.getState().refreshEmployerJobs()
            navigate('employer-dashboard')
        } catch (e) {
            toast.error('Gagal mempublikasikan: ' + e.message)
        } finally {
            setPublishing(false)
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: `1.5px solid ${KC.ink}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: '#fff',
        outline: 'none',
    }

    const labelStyle = {
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: KC.mute,
        display: 'block',
        marginBottom: 5,
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Pasang Lowongan Baru
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Sistem AI memetakan kualifikasi posisi dan menyajikan estimasi ketersediaan kandidat
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('employer-dashboard')} style={topBtn('#fff')}>
                        Batal
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="kc-btn"
                        style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 13 }}
                    >
                        {publishing ? 'Mempublikasikan…' : 'Pasang Lowongan Sekarang →'}
                    </button>
                </div>
            </header>

            {/* 3-Step Guided Timeline */}
            <div className="kc-timeline-3">
                {[
                    { step: '1', title: 'Profil Perusahaan', sub: 'Terverifikasi GoTo', active: true, route: 'employer-profile' },
                    { step: '2', title: 'Verifikasi Pajak (DJP)', sub: 'NPWP Valid Aktif', active: true, route: 'employer-verification' },
                    { step: '3', title: 'Kualifikasi Posisi', sub: 'Tahap Publikasi', active: true, route: null },
                ].map((s, idx) => (
                    <div
                        key={idx}
                        onClick={() => s.route && navigate(s.route)}
                        style={{
                            padding: '12px 16px',
                            background: '#FFFFFF',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 10,
                            boxShadow: `2px 2px 0 ${KC.ink}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: s.route ? 'pointer' : 'default',
                        }}
                    >
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: KC.ink,
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: 13,
                            lineHeight: 1,
                            flexShrink: 0,
                        }}>
                            {s.step}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: KC.mute }}>{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Grid */}
            <div className="kc-grid-main">
                {/* Left Form */}
                <BrutalCard color="#FFFFFF" padding={24} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="kc-grid-2-col">
                        <div>
                            <label style={labelStyle}>Judul Posisi Pekerjaan</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => update('title', e.target.value)}
                                placeholder="Contoh: Senior Backend Engineer"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Divisi / Departemen</label>
                            <input
                                type="text"
                                value={form.department}
                                onChange={e => update('department', e.target.value)}
                                placeholder="Contoh: Engineering"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="kc-grid-2-col">
                        <div>
                            <label style={labelStyle}>Lokasi Kerja</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => update('location', e.target.value)}
                                placeholder="Contoh: Jakarta"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Mode Kerja</label>
                            <select value={form.work_type} onChange={e => update('work_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="hybrid">Hybrid</option>
                                <option value="onsite">On-Site</option>
                                <option value="remote">Remote (WFH)</option>
                            </select>
                        </div>
                    </div>

                    <div className="kc-grid-2-col">
                        <div>
                            <label style={labelStyle}>Rentang Gaji Minimum (Rp)</label>
                            <input
                                type="number"
                                value={form.salary_min}
                                onChange={e => update('salary_min', e.target.value)}
                                placeholder="28000000"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Rentang Gaji Maksimum (Rp)</label>
                            <input
                                type="number"
                                value={form.salary_max}
                                onChange={e => update('salary_max', e.target.value)}
                                placeholder="42000000"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Keahlian Esensial ({form.required_skills.length})</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                type="text"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Ketik keahlian lalu klik Tambah…"
                                style={{ flex: 1, ...inputStyle }}
                            />
                            <button type="button" onClick={addSkill} style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 14px', fontSize: 12 }}>
                                <Plus size={14} /> Tambah
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {form.required_skills.map((s, idx) => (
                                <span key={idx} style={{ padding: '4px 10px', background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}`, borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {s}
                                    <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: KC.mute, padding: 0 }}>×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Deskripsi Tanggung Jawab & Kualifikasi</label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={e => update('description', e.target.value)}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>
                </BrutalCard>

                {/* Right AI Talent Estimator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color="#FFFFFF" padding={22}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <Sparkles size={18} color={KC.orange} />
                            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink, margin: 0 }}>
                                Live Talent Pool AI
                            </h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: `1px solid ${KC.ash}`, borderBottom: `1px solid ${KC.ash}` }}>
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: KC.mute, textTransform: 'uppercase' }}>Potensi Talenta</span>
                                <div style={{ fontSize: 28, fontWeight: 900, color: KC.ink, letterSpacing: -0.5 }}>
                                    {estimating ? '…' : estimate ? `~${estimate.pool_size}` : '—'}
                                </div>
                                <span style={{ fontSize: 11, color: KC.lime, fontWeight: 700 }}>Kandidat Aktif Terdata</span>
                            </div>
                            <ScoreDonut value={estimate?.match_score ?? 0} size={58} color={KC.orange} label="Kecocokan" />
                        </div>

                        <div style={{ marginTop: 14, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                            {estimating
                                ? 'Menghitung estimasi…'
                                : estimate?.tip || 'Isi keahlian & lokasi untuk melihat estimasi talenta.'}
                        </div>
                    </BrutalCard>

                    <BrutalCard color="#FFFFFF" padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: KC.mute }}>
                            <ShieldCheck size={16} color={KC.lime} />
                            <span>Lowongan akan otomatis didistribusikan ke jaringan pencari kerja terverifikasi.</span>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}
