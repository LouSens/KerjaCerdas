/**
 * VerificationDashboard — Clean enterprise identity & document verification.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { verifyEducation, verifyIdentity, verifyNPWP, listVerificationDocs, sendOTP, verifyOTP } from '../services/api'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'
import useStore from '../store/useStore'
import { CreditCard, GraduationCap, Phone, Building2, FileText, Mail, CheckCircle2, Lock, X } from 'lucide-react'

const EMPLOYER_DOCS = [
    { id: 'npwp', name: 'NPWP Perusahaan (DJP)', desc: 'Validasi legalitas institusi dan nomor pokok wajib pajak via DJP Online', icon: Building2 },
    { id: 'akta', name: 'Akta Pendirian AHU', desc: 'Verifikasi surat keputusan kementerian hukum & HAM RI', icon: FileText },
    { id: 'domain', name: 'Email Korporat / PIC', desc: 'Validasi kepemilikan domain perusahaan dan otorisasi perwakilan', icon: Mail },
]

const SEEKER_DOCS = [
    { id: 'ktp', name: 'KTP / Identitas Kependudukan', desc: 'Validasi NIK dan identitas resmi via E-KYC Dukcapil Kemendagri', icon: CreditCard },
    { id: 'ijazah', name: 'Ijazah & Transkrip Pendidikan', desc: 'Verifikasi keaslian nomor ijazah perguruan tinggi via PDDikti SIVIL', icon: GraduationCap },
    { id: 'phone', name: 'Nomor WhatsApp / Kontak', desc: 'Verifikasi nomor aktif kandidat untuk koordinasi rekrutmen via OTP', icon: Phone },
]

export default function VerificationDashboard() {
    return <VerificationScreen role="seeker" docsSpec={SEEKER_DOCS} />
}

export function VerificationScreen({ role, docsSpec }) {
    const { profile, employerProfile, navigate } = useStore()
    const isEmployer = role === 'employer'

    const [docs, setDocs] = useState(docsSpec.map(d => ({
        ...d, status: 'pending', when: 'Belum diverifikasi',
    })))
    const [busy, setBusy] = useState(null)
    const [formOpen, setFormOpen] = useState(null)
    const [formData, setFormData] = useState({})
    const [otpStep, setOtpStep] = useState(null)
    const [demoOtp, setDemoOtp] = useState(null)
    const [otpInput, setOtpInput] = useState('')

    useEffect(() => {
        if (isEmployer && employerProfile) {
            setDocs(prev => prev.map(d => {
                if (d.id === 'npwp' && employerProfile.npwp) return { ...d, status: 'verified', when: 'Terverifikasi DJP Online' }
                return d
            }))
        } else if (!isEmployer && profile) {
            setDocs(prev => prev.map(d => {
                if (d.id === 'ktp' && profile.ktp_verified) return { ...d, status: 'verified', when: 'Terverifikasi Dukcapil' }
                if (d.id === 'ijazah' && profile.ijazah_verified) return { ...d, status: 'verified', when: 'Terverifikasi SIVIL Dikti' }
                if (d.id === 'phone' && profile.phone_verified) return { ...d, status: 'verified', when: 'Nomor Terverifikasi' }
                return d
            }))
        }
    }, [profile, employerProfile, isEmployer])

    const handleSendOTP = async () => {
        let phone = (formData.phone || '').trim()
        if (!phone) {
            toast.error('Nomor telepon/WhatsApp wajib diisi')
            return
        }
        if (phone.startsWith('0')) {
            phone = '+62' + phone.slice(1)
        } else if (!phone.startsWith('+')) {
            phone = '+62' + phone
        }
        setFormData(prev => ({ ...prev, formattedPhone: phone }))
        setBusy('phone')
        try {
            const res = await sendOTP(phone)
            setDemoOtp(res.demo_code)
            setOtpStep('verify')
            toast.success(res.message || `Kode OTP: ${res.demo_code}`, { duration: 8000, icon: '📱' })
        } catch (e) {
            toast.error('Gagal mengirim OTP: ' + e.message)
        } finally {
            setBusy(null)
        }
    }

    const handleConfirmOTP = async () => {
        if (!otpInput || otpInput.trim().length !== 6) {
            toast.error('Masukkan 6 digit kode OTP')
            return
        }
        setBusy('otp_confirm')
        try {
            await verifyOTP(formData.formattedPhone, otpInput.trim())
            toast.success('Nomor WhatsApp / HP berhasil diverifikasi!')
            setDocs(prev => prev.map(d => d.id === 'phone' ? { ...d, status: 'verified', when: 'Nomor Terverifikasi' } : d))
            setFormOpen(null)
            setOtpStep(null)
            setOtpInput('')
        } catch (e) {
            toast.error('Verifikasi OTP gagal: ' + e.message)
        } finally {
            setBusy(null)
        }
    }

    const handleVerify = async (docId) => {
        if (docId === 'phone') {
            await handleSendOTP()
            return
        }
        setBusy(docId)
        try {
            if (docId === 'ktp') {
                if (!formData.nik || formData.nik.length !== 16) {
                    toast.error('NIK wajib 16 digit')
                    setBusy(null)
                    return
                }
                await verifyIdentity({ nik: formData.nik, full_name: formData.full_name || profile?.full_name || 'Budi Santoso' })
            } else if (docId === 'ijazah') {
                await verifyEducation({ ijazah_number: formData.ijazah_number || '12345/ITB/2022', university_name: formData.university_name || 'Institut Teknologi Bandung', major: 'Teknik Informatika' })
            } else if (docId === 'npwp') {
                await verifyNPWP({ npwp: formData.npwp || '01.234.567.8-012.000', company_name: formData.company_name || 'GoTo Group' })
            }
            toast.success('Dokumen berhasil diverifikasi!')
            setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'verified', when: 'Terverifikasi Resmi' } : d))
            setFormOpen(null)
        } catch (e) {
            toast.error('Gagal verifikasi: ' + e.message)
        } finally {
            setBusy(null)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        {isEmployer ? 'Verifikasi Legalitas Institusi' : 'Verifikasi Identitas & Dokumen'}
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Membangun ekosistem rekrutmen terpercaya dengan otentikasi data resmi pemerintah
                    </p>
                </div>
                <Tag color={KC.limeSoft} ink={KC.lime} border={KC.lime}>
                    <Lock size={12} /> Terenkripsi AES-256-GCM
                </Tag>
            </header>

            {/* Document Cards */}
            <div className="kc-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {docs.map(doc => {
                    const IconComp = doc.icon
                    const isVerified = doc.status === 'verified'

                    return (
                        <BrutalCard key={doc.id} color="#FFFFFF" padding={20}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isVerified ? KC.limeSoft : KC.surfaceAlt, border: `1.5px solid ${isVerified ? KC.lime : KC.borderMuted}`, display: 'grid', placeItems: 'center', color: isVerified ? KC.lime : KC.mute, flexShrink: 0 }}>
                                        <IconComp size={20} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: KC.ink }}>{doc.name}</h3>
                                            <Tag color={isVerified ? KC.limeSoft : KC.surfaceAlt} ink={isVerified ? '#047857' : KC.mute} border={isVerified ? KC.lime : KC.borderMuted} size="sm">
                                                {isVerified ? '✓ Terverifikasi' : 'Belum Terverifikasi'}
                                            </Tag>
                                        </div>
                                        <p style={{ fontSize: 13, color: KC.mute, margin: '4px 0 0', lineHeight: 1.4 }}>
                                            {doc.desc}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    {isVerified ? (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <CheckCircle2 size={14} /> {doc.when}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setFormOpen(doc.id)}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.ink, '#fff'), padding: '8px 16px', fontSize: 12 }}
                                        >
                                            Verifikasi Sekarang →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </BrutalCard>
                    )
                })}
            </div>

            {/* Verification Form Modal */}
            {formOpen && (
                <div
                    onClick={() => setFormOpen(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(9, 10, 15, 0.6)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        backdropFilter: 'blur(3px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 14,
                            boxShadow: `6px 6px 0 ${KC.ink}`,
                            maxWidth: 480,
                            width: '100%',
                            padding: 24,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: KC.ink }}>
                                Verifikasi {docs.find(d => d.id === formOpen)?.name}
                            </h3>
                            <button onClick={() => setFormOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: KC.mute }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {formOpen === 'ktp' && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Nomor Induk Kependudukan (16 Digit)</label>
                                    <input
                                        type="text"
                                        maxLength={16}
                                        placeholder="Contoh: 3171012345670001"
                                        value={formData.nik || ''}
                                        onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {formOpen === 'ijazah' && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Nomor Ijazah Nasional / SIVIL</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 12345/ITB/2022"
                                        value={formData.ijazah_number || ''}
                                        onChange={e => setFormData({ ...formData, ijazah_number: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {formOpen === 'npwp' && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>Nomor Pokok Wajib Pajak (NPWP 15-16 Digit)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 01.234.567.8-012.000"
                                        value={formData.npwp || ''}
                                        onChange={e => setFormData({ ...formData, npwp: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                                    />
                                </div>
                            )}

                            {formOpen === 'phone' && (
                                <div>
                                    {otpStep !== 'verify' ? (
                                        <>
                                            <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>
                                                Nomor Telepon / WhatsApp (Format Internasional atau 08...)
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="Contoh: 081234567890"
                                                value={formData.phone || ''}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                                            />
                                            <p style={{ fontSize: 12, color: KC.mute, margin: '6px 0 0' }}>
                                                Kode OTP 6-digit akan dibuat untuk memverifikasi kontak Anda.
                                            </p>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ background: KC.limeSoft, padding: '10px 12px', borderRadius: 8, border: `1px solid ${KC.lime}`, fontSize: 13, color: '#065F46' }}>
                                                <strong>Kode OTP Terkirim ke {formData.formattedPhone}:</strong><br />
                                                Gunakan kode demo: <code style={{ fontWeight: 900, fontSize: 15, letterSpacing: 2, background: '#fff', padding: '2px 6px', borderRadius: 4 }}>{demoOtp}</code>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute, display: 'block', marginBottom: 4 }}>
                                                    Masukkan 6-Digit Kode OTP
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="123456"
                                                    value={otpInput}
                                                    onChange={e => setOtpInput(e.target.value)}
                                                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 18, fontWeight: 800, letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                disabled={busy === 'phone'}
                                                style={{ background: 'none', border: 'none', color: KC.orange, fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                            >
                                                Kirim ulang kode OTP
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button
                                    onClick={() => {
                                        setFormOpen(null)
                                        setOtpStep(null)
                                        setOtpInput('')
                                    }}
                                    style={{ ...topBtn('#fff', KC.ink), flex: 1 }}
                                >
                                    Batal
                                </button>
                                {formOpen === 'phone' && otpStep === 'verify' ? (
                                    <button
                                        onClick={handleConfirmOTP}
                                        disabled={busy === 'otp_confirm'}
                                        style={{ ...topBtn(KC.orange, '#fff'), flex: 1 }}
                                    >
                                        {busy === 'otp_confirm' ? 'Memverifikasi…' : 'Verifikasi OTP'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleVerify(formOpen)}
                                        disabled={busy === formOpen}
                                        style={{ ...topBtn(KC.orange, '#fff'), flex: 1 }}
                                    >
                                        {busy === formOpen ? 'Memproses…' : (formOpen === 'phone' ? 'Kirim Kode OTP' : 'Kirim Validasi')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
