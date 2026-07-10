# PROPOSAL 2ND SUBMISSION — KERJACERDAS

**Platform Karir Berbasis AI: Mengatasi Ketimpangan Struktural Pasar Kerja melalui JobMatching, Skill Gap Analysis, dan Personalized Career Guidance**

---

## Team Composition

**David Kurniawan** (Ketua Tim): Project Lead & AI Engineer. Bertanggung jawab atas arsitektur sistem Agentic AI, pengembangan semantic matching engine berbasis embedding, desain pipeline LangGraph, implementasi vector database (pgvector), serta keamanan dan reliabilitas sistem MVP end-to-end.

**Darren Cornelius Suwandi**: Product Manager, UI/UX Designer & Research Analyst. Mengarahkan visi produk, merancang pengalaman pengguna (user journey) dan interface berbasis Zero Learning Curve, melakukan problem validation pada ketimpangan pasar kerja, serta menganalisis kebutuhan pengguna dan pasar tenaga kerja untuk memastikan product-market fit.

**Vanessa Serenina Prawirayasa**: System Analyst & Impact Strategist. Merancang arsitektur alur sistem backend-to-product, definisi KPI dan metrik dampak platform, serta memastikan keselarasan solusi dengan efisiensi rekrutmen dan ekosistem ketenagakerjaan.

**Jason Clarence Setya Budhi**: Business & Market Strategist, Backend & Integration Engineer. Mengelola strategi monetisasi dan go-to-market, analisis adopsi pasar dan risiko skalabilitas, serta implementasi integrasi API, microservices orchestration, dan sistem payment gateway serta deployment cloud.

---

## Executive Summary

KerjaCerdas hadir untuk menjembatani ketimpangan struktural pasar kerja Indonesia, di mana pencari kerja kesulitan mengidentifikasi peluang karier yang relevan dan memahami posisi mereka terhadap kebutuhan industri, sementara perusahaan menghadapi tingginya volume lamaran yang tidak relevan serta kesulitan menemukan talenta yang tepat. Kondisi ini menyebabkan proses rekrutmen menjadi kurang efisien dan memperlebar kesenjangan antara ketersediaan tenaga kerja dan kebutuhan dunia kerja.

Sebagai platform karier berbasis AI, KerjaCerdas memanfaatkan Semantic AI Job Matching Engine untuk mencocokkan kandidat dan lowongan berdasarkan kesesuaian skill secara semantik, sehingga proses penyaringan dapat dilakukan lebih cepat dan akurat. Kandidat yang belum memenuhi kualifikasi dibantu melalui Skill Gap Analyzer dan AI Career Advisor yang mengidentifikasi skill yang perlu ditingkatkan serta merekomendasikan jalur upskilling yang relevan.

Pada 12 bulan pertama MVP, KerjaCerdas menargetkan peningkatan akses karier bagi 50.000 pencari kerja dan efisiensi rekrutmen bagi 500 perusahaan. Pengembangan Tahap 2 mencakup integrasi Autonomous Supervisor Swarm berbasis LangGraph, Dual-Track Search Interface, dan model Direct Contact Unlock yang mempertahankan prinsip Zero Learning Curve bagi perusahaan.

---

## Problem Validation

Pasar tenaga kerja Indonesia menghadapi ketimpangan struktural yang ditandai oleh tingginya jumlah pencari kerja di satu sisi dan terbatasnya ketersediaan talenta yang sesuai dengan kebutuhan industri di sisi lain. Meskipun terdapat sekitar 7,24 juta penganggur di Indonesia (BPS, 2026), banyak perusahaan, khususnya pada sektor digital dan ekonomi berbasis teknologi, masih mengalami kesulitan menemukan kandidat dengan skill yang relevan. Kondisi ini menunjukkan bahwa permasalahan utama bukan hanya ketersediaan lapangan kerja, tetapi juga ketidaksesuaian antara keterampilan tenaga kerja dan kebutuhan pasar.

Kesenjangan tersebut tercermin dari tingginya tingkat mismatch kualifikasi yang mencapai 35,36% pada pekerja muda (BPS, 2024). Banyak pencari kerja belum memiliki visibilitas yang jelas terhadap skill yang dibutuhkan industri maupun keterampilan yang perlu mereka tingkatkan agar lebih kompetitif. Selain itu, mereka sering kali tidak memiliki akses terhadap panduan karier yang personal dan berbasis data untuk menentukan langkah pengembangan diri yang tepat.

Di sisi lain, perusahaan harus menghadapi tingginya volume lamaran yang tidak sesuai, sehingga proses seleksi menjadi lebih lambat dan kurang efisien. Ketiadaan mekanisme pencocokan skill yang mampu memahami kebutuhan industri secara semantik, disertai minimnya informasi mengenai skill gap dan arah pengembangan karier, memperlebar kesenjangan antara permintaan dan pasokan tenaga kerja serta menghambat produktivitas pasar kerja secara keseluruhan.

---

## Problem–Solution Mapping

KerjaCerdas dirancang untuk mengatasi ketimpangan struktural di pasar tenaga kerja dengan menargetkan permasalahan utama yang dihadapi baik oleh perusahaan maupun pencari kerja. Untuk mengatasi oversupply pelamar yang menyebabkan tingginya beban administrasi rekrutmen, KerjaCerdas menghadirkan Semantic AI Job Matching Engine yang mencocokkan kandidat dan lowongan berdasarkan kesesuaian skill serta pengalaman secara semantik. Pendekatan ini membantu perusahaan memperoleh kandidat yang lebih relevan dan mengurangi waktu yang dibutuhkan untuk proses screening.

Di sisi pencari kerja, KerjaCerdas membantu mengatasi kesenjangan antara skill yang dimiliki dengan kebutuhan industri melalui Skill Gap Analyzer. Fitur ini menganalisis perbedaan antara profil kandidat dan persyaratan posisi yang dituju, kemudian memberikan rekomendasi pelatihan, sertifikasi, dan pengembangan keterampilan yang relevan. Dengan demikian, pengguna dapat memahami area skill yang perlu ditingkatkan dan memiliki jalur pengembangan yang lebih terarah.

