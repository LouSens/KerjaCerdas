/**
 * OnboardingWizard — 3-step interactive onboarding matching Mobile Frames 01, 02, and 03.
 *
 * Langkah 1: Identitas & Target (Nama, Posisi, Domisili, Mode Kerja)
 * Langkah 2: Unggah CV (Gemini PDF parsing & auto-ekstraksi kompetensi)
 * Langkah 3: Konfirmasi & Ekspektasi Gaji (Review, Slider Gaji, Pratinjau Hasil)
 */
import { useState } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles } from './_design'
import { updateSeekerProfile } from '../services/api'
import toast from 'react-hot-toast'
import { FileUp, CheckCircle2, ChevronRight, ArrowRight, ArrowLeft, UploadCloud, X, Plus } from 'lucide-react'

export default function OnboardingWizard({ onClose, isPage = false }) {
    const { user, profile, uploadResume, cvUploading, seekerId, runAgent, navigate, loadSeekerProfile } = useStore()
    const [step, setStep] = useState(1) // 1, 2, or 3

    // Step 1 Form
    const [fullName, setFullName] = useState(profile?.full_name || user?.name || 'Budi Santoso')
    const [targetPosition, setTargetPosition] = useState(profile?.headline || 'Backend Engineer')
    const [region, setRegion] = useState('Jakarta')
    const [workModes, setWorkModes] = useState(['Hybrid', 'Remote'])

    // Step 2 Upload state
    const [parsedResult, setParsedResult] = useState(null)
    const [fileName, setFileName] = useState('CV_BudiSantoso.pdf')

    // Step 3 Form
    const [salaryRange, setSalaryRange] = useState({ min: 28, max: 40 })
    const [detectedSkills, setDetectedSkills] = useState(
        (profile?.skills || ['Go', 'PostgreSQL', 'Docker', 'gRPC']).map(s => typeof s === 'string' ? s : s.name)
    )
    const [newSkill, setNewSkill] = useState('')
    const [showAddSkill, setShowAddSkill] = useState(false)
    const [saving, setSaving] = useState(false)

    const toggleWorkMode = (mode) => {
        setWorkModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])
    }

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas wajib PDF')
            return
        }
        setFileName(file.name)
        try {
            const res = await uploadResume(file)
            setParsedResult({
                name: res?.profile?.full_name || fullName,
                headline: res?.profile?.headline || targetPosition,
                skills: res?.profile?.skills?.map(s => typeof s === 'string' ? s : s.name) || detectedSkills,
                experienceCount: res?.profile?.experience?.length || 2,
            })
            if (res?.profile?.skills) {
                setDetectedSkills(res.profile.skills.map(s => typeof s === 'string' ? s : s.name))
            }
            toast.success('CV berhasil diurai oleh AI Gemini!')
        } catch (e) {
            toast.error('Gagal membaca PDF: ' + e.message)
        }
    }

    const addCustomSkill = () => {
        const s = newSkill.trim()
        if (s && !detectedSkills.includes(s)) {
            setDetectedSkills(prev => [...prev, s])
            setNewSkill('')
            setShowAddSkill(false)
        }
    }

    const handleComplete = async () => {
        setSaving(true)
        try {
            await updateSeekerProfile({
                full_name: fullName,
                headline: targetPosition,
                region_code: region === 'Jakarta' ? '3171' : '3273',
                salary_expectation_min: salaryRange.min * 1_000_000,
                salary_expectation_max: salaryRange.max * 1_000_000,
                skills: detectedSkills.map(name => ({ name, level: 'intermediate', years: 3 })),
            })
            await loadSeekerProfile()
            toast.success('Profil onboarding disimpan!')
            // Trigger match calculation
            runAgent({ explicitIntent: 'match_jobs' })
            if (onClose) onClose()
            navigate('seeker-dashboard')
        } catch (e) {
            toast.error('Gagal menyimpan: ' + e.message)
            if (onClose) onClose()
            navigate('seeker-dashboard')
        } finally {
            setSaving(false)
        }
    }

    const content = (
        <div style={{
            width: '100%', maxWidth: 440, background: '#FAF9F5',
            border: `2px solid ${KC.ink}`, borderRadius: 20,
            boxShadow: `6px 6px 0 ${KC.ink}`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '92vh',
        }}>
            {/* Top Bar Header */}
            <div style={{
                padding: '14px 18px', borderBottom: `1.5px solid ${KC.ink}`,
                background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: 7, background: KC.orange,
                        border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                        color: '#fff', fontWeight: 900, fontSize: 13, transform: 'rotate(-3deg)',
                    }}>
                        K
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 15, color: KC.ink }}>
                        kerja<span style={{ color: KC.orange }}>cerdas</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 800,
                        fontSize: 10, color: KC.mute, letterSpacing: 0.5,
                    }}>
                        LANGKAH {step}/3
                    </span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 2, color: KC.mute, display: 'grid', placeItems: 'center',
                            }}
                            title="Tutup Onboarding"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper progress bars */}
            <div style={{ display: 'flex', gap: 5, padding: '10px 18px 0', background: '#FAF9F5' }}>
                <div style={{ flex: 1, height: 5, background: step >= 1 ? KC.orange : '#E2E8F0', borderRadius: 999, transition: 'background .3s' }} />
                <div style={{ flex: 1, height: 5, background: step >= 2 ? KC.orange : '#E2E8F0', borderRadius: 999, transition: 'background .3s' }} />
                <div style={{ flex: 1, height: 5, background: step >= 3 ? KC.orange : '#E2E8F0', borderRadius: 999, transition: 'background .3s' }} />
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '16px 18px 24px', overflowY: 'auto', flex: 1 }}>
                {/* ══════════ STEP 1: IDENTITAS & TARGET ══════════ */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div>
                            <h1 style={{ fontSize: 23, fontWeight: 900, letterSpacing: -1, margin: '4px 0 6px', color: KC.ink, lineHeight: 1.2 }}>
                                Kenalan dulu, {fullName.split(' ')[0] || 'Teman'}.
                            </h1>
                            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#64748B', margin: 0 }}>
                                Tiga data ini yang dipakai mesin pencocokan untuk membatasi kolam lowongan sebelum analisis semantik jalan.
                            </p>
                        </div>

                        {/* Identity Card */}
                        <div style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                        }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                                    Nama lengkap
                                </label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nama Anda"
                                    style={{
                                        width: '100%', padding: '12px 13px', background: '#F8FAFC',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                        fontSize: 12.5, fontWeight: 700, color: KC.ink,
                                        boxSizing: 'border-box', outline: 'none',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                                    Posisi yang dicari
                                </label>
                                <input
                                    value={targetPosition}
                                    onChange={(e) => setTargetPosition(e.target.value)}
                                    placeholder="Contoh: Backend Engineer"
                                    style={{
                                        width: '100%', padding: '12px 13px', background: '#F8FAFC',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                        fontSize: 12.5, fontWeight: 700, color: KC.ink,
                                        boxSizing: 'border-box', outline: 'none',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                                    Domisili
                                </label>
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 13px', background: '#F8FAFC',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                        fontSize: 12.5, fontWeight: 700, color: KC.ink,
                                        boxSizing: 'border-box', outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="Jakarta">Jakarta</option>
                                    <option value="Bandung">Bandung</option>
                                    <option value="Surabaya">Surabaya</option>
                                    <option value="Yogyakarta">Yogyakarta</option>
                                    <option value="Denpasar">Denpasar</option>
                                </select>
                            </div>
                        </div>

                        {/* Work Mode Card */}
                        <div style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: 16,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                Mode kerja yang diterima
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94A3B8', marginBottom: 11, lineHeight: 1.45 }}>
                                Bobot 10% pada skor akhir. Pilih lebih dari satu untuk memperluas kolam.
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                {['Hybrid', 'Remote', 'Onsite'].map(mode => {
                                    const active = workModes.includes(mode)
                                    return (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => toggleWorkMode(mode)}
                                            style={{
                                                padding: '9px 13px', minHeight: 38,
                                                background: active ? KC.ink : '#FEF3C7',
                                                border: `1.5px solid ${active ? KC.ink : '#F59E0B'}`,
                                                borderRadius: 999, fontSize: 12, fontWeight: 800,
                                                color: active ? '#FFFFFF' : '#B45309',
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Info Note Callout */}
                        <div style={{
                            background: '#EEF2FF', border: '1.5px solid #6366F1',
                            borderRadius: 12, padding: '13px 15px',
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#3730A3', marginBottom: 4 }}>
                                Kenapa data ini diminta lebih dulu?
                            </div>
                            <div style={{ fontSize: 11, color: '#4338CA', lineHeight: 1.5 }}>
                                Tanpa domisili dan target posisi, pencarian vektor berjalan pada seluruh korpus dan hasilnya melebar. Ini menghemat biaya inferensi dan mempertajam peringkat.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            style={{
                                padding: 15, background: KC.orange, border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`,
                                fontSize: 14, fontWeight: 800, color: '#fff',
                                minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', width: '100%',
                            }}
                        >
                            Lanjut ke Unggah CV →
                        </button>
                    </div>
                )}

                {/* ══════════ STEP 2: UNGGAH CV ══════════ */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div>
                            <h1 style={{ fontSize: 23, fontWeight: 900, letterSpacing: -1, margin: '4px 0 6px', color: KC.ink, lineHeight: 1.2 }}>
                                Unggah CV, sisanya AI yang isi.
                            </h1>
                            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#64748B', margin: 0 }}>
                                Gemini mengekstrak keahlian, pengalaman, dan pendidikan dari PDF Anda dalam hitungan detik.
                            </p>
                        </div>

                        {/* Upload Dropzone Box */}
                        <label style={{
                            display: 'block', background: '#FFFFFF', border: `1.5px dashed ${KC.ink}`,
                            borderRadius: 14, boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: '24px 18px', textAlign: 'center', cursor: cvUploading ? 'wait' : 'pointer',
                        }}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                style={{ display: 'none' }}
                                disabled={cvUploading}
                            />
                            <div style={{
                                width: 50, height: 50, margin: '0 auto 12px', borderRadius: 13,
                                background: '#FFF1EB', border: `1.5px solid ${KC.orange}`,
                                display: 'grid', placeItems: 'center', color: KC.orange,
                            }}>
                                <UploadCloud size={24} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: KC.ink, marginBottom: 4 }}>
                                {cvUploading ? 'Mengurai PDF dengan Gemini…' : 'Ketuk untuk pilih berkas PDF'}
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                Maks 5 MB · hanya PDF · divalidasi header %PDF-
                            </div>
                            <div style={{
                                marginTop: 14, padding: '11px 18px', background: cvUploading ? '#64748B' : KC.orange,
                                color: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 13, fontWeight: 800,
                                minHeight: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {cvUploading ? 'Memproses Berkas…' : parsedResult ? 'Ganti Berkas CV' : 'Pilih Berkas CV'}
                            </div>
                        </label>

                        {/* Parse result card */}
                        {parsedResult ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{
                                    background: '#ECFDF5', border: '1.5px solid #10B981',
                                    borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11,
                                }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%', background: '#10B981',
                                        display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 900,
                                        flexShrink: 0,
                                    }}>
                                        ✓
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065F46' }}>
                                            {fileName} terurai
                                        </div>
                                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#059669', marginTop: 2 }}>
                                            184 ms · {detectedSkills.length} keahlian · 2 pengalaman
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                                    padding: 15,
                                }}>
                                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, color: '#64748B', marginBottom: 11 }}>
                                        Hasil ekstraksi · bisa diedit
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #E2E8F0' }}>
                                            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Nama</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 800, color: KC.ink }}>{fullName}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #E2E8F0' }}>
                                            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Posisi terakhir</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 800, color: KC.ink }}>{targetPosition}</span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginBottom: 7 }}>
                                                Keahlian terdeteksi
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                {detectedSkills.map(s => (
                                                    <span key={s} style={{
                                                        padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981',
                                                        borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#065F46',
                                                    }}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                background: '#EEF2FF', border: '1.5px solid #6366F1',
                                borderRadius: 12, padding: '13px 15px',
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#3730A3', marginBottom: 4 }}>
                                    Tidak punya CV digital?
                                </div>
                                <div style={{ fontSize: 11, color: '#4338CA', lineHeight: 1.5 }}>
                                    Isi keahlian manual — sistem tetap mencocokkan dari seluruh profil yang tersedia.
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{
                                    padding: '13px 16px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 13,
                                    fontWeight: 800, color: KC.ink, cursor: 'pointer',
                                }}
                            >
                                ←
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                style={{
                                    flex: 1, padding: 14, background: parsedResult ? KC.ink : KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                                    boxShadow: parsedResult ? `3px 3px 0 ${KC.orange}` : `3px 3px 0 ${KC.ink}`,
                                    fontSize: 13.5, fontWeight: 800, color: '#fff',
                                    minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                {parsedResult ? 'Lanjut ke Langkah 3 →' : 'Lanjut Tanpa Upload →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════ STEP 3: KONFIRMASI & EKSPEKTASI ══════════ */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div>
                            <h1 style={{ fontSize: 23, fontWeight: 900, letterSpacing: -1, margin: '4px 0 6px', color: KC.ink, lineHeight: 1.2 }}>
                                Periksa sebelum dicocokkan.
                            </h1>
                            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: '#64748B', margin: 0 }}>
                                Semua bisa diedit nanti dari profil. Ekspektasi gaji hanya berbobot 5% — tidak akan mengeliminasi lowongan.
                            </p>
                        </div>

                        {/* Summary Card */}
                        <div style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: 16,
                        }}>
                            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, color: '#64748B', marginBottom: 12 }}>
                                Ringkasan profil
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #E2E8F0' }}>
                                    <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Nama</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: KC.ink }}>{fullName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #E2E8F0' }}>
                                    <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Target posisi</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: KC.ink }}>{targetPosition}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed #E2E8F0' }}>
                                    <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Mode kerja</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: KC.ink }}>{workModes.join(', ') || 'Semua mode'}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginBottom: 7 }}>
                                        Keahlian dari CV ({detectedSkills.length})
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                        {detectedSkills.map(s => (
                                            <span key={s} style={{
                                                padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981',
                                                borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#065F46',
                                            }}>
                                                {s}
                                            </span>
                                        ))}
                                        {showAddSkill ? (
                                            <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                                <input
                                                    value={newSkill}
                                                    onChange={e => setNewSkill(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                                                    placeholder="Keahlian..."
                                                    style={{ padding: '3px 8px', borderRadius: 999, border: `1px solid ${KC.ink}`, fontSize: 11, outline: 'none' }}
                                                    autoFocus
                                                />
                                                <button onClick={addCustomSkill} style={{ border: 'none', background: KC.orange, color: '#fff', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, fontWeight: 900 }}>✓</button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddSkill(true)}
                                                style={{
                                                    padding: '4px 9px', background: '#fff', border: '1.5px dashed #CBD5E1',
                                                    borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#94A3B8',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                + tambah
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Expectation Card */}
                        <div style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>
                                    Ekspektasi gaji per bulan
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 900, color: KC.orange }}>
                                    Rp {salaryRange.min}–{salaryRange.max} jt
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                                <input
                                    type="range"
                                    min="10"
                                    max="50"
                                    value={salaryRange.min}
                                    onChange={(e) => {
                                        const v = Number(e.target.value)
                                        setSalaryRange(prev => ({ ...prev, min: v, max: Math.max(v + 5, prev.max) }))
                                    }}
                                    style={{ flex: 1, accentColor: KC.orange }}
                                />
                                <input
                                    type="range"
                                    min="20"
                                    max="70"
                                    value={salaryRange.max}
                                    onChange={(e) => {
                                        const v = Number(e.target.value)
                                        setSalaryRange(prev => ({ ...prev, max: Math.max(v, prev.min + 5) }))
                                    }}
                                    style={{ flex: 1, accentColor: KC.orange }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>
                                <span>Rp 10 jt</span>
                                <span>Rp 70 jt</span>
                            </div>
                        </div>

                        {/* Preview Banner */}
                        <div style={{
                            background: '#090A0F', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12, boxShadow: `3px 3px 0 ${KC.orange}`,
                            padding: 15,
                        }}>
                            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 7 }}>
                                Pratinjau hasil
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.35 }}>
                                5 lowongan cocok siap ditampilkan — 2 Strong Fit, rata-rata skor 87%.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                style={{
                                    padding: '13px 16px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 13,
                                    fontWeight: 800, color: KC.ink, cursor: 'pointer',
                                }}
                            >
                                ←
                            </button>
                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={saving}
                                style={{
                                    flex: 1, padding: 14, background: KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                                    boxShadow: `3px 3px 0 ${KC.ink}`, fontSize: 13.5,
                                    fontWeight: 800, color: '#fff', minHeight: 48,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: saving ? 'wait' : 'pointer',
                                }}
                            >
                                {saving ? 'Menyimpan Profil…' : 'Selesai · Buka Dashboard →'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    if (isPage) {
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px 14px', background: '#EDEAE2' }}>
                <DesignStyles />
                {content}
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(9,10,15,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, overflowY: 'auto',
        }}>
            <DesignStyles />
            {content}
        </div>
    )
}
