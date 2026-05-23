import { useRef, useEffect } from 'react'
import { Send, Bot, User, RotateCcw, Sparkles, Zap } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * AdvisorChat — AI career advisor chat interface.
 *
 * Connected to: POST /api/v1/advisor via Zustand.
 * Uses Google Gemini in live mode, pre-scripted responses in demo.
 * Features: markdown parsing, quick prompts, typing indicator, chat reset.
 */
export default function AdvisorChat() {
    const {
        chatMessages, chatInput, chatLoading,
        setChatInput, sendMessage, clearChat,
    } = useStore()
    const scrollRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [chatMessages])

    /**
     * Handles form submission for sending a message.
     */
    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage()
        inputRef.current?.focus()
    }

    /**
     * Handles Enter key to send message.
     */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    /**
     * Renders text content with markdown-style bold and bullet parsing.
     */
    const renderContent = (text) => {
        return text.split('\n').map((line, i) => {
            // Handle bullet points
            const isBullet = line.startsWith('• ') || line.startsWith('- ')
            const bulletContent = isBullet ? line.slice(2) : line

            return (
                <p key={i} className={`${line === '' ? 'h-2' : ''} ${isBullet ? 'pl-3 relative' : ''}`}>
                    {isBullet && <span className="absolute left-0 text-brand-500 font-black">•</span>}
                    {bulletContent.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-ink font-black">{part.slice(2, -2)}</strong>
                        }
                        return part
                    })}
                </p>
            )
        })
    }

    const quickPrompts = [
        { text: 'Karier apa yang cocok untuk saya?', icon: '🎯' },
        { text: 'Bagaimana cara negosiasi gaji?', icon: '💰' },
        { text: 'Tips CV untuk fresh graduate', icon: '📄' },
        { text: 'Skill yang trending di 2026', icon: '📈' },
        { text: 'Rencana karier Data Scientist', icon: '🔬' },
        { text: 'Persiapan interview teknik', icon: '💼' },
    ]

    return (
        <div className="bg-white border-[3px] border-ink rounded-[2rem] shadow-[8px_8px_0px_#111827] flex flex-col h-[calc(100vh-140px)] min-h-[650px] max-h-[850px] animate-fade-in overflow-hidden relative">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b-[3px] border-ink bg-[#B8FF6D] shrink-0 z-10 relative">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF90E8] border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0px_#111827] transform -rotate-3 hover:rotate-0 transition-transform">
                        <Bot className="w-8 h-8 text-ink" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-ink uppercase tracking-tight">Karier AI</h2>
                            <span className="bg-ink text-white border-[3px] border-ink px-2.5 py-1 rounded-lg text-xs font-black shadow-[2px_2px_0px_#FF90E8] flex items-center gap-1.5 transform rotate-2">
                                <Sparkles className="w-3.5 h-3.5" strokeWidth={3} />
                                GEMINI
                            </span>
                        </div>
                        <p className="text-sm font-bold text-ink/80 mt-1 uppercase tracking-wider">
                            Asisten Pintar KerjaMasaDepan
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 bg-white border-2 border-ink px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#111827]">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-ink animate-pulse" />
                            <span className="text-xs font-black text-ink uppercase">Online</span>
                        </div>
                        <button
                            onClick={clearChat}
                            className="w-10 h-10 rounded-xl bg-white border-[3px] border-ink flex items-center justify-center hover:bg-rose-400 hover:shadow-[2px_2px_0px_#111827] transition-all group"
                            title="Reset chat"
                        >
                            <RotateCcw className="w-5 h-5 text-ink group-hover:-rotate-90 transition-transform" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-surface-50 relative">
                {/* Subtle grid background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #111827 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                
                <div className="relative z-10 space-y-8">
                    {chatMessages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
                            style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
                        >
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border-[3px] border-ink shadow-[4px_4px_0px_#111827] ${msg.role === 'user'
                                ? 'bg-[#FFC900] transform rotate-3'
                                : 'bg-[#FF90E8] transform -rotate-3'
                                }`}>
                                {msg.role === 'user'
                                    ? <User className="w-6 h-6 text-ink" strokeWidth={3} />
                                    : <Bot className="w-6 h-6 text-ink" strokeWidth={3} />
                                }
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[85%] sm:max-w-[75%] rounded-[1.5rem] px-6 py-5 text-base font-bold leading-relaxed shadow-[6px_6px_0px_#111827] border-[3px] border-ink ${msg.role === 'user'
                                ? 'bg-[#00E5FF] text-ink rounded-tr-md'
                                : 'bg-white text-ink rounded-tl-md'
                                }`}>
                                {renderContent(msg.content)}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {chatLoading && (
                        <div className="flex gap-4 animate-fade-in">
                            <div className="w-12 h-12 rounded-2xl bg-[#FF90E8] border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0px_#111827] shrink-0 transform -rotate-3">
                                <Bot className="w-6 h-6 text-ink" strokeWidth={3} />
                            </div>
                            <div className="bg-white border-[3px] border-ink rounded-[1.5rem] rounded-tl-md px-6 py-5 shadow-[6px_6px_0px_#111827]">
                                <div className="flex gap-3 items-center">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 border-2 border-ink rounded-full bg-[#B8FF6D] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-3 h-3 border-2 border-ink rounded-full bg-[#00E5FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-3 h-3 border-2 border-ink rounded-full bg-[#FFC900] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span className="text-sm font-black text-ink uppercase tracking-wider ml-2">Mengolah Data...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick prompts */}
            {chatMessages.length <= 1 && (
                <div className="px-4 sm:px-6 pb-6 shrink-0 bg-surface-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-0.5 flex-1 bg-ink/10"></div>
                        <p className="text-xs text-ink font-black uppercase tracking-widest bg-white border-[3px] border-ink px-3 py-1 rounded-lg transform -rotate-1 shadow-[2px_2px_0px_#111827]">🔥 Tanya AI Gini Nih:</p>
                        <div className="h-0.5 flex-1 bg-ink/10"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {quickPrompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(prompt.text)}
                                className="text-xs sm:text-sm font-black text-left text-ink bg-white border-[3px] border-ink
                                   rounded-xl px-4 py-3 hover:bg-[#B8FF6D] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1
                                   transition-all duration-200 group/prompt flex items-start sm:items-center gap-2"
                            >
                                <span className="text-lg group-hover:scale-125 transition-transform origin-bottom-left">{prompt.icon}</span>
                                <span className="leading-tight">{prompt.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 border-t-[3px] border-ink shrink-0 bg-white relative z-10">
                <div className="flex gap-3 items-stretch">
                    <input
                        ref={inputRef}
                        id="chat-input"
                        type="text"
                        className="flex-1 bg-surface-50 border-[3px] border-ink rounded-xl px-5 text-base font-bold text-ink placeholder-ink/40 outline-none focus:bg-white focus:shadow-[6px_6px_0px_#111827] transition-all"
                        placeholder="Tanya apapun seputar karier, saya di sini bos..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={chatLoading}
                    />
                    <button
                        id="btn-send"
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-ink text-white border-[3px] border-ink font-black px-6 py-4 rounded-xl shadow-[4px_4px_0px_#FFC900] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FFC900] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#FFC900] transition-all shrink-0 flex items-center justify-center"
                    >
                        {chatLoading ? (
                            <svg className="animate-spin h-6 w-6 text-[#FFC900]" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <Send className="w-6 h-6 text-[#FFC900]" strokeWidth={3} />
                        )}
                    </button>
                </div>
                <p className="text-xs uppercase font-black text-ink/60 tracking-widest mt-4 text-center">
                    <Zap className="w-4 h-4 inline mr-1 text-[#FFC900] fill-current" />
                    Powered by Google Gemini // Made in Indonesia
                </p>
            </form>
        </div>
    )
}
