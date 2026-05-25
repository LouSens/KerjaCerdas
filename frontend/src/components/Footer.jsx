import useStore from '../store/useStore'

export default function Footer() {
    const { navigate } = useStore()

    return (
        <footer className="bg-kc-dark text-white border-t-2 border-kc-dark">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid sm:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-1 mb-3">
                            <span className="font-black text-base text-white">kerja</span>
                            <span className="font-black text-base text-kc-orange">cerdas</span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                            AI-powered job matching platform untuk Indonesia. Powered by Gemini.
                        </p>
                    </div>

                    {/* Seeker */}
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-3">Pencari Kerja</p>
                        <ul className="space-y-2">
                            <li><button onClick={() => navigate('home')} className="text-xs text-white/60 hover:text-white transition-colors">Cari Kerja</button></li>
                            <li><button onClick={() => navigate('home')} className="text-xs text-white/60 hover:text-white transition-colors">Upload CV</button></li>
                            <li><button onClick={() => navigate('home')} className="text-xs text-white/60 hover:text-white transition-colors">Skill Gap</button></li>
                        </ul>
                    </div>

                    {/* Employer */}
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-3">Employer</p>
                        <ul className="space-y-2">
                            <li><button onClick={() => navigate('pricing')} className="text-xs text-white/60 hover:text-white transition-colors">Harga</button></li>
                            <li><button onClick={() => navigate('home')} className="text-xs text-white/60 hover:text-white transition-colors">Pasang Lowongan</button></li>
                            <li><button onClick={() => navigate('home')} className="text-xs text-white/60 hover:text-white transition-colors">Top Kandidat</button></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-3">Legal</p>
                        <ul className="space-y-2">
                            <li><button onClick={() => navigate('privacy')} className="text-xs text-white/60 hover:text-white transition-colors">Kebijakan Privasi</button></li>
                            <li><button onClick={() => navigate('about')} className="text-xs text-white/60 hover:text-white transition-colors">Tentang</button></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[10px] text-white/30 font-mono">© 2026 KerjaCerdas. All rights reserved.</p>
                    <p className="text-[10px] text-white/30 font-mono">UU PDP compliant · Data center IDN</p>
                </div>
            </div>
        </footer>
    )
}
