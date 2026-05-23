import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, Tag, FilledStat, DesignStyles } from './_design'

export default function CVUploader() {
    const { uploadResume, cvUploading, seekerId, profile, navigate, loadSeekerProfile } = useStore()
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const [fileMeta, setFileMeta] = useState(null)

    // If user already has a seekerId (from a previous CV upload), reload their
    // profile from the backend so we always show fresh stats.
    useEffect(() => {
        if (seekerId) loadSeekerProfile()
    }, [seekerId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleFile = (file) => {
        if (!file) return
        setFileMeta({ name: file.name, size: file.size })
        uploadResume(file)
    }

    const skillsCount = profile?.skills?.length ?? 0
    const expCount = profile?.experience?.length ?? 0
    const eduCount = profile?.education?.length ?? 0

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>
                        Upload CV
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Drop PDF, Gemini parse otomatis. Skill, pengalaman, dan preferensi gaji terdeteksi dalam 8 detik.
                    </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    🤖 Powered by Gemini 3.1 Flash Lite
                </div>
            </header>

            <div className="kc-grid-main">
                {/* ── Upload dropzone ───────────────────────────────────────── */}
                <BrutalCard color="#fff" padding={0} style={{ overflow: 'hidden' }}>
                    <div
                        onClick={() => !cvUploading && inputRef.current?.click()}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        style={{
                            padding: '48px 28px', textAlign: 'center',
                            background: dragOver ? KC.lime : cvUploading ? KC.bone : '#fff',
                            cursor: cvUploading ? 'wait' : 'pointer',
                            borderBottom: `2px dashed ${KC.ink}`,
                            transition: 'background .15s ease',
                        }}
                    >
                        {cvUploading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div className="kc-spin" style={{ width: 48, height: 48, borderWidth: 5 }} />
                                <Tag color={KC.yellow}>Parsing dengan Gemini</Tag>
                                <p style={{ fontSize: 14, fontWeight: 800, color: KC.ink, margin: 0 }}>
                                    AI lagi ekstrak skill, experience, education…
                                </p>
                                <p style={{ fontSize: 12, color: KC.mute, margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                                    {fileMeta ? `${fileMeta.name} · ${(fileMeta.size / 1024).toFixed(1)} KB` : '~ 8 detik'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 88, height: 88, background: KC.cyan,
                                    border: `3px solid ${KC.ink}`, borderRadius: 18,
                                    display: 'grid', placeItems: 'center',
                                    boxShadow: `6px 6px 0 ${KC.ink}`,
                                    transform: `rotate(${dragOver ? '4deg' : '-4deg'})`,
                                    transition: 'transform .25s cubic-bezier(.34,1.56,.64,1)',
                                    fontSize: 40,
                                }}>
                                    📄
                                </div>
                                <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, margin: '8px 0 4px' }}>
                                    {dragOver ? 'Lepas di sini!' : 'Drop CV atau klik untuk pilih file'}
                                </h2>
                                <p style={{ fontSize: 13, color: KC.mute, margin: 0 }}>
                                    PDF · maks 10 MB · Bahasa Indonesia atau English
                                </p>
                                <button className="kc-btn" style={{
                                    marginTop: 8, padding: '12px 24px', background: KC.orange, color: '#fff',
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 14,
                                    cursor: 'pointer', boxShadow: `4px 4px 0 ${KC.ink}`,
                                }}>
                                    Pilih File →
                                </button>
                            </div>
                        )}
                        <input ref={inputRef} type="file" accept=".pdf" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>

                    {/* Pipeline strip below dropzone */}
                    <div style={{ padding: '20px 24px', background: KC.bone }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 12 }}>
                            Yang AI lakuin
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
                            {[
                                { icon: '🔍', label: 'Parse layout', sub: '1.2s' },
                                { icon: '🧠', label: 'Extract skill', sub: '2.4s' },
                                { icon: '📊', label: 'Score sections', sub: '1.8s' },
                                { icon: '💾', label: 'Save & embed', sub: '2.6s' },
                            ].map((s, i) => (
                                <div key={i} className="kc-card" style={{ padding: 12, background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 10 }}>
                                    <div style={{ fontSize: 18 }}>{s.icon}</div>
                                    <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: KC.mute, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{s.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </BrutalCard>

                {/* ── Right rail: status + tips ─────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {seekerId ? (
                        <BrutalCard color={KC.lime} padding={18}>
                            <Tag color={KC.ink} ink="#fff" size="sm">✓ CV TERINDEKS</Tag>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '10px 0 4px', letterSpacing: -0.4 }}>
                                Profil-mu siap di-match
                            </h3>
                            <p style={{ fontSize: 11, fontWeight: 700, color: KC.ink, opacity: 0.75, margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                                seeker_id: {String(seekerId).slice(0, 8)}…
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
                                <Mini label="skill" value={skillsCount} />
                                <Mini label="exp" value={expCount} />
                                <Mini label="edu" value={eduCount} />
                            </div>
                            <button className="kc-btn" onClick={() => navigate('seeker-match')} style={{
                                marginTop: 14, width: '100%', padding: '10px', background: KC.ink, color: '#fff',
                                border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13,
                                cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.orange}`,
                            }}>
                                Lihat Top-5 Match →
                            </button>
                        </BrutalCard>
                    ) : (
                        <BrutalCard color={KC.orange} padding={18} style={{ color: '#fff' }}>
                            <div style={{ fontSize: 24 }}>✨</div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '8px 0 6px' }}>
                                Belum upload CV
                            </h3>
                            <p style={{ fontSize: 12, opacity: 0.92, lineHeight: 1.5, margin: 0 }}>
                                Tanpa CV, AI cuma bisa nebak dari profil kosong. Upload sekali, dapet top-5 match selamanya.
                            </p>
                        </BrutalCard>
                    )}

                    <BrutalCard color="#fff" padding={18}>
                        <Tag color={KC.cyan} size="sm">tips</Tag>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: '10px 0 10px' }}>
                            Biar parse-nya akurat
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                'Pakai PDF text-based (bukan scan/foto).',
                                'Tulis skill dalam satu section yang jelas.',
                                'Cantumin tahun pengalaman per role.',
                                'Sebutin lokasi & ekspektasi gaji kalau ada.',
                            ].map((t, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, fontWeight: 600, color: KC.ink, lineHeight: 1.5 }}>
                                    <span style={{ width: 18, height: 18, borderRadius: 5, background: KC.lime, border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                                    <span>{t}</span>
                                </li>
                            ))}
                        </ul>
                    </BrutalCard>

                    <BrutalCard color={KC.ink} padding={16} style={{ color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>🔒</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800 }}>CV-mu privasi total</div>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                                    AES-256 · UU PDP · not_visible_to_employers
                                </div>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}

function Mini({ label, value }) {
    return (
        <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: KC.ink }}>{value}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: KC.mute, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
        </div>
    )
}
