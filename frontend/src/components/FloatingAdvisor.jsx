/**
 * FloatingAdvisor — Seeker-only AI career chat bubble.
 *
 * FIX: renderMarkdown and parseInline were defined AFTER the component
 * using `const` (arrow functions), which are NOT hoisted. This caused a
 * ReferenceError / blank render when the AI response was shown.
 * Both helpers are now defined ABOVE the component so they are available
 * at parse time.
 *
 * Personalization: after CV upload, the advisor greeting references the
 * seeker's name (from store.profile) and skills so the LLM context passed
 * to /agent/invoke includes the seeker's actual profile, making every
 * answer personalized to their CV and the current job postings.
 */
import { useEffect, useRef } from 'react'
import { X, Send, Loader2, Bot } from 'lucide-react'
import useStore from '../store/useStore'

// ─── Markdown helpers (must be defined BEFORE the component) ─────────────────

const parseInline = (text) => {
    if (!text) return '';
    // Handle bold markdown '**'
    // NOTE: every element rendered here MUST have a key unique across the
    // whole returned array. Flattening segments with per-segment indexes
    // produced duplicate React keys, which made React duplicate DOM text on
    // every re-render (one extra copy per keystroke in the input box).
    const parts = text.split('**');
    return parts.map((part, i) => {
        const isBold = i % 2 === 1;
        // Inside bold/normal text, handle italics '*'
        const renderedSubParts = part.split('*').map((subPart, j) => {
            const isItalic = j % 2 === 1;
            if (isItalic) {
                return <em key={`${i}-${j}`} className="not-italic font-medium text-kc-orange">{subPart}</em>;
            }
            return <span key={`${i}-${j}`}>{subPart}</span>;
        });

        if (isBold) {
            return <strong key={i} className="font-extrabold text-kc-dark">{renderedSubParts}</strong>;
        }
        return <span key={i}>{renderedSubParts}</span>;
    });
};

