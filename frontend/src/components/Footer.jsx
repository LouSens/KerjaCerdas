import useStore from '../store/useStore'

const KC = {
    ink: '#090A0F',
    bone: '#FAF9F5',
    orange: '#FF4800',
    yellow: '#FFCB05',
    ash: '#DDD9D0',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'

function Logo({ size = 26, color = '#FFFFFF', mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 7, background: mark,
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `2.5px 2.5px 0 ${color}`, transform: 'rotate(-3deg)',
            }}>
                <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
                    <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: -0.5, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

export default function Footer() {
    const { navigate, openAuthModal } = useStore()

    const goToSection = (sectionId) => {
        navigate('home')
        setTimeout(() => {
            const el = document.getElementById(sectionId)
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 76
                window.scrollTo({ top: y, behavior: 'smooth' })
            }
        }, 120)
    }

    return (
        <footer style={{ background: KC.ink, color: '#fff', padding: '52px 0 28px', borderTop: `2px solid ${KC.ink}`, fontFamily: FONT }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 36, marginBottom: 36,
                }}>
                    {/* Brand */}
                    <div style={{ minWidth: 240 }}>
                        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                            <Logo size={26} color="#fff" mark={KC.orange} />
                        </button>
                        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, marginTop: 14, maxWidth: 280 }}>
                            Platform kecerdasan rekrutmen dan pemetaan kompetensi karier untuk ekosistem kerja modern Indonesia.
                        </p>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                            <a href="mailto:support@kerjacerdas.id" style={{ color: '#D1D5DB', textDecoration: 'none', fontWeight: 600 }} className="hover:text-kc-orange">
                                ✉ support@kerjacerdas.id
                            </a>
                            <a href="mailto:sales@kerjacerdas.id" style={{ color: '#D1D5DB', textDecoration: 'none', fontWeight: 600 }} className="hover:text-kc-orange">
                                💼 sales@kerjacerdas.id
                            </a>
                        </div>
                    </div>

                    {/* Navigation Columns */}
                    {[
                        {
                            title: 'Produk & Alur',
                            items: [
                                { label: 'Cara Kerja', fn: () => goToSection('how') },
                                { label: 'Fitur Utama', fn: () => goToSection('fitur') },
                                { label: 'Skema Harga & Token', fn: () => goToSection('harga') },
                                { label: 'Tentang Platform', fn: () => navigate('about') },
                            ]
                        },
                        {
                            title: 'Pencari Kerja',
                            items: [
                                { label: 'Eksplorasi Lowongan', fn: () => goToSection('fitur') },
                                { label: 'Upload CV & AI Match', fn: () => openAuthModal('register', 'seeker') },
                                { label: 'Analisis Skill Gap', fn: () => openAuthModal('register', 'seeker') },
                                { label: 'Masuk Portal Talenta', fn: () => openAuthModal('login', 'seeker') },
                            ]
                        },
                        {
                            title: 'Employer & HR',
                            items: [
                                { label: 'Pasang Lowongan Baru', fn: () => openAuthModal('register', 'employer') },
                                { label: 'Evaluasi Kandidat AI', fn: () => openAuthModal('register', 'employer') },
                                { label: 'Verifikasi NPWP Bisnis', fn: () => openAuthModal('register', 'employer') },
                                { label: 'Konsultasi Enterprise', fn: () => { window.location.href = 'mailto:sales@kerjacerdas.id?subject=Inquiry%20Enterprise%20KerjaCerdas' } },
                            ]
                        },
                        {
                            title: 'Legal & Kepatuhan',
                            items: [
                                { label: 'Kebijakan Privasi', fn: () => navigate('privacy') },
                                { label: 'Kepatuhan UU PDP No. 27/2022', fn: () => navigate('privacy') },
                                { label: 'Enkripsi & Keamanan Data', fn: () => navigate('privacy') },
                                { label: 'Syarat & Ketentuan', fn: () => navigate('privacy') },
                            ]
                        },
                    ].map((col, cIdx) => (
                        <div key={cIdx}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 14 }}>
                                {col.title}
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {col.items.map((item, iIdx) => (
                                    <li key={iIdx}>
                                        <button
                                            onClick={item.fn}
                                            style={{
                                                background: 'none', border: 'none', padding: 0, color: '#D1D5DB',
                                                fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                                                fontFamily: FONT, transition: 'color 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = KC.orange}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
                                        >
                                            {item.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, color: '#9CA3AF', flexWrap: 'wrap', gap: 12,
                }}>
                    <span>© 2026 KerjaCerdas Indonesia. Seluruh hak cipta dilindungi.</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span>🔒 Enkripsi AES-256</span>
                        <span>🇮🇩 Server Lokal Indonesia</span>
                    </span>
                </div>
            </div>
        </footer>
    )
}
