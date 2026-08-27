import { useEffect, useState } from 'react'
import useStore from '../store/useStore'

const KC = {
    ink: '#090A0F',
    bone: '#FAF9F5',
    orange: '#FF4800',
    yellow: '#FFCB05',
    lime: '#B4F51C',
    cyan: '#00E5FF',
    ash: '#DDD9D0',
    card: '#FFFFFF',
    border: '#090A0F',
}

const FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif'

const SECTIONS = [
    {
        id: 'pendahuluan',
        number: '01',
        title: 'Ruang Lingkup & Kepatuhan Regulasi',
        badge: 'UU PDP 27/2022',
        badgeColor: KC.lime,
        content: [
            {
                heading: 'Komitmen Kepatuhan',
                text: 'KerjaCerdas ("Platform", "kami") berkomitmen penuh untuk melindungi privasi dan integritas data pribadi seluruh pengguna, baik Pencari Kerja (Talenta) maupun Pemberi Kerja (Perusahaan/HRD). Kebijakan ini disusun berdasarkan Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).'
            },
            {
                heading: 'Peran & Tanggung Jawab',
                text: 'KerjaCerdas bertindak sebagai Pengendali Data Pribadi (Data Controller) untuk data akun dan analitik platform, serta sebagai Pemroses Data Pribadi (Data Processor) dalam konteks pencocokan kompetensi kandidat dengan kebutuhan rekrutmen mitra perusahaan.'
            }
        ]
    },
    {
        id: 'data-dikumpulkan',
        number: '02',
        title: 'Data Pribadi yang Dikumpulkan',
        badge: 'Data Inventory',
        badgeColor: KC.cyan,
        content: [
            {
                heading: 'Untuk Pencari Kerja (Talenta)',
                text: '• Data Identitas & Kontak: Nama lengkap, alamat email aktif, nomor kontak, domisili/wilayah administratif.\n• Data Profesional & Karier: Dokumen CV/Resume (PDF/DOCX), keahlian teknis & non-teknis, riwayat pekerjaan, portfolio, preferensi kerja (gaji ekspektasi, mode kerja WFH/Hybrid/Onsite).\n• Data Kredibilitas & Verifikasi: Nilai hash e-KYC (NIK terenkripsi) dan status verifikasi ijazah perguruan tinggi terdaftar (SIVIL Kemendikbudristek).'
            },
            {
                heading: 'Untuk Pemberi Kerja (Employer / HR)',
                text: '• Legalitas Entitas: Nama institusi/perusahaan, nomor pokok wajib pajak (NPWP) tervalidasi Ditjen Pajak, alamat kantor, industri usaha.\n• Kontak Person in Charge (PIC): Nama rekruter resmi, email korporat (@nama-perusahaan), nomor telepon kantor.\n• Spesifikasi Pekerjaan: Deskripsi jabatan, batas gaji, persyaratan keahlian, dan kriteria kualifikasi.'
            }
        ]
    },
    {
        id: 'pemrosesan-ai',
        number: '03',
        title: 'Pemrosesan Algoritma AI & Semantic Match',
        badge: 'AI Guardrails',
        badgeColor: KC.yellow,
        content: [
            {
                heading: 'Mekanisme Pencocokan Vektor (pgvector + Gemini)',
                text: 'Data resume dan lowongan dikonversi menjadi representasi vektor numerik berdimensi 768 menggunakan model Gemini Embedding dengan Matryoshka Representation Learning (MRL). Pencocokan semantik dihitung secara matematis menggunakan kesamaan kosinus (cosine similarity) dan keselarasan keahlian secara lokal di basis data PostgreSQL pgvector kami.'
            },
            {
                heading: 'Kebijakan Nol Retensi untuk Pelatihan Model Pihak Ketiga (Zero AI Training)',
                text: 'Kami MENJAMIN bahwa berkas CV, dokumen pribadi, dan informasi rahasia lowongan kerja Anda TIDAK PERNAH digunakan untuk melatih model AI publik milik pihak ketiga. Pemrosesan dilakukan dalam sesi inferensi API yang terisolasi dengan enkripsi menyeluruh.'
            },
            {
                heading: 'Larangan Penjualan Data (Zero Monetization of Data)',
                text: 'KerjaCerdas tidak pernah dan tidak akan pernah menjual, menyewakan, atau memperdagangkan data pribadi pengguna kepada pihak ketiga atau jaringan periklanan mana pun.'
            }
        ]
    },
    {
        id: 'privasi-kontak',
        number: '04',
        title: 'Perlindungan Privasi Kontak (Pay-to-Unlock)',
        badge: 'Anti-Spam & Privacy',
        badgeColor: KC.orange,
        content: [
            {
                heading: 'Sistem Masking Kontak Kandidat',
                text: 'Untuk melindungi privasi pencari kerja dari spam dan penawaran tidak sah, kontak langsung (nomor telepon, email, alamat lengkap) disembunyikan secara default dalam hasil pencarian kandidat.'
            },
            {
                heading: 'Akses Berbayar & Terverifikasi',
                text: 'Pemberi kerja hanya dapat melihat rincian kontak lengkap setelah akun perusahaannya terverifikasi NPWP dan secara resmi melakukan proses pembukaan kontak (Pay-to-Unlock). Setiap pembukaan kontak dicatat dalam audit log transaksi rekrutmen.'
            }
        ]
    },
    {
        id: 'keamanan-teknis',
        number: '05',
        title: 'Standar Keamanan & Enkripsi Data',
        badge: 'Security Tech',
        badgeColor: KC.lime,
        content: [
            {
                heading: 'Enkripsi Menyeluruh',
                text: '• In-Transit: Seluruh transmisi data dienkripsi dengan protokol TLS 1.3 / HTTPS.\n• At-Rest: Basis data dan berkas tersimpan dilindungi dengan algoritma enkripsi standar industri AES-256.\n• Kredensial: Kata sandi pengguna di-hash menggunakan algoritma Bcrypt dengan unique salt per akun.'
            },
            {
                heading: 'Proteksi Token & Session',
                text: 'Autentikasi menggunakan JSON Web Token (JWT HS256) dengan masa kedaluwarsa 24 jam. Payload JWT diminimalkan tanpa mencantumkan informasi sensitif (PII) untuk mencegah kebocoran data di sisi klien.'
            },
            {
                heading: 'Sanitasi Input & Anti-Prompt Injection',
                text: 'Seluruh input pengguna disaring secara ketat melalui middleware sanitasi HTML dan regex filter untuk menangkal serangan Cross-Site Scripting (XSS), SQL Injection, dan Prompt Injection pada layer AI.'
            }
        ]
    },
    {
        id: 'hak-pengguna',
        number: '06',
        title: 'Hak Subjek Data (Hak Pemilik Data)',
        badge: 'User Rights',
        badgeColor: KC.cyan,
        content: [
            {
                heading: 'Hak Anda Berdasarkan UU PDP',
                text: '• Hak Akses & Portabilitas: Mengunduh salinan profil dan data riwayat lamaran Anda dalam format terstruktur.\n• Hak Koreksi & Pembaruan: Memperbarui atau merevisi informasi kompetensi dan CV kapan saja.\n• Hak Penghapusan (Right to be Forgotten): Mengajukan permohonan penutupan akun dan penghapusan data identitas secara permanen dari server aktif kami.\n• Hak Penarikan Persetujuan: Membatasi visibilitas profil dari pencarian rekruter kapan pun Anda inginkan.'
            }
        ]
    },
    {
        id: 'kontak-dpo',
        number: '07',
        title: 'Petugas Pelindungan Data (DPO) & Kontak Resmi',
        badge: 'Official Contact',
        badgeColor: KC.yellow,
        content: [
            {
                heading: 'Layanan Pengaduan & Konsultasi Privasi',
                text: 'Apabila Anda memiliki pertanyaan, keberatan, atau ingin menjalankan hak subjek data Anda, silakan menghubungi Tim Petugas Pelindungan Data (Data Protection Officer) kami melalui saluran resmi berikut:'
            }
        ],
        contactInfo: {
            dpoEmail: 'dpo@kerjacerdas.id',
            supportEmail: 'privacy@kerjacerdas.id',
            address: 'Menara Rajawali Lt. 12, Jl. DR. Ide Anak Agung Gde Agung, Mega Kuningan, Jakarta Selatan, DKI Jakarta 12950',
            sla: 'Maksimal 3 × 24 Jam Kerja'
        }
    }
]

