/* eslint-disable */
// Auth screens — 50:50 split. Sign-up shown first; login link below.
// Variants:
//   AuthA — Refined brutal: stats + headline on left, form on right
//   AuthB — Dark ink panel left with marquee, form on right
//   AuthC — Minimalist enterprise: clean off-white left, form right
//
// All 3 follow the same form structure for fair compare.

function RoleCard({ role, selected, onSelect, kind }) {
  const isS = kind === 'seeker';
  const c = isS ? KC_COLORS.cyan : KC_COLORS.pink;
  return (
    <button onClick={() => onSelect(kind)} style={{
      flex: 1, padding: 16, textAlign: 'left',
      background: selected === kind ? c : '#fff',
      border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12,
      boxShadow: selected === kind ? `4px 4px 0 ${KC_COLORS.ink}` : `2px 2px 0 ${KC_COLORS.ink}`,
      cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
      transform: selected === kind ? `rotate(${isS ? -1 : 1}deg)` : 'none',
      transition: 'all .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, background: '#fff', border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
          {isS ? <Icon.User s={18}/> : <Icon.Building s={18}/>}
        </div>
        {selected === kind && <div style={{ width: 22, height: 22, background: KC_COLORS.ink, color: '#fff', borderRadius: '50%', display: 'grid', placeItems: 'center' }}><Icon.Check s={14} c="#fff"/></div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.1 }}>{isS ? 'Pejuang Kerja' : 'Bos / HR'}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: KC_COLORS.mute, marginTop: 4, lineHeight: 1.4 }}>
        {isS ? 'Cari kerja yang cocok pake AI' : 'Pasang lowongan, dapet top-5 kandidat'}
      </div>
    </button>
  );
}

