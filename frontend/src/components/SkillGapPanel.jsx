import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, topBtn, DesignStyles, useIsMobile } from './_design'
import toast from 'react-hot-toast'

export default function SkillGapPanel() {
    const isMobile = useIsMobile()
    const { profile, matches, navigate, skillGapResult, runSkillGap, loadSkillGap } = useStore()
    const [selectedChips, setSelectedChips] = useState([])
    const [selectedTargetJobId, setSelectedTargetJobId] = useState('')

    useEffect(() => {
        loadSkillGap()
    }, [loadSkillGap])

    const currentScore = skillGapResult?.match_before || 68
    const potentialScore = skillGapResult?.match_after || 91
    const targetTitle = skillGapResult?.target_job_title || 'DevOps Platform Engineer · Bank Mandiri Digital'

    const gapSkills = (skillGapResult?.missing_skills && skillGapResult.missing_skills.length)
        ? skillGapResult.missing_skills.map(s => ({ name: s, hours: 22 }))
        : [
            { name: 'Kubernetes', hours: 22 },
            { name: 'CI/CD Pipeline', hours: 22 },
        ]

    const matchingSkills = (skillGapResult?.matching_skills && skillGapResult.matching_skills.length)
        ? skillGapResult.matching_skills
        : ['Go', 'PostgreSQL', 'Docker', 'gRPC']

    const toggleChip = (name) => {
        setSelectedChips(prev =>
            prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
        )
    }

    const selectedHours = selectedChips.length * 22
    const projectedMatch = currentScore + Math.round(selectedChips.length * ((potentialScore - currentScore) / (gapSkills.length || 1)))

    const handleRunAnalysis = () => {
        toast.promise(runSkillGap(selectedTargetJobId || undefined), {
            loading: 'Menganalisis skill gap…',
            success: 'Analisis gap selesai!',
            error: 'Gagal memperbarui analisis',
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D06)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <DesignStyles />

                {/* Desktop Top Header Bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Skill Gap dan Rencana Belajar
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            Bandingkan profil Anda dengan kebutuhan lowongan dan pilih langkah belajar yang relevan.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 11, flexShrink: 0, alignItems: 'center' }}>
                        <select
                            value={selectedTargetJobId}
                            onChange={(e) => setSelectedTargetJobId(e.target.value)}
                            style={{
                                padding: '11px 15px',
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 9,
                                font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: KC.ink,
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="">DevOps Platform Engineer</option>
                            {(matches || []).map(m => (
                                <option key={m.id || m.job_id} value={m.id || m.job_id}>
                                    {m.title} ({m.company || m.company_name})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleRunAnalysis}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '11px 17px', fontSize: 12.5 }}
                        >
                            Analisis Skill Gap
                        </button>
                    </div>
                </div>

                {/* 2-Column Main Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '392px minmax(0, 1fr)', gap: 24 }}>
                    {/* Left Column: Big Dark Radial Dial Card (230px) */}
                    <div style={{
                        background: KC.ink,
                        border: `1.5px solid ${KC.ink}`,
                        borderRadius: 14,
                        boxShadow: `4px 4px 0 ${KC.orange}`,
                        padding: 28,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        animation: 'kcUp .4s both',
                    }}>
                        <div style={{ position: 'relative', width: 230, height: 230 }}>
                            <svg width="230" height="230" viewBox="0 0 230 230" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="115" cy="115" r="97" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="19" />
                                <circle
                                    cx="115" cy="115" r="97" fill="none" stroke={KC.orange} strokeWidth="19"
                                    strokeLinecap="round" strokeDasharray="609.5" strokeDashoffset={609.5 - (609.5 * (potentialScore / 100))}
                                    opacity="0.28"
                                />
                                <circle
                                    cx="115" cy="115" r="97" fill="none" stroke={KC.orange} strokeWidth="19"
                                    strokeLinecap="round" strokeDasharray="609.5" strokeDashoffset={609.5 - (609.5 * (currentScore / 100))}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                            }}>
                                <div style={{
                                    font: '800 10.5px/1 "JetBrains Mono", monospace',
                                    letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)',
                                }}>
                                    Kecocokan saat ini
                                </div>
                                <div style={{
                                    font: '900 62px/1 "Plus Jakarta Sans", sans-serif',
                                    letterSpacing: '-3.4px', color: '#fff', margin: '9px 0 7px', lineHeight: 1,
                                }}>
                                    {currentScore}%
                                </div>
                                <div style={{ font: '800 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>
                                    ↑ potensi {potentialScore}%
                                </div>
                            </div>
                        </div>

                        {/* 3 Metric Box Strip */}
                        <div style={{ display: 'flex', gap: 11, width: '100%', marginTop: 22 }}>
                            <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                                <div style={{ font: '900 21px/1 "Plus Jakarta Sans", sans-serif', color: '#fff' }}>{gapSkills.length}</div>
                                <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Gap wajib</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                                <div style={{ font: '900 21px/1 "Plus Jakarta Sans", sans-serif', color: '#fff' }}>44</div>
                                <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Jam estimasi</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                                <div style={{ font: '900 21px/1 "Plus Jakarta Sans", sans-serif', color: '#F59E0B' }}>Sedang</div>
                                <div style={{ font: '700 9.5px/1.3 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Severity</div>
                            </div>
                        </div>
                        <div style={{ font: '400 11px/1.6 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.45)', marginTop: 18, textAlign: 'center' }}>
                            Estimasi skenario dari rubric yang sama, bukan jaminan diterima bekerja.
                        </div>
                    </div>

                    {/* Right Column: Simulation & Skill Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Simulation Card */}
                        <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 22, animation: 'kcUp .4s .06s both' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <span style={{ font: '900 16px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.4px', color: KC.ink }}>
                                    Simulasi rencana belajar
                                </span>
                                <span style={{ font: '800 11.5px/1 "JetBrains Mono", monospace', color: KC.orange }}>
                                    {selectedChips.length} / {gapSkills.length} dipilih
                                </span>
                            </div>
                            <p style={{ font: '400 12.5px/1.55 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', margin: '0 0 16px' }}>
                                Ketuk keahlian yang siap Anda pelajari — beban jam dan proyeksi kecocokan diperbarui langsung.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 20 }}>
                                {gapSkills.map(g => {
                                    const isPicked = selectedChips.includes(g.name)
                                    return (
                                        <span
                                            key={g.name}
                                            onClick={() => toggleChip(g.name)}
                                            style={{
                                                padding: '10px 15px',
                                                background: isPicked ? KC.ink : '#FEF3C7',
                                                border: `1.5px solid ${isPicked ? KC.ink : '#F59E0B'}`,
                                                borderRadius: 999,
                                                font: '800 13px/1 "Plus Jakarta Sans", sans-serif',
                                                color: isPicked ? '#fff' : '#B45309',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {isPicked ? `✓ ${g.name}` : `+ ${g.name}`}
                                        </span>
                                    )
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ flex: 1, padding: '16px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                                    <div style={{ font: '700 10px/1 "JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: 0.6, color: '#94A3B8', marginBottom: 9 }}>
                                        Beban belajar
                                    </div>
                                    <div style={{ font: '900 24px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1px', color: KC.ink }}>
                                        {selectedHours} jam
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '16px 18px', background: '#FFF1EB', border: `1px solid ${KC.orange}`, borderRadius: 10 }}>
                                    <div style={{ font: '700 10px/1 "JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: 0.6, color: '#9A3412', marginBottom: 9 }}>
                                        Proyeksi kecocokan
                                    </div>
                                    <div style={{ font: '900 24px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1px', color: KC.orange }}>
                                        {projectedMatch}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2 Cards: Matching Skills & Missing Skills */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 13, padding: 20 }}>
                                <div style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: '#065F46', marginBottom: 5 }}>
                                    Skill yang sudah sesuai
                                </div>
                                <div style={{ font: '400 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#047857', marginBottom: 14 }}>
                                    Irisan profil dengan kebutuhan lowongan
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {matchingSkills.map(s => (
                                        <span key={s} style={{ padding: '6px 11px', background: '#fff', border: '1px solid #10B981', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#047857' }}>
                                            ✓ {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 13, padding: 20 }}>
                                <div style={{ font: '900 14px/1.2 "Plus Jakarta Sans", sans-serif', color: '#92400E', marginBottom: 5 }}>
                                    Skill yang perlu dipelajari
                                </div>
                                <div style={{ font: '400 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#B45309', marginBottom: 14 }}>
                                    Kebutuhan wajib yang belum ada di profil
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {gapSkills.map(g => (
                                        <span key={g.name} style={{ padding: '6px 11px', background: '#fff', border: '1px solid #F59E0B', borderRadius: 7, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#B45309' }}>
                                            + {g.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Course Recommendations */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 }}>
                    <div>
                        <h2 style={{ font: '900 19px/1.15 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.6px', color: KC.ink, margin: 0 }}>
                            Referensi pembelajaran
                        </h2>
                        <p style={{ font: '400 12.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', margin: '5px 0 0' }}>
                            Dihasilkan dari gap saat ini. Periksa informasi penyedia sebelum mendaftar.
                        </p>
                    </div>
                    <span style={{ padding: '6px 12px', background: '#EEF2FF', border: '1px solid #6366F1', borderRadius: 999, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#3730A3' }}>
                        2 rekomendasi
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                            <span style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: 0.7, color: '#64748B' }}>Dicoding</span>
                            <span style={{ padding: '4px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, font: '700 11px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Rp 350.000</span>
                        </div>
                        <h3 style={{ font: '900 17px/1.3 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink, margin: '0 0 9px' }}>
                            Menjadi Kubernetes Administrator
                        </h3>
                        <p style={{ font: '400 12.5px/1.6 "Plus Jakarta Sans", sans-serif', color: '#1E293B', margin: '0 0 16px' }}>
                            Orkestrasi kontainer, strategi deployment, dan observability untuk beban kerja produksi.
                        </p>
                        <div style={{ paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ font: '600 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>⏱ 22 jam</span>
                            <span style={{ padding: '9px 14px', background: KC.ink, borderRadius: 8, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', cursor: 'pointer' }}>Periksa penyedia ↗</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 22 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                            <span style={{ font: '800 10.5px/1 "JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: 0.7, color: '#64748B' }}>Hacktiv8</span>
                            <span style={{ padding: '4px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, font: '700 11px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Rp 500.000</span>
                        </div>
                        <h3 style={{ font: '900 17px/1.3 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', color: KC.ink, margin: '0 0 9px' }}>
                            CI/CD dengan GitHub Actions
                        </h3>
                        <p style={{ font: '400 12.5px/1.6 "Plus Jakarta Sans", sans-serif', color: '#1E293B', margin: '0 0 16px' }}>
                            Pipeline otomatis, gating kualitas, dan strategi rilis bertahap untuk tim kecil.
                        </p>
                        <div style={{ paddingTop: 14, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ font: '600 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>⏱ 22 jam</span>
                            <span style={{ padding: '9px 14px', background: KC.ink, borderRadius: 8, font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#fff', cursor: 'pointer' }}>Periksa penyedia ↗</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 07)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Header */}
            <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.9, color: KC.ink, margin: '0 0 5px', lineHeight: 1.1 }}>
                    Skill Gap
                </h1>
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                    Target: {targetTitle}
                </div>
            </div>

            {/* Radial Dial Card */}
            <div style={{
                background: '#090A0F', border: `1.5px solid ${KC.ink}`,
                borderRadius: 16, boxShadow: `3px 3px 0 ${KC.orange}`,
                padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                <div style={{ position: 'relative', width: 200, height: 200 }}>
                    <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="17" />
                        <circle
                            cx="100" cy="100" r="68" fill="none" stroke={KC.orange} strokeWidth="17"
                            strokeLinecap="round" strokeDasharray="427"
                            strokeDashoffset={427 - (427 * (potentialScore / 100))} opacity="0.28"
                        />
                        <circle
                            cx="100" cy="100" r="68" fill="none" stroke={KC.orange} strokeWidth="17"
                            strokeLinecap="round" strokeDasharray="427"
                            strokeDashoffset={427 - (427 * (currentScore / 100))}
                        />
                    </svg>

                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                    }}>
                        <div style={{
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800,
                            letterSpacing: 0.9, textTransform: 'uppercase', color: 'rgba(255,255,255,.45)',
                        }}>
                            Kecocokan
                        </div>
                        <div style={{ fontSize: 50, fontWeight: 900, letterSpacing: -2.8, color: '#FFFFFF', margin: '4px 0 2px', lineHeight: 1 }}>
                            {currentScore}%
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: KC.orange }}>
                            ↑ potensi {potentialScore}%
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '11px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{gapSkills.length}</div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Gap wajib</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '11px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>44</div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Jam estimasi</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '11px 8px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10 }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#F59E0B' }}>Sedang</div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Severity</div>
                    </div>
                </div>
            </div>

            {/* Simulation Card Mobile */}
            <div style={{
                background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 15,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: KC.ink }}>Simulasi rencana belajar</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 800, color: KC.orange }}>
                        {selectedChips.length} / {gapSkills.length} dipilih
                    </span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 11 }}>
                    Ketuk skill yang siap Anda pelajari — proyeksi kecocokan diperbarui langsung.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 13 }}>
                    {gapSkills.map(g => {
                        const isPicked = selectedChips.includes(g.name)
                        return (
                            <span
                                key={g.name}
                                onClick={() => toggleChip(g.name)}
                                style={{
                                    padding: '8px 12px',
                                    background: isPicked ? KC.ink : '#FEF3C7',
                                    border: `1.5px solid ${isPicked ? KC.ink : '#F59E0B'}`,
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: isPicked ? '#fff' : '#B45309',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                            >
                                {isPicked ? `✓ ${g.name}` : `+ ${g.name}`}
                            </span>
                        )
                    })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, padding: '11px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 9 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>Beban belajar</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: KC.ink }}>{selectedHours} jam</div>
                    </div>
                    <div style={{ flex: 1, padding: '11px 12px', background: '#FFF1EB', border: `1px solid ${KC.orange}`, borderRadius: 9 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700, color: '#9A3412', marginBottom: 6 }}>Proyeksi match</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: KC.orange }}>{projectedMatch}%</div>
                    </div>
                </div>
            </div>

            {/* Matching Skills */}
            <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#065F46', marginBottom: 10 }}>
                    Sudah sesuai · {matchingSkills.length} keahlian
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchingSkills.map(s => (
                        <span key={s} style={{ padding: '5px 10px', background: '#fff', border: '1px solid #10B981', borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#047857' }}>
                            ✓ {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.5, color: KC.ink, margin: 0 }}>
                    Referensi pembelajaran
                </h2>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 800, color: '#6366F1' }}>
                    2 rekomendasi
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800, color: '#64748B' }}>Dicoding</span>
                        <span style={{ padding: '3px 8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#334155' }}>Rp 350.000</span>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 900, color: KC.ink, marginBottom: 6 }}>Menjadi Kubernetes Administrator</div>
                    <p style={{ fontSize: 11.5, color: '#1E293B', margin: '0 0 11px', lineHeight: 1.5 }}>
                        Orkestrasi kontainer, deployment, dan observability untuk beban kerja produksi.
                    </p>
                    <div style={{ paddingTop: 11, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10.5, color: '#94A3B8' }}>⏱ 22 jam</span>
                        <span style={{ padding: '7px 11px', background: KC.ink, borderRadius: 7, fontSize: 10.5, fontWeight: 800, color: '#fff' }}>Periksa penyedia</span>
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 800, color: '#64748B' }}>Hacktiv8</span>
                        <span style={{ padding: '3px 8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#334155' }}>Rp 500.000</span>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 900, color: KC.ink, marginBottom: 6 }}>CI/CD dengan GitHub Actions</div>
                    <p style={{ fontSize: 11.5, color: '#1E293B', margin: '0 0 11px', lineHeight: 1.5 }}>
                        Pipeline otomatis, gating kualitas, dan strategi rilis bertahap.
                    </p>
                    <div style={{ paddingTop: 11, borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10.5, color: '#94A3B8' }}>⏱ 22 jam</span>
                        <span style={{ padding: '7px 11px', background: KC.ink, borderRadius: 7, fontSize: 10.5, fontWeight: 800, color: '#fff' }}>Periksa penyedia</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
