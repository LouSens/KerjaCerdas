import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, topBtn, DesignStyles, useIsMobile } from './_design'
import { Sparkles, Briefcase, Upload, Search, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react'
import JobDetailModal from './JobDetailModal'

const bandOf = (m) => {
    if (m.band) return m.band
    const raw = m.overall_score ?? m.score ?? 0
    const pct = raw > 1 ? raw : raw * 100
    return pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch'
}

export default function SeekerDashboard() {
    const isMobile = useIsMobile()
    const {
        user,
        matches,
        navigate,
        runAgent,
        agentLoading,
        seekerId,
        profile,
        recommendedCourses,
        missingSkills,
        computeProfileCompleteness,
        refreshMatches,
    } = useStore()

    const [selectedJob, setSelectedJob] = useState(null)
    const hasProfile = Boolean(seekerId || profile?.skills?.length > 0)

    useEffect(() => {
        if (hasProfile && !matches.length && !agentLoading) {
            runAgent({ explicitIntent: 'match_jobs' })
        }
    }, [hasProfile]) // eslint-disable-line react-hooks/exhaustive-deps

    const topMatches = matches.slice(0, 3)
    const avg = matches.length
        ? Math.round(matches.reduce((s, m) => {
            const raw = m.overall_score ?? m.score ?? 0
            return s + (raw > 1 ? raw : raw * 100)
        }, 0) / matches.length)
        : 0

    const completionPct = computeProfileCompleteness() || 0
    const userName = user?.name || user?.email || 'Pencari Kerja'
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P'

    const cvDone = Boolean(profile?.has_cv || profile?.resume_url || profile?.skills?.length > 0)
    const skillsDone = Boolean((profile?.skills?.length || 0) > 0)
    const ktpDone = Boolean(profile?.ktp_verified)
    const diktiDone = Boolean(profile?.degree_verified)

    const matchCount = matches.length
    const gapCount = missingSkills.length
    const courseCount = recommendedCourses.length

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D03)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />
                <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

                {/* Desktop Top Header Bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ font: '900 32px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.3px', color: KC.ink, margin: 0 }}>
                            Dashboard Karir
                        </h1>
                        <p style={{ font: '400 14px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            Selamat datang kembali, <b style={{ color: KC.ink }}>{user?.name || 'Budi Santoso'}</b> · {matchCount} lowongan terkurasi aktif
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 11, flexShrink: 0 }}>
                        <button
                            onClick={() => navigate('seeker-profile')}
                            className="kc-btn"
                            style={{ ...topBtn('#fff', KC.ink), padding: '11px 18px', fontSize: 13 }}
                        >
                            Unggah CV
                        </button>
                        <button
                            onClick={() => navigate('seeker-search')}
                            className="kc-btn"
                            style={{ ...topBtn('#fff', KC.ink), padding: '11px 18px', fontSize: 13 }}
                        >
                            Cari Cepat
                        </button>
                        <button
                            onClick={() => navigate('seeker-match')}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '11px 18px', fontSize: 13 }}
                        >
                            Pencocokan AI →
                        </button>
                    </div>
                </div>

                {/* 2-Column Main Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) 330px', gap: 24 }}>
                    {/* Left Column */}
                    <div>
                        {/* Big Dominant Hero Card (Decision 01: satu angka utama + 3 inline stats) */}
                        <div style={{
                            background: KC.ink,
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 14,
                            boxShadow: `4px 4px 0 ${KC.orange}`,
                            padding: '24px 26px',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 28,
                            animation: 'kcUp .4s both',
                        }}>
                            <div>
                                <div style={{
                                    font: '800 11px/1 "JetBrains Mono", monospace',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,.45)',
                                }}>
                                    Rata-rata skor kecocokan
                                </div>
                                <div style={{
                                    font: '900 58px/1 "Plus Jakarta Sans", sans-serif',
                                    letterSpacing: '-3.2px',
                                    color: '#fff',
                                    margin: '13px 0 12px',
                                }}>
                                    {avg}%
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    padding: '6px 12px',
                                    background: '#10B981',
                                    borderRadius: 999,
                                    font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                    color: '#052E20',
                                }}>
                                    ▲ +4% dibanding periode lalu
                                </div>
                            </div>

                            {/* 3 Inline Stats */}
                            <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                                <div
                                    onClick={() => navigate('seeker-match')}
                                    style={{
                                        textAlign: 'center',
                                        padding: '15px 17px',
                                        background: 'rgba(255,255,255,.07)',
                                        border: '1px solid rgba(255,255,255,.14)',
                                        borderRadius: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ font: '900 28px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', letterSpacing: '-1.3px' }}>
                                        {matchCount}
                                    </div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Lowongan<br />cocok
                                    </div>
                                </div>
                                <div
                                    onClick={() => navigate('seeker-skill-gap')}
                                    style={{
                                        textAlign: 'center',
                                        padding: '15px 17px',
                                        background: 'rgba(255,255,255,.07)',
                                        border: '1px solid rgba(255,255,255,.14)',
                                        borderRadius: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ font: '900 28px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B', letterSpacing: '-1.3px' }}>
                                        {gapCount}
                                    </div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Skill<br />gap
                                    </div>
                                </div>
                                <div
                                    onClick={() => navigate('seeker-skill-gap')}
                                    style={{
                                        textAlign: 'center',
                                        padding: '15px 17px',
                                        background: 'rgba(255,255,255,.07)',
                                        border: '1px solid rgba(255,255,255,.14)',
                                        borderRadius: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ font: '900 28px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', letterSpacing: '-1.3px' }}>
                                        {courseCount}
                                    </div>
                                    <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Rekomendasi<br />kursus
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rekomendasi Teratas Header */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <h2 style={{ font: '900 20px/1.15 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.7px', color: KC.ink, margin: 0 }}>
                                    Rekomendasi Teratas
                                </h2>
                                <p style={{ font: '400 12.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', margin: '5px 0 0' }}>
                                    Peringkat kecocokan berdasarkan analisis semantik profil Anda
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('seeker-match')}
                                style={{ background: 'none', border: 'none', font: '800 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange, cursor: 'pointer', padding: 0 }}
                            >
                                Lihat Semua {matchCount} →
                            </button>
                        </div>

                        {/* Job Cards with Component Micro-Bars (Decision 02) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {topMatches.length === 0 ? (
                                <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: '36px 24px', textAlign: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: KC.cyanSoft, border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                                        <Sparkles size={20} color={KC.ink} />
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 900, color: KC.ink, margin: '0 0 6px' }}>
                                        Belum Ada Rekomendasi Lowongan
                                    </h3>
                                    <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 16px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                                        Pencocokan AI akan menganalisis profil dan CV Anda terhadap lowongan aktif secara real-time.
                                    </p>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                        <button
                                            onClick={() => runAgent({ explicitIntent: 'match_jobs' })}
                                            disabled={agentLoading}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 18px', fontSize: 12.5 }}
                                        >
                                            {agentLoading ? 'Menganalisis profil…' : 'Mulai Pencocokan AI →'}
                                        </button>
                                        <button
                                            onClick={() => navigate('seeker-search')}
                                            className="kc-btn"
                                            style={{ ...topBtn('#fff', KC.ink), padding: '10px 18px', fontSize: 12.5 }}
                                        >
                                            Cari Lowongan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                topMatches.map((job, idx) => {
                                    const jobScore = Math.round(job.overall_score ?? job.score ?? 0)
                                    const sem = Math.round(job.semantic_score ?? (jobScore > 0 ? Math.min(100, Math.round(jobScore * 1.02)) : 0))
                                    const sk = Math.round(job.skill_score ?? (jobScore > 0 ? Math.min(100, Math.round(jobScore * 0.95)) : 0))
                                    const matchingList = job.matching_skills || []
                                    const missingList = job.missing_skills || []
                                    const bandLabel = bandOf(job) === 'strong' ? 'Strong Fit' : bandOf(job) === 'possible' ? 'Possible Fit' : 'Stretch Fit'
                                    const bandBg = bandOf(job) === 'strong' ? '#ECFDF5' : bandOf(job) === 'possible' ? '#FEF3C7' : '#E0F2FE'
                                    const bandColor = bandOf(job) === 'strong' ? '#065F46' : bandOf(job) === 'possible' ? '#B45309' : '#075985'
                                    const bandBorder = bandOf(job) === 'strong' ? '#10B981' : bandOf(job) === 'possible' ? '#F59E0B' : '#0284C7'

                                    return (
                                        <div
                                            key={job.id || idx}
                                            style={{
                                                background: '#fff',
                                                border: `1.5px solid ${KC.ink}`,
                                                borderRadius: 13,
                                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                                padding: '20px 22px',
                                                animation: 'kcUp .4s both',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ font: '700 13px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                            {job.company || job.company_name || 'Perusahaan'}
                                                        </span>
                                                        <span style={{ padding: '3px 9px', background: bandBg, border: `1px solid ${bandBorder}`, borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: bandColor }}>
                                                            {bandLabel}
                                                        </span>
                                                        {job.verified && (
                                                            <span style={{ padding: '3px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#475569' }}>
                                                                ✓ Terverifikasi
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ font: '900 21px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.8px', color: KC.ink, margin: '0 0 8px' }}>
                                                        {job.title}
                                                    </div>
                                                    <div style={{ font: '600 12.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginBottom: 14 }}>
                                                        {job.location || 'Indonesia'} · {job.work_type || 'Full-time'} &nbsp;·&nbsp; {job.salary_range || (job.salary_min && job.salary_max ? `Rp ${Math.round(job.salary_min / 1000000)}–${Math.round(job.salary_max / 1000000)} jt` : 'Gaji Kompetitif')}
                                                    </div>

                                                    {/* Desktop 2-Bar Proof Component */}
                                                    <div style={{ display: 'flex', gap: 20 }}>
                                                        <div style={{ width: 150 }}>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                                                                <span style={{ font: '700 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>Semantik ×0.50</span>
                                                                <span style={{ font: '900 11.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>{sem}%</span>
                                                            </div>
                                                            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${sem}%`, background: KC.orange, borderRadius: 999 }} />
                                                            </div>
                                                        </div>
                                                        <div style={{ width: 150 }}>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                                                                <span style={{ font: '700 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>Skill ×0.30</span>
                                                                <span style={{ font: '900 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#0284C7' }}>{sk}%</span>
                                                            </div>
                                                            <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${sk}%`, background: '#0284C7', borderRadius: 999 }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Score Ring Donut + Actions */}
                                                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                                                    <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                                                        <circle cx="36" cy="36" r="29" fill="none" stroke="#E2E8F0" strokeWidth="5" />
                                                        <circle
                                                            cx="36" cy="36" r="29" fill="none" stroke="#10B981" strokeWidth="5"
                                                            strokeLinecap="round" strokeDasharray="182.2"
                                                            strokeDashoffset={182.2 - (182.2 * (jobScore / 100))}
                                                        />
                                                        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" transform="rotate(90 36 36)" style={{ font: '900 20px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                                            {jobScore}
                                                        </text>
                                                    </svg>
                                                    <button
                                                        onClick={() => setSelectedJob(job)}
                                                        className="kc-btn"
                                                        style={{ ...topBtn(KC.ink, '#fff', KC.orange), padding: '11px 18px', fontSize: 12.5, whiteSpace: 'nowrap' }}
                                                    >
                                                        Lihat Detail &amp; Lamar →
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Skills Tags */}
                                            {(matchingList.length > 0 || missingList.length > 0) && (
                                                <div style={{ display: 'flex', gap: 7, marginTop: 16, paddingTop: 16, borderTop: '1px dashed #E2E8F0', flexWrap: 'wrap' }}>
                                                    {matchingList.map(s => (
                                                        <span key={s} style={{ padding: '5px 11px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 7, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                    {missingList.map(s => (
                                                        <span key={s} style={{ padding: '5px 11px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                                            + {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column (330px rail) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Profile Completeness Card */}
                        <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
                                <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Kelengkapan Profil</span>
                                <span style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>{completionPct}%</span>
                            </div>
                            <div style={{ height: 9, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
                                <div style={{ height: '100%', width: `${completionPct}%`, background: KC.orange, borderRadius: 999 }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, font: '600 12.5px/1 "Plus Jakarta Sans", sans-serif', color: cvDone ? '#334155' : '#64748B' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: 5, background: cvDone ? '#10B981' : '#fff', border: cvDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', font: '900 11px/1 "Plus Jakarta Sans", sans-serif' }}>
                                            {cvDone ? '✓' : ''}
                                        </span>
                                        Dokumen CV terunggah
                                    </span>
                                    <span style={{ font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: cvDone ? '#059669' : '#94A3B8' }}>
                                        {cvDone ? 'Selesai' : 'Belum'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, font: '600 12.5px/1 "Plus Jakarta Sans", sans-serif', color: skillsDone ? '#334155' : '#64748B' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: 5, background: skillsDone ? '#10B981' : '#fff', border: skillsDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', font: '900 11px/1 "Plus Jakarta Sans", sans-serif' }}>
                                            {skillsDone ? '✓' : ''}
                                        </span>
                                        Keahlian terdata ({profile?.skills?.length || 4})
                                    </span>
                                    <span style={{ font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: skillsDone ? '#059669' : '#94A3B8' }}>
                                        {skillsDone ? 'Selesai' : 'Belum'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, font: '600 12.5px/1 "Plus Jakarta Sans", sans-serif', color: ktpDone ? '#334155' : '#64748B' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: 5, background: ktpDone ? '#10B981' : '#fff', border: ktpDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', font: '900 11px/1 "Plus Jakarta Sans", sans-serif' }}>
                                            {ktpDone ? '✓' : ''}
                                        </span>
                                        Verifikasi identitas KTP
                                    </span>
                                    <span style={{ font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: ktpDone ? '#059669' : '#94A3B8' }}>
                                        {ktpDone ? 'Selesai' : 'Belum'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, font: '600 12.5px/1 "Plus Jakarta Sans", sans-serif', color: diktiDone ? '#334155' : '#64748B' }}>
                                        <span style={{ width: 18, height: 18, borderRadius: 5, background: diktiDone ? '#10B981' : '#fff', border: diktiDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', font: '900 11px/1 "Plus Jakarta Sans", sans-serif' }}>
                                            {diktiDone ? '✓' : ''}
                                        </span>
                                        Verifikasi ijazah Dikti
                                    </span>
                                    <span style={{ font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: diktiDone ? '#059669' : '#94A3B8' }}>
                                        {diktiDone ? 'Selesai' : 'Belum'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Verifikasi E-KYC Banner */}
                        <div style={{ background: '#FFF1EB', border: `1.5px solid ${KC.orange}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 20 }}>
                            <div style={{ font: '900 15px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 10 }}>
                                Verifikasi Identitas &amp; Ijazah
                            </div>
                            <p style={{ font: '400 12.5px/1.6 "Plus Jakarta Sans", sans-serif', color: '#9A3412', margin: '0 0 16px' }}>
                                Kandidat terverifikasi memiliki visibilitas prioritas hingga <b>3× lipat</b> pada hasil kurasi rekruter perusahaan.
                            </p>
                            <button
                                onClick={() => navigate('seeker-verification')}
                                className="kc-btn"
                                style={{ ...topBtn('#fff', KC.ink), padding: '11px 16px', fontSize: 12.5 }}
                            >
                                Buka Verifikasi →
                            </button>
                        </div>

                        {/* AI Advisor Snippet Card */}
                        <div style={{ background: KC.ink, border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.orange}`, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%' }} />
                                <span style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                                    AI Advisor · aktif
                                </span>
                            </div>
                            <div style={{ font: '900 14.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#fff', marginBottom: 14 }}>
                                "Tutup gap Kubernetes dulu — itu satu-satunya yang menahan Anda dari band Strong di jalur DevOps."
                            </div>
                            <button
                                onClick={() => navigate('seeker-advisor')}
                                className="kc-btn"
                                style={{ padding: '10px 15px', background: KC.orange, border: 'none', borderRadius: 8, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', cursor: 'pointer' }}
                            >
                                Tanya Advisor →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 04)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Top User Greeting Bar */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6 }}>
                <div>
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 800,
                        letterSpacing: 0.6, color: '#64748B', textTransform: 'uppercase',
                    }}>
                        Selamat pagi
                    </div>
                    <h1 style={{
                        fontSize: 21, fontWeight: 900, letterSpacing: -0.7,
                        color: KC.ink, margin: '4px 0 0', lineHeight: 1.15,
                    }}>
                        {user?.name || 'Budi Santoso'}
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 11, background: '#00B8D9',
                        border: `1.5px solid ${KC.ink}`, boxShadow: `2px 2px 0 ${KC.ink}`,
                        display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 15,
                        color: KC.ink,
                    }}>
                        {initials[0] || 'B'}
                    </div>
                </div>
            </header>

            {/* Big Hero Card */}
            <div style={{
                background: '#090A0F', border: `1.5px solid ${KC.ink}`,
                borderRadius: 14, boxShadow: `3px 3px 0 ${KC.orange}`,
                padding: 17, animation: 'kcUp .4s both',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800,
                            letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,.5)',
                        }}>
                            Rata-rata skor kecocokan
                        </div>
                        <div style={{
                            fontSize: 42, fontWeight: 900, letterSpacing: -2.4,
                            color: '#fff', margin: '9px 0 5px', lineHeight: 1,
                        }}>
                            {avg}%
                        </div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px',
                            background: '#10B981', borderRadius: 999, fontSize: 11, fontWeight: 800,
                            color: '#052E20',
                        }}>
                            ▲ +4% dari periode lalu
                        </div>
                    </div>
                    <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                        <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="7" />
                        <circle
                            cx="42" cy="42" r="34" fill="none" stroke={KC.orange} strokeWidth="7"
                            strokeLinecap="round" strokeDasharray="213.6"
                            strokeDashoffset={213.6 - (213.6 * (avg / 100))}
                        />
                    </svg>
                </div>
            </div>

            {/* 2-Column KPI Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <div
                    onClick={() => navigate('seeker-match')}
                    style={{
                        background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 14, cursor: 'pointer',
                    }}
                >
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800,
                        letterSpacing: 0.6, textTransform: 'uppercase', color: '#64748B',
                    }}>
                        Lowongan cocok
                    </div>
                    <div style={{ fontSize: 29, fontWeight: 900, letterSpacing: -1.3, color: KC.ink, margin: '8px 0 4px', lineHeight: 1 }}>
                        {matchCount}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
                        siap dilamar
                    </div>
                </div>

                <div
                    onClick={() => navigate('seeker-skill-gap')}
                    style={{
                        background: '#FEF3C7', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 14, cursor: 'pointer',
                    }}
                >
                    <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800,
                        letterSpacing: 0.6, textTransform: 'uppercase', color: '#92400E',
                    }}>
                        Skill gap
                    </div>
                    <div style={{ fontSize: 29, fontWeight: 900, letterSpacing: -1.3, color: KC.ink, margin: '8px 0 4px', lineHeight: 1 }}>
                        {gapCount}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#B45309' }}>
                        perlu dipelajari
                    </div>
                </div>
            </div>

            {/* 4 Quick Actions */}
            <div style={{ display: 'flex', gap: 9 }}>
                <div
                    onClick={() => navigate('seeker-search')}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                        padding: '12px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, cursor: 'pointer',
                        minHeight: 64, justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 15, height: 15, border: `2.5px solid ${KC.ink}`, borderRadius: '50%' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: KC.ink }}>Cari</span>
                </div>
                <div
                    onClick={() => navigate('seeker-saved')}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                        padding: '12px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, cursor: 'pointer',
                        minHeight: 64, justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 12, height: 16, background: KC.ink, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 74%,0 100%)' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: KC.ink }}>Tersimpan</span>
                </div>
                <div
                    onClick={() => navigate('seeker-profile')}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                        padding: '12px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, cursor: 'pointer',
                        minHeight: 64, justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `12px solid ${KC.orange}` }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: KC.ink }}>Unggah CV</span>
                </div>
                <div
                    onClick={() => navigate('seeker-verification')}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                        padding: '12px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, cursor: 'pointer',
                        minHeight: 64, justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 14, height: 16, background: KC.ink, clipPath: 'polygon(50% 0,100% 22%,100% 62%,50% 100%,0 62%,0 22%)' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: KC.ink }}>E-KYC</span>
                </div>
            </div>

            {/* Rekomendasi Teratas Header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.6, color: KC.ink, margin: 0, lineHeight: 1.15 }}>
                        Rekomendasi Teratas
                    </h2>
                    <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '3px 0 0' }}>
                        Peringkat dari analisis semantik profil
                    </p>
                </div>
                <button
                    onClick={() => navigate('seeker-match')}
                    style={{ background: 'none', border: 'none', fontSize: 11.5, fontWeight: 800, color: KC.orange, cursor: 'pointer', padding: 0 }}
                >
                    Semua {matchCount} →
                </button>
            </div>

            {/* Top Job Recommendations Mobile List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {topMatches.length === 0 ? (
                    <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: '24px 16px', textAlign: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: KC.cyanSoft, border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
                            <Sparkles size={18} color={KC.ink} />
                        </div>
                        <h3 style={{ fontSize: 14.5, fontWeight: 900, color: KC.ink, margin: '0 0 5px' }}>
                            Belum Ada Rekomendasi
                        </h3>
                        <p style={{ fontSize: 11.5, color: '#64748B', margin: '0 0 14px' }}>
                            Jalankan analisis AI untuk mencocokkan profil kompetensi Anda dengan lowongan aktif.
                        </p>
                        <button
                            onClick={() => runAgent({ explicitIntent: 'match_jobs' })}
                            disabled={agentLoading}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '9px 16px', fontSize: 12, width: '100%', justifyContent: 'center' }}
                        >
                            {agentLoading ? 'Menganalisis profil…' : 'Mulai Pencocokan AI →'}
                        </button>
                    </div>
                ) : (
                    topMatches.map((job, idx) => {
                        const jobScore = Math.round(job.overall_score ?? job.score ?? 0)
                        const bandLabel = bandOf(job) === 'strong' ? 'Strong Fit' : bandOf(job) === 'possible' ? 'Possible Fit' : 'Stretch Fit'
                        const bandBg = bandOf(job) === 'strong' ? '#ECFDF5' : bandOf(job) === 'possible' ? '#FEF3C7' : '#E0F2FE'
                        const bandColor = bandOf(job) === 'strong' ? '#065F46' : bandOf(job) === 'possible' ? '#B45309' : '#075985'
                        const bandBorder = bandOf(job) === 'strong' ? '#10B981' : bandOf(job) === 'possible' ? '#F59E0B' : '#0284C7'
                        const matchingList = job.matching_skills || []

                        return (
                            <div
                                key={job.id || idx}
                                onClick={() => setSelectedJob(job)}
                                style={{
                                    background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                                    padding: 14, cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                                                {job.company || job.company_name || 'Perusahaan'}
                                            </span>
                                            <span style={{ padding: '3px 7px', background: bandBg, border: `1px solid ${bandBorder}`, borderRadius: 999, fontSize: 9.5, fontWeight: 800, color: bandColor }}>
                                                {bandLabel}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.5, color: KC.ink, marginBottom: 5, lineHeight: 1.2 }}>
                                            {job.title}
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
                                            {job.location || 'Indonesia'} · {job.work_type || 'Full-time'} · {job.salary_range || (job.salary_min && job.salary_max ? `Rp ${Math.round(job.salary_min / 1000000)}–${Math.round(job.salary_max / 1000000)} jt` : 'Gaji Kompetitif')}
                                        </div>
                                    </div>
                                    <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                                        <circle cx="26" cy="26" r="21" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                                        <circle
                                            cx="26" cy="26" r="21" fill="none" stroke="#10B981" strokeWidth="4"
                                            strokeLinecap="round" strokeDasharray="132"
                                            strokeDashoffset={132 - (132 * (jobScore / 100))}
                                        />
                                        <text x="26" y="26" textAnchor="middle" dominantBaseline="central" transform="rotate(90 26 26)" style={{ font: '900 14px "Plus Jakarta Sans", sans-serif', fill: KC.ink }}>
                                            {jobScore}
                                        </text>
                                    </svg>
                                </div>
                                {matchingList.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 11, paddingTop: 11, borderTop: '1px dashed #E2E8F0', flexWrap: 'wrap' }}>
                                        {matchingList.map(s => (
                                            <span key={s} style={{ padding: '4px 9px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: '#334155' }}>
                                                ✓ {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Profile Completeness Card Mobile */}
            <div style={{
                background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                padding: 15,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 900, color: KC.ink }}>Kelengkapan Profil</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: KC.orange }}>{completionPct}%</span>
                </div>
                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginBottom: 13 }}>
                    <div style={{ height: '100%', width: `${completionPct}%`, background: KC.orange, borderRadius: 999 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                            <span style={{ width: 17, height: 17, borderRadius: 5, background: cvDone ? '#10B981' : '#fff', border: cvDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 900 }}>
                                {cvDone ? '✓' : ''}
                            </span>
                            Dokumen CV terunggah
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: cvDone ? '#059669' : '#94A3B8' }}>
                            {cvDone ? 'Selesai' : 'Belum'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                            <span style={{ width: 17, height: 17, borderRadius: 5, background: skillsDone ? '#10B981' : '#fff', border: skillsDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 900 }}>
                                {skillsDone ? '✓' : ''}
                            </span>
                            Keahlian terdata ({profile?.skills?.length || 4})
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: skillsDone ? '#059669' : '#94A3B8' }}>
                            {skillsDone ? 'Selesai' : 'Belum'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                            <span style={{ width: 17, height: 17, borderRadius: 5, background: ktpDone ? '#10B981' : '#fff', border: ktpDone ? 'none' : '1.5px solid #CBD5E1', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 900 }}>
                                {ktpDone ? '✓' : ''}
                            </span>
                            Verifikasi identitas KTP
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: ktpDone ? '#059669' : '#94A3B8' }}>
                            {ktpDone ? 'Selesai' : 'Belum'}
                        </span>
                    </div>
                </div>
                <div style={{ marginTop: 13, padding: '11px 13px', background: '#FFF1EB', border: `1px solid ${KC.orange}`, borderRadius: 10, fontSize: 11.5, lineHeight: 1.5, color: '#9A3412', fontWeight: 600 }}>
                    Profil terverifikasi mendapat prioritas hingga <b>3× lipat</b> pada kurasi rekruter.
                </div>
            </div>
        </div>
    )
}
