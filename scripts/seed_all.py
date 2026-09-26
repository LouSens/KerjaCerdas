"""Seed the JSON store with rich, Indonesia-grounded demo data.

30 employers (20 national/enterprise + 10 UMKM) x 35 job postings x 28
seekers x 31 courses/bootcamps across 12 providers. Deliberately spans both
large enterprises and small UMKM businesses, and both white-collar/IT and
informal/blue-collar job families — the platform's target market is not
IT-only, so the demo pool shouldn't be either.

Run:
    python -m scripts.seed_all
    python -m scripts.seed_all --reset-passwords
    python -m scripts.seed_all --clear     # wipe data/ first

Companies, regions (BPS kabupaten/kota), salaries, KBJI codes, and course
providers are all anchored to the actual Indonesian labor market so the
matching results look realistic when the UI loads.
"""

from __future__ import annotations

import argparse
import asyncio
import uuid

from backend.app.api.database import init_db
from backend.app.db.postgres_store import get_repositories
from backend.app.db.schemas import (
    Application,
    ApplicationStatus,
    Course,
    Education,
    EducationLevel,
    Employer,
    JobPosting,
    SeekerProfile,
    Skill,
    UserRole,
    WorkExperience,
)
from backend.app.db.session import async_session as async_session_factory
from backend.app.services.hiring.links import new_public_code
from backend.app.services.matching.matcher import SemanticMatcher, score_pair
from scripts.auth_utils import seed_auth_user as _seed_auth_user
from scripts.seed_legacy import retire_legacy_employers
from scripts.seed_outcomes import seed_outcomes

# ─────────────────────────────────────────────────────────────────────────────
#  Employers
# ─────────────────────────────────────────────────────────────────────────────

