import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import useStore from '../store/useStore'

// ════════════════════════════════════════════════════════════════════════════
// KerjaCerdas — Professional Neobrutalism Authentication Modal
// Minimalist, Innovation-Driven Enterprise Design System
// ════════════════════════════════════════════════════════════════════════════

const KC = {
    ink: '#090A0F',
    bone: '#FAF9F5',
    paper: '#FFFFFF',
    surface: '#F2EFE9',
    surfaceAlt: '#E9E5DC',
    orange: '#FF4800',
    orangeSoft: '#FFF0EB',
    yellow: '#FFC800',
    yellowSoft: '#FFF9E6',
    cyan: '#00B8D9',
    cyanSoft: '#E6F8FA',
    lime: '#B4F51C',
    limeSoft: '#F4FDE5',
    purple: '#7C3AED',
    purpleSoft: '#F3E8FF',
    mute: '#4A4944',
    muteLight: '#76746C',
    ash: '#DDD9D0',
    border: '#090A0F',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'

const AUTH_CSS = `
@keyframes kc-auth-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes kc-auth-slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes kc-auth-card-pop {
  0% { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

.kc-auth-wrapper {
  animation: kc-auth-fade 0.2s ease-out both;
}
.kc-auth-content {
  animation: kc-auth-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.kc-auth-btn {
  user-select: none;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.kc-auth-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #090A0F !important;
}
.kc-auth-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #090A0F !important;
}

.kc-auth-input {
  width: 100%;
  padding: 11px 14px;
  background: #FFFFFF;
  border: 2px solid #090A0F;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: ${FONT};
  color: #090A0F;
  outline: none;
  box-sizing: border-box;
  transition: all 0.15s ease;
}
.kc-auth-input:focus {
  border-color: #090A0F;
  box-shadow: 3px 3px 0 #FF4800;
  transform: translateY(-1px);
}
.kc-auth-input::placeholder {
  color: #9CA3AF;
  font-weight: 500;
}

.kc-role-btn {
  cursor: pointer;
  transition: all 0.15s ease;
}
.kc-role-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .kc-auth-left {
    display: none !important;
  }
  .kc-auth-return-text {
    display: none !important;
  }
}
`

function Logo({ size = 28, color = KC.ink, mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 7, background: mark,
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `2.5px 2.5px 0 ${color}`, transform: 'rotate(-3deg)',
            }}>
                <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
                    <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: -0.5, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

export default function AuthModal() {
    const {
        showAuthModal,
        closeAuthModal,
        authTab,
        setAuthTab,
        preferredAuthRole,
        login,
        register,
    } = useStore()

    // Form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('seeker') // 'seeker' | 'employer'
    const [showPassword, setShowPassword] = useState(false)
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const closeBtnRef = useRef(null)

    useEffect(() => {
        if (!showAuthModal) return undefined

        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeAuthModal()
        }

        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        window.addEventListener('keydown', onKeyDown)
        closeBtnRef.current?.focus()

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = prevOverflow
        }
    }, [showAuthModal, closeAuthModal])

    useEffect(() => {
        if (preferredAuthRole) {
            setRole(preferredAuthRole)
        }
    }, [preferredAuthRole])

    const validate = () => {
        const errs = {}
        if (authTab === 'register' && !name.trim()) errs.name = 'Nama lengkap / perusahaan wajib diisi'
        if (!email.trim()) errs.email = 'Alamat email wajib diisi'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid'
        if (!password) errs.password = 'Kata sandi wajib diisi'
        else if (authTab === 'register' && password.length < 8) errs.password = 'Kata sandi minimal 8 karakter'
        if (authTab === 'register' && !agreeTerms) errs.terms = 'Anda harus menyetujui ketentuan layanan & privasi'
        return errs
    }

    const clearErrors = (...keys) => {
        setErrors((prev) => {
            let changed = false
            const next = { ...prev }
            keys.forEach((key) => {
                if (next[key]) {
                    delete next[key]
                    changed = true
                }
            })
            return changed ? next : prev
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setLoading(true)
        try {
            if (authTab === 'login') {
                await login(email, password)
            } else {
                await register(name, email, password, role)
            }
            resetForm()
        } catch (err) {
            const msg = err?.message || 'Gagal masuk — silakan coba kembali'
            if (/already exists/i.test(msg)) {
                setErrors({ email: 'Email sudah terdaftar. Silakan gunakan tab Masuk.' })
            } else if (/invalid email or password/i.test(msg) || /incorrect/i.test(msg) || /unauthorized/i.test(msg) || /401/i.test(msg)) {
                setErrors({ password: 'Email atau kata sandi salah. Silakan periksa kembali.' })
            } else if (/inactive/i.test(msg)) {
                setErrors({ email: 'Akun tidak aktif. Hubungi tim dukungan KerjaCerdas.' })
            } else {
                setErrors({ submit: msg })
            }
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setEmail('')
        setPassword('')
        setShowPassword(false)
        setAgreeTerms(false)
        setErrors({})
    }

    useEffect(() => {
        if (!showAuthModal) {
            resetForm()
        }
    }, [showAuthModal])

    const switchTab = (tab) => {
        setAuthTab(tab)
        setErrors({})
    }

    if (!showAuthModal) return null

    const isLogin = authTab === 'login'

    return (
        <div
            className="kc-auth-wrapper"
            style={{
                position: 'fixed', inset: 0, zIndex: 120,
                background: 'rgba(9, 10, 15, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, overflowY: 'auto', fontFamily: FONT,
            }}
            onClick={closeAuthModal}
        >
            <style>{AUTH_CSS}</style>

            <div
                className="kc-auth-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: 960, background: '#FAF9F5',
                    border: `2px solid ${KC.ink}`, borderRadius: 16,
                    boxShadow: `8px 8px 0 ${KC.ink}`, overflow: 'hidden',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    position: 'relative', margin: 'auto',
                }}
            >
                {/* ─── LEFT BRANDING & VALUE COLUMN ─── */}
                <div
                    className="kc-auth-left"
                    style={{
                        background: isLogin ? KC.ink : '#FFFFFF',
                        color: isLogin ? '#FFFFFF' : KC.ink,
                        padding: '36px 32px',
                        borderRight: `2px solid ${KC.ink}`,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        position: 'relative',
                    }}
                >
                    {/* Top Header */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                            <Logo size={28} color={isLogin ? '#FFFFFF' : KC.ink} />
                            <span style={{
                                padding: '3px 10px', fontSize: 10, fontWeight: 900,
                                background: isLogin ? KC.orange : KC.yellow,
                                color: isLogin ? '#FFFFFF' : KC.ink,
                                border: `1.5px solid ${isLogin ? '#FFFFFF' : KC.ink}`,
                                borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                                {isLogin ? 'Masuk' : 'Daftar Akun'}
                            </span>
                        </div>

                        <h2 style={{
                            fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900,
                            letterSpacing: -1.2, lineHeight: 1.15, margin: '0 0 14px',
                        }}>
                            {isLogin ? (
                                <>
                                    Akses Portal Rekrutmen & Karier <span style={{ color: KC.orange }}>Presisi.</span>
                                </>
                            ) : (
                                <>
                                    Daftar Ekosistem Kerja yang <span style={{
                                        background: KC.orange, color: '#fff', padding: '1px 8px',
                                        borderRadius: 6, border: `1.5px solid ${KC.ink}`,
                                        boxShadow: `2px 2px 0 ${KC.ink}`, display: 'inline-block',
                                    }}>Terverifikasi.</span>
                                </>
                            )}
                        </h2>

                        <p style={{
                            fontSize: 13, lineHeight: 1.6,
                            color: isLogin ? '#D1D5DB' : KC.mute, margin: '0 0 24px',
                        }}>
                            {isLogin
                                ? 'Masuk untuk memantau status seleksi lamaran, kelola kandidat, dan analisis keselarasan skill real-time.'
                                : 'Hubungkan profil kompetensi Anda langsung dengan kebutuhan industri tanpa perantara.'}
                        </p>

                        {/* Feature Badges Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                {
                                    title: 'Pencocokan Semantik Berbobot',
                                    desc: 'Mencocokkan keahlian riil terhadap kebutuhan posisi yang dicari.',
                                    accent: KC.cyan,
                                },
                                {
                                    title: 'Profil Terverifikasi',
                                    desc: 'Validasi dokumen resmi untuk menjaga transparansi seleksi.',
                                    accent: KC.lime,
                                },
                                {
                                    title: 'Analisis Celah Kompetensi',
                                    desc: 'Petakan keahlian yang perlu ditingkatkan untuk posisi target.',
                                    accent: KC.yellow,
                                },
                            ].map((item, idx) => (
                                <div key={idx} style={{
                                    background: isLogin ? '#14151D' : '#FAF9F5',
                                    border: `1.5px solid ${isLogin ? 'rgba(255,255,255,0.18)' : KC.ink}`,
                                    borderRadius: 10, padding: '10px 12px',
                                    boxShadow: isLogin ? 'none' : `2.5px 2.5px 0 ${KC.ink}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: item.accent, border: `1px solid ${isLogin ? '#fff' : KC.ink}` }} />
                                        <span style={{ fontSize: 12, fontWeight: 800, color: isLogin ? '#fff' : KC.ink }}>
                                            {item.title}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 11, color: isLogin ? '#9CA3AF' : KC.muteLight, margin: 0, lineHeight: 1.45 }}>
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT INTERACTIVE FORM COLUMN ─── */}
                <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top Action Bar (Close & Tab Switcher) */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            {/* Tab Switcher */}
                            <div style={{
                                display: 'inline-flex', background: '#FFFFFF',
                                border: `2px solid ${KC.ink}`, borderRadius: 8,
                                padding: 3, boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                            }}>
                                <button
                                    type="button"
                                    onClick={() => switchTab('login')}
                                    style={{
                                        padding: '6px 16px', fontSize: 12, fontWeight: 800,
                                        background: isLogin ? KC.ink : 'transparent',
                                        color: isLogin ? '#FFFFFF' : KC.mute,
                                        borderRadius: 6, border: 'none', cursor: 'pointer',
                                        fontFamily: FONT, transition: 'all 0.15s ease',
                                    }}
                                >
                                    Masuk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchTab('register')}
                                    style={{
                                        padding: '6px 16px', fontSize: 12, fontWeight: 800,
                                        background: !isLogin ? KC.ink : 'transparent',
                                        color: !isLogin ? '#FFFFFF' : KC.mute,
                                        borderRadius: 6, border: 'none', cursor: 'pointer',
                                        fontFamily: FONT, transition: 'all 0.15s ease',
                                    }}
                                >
                                    Daftar Akun
                                </button>
                            </div>

                            {/* Crisp X Close Button */}
                            <button
                                ref={closeBtnRef}
                                onClick={closeAuthModal}
                                className="kc-auth-btn"
                                style={{
                                    display: 'grid', placeItems: 'center',
                                    width: 32, height: 32,
                                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 8, cursor: 'pointer',
                                    boxShadow: `2px 2px 0 ${KC.ink}`, color: KC.ink,
                                }}
                                title="Tutup"
                                aria-label="Tutup"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={KC.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div style={{ marginBottom: 18 }}>
                            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.8, margin: '0 0 4px', color: KC.ink }}>
                                {isLogin ? 'Selamat Datang Kembali' : 'Buat Akun KerjaCerdas'}
                            </h3>
                            <p style={{ fontSize: 13, color: KC.mute, margin: 0 }}>
                                {isLogin
                                    ? 'Gunakan email dan kata sandi yang telah terdaftar.'
                                    : 'Daftar gratis dalam 1 menit dan temukan peluang yang presisi.'}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Role Selector (Daftar or Login context) */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, color: KC.ink }}>
                                    Kategori Akun
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setRole('seeker')}
                                        className="kc-role-btn"
                                        style={{
                                            padding: '8px 10px',
                                            background: role === 'seeker' ? KC.cyanSoft : '#FFFFFF',
                                            border: `2px solid ${role === 'seeker' ? KC.ink : KC.ash}`,
                                            borderRadius: 8,
                                            boxShadow: role === 'seeker' ? `3px 3px 0 ${KC.ink}` : 'none',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
                                        }}
                                    >
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 5, background: KC.cyan,
                                            border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                            fontSize: 11, fontWeight: 900, color: KC.ink,
                                        }}>
                                            👤
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: KC.ink }}>Pencari Kerja</div>
                                            <div style={{ fontSize: 10, color: KC.mute }}>Talenta & Profesional</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setRole('employer')}
                                        className="kc-role-btn"
                                        style={{
                                            padding: '8px 10px',
                                            background: role === 'employer' ? KC.orangeSoft : '#FFFFFF',
                                            border: `2px solid ${role === 'employer' ? KC.ink : KC.ash}`,
                                            borderRadius: 8,
                                            boxShadow: role === 'employer' ? `3px 3px 0 ${KC.ink}` : 'none',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
                                        }}
                                    >
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 5, background: KC.orange,
                                            border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                            fontSize: 11, fontWeight: 900, color: '#fff',
                                        }}>
                                            🏢
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: KC.ink }}>Employer / HR</div>
                                            <div style={{ fontSize: 10, color: KC.mute }}>Perusahaan & Rekruter</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Name field (Register only) */}
                            {!isLogin && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink }}>
                                            {role === 'employer' ? 'Nama Perusahaan / Instansi *' : 'Nama Lengkap *'}
                                        </label>
                                        {errors.name && <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{errors.name}</span>}
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); clearErrors('name') }}
                                        placeholder={role === 'employer' ? 'PT Teknologi Nusantara' : 'Rina Paramitha'}
                                        className="kc-auth-input"
                                        style={{ borderColor: errors.name ? '#DC2626' : KC.ink }}
                                    />
                                </div>
                            )}

                            {/* Email field */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink }}>
                                        Alamat Email *
                                    </label>
                                    {errors.email && <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{errors.email}</span>}
                                </div>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearErrors('email') }}
                                    placeholder={role === 'employer' ? 'hr@perusahaan.co.id' : 'nama@domain.com'}
                                    className="kc-auth-input"
                                    style={{ borderColor: errors.email ? '#DC2626' : KC.ink }}
                                />
                            </div>

                            {/* Password field */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink }}>
                                        Kata Sandi *
                                    </label>
                                    {errors.password && <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{errors.password}</span>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); clearErrors('password') }}
                                        placeholder="••••••••••••"
                                        className="kc-auth-input"
                                        style={{ borderColor: errors.password ? '#DC2626' : KC.ink, paddingRight: 40 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                                            color: KC.mute, fontSize: 12, fontWeight: 800,
                                        }}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {!isLogin && (
                                    <div style={{ fontSize: 10, color: KC.muteLight, marginTop: 4 }}>
                                        Minimal 8 karakter kombinasi huruf & angka.
                                    </div>
                                )}
                            </div>

                            {/* Terms Checkbox (Register only) */}
                            {!isLogin && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 2 }}>
                                    <input
                                        type="checkbox"
                                        id="termsCheckbox"
                                        checked={agreeTerms}
                                        onChange={(e) => { setAgreeTerms(e.target.checked); clearErrors('terms') }}
                                        style={{ width: 16, height: 16, marginTop: 2, accentColor: KC.orange, cursor: 'pointer' }}
                                    />
                                    <label htmlFor="termsCheckbox" style={{ fontSize: 11, color: KC.mute, lineHeight: 1.45, cursor: 'pointer' }}>
                                        Saya menyetujui <b>Syarat & Ketentuan</b> serta <b>Kebijakan Privasi</b> KerjaCerdas. Data sensitif dienkripsi secara ketat.
                                    </label>
                                </div>
                            )}
                            {errors.terms && <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>{errors.terms}</div>}

                            {/* General Submit Error */}
                            {errors.submit && (
                                <div style={{
                                    padding: '8px 12px', background: '#FEE2E2', border: '1.5px solid #DC2626',
                                    borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#B91C1C',
                                }}>
                                    {errors.submit}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="kc-auth-btn"
                                style={{
                                    padding: '13px', marginTop: 4,
                                    background: isLogin ? KC.ink : KC.orange,
                                    color: '#FFFFFF', border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, fontSize: 14, fontWeight: 900,
                                    boxShadow: isLogin ? `4px 4px 0 ${KC.orange}` : `4px 4px 0 ${KC.ink}`,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: FONT, opacity: loading ? 0.75 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {loading ? (
                                    <span>Memproses...</span>
                                ) : isLogin ? (
                                    <span>Masuk ke Akun →</span>
                                ) : (
                                    <span>Buat Akun Sekarang →</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom Prompt */}
                    <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${KC.ash}`, textAlign: 'center', fontSize: 12, color: KC.mute }}>
                        {isLogin ? (
                            <>
                                Belum memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchTab('register')}
                                    style={{ background: 'none', border: 'none', padding: 0, fontWeight: 800, color: KC.orange, cursor: 'pointer', fontFamily: FONT }}
                                >
                                    Daftar di sini
                                </button>
                            </>
                        ) : (
                            <>
                                Sudah memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchTab('login')}
                                    style={{ background: 'none', border: 'none', padding: 0, fontWeight: 800, color: KC.ink, cursor: 'pointer', fontFamily: FONT }}
                                >
                                    Masuk di sini
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
