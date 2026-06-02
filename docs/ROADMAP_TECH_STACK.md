# Peta Jalan Implementasi Teknologi & Migrasi Infrastruktur Korporasi

Sistem yang digunakan pada demonstrasi purwarupa saat ini (MVP/Demo Mode) beroperasi dengan struktur data lokal terisolasi (*in-memory/file-system SQLite & JSON*). Demi memastikan keandalan, redundansi data, dan skalabilitas bagi jutaan entitas saat diluncurkan secara komersial, berikut adalah pembedahan mendalam *Roadmap* arsitektur teknologi pasca-MVP.

---

## Fase 1 (Sekarang): Minimum Viable Product (MVP)
*Tujuan: Pembuktian fungsional interaksi orkestrasi Swarm dan semantik.*
- **Datastore Utama:** SQLite dan manajemen basis data berkas (JSON).
- **Injeksi Data:** Simulasi *mock-data* statis tanpa orkestrasi multi-threading tingkat lanjut.
- **Pengolahan Model:** LangGraph di sisi *FastAPI runtime*. 

---

## Fase 2: Enterprise Relational Backend (Migrasi PostgreSQL) - [SELESAI]
*Tujuan: Memastikan integritas data dan kueri analitik volume tinggi.*

### Migrasi Database (PostgreSQL & Alembic)
Kami akan beralih secara menyeluruh dari SQLite ke **PostgreSQL**. Keputusan teknis ini tidak didasarkan pada skala semata, melainkan integrasi mutlak terhadap ekstensi **pgvector**.
- **Peran pgvector:** Mengambil alih proses kalkulasi jarak (Cosine Similarity) 3072 dimensi dari komputasi memori RAM *Python* ke lapisan abstraksi *Database Layer* secara internal. Ini meningkatkan *query throughput* sebesar ribuan kali lipat dengan indeks komputasi *HNSW (Hierarchical Navigable Small World)*.
- **Alembic ORM Migrations:** Skema tabel (Entitas Seeker, Entitas Job, Riwayat Transaksi) akan diaudit secara progresif (*version-controlled*) menggunakan Alembic. Perubahan kolom *vector embeddings* pada rilis fitur minor tidak akan menumbangkan ketersediaan server berkat metode iterasi migrasi berkelanjutan (CI/CD *pipeline migrations*).

---

## Fase 3: Stabilitas Infrastruktur Tingkat Awan (GCP Cloud SQL & GCS)
*Tujuan: Isolasi state serverless, replikasi global, dan keandalan tingkat komersial (99.9% Uptime).*

### Arsitektur Google Cloud Platform (GCP)
1. **Google Cloud SQL (Postgres + pgvector):** Database akan dipindahkan secara *managed* oleh infrastruktur tersentralisasi *Cloud SQL*. Penyediaan skalabilitas baca (*Read Replica*) yang masif dibutuhkan demi mendukung jutaan kueri *Semantic Matcher* secara simultan saat peluncuran publik skala nasional tanpa intervensi administrasi pangkalan data (DBA).
2. **Google Cloud Storage (GCS) untuk Objek Statis (Blob):** Pengelolaan jutaan berkas riwayat hidup PDF dan foto identitas akan ditransisikan penuh ke *bucket* GCS. Operasi *Multi-modal Extraction* akan menarik dokumen secara asinkron dari GCS alih-alih mengandalkan muatan berat sistem berkas lokal *Docker container*.
3. **Optimisasi Semantic Caching dengan Cloud Redis:** Hasil kalkulasi orkestrasi AI (terutama identifikasi profil pelamar terhadap lowongan yang memiliki repetisi sintaks statis tinggi) disimpan dalam *Redis In-Memory Cache*. Skema perlindungan ini membentengi server dari pemborosan kuota API LLM *Gemini* atas permintaan yang sudah pernah dieksekusi (*Query Deduplication*).

---

## Fase 4: Privasi Kognitif Mutlak (Google Vertex AI Integration)
*Tujuan: Garansi Kepatuhan Hukum (UU PDP) dan Zero Data Retention.*

Pada penetrasi tingkat akhir korporasi perbankan atau pemerintahan, pelamar sangat konservatif terhadap penyebaran parameter PII (Personally Identifiable Information). Integrasi **Google Vertex AI** menjembatani dua limitasi kritis tersebut:
- **Kedaulatan Perlindungan Data Ekstrim:** *Vertex AI Endpoint* memastikan data *prompt LLM* KerjaCerdas dieksekusi dalam ruang komputasi (Virtual Private Cloud) yang sepenuhnya terisolasi dan mandiri. Jejak log dan informasi pribadi dalam CV mutlak **TIDAK AKAN** diserap oleh agregator publik model dasar Google. Kredibilitas hukum (*Zero Data Retention*) merupakan nilai jual kunci produk saat menghadapi lelang instansi pemerintah dan Disnaker regional.
- **Fine-Tuning Berkelanjutan (LoRA):** Menggunakan basis data tervalidasi yang mengandungi dialek khas lokal, singkatan industri asimetris, dan akronim perusahaan perintis Indonesia untuk menala ujung model (Parameter *Fine-Tuning*) secara internal pada ruang komputasi *Vertex AI*, mencetak matriks evaluasi AI (Accuracy Evaluation) yang sangat selaras dengan perilaku dan budaya rekrutmen demografi domestik.

---

## Kesimpulan Arsitektural Eksekutif
Peta jalan transisi teknis dari SQLite dan infrastruktur skrip lokal (MVP) menuju dominasi *PostgreSQL, Cloud SQL*, dan *Vertex AI* tidak didorong oleh sekadar pemenuhan validasi *buzzword* teknologi masa kini. Setiap mata rantai penumpukan infrastruktur ini dihitung dan diadopsi spesifik sebagai perisai mitigasi hukum (*compliance*) perlindungan keamanan identitas kandidat dan penekanan limitasi beban komputasi di tingkat skalabilitas puluhan ribu organisasi HRD aktif harian (*DAU*).
