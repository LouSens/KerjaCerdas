// Shared design primitives for KerjaCerdas — Refined Modern Enterprise Neobrutalism.
import { useEffect, useState } from 'react'

export const KC = {
    ink: '#090A0F',
    inkLight: '#1E293B',
    bone: '#FAF9F5',
    paper: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceAlt: '#F1F5F9',
    border: '#090A0F',
    borderMuted: '#CBD5E1',
    orange: '#FF4800',
    orangeHover: '#E04000',
    orangeSoft: '#FFF1EB',
    yellow: '#F59E0B',
    yellowSoft: '#FEF3C7',
    cyan: '#0284C7',
    cyanSoft: '#E0F2FE',
    pink: '#EC4899',
    pinkSoft: '#FCE7F3',
    lime: '#10B981',
    limeSoft: '#ECFDF5',
    indigo: '#6366F1',
    indigoSoft: '#EEF2FF',
    rose: '#EF4444',
    roseSoft: '#FEF2F2',
    mute: '#64748B',
    ash: '#E2E8F0',
}

// Band configuration with refined styling
export const BAND_META = {
    strong: {
        key: 'strong',
        label: 'Strong Fit (Kecocokan Kuat)',
        badgeLabel: 'Strong Fit',
        color: KC.lime,
        bg: KC.limeSoft,
        border: '#059669',
        employer: 'Kandidat memenuhi kriteria esensial posisi. Sinyal kompetensi sangat relevan untuk dievaluasi.',
        seeker: 'Keahlian dan pengalaman Anda sangat selaras dengan kebutuhan lowongan ini.',
    },
    possible: {
        key: 'possible',
        label: 'Possible Fit (Potensial)',
        badgeLabel: 'Possible Fit',
        color: KC.yellow,
        bg: KC.yellowSoft,
        border: '#D97706',
        employer: 'Sebagian besar kriteria utama terpenuhi. Terdapat area pendukung yang dapat dipertimbangkan.',
        seeker: 'Kompetensi inti Anda relevan dengan potensi peningkatan pada beberapa keahlian pelengkap.',
    },
    stretch: {
        key: 'stretch',
        label: 'Stretch Fit (Eksplorasi)',
        badgeLabel: 'Stretch Fit',
        color: KC.cyan,
        bg: KC.cyanSoft,
        border: '#0284C7',
        employer: 'Latar belakang memiliki keahlian yang dapat ditransfer (transferable skills) dari industri serupa.',
        seeker: 'Posisi yang menantang untuk pengembangan karir dan peningkatan kapabilitas baru.',
    },
}

export const BAND_ORDER = ['strong', 'possible', 'stretch']

export const topBtn = (bg = '#fff', fg = KC.ink, border = KC.ink) => ({
    padding: '9px 18px',
    background: bg,
    color: fg,
    border: `1.5px solid ${border}`,
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: `2.5px 2.5px 0 ${border}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontFamily: 'inherit',
    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
})

export function BrutalCard({ children, color = '#FFFFFF', shadow = KC.ink, padding = 22, className = '', style = {}, onClick }) {
    return (
        <div
            className={`kc-card ${className}`}
            onClick={onClick}
            style={{
                background: color,
                border: `1.5px solid ${KC.ink}`,
                borderRadius: 12,
                padding,
                boxShadow: `3px 3px 0 ${shadow}`,
                ...style,
            }}
        >
            {children}
        </div>
    )
}

export function Tag({ children, color = '#F1F5F9', ink = KC.ink, border = KC.ink, size = 'md', icon, style = {} }) {
    const pad = size === 'sm' ? '3px 8px' : '5px 12px'
    const fs = size === 'sm' ? 11 : 12
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: pad,
                fontSize: fs,
                fontWeight: 700,
                background: color,
                color: ink,
                border: `1px solid ${border}`,
                borderRadius: 999,
                letterSpacing: 0.2,
                lineHeight: 1.2,
                ...style,
            }}
        >
            {icon}
            {children}
        </span>
    )
}

export function BandLegend({ side = 'seeker', defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <BrutalCard color="#FFFFFF" padding={16}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: 13,
                    color: KC.ink,
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: KC.orange }} />
                    Panduan Evaluasi Kecocokan (Confidence Bands)
                </span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{open ? '−' : '+'}</span>
            </button>
            {open && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${KC.ash}` }}>
                    {BAND_ORDER.map(k => {
                        const b = BAND_META[k]
                        return (
                            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: b.bg, border: `1px solid ${b.border}`, borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color }} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: KC.ink }}>{b.badgeLabel}</span>
                                </div>
                                <span style={{ fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>{b[side]}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </BrutalCard>
    )
}

