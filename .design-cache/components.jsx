/* eslint-disable */
// Shared primitives for the KerjaCerdas design canvas.
// All exports attached to `window` at the bottom for cross-file babel scope.

const KC_COLORS = {
  ink: '#0B0B0F',
  bone: '#FAF8F2',
  paper: '#FFFFFF',
  surface: '#F4F1EA',
  line: '#0B0B0F',
  orange: '#FF5722',     // brand
  orangeDeep: '#E54219',
  orangeSoft: '#FFE0D4',
  yellow: '#FFCB05',
  cyan: '#7AE7F0',
  pink: '#FFB7D5',
  lime: '#C8F26B',
  rose: '#FF6F61',
  mint: '#9BE6C2',
  mute: '#6B6760',
  ash: '#E5E0D6',
};

// ────────────────────────────────────────────────────────────────────────────
// Logo
function Logo({ size = 28, color = '#0B0B0F', mark = '#FF5722' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: mark, border: `2px solid ${color}`,
        display: 'grid', placeItems: 'center',
        boxShadow: `3px 3px 0 ${color}`,
        transform: 'rotate(-4deg)',
      }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span style={{ fontWeight: 900, fontSize: size * 0.68, letterSpacing: -0.6, color }}>
        kerja<span style={{ color: mark }}>cerdas</span>
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Buttons
function BrutalButton({ children, variant = 'primary', size = 'md', onClick, icon, full, style = {}, ...rest }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, h: 36 },
    md: { padding: '12px 20px', fontSize: 15, h: 48 },
    lg: { padding: '16px 28px', fontSize: 17, h: 56 },
  }[size];
  const variants = {
    primary: { bg: KC_COLORS.ink, fg: '#fff', border: KC_COLORS.ink, shadow: KC_COLORS.orange },
    secondary: { bg: KC_COLORS.paper, fg: KC_COLORS.ink, border: KC_COLORS.ink, shadow: KC_COLORS.ink },
    accent: { bg: KC_COLORS.orange, fg: '#fff', border: KC_COLORS.ink, shadow: KC_COLORS.ink },
    ghost: { bg: 'transparent', fg: KC_COLORS.ink, border: 'transparent', shadow: 'transparent' },
  }[variant];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: sizes.padding, fontSize: sizes.fontSize, fontWeight: 800,
      background: variants.bg, color: variants.fg,
      border: `2px solid ${variants.border}`,
      boxShadow: variant === 'ghost' ? 'none' : `4px 4px 0 ${variants.shadow}`,
      borderRadius: 10, cursor: 'pointer', letterSpacing: -0.2,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      width: full ? '100%' : 'auto',
      ...style,
    }} {...rest}>
      {children}
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Badge / Tag
function Tag({ children, color = KC_COLORS.yellow, ink = KC_COLORS.ink, size = 'md', icon }) {
  const pad = size === 'sm' ? '3px 8px' : '5px 10px';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: pad, fontSize: fs, fontWeight: 800,
      background: color, color: ink,
      border: `1.5px solid ${ink}`,
      borderRadius: 999,
      letterSpacing: 0.4, textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}>
      {icon}{children}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Card shell