Selain itu, AI Career Advisor memberikan panduan karier yang dipersonalisasi berdasarkan profil pengguna, hasil analisis skill, dan tren pasar kerja. Kombinasi ketiga solusi ini membantu perusahaan menemukan talenta yang lebih tepat sekaligus membantu pencari kerja meningkatkan kesiapan kerja mereka. Melalui pendekatan tersebut, KerjaCerdas menargetkan pengurangan waktu screening hingga 90% serta peningkatan kualitas pencocokan talenta dan pengembangan skill secara berkelanjutan.

---

## Ecosystem Alignment

KerjaCerdas tidak membangun seluruh infrastruktur secara mandiri, melainkan mengorkestrasi berbagai ekosistem yang telah ada untuk mempercepat adopsi dan memperluas dampak platform. Dari sisi pasokan talenta, KerjaCerdas menjalin kolaborasi dengan pusat karier perguruan tinggi sebagai sumber kandidat yang lebih terkurasi. Untuk pengembangan skill, platform terintegrasi dengan ekosistem EdTech seperti Dicoding, Coursera, dan Skill Academy sehingga hasil analisis skill gap dapat langsung diterjemahkan menjadi rekomendasi pelatihan yang relevan.

Pada aspek verifikasi, MVP menggunakan layanan eKYC seperti PrivyID untuk validasi identitas kandidat dan perusahaan. Seluruh pengelolaan data mengikuti prinsip UU PDP No. 27 Tahun 2022. Untuk analisis tren pasar kerja, KerjaCerdas memadukan data frekuensi job posting aktif dari sumber publik dengan momentum pencarian via Google Trends (PyTrends, geo=ID).

Dari sisi ekosistem ketenagakerjaan yang lebih luas, KerjaCerdas berada dalam posisi komplementer terhadap program upskilling nasional seperti Prakerja: platform menyuplai sinyal skill gap yang tervalidasi dari pasar, sementara program tersebut menyediakan akses pembiayaan pelatihan bagi kandidat. Model Direct Contact Unlock memungkinkan perusahaan menghubungi kandidat via email atau telepon tanpa adopsi sistem HR baru, mempertahankan prinsip Zero Learning Curve yang relevan untuk segmen UMKM.

---

## Solution Approach & Mechanism

KerjaCerdas menerapkan alur rekrutmen berbasis AI yang menghubungkan pencari kerja, perusahaan, dan ekosistem pelatihan dalam satu platform terintegrasi. Pencari kerja memulai proses melalui onboarding survey berbasis conditional logic dan unggahan CV untuk membangun profil karier yang lebih lengkap. Informasi dari CV dan profil pengguna kemudian diproses menjadi representasi vektor berdimensi tinggi menggunakan Gemini Embeddings dan disimpan pada pgvector untuk mendukung pencocokan berbasis makna dan konteks skill.

Di sisi perusahaan, lowongan kerja dibuat melalui formulir sederhana yang dikonversi menjadi representasi vektor dengan metode yang sama. Ketika lowongan dipublikasikan, Autonomous Supervisor Swarm berbasis LangGraph menjalankan proses pencocokan semantik menggunakan Cosine Similarity untuk mengidentifikasi kandidat yang paling relevan. Hasilnya disajikan dalam antarmuka Split-Screen yang menampilkan skor kecocokan, ringkasan analisis AI, dan CV kandidat secara berdampingan. Perusahaan kemudian dapat menghubungi kandidat terpilih melalui fitur Direct Contact Unlock.

Selain melakukan talent matching, KerjaCerdas juga menjalankan Skill Gap Analyzer yang membandingkan skill kandidat dengan kebutuhan posisi maupun tren keterampilan industri. Sistem menampilkan kesenjangan skill yang perlu ditingkatkan serta memberikan rekomendasi pelatihan dari mitra EdTech yang relevan. Untuk mendukung pengambilan keputusan karier, pengguna dapat berinteraksi dengan AI Career Advisor yang memberikan panduan personal berdasarkan profil, hasil analisis skill, dan kondisi pasar kerja. Kandidat juga dapat memanfaatkan Global Job Search, Hiring Phase Tracker, Historical Application Dashboard, dan Notification System untuk memantau aktivitas pencarian kerja secara terpusat.

---

## Impact Scale & Targets

KerjaCerdas menargetkan dampak yang terukur pada kedua sisi pasar tenaga kerja, yaitu pencari kerja dan perusahaan. Pada fase MVP, platform menargetkan 50.000 pencari kerja dan 500 perusahaan dalam 12 bulan pertama. Target ini ditingkatkan menjadi 200.000 pencari kerja dan 5.000 perusahaan pada bulan ke-24. Implementasi awal difokuskan pada lima provinsi dengan aktivitas ekonomi dan rekrutmen formal tertinggi, yaitu DKI Jakarta, Jawa Barat, Jawa Tengah, Jawa Timur, dan Banten, sebelum diperluas ke wilayah Sumatera dan Indonesia Timur.

Dari sisi efisiensi rekrutmen, KerjaCerdas menargetkan pengurangan waktu screening kandidat hingga 90% melalui pencocokan semantik dan pemeringkatan kandidat otomatis. Perusahaan dapat memperoleh shortlist kandidat yang lebih relevan dalam hitungan menit dibandingkan proses seleksi manual yang membutuhkan waktu berhari-hari.

Dari sisi pengembangan skill, platform menargetkan 20.000 analisis skill gap dan 500.000 rekomendasi pelatihan pada tahun pertama. Melalui integrasi dengan ekosistem EdTech, KerjaCerdas juga menargetkan lebih dari 20.000 pendaftaran pelatihan yang berasal langsung dari hasil analisis skill pengguna.

