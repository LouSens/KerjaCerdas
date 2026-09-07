/**
 * VerificationDashboard — E-KYC Identity Verification matching Mobile Frame 11.
 */
import { useState } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles } from './_design'
import { verifyIdentity, verifyEducation } from '../services/api'
import toast from 'react-hot-toast'

export default function VerificationDashboard() {
    // ktp_verified/ijazah_verified are derived from the backend's
    // nik_verified/ijazah_verified columns (backend/app/api/routers/verify.py
    // persists the VERIFIED/FAILED outcome to the seeker's own profile row),
    // refreshed into the store by loadSeekerProfile. Reading them directly
    // here (instead of snapshotting into local state) is what keeps this
    // dashboard and SeekerDashboard's checklist showing the same value.
    const { profile, updateProfile, loadSeekerProfile } = useStore()
    const ktpVerified = Boolean(profile?.ktp_verified)
    const ijazahVerified = Boolean(profile?.ijazah_verified)
    const [ktpChecking, setKtpChecking] = useState(false)
    const [nikInput, setNikInput] = useState('')
    // Never stored anywhere, not even locally — this is only held in memory
    // long enough to show a masked confirmation right after a successful
    // check, matching the backend's own refusal to retain the raw NIK.
    const [verifiedNikDisplay, setVerifiedNikDisplay] = useState('')
    const [ijazahInput, setIjazahInput] = useState('')
    const [ijazahChecking, setIjazahChecking] = useState(false)
    const phoneVerified = Boolean(profile?.phone_verified)

    // Calculate score based on completed items
    const completedCount = (phoneVerified ? 1 : 0) + (ktpVerified ? 1 : 0) + (ijazahVerified ? 1 : 0)
    const trustScore = Math.round((completedCount / 4) * 100)

    const handleSimulateKTP = async () => {
        const nik = nikInput.trim()
        if (nik.length !== 16 || !/^\d{16}$/.test(nik)) {
            toast.error('NIK wajib 16 digit angka')
            return
        }
        const fullName = (profile?.full_name || '').trim()
        if (!fullName) {
            toast.error('Nama lengkap belum terisi. Lengkapi profil Anda terlebih dahulu.')
            return
        }
        setKtpChecking(true)
        try {
            const res = await verifyIdentity({ nik, full_name: fullName })
            if (res?.status === 'VERIFIED') {
                // Optimistic local flip for instant feedback, then reconcile
                // with the backend's now-durable nik_verified column so a
                // reload or another device shows the same "Selesai" state
                // instead of losing it.
                updateProfile({ ktp_verified: true })
                await loadSeekerProfile()
                setVerifiedNikDisplay(nik)
                setNikInput('')
                toast.success('NIK berhasil divalidasi!')
            } else {
                toast.error(res?.message || 'Verifikasi NIK gagal')
            }
        } catch (e) {
            toast.error('Verifikasi NIK gagal: ' + (e.message || 'Terjadi kesalahan'))
        } finally {
            setKtpChecking(false)
        }
    }

    const handleCheckIjazah = async () => {
        if (!ijazahInput.trim()) {
            toast.error('Masukkan nomor ijazah')
            return
        }
        const institution = profile?.education?.[0]?.institution
        const major = profile?.education?.[0]?.major
        if (!institution || !major) {
            toast.error('Riwayat pendidikan belum terisi di profil Anda. Lengkapi profil terlebih dahulu.')
            return
        }
        setIjazahChecking(true)
        try {
            const res = await verifyEducation({ ijazah_number: ijazahInput.trim(), university_name: institution, major })
            if (res?.status === 'VERIFIED') {
                updateProfile({ ijazah_verified: true })
                await loadSeekerProfile()
                toast.success('Format nomor ijazah tervalidasi!')
            } else {
                toast.error(res?.message || 'Format nomor ijazah tidak valid')
            }
        } catch (e) {
            toast.error('Verifikasi Ijazah gagal: ' + (e.message || 'Terjadi kesalahan'))
        } finally {
            setIjazahChecking(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Header (Frame 11) */}
            <div>
                <h1 style={{
                    fontSize: 22, fontWeight: 900, letterSpacing: -0.9,
                    color: KC.ink, margin: '0 0 5px', lineHeight: 1.1,
                }}>
                    Verifikasi Identitas
                </h1>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                    {completedCount} dari 4 selesai · prioritas kurasi hingga 3× lipat
                </div>
            </div>

            {/* Dark Trust Score Card (Frame 11) */}
            <div style={{
                background: '#090A0F', border: `1.5px solid ${KC.ink}`,
                borderRadius: 13, boxShadow: `3px 3px 0 ${KC.orange}`,
                padding: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                    <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)',
                    }}>
                        Trust score
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1 }}>
                        {trustScore}%
                    </span>
                </div>

                <div style={{ height: 9, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${trustScore}%`, background: KC.orange,
                        borderRadius: 999, transition: 'width .6s ease',
                    }} />
                </div>

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 11, lineHeight: 1.5, fontWeight: 600 }}>
                    Lengkapi KTP dan ijazah untuk naik ke 100% dan muncul lebih tinggi pada shortlist rekruter.
                </div>
            </div>

            {/* Verification Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 1. Identitas KTP Card */}
                <div style={{
                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                    borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                    padding: 15,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ width: 9, height: 9, background: ktpVerified ? '#10B981' : KC.orange, borderRadius: '50%' }} />
                                <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>
                                    Identitas KTP
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                Pemeriksaan format NIK · disimpan ter-hash SHA-256
                            </div>
                        </div>
                        <span style={{
                            padding: '4px 9px',
                            background: ktpVerified ? '#ECFDF5' : '#FFF1EB',
                            border: `1px solid ${ktpVerified ? '#10B981' : KC.orange}`,
                            borderRadius: 999, fontSize: 9.5, fontWeight: 800,
                            color: ktpVerified ? '#065F46' : '#9A3412', flexShrink: 0,
                        }}>
                            {ktpVerified ? 'Selesai ✓' : 'Belum'}
                        </span>
                    </div>

                    {!ktpVerified ? (
                        <>
                            <input
                                value={nikInput}
                                onChange={(e) => setNikInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                placeholder="16 digit NIK sesuai KTP"
                                inputMode="numeric"
                                maxLength={16}
                                style={{
                                    width: '100%', padding: '12px 13px', background: '#F8FAFC',
                                    border: `1.5px solid #CBD5E1`, borderRadius: 10,
                                    fontSize: 12, fontWeight: 600, color: KC.ink,
                                    fontFamily: '"JetBrains Mono", monospace', letterSpacing: 0.5,
                                    boxSizing: 'border-box', outline: 'none', marginBottom: 11,
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleSimulateKTP}
                                disabled={ktpChecking}
                                style={{
                                    width: '100%', padding: '12px 16px', background: ktpChecking ? '#64748B' : KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12.5,
                                    fontWeight: 800, color: '#fff', minHeight: 44,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: ktpChecking ? 'wait' : 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                {ktpChecking ? 'Mengecek Format NIK…' : 'Periksa NIK'}
                            </button>

                            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 9 }}>
                                Hanya hash NIK yang disimpan (SHA-256), sesuai UU-PDP-2022.
                            </div>
                        </>
                    ) : (
                        <div style={{
                            padding: '12px 13px', background: '#ECFDF5', border: '1.5px solid #10B981',
                            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>✓</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46' }}>NIK terbaca & format valid</div>
                                {verifiedNikDisplay && (
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#059669', marginTop: 3 }}>
                                        {verifiedNikDisplay.slice(0, 4)}{'•'.repeat(Math.max(0, verifiedNikDisplay.length - 8))}{verifiedNikDisplay.slice(-4)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{
                        marginTop: 11, padding: '10px 12px', background: '#FEF3C7',
                        border: '1px solid #F59E0B', borderRadius: 9, fontSize: 10.5,
                        lineHeight: 1.5, color: '#92400E', fontWeight: 600,
                    }}>
                        Status: pemeriksaan format internal. Integrasi resmi Dukcapil memerlukan kontrak dan kepatuhan regulasi.
                    </div>
                </div>

                {/* 2. Nomor Telepon OTP Card */}
                <div style={{
                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                    borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                    padding: 15,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ width: 9, height: 9, background: phoneVerified ? '#10B981' : KC.orange, borderRadius: '50%' }} />
                                <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>
                                    Nomor Telepon
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                OTP 6 digit · kode ter-hash, kedaluwarsa 5 menit
                            </div>
                        </div>
                        <span style={{
                            padding: '4px 9px',
                            background: phoneVerified ? '#ECFDF5' : '#FFF1EB',
                            border: `1px solid ${phoneVerified ? '#10B981' : KC.orange}`,
                            borderRadius: 999, fontSize: 9.5, fontWeight: 800,
                            color: phoneVerified ? '#065F46' : '#9A3412', flexShrink: 0,
                        }}>
                            {phoneVerified ? 'Selesai ✓' : 'Belum'}
                        </span>
                    </div>

                    {phoneVerified ? (
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 700, color: '#059669' }}>
                            {profile?.phone ? `${profile.phone} terverifikasi` : 'Nomor terverifikasi'}
                        </div>
                    ) : (
                        <div style={{
                            padding: '10px 12px', background: '#FEF3C7', border: '1px solid #F59E0B',
                            borderRadius: 9, fontSize: 10.5, lineHeight: 1.5, color: '#92400E', fontWeight: 600,
                        }}>
                            Verifikasi nomor telepon via OTP belum tersedia di sesi ini.
                        </div>
                    )}
                </div>

                {/* 3. Ijazah Verification Card */}
                <div style={{
                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                    borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                    padding: 15,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ width: 9, height: 9, background: ijazahVerified ? '#10B981' : '#F59E0B', borderRadius: '50%' }} />
                                <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>
                                    Ijazah
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                Nomor ijazah & institusi · pemeriksaan format
                            </div>
                        </div>
                        <span style={{
                            padding: '4px 9px',
                            background: ijazahVerified ? '#ECFDF5' : '#FFF1EB',
                            border: `1px solid ${ijazahVerified ? '#10B981' : KC.orange}`,
                            borderRadius: 999, fontSize: 9.5, fontWeight: 800,
                            color: ijazahVerified ? '#065F46' : '#9A3412', flexShrink: 0,
                        }}>
                            {ijazahVerified ? 'Selesai ✓' : 'Belum'}
                        </span>
                    </div>

                    {!ijazahVerified ? (
                        <>
                            <input
                                value={ijazahInput}
                                onChange={(e) => setIjazahInput(e.target.value)}
                                placeholder="Nomor ijazah perguruan tinggi"
                                style={{
                                    width: '100%', padding: '12px 13px', background: '#F8FAFC',
                                    border: `1.5px solid #CBD5E1`, borderRadius: 10,
                                    fontSize: 12, fontWeight: 600, color: KC.ink,
                                    boxSizing: 'border-box', outline: 'none', marginBottom: 11,
                                    fontFamily: 'inherit',
                                }}
                            />
                            <button
                                onClick={handleCheckIjazah}
                                disabled={ijazahChecking}
                                style={{
                                    width: '100%', padding: '12px 16px', background: '#090A0F',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.orange}`, fontSize: 12.5,
                                    fontWeight: 800, color: '#fff', minHeight: 44,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: ijazahChecking ? 'wait' : 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                {ijazahChecking ? 'Memeriksa Format…' : 'Periksa Ijazah'}
                            </button>
                        </>
                    ) : (
                        <div style={{ padding: '10px 12px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 8, fontSize: 11, color: '#065F46', fontWeight: 700 }}>
                            ✓ Format nomor ijazah tervalidasi
                        </div>
                    )}
                </div>

                {/* 4. NPWP (Employer Only) */}
                <div style={{
                    background: '#F1F5F9', border: '1.5px solid #CBD5E1',
                    borderRadius: 13, padding: 15,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 13.5, fontWeight: 900, color: '#64748B', marginBottom: 3 }}>
                                NPWP
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                Hanya untuk akun Employer / HR
                            </div>
                        </div>
                        <span style={{
                            padding: '4px 9px', background: '#FFFFFF', border: '1px solid #CBD5E1',
                            borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: '#94A3B8',
                        }}>
                            N/A
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
