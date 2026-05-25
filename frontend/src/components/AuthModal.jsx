import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { X, Mail, Lock, User, Search, Eye, EyeOff, Zap, Building2, UserCheck, Shield, ArrowLeft } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * AuthModal — Full-screen modal for login and registration.
 * Supports role selection: Pencari Kerja (seeker) or Pemberi Kerja (employer).
 * Glassmorphism design with animated transitions.
 */
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
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState(null) // 'seeker' | 'employer'
    const [showPassword, setShowPassword] = useState(false)
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const closeBtnRef = useRef(null)

    useEffect(() => {
        if (!showAuthModal) return undefined

        // Close on Escape and move initial keyboard focus to the close button.
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeAuthModal()
        }

        // Lock background scroll while modal is open
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
        if (preferredAuthRole && !role) {
            setRole(preferredAuthRole)
        }
    }, [preferredAuthRole, role])

    /**
     * Validates form fields and returns error object.
     */
    const validate = () => {
        const errs = {}
        if (authTab === 'register' && !name.trim()) errs.name = 'Nama wajib diisi'
        if (!email.trim()) errs.email = 'Email wajib diisi'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Format email tidak valid'
        if (!password) errs.password = 'Password wajib diisi'
        // Backend requires min 8 on register; keep relaxed for login so legacy users can sign in
        else if (authTab === 'register' && password.length < 8) errs.password = 'Password minimal 8 karakter'
        // Role only required when registering — backend infers role from the user record on login
        if (authTab === 'register' && !role) errs.role = 'Pilih tipe akun'
        if (authTab === 'register' && !agreeTerms) errs.terms = 'Setujui syarat dan ketentuan'
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

    const selectRole = (nextRole) => {
        setRole(nextRole)
        clearErrors('role')
    }

    const handleRoleKeyDown = (event, currentRole) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            selectRole(currentRole)
            return
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault()
            selectRole(currentRole === 'seeker' ? 'employer' : 'seeker')
            return
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault()
            selectRole(currentRole === 'seeker' ? 'employer' : 'seeker')
        }
    }

    /**
     * Handles form submission for both login and register.
     */
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
            const msg = err?.message || 'Gagal — coba lagi'
            // Map common backend errors into field-level errors when possible
            if (/already exists/i.test(msg)) setErrors({ email: 'Email sudah terdaftar' })
            else if (/invalid email or password/i.test(msg)) setErrors({ password: 'Email atau sandi salah' })
            else if (/inactive/i.test(msg)) setErrors({ email: 'Akun tidak aktif — hubungi support' })
            else setErrors({ submit: msg })
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Resets all form fields to initial state.
     */
    const resetForm = () => {
        setName(''); setEmail(''); setPassword(''); setConfirmPassword('')
        setRole(null); setShowPassword(false); setAgreeTerms(false); setErrors({})
    }

    useEffect(() => {
        if (!showAuthModal) {
            resetForm()
        }
    }, [showAuthModal])

    /**
     * Switches between login and register tabs and resets errors.
     */
    const switchTab = (tab) => {
        setAuthTab(tab)
        setErrors({})
    }

    if (!showAuthModal) return null

    return (
        <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-kc-cream font-sans animate-fade-in overflow-hidden">
            <style>{`
                @keyframes kc-auth-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
                @keyframes kc-auth-pop { 0% { opacity: 0; transform: scale(.6) rotate(-18deg); } 70% { transform: scale(1.06) rotate(-9deg); } 100% { opacity: 1; transform: scale(1) rotate(-12deg); } }
                .kc-auth-stagger > .kc-auth-item { opacity: 0; animation: kc-auth-up .55s cubic-bezier(.22,.61,.36,1) forwards; }
                .kc-auth-stagger > .kc-auth-item:nth-child(1) { animation-delay: .05s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(2) { animation-delay: .15s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(3) { animation-delay: .25s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(4) { animation-delay: .35s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(5) { animation-delay: .45s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(6) { animation-delay: .55s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(7) { animation-delay: .65s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(8) { animation-delay: .75s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(9) { animation-delay: .85s; }
                .kc-auth-stagger > .kc-auth-item:nth-child(10) { animation-delay: .95s; }
                .kc-auth-sticker { opacity: 0; animation: kc-auth-pop .8s cubic-bezier(.34,1.56,.64,1) forwards; animation-delay: .35s; }
            `}</style>

            {/* ─── LEFT COLUMN ─── */}
            <div className={`w-full lg:w-1/2 relative z-10 lg:h-screen overflow-y-auto border-b-2 lg:border-b-0 lg:border-r-2 border-kc-dark ${authTab === 'login' ? 'bg-kc-dark text-white' : 'bg-kc-cream text-kc-dark'}`}>
                {/* Single elegant return chip — sits IN the left panel (no floating dual buttons) */}
                <button
                    ref={closeBtnRef}
                    onClick={closeAuthModal}
                    className={`absolute top-5 left-5 lg:top-7 lg:left-8 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-xs font-black uppercase tracking-widest shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal transition-all ${authTab === 'login' ? 'bg-white border-kc-dark text-kc-dark hover:bg-kc-yellow' : 'bg-white border-kc-dark text-kc-dark hover:bg-kc-yellow'}`}
                    aria-label="Kembali ke beranda"
                >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={3} />
                    Kembali ke Beranda
                </button>

                <div className="p-8 md:p-12 lg:p-20 lg:pt-24 flex flex-col justify-between min-h-full relative">
                {/* 87% Orange Sticker — only in register (bone) variant */}
                {authTab === 'register' && (
                <div className="kc-auth-sticker hidden md:flex absolute top-10 -right-12 w-40 h-40 lg:w-44 lg:h-44 rounded-full bg-kc-orange border-[3px] border-kc-dark items-center justify-center shadow-brutal z-0 pointer-events-none" style={{ transform: 'rotate(-12deg)' }}>
                    <div className="text-center text-white">
                        <div className="text-4xl lg:text-5xl font-black leading-none">87%</div>
                        <div className="text-[10px] font-black mt-1 uppercase tracking-widest leading-tight">Akurasi<br/>Match</div>
                    </div>
                </div>
                )}

                {authTab === 'register' ? (
                  <>
                    <div className="relative z-10 kc-auth-stagger">
                        <span className="kc-auth-item inline-block bg-kc-yellow text-kc-dark text-[10px] md:text-xs font-black font-mono uppercase tracking-widest px-4 py-2 rounded-full border-2 border-kc-dark shadow-brutal-sm mb-6">
                            ✦ HACKATHON · INNOVATION-READY
                        </span>

                        <h1 className="kc-auth-item text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight text-kc-dark mb-4">
                            Kerja yang<br />
                            cocok beneran<br />
                            nungguin kamu.
                        </h1>

                        <p className="kc-auth-item text-sm md:text-base text-kc-gray leading-relaxed max-w-md mb-6">
                            Bikin akun, upload CV, dan biar AI Gemini bandingin sama 12.000+ lowongan terverifikasi. Top-5 keluar dalam 8 detik.
                        </p>

                        {/* Stats Row */}
                        <div className="kc-auth-item grid grid-cols-3 gap-3 max-w-lg">
                            <div className="bg-kc-cyan border-2 border-kc-dark rounded-xl p-3 shadow-brutal-sm">
                                <p className="text-lg md:text-xl font-black text-kc-dark">12.4K</p>
                                <p className="text-[9px] font-bold mt-1 tracking-wider text-kc-dark uppercase">Pejuang Kerja</p>
                            </div>
                            <div className="bg-kc-lime border-2 border-kc-dark rounded-xl p-3 shadow-brutal-sm">
                                <p className="text-lg md:text-xl font-black text-kc-dark">340+</p>
                                <p className="text-[9px] font-bold mt-1 tracking-wider text-kc-dark uppercase">Employer Aktif</p>
                            </div>
                            <div className="bg-kc-pink border-2 border-kc-dark rounded-xl p-3 shadow-brutal-sm">
                                <p className="text-lg md:text-xl font-black text-kc-dark">8 dtk</p>
                                <p className="text-[9px] font-bold mt-1 tracking-wider text-kc-dark uppercase">Avg Match Time</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="kc-auth-sticker bg-white border-2 border-kc-dark rounded-xl p-4 shadow-brutal-sm max-w-lg mt-auto relative z-10" style={{ animation: 'kc-auth-up .55s cubic-bezier(.22,.61,.36,1) forwards', animationDelay: '.55s', opacity: 0, transform: 'none' }}>
                        <div className="flex gap-3 items-start">
                            <div className="w-9 h-9 rounded-full bg-kc-yellow border-2 border-kc-dark flex items-center justify-center font-bold shrink-0 text-kc-dark text-sm">R</div>
                            <div>
                                <p className="text-xs md:text-sm font-bold text-kc-dark leading-snug">
                                    "Spam 80 lamaran cuma 1 panggilan. Pake KerjaCerdas: 5 apply, 3 interview, 1 offer."
                                </p>
                                <p className="text-[10px] text-kc-gray mt-1.5 font-mono">Rina P. — UX Researcher @ Bibit</p>
                            </div>
                        </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* LOGIN variant — dark ink panel with orange accents */}
                    <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,87,34,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,87,34,0.18) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* Floating accent sticker */}
                    <div className="kc-auth-sticker hidden md:flex absolute top-12 -right-10 w-36 h-36 lg:w-40 lg:h-40 rounded-full bg-kc-orange border-[3px] border-white items-center justify-center shadow-brutal z-0 pointer-events-none" style={{ transform: 'rotate(-12deg)' }}>
                        <div className="text-center text-white">
                            <div className="text-3xl lg:text-4xl font-black leading-none">+47</div>
                            <div className="text-[9px] font-black mt-1 uppercase tracking-widest leading-tight">Lowongan<br/>Baru</div>
                        </div>
                    </div>

                    <div className="relative z-10 kc-auth-stagger">
                        <span className="kc-auth-item inline-block bg-kc-orange text-white text-[10px] md:text-xs font-black font-mono uppercase tracking-widest px-4 py-2 rounded-full border-2 border-kc-dark shadow-brutal-sm mb-6">
                            ✦ WELCOME BACK
                        </span>

                        <h1 className="kc-auth-item text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight text-white mb-4">
                            Lanjut<br/>
                            cari yang<br/>
                            <span className="text-kc-orange">cocok.</span>
                        </h1>

                        <p className="kc-auth-item text-sm md:text-base text-white/70 leading-relaxed max-w-md mb-6">
                            Match-mu udah ke-update. Cek top-5 baru — ada 2 yang lebih tinggi dari minggu lalu.
                        </p>

                        {/* Job-title pills (per AuthB design variant) */}
                        <div className="kc-auth-item flex flex-wrap gap-2 max-w-md mb-6">
                            {[
                                { t: 'Backend Engineer', c: '#FF5722' },
                                { t: 'UX Researcher', c: '#7AE7F0' },
                                { t: 'Data Analyst', c: '#FFCB05' },
                                { t: 'Product Manager', c: '#C8F26B' },
                                { t: 'Frontend Lead', c: '#FFB7D5' },
                                { t: 'AI Engineer', c: '#FF5722' },
                                { t: 'DevOps', c: '#7AE7F0' },
                            ].map(pill => (
                                <span key={pill.t} className="px-3 py-1.5 rounded-full border text-[11px] font-bold" style={{ borderColor: pill.c, color: pill.c }}>
                                    {pill.t}
                                </span>
                            ))}
                        </div>

                        {/* Match-baru card */}
                        <div className="kc-auth-item bg-kc-cream border-2 border-kc-dark rounded-xl p-4 shadow-brutal-sm max-w-md text-kc-dark">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border-[3px] border-kc-orange flex items-center justify-center font-black text-sm">93%</div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-kc-gray">Match Baru</div>
                                    <div className="text-sm font-black leading-tight">Senior Backend · Tokopedia</div>
                                    <div className="text-xs text-kc-gray">Posted 2 jam lalu</div>
                                </div>
                                <span className="bg-kc-lime text-kc-dark text-[9px] font-black px-2 py-1 rounded-full border border-kc-dark">+5%</span>
                            </div>
                        </div>
                    </div>

                    {/* Compliance & live count footer row */}
                    <div className="kc-auth-item mt-auto relative z-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold text-white/60">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-kc-orange animate-pulse" />
                            12.480 online sekarang
                        </div>
                        <span className="text-white/30">·</span>
                        <span>87% akurasi</span>
                        <span className="text-white/30">·</span>
                        <span>8 dtk avg match</span>
                        <span className="text-white/30">·</span>
                        <span>UU PDP compliant</span>
                    </div>
                  </>
                )}
                </div>
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <div className="w-full lg:w-1/2 bg-white relative z-10 lg:h-screen overflow-y-auto">
                <div className="p-6 md:p-10 lg:px-16 lg:py-10 relative z-10 min-h-full flex flex-col justify-center items-center">
                    <div className="max-w-md w-full mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-kc-orange border-2 border-kc-dark flex items-center justify-center text-white font-black">K</div>
                            <span className="font-bold text-xl tracking-tight text-kc-dark">kerjacerdas</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-kc-dark mb-2 leading-tight">
                            {authTab === 'login' ? 'Masuk ' : 'Daftar dulu, '}<span className="text-kc-orange">{authTab === 'login' ? 'balik.' : 'terus kerja.'}</span>
                        </h2>
                        <p className="text-sm text-kc-gray mb-6">
                            {authTab === 'login'
                                ? 'Pake email & sandi yang dipake daftar.'
                                : 'Gratis selamanya buat pencari kerja. 2 menit doang.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 max-w-md w-full mx-auto kc-auth-stagger">
                        <div className="kc-auth-item">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-kc-dark mb-2">Saya Adalah... {errors.role && <span className="text-rose-500 ml-2">{errors.role}</span>}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => selectRole('seeker')}
                                    onKeyDown={(e) => handleRoleKeyDown(e, 'seeker')}
                                    className={`relative p-3 rounded-xl text-left transition-all border-2 ${role === 'seeker' ? 'bg-kc-cyan border-kc-dark shadow-brutal-sm' : 'bg-white border-kc-dark shadow-brutal-hover hover:shadow-brutal-sm hover:-translate-y-0.5'}`}
                                >
                                    {role === 'seeker' && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-kc-dark rounded-full flex items-center justify-center">
                                            <span className="text-white text-[10px]">✓</span>
                                        </div>
                                    )}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 border-2 border-kc-dark ${role === 'seeker' ? 'bg-white' : 'bg-kc-cream'}`}>
                                        <Search className="w-3.5 h-3.5 text-kc-dark" strokeWidth={2} />
                                    </div>
                                    <p className="font-bold text-xs text-kc-dark">Pejuang Kerja</p>
                                    <p className={`text-[9px] mt-0.5 leading-snug ${role === 'seeker' ? 'text-kc-dark/70' : 'text-kc-gray'}`}>Cari kerja pake AI</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => selectRole('employer')}
                                    onKeyDown={(e) => handleRoleKeyDown(e, 'employer')}
                                    className={`relative p-3 rounded-xl text-left transition-all border-2 ${role === 'employer' ? 'bg-kc-pink border-kc-dark shadow-brutal-sm' : 'bg-white border-kc-dark shadow-brutal-hover hover:shadow-brutal-sm hover:-translate-y-0.5'}`}
                                >
                                    {role === 'employer' && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-kc-dark rounded-full flex items-center justify-center">
                                            <span className="text-white text-[10px]">✓</span>
                                        </div>
                                    )}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 border-2 border-kc-dark ${role === 'employer' ? 'bg-white' : 'bg-kc-cream'}`}>
                                        <Building2 className="w-3.5 h-3.5 text-kc-dark" strokeWidth={2} />
                                    </div>
                                    <p className="font-bold text-xs text-kc-dark">Bos / HR</p>
                                    <p className={`text-[9px] mt-0.5 leading-snug ${role === 'employer' ? 'text-kc-dark/70' : 'text-kc-gray'}`}>Pasang lowongan, top-5 kandidat</p>
                                </button>
                            </div>
                        </div>

                        {authTab === 'register' && (
                            <div className="kc-auth-item">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-kc-dark block mb-1.5">
                                    {role === 'employer' ? 'Nama PT / Instansi' : 'Nama Lengkap'} {errors.name && <span className="text-rose-500 lowercase">({errors.name})</span>}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kc-gray">
                                        {role === 'employer' ? <Building2 className="w-4 h-4" strokeWidth={2} /> : <User className="w-4 h-4" strokeWidth={2} />}
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); clearErrors('name') }}
                                        placeholder={role === 'employer' ? 'PT Sukses Maju' : 'Rina Pertiwi'}
                                        className={`w-full bg-white border-2 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold placeholder:font-normal outline-none transition-all ${errors.name ? 'border-rose-500' : 'border-kc-dark focus:shadow-brutal-sm focus:-translate-y-0.5'}`}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="kc-auth-item">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-kc-dark block mb-1.5">Email {errors.email && <span className="text-rose-500 lowercase">({errors.email})</span>}</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kc-gray">
                                    <Mail className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearErrors('email') }}
                                    placeholder="kamu@email.com"
                                    className={`w-full bg-white border-2 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold placeholder:font-normal outline-none transition-all ${errors.email ? 'border-rose-500' : 'border-kc-dark focus:shadow-brutal-sm focus:-translate-y-0.5'}`}
                                />
                            </div>
                        </div>

                        <div className="kc-auth-item">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-kc-dark block mb-1.5">Kata Sandi {errors.password && <span className="text-rose-500 lowercase">({errors.password})</span>}</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kc-gray">
                                    <Lock className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearErrors('password') }}
                                    placeholder="••••••••"
                                    className={`w-full bg-white border-2 rounded-lg py-2.5 pl-10 pr-11 text-sm font-bold placeholder:font-normal outline-none transition-all ${errors.password ? 'border-rose-500' : 'border-kc-dark focus:shadow-brutal-sm focus:-translate-y-0.5'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-kc-gray hover:text-kc-dark transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {authTab === 'register' && <p className="text-[9px] text-kc-gray mt-1">Min. 8 karakter, kombinasi huruf & angka</p>}
                        </div>

                        {authTab === 'login' && (
                            <div className="kc-auth-item flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 font-semibold text-kc-gray cursor-pointer select-none">
                                    <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-kc-orange" />
                                    Ingat saya
                                </label>
                                <a className="font-bold text-kc-dark hover:underline cursor-pointer">Lupa sandi?</a>
                            </div>
                        )}

                        {authTab === 'register' && (
                            <div className="kc-auth-item flex items-start gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="agreeTerms"
                                    checked={agreeTerms}
                                    onChange={(e) => { setAgreeTerms(e.target.checked); clearErrors('terms') }}
                                    className="mt-0.5 w-4 h-4 border-2 border-kc-dark rounded outline-none accent-kc-orange cursor-pointer shrink-0"
                                />
                                <label htmlFor="agreeTerms" className={`text-[10px] leading-snug cursor-pointer select-none ${errors.terms ? 'text-rose-500 font-bold' : 'text-kc-gray'}`}>
                                    Saya setuju dengan <span className="font-bold text-kc-dark">Syarat</span> & <span className="font-bold text-kc-dark">Privasi</span>. Data KTP/Ijazah/NPWP terenkripsi, nggak ditampilin ke user lain.
                                </label>
                            </div>
                        )}

                        {errors.submit && (
                            <div className="kc-auth-item rounded-lg border-2 border-rose-500 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                {errors.submit}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="kc-auth-item w-full bg-kc-orange text-white font-bold py-3 rounded-xl border-2 border-kc-dark shadow-brutal hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_#0B0B0F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading...
                                </span>
                            ) : authTab === 'login' ? 'Gass Masuk →' : 'Sikat Daftar — Gratis →'}
                        </button>

                        <div className="kc-auth-item relative py-3" hidden={authTab === 'register'} style={{ marginTop: 28 }}>
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-kc-gray/30"></div></div>
                            <div className="relative flex justify-center"><span className="bg-white px-3 text-[9px] font-bold text-kc-gray uppercase tracking-widest">Atau Pakai</span></div>
                        </div>

                        <div className="kc-auth-item grid grid-cols-2 gap-3" hidden={authTab === 'register'} style={{ marginTop: 12 }}>
                            <button type="button" className="bg-white border-2 border-kc-dark rounded-lg py-2 font-bold text-xs text-kc-dark hover:bg-kc-cream transition-colors flex justify-center items-center gap-2">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="#EA4335" d="M23.49 12.275c0-.812-.07-1.547-.2-2.275H12v4.512h6.438c-.282 1.455-1.121 2.682-2.367 3.513v2.906h3.829c2.235-2.057 3.59-5.1 3.59-8.656z"/><path fill="#34A853" d="M12 24c3.24 0 5.955-1.077 7.942-2.923l-3.83-2.906c-1.075.72-2.453 1.144-4.112 1.144-3.159 0-5.83-2.13-6.786-4.992H1.272v3.011C3.255 21.258 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.214 14.323a6.837 6.837 0 0 1-.365-2.323c0-.81.137-1.595.365-2.323V6.666H1.272A11.956 11.956 0 0 0 0 12c0 1.944.47 3.766 1.272 5.334l3.942-3.011z"/><path fill="#4285F4" d="M12 4.753c1.764 0 3.348.608 4.595 1.796l3.435-3.435C17.95 1.157 15.236 0 12 0 7.31 0 3.255 2.742 1.272 6.666l3.942 3.012c.956-2.862 3.627-4.925 6.786-4.925z"/></svg>
                                Google
                            </button>
                            <button type="button" className="bg-white border-2 border-kc-dark rounded-lg py-2 font-bold text-xs text-kc-dark hover:bg-kc-cream transition-colors flex justify-center items-center gap-2">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                LinkedIn
                            </button>
                        </div>

                        <p className="kc-auth-item text-center text-xs text-kc-gray">
                            {authTab === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                            <button type="button" onClick={() => switchTab(authTab === 'login' ? 'register' : 'login')} className="font-bold text-kc-dark hover:underline">
                                {authTab === 'login' ? 'Daftar di sini →' : 'Masuk di sini →'}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
