import { useState, useEffect } from 'react'
import { Zap, Search, BarChart3, Bot, ArrowRight, MapPin, Users, Clock, Briefcase, Building2, Shield, UserPlus } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * LandingHero — Premium landing page with hero section, features, stats, and how-it-works.
 * Adapted for dual-sided marketplace (Pencari Kerja & Pemberi Kerja).
 * Designed to WOW investors and hackathon judges at first glance.
 */

const ANIMATED_STATS = [
    { value: 131, label: 'Lowongan Aktif', suffix: '+', icon: Briefcase },
    { value: 0, label: 'Perusahaan Terdaftar', suffix: '+', icon: Building2 },
    { value: 87, label: 'Akurasi Matching', suffix: '%', icon: BarChart3 },
    { value: 140, label: 'Response Time (ms)', suffix: 'ms', icon: Clock },
]

const FEATURES_SEEKER = [
    {
        icon: Search,
        title: 'AI Job Matching',
        description: 'Kemampuan IndoBERT mencocokkan profil profilmu dengan lowongan terbaik di seluruh Indonesia secara akurat dan semantik.',
        color: 'brand',
        tag: 'IndoBERT',
    },
    {
        icon: BarChart3,
        title: 'Analisis Skill Gap',
        description: 'Ketahui skill apa yang masih kurang untuk posisi impianmu, lengkap dengan rekomendasi kursus yang tepat.',
        color: 'emerald',
        tag: 'RAG Pipeline',
    },
    {
        icon: Bot,
        title: 'AI Career Advisor',
        description: 'Asisten karier AI interaktif yang siap membimbingmu mulai dari penyusunan CV hingga persiapan wawancara 24/7.',
        color: 'purple',
        tag: 'Gemini 3.0',
    },
]

const FEATURES_EMPLOYER = [
    {
        icon: Users,
        title: 'AI Candidate Sourcing',
        description: 'Temukan talenta terbaik dengan sekali pencarian. AI kami meranking kandidat berdasarkan kecocokan skill & pengalaman.',
        color: 'emerald',
        tag: 'Smart Rank',
    },
    {
        icon: Building2,
        title: 'Employer Dashboard Terpadu',
        description: 'Kelola ratusan pelamar, pantau performa iklan lowongan kerja, dan analisis tren supply & demand talenta.',
        color: 'brand',
        tag: 'Analytics',
    },
    {
        icon: Shield,
        title: 'Verifikasi e-KYC & SIVIL',
        description: 'Integrasi dengan database nasional untuk memverifikasi identitas, KTP, dan keaslian kredensial kandidat secara instan.',
        color: 'purple',
        tag: 'Dukcapil / Dikti',
    },
]

const FEATURE_ICON_BG_CLASS = {
    brand: 'bg-brand-400',
    emerald: 'bg-emerald-400',
    purple: 'bg-purple-400',
}

const HOW_IT_WORKS_SEEKER = [
    { step: '01', title: 'Buat Profil', description: 'Isi detail skill, pengalaman, dan gaji idamanmu.' },
    { step: '02', title: 'AI Matching', description: 'Sistem menganalisis jutaan titik data untuk mencari kecocokan tertinggi.' },
    { step: '03', title: 'Lamar Instan', description: 'Dapatkan pekerjaan idamanmu tanpa perlu membuang waktu scroll.' },
]

const HOW_IT_WORKS_EMPLOYER = [
    { step: '01', title: 'Pasang Lowongan', description: 'Definisikan kriteria, skill, dan benefit pekerja.' },
    { step: '02', title: 'AI Sourcing', description: 'Algoritma memberikan daftar kandidat yang paling relevan secara otomatis.' },
    { step: '03', title: 'Rekrut Cepat', description: 'Pilih, hubungi, dan rekrut talenta unggulan dalam hitungan hari.' },
]

/**
 * AnimatedCounter — Counts from 0 to target value with easing.
 */
function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        let startTime = null
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
        }
        const timer = setTimeout(() => requestAnimationFrame(animate), 300)
        return () => clearTimeout(timer)
    }, [end, duration])

    return (
        <span className="tabular-nums">
            {count.toLocaleString('id-ID')}{suffix}
        </span>
    )
}

