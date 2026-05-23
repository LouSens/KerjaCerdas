import useStore from '../store/useStore'

export default function PublicHeader() {
    const { navigate, openAuthModal } = useStore()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-kc-cream/95 backdrop-blur-sm border-b-2 border-kc-dark">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <button onClick={() => navigate('home')} className="flex items-center gap-1">
                    <span className="font-black text-lg text-kc-dark">kerja</span>
                    <span className="font-black text-lg text-kc-orange">cerdas</span>
                </button>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-6">
                    <button onClick={() => navigate('home')} className="text-sm text-kc-gray hover:text-kc-dark transition-colors">Cara Kerja</button>
                    <button onClick={() => navigate('home')} className="text-sm text-kc-gray hover:text-kc-dark transition-colors">Fitur</button>
                    <button onClick={() => navigate('pricing')} className="text-sm text-kc-gray hover:text-kc-dark transition-colors">Harga Employer</button>
                    <button onClick={() => navigate('about')} className="text-sm text-kc-gray hover:text-kc-dark transition-colors">Tentang</button>
                </nav>

                {/* Auth buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openAuthModal('login')}
                        className="text-sm font-semibold text-kc-dark px-4 py-1.5 border-2 border-kc-dark hover:bg-kc-dark hover:text-white transition-colors"
                    >
                        Masuk
                    </button>
                    <button
                        onClick={() => openAuthModal('register')}
                        className="text-sm font-semibold text-white bg-kc-dark px-4 py-1.5 border-2 border-kc-dark hover:bg-kc-orange transition-colors"
                    >
                        Daftar Gratis
                    </button>
                </div>
            </div>
        </header>
    )
}
