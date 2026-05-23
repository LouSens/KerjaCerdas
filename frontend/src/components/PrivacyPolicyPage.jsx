import { Shield, FileText, Eye, Lock, UserCheck, Server, Bell, Mail, Scale, ArrowLeft } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * PrivacyPolicyPage — Comprehensive privacy policy and terms of service.
 * Covers data handling for both job seekers and employers.
 * Complies with Indonesian data protection regulations (UU PDP No. 27/2022).
 */

const SECTIONS = [
    {
        id: 'intro',
        icon: Shield,
        title: 'Pendahuluan',
        content: `KerjaCerdas ("Platform", "kami") adalah platform AI-powered job matching yang menghubungkan pencari kerja dengan pemberi kerja di seluruh Indonesia. Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022.

Dengan menggunakan layanan kami, Anda menyetujui praktik yang dijelaskan dalam kebijakan ini. Kebijakan ini berlaku untuk semua pengguna, termasuk pencari kerja (job seeker) dan pemberi kerja (employer).`,
    },
    {
        id: 'data-collection',
        icon: FileText,
        title: 'Data yang Kami Kumpulkan',
        content: `**Untuk Pencari Kerja (Job Seeker):**
• Informasi identitas: nama lengkap, email, dan foto profil
• Informasi profesional: skill, pengalaman kerja, riwayat pendidikan, dan sertifikasi
• Preferensi pekerjaan: lokasi, ekspektasi gaji, dan jenis pekerjaan yang diinginkan
• Data interaksi: riwayat pencarian, lowongan yang disimpan, dan interaksi dengan AI Advisor
• Data perangkat: alamat IP, jenis browser, dan informasi perangkat

**Untuk Pemberi Kerja (Employer):**
• Informasi perusahaan: nama perusahaan, alamat, industri, dan nomor registrasi bisnis
• Informasi kontak: nama PIC, email, dan nomor telepon
• Data lowongan: deskripsi pekerjaan, persyaratan skill, range gaji, dan lokasi
• Data interaksi: riwayat pencarian kandidat dan aktivitas platform`,
    },
    {
        id: 'data-usage',
        icon: Eye,
        title: 'Penggunaan Data',
        content: `Data Anda digunakan untuk:

**AI Job Matching:**
• Menganalisis dan mencocokkan profil pencari kerja dengan lowongan yang tersedia menggunakan algoritma IndoBERT
• Memberikan rekomendasi pekerjaan yang dipersonalisasi berdasarkan skill dan preferensi
• Mengidentifikasi skill gap dan merekomendasikan kursus atau pelatihan

**Untuk Pemberi Kerja:**
• Membantu menemukan kandidat yang cocok berdasarkan kebutuhan perusahaan
• Menampilkan lowongan kepada pencari kerja yang relevan
• Menyediakan analitik performa lowongan (views, applicants, match rate)

**Peningkatan Layanan:**
• Melatih dan meningkatkan akurasi model AI matching
• Menganalisis tren pasar kerja Indonesia
• Mengembangkan fitur dan layanan baru

Kami **tidak** menjual data pribadi Anda kepada pihak ketiga.`,
    },
    {
        id: 'data-protection',
        icon: Lock,
        title: 'Perlindungan Data',
        content: `Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data Anda:

• **Enkripsi**: Semua data ditransmisikan melalui HTTPS/TLS dan disimpan dalam format terenkripsi
• **Akses terbatas**: Hanya personel yang berwenang yang dapat mengakses data pribadi
• **Audit keamanan**: Kami melakukan audit keamanan berkala dan penetration testing
• **Backup terenkripsi**: Data di-backup secara berkala dengan enkripsi AES-256
• **Verifikasi Identitas**: Bekerja sama dengan Penyelenggara Sertifikasi Elektronik (PSrE) resmi untuk proses e-KYC
• **Data residency**: Data disimpan di server yang berlokasi di Indonesia sesuai dengan UU PDP

Untuk model AI kami:
• Data pelatihan dianonimisasi sebelum digunakan
• Model tidak menyimpan data pribadi individu
• Kami menggunakan teknik differential privacy untuk melindungi privasi pengguna`,
    },
    {
        id: 'user-rights',
        icon: UserCheck,
        title: 'Hak Pengguna',
        content: `Sesuai dengan UU PDP No. 27/2022, Anda memiliki hak-hak berikut:

• **Hak akses**: Anda berhak mengetahui dan mengakses data pribadi Anda yang kami simpan
• **Hak koreksi**: Anda berhak meminta perbaikan data pribadi yang tidak akurat
• **Hak hapus**: Anda berhak meminta penghapusan data pribadi Anda ("right to be forgotten")
• **Hak portabilitas**: Anda berhak meminta salinan data Anda dalam format yang terstruktur
• **Hak keberatan**: Anda berhak menolak pemrosesan data untuk tujuan tertentu
• **Hak penarikan persetujuan**: Anda dapat menarik persetujuan kapan saja

**Untuk Pemberi Kerja:**
• Hak mengakses dan mengelola data lowongan yang dipublikasikan
• Hak menghapus lowongan dan data terkait kandidat
• Hak mengekspor data rekrutmen

Untuk mengajukan permintaan terkait hak Anda, hubungi kami melalui email: privacy@kerjacerdas.id`,
    },
    {
        id: 'data-sharing',
        icon: Server,
        title: 'Berbagi Data dengan Pihak Ketiga',
        content: `Kami dapat membagikan data Anda dengan pihak ketiga dalam kondisi berikut:

• **Penyedia layanan**: Google (Gemini API untuk AI Advisor), cloud hosting provider
• **Analitik**: Layanan analitik yang dianonimisasi untuk mengukur performa platform
• **Kewajiban hukum**: Jika diwajibkan oleh hukum, regulasi, atau perintah pengadilan
• **Persetujuan pengguna**: Ketika Anda secara eksplisit menyetujui berbagi data

**Transparansi untuk kedua sisi:**
• Pencari kerja: profil Anda hanya terlihat oleh pemberi kerja saat ada kecocokan (match)
• Pemberi kerja: informasi perusahaan hanya ditampilkan pada lowongan yang dipublikasikan
• Tidak ada akses data personal tanpa persetujuan eksplisit`,
    },
    {
        id: 'cookies',
        icon: Bell,
        title: 'Cookie dan Teknologi Pelacakan',
        content: `Kami menggunakan cookie dan teknologi serupa untuk:

• **Cookie esensial**: Untuk fungsi dasar platform seperti autentikasi dan sesi
• **Cookie preferensi**: Untuk menyimpan pengaturan bahasa dan tampilan
• **Cookie analitik**: Untuk menganalisis pola penggunaan dan meningkatkan layanan
• **Local Storage**: Untuk menyimpan profil dan preferensi pencarian secara lokal

Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda. Menonaktifkan cookie esensial dapat membatasi fungsionalitas platform.`,
    },
    {
        id: 'terms',
        icon: Scale,
        title: 'Syarat dan Ketentuan Penggunaan',
        content: `**Untuk Pencari Kerja:**
• Anda bertanggung jawab atas keakuratan informasi yang diberikan dalam profil
• Dilarang menggunakan platform untuk tujuan penipuan atau menyesatkan
• Anda setuju bahwa hasil AI matching bersifat rekomendasi dan bukan jaminan pekerjaan

**Untuk Pemberi Kerja:**
• Lowongan yang diposting harus sesuai dengan peraturan ketenagakerjaan Indonesia (UU Cipta Kerja)
• Dilarang memposting lowongan diskriminatif (berbasis gender, usia, suku, agama)
• Informasi gaji dan persyaratan harus akurat dan tidak menyesatkan
• Anda bertanggung jawab atas kepatuhan terhadap UU Ketenagakerjaan No. 13/2003

**Umum:**
• Platform berhak menangguhkan atau membatalkan akun yang melanggar ketentuan
• Kami tidak bertanggung jawab atas keputusan rekrutmen antar pengguna
• Konten yang dihasilkan oleh AI Advisor bersifat informatif dan bukan nasihat hukum/profesional`,
    },
    {
        id: 'contact',
        icon: Mail,
        title: 'Hubungi Kami',
        content: `Jika Anda memiliki pertanyaan tentang kebijakan privasi ini:

📧 **Email**: privacy@kerjacerdas.id
📞 **Telepon**: +62 21 8888 9999
🏢 **Alamat**: Jakarta, Indonesia

**Data Protection Officer (DPO)**
Nama: Tim Privasi KerjaCerdas
Email: dpo@kerjacerdas.id

Kami berkomitmen untuk merespons permintaan Anda dalam waktu 3×24 jam kerja.

Terakhir diperbarui: 13 Maret 2026`,
    },
]