function Field({ label, type = 'text', placeholder, icon, value, onChange, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: KC_COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: KC_COLORS.mute }}>{icon}</span>}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{
          width: '100%', padding: icon ? '12px 14px 12px 38px' : '12px 14px',
          background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10,
          fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: KC_COLORS.ink,
          boxSizing: 'border-box', outline: 'none',
        }}/>
      </div>
      {hint && <div style={{ fontSize: 11, fontWeight: 600, color: KC_COLORS.mute, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function SocialRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
      <button style={{ padding: '10px 12px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      </button>
      <button style={{ padding: '10px 12px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
        <svg width="16" height="16" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Shared right-side sign-up form (used by all variants)
function SignUpForm({ accent = KC_COLORS.orange }) {
  const [role, setRole] = React.useState('seeker');
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <div style={{ marginBottom: 24 }}>
        <Logo size={28}/>
      </div>
      <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05, margin: '0 0 8px' }}>
        Daftar dulu, <span style={{ color: accent }}>terus kerja.</span>
      </h2>
      <p style={{ fontSize: 14, color: KC_COLORS.mute, marginBottom: 22, lineHeight: 1.5 }}>
        Gratis selamanya buat pencari kerja. 2 menit doang.
      </p>

      {/* Role select */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Saya adalah…</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <RoleCard kind="seeker" selected={role} onSelect={setRole}/>
          <RoleCard kind="employer" selected={role} onSelect={setRole}/>
        </div>
      </div>

      <Field label={role === 'employer' ? 'Nama PT / Instansi' : 'Nama Lengkap'} placeholder={role === 'employer' ? 'PT Sukses Maju' : 'Rina Pertiwi'} icon={<Icon.User s={16}/>}/>
      <Field label="Email" type="email" placeholder="kamu@email.com" icon={<Icon.Mail s={16}/>}/>
      <Field label="Kata Sandi" type="password" placeholder="••••••••" icon={<Icon.Lock s={16}/>} hint="Min. 8 karakter, kombinasi huruf & angka"/>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, fontWeight: 600, color: KC_COLORS.mute, marginBottom: 16, lineHeight: 1.5, cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked style={{ marginTop: 3, accentColor: KC_COLORS.orange, width: 16, height: 16 }}/>
        <span>Saya setuju dengan <a style={{ color: KC_COLORS.ink, textDecoration: 'underline', fontWeight: 700 }}>Syarat</a> & <a style={{ color: KC_COLORS.ink, textDecoration: 'underline', fontWeight: 700 }}>Kebijakan Privasi</a>. Data KTP/Ijazah/NPWP terenkripsi, nggak ditampilin ke user lain.</span>
      </label>

      <BrutalButton variant="accent" full size="lg" icon={<Icon.Arrow s={16} c="#fff"/>}>Sikat Daftar — Gratis</BrutalButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 14px' }}>
        <div style={{ flex: 1, height: 2, background: KC_COLORS.ink, opacity: 0.15 }}/>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC_COLORS.mute }}>atau pakai</span>
        <div style={{ flex: 1, height: 2, background: KC_COLORS.ink, opacity: 0.15 }}/>
      </div>
      <SocialRow/>

      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, fontWeight: 600, color: KC_COLORS.mute }}>
        Sudah punya akun? <a style={{ color: KC_COLORS.ink, fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>Masuk di sini →</a>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT A — Refined Brutal: stats + headline on bone background
function AuthA() {
  return (
    <div style={{ width: 1440, height: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: '"Plus Jakarta Sans", sans-serif', color: KC_COLORS.ink, background: '#fff' }}>
      {/* LEFT */}
      <div style={{ background: KC_COLORS.bone, padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: `2px solid ${KC_COLORS.ink}`, position: 'relative', overflow: 'hidden' }}>
        {/* deco sticker */}
        <div style={{ position: 'absolute', top: 40, right: -40, width: 180, height: 180, background: KC_COLORS.orange, border: `3px solid ${KC_COLORS.ink}`, borderRadius: '50%', transform: 'rotate(-12deg)', boxShadow: `8px 8px 0 ${KC_COLORS.ink}`, display: 'grid', placeItems: 'center', color: '#fff', textAlign: 'center', lineHeight: 1 }}>
          <div>
            <div style={{ fontSize: 48, fontWeight: 900 }}>87%</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 }}>akurasi<br/>match</div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <Tag color={KC_COLORS.yellow} icon={<Icon.Sparkle s={12}/>}>Hackathon · Innovation-ready</Tag>
          <h1 style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1.8, lineHeight: 1, margin: '20px 0 18px' }}>
            Kerja yang<br/>cocok beneran<br/>nungguin kamu.
          </h1>
          <p style={{ fontSize: 16, color: KC_COLORS.mute, lineHeight: 1.6, maxWidth: 440 }}>
            Bikin akun, upload CV, dan biar AI Gemini bandingin sama 12.000+ lowongan terverifikasi. Top-5 keluar dalam 8 detik.
          </p>
        </div>

        {/* stat callouts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 32, position: 'relative', zIndex: 2 }}>
          {[
            { n: '12.4K', l: 'pejuang kerja', c: KC_COLORS.cyan },
            { n: '340+', l: 'employer aktif', c: KC_COLORS.lime },
            { n: '8 dtk', l: 'avg match time', c: KC_COLORS.pink },
          ].map((s, i) => (
            <div key={i} style={{ background: s.c, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12, padding: 16, boxShadow: `3px 3px 0 ${KC_COLORS.ink}` }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Mini testimonial */}
        <BrutalCard color="#fff" padding={18} style={{ marginTop: 'auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: KC_COLORS.yellow, border: `2px solid ${KC_COLORS.ink}`, display: 'grid', placeItems: 'center', fontWeight: 900 }}>R</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>"Spam 80 lamaran cuma 1 panggilan. Pake KerjaCerdas: 5 apply, 3 interview, 1 offer."</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: KC_COLORS.mute, marginTop: 4 }}>Rina P. — UX Researcher @ Bibit</div>
            </div>
          </div>
        </BrutalCard>
      </div>

      {/* RIGHT — form */}
      <div style={{ padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
        <SignUpForm accent={KC_COLORS.orange}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT B — Dark ink panel with marquee
function AuthB() {
  const titles = ['Backend Engineer', 'UX Researcher', 'Data Analyst', 'Product Manager', 'Frontend Lead', 'DevOps', 'AI Engineer', 'Growth Marketer', 'Mobile Dev', 'QA Lead'];
  return (
    <div style={{ width: 1440, height: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: '"Plus Jakarta Sans", sans-serif', background: '#fff' }}>
      {/* LEFT — dark */}
      <div style={{ background: KC_COLORS.ink, color: '#fff', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        {/* faint grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${KC_COLORS.orange}22 1px, transparent 1px), linear-gradient(90deg, ${KC_COLORS.orange}22 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: 0.6 }}/>

        <div style={{ position: 'relative' }}>
          <Logo size={28} color="#fff" mark={KC_COLORS.orange}/>
        </div>

        <div style={{ position: 'relative' }}>
          <Tag color={KC_COLORS.orange} ink="#fff" icon={<Icon.Sparkle s={12} c="#fff"/>}>AI-powered · Gemini</Tag>
          <h1 style={{ fontSize: 60, fontWeight: 900, letterSpacing: -2, lineHeight: 0.98, margin: '20px 0 16px' }}>
            12.000+<br/>
            <span style={{ color: KC_COLORS.orange }}>lowongan</span><br/>
            nungguin matching.
          </h1>
          <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.6, maxWidth: 440 }}>
            Bukan papan lowongan biasa. AI bandingin profilmu vs JD, kasih top-5 paling cocok dalam 8 detik.
          </p>
        </div>

        {/* Marquee of job titles */}
        <div style={{ position: 'relative', marginTop: 32 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {titles.map((t, i) => {
              const c = [KC_COLORS.orange, KC_COLORS.cyan, KC_COLORS.yellow, KC_COLORS.lime, KC_COLORS.pink][i % 5];
              return (
                <span key={t} style={{ padding: '8px 14px', border: `1.5px solid ${c}`, borderRadius: 999, fontSize: 12, fontWeight: 700, color: c }}>
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: 20, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>
          <span>● 87% akurasi</span>
          <span>● 8 dtk avg</span>
          <span>● Server di Indonesia</span>
          <span>● UU PDP compliant</span>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SignUpForm accent={KC_COLORS.orange}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT C — Minimalist Enterprise
function AuthC() {
  return (
    <div style={{ width: 1440, height: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: '"Plus Jakarta Sans", sans-serif', background: '#fff' }}>
      {/* LEFT */}
      <div style={{ background: KC_COLORS.surface, padding: '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        <Logo size={28}/>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#fff', border: `1px solid ${KC_COLORS.ash}`, borderRadius: 999, fontSize: 12, fontWeight: 600, color: KC_COLORS.mute, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: KC_COLORS.orange }}/> Powered by Gemini · v2026.05
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.8, lineHeight: 1.02, margin: '0 0 18px', color: KC_COLORS.ink }}>
            Karier yang ditemukan, bukan dicari.
          </h1>
          <p style={{ fontSize: 16, color: KC_COLORS.mute, lineHeight: 1.6, maxWidth: 440 }}>
            Platform AI matching kerja untuk Indonesia. Dipercaya 340+ perusahaan dari startup ke unicorn.
          </p>

          {/* Inline stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 40, paddingTop: 24, borderTop: `1px solid ${KC_COLORS.ash}` }}>
            {[['87%', 'akurasi match'], ['12.4K', 'job seekers'], ['8 dtk', 'avg match time']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: KC_COLORS.ink, lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 12, color: KC_COLORS.mute, marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: KC_COLORS.mute }}>
          <Icon.Shield s={14} c={KC_COLORS.mute}/> Data terenkripsi AES-256 · Server di Indonesia
        </div>
      </div>

      {/* RIGHT — form (minimal version) */}
      <div style={{ padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SignUpForm accent={KC_COLORS.orange}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LOGIN variant (compact, for canvas)
function LoginScreen() {
  return (
    <div style={{ width: 1440, height: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: '"Plus Jakarta Sans", sans-serif', background: '#fff', color: KC_COLORS.ink }}>
      {/* LEFT */}
      <div style={{ background: KC_COLORS.orange, color: '#fff', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', borderRight: `2px solid ${KC_COLORS.ink}` }}>
        <Logo size={28} color="#fff" mark={KC_COLORS.ink}/>

        <div style={{ position: 'relative' }}>
          <Tag color={KC_COLORS.ink} ink="#fff">welcome back</Tag>
          <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, lineHeight: 0.98, margin: '20px 0 16px' }}>
            Lanjut<br/>cari yang<br/>cocok.
          </h1>
          <p style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6, maxWidth: 420 }}>
            Match-mu udah ke-update. Cek top-5 baru — ada 2 yang lebih tinggi dari minggu lalu.
          </p>
          <BrutalCard color={KC_COLORS.bone} shadow={KC_COLORS.ink} padding={18} style={{ marginTop: 28, maxWidth: 380, color: KC_COLORS.ink }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ScoreDonut value={93} size={48}/>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: KC_COLORS.mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>match baru</div>
                <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.2 }}>Senior Backend · Tokopedia</div>
                <div style={{ fontSize: 12, color: KC_COLORS.mute }}>Posted 2 jam lalu</div>
              </div>
            </div>
          </BrutalCard>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>● 12.480 pejuang kerja online sekarang</div>
      </div>

      {/* RIGHT — login form */}
      <div style={{ padding: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.4, lineHeight: 1.05, margin: '0 0 8px' }}>Masuk balik.</h2>
          <p style={{ fontSize: 14, color: KC_COLORS.mute, marginBottom: 28 }}>Pake email & sandi yang dipake daftar.</p>

          <Field label="Email" type="email" placeholder="kamu@email.com" icon={<Icon.Mail s={16}/>}/>
          <Field label="Kata Sandi" type="password" placeholder="••••••••" icon={<Icon.Lock s={16}/>}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: KC_COLORS.orange, width: 14, height: 14 }}/>
              Ingat saya
            </label>
            <a style={{ fontSize: 13, fontWeight: 700, color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer' }}>Lupa sandi?</a>
          </div>

          <BrutalButton variant="accent" full size="lg" icon={<Icon.Arrow s={16} c="#fff"/>}>Gass Masuk</BrutalButton>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 14px' }}>
            <div style={{ flex: 1, height: 2, background: KC_COLORS.ink, opacity: 0.15 }}/>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC_COLORS.mute }}>atau pakai</span>
            <div style={{ flex: 1, height: 2, background: KC_COLORS.ink, opacity: 0.15 }}/>
          </div>
          <SocialRow/>

          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, fontWeight: 600, color: KC_COLORS.mute }}>
            Belum punya akun? <a style={{ color: KC_COLORS.ink, fontWeight: 800, textDecoration: 'underline', cursor: 'pointer' }}>Daftar gratis →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthA, AuthB, AuthC, LoginScreen });