export function ScoreDonut({ value = 87, size = 54, color = KC.orange, label }) {
    const strokeWidth = 3.5
    const r = (size - strokeWidth * 2) / 2
    const c = 2 * Math.PI * r
    const off = c - (Math.max(0, Math.min(100, value)) / 100) * c
    const rounded = Math.round(value)
    const fontSize = Math.round(size * 0.26)

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                    <circle
                        cx={size / 2} cy={size / 2} r={r}
                        stroke={KC.ash} strokeWidth={strokeWidth} fill="none"
                    />
                    <circle
                        className="kc-donut-ring"
                        cx={size / 2} cy={size / 2} r={r}
                        stroke={color} strokeWidth={strokeWidth} fill="none"
                        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    lineHeight: 1,
                    pointerEvents: 'none',
                }}>
                    <span style={{
                        fontWeight: 900,
                        fontSize,
                        color: KC.ink,
                        letterSpacing: -0.5,
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {rounded}<span style={{ fontSize: Math.max(9, Math.round(fontSize * 0.7)), fontWeight: 800 }}>%</span>
                    </span>
                </div>
            </div>
            {label && (
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.mute, lineHeight: 1 }}>
                    {label}
                </span>
            )}
        </div>
    )
}

export function FilledStat({ label, value, sub, icon, accent = KC.orange, onClick }) {
    return (
        <div
            className="kc-stat"
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            style={{
                background: '#FFFFFF',
                border: `1.5px solid ${KC.ink}`,
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: `3px 3px 0 ${KC.ink}`,
                cursor: onClick ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'all 0.15s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: KC.mute }}>
                    {label}
                </span>
                {icon && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, display: 'grid', placeItems: 'center', color: accent }}>
                        {icon}
                    </div>
                )}
            </div>
            <div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: KC.ink, margin: '2px 0 6px' }}>
                    {value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: KC.mute }}>
                    {sub}
                </div>
            </div>
        </div>
    )
}

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
@keyframes kc-fade-up { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes kc-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes kc-spin { to { transform: rotate(360deg) } }

.kc-stagger > * { animation: kc-fade-up .4s cubic-bezier(.16, 1, 0.3, 1) both; }
.kc-stagger > *:nth-child(1) { animation-delay: 0s }
.kc-stagger > *:nth-child(2) { animation-delay: .05s }
.kc-stagger > *:nth-child(3) { animation-delay: .1s }
.kc-stagger > *:nth-child(4) { animation-delay: .15s }
.kc-stagger > *:nth-child(5) { animation-delay: .2s }
.kc-stagger > *:nth-child(6) { animation-delay: .25s }

.kc-card { transition: transform .15s ease, box-shadow .15s ease; max-width: 100%; box-sizing: border-box; }
.kc-card:hover { transform: translate(-1.5px, -1.5px); box-shadow: 4.5px 4.5px 0 #090A0F; }

.kc-btn { transition: transform .12s ease, box-shadow .12s ease; user-select: none; }
.kc-btn:hover { transform: translate(-1.5px, -1.5px); box-shadow: 3.5px 3.5px 0 #090A0F; }
.kc-btn:active { transform: translate(1px, 1px); box-shadow: 1.5px 1.5px 0 #090A0F; }

.kc-stat { transition: transform .15s ease, box-shadow .15s ease; min-width: 0; box-sizing: border-box; }
.kc-stat:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 #090A0F; }

.kc-donut-ring { transition: stroke-dashoffset 0.8s ease-out; }

.kc-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.kc-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.kc-grid-main { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; }
.kc-card-split { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.kc-card-actions { display: flex; align-items: flex-end; flex-direction: column; gap: 12px; }

@media (max-width: 1100px) {
  .kc-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kc-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kc-grid-main { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 640px) {
  .kc-grid-4 { grid-template-columns: 1fr !important; gap: 12px !important; }
  .kc-grid-3 { grid-template-columns: 1fr !important; gap: 12px !important; }
  .kc-h1 { font-size: 22px !important; line-height: 1.25 !important; }
  .kc-topbar { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
  .kc-topbar > div:last-child { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; }
  .kc-topbar > div:last-child .kc-btn { flex: 1 1 auto; justify-content: center; }
  .kc-card-split { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
  .kc-card-actions { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; width: 100% !important; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 4px; }
  .kc-card-actions > div:last-child { display: flex; gap: 8px; flex: 1; justify-content: flex-end; }
}

.kc-h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.8px; margin: 0; color: #090A0F; }
`
