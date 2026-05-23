/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'

// ════════════════════════════════════════════════════════════════════════════
// KerjaCerdas Landing — Refined Neo-Brutal (Variant A from design canvas)
// Ported from design bundle: KerjaCerdas Design / landing.jsx (LandingA)
// ════════════════════════════════════════════════════════════════════════════

const KC = {
    ink: '#0B0B0F',
    bone: '#FAF8F2',
    paper: '#FFFFFF',
    surface: '#F4F1EA',
    orange: '#FF5722',
    orangeSoft: '#FFE0D4',
    yellow: '#FFCB05',
    cyan: '#7AE7F0',
    pink: '#FFB7D5',
    lime: '#C8F26B',
    mute: '#6B6760',
    ash: '#E5E0D6',
}

const FONT = '"Plus Jakarta Sans", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

// ── Styles (responsive + animation + hover) ─────────────────────────────
const KC_CSS = `
@keyframes kc-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes kc-float-a { 0%,100% { transform: rotate(2deg) translateY(0); } 50% { transform: rotate(2deg) translateY(-10px); } }
@keyframes kc-float-b { 0%,100% { transform: rotate(-3deg) translateY(0); } 50% { transform: rotate(-3deg) translateY(-8px); } }
@keyframes kc-float-c { 0%,100% { transform: rotate(1deg) translateY(0); } 50% { transform: rotate(1deg) translateY(-6px); } }
@keyframes kc-spin-slow { from { transform: rotate(-8deg); } to { transform: rotate(352deg); } }
@keyframes kc-pulse { 0%,100% { box-shadow: 5px 5px 0 #0B0B0F; } 50% { box-shadow: 8px 8px 0 #0B0B0F; } }
@keyframes kc-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes kc-wiggle { 0%,100% { transform: rotate(-1.5deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(0deg); } }
@keyframes kc-bounce-in { 0% { opacity: 0; transform: scale(.6) rotate(-12deg); } 60% { transform: scale(1.08) rotate(-6deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }
@keyframes kc-avatar-pop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes kc-shine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.kc-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); }
.kc-reveal.kc-in { opacity: 1; transform: translateY(0); }

.kc-fade-up { animation: kc-fade-up 0.7s cubic-bezier(.22,.61,.36,1) both; }
.kc-fade-up.d1 { animation-delay: .08s; }
.kc-fade-up.d2 { animation-delay: .18s; }
.kc-fade-up.d3 { animation-delay: .28s; }
.kc-fade-up.d4 { animation-delay: .38s; }

.kc-card { transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease; }
.kc-card:hover { transform: translate(-3px,-3px) rotate(-.3deg); box-shadow: 9px 9px 0 #0B0B0F; }

.kc-card-tilt { transition: transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s ease; will-change: transform; }
.kc-card-tilt:hover { transform: rotate(0deg) translateY(-8px) scale(1.04) !important; box-shadow: 10px 10px 0 #0B0B0F; z-index: 5; animation-play-state: paused; }

.kc-float-a { animation: kc-float-a 6s ease-in-out infinite; }
.kc-float-b { animation: kc-float-b 5.5s ease-in-out infinite .3s; }
.kc-float-c { animation: kc-float-c 7s ease-in-out infinite .6s; }

.kc-sticker { animation: kc-pulse 3.5s ease-in-out infinite; cursor: pointer; }
.kc-sticker:hover { animation: kc-spin-slow 1.6s ease-in-out forwards; }

.kc-headline-sticker { display: inline-block; animation: kc-wiggle 5s ease-in-out infinite; transform-origin: center; }
.kc-headline-sticker:hover { animation: kc-spin-slow 1.4s ease-in-out forwards; }

.kc-avatar-stack > div { animation: kc-avatar-pop 2.2s ease-in-out infinite; transition: transform .2s ease; }
.kc-avatar-stack > div:nth-child(2) { animation-delay: .15s; }
.kc-avatar-stack > div:nth-child(3) { animation-delay: .3s; }
.kc-avatar-stack > div:nth-child(4) { animation-delay: .45s; }
.kc-avatar-stack > div:hover { transform: translateY(-6px) scale(1.15); z-index: 10; }

.kc-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease, background .15s ease, filter .15s ease; position: relative; overflow: hidden; }
.kc-btn:hover { transform: translate(-3px,-3px) scale(1.02); box-shadow: 7px 7px 0 var(--kc-shadow, #FF5722); filter: brightness(1.05); }
.kc-btn:active { transform: translate(2px,2px) scale(.98); box-shadow: 1px 1px 0 var(--kc-shadow, #FF5722); }
.kc-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%); background-size: 200% 100%; background-position: 200% 0; transition: background-position .6s ease; pointer-events: none; }
.kc-btn:hover::after { background-position: -200% 0; }

.kc-nav-link { position: relative; transition: color .15s ease; }
.kc-nav-link::after { content: ''; position: absolute; left: 0; bottom: -6px; width: 0; height: 3px; background: #FF5722; transition: width .25s ease; }
.kc-nav-link:hover::after { width: 100%; }

.kc-faq { transition: transform .2s ease, box-shadow .2s ease; }
.kc-faq:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 #0B0B0F; }

.kc-trust-track { display: flex; gap: 36px; align-items: center; animation: kc-marquee 28s linear infinite; }
.kc-trust-track:hover { animation-play-state: paused; }

.kc-price-card { transition: transform .25s ease, box-shadow .25s ease; }
.kc-price-card:hover { transform: translateY(-6px); box-shadow: 10px 10px 0 #0B0B0F; }
.kc-price-card.kc-price-accent:hover { transform: translateY(-18px); box-shadow: 12px 12px 0 #0B0B0F; }

.kc-stage-pad { padding: 72px 64px 80px; }
.kc-section-pad { padding: 80px 64px; }
.kc-trust-pad { padding: 24px 64px; }
.kc-foot-pad { padding: 56px 64px 28px; }

.kc-hero-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 48px; align-items: center; max-width: 1440px; margin: 0 auto; }
.kc-h1 { font-size: 76px; line-height: .98; letter-spacing: -2.6px; }
.kc-h2 { font-size: 48px; }
.kc-cta-h2 { font-size: 64px; }
.kc-features-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; grid-template-rows: auto auto; gap: 16px; }
.kc-trust-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 1440px; margin: 0 auto; }
.kc-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.kc-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 1100px; margin: 0 auto; }
.kc-faq-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 60px; max-width: 1440px; margin: 0 auto; }
.kc-foot-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 40px; }

@media (max-width: 1024px) {
  .kc-stage-pad { padding: 56px 32px 64px; }
  .kc-section-pad { padding: 64px 32px; }
  .kc-trust-pad { padding: 18px 32px; }
  .kc-foot-pad { padding: 48px 32px 24px; }
  .kc-hero-grid { grid-template-columns: 1fr; gap: 32px; }
  .kc-h1 { font-size: 56px; letter-spacing: -1.8px; }
  .kc-h2 { font-size: 36px; letter-spacing: -1px; }
  .kc-cta-h2 { font-size: 44px; letter-spacing: -1.4px; }
  .kc-features-grid { grid-template-columns: 1fr 1fr; }
  .kc-features-grid > :first-child { grid-row: span 1; grid-column: span 2; }
  .kc-trust-grid { grid-template-columns: 1fr; gap: 36px; }
  .kc-faq-grid { grid-template-columns: 1fr; gap: 28px; }
  .kc-foot-grid { grid-template-columns: 1fr 1fr 1fr; }
  .kc-foot-grid > :first-child { grid-column: span 3; }
}

@media (max-width: 720px) {
  .kc-stage-pad { padding: 40px 18px 48px; }
  .kc-section-pad { padding: 48px 18px; }
  .kc-trust-pad { padding: 14px 18px; }
  .kc-foot-pad { padding: 36px 18px 20px; }
  .kc-h1 { font-size: 40px; letter-spacing: -1.4px; }
  .kc-h2 { font-size: 28px; letter-spacing: -.6px; }
  .kc-cta-h2 { font-size: 32px; letter-spacing: -1px; }
  .kc-features-grid, .kc-three-col, .kc-pricing-grid { grid-template-columns: 1fr; }
  .kc-features-grid > :first-child { grid-column: span 1; }
  .kc-foot-grid { grid-template-columns: 1fr 1fr; }
  .kc-foot-grid > :first-child { grid-column: span 2; }
  .kc-hero-cluster { display: none; }
  .kc-nav-links { display: none; }
  .kc-nav { padding: 14px 18px; }
  .kc-section-head { flex-direction: column; align-items: flex-start; }
  .kc-foot-row { flex-direction: column; gap: 6px; }
  .kc-price-card.kc-price-accent { transform: none; }
  .kc-trust-strip-static { display: none; }
  .kc-trust-strip-marquee { display: block; }
}

.kc-trust-strip-marquee { display: none; overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  .kc-float-a, .kc-float-b, .kc-float-c, .kc-sticker, .kc-trust-track, .kc-fade-up { animation: none !important; }
}
`