Untuk mengukur adopsi platform, KerjaCerdas menargetkan 100.000 proses pencocokan kandidat-lowongan pada tahun pertama. Dengan memperluas akses terhadap informasi karier, peluang kerja, dan jalur pengembangan skill yang lebih terarah, KerjaCerdas diharapkan dapat membantu mengurangi kesenjangan antara kebutuhan industri dan kesiapan tenaga kerja secara berkelanjutan.

---

## Impact Measurement

Keberhasilan KerjaCerdas diukur melalui serangkaian Key Performance Indicators (KPI) yang mencerminkan dampak platform bagi perusahaan dan pencari kerja. Dari sisi pengguna, target awal platform adalah mencapai 10.000 Monthly Active Users (MAU) dalam enam bulan pertama dan meningkat menjadi 50.000 pengguna dalam 12 bulan. Efektivitas fitur pengembangan skill diukur melalui jumlah analisis Skill Gap Analyzer yang berhasil dieksekusi, dengan target 20.000 analisis per tahun. Kualitas rekomendasi upskilling dievaluasi melalui Click-Through Rate (CTR) menuju mitra EdTech dengan target lebih dari 25%, sebagai indikator relevansi rekomendasi terhadap kebutuhan pengguna.

Untuk mengukur efektivitas AI Career Advisor, KerjaCerdas menargetkan tingkat keterlibatan pengguna dengan rata-rata minimal tiga interaksi per sesi, yang menunjukkan bahwa pengguna memanfaatkan platform sebagai sumber panduan karier yang berkelanjutan, bukan sekadar alat pencarian kerja.

Dari sisi perusahaan, target registrasi adalah 500 akun employer pada fase MVP dan meningkat menjadi 5.000 akun pada tahun kedua. Indikator utama keberhasilan adalah penurunan Time-to-Shortlist lebih dari 90%, dengan target memangkas proses penyaringan kandidat dari beberapa hari menjadi kurang dari 10 menit melalui otomatisasi berbasis Semantic AI Job Matching Engine. Selain itu, kualitas pencocokan kandidat diukur melalui Shortlist-to-Interview Conversion Rate dengan target minimal 70%.

Untuk memastikan keandalan layanan, platform ditargetkan memiliki uptime minimal 99,5% pada fase MVP dan 99,9% pada lingkungan produksi. Kombinasi metrik adopsi pengguna, efisiensi rekrutmen, kualitas pencocokan, efektivitas upskilling, dan keandalan sistem memungkinkan KerjaCerdas mengukur dampak platform secara komprehensif dan berbasis data.

---

## System & Public Value Proposition

KerjaCerdas memberikan nilai sistemik dengan mengatasi ketimpangan struktural di pasar tenaga kerja Indonesia, khususnya tingginya jumlah pencari kerja yang belum terhubung dengan peluang kerja yang sesuai serta kesenjangan antara skill tenaga kerja dan kebutuhan industri. Melalui Semantic AI Job Matching Engine, platform ini membantu perusahaan memperoleh kandidat yang lebih relevan dalam waktu yang lebih singkat, mengurangi beban administrasi akibat tingginya volume lamaran yang tidak sesuai, serta mempercepat proses pengambilan keputusan rekrutmen.

Di sisi pencari kerja, Skill Gap Analyzer berperan dalam mengidentifikasi kesenjangan skill terhadap kebutuhan industri yang terus berubah serta memberikan rekomendasi pengembangan skill yang sesuai dengan tren 6-12 bulan ke depan. Pendekatan ini membantu menciptakan jalur upskilling yang lebih terarah, meningkatkan kesiapan kerja, dan mengurangi mismatch antara pendidikan dan kebutuhan industri.

Selain itu, AI Career Advisor menyediakan panduan karier berbasis data yang membantu pengguna memahami arah pengembangan profesional secara lebih personal dan kontekstual. Kombinasi ketiga komponen ini memperkuat inklusivitas akses terhadap informasi karier, khususnya bagi mahasiswa, fresh graduate, dan pekerja transisi yang sebelumnya tidak memiliki panduan terstruktur.

Dengan pendekatan Zero Learning Curve, KerjaCerdas juga memastikan adopsi yang mudah bagi perusahaan lintas skala, termasuk UMKM dengan keterbatasan literasi digital. Secara keseluruhan, platform ini berkontribusi pada terciptanya ekosistem rekrutmen yang lebih efisien, transparan, dan adaptif, serta mendukung kebutuhan industri masa depan dan visi Indonesia Emas 2045.

---

## Solution Originality

Originalitas KerjaCerdas terletak pada integrasi sistemik yang membentuk closed-loop talent development, di mana proses rekrutmen, evaluasi skill, dan pengembangan skill saling terhubung dalam satu ekosistem terpadu. Berbeda dengan platform seperti JobStreet dan LinkedIn yang berfungsi sebagai job board dan jaringan profesional berbasis listing pasif, KerjaCerdas menggeser paradigma menjadi sistem yang aktif mengorkestrasi keputusan karier berbasis data real-time.

Keunikan pertama terletak pada transisi dari platform transaksional menjadi sistem konsultatif melalui AI Career Advisor, yang tidak hanya menampilkan lowongan, tetapi juga memberikan rekomendasi karier berbasis profil pengguna, skill gap, dan tren industri. Kedua, Skill Gap Analyzer memungkinkan pengguna memahami kesenjangan skill sebelum melamar, menghubungkan analisis ini langsung dengan jalur pengembangan melalui rekomendasi upskilling yang relevan, sehingga proses karier menjadi lebih proaktif dibanding reaktif.

Ketiga, Semantic AI Job Matching Engine berbasis embedding space mengatasi keterbatasan sistem berbasis keyword yang umum digunakan ATS konvensional, dengan memahami kesetaraan makna lintas bahasa dan terminologi industri.

Keempat, Dual-Track Search UI memungkinkan pengguna memilih antara rekomendasi AI atau eksplorasi manual, namun tetap mempertahankan transparansi melalui Match Ranking Badge yang menunjukkan relevansi setiap lowongan secara real-time.

