/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { submitPartnershipInquiry } from '../services/api'
import toast from 'react-hot-toast'

// ════════════════════════════════════════════════════════════════════════════
// KerjaCerdas — Minimalist Enterprise Neobrutalism Landing
// Designed for Enterprise Clarity, High Contrast, and Zero Clutter
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
    mute: '#4A4944',
    muteLight: '#76746C',
    ash: '#DDD9D0',
    border: '#090A0F',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'

const KC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');

@keyframes kc-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes kc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes kc-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes kc-drawer-slide {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes kc-modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.kc-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.kc-reveal.kc-in {
  opacity: 1;
  transform: translateY(0);
}

.kc-fade-up { animation: kc-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.kc-fade-up.d1 { animation-delay: 0.06s; }
.kc-fade-up.d2 { animation-delay: 0.12s; }
.kc-fade-up.d3 { animation-delay: 0.18s; }

.kc-btn {
  position: relative;
  user-select: none;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s ease, background-color 0.14s ease;
}
.kc-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--kc-btn-shadow, #090A0F) !important;
}
.kc-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--kc-btn-shadow, #090A0F) !important;
}

.kc-card-static {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.kc-card-static:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 #090A0F !important;
}

.kc-nav-link {
  position: relative;
  transition: color 0.15s ease;
}
.kc-nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0;
  height: 2.5px;
  background: #FF4800;
  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.kc-nav-link:hover::after {
  width: 100%;
}

.kc-marquee-track {
  display: flex;
  gap: 36px;
  align-items: center;
  animation: kc-marquee 30s linear infinite;
  white-space: nowrap;
  will-change: transform;
}
.kc-marquee-container:hover .kc-marquee-track {
  animation-play-state: paused;
}

/* Layout Containers & Grids */
.kc-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}
.kc-hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 48px;
  align-items: center;
}
.kc-features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.kc-three-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.kc-pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 1140px;
  margin: 0 auto;
}
.kc-trust-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}
.kc-faq-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 56px;
  align-items: start;
}
.kc-foot-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr;
  gap: 36px;
}

/* Tablet Breakpoints */
@media (max-width: 1024px) {
  .kc-container { padding: 0 24px; }
  .kc-hero-grid { grid-template-columns: 1fr; gap: 40px; }
  .kc-pricing-grid { grid-template-columns: 1fr; max-width: 480px; }
  .kc-trust-grid { grid-template-columns: 1fr; gap: 36px; }
  .kc-faq-grid { grid-template-columns: 1fr; gap: 32px; }
  .kc-foot-grid { grid-template-columns: 1fr 1fr 1fr; }
  .kc-foot-grid > :first-child { grid-column: span 3; }
}

/* Mobile Breakpoints */
@media (max-width: 768px) {
  .kc-container { padding: 0 16px; }
  .kc-nav-desktop { display: none !important; }
  .kc-nav-mobile-trigger { display: flex !important; }
  
  .kc-hero-title {
    font-size: 32px !important;
    line-height: 1.2 !important;
    letter-spacing: -1px !important;
  }
  .kc-hero-highlight {
    margin: 4px 0 !important;
    padding: 2px 8px !important;
    display: inline-block !important;
  }
  
  .kc-features-grid, .kc-three-col {
    grid-template-columns: 1fr !important;
  }
  
  .kc-trust-cards-mobile {
    grid-template-columns: 1fr !important;
  }
  
  .kc-foot-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 28px 16px !important;
  }
  .kc-foot-grid > :first-child {
    grid-column: span 2 !important;
  }
}

.kc-metrics-desktop {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding-top: 20px;
  border-top: 1.5px dashed #DDD9D0;
}