// ── Primitives ─────────────────────────────────────────────────────────────
function Logo({ size = 28, color = KC.ink, mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 8, background: mark,
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `3px 3px 0 ${color}`, transform: 'rotate(-4deg)',
            }}>
                <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
                    <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.68, letterSpacing: -0.6, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

function BrutalButton({ children, variant = 'primary', size = 'md', icon, full, onClick, style = {} }) {
    const sizes = {
        sm: { padding: '8px 14px', fontSize: 13 },
        md: { padding: '12px 20px', fontSize: 15 },
        lg: { padding: '16px 28px', fontSize: 17 },
    }[size]
    const variants = {
        primary: { bg: KC.ink, fg: '#fff', border: KC.ink, shadow: KC.orange },
        secondary: { bg: KC.paper, fg: KC.ink, border: KC.ink, shadow: KC.ink },
        accent: { bg: KC.orange, fg: '#fff', border: KC.ink, shadow: KC.ink },
        ghost: { bg: 'transparent', fg: KC.ink, border: 'transparent', shadow: 'transparent' },
    }[variant]
    return (
        <button onClick={onClick} className={variant === 'ghost' ? '' : 'kc-btn'} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: sizes.padding, fontSize: sizes.fontSize, fontWeight: 800,
            background: variants.bg, color: variants.fg,
            border: `2px solid ${variants.border}`,
            boxShadow: variant === 'ghost' ? 'none' : `4px 4px 0 ${variants.shadow}`,
            borderRadius: 10, cursor: 'pointer', letterSpacing: -0.2,
            fontFamily: FONT, width: full ? '100%' : 'auto',
            '--kc-shadow': variants.shadow, ...style,
        }}>
            {children}
            {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
        </button>
    )
}

