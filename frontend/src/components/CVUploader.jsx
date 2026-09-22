import { useEffect, useRef, useState, useCallback } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, topBtn, DesignStyles, ScoreDonut } from './_design'
import { updateSeekerProfile, fetchQuizSkills } from '../services/api'
import toast from 'react-hot-toast'
import {
    UploadCloud, FileText, CheckCircle2, ShieldCheck, ArrowRight,
    Plus, Edit3, Loader2, Zap, User, Link2, ChevronDown, ChevronUp, Crown,
} from 'lucide-react'
import OfflineParseConfirmModal from './OfflineParseConfirmModal'
import { ProofChip } from './ProofUI'

// ─── helpers ────────────────────────────────────────────────────────────────
function isValidUrl(str) {
    try { return Boolean(new URL(str)) } catch { return false }
}

function ProfileAvatar({ name, size = 72 }) {
    const initials = (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
    return (
        <div style={{
            width: size, height: size, borderRadius: 14,
            background: '#090A0F', border: `1.5px solid ${KC.ink}`,
            boxShadow: `3px 3px 0 ${KC.orange}`,
            display: 'grid', placeItems: 'center',
            color: '#FFFFFF', fontWeight: 900,
            fontSize: Math.round(size * 0.36),
            letterSpacing: -1, flexShrink: 0,
        }}>
            {initials}
        </div>
    )
}

export default function CVUploader() {
    const {
        uploadResume, cvUploading, seekerId, profile,
        navigate, loadSeekerProfile, computeProfileCompleteness, openUpgradeModal,
    } = useStore()

    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'manual'
    const [editOpen, setEditOpen] = useState(false)
    const [uploadedFileName, setUploadedFileName] = useState(() => {
        try { return localStorage.getItem('kc_cv_filename') || '' } catch { return '' }
    })

    // Skill-proof summary (same API as SkillProofPage)
    const [proofData, setProofData] = useState({ items: [], proven: 0 })
    const [proofLoading, setProofLoading] = useState(false)
    const loadProof = useCallback(() => {
        if (!seekerId) return
        setProofLoading(true)
        fetchQuizSkills()
            .then(data => {
                const mine = (data.items || []).filter(i => i.proof !== 'missing')
                const proven = mine.filter(i => i.proof === 'quiz' || i.proof === 'hr_confirmed').length
                setProofData({ items: mine, proven })
            })
            .catch(() => setProofData({ items: [], proven: 0 }))
            .finally(() => setProofLoading(false))
    }, [seekerId])
    useEffect(() => { loadProof() }, [loadProof])

    const [manualForm, setManualForm] = useState({
        full_name: profile?.full_name ?? '',
        date_of_birth: profile?.date_of_birth ?? '',
        region_code: profile?.region_code ?? '',
        skillInput: '',
        skills: (profile?.skills ?? []).map(s => typeof s === 'string' ? s : s.name),
        headline: profile?.headline ?? '',
        salary_expectation_min: profile?.salary_expectation_min ?? '',
        salary_expectation_max: profile?.salary_expectation_max ?? '',
        portfolio_url: profile?.portfolio_url ?? '',
    })

    const [manualSaving, setManualSaving] = useState(false)
    const [offlinePending, setOfflinePending] = useState(null)
    const [scanPending, setScanPending] = useState(null)

    useEffect(() => {
        if (profile) {
            setManualForm(prev => ({
                ...prev,
                full_name: profile.full_name ?? prev.full_name,
                skills: (profile.skills ?? []).map(s => typeof s === 'string' ? s : s.name),
                headline: profile.headline ?? prev.headline,
                portfolio_url: profile.portfolio_url ?? prev.portfolio_url,
            }))
        }
    }, [profile])

    // ── CV upload handlers ──────────────────────────────────────────────────
    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error('Format berkas harus PDF'); return }
        const res = await uploadResume(file)
        if (res?.requires_scan_consent) { setScanPending({ file, message: res.message, alternative: res.alternative }); return }
        if (res?.requires_confirmation) { setOfflinePending({ file, preview: res.preview }); return }
        if (res?.seeker_id) {
            setUploadedFileName(file.name)
            try { localStorage.setItem('kc_cv_filename', file.name) } catch { /* non-fatal */ }
            toast.success('CV berhasil diekstrak oleh AI!')
            setTimeout(() => navigate('seeker-match'), 800)
        }
    }

    const handleOfflineConfirm = async () => {
        if (!offlinePending) return
        const { file } = offlinePending
        setOfflinePending(null)
        const res = await uploadResume(file, true)
        if (res?.seeker_id) {
            setUploadedFileName(file.name)
            try { localStorage.setItem('kc_cv_filename', file.name) } catch { /* non-fatal */ }
            toast.success('Profil diperbarui dengan data offline.')
            setTimeout(() => navigate('seeker-match'), 800)
        }
    }
    const handleOfflineCancel = () => setOfflinePending(null)

    // ── Manual form handlers ────────────────────────────────────────────────
    const addSkill = () => {
        const s = manualForm.skillInput.trim()
        if (s && !manualForm.skills.includes(s))
            setManualForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: '' }))
    }
    const removeSkill = (s) => setManualForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))

    const handleManualSave = async () => {
        if (manualForm.portfolio_url && !isValidUrl(manualForm.portfolio_url)) {
            toast.error('URL portfolio tidak valid. Harus diawali https://')
            return
        }
        setManualSaving(true)
        try {
            await updateSeekerProfile({
                full_name: manualForm.full_name,
                ...(manualForm.region_code ? { region_code: manualForm.region_code } : {}),
                headline: manualForm.headline,
                skills: manualForm.skills.map(name => ({ name })),
                salary_expectation_min: Number(manualForm.salary_expectation_min) || 0,
                salary_expectation_max: Number(manualForm.salary_expectation_max) || 0,
                ...(manualForm.portfolio_url ? { portfolio_url: manualForm.portfolio_url } : {}),
            })
            await loadSeekerProfile()
            toast.success('Profil tersimpan!')
            setEditOpen(false)
        } catch (e) {
            toast.error('Gagal simpan: ' + e.message)
        } finally {
            setManualSaving(false)
        }
    }

    // ── Derived values ──────────────────────────────────────────────────────
    const completeness = computeProfileCompleteness()
    const skills = (profile?.skills ?? [])
    const totalSkills = skills.length
    const provenCount = proofData.proven
    const displayName = profile?.full_name?.trim() || null
    const headline = profile?.headline?.trim() || null
    const portfolioUrl = (profile?.portfolio_url || '').trim()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />

            {/* ── Modals ─────────────────────────────────────────────────────── */}
            {offlinePending && (
                <OfflineParseConfirmModal
                    preview={offlinePending.preview}
                    onConfirm={handleOfflineConfirm}
                    onCancel={handleOfflineCancel}
                />
            )}
            {scanPending && (
                <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(9,10,15,.55)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }}>
                    <div style={{ maxWidth: 480, background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `4px 4px 0 ${KC.ink}`, padding: 24 }}>
                        <h2 style={{ font: '900 19px/1.25 "Plus Jakarta Sans", sans-serif', margin: '0 0 10px' }}>CV ini berupa foto atau hasil pindai</h2>
                        <p style={{ fontSize: 14, lineHeight: 1.55, color: KC.ink, margin: '0 0 10px' }}>{scanPending.message}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.5, color: KC.mute, margin: '0 0 18px' }}>{scanPending.alternative}</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button style={topBtn(KC.orange, '#fff')} onClick={async () => {
                                const file = scanPending.file
                                setScanPending(null)
                                const res = await uploadResume(file, false, true)
                                if (res?.seeker_id) { setUploadedFileName(file.name); toast.success('CV berhasil dibaca!'); setTimeout(() => navigate('seeker-match'), 800) }
                            }}>Ya, lanjutkan</button>
                            <button style={topBtn()} onClick={() => { setScanPending(null); setEditOpen(true); setActiveTab('manual') }}>Isi manual saja</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}`, gap: 16 }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>Profil Saya</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Kelola identitas profesional, keahlian, dan dokumen karir Anda
                    </p>
                </div>
                <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime}>
                    <ShieldCheck size={13} /> Gemini 3.1 Parser
                </Tag>
            </header>

            {/* ── Profile Identity Card ────────────────────────────────────────── */}
            <BrutalCard color="#FFFFFF" padding={24}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                    <ProfileAvatar name={displayName} size={72} />

                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.8, color: KC.ink, lineHeight: 1.15 }}>
                            {displayName || <span style={{ color: KC.mute, fontWeight: 600, fontSize: 16 }}>Nama belum diisi</span>}
                        </div>
                        {headline && (
                            <div style={{ fontSize: 14, fontWeight: 600, color: KC.mute, marginTop: 4 }}>{headline}</div>
                        )}
                        {portfolioUrl && isValidUrl(portfolioUrl) && (
                            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: KC.cyan, marginTop: 6, textDecoration: 'none' }}>
                                <Link2 size={12} />
                                {portfolioUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                            <ScoreDonut value={completeness} size={46} color={completeness >= 70 ? KC.lime : KC.orange} label="Profil" />
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: KC.ink }}>Kelengkapan Profil</div>
                                <div style={{ fontSize: 11, color: KC.mute, marginTop: 2 }}>
                                    {completeness >= 80 ? 'Profil siap untuk pencocokan AI' : completeness >= 50 ? 'Tambah pengalaman & pendidikan untuk skor lebih baik' : 'Upload CV atau isi profil manual untuk memulai'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: 'column' }}>
                        <button className="kc-btn" onClick={() => openUpgradeModal({ plan: 'prism' })} style={{ ...topBtn('#F59E0B', KC.ink), background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', padding: '10px 16px', fontSize: 13, display: 'flex', justifyContent: 'center' }}>
                            <Crown size={15} /> Upgrade Premium
                        </button>
                        <button className="kc-btn" onClick={() => setEditOpen(v => !v)} style={{ ...topBtn('#fff', KC.ink), padding: '10px 16px', fontSize: 13, display: 'flex', justifyContent: 'center' }}>
                            <Edit3 size={14} />
                            {editOpen ? 'Tutup Editor' : 'Edit Profil'}
                            {editOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
            </BrutalCard>

            {/* ── Skills block ─────────────────────────────────────────────────── */}
            {totalSkills > 0 && (
                <BrutalCard color="#FFFFFF" padding={22}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.mute }}>
                            Keahlian ({totalSkills})
                        </div>
                        {/* ⚡ X/Y Skill Terbukti — links to Bukti Skill page */}
                        <button
                            className="kc-btn"
                            onClick={() => navigate('seeker-verification')}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: 999, boxShadow: 'none',
                                background: provenCount > 0 ? KC.limeSoft : KC.surfaceAlt,
                                border: `1px solid ${provenCount > 0 ? KC.lime : KC.borderMuted}`,
                                cursor: 'pointer', fontSize: 12, fontWeight: 800,
                                color: provenCount > 0 ? '#065F46' : KC.mute,
                                transition: 'all 0.15s ease',
                            }}
                            title="Lihat halaman Bukti Skill"
                        >
                            <Zap size={12} fill={provenCount > 0 ? KC.lime : KC.borderMuted} color={provenCount > 0 ? KC.lime : KC.borderMuted} />
                            {proofLoading ? '…' : `${provenCount}/${totalSkills} Skill Terbukti`}
                            <ArrowRight size={11} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {skills.map((sk, i) => {
                            const name = typeof sk === 'string' ? sk : sk.name
                            const proof = sk.proof_level || 'claimed'
                            return <ProofChip key={i} name={name} status={proof} compact />
                        })}
                    </div>
                </BrutalCard>
            )}

            {/* ── CV Status bar (when CV already indexed & editor closed) ─────── */}
            {seekerId && uploadedFileName && !editOpen && (
                <BrutalCard color={KC.limeSoft} padding={16}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${KC.lime}`, display: 'grid', placeItems: 'center', color: KC.lime }}>
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>CV Aktif Terindeks</div>
                                <div style={{ fontSize: 11, color: KC.mute }}>{uploadedFileName}</div>
                            </div>
                        </div>
                        <button onClick={() => navigate('seeker-match')} className="kc-btn" style={{ ...topBtn(KC.orange, '#fff'), padding: '6px 14px', fontSize: 12 }}>
                            Buka Match →
                        </button>
                    </div>
                </BrutalCard>
            )}

            {/* ── Collapsible Edit Section ─────────────────────────────────────── */}
            {editOpen && (
                <BrutalCard color="#FFFFFF" padding={0} style={{ overflow: 'hidden' }}>
                    {/* Tab switcher */}
                    <div style={{ display: 'flex', borderBottom: `1.5px solid ${KC.ink}` }}>
                        {[
                            ['upload', 'Unggah Dokumen PDF', FileText],
                            ['manual', 'Formulir Profil Manual', Edit3],
                        ].map(([tab, label, Icon]) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '12px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: activeTab === tab ? KC.ink : '#FFFFFF', color: activeTab === tab ? '#FFFFFF' : KC.ink, border: 'none', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Icon size={14} />{label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: 24 }}>
                        {activeTab === 'upload' ? (
                            <div className="kc-grid-main">
                                {/* Dropzone */}
                                <BrutalCard color="#FFFFFF" padding={28} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                                    <div
                                        aria-busy={cvUploading}
                                        onDragOver={(e) => { if (cvUploading) return; e.preventDefault(); setDragOver(true) }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => { if (cvUploading) return; e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]) }}
                                        onClick={() => { if (cvUploading) return; inputRef.current?.click() }}
                                        style={{ width: '100%', padding: '36px 20px', border: `2px dashed ${dragOver ? KC.orange : KC.ink}`, borderRadius: 10, background: dragOver ? KC.orangeSoft : KC.surface, cursor: cvUploading ? 'progress' : 'pointer', pointerEvents: cvUploading ? 'none' : 'auto', opacity: cvUploading ? 0.7 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, boxSizing: 'border-box', transition: 'all 0.15s ease' }}
                                    >
                                        <input ref={inputRef} type="file" accept=".pdf" disabled={cvUploading} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                                        <div style={{ width: 48, height: 48, borderRadius: 10, background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', color: cvUploading ? KC.orange : KC.ink }}>
                                            {cvUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: KC.ink }}>
                                                {cvUploading ? 'Memproses Berkas PDF…' : 'Pilih atau Seret Berkas CV (PDF)'}
                                            </h3>
                                            <p style={{ fontSize: 12, color: KC.mute, margin: 0 }}>Maksimal ukuran file 10 MB. Mendukung format standar CV &amp; Resume.</p>
                                        </div>
                                    </div>
                                </BrutalCard>

                                {/* Tips sidebar */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <BrutalCard color="#FFFFFF" padding={22}>
                                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px', color: KC.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>Panduan Optimasi Profil</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {['Gunakan dokumen asli PDF (bukan hasil scan foto / screenshot).', 'Cantumkan ringkasan keahlian teknis secara spesifik.', 'Sertakan durasi tahun pengalaman pada tiap posisi kerja.', 'Tentukan ekspektasi kompensasi untuk akurasi rekomendasi.'].map((tip, idx) => (
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
                                                <p style={{ fontSize: 11, color: KC.mute, margin: 0, lineHeight: 1.4 }}>Informasi kontak pribadi hanya dapat diakses oleh perusahaan terverifikasi dengan persetujuan kandidat.</p>
                                            </div>
                                        </div>
                                    </BrutalCard>
                                </div>
                            </div>
                        ) : (
                            /* ── Manual Form ── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div className="kc-grid-2-col">
                                    <div>
                                        <label htmlFor="cv-manual-name" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
                                        <input id="cv-manual-name" type="text" value={manualForm.full_name} onChange={e => setManualForm({ ...manualForm, full_name: e.target.value })} placeholder="Nama lengkap sesuai identitas" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label htmlFor="cv-manual-headline" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Posisi / Headline Profesional</label>
                                        <input id="cv-manual-headline" type="text" value={manualForm.headline} onChange={e => setManualForm({ ...manualForm, headline: e.target.value })} placeholder="Contoh: Backend Engineer" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                {/* Portfolio URL */}
                                <div>
                                    <label htmlFor="cv-manual-portfolio" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>
                                        Website / Portfolio URL <span style={{ fontWeight: 500, textTransform: 'none' }}>(opsional)</span>
                                    </label>
                                    <input id="cv-manual-portfolio" type="url" value={manualForm.portfolio_url} onChange={e => setManualForm({ ...manualForm, portfolio_url: e.target.value })} placeholder="https://github.com/username atau https://portfolio.dev" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                                    {manualForm.portfolio_url && !isValidUrl(manualForm.portfolio_url) && (
                                        <p style={{ fontSize: 11, color: KC.rose, margin: '4px 0 0' }}>URL tidak valid. Gunakan format https://…</p>
                                    )}
                                </div>

                                {/* Skills */}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 6 }}>Daftar Keahlian ({manualForm.skills.length})</label>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                        <input type="text" value={manualForm.skillInput} onChange={e => setManualForm({ ...manualForm, skillInput: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Ketik nama skill lalu klik Tambah…" style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 13 }} />
                                        <button type="button" onClick={addSkill} style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 12 }}><Plus size={14} /> Tambah</button>
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

                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, gap: 10 }}>
                                    <button onClick={() => setEditOpen(false)} className="kc-btn" style={{ ...topBtn('#fff', KC.ink), padding: '10px 20px', fontSize: 13 }}>Batal</button>
                                    <button onClick={handleManualSave} disabled={manualSaving} className="kc-btn" style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 13 }}>
                                        {manualSaving ? 'Menyimpan…' : 'Simpan Profil Karir'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </BrutalCard>
            )}

            {/* ── Empty-state CTA when no profile yet ─────────────────────────── */}
            {!seekerId && !editOpen && (
                <BrutalCard color={KC.orangeSoft} padding={22} style={{ border: `1.5px dashed ${KC.orange}`, boxShadow: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff', border: `1.5px solid ${KC.orange}`, display: 'grid', placeItems: 'center', color: KC.orange, flexShrink: 0 }}>
                            <User size={22} />
                        </div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: KC.ink }}>Profil Anda Masih Kosong</div>
                            <div style={{ fontSize: 12, color: KC.mute, marginTop: 3 }}>Upload CV PDF atau isi formulir manual agar AI bisa mencocokkan Anda dengan lowongan yang relevan.</div>
                        </div>
                        <button className="kc-btn" onClick={() => setEditOpen(true)} style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 20px', fontSize: 13, flexShrink: 0 }}>
                            <UploadCloud size={14} /> Lengkapi Profil
                        </button>
                    </div>
                </BrutalCard>
            )}
        </div>
    )
}
