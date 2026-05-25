/* eslint-disable */
// Seeker dashboard + match results + skeleton loading + skill gap bento.
// Shared chrome: AppShell (sidebar + topbar).

function AppShell({ active = 'match', role = 'seeker', children, height = 'auto' }) {
  const items = role === 'seeker'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: <Icon.ChartBar s={18}/> },
        { id: 'match', label: 'Job Match', icon: <Icon.Sparkle s={18}/>, badge: '5' },
        { id: 'skillgap', label: 'Skill Gap', icon: <Icon.GraduationCap s={18}/> },
        { id: 'advisor', label: 'Career Advisor', icon: <Icon.Robot s={18}/> },
        { id: 'saved', label: 'Tersimpan', icon: <Icon.Bookmark s={18}/> },
        { id: 'verify', label: 'Verifikasi', icon: <Icon.Shield s={18}/>, badge: '!' },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: <Icon.ChartBar s={18}/> },
        { id: 'jobs', label: 'Lowongan', icon: <Icon.Briefcase s={18}/>, badge: '4' },
        { id: 'candidates', label: 'Top Kandidat', icon: <Icon.User s={18}/> },
        { id: 'post', label: 'Post Lowongan', icon: <Icon.Plus s={18}/> },
        { id: 'metrics', label: 'Metrik', icon: <Icon.Trend s={18}/>, badge: 'PRO' },
        { id: 'verify', label: 'Verifikasi NPWP', icon: <Icon.Shield s={18}/> },
      ];

  return (
    <div style={{ width: 1440, minHeight: 900, display: 'grid', gridTemplateColumns: '240px 1fr', background: KC_COLORS.bone, fontFamily: '"Plus Jakarta Sans", sans-serif', color: KC_COLORS.ink }}>
      {/* SIDEBAR */}
      <aside style={{ background: '#fff', borderRight: `2px solid ${KC_COLORS.ink}`, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 8px 22px' }}><Logo size={26}/></div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: KC_COLORS.mute, padding: '8px 12px 6px' }}>
            {role === 'seeker' ? 'Pencari Kerja' : 'Employer / HR'}
          </div>
          {items.map(it => {
            const on = it.id === active;
            return (
              <button key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                background: on ? KC_COLORS.ink : 'transparent', color: on ? '#fff' : KC_COLORS.ink,
                border: on ? `2px solid ${KC_COLORS.ink}` : '2px solid transparent',
                borderRadius: 10, fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', textAlign: 'left', position: 'relative',
                boxShadow: on ? `3px 3px 0 ${KC_COLORS.orange}` : 'none',
              }}>
                {it.icon} {it.label}
                {it.badge && (
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', background: on ? KC_COLORS.orange : KC_COLORS.yellow, color: KC_COLORS.ink, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, fontSize: 10, fontWeight: 900 }}>{it.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <BrutalCard color={KC_COLORS.yellow} padding={14} style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>Upgrade ke Pro</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>{role === 'seeker' ? 'Buka top-20 match, prioritas AI advisor.' : 'Unlock top-50 kandidat per lowongan.'}</div>
            <BrutalButton size="sm" variant="primary" full style={{ marginTop: 10, fontSize: 12 }}>Lihat Paket</BrutalButton>
          </BrutalCard>

          <div style={{ marginTop: 14, padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: role === 'seeker' ? KC_COLORS.cyan : KC_COLORS.pink, border: `2px solid ${KC_COLORS.ink}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13 }}>
              {role === 'seeker' ? 'R' : 'X'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>{role === 'seeker' ? 'Rina Pertiwi' : 'PT Xendit'}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: KC_COLORS.mute, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon.Shield s={10} c={role === 'seeker' ? '#0a8455' : KC_COLORS.mute}/> {role === 'seeker' ? 'Verified' : 'Menunggu NPWP'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ padding: '20px 28px 32px', minHeight: height }}>{children}</main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Top bar with greeting + actions
function TopBar({ title, subtitle, right }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 24px', borderBottom: `2px solid ${KC_COLORS.ink}`, marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: KC_COLORS.mute, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{right}</div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Job match row card
function JobMatchCard({ rank, score, title, company, companyColor, location, salary, exp, type, tags = [], gap = [], reason }) {
  const accent = score >= 90 ? KC_COLORS.orange : score >= 85 ? KC_COLORS.yellow : score >= 80 ? KC_COLORS.cyan : KC_COLORS.lime;
  return (
    <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: -10, left: -10, width: 36, height: 36, background: KC_COLORS.ink, color: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14, transform: 'rotate(-4deg)', boxShadow: `2px 2px 0 ${KC_COLORS.orange}` }}>
        #{rank}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
        <ScoreDonut value={score} size={60} color={accent}/>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, background: companyColor, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 6, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12, color: '#fff', flexShrink: 0 }}>{company[0]}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: KC_COLORS.mute }}>{company} <span style={{ marginLeft: 4 }}><Icon.Check s={11} c="#0a8455"/></span></div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15, margin: 0 }}>{title}</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 12, fontWeight: 700, color: KC_COLORS.mute, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.MapPin s={12}/> {location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Cash s={12}/> {salary}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Clock s={12}/> {exp}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Briefcase s={12}/> {type}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {tags.map(t => <Tag key={t} color={KC_COLORS.lime} size="sm">{t}</Tag>)}
            {gap.map(t => <Tag key={t} color={KC_COLORS.orangeSoft} size="sm">+ {t}</Tag>)}
          </div>

          {reason && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: KC_COLORS.bone, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: KC_COLORS.ink, display: 'flex', gap: 8 }}>
              <Icon.Sparkle s={14} c={KC_COLORS.orange}/>
              <span><b>AI · </b>{reason}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
          <button style={{ width: 38, height: 38, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 9, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.Bookmark s={16}/></button>
          <BrutalButton variant="accent" size="sm" icon={<Icon.Arrow s={14} c="#fff"/>}>Lihat</BrutalButton>
        </div>
      </div>
    </BrutalCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SEEKER DASHBOARD — overview
function SeekerDashboard() {
  return (
    <AppShell active="dashboard" role="seeker" height={900}>
      <TopBar
        title="Halo, Rina 👋"
        subtitle="Update terakhir 2 jam lalu · 3 match baru, 1 employer ngintip CV-mu"
        right={
          <>
            <button style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.Search s={14}/> Cari cepat</button>
            <BrutalButton variant="accent" size="md" icon={<Icon.Arrow s={14} c="#fff"/>}>Refresh Match</BrutalButton>
          </>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { l: 'Match Score Avg', v: '87%', t: '+4 dari minggu lalu', c: KC_COLORS.orange, dark: true },
          { l: 'Top-5 Match Aktif', v: '5', t: '2 baru hari ini', c: KC_COLORS.cyan },
          { l: 'Skill Gap', v: '3', t: 'Kafka, Redis, k8s', c: KC_COLORS.yellow },
          { l: 'Profile Views (HR)', v: '14', t: '+7 hari ini', c: KC_COLORS.lime },
        ].map((s, i) => (
          <BrutalCard key={i} color={s.c} padding={18} style={{ color: s.dark ? '#fff' : KC_COLORS.ink }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.8 }}>{s.l}</div>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1, margin: '6px 0 6px' }}>{s.v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{s.t}</div>
          </BrutalCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Top matches preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: 0 }}>Top 3 Match Hari Ini</h2>
            <a style={{ fontSize: 12, fontWeight: 800, color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer' }}>Lihat semua 5 →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { rank: 1, score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', companyColor: '#2EAA00', location: 'Jakarta · Hybrid', salary: 'Rp 28-42jt', exp: '4-7 thn', type: 'Full-time', tags: ['Go', 'PostgreSQL', 'gRPC'], gap: ['Kafka'], reason: 'Pengalaman scale 100K RPS-mu match banget sama kebutuhan tim payment-nya.' },
              { rank: 2, score: 89, title: 'Tech Lead · Payments', company: 'Xendit', companyColor: '#0066FF', location: 'Jakarta · Remote', salary: 'Rp 35-50jt', exp: '6+ thn', type: 'Full-time', tags: ['Go', 'Node', 'AWS'], gap: ['Kafka', 'Terraform'] },
              { rank: 3, score: 85, title: 'Staff Engineer', company: 'GoTo Financial', companyColor: '#00AA13', location: 'Jakarta · Hybrid', salary: 'Rp 40-60jt', exp: '7+ thn', type: 'Full-time', tags: ['Microservices', 'K8s'], gap: ['Redis'] },
            ].map(j => <JobMatchCard key={j.rank} {...j}/>)}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile completion */}
          <BrutalCard color="#fff" padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Kelengkapan Profil</h3>
              <span style={{ fontSize: 18, fontWeight: 900, color: KC_COLORS.orange }}>78%</span>
            </div>
            <div style={{ height: 10, background: KC_COLORS.ash, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ width: '78%', height: '100%', background: `repeating-linear-gradient(45deg, ${KC_COLORS.orange} 0 8px, ${KC_COLORS.orangeDeep} 8px 16px)` }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['CV uploaded', true], ['Skills (14)', true], ['Verifikasi KTP', true], ['Verifikasi Ijazah', false], ['Portfolio link', false]].map(([l, ok], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: ok ? KC_COLORS.ink : KC_COLORS.mute }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: ok ? KC_COLORS.lime : '#fff', border: `1.5px solid ${KC_COLORS.ink}`, display: 'grid', placeItems: 'center' }}>{ok && <Icon.Check s={12}/>}</span>
                  {l}
                </div>
              ))}
            </div>
          </BrutalCard>

          {/* Verification reminder */}
          <BrutalCard color={KC_COLORS.orange} padding={18} style={{ color: '#fff' }}>
            <Icon.Shield s={24} c="#fff"/>
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 6px' }}>Verifikasi ijazah biar dapet badge ✓</h3>
            <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.5, margin: 0 }}>Profil terverifikasi 3x lebih sering di-shortlist HR. Data terenkripsi.</p>
            <BrutalButton size="sm" variant="secondary" full style={{ marginTop: 12, boxShadow: `3px 3px 0 ${KC_COLORS.ink}` }}>Mulai Verifikasi</BrutalButton>
          </BrutalCard>

          {/* Advisor CTA */}
          <BrutalCard color={KC_COLORS.cyan} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: '#fff', border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center' }}><Icon.Robot s={18}/></div>
              <div style={{ fontSize: 11, fontWeight: 800, color: KC_COLORS.ink, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>career advisor</div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>"Buat resume yang lebih kuat di section Kafka & event-driven systems."</p>
            <a style={{ fontSize: 11, fontWeight: 800, color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer', marginTop: 8, display: 'inline-block' }}>Lanjut chat →</a>
          </BrutalCard>
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MATCH RESULTS — full top 5 with filters
function SeekerMatches() {
  return (
    <AppShell active="match" role="seeker" height={900}>
      <TopBar
        title="Top 5 Match Untukmu"
        subtitle="Di-rank pakai Gemini text-embedding-004 + LLM reranker · Updated 2 jam lalu"
        right={
          <>
            <button style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.Filter s={14}/> Filter</button>
            <BrutalButton variant="accent" size="md" icon={<Icon.Sparkle s={14} c="#fff"/>}>Re-match</BrutalButton>
          </>
        }
      />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { l: 'Semua', on: true },
          { l: 'Jakarta', on: false },
          { l: 'Remote-friendly', on: false },
          { l: '> Rp 25jt', on: false },
          { l: 'Backend', on: true },
          { l: 'Pengalaman 5+ thn', on: false },
        ].map(c => (
          <button key={c.l} style={{
            padding: '8px 14px', borderRadius: 999,
            background: c.on ? KC_COLORS.ink : '#fff', color: c.on ? '#fff' : KC_COLORS.ink,
            border: `2px solid ${KC_COLORS.ink}`, fontSize: 12, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: c.on ? `2px 2px 0 ${KC_COLORS.orange}` : 'none',
          }}>
            {c.l} {c.on && '×'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { rank: 1, score: 92, title: 'Senior Backend Engineer', company: 'Tokopedia', companyColor: '#2EAA00', location: 'Jakarta · Hybrid', salary: 'Rp 28-42jt', exp: '4-7 thn', type: 'Full-time', tags: ['Go', 'PostgreSQL', 'gRPC', 'Microservices'], gap: ['Kafka'], reason: 'Pengalaman scale 100K RPS-mu match banget sama tim payment. Bahasa Go di CV terkonfirmasi dari 3 proyek terakhir.' },
          { rank: 2, score: 89, title: 'Tech Lead · Payments Infrastructure', company: 'Xendit', companyColor: '#0066FF', location: 'Jakarta · Remote', salary: 'Rp 35-50jt', exp: '6+ thn', type: 'Full-time', tags: ['Go', 'Node', 'AWS', 'PostgreSQL'], gap: ['Kafka', 'Terraform'], reason: 'Cocok dari sisi domain fintech & leadership. Stack overlap 85% kecuali Kafka.' },
          { rank: 3, score: 85, title: 'Staff Engineer', company: 'GoTo Financial', companyColor: '#00AA13', location: 'Jakarta · Hybrid', salary: 'Rp 40-60jt', exp: '7+ thn', type: 'Full-time', tags: ['Microservices', 'K8s', 'Go'], gap: ['Redis'] },
          { rank: 4, score: 81, title: 'Backend Lead · Wealth', company: 'Bibit', companyColor: '#00C868', location: 'Jakarta · Hybrid', salary: 'Rp 30-45jt', exp: '5+ thn', type: 'Full-time', tags: ['Node', 'TypeScript'], gap: ['Go', 'gRPC'] },
          { rank: 5, score: 78, title: 'Sr. Software Engineer', company: 'Ruangguru', companyColor: '#3F51B5', location: 'Jakarta · Remote', salary: 'Rp 25-38jt', exp: '4+ thn', type: 'Full-time', tags: ['Node', 'PostgreSQL'], gap: ['Go', 'K8s'] },
        ].map(j => <JobMatchCard key={j.rank} {...j}/>)}
      </div>

      <div style={{ marginTop: 20, padding: 14, background: '#fff', border: `2px dashed ${KC_COLORS.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC_COLORS.mute }}>
        Hanya 5 hasil teratas yang ditampilkan. <a style={{ color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer' }}>Upgrade ke Pro</a> buat akses top-20 + insight mingguan.
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SKELETON — while Gemini is matching
function SeekerMatchingSkeleton() {
  return (
    <AppShell active="match" role="seeker" height={900}>
      <TopBar
        title="AI lagi nyari yang cocok…"
        subtitle="Gemini embed CV-mu, bandingin sama 12.480 lowongan aktif"
        right={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: KC_COLORS.lime, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: KC_COLORS.ink, animation: 'kcBlink 1s infinite' }}/> ESTIMASI 8 DETIK
          </div>
        }
      />

      {/* Stage indicator */}
      <BrutalCard color="#fff" padding={20} style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { l: 'Parse CV', ok: true, dur: '1.2s' },
            { l: 'Embed profil', ok: true, dur: '2.4s' },
            { l: 'Vector search', loading: true, dur: '~3s' },
            { l: 'LLM rerank', dur: 'queue' },
          ].map((st, i) => (
            <div key={i} style={{ padding: 14, background: st.ok ? KC_COLORS.lime : (st.loading ? KC_COLORS.yellow : KC_COLORS.bone), border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {st.ok && <div style={{ width: 22, height: 22, background: KC_COLORS.ink, color: '#fff', borderRadius: 6, display: 'grid', placeItems: 'center' }}><Icon.Check s={14} c="#fff"/></div>}
                {st.loading && <div style={{ width: 22, height: 22, border: `3px solid ${KC_COLORS.ink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'kcSpin 0.9s linear infinite' }}/>}
                {!st.ok && !st.loading && <div style={{ width: 22, height: 22, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 6 }}/>}
                <div style={{ fontSize: 13, fontWeight: 900 }}>{st.l}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: KC_COLORS.mute, marginTop: 6, fontFamily: '"JetBrains Mono", monospace' }}>{st.dur}</div>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Skeleton cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <BrutalCard key={i} color="#fff" padding={20}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(110deg, ${KC_COLORS.ash} 30%, ${KC_COLORS.bone} 50%, ${KC_COLORS.ash} 70%)`, backgroundSize: '200% 100%', animation: 'kcShimmer 1.6s infinite', border: `2px solid ${KC_COLORS.ink}` }}/>
              <div>
                <div style={{ width: 100, height: 14, background: `linear-gradient(110deg, ${KC_COLORS.ash} 30%, ${KC_COLORS.bone} 50%, ${KC_COLORS.ash} 70%)`, backgroundSize: '200% 100%', animation: 'kcShimmer 1.6s infinite', borderRadius: 6, marginBottom: 10 }}/>
                <div style={{ width: '60%', height: 22, background: `linear-gradient(110deg, ${KC_COLORS.ash} 30%, ${KC_COLORS.bone} 50%, ${KC_COLORS.ash} 70%)`, backgroundSize: '200% 100%', animation: 'kcShimmer 1.6s infinite', borderRadius: 6, marginBottom: 12 }}/>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[50, 70, 60, 80].map((w, j) => <div key={j} style={{ width: w, height: 12, background: `linear-gradient(110deg, ${KC_COLORS.ash} 30%, ${KC_COLORS.bone} 50%, ${KC_COLORS.ash} 70%)`, backgroundSize: '200% 100%', animation: 'kcShimmer 1.6s infinite', borderRadius: 999 }}/>)}
                </div>
              </div>
              <div style={{ width: 90, height: 38, background: `linear-gradient(110deg, ${KC_COLORS.ash} 30%, ${KC_COLORS.bone} 50%, ${KC_COLORS.ash} 70%)`, backgroundSize: '200% 100%', animation: 'kcShimmer 1.6s infinite', borderRadius: 8 }}/>
            </div>
          </BrutalCard>
        ))}
      </div>

      <style>{`
        @keyframes kcShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes kcSpin { to { transform: rotate(360deg) } }
        @keyframes kcBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SKILL GAP — bento grid of courses
function SeekerSkillGap() {
  return (
    <AppShell active="skillgap" role="seeker" height="auto">
      <TopBar
        title="Skill Gap untuk role kamu"
        subtitle="Berdasarkan gap antara CV-mu dengan top-5 lowongan. Kursus dirank by relevance × harga × waktu."
        right={
          <button style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>Target: Senior Backend</button>
        }
      />

      {/* Gap analysis row */}
      <BrutalCard color={KC_COLORS.ink} padding={20} style={{ color: '#fff', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 24, alignItems: 'center' }}>
          <div>
            <Tag color={KC_COLORS.orange} ink="#fff">analisis Gemini</Tag>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: '10px 0 4px' }}>Tutup 3 skill ini → match-mu naik dari 87% → 96%</h3>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Estimasi total: 38 jam belajar · Rp 0 (semua opsi gratis tersedia)</p>
          </div>
          {[
            { l: 'Kafka', d: 'event streaming', c: KC_COLORS.orange },
            { l: 'Terraform', d: 'IaC', c: KC_COLORS.cyan },
            { l: 'Redis', d: 'caching', c: KC_COLORS.yellow },
          ].map(g => (
            <div key={g.l} style={{ background: '#1a1a20', border: `2px solid ${g.c}`, borderRadius: 10, padding: '10px 14px', minWidth: 100 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: g.c }}>{g.l}</div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{g.d}</div>
            </div>
          ))}
        </div>
      </BrutalCard>

      <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '0 0 4px' }}>Kursus yang cocok</h2>
      <p style={{ fontSize: 13, color: KC_COLORS.mute, margin: '0 0 18px' }}>Dipilih dari Prakerja, Dicoding, Coursera, RevoU & YouTube curated.</p>

      {/* BENTO GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto auto', gap: 14 }}>
        {/* Big featured course */}
        <BrutalCard color={KC_COLORS.orange} padding={22} style={{ gridColumn: 'span 2', gridRow: 'span 2', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tag color="#fff" ink={KC_COLORS.ink}>★ recommended</Tag>
            <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>Dicoding</span>
          </div>
          <h3 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 18 }}>Kafka untuk Backend Engineer Indonesia</h3>
          <p style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.55, marginTop: 10 }}>
            Event streaming dari nol: producer, consumer, partition, schema registry. Studi kasus payment + e-commerce.
            Final project: bikin order-event-bus.
          </p>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, marginTop: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Clock s={12} c="#fff"/> 14 jam</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Star s={12} c="#fff" f="#fff"/> 4.8 (1.2k)</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Cash s={12} c="#fff"/> Rp 0 · Prakerja</span>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', gap: 10 }}>
            <BrutalButton variant="secondary" size="md" icon={<Icon.Arrow s={14}/>}>Mulai Belajar</BrutalButton>
            <BrutalButton variant="ghost" size="md" style={{ color: '#fff' }}>Detail kurikulum</BrutalButton>
          </div>
        </BrutalCard>

        {/* Medium course - Kafka deep */}
        <BrutalCard color={KC_COLORS.cyan} padding={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Tag color="#fff" size="sm">Coursera</Tag>
            <span style={{ fontSize: 18, fontWeight: 900 }}>4.7</span>
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '0 0 6px' }}>Kafka Series · Apache Foundation</h4>
          <p style={{ fontSize: 12, fontWeight: 600, color: KC_COLORS.ink, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>Dasar sampai advance, English.</p>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
            <span><Icon.Clock s={11}/> 18 jam</span>
            <span>Rp 450k</span>
          </div>
        </BrutalCard>

        {/* YouTube curated */}
        <BrutalCard color={KC_COLORS.lime} padding={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Tag color="#fff" size="sm">YouTube</Tag>
            <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 6px', background: '#fff', border: `1px solid ${KC_COLORS.ink}`, borderRadius: 4 }}>FREE</span>
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '0 0 6px' }}>Kafka in 100 Seconds (Fireship)</h4>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Quick overview · 1 jam playlist.</p>
          <div style={{ fontSize: 11, fontWeight: 700 }}><Icon.Eye s={11}/> 2.4M views</div>
        </BrutalCard>

        {/* Terraform course */}
        <BrutalCard color={KC_COLORS.yellow} padding={18} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 70, height: 70, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: KC_COLORS.ink }}>TF</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Tag color="#fff" size="sm">HashiCorp · RevoU</Tag>
                <span style={{ fontSize: 18, fontWeight: 900 }}>4.9</span>
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '8px 0 6px' }}>Terraform Associate Cert Prep</h4>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.78, margin: '0 0 10px', lineHeight: 1.5 }}>Sertifikasi resmi HashiCorp. Lab AWS + GCP. 8 minggu, mentor 1-on-1.</p>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700 }}>
                <span><Icon.Clock s={11}/> 40 jam</span>
                <span><Icon.Cash s={11}/> Rp 1.8jt</span>
                <span><Icon.GraduationCap s={11}/> Sertifikat</span>
              </div>
            </div>
          </div>
        </BrutalCard>

        {/* Redis */}
        <BrutalCard color={KC_COLORS.pink} padding={18}>
          <Tag color="#fff" size="sm">Redis University</Tag>
          <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>Caching Strategies with Redis</h4>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Vendor cert · self-paced.</p>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
            <span><Icon.Clock s={11}/> 6 jam</span>
            <span>FREE</span>
          </div>
        </BrutalCard>

        {/* Bonus mentor card */}
        <BrutalCard color={KC_COLORS.ink} padding={18} style={{ color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Icon.Sparkle s={18} c={KC_COLORS.orange}/>
            <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Bonus</span>
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25, margin: '0 0 6px' }}>1-on-1 dengan ex-Tokopedia engineer</h4>
          <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>Sesi 30 menit review portofolio.</p>
          <button style={{ width: '100%', padding: '8px', background: KC_COLORS.orange, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>Book sesi</button>
        </BrutalCard>

        {/* Roadmap card */}
        <BrutalCard color="#fff" padding={18} style={{ gridColumn: 'span 2' }}>
          <Tag color={KC_COLORS.yellow}>roadmap · 6 minggu</Tag>
          <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 12px' }}>Jadwal belajar yang AI rekomendasiin</h4>
          <div style={{ display: 'flex', gap: 0 }}>
            {[
              { w: 'W1-2', t: 'Kafka basics', c: KC_COLORS.orange },
              { w: 'W3', t: 'Kafka project', c: KC_COLORS.orange },
              { w: 'W4-5', t: 'Terraform', c: KC_COLORS.cyan },
              { w: 'W6', t: 'Redis', c: KC_COLORS.pink },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '10px 6px', background: s.c, border: `1.5px solid ${KC_COLORS.ink}`, marginLeft: i ? -1 : 0, textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, fontFamily: '"JetBrains Mono", monospace' }}>{s.w}</div>
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{s.t}</div>
              </div>
            ))}
          </div>
        </BrutalCard>
      </div>

      <div style={{ height: 40 }}/>
    </AppShell>
  );
}

Object.assign(window, { SeekerDashboard, SeekerMatches, SeekerMatchingSkeleton, SeekerSkillGap });
