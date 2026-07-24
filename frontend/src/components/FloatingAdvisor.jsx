import { useEffect, useRef } from 'react'
import { X, Send, Loader2, Bot } from 'lucide-react'
import useStore from '../store/useStore'

export default function FloatingAdvisor() {
    const {
        floatingAdvisorOpen, toggleFloatingAdvisor,
        advisorLog, advisorInput, setAdvisorInput,
        agentLoading, runAgent, isAuthenticated,
    } = useStore()
    const scrollRef = useRef(null)

    useEffect(() => {
        if (floatingAdvisorOpen) {
            scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })
        }
    }, [floatingAdvisorOpen, advisorLog.length])

    if (!isAuthenticated) return null

    const submit = (e) => {
        e?.preventDefault()
        if (!advisorInput.trim() || agentLoading) return
        runAgent({ message: advisorInput })
    }

    return (
        <>
            {/* Bubble */}
            <button
                onClick={toggleFloatingAdvisor}
                className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-kc-dark text-white border-2 border-kc-dark shadow-brutal grid place-items-center hover:bg-kc-orange transition-colors ${
                    floatingAdvisorOpen ? '' : 'animate-pulse'
                }`}
                aria-label="AI Career Advisor"
            >
                {floatingAdvisorOpen ? <X size={20} /> : <Bot size={20} />}
            </button>

            {/* Panel */}
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
                        <p className="text-[10px] font-mono text-kc-gray leading-tight">Asisten Cerdas Anda</p>
                    </div>
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
                        placeholder="Tanya tentang karier kamu…"
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

const parseInline = (text) => {
    if (!text) return '';
    const parts = text.split('**');
    return parts.map((part, i) => {
        if (i % 2 === 1) {
            return <strong key={i} className="font-extrabold">{part}</strong>;
        }
        return part;
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
        if (cleanLine.startsWith('### ')) {
            return <h4 key={idx} className="font-extrabold text-[13px] mt-2 mb-1 uppercase text-kc-dark">{parseInline(cleanLine.slice(4))}</h4>;
        }
        if (cleanLine.startsWith('## ') || cleanLine.startsWith('# ')) {
            const content = cleanLine.startsWith('## ') ? cleanLine.slice(3) : cleanLine.slice(2);
            return <h3 key={idx} className="font-extrabold text-sm mt-3 mb-1 text-kc-orange">{parseInline(content)}</h3>;
        }
        if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
            return (
                <div key={idx} className="flex gap-1.5 ml-2 my-1">
                    <span>•</span>
                    <span className="flex-1">{parseInline(cleanLine.slice(2))}</span>
                </div>
            );
        }
        const numMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
            return (
                <div key={idx} className="flex gap-1.5 ml-2 my-1">
                    <span>{numMatch[1]}.</span>
                    <span className="flex-1">{parseInline(numMatch[2])}</span>
                </div>
            );
        }
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
            return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx} className="my-1 leading-normal">{parseInline(line)}</p>;
    });
};
