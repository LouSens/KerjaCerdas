/* eslint-disable */
// Employer dashboard + top 5 candidates + post-a-job + verification screen.
// Reuses AppShell from seeker.jsx (loaded in same babel scope).

// ════════════════════════════════════════════════════════════════════════════
function CandidateCard({ rank, score, name, headline, location, exp, education, current, tags = [], gap = [], reason, verified }) {
  const accent = score >= 90 ? KC_COLORS.orange : score >= 85 ? KC_COLORS.yellow : score >= 80 ? KC_COLORS.cyan : KC_COLORS.lime;
  const avatarColors = [KC_COLORS.cyan, KC_COLORS.yellow, KC_COLORS.lime, KC_COLORS.pink, KC_COLORS.orange];
  const aColor = avatarColors[(rank - 1) % avatarColors.length];

  return (
    <BrutalCard color="#fff" padding={20} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: -10, left: -10, width: 36, height: 36, background: KC_COLORS.ink, color: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14, transform: 'rotate(-4deg)', boxShadow: `2px 2px 0 ${KC_COLORS.orange}` }}>
        #{rank}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 60, height: 60, background: aColor, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 24, color: KC_COLORS.ink, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
          {name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: 0 }}>{name}</h3>
            {verified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: KC_COLORS.lime, color: KC_COLORS.ink, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, fontSize: 10, fontWeight: 900 }}><Icon.Check s={10}/> VERIFIED</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800 }}>
              <ScoreDonut value={score} size={42} color={accent} label=""/>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: KC_COLORS.mute, marginBottom: 8 }}>{headline}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700, color: KC_COLORS.mute, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.MapPin s={12}/> {location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Clock s={12}/> {exp}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.GraduationCap s={12}/> {education}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Briefcase s={12}/> {current}</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {tags.map(t => <Tag key={t} color={KC_COLORS.lime} size="sm">{t}</Tag>)}
            {gap.map(t => <Tag key={t} color={KC_COLORS.orangeSoft} size="sm">{t} (gap)</Tag>)}
          </div>

          {reason && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: KC_COLORS.bone, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: KC_COLORS.ink, display: 'flex', gap: 8 }}>
              <Icon.Sparkle s={14} c={KC_COLORS.orange}/>
              <span><b>AI · </b>{reason}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={{ width: 38, height: 38, background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 9, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.Bookmark s={16}/></button>
          <BrutalButton variant="accent" size="sm" icon={<Icon.Arrow s={14} c="#fff"/>}>Hubungi</BrutalButton>
        </div>
      </div>
    </BrutalCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
function EmployerDashboard() {
  return (
    <AppShell active="dashboard" role="employer" height={900}>
      <TopBar
        title="Halo, PT Xendit 👋"
        subtitle="4 lowongan aktif · 287 lamaran masuk · Top kandidat di-refresh tiap 6 jam"
        right={
          <>
            <button style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.ChartBar s={14}/> Metrik</button>
            <BrutalButton variant="accent" size="md" icon={<Icon.Plus s={14} c="#fff"/>}>Pasang Lowongan</BrutalButton>
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { l: 'Lowongan Aktif', v: '4', t: '/ 10 quota (Growth)', c: KC_COLORS.ink, dark: true },
          { l: 'Total Lamaran', v: '287', t: '+34 minggu ini', c: KC_COLORS.cyan },
          { l: 'Top-5 Diakses', v: '23×', t: 'plan: ∞ (Growth)', c: KC_COLORS.yellow },
          { l: 'Time-to-Hire', v: '12d', t: '↓ 8d vs rata-rata', c: KC_COLORS.lime },
        ].map((s, i) => (
          <BrutalCard key={i} color={s.c} padding={18} style={{ color: s.dark ? '#fff' : KC_COLORS.ink }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.8 }}>{s.l}</div>
            <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1, margin: '6px 0 6px' }}>{s.v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{s.t}</div>
          </BrutalCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Active jobs list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: 0 }}>Lowongan Aktif Saya</h2>
            <a style={{ fontSize: 12, fontWeight: 800, color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer' }}>Lihat semua →</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { t: 'Senior Backend Engineer', loc: 'Jakarta · Hybrid', sal: 'Rp 28-42jt', d: 3, app: 84, top: 5, status: 'live', age: '5 hari' },
              { t: 'Product Designer', loc: 'Jakarta · Remote', sal: 'Rp 18-26jt', d: 7, app: 142, top: 5, status: 'live', age: '12 hari' },
              { t: 'Tech Lead · Payments', loc: 'Jakarta · Hybrid', sal: 'Rp 35-50jt', d: 1, app: 38, top: 5, status: 'live', age: '2 hari' },
              { t: 'QA Automation Engineer', loc: 'Bandung · Onsite', sal: 'Rp 15-22jt', d: 14, app: 23, top: 4, status: 'draft', age: '—' },
            ].map((j, i) => (
              <BrutalCard key={i} color="#fff" padding={16}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', gap: 18, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{j.t}</h4>
                      {j.status === 'live' && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: KC_COLORS.lime, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, letterSpacing: 0.6 }}>● LIVE</span>}
                      {j.status === 'draft' && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: KC_COLORS.ash, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, letterSpacing: 0.6 }}>DRAFT</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: KC_COLORS.mute, marginTop: 4 }}>{j.loc} · {j.sal} · {j.age}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{j.app}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: KC_COLORS.mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>lamaran</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '4px 10px', background: KC_COLORS.orange, color: '#fff', border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{j.top}</div>
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>top match</div>
                  </div>
                  <BrutalButton variant="secondary" size="sm">Detail</BrutalButton>
                  <BrutalButton variant="primary" size="sm" icon={<Icon.User s={12} c="#fff"/>}>Kandidat</BrutalButton>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Plan card */}
          <BrutalCard color={KC_COLORS.yellow} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase' }}>Plan saat ini</span>
              <Tag color={KC_COLORS.ink} ink="#fff" size="sm">GROWTH</Tag>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: '8px 0 4px' }}>Rp 1.5jt<span style={{ fontSize: 13, fontWeight: 700, color: KC_COLORS.mute }}>/bulan</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lowongan</span><span><b>4</b> / 10</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Top-N kandidat</span><span><b>Top-10</b></span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>API access</span><span>—</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ATS Integration</span><span>—</span></div>
            </div>
            <BrutalButton size="sm" variant="primary" full style={{ marginTop: 12, fontSize: 12 }}>Upgrade ke Scale →</BrutalButton>
          </BrutalCard>

          {/* Application heatmap */}
          <BrutalCard color="#fff" padding={18}>
            <h3 style={{ fontSize: 14, fontWeight: 900, margin: '0 0 4px' }}>Lamaran Masuk · 14 hari</h3>
            <div style={{ fontSize: 11, fontWeight: 700, color: KC_COLORS.mute, marginBottom: 12 }}>Total <b>+92</b> · puncak hari Selasa</div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 70 }}>
              {[12, 8, 15, 22, 18, 6, 4, 11, 9, 14, 21, 17, 7, 5].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${(h / 22) * 100}%`, background: h > 18 ? KC_COLORS.orange : KC_COLORS.cyan, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 4 }}/>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: KC_COLORS.mute, marginTop: 8, fontFamily: '"JetBrains Mono", monospace' }}>
              <span>−14d</span><span>today</span>
            </div>
          </BrutalCard>

          {/* Verification */}
          <BrutalCard color={KC_COLORS.lime} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon.Check s={20}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>NPWP Terverifikasi</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>Diverifikasi 12 Mei · valid hingga 2027</div>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TOP 5 CANDIDATES VIEW
function EmployerCandidates() {
  return (
    <AppShell active="candidates" role="employer" height={900}>
      <TopBar
        title="Top 5 Kandidat"
        subtitle="Untuk: Senior Backend Engineer · 84 lamaran di-rank oleh Gemini"
        right={
          <>
            <select style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
              <option>Senior Backend Engineer (84)</option>
              <option>Product Designer (142)</option>
              <option>Tech Lead · Payments (38)</option>
            </select>
            <BrutalButton variant="accent" size="md" icon={<Icon.Sparkle s={14} c="#fff"/>}>Re-match AI</BrutalButton>
          </>
        }
      />

      {/* Quick filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { l: 'All (84)', on: true },
          { l: '✓ Verified KTP', on: true },
          { l: '✓ Ijazah verified', on: false },
          { l: '> 5 thn exp', on: false },
          { l: 'Jakarta', on: false },
          { l: 'Remote ok', on: false },
        ].map(c => (
          <button key={c.l} style={{
            padding: '8px 14px', borderRadius: 999,
            background: c.on ? KC_COLORS.ink : '#fff', color: c.on ? '#fff' : KC_COLORS.ink,
            border: `2px solid ${KC_COLORS.ink}`, fontSize: 12, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: c.on ? `2px 2px 0 ${KC_COLORS.orange}` : 'none',
          }}>
            {c.l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { rank: 1, score: 94, name: 'Rina Pertiwi', headline: 'Senior Backend Engineer · 6 thn exp', location: 'Jakarta', exp: '6 thn', education: 'S1 ITB', current: 'Bukalapak', tags: ['Go', 'PostgreSQL', 'gRPC', 'Kafka', 'K8s'], gap: [], reason: 'Stack 100% overlap. Pengalaman scale di e-commerce. Pernah handle 100K RPS di Bukalapak payment.', verified: true },
          { rank: 2, score: 91, name: 'Andika Pratama', headline: 'Backend Lead · 7 thn exp', location: 'Jakarta', exp: '7 thn', education: 'S1 UI', current: 'Bibit', tags: ['Go', 'PostgreSQL', 'Redis', 'gRPC'], gap: ['Kafka'], reason: 'Pengalaman fintech kuat, leadership track record di Bibit. Sedikit gap di Kafka tapi pakai NATS.', verified: true },
          { rank: 3, score: 87, name: 'Sari Ningrum', headline: 'Staff Backend · 8 thn exp', location: 'Bandung', exp: '8 thn', education: 'S1 ITB', current: 'GoTo', tags: ['Go', 'Microservices', 'K8s'], gap: ['gRPC'], verified: true },
          { rank: 4, score: 83, name: 'Bayu Wicaksono', headline: 'Senior SWE · 5 thn exp', location: 'Jakarta · willing remote', exp: '5 thn', education: 'S1 UGM', current: 'Tokopedia', tags: ['Go', 'PostgreSQL', 'gRPC'], gap: ['Kafka', 'K8s'], verified: true },
          { rank: 5, score: 80, name: 'Mira Anggraini', headline: 'Backend Engineer · 4 thn exp', location: 'Jakarta', exp: '4 thn', education: 'S1 ITS', current: 'Xendit (in)', tags: ['Node', 'TypeScript', 'PostgreSQL'], gap: ['Go', 'gRPC'], verified: false },
        ].map(c => <CandidateCard key={c.rank} {...c}/>)}
      </div>

      <div style={{ marginTop: 20, padding: 14, background: '#fff', border: `2px dashed ${KC_COLORS.ink}`, borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: KC_COLORS.mute }}>
        Plan Growth: top-10. Sisanya 79 kandidat dengan score &lt; 80. <a style={{ color: KC_COLORS.ink, textDecoration: 'underline', cursor: 'pointer' }}>Upgrade ke Scale</a> buat top-50.
      </div>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// POST A JOB
function EmployerPostJob() {
  return (
    <AppShell active="post" role="employer" height="auto">
      <TopBar
        title="Pasang Lowongan Baru"
        subtitle="AI bantu re-rank kandidat berdasarkan deskripsi yang kamu tulis. Makin spesifik makin akurat."
        right={
          <>
            <BrutalButton variant="secondary" size="md">Simpan Draft</BrutalButton>
            <BrutalButton variant="accent" size="md" icon={<Icon.Arrow s={14} c="#fff"/>}>Publish</BrutalButton>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Form */}
        <BrutalCard color="#fff" padding={28}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>1. Detail Posisi</h2>
          <p style={{ fontSize: 12, color: KC_COLORS.mute, margin: '0 0 18px' }}>Info dasar yang muncul di kartu lowongan.</p>

          <Field label="Judul Posisi" placeholder="Contoh: Senior Backend Engineer"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Departemen" placeholder="Engineering"/>
            <Field label="Level" placeholder="Senior · 5-8 thn"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="Lokasi" placeholder="Jakarta" icon={<Icon.MapPin s={14}/>}/>
            <Field label="Tipe Kerja" placeholder="Hybrid"/>
            <Field label="Gaji (Rp/bulan)" placeholder="28000000 - 42000000" icon={<Icon.Cash s={14}/>}/>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 900, margin: '24px 0 4px' }}>2. Deskripsi & Skill</h2>
          <p style={{ fontSize: 12, color: KC_COLORS.mute, margin: '0 0 18px' }}>AI baca ini buat ranking kandidat. Tulis se-detail mungkin.</p>

          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Deskripsi Lengkap</label>
          <div style={{ position: 'relative' }}>
            <textarea defaultValue={'Kami cari Senior Backend Engineer untuk join tim Payments Infrastructure. Kamu akan handle scale 100K+ RPS, design event-driven architecture pakai Kafka, dan bareng tim Platform bikin internal SDK untuk semua product engineer.\n\nIdeal candidate:\n- 5+ tahun pengalaman backend (Go preferred, Node ok)\n- Pernah scale system to >10K RPS\n- Familiar dengan Kafka/NATS atau message queue lain\n- Comfortable dengan gRPC, PostgreSQL, Redis'}
              style={{ width: '100%', minHeight: 180, padding: 14, background: KC_COLORS.bone, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10, fontSize: 13, fontFamily: 'inherit', fontWeight: 600, color: KC_COLORS.ink, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}/>
            <button style={{ position: 'absolute', right: 12, bottom: 12, padding: '6px 12px', background: KC_COLORS.orange, color: '#fff', border: `2px solid ${KC_COLORS.ink}`, borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}>
              <Icon.Sparkle s={12} c="#fff"/> Rewrite by AI
            </button>
          </div>

          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 }}>Required Skills</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 10, background: KC_COLORS.bone, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 10 }}>
            {['Go', 'PostgreSQL', 'gRPC', 'Kafka', 'Microservices', 'K8s'].map(s => (
              <span key={s} style={{ padding: '6px 10px', background: KC_COLORS.lime, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{s} <span style={{ cursor: 'pointer' }}>×</span></span>
            ))}
            <input placeholder="+ tambah skill" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', minWidth: 100, padding: '4px 6px' }}/>
          </div>
        </BrutalCard>

        {/* Live preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BrutalCard color={KC_COLORS.orange} padding={18} style={{ color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon.Eye s={18} c="#fff"/>
              <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Live Preview Kartu Kandidat</h3>
            </div>
          </BrutalCard>

          <BrutalCard color="#fff" padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: KC_COLORS.cyan, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13, color: '#fff' }}>X</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: KC_COLORS.mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>PT Xendit ✓</div>
                <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>Senior Backend Engineer</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, fontWeight: 700, color: KC_COLORS.mute, marginTop: 8 }}>
              <span><Icon.MapPin s={12}/> Jakarta · Hybrid</span>
              <span><Icon.Cash s={12}/> Rp 28-42jt</span>
              <span><Icon.Clock s={12}/> 5+ thn</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {['Go', 'PostgreSQL', 'gRPC', 'Kafka'].map(t => <Tag key={t} color={KC_COLORS.lime} size="sm">{t}</Tag>)}
            </div>
          </BrutalCard>

          {/* AI estimation */}
          <BrutalCard color={KC_COLORS.ink} padding={18} style={{ color: '#fff' }}>
            <Tag color={KC_COLORS.orange} ink="#fff" icon={<Icon.Sparkle s={11} c="#fff"/>}>AI Estimasi</Tag>
            <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, margin: '12px 0 4px' }}>Probable match pool</h3>
            <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 14px' }}>Berdasarkan skill mix & lokasi:</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ScoreDonut value={82} size={56} color={KC_COLORS.orange} label=""/>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>~340 kandidat</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>cocok &gt; 80% match score</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: '#1a1a20', border: `1.5px solid ${KC_COLORS.orange}`, borderRadius: 8, fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
              💡 Tip: kalau gaji dinaikin ke <b>Rp 35-50jt</b>, perkiraan pool naik ke <b>~620 kandidat</b>.
            </div>
          </BrutalCard>

          {/* Quota */}
          <BrutalCard color={KC_COLORS.yellow} padding={14}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Quota Lowongan</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900 }}>4 / 10</span>
              <span style={{ fontSize: 11, color: KC_COLORS.mute, fontWeight: 700 }}>plan Growth</span>
            </div>
            <div style={{ height: 8, background: '#fff', border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: '40%', height: '100%', background: KC_COLORS.orange }}/>
            </div>
          </BrutalCard>
        </div>
      </div>

      <div style={{ height: 40 }}/>
    </AppShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VERIFICATION SCREEN — works for both seeker (KTP/Ijazah) and employer (NPWP).
function VerificationScreen({ role = 'seeker' }) {
  const docs = role === 'seeker'
    ? [
        { id: 'ktp', name: 'KTP / e-KTP', desc: 'Verifikasi identitas via Dukcapil', status: 'verified', when: '12 Mei 2026', icon: <Icon.User s={28}/> },
        { id: 'ijazah', name: 'Ijazah / Transkrip', desc: 'Verifikasi pendidikan via SIVIL Dikti', status: 'pending', when: 'Diproses 1-3 hari', icon: <Icon.GraduationCap s={28}/> },
        { id: 'phone', name: 'Nomor HP', desc: 'OTP verifikasi', status: 'verified', when: '10 Mei 2026', icon: <Icon.Robot s={28}/> },
      ]
    : [
        { id: 'npwp', name: 'NPWP Perusahaan', desc: 'Verifikasi badan usaha via DJP', status: 'verified', when: '12 Mei 2026', icon: <Icon.Building s={28}/> },
        { id: 'akta', name: 'Akta Pendirian', desc: 'Verifikasi via AHU Kemenkumham', status: 'pending', when: 'Upload required', icon: <Icon.Briefcase s={28}/> },
        { id: 'domain', name: 'Email Korporat', desc: 'OTP ke @xendit.co', status: 'verified', when: '10 Mei 2026', icon: <Icon.Mail s={28}/> },
      ];

  return (
    <AppShell active="verify" role={role} height={900}>
      <TopBar
        title="Verifikasi Identitas"
        subtitle="Tingkatkan trust score. Dokumenmu terenkripsi & nggak ditampilin ke user lain — hanya buat verifikasi."
        right={<div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: KC_COLORS.lime, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC_COLORS.ink}` }}><Icon.Shield s={14}/> AES-256 encrypted</div>}
      />

      {/* Trust banner */}
      <BrutalCard color={KC_COLORS.ink} padding={24} style={{ color: '#fff', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 24, alignItems: 'center' }}>
          <div>
            <Tag color={KC_COLORS.orange} ink="#fff">data privacy</Tag>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '10px 0 6px', lineHeight: 1.15 }}>
              Dokumen-mu pribadi banget. Kami juga tau itu.
            </h3>
            <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6, maxWidth: 540, margin: 0 }}>
              Setelah verifikasi sukses, file dokumen kami simpan terenkripsi AES-256, server di Indonesia, hanya buat re-verifikasi kalau diperlukan. <b style={{ color: '#fff' }}>Nggak ditampilin ke user lain — bahkan HR / kandidat.</b> Yang kelihatan cuma badge <span style={{ background: KC_COLORS.lime, color: KC_COLORS.ink, padding: '1px 8px', borderRadius: 4, fontWeight: 900, fontSize: 12 }}>✓ VERIFIED</span>.
            </p>
          </div>
          {[
            { l: 'AES-256', d: 'at rest' },
            { l: 'IDN', d: 'data center' },
            { l: 'UU PDP', d: 'compliant' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', padding: '14px 18px', background: '#1a1a20', border: `2px solid ${KC_COLORS.orange}`, borderRadius: 10, minWidth: 100 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: KC_COLORS.orange }}>{s.l}</div>
              <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </BrutalCard>

      {/* Document cards */}
      <h2 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 14px' }}>Dokumen</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map(d => {
          const isVerified = d.status === 'verified';
          return (
            <BrutalCard key={d.id} color="#fff" padding={20}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 18, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, background: isVerified ? KC_COLORS.lime : KC_COLORS.yellow, border: `2px solid ${KC_COLORS.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', boxShadow: `3px 3px 0 ${KC_COLORS.ink}` }}>
                  {d.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{d.name}</h3>
                    {isVerified
                      ? <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: KC_COLORS.lime, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, letterSpacing: 0.6 }}>● VERIFIED</span>
                      : <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', background: KC_COLORS.yellow, border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 999, letterSpacing: 0.6 }}>PENDING</span>
                    }
                  </div>
                  <p style={{ fontSize: 12, color: KC_COLORS.mute, margin: '4px 0 0' }}>{d.desc}</p>
                </div>
                <div style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: KC_COLORS.mute }}>{d.when}</div>
                {isVerified
                  ? <BrutalButton variant="secondary" size="sm">Detail</BrutalButton>
                  : <BrutalButton variant="accent" size="sm" icon={<Icon.Arrow s={14} c="#fff"/>}>{d.id === 'akta' ? 'Upload' : 'Cek status'}</BrutalButton>
                }
              </div>
              {/* The "hidden" preview affordance */}
              {isVerified && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: KC_COLORS.bone, border: `1.5px dashed ${KC_COLORS.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: KC_COLORS.mute }}>
                  <Icon.Lock s={14}/>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>file_id: doc_3f8a··········e91c · status: encrypted · not_visible_to_other_users</span>
                  <button style={{ marginLeft: 'auto', padding: '4px 8px', background: '#fff', border: `1.5px solid ${KC_COLORS.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Hapus dokumen</button>
                </div>
              )}
            </BrutalCard>
          );
        })}
      </div>
    </AppShell>
  );
}

Object.assign(window, { EmployerDashboard, EmployerCandidates, EmployerPostJob, VerificationScreen, CandidateCard });
