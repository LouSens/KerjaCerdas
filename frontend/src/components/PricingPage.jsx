import useStore from '../store/useStore'
import toast from 'react-hot-toast'

export default function PricingPage() {
    const { openAuthModal } = useStore()

    return (
        <div className="bg-kc-cream">
            <section className="max-w-5xl mx-auto px-6 py-20">
                <p className="font-mono text-xs tracking-widest text-kc-gray uppercase mb-2">harga</p>
                <h1 className="text-4xl sm:text-5xl font-black text-kc-dark leading-tight">
                    Gratis buat seeker.<br />Employer bayar kalau puas.
                </h1>
                <p className="text-kc-gray mt-4 max-w-lg">
                    Pencari kerja nggak pernah bayar. Employer mulai gratis, upgrade kalau butuh lebih banyak kandidat.
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
                    <PricingCard
                        tier="Seeker Free"
                        price="Rp 0"
                        period="selamanya"
                        features={['Pencocokan AI Semantik', 'Analisis Skill Gap', 'AI Career Advisor (5x/hari)', 'Rekomendasi Prakerja']}
                        accent="bg-kc-lime"
                        cta="Daftar Gratis"
                        onCta={() => openAuthModal('register', 'seeker')}
                    />
                    <PricingCard
                        tier="Employer Starter"
                        price="Rp 0"
                        period="freemium"
                        features={['Pasang Lowongan Gratis', 'Bonus 5 Kuota Unlock Kontak', 'AI Shortlist & Skor Semantik', 'Preview Profil Teaser']}
                        accent="bg-kc-cyan"
                        cta="Coba Gratis 5 Kontak"
                        onCta={() => openAuthModal('register', 'employer')}
                    />
                    <PricingCard
                        tier="Verified Unlock Pack"
                        price="Rp 50k"
                        period="/10 kandidat (Rp 5k/kontak)"
                        features={['Buka 10 Kontak Lengkap & CV PDF', '✓ Background Checked & E-KYC', '✓ Ijazah / SIVIL Verified', '🛡️ Garansi Kontak Aktif (Refund Kredit)']}
                        accent="bg-kc-yellow"
                        featured
                        cta="Beli Paket 10 Kandidat"
                        onCta={() => openAuthModal('register', 'employer')}
                    />
                    <PricingCard
                        tier="ATS Copilot & API"
                        price="Custom"
                        period="/bulan"
                        features={['Plugin ATS (Workday/SAP)', 'Headhunter AI Copilot', 'Unlimited AI Matching', 'Dedicated Account Manager']}
                        accent="bg-kc-pink"
                        cta="Hubungi Sales"
                        comingSoon
                        onCta={() => toast('✨ Fitur Enterprise akan segera hadir! Kami akan menghubungi Anda.', { duration: 4000 })}
                    />
                </div>

                {/* FAQ */}
                <div className="mt-20">
                    <h2 className="text-2xl font-black text-kc-dark mb-6">FAQ</h2>
                    <div className="space-y-3">
                        <FaqItem q="Pencari kerja harus bayar?" a="Tidak sama sekali. Seluruh fitur pencari kerja 100% gratis selamanya, termasuk AI Career Advisor, pencocokan lowongan, dan analisis skill gap." />
                        <FaqItem q="Apakah ada kuota gratis (Freemium) untuk Employer?" a="Ya! Setiap employer baru langsung mendapatkan 5 kuota unlock kontak kandidat gratis di awal untuk membuktikan kecocokan dan validitas kandidat tanpa perlu bayar apa pun." />
                        <FaqItem q="Berapa biaya setelah kuota gratis habis?" a="Sangat terjangkau: Rp 50.000 untuk 10 kandidat (hanya Rp 5.000 per kandidat). Tanpa komitmen langganan bulanan jutaan rupiah." />
                        <FaqItem q="Bagaimana jaminan bahwa kontak kandidat 100% terpercaya?" a="Setiap kandidat melewati verifikasi OTP nomor WhatsApp, validasi Ijazah (SIVIL/PDDIKTI), dan analisis riwayat kerja. Jika kontak yang Anda buka tidak valid/tidak merespons, kredit unlock Anda otomatis di-refund (Garansi 100% Kontak Aktif)." />
                        <FaqItem q="Apakah data pelamar aman dan privasinya terlindungi?" a="Sangat aman. Profil kandidat ditampilkan secara teaser/anonim sebelum di-unlock. Data kontak hanya dibuka kepada perusahaan terverifikasi dengan enkripsi standar industri." />
                    </div>
                </div>
            </section>
        </div>
    )
}

function PricingCard({ tier, price, period, features, accent, featured, cta, onCta, comingSoon }) {
    return (
        <div className={`border-2 border-kc-dark p-5 flex flex-col relative ${featured ? 'bg-kc-dark text-white' : 'bg-white'}`}>
            {comingSoon && (
                <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 900, background: '#f97316', color: '#fff', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>
                    COMING SOON
                </span>
            )}
            <div className={`${accent} w-full h-2 border border-kc-dark mb-4`}></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-kc-gray">{tier}</p>
            <div className="mt-2 mb-4">
                <span className={`text-3xl font-black ${featured ? 'text-white' : 'text-kc-dark'}`}>{price}</span>
                <span className={`text-xs ml-1 ${featured ? 'text-white/60' : 'text-kc-gray'}`}>{period}</span>
            </div>
            <ul className="space-y-2 flex-1">
                {features.map(f => (
                    <li key={f} className={`text-xs ${featured ? 'text-gray-300' : 'text-kc-gray'}`}>· {f}</li>
                ))}
            </ul>
            <button
                id={`pricing-cta-${tier.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={onCta}
                className={`mt-4 w-full text-xs font-bold py-2.5 border-2 transition-colors ${featured
                        ? 'bg-kc-orange text-white border-white hover:bg-white hover:text-kc-dark'
                        : 'bg-kc-dark text-white border-kc-dark hover:bg-kc-orange'
                    }`}
            >
                {comingSoon ? `${cta} (Coming Soon)` : cta}
            </button>
        </div>
    )
}

function FaqItem({ q, a }) {
    return (
        <div className="border-2 border-kc-dark bg-white p-4">
            <p className="font-bold text-sm text-kc-dark">{q}</p>
            <p className="text-xs text-kc-gray mt-1">{a}</p>
        </div>
    )
}
