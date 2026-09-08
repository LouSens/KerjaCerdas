/**
 * UpgradeModal — KerjaCerdas PRO plan modal for employer/HR accounts.
 *
 * Card design mirrors the pricing section on the landing page (LandingHero.jsx).
 * Opened via openUpgradeModal() from the store. Closed by clicking × or backdrop.
 * Session is never affected — employer stays on their current page.
 */
import useStore from '../store/useStore'
import { X, Check } from 'lucide-react'

const KC = {
    ink: '#090A0F',
    orange: '#FF4800',
    yellow: '#FFC800',
}
const FONT = '"Plus Jakarta Sans", system-ui, sans-serif'
const MONO = '"JetBrains Mono", monospace'

const TIERS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'Gratis',
        period: 'selamanya',
        desc: 'Cocok untuk eksplorasi dan pemasangan lowongan dasar.',
        highlight: false,
        bg: '#FAF9F5',
        color: KC.ink,
        checkColor: KC.ink,
        cta: 'Paket Aktif',
        ctaBg: '#F1F5F9',
        ctaColor: '#64748B',
        ctaBorder: '#CBD5E1',
        perks: [
            'Posting lowongan tanpa batas',
            'AI Shortlist Top-5 kandidat',
            'Skor keselarasan kompetensi',
            'Verifikasi profil dasar',
        ],
    },
    {
        id: 'payperuse',
        name: 'Pay-per-Unlock',
        price: '50rb',
        period: '/ 10 kandidat',
        desc: 'Pilihan populer bagi tim yang aktif mewawancarai talenta siap kerja.',
        highlight: true,
        bg: KC.orange,
        color: '#fff',
        checkColor: '#fff',
        cta: 'Mulai Rekrut →',
        ctaBg: KC.yellow,
        ctaColor: KC.ink,
        ctaBorder: KC.ink,
        badge: 'Paling Diminati',
        perks: [
            'Buka kontak 10 kandidat',
            'Akses CV PDF & portofolio lengkap',
            'Format KTP & NPWP tervalidasi',
            'Format nomor ijazah tervalidasi',
            'Analisis skor kecocokan AI',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise Scale',
        price: 'Custom',
        period: 'sesuai kebutuhan',
        desc: 'Solusi terintegrasi untuk korporasi, BUMN, dan agensi rekrutmen.',
        highlight: false,
        bg: KC.ink,
        color: '#fff',
        checkColor: KC.yellow,
        cta: 'Konsultasi Enterprise →',
        ctaBg: '#fff',
        ctaColor: KC.ink,
        ctaBorder: '#fff',
        perks: [
            'Konektor API ke Workday & SAP',
            'Alur screening kustom',
            'Dedicated Account Manager',
            'Akses API bulk vector match',
            'Perjanjian SLA 99.9%',
        ],
    },
]