function BrutalCard({ children, color = '#fff', shadow = KC_COLORS.ink, padding = 20, style = {} }) {
  return (
    <div style={{
      background: color, border: `2px solid ${KC_COLORS.ink}`,
      borderRadius: 14, padding, boxShadow: `4px 4px 0 ${shadow}`,
      ...style,
    }}>{children}</div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Icons (inline SVG, ~20×20 viewBox)
const Icon = {
  Search: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="2.4"/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth="2.4" strokeLinecap="round"/></svg>
  ),
  Sparkle: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2 5.2 1.8-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" fill={c}/></svg>
  ),
  Shield: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" stroke={c} strokeWidth="2" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Bolt: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 10-13h-7l1-7z" fill={c}/></svg>
  ),
  Briefcase: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke={c} strokeWidth="2"/><path d="M3 12h18" stroke={c} strokeWidth="2"/></svg>
  ),
  GraduationCap: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9l10-5 10 5-10 5-10-5z" stroke={c} strokeWidth="2" strokeLinejoin="round"/><path d="M6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" stroke={c} strokeWidth="2"/><path d="M20 9v5" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  MapPin: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" stroke={c} strokeWidth="2"/><circle cx="12" cy="10" r="2.5" stroke={c} strokeWidth="2"/></svg>
  ),
  Cash: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2"/></svg>
  ),
  Trend: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 7h7v7" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Check: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-12" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Arrow: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  Star: ({ s = 18, c = 'currentColor', f = 'none' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={f}><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 21l1.2-6.5L2.5 9.9 9.1 9 12 3z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>
  ),
  Bookmark: ({ s = 18, c = 'currentColor', f = 'none' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={f}><path d="M6 3h12v18l-6-4-6 4V3z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>
  ),
  User: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="2"/><path d="M4 21a8 8 0 0116 0" stroke={c} strokeWidth="2"/></svg>
  ),
  Building: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" stroke={c} strokeWidth="2"/><path d="M9 8h2M9 12h2M9 16h2M14 8h2M14 12h2M14 16h2" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  Lock: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="11" width="16" height="10" rx="2" stroke={c} strokeWidth="2"/><path d="M8 11V8a4 4 0 018 0v3" stroke={c} strokeWidth="2"/></svg>
  ),
  Mail: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke={c} strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke={c} strokeWidth="2"/></svg>
  ),
  Eye: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke={c} strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2"/></svg>
  ),
  ChartBar: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke={c} strokeWidth="2.2" strokeLinecap="round"/></svg>
  ),
  Robot: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="13" rx="2" stroke={c} strokeWidth="2"/><circle cx="9" cy="13" r="1.5" fill={c}/><circle cx="15" cy="13" r="1.5" fill={c}/><path d="M12 3v4M8 17h8" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  Fire: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3s4 4 4 8a4 4 0 11-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 1012 0c0-6-6-11-6-11z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>
  ),
  Clock: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2"/><path d="M12 7v5l3 2" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  Filter: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" stroke={c} strokeWidth="2" strokeLinejoin="round"/></svg>
  ),
  Plus: ({ s = 18, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.6" strokeLinecap="round"/></svg>
  ),
  Dot: ({ s = 8, c = 'currentColor' }) => <span style={{ display: 'inline-block', width: s, height: s, borderRadius: '50%', background: c }}/>,
};

// ────────────────────────────────────────────────────────────────────────────
// Score donut (used everywhere — match %)
function ScoreDonut({ value = 87, size = 56, color = KC_COLORS.orange, label = 'match' }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={KC_COLORS.ash} strokeWidth="6" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: size * 0.32, color: KC_COLORS.ink }}>{value}<span style={{ fontSize: size * 0.18 }}>%</span></div>
          {label && <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC_COLORS.mute, marginTop: 1 }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Placeholder striped image (per default-aesthetic guidance)
function ImagePlaceholder({ w = '100%', h = 200, label = 'product shot', color = KC_COLORS.cyan, dark }) {
  const fg = dark ? '#fff' : KC_COLORS.ink;
  return (
    <div style={{
      width: w, height: h, position: 'relative', overflow: 'hidden',
      border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12,
      background: `repeating-linear-gradient(45deg, ${color} 0 14px, ${color}cc 14px 28px)`,
      display: 'grid', placeItems: 'center',
    }}>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 700, color: fg, background: dark ? '#000a' : '#fffd', padding: '4px 8px', borderRadius: 6, border: `1px solid ${fg}` }}>
        {label}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section wrapper for landing
function Section({ children, bg = '#fff', pad = '80px 64px', style = {} }) {
  return (
    <section style={{ background: bg, padding: pad, borderTop: `2px solid ${KC_COLORS.ink}`, ...style }}>
      {children}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
Object.assign(window, {
  KC_COLORS, Logo, BrutalButton, Tag, BrutalCard, Icon, ScoreDonut, ImagePlaceholder, Section,
});