@media (max-width: 768px) {
  .kc-metrics-desktop {
    display: flex !important;
    gap: 10px !important;
    padding-top: 16px !important;
    border-top: 1.5px dashed #CBD5E1 !important;
  }
  .kc-metrics-desktop > div {
    flex: 1 !important;
  }
  .kc-mobile-sticky-cta {
    display: flex !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kc-fade-up, .kc-reveal, .kc-marquee-track {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`

// ── Icons Collection ────────────────────────────────────────────────────────
const I = {
    ArrowRight: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    ),
    Check: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    ShieldCheck: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    Building: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
    ),
    Target: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    Layers: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    ),
    Zap: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    User: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Lock: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Plus: ({ s = 16, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Menu: ({ s = 22, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    Close: ({ s = 22, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
}

// ── Design Primitives ──────────────────────────────────────────────────────
function Logo({ size = 28, color = KC.ink, mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 8, background: '#FEFEFE',
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `3px 3px 0 ${color}`, transform: 'rotate(-3deg)',
                overflow: 'hidden', flexShrink: 0,
            }}>
                <img src="/vite.svg" alt="KerjaCerdas Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: -0.6, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

function BrutalButton({ children, onClick, variant = 'primary', size = 'md', full = false, icon, style = {}, disabled = false, id }) {
    const sizes = {
        sm: { padding: '8px 14px', fontSize: 13, radius: 8 },
        md: { padding: '12px 20px', fontSize: 14, radius: 9 },
        lg: { padding: '14px 24px', fontSize: 15, radius: 10 },
    }[size]

    const variants = {
        primary: { bg: KC.ink, fg: '#fff', border: KC.ink, shadow: KC.orange },
        accent: { bg: KC.orange, fg: '#fff', border: KC.ink, shadow: KC.ink },
        lime: { bg: KC.lime, fg: KC.ink, border: KC.ink, shadow: KC.ink },
        secondary: { bg: KC.paper, fg: KC.ink, border: KC.ink, shadow: KC.ink },
        ghost: { bg: 'transparent', fg: KC.ink, border: 'transparent', shadow: 'transparent' },
    }[variant]

    return (
        <button id={id} disabled={disabled} onClick={onClick} className={variant === 'ghost' ? '' : 'kc-btn'} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: sizes.padding, fontSize: sizes.fontSize, fontWeight: 800,
            background: variants.bg, color: variants.fg,
            border: `2px solid ${variants.border}`,
            boxShadow: variant === 'ghost' ? 'none' : `3.5px 3.5px 0 ${variants.shadow}`,
            borderRadius: sizes.radius, cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: -0.2,
            fontFamily: FONT, width: full ? '100%' : 'auto', opacity: disabled ? 0.6 : 1,
            '--kc-btn-shadow': variants.shadow, ...style,
        }}>
            {children}
            {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        </button>
    )
}

function Badge({ children, color = KC.surface, ink = KC.ink, size = 'md', icon, border = KC.ink, style = {} }) {
    const pad = size === 'sm' ? '2px 7px' : '4px 10px'
    const fs = size === 'sm' ? 11 : 12
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad,
            fontSize: fs, fontWeight: 800, background: color, color: ink,
            border: `1.5px solid ${border}`, borderRadius: 6,
            letterSpacing: 0.2, fontFamily: FONT, ...style,
        }}>
            {icon}{children}
        </span>
    )
}

function BrutalCard({ children, bg = '#fff', shadow = KC.ink, padding = 22, border = KC.ink, radius = 12, style = {}, className = 'kc-card-static' }) {
    return (
        <div className={className} style={{
            background: bg, border: `2px solid ${border}`,
            borderRadius: radius, padding,
            boxShadow: `4px 4px 0 ${shadow}`,
            ...style,
        }}>
            {children}
        </div>
    )
}

function Section({ children, bg = '#FAF9F5', style = {}, id, className = '' }) {
    return (
        <section id={id} className={`kc-reveal ${className}`} style={{
            background: bg,
            borderTop: `2px solid ${KC.ink}`,
            padding: '72px 0',
            ...style,
        }}>
            <div className="kc-container">
                {children}
            </div>
        </section>
    )
}

// ── Interactive Enterprise & Partner Inquiry Modal ────────────────────────────
function InquiryModal({ isOpen, onClose, initialType = 'Enterprise & HR' }) {
    const [type, setType] = useState(initialType)
    const [name, setName] = useState('')
    const [org, setOrg] = useState('')
    const [email, setEmail] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (initialType) setType(initialType)
        setSubmitted(false)
    }, [initialType, isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await submitPartnershipInquiry({
                category: type,
                name: name.trim(),
                organization: org.trim(),
                email: email.trim(),
                message: notes.trim(),
            })
            setSubmitted(true)
            toast.success('Permohonan kemitraan berhasil dikirim!')
        } catch (err) {
            toast.error(err?.message || 'Gagal mengirim permohonan. Coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(9, 10, 15, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'grid', placeItems: 'center', padding: 16,
            animation: 'kc-fade-in 0.2s ease',
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#FAF9F5', border: `2px solid ${KC.ink}`,
                    borderRadius: 14, padding: '24px', maxWidth: 500, width: '100%',
                    boxShadow: `6px 6px 0 ${KC.ink}`,
                    animation: 'kc-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
                    fontFamily: FONT, color: KC.ink, maxHeight: '90vh', overflowY: 'auto',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <Badge color={KC.orange} ink="#fff" icon={<I.Building s={13} c="#fff" />}>
                        Portal Kemitraan
                    </Badge>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#fff', border: `2px solid ${KC.ink}`,
                            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
                            boxShadow: `2px 2px 0 ${KC.ink}`, display: 'grid', placeItems: 'center',
                        }}
                        aria-label="Tutup"
                    >
                        <I.Close s={16} c={KC.ink} />
                    </button>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5, margin: '0 0 4px 0' }}>
                                Hubungi Tim Kemitraan
                            </h3>
                            <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.5, margin: 0 }}>
                                Ajukan integrasi kampus, sertifikasi alumni, atau kebutuhan rekrutmen korporasi.
                            </p>
                        </div>

                        {/* Partnership Type Selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6, color: KC.ink }}>
                                Kategori:
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {[
                                    'Institusi & Kampus',
                                    'Partner Pelatihan',
                                    'Enterprise & HR',
                                    'Karier / Internal',
                                ].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        style={{
                                            padding: '7px 8px', fontSize: 11, fontWeight: 800,
                                            background: type === t ? KC.ink : '#fff',
                                            color: type === t ? '#fff' : KC.ink,
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 6,
                                            cursor: 'pointer', textAlign: 'center',
                                            boxShadow: type === t ? `2px 2px 0 ${KC.orange}` : 'none',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                    Nama Lengkap *
                                </label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nama Anda"
                                    style={{
                                        width: '100%', padding: '9px 10px', background: '#fff',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                        fontWeight: 600, fontFamily: FONT, outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                    Organisasi / Kampus *
                                </label>
                                <input
                                    required
                                    value={org}
                                    onChange={(e) => setOrg(e.target.value)}
                                    placeholder="Nama Lembaga"
                                    style={{
                                        width: '100%', padding: '9px 10px', background: '#fff',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                        fontWeight: 600, fontFamily: FONT, outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                Email Resmi *
                            </label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@lembaga.ac.id atau email@perusahaan.com"
                                style={{
                                    width: '100%', padding: '9px 10px', background: '#fff',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                    fontWeight: 600, fontFamily: FONT, outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                Keterangan Singkat
                            </label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Jelaskan kebutuhan kerja sama..."
                                style={{
                                    width: '100%', padding: '9px 10px', background: '#fff',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                    fontWeight: 600, fontFamily: FONT, outline: 'none',
                                    resize: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <BrutalButton variant="primary" full size="md" disabled={loading} icon={<I.ArrowRight s={14} c="#fff" />}>
                            {loading ? 'Mengirim...' : 'Kirim Permohonan Kemitraan'}
                        </BrutalButton>

                        <div style={{ fontSize: 11, color: KC.mute, textAlign: 'center', paddingTop: 6 }}>
                            Kontak langsung: <b>sales@kerjacerdas.id</b>
                        </div>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: '50%', background: KC.lime,
                            border: `2px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                            margin: '0 auto 14px', boxShadow: `3px 3px 0 ${KC.ink}`,
                        }}>
                            <I.Check s={28} c={KC.ink} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px 0' }}>
                            Permohonan Terkirim
                        </h3>
                        <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, maxWidth: 380, margin: '0 auto 20px' }}>
                            Terima kasih, <b>{name}</b> ({org}). Tim KerjaCerdas akan mempelajari permohonan kemitraan kategori <b>{type}</b> dan menghubungi email <b>{email}</b> dalam kurun waktu 1x24 jam kerja.
                        </p>
                        <BrutalButton variant="primary" size="sm" onClick={onClose}>
                            Selesai
                        </BrutalButton>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Navigation Bar & Mobile Drawer ──────────────────────────────────────────
