/**
 * VerificationDashboard — E-KYC Identity Verification matching Mobile Frame 11.
 */
import { useState } from 'react'
import useStore from '../store/useStore'
import { KC, DesignStyles } from './_design'
import { verifyIdentity, verifyEducation } from '../services/api'
import toast from 'react-hot-toast'

export default function VerificationDashboard() {
    const { profile, loadSeekerProfile } = useStore()
    const [ktpVerified, setKtpVerified] = useState(profile?.ktp_verified || false)
    const [ktpChecking, setKtpChecking] = useState(false)
    const [ijazahVerified, setIjazahVerified] = useState(profile?.ijazah_verified || false)
    const [ijazahInput, setIjazahInput] = useState('')
    const [ijazahChecking, setIjazahChecking] = useState(false)

    // Calculate score based on completed items
    const completedCount = 1 + (ktpVerified ? 1 : 0) + (ijazahVerified ? 1 : 0) // phone verified by default
    const trustScore = Math.round((completedCount / 4) * 100)

    const handleSimulateKTP = async () => {
        setKtpChecking(true)
        try {
            const res = await verifyIdentity({ nik: '3271012345670004', full_name: profile?.full_name || 'Budi Santoso' })
            if (res?.status === 'VERIFIED') {
                setKtpVerified(true)
                toast.success('NIK 3271••••••••0004 berhasil divalidasi!')
                await loadSeekerProfile()
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
        setIjazahChecking(true)
        try {
            const institution = profile?.education?.[0]?.institution || 'Institut Teknologi Bandung'
            const res = await verifyEducation({ ijazah_number: ijazahInput.trim(), institution_name: institution })
            if (res?.status === 'VERIFIED') {
                setIjazahVerified(true)
                toast.success('Nomor ijazah terverifikasi via format SIVIL Dikti!')
                await loadSeekerProfile()
            } else {
                toast.error(res?.message || 'Nomor ijazah tidak ditemukan pada PDDikti/SIVIL')
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
                        <div
                            onClick={handleSimulateKTP}
                            style={{
                                background: '#F8FAFC', border: `1.5px dashed ${KC.ink}`,
                                borderRadius: 11, padding: '18px 14px', textAlign: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            {/* KTP Illustration Icon */}
                            <div style={{
                                width: 64, height: 42, margin: '0 auto 11px',
                                border: '1.5px solid #64748B', borderRadius: 6,
                                position: 'relative', background: '#FFFFFF',
                            }}>
                                <div style={{ position: 'absolute', left: 7, top: 8, width: 14, height: 14, borderRadius: '50%', background: '#E2E8F0' }} />
                                <div style={{ position: 'absolute', left: 26, top: 10, right: 7, height: 3, background: '#E2E8F0', borderRadius: 2 }} />
                                <div style={{ position: 'absolute', left: 26, top: 18, right: 14, height: 3, background: '#E2E8F0', borderRadius: 2 }} />
                                <div style={{ position: 'absolute', left: 7, bottom: 7, right: 7, height: 3, background: '#E2E8F0', borderRadius: 2 }} />
                            </div>

                            <button
                                type="button"
                                style={{
                                    padding: '12px 16px', background: ktpChecking ? '#64748B' : KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12.5,
                                    fontWeight: 800, color: '#fff', minHeight: 44,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                {ktpChecking ? 'Mengecek Format KTP…' : 'Buka Kamera · Foto KTP'}
                            </button>

                            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 9 }}>
                                Posisikan KTP di dalam bingkai · pastikan NIK terbaca
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '12px 13px', background: '#ECFDF5', border: '1.5px solid #10B981',
                            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>✓</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46' }}>NIK terbaca & format valid</div>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#059669', marginTop: 3 }}>3271••••••••0004</div>
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
                                <span style={{ width: 9, height: 9, background: '#10B981', borderRadius: '50%' }} />
                                <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>
                                    Nomor Telepon
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                OTP 6 digit · kode ter-hash, kedaluwarsa 5 menit
                            </div>
                        </div>
                        <span style={{
                            padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981',
                            borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: '#065F46', flexShrink: 0,
                        }}>
                            Selesai ✓
                        </span>
                    </div>

                    {/* 6 OTP Boxes */}
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between' }}>
                        {['4', '9', '2', '7', '1', '3'].map((digit, dIdx) => (
                            <div
                                key={dIdx}
                                style={{
                                    flex: 1, aspectRatio: '1', maxWidth: 46,
                                    background: '#F8FAFC', border: '1.5px solid #10B981',
                                    borderRadius: 9, display: 'grid', placeItems: 'center',
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: 17,
                                    fontWeight: 900, color: '#065F46',
                                }}
                            >
                                {digit}
                            </div>
                        ))}
                    </div>

                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 700, color: '#059669', marginTop: 11 }}>
                        +62 812-•••-4471 terverifikasi
                    </div>
                </div>

                {/* 3. Ijazah SIVIL Dikti Card */}
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
                                    Ijazah SIVIL Dikti
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
                            ✓ Ijazah terdaftar dan format valid PDDikti SIVIL
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
