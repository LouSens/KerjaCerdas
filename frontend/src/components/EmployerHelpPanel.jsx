/**
 * EmployerHelpPanel — Floating contextual help for the employer interface.
 *
 * Design rationale:
 * - The FloatingAdvisor (AI career chat) is built for seeker use cases:
 *   it loads the seeker's CV, computes skill gaps, and gives personalized
 *   career guidance. None of that is relevant for an employer/HRD user.
 * - Instead, employers need a quick-access guide to use the platform
 *   effectively: how to write a good job description, how to read AI
 *   match scores, how to use the Kanban pipeline, etc.
 * - This panel is entirely static (no API call) — fast, always available,
 *   and never triggers the rate limiter.
 */
import { useState } from 'react'
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import useStore from '../store/useStore'

const TIPS = [
    {
        id: 'jd',
        icon: '✍️',
        title: 'Tulis JD yang menarik AI Match',
        body: 'Cantumkan skill wajib secara spesifik (mis. "React 18", bukan hanya "frontend"). Semakin spesifik deskripsi lowongan, semakin akurat kandidat yang direkomendasikan sistem.',
    },
    {
        id: 'score',
        icon: '📊',
        title: 'Memahami Skor Match Kandidat',
        body: 'Band Strong (≥65%) artinya kandidat sangat cocok secara skill dan semantik. Possible (≥45%) butuh sedikit onboarding. Stretch (<45%) masih berpotensi tapi perlu pengembangan lebih lanjut.',
    },
    {
        id: 'unlock',
        icon: '🔓',
        title: 'Cara Buka Kontak Kandidat',
        body: 'Klik "Buka Kontak" pada kartu kandidat. Setiap unlock memotong token dari paket Anda. Kandidat terverifikasi KTP memiliki lencana ✓ — lebih terpercaya.',
    },
    {
        id: 'kanban',
        icon: '📋',
        title: 'Pipeline Rekrutmen (Kanban)',
        body: 'Geser kartu kandidat antar kolom (Baru → Screening → Interview → Offer → Hired) di halaman Kandidat untuk melacak status rekrutmen secara real-time.',
    },
    {
        id: 'refresh',
        icon: '🔄',
        title: 'Kapan Shortlist AI Diperbarui?',
        body: 'Shortlist Top-N diperbarui otomatis setiap 6 jam atau segera setelah Anda mengedit deskripsi lowongan. Kandidat baru yang upload CV juga masuk antrian ranking otomatis.',
    },
    {
        id: 'verify',
        icon: '🏢',
        title: 'Verifikasi Perusahaan',
        body: 'Verifikasi NPWP perusahaan Anda agar profil lowongan mendapat badge terverifikasi. Kandidat 2× lebih tertarik melamar ke perusahaan yang sudah terverifikasi.',
    },
]

export default function EmployerHelpPanel() {
    const { isAuthenticated, userRole } = useStore()
    const [open, setOpen] = useState(false)
    const [expanded, setExpanded] = useState(null)

    // Only visible for authenticated employers
    if (!isAuthenticated || userRole !== 'employer') return null

    return (
        <>
            <style>{`
            .kc-help-btn {
              position: fixed;
              bottom: 24px;
              right: 24px;
              z-index: 40;
            }
            .kc-help-panel {
              position: fixed;
              bottom: 96px;
              right: 24px;
              z-index: 40;
              width: 360px;
              max-width: calc(100vw - 2rem);
              max-height: calc(100vh - 7rem);
            }
            @media (max-width: 768px) {
              .kc-help-btn {
                bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
                right: 16px !important;
                width: 44px !important;
                height: 44px !important;
              }
              .kc-help-panel {
                bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important;
                right: 10px !important;
                left: 10px !important;
                width: auto !important;
                max-width: calc(100vw - 20px) !important;
                max-height: calc(100vh - 84px) !important;
              }
            }
            `}</style>

            {/* Floating trigger button */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`kc-help-btn w-14 h-14 bg-kc-dark text-white border-2 border-kc-dark shadow-brutal grid place-items-center hover:bg-kc-orange transition-colors ${
                    open ? '' : 'animate-pulse'
                }`}
                aria-label="Bantuan Platform"
                title="Tips & Panduan Platform"
            >
                {open ? <X size={20} /> : <HelpCircle size={20} />}
            </button>

            {/* Help panel */}
            <div
                className={`kc-help-panel bg-white border-2 border-kc-dark shadow-brutal flex flex-col origin-bottom-right transition-all duration-200 ${
                    open
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-90 pointer-events-none'
                }`}
                style={{ overflowY: 'auto' }}
            >
                <header className="px-4 py-3 border-b-2 border-kc-dark flex items-center gap-3 bg-kc-yellow sticky top-0">
                    <div className="w-7 h-7 bg-kc-dark border border-kc-dark flex items-center justify-center text-white text-sm font-bold">
                        ?
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-kc-dark leading-tight">Panduan Platform</p>
                        <p className="text-[10px] font-mono text-kc-dark opacity-70 leading-tight">Tips untuk employer & HRD</p>
                    </div>
                </header>

                <div className="px-3 py-3 space-y-2">
                    {TIPS.map((tip) => (
                        <div
                            key={tip.id}
                            className="border-2 border-kc-dark bg-kc-cream"
                        >
                            <button
                                onClick={() => setExpanded(expanded === tip.id ? null : tip.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-kc-bone transition-colors"
                            >
                                <span className="text-base">{tip.icon}</span>
                                <span className="flex-1 text-xs font-bold text-kc-dark">{tip.title}</span>
                                {expanded === tip.id
                                    ? <ChevronUp size={14} className="text-kc-gray flex-shrink-0" />
                                    : <ChevronDown size={14} className="text-kc-gray flex-shrink-0" />
                                }
                            </button>
                            {expanded === tip.id && (
                                <div className="px-3 pb-3 pt-1 border-t border-kc-dark text-[11px] leading-relaxed text-kc-dark font-medium bg-white">
                                    {tip.body}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="px-4 py-3 border-t-2 border-kc-dark bg-kc-cream text-[10px] font-mono text-kc-gray">
                    Butuh bantuan lebih lanjut? Hubungi tim KerjaCerdas
                </div>
            </div>
        </>
    )
}
