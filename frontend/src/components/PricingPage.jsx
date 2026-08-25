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
                        tier="Employer Basic"
                        price="Rp 0"
                        period="pasang lowongan"
                        features={['Pasang Lowongan Gratis', 'AI Shortlist (Top 5)', 'Skor Semantik']}
                        accent="bg-kc-cyan"
                        cta="Posting Sekarang"
                        onCta={() => openAuthModal('register', 'employer')}
                    />
                    <PricingCard
                        tier="Verified Unlock"
                        price="Rp 50k"
                        period="/kandidat"
                        features={['Buka Kontak Asli Kandidat', 'Lihat CV PDF Lengkap', '✓ Background Checked', '✓ Ijazah/SIVIL Verified']}
                        accent="bg-kc-yellow"
                        featured
                        cta="Coba Unlock"
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
                        <FaqItem q="Pencari kerja harus bayar?" a="Tidak. Fitur dasar gratis selamanya. Termasuk analisis skill gap dan rekomendasi kursus." />
                        <FaqItem q="Employer benar-benar gratis pasang lowongan?" a="Ya! Pasang lowongan dan lihat AI Shortlist (Skor + Profil Singkat) gratis. Anda baru bayar Rp 50.000 jika ingin membuka akses kontak langsung & CV Full kandidat." />
                        <FaqItem q="Data saya aman?" a="Data Anda dienkripsi dan disimpan dengan aman di server Indonesia. Kami tidak pernah membagikan CV Anda secara publik." />
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
