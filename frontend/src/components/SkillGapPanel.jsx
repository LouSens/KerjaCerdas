import { useEffect } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag } from './_design'

export default function SkillGapPanel() {
    const { missingSkills, recommendedCourses, runAgent, agentLoading } = useStore()

    useEffect(() => {
        if (!missingSkills.length && !recommendedCourses.length && !agentLoading) {
            runAgent({ explicitIntent: 'skill_gap' })
        }
    }, [missingSkills.length, recommendedCourses.length, agentLoading, runAgent]) // eslint-disable-line react-hooks/exhaustive-deps

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
                <button onClick={() => {}} style={{ padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    Target: Senior Backend
                </button>
            </header>

            {/* Gap analysis row */}
            <BrutalCard color={KC.ink} padding={20} style={{ color: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `1fr repeat(${gaps.length}, auto)`, gap: 24, alignItems: 'center' }}>
                    <div>
                        <Tag color={KC.orange} ink="#fff">Analisis AI</Tag>
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
                {/* Featured course (1st recommendation) */}
                {courses[0] && (
                    <BrutalCard color={KC.orange} padding={22} style={{ gridColumn: 'span 2', gridRow: 'span 2', color: '#fff', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Tag color="#fff" ink={KC.ink}>★ recommended</Tag>
                            <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>{courses[0].provider}</span>
                        </div>
                        <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 18 }}>
                            {courses[0].name}
                        </h3>
                        <p style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.55, marginTop: 10, flexGrow: 1 }}>
                            {courses[0].description || `Belajar materi dasar hingga tingkat lanjut mengenai ${courses[0].name} secara mendalam.`}
                        </p>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 14 }}>
                            <span>⏱ {courses[0].duration}</span>
                            <span>★ {courses[0].rating || 4.8}</span>
                            <span>💰 {courses[0].price || 'Rp 150.000'}</span>
                        </div>
                        <div style={{ paddingTop: 6 }}>
                            <button onClick={() => window.open(courses[0].url || 'https://google.com', '_blank')} style={{ padding: '12px 20px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                                Mulai Belajar →
                            </button>
                        </div>
                    </BrutalCard>
                )}

                {/* Next 2 courses (render as small cards) */}
                {courses.slice(1, 3).map((c, i) => {
                    const isYT = c.provider === 'YouTube Curated';
                    const colors = [KC.cyan, KC.lime];
                    const bg = colors[i % colors.length];
                    return (
                        <BrutalCard key={i} color={bg} padding={18} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <Tag color="#fff" size="sm">{c.provider}</Tag>
                                    {isYT && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 4 }}>FREE</span>}
                                </div>
                                <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '0 0 6px' }}>{c.name}</h4>
                                <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description || 'Kursus pilihan terbaik untuk menutup gap skill kamu.'}</p>
                            </div>
                            <div>
                                <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                                    <span>⏱ {c.duration}</span>
                                    <span>💰 {c.price || 'Rp 150k'}</span>
                                </div>
                                <button onClick={() => window.open(c.url || 'https://google.com', '_blank')} style={{ width: '100%', padding: '6px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${KC.ink}` }}>
                                    Mulai Belajar →
                                </button>
                            </div>
                        </BrutalCard>
                    );
                })}

                {/* 4th course (render as medium span 2 card) */}
                {courses[3] && (
                    <BrutalCard color={KC.yellow} padding={18} style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ width: 70, height: 70, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900 }}>
                                {courses[3].provider === 'YouTube Curated' ? '📺' : '🎓'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Tag color="#fff" size="sm">{courses[3].provider}</Tag>
                                <h4 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '8px 0 6px' }}>{courses[3].name}</h4>
                                <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.78, margin: '0 0 10px', lineHeight: 1.5 }}>
                                    {courses[3].description || 'Rekomendasi kursus dengan kurikulum komprehensif.'}
                                </p>
                                <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                                    <span>⏱ {courses[3].duration}</span>
                                    <span>💰 {courses[3].price || 'Rp 150k'}</span>
                                    <span>★ {courses[3].rating || 4.7}</span>
                                </div>
                                <button onClick={() => window.open(courses[3].url || 'https://google.com', '_blank')} style={{ padding: '6px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 11, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                                    Kunjungi Kelas →
                                </button>
                            </div>
                        </div>
                    </BrutalCard>
                )}

                {/* 5th course or default fallback */}
                {courses[4] ? (
                    <BrutalCard color={KC.pink} padding={18} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <Tag color="#fff" size="sm">{courses[4].provider}</Tag>
                            <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>{courses[4].name}</h4>
                            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{courses[4].description}</p>
                        </div>
                        <div>
                            <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
                                <span>⏱ {courses[4].duration}</span><span> {courses[4].price}</span>
                            </div>
                            <button onClick={() => window.open(courses[4].url || 'https://google.com', '_blank')} style={{ width: '100%', padding: '6px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${KC.ink}` }}>
                                Buka Kelas
                            </button>
                        </div>
                    </BrutalCard>
                ) : (
                    <BrutalCard color={KC.pink} padding={18}>
                        <Tag color="#fff" size="sm">Prakerja</Tag>
                        <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>Prakerja Indonesia</h4>
                        <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Subsidi pelatihan dari pemerintah untuk pencari kerja.</p>
                        <button onClick={() => window.open('https://www.prakerja.go.id/', '_blank')} style={{ width: '100%', padding: '6px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${KC.ink}` }}>
                            Daftar Prakerja
                        </button>
                    </BrutalCard>
                )}

                {/* 1-on-1 Booking */}
                <BrutalCard color={KC.ink} padding={18} style={{ color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ color: KC.orange, fontSize: 18 }}>✨</span>
                        <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Mentoring</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25, margin: '0 0 6px' }}>1-on-1 Review Portofolio</h4>
                    <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>Review portofolio & simulasi interview 30 menit bersama mentor expert.</p>
                    <button onClick={() => window.open('https://topmate.io', '_blank')} style={{ width: '100%', padding: 8, background: KC.orange, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>Book Sesi Mentoring</button>
                </BrutalCard>

                {/* Custom roadmap based on missing skills */}
                <BrutalCard color="#fff" padding={18} style={{ gridColumn: 'span 2' }}>
                    <Tag color={KC.yellow}>roadmap belajar</Tag>
                    <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 12px' }}>Jadwal rekomendasi untuk menutup gap-mu</h4>
                    <div style={{ display: 'flex' }}>
                        {gaps.slice(0, 4).map((skill, i) => {
                            const colors = [KC.orange, KC.cyan, KC.yellow, KC.pink];
                            const c = colors[i % colors.length];
                            return (
                                <div key={i} style={{ flex: 1, padding: '10px 6px', background: c, border: `1.5px solid ${KC.ink}`, marginLeft: i ? -1 : 0, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900 }}>W{i * 2 + 1}-{i * 2 + 2}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{skill}</div>
                                </div>
                            );
                        })}
                    </div>
                </BrutalCard>
            </div>
        </div>
    )
}

const DEMO_COURSES = [
    { name: 'Kuasai Kafka untuk Backend', provider: 'Dicoding Academy', duration: '14 jam', rating: 4.8, price: 'Rp 150.000', description: 'Event streaming dari nol: producer, consumer, partition, schema registry. Contoh studi kasus riil.' },
    { name: 'Terraform Infrastructure as Code', provider: 'YouTube Curated', duration: '6 jam', rating: 4.7, price: 'Gratis', description: 'Belajar setup provider AWS, state management, dan module Terraform dari nol.' },
    { name: 'Redis Caching Strategies', provider: 'Dicoding Academy', duration: '8 jam', rating: 4.6, price: 'Rp 150.000', description: 'Optimasi latency aplikasi web menggunakan read/write caching pattern di Redis.' },
]