Kelima, KerjaCerdas mengintegrasikan seluruh siklus ini ke dalam satu platform end-to-end, mulai dari CV processing, job matching, skill gap analysis, hingga rekomendasi pelatihan, sehingga tidak lagi bersifat fragmented seperti ekosistem rekrutmen konvensional. Keenam, arsitektur Autonomous Supervisor Swarm berbasis LangGraph memungkinkan orkestrasi multi-agent untuk menangani matching, analisis, dan rekomendasi secara paralel dan adaptif.

Sebagai pelengkap, sistem juga dapat mencakup lapisan verifikasi untuk mengurangi risiko informasi tidak valid dalam ekosistem lowongan kerja.

---

## Technological / Method Innovation

Inovasi utama KerjaCerdas terletak pada arsitektur Autonomous Multi-Agent Swarm berbasis ReAct (Reasoning and Acting) yang diorkestrasi menggunakan LangGraph, di mana model Gemini bertindak sebagai Supervisor Agent yang mengatur eksekusi berbagai specialized tools secara adaptif. Tools tersebut mencakup Job Search Database, Skill Gap Extractor, ATS Resume Reviewer, dan Mock Interview Generator. Melalui mekanisme Parallel Function Calling, Supervisor Agent dapat memecah satu permintaan kompleks menjadi beberapa task yang dijalankan secara paralel, kemudian mengagregasi hasilnya menjadi output yang kontekstual dan terstruktur.

Pada lapisan pencocokan kandidat, KerjaCerdas menggunakan Gemini Embeddings (3072 dimensi) untuk mengonversi CV dan job description menjadi representasi vektor yang disimpan dalam pgvector database. Proses pencarian awal dilakukan menggunakan cosine similarity untuk mengambil kandidat paling relevan secara cepat, sehingga memungkinkan filtering dalam skala besar secara efisien. Pendekatan berbasis embedding ini memungkinkan sistem memahami kesetaraan makna lintas istilah, misalnya perbedaan terminologi seperti "backend engineer" dan "software developer", yang tidak dapat ditangkap oleh keyword-based matching tradisional.

Untuk memperkuat akurasi analisis pasar kerja, KerjaCerdas mengimplementasikan Blended Skill Trend Signal, yang menggabungkan 70% data frekuensi job posting aktif dan 30% momentum pencarian dari Google Trends melalui PyTrends (geo=ID). Kombinasi ini menghasilkan sinyal kebutuhan skill yang lebih stabil, tidak hanya mencerminkan demand saat ini tetapi juga menangkap emerging skill trends secara lebih dini.

Seluruh arsitektur ini membentuk sistem yang tidak hanya melakukan matching, tetapi juga reasoning dan orchestration secara otonom, menjadikan KerjaCerdas sebagai infrastruktur kecerdasan tenaga kerja yang adaptif terhadap dinamika pasar kerja real-time.

---

## Creativity in Implementation

KerjaCerdas berfokus pada desain pengalaman pengguna yang frictionless dengan tujuan utama mempercepat adopsi tanpa mengorbankan kompleksitas teknologi di backend. Pada tahap onboarding, pengguna tidak diwajibkan mengunggah CV terlebih dahulu. Sistem cukup mengumpulkan informasi dasar melalui onboarding survey berbasis conditional logic untuk langsung menghasilkan personalized job feed. Pendekatan ini memungkinkan pengguna merasakan nilai platform sejak awal interaksi, sehingga menurunkan hambatan adopsi awal secara signifikan.

Seluruh komponen dalam platform dirancang sebagai closed-loop system, di mana setiap aktivitas pengguna menghasilkan feedback yang memperkaya sistem. Skill Gap Analyzer tidak hanya menampilkan kesenjangan skill, tetapi juga terhubung langsung dengan Course Recommender, sehingga pengguna dapat segera mengakses jalur pengembangan skill yang relevan tanpa berpindah platform. Integrasi ini menciptakan alur dari insight menuju aksi yang lebih natural dan berkelanjutan.

Di sisi CV management, ATS-friendly CV Builder terhubung langsung dengan job matching dan skill analysis. Setiap perubahan pada CV secara otomatis memperbarui hasil pencocokan kandidat serta rekomendasi skill gap, menciptakan sistem yang selalu sinkron secara real-time. Selain itu, status lamaran dan proses rekrutmen ditampilkan secara terintegrasi melalui Hiring Phase Tracker, sehingga seluruh perjalanan kandidat dapat dipantau dalam satu ekosistem.

Pendekatan desain ini memastikan bahwa setiap fitur tidak berdiri sendiri, melainkan saling memperkuat dalam satu alur pengalaman yang konsisten. Dengan mengurangi friksi interaksi dan menghubungkan seluruh proses dari eksplorasi pekerjaan, analisis skill, hingga pengembangan skill, KerjaCerdas menciptakan ekosistem rekrutmen yang lebih intuitif, adaptif, dan berorientasi pada aksi nyata bagi pengguna maupun perusahaan.

---

## System Architecture

KerjaCerdas dibangun dengan arsitektur enterprise-grade microservices yang dirancang untuk skalabilitas, reliabilitas, dan ekspansi fitur berbasis AI. Pada lapisan frontend, sistem menggunakan React.js dengan Vite untuk menghadirkan antarmuka yang ringan, responsif, dan memiliki waktu load rendah. Frontend berkomunikasi dengan API Gateway berbasis FastAPI, yang mendukung pemrosesan asynchronous untuk menangani permintaan dalam volume tinggi secara efisien.

Lapisan kecerdasan utama berada pada Agentic Orchestration Layer, yang mengintegrasikan LangGraph dengan Gemini 3.1 Flash sebagai model inti untuk mengorkestrasi berbagai AI agents. Agent ini mencakup Semantic Matching Agent, Skill Gap Analyzer, ATS Resume Reviewer, dan Career Advisor. Melalui pendekatan multi-agent orchestration dan parallel function calling, sistem dapat mengeksekusi beberapa tugas secara simultan, kemudian menggabungkan hasilnya menjadi output yang konsisten dan kontekstual.