EMPLOYERS = [
    # (key, company_name, industry, size, region_code, description)
    (
        "nusapay",
        "NusaPay Digital",
        "Tech / Marketplace",
        "mid",
        "3174",
        "Startup pembayaran & marketplace untuk pedagang kecil di Jabodetabek.",
    ),
    (
        "bpr_sentosa",
        "BPR Sentosa Artha",
        "Perbankan",
        "mid",
        "3171",
        "Bank perkreditan rakyat yang melayani UMKM dan nasabah ritel di Jakarta.",
    ),
    (
        "bpr_mitra",
        "BPR Mitra Usaha Kita",
        "Perbankan",
        "mid",
        "3171",
        "Bank perkreditan rakyat dengan fokus kredit usaha kecil dan KPR sederhana.",
    ),
    (
        "nusantara_net",
        "PT Nusantara Net Media",
        "Telekomunikasi / ISP",
        "mid",
        "3273",
        "Penyedia internet fiber rumahan (ISP lokal) di Bandung Raya.",
    ),
    (
        "energi_borneo",
        "PT Energi Borneo Lestari",
        "Energi / Jasa Migas",
        "mid",
        "6471",
        "Kontraktor jasa lapangan migas skala menengah di Kalimantan Timur.",
    ),
    (
        "tumbuh_invest",
        "Tumbuh Invest",
        "Fintech / Wealth",
        "mid",
        "3174",
        "Aplikasi investasi reksadana untuk investor ritel pemula.",
    ),
    (
        "belajar_pintar",
        "Belajar Pintar Edukasi",
        "Edutech",
        "mid",
        "3174",
        "Platform belajar online untuk siswa SMP dan SMA.",
    ),
    (
        "sehat_digital",
        "Sehat Digital Nusantara",
        "Healthtech",
        "mid",
        "3174",
        "Aplikasi konsultasi kesehatan & apotek antar skala regional.",
    ),
    (
        "pangan_jaya",
        "PT Pangan Jaya Abadi",
        "FMCG / Pangan",
        "mid",
        "3578",
        "Produsen mi & makanan ringan skala menengah di Surabaya.",
    ),
    (
        "angkasa_charter",
        "Angkasa Charter Nusantara",
        "Penerbangan Charter",
        "mid",
        "3171",
        "Maskapai carter pesawat kecil untuk rute domestik.",
    ),
    (
        "jelajah_travel",
        "Jelajah Travel Indonesia",
        "Tech / Travel",
        "mid",
        "3174",
        "Agen perjalanan online untuk tiket dan paket wisata domestik.",
    ),
    (
        "kebun_segar",
        "Kebun Segar Nusantara",
        "Agritech / Grocery",
        "mid",
        "3174",
        "Toko sayur & bahan segar online langsung dari petani.",
    ),
    (
        "karya_otomotif",
        "PT Karya Otomotif Presisi",
        "Otomotif / Manufaktur Komponen",
        "mid",
        "3271",
        "Pemasok komponen otomotif untuk pabrik perakitan di Karawang & Bekasi.",
    ),
    (
        "farma_husada",
        "PT Farma Husada Nusantara",
        "Farmasi / Healthcare",
        "mid",
        "3174",
        "Produsen obat generik skala menengah di Bekasi.",
    ),
    (
        "gadai_amanah",
        "PT Gadai Amanah Sejahtera",
        "Keuangan / Pergadaian",
        "mid",
        "3471",
        "Perusahaan pergadaian swasta berizin dengan cabang di Yogyakarta.",
    ),
    (
        "rumah_bersih",
        "PT Rumah Bersih Indonesia",
        "FMCG",
        "mid",
        "3171",
        "Produsen sabun, sampo, dan produk kebersihan rumah tangga lokal.",
    ),
    (
        "inap_nyaman",
        "InapNyaman Hospitality",
        "Hospitality / Tech",
        "mid",
        "5171",
        "Jaringan hotel & guest house budget di Bali dan Lombok.",
    ),
    (
        "pasar_digital",
        "Pasar Digital Nusantara",
        "E-commerce",
        "mid",
        "3174",
        "Marketplace untuk produk UMKM lokal.",
    ),
    (
        "tani_makmur",
        "Tani Makmur Agro",
        "Agritech",
        "mid",
        "3573",
        "Pemasok sayur & buah dari petani mitra ke restoran dan ritel.",
    ),
    (
        "bionusa",
        "PT BioNusa Medika",
        "Bioteknologi",
        "mid",
        "3171",
        "Perusahaan riset vaksin & terapi biologis skala menengah.",
    ),
    # ── UMKM (usaha kecil, 1-50 karyawan) — the platform's stated target
    # segment, but until now every employer above was a national enterprise.
    # These bring in the non-IT, informal/blue-collar job families that
    # actually make up most of Indonesia's real labor market.
    (
        "warung_bahari",
        "Warung Makan Bahari Nusantara",
        "Kuliner / UMKM F&B",
        "startup",
        "3573",
        "Rumah makan keluarga khas Nusantara dengan 3 cabang di area Malang Raya.",
    ),
    (
        "bengkel_jaya",
        "Bengkel Motor Jaya Mandiri",
        "Otomotif / Bengkel",
        "startup",
        "3271",
        "Bengkel servis motor harian & tune-up di area Bogor.",
    ),
    (
        "salon_ayu",
        "Salon & Spa Ayu Kecantikan",
        "Kecantikan / Personal Care",
        "startup",
        "5171",
        "Salon kecantikan dan spa perawatan tubuh di Denpasar.",
    ),
    (
        "konveksi_makmur",
        "Konveksi Makmur Jaya",
        "Garmen / Konveksi UMKM",
        "startup",
        "3372",
        "Usaha konveksi pakaian seragam & garmen custom di Surakarta.",
    ),
    (
        "laundry_bersih",
        "Laundry Bersih Cepat",
        "Jasa Laundry / Rumah Tangga",
        "startup",
        "1275",
        "Jasa laundry kiloan & satuan dengan layanan antar-jemput di Medan.",
    ),
    (
        "catering_sedap",
        "Catering Sedap Rasa",
        "Kuliner / Katering",
        "startup",
        "7371",
        "Jasa katering harian kantor & event di Makassar.",
    ),
    (
        "konstruksi_mitra",
        "CV Mitra Bangun Sejahtera",
        "Konstruksi / Kontraktor Kecil",
        "startup",
        "6471",
        "Kontraktor renovasi & bangunan rumah/ruko skala kecil-menengah di Balikpapan.",
    ),
    (
        "klinik_sehat",
        "Klinik Sehat Keluarga",
        "Kesehatan / Klinik Umum",
        "startup",
        "3471",
        "Klinik umum & layanan kesehatan keluarga di Yogyakarta.",
    ),
    (
        "bimbel_cerdas",
        "Bimbel Cerdas Prima",
        "Pendidikan Non-Formal / Bimbel",
        "startup",
        "3175",
        "Bimbingan belajar SD-SMP untuk mata pelajaran eksakta di Jakarta Timur.",
    ),
    (
        "kelontong_makmur",
        "Toko Kelontong Makmur Jaya",
        "Retail / UMKM Dagang",
        "startup",
        "3374",
        "Toko kelontong & sembako dengan gudang stok kecil di Semarang.",
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Job postings (35: 21 enterprise + 14 UMKM)
#  Each tuple: (employer_key, title, kbji, desc, responsibilities, req_skills,
#               nice, edu_min, yrs_min, region, remote, sal_min, sal_max)
# ─────────────────────────────────────────────────────────────────────────────

JOB_POSTINGS = [
    (
        "nusapay",
        "Senior Backend Engineer (Go)",
        "2511",
        "Bangun layanan microservice high-throughput untuk fitur pembayaran pedagang.",
        [
            "Desain API REST & gRPC",
            "Optimasi latency pada Kafka pipeline",
            "Mentoring engineer junior",
        ],
        ["Go", "PostgreSQL", "Kafka", "Docker", "Kubernetes"],
        ["gRPC", "Redis"],
        "S1",
        4,
        "3174",
        True,
        25_000_000,
        42_000_000,
    ),
    (
        "bpr_sentosa",
        "Junior Data Analyst (Banking)",
        "2511",
        "Analisis data transaksi nasabah untuk dashboard manajemen risiko & marketing campaign.",
        [
            "Bikin SQL query produk tabungan",
            "Bangun dashboard Tableau",
            "Laporan eksekutif bulanan",
        ],
        ["SQL", "Excel", "Tableau", "Statistika"],
        ["Python", "Power BI"],
        "S1",
        0,
        "3171",
        False,
        8_000_000,
        13_000_000,
    ),
    (
        "nusapay",
        "Mobile Engineer - Flutter",
        "2511",
        "Develop fitur baru aplikasi penjual (seller app) di Android & iOS.",
        ["Implementasi UI Flutter", "Integrasi REST API", "A/B testing fitur"],
        ["Flutter", "Dart", "REST API", "Git"],
        ["Firebase", "iOS", "Android Studio"],
        "S1",
        2,
        "3174",
        False,
        18_000_000,
        28_000_000,
    ),
    (
        "nusantara_net",
        "Network Engineer (FTTH)",
        "2152",
        "Operasi dan troubleshoot jaringan fiber rumahan (FTTH) wilayah Bandung Raya.",
        ["Maintenance OLT/ONT", "Network monitoring", "Penanganan eskalasi pelanggan"],
        ["TCP/IP", "Cisco IOS", "Linux", "FTTH"],
        ["Mikrotik", "OSPF"],
        "D3",
        2,
        "3273",
        False,
        12_000_000,
        20_000_000,
    ),
    (
        "energi_borneo",
        "Petroleum Engineer (Production)",
        "2146",
        "Optimasi produksi sumur minyak di lapangan Kalimantan Timur.",
        ["Well testing", "Reservoir analysis", "Production reporting"],
        ["Petroleum Engineering", "PROSPER", "PETREL", "Drilling"],
        ["MATLAB", "Python"],
        "S1",
        3,
        "6471",
        False,
        15_000_000,
        28_000_000,
    ),
    (
        "tumbuh_invest",
        "Product Designer",
        "2166",
        "Desain pengalaman investasi reksadana untuk pengguna ritel pemula.",
        ["User research", "Wireframe & prototyping", "Usability testing"],
        ["Figma", "User Research", "Design System", "Prototyping"],
        ["Illustration", "Bahasa Inggris"],
        "S1",
        2,
        "3174",
        True,
        14_000_000,
        22_000_000,
    ),
    (
        "belajar_pintar",
        "Content Writer (Bahasa Indonesia)",
        "2641",
        "Tulis artikel SEO & soal latihan kurikulum SMA untuk platform Belajar Pintar.",
        ["Riset topik", "Tulisan 800-1500 kata SEO", "Editorial review"],
        ["Bahasa Indonesia", "SEO", "Content Writing", "Riset"],
        ["WordPress", "Photoshop"],
        "S1",
        1,
        "3174",
        True,
        6_000_000,
        10_000_000,
    ),
    (
        "sehat_digital",
        "Backend Engineer (Python)",
        "2511",
        "Bangun layanan API untuk apotek antar — order, inventory, fulfillment.",
        ["Develop microservice FastAPI", "DB schema PostgreSQL", "Unit + integration test"],
        ["Python", "FastAPI", "PostgreSQL", "Docker"],
        ["AWS", "Redis", "Celery"],
        "S1",
        2,
        "3174",
        True,
        16_000_000,
        28_000_000,
    ),
    (
        "bpr_mitra",
        "Risk Management Analyst",
        "2412",
        "Pemodelan credit risk untuk produk kartu kredit dan KPR.",
        ["Modeling PD/LGD/EAD", "Stress testing", "Laporan ke OJK"],
        ["Statistika", "SAS", "SQL", "Risk Management"],
        ["Python", "R"],
        "S1",
        2,
        "3171",
        False,
        10_000_000,
        18_000_000,
    ),
    (
        "pangan_jaya",
        "Supply Chain Manager (FMCG)",
        "1324",
        "Pimpin S&OP planning untuk lini produk mi instan di pabrik Surabaya.",
        ["Demand forecasting", "Vendor negotiation", "KPI inventory turnover"],
        ["Supply Chain", "S&OP", "SAP", "Negotiation"],
        ["Six Sigma", "Power BI"],
        "S1",
        5,
        "3578",
        False,
        18_000_000,
        30_000_000,
    ),
    (
        "angkasa_charter",
        "Cabin Crew (Fresh Recruit)",
        "5111",
        "Layanan penumpang pesawat carter rute domestik.",
        ["Safety briefing", "In-flight service", "Penanganan penumpang khusus"],
        ["Bahasa Inggris", "Komunikasi", "Service Mindset", "Penampilan"],
        ["Bahasa Mandarin"],
        "D3",
        0,
        "3171",
        False,
        7_000_000,
        12_000_000,
    ),
    (
        "jelajah_travel",
        "Data Scientist (Pricing)",
        "2511",
        "Bangun model pricing & ranking dinamis untuk pencarian tiket pesawat.",
        ["Feature engineering", "Eksperimen A/B", "Deploy model production"],
        ["Python", "Machine Learning", "SQL", "Spark"],
        ["TensorFlow", "Airflow"],
        "S1",
        3,
        "3174",
        True,
        22_000_000,
        38_000_000,
    ),
    (
        "kebun_segar",
        "Operations Lead (Warehouse)",
        "3331",
        "Pimpin tim operasional fulfillment dark store Kebun Segar area JABODETABEK.",
        ["Schedule shift", "KPI on-time delivery", "Continuous improvement"],
        ["Operasional", "Leadership", "Excel", "Problem Solving"],
        ["Lean / Six Sigma"],
        "D3",
        3,
        "3174",
        False,
        13_000_000,
        20_000_000,
    ),
    (
        "karya_otomotif",
        "Mechanical Engineer (Automotive)",
        "2144",
        "Engineer lini produksi komponen otomotif di pabrik Karawang.",
        ["Process improvement", "Quality control", "Drawing review (CAD)"],
        ["AutoCAD", "Mechanical", "TPM", "Bahasa Inggris"],
        ["SolidWorks", "MES"],
        "S1",
        2,
        "3271",
        False,
        11_000_000,
        18_000_000,
    ),
    (
        "farma_husada",
        "Quality Assurance Pharmacist",
        "2262",
        "QA produksi sediaan farmasi di pabrik Bekasi.",
        ["Validasi proses", "Audit CPOB", "Investigasi deviasi"],
        ["Farmasi", "CPOB", "Quality Assurance", "GMP"],
        ["LIMS", "Six Sigma"],
        "S1",
        1,
        "3174",
        False,
        9_000_000,
        15_000_000,
    ),
    (
        "gadai_amanah",
        "Customer Service Representative",
        "4222",
        "Layanan nasabah cabang Yogyakarta — gadai emas, KCA, tabungan emas.",
        ["Layanan tatap muka nasabah", "Input transaksi", "Cross-sell produk"],
        ["Komunikasi", "Customer Service", "Administrasi", "Bahasa Indonesia"],
        ["Excel"],
        "D3",
        0,
        "3471",
        False,
        5_000_000,
        8_000_000,
    ),
    (
        "rumah_bersih",
        "Marketing Specialist (FMCG)",
        "2431",
        "Eksekusi campaign brand perawatan diri di kanal modern trade.",
        ["Trade marketing plan", "Activation BTL", "Analisis sales data"],
        ["Marketing", "Trade Marketing", "Excel", "Bahasa Inggris"],
        ["Power BI", "Nielsen"],
        "S1",
        2,
        "3171",
        False,
        13_000_000,
        20_000_000,
    ),
    (
        "inap_nyaman",
        "Sales Executive (Hotel Partner)",
        "3322",
        "Akuisisi hotel & guest house budget di area Bali untuk jaringan InapNyaman.",
        ["Door-to-door sales", "Negotiation kontrak", "Onboarding mitra"],
        ["Sales", "Negotiation", "Bahasa Indonesia", "Komunikasi"],
        ["Bahasa Inggris"],
        "SMA",
        1,
        "5171",
        False,
        7_000_000,
        13_000_000,
    ),
    (
        "pasar_digital",
        "UI/UX Designer",
        "2166",
        "Desain alur checkout & promosi di aplikasi Pasar Digital.",
        ["Wireframe", "User testing", "Hand-off ke engineer"],
        ["Figma", "UI/UX", "Design System", "Prototyping"],
        ["After Effects", "User Research"],
        "S1",
        2,
        "3174",
        True,
        15_000_000,
        25_000_000,
    ),
    (
        "tani_makmur",
        "Agriculture Field Officer",
        "6111",
        "Bina petani mitra di area Malang Raya untuk supply sayur & buah Tani Makmur Agro.",
        ["Field visit petani", "Edukasi GAP", "Quality control panen"],
        ["Pertanian", "Bahasa Indonesia", "Excel", "Komunikasi"],
        ["Excel", "Logistik"],
        "D3",
        1,
        "3573",
        False,
        6_000_000,
        10_000_000,
    ),
    (
        "bionusa",
        "Biotechnology Research Associate",
        "2131",
        "Riset & development produk vaksin/biologic di lab BioNusa.",
        ["Eksperimen sel mamalia", "Validasi assay", "Reporting ke principal scientist"],
        ["Bioteknologi", "Cell Culture", "ELISA", "Lab Safety"],
        ["Flow Cytometry", "qPCR"],
        "S1",
        1,
        "3171",
        False,
        9_000_000,
        14_000_000,
    ),
    # ── UMKM job postings — informal/blue-collar/service roles that make up
    # most of the real labor market, matched to the UMKM employers above.
    (
        "warung_bahari",
        "Kasir & Pelayan Warung Makan",
        "5220",
        "Layani pelanggan, kasir, dan penataan meja di rumah makan Bahari Nusantara.",
        ["Menerima & mencatat pesanan", "Transaksi kasir", "Kebersihan area makan"],
        ["Kasir", "Customer Service", "Bahasa Indonesia"],
        ["Pengalaman F&B"],
        "SMA",
        0,
        "3573",
        False,
        3_500_000,
        5_000_000,
    ),
    (
        "warung_bahari",
        "Juru Masak Bantu (Cook Helper)",
        "9411",
        "Bantu persiapan bahan & memasak menu harian di dapur rumah makan.",
        ["Persiapan bahan masakan", "Memasak menu harian", "Menjaga kebersihan dapur"],
        ["Memasak", "Food Safety", "Kebersihan"],
        ["Pengalaman dapur restoran"],
        "SMA",
        1,
        "3573",
        False,
        3_800_000,
        5_500_000,
    ),
    (
        "bengkel_jaya",
        "Mekanik Motor Junior",
        "7231",
        "Servis rutin, tune-up, dan perbaikan ringan sepeda motor pelanggan.",
        ["Servis & tune-up motor", "Diagnosa kerusakan ringan", "Penggantian sparepart"],
        ["Mesin Motor", "Servis Ringan", "Alat Bengkel"],
        ["Sertifikat SMK Otomotif"],
        "SMA",
        0,
        "3271",
        False,
        3_500_000,
        6_000_000,
    ),
    (
        "salon_ayu",
        "Terapis Spa & Kecantikan",
        "5142",
        "Layanan perawatan kulit, pijat, dan spa untuk pelanggan salon.",
        ["Perawatan kulit & tubuh", "Layanan pijat/spa", "Konsultasi kebutuhan pelanggan"],
        ["Perawatan Kulit", "Massage", "Customer Service"],
        ["Sertifikat kecantikan/spa"],
        "SMA",
        0,
        "5171",
        False,
        4_000_000,
        7_000_000,
    ),
    (
        "konveksi_makmur",
        "Penjahit / Operator Jahit",
        "7531",
        "Menjahit seragam & garmen custom sesuai pola dan spesifikasi pelanggan.",
        ["Menjahit sesuai pola", "Quality check jahitan", "Perawatan mesin jahit"],
        ["Menjahit", "Mesin Jahit", "Pola Pakaian"],
        ["Pengalaman konveksi"],
        "SMA",
        1,
        "3372",
        False,
        3_800_000,
        6_500_000,
    ),
    (
        "laundry_bersih",
        "Staff Operasional Laundry",
        "9121",
        "Operasikan mesin cuci/pengering dan setrika untuk layanan laundry kiloan.",
        ["Operasional mesin cuci & pengering", "Setrika & lipat", "Layanan antar-jemput"],
        ["Operasional Mesin Cuci", "Setrika", "Customer Service"],
        ["SIM C untuk antar-jemput"],
        "SMA",
        0,
        "1275",
        False,
        3_200_000,
        4_800_000,
    ),
    (
        "catering_sedap",
        "Koordinator Catering Event",
        "3434",
        "Koordinasi persiapan & pengantaran katering untuk acara kantor dan event.",
        ["Perencanaan menu & porsi event", "Koordinasi tim dapur & pengantaran", "Negosiasi dengan klien"],
        ["Event Planning", "Food Safety", "Koordinasi Tim"],
        ["Negotiation"],
        "D3",
        2,
        "7371",
        False,
        5_500_000,
        9_000_000,
    ),
    (
        "catering_sedap",
        "Juru Masak Katering",
        "5120",
        "Menyiapkan menu harian dalam volume besar untuk pesanan katering kantor.",
        ["Memasak menu harian volume besar", "Perencanaan menu mingguan", "Menjaga standar food safety"],
        ["Memasak", "Food Safety", "Menu Planning"],
        ["Pengalaman dapur katering/restoran"],
        "SMA",
        2,
        "7371",
        False,
        4_500_000,
        7_500_000,
    ),
    (
        "konstruksi_mitra",
        "Tukang Bangunan / Tukang Batu",
        "7112",
        "Pekerjaan konstruksi renovasi rumah & ruko: pasangan bata, plester, finishing.",
        ["Pasangan bata & plester", "Baca gambar sederhana", "Kepatuhan K3 di lapangan"],
        ["Konstruksi", "Pasangan Bata", "K3"],
        ["Baca gambar teknik"],
        "SMA",
        2,
        "6471",
        False,
        4_500_000,
        7_500_000,
    ),
    (
        "konstruksi_mitra",
        "Mandor Proyek Kecil",
        "3123",
        "Pimpin tim tukang untuk proyek renovasi rumah/ruko skala kecil-menengah.",
        ["Manajemen tim lapangan", "Kepatuhan K3", "Baca gambar teknik & RAB sederhana"],
        ["Manajemen Proyek Kecil", "K3", "Leadership"],
        ["Baca gambar teknik"],
        "SMA",
        3,
        "6471",
        False,
        6_500_000,
        10_000_000,
    ),
    (
        "klinik_sehat",
        "Perawat Klinik Umum",
        "2221",
        "Layanan keperawatan dasar & pendampingan dokter di klinik umum keluarga.",
        ["Pemeriksaan tanda vital", "Pendampingan tindakan dokter", "Pengelolaan rekam medis"],
        ["Keperawatan", "Rekam Medis", "Customer Service"],
        ["STR aktif"],
        "D3",
        1,
        "3471",
        False,
        5_500_000,
        8_500_000,
    ),
    (
        "klinik_sehat",
        "Admin & Kasir Klinik",
        "4222",
        "Pendaftaran pasien, administrasi rekam medis, dan transaksi kasir klinik.",
        ["Pendaftaran & administrasi pasien", "Transaksi kasir", "Pengelolaan arsip rekam medis"],
        ["Administrasi", "Kasir", "Customer Service"],
        ["Excel"],
        "SMA",
        0,
        "3471",
        False,
        3_800_000,
        5_500_000,
    ),
    (
        "bimbel_cerdas",
        "Tutor Bimbel Matematika (SD-SMP)",
        "2352",
        "Mengajar matematika & IPA untuk siswa SD-SMP di bimbel kelompok kecil.",
        ["Mengajar kelompok kecil", "Menyusun soal latihan", "Laporan progres siswa ke orang tua"],
        ["Mengajar", "Matematika", "Komunikasi"],
        ["Pengalaman mengajar les privat"],
        "S1",
        0,
        "3175",
        False,
        4_000_000,
        7_000_000,
    ),
    (
        "kelontong_makmur",
        "Kasir & Staff Gudang Toko",
        "5223",
        "Transaksi kasir dan pengelolaan stok barang di toko kelontong & gudang kecil.",
        ["Transaksi kasir", "Stok & opname barang", "Penataan rak toko"],
        ["Kasir", "Stok Barang", "Customer Service"],
        ["Pengalaman retail"],
        "SMA",
        0,
        "3374",
        False,
        3_300_000,
        4_800_000,
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Job seekers (28: 20 original + 8 UMKM-matched) — deliberately diverse: fresh-grad -> mid-senior,
#  SMA -> S2, kota besar -> daerah, beragam jurusan.
# ─────────────────────────────────────────────────────────────────────────────

SEEKERS = [
    {
        "email": "andi.pratama@example.com",
        "full_name": "Andi Pratama",
        "headline": "Fresh-graduate Statistika UI — fokus data analytics perbankan",
        "region_code": "3171",
        "preferred": ["3174"],
        "skills": [
            ("Python", "intermediate", 1.5),
            ("SQL", "intermediate", 1.5),
            ("Statistika", "advanced", 3.0),
            ("Excel", "advanced", 4.0),
            ("Tableau", "beginner", 0.5),
        ],
        "edu": [("Universitas Indonesia", "S1", "Statistika", 2024)],
        "exp": [
            (
                "Bank Mandiri",
                "Intern Data Analyst",
                "2023-06",
                "2024-01",
                "Analisis NPL & dashboard",
            )
        ],
        "sal": (7_000_000, 12_000_000),
        "resume": "Fresh grad statistika UI; magang Bank Mandiri",
    },
    {
        "email": "siti.nurhaliza@example.com",
        "full_name": "Siti Nurhaliza",
        "headline": "Akuntan Junior di KAP — 2 tahun audit klien menengah",
        "region_code": "3578",
        "skills": [
            ("Akuntansi", "advanced", 2.5),
            ("Excel", "advanced", 3.0),
            ("Audit", "intermediate", 2.0),
            ("SAP", "beginner", 0.5),
        ],
        "edu": [("Politeknik Negeri Surabaya", "D3", "Akuntansi", 2022)],
        "exp": [
            (
                "KAP Tanudiredja Wibisana",
                "Junior Auditor",
                "2022-08",
                None,
                "Audit klien manufaktur",
            )
        ],
        "sal": (7_000_000, 11_000_000),
        "resume": "Audit junior di Surabaya, target FMCG accounting",
    },
    {
        "email": "budi.santoso@example.com",
        "full_name": "Budi Santoso",
        "headline": "Teknisi Otomotif — 5 tahun pengalaman bengkel Toyota",
        "region_code": "3271",
        "skills": [
            ("Mechanical", "advanced", 5.0),
            ("AutoCAD", "beginner", 1.0),
            ("TPM", "intermediate", 2.0),
            ("Quality Control", "intermediate", 3.0),
        ],
        "edu": [("SMK Negeri 1 Karawang", "SMA", "Teknik Otomotif", 2018)],
        "exp": [("Auto2000", "Mekanik Senior", "2019-01", None, "Service & quality check")],
        "sal": (6_000_000, 10_000_000),
        "resume": "SMK otomotif, 5 tahun di Auto2000",
    },
    {
        "email": "putri.maharani@example.com",
        "full_name": "Putri Maharani",
        "headline": "Apoteker fresh-graduate UGM — minat QA farmasi",
        "region_code": "3471",
        "skills": [
            ("Farmasi", "advanced", 5.0),
            ("CPOB", "intermediate", 1.0),
            ("Lab Safety", "intermediate", 1.5),
            ("Bahasa Inggris", "intermediate", 3.0),
        ],
        "edu": [("Universitas Gadjah Mada", "S1", "Farmasi", 2024)],
        "exp": [("Apotek Kimia Farma", "Intern Apoteker", "2023-06", "2023-12", "PKPA")],
        "sal": (6_500_000, 11_000_000),
        "resume": "Lulusan Farmasi UGM, lulus apoteker, mencari QA produksi",
    },
    {
        "email": "reza.pahlawan@example.com",
        "full_name": "Reza Pahlawan",
        "headline": "Senior Backend Engineer (Go/Java) — 6 tahun, ingin role remote",
        "region_code": "3273",
        "preferred": ["3174"],
        "skills": [
            ("Go", "expert", 5.0),
            ("Java", "advanced", 4.0),
            ("PostgreSQL", "advanced", 5.0),
            ("Kubernetes", "advanced", 3.0),
            ("Kafka", "intermediate", 2.0),
            ("Docker", "expert", 5.0),
            ("gRPC", "advanced", 3.0),
        ],
        "edu": [
            ("Institut Teknologi Bandung", "S2", "Informatika", 2019),
            ("Institut Teknologi Bandung", "S1", "Teknik Informatika", 2017),
        ],
        "exp": [
            ("Tokopedia", "Senior Engineer", "2020-03", None, "Microservice marketplace"),
            ("Bukalapak", "Software Engineer", "2017-07", "2020-02", "Backend payment"),
        ],
        "sal": (28_000_000, 45_000_000),
        "resume": "S2 ITB CS, 6 tahun backend, fokus Go di Tokopedia",
    },
    {
        "email": "maya.sari@example.com",
        "full_name": "Maya Sari",
        "headline": "Admin retail SMA lulusan — siap belajar entry-level",
        "region_code": "3175",
        "skills": [
            ("Excel", "beginner", 1.0),
            ("Komunikasi", "intermediate", 1.5),
            ("Customer Service", "intermediate", 1.0),
            ("Bahasa Indonesia", "advanced", 1.5),
        ],
        "edu": [("SMA Negeri 50 Jakarta", "SMA", "IPS", 2022)],
        "exp": [("Alfamart", "Admin Toko", "2023-01", None, "Stok & kasir")],
        "sal": (4_000_000, 6_500_000),
        "resume": "Lulusan SMA, 1 tahun admin Alfamart",
    },
    {
        "email": "joko.widodo.p@example.com",
        "full_name": "Joko Widodo Pratama",
        "headline": "Supply chain analyst — 3 tahun di manufaktur tekstil Solo",
        "region_code": "3372",
        "skills": [
            ("Supply Chain", "advanced", 3.0),
            ("Excel", "advanced", 4.0),
            ("SAP", "intermediate", 2.0),
            ("S&OP", "intermediate", 2.0),
            ("Power BI", "beginner", 0.5),
        ],
        "edu": [("Universitas Gadjah Mada", "S1", "Teknik Industri", 2021)],
        "exp": [("PT Sritex", "Supply Chain Analyst", "2021-08", None, "S&OP & demand planning")],
        "sal": (10_000_000, 16_000_000),
        "resume": "S1 TI UGM, 3 tahun supply chain Sritex Solo",
    },
    {
        "email": "dewi.kartika@example.com",
        "full_name": "Dewi Kartika",
        "headline": "Content writer & digital marketer — 4 tahun di media & startup",
        "region_code": "3174",
        "skills": [
            ("Content Writing", "advanced", 4.0),
            ("SEO", "advanced", 3.0),
            ("Bahasa Indonesia", "expert", 4.0),
            ("Bahasa Inggris", "advanced", 3.0),
            ("WordPress", "advanced", 3.0),
            ("Marketing", "intermediate", 2.0),
        ],
        "edu": [("Universitas Indonesia", "S1", "Ilmu Komunikasi", 2020)],
        "exp": [
            ("IDN Times", "Senior Writer", "2022-01", None, "Artikel viral & SEO"),
            ("Kompas.com", "Content Writer", "2020-08", "2021-12", "Newsroom"),
        ],
        "sal": (9_000_000, 14_000_000),
        "resume": "S1 Komunikasi UI, 4 tahun content writer",
    },
    {
        "email": "hendra.setiawan@example.com",
        "full_name": "Hendra Setiawan",
        "headline": "Hotel ops 2 tahun di Bali — sales target perhotelan budget",
        "region_code": "5171",
        "skills": [
            ("Hospitality", "advanced", 2.0),
            ("Sales", "intermediate", 2.0),
            ("Bahasa Inggris", "advanced", 3.0),
            ("Customer Service", "advanced", 2.0),
        ],
        "edu": [("STP Nusa Dua Bali", "D4", "Manajemen Perhotelan", 2022)],
        "exp": [("RedDoorz Plus Bali", "Front Office Supervisor", "2022-06", None, "Operasional FO")],
        "sal": (6_000_000, 11_000_000),
        "resume": "D4 Perhotelan Nusa Dua, 2 tahun front office RedDoorz",
    },
    {
        "email": "linda.halim@example.com",
        "full_name": "Linda Halim",
        "headline": "Banker 7 tahun BCA — ingin pivot ke product/risk fintech",
        "region_code": "3171",
        "skills": [
            ("Risk Management", "advanced", 5.0),
            ("Banking", "expert", 7.0),
            ("SQL", "intermediate", 2.0),
            ("Excel", "expert", 7.0),
            ("Statistika", "intermediate", 2.0),
        ],
        "edu": [("Universitas Trisakti", "S1", "Manajemen", 2017)],
        "exp": [
            ("Bank BCA", "Relationship Manager", "2019-04", None, "Korporat & UKM"),
            ("Bank BCA", "MT Program", "2017-09", "2019-03", "Management trainee"),
        ],
        "sal": (18_000_000, 28_000_000),
        "resume": "S1 Manajemen Trisakti, 7 tahun BCA",
    },
    {
        "email": "agus.salim@example.com",
        "full_name": "Agus Salim",
        "headline": "Cook 3 tahun di restoran Bandung — ingin role F&B ops",
        "region_code": "3273",
        "skills": [
            ("Hospitality", "advanced", 3.0),
            ("Food Safety", "intermediate", 2.0),
            ("Operasional", "intermediate", 2.0),
            ("Bahasa Indonesia", "advanced", 3.0),
        ],
        "edu": [("SMK Pariwisata Bandung", "SMA", "Tata Boga", 2020)],
        "exp": [("Karnivor Bandung", "Cook 1", "2021-02", None, "Line cook western")],
        "sal": (5_000_000, 8_000_000),
        "resume": "SMK Boga + 3 tahun line cook",
    },
    {
        "email": "rina.wijaya@example.com",
        "full_name": "Rina Wijaya",
        "headline": "UI Designer freelance — 3 tahun di startup & agency",
        "region_code": "3273",
        "preferred": ["3174"],
        "skills": [
            ("Figma", "expert", 3.0),
            ("UI/UX", "advanced", 3.0),
            ("Design System", "intermediate", 2.0),
            ("Prototyping", "advanced", 3.0),
            ("Illustration", "advanced", 4.0),
        ],
        "edu": [("Institut Teknologi Bandung", "S1", "Desain Komunikasi Visual", 2021)],
        "exp": [("Freelance", "UI Designer", "2021-07", None, "Klien startup edukasi & B2B")],
        "sal": (11_000_000, 18_000_000),
        "resume": "S1 DKV ITB, freelance UI designer",
    },
    {
        "email": "bayu.aditya@example.com",
        "full_name": "Bayu Aditya",
        "headline": "Project engineer konstruksi 4 tahun — sertifikasi K3",
        "region_code": "3578",
        "skills": [
            ("AutoCAD", "advanced", 4.0),
            ("Project Management", "intermediate", 3.0),
            ("K3", "advanced", 4.0),
            ("MS Project", "intermediate", 2.0),
            ("Bahasa Inggris", "intermediate", 2.0),
        ],
        "edu": [("Institut Teknologi Sepuluh Nopember", "S1", "Teknik Sipil", 2020)],
        "exp": [("Waskita Karya", "Project Engineer", "2020-09", None, "Tol Trans-Sumatra")],
        "sal": (11_000_000, 17_000_000),
        "resume": "S1 Sipil ITS + 4 tahun Waskita",
    },
    {
        "email": "nadia.putri@example.com",
        "full_name": "Nadia Putri",
        "headline": "HR generalist 2 tahun — minat People Analytics",
        "region_code": "3174",
        "skills": [
            ("Human Resources", "advanced", 2.0),
            ("Recruitment", "advanced", 2.0),
            ("Excel", "advanced", 4.0),
            ("Statistika", "intermediate", 2.0),
            ("Bahasa Inggris", "advanced", 4.0),
        ],
        "edu": [
            ("Universitas Indonesia", "S2", "Psikologi Industri", 2023),
            ("Universitas Padjadjaran", "S1", "Psikologi", 2021),
        ],
        "exp": [("Halodoc", "HR Generalist", "2023-08", None, "Recruitment & employee experience")],
        "sal": (11_000_000, 18_000_000),
        "resume": "S2 Psikologi UI, 2 tahun HR Halodoc",
    },
    {
        "email": "faisal.rahman@example.com",
        "full_name": "Faisal Rahman",
        "headline": "Maintenance technician 5 tahun di pabrik tekstil",
        "region_code": "3273",
        "skills": [
            ("Mechanical", "advanced", 5.0),
            ("PLC", "intermediate", 3.0),
            ("Quality Control", "intermediate", 3.0),
            ("TPM", "advanced", 4.0),
        ],
        "edu": [("Politeknik Negeri Bandung", "D3", "Teknik Mesin", 2019)],
        "exp": [
            ("PT Trisula Textile", "Maintenance Tech", "2019-07", None, "Mesin tenun & finishing")
        ],
        "sal": (6_500_000, 11_000_000),
        "resume": "D3 Polban Mesin + 5 tahun maintenance",
    },
    {
        "email": "citra.lestari@example.com",
        "full_name": "Citra Lestari",
        "headline": "Legal trainee 1 tahun — pasca ujian advokat",
        "region_code": "3573",
        "skills": [
            ("Hukum", "intermediate", 2.0),
            ("Bahasa Inggris", "advanced", 4.0),
            ("Riset", "advanced", 3.0),
            ("Drafting", "intermediate", 1.5),
        ],
        "edu": [("Universitas Brawijaya", "S1", "Ilmu Hukum", 2023)],
        "exp": [
            (
                "Kantor Hukum Lubis Santosa",
                "Junior Associate",
                "2023-09",
                None,
                "Litigasi & corporate",
            )
        ],
        "sal": (8_000_000, 13_000_000),
        "resume": "S1 Hukum UB, 1 tahun KAP litigasi",
    },
    {
        "email": "iwan.setyo@example.com",
        "full_name": "Iwan Setyo",
        "headline": "Sales pengalaman 8 tahun (retail & property) — target B2B sales",
        "region_code": "3471",
        "skills": [
            ("Sales", "expert", 8.0),
            ("Negotiation", "advanced", 6.0),
            ("Komunikasi", "expert", 8.0),
            ("Customer Service", "advanced", 5.0),
        ],
        "edu": [("SMA Negeri 9 Yogyakarta", "SMA", "IPS", 2014)],
        "exp": [
            ("Sinarmas Land", "Sales Executive", "2019-03", None, "Penjualan rumah cluster"),
            ("Erafone", "Sales Promotor", "2014-11", "2019-02", "Sales gadget"),
        ],
        "sal": (7_000_000, 13_000_000),
        "resume": "SMA + 8 tahun sales retail & property",
    },
    {
        "email": "yuni.astuti@example.com",
        "full_name": "Yuni Astuti",
        "headline": "Perawat 6 tahun RS Surabaya — eksplorasi healthtech ops",
        "region_code": "3578",
        "skills": [
            ("Keperawatan", "expert", 6.0),
            ("Customer Service", "advanced", 6.0),
            ("Health Operations", "intermediate", 2.0),
            ("Bahasa Indonesia", "expert", 6.0),
        ],
        "edu": [("Akademi Keperawatan Karya Husada", "D3", "Keperawatan", 2018)],
        "exp": [("RS Premier Surabaya", "Perawat IGD", "2018-08", None, "IGD & rawat inap")],
        "sal": (7_500_000, 13_000_000),
        "resume": "D3 Keperawatan + 6 tahun perawat RS",
    },
    {
        "email": "aldi.pramudya@example.com",
        "full_name": "Aldi Pramudya",
        "headline": "QA Tester 1 tahun — target Software Engineer",
        "region_code": "3173",
        "skills": [
            ("QA Testing", "intermediate", 1.5),
            ("SQL", "intermediate", 1.5),
            ("Python", "beginner", 1.0),
            ("Selenium", "beginner", 1.0),
            ("Git", "intermediate", 1.5),
        ],
        "edu": [("Universitas Bina Nusantara", "S1", "Sistem Informasi", 2023)],
        "exp": [("Halodoc", "QA Engineer", "2023-09", None, "Manual & automation testing")],
        "sal": (7_500_000, 12_000_000),
        "resume": "S1 SI Binus + 1 tahun QA Halodoc",
    },
    {
        "email": "sri.wahyuni@example.com",
        "full_name": "Sri Wahyuni",
        "headline": "Field officer pertanian 5 tahun — agritech & food security",
        "region_code": "3271",
        "skills": [
            ("Pertanian", "advanced", 5.0),
            ("Komunikasi", "advanced", 5.0),
            ("Excel", "intermediate", 3.0),
            ("Logistik", "intermediate", 3.0),
            ("Bahasa Indonesia", "expert", 5.0),
        ],
        "edu": [("Institut Pertanian Bogor", "S1", "Agribisnis", 2019)],
        "exp": [
            (
                "PT East West Seed Indonesia",
                "Field Trial Officer",
                "2019-08",
                None,
                "Field trial benih hortikultura",
            )
        ],
        "sal": (7_000_000, 12_000_000),
        "resume": "S1 Agribisnis IPB + 5 tahun field officer",
    },
    # ── UMKM/informal-sector seekers — matched to the UMKM job postings
    # above, so the reverse-matching demo isn't limited to white-collar/IT
    # profiles even though most Indonesian job seekers aren't in that bucket.
    {
        "email": "rudi.hartono@example.com",
        "full_name": "Rudi Hartono",
        "headline": "Kasir & pelayan warung makan — 2 tahun pengalaman F&B",
        "region_code": "3573",
        "skills": [
            ("Kasir", "advanced", 2.0),
            ("Customer Service", "advanced", 2.0),
            ("Bahasa Indonesia", "advanced", 2.0),
        ],
        "edu": [("SMA Negeri 3 Malang", "SMA", "IPS", 2021)],
        "exp": [("RM Sederhana Malang", "Kasir & Pelayan", "2022-02", None, "Kasir & layanan pelanggan")],
        "sal": (3_500_000, 5_000_000),
        "resume": "SMA, 2 tahun kasir & pelayan rumah makan Malang",
    },
    {
        "email": "wahyu.nugroho@example.com",
        "full_name": "Wahyu Nugroho",
        "headline": "Mekanik motor 3 tahun — servis rutin & tune-up",
        "region_code": "3271",
        "skills": [
            ("Mesin Motor", "advanced", 3.0),
            ("Servis Ringan", "advanced", 3.0),
            ("Alat Bengkel", "intermediate", 3.0),
        ],
        "edu": [("SMK Negeri 2 Bogor", "SMA", "Teknik Sepeda Motor", 2020)],
        "exp": [("Bengkel Motor Sumber Rejeki", "Mekanik", "2021-03", None, "Servis & tune-up harian")],
        "sal": (3_500_000, 6_000_000),
        "resume": "SMK Otomotif, 3 tahun mekanik bengkel motor Bogor",
    },
    {
        "email": "ratna.dewi@example.com",
        "full_name": "Ratna Dewi",
        "headline": "Terapis spa & kecantikan 2 tahun — Denpasar",
        "region_code": "5171",
        "skills": [
            ("Perawatan Kulit", "advanced", 2.0),
            ("Massage", "advanced", 2.0),
            ("Customer Service", "intermediate", 2.0),
        ],
        "edu": [("LKP Bali Beauty Academy", "D1", "Kecantikan & Spa", 2022)],
        "exp": [("Spa Bali Serenity", "Terapis Spa", "2022-06", None, "Perawatan tubuh & spa")],
        "sal": (4_000_000, 7_000_000),
        "resume": "D1 Kecantikan, 2 tahun terapis spa Denpasar",
    },
    {
        "email": "slamet.riyadi@example.com",
        "full_name": "Slamet Riyadi",
        "headline": "Penjahit konveksi 4 tahun — seragam & garmen custom",
        "region_code": "3372",
        "skills": [
            ("Menjahit", "expert", 4.0),
            ("Mesin Jahit", "advanced", 4.0),
            ("Pola Pakaian", "intermediate", 3.0),
        ],
        "edu": [("SMK Negeri 1 Surakarta", "SMA", "Tata Busana", 2019)],
        "exp": [("Konveksi Sido Mukti", "Penjahit", "2020-01", None, "Jahit seragam & garmen custom")],
        "sal": (3_800_000, 6_500_000),
        "resume": "SMK Tata Busana, 4 tahun penjahit konveksi Solo",
    },
    {
        "email": "yeni.marlina@example.com",
        "full_name": "Yeni Marlina",
        "headline": "Staff operasional laundry 1 tahun — Medan",
        "region_code": "1275",
        "skills": [
            ("Operasional Mesin Cuci", "intermediate", 1.0),
            ("Setrika", "advanced", 1.0),
            ("Customer Service", "intermediate", 1.0),
        ],
        "edu": [("SMA Negeri 7 Medan", "SMA", "IPS", 2022)],
        "exp": [("Laundry Kilat Medan", "Staff Operasional", "2023-01", None, "Cuci, setrika, & antar-jemput")],
        "sal": (3_200_000, 4_800_000),
        "resume": "SMA, 1 tahun staff operasional laundry Medan",
    },
    {
        "email": "dedi.kurniawan@example.com",
        "full_name": "Dedi Kurniawan",
        "headline": "Tukang bangunan 5 tahun — renovasi rumah & ruko",
        "region_code": "6471",
        "skills": [
            ("Konstruksi", "advanced", 5.0),
            ("Pasangan Bata", "advanced", 5.0),
            ("K3", "intermediate", 3.0),
        ],
        "edu": [("SMA Negeri 4 Balikpapan", "SMA", "IPS", 2016)],
        "exp": [("CV Bangun Sentosa", "Tukang Bangunan", "2019-05", None, "Renovasi rumah & ruko")],
        "sal": (4_500_000, 7_500_000),
        "resume": "SMA, 5 tahun tukang bangunan renovasi Balikpapan",
    },
    {
        "email": "fitriani@example.com",
        "full_name": "Fitriani",
        "headline": "Tutor bimbel matematika 2 tahun — SD-SMP",
        "region_code": "3175",
        "skills": [
            ("Mengajar", "advanced", 2.0),
            ("Matematika", "advanced", 4.0),
            ("Komunikasi", "advanced", 2.0),
        ],
        "edu": [("Universitas Negeri Jakarta", "S1", "Pendidikan Matematika", 2023)],
        "exp": [("Bimbel Kumon Cijantung", "Tutor Matematika", "2023-08", None, "Mengajar kelompok kecil SD-SMP")],
        "sal": (4_000_000, 7_000_000),
        "resume": "S1 Pendidikan Matematika UNJ, 2 tahun tutor bimbel",
    },
    {
        "email": "bambang.suryanto@example.com",
        "full_name": "Bambang Suryanto",
        "headline": "Admin & kasir toko kelontong 1 tahun — Semarang",
        "region_code": "3374",
        "skills": [
            ("Kasir", "intermediate", 1.0),
            ("Stok Barang", "intermediate", 1.0),
            ("Customer Service", "intermediate", 1.0),
        ],
        "edu": [("SMA Negeri 5 Semarang", "SMA", "IPS", 2022)],
        "exp": [("Toko Sembako Barokah", "Admin & Kasir", "2023-02", None, "Kasir & stok gudang toko")],
        "sal": (3_300_000, 4_800_000),
        "resume": "SMA, 1 tahun admin & kasir toko kelontong Semarang",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
#  Courses & Bootcamps (15) — real Indonesian providers
# ─────────────────────────────────────────────────────────────────────────────

COURSES = [
    {
        "name": "Dicoding — Menjadi Go Developer",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Go", "gRPC", "API", "Microservices"],
        "duration": "2 bulan",
        "cost_idr": 500_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Kelas pemrograman Go terakreditasi industri untuk merancang REST API & backend andal.",
    },
    {
        "name": "Dicoding — Belajar Membuat Aplikasi Web dengan React",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["React", "JavaScript", "HTML", "CSS", "Next.js"],
        "duration": "1 bulan",
        "cost_idr": 350_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Langkah awal menguasai SPA & server side rendering React menggunakan standar industri.",
    },
    {
        "name": "Dicoding — Menjadi Cloud dan DevOps Engineer",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Docker", "Kubernetes", "AWS", "Terraform", "DevOps"],
        "duration": "2 bulan",
        "cost_idr": 600_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Kuasai infrastruktur modern, container orchestration, CI/CD, dan cloud AWS.",
    },
    {
        "name": "Dicoding — Belajar Dasar Structured Query Language (SQL)",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["SQL", "PostgreSQL", "Database"],
        "duration": "3 minggu",
        "cost_idr": 250_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Pondasi utama pemodelan basis data relasional & optimasi query untuk engineer.",
    },
    {
        "name": "Dicoding — Belajar Machine Learning untuk Pemula",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Python", "Machine Learning", "Statistika", "TensorFlow"],
        "duration": "1 bulan",
        "cost_idr": 0,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Kelas pengantar ML Bahasa Indonesia, terbukti gratis via Prakerja.",
    },
    {
        "name": "Dicoding — Belajar Membuat Aplikasi Android untuk Pemula",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Android", "Kotlin", "Git"],
        "duration": "1 bulan",
        "cost_idr": 400_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Kelas Android Bahasa Indonesia resmi, kurikulum Google certified.",
    },
    {
        "name": "Dicoding — Belajar Dasar-Dasar UI/UX Design",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Figma", "Design", "Design System", "User Research"],
        "duration": "1 bulan",
        "cost_idr": 300_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Dasar rancang bangun antarmuka digital interaktif dan pengujian usability.",
    },
    {
        "name": "Dicoding — Belajar Pemrograman Python",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Python", "Git", "Programming"],
        "duration": "1 bulan",
        "cost_idr": 250_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Pelajari bahasa paling populer untuk data science, otomasi, dan web backend.",
    },
    {
        "name": "Dicoding — Belajar Menggunakan Redis & Event Streaming",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Redis", "Kafka", "Caching"],
        "duration": "3 minggu",
        "cost_idr": 350_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Optimasi skalabilitas aplikasi menggunakan Redis caching & Kafka event messaging.",
    },
    {
        "name": "Dicoding — Belajar Fundamental Front-End Web Development",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["JavaScript", "Tailwind CSS", "HTML", "CSS"],
        "duration": "1 bulan",
        "cost_idr": 350_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Kuasai JavaScript DOM, Tailwind CSS utility, dan responsive design.",
    },
    {
        "name": "Dicoding — Belajar Fundamental Aplikasi Back-End dengan Node.js",
        "provider": "Dicoding",
        "category": "tech",
        "skills_taught": ["Node.js", "TypeScript", "Express", "API"],
        "duration": "1 bulan",
        "cost_idr": 350_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Bangun REST API dan layanan back-end menggunakan Node.js dan TypeScript.",
    },
    {
        "name": "Hacktiv8 — Full-Stack JavaScript Immersive",
        "provider": "Hacktiv8",
        "category": "tech",
        "skills_taught": ["Node.js", "React", "MongoDB", "Express", "JavaScript"],
        "duration": "3 bulan",
        "cost_idr": 8_000_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Bootcamp intensif full-stack JavaScript dengan proyek portofolio dan job connector.",
    },
    {
        "name": "Hacktiv8 — Data Science Fundamentals",
        "provider": "Hacktiv8",
        "category": "tech",
        "skills_taught": ["Python", "Machine Learning", "Statistics", "SQL", "Data Analysis"],
        "duration": "4 bulan",
        "cost_idr": 9_500_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Kurikulum data science end-to-end dari statistik hingga deployment model ML.",
    },
    {
        "name": "Purwadhika — Data Engineering Bootcamp",
        "provider": "Purwadhika",
        "category": "tech",
        "skills_taught": ["Spark", "Airflow", "Kafka", "SQL", "Data Engineering"],
        "duration": "6 bulan",
        "cost_idr": 12_000_000,
        "is_prakerja": False,
        "level": "advanced",
        "description": "Rancang pipeline data skala besar dengan Spark, Airflow, dan streaming Kafka.",
    },
    {
        "name": "Purwadhika — Cloud Computing dengan GCP",
        "provider": "Purwadhika",
        "category": "tech",
        "skills_taught": ["GCP", "Cloud Computing", "Kubernetes", "DevOps"],
        "duration": "2 bulan",
        "cost_idr": 3_500_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Deploy dan kelola infrastruktur cloud-native di Google Cloud Platform.",
    },
    {
        "name": "Skill Academy — Digital Marketing Bersertifikat",
        "provider": "Skill Academy",
        "category": "marketing",
        "skills_taught": ["Digital Marketing", "SEO", "Social Media Marketing", "Content Marketing"],
        "duration": "1 bulan",
        "cost_idr": 300_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Strategi pemasaran digital end-to-end: SEO, iklan media sosial, dan copywriting.",
    },
    {
        "name": "Skill Academy — Visualisasi Data dengan Tableau",
        "provider": "Skill Academy",
        "category": "tech",
        "skills_taught": ["Tableau", "Data Analysis", "Data Visualization"],
        "duration": "3 minggu",
        "cost_idr": 450_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Membuat dashboard interaktif dan storytelling data dengan Tableau.",
    },
    {
        "name": "MySkill — Power BI untuk Bisnis",
        "provider": "MySkill",
        "category": "tech",
        "skills_taught": ["Power BI", "Excel", "Data Analysis"],
        "duration": "1 bulan",
        "cost_idr": 350_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Olah data bisnis dan buat laporan interaktif dengan Power BI dan Excel lanjutan.",
    },
    {
        "name": "Binar Academy — UI/UX Design Professional",
        "provider": "Binar Academy",
        "category": "design",
        "skills_taught": ["Figma", "UI Design", "UX Research", "Design System", "User Research"],
        "duration": "3 bulan",
        "cost_idr": 6_000_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Kurikulum UI/UX dari riset pengguna hingga design system siap produksi.",
    },
    {
        "name": "Binar Academy — Mobile App Development dengan Flutter",
        "provider": "Binar Academy",
        "category": "tech",
        "skills_taught": ["Flutter", "Dart", "Mobile Development"],
        "duration": "3 bulan",
        "cost_idr": 6_500_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Bangun aplikasi Android & iOS lintas platform menggunakan Flutter dan Dart.",
    },
    {
        "name": "Apple Developer Academy Indonesia — iOS App Development",
        "provider": "Apple Developer Academy ID",
        "category": "tech",
        "skills_taught": ["iOS", "Swift", "Mobile Development"],
        "duration": "9 bulan",
        "cost_idr": 0,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Program pengembangan aplikasi iOS gratis bermitra dengan Apple untuk talenta muda Indonesia.",
    },
    {
        "name": "RevoU — Full Stack Cyber Security",
        "provider": "RevoU",
        "category": "tech",
        "skills_taught": ["Cybersecurity", "Network Security", "Linux"],
        "duration": "4 bulan",
        "cost_idr": 10_000_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Fundamental keamanan siber: hardening jaringan, Linux, dan respons insiden.",
    },
    {
        "name": "RevoU — Product Management Fundamentals",
        "provider": "RevoU",
        "category": "ops",
        "skills_taught": ["Project Management", "Agile", "Scrum", "Product Management"],
        "duration": "2 bulan",
        "cost_idr": 5_000_000,
        "is_prakerja": False,
        "level": "beginner",
        "description": "Metodologi Agile/Scrum dan siklus hidup produk digital untuk calon product manager.",
    },
    {
        "name": "Arkademi — Akuntansi Praktis untuk UMKM",
        "provider": "Arkademi",
        "category": "finance",
        "skills_taught": ["Akuntansi", "Finance", "Excel"],
        "duration": "2 bulan",
        "cost_idr": 250_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Pembukuan, laporan keuangan, dan pengelolaan arus kas praktis untuk usaha kecil.",
    },
    {
        "name": "Arkademi — Manajemen Rantai Pasok (Supply Chain)",
        "provider": "Arkademi",
        "category": "ops",
        "skills_taught": ["Supply Chain", "Logistics", "SAP"],
        "duration": "2 bulan",
        "cost_idr": 300_000,
        "is_prakerja": True,
        "level": "intermediate",
        "description": "Perencanaan inventori, distribusi, dan pengadaan untuk operasional rantai pasok.",
    },
    {
        "name": "Cakap — English for Career Professionals",
        "provider": "Cakap",
        "category": "language",
        "skills_taught": ["Bahasa Inggris", "Communication"],
        "duration": "3 bulan",
        "cost_idr": 600_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Bahasa Inggris profesional untuk wawancara kerja, email bisnis, dan presentasi.",
    },
    {
        "name": "Cakap — Komunikasi Profesional di Tempat Kerja",
        "provider": "Cakap",
        "category": "language",
        "skills_taught": ["Komunikasi", "Bahasa Indonesia", "Communication"],
        "duration": "3 minggu",
        "cost_idr": 200_000,
        "is_prakerja": True,
        "level": "beginner",
        "description": "Etika komunikasi lisan dan tulisan, presentasi, dan kolaborasi tim lintas fungsi.",
    },
    {
        "name": "Udemy — gRPC: Build Modern APIs with Go",
        "provider": "Udemy",
        "category": "tech",
        "skills_taught": ["gRPC", "Go", "API", "Microservices"],
        "duration": "2 minggu",
        "cost_idr": 250_000,
        "is_prakerja": False,
        "level": "advanced",
        "description": "Merancang API performa tinggi antar layanan menggunakan gRPC dan Protocol Buffers.",
    },
    {
        "name": "Udemy — FastAPI: Building Modern APIs with Python",
        "provider": "Udemy",
        "category": "tech",
        "skills_taught": ["FastAPI", "Python", "API"],
        "duration": "3 minggu",
        "cost_idr": 250_000,
        "is_prakerja": False,
        "level": "intermediate",
        "description": "Membangun REST API async dengan FastAPI, Pydantic, dan dokumentasi otomatis.",
    },
    {
        "name": "Coursera Indonesia — AWS Cloud Practitioner Essentials",
        "provider": "Coursera ID",
        "category": "tech",
        "skills_taught": ["AWS", "Cloud Computing", "Terraform"],
        "duration": "2 bulan",
        "cost_idr": 750_000,
        "is_prakerja": False,
        "level": "beginner",
        "description": "Dasar layanan cloud AWS, keamanan, dan estimasi biaya infrastruktur.",
    },
    {
        "name": "Coursera Indonesia — Machine Learning Specialization",
        "provider": "Coursera ID",
        "category": "tech",
        "skills_taught": ["Machine Learning", "Python", "PyTorch", "TensorFlow", "Statistics"],
        "duration": "3 bulan",
        "cost_idr": 900_000,
        "is_prakerja": False,
        "level": "advanced",
        "description": "Spesialisasi machine learning dari regresi hingga deep learning terapan.",
    },
]


# ─────────────────────────────────────────────────────────────────────────────
#  Seed
# ─────────────────────────────────────────────────────────────────────────────


async def seed(clear: bool, reset_passwords: bool = False) -> None:
    await init_db()

    if clear:
        async with async_session_factory():
            # We don't drop tables, just rely on alembic or a fresh db.
            pass

    repos = get_repositories()
    matcher = SemanticMatcher()

    # Rows from earlier seeds (real brands, underscore logins) — see seed_legacy.py.
    await retire_legacy_employers(repos)

    # ── Employers ──────────────────────────────────────────────────────────
    existing_employers = {emp.user_id: emp for emp in await repos.employers.list()}
    emp_by_key: dict[str, Employer] = {}
    for key, name, ind, size, region, desc in EMPLOYERS:
        u = await _seed_auth_user(
            # Underscores are invalid in an email domain (hr@warung_bahari.id failed
            # EmailStr validation), so the login domain drops them.
            email=f"hr@{key.replace('_', '')}.id",
            name=name,
            role=UserRole.EMPLOYER.value,
            reset_password=reset_passwords,
        )
        existing_emp = existing_employers.get(u.id)
        emp = await repos.employers.upsert(
            Employer(
                id=existing_emp.id if existing_emp else u.id,
                user_id=u.id,
                company_name=name,
                industry=ind,
                size=size,
                region_code=region,
                description=desc,
            )
        )
        emp_by_key[key] = emp
        existing_employers[u.id] = emp
    print(f"[employers] {len(emp_by_key)} created")

    # ── Admin account ──────────────────────────────────────────────────────
    # Creates admin@kerjacerdas.tech so ADMIN_EMAILS has a matching account.
    # The admin is a regular seeker account — admin powers come from being
    # listed in ADMIN_EMAILS + ADMIN_ROUTES_ENABLED=true, not from the role.
    await _seed_auth_user(
        email="admin@kerjacerdas.tech",
        name="Admin KerjaCerdas",
        role=UserRole.SEEKER.value,
        reset_password=reset_passwords,
    )
    print("[admin] admin@kerjacerdas.tech created (use SEED_DEFAULT_PASSWORD to login)")


    # ── Jobs ───────────────────────────────────────────────────────────────
    existing_jobs = {
        (job.employer_id, job.title): job for job in await repos.jobs.list()
    }
    job_count = 0
    for jp in JOB_POSTINGS:
        (key, title, kbji, desc, resps, req, nice, edu, yrs, region, remote, smin, smax) = jp
        emp = emp_by_key[key]
        try:
            edu_lv = EducationLevel(edu)
        except ValueError:
            edu_lv = EducationLevel.S1
        existing_job = existing_jobs.get((emp.id, title))
        job = JobPosting(
            id=existing_job.id if existing_job else str(uuid.uuid4()),
            employer_id=emp.id,
            title=title,
            kbji_code=kbji,
            description=desc,
            responsibilities=resps,
            required_skills=req,
            nice_to_have_skills=nice,
            education_min=edu_lv,
            experience_years_min=yrs,
            region_code=region,
            remote_allowed=remote,
            salary_min=smin,
            salary_max=smax,
            public_code=(existing_job.public_code if existing_job else None) or new_public_code(),
        )
        await matcher.embed_job(job)
        await repos.jobs.upsert(job)
        existing_jobs[(emp.id, title)] = job
        job_count += 1
    print(f"[jobs] {job_count} created")

    # ── Seekers ────────────────────────────────────────────────────────────
    existing_seekers = {seeker.user_id: seeker for seeker in await repos.seekers.list()}
    seeker_count = 0
    for s in SEEKERS:
        u = await _seed_auth_user(
            email=s["email"],
            name=s["full_name"],
            role=UserRole.SEEKER.value,
            reset_password=reset_passwords,
        )
        existing_seeker = existing_seekers.get(u.id)

        edu_objs = [
            Education(
                institution=inst,
                degree=EducationLevel(deg)
                if deg in EducationLevel.__members__
                else EducationLevel.S1,
                major=maj,
                graduation_year=year,
            )
            for (inst, deg, maj, year) in s["edu"]
        ]
        exp_objs = [
            WorkExperience(
                company=c,
                title=t,
                start_date=sd,
                end_date=ed,
                description=desc,
            )
            for (c, t, sd, ed, desc) in s["exp"]
        ]
        skill_objs = [Skill(name=n, level=lv, years=yr) for (n, lv, yr) in s["skills"]]

        seeker = SeekerProfile(
            id=existing_seeker.id if existing_seeker else u.id,
            user_id=u.id,
            full_name=s["full_name"],
            headline=s["headline"],
            region_code=s["region_code"],
            preferred_regions=s.get("preferred", []),
            skills=skill_objs,
            experience=exp_objs,
            education=edu_objs,
            resume_text=s["resume"],
            salary_expectation_min=s["sal"][0],
            salary_expectation_max=s["sal"][1],
        )
        await matcher.embed_seeker(seeker)
        await repos.seekers.upsert(seeker)
        existing_seekers[u.id] = seeker
        seeker_count += 1
    print(f"[seekers] {seeker_count} created")

    # ── Courses ────────────────────────────────────────────────────────────
    for c in COURSES:
        await repos.courses.upsert(Course(**c))
    print(f"[courses] {len(COURSES)} created")

    # ── Applications ───────────────────────────────────────────────────────
    all_jobs = await repos.jobs.list()
    all_seekers = await repos.seekers.list()
    existing_applications = {
        (application.job_id, application.seeker_id): application
        for application in await repos.applications.list()
    }
    app_count = 0
    if all_jobs and all_seekers:
        # Seed realistic application lifecycle for first few seekers
        seed_tuples = [
            (
                0,
                0,
                ApplicationStatus.INTERVIEW,
                "Jadwal wawancara teknis pada Kamis pukul 14:00 WIB via Google Meet. Link telah dikirim ke email.",
            ),
            (
                0,
                1,
                ApplicationStatus.REVIEWED,
                "Berkas dan portofolio teknis sedang dalam peninjauan Hiring Manager.",
            ),
            (
                0,
                2,
                ApplicationStatus.APPLIED,
                "Lamaran berhasil terkirim dan tersimpan di database instansi rekruter.",
            ),
            (
                1,
                0,
                ApplicationStatus.HIRED,
                "Selamat! Anda dinyatakan lolos dan menerima penawaran kerja (Offering Letter).",
            ),
            (
                1,
                3,
                ApplicationStatus.INTERVIEW,
                "Undangan sesi Culture Fit interview dengan Engineering Lead.",
            ),
            (
                2,
                4,
                ApplicationStatus.REVIEWED,
                "Profil kompetensi sedang diverifikasi oleh Tim Rekrutmen.",
            ),
        ]
        for s_idx, j_idx, status_val, note_val in seed_tuples:
            if s_idx < len(all_seekers) and j_idx < len(all_jobs):
                s_obj = all_seekers[s_idx]
                j_obj = all_jobs[j_idx]
                if (j_obj.id, s_obj.id) in existing_applications:
                    continue  # never rewind a status HR has changed since
                app_obj = Application(
                    id=str(uuid.uuid4()),
                    job_id=j_obj.id,
                    seeker_id=s_obj.id,
                    status=status_val,
                    note=note_val,
                    cover_letter="Saya sangat tertarik dengan posisi ini dan yakin pengalaman saya relevan.",
                    match_score=score_pair(s_obj, j_obj)["score"],
                )
                await repos.applications.upsert(app_obj)
                existing_applications[(j_obj.id, s_obj.id)] = app_obj
                app_count += 1
    print(f"[applications] {app_count} created")

    # Outcomes for the target -> learn -> apply -> feedback loop (see seed_outcomes.py).
    await seed_outcomes(repos, emp_by_key)

    print("\n[OK] Seed selesai.")
    print(f"  Employers : {len(emp_by_key)}")
    print(f"  Jobs      : {job_count}")
    print(f"  Seekers   : {seeker_count}")
    print(f"  Courses   : {len(COURSES)}")
    print("\nLogin demo (UI menerima password apa saja):")
    print("  hr@kelontongmakmur.id    -> employer dashboard (Toko Kelontong Makmur Jaya)")
    print("  hr@kliniksehat.id        -> employer dashboard (Klinik Sehat Keluarga)")
    print("  maya.sari@example.com    -> seeker: ditolak dengan alasan -> rencana belajar")
    print("  andi.pratama@example.com -> seeker dashboard (fresh-grad data)")
    print("  reza.pahlawan@example.com -> seeker dashboard (senior backend)")
    print("  iwan.setyo@example.com   -> seeker dashboard (SMA + 8 thn sales)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clear", action="store_true", help="wipe data/* before seeding")
    ap.add_argument(
        "--reset-passwords",
        action="store_true",
        help="reset seeded demo accounts to SEED_DEFAULT_PASSWORD",
    )
    args = ap.parse_args()
    asyncio.run(seed(clear=args.clear, reset_passwords=args.reset_passwords))
