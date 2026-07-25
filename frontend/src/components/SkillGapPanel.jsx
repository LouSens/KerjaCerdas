import { useEffect, useState, useCallback } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag } from './_design'

// ─── Rich mock data (5 courses, diverse Indonesian providers) ─────────────────
const MOCK_COURSES = [
    {
        name: 'Belajar Membuat Aplikasi Back-End untuk Pemula',
        provider: 'Dicoding',
        duration: '40 jam',
        rating: 4.9,
        price: 'Gratis',
        description: 'Kurikulum resmi Dicoding untuk membangun REST API dengan Node.js, HTTP server, dan pengelolaan data. Cocok untuk transisi ke posisi backend developer.',
        url: 'https://www.dicoding.com/academies/261',
        category: 'tech',
    },
    {
        name: 'Cloud Practitioner Essentials',
        provider: 'Dicoding',
        duration: '20 jam',
        rating: 4.8,
        price: 'Gratis',
        description: 'Fondasi AWS, GCP, dan konsep cloud computing. Persiapkan diri untuk sertifikasi cloud provider dengan kurikulum Bahasa Indonesia.',
        url: 'https://www.dicoding.com/academies/251',
        category: 'tech',
    },
    {
        name: 'Full-Stack JavaScript Intensive',
        provider: 'RevoU',
        duration: '12 minggu',
        rating: 4.8,
        price: 'Rp 2.500.000',
        description: 'Bootcamp intensif full-stack dengan jaminan kerja. Kurikulum mencakup React, Node.js, PostgreSQL, dan deployment. Mentor dari GOJEK, Tokopedia, dan Traveloka.',
        url: 'https://revou.co/courses',
        category: 'tech',
    },
    {
        name: 'Data Science & Machine Learning',
        provider: 'Coursera ID',
        duration: '3 bulan',
        rating: 4.7,
        price: 'Rp 300.000/bulan',
        description: 'Spesialisasi dari DeepLearning.AI dan Universitas Stanford. Tersedia subtitle Bahasa Indonesia dan forum komunitas lokal aktif.',
        url: 'https://www.coursera.org/specializations/machine-learning-introduction',
        category: 'tech',
    },
    {
        name: 'Pelatihan Digital Prakerja — Pemrograman Python',
        provider: 'Prakerja',
        duration: '6 minggu',
        rating: 4.6,
        price: 'Gratis (subsidi pemerintah)',
        description: 'Pelatihan bersubsidi Kartu Prakerja. Pelajari Python dari nol hingga automasi data dan scripting dasar. Tersedia di platform Pijar Mahir, Tokopedia, dan Bukalapak.',
        url: 'https://www.prakerja.go.id/',
        category: 'tech',
    },
]

// Maps provider names to emoji icons and colors
const PROVIDER_META = {
    'Dicoding':     { icon: '🎓', color: '#6366F1', label: 'Dicoding Academy' },
    'RevoU':        { icon: '🚀', color: KC.orange,  label: 'RevoU Bootcamp'  },
    'Coursera ID':  { icon: '🎯', color: '#0056D2',  label: 'Coursera'        },
    'Prakerja':     { icon: '🏛️', color: '#16a34a',  label: 'Prakerja'        },
    'Hacktiv8':     { icon: '⚡', color: '#EF4444',  label: 'Hacktiv8'        },
    'Purwadhika':   { icon: '📚', color: '#7C3AED',  label: 'Purwadhika'      },
    'Binar Academy':{ icon: '💎', color: '#0EA5E9',  label: 'Binar Academy'   },
    'MySkill':      { icon: '🌟', color: '#F59E0B',  label: 'MySkill'         },
    'Skill Academy':{ icon: '🏅', color: KC.cyan,    label: 'Skill Academy'   },
    'Udemy':        { icon: '🖥️', color: '#A435F0',  label: 'Udemy'           },
    'YouTube Curated':{ icon:'▶️', color: '#FF0000', label: 'YouTube Curated' },
}

