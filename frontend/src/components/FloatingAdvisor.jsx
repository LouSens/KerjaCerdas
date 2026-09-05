/**
 * FloatingAdvisor — Seeker-only AI career chat bubble.
 * Redesigned with Enterprise Neobrutalism styling, prompt suggestion chips, and responsive layout.
 */
import { useEffect, useRef } from 'react'
import { X, Send, Loader2, Sparkles, Bot, CheckCircle2, MessageSquare, ArrowRight, User } from 'lucide-react'
import useStore from '../store/useStore'
import { KC, DesignStyles, useIsMobile } from './_design'

// ─── Markdown helpers ─────────────────────────────────────────────────────────

const parseInline = (text) => {
    if (!text) return ''
    const parts = text.split('**')
    return parts.map((part, i) => {
        const isBold = i % 2 === 1
        const renderedSubParts = part.split('*').map((subPart, j) => {
            const isItalic = j % 2 === 1
            if (isItalic) {
                return <em key={`${i}-${j}`} style={{ color: KC.orange, fontStyle: 'normal', fontWeight: 600 }}>{subPart}</em>
            }
            return <span key={`${i}-${j}`}>{subPart}</span>
        })
        if (isBold) {
            return <strong key={i} style={{ fontWeight: 800, color: KC.ink }}>{renderedSubParts}</strong>
        }
        return <span key={i}>{renderedSubParts}</span>
    })
}

const renderMarkdown = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, idx) => {
        let cleanLine = line.trim()
        if (cleanLine === '---') {
            return <hr key={idx} style={{ border: 'none', borderTop: `1px dashed ${KC.borderMuted}`, margin: '8px 0' }} />
        }

        const headerMatch = cleanLine.match(/^(#{1,6})\s+(.*)/)
        if (headerMatch) {
            const level = headerMatch[1].length
            const content = headerMatch[2]
            if (level <= 2) {
                return (
                    <h3 key={idx} style={{ fontSize: 13, fontWeight: 900, color: KC.orange, margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        {parseInline(content)}
                    </h3>
                )
            }
            return (
                <h4 key={idx} style={{ fontSize: 12, fontWeight: 800, color: KC.ink, margin: '6px 0 2px' }}>
                    {parseInline(content)}
                </h4>
            )
        }

        const bulletMatch = cleanLine.match(/^[-*]\s+(.*)/)
        if (bulletMatch) {
            return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '3px 0 3px 4px', fontSize: 12, lineHeight: 1.45 }}>
                    <span style={{ color: KC.orange, fontWeight: 900 }}>•</span>
                    <span style={{ flex: 1, color: KC.ink }}>{parseInline(bulletMatch[1])}</span>
                </div>
            )
        }

        const numMatch = cleanLine.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
            return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '3px 0 3px 4px', fontSize: 12, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 800, color: KC.orange }}>{numMatch[1]}.</span>
                    <span style={{ flex: 1, color: KC.ink }}>{parseInline(numMatch[2])}</span>
                </div>
            )
        }

        if (cleanLine.startsWith('|') && cleanLine.endsWith('|')) {
            const cells = cleanLine.split('|').map(c => c.trim()).filter(c => c !== '')
            if (cells.every(c => c.match(/^-+$/))) return null
            return (
                <div key={idx} style={{ display: 'flex', gap: 8, padding: '4px 8px', background: '#FFFFFF', border: `1px solid ${KC.ash}`, borderRadius: 4, fontSize: 11, fontWeight: 700, margin: '4px 0' }}>
                    {cells.map((cell, cidx) => (
                        <div key={cidx} style={{ flex: 1 }}>{parseInline(cell)}</div>
                    ))}
                </div>
            )
        }

        if (cleanLine === '') return <div key={idx} style={{ height: 6 }} />

        return <p key={idx} style={{ margin: '4px 0', fontSize: 12, lineHeight: 1.5, color: KC.ink }}>{parseInline(line)}</p>
    })
}