function Navigation({ onMasuk, onDaftar, onAbout, onPricing }) {
    const [mobileOpen, setMobileOpen] = useState(false)

    const scrollTo = (id) => {
        setMobileOpen(false)
        const el = document.getElementById(id)
        if (!el) return
        const y = el.getBoundingClientRect().top + window.scrollY - 76
        window.scrollTo({ top: y, behavior: 'smooth' })
    }

    return (
        <>
            <nav style={{
                position: 'sticky', top: 0, zIndex: 60,
                background: '#FFFFFF',
                borderBottom: `2px solid ${KC.ink}`,
                fontFamily: FONT,
            }}>
                <div className="kc-container" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 68,
                }}>
                    <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ textDecoration: 'none' }}>
                        <Logo size={30} />
                    </a>

                    {/* Desktop Navigation Links */}
                    <div className="kc-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, fontWeight: 700 }}>
                        <a className="kc-nav-link" href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how') }} style={{ color: KC.ink, textDecoration: 'none' }}>Cara Kerja</a>
                        <a className="kc-nav-link" href="#fitur" onClick={(e) => { e.preventDefault(); scrollTo('fitur') }} style={{ color: KC.ink, textDecoration: 'none' }}>Fitur</a>
                        <a className="kc-nav-link" href="#harga" onClick={(e) => { e.preventDefault(); scrollTo('harga') }} style={{ color: KC.ink, textDecoration: 'none' }}>Harga</a>
                        <a className="kc-nav-link" href="#tentang" onClick={(e) => { e.preventDefault(); onAbout() }} style={{ color: KC.ink, textDecoration: 'none' }}>Tentang</a>
                    </div>

                    {/* Desktop Auth Actions */}
                    <div className="kc-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BrutalButton id="nav-login-btn" variant="secondary" size="sm" onClick={onMasuk}>Masuk</BrutalButton>
                        <BrutalButton id="nav-register-btn" variant="primary" size="sm" icon={<I.ArrowRight s={13} c="#fff" />} onClick={onDaftar}>Coba Gratis</BrutalButton>
                    </div>

                    {/* Mobile Hamburger Trigger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="kc-nav-mobile-trigger"
                        style={{
                            display: 'none', background: '#fff', border: `2px solid ${KC.ink}`,
                            borderRadius: 6, padding: 7, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                        }}
                        aria-label="Open Navigation Menu"
                    >
                        <I.Menu s={20} c={KC.ink} />
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(9, 10, 15, 0.65)',
                }} onClick={() => setMobileOpen(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: 0, right: 0, bottom: 0,
                            width: 'min(300px, 84vw)', background: '#FAF9F5',
                            borderLeft: `2px solid ${KC.ink}`,
                            boxShadow: `-5px 0 0 ${KC.ink}`,
                            padding: '22px', display: 'flex', flexDirection: 'column',
                            animation: 'kc-drawer-slide 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Logo size={24} />
                            <button
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    background: '#fff', border: `2px solid ${KC.ink}`,
                                    borderRadius: 6, padding: 5, cursor: 'pointer',
                                    boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}
                            >
                                <I.Close s={16} c={KC.ink} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, fontFamily: FONT }}>
                            {['how:Cara Kerja', 'fitur:Fitur', 'harga:Harga'].map(item => {
                                const [id, label] = item.split(':')
                                return (
                                    <button
                                        key={id}
                                        onClick={() => scrollTo(id)}
                                        style={{
                                            textAlign: 'left', padding: '10px 12px', background: '#fff',
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800,
                                            fontSize: 14, cursor: 'pointer', boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                        }}
                                    >
                                        {label}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => { setMobileOpen(false); onAbout() }}
                                style={{
                                    textAlign: 'left', padding: '10px 12px', background: '#fff',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800,
                                    fontSize: 14, cursor: 'pointer', boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                }}
                            >
                                Tentang
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: `1.5px dashed ${KC.ash}` }}>
                            <BrutalButton variant="secondary" full size="sm" onClick={() => { setMobileOpen(false); onMasuk() }}>Masuk</BrutalButton>
                            <BrutalButton variant="primary" full size="sm" icon={<I.ArrowRight s={13} c="#fff" />} onClick={() => { setMobileOpen(false); onDaftar() }}>Daftar Gratis</BrutalButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// ── Clean Interactive Live Candidate Match Card (Hero Right Panel) ─────────────
function CleanHeroPreview() {
    const [tab, setTab] = useState('match') // 'match' | 'gap'

    return (
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <BrutalCard bg="#fff" padding={20} shadow={KC.ink} radius={12} style={{ border: `2px solid ${KC.ink}` }}>
                {/* Top Clean Switcher */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingBottom: 12, borderBottom: `1.5px solid ${KC.surfaceAlt}`, marginBottom: 16,
                }}>
                    <div style={{ display: 'inline-flex', background: KC.surface, padding: 3, borderRadius: 7, border: `1.5px solid ${KC.ink}` }}>
                        <button
                            onClick={() => setTab('match')}
                            style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 5,
                                border: 'none', cursor: 'pointer', fontFamily: FONT,
                                background: tab === 'match' ? KC.ink : 'transparent',
                                color: tab === 'match' ? '#fff' : KC.mute,
                            }}
                        >
                            Hasil Pencocokan
                        </button>
                        <button
                            onClick={() => setTab('gap')}
                            style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 5,
                                border: 'none', cursor: 'pointer', fontFamily: FONT,
                                background: tab === 'gap' ? KC.ink : 'transparent',
                                color: tab === 'gap' ? '#fff' : KC.mute,
                            }}
                        >
                            Peta Skill Gap
                        </button>
                    </div>

                    <Badge color={KC.limeSoft} ink={KC.ink} size="sm">
                        Top 1 Shortlist
                    </Badge>
                </div>

                {tab === 'match' ? (
                    <div>
                        {/* Profile Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 10, background: KC.cyan,
                                    border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                    fontWeight: 900, fontSize: 15, color: KC.ink, flexShrink: 0,
                                }}>
                                    RP
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: KC.ink }}>Rina Paramitha</span>
                                        <span style={{ background: KC.lime, fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4, border: `1px solid ${KC.ink}`, color: KC.ink }}>
                                            VERIFIED
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: KC.mute, marginTop: 1 }}>
                                        Senior Backend Engineer · 5 thn
                                    </div>
                                </div>
                            </div>

                            {/* Match Score Badge */}
                            <div style={{
                                background: KC.orange, color: '#fff', padding: '6px 12px',
                                borderRadius: 8, border: `1.5px solid ${KC.ink}`, textAlign: 'center',
                                flexShrink: 0,
                            }}>
                                <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>94%</div>
                                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase' }}>Match</div>
                            </div>
                        </div>

                        {/* Semantic Assessment */}
                        <div style={{ marginTop: 12, background: KC.surface, padding: '10px 12px', borderRadius: 8, border: `1px solid ${KC.ash}` }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: KC.muteLight, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                                Analisis Keselarasan AI
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: KC.ink, lineHeight: 1.5 }}>
                                "Kandidat memiliki penguasaan mendalam pada arsitektur microservices Go dan throughput tinggi, sesuai dengan spesifikasi lowongan Backend Lead."
                            </div>
                        </div>

                        {/* Skill Badges */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
                            <Badge color={KC.limeSoft} size="sm">Golang</Badge>
                            <Badge color={KC.limeSoft} size="sm">PostgreSQL</Badge>
                            <Badge color={KC.limeSoft} size="sm">Kubernetes</Badge>
                            <Badge color={KC.yellowSoft} size="sm">Kafka</Badge>
                            <Badge color={KC.surface} size="sm">+2 Skill</Badge>
                        </div>

                        {/* Bottom Detail */}
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${KC.ash}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700 }}>
                            <span style={{ color: KC.mute }}>Gaji: <b style={{ color: KC.ink }}>Rp 32 - 45 jt/bln</b></span>
                            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <I.Check s={13} c="#059669" /> Rekomendasi Interview
                            </span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>Celah Kompetensi vs Posisi Target</span>
                            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: KC.orange }}>Gap: -6%</span>
                        </div>

                        {[
                            { name: 'Go Backend & Concurrency', val: '98%', color: KC.lime },
                            { name: 'System Architecture & High Load', val: '92%', color: KC.lime },
                            { name: 'Distributed Caching (Redis)', val: '86%', color: KC.yellow },
                            { name: 'Observability & Monitoring', val: '76%', color: KC.orange },
                        ].map((s, i) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 2, color: KC.ink }}>
                                    <span>{s.name}</span>
                                    <span style={{ fontFamily: MONO, fontWeight: 800 }}>{s.val}</span>
                                </div>
                                <div style={{ height: 5, background: KC.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: s.val, height: '100%', background: s.color, borderRadius: 3 }} />
                                </div>
                            </div>
                        ))}

                        <div style={{ marginTop: 12, padding: '8px 10px', background: KC.yellowSoft, borderRadius: 6, border: `1px solid ${KC.yellow}`, fontSize: 11, fontWeight: 700, color: KC.ink }}>
                            💡 Rekomendasi: Selesaikan modul <i>Cloud-Native Observability</i> untuk meningkatkan skor ke 99%.
                        </div>
                    </div>
                )}
            </BrutalCard>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// Main Landing Hero Component
