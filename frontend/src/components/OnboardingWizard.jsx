/**
 * OnboardingWizard — 3-step flow for new seekers.
 *
 * Step 1: Welcome + role confirmation
 * Step 2: CV Upload (or guided skill wizard — A/B tested via `onboarding_flow`)
 * Step 3: Run first match + celebrate
 *
 * Shown automatically when a seeker logs in for the first time and
 * has no seekerId (no CV uploaded). Dismiss on complete or skip.
 */
import { useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, DesignStyles } from './_design'

const STEPS = ['Selamat Datang', 'Upload CV', 'Match Pertamamu']

export default function OnboardingWizard({ onClose }) {
    const [step, setStep] = useState(0)
    const { user, uploadResume, cvUploading, runAgent, agentLoading, seekerId, navigate, getExperiment, trackEvent: track } = useStore()
    const variant = getExperiment?.('onboarding_flow') ?? 'cv_first'

    const goNext = () => setStep(s => Math.min(STEPS.length - 1, s + 1))
    const goPrev = () => setStep(s => Math.max(0, s - 1))

    const handleSkip = () => {
        track?.('onboarding_skipped', { step: STEPS[step] })
        onClose?.()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        track?.('cv_upload_started', { source: 'onboarding' })
        await uploadResume(file)
        track?.('cv_upload_completed', { source: 'onboarding' })
    }

    const handleRunMatch = async () => {
        track?.('first_match_triggered', { source: 'onboarding' })
        await runAgent({ explicitIntent: 'match_jobs' })
        track?.('first_match_completed', { source: 'onboarding' })
        navigate('seeker-match')
        onClose?.()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}>
            <DesignStyles />
            <div style={{
                width: '100%', maxWidth: 520,
                background: KC.bone, border: `3px solid ${KC.ink}`,
                borderRadius: 16, boxShadow: `8px 8px 0 ${KC.ink}`,
                overflow: 'hidden',
            }}>
                {/* Progress bar */}
                <div style={{ height: 6, background: KC.ash }}>
                    <div style={{
                        height: '100%',
                        width: `${((step + 1) / STEPS.length) * 100}%`,
                        background: `repeating-linear-gradient(45deg,${KC.orange} 0 8px,${KC.orangeDeep || '#c44'} 8px 16px)`,
                        transition: 'width .35s ease',
                    }} />
                </div>

                <div style={{ padding: '28px 32px' }}>
                    {/* Step pills */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {STEPS.map((label, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                opacity: i > step ? 0.4 : 1,
                            }}>
                                <div style={{
                                    width: 22, height: 22, borderRadius: 6,
                                    background: i < step ? KC.lime : i === step ? KC.orange : '#fff',
                                    border: `2px solid ${KC.ink}`, color: i < step ? KC.ink : i === step ? '#fff' : KC.ink,
                                    display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 900,
                                    boxShadow: `1.5px 1.5px 0 ${KC.ink}`,
                                }}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: KC.mute }}>{label}</span>
                                {i < STEPS.length - 1 && (
                                    <span style={{ fontSize: 11, color: KC.ash, margin: '0 2px' }}>›</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Step 0: Welcome ── */}
                    {step === 0 && (
                        <div style={{ animation: 'kc-fade-up .3s ease' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, margin: '0 0 10px' }}>
                                Halo, {user?.name || 'Pejuang'}!
                            </h2>
                            <p style={{ fontSize: 14, color: KC.mute, lineHeight: 1.6, margin: '0 0 20px' }}>
                                KerjaCerdas pakai AI Gemini buat nyari pekerjaan yang beneran cocok sama skill kamu —
                                bukan sekadar keyword match. Tiga langkah cepat dan kamu udah bisa lihat hasilnya.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                {[
                                    ['📄', 'Upload CV PDF', 'Gemini parse skill & pengalaman otomatis'],
                                    ['🤖', 'AI Matching', 'Vector embedding nyari top-5 pekerjaan terbaik untukmu'],
                                    ['🛡️', 'Verifikasi (opsional)', 'Badge terverifikasi buat tampil lebih kredibel di HR'],
                                ].map(([icon, title, desc]) => (
                                    <div key={title} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '12px 14px', background: '#fff',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                        boxShadow: `2px 2px 0 ${KC.ink}`,
                                    }}>
                                        <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 900 }}>{title}</div>
                                            <div style={{ fontSize: 12, color: KC.mute, fontWeight: 600 }}>{desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={handleSkip} style={ghostBtn}>Lewati →</button>
                                <button onClick={goNext} style={solidBtn(KC.orange, '#fff')}>
                                    Mulai →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: CV Upload (or skill wizard by A/B) ── */}
                    {step === 1 && (
                        <div style={{ animation: 'kc-fade-up .3s ease' }}>
                            {variant === 'cv_first' ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>Upload CV-mu</h2>
                                    <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 20px', lineHeight: 1.6 }}>
                                        Format PDF. Gemini akan mengekstrak skill, pengalaman, dan ekspektasi gaji secara otomatis.
                                    </p>
                                    <label style={{
                                        display: 'block', padding: '32px 24px', textAlign: 'center',
                                        border: `3px dashed ${KC.ink}`, borderRadius: 12,
                                        cursor: cvUploading ? 'not-allowed' : 'pointer',
                                        background: cvUploading ? KC.ash : '#fff',
                                        transition: 'background .2s',
                                    }}>
                                        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} disabled={cvUploading} />
                                        <div style={{ fontSize: 36, marginBottom: 8 }}>
                                            {cvUploading ? '⏳' : seekerId ? '✅' : '📁'}
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 800 }}>
                                            {cvUploading ? 'Mengupload & parse CV…' : seekerId ? 'CV berhasil diparse!' : 'Klik untuk pilih file PDF'}
                                        </div>
                                        {!cvUploading && !seekerId && (
                                            <div style={{ fontSize: 12, color: KC.mute, marginTop: 6, fontWeight: 600 }}>Atau drag & drop di sini</div>
                                        )}
                                    </label>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🧙</div>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>Isi Skill Kamu</h2>
                                    <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 20px', lineHeight: 1.6 }}>
                                        Belum punya CV PDF? Isi skill utama kamu dulu, nanti bisa upload CV kapanpun.
                                    </p>
                                    <div style={{ padding: 20, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: KC.mute }}>
                                            ✨ Tip: Upload CV tetap yang paling akurat — cukup 30 detik!
                                        </p>
                                        <button
                                            onClick={() => document.getElementById('onboarding-cv-input').click()}
                                            style={solidBtn(KC.lime, KC.ink)}
                                        >
                                            Upload CV PDF →
                                        </button>
                                        <input id="onboarding-cv-input" type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                                <button onClick={goPrev} style={ghostBtn}>← Kembali</button>
                                <button onClick={goNext} disabled={!seekerId && !cvUploading} style={{
                                    ...solidBtn(seekerId ? KC.orange : KC.ash, seekerId ? '#fff' : KC.mute),
                                    opacity: !seekerId ? 0.6 : 1,
                                    cursor: !seekerId ? 'not-allowed' : 'pointer',
                                }}>
                                    {seekerId ? 'Lanjut →' : 'Upload dulu'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: First Match ── */}
                    {step === 2 && (
                        <div style={{ animation: 'kc-fade-up .3s ease' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>Jalankan Match Pertamamu!</h2>
                            <p style={{ fontSize: 13, color: KC.mute, margin: '0 0 20px', lineHeight: 1.6 }}>
                                Gemini sekarang siap membandingkan profilmu dengan ribuan lowongan. Proses ini sekitar 8 detik.
                            </p>
                            <BrutalCard color={KC.lime} padding={16}>
                                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
                                    🎯 <b>CV kamu sudah diparse.</b> Gemini akan embed profilmu ke vector space
                                    dan mencari top-5 lowongan paling kompatibel berdasarkan skill, lokasi, dan gaji.
                                </div>
                            </BrutalCard>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 12 }}>
                                <button onClick={goPrev} style={ghostBtn}>← Kembali</button>
                                <button onClick={handleRunMatch} disabled={agentLoading} style={{
                                    ...solidBtn(KC.orange, '#fff'),
                                    opacity: agentLoading ? 0.7 : 1,
                                    flex: 1,
                                }}>
                                    {agentLoading ? '⏳ Mencocokkan…' : '🤖 Jalankan AI Match →'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const solidBtn = (bg, fg) => ({
    padding: '10px 20px', background: bg, color: fg,
    border: `2px solid ${KC.ink}`, borderRadius: 10,
    fontWeight: 800, fontSize: 13, cursor: 'pointer',
    boxShadow: `2px 2px 0 ${KC.ink}`, fontFamily: 'inherit',
})

const ghostBtn = {
    padding: '10px 16px', background: 'transparent', color: KC.mute,
    border: `1.5px solid ${KC.mute}`, borderRadius: 10,
    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}
