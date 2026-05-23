import { useEffect, useRef, useState } from 'react'
import { X, Mail, Lock, User, Search, Eye, EyeOff, Zap, Building2, UserCheck, Shield } from 'lucide-react'
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

        window.addEventListener('keydown', onKeyDown)
        closeBtnRef.current?.focus()

        return () => window.removeEventListener('keydown', onKeyDown)
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
        else if (password.length < 6) errs.password = 'Password minimal 6 karakter'
        if (!role) errs.role = 'Pilih tipe akun'
        if (authTab === 'register') {
            if (password !== confirmPassword) errs.confirmPassword = 'Password tidak cocok'
            if (!agreeTerms) errs.terms = 'Setujui syarat dan ketentuan'
        }
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
    const handleSubmit = (e) => {
        e.preventDefault()
        const errs = validate()
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        setLoading(true)
        // Simulate API delay
        setTimeout(() => {
            if (authTab === 'login') {
                login(email, password, role)
            } else {
                register(name, email, password, role)
            }
            setLoading(false)
            resetForm()
        }, 800)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
                    onClick={closeAuthModal}
                />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                className="relative w-full max-w-md bg-white border-[3px] border-ink rounded-[2rem] shadow-[8px_8px_0px_#111827] animate-scale-in overflow-y-auto max-h-[90vh]"
            >
                {/* Close button */}
                <button
                    ref={closeBtnRef}
                    onClick={closeAuthModal}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-rose-400 border-[3px] border-ink hover:bg-rose-500 text-ink shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-0.5 transition-all z-10"
                    aria-label="Tutup modal"
                >
                    <X className="w-5 h-5" strokeWidth={3} />
                </button>

                {/* Logo */}
                <div className="text-center pt-8 pb-6 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FFC900] border-[3px] border-ink flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0px_#111827] transform -rotate-3 hover:rotate-3 transition-transform">
                        <Zap className="w-8 h-8 text-ink fill-current" strokeWidth={2} />
                    </div>
                    <h2 id="auth-modal-title" className="text-3xl font-black text-ink uppercase tracking-tight">
                        {authTab === 'login' ? 'Masuk ' : 'Daftar '}<br />
                        <span className="inline-block bg-[#00E5FF] border-[3px] border-ink px-3 py-1 shadow-[4px_4px_0px_#111827] transform rotate-2 mt-2">KerjaCerdas</span>
                    </h2>
                    <p className="text-sm font-bold text-ink/70 mt-6 px-6">
                        {authTab === 'login'
                            ? 'Masuk untuk melanjutkan pencarian kerja atau pasang lowongan bos.'
                            : 'Buat akun untuk memulai perjalanan kariermu sekarang.'
                        }
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex mx-6 rounded-2xl bg-[#B8FF6D] p-2 mb-8 border-[3px] border-ink shadow-[4px_4px_0px_#111827]">
                    {[
                        { id: 'login', label: 'Masuk' },
                        { id: 'register', label: 'Daftar' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className={`flex-1 py-3 px-2 rounded-xl text-base font-black transition-all duration-200 uppercase tracking-wide border-[3px] ${authTab === tab.id
                                    ? 'bg-white text-ink border-ink shadow-[2px_2px_0px_#111827] transform -rotate-1'
                                    : 'text-ink/60 border-transparent hover:text-ink hover:bg-white/30 hover:border-ink/20'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5">
                    <div className="space-y-3">
                        <label id="role-label" className="text-xs font-black uppercase tracking-widest text-ink flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-ink" strokeWidth={3} />
                            Saya adalah... <span className="text-red-500 font-extrabold">*</span>
                        </label>
                        <p className="text-[11px] font-bold text-ink/60 uppercase tracking-wide">
                            {authTab === 'login'
                                ? 'Pilih peran biar kamu masuk ke jalur yang benar.'
                                : 'Pilih peran dulu, biar form langsung nyambung boss.'}
                        </p>
                        <div
                            role="radiogroup"
                            aria-labelledby="role-label"
                            aria-invalid={Boolean(errors.role)}
                            className="grid grid-cols-2 gap-4"
                        >
                            <button
                                type="button"
                                role="radio"
                                aria-checked={role === 'seeker'}
                                tabIndex={role === 'employer' ? -1 : 0}
                                onClick={() => selectRole('seeker')}
                                onKeyDown={(e) => handleRoleKeyDown(e, 'seeker')}
                                className={`relative p-5 rounded-2xl border-[3px] text-left transition-all duration-200 ${role === 'seeker'
                                        ? 'bg-[#00E5FF] border-ink shadow-[4px_4px_0px_#111827] transform -rotate-1'
                                        : 'bg-white border-ink hover:bg-[#00E5FF]/10 hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1'
                                    }`}
                            >
                                {role === 'seeker' && (
                                    <span className="absolute top-2 right-2 text-[10px] font-black uppercase bg-white border-2 border-ink px-1.5 py-0.5 rounded-md shadow-[2px_2px_0px_#111827]">
                                        Dipilih
                                    </span>
                                )}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border-[3px] ${role === 'seeker'
                                        ? 'bg-white border-ink shadow-[2px_2px_0px_#111827]'
                                        : 'bg-surface-100 border-ink border-dashed text-ink/40'
                                    }`}>
                                    <Search className={`w-6 h-6 ${role === 'seeker' ? 'text-ink' : ''}`} strokeWidth={role === 'seeker' ? 3 : 2} />
                                </div>
                                <p className={`text-base font-black uppercase ${role === 'seeker' ? 'text-ink' : 'text-ink/60'}`}>Pejuang<br />Kerja</p>
                                <p className={`text-[10px] font-bold mt-1 uppercase ${role === 'seeker' ? 'text-ink/80' : 'text-ink/40'}`}>Cari Duit</p>
                                <p className={`text-[10px] mt-1 font-bold ${role === 'seeker' ? 'text-ink/80' : 'text-ink/50'}`}>Biar AI bantu cari lowongan yang cocok.</p>
                            </button>

                            <button
                                type="button"
                                role="radio"
                                aria-checked={role === 'employer'}
                                tabIndex={role === 'seeker' ? -1 : 0}
                                onClick={() => selectRole('employer')}
                                onKeyDown={(e) => handleRoleKeyDown(e, 'employer')}
                                className={`relative p-5 rounded-2xl border-[3px] text-left transition-all duration-200 ${role === 'employer'
                                        ? 'bg-[#FF90E8] border-ink shadow-[4px_4px_0px_#111827] transform rotate-1'
                                        : 'bg-white border-ink hover:bg-[#FF90E8]/10 hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1'
                                    }`}
                            >
                                {role === 'employer' && (
                                    <span className="absolute top-2 right-2 text-[10px] font-black uppercase bg-white border-2 border-ink px-1.5 py-0.5 rounded-md shadow-[2px_2px_0px_#111827]">
                                        Dipilih
                                    </span>
                                )}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border-[3px] ${role === 'employer'
                                        ? 'bg-white border-ink shadow-[2px_2px_0px_#111827]'
                                        : 'bg-surface-100 border-ink border-dashed text-ink/40'
                                    }`}>
                                    <Building2 className={`w-6 h-6 ${role === 'employer' ? 'text-ink' : ''}`} strokeWidth={role === 'employer' ? 3 : 2} />
                                </div>
                                <p className={`text-base font-black uppercase ${role === 'employer' ? 'text-ink' : 'text-ink/60'}`}>Bos<br />Besar</p>
                                <p className={`text-[10px] font-bold mt-1 uppercase ${role === 'employer' ? 'text-ink/80' : 'text-ink/40'}`}>Cari Karyawan</p>
                                <p className={`text-[10px] mt-1 font-bold ${role === 'employer' ? 'text-ink/80' : 'text-ink/50'}`}>Pasang lowongan dan temukan kandidat satset.</p>
                            </button>
                        </div>
                        {errors.role && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase">{errors.role}</p>}
                    </div>

                    {/* Name field (register only) */}
                    {authTab === 'register' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-ink flex items-center gap-2">
                                <User className="w-5 h-5 text-ink" strokeWidth={3} />
                                {role === 'employer' ? 'Nama PT/Instansi' : 'Nama Lengkap'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    clearErrors('name')
                                }}
                                placeholder={role === 'employer' ? 'PT Sukses Maju' : 'Budi Santoso'}
                                aria-invalid={Boolean(errors.name)}
                                className="w-full px-5 py-3.5 rounded-xl bg-surface-50 border-[3px] border-ink text-base font-bold text-ink placeholder:text-ink/40 focus:bg-white focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-0.5 outline-none transition-all"
                            />
                            {errors.name && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase mt-1">{errors.name}</p>}
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-ink flex items-center gap-2">
                            <Mail className="w-5 h-5 text-ink" strokeWidth={3} />
                            Alamat Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                clearErrors('email')
                            }}
                            placeholder="budi@email.com"
                            aria-invalid={Boolean(errors.email)}
                            className="w-full px-5 py-3.5 rounded-xl bg-surface-50 border-[3px] border-ink text-base font-bold text-ink placeholder:text-ink/40 focus:bg-white focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-0.5 outline-none transition-all"
                        />
                        {errors.email && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-ink flex items-center gap-2">
                            <Lock className="w-5 h-5 text-ink" strokeWidth={3} />
                            Kata Sandi
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    clearErrors('password', 'confirmPassword')
                                }}
                                placeholder="Min. 6 karakter rahasia"
                                aria-invalid={Boolean(errors.password)}
                                className="w-full px-5 py-3.5 pr-14 rounded-xl bg-surface-50 border-[3px] border-ink text-base font-bold text-ink placeholder:text-ink/40 focus:bg-white focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-0.5 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FFC900] border-2 border-ink rounded-lg shadow-[2px_2px_0px_#111827] hover:bg-[#FF90E8] hover:shadow-[4px_4px_0px_#111827] transition-all active:translate-y-0.5 active:shadow-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4 text-ink" strokeWidth={3} /> : <Eye className="w-4 h-4 text-ink" strokeWidth={3} />}
                            </button>
                        </div>
                        <p className="text-[11px] font-bold text-ink/50">Tip: pakai kombinasi huruf, angka, dan simbol biar akunmu makin aman.</p>
                        {errors.password && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password (register only) */}
                    {authTab === 'register' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-ink flex items-center gap-2">
                                <Lock className="w-5 h-5 text-ink" strokeWidth={3} />
                                Konfirmasi Sandi
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    clearErrors('confirmPassword')
                                }}
                                placeholder="Ketik ulang bossku"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                className="w-full px-5 py-3.5 rounded-xl bg-surface-50 border-[3px] border-ink text-base font-bold text-ink placeholder:text-ink/40 focus:bg-white focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-0.5 outline-none transition-all"
                            />
                            {errors.confirmPassword && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase mt-1">{errors.confirmPassword}</p>}
                        </div>
                    )}

                    {/* Terms (register only) */}
                    {authTab === 'register' && (
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="agreeTerms"
                                checked={agreeTerms}
                                onChange={(e) => {
                                    setAgreeTerms(e.target.checked)
                                    clearErrors('terms')
                                }}
                                className="mt-1 w-5 h-5 rounded hover:bg-surface-50 transition-colors border-[3px] border-ink outline-none checked:bg-[#00E5FF] accent-[#00E5FF]"
                            />
                            <label htmlFor="agreeTerms" className="text-xs font-bold text-ink leading-relaxed cursor-pointer select-none">
                                Saya setuju dengan{' '}
                                <button
                                    type="button"
                                    onClick={() => { closeAuthModal(); useStore.getState().setActiveTab('privacy') }}
                                    className="text-ink font-black bg-[#B8FF6D] border-2 border-ink px-1 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#111827] transition-all"
                                >
                                    Kebijakan Privasi
                                </button>{' '}
                                dan{' '}
                                <button
                                    type="button"
                                    onClick={() => { closeAuthModal(); useStore.getState().setActiveTab('privacy') }}
                                    className="text-ink font-black bg-[#FF90E8] border-2 border-ink px-1 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#111827] transition-all"
                                >
                                    Syarat Ketentuan
                                </button>
                            </label>
                        </div>
                    )}
                    {errors.terms && <p className="text-[11px] font-black text-rose-500 bg-rose-100 border-2 border-rose-300 px-2 py-0.5 rounded-lg inline-block uppercase mt-1">{errors.terms}</p>}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ink text-white hover:text-[#00E5FF] border-[3px] border-ink uppercase tracking-widest font-black text-lg py-4 rounded-xl shadow-[6px_6px_0px_#B8FF6D] hover:-translate-y-1 transition-all mt-4 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-6 h-6 text-[#FFC900]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                LOADING BOSS...
                            </span>
                        ) : authTab === 'login' ? 'Gass Masuk 🚀' : 'Sikat Daftar 🚀'}
                    </button>

                    {/* Divider */}
                    <div className="relative py-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-[3px] border-ink border-dashed" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-4 py-1 text-xs font-black text-ink border-[3px] border-ink rounded-lg shadow-[2px_2px_0px_#111827] uppercase transform -rotate-2">ATAU LOGIN PAKAI</span>
                        </div>
                    </div>

                    {/* Social login buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-3 px-4 py-3 pb-2.5 rounded-xl bg-white border-[3px] border-ink text-sm font-black text-ink hover:bg-[#B8FF6D] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Google
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-3 px-4 py-3 pb-2.5 rounded-xl bg-white border-[3px] border-ink text-sm font-black text-ink hover:bg-[#00E5FF] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1 transition-all"
                        >
                            <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            LinkedIn
                        </button>
                    </div>

                    {/* Security note */}
                    <div className="flex items-center justify-center gap-2 pt-6">
                        <div className="bg-[#B8FF6D] p-1.5 rounded-lg border-2 border-ink">
                            <Shield className="w-4 h-4 text-ink" strokeWidth={3} />
                        </div>
                        <p className="text-xs font-bold text-ink/70 tracking-wide">
                            Gaskuen boss aman 100% · By KerjaCerdas
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}
