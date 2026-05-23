import { Zap, ExternalLink, Shield, Building2, Search } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * Footer — Site footer with branding, platform links for both user types,
 * resources, legal links, and attribution.
 */
export default function Footer() {
    const { setActiveTab, openAuthModal } = useStore()

    return (
        <footer className="border-t-2 border-surface-200 mt-auto bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid md:grid-cols-4 gap-12 md:gap-8 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-brand-400 border-2 border-ink flex items-center justify-center shadow-brutal-sm">
                                <Zap className="w-4 h-4 text-ink flex-shrink-0" />
                            </div>
                            <span className="font-extrabold text-lg text-ink tracking-tight">KerjaCerdas</span>
                        </div>
                        <p className="text-sm font-medium text-surface-600 leading-relaxed max-w-xs">
                            Platform AI-powered job matching untuk Indonesia.
                            Menghubungkan pencari kerja dengan pemberi kerja
                            menggunakan kecerdasan buatan.
                        </p>
                    </div>

                    {/* For Job Seekers */}
                    <div>
                        <p className="text-xs text-ink uppercase tracking-widest font-extrabold mb-4 flex items-center gap-2">
                            <Search className="w-4 h-4 text-brand-500" />
                            Pencari Kerja
                        </p>
                        <ul className="space-y-3">
                            {[
                                { label: 'Cari Pekerjaan', action: () => setActiveTab('match') },
                                { label: 'Analisis Skill Gap', action: () => setActiveTab('gap') },
                                { label: 'AI Career Advisor', action: () => setActiveTab('advisor') },
                                { label: 'Daftar Gratis', action: () => openAuthModal('register', 'seeker') },
                            ].map(item => (
                                <li key={item.label}>
                                    <button
                                        onClick={item.action}
                                        className="text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Employers */}
                    <div>
                        <p className="text-xs text-ink uppercase tracking-widest font-extrabold mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            Pemberi Kerja
                        </p>
                        <ul className="space-y-3">
                            {[
                                { label: 'Pasang Lowongan', action: () => openAuthModal('register', 'employer') },
                                { label: 'Cari Kandidat AI', action: () => openAuthModal('register', 'employer') },
                                { label: 'Kelola Lowongan', action: () => setActiveTab('employer') },
                                { label: 'Daftar Perusahaan', action: () => openAuthModal('register', 'employer') },
                            ].map(item => (
                                <li key={item.label}>
                                    <button
                                        onClick={item.action}
                                        className="text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal & Resources */}
                    <div>
                        <p className="text-xs text-ink uppercase tracking-widest font-extrabold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-500" />
                            Res. & Legal
                        </p>
                        <ul className="space-y-3">
                            <li>
                                <button
                                    onClick={() => setActiveTab('privacy')}
                                    className="text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors flex items-center gap-2"
                                >
                                    Kebijakan Privasi
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('privacy')}
                                    className="text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors flex items-center gap-2"
                                >
                                    Syarat & Ketentuan
                                </button>
                            </li>
                            {[
                                { label: 'API Documentation', href: '/api/docs' },
                                { label: 'GitHub Repository', href: '#' },
                            ].map(item => (
                                <li key={item.label}>
                                    <a href={item.href} className="text-sm font-semibold text-surface-500 hover:text-brand-600 transition-colors flex items-center gap-1.5">
                                        {item.label}
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t-2 border-surface-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-surface-500">
                        © 2026 KerjaCerdas    ·{' '}
                        <button onClick={() => setActiveTab('privacy')} className="hover:text-brand-600 transition-colors underline decoration-surface-300 underline-offset-4">
                            Kebijakan Privasi
                        </button>
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-surface-600 flex items-center gap-1">
                            Powered by IndoBERT · Google Gemini · FastAPI
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
