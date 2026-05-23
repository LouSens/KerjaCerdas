/* eslint-disable */
// Landing page — 3 directional variants for the KerjaCerdas hero/landing.
// A = Refined Neo-Brutal (full landing)  • B = Full-Send Candy Brutal (hero only)
// C = Minimal Enterprise (hero only)
// Variants A/B/C exposed on window at the bottom.

// ════════════════════════════════════════════════════════════════════════════
// SHARED NAV (brutal direction)
function NavBar({ tone = 'refined' }) {
  const isCandy = tone === 'candy';
  const isMin = tone === 'min';
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 64px',
      background: isCandy ? KC_COLORS.yellow : '#fff',
      borderBottom: isMin ? `1px solid ${KC_COLORS.ash}` : `2px solid ${KC_COLORS.ink}`,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}>
      <Logo size={32}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 700 }}>
        <a style={{ color: KC_COLORS.ink, textDecoration: 'none' }}>Cara Kerja</a>
        <a style={{ color: KC_COLORS.ink, textDecoration: 'none' }}>Fitur</a>
        <a style={{ color: KC_COLORS.ink, textDecoration: 'none' }}>Harga Employer</a>
        <a style={{ color: KC_COLORS.ink, textDecoration: 'none' }}>Tentang</a>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <BrutalButton variant="secondary" size="sm">Masuk</BrutalButton>
        <BrutalButton variant={isMin ? 'accent' : 'primary'} size="sm" icon={<Icon.Arrow s={14} c="#fff"/>}>Daftar Gratis</BrutalButton>
      </div>
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT A — REFINED NEO-BRUTAL  (full landing)
function LandingA() {
  return (
    <div style={{ width: 1440, background: KC_COLORS.bone, fontFamily: '"Plus Jakarta Sans", sans-serif', color: KC_COLORS.ink }}>
      <NavBar tone="refined"/>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 64px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <Tag color={KC_COLORS.yellow} icon={<Icon.Sparkle s={12}/>}>Powered by Gemini · Bahasa Indonesia</Tag>
            <h1 style={{ fontSize: 76, lineHeight: 0.98, letterSpacing: -2.6, fontWeight: 900, margin: '20px 0 12px' }}>
              Kerja yang<br/>
              <span style={{ background: KC_COLORS.orange, color: '#fff', padding: '0 14px', display: 'inline-block', boxShadow: `6px 6px 0 ${KC_COLORS.ink}`, border: `3px solid ${KC_COLORS.ink}`, transform: 'rotate(-1.5deg)', marginTop: 6 }}>cocok beneran.</span><br/>
              Bukan asal lempar CV.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: KC_COLORS.mute, maxWidth: 520, margin: '20px 0 28px' }}>
              Matching semantik 87% akurat dari CV-mu, peta skill gap dengan rekomendasi kursus, dan advisor karier AI 24 jam.
              Bos juga dapet top-5 kandidat tiap lowongan — tanpa pusing.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              <BrutalButton variant="primary" size="lg" icon={<Icon.Arrow s={16} c="#fff"/>}>Cari Kerja Sekarang</BrutalButton>
              <BrutalButton variant="secondary" size="lg" icon={<Icon.Building s={16}/>}>Saya HR / Employer</BrutalButton>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 700, color: KC_COLORS.mute }}>
              <div style={{ display: 'flex' }}>
                {[KC_COLORS.cyan, KC_COLORS.lime, KC_COLORS.pink, KC_COLORS.yellow].map((c, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `2px solid ${KC_COLORS.ink}`, marginLeft: i ? -10 : 0, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900 }}>
                    {['R','A','D','M'][i]}
                  </div>
                ))}
              </div>
              <span><b style={{ color: KC_COLORS.ink }}>12.480+</b> pejuang kerja udah dapet match minggu ini</span>
            </div>
          </div>

          {/* Hero visual — composed brutal card cluster */}
          <div style={{ position: 'relative', height: 520 }}>
            {/* Big match card */}
            <BrutalCard color="#fff" shadow={KC_COLORS.ink} padding={20} style={{ position: 'absolute', top: 28, right: 24, width: 360, transform: 'rotate(2deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <ScoreDonut value={92} size={60}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: KC_COLORS.mute, textTransform: 'uppercase' }}>Best match</div>
                  <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>Senior Backend Engineer</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: KC_COLORS.mute, marginTop: 2 }}>Tokopedia · Jakarta · Hybrid</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                <Tag color={KC_COLORS.lime} size="sm">Go</Tag>
                <Tag color={KC_COLORS.lime} size="sm">PostgreSQL</Tag>
                <Tag color={KC_COLORS.lime} size="sm">gRPC</Tag>
                <Tag color={KC_COLORS.orangeSoft} size="sm">+2 to learn</Tag>
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: KC_COLORS.bone, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: KC_COLORS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon.Cash s={14}/> Rp 28-42 jt/bulan · 4-7 thn exp
              </div>
            </BrutalCard>

            {/* CV uploaded card */}
            <BrutalCard color={KC_COLORS.cyan} shadow={KC_COLORS.ink} padding={16} style={{ position: 'absolute', top: 260, right: 200, width: 260, transform: 'rotate(-3deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                  <Icon.Check s={20}/>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>CV_RinaP.pdf</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: KC_COLORS.ink, opacity: 0.7 }}>Parsed · 14 skills extracted</div>
                </div>
              </div>
            </BrutalCard>

            {/* Skill gap mini card */}
            <BrutalCard color={KC_COLORS.yellow} shadow={KC_COLORS.ink} padding={16} style={{ position: 'absolute', top: 380, right: 60, width: 280, transform: 'rotate(1deg)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Skill gap → kursus</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4, lineHeight: 1.2 }}>"Kafka untuk Backend" · Dicoding</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, fontWeight: 700 }}>
                <Icon.Clock s={12}/> 12 jam <span>·</span> <Icon.Star s={12} f={KC_COLORS.ink}/> 4.8
              </div>
            </BrutalCard>

            {/* Big orange star sticker */}
            <div style={{ position: 'absolute', top: -8, left: 8, width: 110, height: 110, background: KC_COLORS.orange, border: `3px solid ${KC_COLORS.ink}`, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: `5px 5px 0 ${KC_COLORS.ink}`, transform: 'rotate(-8deg)', color: '#fff', textAlign: 'center', lineHeight: 1 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>87%</div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Akurasi<br/>match</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section style={{ padding: '24px 64px', borderTop: `2px solid ${KC_COLORS.ink}`, borderBottom: `2px solid ${KC_COLORS.ink}`, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC_COLORS.mute, whiteSpace: 'nowrap' }}>
            Dipercaya HR di →
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, flex: 1, justifyContent: 'space-around', opacity: 0.85 }}>
            {['Tokopedia', 'GoTo', 'Bukalapak', 'Bibit', 'Xendit', 'Ruangguru', 'Telkomsel'].map(n => (
              <div key={n} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 700, letterSpacing: -0.5, color: KC_COLORS.ink }}>{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <Section bg={KC_COLORS.bone} pad="80px 64px">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <Tag color={KC_COLORS.pink}>cara kerja</Tag>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Tiga langkah. Beneran.</h2>
            <p style={{ fontSize: 16, color: KC_COLORS.mute, maxWidth: 540 }}>Nggak ada form 20 halaman. Upload, dapet match, langsung lamar.</p>
          </div>
          <div style={{ display: 'inline-flex', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, padding: 4, boxShadow: `3px 3px 0 ${KC_COLORS.ink}` }}>
            <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 800, background: KC_COLORS.ink, color: '#fff', borderRadius: 7 }}>Untuk Job Seeker</div>
            <div style={{ padding: '8px 16px', fontSize: 13, fontWeight: 800, color: KC_COLORS.mute }}>Untuk Employer</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { n: '01', t: 'Upload CV atau isi profil', d: 'Drop PDF, kami parse pakai Gemini. Atau isi webform pendek — 3 menit selesai.', c: KC_COLORS.cyan, ic: <Icon.User s={22}/> },
            { n: '02', t: 'AI cari yang cocok', d: 'Embedding semantik bandingin profilmu dengan ribuan lowongan. Output: top-5 paling pas.', c: KC_COLORS.yellow, ic: <Icon.Sparkle s={22}/> },
            { n: '03', t: 'Tutup gap, lamar, kerja', d: 'Skill gap advisor kasih kursus Prakerja/Dicoding/Coursera. Apply 1-klik.', c: KC_COLORS.lime, ic: <Icon.Bolt s={22}/> },
          ].map(s => (
            <BrutalCard key={s.n} color="#fff" padding={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, background: s.c, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}>{s.ic}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 800, color: KC_COLORS.mute }}>{s.n}</div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15 }}>{s.t}</h3>
              <p style={{ fontSize: 14, color: KC_COLORS.mute, lineHeight: 1.55, marginTop: 8 }}>{s.d}</p>
            </BrutalCard>
          ))}
        </div>
      </Section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────────── */}
      <Section bg="#fff" pad="80px 64px">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <Tag color={KC_COLORS.cyan}>fitur inti</Tag>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Empat senjata utama.</h2>
            <p style={{ fontSize: 16, color: KC_COLORS.mute, maxWidth: 540 }}>Semua jalan di atas Gemini embeddings + LLM. Logging audit-friendly buat compliance.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 16 }}>
          {/* Job matching — feature big */}
          <BrutalCard color={KC_COLORS.orange} shadow={KC_COLORS.ink} padding={28} style={{ gridRow: 'span 2', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <Tag color="#fff" ink={KC_COLORS.ink}>★ matching engine</Tag>
            <h3 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 14 }}>Top-5 job match.<br/>Bukan top-500 sampah.</h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.92, marginTop: 12, marginBottom: 18 }}>
              Gemini text-embedding-004 + reranker LLM. Skor dihitung dari skill overlap, level, lokasi, gaji, dan industri.
              Setiap match dijelasin: <i>kenapa cocok, apa yang kurang</i>.
            </p>
            <div style={{ background: '#0008', border: `2px solid #fff`, borderRadius: 10, padding: 14, marginTop: 'auto', backdropFilter: 'blur(2px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ScoreDonut value={89} size={48} color="#fff"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>Product Designer · Bibit</div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>"Pengalaman fintech-mu bikin nilai tinggi di UX research."</div>
                </div>
              </div>
            </div>
          </BrutalCard>

          {/* Skill gap */}
          <BrutalCard color={KC_COLORS.lime} padding={22} style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Icon.ChartBar s={22}/></div>
              <Tag color="#fff" size="sm">free</Tag>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, marginTop: 12 }}>Skill Gap Coach</h3>
            <p style={{ fontSize: 13, color: KC_COLORS.ink, opacity: 0.78, lineHeight: 1.5, marginTop: 6 }}>
              Bandingin profilmu vs JD. AI kasih kursus relevan dari Prakerja, Dicoding, Coursera, RevoU.
            </p>
          </BrutalCard>

          {/* Career advisor */}
          <BrutalCard color={KC_COLORS.cyan} padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Icon.Robot s={22}/></div>
              <Tag color="#fff" size="sm">24/7</Tag>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, marginTop: 12 }}>Career Gap Advisor</h3>
            <p style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.5, marginTop: 6 }}>
              Habis gap setahun? AI bantu reframe pengalaman, tulis ulang ringkasan CV, simulasi interview.
            </p>
          </BrutalCard>

          {/* Candidate matching */}
          <BrutalCard color={KC_COLORS.yellow} padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Icon.Briefcase s={22}/></div>
              <Tag color="#fff" size="sm">HR</Tag>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, marginTop: 12 }}>Top-5 Kandidat</h3>
            <p style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.5, marginTop: 6 }}>
              Reverse matching: tiap lowongan tampilin top-5 kandidat semantik. Hemat waktu screening 80%.
            </p>
          </BrutalCard>

          {/* Verification */}
          <BrutalCard color={KC_COLORS.pink} padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center' }}><Icon.Shield s={22}/></div>
              <Tag color="#fff" size="sm">trust</Tag>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, marginTop: 12 }}>Verifikasi KTP & Ijazah</h3>
            <p style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.5, marginTop: 6 }}>
              Profil terverifikasi dapet badge. Data terenkripsi — nggak akan kelihatan ke user lain.
            </p>
          </BrutalCard>
        </div>
      </Section>

      {/* ── VERIFICATION TRUST SECTION ────────────────────────────────────── */}
      <Section bg={KC_COLORS.ink} pad="72px 64px" style={{ color: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <Tag color={KC_COLORS.orange} ink="#fff">trust & privacy</Tag>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.4, margin: '14px 0 14px', lineHeight: 1.05 }}>
              Data terenkripsi.<br/>Hanya buat verifikasi.
            </h2>
            <p style={{ fontSize: 16, color: '#fff', opacity: 0.75, lineHeight: 1.6, maxWidth: 520 }}>
              KTP, ijazah, dan NPWP <b>nggak pernah</b> ditampilin ke user lain — bahkan HR. Kami pakai cuma sekali buat verifikasi identitas, lalu disimpan terenkripsi AES-256 di server Indonesia.
              Setelah verifikasi sukses, akunmu dapet badge <span style={{ background: KC_COLORS.lime, color: KC_COLORS.ink, padding: '1px 8px', borderRadius: 4, fontWeight: 900, fontSize: 13 }}>✓ VERIFIED</span> — itu doang yang publik.
            </p>
            <div style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 13, fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Check s={16} c={KC_COLORS.lime}/> AES-256 at rest</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Check s={16} c={KC_COLORS.lime}/> Server di Indonesia</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.Check s={16} c={KC_COLORS.lime}/> UU PDP compliant</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { who: 'Job Seeker', what: 'KTP + Ijazah', icon: <Icon.User s={22} c="#fff"/>, c: KC_COLORS.orange },
              { who: 'Employer', what: 'NPWP + Akta', icon: <Icon.Building s={22} c="#fff"/>, c: KC_COLORS.cyan },
            ].map((b, i) => (
              <div key={i} style={{ background: '#1a1a20', border: `2px solid #fff`, borderRadius: 12, padding: 18 }}>
                <div style={{ width: 44, height: 44, background: b.c, border: '2px solid #fff', borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 12 }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.6 }}>{b.who}</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{b.what}</div>
                <div style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', marginTop: 10, padding: '6px 8px', background: '#0008', borderRadius: 6, color: KC_COLORS.lime }}>
                  status: encrypted
                </div>
              </div>
            ))}
            <BrutalCard color={KC_COLORS.bone} shadow="#fff" padding={18} style={{ gridColumn: 'span 2', color: KC_COLORS.ink }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Icon.Lock s={28}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>Kamu pegang kontrol penuh</div>
                  <div style={{ fontSize: 12, color: KC_COLORS.mute, marginTop: 2 }}>Hapus dokumen kapan aja dari Settings → Privasi. Audit log tersedia.</div>
                </div>
              </div>
            </BrutalCard>
          </div>
        </div>
      </Section>

      {/* ── PRICING (employer) ────────────────────────────────────────────── */}
      <Section bg="#fff" pad="80px 64px">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Tag color={KC_COLORS.yellow}>harga untuk employer</Tag>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 6px' }}>Job seeker selalu gratis.<br/>Bos bayar sesuai kebutuhan.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, maxWidth: 1100, margin: '0 auto' }}>
          {[
            { name: 'Starter', price: '0', sub: 'forever', cta: 'Mulai Gratis', highlight: false, color: '#fff', perks: ['1 lowongan aktif', 'Top-3 kandidat per posting', 'Email applicants','Verifikasi NPWP'] },
            { name: 'Growth', price: '1.5jt', sub: '/bulan', cta: 'Coba 14 Hari', highlight: true, color: KC_COLORS.orange, perks: ['10 lowongan aktif', 'Top-10 kandidat per posting', 'Analytics dashboard', 'Skill heatmap kandidat', 'Priority support'] },
            { name: 'Scale', price: '5jt', sub: '/bulan', cta: 'Hubungi Sales', highlight: false, color: KC_COLORS.ink, perks: ['Unlimited lowongan', 'Top-50 kandidat + bulk export', 'ATS integration (Greenhouse, Lever)', 'API access', 'Custom branding', 'Dedicated CSM'] },
          ].map((p, i) => {
            const dark = p.color === KC_COLORS.ink;
            const accent = p.highlight;
            return (
              <div key={i} style={{
                background: p.color, color: dark || accent ? '#fff' : KC_COLORS.ink,
                border: `2px solid ${KC_COLORS.ink}`, borderRadius: 16, padding: 28,
                boxShadow: accent ? `8px 8px 0 ${KC_COLORS.ink}` : `4px 4px 0 ${KC_COLORS.ink}`,
                transform: accent ? 'translateY(-12px)' : 'none', position: 'relative',
              }}>
                {accent && <div style={{ position: 'absolute', top: -16, right: 20, background: KC_COLORS.yellow, border: `2px solid ${KC_COLORS.ink}`, padding: '4px 10px', fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', borderRadius: 999, color: KC_COLORS.ink, transform: 'rotate(4deg)', boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>paling laku</div>}
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 }}>{p.name}</div>
                <div style={{ marginTop: 8, marginBottom: 18 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>Rp</span>
                  <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginLeft: 4 }}>{p.sub}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {p.perks.map((perk, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
                      <Icon.Check s={14} c={dark || accent ? '#fff' : KC_COLORS.ink}/> {perk}
                    </li>
                  ))}
                </ul>
                <BrutalButton variant={dark ? 'accent' : (accent ? 'secondary' : 'primary')} size="md" full>{p.cta}</BrutalButton>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <Section bg={KC_COLORS.bone} pad="80px 64px">
        <div style={{ marginBottom: 36 }}>
          <Tag color={KC_COLORS.lime}>cerita beneran</Tag>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1.4, margin: '12px 0 4px' }}>Dari pejuang kerja & bos beneran.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {[
            { q: 'Dulu apply 80 lowongan, dipanggil 1. Pake KerjaCerdas: 5 apply, 3 interview, 1 offer.', who: 'Rina Pertiwi', role: 'UX Researcher @ Bibit', c: KC_COLORS.cyan },
            { q: 'Hiring frontend dapet 200 lamaran. Top-5 dari sini langsung 2 yang lolos final round. Gila.', who: 'Andika Pratama', role: 'Eng. Manager @ Xendit', c: KC_COLORS.yellow },
            { q: 'Career gap 2 tahun jaga anak. Advisor AI bantu reframe — dapet kerja remote 6 minggu.', who: 'Sari Ningrum', role: 'Project Manager @ remote', c: KC_COLORS.pink },
          ].map((t, i) => (
            <BrutalCard key={i} color={t.c} padding={24}>
              <Icon.Star s={20} f={KC_COLORS.ink}/>
              <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, margin: '12px 0 18px', letterSpacing: -0.3 }}>"{t.q}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13 }}>{t.who[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900 }}>{t.who}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{t.role}</div>
                </div>
              </div>
            </BrutalCard>
          ))}
        </div>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <Section bg="#fff" pad="72px 64px">
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 60 }}>
          <div>
            <Tag color={KC_COLORS.orange} ink="#fff">FAQ</Tag>
            <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1.2, margin: '12px 0 12px', lineHeight: 1.05 }}>Pertanyaan yang sering ditanya.</h2>
            <p style={{ fontSize: 15, color: KC_COLORS.mute, lineHeight: 1.6 }}>Belum nemu jawabnya? Tanya advisor AI kami — gratis, 24/7.</p>
            <BrutalButton variant="primary" size="md" style={{ marginTop: 18 }} icon={<Icon.Arrow s={14} c="#fff"/>}>Tanya Advisor</BrutalButton>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: 'Beneran gratis buat job seeker?', a: 'Iya. Semua fitur — matching, skill gap, advisor, verifikasi — gratis selamanya. Kami profit dari sisi employer.' },
              { q: 'Data KTP dan ijazah saya aman?', a: 'Disimpan terenkripsi AES-256, server di Indonesia, hanya dipakai sekali untuk verifikasi. Setelahnya cuma kelihatan badge ✓ Verified.' },
              { q: 'Bagaimana AI menentukan match?', a: 'Gemini text-embedding-004 bandingin semantik profil & job description, lalu LLM rerank pakai skill, lokasi, gaji, dan industri.' },
              { q: 'Bisa cancel langganan kapan aja?', a: 'Bisa. Tier Growth & Scale: monthly, cancel anytime, no pertanyaan. Sisa hari aktif sampai akhir periode.' },
            ].map((f, i) => (
              <div key={i} style={{ background: KC_COLORS.bone, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12, padding: 18, boxShadow: i === 0 ? `4px 4px 0 ${KC_COLORS.ink}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>{f.q}</div>
                  <Icon.Plus s={18}/>
                </div>
                {i === 0 && <p style={{ fontSize: 13, color: KC_COLORS.mute, lineHeight: 1.6, marginTop: 8 }}>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── BIG CTA ───────────────────────────────────────────────────────── */}
      <Section bg={KC_COLORS.orange} pad="80px 64px" style={{ color: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, margin: 0, lineHeight: 0.98 }}>Udah cukup nge-spam lamaran.</h2>
        <p style={{ fontSize: 20, opacity: 0.92, marginTop: 16, marginBottom: 32 }}>Daftar dalam 2 menit. CV-mu langsung di-parse, top-5 match keluar dalam 8 detik.</p>
        <div style={{ display: 'inline-flex', gap: 14 }}>
          <BrutalButton variant="secondary" size="lg" icon={<Icon.Arrow s={16}/>} style={{ boxShadow: `6px 6px 0 ${KC_COLORS.ink}` }}>Daftar Gratis</BrutalButton>
          <BrutalButton variant="primary" size="lg" style={{ background: KC_COLORS.ink, boxShadow: `6px 6px 0 ${KC_COLORS.yellow}` }}>Demo untuk HR →</BrutalButton>
        </div>
      </Section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: KC_COLORS.ink, color: '#fff', padding: '56px 64px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 36, marginBottom: 40 }}>
          <div>
            <Logo size={28} color="#fff" mark={KC_COLORS.orange}/>
            <p style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.6, marginTop: 14, maxWidth: 280 }}>
              Platform AI matching kerja untuk pasar Indonesia. Dibangun dengan Gemini, dijalankan oleh tim Jakarta.
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
                {col.items.map(it => <li key={it} style={{ fontSize: 13, fontWeight: 600 }}><a style={{ color: '#fff', opacity: 0.8, textDecoration: 'none' }}>{it}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid #ffffff22`, paddingTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.6 }}>
          <span>© 2026 KerjaCerdas Indonesia · Jl. Sudirman, Jakarta</span>
          <span>Made with 🍜 in Jakarta · v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT B — FULL-SEND CANDY BRUTAL  (hero only)
function LandingB() {
  return (
    <div style={{ width: 1440, background: KC_COLORS.yellow, fontFamily: '"Plus Jakarta Sans", sans-serif', color: KC_COLORS.ink, position: 'relative', overflow: 'hidden' }}>
      <NavBar tone="candy"/>

      {/* Stickers/confetti */}
      {[
        { c: KC_COLORS.pink, x: 80, y: 180, r: -16, txt: '★' },
        { c: KC_COLORS.cyan, x: 1240, y: 140, r: 10, txt: '✦' },
        { c: KC_COLORS.lime, x: 1180, y: 620, r: -8, txt: '◆' },
        { c: KC_COLORS.orange, x: 60, y: 720, r: 14, txt: '✱' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: 60, height: 60, background: s.c, border: `3px solid ${KC_COLORS.ink}`, borderRadius: 14, display: 'grid', placeItems: 'center', boxShadow: `4px 4px 0 ${KC_COLORS.ink}`, transform: `rotate(${s.r}deg)`, fontSize: 26, fontWeight: 900, color: '#fff' }}>{s.txt}</div>
      ))}

      <section style={{ padding: '90px 64px 80px', textAlign: 'center', position: 'relative' }}>
        <Tag color={KC_COLORS.ink} ink="#fff" icon={<Icon.Sparkle s={12} c="#fff"/>}>Powered by Gemini · Bahasa Indonesia</Tag>
        <h1 style={{ fontSize: 110, fontWeight: 900, letterSpacing: -4, lineHeight: 0.92, margin: '24px 0 0', textTransform: 'uppercase' }}>
          Stop spam<br/>
          <span style={{ display: 'inline-block', background: KC_COLORS.cyan, padding: '0 18px', border: `4px solid ${KC_COLORS.ink}`, boxShadow: `10px 10px 0 ${KC_COLORS.ink}`, transform: 'rotate(-2deg)', marginTop: 14 }}>lamaran.</span>{' '}
          <span style={{ display: 'inline-block', background: KC_COLORS.pink, padding: '0 18px', border: `4px solid ${KC_COLORS.ink}`, boxShadow: `10px 10px 0 ${KC_COLORS.ink}`, transform: 'rotate(2deg)', marginTop: 14, marginLeft: 16 }}>Mulai</span>{' '}
          <span style={{ display: 'inline-block', background: KC_COLORS.orange, color: '#fff', padding: '0 18px', border: `4px solid ${KC_COLORS.ink}`, boxShadow: `10px 10px 0 ${KC_COLORS.ink}`, transform: 'rotate(-1deg)', marginTop: 14, marginLeft: 16 }}>match.</span>
        </h1>
        <p style={{ fontSize: 20, fontWeight: 700, maxWidth: 680, margin: '40px auto 32px', lineHeight: 1.45 }}>
          AI dari Gemini bantu lo nemuin top-5 kerja yang beneran cocok dari CV-mu. Bukan ribuan iklan lowongan acak. <b>Gratis buat pejuang kerja.</b>
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <BrutalButton variant="primary" size="lg" icon={<Icon.Arrow s={18} c="#fff"/>} style={{ fontSize: 18, padding: '18px 28px', boxShadow: `6px 6px 0 ${KC_COLORS.orange}` }}>Gass Cari Kerja</BrutalButton>
          <BrutalButton variant="accent" size="lg" style={{ fontSize: 18, padding: '18px 28px' }}>Saya HR / Bos →</BrutalButton>
        </div>

        {/* stat row */}
        <div style={{ display: 'inline-flex', gap: 14, marginTop: 56, background: '#fff', border: `3px solid ${KC_COLORS.ink}`, borderRadius: 16, padding: 14, boxShadow: `6px 6px 0 ${KC_COLORS.ink}` }}>
          {[['12.4K', 'job seekers'], ['340+', 'employer'], ['87%', 'akurasi'], ['8 dtk', 'avg match time']].map(([n, l]) => (
            <div key={l} style={{ padding: '8px 18px', borderRight: l !== 'avg match time' ? `2px dashed ${KC_COLORS.ink}` : 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: KC_COLORS.mute, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VARIANT C — MINIMAL ENTERPRISE  (hero only)
function LandingC() {
  return (
    <div style={{ width: 1440, background: '#fff', fontFamily: '"Plus Jakarta Sans", sans-serif', color: KC_COLORS.ink }}>
      {/* minimalist nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 80px', borderBottom: `1px solid ${KC_COLORS.ash}` }}>
        <Logo size={28}/>
        <div style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 600, color: KC_COLORS.mute }}>
          <a>Produk</a><a>Solusi</a><a>Harga</a><a>Tentang</a>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <BrutalButton variant="ghost" size="sm">Masuk</BrutalButton>
          <button style={{ padding: '8px 16px', background: KC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Daftar →</button>
        </div>
      </nav>

      <section style={{ padding: '120px 80px 100px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: KC_COLORS.surface, border: `1px solid ${KC_COLORS.ash}`, borderRadius: 999, fontSize: 12, fontWeight: 600, color: KC_COLORS.mute }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: KC_COLORS.orange }}/> Now in private beta · Powered by Gemini
          </div>
          <h1 style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2.4, lineHeight: 1.02, margin: '24px 0 20px' }}>
            Karier yang ditemukan <span style={{ color: KC_COLORS.orange }}>oleh AI</span>, bukan dicari setengah mati.
          </h1>
          <p style={{ fontSize: 18, color: KC_COLORS.mute, lineHeight: 1.6, maxWidth: 540, marginBottom: 36 }}>
            Platform matching kerja semantik untuk Indonesia. Upload CV, dapat top-5 lowongan yang benar-benar relevan dalam 8 detik. Untuk HR: top-5 kandidat per posting.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <button style={{ padding: '14px 28px', background: KC_COLORS.ink, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>Mulai sebagai job seeker <Icon.Arrow s={14} c="#fff"/></button>
            <button style={{ padding: '14px 28px', background: '#fff', color: KC_COLORS.ink, border: `1px solid ${KC_COLORS.ash}`, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Saya HR / Employer</button>
          </div>
          <div style={{ display: 'flex', gap: 32, paddingTop: 24, borderTop: `1px solid ${KC_COLORS.ash}` }}>
            {[['87%', 'akurasi match'], ['12.4K', 'pejuang kerja'], ['340+', 'employer aktif']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8 }}>{n}</div>
                <div style={{ fontSize: 12, color: KC_COLORS.mute, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ background: KC_COLORS.surface, border: `1px solid ${KC_COLORS.ash}`, borderRadius: 20, padding: 24, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: KC_COLORS.mute, textTransform: 'uppercase', letterSpacing: 0.8 }}>Match Result · Rina P.</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0a8455', background: '#dcf5e9', padding: '4px 8px', borderRadius: 999 }}>● Live</span>
            </div>
            {[
              { t: 'Senior Backend Engineer', c: 'Tokopedia', s: 92 },
              { t: 'Tech Lead · Payments', c: 'Xendit', s: 89 },
              { t: 'Staff Engineer', c: 'GoTo Financial', s: 85 },
              { t: 'Backend Lead', c: 'Bibit', s: 81 },
              { t: 'Sr. Software Engineer', c: 'Ruangguru', s: 78 },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 4 ? `1px solid ${KC_COLORS.ash}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', border: `1px solid ${KC_COLORS.ash}`, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{m.c[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.t}</div>
                  <div style={{ fontSize: 12, color: KC_COLORS.mute }}>{m.c}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: m.s >= 85 ? KC_COLORS.orange : KC_COLORS.ink }}>{m.s}<span style={{ fontSize: 11, color: KC_COLORS.mute }}>%</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { LandingA, LandingB, LandingC });