export default function PrivacyPolicyPage() {
    const { setActiveTab } = useStore()

    return (
        <div className="animate-fade-in">
            {/* Hero */}
            <div className="border-b border-white/[0.06] bg-gradient-to-b from-brand-500/[0.04] to-transparent">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <button
                        onClick={() => setActiveTab('home')}
                        className="flex items-center gap-1.5 text-xs font-bold text-ink/60 hover:text-ink mb-8 transition-colors bg-white border-2 border-ink px-4 py-2 rounded-xl shadow-[2px_2px_0px_#111827] hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-0.5 inline-flex"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                        Kembali ke Beranda
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#FF90E8] border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0px_#111827] transform -rotate-3">
                            <Shield className="w-8 h-8 text-ink" strokeWidth={3} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink uppercase tracking-tight">
                                Kebijakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-600">Privasi</span>
                            </h1>
                        </div>
                    </div>
                    <p className="text-base font-bold text-ink/70 max-w-2xl leading-relaxed">
                        Transparansi dalam pengelolaan data untuk pencari kerja dan pemberi kerja.
                        Sesuai dengan UU Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022.
                    </p>

                    {/* Quick nav */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {SECTIONS.map(({ id, title }) => (
                            <a
                                key={id}
                                href={`#privacy-${id}`}
                                className="px-4 py-2 rounded-xl bg-white border-[2px] border-ink text-xs font-black text-ink hover:bg-[#B8FF6D] hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827] transition-all uppercase tracking-wider"
                            >
                                {title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 relative z-10">
                {SECTIONS.map(({ id, icon: Icon, title, content }, i) => (
                    <section
                        key={id}
                        id={`privacy-${id}`}
                        className="bg-white border-[3px] border-ink rounded-[2rem] p-6 sm:p-8 shadow-[8px_8px_0px_#111827] scroll-mt-28"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#00E5FF] border-[3px] border-ink flex items-center justify-center shrink-0 shadow-[4px_4px_0px_#111827]">
                                <Icon className="w-6 h-6 text-ink" strokeWidth={3} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-ink">{title}</h2>
                        </div>
                        <div className="text-base text-ink/80 leading-relaxed font-medium">
                            {content.split('\n').map((line, li) => {
                                // Bold text rendering
                                const parts = line.split(/\*\*(.*?)\*\*/g)
                                return (
                                    <p key={li} className={line.startsWith('•') ? 'pl-5 relative mb-2' : 'mb-4'}>
                                        {line.startsWith('•') && <span className="absolute left-0 text-brand-500 font-bold">•</span>}
                                        {parts.map((part, pi) =>
                                            pi % 2 === 1
                                                ? <strong key={pi} className="text-ink font-black">{part}</strong>
                                                : <span key={pi}>{part.replace(/^• /g, '')}</span>
                                        )}
                                    </p>
                                )
                            })}
                        </div>
                    </section>
                ))}

                {/* Bottom CTA */}
                <div className="text-center py-12 relative z-10">
                    <p className="text-sm font-bold text-ink/70 mb-6 max-w-lg mx-auto">
                        Dengan menggunakan KerjaCerdas, Anda menyetujui kebijakan privasi dan syarat ketentuan ini.
                    </p>
                    <button
                        onClick={() => setActiveTab('home')}
                        className="bg-[#FFC900] text-ink border-[3px] border-ink font-black px-8 py-4 rounded-xl shadow-[4px_4px_0px_#111827] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#111827] transition-all"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        </div>
    )
}
