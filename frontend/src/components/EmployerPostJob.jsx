import { useEffect, useMemo, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, ScoreDonut } from './_design'
import { estimateJobPool, _authHeader } from '../services/api'

export default function EmployerPostJob() {
    const { navigate } = useStore()
    const [form, setForm] = useState({
        title: '', department: '', level: 'senior',
        location: 'Jakarta', work_type: 'hybrid',
        salary_min: '', salary_max: '',
        description: '', required_skills: [],
    })
    const [skillInput, setSkillInput] = useState('')
    const [publishing, setPublishing] = useState(false)
    const [estimate, setEstimate] = useState({ pool_size: 340, match_score: 82, tip: 'Naikin gaji ke Rp 35-50jt → pool ~620 kandidat.' })

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
    const addSkill = () => {
        const s = skillInput.trim()
        if (s && !form.required_skills.includes(s)) {
            update('required_skills', [...form.required_skills, s]); setSkillInput('')
        }
    }
    const removeSkill = (s) => update('required_skills', form.required_skills.filter(x => x !== s))

    // Debounced AI estimation as user types
    useEffect(() => {
        const t = setTimeout(async () => {
            try {
                const e = await estimateJobPool({
                    title: form.title, description: form.description,
                    required_skills: form.required_skills,
                    location: form.location,
                    salary_min: Number(form.salary_min) || 0,
                    salary_max: Number(form.salary_max) || 0,
                })
                setEstimate(e)
            } catch { /* fall back to default */ }
        }, 500)
        return () => clearTimeout(t)
    }, [form.title, form.description, form.required_skills, form.location, form.salary_min, form.salary_max])

    const salaryRange = useMemo(() => {
        const lo = Number(form.salary_min) || 0, hi = Number(form.salary_max) || 0
        if (!lo && !hi) return 'Rp 28-42jt'
        return `Rp ${(lo / 1e6).toFixed(0)}-${(hi / 1e6).toFixed(0)}jt`
    }, [form.salary_min, form.salary_max])

    const handlePublish = async () => {
        if (!form.title || !form.description) { toast.error('Judul dan deskripsi wajib diisi'); return }
        setPublishing(true)
        try {
            const res = await fetch('/api/v1/employer/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ..._authHeader() },
                body: JSON.stringify({
                    title: form.title, description: form.description,
                    required_skills: form.required_skills,
                    location: form.location, region_code: form.location,
                    work_type: form.work_type,
                    salary_min: Number(form.salary_min) || 0,
                    salary_max: Number(form.salary_max) || 0,
                }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            toast.success('Lowongan dipublish!')
            useStore.getState().refreshEmployerJobs()
            navigate('employer-dashboard')
        } catch (e) {
            toast.error('Gagal publish: ' + e.message)
        } finally { setPublishing(false) }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Pasang Lowongan Baru</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        AI bantu re-rank kandidat berdasarkan deskripsi. Makin spesifik makin akurat.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={topBtn('#fff')}>Simpan Draft</button>
                    <button onClick={handlePublish} disabled={publishing} style={topBtn(KC.orange, '#fff')}>
                        {publishing ? 'Publishing…' : 'Publish →'}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
                <BrutalCard color="#fff" padding={28}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>1. Detail Posisi</h2>
                    <p style={{ fontSize: 12, color: KC.mute, margin: '0 0 18px' }}>Info dasar yang muncul di kartu lowongan.</p>

                    <Field label="Judul Posisi" value={form.title} onChange={v => update('title', v)} placeholder="Senior Backend Engineer" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label="Departemen" value={form.department} onChange={v => update('department', v)} placeholder="Engineering" />
                        <Field label="Level" value={form.level} onChange={v => update('level', v)} placeholder="Senior · 5-8 thn" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                        <Field label="Lokasi" value={form.location} onChange={v => update('location', v)} placeholder="Jakarta" />
                        <Field label="Tipe Kerja" value={form.work_type} onChange={v => update('work_type', v)} placeholder="Hybrid" />
                        <Field label="Gaji Min (Rp)" value={form.salary_min} onChange={v => update('salary_min', v)} placeholder="28000000" />
                    </div>
                    <Field label="Gaji Maks (Rp)" value={form.salary_max} onChange={v => update('salary_max', v)} placeholder="42000000" />

                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: '24px 0 4px' }}>2. Deskripsi & Skill</h2>
                    <p style={{ fontSize: 12, color: KC.mute, margin: '0 0 18px' }}>AI baca ini buat ranking kandidat. Tulis se-detail mungkin.</p>

                    <label style={inputLabel}>Deskripsi Lengkap</label>
                    <div style={{ position: 'relative' }}>
                        <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                            placeholder="Job description, ideal candidate profile, responsibilities…"
                            style={{ width: '100%', minHeight: 180, padding: 14, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', fontWeight: 600, color: KC.ink, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                    </div>

                    <label style={{ ...inputLabel, marginTop: 18 }}>Required Skills</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 10, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                        {form.required_skills.map(s => (
                            <span key={s} style={{ padding: '6px 10px', background: KC.lime, border: `1.5px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {s} <span onClick={() => removeSkill(s)} style={{ cursor: 'pointer' }}>×</span>
                            </span>
                        ))}
                        <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                            placeholder="+ tambah skill (Enter)"
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', minWidth: 140, padding: '4px 6px' }} />
                    </div>
                </BrutalCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color={KC.orange} padding={18} style={{ color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>👁</span>
                            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Live Preview Kartu Kandidat</h3>
                        </div>
                    </BrutalCard>

                    <BrutalCard color="#fff" padding={18}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, background: KC.cyan, border: `1.5px solid ${KC.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13, color: '#fff' }}>
                                {(useStore.getState().user.name || 'X')[0]}
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: KC.mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>{useStore.getState().user.name || 'PT Anda'} ✓</div>
                                <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>{form.title || 'Judul Posisi'}</h3>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, fontWeight: 700, color: KC.mute, marginTop: 8 }}>
                            <span>📍 {form.location} · {form.work_type}</span>
                            <span>💰 {salaryRange}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {(form.required_skills.length ? form.required_skills : ['Go', 'PostgreSQL', 'gRPC', 'Kafka']).slice(0, 6).map(t => <Tag key={t} color={KC.lime} size="sm">{t}</Tag>)}
                        </div>
                    </BrutalCard>

                    <BrutalCard color={KC.ink} padding={18} style={{ color: '#fff' }}>
                        <Tag color={KC.orange} ink="#fff">✨ AI Estimasi</Tag>
                        <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: '12px 0 4px' }}>Probable match pool</h3>
                        <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 14px' }}>Berdasarkan skill mix & lokasi:</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <ScoreDonut value={estimate.match_score} size={56} color={KC.orange} label="" />
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900 }}>~{estimate.pool_size} kandidat</div>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>cocok &gt; 80% match score</div>
                            </div>
                        </div>
                        {estimate.tip && (
                            <div style={{ marginTop: 14, padding: 10, background: '#1a1a20', border: `1.5px solid ${KC.orange}`, borderRadius: 8, fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
                                💡 {estimate.tip}
                            </div>
                        )}
                    </BrutalCard>

                    <BrutalCard color={KC.yellow} padding={14}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Quota Lowongan</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 22, fontWeight: 900 }}>4 / 10</span>
                            <span style={{ fontSize: 11, color: KC.mute, fontWeight: 700 }}>plan Growth</span>
                        </div>
                        <div style={{ height: 8, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ width: '40%', height: '100%', background: KC.orange }} />
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, onChange, placeholder }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={inputLabel}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{
                width: '100%', padding: '12px 14px', background: '#fff', border: `2px solid ${KC.ink}`,
                borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: KC.ink,
                boxSizing: 'border-box', outline: 'none',
            }} />
        </div>
    )
}

const inputLabel = { display: 'block', fontSize: 11, fontWeight: 800, color: KC.ink, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }
const topBtn = (bg, fg = KC.ink) => ({ padding: '10px 16px', background: bg, color: fg, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` })