export default function PrivacyPolicyPage() {
    const { navigate, openAuthModal } = useStore()
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    const scrollToSection = (id) => {
        setActiveSection(id)
        const el = document.getElementById(`sec-${id}`)
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 85
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    return (
        <div style={{ background: KC.bone, color: KC.ink, fontFamily: FONT, minHeight: '100vh' }}>
            {/* ── HEADER NAVIGATION ── */}
            <header style={{
                position: 'sticky', top: 0, left: 0, right: 0, zIndex: 60,
                background: '#FFFFFF', borderBottom: `2px solid ${KC.border}`,
            }}>
                <div style={{
                    maxWidth: 1280, margin: '0 auto', padding: '0 20px',
                    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <button
                        onClick={() => navigate('home')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        title="Kembali ke Beranda"
                        aria-label="Kembali ke Beranda"
                    >
                        <div style={{
                            width: 26, height: 26, borderRadius: 7, background: KC.orange,
                            border: `2px solid ${KC.border}`, display: 'grid', placeItems: 'center',
                            boxShadow: `2.5px 2.5px 0 ${KC.border}`, transform: 'rotate(-3deg)',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M5 3v18M5 12l9-9M5 12l9 9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: KC.ink }}>
                            kerja<span style={{ color: KC.orange }}>cerdas</span>
                        </span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <button
                            onClick={() => navigate('about')}
                            style={{
                                background: 'none', border: 'none', color: KC.ink,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                            }}
                            className="hover:text-kc-orange"
                        >
                            Tentang Platform
                        </button>
                        <button
                            onClick={() => openAuthModal('login')}
                            style={{
                                padding: '6px 14px', fontSize: 13, fontWeight: 800,
                                background: '#fff', color: KC.ink, border: `1.5px solid ${KC.border}`,
                                borderRadius: 6, cursor: 'pointer', fontFamily: FONT,
                                boxShadow: `2px 2px 0 ${KC.border}`,
                            }}
                        >
                            Masuk
                        </button>
                    </div>
                </div>
            </header>

            {/* ── HERO BANNER ── */}
            <section style={{
                background: '#FFFFFF',
                borderBottom: `2px solid ${KC.border}`,
                padding: '48px 20px 40px',
            }}>
                <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: KC.lime, border: `1.5px solid ${KC.border}`, borderRadius: 6, fontSize: 12, fontWeight: 800, marginBottom: 14 }}>
                        <span>🛡️</span>
                        <span>KEBIJAKAN PRIVASI & TATA KELOLA DATA RESMI</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 12 }}>
                        Privasi & Pelindungan Data Pribadi
                    </h1>
                    <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.6, maxWidth: 760 }}>
                        Penjelasan komprehensif mengenai bagaimana KerjaCerdas mengumpulkan, memproses melalui algoritma kecerdasan buatan, mengamankan, dan menjaga kerahasiaan data pribadi Anda sesuai dengan <strong>UU PDP No. 27 Tahun 2022</strong>.
                    </p>

                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                        <span>📅 Terakhir Diperbarui: <strong>28 Agustus 2026</strong></span>
                        <span>•</span>
                        <span>⚖️ Yurisdiksi: <strong>Republik Indonesia</strong></span>
                        <span>•</span>
                        <span>🔒 Status Enkripsi: <strong>AES-256 & TLS 1.3 Aktif</strong></span>
                    </div>

                    {/* Quick Nav Chips */}
                    <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SECTIONS.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => scrollToSection(sec.id)}
                                style={{
                                    padding: '6px 12px',
                                    background: activeSection === sec.id ? KC.ink : '#FAF9F5',
                                    color: activeSection === sec.id ? '#FFFFFF' : KC.ink,
                                    border: `1.5px solid ${KC.border}`,
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: FONT,
                                    boxShadow: activeSection === sec.id ? 'none' : `2px 2px 0 ${KC.border}`,
                                    transition: 'all 0.12s ease',
                                }}
                            >
                                {sec.number}. {sec.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT SECTIONS ── */}
            <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 20px 60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {SECTIONS.map((sec) => (
                        <article
                            key={sec.id}
                            id={`sec-${sec.id}`}
                            style={{
                                background: KC.card,
                                border: `2px solid ${KC.border}`,
                                borderRadius: 12,
                                padding: '32px 28px',
                                boxShadow: `4px 4px 0 ${KC.border}`,
                            }}
                        >
                            {/* Section Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{
                                        width: 32, height: 32, borderRadius: 6, background: KC.ink, color: '#fff',
                                        display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 13,
                                    }}>
                                        {sec.number}
                                    </span>
                                    <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.4, margin: 0 }}>
                                        {sec.title}
                                    </h2>
                                </div>
                                <span style={{
                                    padding: '3px 8px', background: sec.badgeColor || KC.lime,
                                    border: `1.5px solid ${KC.border}`, borderRadius: 4,
                                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                }}>
                                    {sec.badge}
                                </span>
                            </div>

                            {/* Section Body */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {sec.content.map((item, idx) => (
                                    <div key={idx} style={{ background: '#FAF9F5', border: `1.5px solid ${KC.ash}`, borderRadius: 8, padding: 18 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 800, color: KC.ink, marginBottom: 8 }}>
                                            {item.heading}
                                        </h3>
                                        <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                                            {item.text}
                                        </p>
                                    </div>
                                ))}

                                {sec.contactInfo && (
                                    <div style={{
                                        marginTop: 8,
                                        background: '#FFF9E6',
                                        border: `2px solid ${KC.border}`,
                                        borderRadius: 8,
                                        padding: 20,
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: 16,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Petugas DPO</div>
                                            <a href={`mailto:${sec.contactInfo.dpoEmail}`} style={{ fontSize: 13, fontWeight: 800, color: KC.orange, textDecoration: 'none' }}>
                                                {sec.contactInfo.dpoEmail}
                                            </a>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Email Privasi</div>
                                            <a href={`mailto:${sec.contactInfo.supportEmail}`} style={{ fontSize: 13, fontWeight: 800, color: KC.ink, textDecoration: 'none' }}>
                                                {sec.contactInfo.supportEmail}
                                            </a>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Standar Respon SLA</div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: KC.ink }}>
                                                {sec.contactInfo.sla}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Alamat Kantor Operasional</div>
                                            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                                                {sec.contactInfo.address}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                {/* Bottom Card */}
                <div style={{
                    marginTop: 36,
                    background: KC.ink,
                    color: '#fff',
                    border: `2px solid ${KC.border}`,
                    borderRadius: 12,
                    padding: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 20,
                    boxShadow: `4px 4px 0 ${KC.orange}`,
                }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 6px' }}>
                            Siap Mencari Karir atau Merekrut Talenta Terverifikasi?
                        </h3>
                        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                            Nikmati ekosistem rekrutmen berbasis AI yang transparan, aman, dan patuh hukum.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => navigate('home')}
                            style={{
                                padding: '10px 18px', fontSize: 13, fontWeight: 800,
                                background: '#fff', color: KC.ink, border: `2px solid #fff`,
                                borderRadius: 8, cursor: 'pointer', fontFamily: FONT,
                            }}
                        >
                            Jelajahi Platform →
                        </button>
                    </div>
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ background: KC.ink, color: '#fff', padding: '40px 0 24px', borderTop: `2px solid ${KC.border}` }}>
                <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#9CA3AF' }}>
                    <span>© 2026 KerjaCerdas Indonesia. Seluruh hak cipta dilindungi.</span>
                    <span>Kepatuhan UU PDP No. 27/2022 • Enkripsi AES-256</span>
                </div>
            </footer>
        </div>
    )
}
