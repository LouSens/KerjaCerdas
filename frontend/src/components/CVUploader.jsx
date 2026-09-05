import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, FilledStat, topBtn, DesignStyles } from './_design'
import { updateSeekerProfile } from '../services/api'
import toast from 'react-hot-toast'
import { UploadCloud, FileText, CheckCircle2, ShieldCheck, Plus, Edit3 } from 'lucide-react'

export default function CVUploader() {
    const { uploadResume, cvUploading, seekerId, profile, navigate, loadSeekerProfile } = useStore()
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'manual'

    const [manualForm, setManualForm] = useState({
        full_name: profile?.full_name || 'Budi Santoso',
        nik: profile?.nik || '',
        date_of_birth: profile?.date_of_birth || '',
        region_code: profile?.region_code || '3171',
        skillInput: '',
        skills: (profile?.skills || ['Go', 'PostgreSQL', 'Docker', 'REST API']).map(s => typeof s === 'string' ? s : s.name),
        headline: profile?.headline || 'Senior Backend Engineer',
        salary_expectation_min: profile?.salary_expectation_min || '25000000',
        salary_expectation_max: profile?.salary_expectation_max || '40000000',
    })

    const [manualSaving, setManualSaving] = useState(false)

    useEffect(() => {
        if (profile) {
            setManualForm(prev => ({
                ...prev,
                full_name: profile.full_name || prev.full_name,
                skills: (profile.skills || prev.skills).map(s => typeof s === 'string' ? s : s.name),
                headline: profile.headline || prev.headline,
            }))
        }
    }, [profile])

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas harus PDF')
            return
        }
        const res = await uploadResume(file)
        if (res?.seeker_id) {
            toast.success('CV berhasil diekstrak oleh AI!')
            setTimeout(() => navigate('seeker-match'), 800)
        }
    }

    const addSkill = () => {
        const s = manualForm.skillInput.trim()
        if (s && !manualForm.skills.includes(s)) {
            setManualForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }))
        }
    }
    const removeSkill = (s) => setManualForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))

    const handleManualSave = async () => {
        setManualSaving(true)
        try {
            await updateSeekerProfile({
                full_name: manualForm.full_name,
                region_code: manualForm.region_code,
                headline: manualForm.headline,
                skills: manualForm.skills.map(name => ({ name, level: 'intermediate', years: 3 })),
                salary_expectation_min: Number(manualForm.salary_expectation_min) || 0,
                salary_expectation_max: Number(manualForm.salary_expectation_max) || 0,
            })
            await loadSeekerProfile()
            toast.success('Profil tersimpan!')
        } catch (e) {
            toast.error('Gagal simpan: ' + e.message)
        } finally {
            setManualSaving(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Unggah Resume & Profil
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Ekstraksi otomatis struktur kompetensi, riwayat karir, dan preferensi kompensasi Anda
                    </p>
                </div>
                <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime}>
                    <ShieldCheck size={13} /> Gemini 3.1 Parser
                </Tag>
            </header>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 0, border: `1.5px solid ${KC.ink}`, borderRadius: 9, overflow: 'hidden', alignSelf: 'flex-start' }}>
                {[
                    ['upload', 'Unggah Dokumen PDF', FileText],
                    ['manual', 'Formulir Profil Manual', Edit3],
                ].map(([tab, label, Icon]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '9px 18px',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            background: activeTab === tab ? KC.ink : '#FFFFFF',
                            color: activeTab === tab ? '#FFFFFF' : KC.ink,
                            border: 'none',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'upload' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20 }}>
                    {/* Upload Dropzone */}
                    <BrutalCard color="#FFFFFF" padding={28} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault()
                                setDragOver(false)
                                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
                            }}
                            onClick={() => inputRef.current?.click()}
                            style={{
                                width: '100%',
                                padding: '36px 20px',
                                border: `2px dashed ${dragOver ? KC.orange : KC.ink}`,
                                borderRadius: 10,
                                background: dragOver ? KC.orangeSoft : KC.surface,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 12,
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                style={{ display: 'none' }}
                            />
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', color: KC.ink }}>
                                <UploadCloud size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: KC.ink }}>
                                    {cvUploading ? 'Memproses Berkas PDF…' : 'Pilih atau Seret Berkas CV (PDF)'}
                                </h3>
                                <p style={{ fontSize: 12, color: KC.mute, margin: 0 }}>
                                    Maksimal ukuran file 10 MB. Mendukung format standar CV & Resume.
                                </p>
                            </div>
                        </div>

                        {seekerId && (
                            <div style={{ width: '100%', padding: '16px 18px', background: KC.surface, border: `1px solid ${KC.ash}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 6, background: KC.limeSoft, border: `1px solid ${KC.lime}`, display: 'grid', placeItems: 'center', color: KC.lime }}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>CV Aktif Terindeks</div>
                                        <div style={{ fontSize: 11, color: KC.mute }}>Dokumen_Resume_Budi.pdf</div>
                                    </div>
                                </div>
                                <button onClick={() => navigate('seeker-match')} className="kc-btn" style={{ ...topBtn(KC.orange, '#fff'), padding: '6px 14px', fontSize: 12 }}>
                                    Buka Match →
                                </button>
                            </div>
                        )}
                    </BrutalCard>

                    {/* Best Practice Tips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <BrutalCard color="#FFFFFF" padding={22}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px', color: KC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                Panduan Optimasi Profil
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    'Gunakan dokumen asli PDF (bukan hasil scan foto / screenshot).',
                                    'Cantumkan ringkasan keahlian teknis secara spesifik.',
                                    'Sertakan durasi tahun pengalaman pada tiap posisi kerja.',
                                    'Tentukan ekspektasi kompensasi untuk akurasi rekomendasi.',
                                ].map((tip, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                                        <CheckCircle2 size={15} color={KC.lime} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </BrutalCard>

                        <BrutalCard color="#FFFFFF" padding={20}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <ShieldCheck size={20} color={KC.ink} />
                                <div>
                                    <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 2px', color: KC.ink }}>Kerahasiaan Data Terjamin</h4>
                                    <p style={{ fontSize: 11, color: KC.mute, margin: 0, lineHeight: 1.4 }}>
                                        Informasi kontak pribadi hanya dapat diakses oleh perusahaan terverifikasi dengan persetujuan kandidat.
                                    </p>
                                </div>
                            </div>
                        </BrutalCard>
                    </div>
                </div>
            ) : (
                <BrutalCard color="#FFFFFF" padding={26}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={manualForm.full_name}
                                    onChange={e => setManualForm({ ...manualForm, full_name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Posisi / Headline Profesional</label>
                                <input
                                    type="text"
                                    value={manualForm.headline}
                                    onChange={e => setManualForm({ ...manualForm, headline: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 6 }}>
                                Daftar Keahlian ({manualForm.skills.length})
                            </label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <input
                                    type="text"
                                    value={manualForm.skillInput}
                                    onChange={e => setManualForm({ ...manualForm, skillInput: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                    placeholder="Ketik nama skill lalu klik Tambah…"
                                    style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13 }}
                                />
                                <button type="button" onClick={addSkill} style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 12 }}>
                                    <Plus size={14} /> Tambah
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {manualForm.skills.map((s, idx) => (
                                    <span key={idx} style={{ padding: '4px 10px', background: KC.surfaceAlt, border: `1px solid ${KC.borderMuted}`, borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {s}
                                        <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: KC.mute, padding: 0 }}>×</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                            <button
                                onClick={handleManualSave}
                                disabled={manualSaving}
                                className="kc-btn"
                                style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 13 }}
                            >
                                {manualSaving ? 'Menyimpan…' : 'Simpan Profil Karir'}
                            </button>
                        </div>
                    </div>
                </BrutalCard>
            )}
        </div>
    )
}
