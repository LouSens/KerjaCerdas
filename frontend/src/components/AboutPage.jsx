/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { submitPartnershipInquiry } from '../services/api'
import toast from 'react-hot-toast'

// ════════════════════════════════════════════════════════════════════════════
// KerjaCerdas — About Us Page (Minimalist Enterprise Neobrutalism)
// Smooth Page Transition, Zero-Jitter Routing, and Comprehensive Interactivity
// ════════════════════════════════════════════════════════════════════════════

const KC = {
    ink: '#090A0F',
    bone: '#FAF9F5',
    paper: '#FFFFFF',
    surface: '#F2EFE9',
    surfaceAlt: '#E9E5DC',
    orange: '#FF4800',
    orangeSoft: '#FFF0EB',
    yellow: '#FFC800',
    yellowSoft: '#FFF9E6',
    cyan: '#00B8D9',
    cyanSoft: '#E6F8FA',
    lime: '#B4F51C',
    limeSoft: '#F4FDE5',
    purple: '#7C3AED',
    purpleSoft: '#F3E8FF',
    mute: '#4A4944',
    muteLight: '#76746C',
    ash: '#DDD9D0',
    border: '#090A0F',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'

const ABOUT_CSS = `
@keyframes kc-about-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes kc-modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes kc-drawer-slide {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.kc-about-container {
  animation: kc-about-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.kc-btn-about {
  user-select: none;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s ease;
}
.kc-btn-about:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #090A0F !important;
}
.kc-btn-about:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #090A0F !important;
}

.kc-card-hover {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.kc-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 #090A0F !important;
}

.kc-nav-link {
  position: relative;
  transition: color 0.15s ease;
}
.kc-nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0;
  height: 2.5px;
  background: #FF4800;
  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.kc-nav-link:hover::after {
  width: 100%;
}

.kc-nav-desktop {
  display: flex;
}
.kc-nav-mobile-trigger {
  display: none;
}
.kc-back-text {
  display: inline;
}

@media (max-width: 768px) {
  .kc-nav-desktop {
    display: none !important;
  }
  .kc-nav-mobile-trigger {
    display: flex !important;
  }
}
@media (max-width: 640px) {
  .kc-back-text {
    display: none !important;
  }
  .kc-roadmap-grid {
    grid-template-columns: 1fr !important;
  }
  .kc-hero-btns {
    flex-direction: column !important;
    width: 100% !important;
  }
  .kc-hero-btns button {
    width: 100% !important;
    justify-content: center !important;
  }
}
`

function Logo({ size = 28, color = KC.ink, mark = KC.orange }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
            <div style={{
                width: size, height: size, borderRadius: 8, background: '#FEFEFE',
                border: `2px solid ${color}`, display: 'grid', placeItems: 'center',
                boxShadow: `3px 3px 0 ${color}`, transform: 'rotate(-3deg)',
                overflow: 'hidden', flexShrink: 0,
            }}>
                <img src="/vite.svg" alt="KerjaCerdas Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: size * 0.72, letterSpacing: -0.6, color }}>
                kerja<span style={{ color: mark }}>cerdas</span>
            </span>
        </div>
    )
}