const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
        let cleanLine = line.trim();
        if (cleanLine === '---') {
            return <hr key={idx} className="border-t border-dashed border-kc-dark my-2" />;
        }
        
        // Match headers of level 1 to 6 (e.g. ### Header)
        const headerMatch = cleanLine.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            if (level === 3) {
                return <h4 key={idx} className="font-extrabold text-[13px] mt-3 mb-1 uppercase text-kc-dark block">{parseInline(content)}</h4>;
            } else if (level <= 2) {
                return <h3 key={idx} className="font-extrabold text-sm mt-4 mb-1 text-kc-orange block">{parseInline(content)}</h3>;
            } else {
                return <h5 key={idx} className="font-bold text-[11px] mt-2 mb-1 text-kc-dark block">{parseInline(content)}</h5>;
            }
        }

        // Match bullet lists starting with - or * followed by one or more spaces
        const bulletMatch = cleanLine.match(/^[-*]\s+(.*)/);
        if (bulletMatch) {
            return (
                <div key={idx} className="flex gap-1.5 ml-2 my-1 items-start">
                    <span className="text-kc-orange">•</span>
                    <span className="flex-1 text-xs">{parseInline(bulletMatch[1])}</span>
                </div>
            );
        }

        // Match numbered lists starting with digits followed by . and one or more spaces
        const numMatch = cleanLine.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
            return (
                <div key={idx} className="flex gap-1.5 ml-2 my-1 items-start">
                    <span className="font-bold text-kc-orange">{numMatch[1]}.</span>
                    <span className="flex-1 text-xs">{parseInline(numMatch[2])}</span>
                </div>
            );
        }

        // Match table rows starting and ending with |
        if (cleanLine.startsWith('|') && cleanLine.endsWith('|')) {
            const cells = cleanLine.split('|').map(c => c.trim()).filter(c => c !== '');
            if (cells.every(c => c.match(/^-+$/))) {
                return null;
            }
            return (
                <div key={idx} className="flex gap-3 px-2 py-1 bg-white border-b border-kc-dark text-[10px] font-bold">
                    {cells.map((cell, cidx) => (
                        <div key={cidx} className="flex-1">{parseInline(cell)}</div>
                    ))}
                </div>
            );
        }

        if (cleanLine === '') {
            return <div key={idx} className="h-2" />;
        }
        
        // Standard text paragraph
        return <p key={idx} className="my-1 leading-normal text-xs">{parseInline(line)}</p>;
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FloatingAdvisor() {
    const {
        floatingAdvisorOpen, toggleFloatingAdvisor,
        advisorLog, advisorInput, setAdvisorInput,
        agentLoading, runAgent, isAuthenticated, userRole,
        profile, seekerId,
    } = useStore()
    const scrollRef = useRef(null)

    useEffect(() => {
        if (floatingAdvisorOpen) {
            scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
        }
    }, [floatingAdvisorOpen, advisorLog.length])

    // Only show for authenticated seekers
    if (!isAuthenticated || userRole !== 'seeker') return null

    const hasCV = Boolean(seekerId || profile?.skills?.length > 0)
    const topSkills = (profile?.skills || []).slice(0, 3).map(s => s.name || s).join(', ')

    // Personalized placeholder based on CV state
    const placeholder = hasCV
        ? `Tanya tentang ${topSkills ? topSkills + '...' : 'karier kamu…'}`
        : 'Upload CV dulu agar saran lebih personal…'

    const submit = (e) => {
        e?.preventDefault()
        if (!advisorInput.trim() || agentLoading) return
        // Pass explicit 'advise' intent so the backend routes to run_advisor
        // with full seeker context (skills from CV + top job matches)
        runAgent({ message: advisorInput, explicitIntent: 'advise' })
    }

    return (
        <>
            {/* Bubble toggle button */}
            <button
                onClick={toggleFloatingAdvisor}
                className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-kc-dark text-white border-2 border-kc-dark shadow-brutal grid place-items-center hover:bg-kc-orange transition-colors ${
                    floatingAdvisorOpen ? '' : 'animate-pulse'
                }`}
                aria-label="AI Career Advisor"
                title={hasCV ? 'Tanya AI Advisor kamu' : 'Upload CV dulu untuk saran personal'}
            >
                {floatingAdvisorOpen ? <X size={20} /> : <Bot size={20} />}
            </button>

            {/* Chat panel */}
            <div
                className={`fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-7rem)]
                            bg-white border-2 border-kc-dark shadow-brutal flex flex-col origin-bottom-right
                            transition-all duration-200 ${
                    floatingAdvisorOpen
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-90 pointer-events-none'
                }`}
            >
                <header className="px-4 py-3 border-b-2 border-kc-dark flex items-center gap-3 bg-kc-cream">
                    <div className="w-7 h-7 bg-kc-cyan border border-kc-dark flex items-center justify-center">
                        <Bot size={14} className="text-kc-dark" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-kc-dark leading-tight">Career Advisor</p>
                        <p className="text-[10px] font-mono text-kc-gray leading-tight">
                            {hasCV ? `Berdasarkan CV kamu · ${profile?.skills?.length || 0} skill` : 'Upload CV untuk saran personal'}
                        </p>
                    </div>
                    {!hasCV && (
                        <span className="text-[10px] font-bold text-kc-orange border border-kc-orange px-1.5 py-0.5">
                            Tanpa CV
                        </span>
                    )}
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {advisorLog.map((m, i) => (
                        <div
                            key={i}
                            className={`w-fit rounded-xl text-xs leading-relaxed px-3 py-2 max-w-[85%] border-2 border-kc-dark ${
                                m.role === 'user'
                                    ? 'ml-auto bg-kc-dark text-white rounded-br-sm'
                                    : 'mr-auto bg-kc-cream text-kc-dark rounded-bl-sm'
                            }`}
                        >
                            {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                        </div>
                    ))}
                    {agentLoading && (
                        <div className="flex items-center gap-2 text-[10px] text-kc-gray font-mono">
                            <Loader2 size={12} className="animate-spin" /> Memproses…
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="p-3 border-t-2 border-kc-dark flex items-center gap-2 bg-kc-cream">
                    <input
                        value={advisorInput}
                        onChange={(e) => setAdvisorInput(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 border-2 border-kc-dark text-xs bg-white focus:outline-none focus:border-kc-orange"
                    />
                    <button
                        type="submit"
                        disabled={agentLoading || !advisorInput.trim()}
                        className="w-9 h-9 bg-kc-dark text-white border-2 border-kc-dark grid place-items-center disabled:opacity-40 hover:bg-kc-orange transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </>
    )
}
