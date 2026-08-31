import { useState } from 'react'
import useStore from '../store/useStore'

const KC = {
    ink: '#090A0F',
    bone: '#FAF9F5',
    orange: '#FF4800',
    ash: '#DDD9D0',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'

function Logo({ size = 26, color = KC.ink, mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 7, background: '#FEFEFE',
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `2.5px 2.5px 0 ${color}`, transform: 'rotate(-3deg)',
                overflow: 'hidden', flexShrink: 0,
            }}>
                <img src="/vite.svg" alt="KerjaCerdas Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: -0.5, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

export default function PublicHeader() {
    const { navigate, openAuthModal } = useStore()
    const [mobileOpen, setMobileOpen] = useState(false)

    const goToSection = (sectionId) => {
        setMobileOpen(false)
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
        <>
            <style>{`
            .kc-nav-desktop { display: flex; }
            .kc-nav-mobile-trigger { display: none; }
            .kc-back-text { display: inline; }
            @media (max-width: 768px) {
              .kc-nav-desktop { display: none !important; }
              .kc-nav-mobile-trigger { display: flex !important; }
            }
            @media (max-width: 640px) {
              .kc-back-text { display: none !important; }
            }
            `}</style>
            <header style={{
                position: 'sticky', top: 0, left: 0, right: 0, zIndex: 60,
                background: '#FFFFFF', borderBottom: `2px solid ${KC.ink}`,
                fontFamily: FONT,
            }}>
                <div style={{
                    maxWidth: 1280, margin: '0 auto', padding: '0 20px',
                    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    {/* Brand Logo (Primary Home Navigation) */}
                    <button
                        onClick={() => navigate('home')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            display: 'inline-flex', alignItems: 'center',
                        }}
                        title="Kembali ke Beranda"
                    >
                        <Logo size={26} />
                    </button>

                    {/* Nav links */}
                    <nav className="kc-nav-desktop" style={{ alignItems: 'center', gap: 24, fontSize: 14, fontWeight: 700 }}>
                        <button onClick={() => goToSection('how')} style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Cara Kerja
                        </button>
                        <button onClick={() => goToSection('fitur')} style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Fitur
                        </button>
                        <button onClick={() => goToSection('harga')} style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Harga
                        </button>
                        <button onClick={() => navigate('about')} style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Tentang
                        </button>
                    </nav>

                    {/* Auth buttons */}
                    <div className="kc-nav-desktop" style={{ alignItems: 'center', gap: 8 }}>
                        <button
                            id="nav-login-btn"
                            onClick={() => openAuthModal('login')}
                            style={{
                                padding: '7px 14px', fontSize: 13, fontWeight: 800,
                                background: '#fff', color: KC.ink, border: `1.5px solid ${KC.ink}`,
                                borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `2px 2px 0 ${KC.ink}`,
                            }}
                        >
                            Masuk
                        </button>
                        <button
                            id="nav-register-btn"
                            onClick={() => openAuthModal('register', 'seeker')}
                            style={{
                                padding: '7px 14px', fontSize: 13, fontWeight: 800,
                                background: KC.ink, color: '#fff', border: `1.5px solid ${KC.ink}`,
                                borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `2px 2px 0 ${KC.orange}`,
                            }}
                        >
                            Daftar Gratis
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="kc-nav-mobile-trigger"
                        style={{
                            background: '#fff', border: `2px solid ${KC.ink}`,
                            borderRadius: 6, padding: 6, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={KC.ink} strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(9, 10, 15, 0.65)' }} onClick={() => setMobileOpen(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: 0, right: 0, bottom: 0,
                            width: 'min(300px, 84vw)', background: '#FAF9F5',
                            borderLeft: `2px solid ${KC.ink}`, boxShadow: `-5px 0 0 ${KC.ink}`,
                            padding: 22, display: 'flex', flexDirection: 'column',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Logo size={24} />
                            <button
                                onClick={() => setMobileOpen(false)}
                                style={{ background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 6, padding: 5, cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, fontFamily: FONT }}>
                            <button onClick={() => goToSection('how')} style={{ textAlign: 'left', padding: '10px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                                Cara Kerja
                            </button>
                            <button onClick={() => goToSection('fitur')} style={{ textAlign: 'left', padding: '10px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                                Fitur
                            </button>
                            <button onClick={() => goToSection('harga')} style={{ textAlign: 'left', padding: '10px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                                Harga
                            </button>
                            <button onClick={() => { setMobileOpen(false); navigate('about') }} style={{ textAlign: 'left', padding: '10px 12px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                                Tentang
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: `1.5px dashed ${KC.ash}` }}>
                            <button onClick={() => { setMobileOpen(false); openAuthModal('login') }} style={{ padding: 10, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800 }}>Masuk</button>
                            <button onClick={() => { setMobileOpen(false); openAuthModal('register', 'seeker') }} style={{ padding: 10, background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800 }}>Daftar Gratis</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
