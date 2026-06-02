# Peta Jalan Implementasi Teknologi & Migrasi Infrastruktur Korporasi

Sistem yang digunakan pada demonstrasi purwarupa saat ini (MVP/Demo Mode) telah dibangun di atas infrastruktur relasional tangguh berbasis **PostgreSQL** dengan ekstensi **pgvector** serta arsitektur **LangGraph** terdesentralisasi. Meskipun MVP ini sudah kokoh secara arsitektural, demi memastikan keandalan, redundansi data skala global, dan skalabilitas bagi jutaan entitas saat peluncuran komersial, berikut adalah pembedahan mendalam *Roadmap* migrasi teknologi tingkat *Enterprise*.

---

## Fase 1 (Bulan 1 - 3): Enterprise Relational Backend (PostgreSQL + pgvector)
*Target: Menjamin integritas data untuk 50.000 pengguna MVP dan kueri analitik dengan latensi di bawah 1 detik hingga Akhir Kuartal 1.*

Pada rilis awal (MVP/Demo Mode), kami mengandalkan **PostgreSQL** dengan integrasi ekstensi **pgvector**.
- **Peran pgvector & LangGraph:** Vektor 3072-dimensi diolah secara internal di dalam pangkalan data. Agen *Supervisor* dari LangGraph merutekan komputasi untuk pencarian *Semantic Cosine* dengan heuristik filter dari *Dashboard* pengguna.
- **Alembic ORM Migrations:** Skema tabel dikelola progresif menggunakan Alembic, memastikan rilis fitur pada bulan ke-2 tidak mengganggu ketersediaan layanan (*Zero-Downtime Migration*).
- **Injeksi Kontainer Otomatis:** Infrastruktur diorkestrasi mutlak menggunakan Docker Compose, mendemonstrasikan keandalan peluncuran (*plug-and-play*) untuk investor maupun auditor teknis.

---

## Fase 2 (Bulan 4 - 8): Migrasi Stabilitas Awan (GCP Cloud SQL & Redis Caching)
*Target: Migrasi penuh ke infrastruktur tersentralisasi Google Cloud Platform tanpa kehilangan paket data pada Bulan ke-6, mengantisipasi lonjakan lebih dari 1 juta kueri API/hari.*

### Arsitektur Google Cloud Platform (GCP)
1. **Google Cloud SQL (Postgres + pgvector):** Database dipindahkan secara *managed* oleh infrastruktur *Cloud SQL*. Penyediaan *Read Replica* menjamin ketersediaan tinggi (*High Availability*) 99.9% Uptime saat platform diluncurkan secara nasional.
2. **Google Cloud Storage (GCS):** Pengelolaan jutaan berkas CV PDF dan foto identitas ditransisikan penuh ke *bucket* GCS, meringankan beban *Docker Container* dan mempercepat *I/O latency*.
3. **Cloud Redis (Semantic Caching):** Menyimpan histori komputasi kalkulasi jarak vektor yang identik (misal: "Frontend Developer" vs "React JS") untuk mencegah pemanggilan berulang ke *endpoint* Gemini. Target penghematan *cost LLM* bulanan tambahan sebesar 20%.
4. **ETL Pipeline & Data Scraping:** Membangun sistem *crawler* harian terisolasi untuk menambang data riwayat lowongan (*historical data*) dari portal eksternal guna memperkaya referensi AI, yang secara bertahap akan digantikan oleh arsitektur *Internal Feedback Loop* mandiri.

---

## Fase 3 (Bulan 9 - 18): Privasi Kognitif Mutlak (Google Vertex AI & Pembayaran Skala Penuh)
*Target: Memenangkan 3 kontrak B2B tingkat pemerintahan (B2G/Enterprise) di Q2 Tahun 2 melalui jaminan kepatuhan privasi data absolut.*

- **Kedaulatan Perlindungan Data (Vertex AI):** *Vertex AI Endpoint* memastikan data *prompt* LLM dieksekusi dalam ruang komputasi *Virtual Private Cloud (VPC)* yang diisolasi. Jejak log identitas (*PII*) **TIDAK AKAN** diserap oleh model dasar publik Google. *Zero Data Retention* menjadi pilar utama perlindungan privasi (UU PDP No.27/2022) bagi institusi pemerintahan dan perbankan yang menuntut kepatuhan tingkat elit.
- **Micro-Tuning Berkelanjutan (LoRA):** Menala model secara internal pada komputasi *Vertex AI* dengan dialek khas rekrutmen Indonesia (akronim Disnaker, nomenklatur kampus lokal).
- **Payment Gateway Korporasi Terintegrasi:** Mengaktifkan API Payment Gateway eksternal (Midtrans / Xendit) yang pada fase MVP dinonaktifkan sementara. Transaksi pembayaran B2B (Pay-to-Unlock) diotomatisasi secara penuh tanpa intervensi operasional kasir.

---

## Kesimpulan Arsitektural Eksekutif
Peta jalan teknis dari arsitektur kontainer lokal menuju ekosistem komputasi awan *Vertex AI* didorong mutlak oleh tuntutan metrik **SMART** yang dapat dipertanggungjawabkan: penekanan biaya latensi infrastruktur, validasi keamanan privasi identitas pelamar, dan pengamanan struktur fundamental sistem bagi ekspansi jutaan pengguna aktif harian pada tahun pertama operasional.