Pada lapisan data, KerjaCerdas menggunakan Google Cloud SQL (PostgreSQL) dengan ekstensi pgvector untuk menyimpan embedding kandidat dan lowongan kerja. Representasi skill dikodekan menggunakan Gemini Embeddings (3072 dimensi), kemudian proses pencocokan dilakukan menggunakan cosine similarity search untuk menangkap kesamaan semantik antar profil dan deskripsi pekerjaan secara akurat, bukan sekadar keyword matching.

Dari sisi keamanan, sistem menerapkan autentikasi berbasis JWT (JSON Web Token) serta enkripsi end-to-end pada komunikasi antara frontend, API, dan layanan internal. Kombinasi arsitektur ini memungkinkan KerjaCerdas menjalankan proses rekrutmen berbasis AI yang cepat, aman, dan skalabel, sekaligus siap untuk kebutuhan ekspansi dan beban pengguna dalam skala besar.

---

## Data & Feasibility

Keandalan sistem AI KerjaCerdas bergantung pada kualitas, cakupan, dan relevansi data yang digunakan untuk membangun representasi pasar tenaga kerja Indonesia. Fondasi utama berasal dari data resmi Badan Pusat Statistik (BPS) serta Klasifikasi Baku Jabatan Indonesia (KBJI 2014) yang dipetakan ulang ke dalam struktur modern job taxonomy berbasis skill ontology untuk menangkap evolusi kebutuhan industri digital yang lebih dinamis.

Data tersebut kemudian diperkaya melalui agregasi data lowongan kerja dari berbagai open job market data sources, yang mencerminkan permintaan tenaga kerja aktual di sektor industri selama periode lima tahun terakhir. Kombinasi ini memungkinkan sistem membangun pemahaman yang lebih akurat terhadap hubungan antara jabatan, deskripsi pekerjaan, dan skill yang dibutuhkan di dunia kerja nyata, tanpa bergantung pada satu sumber data tunggal.

Seluruh data kemudian diproses menjadi korpus semantik berbasis embedding menggunakan Gemini Embeddings (3072 dimensi), sehingga setiap entitas pekerjaan dan skill direpresentasikan dalam ruang vektor yang seragam. Pendekatan ini memungkinkan sistem melakukan semantic matching yang lebih robust, termasuk menangkap variasi istilah seperti sinonim jabatan, campuran Bahasa Indonesia–Inggris, serta akronim industri yang umum digunakan dalam praktik rekrutmen di Indonesia.

Dari sisi feasibility, pendekatan ini memungkinkan KerjaCerdas untuk tetap relevan terhadap perubahan pasar kerja karena struktur data tidak bersifat statis, melainkan dapat terus diperbarui seiring perubahan tren industri dan kebutuhan skill.

---

## Security & Compliance

KerjaCerdas menempatkan kepatuhan terhadap Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022) sebagai prinsip fundamental dalam seluruh desain sistem, mencakup pengumpulan, penyimpanan, pemrosesan, dan distribusi data pengguna. Pendekatan ini memastikan bahwa setiap alur data dirancang dengan prinsip data minimization, purpose limitation, dan user consent sebagai standar operasional utama.

Dari sisi keamanan aplikasi, seluruh kredensial pengguna diamankan menggunakan algoritma bcrypt hashing, sehingga password tidak pernah disimpan dalam bentuk plaintext maupun dapat diakses kembali oleh sistem. Untuk melindungi informasi sensitif dalam proses pemrosesan AI, KerjaCerdas menerapkan Redaction Middleware System yang secara otomatis mendeteksi dan menyamarkan Personally Identifiable Information (PII) seperti alamat, nomor identitas, email, dan nomor telepon sebelum data diproses oleh model AI atau layanan eksternal.

Pada lapisan infrastruktur, seluruh komunikasi antar layanan diamankan melalui enkripsi dan kontrol akses berbasis token untuk mencegah penyalahgunaan atau akses tidak sah. Selain itu, desain sistem juga mempertimbangkan kemampuan migrasi ke lingkungan komputasi privat seperti Google Vertex AI, sehingga pemrosesan data sensitif dapat dilakukan dalam ekosistem yang lebih terkontrol sesuai kebutuhan skala enterprise.

Pendekatan ini mendukung implementasi prinsip Zero Data Retention, di mana data tidak disimpan lebih lama dari yang diperlukan untuk proses komputasi. Kombinasi antara kepatuhan regulasi, proteksi data berlapis, dan arsitektur yang dapat dikontrol ini memperkuat kepercayaan pengguna.

---

## Implementation Readiness (MVP)

Status pengembangan KerjaCerdas saat ini telah melampaui tahap konseptual dan prototipe, serta telah mencapai fase Minimum Viable Product (MVP) yang fungsional. Sistem telah mampu menjalankan alur inti secara end-to-end, mulai dari ekstraksi informasi dari dokumen CV PDF, transformasi data menjadi embedding berdimensi 3072 menggunakan Gemini Embeddings, hingga proses semantic matching berbasis cosine similarity pada pgvector. Hasil analisis kemudian disajikan melalui antarmuka terintegrasi yang dikoordinasikan oleh Autonomous Multi-Agent Swarm berbasis LangGraph, sehingga proses reasoning, matching, dan rekomendasi dapat berjalan secara adaptif dan near real-time.

Pada tahap ini, sistem telah menunjukkan performa yang stabil dalam menjalankan pipeline utama job matching dan skill analysis, termasuk responsivitas yang mendukung pengalaman pengguna secara interaktif. Hal ini menunjukkan bahwa arsitektur inti sudah siap untuk dievaluasi dalam skenario penggunaan terbatas sebelum ekspansi skala besar.

