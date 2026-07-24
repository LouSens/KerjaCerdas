import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, FilledStat, DesignStyles } from './_design'
import { updateSeekerProfile } from '../services/api'
import toast from 'react-hot-toast'

export default function CVUploader() {
    const { uploadResume, cvUploading, seekerId, profile, navigate, loadSeekerProfile } = useStore()
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const [fileMeta, setFileMeta] = useState(null)
    const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'manual'

    const [manualForm, setManualForm] = useState({
        full_name: profile?.full_name || '',
        nik: profile?.nik || '',
        date_of_birth: profile?.date_of_birth || '',
        region_code: profile?.region_code || '3171',
        skillInput: '',
        skills: (profile?.skills || []).map(s => s.name || s),
        headline: profile?.headline || '',
        salary_expectation_min: profile?.salary_expectation_min || '',
        salary_expectation_max: profile?.salary_expectation_max || '',
        experience: profile?.experience || [],
        education: profile?.education || [],
    })

    const [expForm, setExpForm] = useState({
        company: '', title: '', start_date: '', end_date: '', description: ''
    })
    const [eduForm, setEduForm] = useState({
        institution: '', degree: 'S1', major: '', graduation_year: 2024
    })

    const [manualSaving, setManualSaving] = useState(false)

    // Sync manualForm whenever profile changes (e.g. after upload or load)
    useEffect(() => {
        if (profile) {
            setManualForm({
                full_name: profile.full_name || '',
                nik: profile.nik || '',
                date_of_birth: profile.date_of_birth || '',
                region_code: profile.region_code || '3171',
                skillInput: '',
                skills: (profile.skills || []).map(s => s.name || s),
                headline: profile.headline || '',
                salary_expectation_min: profile.salary_expectation_min || '',
                salary_expectation_max: profile.salary_expectation_max || '',
                experience: profile.experience || [],
                education: profile.education || [],
            })
        }
    }, [profile])

    const handleManualSave = async () => {
        setManualSaving(true)
        try {
            await updateSeekerProfile({
                full_name: manualForm.full_name,
                nik: manualForm.nik,
                date_of_birth: manualForm.date_of_birth,
                region_code: manualForm.region_code,
                headline: manualForm.headline,
                skills: manualForm.skills.map(name => ({ name, level: 'intermediate', years: 0 })),
                salary_expectation_min: Number(manualForm.salary_expectation_min) || 0,
                salary_expectation_max: Number(manualForm.salary_expectation_max) || 0,
                experience: manualForm.experience,
                education: manualForm.education,
            })
            await loadSeekerProfile()
            toast.success('Profil tersimpan!')
        } catch (e) {
            toast.error('Gagal simpan: ' + e.message)
        } finally {
            setManualSaving(false)
        }
    }

    const addSkill = () => {
        const s = manualForm.skillInput.trim()
        if (s && !manualForm.skills.includes(s)) {
            setManualForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }))
        }
    }
    const removeSkill = (s) => setManualForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))

    const addExperience = () => {
        if (expForm.company && expForm.title) {
            setManualForm(prev => ({
                ...prev,
                experience: [...prev.experience, { ...expForm }]
            }))
            setExpForm({ company: '', title: '', start_date: '', end_date: '', description: '' })
        } else {
            toast.error('Perusahaan dan posisi wajib diisi')
        }
    }
    const removeExperience = (index) => {
        setManualForm(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }))
    }

    const addEducation = () => {
        if (eduForm.institution && eduForm.major) {
            setManualForm(prev => ({
                ...prev,
                education: [...prev.education, { ...eduForm }]
            }))
            setEduForm({ institution: '', degree: 'S1', major: '', graduation_year: 2024 })
        } else {
            toast.error('Institusi dan jurusan wajib diisi')
        }
    }
    const removeEducation = (index) => {
        setManualForm(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }))
    }

    // If user already has a seekerId (from a previous CV upload), reload their
    // profile from the backend so we always show fresh stats.
    useEffect(() => {
        if (seekerId) loadSeekerProfile()
    }, [seekerId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleFile = (file) => {
        if (!file) return
        setFileMeta({ name: file.name, size: file.size })
        uploadResume(file)
    }

    const skillsCount = profile?.skills?.length ?? 0
    const expCount = profile?.experience?.length ?? 0
    const eduCount = profile?.education?.length ?? 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        Upload CV
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Upload sekali, AI kami langsung kenali skill, pengalaman, dan ekspektasi gajimu.
                    </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    🤖 Didukung AI
                </div>
            </header>

            {/* ── Tab switcher ───────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 0, border: `2px solid ${KC.ink}`, borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start' }}>
                {[['upload', '📄 Upload PDF'], ['manual', '✏️ Isi Manual']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                        background: activeTab === tab ? KC.ink : '#fff',
                        color: activeTab === tab ? '#fff' : KC.ink,
                        border: 'none', fontFamily: 'inherit',
                    }}>{label}</button>
                ))}
            </div>

            {activeTab === 'manual' && (
                <BrutalCard color="#fff" padding={28}>
                    <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: '0 0 20px' }}>Isi Profil Manual</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Nama Lengkap</label>
                                <input value={manualForm.full_name} onChange={e => setManualForm(p => ({ ...p, full_name: e.target.value }))}
                                    placeholder="Contoh: Budi Santoso" style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Kode Wilayah / Kota</label>
                                <input value={manualForm.region_code} onChange={e => setManualForm(p => ({ ...p, region_code: e.target.value }))}
                                    placeholder="Contoh: 3171" style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>NIK (Opsional)</label>
                                <input value={manualForm.nik} onChange={e => setManualForm(p => ({ ...p, nik: e.target.value }))}
                                    placeholder="Contoh: 31710..." style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Tanggal Lahir</label>
                                <input type="date" value={manualForm.date_of_birth} onChange={e => setManualForm(p => ({ ...p, date_of_birth: e.target.value }))}
                                    style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Headline / Posisi Saat Ini</label>
                            <input
                                value={manualForm.headline}
                                onChange={e => setManualForm(p => ({ ...p, headline: e.target.value }))}
                                placeholder="Contoh: Senior Backend Engineer · 5 tahun di fintech"
                                style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Skills ({manualForm.skills.length} ditambahkan)</label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <input
                                    value={manualForm.skillInput}
                                    onChange={e => setManualForm(p => ({ ...p, skillInput: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    placeholder="Ketik skill lalu tekan Enter…"
                                    style={{ flex: 1, padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
                                />
                                <button onClick={addSkill} style={{ padding: '10px 16px', background: KC.cyan, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: `2px 2px 0 ${KC.ink}` }}>+ Tambah</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {manualForm.skills.map(s => (
                                    <button key={s} onClick={() => removeSkill(s)} style={{ padding: '6px 12px', background: KC.lime, border: `1.5px solid ${KC.ink}`, borderRadius: 999, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `1px 1px 0 ${KC.ink}` }}>
                                        {s} ×
                                    </button>
                                ))}
                                {manualForm.skills.length === 0 && <span style={{ fontSize: 12, color: KC.mute, fontWeight: 600 }}>Belum ada skill — tambahkan di atas</span>}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Ekspektasi Gaji Min (Rp)</label>
                                <input type="number" value={manualForm.salary_expectation_min} onChange={e => setManualForm(p => ({ ...p, salary_expectation_min: e.target.value }))}
                                    placeholder="Contoh: 15000000" style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }}>Ekspektasi Gaji Max (Rp)</label>
                                <input type="number" value={manualForm.salary_expectation_max} onChange={e => setManualForm(p => ({ ...p, salary_expectation_max: e.target.value }))}
                                    placeholder="Contoh: 25000000" style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        {/* ── Experience Section ── */}
                        <div style={{ borderTop: `2px solid ${KC.ink}`, paddingTop: 20, marginTop: 10 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 12px' }}>Pengalaman Kerja ({manualForm.experience.length})</h3>
                            
                            {/* Experience List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
                                {manualForm.experience.map((exp, index) => (
                                    <div key={index} style={{ padding: 12, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10, position: 'relative' }}>
                                        <button onClick={() => removeExperience(index)} style={{ position: 'absolute', top: 8, right: 8, background: KC.orangeSoft, border: `1.5px solid ${KC.ink}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Hapus</button>
                                        <div style={{ fontWeight: 800, fontSize: 14 }}>{exp.title}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: KC.mute }}>{exp.company} · {exp.start_date} s/d {exp.end_date || 'Sekarang'}</div>
                                        {exp.description && <div style={{ fontSize: 11, marginTop: 4 }}>{exp.description}</div>}
                                    </div>
                                ))}
                                {manualForm.experience.length === 0 && <span style={{ fontSize: 12, color: KC.mute, fontWeight: 600 }}>Belum ada pengalaman kerja</span>}
                            </div>

                            {/* Add Experience Form */}
                            <div style={{ background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontWeight: 900, fontSize: 12 }}>+ Tambah Pengalaman Baru</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <input value={expForm.company} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} placeholder="Nama Perusahaan" style={miniInput} />
                                    <input value={expForm.title} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} placeholder="Posisi / Jabatan" style={miniInput} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: KC.mute, display: 'block', marginBottom: 2 }}>Mulai (YYYY-MM)</span>
                                        <input value={expForm.start_date} onChange={e => setExpForm(p => ({ ...p, start_date: e.target.value }))} placeholder="Contoh: 2022-01" style={miniInput} />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: KC.mute, display: 'block', marginBottom: 2 }}>Selesai (YYYY-MM atau kosong)</span>
                                        <input value={expForm.end_date} onChange={e => setExpForm(p => ({ ...p, end_date: e.target.value }))} placeholder="Contoh: 2023-05" style={miniInput} />
                                    </div>
                                </div>
                                <input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat pencapaian / tugas..." style={miniInput} />
                                <button onClick={addExperience} style={miniBtn(KC.cyan)}>Tambah Pengalaman</button>
                            </div>
                        </div>

                        {/* ── Education Section ── */}
                        <div style={{ borderTop: `2px solid ${KC.ink}`, paddingTop: 20, marginTop: 10 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 12px' }}>Riwayat Pendidikan ({manualForm.education.length})</h3>

                            {/* Education List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
                                {manualForm.education.map((edu, index) => (
                                    <div key={index} style={{ padding: 12, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10, position: 'relative' }}>
                                        <button onClick={() => removeEducation(index)} style={{ position: 'absolute', top: 8, right: 8, background: KC.orangeSoft, border: `1.5px solid ${KC.ink}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Hapus</button>
                                        <div style={{ fontWeight: 800, fontSize: 14 }}>{edu.degree} {edu.major}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: KC.mute }}>{edu.institution} · Lulus {edu.graduation_year}</div>
                                    </div>
                                ))}
                                {manualForm.education.length === 0 && <span style={{ fontSize: 12, color: KC.mute, fontWeight: 600 }}>Belum ada riwayat pendidikan</span>}
                            </div>

                            {/* Add Education Form */}
                            <div style={{ background: '#fff', border: `2px dashed ${KC.ink}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontWeight: 900, fontSize: 12 }}>+ Tambah Pendidikan Baru</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <input value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} placeholder="Nama Sekolah / Universitas" style={miniInput} />
                                    <input value={eduForm.major} onChange={e => setEduForm(p => ({ ...p, major: e.target.value }))} placeholder="Jurusan" style={miniInput} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <select value={eduForm.degree} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} style={miniInput}>
                                        {['SMA', 'D3', 'D4', 'S1', 'S2', 'S3'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <input type="number" value={eduForm.graduation_year} onChange={e => setEduForm(p => ({ ...p, graduation_year: Number(e.target.value) || 2024 }))} placeholder="Tahun Kelulusan" style={miniInput} />
                                </div>
                                <button onClick={addEducation} style={miniBtn(KC.cyan)}>Tambah Pendidikan</button>
                            </div>
                        </div>

                        <button onClick={handleManualSave} disabled={manualSaving} style={{
                            padding: '14px 20px', background: KC.orange, color: '#fff',
                            border: `2px solid ${KC.ink}`, borderRadius: 12, fontWeight: 900,
                            fontSize: 15, cursor: manualSaving ? 'wait' : 'pointer',
                            boxShadow: `4px 4px 0 ${KC.ink}`, opacity: manualSaving ? 0.7 : 1,
                            fontFamily: 'inherit', alignSelf: 'flex-start', marginTop: 10
                        }}>
                            {manualSaving ? 'Menyimpan…' : 'Simpan Profil →'}
                        </button>
                    </div>
                </BrutalCard>
            )}

            {activeTab === 'upload' && (<>
                {/* ── Upload dropzone ───────────────────────────────────────── */}
                <BrutalCard color="#fff" padding={0} style={{ overflow: 'hidden' }}>
                    <div
                        onClick={() => !cvUploading && inputRef.current?.click()}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        style={{
                            padding: '48px 28px', textAlign: 'center',
                            background: dragOver ? KC.lime : cvUploading ? KC.bone : '#fff',
                            cursor: cvUploading ? 'wait' : 'pointer',
                            borderBottom: `2px dashed ${KC.ink}`,
                            transition: 'background .15s ease',
                        }}
                    >
                        {cvUploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div className="kc-spin" style={{ width: 48, height: 48, borderWidth: 5 }} />
                                <Tag color={KC.yellow}>Sedang dianalisis…</Tag>
                                <p style={{ fontSize: 14, fontWeight: 800, color: KC.ink, margin: 0 }}>
                                    AI kami sedang membaca CV dan mengenali profilmu
                                </p>
                                <p style={{ fontSize: 12, color: KC.mute, margin: 0 }}>
                                    {fileMeta ? fileMeta.name : 'Sebentar lagi selesai…'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 88, height: 88, background: KC.cyan,
                                    border: `3px solid ${KC.ink}`, borderRadius: 18,
                                    display: 'grid', placeItems: 'center',
                                    boxShadow: `6px 6px 0 ${KC.ink}`,
                                    transform: `rotate(${dragOver ? '4deg' : '-4deg'})`,
                                    transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)',
                                    fontSize: 40,
                                }}>
                                    📄
                                </div>
                                <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, margin: '8px 0 4px' }}>
                                    {dragOver ? 'Lepas di sini!' : 'Drop CV atau klik untuk pilih file'}
                                </h2>
                                <p style={{ fontSize: 13, color: KC.mute, margin: 0 }}>
                                    PDF · maks 10 MB · Bahasa Indonesia atau English
                                </p>
                                <button className="kc-btn" style={{
                                    marginTop: 8, padding: '12px 24px', background: KC.orange, color: '#fff',
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 14,
                                    cursor: 'pointer', boxShadow: `4px 4px 0 ${KC.ink}`,
                                }}>
                                    Pilih File →
                                </button>
                            </div>
                        )}
                        <input ref={inputRef} type="file" accept=".pdf" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>

                    {/* Pipeline strip below dropzone */}
                    <div style={{ padding: '20px 24px', background: KC.bone }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 12 }}>
                            Apa yang terjadi setelah kamu upload
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
                            {[
                                { icon: '🔍', label: 'Baca dokumen' },
                                { icon: '🧠', label: 'Kenali skill' },
                                { icon: '📊', label: 'Analisis profil' },
                                { icon: '✅', label: 'Siap dicocokkan' },
                            ].map((s, i) => (
                                <div key={i} className="kc-card" style={{ padding: 12, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 10 }}>
                                    <div style={{ fontSize: 18 }}>{s.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </BrutalCard>

                {/* ── Right rail: status + tips ─────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {seekerId ? (
                        <BrutalCard color={KC.lime} padding={18}>
                            <Tag color={KC.ink} ink="#fff" size="sm">✓ CV Berhasil Dianalisis</Tag>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '10px 0 4px', letterSpacing: -0.4 }}>
                                Profilmu sudah siap!
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
                                <Mini label="Keahlian" value={skillsCount} />
                                <Mini label="Pengalaman" value={expCount} />
                                <Mini label="Pendidikan" value={eduCount} />
                            </div>
                            <button className="kc-btn" onClick={() => navigate('seeker-match')} style={{
                                marginTop: 14, width: '100%', padding: '10px', background: KC.ink, color: '#fff',
                                border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13,
                                cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.orange}`,
                            }}>
                                Lihat Top-5 Match →
                            </button>
                        </BrutalCard>
                    ) : (
                        <BrutalCard color={KC.orange} padding={18} style={{ color: '#fff' }}>
                            <div style={{ fontSize: 24 }}>✨</div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 6px' }}>
                                Belum upload CV
                            </h3>
                            <p style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5, margin: 0 }}>
                                Tanpa CV, AI cuma bisa nebak dari profil kosong. Upload sekali, dapet top-5 match selamanya.
                            </p>
                        </BrutalCard>
                    )}

                    <BrutalCard color="#fff" padding={18}>
                        <Tag color={KC.cyan} size="sm">Tips</Tag>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: '10px 0 10px' }}>
                            Supaya hasilnya lebih akurat
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                'Gunakan file PDF (bukan foto atau scan gambar).',
                                'Cantumkan skill dan keahlian secara lengkap.',
                                'Sertakan lama pengalaman di setiap posisi.',
                                'Tambahkan kota domisili dan ekspektasi gaji jika ada.',
                            ].map((t, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, fontWeight: 600, color: KC.ink, lineHeight: 1.5 }}>
                                    <span style={{ width: 18, height: 18, borderRadius: 5, background: KC.lime, border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                                    <span>{t}</span>
                                </li>
                            ))}
                        </ul>
                    </BrutalCard>

                    <BrutalCard color={KC.ink} padding={16} style={{ color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>🔒</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800 }}>CV-mu aman & terlindungi</div>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginTop: 2 }}>
                                    Data kamu tidak dibagikan ke perusahaan manapun tanpa izinmu
                                </div>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </>)}
        </div>
    )
}

function Mini({ label, value }) {
    return (
        <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: KC.ink }}>{value}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: KC.mute, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
        </div>
    )
}

const miniInput = {
    padding: '8px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`,
    borderRadius: 8, fontSize: 12, fontWeight: 600, width: '100%',
    boxSizing: 'border-box', fontFamily: 'inherit'
}
const miniBtn = (bg) => ({
    padding: '8px 14px', background: bg, border: `2px solid ${KC.ink}`,
    borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', boxShadow: `2px 2px 0 ${KC.ink}`, alignSelf: 'flex-start'
})
