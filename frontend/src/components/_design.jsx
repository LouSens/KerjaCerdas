// Shared design primitives for KerjaCerdas — refined neo-brutal.
// Ported from design canvas (kerjacerdas/project/components.jsx).
import { useEffect } from 'react'

export const KC = {
    ink: '#0B0B0F', bone: '#FAF8F2', paper: '#FFFFFF', surface: '#F4F1EA',
    orange: '#FF5722', orangeDeep: '#E54219', orangeSoft: '#FFE0D4',
    yellow: '#FFCB05', cyan: '#7AE7F0', pink: '#FFB7D5', lime: '#C8F26B',
    rose: '#FF6F61', mint: '#9BE6C2', mute: '#6B6760', ash: '#E5E0D6',
}

export function BrutalCard({ children, color = '#fff', shadow = KC.ink, padding = 20, className = '', style = {} }) {
    return (
        <div className={`kc-card ${className}`} style={{
            background: color, border: `2px solid ${KC.ink}`, borderRadius: 14,
            padding, boxShadow: `4px 4px 0 ${shadow}`, ...style,
        }}>{children}</div>
    )
}

export function Tag({ children, color = KC.yellow, ink = KC.ink, size = 'md', icon, style = {} }) {
    const pad = size === 'sm' ? '3px 8px' : '5px 10px'
    const fs = size === 'sm' ? 10 : 12
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: pad, fontSize: fs, fontWeight: 800,
            background: color, color: ink, border: `1.5px solid ${ink}`,
            borderRadius: 999, letterSpacing: 0.4, textTransform: 'uppercase',
            ...style,
        }}>{icon}{children}</span>
    )
}

export function ScoreDonut({ value = 87, size = 56, color = KC.orange, label = 'match' }) {
    const r = (size - 8) / 2
    const c = 2 * Math.PI * r
    const off = c - (Math.max(0, Math.min(100, value)) / 100) * c
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke={KC.ash} strokeWidth="6" fill="none" />
                <circle className="kc-donut-ring" cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="6" fill="none"
                    strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: size * 0.32, color: KC.ink }}>
                        {Math.round(value)}<span style={{ fontSize: size * 0.18 }}>%</span>
                    </div>
                    {label && <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginTop: 1 }}>{label}</div>}
                </div>
            </div>
        </div>
    )
}