function Tag({ children, color = KC.yellow, ink = KC.ink, size = 'md', icon }) {
    const pad = size === 'sm' ? '3px 8px' : '5px 10px'
    const fs = size === 'sm' ? 10 : 12
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
            fontSize: fs, fontWeight: 800, background: color, color: ink,
            border: `1.5px solid ${ink}`, borderRadius: 999,
            letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: FONT,
        }}>
            {icon}{children}
        </span>
    )
}

function BrutalCard({ children, color = '#fff', shadow = KC.ink, padding = 20, style = {}, className = 'kc-card' }) {
    return (
        <div className={className} style={{
            background: color, border: `2px solid ${KC.ink}`,
            borderRadius: 14, padding, boxShadow: `4px 4px 0 ${shadow}`, ...style,
        }}>{children}</div>
    )
}

function Section({ children, bg = '#fff', style = {}, id, className = '' }) {
    return (
        <section id={id} className={`kc-section-pad kc-reveal ${className}`} style={{ background: bg, borderTop: `2px solid ${KC.ink}`, ...style }}>
            {children}
        </section>
    )
}

const I = {
    Arrow: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    Sparkle: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2 5.2 1.8-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" fill={c} /></svg>
    ),
    Building: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" stroke={c} strokeWidth="2" /><path d="M9 8h2M9 12h2M9 16h2M14 8h2M14 12h2M14 16h2" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>
    ),
    Check: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-12" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    Cash: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke={c} strokeWidth="2" /><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" /></svg>
    ),
    Clock: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" /><path d="M12 7v5l3 2" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>
    ),
    Star: ({ s = 18, c = 'currentColor', f = 'none' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={f}><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 21l1.2-6.5L2.5 9.9 9.1 9 12 3z" stroke={c} strokeWidth="2" strokeLinejoin="round" /></svg>
    ),
    User: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="2" /><path d="M4 21a8 8 0 0116 0" stroke={c} strokeWidth="2" /></svg>
    ),
    Bolt: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 10-13h-7l1-7z" fill={c} /></svg>
    ),
    ChartBar: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke={c} strokeWidth="2.2" strokeLinecap="round" /></svg>
    ),
    Robot: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="13" rx="2" stroke={c} strokeWidth="2" /><circle cx="9" cy="13" r="1.5" fill={c} /><circle cx="15" cy="13" r="1.5" fill={c} /><path d="M12 3v4M8 17h8" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>
    ),
    Briefcase: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke={c} strokeWidth="2" /><path d="M3 12h18" stroke={c} strokeWidth="2" /></svg>
    ),
    Shield: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" stroke={c} strokeWidth="2" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    Lock: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="10" rx="2" stroke={c} strokeWidth="2" /><path d="M8 11V8a4 4 0 018 0v3" stroke={c} strokeWidth="2" /></svg>
    ),
    Plus: ({ s = 18, c = 'currentColor' }) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.6" strokeLinecap="round" /></svg>
    ),
}

function ScoreDonut({ value = 87, size = 56, color = KC.orange, label = 'match', textColor = KC.ink }) {
    const r = (size - 8) / 2
    const c = 2 * Math.PI * r
    const off = c - (value / 100) * c
    return (
        <div style={{ position: 'relative', width: size, height: size, fontFamily: FONT }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke={KC.ash} strokeWidth="6" fill="none" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="6" fill="none"
                    strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: size * 0.32, color: textColor }}>{value}<span style={{ fontSize: size * 0.18 }}>%</span></div>
                    {label && <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: textColor, opacity: 0.7, marginTop: 1 }}>{label}</div>}
                </div>
            </div>
        </div>
    )
}

// ── NavBar ────────────────────────────────────────────────────────────────
const NAV_OFFSET = 90 // sticky nav height + breathing room

function scrollToSection(id) {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
    window.scrollTo({ top: y, behavior: 'smooth' })
}

function NavBar({ onMasuk, onDaftar, onAbout }) {
    const click = (id) => (e) => { e.preventDefault(); scrollToSection(id) }
    return (
        <nav className="kc-nav" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 64px', background: '#fff',
            borderBottom: `2px solid ${KC.ink}`, fontFamily: FONT,
            position: 'sticky', top: 0, zIndex: 50,
        }}>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ textDecoration: 'none' }}>
                <Logo size={32} />
            </a>
            <div className="kc-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 700 }}>
                <a className="kc-nav-link" href="#how" onClick={click('how')} style={{ color: KC.ink, textDecoration: 'none', cursor: 'pointer' }}>Cara Kerja</a>
                <a className="kc-nav-link" href="#fitur" onClick={click('fitur')} style={{ color: KC.ink, textDecoration: 'none', cursor: 'pointer' }}>Fitur</a>
                <a className="kc-nav-link" href="#harga" onClick={click('harga')} style={{ color: KC.ink, textDecoration: 'none', cursor: 'pointer' }}>Harga Employer</a>
                <a className="kc-nav-link" href="#tentang" onClick={(e) => { e.preventDefault(); onAbout() }} style={{ color: KC.ink, textDecoration: 'none', cursor: 'pointer' }}>Tentang</a>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <BrutalButton variant="secondary" size="sm" onClick={onMasuk}>Masuk</BrutalButton>
                <BrutalButton variant="primary" size="sm" icon={<I.Arrow s={14} c="#fff" />} onClick={onDaftar}>Daftar Gratis</BrutalButton>
            </div>
        </nav>
    )
}