export default function AboutPage() {
    const { navigate, openAuthModal } = useStore()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [inquiryOpen, setInquiryOpen] = useState(false)
    const [inquiryType, setInquiryType] = useState('Institusi & Kampus')
    const [formSubmitted, setFormSubmitted] = useState(false)
    const [inquiryLoading, setInquiryLoading] = useState(false)
    const [formData, setFormData] = useState({ name: '', org: '', email: '', message: '' })

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    const handleOpenInquiry = (type) => {
        setInquiryType(type)
        setFormSubmitted(false)
        setInquiryOpen(true)
    }

    const handleSubmitInquiry = async (e) => {
        e.preventDefault()
        setInquiryLoading(true)
        try {
            await submitPartnershipInquiry({
                category: inquiryType,
                name: formData.name.trim(),
                organization: formData.org.trim(),
                email: formData.email.trim(),
                message: formData.message.trim(),
            })
            setFormSubmitted(true)
            toast.success('Permohonan kemitraan berhasil dikirim!')
        } catch (err) {
            toast.error(err?.message || 'Gagal mengirim permohonan. Coba lagi.')
        } finally {
            setInquiryLoading(false)
        }
    }

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
        <div style={{ background: '#FAF9F5', color: KC.ink, fontFamily: FONT, minHeight: '100vh', overflowX: 'hidden' }}>
            <style>{ABOUT_CSS}</style>

            {/* ── STICKY NAVIGATION BAR ── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 60,
                background: '#FFFFFF',
                borderBottom: `2px solid ${KC.ink}`,
                fontFamily: FONT,
            }}>
                <div style={{
                    maxWidth: 1280, margin: '0 auto', padding: '0 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 64,
                }}>
                    <button
                        onClick={() => navigate('home')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                        title="Kembali ke Beranda"
                    >
                        <Logo size={26} />
                    </button>

                    {/* Desktop Links */}
                    <div className="kc-nav-desktop" style={{ alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 700 }}>
                        <button onClick={() => goToSection('how')} className="kc-nav-link" style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Cara Kerja
                        </button>
                        <button onClick={() => goToSection('fitur')} className="kc-nav-link" style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Fitur
                        </button>
                        <button onClick={() => goToSection('harga')} className="kc-nav-link" style={{ background: 'none', border: 'none', color: KC.ink, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700 }}>
                            Harga
                        </button>
                        <span style={{ color: KC.orange, fontWeight: 900, borderBottom: `2.5px solid ${KC.orange}`, paddingBottom: 2 }}>
                            Tentang
                        </span>
                    </div>

                    {/* Desktop Auth */}
                    <div className="kc-nav-desktop" style={{ alignItems: 'center', gap: 10 }}>
                        <button
                            onClick={() => openAuthModal('login')}
                            className="kc-btn-about"
                            style={{
                                padding: '8px 16px', fontSize: 13, fontWeight: 800,
                                background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`,
                                borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                            }}
                        >
                            Masuk
                        </button>
                        <button
                            onClick={() => openAuthModal('register', 'seeker')}
                            className="kc-btn-about"
                            style={{
                                padding: '8px 16px', fontSize: 13, fontWeight: 800,
                                background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`,
                                borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `2.5px 2.5px 0 ${KC.orange}`,
                            }}
                        >
                            Coba Gratis →
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
            </nav>

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
                            animation: 'kc-drawer-slide 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
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
                            <button onClick={() => setMobileOpen(false)} style={{ textAlign: 'left', padding: '10px 12px', background: KC.orangeSoft, border: `1.5px solid ${KC.orange}`, borderRadius: 8, fontWeight: 900, fontSize: 14, color: KC.orange }}>
                                Tentang (Aktif)
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: `1.5px dashed ${KC.ash}` }}>
                            <button onClick={() => { setMobileOpen(false); openAuthModal('login') }} style={{ padding: 10, background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800 }}>Masuk</button>
                            <button onClick={() => { setMobileOpen(false); openAuthModal('register', 'seeker') }} style={{ padding: 10, background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 8, fontWeight: 800 }}>Daftar Gratis</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT WITH ENTRANCE ANIMATION ── */}
            <main className="kc-about-container">
                {/* ── HERO SECTION ── */}
                <section style={{ padding: '64px 24px 56px', borderBottom: `2px solid ${KC.ink}` }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                            fontSize: 12, fontWeight: 800, background: '#fff', color: KC.ink,
                            border: `1.5px solid ${KC.ink}`, borderRadius: 6, textTransform: 'uppercase',
                            letterSpacing: 0.4,
                        }}>
                            ✦ Mengenal KerjaCerdas
                        </span>

                        <h1 style={{
                            fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: -1.6,
                            lineHeight: 1.15, margin: '20px 0 16px', color: KC.ink,
                        }}>
                            Membangun Infrastruktur Rekrutmen yang{' '}
                            <span style={{
                                background: KC.orange, color: '#fff', padding: '2px 12px',
                                border: `2px solid ${KC.ink}`, boxShadow: `4px 4px 0 ${KC.ink}`,
                                borderRadius: 8, display: 'inline-block', verticalAlign: 'middle',
                                margin: '4px 0',
                            }}>
                                Presisi & Adil
                            </span>{' '}
                            untuk Indonesia.
                        </h1>

                        <p style={{
                            fontSize: 16, lineHeight: 1.65, color: KC.mute, maxWidth: 740, margin: '0 0 28px',
                        }}>
                            KerjaCerdas hadir untuk mengatasi inefisiensi pasar tenaga kerja. Melalui algoritma pencocokan semantik multi-dimensi, validasi kredensial e-KYC, dan analisis celah kompetensi, kami memangkas ratusan jam screening menjadi keputusan terukur dalam hitungan detik.
                        </p>

                        {/* Action Buttons */}
                        <div className="kc-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => openAuthModal('register', 'seeker')}
                                className="kc-btn-about"
                                style={{
                                    padding: '13px 22px', fontSize: 14, fontWeight: 800,
                                    background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, boxShadow: `4px 4px 0 ${KC.orange}`,
                                    cursor: 'pointer', fontFamily: FONT, display: 'inline-flex',
                                    alignItems: 'center', gap: 8,
                                }}
                            >
                                Cari Peluang Kerja →
                            </button>
                            <button
                                onClick={() => openAuthModal('register', 'employer')}
                                className="kc-btn-about"
                                style={{
                                    padding: '13px 22px', fontSize: 14, fontWeight: 800,
                                    background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, boxShadow: `4px 4px 0 ${KC.ink}`,
                                    cursor: 'pointer', fontFamily: FONT,
                                }}
                            >
                                Solusi Rekrutmen HR
                            </button>
                            <button
                                onClick={() => goToSection('harga')}
                                className="kc-btn-about"
                                style={{
                                    padding: '13px 20px', fontSize: 14, fontWeight: 800,
                                    background: KC.surface, color: KC.ink, border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, boxShadow: `4px 4px 0 ${KC.ash}`,
                                    cursor: 'pointer', fontFamily: FONT,
                                }}
                            >
                                Skema Harga di Beranda
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── 4 PILLARS (BENTO GRID) ── */}
                <section style={{ padding: '64px 24px', background: '#fff', borderBottom: `2px solid ${KC.ink}` }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ marginBottom: 36 }}>
                            <span style={{
                                display: 'inline-flex', padding: '3px 8px', fontSize: 11, fontWeight: 800,
                                background: KC.cyanSoft, color: KC.ink, border: `1.5px solid ${KC.ink}`,
                                borderRadius: 6, textTransform: 'uppercase',
                            }}>
                                Pilar Utama
                            </span>
                            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, margin: '10px 0 6px', color: KC.ink }}>
                                Fondasi Teknologi & Nilai Kami
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
                            {[
                                {
                                    label: 'Tantangan Riil',
                                    title: 'Menembus Batas Pencarian Kata Kunci',
                                    desc: 'Papan lowongan konvensional menyaring CV berdasarkan kecocokan kata kunci sempit, mengabaikan potensi transferable skills kandidat.',
                                    color: KC.orange,
                                    bg: KC.orangeSoft,
                                },
                                {
                                    label: 'Solusi Cerdas',
                                    title: 'Pemahaman Semantik Multi-Dimensi',
                                    desc: 'AI kami memahami konteks riil pengalaman kerja, proyek, dan stack teknis untuk menghasilkan skor kecocokan yang berbobot.',
                                    color: KC.lime,
                                    bg: KC.limeSoft,
                                },
                                {
                                    label: 'Pengembangan Diri',
                                    title: 'Peta Skill Gap & Jalur Pelatihan',
                                    desc: 'Pencari kerja tidak hanya diberi tahu jika belum cocok, namun diberikan rekomendasi kurikulum terstruktur untuk menutup celah keahlian.',
                                    color: KC.yellow,
                                    bg: KC.yellowSoft,
                                },
                                {
                                    label: 'Integritas & Privasi',
                                    title: 'Validasi Dokumen e-KYC Terenkripsi',
                                    desc: 'Memvalidasi keaslian profil melalui KTP dan Ijazah SIVIL dengan enkripsi penuh tanpa mengekspos data pribadi ke publik.',
                                    color: KC.cyan,
                                    bg: KC.cyanSoft,
                                },
                            ].map((pillar, idx) => (
                                <div key={idx} className="kc-card-hover" style={{
                                    background: '#FAF9F5', border: `2px solid ${KC.ink}`,
                                    borderRadius: 12, padding: 22, boxShadow: `4px 4px 0 ${KC.ink}`,
                                    display: 'flex', flexDirection: 'column',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: pillar.color, border: `1.5px solid ${KC.ink}` }} />
                                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>
                                            {pillar.label}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4, lineHeight: 1.25, margin: '0 0 8px', color: KC.ink }}>
                                        {pillar.title}
                                    </h3>
                                    <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.6, margin: 0 }}>
                                        {pillar.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── VALUE FOR STAKEHOLDERS (WITH WORKING ACTIONS) ── */}
                <section style={{ padding: '64px 24px', background: '#FAF9F5', borderBottom: `2px solid ${KC.ink}` }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ marginBottom: 36 }}>
                            <span style={{
                                display: 'inline-flex', padding: '3px 8px', fontSize: 11, fontWeight: 800,
                                background: KC.yellow, color: KC.ink, border: `1.5px solid ${KC.ink}`,
                                borderRadius: 6, textTransform: 'uppercase',
                            }}>
                                Ekosistem 3 Sisi
                            </span>
                            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, margin: '10px 0 6px', color: KC.ink }}>
                                Dampak Terukur untuk Semua Pihak
                            </h2>
                            <p style={{ fontSize: 15, color: KC.mute, margin: 0 }}>
                                Setiap pemangku kepentingan mendapatkan efisiensi nyata yang saling menguatkan.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                            {/* Seeker Card */}
                            <div className="kc-card-hover" style={{
                                background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12,
                                padding: 24, boxShadow: `4px 4px 0 ${KC.ink}`, display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ height: 6, background: KC.cyan, borderRadius: 3, border: `1.5px solid ${KC.ink}`, marginBottom: 14 }} />
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>Pencari Kerja</span>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 10px', color: KC.ink }}>Dapatkan Match Relevan Tanpa Spam</h3>
                                <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, margin: '0 0 18px', flex: 1 }}>
                                    Tidak perlu lagi mengirim 100 lamaran tanpa kabar. AI memetakan posisi paling pas dengan umpan balik skill yang jujur.
                                </p>
                                <button
                                    onClick={() => openAuthModal('register', 'seeker')}
                                    className="kc-btn-about"
                                    style={{
                                        padding: '10px 14px', fontSize: 12, fontWeight: 800,
                                        background: KC.ink, color: '#fff', border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}
                                >
                                    Daftar Sebagai Talenta →
                                </button>
                            </div>

                            {/* Employer Card */}
                            <div className="kc-card-hover" style={{
                                background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12,
                                padding: 24, boxShadow: `4px 4px 0 ${KC.ink}`, display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ height: 6, background: KC.orange, borderRadius: 3, border: `1.5px solid ${KC.ink}`, marginBottom: 14 }} />
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>HR & Employer</span>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 10px', color: KC.ink }}>Top-5 Kandidat Berkualitas Instan</h3>
                                <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, margin: '0 0 18px', flex: 1 }}>
                                    Bebaskan tim rekruter dari screening ratusan resume yang tidak sesuai kriteria. Akses talenta terverifikasi dalam hitungan detik.
                                </p>
                                <button
                                    onClick={() => openAuthModal('register', 'employer')}
                                    className="kc-btn-about"
                                    style={{
                                        padding: '10px 14px', fontSize: 12, fontWeight: 800,
                                        background: KC.orange, color: '#fff', border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}
                                >
                                    Mulai Rekrut Kandidat →
                                </button>
                            </div>

                            {/* Partner & Campus Card */}
                            <div className="kc-card-hover" style={{
                                background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12,
                                padding: 24, boxShadow: `4px 4px 0 ${KC.ink}`, display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{ height: 6, background: KC.lime, borderRadius: 3, border: `1.5px solid ${KC.ink}`, marginBottom: 14 }} />
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>Kampus & Lembaga Kursus</span>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 10px', color: KC.ink }}>Koneksi Kurikulum ke Kebutuhan Industri</h3>
                                <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.55, margin: '0 0 18px', flex: 1 }}>
                                    Hubungkan lulusan dan modul sertifikasi Anda langsung dengan demand pasar kerja secara real-time.
                                </p>
                                <button
                                    onClick={() => handleOpenInquiry('Institusi & Kampus')}
                                    className="kc-btn-about"
                                    style={{
                                        padding: '10px 14px', fontSize: 12, fontWeight: 800,
                                        background: KC.lime, color: KC.ink, border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}
                                >
                                    Hubungi Kemitraan →
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── ROADMAP SECTION ── */}
                <section style={{ background: KC.ink, color: '#fff', padding: '64px 24px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 36, alignItems: 'center' }}>
                            <div>
                                <span style={{
                                    display: 'inline-flex', padding: '3px 8px', fontSize: 11, fontWeight: 800,
                                    background: KC.orange, color: '#fff', border: '1.5px solid #fff',
                                    borderRadius: 6, textTransform: 'uppercase',
                                }}>
                                    Roadmap Produk
                                </span>
                                <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: '14px 0 12px', lineHeight: 1.15 }}>
                                    Pengembangan Berkelanjutan
                                </h2>
                                <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6, margin: '0 0 24px' }}>
                                    Platform kami dibangun dengan arsitektur modern berstandar enterprise yang siap terhubung dengan ekosistem rekrutmen nasional.
                                </p>
                                <button
                                    onClick={() => handleOpenInquiry('Enterprise & HR')}
                                    className="kc-btn-about"
                                    style={{
                                        padding: '11px 18px', fontSize: 13, fontWeight: 800,
                                        background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`,
                                        borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                    }}
                                >
                                    Diskusikan Kebutuhan Enterprise
                                </button>
                            </div>

                            <div className="kc-roadmap-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    { phase: 'Fase 1 (Aktif)', desc: 'Matching Vektor Semantik & e-KYC', color: KC.lime },
                                    { phase: 'Fase 2', desc: 'Integrasi API ATS Korporasi', color: KC.cyan },
                                    { phase: 'Fase 3', desc: 'Kurikulum Pelatihan Terpadu', color: KC.yellow },
                                    { phase: 'Fase 4', desc: 'Simulasi Wawancara AI Real-Time', color: KC.orange },
                                ].map((r, i) => (
                                    <div key={i} style={{
                                        background: '#14151D', border: `1.5px solid rgba(255,255,255,0.2)`,
                                        borderRadius: 10, padding: 16,
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: r.color, textTransform: 'uppercase' }}>
                                            {r.phase}
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                                            {r.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── BOTTOM CTA ── */}
                <section style={{
                    background: KC.orange, color: '#fff', padding: '56px 24px',
                    borderTop: `2px solid ${KC.ink}`, textAlign: 'center',
                }}>
                    <div style={{ maxWidth: 640, margin: '0 auto' }}>
                        <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1.2, margin: '0 0 12px' }}>
                            Mari Berkolaborasi Bersama KerjaCerdas
                        </h2>
                        <p style={{ fontSize: 15, opacity: 0.95, lineHeight: 1.55, margin: '0 0 24px' }}>
                            Tingkatkan efisiensi proses seleksi kerja dan bantu talenta Indonesia berkembang secara optimal.
                        </p>
                        <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={() => openAuthModal('register', 'seeker')}
                                className="kc-btn-about"
                                style={{
                                    padding: '12px 22px', fontSize: 14, fontWeight: 800,
                                    background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, boxShadow: `3.5px 3.5px 0 ${KC.ink}`, cursor: 'pointer',
                                    fontFamily: FONT,
                                }}
                            >
                                Mulai Sebagai Talenta
                            </button>
                            <button
                                onClick={() => openAuthModal('register', 'employer')}
                                className="kc-btn-about"
                                style={{
                                    padding: '12px 22px', fontSize: 14, fontWeight: 800,
                                    background: KC.ink, color: '#fff', border: `2px solid ${KC.ink}`,
                                    borderRadius: 8, boxShadow: `3.5px 3.5px 0 ${KC.yellow}`, cursor: 'pointer',
                                    fontFamily: FONT,
                                }}
                            >
                                Daftar Akun HR →
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ background: KC.ink, color: '#fff', padding: '52px 0 28px', borderTop: `2px solid ${KC.ink}` }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 32, marginBottom: 36,
                    }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <Logo size={26} color="#fff" mark={KC.orange} />
                            <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginTop: 12, maxWidth: 300 }}>
                                Platform kecerdasan rekrutmen dan pemetaan kompetensi karier untuk ekosistem kerja modern Indonesia.
                            </p>
                        </div>

                        {[
                            { title: 'Produk', items: [
                                { label: 'Cara Kerja', fn: () => goToSection('how') },
                                { label: 'Fitur', fn: () => goToSection('fitur') },
                                { label: 'Harga', fn: () => goToSection('harga') },
                            ]},
                            { title: 'Solusi', items: [
                                { label: 'Untuk Talenta', fn: () => openAuthModal('register', 'seeker') },
                                { label: 'Untuk HR / Employer', fn: () => openAuthModal('register', 'employer') },
                                { label: 'Institusi & Kampus', fn: () => handleOpenInquiry('Institusi & Kampus') },
                                { label: 'Partner Pelatihan', fn: () => handleOpenInquiry('Partner Pelatihan') },
                            ]},
                            { title: 'Perusahaan', items: [
                                { label: 'Tentang Kami', fn: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                                { label: 'Karier', fn: () => handleOpenInquiry('Karier / Internal') },
                                { label: 'Hubungi Sales', fn: () => handleOpenInquiry('Enterprise & HR') },
                            ]},
                            { title: 'Legal', items: [
                                { label: 'Kebijakan Privasi', fn: () => navigate('privacy') },
                                { label: 'Syarat & Ketentuan', fn: () => navigate('privacy') },
                                { label: 'Keamanan Data', fn: () => navigate('privacy') },
                            ]},
                        ].map((col, cIdx) => (
                            <div key={cIdx}>
                                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 12 }}>
                                    {col.title}
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {col.items.map((item, iIdx) => (
                                        <li key={iIdx}>
                                            <button
                                                onClick={item.fn}
                                                style={{
                                                    background: 'none', border: 'none', padding: 0, color: '#D1D5DB',
                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
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
                        borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 11, color: '#9CA3AF', flexWrap: 'wrap', gap: 10,
                    }}>
                        <span>© 2026 KerjaCerdas Indonesia. Seluruh hak cipta dilindungi.</span>
                    </div>
                </div>
            </footer>

            {/* ── PARTNERSHIP / INQUIRY MODAL ── */}
            {inquiryOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(9, 10, 15, 0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'grid', placeItems: 'center', padding: 16,
                }} onClick={() => setInquiryOpen(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#FAF9F5', border: `2px solid ${KC.ink}`,
                            borderRadius: 14, padding: 24, maxWidth: 480, width: '100%',
                            boxShadow: `6px 6px 0 ${KC.ink}`, fontFamily: FONT, color: KC.ink,
                            maxHeight: '90vh', overflowY: 'auto',
                            animation: 'kc-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{
                                padding: '3px 8px', fontSize: 11, fontWeight: 800,
                                background: KC.orange, color: '#fff', borderRadius: 4,
                                border: `1.5px solid ${KC.ink}`, textTransform: 'uppercase',
                            }}>
                                {inquiryType}
                            </span>
                            <button
                                onClick={() => setInquiryOpen(false)}
                                style={{
                                    display: 'grid', placeItems: 'center',
                                    width: 28, height: 28,
                                    background: '#fff', border: `1.5px solid ${KC.ink}`,
                                    borderRadius: 6, cursor: 'pointer',
                                    fontWeight: 900,
                                }}
                                aria-label="Tutup"
                            >
                                ✕
                            </button>
                        </div>

                        {!formSubmitted ? (
                            <form onSubmit={handleSubmitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                                    Hubungi Tim Kemitraan
                                </h3>
                                <p style={{ fontSize: 12, color: KC.mute, margin: 0 }}>
                                    Kirim pesan permohonan kemitraan atau integrasi sistem ke tim KerjaCerdas.
                                </p>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                        Nama Lengkap *
                                    </label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nama Anda"
                                        style={{
                                            width: '100%', padding: '8px 10px', background: '#fff',
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                            fontWeight: 600, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                        Institusi / Perusahaan *
                                    </label>
                                    <input
                                        required
                                        value={formData.org}
                                        onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                                        placeholder="Nama Lembaga / Instansi"
                                        style={{
                                            width: '100%', padding: '8px 10px', background: '#fff',
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                            fontWeight: 600, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                        Email Kerja / Resmi *
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@lembaga.ac.id"
                                        style={{
                                            width: '100%', padding: '8px 10px', background: '#fff',
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                            fontWeight: 600, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                                        Pesan / Keterangan
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Jelaskan kebutuhan kerja sama..."
                                        style={{
                                            width: '100%', padding: '8px 10px', background: '#fff',
                                            border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 13,
                                            fontWeight: 600, fontFamily: FONT, outline: 'none', resize: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={inquiryLoading}
                                    className="kc-btn-about"
                                    style={{
                                        marginTop: 4, padding: '10px', background: KC.ink, color: '#fff',
                                        border: `2px solid ${KC.ink}`, borderRadius: 6, fontWeight: 800,
                                        fontSize: 13, cursor: inquiryLoading ? 'not-allowed' : 'pointer',
                                        opacity: inquiryLoading ? 0.7 : 1, fontFamily: FONT,
                                    }}
                                >
                                    {inquiryLoading ? 'Mengirim...' : 'Kirim Permohonan'}
                                </button>

                                <div style={{ fontSize: 11, color: KC.mute, textAlign: 'center' }}>
                                    Atau email ke: <b>sales@kerjacerdas.id</b>
                                </div>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%', background: KC.lime,
                                    border: `2px solid ${KC.ink}`, display: 'grid', placeItems: 'center',
                                    margin: '0 auto 12px', boxShadow: `3px 3px 0 ${KC.ink}`,
                                    fontWeight: 900, fontSize: 22,
                                }}>
                                    ✓
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>
                                    Permohonan Terkirim!
                                </h3>
                                <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.5, margin: '0 0 16px' }}>
                                    Terima kasih, <b>{formData.name}</b> ({formData.org}). Tim KerjaCerdas akan mempelajari kebutuhan Anda dan menghubungi email <b>{formData.email}</b> dalam 1x24 jam.
                                </p>
                                <button
                                    onClick={() => setInquiryOpen(false)}
                                    className="kc-btn-about"
                                    style={{
                                        padding: '8px 18px', background: KC.ink, color: '#fff',
                                        border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontWeight: 800,
                                        fontSize: 12, cursor: 'pointer',
                                    }}
                                >
                                    Selesai
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