// ════════════════════════════════════════════════════════════════════════════
export default function LandingHero() {
    const { openAuthModal, navigate } = useStore()
    const [howTab, setHowTab] = useState('seeker')
    const [faqOpen, setFaqOpen] = useState(0)
    const [inquiryModal, setInquiryModal] = useState({ open: false, type: 'Enterprise & HR' })

    // Scroll reveal observer & hash scroll on load
    useEffect(() => {
        const hash = window.location.hash
        if (hash) {
            const id = hash.replace('#', '')
            setTimeout(() => {
                const el = document.getElementById(id)
                if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 76
                    window.scrollTo({ top: y, behavior: 'smooth' })
                }
            }, 150)
        }

        const els = document.querySelectorAll('.kc-reveal')
        if (!('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('kc-in'))
            return
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('kc-in')
                    io.unobserve(e.target)
                }
            })
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
        els.forEach(el => io.observe(el))
        return () => io.disconnect()
    }, [])

    const onMasuk = () => openAuthModal('login')
    const onDaftar = () => openAuthModal('register', 'seeker')
    const onEmployer = () => openAuthModal('register', 'employer')
    const onAbout = () => navigate('about')
    const onPricing = () => {
        const el = document.getElementById('harga')
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 76
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }
    
    const openInquiry = (category) => {
        setInquiryModal({ open: true, type: category })
    }

    const HOW_SEEKER = [
        {
            num: '01',
            title: 'Ekstraksi CV Cerdas',
            desc: 'Unggah file PDF atau lengkapi profil ringkas. AI mengekstraksi keahlian dan pengalaman kerja dalam hitungan detik.',
            accent: KC.cyan,
            icon: <I.User s={20} c={KC.ink} />,
        },
        {
            num: '02',
            title: 'Matching Multi-Dimensi',
            desc: 'Algoritma mengevaluasi kecocokan skill, tingkat senioritas, dan kompensasi untuk menghasilkan Top-5 lowongan terakurat.',
            accent: KC.yellow,
            icon: <I.Target s={20} c={KC.ink} />,
        },
        {
            num: '03',
            title: 'Tutup Skill Gap & Lamar',
            desc: 'Dapatkan rekomendasi kurikulum singkat untuk menutup celah kompetensi, lalu ajukan lamaran langsung tanpa spam.',
            accent: KC.lime,
            icon: <I.Zap s={20} c={KC.ink} />,
        },
    ]

    const HOW_EMPLOYER = [
        {
            num: '01',
            title: 'Pasang Kriteria Lowongan',
            desc: 'Masukkan deskripsi pekerjaan. AI menyempurnakan parameter kompetensi, level pengalaman, dan benchmark gaji pasar.',
            accent: KC.cyan,
            icon: <I.Building s={20} c={KC.ink} />,
        },
        {
            num: '02',
            title: 'Shortlist Otomatis (Top-5)',
            desc: 'Mesin pencocokan menyaring database talenta dan menampilkan kandidat terverifikasi dengan keselarasan tertinggi.',
            accent: KC.yellow,
            icon: <I.ShieldCheck s={20} c={KC.ink} />,
        },
        {
            num: '03',
            title: 'Efisiensi Screening 80%',
            desc: 'Evaluasi kandidat melalui peta skill dan rekam jejak e-KYC. Buka kontak resmi dan undang wawancara tanpa hambatan.',
            accent: KC.lime,
            icon: <I.Target s={20} c={KC.ink} />,
        },
    ]

    const FAQS = [
        {
            q: 'Apakah platform ini sepenuhnya gratis untuk pencari kerja?',
            a: 'Ya, 100% gratis. Seluruh fitur utama — pencocokan AI, analisis skill gap, konsultasi advisor karier, hingga verifikasi dokumen — dapat diakses tanpa biaya seumur hidup.',
        },
        {
            q: 'Bagaimana standar keamanan dan kerahasiaan data saya?',
            a: 'Data dokumen seperti KTP, ijazah, dan NPWP dienkripsi menggunakan standar perbankan di pusat data lokal Indonesia. Dokumen mentah tidak pernah diekspos ke publik dan hanya digunakan untuk validasi status terverifikasi.',
        },
        {
            q: 'Bagaimana cara kerja algoritma pencocokan KerjaCerdas?',
            a: 'Mesin pencocokan berbasis semantic vector membandingkan deskripsi pekerjaan dengan profil talenta secara multi-dimensi (skill teknis, pengalaman riil, kompensasi yang diharapkan, dan preferensi kerja) bukan sekadar pencarian kata kunci acak.',
        },
        {
            q: 'Apakah perusahaan dapat membatalkan langganan kapan saja?',
            a: 'Tentu. Paket Growth dan Pay-per-Unlock bersifat fleksibel tanpa kontrak mengikat. Anda dapat menyesuaikan penggunaan kuota unlock sesuai kebutuhan rekrutmen tim.',
        },
    ]

    return (
        <div style={{ background: '#FAF9F5', fontFamily: FONT, color: KC.ink, minHeight: '100vh', overflowX: 'hidden' }}>
            <style>{KC_CSS}</style>

            {/* Navigation */}
            <Navigation
                onMasuk={onMasuk}
                onDaftar={onDaftar}
                onAbout={onAbout}
                onPricing={onPricing}
            />

            {/* Inquiry Modal */}
            <InquiryModal
                isOpen={inquiryModal.open}
                onClose={() => setInquiryModal({ open: false, type: '' })}
                initialType={inquiryModal.type}
            />

            {/* ── HERO SECTION ── */}
            <header className="kc-container" style={{ paddingTop: 52, paddingBottom: 64 }}>
                <div className="kc-hero-grid">
                    <div>
                        {/* Innovation Pill Tag */}
                        <div className="kc-fade-up">
                            <Badge color="#fff" ink={KC.ink} border={KC.ink}>
                                Platform AI Matching Kerja Indonesia
                            </Badge>
                        </div>

                        {/* Main Value Headline */}
                        <h1 className="kc-hero-title kc-fade-up d1" style={{
                            fontSize: 52, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1.8,
                            margin: '18px 0 14px', color: KC.ink,
                        }}>
                            Perekrutan Talenta yang<br />
                            <span className="kc-hero-highlight" style={{
                                background: KC.orange, color: '#fff', padding: '2px 12px',
                                border: `2px solid ${KC.ink}`, boxShadow: `3.5px 3.5px 0 ${KC.ink}`,
                                borderRadius: 7, display: 'inline-block', verticalAlign: 'middle',
                                margin: '4px 0',
                            }}>
                                Akurat & Terverifikasi.
                            </span><br />
                            Bukan spekulasi lempar CV.
                        </h1>

                        {/* Subtitle */}
                        <p className="kc-fade-up d2" style={{
                            fontSize: 16, lineHeight: 1.6, color: KC.mute, maxWidth: 520,
                            margin: '0 0 26px 0',
                        }}>
                            Hubungkan kebutuhan rekrutmen perusahaan dengan talenta terbaik melalui pencocokan berbasis kompetensi, skill gap transparan, dan dokumen e-KYC valid.
                        </p>

                        {/* Dual Action CTAs */}
                        <div className="kc-fade-up d3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                            <BrutalButton variant="primary" size="lg" icon={<I.ArrowRight s={15} c="#fff" />} onClick={onDaftar}>
                                Cari Lowongan Kerja
                            </BrutalButton>
                            <BrutalButton variant="secondary" size="lg" icon={<I.Building s={15} c={KC.ink} />} onClick={onEmployer}>
                                Pasang Lowongan HR
                            </BrutalButton>
                        </div>

                        {/* Minimalist Metrics Strip - Desktop ONLY (Full 3 KPIs, hidden completely on mobile) */}
                        <div className="kc-metrics-desktop kc-fade-up d3">
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: KC.orange, letterSpacing: -0.8, fontFamily: MONO }}>
                                    &lt; 8 Detik
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginTop: 2 }}>
                                    Waktu Pencocokan AI
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: KC.ink, letterSpacing: -0.8, fontFamily: MONO }}>
                                    94%
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginTop: 2 }}>
                                    Akurasi Keselarasan Skill
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: KC.ink, letterSpacing: -0.8, fontFamily: MONO }}>
                                    100%
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: KC.mute, marginTop: 2 }}>
                                    Profil Terverifikasi e-KYC
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Interactive Clean Card */}
                    <div className="kc-fade-up d2">
                        <CleanHeroPreview />
                    </div>
                </div>
            </header>

            {/* ── CLIENT ECOSYSTEM STRIP ── */}
            <section style={{
                borderTop: `2px solid ${KC.ink}`, borderBottom: `2px solid ${KC.ink}`,
                background: '#fff', padding: '16px 0', overflow: 'hidden',
            }}>
                <div style={{
                    maxWidth: 1280, margin: '0 auto', padding: '0 20px',
                    display: 'flex', alignItems: 'center', gap: 20,
                }}>
                    <div style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase',
                        color: KC.muteLight, whiteSpace: 'nowrap', borderRight: `1.5px solid ${KC.ash}`,
                        paddingRight: 16,
                    }}>
                        Ekosistem Pengguna
                    </div>

                    <div className="kc-marquee-container" style={{
                        flex: 1, overflow: 'hidden',
                        maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
                    }}>
                        <div className="kc-marquee-track">
                            {[...Array(2)].flatMap((_, rep) => [
                                'BUMN Digital', 'Tech Scaleup', 'SaaS Enterprise', 'Tier-1 Headhunter',
                                'Banking & Fintech', 'Konsultan Teknologi', 'Startup Unicorn', 'Retail MNC'
                            ].map((item, idx) => (
                                <div key={`${rep}-${idx}`} style={{
                                    fontFamily: MONO, fontSize: 13, fontWeight: 700,
                                    color: KC.ink, letterSpacing: -0.2, display: 'inline-flex',
                                    alignItems: 'center', gap: 10,
                                }}>
                                    <span>{item}</span>
                                    <span style={{ color: KC.ash }}>/</span>
                                </div>
                            )))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS SECTION ── */}
            <Section id="how" bg="#FAF9F5">
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Badge color={KC.yellow} ink={KC.ink}>Cara Kerja</Badge>
                        <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 4px', lineHeight: 1.1, color: KC.ink }}>
                            Tiga Langkah Sederhana
                        </h2>
                        <p style={{ fontSize: 15, color: KC.mute, maxWidth: 500, margin: 0 }}>
                            Proses rekrutmen dan pencarian kerja yang transparan, terstruktur, dan bebas hambatan.
                        </p>
                    </div>

                    {/* Role Tab Toggle */}
                    <div style={{
                        display: 'inline-flex', background: '#fff', border: `2px solid ${KC.ink}`,
                        borderRadius: 8, padding: 3, boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                    }}>
                        {['seeker', 'employer'].map((tab) => {
                            const active = howTab === tab
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setHowTab(tab)}
                                    style={{
                                        padding: '7px 16px', fontSize: 12, fontWeight: 800,
                                        background: active ? KC.ink : 'transparent',
                                        color: active ? '#fff' : KC.mute,
                                        borderRadius: 6, border: 'none', cursor: 'pointer',
                                        fontFamily: FONT, transition: 'all 0.15s ease',
                                    }}
                                >
                                    {tab === 'seeker' ? 'Untuk Job Seeker' : 'Untuk Employer / HR'}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 3 Step Cards */}
                <div className="kc-three-col">
                    {(howTab === 'seeker' ? HOW_SEEKER : HOW_EMPLOYER).map((step) => (
                        <BrutalCard key={step.num} bg="#fff" padding={22}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, background: step.accent,
                                    border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                    boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}>
                                    {step.icon}
                                </div>
                                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 900, color: KC.muteLight }}>
                                    {step.num}
                                </span>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.25, margin: '0 0 8px 0', color: KC.ink }}>
                                {step.title}
                            </h3>
                            <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, margin: 0 }}>
                                {step.desc}
                            </p>
                        </BrutalCard>
                    ))}
                </div>
            </Section>

            {/* ── CORE FEATURES GRID ── */}
            <Section id="fitur" bg="#fff">
                <div style={{ marginBottom: 36 }}>
                    <Badge color={KC.cyan} ink={KC.ink}>Fitur Utama</Badge>
                    <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 4px', lineHeight: 1.1, color: KC.ink }}>
                        Keunggulan Platform KerjaCerdas
                    </h2>
                    <p style={{ fontSize: 15, color: KC.mute, maxWidth: 540, margin: 0 }}>
                        Infrastruktur cerdas untuk mempercepat proses seleksi tanpa mengorbankan kualitas kandidat.
                    </p>
                </div>

                <div className="kc-features-grid">
                    {[
                        {
                            title: 'Pencocokan Semantik (Vector Matching)',
                            desc: 'Mencocokkan keahlian riil dan deskripsi pekerjaan secara multi-dimensi untuk menghasilkan daftar Top-5 kandidat terakurat.',
                            accent: KC.orange,
                            icon: <I.Target s={20} c="#fff" />,
                        },
                        {
                            title: 'Pemetaan Skill Gap & Rekomendasi Kursus',
                            desc: 'Menganalisis celah kompetensi terhadap kriteria posisi impian dan menyarankan modul pelatihan relevan.',
                            accent: KC.lime,
                            icon: <I.Layers s={20} c={KC.ink} />,
                        },
                        {
                            title: 'Verifikasi Dokumen e-KYC Terenkripsi',
                            desc: 'Validasi resmi KTP, ijazah Kemendikbud SIVIL, dan NPWP untuk menciptakan ekosistem kerja yang terpercaya.',
                            accent: KC.yellow,
                            icon: <I.ShieldCheck s={20} c={KC.ink} />,
                        },
                        {
                            title: 'Siap Integrasi Sistem HR Perusahaan',
                            desc: 'Mendukung koneksi ke sistem HR korporasi (Workday, SAP, Greenhouse) untuk alur kerja rekrutmen terpadu.',
                            accent: KC.cyan,
                            icon: <I.Building s={20} c={KC.ink} />,
                        },
                    ].map((feat, idx) => (
                        <BrutalCard key={idx} bg="#FAF9F5" padding={22}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, background: feat.accent,
                                border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                boxShadow: `2px 2px 0 ${KC.ink}`, marginBottom: 14,
                            }}>
                                {feat.icon}
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: '0 0 6px 0', color: KC.ink }}>
                                {feat.title}
                            </h3>
                            <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, margin: 0 }}>
                                {feat.desc}
                            </p>
                        </BrutalCard>
                    ))}
                </div>
            </Section>

            {/* ── TRUST & PRIVACY ── */}
            <Section bg={KC.ink} style={{ color: '#fff' }}>
                <div className="kc-trust-grid">
                    <div>
                        <Badge color={KC.orange} ink="#fff" border="#fff" icon={<I.Lock s={12} c="#fff" />}>
                            Keamanan Data
                        </Badge>
                        <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: '14px 0 12px', lineHeight: 1.15 }}>
                            Data Terenkripsi.<br />Hanya untuk Verifikasi.
                        </h2>
                        <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6, maxWidth: 480, margin: '0 0 20px 0' }}>
                            Dokumen sensitif seperti KTP, Ijazah, dan NPWP <b>tidak pernah dipublikasikan</b> ke pihak luar. Sistem hanya melakukan validasi satu kali untuk menerbitkan badge <span style={{ background: KC.lime, color: KC.ink, padding: '1px 6px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>VERIFIED</span>.
                        </p>

                        <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 700, flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <I.Check s={14} c={KC.lime} /> Pusat Data Lokal Indonesia
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <I.Check s={14} c={KC.lime} /> Enkripsi End-to-End
                            </span>
                        </div>
                    </div>

                    {/* Responsive Trust Document Cards */}
                    <div className="kc-trust-cards-mobile" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                        width: '100%',
                    }}>
                        {[
                            {
                                role: 'Untuk Pencari Kerja',
                                docs: 'KTP & Ijazah S1 (SIVIL)',
                                desc: 'Verifikasi identitas & integritas pendidikan.',
                                accent: KC.orange,
                                icon: <I.User s={18} c="#fff" />,
                            },
                            {
                                role: 'Untuk Employer',
                                docs: 'NPWP & Akta Perusahaan',
                                desc: 'Verifikasi legalitas badan usaha resmi.',
                                accent: KC.cyan,
                                icon: <I.Building s={18} c="#fff" />,
                            },
                        ].map((card, idx) => (
                            <div key={idx} style={{
                                background: '#14151D', border: '1.5px solid rgba(255,255,255,0.2)',
                                borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, background: card.accent,
                                    border: '1.5px solid #fff', display: 'grid', placeItems: 'center',
                                    marginBottom: 10,
                                }}>
                                    {card.icon}
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF' }}>
                                    {card.role}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: '3px 0 4px' }}>
                                    {card.docs}
                                </div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.45 }}>
                                    {card.desc}
                                </div>
                            </div>
                        ))}

                        <div style={{
                            gridColumn: '1 / -1', background: '#1A1B24', border: '1.5px solid rgba(255,255,255,0.15)',
                            borderRadius: 8, padding: 12, fontSize: 11, color: '#D1D5DB', lineHeight: 1.5,
                        }}>
                            🔒 <b>Kontrol Penuh:</b> Dokumen mentah dapat dihapus kapan saja melalui pengaturan akun.
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── PRICING SECTION ── */}
            <Section id="harga" bg="#fff">
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <Badge color={KC.yellow} ink={KC.ink}>Skema Harga</Badge>
                    <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 6px', lineHeight: 1.1, color: KC.ink }}>
                        Gratis untuk Talenta. Transparan untuk HR.
                    </h2>
                    <p style={{ fontSize: 15, color: KC.mute, maxWidth: 520, margin: '0 auto' }}>
                        Pencari kerja tidak dipungut biaya. Perusahaan hanya membayar sesuai kebutuhan perekrutan.
                    </p>
                </div>

                <div className="kc-pricing-grid">
                    {[
                        {
                            name: 'Starter',
                            price: 'Gratis',
                            period: 'selamanya',
                            desc: 'Cocok untuk eksplorasi dan pemasangan lowongan dasar.',
                            highlight: false,
                            bg: '#FAF9F5',
                            color: KC.ink,
                            btnVariant: 'secondary',
                            cta: 'Pasang Lowongan',
                            perks: [
                                'Posting lowongan tanpa batas',
                                'AI Shortlist Top-5 kandidat',
                                'Skor keselarasan kompetensi',
                                'Verifikasi profil dasar',
                            ],
                            action: onEmployer,
                        },
                        {
                            name: 'Pay-per-Unlock',
                            price: '50rb',
                            period: '/ 10 kandidat',
                            desc: 'Pilihan populer bagi tim yang aktif mewawancarai talenta siap kerja.',
                            highlight: true,
                            bg: KC.orange,
                            color: '#fff',
                            btnVariant: 'lime',
                            cta: 'Mulai Rekrut',
                            perks: [
                                'Buka kontak 10 kandidat resmi',
                                'Akses CV PDF & portofolio lengkap',
                                'KTP & NPWP Terverifikasi',
                                'Validasi Ijazah SIVIL resmi',
                                'Garansi bebas ghosting',
                            ],
                            action: onEmployer,
                        },
                        {
                            name: 'Enterprise Scale',
                            price: 'Custom',
                            period: 'sesuai kebutuhan',
                            desc: 'Solusi terintegrasi untuk korporasi, BUMN, dan agensi rekrutmen.',
                            highlight: false,
                            bg: KC.ink,
                            color: '#fff',
                            btnVariant: 'accent',
                            cta: 'Konsultasi Enterprise',
                            perks: [
                                'Konektor API ke Workday & SAP',
                                'Alur screening kustom',
                                'Dedicated Account Manager',
                                'Akses API bulk vector match',
                                'Perjanjian SLA 99.9%',
                            ],
                            action: () => openInquiry('Enterprise & HR'),
                        },
                    ].map((tier, idx) => (
                        <div key={idx} style={{
                            background: tier.bg, color: tier.color,
                            border: `2px solid ${KC.ink}`, borderRadius: 12,
                            padding: 24, display: 'flex', flexDirection: 'column',
                            boxShadow: tier.highlight ? `6px 6px 0 ${KC.ink}` : `3.5px 3.5px 0 ${KC.ink}`,
                            position: 'relative',
                        }}>
                            {tier.highlight && (
                                <div style={{
                                    position: 'absolute', top: -12, right: 16, background: KC.yellow,
                                    border: `1.5px solid ${KC.ink}`, padding: '3px 10px', fontSize: 10,
                                    fontWeight: 900, textTransform: 'uppercase', borderRadius: 999,
                                    color: KC.ink, boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}>
                                    Paling Diminati
                                </div>
                            )}

                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.85 }}>
                                {tier.name}
                            </div>

                            <div style={{ margin: '10px 0 8px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                {tier.price !== 'Gratis' && tier.price !== 'Custom' && (
                                    <span style={{ fontSize: 16, fontWeight: 800, opacity: 0.85 }}>Rp</span>
                                )}
                                <span style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1, fontFamily: MONO }}>
                                    {tier.price}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
                                    {tier.period}
                                </span>
                            </div>

                            <p style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.85, margin: '0 0 16px 0' }}>
                                {tier.desc}
                            </p>

                            <div style={{ height: 1, background: tier.highlight || tier.color === '#fff' ? 'rgba(255,255,255,0.2)' : KC.ash, marginBottom: 16 }} />

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                                {tier.perks.map((perk, pIdx) => (
                                    <li key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, fontWeight: 600 }}>
                                        <span style={{ display: 'inline-flex', marginTop: 1 }}>
                                            <I.Check s={13} c={tier.highlight ? '#fff' : (tier.color === '#fff' ? KC.lime : KC.ink)} />
                                        </span>
                                        <span>{perk}</span>
                                    </li>
                                ))}
                            </ul>

                            <BrutalButton variant={tier.btnVariant} full size="md" onClick={tier.action}>
                                {tier.cta}
                            </BrutalButton>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── FAQ SECTION ── */}
            <Section bg="#FAF9F5">
                <div className="kc-faq-grid">
                    <div>
                        <Badge color={KC.orange} ink="#fff">FAQ</Badge>
                        <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 8px', lineHeight: 1.1, color: KC.ink }}>
                            Pertanyaan Umum
                        </h2>
                        <p style={{ fontSize: 14, color: KC.mute, lineHeight: 1.55, margin: '0 0 18px 0' }}>
                            Pertanyaan seputar pencocokan AI, verifikasi data, atau integrasi lowongan kerja.
                        </p>
                        <BrutalButton variant="primary" size="md" icon={<I.ArrowRight s={13} c="#fff" />} onClick={onDaftar}>
                            Mulai Sekarang
                        </BrutalButton>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FAQS.map((faq, idx) => {
                            const isOpen = faqOpen === idx
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        background: '#fff', border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 10, padding: 16,
                                        boxShadow: isOpen ? `3px 3px 0 ${KC.ink}` : 'none',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div
                                        onClick={() => setFaqOpen(isOpen ? -1 : idx)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10 }}
                                    >
                                        <span style={{ fontSize: 14, fontWeight: 800, color: KC.ink }}>
                                            {faq.q}
                                        </span>
                                        <span style={{
                                            display: 'inline-flex', transform: isOpen ? 'rotate(45deg)' : 'none',
                                            transition: 'transform 0.15s ease', flexShrink: 0,
                                        }}>
                                            <I.Plus s={18} c={KC.ink} />
                                        </span>
                                    </div>
                                    {isOpen && (
                                        <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.6, margin: '10px 0 0 0', paddingTop: 8, borderTop: `1px solid ${KC.ash}` }}>
                                            {faq.a}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Section>

            {/* ── BOTTOM CTA ── */}
            <section style={{
                background: KC.orange, color: '#fff', padding: '60px 0',
                borderTop: `2px solid ${KC.ink}`, borderBottom: `2px solid ${KC.ink}`,
                textAlign: 'center',
            }}>
                <div className="kc-container">
                    <h2 style={{
                        fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, letterSpacing: -1.5,
                        lineHeight: 1.1, margin: '0 0 12px 0',
                    }}>
                        Mulai Rekrutmen yang Akurat Hari Ini.
                    </h2>
                    <p style={{ fontSize: 16, maxWidth: 560, margin: '0 auto 24px', opacity: 0.95, lineHeight: 1.55 }}>
                        Daftar dalam 2 menit. Dapatkan kurasi Top-5 match berbasis kecocokan kompetensi riil.
                    </p>

                    <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <BrutalButton variant="secondary" size="lg" icon={<I.ArrowRight s={15} c={KC.ink} />} onClick={onDaftar}>
                            Daftar Sebagai Talenta
                        </BrutalButton>
                        <BrutalButton variant="primary" size="lg" style={{ background: KC.ink, boxShadow: `4px 4px 0 ${KC.yellow}` }} onClick={onEmployer}>
                            Demo Solusi Rekruter →
                        </BrutalButton>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: KC.ink, color: '#fff', padding: '52px 0 28px' }}>
                <div className="kc-container">
                    <div className="kc-foot-grid" style={{ marginBottom: 36 }}>
                        <div>
                            <Logo size={26} color="#fff" mark={KC.orange} />
                            <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginTop: 12, maxWidth: 260 }}>
                                Platform kecerdasan rekrutmen dan pemetaan kompetensi karier untuk ekosistem kerja modern Indonesia.
                            </p>
                        </div>

                        {[
                            { title: 'Produk', items: [
                                { label: 'Cara Kerja', fn: () => { const el = document.getElementById('how'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 76; window.scrollTo({ top: y, behavior: 'smooth' }) } } },
                                { label: 'Fitur', fn: () => { const el = document.getElementById('fitur'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 76; window.scrollTo({ top: y, behavior: 'smooth' }) } } },
                                { label: 'Harga', fn: () => { const el = document.getElementById('harga'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 76; window.scrollTo({ top: y, behavior: 'smooth' }) } } },
                            ]},
                            { title: 'Solusi', items: [
                                { label: 'Untuk Talenta', fn: onDaftar },
                                { label: 'Untuk HR / Employer', fn: onEmployer },
                                { label: 'Institusi & Kampus', fn: () => openInquiry('Institusi & Kampus') },
                                { label: 'Partner Pelatihan', fn: () => openInquiry('Partner Pelatihan') },
                            ]},
                            { title: 'Perusahaan', items: [
                                { label: 'Tentang Kami', fn: () => navigate('about') },
                                { label: 'Karier', fn: () => openInquiry('Karier / Internal') },
                                { label: 'Hubungi Sales', fn: () => openInquiry('Enterprise & HR') },
                            ]},
                            { title: 'Legal', items: [
                                { label: 'Kebijakan Privasi', fn: () => navigate('privacy') },
                                { label: 'Syarat & Ketentuan', fn: () => navigate('privacy') },
                                { label: 'Keamanan Data', fn: () => navigate('privacy') },
                            ]},
                        ].map((col, cIdx) => (
                            <div key={cIdx}>
                                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
                                    {col.title}
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {col.items.map((item, iIdx) => (
                                        <li key={iIdx}>
                                            <button
                                                onClick={item.fn}
                                                style={{
                                                    background: 'none', border: 'none', padding: 0, color: '#D1D5DB',
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                                                    fontFamily: FONT, transition: 'color 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = KC.orange}
                                                onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
                                            >
                                                {item.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 11, color: '#9CA3AF', flexWrap: 'wrap', gap: 10,
                    }}>
                        <span>© 2026 KerjaCerdas Indonesia. Seluruh hak cipta dilindungi.</span>
                    </div>
                </div>
            </footer>

            {/* Mobile Sticky Action Bar (Frame 00) */}
            <div className="kc-mobile-sticky-cta" style={{
                display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
                background: '#FFFFFF', borderTop: `1.5px solid ${KC.ink}`, padding: '12px 18px calc(16px + env(safe-area-inset-bottom, 0px))',
                zIndex: 65, flexDirection: 'column', gap: 9,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
            }}>
                <button
                    onClick={onDaftar}
                    style={{
                        padding: '13px 14px', background: KC.ink, border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `3px 3px 0 ${KC.orange}`,
                        fontFamily: FONT, fontWeight: 800, fontSize: 13.5, color: '#fff',
                        minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        cursor: 'pointer', width: '100%',
                    }}
                >
                    Cari Lowongan Kerja →
                </button>
                <button
                    onClick={onEmployer}
                    style={{
                        padding: '12px 14px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                        fontFamily: FONT, fontWeight: 800, fontSize: 13, color: KC.ink,
                        minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        cursor: 'pointer', width: '100%',
                    }}
                >
                    Pasang Lowongan HR
                </button>
            </div>
        </div>
    )
}
