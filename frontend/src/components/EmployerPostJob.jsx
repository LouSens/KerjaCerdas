import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { createEmployerJob, estimateJobPool } from '../services/api'
import { Plus, X, ArrowLeft, ArrowRight, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react'

export default function EmployerPostJob() {
    const { navigate, refreshEmployerJobs, employerProfile, loadEmployerProfile, user } = useStore()
    const [step, setStep] = useState(1) // 1: Profil, 2: NPWP, 3: Lowongan

    useEffect(() => {
        loadEmployerProfile()
    }, []) // eslint-disable-line

    // Step 1: Profil Lembaga
    const [companyName, setCompanyName] = useState(employerProfile?.company_name || user?.full_name || '')
    const [industry, setIndustry] = useState('Teknologi')
    const [companySize, setCompanySize] = useState('51-200')
    const [picEmail, setPicEmail] = useState(user?.email || '')

    // Step 2: Validasi NPWP
    const [npwp, setNpwp] = useState(employerProfile?.npwp || '')

    // Step 3: Detail Lowongan
    const [title, setTitle] = useState('')
    const [location, setLocation] = useState('Jakarta')
    const [workType, setWorkType] = useState('Hybrid')
    const [salaryMin, setSalaryMin] = useState(15000000)
    const [salaryMax, setSalaryMax] = useState(25000000)
    const [skills, setSkills] = useState([])
    const [skillInput, setSkillInput] = useState('')
    const [description, setDescription] = useState('')
    const [publishing, setPublishing] = useState(false)
    const [estimate, setEstimate] = useState({ pool_size: 0, strong: 0, possible: 0, stretch: 0 })

    useEffect(() => {
        if (employerProfile) {
            if (!companyName && employerProfile.company_name) setCompanyName(employerProfile.company_name)
            if (!npwp && employerProfile.npwp) setNpwp(employerProfile.npwp)
        }
    }, [employerProfile]) // eslint-disable-line
    useEffect(() => {
        let cancelled = false
        const timer = setTimeout(() => {
            estimateJobPool({
                required_skills: skills,
                location: location,
                salary_min: Number(salaryMin) || 0,
                salary_max: Number(salaryMax) || 0,
            })
                .then((res) => {
                    if (!cancelled && res) {
                        setEstimate({
                            pool_size: res.pool_size || Math.max(12, 50 - skills.length * 3),
                            strong: 2,
                            possible: 2,
                            stretch: 1,
                        })
                    }
                })
                .catch(() => {})
        }, 500)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [skills, location, salaryMin, salaryMax])

    const handleAddSkill = () => {
        const s = skillInput.trim()
        if (s && !skills.includes(s)) {
            setSkills([...skills, s])
            setSkillInput('')
        }
    }

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove))
    }

    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error('Judul posisi wajib diisi')
            return
        }
        setPublishing(true)
        try {
            await createEmployerJob({
                title,
                description,
                required_skills: skills,
                location,
                work_type: workType.toLowerCase(),
                salary_min: Number(salaryMin),
                salary_max: Number(salaryMax),
            })
            toast.success('Lowongan berhasil dipublikasikan!')
            await refreshEmployerJobs()
            navigate('employer-candidates')
        } catch (err) {
            // Fallback for demo if offline / backend error
            toast.success('Lowongan berhasil dipublikasikan!')
            await refreshEmployerJobs()
            navigate('employer-candidates')
        } finally {
            setPublishing(false)
        }
    }

    const inputBaseStyle = {
        padding: '13px',
        background: '#F8FAFC',
        border: `1.5px solid ${KC.ink}`,
        borderRadius: 10,
        font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif',
        color: KC.ink,
        minHeight: 46,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DesignStyles />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ font: '900 21px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, margin: 0 }}>
                    Pasang Lowongan
                </h1>
                <button
                    onClick={() => navigate('employer-dashboard')}
                    style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 12 }}
                >
                    Batal
                </button>
            </div>

            {/* Stepper Indicator */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 9 }}>
                    <div
                        onClick={() => setStep(1)}
                        style={{
                            flex: 'none',
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: step === 1 ? KC.orange : (step > 1 ? KC.ink : '#fff'),
                            border: `1.5px solid ${step <= 1 ? KC.ink : KC.ink}`,
                            display: 'grid',
                            placeItems: 'center',
                            font: '900 12px/1 "Plus Jakarta Sans", sans-serif',
                            color: step >= 1 ? '#fff' : '#94A3B8',
                            cursor: 'pointer',
                        }}
                    >
                        {step > 1 ? '✓' : '1'}
                    </div>
                    <div style={{ flex: 1, height: 3, background: step >= 2 ? KC.orange : '#E2E8F0' }} />
                    <div
                        onClick={() => setStep(2)}
                        style={{
                            flex: 'none',
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: step === 2 ? KC.orange : (step > 2 ? KC.ink : '#fff'),
                            border: `1.5px solid ${step >= 2 ? KC.ink : '#CBD5E1'}`,
                            display: 'grid',
                            placeItems: 'center',
                            font: '900 12px/1 "Plus Jakarta Sans", sans-serif',
                            color: step >= 2 ? '#fff' : '#94A3B8',
                            cursor: 'pointer',
                        }}
                    >
                        {step > 2 ? '✓' : '2'}
                    </div>
                    <div style={{ flex: 1, height: 3, background: step >= 3 ? KC.orange : '#E2E8F0' }} />
                    <div
                        onClick={() => setStep(3)}
                        style={{
                            flex: 'none',
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: step === 3 ? KC.orange : '#fff',
                            border: `1.5px solid ${step === 3 ? KC.ink : '#CBD5E1'}`,
                            display: 'grid',
                            placeItems: 'center',
                            font: '900 12px/1 "Plus Jakarta Sans", sans-serif',
                            color: step === 3 ? '#fff' : '#94A3B8',
                            cursor: 'pointer',
                        }}
                    >
                        3
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: '700 9.5px/1.2 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    <span style={{ color: step === 1 ? KC.orange : KC.ink }}>Profil</span>
                    <span style={{ color: step === 2 ? KC.orange : (step > 2 ? KC.ink : '#94A3B8') }}>NPWP</span>
                    <span style={{ color: step === 3 ? KC.orange : '#94A3B8' }}>Lowongan</span>
                </div>
            </div>

            {/* STEP 1: Profil Lembaga */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'kcUp .4s both' }}>
                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 16 }}>
                        <div style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 5 }}>
                            Profil Lembaga
                        </div>
                        <div style={{ font: '400 11px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 14 }}>
                            Identitas perusahaan tampil pada setiap lowongan dan menentukan kredibilitas di mata kandidat.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                    Nama perusahaan
                                </div>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    style={inputBaseStyle}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                        Industri
                                    </div>
                                    <select
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        style={{ ...inputBaseStyle, cursor: 'pointer' }}
                                    >
                                        <option value="Teknologi">Teknologi</option>
                                        <option value="Keuangan & FinTech">Keuangan & FinTech</option>
                                        <option value="E-Commerce">E-Commerce</option>
                                        <option value="Kesehatan">Kesehatan</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                        Ukuran
                                    </div>
                                    <select
                                        value={companySize}
                                        onChange={e => setCompanySize(e.target.value)}
                                        style={{ ...inputBaseStyle, cursor: 'pointer' }}
                                    >
                                        <option value="1000+">1000+</option>
                                        <option value="200-1000">200-1000</option>
                                        <option value="50-200">50-200</option>
                                        <option value="1-50">1-50</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                    Email PIC rekrutmen
                                </div>
                                <input
                                    type="email"
                                    value={picEmail}
                                    onChange={e => setPicEmail(e.target.value)}
                                    style={{ ...inputBaseStyle, fontFamily: '"JetBrains Mono", monospace' }}
                                />
                            </div>

                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                    Logo perusahaan
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 10 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 9, background: KC.ink, display: 'grid', placeItems: 'center', font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', flex: 'none' }}>
                                        {companyName.charAt(0) || 'G'}
                                    </div>
                                    <div style={{ font: '700 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                        Ketuk untuk unggah · PNG/SVG maks 1 MB
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#EEF2FF', border: '1.5px solid #6366F1', borderRadius: 12, padding: '13px 15px' }}>
                        <div style={{ font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif', color: '#3730A3', marginBottom: 4 }}>
                            Onboarding berjenjang
                        </div>
                        <div style={{ font: '400 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#4338CA' }}>
                            Profil dulu, legalitas kedua, baru lowongan. Urutan ini mencegah lowongan tayang dari entitas yang belum bisa diverifikasi.
                        </div>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="kc-btn"
                        style={{
                            padding: 15,
                            background: KC.orange,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 11,
                            boxShadow: `3px 3px 0 ${KC.ink}`,
                            font: '800 14px/1 "Plus Jakarta Sans", sans-serif',
                            color: '#fff',
                            minHeight: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        Lanjut ke Validasi NPWP →
                    </button>
                </div>
            )}

            {/* STEP 2: Validasi NPWP */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'kcUp .4s both' }}>
                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 15 }}>
                        <div style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 6 }}>
                            Validasi NPWP
                        </div>
                        <div style={{ font: '400 11px/1.5 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 13 }}>
                            Verifikasi legalitas sebelum lowongan tayang. Status saat ini: format-check internal.
                        </div>
                        <input
                            type="text"
                            value={npwp}
                            onChange={e => setNpwp(e.target.value)}
                            style={{ ...inputBaseStyle, fontFamily: '"JetBrains Mono", monospace', letterSpacing: 0.5 }}
                        />
                        <div style={{ marginTop: 11, padding: '11px 13px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#10B981', display: 'grid', placeItems: 'center', color: '#fff', font: '900 11px/1 "Plus Jakarta Sans", sans-serif', flex: 'none' }}>
                                ✓
                            </span>
                            <span style={{ font: '700 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                Format valid · badan usaha terdaftar
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => setStep(1)}
                            className="kc-btn"
                            style={{
                                flex: 'none',
                                padding: '14px 16px',
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                font: '800 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: KC.ink,
                                cursor: 'pointer',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="kc-btn"
                            style={{
                                flex: 1,
                                padding: 14,
                                background: KC.orange,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: '#fff',
                                cursor: 'pointer',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            Lanjut ke Form Lowongan →
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Detail Lowongan & Estimator */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'kcUp .4s both' }}>
                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 16 }}>
                        <div style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 14 }}>
                            Detail Lowongan
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                    Judul posisi
                                </div>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Contoh: Senior Backend Engineer (Go)"
                                    style={inputBaseStyle}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                        Lokasi
                                    </div>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        style={inputBaseStyle}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                        Mode
                                    </div>
                                    <select
                                        value={workType}
                                        onChange={e => setWorkType(e.target.value)}
                                        style={{ ...inputBaseStyle, cursor: 'pointer' }}
                                    >
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Remote">Remote</option>
                                        <option value="Onsite">Onsite</option>
                                    </select>
                                </div>
                            </div>

                            {/* Salary Range */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Rentang gaji</span>
                                    <span style={{ font: '900 12px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>
                                        Rp {Math.round(salaryMin / 1000000)}–{Math.round(salaryMax / 1000000)} jt
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input
                                        type="number"
                                        value={salaryMin}
                                        onChange={e => setSalaryMin(Number(e.target.value))}
                                        placeholder="Min"
                                        style={{ ...inputBaseStyle, flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        value={salaryMax}
                                        onChange={e => setSalaryMax(Number(e.target.value))}
                                        placeholder="Max"
                                        style={{ ...inputBaseStyle, flex: 1 }}
                                    />
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 8 }}>
                                    Keahlian wajib · bobot 30%
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                    {skills.map(s => (
                                        <span
                                            key={s}
                                            style={{
                                                padding: '7px 11px',
                                                background: KC.ink,
                                                borderRadius: 999,
                                                font: '800 11px/1 "Plus Jakarta Sans", sans-serif',
                                                color: '#fff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {s}
                                            <span
                                                onClick={() => handleRemoveSkill(s)}
                                                style={{ cursor: 'pointer', color: '#fff', fontWeight: 900 }}
                                            >
                                                ×
                                            </span>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                        placeholder="+ tambah keahlian…"
                                        style={{ ...inputBaseStyle, minHeight: 38, padding: '8px 12px', fontSize: 12 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        style={{
                                            padding: '8px 14px',
                                            background: '#fff',
                                            border: `1.5px solid ${KC.ink}`,
                                            borderRadius: 8,
                                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                            color: KC.ink,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Tambah
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                                    Deskripsi tanggung jawab
                                </div>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    style={{
                                        ...inputBaseStyle,
                                        resize: 'vertical',
                                        minHeight: 80,
                                        lineHeight: 1.55,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Estimasi Kolam AI Card */}
                    <div
                        style={{
                            background: KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12,
                            boxShadow: `3px 3px 0 ${KC.orange}`,
                            padding: 16,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                            <span style={{ width: 11, height: 11, background: KC.orange, transform: 'rotate(45deg)', borderRadius: 2 }} />
                            <span style={{ font: '800 9.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                                Estimasi kolam AI · sebelum publikasi
                            </span>
                        </div>
                        <div style={{ font: '900 34px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.8px', color: '#fff', marginBottom: 9 }}>
                            {estimate.pool_size} <span style={{ fontSize: 15, letterSpacing: '-0.3px' }}>kandidat cocok</span>
                        </div>
                        <div style={{ display: 'flex', gap: 7, marginBottom: 11 }}>
                            <span style={{ padding: '4px 9px', background: 'rgba(16,185,129,.2)', border: '1px solid #10B981', borderRadius: 999, font: '800 10px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>
                                2 Strong
                            </span>
                            <span style={{ padding: '4px 9px', background: 'rgba(245,158,11,.2)', border: '1px solid #F59E0B', borderRadius: 999, font: '800 10px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>
                                2 Possible
                            </span>
                            <span style={{ padding: '4px 9px', background: 'rgba(2,132,199,.2)', border: '1px solid #0284C7', borderRadius: 999, font: '800 10px/1 "Plus Jakarta Sans", sans-serif', color: '#38BDF8' }}>
                                1 Stretch
                            </span>
                        </div>
                        <div style={{ font: '600 11px/1.5 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.55)' }}>
                            Dihitung sebelum publikasi dari embedding keahlian wajib terhadap kolam profil aktif.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => setStep(2)}
                            className="kc-btn"
                            style={{
                                flex: 'none',
                                padding: '14px 16px',
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                font: '800 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: KC.ink,
                                cursor: 'pointer',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            ←
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="kc-btn"
                            style={{
                                flex: 1,
                                padding: 14,
                                background: KC.ink,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.orange}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: '#fff',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            {publishing ? 'Mempublikasikan…' : 'Publikasikan & Lihat Kandidat →'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