function getProviderMeta(provider = '') {
    return PROVIDER_META[provider] || { icon: '📖', color: KC.lime, label: provider || 'Online Course' }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonCard({ style = {} }) {
    return (
        <div style={{
            background: '#F0F0F0',
            borderRadius: 12,
            border: `2px solid ${KC.ink}`,
            padding: 20,
            animation: 'pulse 1.5s ease-in-out infinite',
            ...style,
        }}>
            <div style={{ height: 14, background: '#D1D5DB', borderRadius: 6, marginBottom: 10, width: '40%' }} />
            <div style={{ height: 22, background: '#D1D5DB', borderRadius: 6, marginBottom: 8, width: '80%' }} />
            <div style={{ height: 14, background: '#D1D5DB', borderRadius: 6, marginBottom: 6, width: '90%' }} />
            <div style={{ height: 14, background: '#D1D5DB', borderRadius: 6, width: '65%' }} />
        </div>
    )
}

// ─── Circular match progress ──────────────────────────────────────────────────
function MatchCircle({ pct, color, size = 80, label }) {
    const r = (size - 8) / 2
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{Math.round(pct)}%</span>
                </div>
            </div>
            {label && <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.65, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>}
        </div>
    )
}

// ─── Single course card ───────────────────────────────────────────────────────
function CourseCard({ course, accent, size = 'sm', style = {} }) {
    const meta = getProviderMeta(course.provider)
    const isFree = (course.price || '').toLowerCase().includes('gratis') || course.price === 'Rp 0'

    if (size === 'lg') {
        return (
            <BrutalCard color={accent} padding={22} style={{ color: '#fff', display: 'flex', flexDirection: 'column', ...style }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Tag color="#fff" ink={KC.ink}>★ Rekomendasi Utama</Tag>
                    <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>{meta.label || course.provider}</span>
                </div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{meta.icon}</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.1, margin: '0 0 10px' }}>
                    {course.name}
                </h3>
                <p style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.6, flexGrow: 1, margin: '0 0 16px' }}>
                    {course.description || `Pelajari ${course.name} dengan kurikulum terstruktur dan mentor berpengalaman.`}
                </p>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span>⏱ {course.duration}</span>
                    <span>★ {course.rating || 4.8}</span>
                    <span style={{ background: isFree ? '#16a34a' : 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.5)' }}>
                        💰 {course.price || 'Rp 150k'}
                    </span>
                    {isFree && <span style={{ background: '#16a34a', padding: '2px 8px', borderRadius: 20, fontWeight: 900, fontSize: 10 }}>FREE</span>}
                </div>
                <button onClick={() => window.open(course.url || `https://google.com/search?q=${encodeURIComponent(course.name)}`, '_blank')}
                    style={{ padding: '12px 20px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`, transition: 'transform 0.1s ease' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'translate(2px,2px)'}
                    onMouseUp={e => e.currentTarget.style.transform = ''}>
                    Mulai Belajar →
                </button>
            </BrutalCard>
        )
    }

    return (
        <BrutalCard color={accent} padding={18} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', ...style }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{meta.icon}</span>
                        <Tag color="#fff" size="sm">{course.provider}</Tag>
                    </div>
                    {isFree && <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', background: '#16a34a', color: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 4 }}>FREE</span>}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.25, margin: '0 0 6px' }}>{course.name}</h4>
                <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.72, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {course.description || 'Kursus pilihan terbaik untuk menutup gap skill kamu.'}
                </p>
            </div>
            <div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span>⏱ {course.duration}</span>
                    <span>💰 {course.price || 'Rp 150k'}</span>
                    {course.rating && <span>★ {course.rating}</span>}
                </div>
                <button onClick={() => window.open(course.url || `https://google.com/search?q=${encodeURIComponent(course.name)}`, '_blank')}
                    style={{ width: '100%', padding: '7px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${KC.ink}`, transition: 'transform 0.1s ease' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'translate(1px,1px)'}
                    onMouseUp={e => e.currentTarget.style.transform = ''}>
                    Lihat Kelas →
                </button>
            </div>
        </BrutalCard>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SkillGapPanel() {
    const {
        skillGapResult,
        skillGapLoading,
        skillGapError,
        runSkillGap,
        loadSkillGap,
        seekerId,
        profile,
        targetJobTitle,
        missingSkills: agentMissingSkills,
        recommendedCourses: agentCourses,
    } = useStore()

    const [hasTriggered, setHasTriggered] = useState(false)

    // On mount: try to load cached result first, then trigger AI if nothing found
    useEffect(() => {
        const init = async () => {
            if (!seekerId) return
            const cached = await loadSkillGap()
            if (!cached) {
                // No cached result — run AI analysis automatically
                setHasTriggered(true)
                await runSkillGap()
            }
        }
        init()
    }, [seekerId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleReanalyze = useCallback(async () => {
        setHasTriggered(true)
        await runSkillGap()
        toast.success('Analisis skill gap diperbarui!')
    }, [runSkillGap])

    // Resolve data: prefer dedicated skill-gap endpoint result, fall back to agent state, then mock
    const result = skillGapResult
    const gaps = result?.missing_skills?.length
        ? result.missing_skills
        : agentMissingSkills?.length
            ? agentMissingSkills
            : ['Docker', 'Kubernetes', 'Terraform']

    const rawCourses = result?.recommended_courses?.length
        ? result.recommended_courses
        : agentCourses?.length
            ? agentCourses
            : []

    const courses = rawCourses.length >= 5 ? rawCourses : [...rawCourses, ...MOCK_COURSES].slice(0, 5)

    const matchBefore = result?.match_before ?? (agentMissingSkills?.length ? Math.max(30, 100 - agentMissingSkills.length * 12) : 72)
    const matchAfter  = result?.match_after  ?? Math.min(matchBefore + gaps.length * 3, 97)
    const estimatedHours = result?.estimated_hours ?? gaps.length * 10
    const jobTitle = result?.target_job_title || targetJobTitle || profile?.headline || 'Posisi Target'
    const gapSeverity = result?.gap_severity || 'medium'
    const hasNoProfile = !seekerId && !agentMissingSkills?.length

    const ACCENT_COLORS = [KC.orange, KC.cyan, KC.yellow, KC.lime, KC.pink]
    const GAP_COLORS    = [KC.orange, KC.cyan, KC.yellow, KC.pink, KC.lime]

    // ── Empty state: no profile ───────────────────────────────────────────────
    if (hasNoProfile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Analisis Skill Gap</h1>
                        <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>AI akan mendeteksi gap skill kamu vs lowongan terbaik.</p>
                    </div>
                </header>
                <BrutalCard color={KC.yellow} padding={32} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>Upload CV dulu!</h3>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '0 0 20px' }}>
                        AI butuh profilmu untuk menghitung gap skill vs lowongan terbaik yang tersedia.
                    </p>
                    <button onClick={() => useStore.getState().navigate('seeker-dashboard')}
                        style={{ padding: '12px 24px', background: KC.ink, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                        Ke Dashboard → Upload CV
                    </button>
                </BrutalCard>
                {/* Show mock data preview anyway */}
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5, margin: '0 0 4px' }}>Preview: Kursus Populer</h2>
                    <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 16px' }}>Upload CV untuk rekomendasi yang dipersonalisasi.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {MOCK_COURSES.slice(0, 3).map((c, i) => (
                            <CourseCard key={i} course={c} accent={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── Loading state ─────────────────────────────────────────────────────────
    if (skillGapLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Analisis Skill Gap</h1>
                        <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>AI sedang menganalisis profil dan mencocokkan dengan lowongan terbaik…</p>
                    </div>
                </header>
                <BrutalCard color={KC.ink} padding={28} style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid ${KC.orange}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>🤖 AI sedang bekerja…</div>
                        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Menghitung gap skill, meranking lowongan, dan memilih kursus terbaik untuk kamu.</div>
                    </div>
                </BrutalCard>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    <SkeletonCard style={{ gridColumn: 'span 2', gridRow: 'span 2', minHeight: 300 }} />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard style={{ gridColumn: 'span 2' }} />
                </div>
            </div>
        )
    }

    // ── Main view ─────────────────────────────────────────────────────────────
    const severityLabel = { low: 'Gap Kecil', medium: 'Gap Sedang', high: 'Gap Besar' }[gapSeverity] || 'Sedang'
    const severityColor = { low: KC.lime, medium: KC.yellow, high: KC.orange }[gapSeverity] || KC.yellow
    const freeCoursesCount = courses.filter(c => (c.price || '').toLowerCase().includes('gratis')).length

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }`}</style>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Skill Gap untuk role kamu</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Dianalisis AI berdasarkan profil vs top lowongan aktif. Kursus diranking by relevance × harga × waktu.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ padding: '8px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                        🎯 {jobTitle}
                    </div>
                    <button
                        onClick={handleReanalyze}
                        disabled={skillGapLoading}
                        title="Jalankan ulang analisis AI"
                        style={{ padding: '8px 14px', background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 #555`, display: 'flex', alignItems: 'center', gap: 6, transition: 'transform 0.1s ease' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'translate(2px,2px)'}
                        onMouseUp={e => e.currentTarget.style.transform = ''}>
                        🔄 Analisis Ulang
                    </button>
                </div>
            </header>

            {/* Error banner */}
            {skillGapError && (
                <div style={{ background: '#FEF2F2', border: `2px solid #EF4444`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>⚠️</span>
                    <div style={{ flex: 1 }}>
                        <strong>Gagal menghubungi AI:</strong> {skillGapError}
                    </div>
                    <button onClick={handleReanalyze} style={{ padding: '6px 12px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Gap analysis summary card */}
            <BrutalCard color={KC.ink} padding={24} style={{ color: '#fff', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 24, alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <Tag color={KC.orange} ink="#fff">🤖 Analisis AI</Tag>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', background: severityColor, color: KC.ink, borderRadius: 20, border: `1.5px solid ${KC.ink}` }}>
                                {severityLabel}
                            </span>
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '0 0 8px', lineHeight: 1.2 }}>
                            Tutup {gaps.length} skill → match-mu naik {Math.round(matchBefore)}% → {Math.round(matchAfter)}%
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.72, margin: 0 }}>
                            Estimasi: ~{estimatedHours} jam belajar · {freeCoursesCount} dari {courses.length} kursus gratis tersedia
                        </p>
                    </div>

                    {/* Match before / after circles */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <MatchCircle pct={matchBefore} color={KC.orange} size={80} label="Sekarang" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <MatchCircle pct={matchAfter} color={KC.lime} size={80} label="Setelah belajar" />
                    </div>
                </div>

                {/* Skill gap pills */}
                {gaps.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.55, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Skills missing:</span>
                        {gaps.map((g, i) => (
                            <span key={g} style={{ fontSize: 13, fontWeight: 800, padding: '4px 14px', background: '#1a1a20', border: `2px solid ${GAP_COLORS[i % GAP_COLORS.length]}`, borderRadius: 20, color: GAP_COLORS[i % GAP_COLORS.length] }}>
                                {g}
                            </span>
                        ))}
                    </div>
                )}
            </BrutalCard>

            {/* Courses section header */}
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '0 0 4px' }}>Kursus yang cocok</h2>
                <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 18px' }}>
                    Dipilih dari Dicoding, Prakerja, Coursera, RevoU, Hacktiv8 & YouTube — diranking by relevance × harga × durasi.
                </p>
            </div>

            {/* Bento grid of course cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 'minmax(160px, auto)', gap: 14, animation: 'fadeIn 0.5s ease' }}>

                {/* Featured course — spans 2×2 */}
                {courses[0] && (
                    <CourseCard course={courses[0]} accent={KC.orange} size="lg"
                        style={{ gridColumn: 'span 2', gridRow: 'span 2' }} />
                )}

                {/* Courses 2 & 3 — single cells */}
                {courses.slice(1, 3).map((c, i) => (
                    <CourseCard key={i} course={c} accent={[KC.cyan, KC.lime][i % 2]} />
                ))}

                {/* Course 4 — wide card */}
                {courses[3] && (
                    <BrutalCard color={KC.yellow} padding={18} style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ width: 64, height: 64, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>
                                {getProviderMeta(courses[3].provider).icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <Tag color="#fff" size="sm">{courses[3].provider}</Tag>
                                <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '8px 0 6px' }}>{courses[3].name}</h4>
                                <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.78, margin: '0 0 10px', lineHeight: 1.5 }}>
                                    {courses[3].description || 'Rekomendasi kursus dengan kurikulum komprehensif.'}
                                </p>
                                <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span>⏱ {courses[3].duration}</span>
                                    <span>💰 {courses[3].price || 'Rp 150k'}</span>
                                    {courses[3].rating && <span>★ {courses[3].rating}</span>}
                                </div>
                                <button onClick={() => window.open(courses[3].url || `https://google.com/search?q=${encodeURIComponent(courses[3].name)}`, '_blank')}
                                    style={{ padding: '6px 14px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 11, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                                    Kunjungi Kelas →
                                </button>
                            </div>
                        </div>
                    </BrutalCard>
                )}

                {/* Course 5 */}
                {courses[4] ? (
                    <CourseCard course={courses[4]} accent={KC.pink} />
                ) : (
                    <BrutalCard color={KC.pink} padding={18} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <Tag color="#fff" size="sm">Prakerja</Tag>
                            <h4 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 6px' }}>Prakerja Indonesia</h4>
                            <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, margin: '0 0 10px' }}>Subsidi pelatihan dari pemerintah untuk pencari kerja aktif.</p>
                        </div>
                        <button onClick={() => window.open('https://www.prakerja.go.id/', '_blank')}
                            style={{ width: '100%', padding: '6px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: `1.5px 1.5px 0 ${KC.ink}` }}>
                            Daftar Prakerja
                        </button>
                    </BrutalCard>
                )}

                {/* 1-on-1 Mentoring card */}
                <BrutalCard color={KC.ink} padding={18} style={{ color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: KC.orange, fontSize: 18 }}>✨</span>
                        <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Mentoring</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25, margin: '0 0 6px' }}>1-on-1 Review Portofolio</h4>
                    <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 10px', lineHeight: 1.5 }}>30 menit bersama mentor expert dari GOJEK, Tokopedia, dan startup terkemuka.</p>
                    <button onClick={() => window.open('https://topmate.io', '_blank')}
                        style={{ width: '100%', padding: 8, background: KC.orange, border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>
                        Book Sesi Mentoring
                    </button>
                </BrutalCard>

                {/* Learning roadmap */}
                <BrutalCard color="#fff" padding={18} style={{ gridColumn: 'span 2' }}>
                    <Tag color={KC.yellow}>🗺️ Roadmap Belajar</Tag>
                    <h4 style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.2, margin: '10px 0 12px' }}>
                        Jadwal rekomendasi untuk menutup gap kamu
                    </h4>
                    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${KC.ink}` }}>
                        {(gaps.length ? gaps : ['Docker', 'Kubernetes', 'Terraform']).slice(0, 4).map((skill, i) => {
                            const c = [KC.orange, KC.cyan, KC.yellow, KC.pink][i % 4]
                            return (
                                <div key={i} style={{ flex: 1, padding: '10px 6px', background: c, borderRight: i < 3 ? `1px solid ${KC.ink}` : 'none', textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, fontWeight: 900 }}>W{i * 2 + 1}–{i * 2 + 2}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{skill}</div>
                                </div>
                            )
                        })}
                    </div>
                    {result && (
                        <p style={{ fontSize: 11, color: KC.mute, margin: '10px 0 0' }}>
                            Estimasi selesai: ~{Math.ceil((result.estimated_hours || gaps.length * 10) / 8)} hari belajar · Readiness ~{result.estimated_hours ? Math.ceil(result.estimated_hours / 40) : 1} bulan
                        </p>
                    )}
                </BrutalCard>

                {/* Skills I already have */}
                {(result?.matching_skills?.length > 0) && (
                    <BrutalCard color={KC.lime} padding={18} style={{ gridColumn: 'span 2' }}>
                        <Tag color="#fff">✅ Skill yang sudah kamu punya</Tag>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                            {result.matching_skills.map((s, i) => (
                                <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 20 }}>
                                    ✓ {s}
                                </span>
                            ))}
                        </div>
                    </BrutalCard>
                )}
            </div>

            {/* Data source badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: KC.mute }}>
                <span>{result ? '🤖 Dianalisis AI berdasarkan profil & lowongan aktif' : '📋 Menampilkan data mock — upload CV untuk hasil personal'}</span>
                {result && (
                    <button onClick={handleReanalyze}
                        style={{ padding: '3px 10px', background: 'transparent', border: `1px solid ${KC.mute}`, borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: KC.mute }}>
                        Refresh
                    </button>
                )}
            </div>
        </div>
    )
}
