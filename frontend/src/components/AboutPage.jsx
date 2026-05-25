import { KC, BrutalCard, Tag, DesignStyles } from './_design'

export default function AboutPage() {
    return (
        <div style={{ background: KC.bone, color: KC.ink, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <DesignStyles />

            {/* ── Hero ────────────────────────────────────────────────────── */}
            <section style={{ padding: '88px 64px 56px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <Tag color={KC.yellow}>tentang kerjacerdas</Tag>
                    <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2.2, lineHeight: 1.02, margin: '20px 0 16px' }}>
                        Kenapa kami{' '}
                        <span style={{ background: KC.orange, color: '#fff', padding: '0 14px', display: 'inline-block', boxShadow: `5px 5px 0 ${KC.ink}`, border: `3px solid ${KC.ink}`, transform: 'rotate(-1.5deg)' }}>
                            bikin
                        </span>{' '}
                        platform ini?
                    </h1>
                    <p style={{ fontSize: 18, lineHeight: 1.6, color: KC.mute, maxWidth: 720 }}>
                        Karena cari kerja (dan cari kandidat) di Indonesia masih jaman batu. KerjaCerdas pakai AI semantik buat
                        ngubah ratusan jam scroll jadi top-5 match dalam 8 detik — buat dua sisi sekaligus.
                    </p>
                </div>

                {/* deco sticker */}
                <div className="kc-card" style={{
                    position: 'absolute', top: 80, right: 64, width: 140, height: 140,
                    background: KC.orange, border: `3px solid ${KC.ink}`, borderRadius: '50%',
                    transform: 'rotate(-8deg)', boxShadow: `6px 6px 0 ${KC.ink}`,
                    display: 'grid', placeItems: 'center', color: '#fff', textAlign: 'center', lineHeight: 1,
                }}>
                    <div>
                        <div style={{ fontSize: 36, fontWeight: 900 }}>87%</div>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 }}>akurasi<br />match</div>
                    </div>
                </div>
            </section>

            {/* ── Problem / Solution / Diff / Tech (4-bento) ──────────────── */}
            <section style={{ padding: '40px 64px 80px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div className="kc-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }}>
                        <Block accent={KC.pink}   label="Masalah" title="Job portal cuma keyword match." body="Indonesia punya 7 juta pengangguran dan 12 juta underemployed. HR kelelahan scroll 500 lamaran. Pencari kerja apply 80x cuma dipanggil 1." />
                        <Block accent={KC.lime}   label="Solusi" title="Embedding semantik + LLM rerank." body="CV & job desc di-embed pakai Gemini Embedding 2. Cosine similarity + LLM rerank top-K. Hasil: match yang beneran relevan, bukan asal cocok kata." />
                        <Block accent={KC.cyan}   label="Diferensiasi" title="Bukan papan lowongan, AI advisor aktif." body="Deteksi skill gap, rekomendasi kursus dari Prakerja/Dicoding/Coursera, interview prep, dan reverse-matching 2 arah (seeker ↔ HR)." />
                        <Block accent={KC.yellow} label="Teknologi" title="Gemini 3.1 + LangGraph + FastAPI." body="Gemini 3.1 Flash Lite buat chat/parsing. Gemini Embedding 2 buat vector search. LangGraph stateful agent. FastAPI + React. Supabase + pgvector di prod." />
                    </div>
                </div>
            </section>

            {/* ── Stakeholders ────────────────────────────────────────────── */}
            <section style={{ background: '#fff', padding: '80px 64px', borderTop: `2px solid ${KC.ink}` }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <Tag color={KC.cyan}>siapa diuntungkan</Tag>
                    <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1.4, margin: '14px 0 6px' }}>
                        Tiga sisi, satu loop yang sehat.
                    </h2>
                    <p style={{ fontSize: 15, color: KC.mute, maxWidth: 600, margin: '0 0 32px' }}>
                        Tiap stakeholder dapet hasil terukur — bukan janji marketing.
                    </p>
                    <div className="kc-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 18 }}>
                        <StakeholderCard who="Pencari Kerja" color={KC.cyan}
                            need="Match relevan, nggak buang waktu apply random."
                            metric="↓ 80% lamaran terbuang" />
                        <StakeholderCard who="HR / Employer" color={KC.pink}
                            need="Top kandidat ranked, tanpa scroll ratusan lamaran."
                            metric="↓ 8 hari time-to-hire" />
                        <StakeholderCard who="Platform" color={KC.yellow}
                            need="Revenue dari employer subscription + seeker pro."
                            metric="Free buat seeker, selamanya" />
                    </div>
                </div>
            </section>

            {/* ── How it scales ───────────────────────────────────────────── */}
            <section style={{ background: KC.ink, color: '#fff', padding: '72px 64px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
                    <div>
                        <Tag color={KC.orange} ink="#fff">roadmap</Tag>
                        <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.2, margin: '14px 0 12px', lineHeight: 1.1 }}>
                            Dari hackathon ke produk siap scale.
                        </h2>
                        <p style={{ fontSize: 15, opacity: 0.75, lineHeight: 1.6, maxWidth: 460 }}>
                            MVP hari ini sudah punya matching, skill gap, advisor, verifikasi, dan dashboard 2-sisi.
                            Plan investor-ready: Supabase + pgvector, multi-region inference, ATS integration, mobile PWA.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { phase: 'Now', desc: 'MVP w/ Gemini 3.1', c: KC.orange },
                            { phase: 'Q3 26', desc: 'Supabase + pgvector', c: KC.cyan },
                            { phase: 'Q4 26', desc: 'iOS/Android PWA', c: KC.lime },
                            { phase: '2027', desc: 'ATS integration', c: KC.yellow },
                        ].map((p, i) => (
                            <div key={i} className="kc-card" style={{ background: '#1a1a20', border: `2px solid ${p.c}`, borderRadius: 12, padding: 16 }}>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800, color: p.c, letterSpacing: 0.6, textTransform: 'uppercase' }}>{p.phase}</div>
                                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 6 }}>{p.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

function Block({ accent, label, title, body }) {
    return (
        <BrutalCard color="#fff" padding={26}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, background: accent, border: `2px solid ${KC.ink}`, borderRadius: 8 }} />
                <Tag color={accent}>{label}</Tag>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.15, margin: '0 0 10px' }}>{title}</h3>
            <p style={{ fontSize: 14, color: KC.mute, lineHeight: 1.6, margin: 0 }}>{body}</p>
        </BrutalCard>
    )
}

function StakeholderCard({ who, need, metric, color }) {
    return (
        <BrutalCard color="#fff" padding={22}>
            <div style={{ width: '100%', height: 6, background: color, border: `1.5px solid ${KC.ink}`, marginBottom: 14 }} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute }}>{who}</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: KC.ink, lineHeight: 1.4, margin: '6px 0 14px' }}>{need}</p>
            <Tag color={color} size="sm">{metric}</Tag>
        </BrutalCard>
    )
}