Dalam horizon pengembangan 6-12 bulan ke depan, fokus utama diarahkan pada penguatan kesiapan produksi dan skalabilitas sistem. Agenda pengembangan mencakup migrasi penyimpanan dokumen ke Google Cloud Storage, optimalisasi Google Cloud SQL (PostgreSQL) dengan ekstensi pgvector, serta integrasi payment gateway (Xendit atau Midtrans) untuk mendukung kebutuhan transaksi komersial.

Penguatan infrastruktur ini menjadi fondasi untuk implementasi Hybrid Revenue Model, yang menggabungkan skema usage-based access dan subscription-based layanan. Dengan demikian, KerjaCerdas diposisikan siap memasuki fase produksi dengan kemampuan skalabilitas yang lebih tinggi, stabilitas sistem yang lebih kuat, serta kesiapan mendukung pertumbuhan pengguna dan beban rekrutmen dalam skala nasional.

---

## Value Proposition

KerjaCerdas memberikan nilai pada dua sisi utama pasar tenaga kerja Indonesia dengan pendekatan yang menghubungkan efisiensi rekrutmen, transparansi proses, dan peningkatan akses peluang kerja.

Bagi pencari kerja, khususnya lulusan SMK/SMA dan fresh graduate, KerjaCerdas membantu mengatasi masalah utama berupa ketidakjelasan kecocokan skill dan rendahnya visibilitas terhadap peluang kerja yang relevan. Melalui Semantic AI Job Matching Engine, kandidat dapat ditemukan berdasarkan kesesuaian makna skill, bukan sekadar kata kunci, sehingga peluang untuk masuk ke tahap seleksi menjadi lebih tinggi. Pengguna juga mendapatkan akses terhadap analisis skill gap yang membantu mereka memahami kesenjangan skill terhadap kebutuhan industri serta menerima rekomendasi pengembangan skill yang lebih terarah. Selain itu, sistem menyediakan transparansi status lamaran secara real-time melalui tracking terintegrasi, sehingga proses rekrutmen menjadi lebih jelas dan tidak lagi bersifat tertutup.

Bagi pemberi kerja, mulai dari UMKM hingga perusahaan skala besar, KerjaCerdas menghadirkan proses rekrutmen yang lebih cepat, sederhana, dan berbasis data. Sistem secara otomatis melakukan ranking kandidat berdasarkan relevansi skill, sehingga perusahaan tidak perlu lagi menyaring ratusan hingga ribuan CV secara manual. Hal ini secara signifikan mengurangi waktu screening dan meningkatkan kualitas shortlist kandidat yang diterima.

Model monetisasi berbasis usage-based access memungkinkan perusahaan hanya membayar ketika mengakses kandidat yang telah direkomendasikan, sehingga biaya rekrutmen menjadi lebih efisien dan selaras dengan nilai yang diperoleh. Secara keseluruhan, KerjaCerdas mengubah proses rekrutmen dari sistem yang tidak transparan dan tidak efisien menjadi ekosistem pencocokan kerja yang lebih cepat, akurat, dan inklusif.

---

## Model Revenue / Funding

KerjaCerdas menerapkan Hybrid Revenue Model yang dirancang untuk menyeimbangkan akuisisi pengguna masif dengan keberlanjutan pendapatan jangka panjang. Model ini berangkat dari realitas pasar Indonesia di mana fitur inti seperti job posting dan basic matching telah menjadi standar gratis pada berbagai platform rekrutmen, sehingga monetisasi tidak lagi efektif dilakukan pada akses dasar, melainkan pada layanan bernilai tambah.

Sumber pendapatan utama berasal dari skema Pay-to-Unlock sebesar Rp50.000 untuk setiap 10 kontak kandidat terverifikasi. Mekanisme ini memungkinkan UMKM dan perusahaan skala menengah mengakses kandidat yang telah direkomendasikan oleh sistem tanpa biaya langganan awal, sehingga hambatan adopsi dapat ditekan secara signifikan. Model ini tetap menjaga prinsip usage-based pricing, di mana perusahaan hanya membayar ketika memperoleh nilai nyata berupa akses kandidat.

Lapisan kedua adalah KerjaCerdas Pro dengan biaya Rp299.000 per bulan, yang menyediakan kuota unlock lebih besar serta fitur analitik rekrutmen untuk optimisasi pengambilan keputusan HR. Untuk skala enterprise, tersedia Enterprise API License yang memungkinkan integrasi langsung mesin semantic matching dan multi-agent orchestration ke dalam sistem HRIS internal perusahaan.

Sebagai tambahan, terdapat model monetisasi berbasis afiliasi dari rekomendasi kursus (Dicoding, Coursera) yang muncul dari hasil analisis skill gap pengguna. Kombinasi ini menciptakan struktur pendapatan hibrida yang scalable, rendah friksi, dan sesuai dengan pola adopsi pasar tenaga kerja digital di Indonesia.

---

## Cost Structure & Sustainability

KerjaCerdas memiliki struktur biaya yang dirancang untuk menjaga skalabilitas tinggi dengan unit economics yang tetap efisien seiring pertumbuhan pengguna. Komponen biaya utama berasal dari pemrosesan AI, khususnya penggunaan Large Language Model (LLM) untuk embedding, analisis skill gap, dan orchestration agent. Sistem ini dioptimalkan menggunakan model Gemini Flash yang memiliki biaya inferensi rendah, sehingga beban biaya tidak meningkat secara linear terhadap volume pengguna.

Pada fase MVP, biaya infrastruktur tetap relatif ringan, dengan estimasi sekitar Rp1.500.000 per bulan yang mencakup Cloud SQL (PostgreSQL dengan ekstensi pgvector) untuk penyimpanan dan pencarian vektor. Kombinasi ini membentuk fondasi data layer yang stabil tanpa kebutuhan infrastruktur berlebihan di tahap awal.