export default function UpgradeModal() {
    const { upgradeModalOpen, closeUpgradeModal } = useStore()

    if (!upgradeModalOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={closeUpgradeModal}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(9,10,15,0.65)',
                    zIndex: 1200,
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                }}
            />

            {/* Modal panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Upgrade KerjaCerdas PRO"
                style={{
                    position: 'fixed',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1201,
                    width: 'min(96vw, 860px)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: '#FAF9F5',
                    border: `2px solid ${KC.ink}`,
                    borderRadius: 16,
                    boxShadow: `6px 6px 0 ${KC.ink}`,
                    fontFamily: FONT,
                    padding: '24px 22px 28px',
                }}
            >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                        <div style={{
                            display: 'inline-block', padding: '3px 10px',
                            background: KC.yellow, border: `1.5px solid ${KC.ink}`,
                            borderRadius: 999, fontSize: 10, fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: 0.6, color: KC.ink,
                            marginBottom: 8,
                        }}>
                            Skema Harga
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.8px', color: KC.ink, lineHeight: 1.15 }}>
                            Gratis untuk Talenta. Transparan untuk HR.
                        </div>
                        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                            Pencari kerja tidak dipungut biaya. Perusahaan hanya membayar sesuai kebutuhan perekrutan.
                        </div>
                    </div>
                    <button
                        id="upgrade-modal-close-btn"
                        onClick={closeUpgradeModal}
                        aria-label="Tutup"
                        style={{
                            width: 34, height: 34, display: 'grid', placeItems: 'center',
                            background: '#F1F5F9', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 9, cursor: 'pointer', flexShrink: 0, marginLeft: 12,
                            color: KC.ink,
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Divider */}
                <div style={{ height: 1.5, background: KC.ink, margin: '16px 0' }} />

                {/* Plan cards — same layout as home page pricing grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                }}>
                    {TIERS.map(tier => (
                        <div
                            key={tier.id}
                            style={{
                                background: tier.bg,
                                color: tier.color,
                                border: `2px solid ${KC.ink}`,
                                borderRadius: 12,
                                padding: '20px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: tier.highlight ? `6px 6px 0 ${KC.ink}` : `3.5px 3.5px 0 ${KC.ink}`,
                                position: 'relative',
                            }}
                        >
                            {/* Popular badge */}
                            {tier.badge && (
                                <div style={{
                                    position: 'absolute', top: -12, right: 14,
                                    background: KC.yellow, border: `1.5px solid ${KC.ink}`,
                                    padding: '3px 10px', fontSize: 9.5, fontWeight: 900,
                                    textTransform: 'uppercase', borderRadius: 999,
                                    color: KC.ink, boxShadow: `2px 2px 0 ${KC.ink}`,
                                    letterSpacing: 0.5,
                                }}>
                                    {tier.badge}
                                </div>
                            )}

                            {/* Plan name */}
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 }}>
                                {tier.name}
                            </div>

                            {/* Price */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '0 0 6px' }}>
                                {tier.price !== 'Gratis' && tier.price !== 'Custom' && (
                                    <span style={{ fontSize: 15, fontWeight: 800, opacity: 0.85 }}>Rp</span>
                                )}
                                <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1, fontFamily: MONO }}>
                                    {tier.price}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
                                    {tier.period}
                                </span>
                            </div>

                            {/* Description */}
                            <p style={{ fontSize: 11.5, lineHeight: 1.5, opacity: 0.85, margin: '0 0 14px' }}>
                                {tier.desc}
                            </p>

                            {/* Separator */}
                            <div style={{ height: 1, background: tier.highlight || tier.color === '#fff' ? 'rgba(255,255,255,0.2)' : '#DDD9D0', marginBottom: 14 }} />

                            {/* Feature list */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                                {tier.perks.map((perk, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, fontWeight: 600 }}>
                                        <Check size={13} color={tier.checkColor} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA button */}
                            <button
                                id={`upgrade-modal-cta-${tier.id}`}
                                onClick={() => {
                                    // TODO: integrate real payment/contact flow
                                    alert(`Integrasi pembayaran untuk "${tier.name}" belum tersedia. Tim kami akan menghubungi Anda.`)
                                }}
                                style={{
                                    padding: '11px 14px',
                                    background: tier.ctaBg,
                                    color: tier.ctaColor,
                                    border: `1.5px solid ${tier.ctaBorder}`,
                                    borderRadius: 9,
                                    boxShadow: `2px 2px 0 ${KC.ink}`,
                                    font: `900 12px/1 ${FONT}`,
                                    cursor: tier.id === 'starter' ? 'default' : 'pointer',
                                    width: '100%',
                                    opacity: tier.id === 'starter' ? 0.6 : 1,
                                }}
                            >
                                {tier.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', margin: '18px 0 0', lineHeight: 1.5 }}>
                    Semua harga belum termasuk PPN 11%. Pembayaran bulanan atau tahunan (diskon 20%).
                </p>
            </div>
        </>
    )
}