const QUICK_PROMPTS = [
    'Skill apa yang perlu saya tingkatkan untuk posisi Backend?',
    'Bagaimana cara meningkatkan skor kecocokan saya?',
    'Rekomendasikan lowongan paling relevan untuk profil saya',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function FloatingAdvisor({ asPage = false }) {
    const isMobile = useIsMobile()
    const {
        floatingAdvisorOpen, toggleFloatingAdvisor,
        advisorLog, advisorInput, setAdvisorInput,
        agentLoading, runAgent, isAuthenticated, userRole,
        profile, seekerId, activeView, navigate,
    } = useStore()
    const scrollRef = useRef(null)

    useEffect(() => {
        if (floatingAdvisorOpen || asPage) {
            scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
        }
    }, [floatingAdvisorOpen, asPage, advisorLog?.length])

    // Only show for authenticated seekers
    if (!isAuthenticated || userRole !== 'seeker') return null

    // If activeView is already seeker-advisor and this is the global FloatingAdvisor instance, don't show duplicate floating button
    if (!asPage && activeView === 'seeker-advisor') return null

    const hasCV = Boolean(seekerId || profile?.skills?.length > 0)
    const topSkills = (profile?.skills || []).slice(0, 3).map(s => s.name || s).join(', ')

    const placeholder = 'Tanya soal karir Anda…'

    const submit = (e, customMsg = null) => {
        if (e) e.preventDefault()
        const text = customMsg || advisorInput
        if (!text || !text.trim() || agentLoading) return
        runAgent({ message: text.trim(), explicitIntent: 'advise' })
        if (!customMsg) setAdvisorInput('')
    }

    const PRESET_CHIPS = [
        { label: 'Bandingkan gaji', prompt: 'Bandingkan gaji backend vs DevOps di pasar saat ini' },
        { label: 'Gap tercepat', prompt: 'Apa gap tercepat yang bisa saya tutup untuk menaikkan skor match?' },
        { label: 'Perbaiki CV', prompt: 'Bantu berikan saran perbaikan poin-poin pengalaman pada CV saya' },
    ]

    // Standalone Page Mode (Frame 12)
    if (asPage) {
        return (
            <div style={{
                width: '100%', maxWidth: 500, margin: '0 auto',
                background: '#EDEAE2', border: `1.5px solid ${KC.ink}`,
                borderRadius: 18, boxShadow: `4px 4px 0 ${KC.ink}`,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                height: 'calc(100vh - 120px)', minHeight: 480,
            }}>
                <DesignStyles />

                {/* Top Header (Frame 12) */}
                <div style={{
                    padding: '13px 18px', background: '#090A0F',
                    display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, background: KC.orange,
                        border: '1.5px solid #FFFFFF', display: 'grid', placeItems: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{ width: 13, height: 13, background: '#FFFFFF', transform: 'rotate(45deg)', borderRadius: 2 }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
                            AI Career Advisor
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                            <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%' }} />
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                                Aktif · konteks profil Anda
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('seeker-dashboard')}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        ✕ Tutup
                    </button>
                </div>

                {/* Chat Message Thread */}
                <div
                    ref={scrollRef}
                    style={{
                        flex: 1, overflowY: 'auto', padding: '16px 16px',
                        display: 'flex', flexDirection: 'column', gap: 11,
                    }}
                >
                    {advisorLog.map((msg, i) => {
                        const isUser = msg.role === 'user'
                        return (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                                    animation: 'kcSlideUp .3s both',
                                }}
                            >
                                <div style={{
                                    maxWidth: '82%', padding: '11px 13px',
                                    background: isUser ? '#090A0F' : '#FFFFFF',
                                    color: isUser ? '#FFFFFF' : '#1E293B',
                                    border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 13,
                                    borderBottomLeftRadius: isUser ? 13 : 4,
                                    borderBottomRightRadius: isUser ? 4 : 13,
                                    boxShadow: isUser ? 'none' : `2px 2px 0 ${KC.ink}`,
                                    fontSize: 12.5, lineHeight: 1.5, fontWeight: 600,
                                }}>
                                    {isUser ? msg.content : renderMarkdown(msg.content)}
                                </div>
                            </div>
                        )
                    })}
                    {agentLoading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{
                                padding: '10px 14px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                borderRadius: 13, borderBottomLeftRadius: 4, fontSize: 12, color: KC.mute,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Loader2 size={14} className="animate-spin" /> Sedang menganalisis profil…
                            </div>
                        </div>
                    )}
                </div>

                {/* Preset Prompt Chips (Frame 12) */}
                <div style={{
                    padding: '8px 14px', display: 'flex', gap: 7, overflowX: 'auto',
                    flexShrink: 0, WebkitOverflowScrolling: 'touch',
                }}>
                    {PRESET_CHIPS.map(chip => (
                        <button
                            key={chip.label}
                            type="button"
                            onClick={() => submit(null, chip.prompt)}
                            style={{
                                padding: '8px 12px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                                borderRadius: 999, fontSize: 11, fontWeight: 800, color: KC.ink,
                                whiteSpace: 'nowrap', cursor: 'pointer', minHeight: 36,
                                display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit',
                                flexShrink: 0,
                            }}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Input Bar (Frame 12) */}
                <form
                    onSubmit={submit}
                    style={{
                        padding: '10px 14px calc(14px + env(safe-area-inset-bottom, 0px))',
                        display: 'flex', gap: 9, alignItems: 'center',
                        borderTop: '1.5px solid #CBD5E1', background: '#FAF9F5', flexShrink: 0,
                    }}
                >
                    <input
                        type="text"
                        value={advisorInput}
                        onChange={(e) => setAdvisorInput(e.target.value)}
                        placeholder={placeholder}
                        style={{
                            flex: 1, minWidth: 0, padding: '12px 14px', background: '#FFFFFF',
                            border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                            fontSize: 12.5, fontWeight: 600, color: KC.ink, outline: 'none',
                            fontFamily: 'inherit', minHeight: 46, boxSizing: 'border-box',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={agentLoading || !advisorInput.trim()}
                        style={{
                            width: 46, height: 46, background: KC.orange,
                            border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                            boxShadow: `2.5px 2.5px 0 ${KC.ink}`, display: 'grid', placeItems: 'center',
                            cursor: 'pointer', fontSize: 16, fontWeight: 900, color: '#FFFFFF',
                            fontFamily: 'inherit', flexShrink: 0,
                        }}
                    >
                        →
                    </button>
                </form>
            </div>
        )
    }

    return (
        <>
            <DesignStyles />

            <style>{`
            .kc-advisor-btn {
              position: fixed;
              bottom: 24px;
              right: 24px;
              z-index: 999;
            }
            .kc-advisor-panel {
              position: fixed;
              bottom: 88px;
              right: 24px;
              z-index: 999;
              width: 390px;
              max-width: calc(100vw - 32px);
              height: 530px;
              max-height: calc(100vh - 110px);
            }
            @media (max-width: 768px) {
              .kc-advisor-btn {
                bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
                right: 16px !important;
                height: 44px !important;
                padding: 0 14px !important;
                font-size: 12px !important;
                border-radius: 10px !important;
              }
              .kc-advisor-panel {
                bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important;
                right: 10px !important;
                left: 10px !important;
                width: auto !important;
                max-width: calc(100vw - 20px) !important;
                height: 480px !important;
                max-height: calc(100vh - 84px) !important;
                border-radius: 12px !important;
              }
            }
            `}</style>

            {/* Bubble toggle button */}
            <button
                id="floating-advisor-toggle-btn"
                onClick={() => {
                    if (isMobile) {
                        navigate('seeker-advisor')
                    } else {
                        toggleFloatingAdvisor()
                    }
                }}
                className="kc-advisor-btn"
                style={{
                    padding: floatingAdvisorOpen ? '0 16px' : '0 20px',
                    background: floatingAdvisorOpen ? '#FFFFFF' : KC.ink,
                    color: floatingAdvisorOpen ? KC.ink : '#FFFFFF',
                    border: `2px solid ${KC.ink}`,
                    borderRadius: 14,
                    boxShadow: `3px 3px 0 ${KC.ink}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)'
                    e.currentTarget.style.boxShadow = `5px 5px 0 ${KC.ink}`
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)'
                    e.currentTarget.style.boxShadow = `3px 3px 0 ${KC.ink}`
                }}
                aria-label="AI Career Advisor"
            >
                {floatingAdvisorOpen ? (
                    <>
                        <X size={18} />
                        <span>Tutup Chat</span>
                    </>
                ) : (
                    <>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: KC.orange, border: `1px solid ${KC.ink}`, display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                            <Sparkles size={15} />
                        </div>
                        <span>AI Advisor</span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: KC.lime, boxShadow: `0 0 6px ${KC.lime}` }} />
                    </>
                )}
            </button>

            {/* Chat panel */}
            <div
                className="kc-advisor-panel"
                style={{
                    background: '#FFFFFF',
                    border: `2px solid ${KC.ink}`,
                    borderRadius: 14,
                    boxShadow: `5px 5px 0 ${KC.ink}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: floatingAdvisorOpen ? 1 : 0,
                    transform: floatingAdvisorOpen ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(20px)',
                    pointerEvents: floatingAdvisorOpen ? 'auto' : 'none',
                }}
            >
                {/* Header */}
                <header style={{ padding: '14px 16px', background: KC.surface, borderBottom: `1.5px solid ${KC.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: KC.orange, border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: KC.ink }}>Career Advisor AI</span>
                                <span style={{ padding: '1px 6px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 4, fontSize: 9, fontWeight: 800, color: '#047857' }}>
                                    ONLINE
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: KC.mute, marginTop: 1 }}>
                                {hasCV ? `Terhubung ke Profil (${profile?.skills?.length || 4} keahlian)` : 'Mode Konsultasi Umum'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={toggleFloatingAdvisor}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: `1.5px solid ${KC.ink}`,
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            color: KC.ink,
                        }}
                    >
                        <X size={15} />
                    </button>
                </header>

                {/* Messages Body */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, background: '#FFFFFF' }}>
                    {advisorLog.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto', marginBottom: 'auto' }}>
                            <div style={{ padding: '16px', background: KC.surface, border: `1.5px solid ${KC.ink}`, borderRadius: 10, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Sparkles size={16} color={KC.orange} />
                                    <h4 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: KC.ink }}>Konsultasi Karir Cerdas</h4>
                                </div>
                                <p style={{ fontSize: 12, color: KC.inkLight, lineHeight: 1.5, margin: 0 }}>
                                    Halo! Saya asisten AI KerjaCerdas. Tanyakan rekomendasi posisi, evaluasi resume, atau strategi peningkatan skill gap Anda.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.mute }}>
                                    Contoh Pertanyaan Cepat:
                                </span>
                                {QUICK_PROMPTS.map((prompt, pIdx) => (
                                    <button
                                        key={pIdx}
                                        onClick={() => submit(null, prompt)}
                                        style={{
                                            padding: '8px 12px',
                                            background: '#FFFFFF',
                                            border: `1.5px solid ${KC.ink}`,
                                            borderRadius: 8,
                                            boxShadow: `1.5px 1.5px 0 ${KC.ink}`,
                                            textAlign: 'left',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: KC.ink,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            transition: 'all 0.1s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = KC.orangeSoft}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                    >
                                        <span>{prompt}</span>
                                        <ArrowRight size={12} color={KC.orange} style={{ flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        advisorLog.map((m, i) => {
                            const isUser = m.role === 'user'
                            return (
                                <div
                                    key={i}
                                    style={{
                                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%',
                                        padding: '10px 14px',
                                        background: isUser ? KC.ink : KC.surface,
                                        color: isUser ? '#FFFFFF' : KC.ink,
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                        boxShadow: isUser ? `2px 2px 0 ${KC.borderMuted}` : `2px 2px 0 ${KC.ink}`,
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {isUser ? m.content : renderMarkdown(m.content)}
                                </div>
                            )
                        })
                    )}

                    {agentLoading && (
                        <div style={{ alignSelf: 'flex-start', padding: '8px 12px', background: KC.surface, border: `1.5px solid ${KC.ink}`, borderRadius: '12px 12px 12px 2px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: KC.mute }}>
                            <Loader2 size={13} className="animate-spin" color={KC.orange} />
                            <span>AI sedang menganalisis data karir…</span>
                        </div>
                    )}
                </div>

                {/* Input Footer */}
                <form
                    onSubmit={submit}
                    style={{
                        padding: '12px 14px',
                        background: KC.surface,
                        borderTop: `1.5px solid ${KC.ink}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <input
                        value={advisorInput}
                        onChange={(e) => setAdvisorInput(e.target.value)}
                        placeholder={placeholder}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            border: `1.5px solid ${KC.ink}`,
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={agentLoading || !advisorInput.trim()}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: KC.orange,
                            border: `1.5px solid ${KC.ink}`,
                            boxShadow: `2px 2px 0 ${KC.ink}`,
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: (agentLoading || !advisorInput.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (agentLoading || !advisorInput.trim()) ? 0.5 : 1,
                            flexShrink: 0,
                            transition: 'all 0.1s ease',
                        }}
                    >
                        <Send size={15} />
                    </button>
                </form>
            </div>
        </>
    )
}