// ════════════════════════════════════════════════════════════════════════════
export default function LandingHero() {
    const { openAuthModal, navigate } = useStore()
    const [howTab, setHowTab] = useState('seeker')
    const [faqOpen, setFaqOpen] = useState(0)

    // Scroll-triggered reveal for all .kc-reveal sections
    useEffect(() => {
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
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
        els.forEach(el => io.observe(el))
        return () => io.disconnect()
    }, [])

    const onMasuk = () => openAuthModal('login')
    const onDaftar = () => openAuthModal('register', 'seeker')
    const onEmployer = () => openAuthModal('register', 'employer')
    const onAbout = () => navigate('about')
    const onContactSales = () => { window.location.href = 'mailto:sales@kerjacerdas.id?subject=Hubungi%20Sales%20-%20KerjaCerdas%20Scale' }
    const PRICING_ACTIONS = {
        Starter: onEmployer,        // free employer register
        Growth: onEmployer,        // 14-day trial signup
        Scale: onContactSales,    // enterprise sales contact
    }

    const HOW_SEEKER = [
        { n: '01', t: 'Upload CV atau isi profil', d: 'Drop PDF, CV diparse otomatis oleh AI. Atau isi webform pendek — 3 menit selesai.', c: KC.cyan, ic: <I.User s={22} /> },
        { n: '02', t: 'AI cari yang cocok', d: 'Embedding semantik bandingin profilmu dengan ribuan lowongan. Output: top-5 paling pas.', c: KC.yellow, ic: <I.Sparkle s={22} /> },
        { n: '03', t: 'Tutup gap, lamar, kerja', d: 'Skill gap advisor kasih kursus Prakerja/Dicoding/Coursera. Apply 1-klik.', c: KC.lime, ic: <I.Bolt s={22} /> },
    ]
    const HOW_EMPLOYER = [
        { n: '01', t: 'Pasang lowongan', d: 'Tulis JD singkat. AI bantu nyaranin skill, level, dan estimasi gaji wajar.', c: KC.cyan, ic: <I.Briefcase s={22} /> },
        { n: '02', t: 'Top-5 kandidat otomatis', d: 'Reverse matching: tiap posting tampil top-5 kandidat semantik.', c: KC.yellow, ic: <I.Sparkle s={22} /> },
        { n: '03', t: 'Screening 80% lebih cepat', d: 'Skill heatmap, kandidat verified, langsung kontak via email/chat.', c: KC.lime, ic: <I.Bolt s={22} /> },
    ]
    const howData = howTab === 'seeker' ? HOW_SEEKER : HOW_EMPLOYER

    const FAQS = [
        { q: 'Beneran gratis buat job seeker?', a: 'Iya. Semua fitur — matching, skill gap, advisor, verifikasi — gratis selamanya. Kami profit dari sisi employer.' },
        { q: 'Data KTP dan ijazah saya aman?', a: 'Disimpan terenkripsi AES-256, server di Indonesia, hanya dipakai sekali untuk verifikasi. Setelahnya cuma kelihatan badge ✓ Verified.' },
        { q: 'Bagaimana AI menentukan match?', a: 'AI semantic search membandingkan semantik profil & job description, lalu rerank otomatis pakai skill, lokasi, gaji, dan industri.' },
        { q: 'Bisa cancel langganan kapan aja?', a: 'Bisa. Tier Growth & Scale: monthly, cancel anytime, no pertanyaan. Sisa hari aktif sampai akhir periode.' },
    ]

    return (
        <div style={{ background: KC.bone, fontFamily: FONT, color: KC.ink, minHeight: '100vh' }}>
            <style>{KC_CSS}</style>
            <NavBar onMasuk={onMasuk} onDaftar={onDaftar} onAbout={onAbout} />

            {/* ── HERO ── */}
            <section className="kc-stage-pad" style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="kc-hero-grid">
                    <div>
                        <span className="kc-fade-up"><Tag color={KC.yellow} icon={<I.Sparkle s={12} />}>Smart Job Matching · Bahasa Indonesia</Tag></span>
                        <h1 className="kc-h1 kc-fade-up d1" style={{ fontWeight: 900, margin: '20px 0 12px' }}>
                            Kerja yang<br />
                            <span className="kc-headline-sticker" style={{ background: KC.orange, color: '#fff', padding: '0 14px', boxShadow: `6px 6px 0 ${KC.ink}`, border: `3px solid ${KC.ink}`, marginTop: 6, cursor: 'pointer' }}>cocok beneran.</span><br />
                            Bukan asal lempar CV.
                        </h1>
                        <p className="kc-fade-up d2" style={{ fontSize: 18, lineHeight: 1.55, color: KC.mute, maxWidth: 520, margin: '20px 0 28px' }}>
                            Matching semantik 87% akurat dari CV-mu, peta skill gap dengan rekomendasi kursus, dan advisor karier AI 24 jam.
                            Bos juga dapet top-5 kandidat tiap lowongan — tanpa pusing.
                        </p>
                        <div className="kc-fade-up d3" style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                            <BrutalButton variant="primary" size="lg" icon={<I.Arrow s={16} c="#fff" />} onClick={onDaftar}>Cari Kerja Sekarang</BrutalButton>
                            <BrutalButton variant="secondary" size="lg" icon={<I.Building s={16} />} onClick={onEmployer}>Saya HR / Employer</BrutalButton>
                        </div>
                        <div className="kc-fade-up d4" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 700, color: KC.mute }}>
                            <div className="kc-avatar-stack" style={{ display: 'flex' }}>
                                {[KC.cyan, KC.lime, KC.pink, KC.yellow].map((c, i) => (
                                    <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `2px solid ${KC.ink}`, marginLeft: i ? -10 : 0, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900 }}>
                                        {['R', 'A', 'D', 'M'][i]}
                                    </div>
                                ))}
                            </div>
                            <span><b style={{ color: KC.ink }}>12.480+</b> pejuang kerja udah dapet match minggu ini</span>
                        </div>
                    </div>

                    {/* Hero card cluster */}
                    <div className="kc-hero-cluster" style={{ position: 'relative', height: 520 }}>
                        <BrutalCard className="kc-card-tilt kc-float-a" color="#fff" padding={20} style={{ position: 'absolute', top: 28, right: 24, width: 360, transform: 'rotate(2deg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <ScoreDonut value={92} size={60} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: KC.mute, textTransform: 'uppercase' }}>Best match</div>
                                    <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>Senior Backend Engineer</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: KC.mute, marginTop: 2 }}>Tokopedia · Jakarta · Hybrid</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                                <Tag color={KC.lime} size="sm">Go</Tag>
                                <Tag color={KC.lime} size="sm">PostgreSQL</Tag>
                                <Tag color={KC.lime} size="sm">gRPC</Tag>
                                <Tag color={KC.orangeSoft} size="sm">+2 to learn</Tag>
                            </div>
                            <div style={{ marginTop: 14, padding: '10px 12px', background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: KC.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <I.Cash s={14} /> Rp 28-42 jt/bulan · 4-7 thn exp
                            </div>
                        </BrutalCard>

                        <BrutalCard className="kc-card-tilt kc-float-b" color={KC.cyan} padding={16} style={{ position: 'absolute', top: 260, right: 200, width: 260, transform: 'rotate(-3deg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                                    <I.Check s={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 900 }}>CV_RinaP.pdf</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: KC.ink, opacity: 0.7 }}>Parsed · 14 skills extracted</div>
                                </div>
                            </div>
                        </BrutalCard>

                        <BrutalCard className="kc-card-tilt kc-float-c" color={KC.yellow} padding={16} style={{ position: 'absolute', top: 380, right: 60, width: 280, transform: 'rotate(1deg)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Skill gap → kursus</div>
                            <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4, lineHeight: 1.2 }}>"Kafka untuk Backend" · Dicoding</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, fontWeight: 700 }}>
                                <I.Clock s={12} /> 12 jam <span>·</span> <I.Star s={12} f={KC.ink} /> 4.8
                            </div>
                        </BrutalCard>

                        <div className="kc-sticker" style={{ position: 'absolute', top: -8, left: 8, width: 110, height: 110, background: KC.orange, border: `3px solid ${KC.ink}`, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: `5px 5px 0 ${KC.ink}`, transform: 'rotate(-8deg)', color: '#fff', textAlign: 'center', lineHeight: 1, cursor: 'pointer' }}>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 900 }}>87%</div>
                                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Akurasi<br />match</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST STRIP ── */}
            <section className="kc-trust-pad" style={{ borderTop: `2px solid ${KC.ink}`, borderBottom: `2px solid ${KC.ink}`, background: '#fff' }}>
                <div className="kc-trust-strip-static" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC.mute, whiteSpace: 'nowrap' }}>
                        Dipercaya HR di →
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 36, flex: 1, justifyContent: 'space-around', opacity: 0.85 }}>
                        {['Tokopedia', 'GoTo', 'Bukalapak', 'Bibit', 'Xendit', 'Ruangguru', 'Telkomsel'].map(n => (
                            <div key={n} style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, letterSpacing: -0.5, color: KC.ink, transition: 'color .2s, transform .2s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.color = KC.orange; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.color = KC.ink; e.currentTarget.style.transform = 'none' }}>{n}</div>
                        ))}
                    </div>
                </div>
                <div className="kc-trust-strip-marquee">
                    <div className="kc-trust-track">
                        {[...Array(2)].flatMap((_, k) => ['Tokopedia', 'GoTo', 'Bukalapak', 'Bibit', 'Xendit', 'Ruangguru', 'Telkomsel'].map(n => (
                            <div key={`${k}-${n}`} style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: KC.ink, whiteSpace: 'nowrap' }}>{n}</div>
                        )))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <Section id="how" bg={KC.bone}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div className="kc-section-head" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36, gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <Tag color={KC.pink}>cara kerja</Tag>
                            <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Tiga langkah. Beneran.</h2>
                            <p style={{ fontSize: 16, color: KC.mute, maxWidth: 540 }}>Nggak ada form 20 halaman. Upload, dapet match, langsung lamar.</p>
                        </div>
                        <div style={{ display: 'inline-flex', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, padding: 4, boxShadow: `3px 3px 0 ${KC.ink}` }}>
                            {['seeker', 'employer'].map(k => {
                                const active = howTab === k
                                return (
                                    <button key={k} onClick={() => setHowTab(k)} style={{
                                        padding: '8px 16px', fontSize: 13, fontWeight: 800,
                                        background: active ? KC.ink : 'transparent',
                                        color: active ? '#fff' : KC.mute,
                                        borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: FONT,
                                    }}>
                                        {k === 'seeker' ? 'Untuk Job Seeker' : 'Untuk Employer'}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="kc-three-col">
                        {howData.map(s => (
                            <BrutalCard key={s.n} color="#fff" padding={24}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                    <div style={{ width: 44, height: 44, background: s.c, border: `2px solid ${KC.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}>{s.ic}</div>
                                    <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: KC.mute }}>{s.n}</div>
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15 }}>{s.t}</h3>
                                <p style={{ fontSize: 14, color: KC.mute, lineHeight: 1.55, marginTop: 8 }}>{s.d}</p>
                            </BrutalCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── FEATURES BENTO ── */}
            <Section id="fitur" bg="#fff">
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ marginBottom: 36 }}>
                        <Tag color={KC.cyan}>fitur inti</Tag>
                        <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Empat senjata utama.</h2>
                        <p style={{ fontSize: 16, color: KC.mute, maxWidth: 540 }}>Semua berjalan di atas teknologi AI mutakhir. Logging audit-friendly buat compliance.</p>
                    </div>
                    <div className="kc-features-grid">
                        <BrutalCard color={KC.orange} padding={28} style={{ gridRow: 'span 2', color: '#fff', display: 'flex', flexDirection: 'column' }}>
                            <Tag color="#fff" ink={KC.ink}>★ matching engine</Tag>
                            <h3 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 14 }}>Top-5 job match.<br />Bukan top-500 sampah.</h3>
                            <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.92, marginTop: 12, marginBottom: 18 }}>
                                AI Semantic Search + LLM Reranker. Skor dihitung dari skill overlap, level, lokasi, gaji, dan industri.
                                Setiap match dijelasin: <i>kenapa cocok, apa yang kurang</i>.
                            </p>
                            <div style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid #fff', borderRadius: 10, padding: 14, marginTop: 'auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <ScoreDonut value={89} size={48} color="#fff" textColor="#fff" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 900 }}>Product Designer · Bibit</div>
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>"Pengalaman fintech-mu bikin nilai tinggi di UX research."</div>
                                    </div>
                                </div>
                            </div>
                        </BrutalCard>

                        {[
                            { c: KC.lime, ic: <I.ChartBar s={22} />, tag: 'free', t: 'Skill Gap Coach', d: 'Bandingin profilmu vs JD. AI kasih kursus relevan dari Prakerja, Dicoding, Coursera, RevoU.' },
                            { c: KC.cyan, ic: <I.Robot s={22} />, tag: '24/7', t: 'Career Gap Advisor', d: 'Habis gap setahun? AI bantu reframe pengalaman, tulis ulang ringkasan CV, simulasi interview.' },
                            { c: KC.yellow, ic: <I.Briefcase s={22} />, tag: 'HR', t: 'Top-5 Kandidat', d: 'Reverse matching: tiap lowongan tampilin top-5 kandidat semantik. Hemat waktu screening 80%.' },
                            { c: KC.pink, ic: <I.Shield s={22} />, tag: 'trust', t: 'Verifikasi KTP & Ijazah', d: 'Profil terverifikasi dapet badge. Data terenkripsi — nggak akan kelihatan ke user lain.' },
                        ].map((f, i) => (
                            <BrutalCard key={i} color={f.c} padding={22}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ width: 44, height: 44, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}>{f.ic}</div>
                                    <Tag color="#fff" size="sm">{f.tag}</Tag>
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, marginTop: 12 }}>{f.t}</h3>
                                <p style={{ fontSize: 13, color: KC.ink, opacity: 0.78, lineHeight: 1.5, marginTop: 6 }}>{f.d}</p>
                            </BrutalCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── TRUST / PRIVACY ── */}
            <Section bg={KC.ink} style={{ color: '#fff' }}>
                <div className="kc-trust-grid">
                    <div>
                        <Tag color={KC.orange} ink="#fff">trust & privacy</Tag>
                        <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.4, margin: '14px 0 14px', lineHeight: 1.05 }}>
                            Data terenkripsi.<br />Hanya buat verifikasi.
                        </h2>
                        <p style={{ fontSize: 16, color: '#fff', opacity: 0.75, lineHeight: 1.6, maxWidth: 520 }}>
                            KTP, ijazah, dan NPWP <b>nggak pernah</b> ditampilin ke user lain — bahkan HR. Kami pakai cuma sekali buat verifikasi identitas, lalu disimpan terenkripsi AES-256 di server Indonesia.
                            Setelah verifikasi sukses, akunmu dapet badge <span style={{ background: KC.lime, color: KC.ink, padding: '1px 8px', borderRadius: 4, fontWeight: 900, fontSize: 13 }}>✓ VERIFIED</span> — itu doang yang publik.
                        </p>
                        <div style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 13, fontWeight: 700, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.Check s={16} c={KC.lime} /> AES-256 at rest</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.Check s={16} c={KC.lime} /> Server di Indonesia</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.Check s={16} c={KC.lime} /> UU PDP compliant</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                            { who: 'Job Seeker', what: 'KTP + Ijazah', icon: <I.User s={22} c="#fff" />, c: KC.orange },
                            { who: 'Employer', what: 'NPWP + Akta', icon: <I.Building s={22} c="#fff" />, c: KC.cyan },
                        ].map((b, i) => (
                            <div key={i} style={{ background: '#1a1a20', border: '2px solid #fff', borderRadius: 12, padding: 18 }}>
                                <div style={{ width: 44, height: 44, background: b.c, border: '2px solid #fff', borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 12 }}>{b.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.6 }}>{b.who}</div>
                                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{b.what}</div>
                                <div style={{ fontSize: 11, fontFamily: MONO, marginTop: 10, padding: '6px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: 6, color: KC.lime }}>
                                    status: encrypted
                                </div>
                            </div>
                        ))}
                        <BrutalCard color={KC.bone} shadow="#fff" padding={18} style={{ gridColumn: 'span 2', color: KC.ink }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <I.Lock s={28} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900 }}>Kamu pegang kontrol penuh</div>
                                    <div style={{ fontSize: 12, color: KC.mute, marginTop: 2 }}>Hapus dokumen kapan aja dari Settings → Privasi. Audit log tersedia.</div>
                                </div>
                            </div>
                        </BrutalCard>
                    </div>
                </div>
            </Section>

            {/* ── PRICING ── */}
            <Section id="harga" bg="#fff">
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <Tag color={KC.yellow}>harga untuk employer</Tag>
                        <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 6px' }}>Job seeker selalu gratis.<br />Bos bayar sesuai kebutuhan.</h2>
                    </div>
                    <div className="kc-pricing-grid">
                        {[
                            { name: 'Starter', price: '0', sub: 'forever', cta: 'Mulai Gratis', highlight: false, color: '#fff', perks: ['1 lowongan aktif', 'Top-3 kandidat per posting', 'Email applicants', 'Verifikasi NPWP'] },
                            { name: 'Growth', price: '399rb', sub: '/bulan', cta: 'Coba 14 Hari', highlight: true, color: KC.orange, perks: ['10 lowongan aktif', 'Top-10 kandidat per posting', 'Analytics dashboard', 'Skill heatmap kandidat', 'Priority support'] },
                            { name: 'Scale', price: '3jt', sub: '/bulan', cta: 'Hubungi Sales', highlight: false, color: KC.ink, perks: ['Unlimited lowongan', 'Top-50 kandidat + bulk export', 'ATS integration (Greenhouse, Lever)', 'API access', 'Custom branding', 'Dedicated CSM'] },
                        ].map((p, i) => {
                            const dark = p.color === KC.ink
                            const accent = p.highlight
                            return (
                                <div key={i} className={`kc-price-card${accent ? ' kc-price-accent' : ''}`} style={{
                                    background: p.color, color: dark || accent ? '#fff' : KC.ink,
                                    border: `2px solid ${KC.ink}`, borderRadius: 16, padding: 28,
                                    boxShadow: accent ? `8px 8px 0 ${KC.ink}` : `4px 4px 0 ${KC.ink}`,
                                    transform: accent ? 'translateY(-12px)' : 'none', position: 'relative',
                                }}>
                                    {accent && <div style={{ position: 'absolute', top: -16, right: 20, background: KC.yellow, border: `2px solid ${KC.ink}`, padding: '4px 10px', fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', borderRadius: 999, color: KC.ink, transform: 'rotate(4deg)', boxShadow: `2px 2px 0 ${KC.ink}` }}>paling laku</div>}
                                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>{p.name}</div>
                                    <div style={{ marginTop: 8, marginBottom: 18 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>Rp</span>
                                        <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{p.price}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginLeft: 4 }}>{p.sub}</span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {p.perks.map((perk, j) => (
                                            <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
                                                <I.Check s={14} c={dark || accent ? '#fff' : KC.ink} /> {perk}
                                            </li>
                                        ))}
                                    </ul>
                                    <BrutalButton variant={dark ? 'accent' : (accent ? 'secondary' : 'primary')} size="md" full onClick={PRICING_ACTIONS[p.name] || onEmployer}>{p.cta}</BrutalButton>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Section>

            {/* ── TESTIMONIALS ── */}
            <Section bg={KC.bone}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ marginBottom: 36 }}>
                        <Tag color={KC.lime}>cerita beneran</Tag>
                        <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Dari pejuang kerja & bos beneran.</h2>
                    </div>
                    <div className="kc-three-col" style={{ gap: 18 }}>
                        {[
                            { q: 'Dulu apply 80 lowongan, dipanggil 1. Pake KerjaCerdas: 5 apply, 3 interview, 1 offer.', who: 'Rina Pertiwi', role: 'UX Researcher @ Bibit', c: KC.cyan },
                            { q: 'Hiring frontend dapet 200 lamaran. Top-5 dari sini langsung 2 yang lolos final round. Gila.', who: 'Andika Pratama', role: 'Eng. Manager @ Xendit', c: KC.yellow },
                            { q: 'Career gap 2 tahun jaga anak. Advisor AI bantu reframe — dapet kerja remote 6 minggu.', who: 'Sari Ningrum', role: 'Project Manager @ remote', c: KC.pink },
                        ].map((t, i) => (
                            <BrutalCard key={i} color={t.c} padding={24}>
                                <I.Star s={20} f={KC.ink} />
                                <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, margin: '12px 0 18px', letterSpacing: -0.3 }}>"{t.q}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: `2px solid ${KC.ink}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13 }}>{t.who[0]}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 900 }}>{t.who}</div>
                                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{t.role}</div>
                                    </div>
                                </div>
                            </BrutalCard>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ── FAQ ── */}
            <Section bg="#fff">
                <div className="kc-faq-grid">
                    <div>
                        <Tag color={KC.orange} ink="#fff">FAQ</Tag>
                        <h2 className="kc-h2" style={{ fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 12px', lineHeight: 1.05 }}>Pertanyaan yang sering ditanya.</h2>
                        <p style={{ fontSize: 15, color: KC.mute, lineHeight: 1.6 }}>Belum nemu jawabnya? Tanya advisor AI kami — gratis, 24/7.</p>
                        <BrutalButton variant="primary" size="md" style={{ marginTop: 18 }} icon={<I.Arrow s={14} c="#fff" />} onClick={onDaftar}>Tanya Advisor</BrutalButton>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FAQS.map((f, i) => {
                            const open = faqOpen === i
                            return (
                                <div key={i} className="kc-faq" style={{ background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 12, padding: 18, boxShadow: open ? `4px 4px 0 ${KC.ink}` : 'none' }}>
                                    <div onClick={() => setFaqOpen(open ? -1 : i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{f.q}</div>
                                        <span style={{ display: 'inline-flex', transition: 'transform .25s ease', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}><I.Plus s={18} /></span>
                                    </div>
                                    <div style={{ overflow: 'hidden', maxHeight: open ? 200 : 0, transition: 'max-height .3s ease, margin-top .3s ease', marginTop: open ? 8 : 0 }}>
                                        <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.6, margin: 0 }}>{f.a}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Section>

            {/* ── BIG CTA ── */}
            <Section bg={KC.orange} style={{ color: '#fff', textAlign: 'center' }}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <h2 className="kc-cta-h2" style={{ fontWeight: 900, letterSpacing: -2, margin: 0, lineHeight: 0.98 }}>Udah cukup nge-spam lamaran.</h2>
                    <p style={{ fontSize: 20, opacity: 0.92, marginTop: 16, marginBottom: 32 }}>Daftar dalam 2 menit. CV-mu langsung di-parse, top-5 match keluar dalam 8 detik.</p>
                    <div style={{ display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <BrutalButton variant="secondary" size="lg" icon={<I.Arrow s={16} />} style={{ boxShadow: `6px 6px 0 ${KC.ink}` }} onClick={onDaftar}>Daftar Gratis</BrutalButton>
                        <BrutalButton variant="primary" size="lg" style={{ background: KC.ink, boxShadow: `6px 6px 0 ${KC.yellow}` }} onClick={onEmployer}>Demo untuk HR →</BrutalButton>
                    </div>
                </div>
            </Section>

            {/* ── FOOTER ── */}
            <footer className="kc-foot-pad" style={{ background: KC.ink, color: '#fff' }}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div className="kc-foot-grid">
                        <div>
                            <Logo size={28} color="#fff" mark={KC.orange} />
                            <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6, marginTop: 14, maxWidth: 280 }}>
                                Platform AI matching kerja untuk pasar Indonesia. Menghubungkan talenta lokal dengan peluang karir terbaik secara cerdas.
                            </p>
                        </div>
                        {[
                            { t: 'Produk', items: ['Cara Kerja', 'Fitur', 'Verifikasi', 'Harga'] },
                            { t: 'Untuk', items: ['Job Seeker', 'Employer / HR', 'Kampus & Lembaga', 'Partner Kursus'] },
                            { t: 'Perusahaan', items: ['Tentang Kami', 'Karier', 'Blog', 'Kontak'] },
                            { t: 'Legal', items: ['Privasi', 'Syarat', 'UU PDP', 'Status'] },
                        ].map(col => (
                            <div key={col.t}>
                                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.5, marginBottom: 12 }}>{col.t}</div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {col.items.map(it => {
                                        const handlers = {
                                            'Cara Kerja': () => scrollToSection('how'),
                                            'Fitur': () => scrollToSection('fitur'),
                                            'Verifikasi': () => scrollToSection('fitur'),
                                            'Harga': () => navigate('pricing'),
                                            'Job Seeker': onDaftar,
                                            'Employer / HR': onEmployer,
                                            'Kampus & Lembaga': onContactSales,
                                            'Partner Kursus': onContactSales,
                                            'Tentang Kami': () => navigate('about'),
                                            'Karier': onContactSales,
                                            'Blog': () => navigate('about'),
                                            'Kontak': onContactSales,
                                            'Privasi': () => navigate('privacy'),
                                            'Syarat': () => navigate('privacy'),
                                            'UU PDP': () => navigate('privacy'),
                                            'Status': () => window.open('https://status.kerjacerdas.id', '_blank'),
                                        }
                                        const handler = handlers[it] || (() => { })
                                        return (
                                            <li key={it} style={{ fontSize: 13, fontWeight: 600 }}>
                                                <a onClick={handler} className="kc-foot-link" style={{ color: '#fff', opacity: 0.7, textDecoration: 'none', cursor: 'pointer', transition: 'opacity .15s, color .15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = KC.orange }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = '#fff' }}>{it}</a>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="kc-foot-row" style={{ borderTop: '1px solid rgba(255,255,255,0.13)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.6, flexWrap: 'wrap', gap: 12 }}>
                        <span>© 2026 KerjaCerdas Indonesia</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