Efisiensi operasional diperkuat melalui dua mekanisme utama. Pertama, penerapan batch processing dan deduplikasi request untuk mengurangi pemanggilan ulang LLM pada permintaan dengan konteks serupa, sehingga menekan konsumsi token secara signifikan. Kedua, proses semantic matching kandidat dan lowongan dilakukan langsung di level database menggunakan pgvector dan Cosine Similarity, sehingga tidak memerlukan komputasi AI tambahan pada setiap pencarian.

Dengan arsitektur ini, KerjaCerdas mampu mempertahankan biaya operasional yang rendah sekaligus tetap mendukung beban komputasi tinggi, menciptakan fondasi keberlanjutan finansial yang stabil untuk mendukung ekspansi pengguna dan monetisasi hybrid model yang telah dirancang.

---

## Scalability

KerjaCerdas dibangun dengan arsitektur API yang bersifat stateless, sehingga setiap permintaan diproses secara independen tanpa ketergantungan pada sesi pengguna. Desain ini memungkinkan horizontal scaling melalui auto-scaling pada lingkungan Kubernetes Cloud, sehingga kapasitas sistem dapat menyesuaikan secara dinamis ketika terjadi lonjakan trafik dari pencari kerja maupun perusahaan.

Pada level implementasi, layanan inti seperti semantic matching, embedding generation, dan job-candidate ranking dikemas dalam bentuk microservices tercontainerisasi. Pendekatan ini memungkinkan distribusi beban komputasi secara merata di berbagai node, menjaga stabilitas performa meskipun volume proses meningkat secara signifikan.

Selain itu, KerjaCerdas menggunakan arsitektur domain-agnostic, di mana pipeline AI tidak bergantung pada satu sektor industri tertentu. Hal ini membuat sistem mudah diadaptasi ke berbagai kebutuhan rekrutmen hanya dengan penyesuaian data dan taksonomi pekerjaan, tanpa perlu mengubah struktur backend atau model inti.

Dengan kombinasi stateless architecture, microservices, dan cloud-native deployment, KerjaCerdas memiliki kemampuan skalabilitas tinggi yang memungkinkan ekspansi ke berbagai pasar, termasuk rekrutmen lintas sektor dan tenaga kerja internasional, secara efisien dan berkelanjutan.

---

## Partnership & Distribution

KerjaCerdas membangun strategi pertumbuhan dan distribusi melalui tiga pilar kemitraan utama yang saling melengkapi dalam ekosistem rekrutmen berbasis AI. Pilar pertama adalah kerja sama dengan pusat karier perguruan tinggi sebagai kanal utama akuisisi kandidat, khususnya mahasiswa tingkat akhir dan lulusan baru. Melalui integrasi ini, platform dapat menjangkau talenta yang lebih terstruktur dan siap masuk ke pasar kerja, sekaligus mempercepat adopsi di lingkungan akademik.

Pilar kedua adalah kolaborasi dengan mitra EdTech seperti Coursera dan Dicoding yang berperan sebagai lapisan pendukung dalam ekosistem pengembangan skill. Hasil analisis skill gap dari sistem diterjemahkan menjadi rekomendasi pelatihan yang relevan dengan kebutuhan industri, sehingga pengguna dapat dengan mudah mengakses jalur peningkatan keterampilan tanpa keluar dari alur penggunaan utama platform.

Pilar ketiga berfokus pada penguatan trust layer melalui integrasi layanan verifikasi identitas dan kredensial pendidikan. Mekanisme ini memperkuat sistem Anti-Fraud Verification Engine untuk memastikan keaslian data pengguna dan perusahaan, sehingga interaksi dalam platform menjadi lebih aman, transparan, dan terpercaya. Kombinasi tiga pilar ini menciptakan model distribusi yang tidak hanya memperluas jangkauan pengguna, tetapi juga meningkatkan kualitas dan keandalan ekosistem rekrutmen secara keseluruhan.

---

## Problem–Market Fit

Pasar tenaga kerja Indonesia menghadapi ketidakseimbangan struktural yang bersifat sistemik, di mana tingginya jumlah penganggur terjadi bersamaan dengan kesulitan perusahaan dalam menemukan talenta yang sesuai. Sebagian besar pengangguran berasal dari lulusan SMA dan SMK yang mencapai 4,21 juta orang atau sekitar 56% dari total penganggur nasional, menunjukkan bahwa masalah ini bukan bersifat sementara, melainkan kronis dan berulang. Di saat yang sama, banyak perusahaan, khususnya UMKM, melaporkan kesulitan mendapatkan kandidat yang relevan meskipun jumlah pelamar sangat tinggi.

Ketimpangan ini mencerminkan kondisi oversupply tenaga kerja pada posisi dengan skill rendah, sementara sektor digital dan industri modern justru mengalami undersupply talenta yang memiliki keterampilan sesuai kebutuhan. Akibatnya, perusahaan harus menghabiskan sumber daya besar untuk menyaring ratusan pelamar yang tidak relevan, sedangkan pencari kerja menghadapi kurangnya visibilitas terhadap keterampilan yang dibutuhkan pasar.

KerjaCerdas dirancang untuk menjembatani ketidakseimbangan ini melalui pendekatan pencocokan semantik, analisis kesenjangan skill, dan rekomendasi pengembangan keterampilan yang lebih terarah.

---

## Evidence of Demand

Permintaan terhadap solusi KerjaCerdas tervalidasi melalui kombinasi data pasar dan temuan lapangan dari kedua sisi pasar tenaga kerja.

Dari sisi pencari kerja, sesi wawancara dengan kandidat secara konsisten mengungkap dua pola: kesulitan menemukan lowongan yang benar-benar relevan dengan skill aktual, dan ketidakjelasan terhadap skill apa yang perlu dikembangkan untuk kompetitif di posisi yang dituju. Mayoritas kandidat mengaku menelaah deskripsi pekerjaan secara manual untuk menebak skill yang dibutuhkan, dan menghabiskan beberapa jam per minggu untuk mencari lowongan serta menyesuaikan CV tanpa feedback yang berarti.