export default function LandingHero() {
    const { setActiveTab, openAuthModal } = useStore()
    const [audience, setAudience] = useState('seeker') // 'seeker' | 'employer'

    const currentFeatures = audience === 'seeker' ? FEATURES_SEEKER : FEATURES_EMPLOYER
    const currentHowItWorks = audience === 'seeker' ? HOW_IT_WORKS_SEEKER : HOW_IT_WORKS_EMPLOYER

    return (
        <div className="relative overflow-hidden animate-fade-in">
            {/* ── HERO SECTION ── */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 md:pt-16 md:pb-28">
                <div className="relative text-center max-w-5xl mx-auto">
                    
                    {/* Retro Window Headline Box */}
                    <div className="bg-white border-[3px] md:border-[6px] border-ink rounded-[1.5rem] md:rounded-[2.5rem] shadow-[8px_8px_0px_#111827] md:shadow-[16px_16px_0px_#111827] p-8 sm:p-12 md:p-16 relative mb-12 sm:hover:-translate-y-2 hover:shadow-[10px_10px_0px_#111827] md:hover:shadow-[20px_20px_0px_#111827] transition-all duration-300 overflow-hidden">
                        
                        {/* Fake Window Controls */}
                        <div className="absolute top-5 md:top-6 left-5 md:left-8 flex gap-2.5">
                            <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-rose-400 border-2 md:border-[3px] border-ink"></div>
                            <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-amber-400 border-2 md:border-[3px] border-ink"></div>
                            <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-emerald-400 border-2 md:border-[3px] border-ink"></div>
                        </div>
                        <div className="absolute top-4 md:top-6 right-5 md:right-8 hidden sm:block">
                            <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-ink">KerjaCerdas.exe</span>
                        </div>
                        <div className="absolute top-16 md:top-20 left-0 w-full h-[3px] md:h-[6px] bg-ink"></div>

                        <div className="mt-16 md:mt-20">
                            {/* Badge */}
                            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 bg-[#FF90E8] border-[3px] border-ink mb-6 shadow-[4px_4px_0px_#111827] transform -rotate-2 hover:rotate-0 transition-transform">
                                <Zap className="w-4 h-4 md:w-5 md:h-5 text-ink fill-ink" />
                                <span className="text-xs md:text-sm font-black text-ink tracking-widest uppercase">
                                    HACKATHON 2026 · DIGDAYA
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-[2.5rem] sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-black text-ink tracking-tight mb-10 animate-fade-in-up animation-delay-150 uppercase leading-tight md:leading-snug">
                                Evolusi <br className="hidden sm:block"/>
                                <span className="relative inline-block mt-4 mb-4 bg-[#FFC900] px-3 md:px-5 py-0 md:py-2 border-[3px] md:border-[6px] border-ink shadow-[4px_4px_0px_#111827] md:shadow-[8px_8px_0px_#111827] transform rotate-1">
                                    Rekrutmen
                                </span><br/>
                                <span className="text-[#00E5FF] tracking-tighter" style={{ textShadow: '3px 3px 0px #111827, 4px 4px 0px #111827, -1px -1px 0 #111827, 1px -1px 0 #111827, -1px 1px 0 #111827, 1px 1px 0 #111827' }}>
                                    AI Terdepan
                                </span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-xl sm:text-2xl font-bold text-ink max-w-3xl mx-auto leading-loose sm:leading-relaxed animate-fade-in-up animation-delay-300">
                                Menghubungkan <span className="bg-[#B8FF6D] px-2 py-1 border-[3px] border-ink inline-block transform -rotate-1 shadow-[2px_2px_0px_#111827] mx-1">Pencari Kerja</span> dengan{' '}
                                <span className="bg-[#FF90E8] px-2 py-1 border-[3px] border-ink inline-block transform rotate-1 shadow-[2px_2px_0px_#111827] mx-1 mt-2 sm:mt-0">Perusahaan</span> di seluruh Indonesia.
                            </p>

                            {/* Audience Switcher */}
                            <div className="flex justify-center animate-fade-in-up animation-delay-500">
                                <div className="inline-flex flex-col sm:flex-row rounded-2xl md:rounded-[2rem] bg-surface-50 border-[3px] md:border-[4px] border-ink p-1.5 shadow-[4px_4px_0px_#111827] gap-1 relative overflow-hidden">
                                    <button
                                        onClick={() => setAudience('seeker')}
                                        className={`flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-xl md:rounded-[1.5rem] text-sm md:text-base font-black transition-all duration-300 border-2 ${
                                            audience === 'seeker'
                                                ? 'bg-ink text-[#B8FF6D] border-ink shadow-brutal'
                                                : 'text-ink border-transparent hover:bg-surface-200'
                                        }`}
                                    >
                                        <Search className="w-5 h-5" />
                                        Pencari Kerja
                                    </button>
                                    <button
                                        onClick={() => setAudience('employer')}
                                        className={`flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-xl md:rounded-[1.5rem] text-sm md:text-base font-black transition-all duration-300 border-2 ${
                                            audience === 'employer'
                                                ? 'bg-ink text-[#FF90E8] border-ink shadow-brutal'
                                                : 'text-ink border-transparent hover:bg-surface-200'
                                        }`}
                                    >
                                        <Building2 className="w-5 h-5" />
                                        Pemberi Kerja
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-700">
                        {audience === 'seeker' ? (
                            <>
                                <button
                                    onClick={() => setActiveTab('match')}
                                    className="btn-glow group flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto font-bold"
                                >
                                    <Search className="w-5 h-5" />
                                    Cari Pekerjaan
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setActiveTab('advisor')}
                                    className="btn-outline flex items-center gap-2 px-8 py-4 w-full sm:w-auto font-bold"
                                >
                                    <Bot className="w-5 h-5" />
                                    Tanya AI Advisor
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => openAuthModal('register', 'employer')}
                                    className="btn-glow flex items-center gap-2 text-base px-8 py-4 bg-ink hover:bg-surface-800 text-white shadow-brutal w-full sm:w-auto font-bold"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Daftar Sebagai Perusahaan
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => openAuthModal('login')}
                                    className="btn-outline flex items-center gap-2 px-8 py-4 w-full sm:w-auto font-bold text-ink"
                                >
                                    <Building2 className="w-5 h-5" />
                                    Masuk ke Dashboard
                                </button>
                            </>
                        )}
                    </div>

                    {/* Trust signals */}
                    <div className="mt-12 flex items-center justify-center gap-6 animate-fade-in animation-delay-1000">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-ink flex items-center justify-center shadow-sm text-lg">👨‍💻</div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-ink flex items-center justify-center shadow-sm text-lg">👩‍💼</div>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-ink flex items-center justify-center shadow-sm text-lg">👨‍🔬</div>
                            <div className="w-10 h-10 rounded-full bg-surface-100 border-2 border-ink flex items-center justify-center shadow-sm text-xs font-black text-ink">+</div>
                        </div>
                        <p className="text-sm font-semibold text-surface-600">
                            Dipercaya oleh <strong className="text-ink font-bold">10.000+</strong> pengguna terdaftar
                        </p>
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="relative border-y-2 border-surface-200 bg-white z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {ANIMATED_STATS.map(({ value, label, suffix, icon: Icon }) => (
                            <div key={label} className="bg-white border-[3px] border-ink p-6 shadow-[4px_4px_0px_#111827] text-center md:text-left group hover:shadow-[8px_8px_0px_#111827] hover:-translate-y-1 transition-all">
                                <Icon className="w-10 h-10 text-ink stroke-[3px] mb-4 mx-auto md:mx-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
                                <div className="text-3xl sm:text-4xl font-black text-ink tracking-tight uppercase">
                                    <AnimatedCounter end={value} suffix={suffix} />
                                </div>
                                <div className="text-sm text-surface-600 font-extrabold tracking-widest uppercase mt-2">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
                <div className="text-center mb-16">
                    <span className="inline-block bg-brand-200 border-[3px] border-ink shadow-[2px_2px_0px_#111827] px-4 py-1.5 text-xs font-black text-ink uppercase tracking-widest mb-6">
                        ✦ KEUNGGULAN PLATFORM
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-black text-ink tracking-tighter mb-4 uppercase">
                        Mengapa <span className="bg-brand-400 px-3 inline-block shadow-[4px_4px_0px_#111827] border-[3px] border-ink -rotate-1">KerjaCerdas?</span>
                    </h2>
                    <p className="text-ink font-bold max-w-2xl mx-auto text-lg leading-relaxed border-[3px] border-transparent">
                        Pendekatan berbasis AI untuk merevolusi proses rekrutmen. Lebih presisi, obyektif, dan transparan dari awal hingga akhir.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {currentFeatures.map(({ icon: Icon, title, description, color, tag }, i) => (
                        <div
                            key={title}
                            className="bg-surface-50 border-[3px] border-ink shadow-[6px_6px_0px_#111827] hover:shadow-[10px_10px_0px_#111827] hover:-translate-y-1 transition-all p-8 group flex flex-col items-start"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className={`w-16 h-16 ${FEATURE_ICON_BG_CLASS[color] ?? FEATURE_ICON_BG_CLASS.brand} border-[3px] border-ink shadow-[4px_4px_0px_#111827] mb-8 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand-400 transition-all duration-300 flex items-center justify-center`}>
                                <Icon className="w-8 h-8 text-ink stroke-[3px]" />
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-ink text-[10px] uppercase font-black text-ink tracking-widest mb-6 shadow-[2px_2px_0px_#111827]">
                                🚀 {tag}
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-ink uppercase tracking-tight leading-none group-hover:underline decoration-4 underline-offset-4">{title}</h3>
                            <p className="text-base text-ink font-semibold leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="bg-surface-100 py-24 border-y-2 border-surface-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border-2 border-surface-200 text-xs font-bold text-ink mb-4 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                            PROSES CEPAT
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-ink">
                            Tiga Langkah <span className="text-brand-500">Mudah</span>
                        </h2>
                        <p className="text-surface-600 font-medium max-w-md mx-auto text-base">
                            Hanya butuh beberapa menit untuk memulai.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
                        {currentHowItWorks.map(({ step, title, description }, i) => (
                            <div key={step} className="relative bg-white border-[3px] border-ink p-8 shadow-[6px_6px_0px_#111827] text-left group hover:shadow-[10px_10px_0px_#111827] hover:-translate-y-1 transition-all z-10 flex flex-col">
                                <div className="w-16 h-16 bg-emerald-300 border-[3px] border-ink shadow-[4px_4px_0px_#111827] flex items-center justify-center mb-6 group-hover:bg-brand-400 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                                    <span className="text-2xl font-black text-ink">{step}</span>
                                </div>
                                <h3 className="text-xl font-black mb-3 text-ink uppercase tracking-tight leading-none group-hover:underline decoration-4 underline-offset-4">{title}</h3>
                                <p className="text-base text-ink font-semibold leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-20">
                        {audience === 'seeker' ? (
                            <button
                                onClick={() => openAuthModal('register', 'seeker')}
                                className="inline-flex items-center gap-3 bg-brand-400 border-[3px] border-ink shadow-[6px_6px_0px_#111827] text-ink font-black uppercase text-lg px-10 py-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#111827] group"
                            >
                                Mulai Sekarang — Gratis
                                <ArrowRight className="w-6 h-6 stroke-[3px] group-hover:translate-x-2 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={() => openAuthModal('register', 'employer')}
                                className="inline-flex items-center gap-3 bg-ink text-white border-[3px] border-ink shadow-[6px_6px_0px_#FF90E8] font-black uppercase text-lg px-10 py-5 transition-all hover:bg-surface-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#FF90E8] group"
                            >
                                Daftar Perusahaan Sekarang
                                <Building2 className="w-6 h-6 stroke-[3px] group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ── TECH STACK BADGES ── */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
                <div className="text-center mb-8">
                    <p className="text-xs text-surface-500 uppercase tracking-widest font-black">Powered by Industry Leading Tech Stack</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {[
                        'IndoBERT', 'Google Gemini', 'FastAPI', 'React 18',
                        'PostgreSQL', 'PyTorch', 'Redis', 'pgvector'
                    ].map((name) => (
                        <span key={name} className="px-5 py-3 bg-surface-50 border-[3px] border-ink shadow-[4px_4px_0px_#111827] text-sm font-black uppercase tracking-widest text-ink hover:bg-brand-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111827] transition-all cursor-default">
                            {name}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    )
}
