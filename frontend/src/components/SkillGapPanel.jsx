import { useEffect } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag } from './_design'

export default function SkillGapPanel() {
    const { missingSkills, recommendedCourses, runAgent, agentLoading } = useStore()

    useEffect(() => {
        if (!missingSkills.length && !agentLoading) {
            runAgent({ message: 'analyze my skill gap for top matches' })
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const gaps = (missingSkills.length ? missingSkills : ['Kafka', 'Terraform', 'Redis']).slice(0, 3)
    const courses = recommendedCourses.length ? recommendedCourses : DEMO_COURSES

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Skill Gap untuk role kamu</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Berdasarkan gap CV-mu dengan top-5 lowongan. Kursus dirank by relevance × harga × waktu.
                    </p>
                </div>
                <button style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    Target: Senior Backend
                </button>
            </header>

            {/* Gap analysis row */}
            <BrutalCard color={KC.ink} padding={20} style={{ color: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${gaps.length}, auto)`, gap: 24, alignItems: 'center' }}>
                    <div>
                        <Tag color={KC.orange} ink="#fff">analisis Gemini</Tag>
                        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.6, margin: '10px 0 4px' }}>
                            Tutup {gaps.length} skill ini → match-mu naik dari 87% → 96%
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Estimasi total: 38 jam belajar · Rp 0 (semua opsi gratis tersedia)</p>
                    </div>
                    {gaps.map((g, i) => {
                        const c = [KC.orange, KC.cyan, KC.yellow][i % 3]
                        const d = ['event streaming', 'IaC', 'caching'][i % 3]
                        return (
                            <div key={g} style={{ background: '#1a1a20', border: `2px solid ${c}`, borderRadius: 10, padding: '10px 14px', minWidth: 100 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: c }}>{g}</div>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{d}</div>
                            </div>
                        )
                    })}
                </div>
            </BrutalCard>

            <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '0 0 4px' }}>Kursus yang cocok</h2>
                <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 18px' }}>Dipilih dari Prakerja, Dicoding, Coursera, RevoU & YouTube curated.</p>
            </div>

            {/* BENTO GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(160px, auto)', gap: 14 }}>
                {/* Featured course */}
                <BrutalCard color={KC.orange} padding={22} style={{ gridColumn: 'span 2', gridRow: 'span 2', color: '#fff', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Tag color="#fff" ink={KC.ink}>★ recommended</Tag>
                        <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>{courses[0]?.provider || 'Dicoding'}</span>
                    </div>
                    <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 18 }}>
                        {courses[0]?.title || 'Kafka untuk Backend Engineer Indonesia'}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.55, marginTop: 10 }}>
                        {courses[0]?.description || 'Event streaming dari nol: producer, consumer, partition, schema registry. Studi kasus payment + e-commerce.'}
                    </p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, marginTop: 14 }}>
                        <span>⏱ {courses[0]?.duration_hours || 14} jam</span>
                        <span>★ {courses[0]?.rating || 4.8}</span>
                        <span>💰 {courses[0]?.price || 'Rp 0 · Prakerja'}</span>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                        <button style={{ padding: '12px 20px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                            Mulai Belajar →
                        </button>
                    </div>
                </BrutalCard>

                <BrutalCard color={KC.cyan} padding={18}>
                    <Tag color="#fff" size="sm">Coursera</Tag>
                    <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>Kafka Series · Apache Foundation</h4>
                    <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Dasar sampai advance, English.</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
                        <span>⏱ 18 jam</span><span>Rp 450k</span>
                    </div>
                </BrutalCard>

                <BrutalCard color={KC.lime} padding={18}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Tag color="#fff" size="sm">YouTube</Tag>
                        <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 6px', background: '#fff', border: `1px solid ${KC.ink}`, borderRadius: 4 }}>FREE</span>
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '0 0 6px' }}>Kafka in 100 Seconds (Fireship)</h4>
                    <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Quick overview · 1 jam playlist.</p>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>👁 2.4M views</div>
                </BrutalCard>

                <BrutalCard color={KC.yellow} padding={18} style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 70, height: 70, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 900 }}>TF</div>
                        <div style={{ flex: 1 }}>
                            <Tag color="#fff" size="sm">HashiCorp · RevoU</Tag>
                            <h4 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '8px 0 6px' }}>Terraform Associate Cert Prep</h4>
                            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.78, margin: '0 0 10px', lineHeight: 1.5 }}>Sertifikasi resmi HashiCorp. Lab AWS + GCP. 8 minggu, mentor 1-on-1.</p>
                            <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700 }}>
                                <span>⏱ 40 jam</span><span>💰 Rp 1.8jt</span><span>🎓 Sertifikat</span>
                            </div>
                        </div>
                    </div>
                </BrutalCard>

                <BrutalCard color={KC.pink} padding={18}>
                    <Tag color="#fff" size="sm">Redis University</Tag>
                    <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>Caching Strategies with Redis</h4>
                    <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Vendor cert · self-paced.</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
                        <span>⏱ 6 jam</span><span>FREE</span>
                    </div>
                </BrutalCard>

                <BrutalCard color={KC.ink} padding={18} style={{ color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ color: KC.orange, fontSize: 18 }}>✨</span>
                        <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Bonus</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25, margin: '0 0 6px' }}>1-on-1 dengan ex-Tokopedia engineer</h4>
                    <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>Sesi 30 menit review portofolio.</p>
                    <button style={{ width: '100%', padding: 8, background: KC.orange, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>Book sesi</button>
                </BrutalCard>

                <BrutalCard color="#fff" padding={18} style={{ gridColumn: 'span 2' }}>
                    <Tag color={KC.yellow}>roadmap · 6 minggu</Tag>
                    <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 12px' }}>Jadwal belajar yang AI rekomendasiin</h4>
                    <div style={{ display: 'flex' }}>
                        {[
                            { w: 'W1-2', t: 'Kafka basics', c: KC.orange },
                            { w: 'W3', t: 'Kafka project', c: KC.orange },
                            { w: 'W4-5', t: 'Terraform', c: KC.cyan },
                            { w: 'W6', t: 'Redis', c: KC.pink },
                        ].map((s, i) => (
                            <div key={i} style={{ flex: 1, padding: '10px 6px', background: s.c, border: `1.5px solid ${KC.ink}`, marginLeft: i ? -1 : 0, textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>{s.w}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{s.t}</div>
                            </div>
                        ))}
                    </div>
                </BrutalCard>
            </div>
        </div>
    )
}

const DEMO_COURSES = [
    { title: 'Kafka untuk Backend Engineer Indonesia', provider: 'Dicoding', duration_hours: 14, rating: 4.8, price: 'Rp 0 · Prakerja', description: 'Event streaming dari nol: producer, consumer, partition, schema registry.' },
]