Dari sisi perusahaan, kuesioner yang diisi oleh pemilik usaha dan praktisi HR dari berbagai segmen, mulai dari usaha menengah, startup, hingga perusahaan dengan tim HR dedicated, menunjukkan bahwa tantangan utama bukan kekurangan pelamar, melainkan kualitas yang tidak memenuhi kriteria dasar. Pada sejumlah proses rekrutmen yang disurvei, lebih dari 80% pelamar tersaring di tahap awal, memaksa proses screening manual yang menyita waktu produktif.

Temuan ini diperkuat oleh dua pernyataan dari praktisi HR yang disurvei: *"Rekrutmen yang baik itu bukan soal kecepatan dapat orang. Tapi soal akurasi menempatkan orang yang tepat di posisi yang tepat."* Dan dari sisi pemberi kerja: *"Yang kita butuh itu bukan lebih banyak pelamar. Kita butuh lebih sedikit pelamar, tapi yang beneran cocok."*

---

## Target Market

Target pasar KerjaCerdas terdiri dari dua segmen utama dalam ekosistem ketenagakerjaan Indonesia. Dari sisi kandidat, platform menargetkan sekitar 3,5 juta lulusan baru (fresh graduate) serta mahasiswa tingkat akhir Generasi Z berusia 18-25 tahun dari institusi vokasi (SMK, Politeknik) dan perguruan tinggi D4/S1. Segmen ini memiliki karakteristik melek digital dan aktif mencari pekerjaan melalui kanal online, namun sering mengalami kesulitan dalam menembus tahap seleksi serta belum memiliki pemetaan yang jelas terhadap kebutuhan skill di industri.

Dari sisi perusahaan, KerjaCerdas menargetkan sekitar 50.000 perusahaan skala menengah, UMKM yang sedang bertumbuh, serta startup teknologi. Segmen ini umumnya memiliki kebutuhan tinggi terhadap talenta digital seperti Digital Marketer, Data Analyst, dan Software Engineer, namun menghadapi keterbatasan waktu, sumber daya, serta anggaran untuk proses rekrutmen berbasis headhunter atau platform iklan premium.

Kedua segmen ini berada dalam kondisi ketidakseimbangan yang sama: kandidat sulit memahami kebutuhan industri, sementara perusahaan kesulitan menemukan kandidat yang relevan di tengah volume pelamar yang tinggi. KerjaCerdas memposisikan diri sebagai jembatan antara kedua sisi pasar ini melalui pendekatan rekrutmen berbasis data dan pencocokan yang lebih efisien.

---

## Adoption Readiness

Tantangan adopsi KerjaCerdas tidak terletak pada kesiapan teknologi, melainkan pada perbedaan tingkat literasi digital dan kebiasaan kerja antara dua sisi pasar tenaga kerja. Di sisi pencari kerja, kondisi sangat mendukung: penetrasi internet Indonesia mencapai 80,66% atau sekitar 229 juta pengguna pada 2025, dengan dominasi Gen Z dan milenial yang sudah terbiasa dengan pendekatan mobile-first. Selain itu, 18,9 juta peserta program Prakerja menunjukkan bahwa minat terhadap upskilling digital sudah terbentuk, sementara mayoritas kandidat juga telah familiar menggunakan portal kerja konvensional, sehingga perubahan perilaku yang dibutuhkan relatif kecil.

Sebaliknya, hambatan utama berada di sisi pemberi kerja, khususnya UMKM, di mana tingkat adopsi platform digital masih rendah, hanya sekitar 13%. Banyak proses rekrutmen masih dilakukan secara manual melalui WhatsApp, referral, atau walk-in, tanpa sistem HR formal.

Untuk menjawab kondisi ini, KerjaCerdas menerapkan prinsip Zero Learning Curve, yaitu merancang pengalaman pengguna yang menyerupai kebiasaan yang sudah ada. Pembuatan lowongan dibuat sederhana seperti formulir, hasil seleksi diringkas dalam insight berbasis AI, dan ketika kandidat dipilih, perusahaan dapat langsung mengakses kontak terverifikasi melalui mekanisme Direct Contact Unlock untuk melanjutkan komunikasi via telepon atau email yang sudah familiar. Pendekatan ini memungkinkan adopsi terjadi tanpa perubahan perilaku yang signifikan di kedua sisi pasar.

---

## Progress Since the 1st Submission

Status inovasi KerjaCerdas telah berkembang secara signifikan dari sekadar mockup interaktif menjadi functional MVP yang mampu menjalankan proses CV parsing, pembentukan embedding menggunakan Gemini Embeddings, serta semantic matching melalui pgvector secara nyata, bukan lagi simulasi antarmuka.

Perubahan juga terjadi pada arsitektur teknis yang digunakan. Jika pada tahap awal sistem mengandalkan kombinasi IndoBERT dan BGE-M3 dengan kebutuhan komputasi yang relatif tinggi, kini KerjaCerdas memanfaatkan Gemini 3.1 Flash sebagai Supervisor Agent dalam arsitektur Autonomous Multi-Agent Swarm berbasis LangGraph. Melalui Parallel Function Calling, sistem didesain untuk mengorkestrasi Semantic Matching Agent, Skill Gap Analyzer Agent, dan Career Advisor Agent secara bersamaan.

Dari sisi validasi pasar, pendekatan yang sebelumnya bertumpu pada data sekunder kini diperkuat oleh wawancara kandidat dan kuesioner HR yang mengungkap tingginya tingkat penyaringan pelamar pada tahap awal.

Selain itu, model bisnis telah berkembang menjadi lebih konkret melalui skema Pay-to-Unlock, KerjaCerdas Pro, dan Enterprise API License, dengan target menjangkau 50.000 pencari kerja dan 500 perusahaan serta menurunkan Time-to-Shortlist hingga 90% dalam tahun pertama.

---

## Current Status

> **Functional Prototype** — Advanced Minimum Viable Product dengan arsitektur penuh Multi-Agent Swarm dan Vector Database.
