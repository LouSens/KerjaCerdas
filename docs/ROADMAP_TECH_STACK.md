# Peta Jalan Implementasi Teknologi & Migrasi Infrastruktur Korporasi

Sistem yang digunakan pada demonstrasi purwarupa saat ini (MVP/Demo Mode) telah dibangun di atas infrastruktur relasional tangguh berbasis **PostgreSQL** dengan ekstensi **pgvector**. Meskipun MVP ini sudah kokoh secara arsitektural, demi memastikan keandalan, redundansi data skala global, dan skalabilitas bagi jutaan entitas saat peluncuran komersial, berikut adalah pembedahan mendalam *Roadmap* migrasi teknologi tingkat lanjut (*Enterprise Cloud*) pasca-MVP.

---

## Fase 1 (Sekarang): Enterprise Relational Backend (PostgreSQL + pgvector)
*Tujuan: Memastikan integritas data, kueri analitik volume tinggi, dan pencarian semantik instan.*

Pada fase rilis saat ini (MVP/Demo Mode), kami telah sepenuhnya mengadopsi **PostgreSQL** dan membuang penyimpanan statis (SQLite/JSON). Keputusan teknis ini tidak didasarkan pada skala semata, melainkan integrasi mutlak terhadap ekstensi **pgvector**.
- **Peran pgvector:** Mengambil alih proses kalkulasi jarak (Cosine Similarity) vektor 768-dimensi secara internal di dalam basis data. Ini meningkatkan *query throughput* secara masif dan memungkinkan pencarian pencocokan talenta seketika (*real-time*).
- **Alembic ORM Migrations:** Skema tabel dikelola secara progresif menggunakan Alembic. Perubahan kolom *vector embeddings* pada rilis fitur tidak akan mengganggu ketersediaan server berkat metode iterasi migrasi berkelanjutan.
- **Injeksi Data Kontainer:** Simulasi basis data diinjeksi langsung pada saat inisialisasi kontainer Docker melalui `init.sql`, memastikan konsistensi struktur dan stabilitas eksekusi AI di setiap lingkungan *deploy*.

---

## Fase 2: Stabilitas Infrastruktur Tingkat Awan (GCP Cloud SQL & GCS)
*Tujuan: Isolasi state serverless, replikasi global, dan keandalan tingkat komersial (99.9% Uptime).*

### Arsitektur Google Cloud Platform (GCP)
1. **Google Cloud SQL (Postgres + pgvector):** Database akan dipindahkan secara *managed* oleh infrastruktur tersentralisasi *Cloud SQL*. Penyediaan skalabilitas baca (*Read Replica*) yang masif dibutuhkan demi mendukung jutaan kueri *Semantic Matcher* secara simultan saat peluncuran publik skala nasional tanpa intervensi administrasi pangkalan data (DBA).
2. **Google Cloud Storage (GCS) untuk Objek Statis (Blob):** Pengelolaan jutaan berkas riwayat hidup PDF dan foto identitas akan ditransisikan penuh ke *bucket* GCS. Operasi *Multi-modal Extraction* akan menarik dokumen secara asinkron dari GCS alih-alih mengandalkan muatan berat sistem berkas lokal *Docker container*.
3. **Optimisasi Semantic Caching dengan Cloud Redis:** Hasil kalkulasi orkestrasi AI (terutama identifikasi profil pelamar terhadap lowongan yang memiliki repetisi sintaks statis tinggi) disimpan dalam *Redis In-Memory Cache*. Skema perlindungan ini membentengi server dari pemborosan kuota API LLM *Gemini* atas permintaan yang sudah pernah dieksekusi (*Query Deduplication*).

---

## Fase 3: Privasi Kognitif Mutlak (Google Vertex AI Integration)
*Tujuan: Garansi Kepatuhan Hukum (UU PDP) dan Zero Data Retention.*

Pada penetrasi tingkat akhir korporasi perbankan atau pemerintahan, pelamar sangat konservatif terhadap penyebaran parameter PII (Personally Identifiable Information). Integrasi **Google Vertex AI** menjembatani dua limitasi kritis tersebut:
- **Kedaulatan Perlindungan Data Ekstrim:** *Vertex AI Endpoint* memastikan data *prompt LLM* KerjaCerdas dieksekusi dalam ruang komputasi (Virtual Private Cloud) yang sepenuhnya terisolasi dan mandiri. Jejak log dan informasi pribadi dalam CV mutlak **TIDAK AKAN** diserap oleh agregator publik model dasar Google. Kredibilitas hukum (*Zero Data Retention*) merupakan nilai jual kunci produk saat menghadapi lelang instansi pemerintah dan Disnaker regional.
- **Fine-Tuning Berkelanjutan (LoRA):** Menggunakan basis data tervalidasi yang mengandungi dialek khas lokal, singkatan industri asimetris, dan akronim perusahaan perintis Indonesia untuk menala ujung model (Parameter *Fine-Tuning*) secara internal pada ruang komputasi *Vertex AI*, mencetak matriks evaluasi AI (Accuracy Evaluation) yang sangat selaras dengan perilaku dan budaya rekrutmen demografi domestik.

---

## Kesimpulan Arsitektural Eksekutif
Peta jalan transisi teknis dari SQLite dan infrastruktur skrip lokal (MVP) menuju dominasi *PostgreSQL, Cloud SQL*, dan *Vertex AI* tidak didorong oleh sekadar pemenuhan validasi *buzzword* teknologi masa kini. Setiap mata rantai penumpukan infrastruktur ini dihitung dan diadopsi spesifik sebagai perisai mitigasi hukum (*compliance*) perlindungan keamanan identitas kandidat dan penekanan limitasi beban komputasi di tingkat skalabilitas puluhan ribu organisasi HRD aktif harian (*DAU*).