export function RankSticker({ rank }) {
    return (
        <div style={{
            position: 'absolute', top: -10, left: -10, width: 36, height: 36,
            background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`,
            borderRadius: 10, display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 14, transform: 'rotate(-4deg)',
            boxShadow: `2px 2px 0 ${KC.orange}`,
        }}>#{rank}</div>
    )
}

export function FilledStat({ label, value, sub, color = KC.cyan, dark = false, onClick }) {
    return (
        <BrutalCard color={color} padding={18} className="kc-stat"
            style={{ color: dark ? '#fff' : KC.ink, cursor: onClick ? 'pointer' : 'default' }}>
            <div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
                onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick() }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.8 }}>{label}</div>
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1, margin: '6px 0 6px' }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{sub}</div>
            </div>
        </BrutalCard>
    )
}

/**
 * Inject the dashboard CSS once. Mount in any view that uses `kc-*` classes.
 * Cheaper than 12 inline @keyframes blocks and gives us :hover / media-query
 * power that inline styles can't.
 */
let _stylesMounted = false
export function DesignStyles() {
    useEffect(() => {
        if (_stylesMounted) return
        _stylesMounted = true
        const el = document.createElement('style')
        el.id = 'kc-design-styles'
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])
    return null
}

const CSS = `
@keyframes kc-fade-up { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes kc-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes kc-pop { 0% { transform: scale(.92) } 60% { transform: scale(1.04) } 100% { transform: scale(1) } }
@keyframes kc-spin { to { transform: rotate(360deg) } }
@keyframes kc-blink { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
@keyframes kc-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
@keyframes kc-pulse-shadow { 0%,100% { box-shadow: 4px 4px 0 #0B0B0F } 50% { box-shadow: 6px 6px 0 #FF5722 } }
@keyframes kc-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }

/* Entrance stagger for dashboard grids — uses fill-mode:both so the keyframe
   start (opacity:0) only applies while the animation is queued/running. Once
   it ends, the element falls back to its natural opacity:1, so hover-state
   animation overrides can't strand the element invisible. */
.kc-stagger > * { animation: kc-fade-up .55s cubic-bezier(.22,.61,.36,1) both; }
.kc-stagger > *:nth-child(1) { animation-delay: 0s }
.kc-stagger > *:nth-child(2) { animation-delay: .06s }
.kc-stagger > *:nth-child(3) { animation-delay: .12s }
.kc-stagger > *:nth-child(4) { animation-delay: .18s }
.kc-stagger > *:nth-child(5) { animation-delay: .24s }
.kc-stagger > *:nth-child(6) { animation-delay: .3s }
.kc-stagger > *:nth-child(7) { animation-delay: .36s }
.kc-stagger > *:nth-child(8) { animation-delay: .42s }

/* Card hover lift */
.kc-card { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease; }
.kc-card:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #0B0B0F; }

/* Button micro-interactions */
.kc-btn { transition: transform .12s cubic-bezier(.34,1.56,.64,1), box-shadow .12s ease, filter .12s ease; position: relative; overflow: hidden; }
.kc-btn:hover { transform: translate(-2px,-2px); filter: brightness(1.05); }
.kc-btn:hover { box-shadow: 4px 4px 0 #0B0B0F; }
.kc-btn:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 #0B0B0F; }
.kc-btn::after { content:''; position:absolute; inset:0; background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.3) 50%, transparent 70%); background-size: 200% 100%; background-position: 200% 0; transition: background-position .55s ease; pointer-events: none; }
.kc-btn:hover::after { background-position: -200% 0 }

/* Sidebar nav item active accent slide */
.kc-nav-active { animation: kc-pop .25s ease-out }

/* Stat cards — slight grow + accent shadow on hover (transition, NOT animation,
   so it never collides with the entrance keyframes). */
.kc-stat { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease; }
.kc-stat:hover { transform: translate(-3px,-3px); box-shadow: 7px 7px 0 #FF5722; }

/* Score donut: animate the dasharray on mount */
.kc-donut-ring { transition: stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1); }

/* Skeleton shimmer */
.kc-shim { background: linear-gradient(110deg, #E5E0D6 30%, #FAF8F2 50%, #E5E0D6 70%); background-size: 200% 100%; animation: kc-shimmer 1.6s linear infinite; border: 1.5px solid #0B0B0F }

/* Skeleton dot/spinner */
.kc-spin { width: 22px; height: 22px; border: 3px solid #0B0B0F; border-top-color: transparent; border-radius: 50%; animation: kc-spin .9s linear infinite; }

/* Live "ping" indicator */
.kc-ping { width: 8px; height: 8px; border-radius: 50%; background: #0B0B0F; animation: kc-blink 1s infinite; }

/* Progress bar grow-in */
.kc-progress > span { display:block; height:100%; transform-origin: left; animation: kc-grow .8s cubic-bezier(.22,.61,.36,1) both; }

/* Heatmap bars rise-in */
.kc-bar { transform-origin: bottom; animation: kc-grow .5s cubic-bezier(.22,.61,.36,1) both; transform: scaleY(0); }
.kc-bar { animation-name: kc-bar-rise }
@keyframes kc-bar-rise { from { transform: scaleY(0) } to { transform: scaleY(1) } }

/* Responsive grid helpers used by dashboards */
.kc-grid-4 { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
.kc-grid-main { display:grid; grid-template-columns: minmax(0,1fr) 360px; gap: 20px; }
@media (max-width: 1100px) {
  .kc-grid-4 { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .kc-grid-main { grid-template-columns: minmax(0,1fr); }
}
@media (max-width: 640px) {
  .kc-grid-4 { grid-template-columns: 1fr; }
  .kc-h1 { font-size: 22px !important; }
  .kc-topbar { flex-direction: column; align-items: flex-start !important; gap: 12px; }
}
.kc-h1 { font-size: 30px; font-weight: 900; letter-spacing: -1px; margin: 0; }
`

export function BrutalChip({ active, children, onClick }) {
    return (
        <button onClick={onClick} style={{
            padding: '8px 14px', borderRadius: 999,
            background: active ? KC.ink : '#fff', color: active ? '#fff' : KC.ink,
            border: `2px solid ${KC.ink}`, fontSize: 12, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: active ? `2px 2px 0 ${KC.orange}` : 'none',
        }}>{children}{active ? ' ×' : ''}</button>
    )
}
