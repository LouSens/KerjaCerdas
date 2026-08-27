import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'
import { BookOpen, Sparkles, TrendingUp, CheckCircle2, AlertCircle, ExternalLink, GraduationCap, Award, Clock, Star } from 'lucide-react'

const MOCK_COURSES = [
    {
        name: 'Membangun Arsitektur Back-End Skala Enterprise',
        provider: 'Dicoding Academy',
        duration: '40 Jam Belajar',
        rating: 4.9,
        price: 'Gratis / Beasiswa',
        description: 'Kurikulum resmi pembangunan REST & gRPC API, caching Redis, dan arsitektur database relasional PostgreSQL untuk standar industri.',
        url: 'https://www.dicoding.com',
        targetSkill: 'Go & Microservices',
    },
    {
        name: 'Cloud Infrastructure & DevOps Essentials',
        provider: 'Dicoding Academy',
        duration: '25 Jam Belajar',
        rating: 4.8,
        price: 'Gratis',
        description: 'Fondasi orkestrasi container Kubernetes, Docker multi-stage build, serta otomatisasi pipeline CI/CD GitHub Actions.',
        url: 'https://www.dicoding.com',
        targetSkill: 'Kubernetes & CI/CD',
    },
    {
        name: 'Data Engineering & Stream Processing with Kafka',
        provider: 'Coursera Enterprise',
        duration: '6 Minggu',
        rating: 4.8,
        price: 'Bersertifikat',
        description: 'Spesialisasi arsitektur data streaming skala besar, event-driven design, dan integrasi distributed message queue.',
        url: 'https://www.coursera.org',
        targetSkill: 'Apache Kafka',
    },
    {
        name: 'Full-Stack Modern Web Engineering',
        provider: 'RevoU Tech Program',
        duration: '12 Minggu',
        rating: 4.8,
        price: 'Subsidi Karier',
        description: 'Bootcamp intensif dengan studi kasus riil industri: React, Next.js, Node.js, dan optimasi arsitektur frontend skala jutaan pengguna.',
        url: 'https://revou.co',
        targetSkill: 'React & TypeScript',
    },
    {
        name: 'Pelatihan Digital Prakerja — Pemrograman Lanjutan',
        provider: 'Kementerian Tenaga Kerja',
        duration: '8 Minggu',
        rating: 4.7,
        price: 'Subsidi Pemerintah',
        description: 'Program akselerasi talenta digital bersertifikasi BNSP dengan fokus pada pengembangan sistem perangkat lunak terintegrasi.',
        url: 'https://www.prakerja.go.id',
        targetSkill: 'System Design',
    },
]

export default function SkillGapPanel() {
    const { missingSkills, profile, matches, navigate } = useStore()
    const currentSkills = profile?.skills || ['Go', 'PostgreSQL', 'Docker', 'REST API']
    const gaps = missingSkills?.length ? missingSkills : ['Kubernetes', 'Apache Kafka', 'gRPC']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Skill Gap Analysis & Rekomendasi Kursus
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Analisis otomatis keselarasan keahlian terhadap kriteria lowongan incaran Anda
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="kc-btn" onClick={() => navigate('seeker-match')} style={topBtn('#fff')}>
                        ← Kembali ke Match
                    </button>
                </div>
            </header>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                {/* Current Skills */}
                <BrutalCard color="#FFFFFF" padding={22}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: KC.limeSoft, border: `1px solid ${KC.lime}`, display: 'grid', placeItems: 'center', color: KC.lime }}>
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: KC.ink }}>Keahlian Saat Ini (Verified)</h3>
                            <span style={{ fontSize: 12, color: KC.mute }}>Terdata aktif pada resume Anda</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {currentSkills.map((s, idx) => (
                            <span key={idx} style={{ padding: '5px 12px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#047857' }}>
                                ✓ {typeof s === 'string' ? s : s.name}
                            </span>
                        ))}
                    </div>
                </BrutalCard>

                {/* Missing Skills */}
                <BrutalCard color="#FFFFFF" padding={22}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, display: 'grid', placeItems: 'center', color: KC.yellow }}>
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: KC.ink }}>Skill Gaps (Peluang Peningkatan)</h3>
                            <span style={{ fontSize: 12, color: KC.mute }}>Keahlian yang paling dicari oleh rekruter</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {gaps.map((s, idx) => (
                            <span key={idx} style={{ padding: '5px 12px', background: KC.yellowSoft, border: `1px solid ${KC.yellow}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#B45309' }}>
                                + {typeof s === 'string' ? s : s.name}
                            </span>
                        ))}
                    </div>
                </BrutalCard>
            </div>

            {/* Recommended Courses Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, margin: 0, color: KC.ink }}>
                            Rekomendasi Modul & Kurikulum Terkurasi
                        </h2>
                        <p style={{ fontSize: 13, color: KC.mute, margin: '2px 0 0' }}>
                            Program pelatihan terverifikasi dari mitra institusi untuk menutup celah kompetensi
                        </p>
                    </div>
                    <Tag color={KC.indigoSoft} ink={KC.indigo} border={KC.indigo} size="sm">
                        <GraduationCap size={13} /> {MOCK_COURSES.length} Modul Tersedia
                    </Tag>
                </div>

                <div className="kc-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                    {MOCK_COURSES.map((course, idx) => (
                        <BrutalCard key={idx} color="#FFFFFF" padding={20} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>
                                        {course.provider}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: KC.limeSoft, padding: '2px 8px', borderRadius: 6, border: `1px solid ${KC.lime}` }}>
                                        {course.price}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: KC.ink, lineHeight: 1.3 }}>
                                    {course.name}
                                </h3>
                                <p style={{ fontSize: 12, color: KC.inkLight, lineHeight: 1.5, margin: '0 0 12px' }}>
                                    {course.description}
                                </p>
                            </div>

                            <div style={{ paddingTop: 12, borderTop: `1px solid ${KC.ash}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: KC.mute, fontWeight: 600 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={12} /> {course.duration}
                                    </span>
                                    <span>·</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#D97706' }}>
                                        <Star size={12} fill="#D97706" /> {course.rating}
                                    </span>
                                </div>
                                <a
                                    href={course.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="kc-btn"
                                    style={{ ...topBtn(KC.ink, '#fff'), padding: '6px 12px', fontSize: 11, textDecoration: 'none' }}
                                >
                                    Pelajari Modul <ExternalLink size={12} />
                                </a>
                            </div>
                        </BrutalCard>
                    ))}
                </div>
            </div>
        </div>
    )
}
