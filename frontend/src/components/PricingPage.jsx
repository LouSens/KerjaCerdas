import useStore from '../store/useStore'

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
                        features={['Top-5 match per search', 'Skill gap + 3 kursus', 'AI advisor 5 chat/hari', 'Upload 1 CV']}
                        accent="bg-kc-lime"
                        cta="Daftar Gratis"
                        onCta={() => openAuthModal('register', 'seeker')}
                    />
                    <PricingCard
                        tier="Seeker Pro"
                        price="Rp 49k"
                        period="/bulan"
                        features={['Top-20 match', 'Unlimited AI advisor', 'Priority rerank', 'Interview prep AI', 'Multiple CV profiles']}
                        accent="bg-kc-cyan"
                        cta="Upgrade Pro"
                        onCta={() => openAuthModal('register', 'seeker')}
                    />
                    <PricingCard
                        tier="Employer Growth"
                        price="Rp 299k"
                        period="/lowongan"
                        features={['Top-5 kandidat per lowongan', 'AI job desc writer', 'Verified badge', '10 lowongan aktif', 'Email outreach']}
                        accent="bg-kc-yellow"
                        featured
                        cta="Mulai Sekarang"
                        onCta={() => openAuthModal('register', 'employer')}
                    />
                    <PricingCard
                        tier="Enterprise"
                        price="Custom"
                        period="contact"
                        features={['Top-50 kandidat', 'Unlimited lowongan', 'ATS integration', 'Dedicated AM', 'SLA 99.9%']}
                        accent="bg-kc-pink"
                        cta="Hubungi Sales"
                        onCta={() => {}}
                    />
                </div>

                {/* FAQ */}
                <div className="mt-20">
                    <h2 className="text-2xl font-black text-kc-dark mb-6">FAQ</h2>
                    <div className="space-y-3">
                        <FaqItem q="Pencari kerja harus bayar?" a="Tidak. Fitur dasar gratis selamanya. Pro opsional untuk yang mau lebih banyak match dan unlimited AI advisor." />
                        <FaqItem q="Employer bisa coba dulu?" a="Ya. Daftar gratis, posting 1 lowongan pertama gratis. Baru bayar kalau mau lanjut." />
                        <FaqItem q="Data saya aman?" a="AES-256 encryption, server Indonesia, UU PDP compliant. Dokumen tidak ditampilkan ke user lain." />
                    </div>
                </div>
            </section>
        </div>
    )
}

function PricingCard({ tier, price, period, features, accent, featured, cta, onCta }) {
    return (
        <div className={`border-2 border-kc-dark p-5 flex flex-col ${featured ? 'bg-kc-dark text-white' : 'bg-white'}`}>
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
                onClick={onCta}
                className={`mt-4 w-full text-xs font-bold py-2.5 border-2 transition-colors ${
                    featured
                        ? 'bg-kc-orange text-white border-white hover:bg-white hover:text-kc-dark'
                        : 'bg-kc-dark text-white border-kc-dark hover:bg-kc-orange'
                }`}
            >
                {cta}
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
