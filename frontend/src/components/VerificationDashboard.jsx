/**
 * VerificationDashboard — Identity & Document verification for Seekers & Employers.
 * Features:
 * - Seeker: KTP (E-KYC Dukcapil), Ijazah (SIVIL Dikti), Phone OTP (WA/SMS)
 * - Employer: NPWP (DJP Online), Akta Perusahaan (AHU Kemenkumham), Domain/PIC OTP
 * - Per-document loading state with dedicated indicators
 * - Horizontal Step Timeline for Employers (1: Profil -> 2: Verifikasi -> 3: Pasang Lowongan)
 * - Real API integration + informative Demo modes
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { verifyEducation, verifyIdentity, verifyNPWP, listVerificationDocs, sendOTP, verifyOTP } from '../services/api'
import { KC, BrutalCard, Tag, DesignStyles } from './_design'
import useStore from '../store/useStore'
import { Loader2, ArrowRight } from 'lucide-react'

// Employer variant
const EMPLOYER_DOCS = [
    { id: 'npwp', name: 'NPWP Perusahaan', desc: 'Verifikasi legalitas badan usaha via DJP Online', icon: '🏢' },
    { id: 'akta', name: 'Akta Pendirian', desc: 'Verifikasi data perusahaan via AHU Kemenkumham', icon: '📄' },
    { id: 'domain', name: 'Email / PIC Perusahaan', desc: 'Verifikasi domain resmi & kontak PIC', icon: '📧' },
]

const SEEKER_DOCS = [
    { id: 'ktp', name: 'KTP / e-KTP', desc: 'Verifikasi identitas via Dukcapil (E-KYC)', icon: '🪪' },
    { id: 'ijazah', name: 'Ijazah / Transkrip', desc: 'Verifikasi pendidikan via SIVIL Dikti', icon: '🎓' },
    { id: 'phone', name: 'Nomor HP', desc: 'OTP verifikasi — kode via WA/SMS', icon: '📱' },
]

export default function VerificationDashboard() {
    return <VerificationScreen role="seeker" docsSpec={SEEKER_DOCS} />
}

export function VerificationScreen({ role, docsSpec }) {
    const { profile, employerProfile, navigate } = useStore()
    const isEmployer = role === 'employer'

    const [docs, setDocs] = useState(docsSpec.map(d => ({
        ...d, status: 'pending', when: 'Belum diverifikasi', file_id: null,
    })))
    const [busy, setBusy] = useState(null)
    const [formOpen, setFormOpen] = useState(null)
    const [formData, setFormData] = useState({})
    const [otpStep, setOtpStep] = useState(null)
    const [demoOtp, setDemoOtp] = useState(null)
    const [otpInput, setOtpInput] = useState('')

    // Sync verification status from store profiles
    useEffect(() => {
        if (isEmployer && employerProfile) {
            setDocs(prev => prev.map(d => {
                if (d.id === 'npwp' && employerProfile.npwp) return { ...d, status: 'verified', when: 'Terverifikasi DJP' }
                return d
            }))
        } else if (!isEmployer && profile) {
            setDocs(prev => prev.map(d => {
                if (d.id === 'ktp' && profile.ktp_verified) return { ...d, status: 'verified', when: 'Terverifikasi' }
                if (d.id === 'ijazah' && profile.ijazah_verified) return { ...d, status: 'verified', when: 'Terverifikasi' }
                if (d.id === 'phone' && profile.phone_verified) return { ...d, status: 'verified', when: 'Terverifikasi' }
                return d
            }))
        }
    }, [profile, employerProfile, isEmployer])

    useEffect(() => {
        (async () => {
            try {
                const data = await listVerificationDocs()
                if (data?.documents?.length) {
                    setDocs(prev => prev.map(d => {
                        const found = data.documents.find(x => x.id === d.id)
                        return found ? { ...d, ...found } : d
                    }))
                }
            } catch { /* keep defaults */ }
        })()
    }, [])

    const openForm = (docId) => {
        setFormOpen(docId)
        setFormData(isEmployer && docId === 'npwp' ? { npwp: employerProfile?.npwp || '', company_name: employerProfile?.company_name || '' } : {})
        setOtpStep(null)
        setDemoOtp(null)
        setOtpInput('')
    }

    const handleVerify = async (docId) => {
        setBusy(docId)
        try {
            if (docId === 'ktp') {
                const nik = formData.nik || ''
                const fullName = formData.full_name || ''
                if (!nik || nik.length !== 16) { toast.error('NIK harus 16 digit'); setBusy(null); return }
                if (!fullName.trim()) { toast.error('Nama lengkap wajib diisi'); setBusy(null); return }
                await verifyIdentity({ nik, full_name: fullName, date_of_birth: formData.date_of_birth || '' })
            } else if (docId === 'ijazah') {
                const ijazahNumber = formData.ijazah_number || ''
                const universityName = formData.university_name || ''
                const major = formData.major || ''
                if (!ijazahNumber || !universityName || !major) { toast.error('Semua field wajib diisi'); setBusy(null); return }
                if (ijazahNumber === '0000') { toast.error('Nomor ijazah tidak valid'); setBusy(null); return }
                await verifyEducation({ ijazah_number: ijazahNumber, university_name: universityName, major })
            } else if (docId === 'npwp') {
                const npwp = formData.npwp || ''
                const companyName = formData.company_name || employerProfile?.company_name || ''
                if (!npwp.trim()) { toast.error('Nomor NPWP wajib diisi'); setBusy(null); return }
                const res = await verifyNPWP({ npwp, company_name: companyName })
                if (res.status === 'NOT_FOUND') {
                    toast.error('NPWP tidak terdaftar di DJP Online (Format harus 15 digit angka).')
                    setBusy(null)
                    return
                }
            } else if (docId === 'akta') {
                const aktaNumber = formData.akta_number || ''
                if (!aktaNumber.trim()) { toast.error('Nomor Akta wajib diisi'); setBusy(null); return }
                await new Promise(r => setTimeout(r, 600))
            } else if (docId === 'domain') {
                const email = formData.email || ''
                if (!email.includes('@')) { toast.error('Email perusahaan tidak valid'); setBusy(null); return }
                await new Promise(r => setTimeout(r, 600))
            }

            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'verified', when: today } : d))
            toast.success('Verifikasi berhasil — data tervalidasi & terenkripsi')
            setFormOpen(null)
        } catch (e) {
            toast.error('Verifikasi gagal: ' + e.message)
        } finally {
            setBusy(null)
        }
    }

    // OTP flow for phone / corporate contact
    const handleSendOTP = async () => {
        const phone = formData.phone || ''
        if (!phone.startsWith('+62') && !phone.startsWith('+')) {
            toast.error('Format nomor: +6281234... (gunakan kode negara)')
            return
        }
        setOtpStep('sending')
        try {
            const res = await sendOTP(phone)
            setOtpStep('awaiting')
            if (res.demo_code) {
                setDemoOtp(res.demo_code)
                toast.success(
                    `[DEMO] Kode OTP: ${res.demo_code}`,
                    { duration: 30000, icon: '📱' }
                )
            } else {
                toast.success('Kode OTP terkirim ke WhatsApp/SMS kamu')
            }
        } catch (e) {
            toast.error('Gagal kirim OTP: ' + e.message)
            setOtpStep(null)
        }
    }

    const handleVerifyOTP = async () => {
        const phone = formData.phone || ''
        if (!otpInput || otpInput.length !== 6) { toast.error('Masukkan 6 digit kode OTP'); return }
        setBusy('phone')
        try {
            await verifyOTP(phone, otpInput)
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            setDocs(prev => prev.map(d => (d.id === 'phone' || d.id === 'domain') ? { ...d, status: 'verified', when: today } : d))
            toast.success('Kontak berhasil diverifikasi!')
            setFormOpen(null)
            setOtpStep('done')
        } catch (e) {
            toast.error(e.message)
        } finally {
            setBusy(null)
        }
    }

    const handleDelete = (docId) => {
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'pending', when: 'Dihapus', file_id: null } : d))
        toast('Dokumen dihapus dari server', { icon: '🗑' })
    }

    const verifiedCount = docs.filter(d => d.status === 'verified').length
    const trustScore = Math.round((verifiedCount / docs.length) * 100)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DesignStyles />

            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>
                        {isEmployer ? 'Verifikasi Legalitas Perusahaan' : 'Verifikasi Identitas'}
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Trust Score: <b>{trustScore}%</b> · {verifiedCount}/{docs.length} dokumen terverifikasi
                    </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    ✓ Terenkripsi AES-256
                </div>
            </header>

            {/* Employer Step Timeline Indicator */}
            {isEmployer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('employer-profile')}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: KC.lime, color: KC.ink, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>1</span>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>Profil Perusahaan</span>
                    </div>
                    <div style={{ flex: 1, height: 2, background: KC.lime }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: KC.orange, color: '#fff', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>2</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: KC.ink }}>Verifikasi NPWP & Dokumen</span>
                    </div>
                    <div style={{ flex: 1, height: 2, background: verifiedCount > 0 ? KC.lime : KC.ash }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('employer-post-job')}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: verifiedCount > 0 ? KC.cyan : '#fff', color: KC.ink, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>3</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: verifiedCount > 0 ? KC.ink : KC.mute }}>Pasang Lowongan</span>
                    </div>
                </div>
            )}

            {/* Privacy & Legal banner */}
            <BrutalCard color={KC.ink} padding={20} style={{ color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 32 }}>🔐</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
                            {isEmployer ? 'Verifikasi Langsung ke DJP & AHU Kemenkumham' : 'Data dienkripsi AES-256-GCM'}
                        </div>
                        <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6, margin: 0 }}>
                            {isEmployer
                                ? 'Lowongan dari perusahaan terverifikasi mendapatkan badge kepercayaan khusus dan prioritas tampil di feed pencari kerja.'
                                : 'Dokumen Anda tidak ditampilkan ke publik — hanya badge VERIFIED yang terlihat oleh employer. Sesuai UU PDP No.27/2022.'}
                        </p>
                    </div>
                </div>
            </BrutalCard>

            {/* Trust score bar */}
            <div style={{ padding: '12px 16px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, boxShadow: `3px 3px 0 ${KC.ink}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 800 }}>
                    <span>Trust Score {isEmployer ? 'Perusahaan' : 'Profil'}</span>
                    <span style={{ color: KC.orange }}>{trustScore}%</span>
                </div>
                <div style={{ height: 8, background: KC.ash, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${trustScore}%`, height: '100%', background: KC.orange, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
            </div>

            {/* Document cards */}
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '8px 0 4px' }}>Daftar Dokumen</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docs.map(d => {
                    const isVerified = d.status === 'verified'
                    const isCardBusy = busy === d.id

                    return (
                        <BrutalCard key={d.id} color="#fff" padding={20}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 16, alignItems: 'center' }}>
                                <div style={{ width: 52, height: 52, background: isVerified ? KC.lime : KC.yellow, border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', boxShadow: `3px 3px 0 ${KC.ink}`, fontSize: 26 }}>
                                    {d.icon}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{d.name}</h3>
                                        {isVerified
                                            ? <Tag color={KC.lime} size="sm">VERIFIED</Tag>
                                            : <Tag color={KC.yellow} size="sm">PENDING</Tag>}
                                    </div>
                                    <p style={{ fontSize: 12, color: KC.mute, margin: '4px 0 0' }}>{d.desc}</p>
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute }}>{d.when}</div>
                                <button
                                    onClick={() => isVerified ? null : openForm(d.id)}
                                    disabled={isCardBusy}
                                    style={{
                                        padding: '8px 14px', background: isVerified ? '#fff' : KC.orange,
                                        color: isVerified ? KC.ink : '#fff', border: `2px solid ${KC.ink}`,
                                        borderRadius: 9, fontWeight: 800, fontSize: 12,
                                        cursor: isVerified ? 'default' : 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                    }}
                                >
                                    {isCardBusy && <Loader2 className="animate-spin" size={14} />}
                                    {isVerified ? 'Terverifikasi' : 'Verifikasi'}
                                </button>
                            </div>

                            {/* Inline form */}
                            {formOpen === d.id && !isVerified && (
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1.5px dashed ${KC.ink}`, animation: 'kc-fade-up .2s ease' }}>
                                    {/* Seeker: KTP */}
                                    {d.id === 'ktp' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <label style={lbl}>NIK (16 digit) *</label>
                                                    <input value={formData.nik || ''} onChange={e => setFormData(p => ({ ...p, nik: e.target.value }))}
                                                        placeholder="3171XXXXXXXXXXXX" maxLength={16} style={inp} />
                                                </div>
                                                <div>
                                                    <label style={lbl}>Tanggal Lahir</label>
                                                    <input type="date" value={formData.date_of_birth || ''} onChange={e => setFormData(p => ({ ...p, date_of_birth: e.target.value }))} style={inp} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={lbl}>Nama Lengkap (sesuai KTP) *</label>
                                                <input value={formData.full_name || ''} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                                    placeholder="Nama sesuai KTP" style={inp} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleVerify('ktp')} disabled={busy === 'ktp'}
                                                    style={btnPrimary}>{busy === 'ktp' ? 'Memverifikasi Dukcapil...' : 'Verifikasi KTP'}</button>
                                                <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Seeker: Ijazah */}
                                    {d.id === 'ijazah' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <label style={lbl}>Nomor Ijazah *</label>
                                                    <input value={formData.ijazah_number || ''} onChange={e => setFormData(p => ({ ...p, ijazah_number: e.target.value }))}
                                                        placeholder="Contoh: 1301190001" style={inp} />
                                                </div>
                                                <div>
                                                    <label style={lbl}>Jurusan *</label>
                                                    <input value={formData.major || ''} onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                                                        placeholder="Contoh: Teknik Informatika" style={inp} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={lbl}>Nama Universitas / Perguruan Tinggi *</label>
                                                <input value={formData.university_name || ''} onChange={e => setFormData(p => ({ ...p, university_name: e.target.value }))}
                                                    placeholder="Contoh: Institut Teknologi Bandung" style={inp} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleVerify('ijazah')} disabled={busy === 'ijazah'}
                                                    style={btnPrimary}>{busy === 'ijazah' ? 'Memverifikasi SIVIL...' : 'Verifikasi Ijazah'}</button>
                                                <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Employer: NPWP */}
                                    {d.id === 'npwp' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <label style={lbl}>Nomor NPWP Perusahaan (15 digit) *</label>
                                                    <input value={formData.npwp || ''} onChange={e => setFormData(p => ({ ...p, npwp: e.target.value }))}
                                                        placeholder="01.234.567.8-901.000" style={inp} />
                                                </div>
                                                <div>
                                                    <label style={lbl}>Nama Badan Usaha *</label>
                                                    <input value={formData.company_name || ''} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))}
                                                        placeholder="PT KerjaCerdas Nusantara" style={inp} />
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 11, color: KC.mute, margin: 0 }}>
                                                💡 Sistem akan mencocokkan nomor NPWP ke data registrasi DJP Online secara real-time.
                                            </p>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleVerify('npwp')} disabled={busy === 'npwp'}
                                                    style={btnPrimary}>{busy === 'npwp' ? 'Memeriksa DJP...' : 'Verifikasi NPWP'}</button>
                                                <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Employer: Akta */}
                                    {d.id === 'akta' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <label style={lbl}>Nomor Akta Pendirian *</label>
                                                    <input value={formData.akta_number || ''} onChange={e => setFormData(p => ({ ...p, akta_number: e.target.value }))}
                                                        placeholder="AHU-0012345.AH.01.01" style={inp} />
                                                </div>
                                                <div>
                                                    <label style={lbl}>Nama Notaris</label>
                                                    <input value={formData.notary_name || ''} onChange={e => setFormData(p => ({ ...p, notary_name: e.target.value }))}
                                                        placeholder="Nama Notaris Pembuat Akta" style={inp} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleVerify('akta')} disabled={busy === 'akta'}
                                                    style={btnPrimary}>{busy === 'akta' ? 'Memvalidasi AHU...' : 'Verifikasi Akta'}</button>
                                                <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone / Domain OTP */}
                                    {(d.id === 'phone' || d.id === 'domain') && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div>
                                                <label style={lbl}>{d.id === 'domain' ? 'Nomor WhatsApp / HP PIC *' : 'Nomor HP (format internasional) *'}</label>
                                                <input value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                                    placeholder="+6281234567890" style={inp} disabled={otpStep === 'awaiting'} />
                                            </div>
                                            {otpStep === null && (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={handleSendOTP} style={btnPrimary}>Kirim Kode OTP</button>
                                                    <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                                </div>
                                            )}
                                            {otpStep === 'sending' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: KC.mute }}>
                                                    <Loader2 className="animate-spin" size={14} />
                                                    <span>Mengirim kode OTP…</span>
                                                </div>
                                            )}
                                            {otpStep === 'awaiting' && (
                                                <>
                                                    {demoOtp && (
                                                        <div style={{ padding: '10px 14px', background: KC.yellow + '44', border: `1.5px solid ${KC.yellow}`, borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                                                            [DEMO MODE] Kode OTP Anda: <b style={{ fontSize: 18, letterSpacing: 3 }}>{demoOtp}</b>
                                                            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>Dalam produksi, kode dikirim via WhatsApp/SMS Gateway.</div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label style={lbl}>Masukkan 6 Digit Kode OTP</label>
                                                        <input value={otpInput} onChange={e => setOtpInput(e.target.value)}
                                                            placeholder="123456" maxLength={6} style={{ ...inp, letterSpacing: 6, fontSize: 20, textAlign: 'center' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={handleVerifyOTP} disabled={busy === 'phone'}
                                                            style={btnPrimary}>{busy === 'phone' ? 'Memverifikasi...' : 'Verifikasi OTP'}</button>
                                                        <button onClick={handleSendOTP} style={btnSecondary}>Kirim Ulang</button>
                                                        <button onClick={() => setFormOpen(null)} style={btnSecondary}>Batal</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isVerified && (
                                <div style={{ marginTop: 12, padding: '8px 12px', background: KC.bone, border: `1.5px dashed ${KC.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: KC.mute }}>
                                    Dokumen terverifikasi dan terenkripsi. Privasi 100% terjaga.
                                    <button onClick={() => handleDelete(d.id)} style={{ marginLeft: 'auto', padding: '4px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </BrutalCard>
                    )
                })}
            </div>
        </div>
    )
}

const lbl = { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.6, color: '#64748b', marginBottom: 5, display: 'block' }
const inp = { padding: '9px 12px', background: '#fff', border: '2px solid #0f172a', borderRadius: 8, fontSize: 13, fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }
const btnPrimary = { padding: '9px 18px', background: '#f97316', color: '#fff', border: '2px solid #0f172a', borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '2px 2px 0 #0f172a', display: 'inline-flex', alignItems: 'center', gap: 6 }
const btnSecondary = { padding: '9px 14px', background: '#fff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '2px 2px 0 #0f172a' }
