"""Seed the JSON store with rich, Indonesia-grounded demo data.

20 real-company job postings × 20 diverse seekers × 15 courses/bootcamps.

Run:
    python -m scripts.seed_demo
    python -m scripts.seed_demo --clear     # wipe data/ first

Companies, regions (BPS kabupaten/kota), salaries, KBJI codes, and course
providers are all anchored to the actual Indonesian labor market so the
matching results look realistic when the UI loads.
"""
from __future__ import annotations

import argparse
import asyncio
import shutil
from pathlib import Path

from backend.app.db.json_store import DATA_ROOT, get_repositories
from backend.app.db.schemas import (
    Course,
    Education,
    EducationLevel,
    Employer,
    JobPosting,
    SeekerProfile,
    Skill,
    User,
    UserRole,
    WorkExperience,
)
from backend.app.ml.matcher import SemanticMatcher


# ─────────────────────────────────────────────────────────────────────────────
#  Employers
# ─────────────────────────────────────────────────────────────────────────────

EMPLOYERS = [
    # (key, company_name, industry, size, region_code, description)
    ("goto",       "GoTo Group (Gojek/Tokopedia)", "Tech / Marketplace", "enterprise", "3174",
        "Super-app dari Indonesia menghubungkan jutaan pengguna ke layanan transportasi, e-commerce, dan keuangan."),
    ("mandiri",    "Bank Mandiri",                  "Perbankan",          "enterprise", "3171",
        "Bank BUMN terbesar di Indonesia, pelopor transformasi digital banking."),
    ("bca",        "Bank Central Asia (BCA)",       "Perbankan",          "enterprise", "3171",
        "Bank swasta terbesar di Indonesia dengan layanan digital banking terdepan."),
    ("telkom",     "Telkom Indonesia",              "Telekomunikasi",     "enterprise", "3273",
        "BUMN telekomunikasi, operator IndiHome dan Telkomsel."),
    ("pertamina",  "Pertamina",                     "Energi / Migas",     "enterprise", "6471",
        "BUMN energi terbesar di Indonesia, hulu sampai hilir migas."),
    ("bibit",      "Bibit Tumbuh Bersama",          "Fintech / Wealth",   "mid",        "3174",
        "Aplikasi investasi reksadana #1 dengan basis pengguna 4 juta+ investor ritel."),
    ("ruangguru",  "Ruangguru",                     "Edutech",            "mid",        "3174",
        "Platform belajar online terbesar di Asia Tenggara, mendukung jutaan siswa."),
    ("halodoc",    "Halodoc",                       "Healthtech",         "mid",        "3174",
        "Aplikasi kesehatan: konsultasi dokter, apotek antar, vaksinasi & tes lab."),
    ("indofood",   "Indofood Sukses Makmur",        "FMCG / Pangan",      "enterprise", "3578",
        "Produsen mi instan, tepung, dan bahan pangan rumah tangga terbesar."),
    ("garuda",     "Garuda Indonesia",              "Penerbangan",        "enterprise", "3171",
        "Maskapai penerbangan nasional, melayani rute domestik dan internasional."),
    ("traveloka",  "Traveloka",                     "Tech / Travel",      "enterprise", "3174",
        "Platform travel & lifestyle terbesar di Asia Tenggara."),
    ("sayurbox",   "Sayurbox",                      "Agritech / Grocery", "mid",        "3174",
        "Belanja sayur & bahan segar langsung dari petani."),
    ("astra",      "Astra International",           "Otomotif / Konglomerat", "enterprise", "3271",
        "Konglomerat otomotif (Toyota, Daihatsu, Honda motor), agribisnis, jasa keuangan."),
    ("kalbe",      "Kalbe Farma",                   "Farmasi / Healthcare", "enterprise", "3174",
        "Perusahaan farmasi terbesar di Asia Tenggara berbasis Indonesia."),
    ("pegadaian",  "Pegadaian",                     "Keuangan / BUMN",    "enterprise", "3471",
        "Lembaga keuangan BUMN, layanan gadai, emas, dan mikrofinansial."),
    ("unilever",   "Unilever Indonesia",            "FMCG",               "enterprise", "3171",
        "Produsen consumer goods global; brand Wall's, Sunsilk, Bango, Rinso, dll."),
    ("reddoorz",   "RedDoorz",                      "Hospitality / Tech", "mid",        "5171",
        "Aplikasi pemesanan hotel budget terbesar di Asia Tenggara."),
    ("shopee",     "Shopee Indonesia",              "E-commerce",         "enterprise", "3174",
        "Platform e-commerce #1 di Indonesia, ekosistem Sea Group."),
    ("tanihub",    "TaniHub",                       "Agritech",           "mid",        "3573",
        "Marketplace B2B yang menghubungkan petani Indonesia ke buyer besar."),
    ("kalbio",     "Kalbio Global Medika",          "Bioteknologi",       "mid",        "3171",
        "Perusahaan vaksin & terapi biologis afiliasi Kalbe Group."),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Job postings (20)
#  Each tuple: (employer_key, title, kbji, desc, responsibilities, req_skills,
#               nice, edu_min, yrs_min, region, remote, sal_min, sal_max)
# ─────────────────────────────────────────────────────────────────────────────

JOB_POSTINGS = [
    ("goto", "Senior Backend Engineer (Go)", "2511",
     "Bangun layanan microservice high-throughput untuk fitur pembayaran Gojek/Tokopedia.",
     ["Desain API REST & gRPC", "Optimasi latency pada Kafka pipeline", "Mentoring engineer junior"],
     ["Go", "PostgreSQL", "Kafka", "Docker", "Kubernetes"], ["gRPC", "Redis"],
     "S1", 4, "3174", True, 25_000_000, 42_000_000),

    ("mandiri", "Junior Data Analyst (Banking)", "2511",
     "Analisis data transaksi nasabah untuk dashboard manajemen risiko & marketing campaign.",
     ["Bikin SQL query produk tabungan", "Bangun dashboard Tableau", "Laporan eksekutif bulanan"],
     ["SQL", "Excel", "Tableau", "Statistika"], ["Python", "Power BI"],
     "S1", 0, "3171", False, 8_000_000, 13_000_000),

    ("goto", "Mobile Engineer - Flutter", "2511",
     "Develop fitur baru aplikasi Tokopedia Seller di Android & iOS.",
     ["Implementasi UI Flutter", "Integrasi REST API", "A/B testing fitur"],
     ["Flutter", "Dart", "REST API", "Git"], ["Firebase", "iOS", "Android Studio"],
     "S1", 2, "3174", False, 18_000_000, 28_000_000),

    ("telkom", "Network Engineer (FTTH)", "2152",
     "Operasi dan troubleshoot jaringan akses IndiHome FTTH wilayah Bandung Raya.",
     ["Maintenance OLT/ONT", "Network monitoring", "Penanganan eskalasi pelanggan"],
     ["TCP/IP", "Cisco IOS", "Linux", "FTTH"], ["Mikrotik", "OSPF"],
     "D3", 2, "3273", False, 12_000_000, 20_000_000),

    ("pertamina", "Petroleum Engineer (Production)", "2146",
     "Optimasi produksi sumur minyak di lapangan East Kalimantan.",
     ["Well testing", "Reservoir analysis", "Production reporting"],
     ["Petroleum Engineering", "PROSPER", "PETREL", "Drilling"], ["MATLAB", "Python"],
     "S1", 3, "6471", False, 15_000_000, 28_000_000),

    ("bibit", "Product Designer", "2166",
     "Desain pengalaman investasi reksadana untuk pengguna ritel pemula.",
     ["User research", "Wireframe & prototyping", "Usability testing"],
     ["Figma", "User Research", "Design System", "Prototyping"], ["Illustration", "Bahasa Inggris"],
     "S1", 2, "3174", True, 14_000_000, 22_000_000),

    ("ruangguru", "Content Writer (Bahasa Indonesia)", "2641",
     "Tulis artikel SEO & soal latihan kurikulum SMA untuk platform Ruangguru.",
     ["Riset topik", "Tulisan 800-1500 kata SEO", "Editorial review"],
     ["Bahasa Indonesia", "SEO", "Content Writing", "Riset"], ["WordPress", "Photoshop"],
     "S1", 1, "3174", True, 6_000_000, 10_000_000),

    ("halodoc", "Backend Engineer (Python)", "2511",
     "Bangun layanan API untuk Halodoc Apotek (Apotek Antar) — order, inventory, fulfillment.",
     ["Develop microservice FastAPI", "DB schema PostgreSQL", "Unit + integration test"],
     ["Python", "FastAPI", "PostgreSQL", "Docker"], ["AWS", "Redis", "Celery"],
     "S1", 2, "3174", True, 16_000_000, 28_000_000),

    ("bca", "Risk Management Analyst", "2412",
     "Pemodelan credit risk untuk produk kartu kredit dan KPR.",
     ["Modeling PD/LGD/EAD", "Stress testing", "Laporan ke OJK"],
     ["Statistika", "SAS", "SQL", "Risk Management"], ["Python", "R"],
     "S1", 2, "3171", False, 10_000_000, 18_000_000),

    ("indofood", "Supply Chain Manager (FMCG)", "1324",
     "Pimpin S&OP planning untuk lini produk mi instan di pabrik Surabaya.",
     ["Demand forecasting", "Vendor negotiation", "KPI inventory turnover"],
     ["Supply Chain", "S&OP", "SAP", "Negotiation"], ["Six Sigma", "Power BI"],
     "S1", 5, "3578", False, 18_000_000, 30_000_000),

    ("garuda", "Cabin Crew (Fresh Recruit)", "5111",
     "Layanan penumpang pesawat rute domestik & internasional Garuda Indonesia.",
     ["Safety briefing", "In-flight service", "Penanganan penumpang khusus"],
     ["Bahasa Inggris", "Komunikasi", "Service Mindset", "Penampilan"], ["Bahasa Mandarin"],
     "D3", 0, "3171", False, 7_000_000, 12_000_000),

    ("traveloka", "Data Scientist (Pricing)", "2511",
     "Bangun model pricing & ranking dinamis untuk pencarian tiket pesawat.",
     ["Feature engineering", "Eksperimen A/B", "Deploy model production"],
     ["Python", "Machine Learning", "SQL", "Spark"], ["TensorFlow", "MLflow", "Airflow"],
     "S1", 3, "3174", True, 22_000_000, 38_000_000),

    ("sayurbox", "Operations Lead (Warehouse)", "3331",
     "Pimpin tim operasional fulfillment dark store Sayurbox area JABODETABEK.",
     ["Schedule shift", "KPI on-time delivery", "Continuous improvement"],
     ["Operasional", "Leadership", "Excel", "Problem Solving"], ["Lean / Six Sigma"],
     "D3", 3, "3174", False, 13_000_000, 20_000_000),

    ("astra", "Mechanical Engineer (Automotive)", "2144",
     "Engineer lini produksi mobil Toyota di pabrik Karawang (Astra Daihatsu Motor).",
     ["Process improvement", "Quality control", "Drawing review (CAD)"],
     ["AutoCAD", "Mechanical", "TPM", "Bahasa Inggris"], ["SolidWorks", "MES"],
     "S1", 2, "3271", False, 11_000_000, 18_000_000),

    ("kalbe", "Quality Assurance Pharmacist", "2262",
     "QA produksi sediaan farmasi di pabrik Kalbe Bekasi.",
     ["Validasi proses", "Audit CPOB", "Investigasi deviasi"],
     ["Farmasi", "CPOB", "Quality Assurance", "GMP"], ["LIMS", "Six Sigma"],
     "S1", 1, "3174", False, 9_000_000, 15_000_000),

    ("pegadaian", "Customer Service Representative", "4222",
     "Layanan nasabah cabang Pegadaian Yogyakarta — gadai emas, KCA, tabungan emas.",
     ["Layanan tatap muka nasabah", "Input transaksi", "Cross-sell produk"],
     ["Komunikasi", "Customer Service", "Penampilan", "Bahasa Indonesia"], ["Excel"],
     "D3", 0, "3471", False, 5_000_000, 8_000_000),

    ("unilever", "Marketing Specialist (FMCG)", "2431",
     "Eksekusi campaign brand personal-care (Sunsilk/Pepsodent) di kanal modern trade.",
     ["Trade marketing plan", "Activation BTL", "Analisis sales data"],
     ["Marketing", "Trade Marketing", "Excel", "Bahasa Inggris"], ["Power BI", "Nielsen"],
     "S1", 2, "3171", False, 13_000_000, 20_000_000),

    ("reddoorz", "Sales Executive (Hotel Partner)", "3322",
     "Akuisisi hotel & guest house budget di area Bali untuk listing RedDoorz.",
     ["Door-to-door sales", "Negotiation kontrak", "Onboarding mitra"],
     ["Sales", "Negotiation", "Bahasa Indonesia", "Komunikasi"], ["Bahasa Inggris"],
     "SMA", 1, "5171", False, 7_000_000, 13_000_000),

    ("shopee", "UI/UX Designer", "2166",
     "Desain alur checkout & promosi di aplikasi Shopee.",
     ["Wireframe", "User testing", "Hand-off ke engineer"],
     ["Figma", "UI/UX", "Design System", "Prototyping"], ["After Effects", "User Research"],
     "S1", 2, "3174", True, 15_000_000, 25_000_000),

    ("tanihub", "Agriculture Field Officer", "6111",
     "Bina petani mitra di area Malang Raya untuk supply sayur & buah TaniHub.",
     ["Field visit petani", "Edukasi GAP", "Quality control panen"],
     ["Pertanian", "Bahasa Indonesia", "Excel", "Komunikasi"], ["Excel", "Logistik"],
     "D3", 1, "3573", False, 6_000_000, 10_000_000),

    ("kalbio", "Biotechnology Research Associate", "2131",
     "Riset & development produk vaksin/biologic di lab Kalbio.",
     ["Eksperimen sel mamalia", "Validasi assay", "Reporting ke principal scientist"],
     ["Bioteknologi", "Cell Culture", "ELISA", "Lab Safety"], ["Flow Cytometry", "qPCR"],
     "S1", 1, "3171", False, 9_000_000, 14_000_000),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Job seekers (20) — deliberately diverse: fresh-grad -> mid-senior,
#  SMA -> S2, kota besar -> daerah, beragam jurusan.
# ─────────────────────────────────────────────────────────────────────────────

SEEKERS = [
    dict(
        email="andi.pratama@example.com",
        full_name="Andi Pratama",
        headline="Fresh-graduate Statistika UI — fokus data analytics perbankan",
        region_code="3171", preferred=["3174"],
        skills=[("Python", "intermediate", 1.5), ("SQL", "intermediate", 1.5),
                ("Statistika", "advanced", 3.0), ("Excel", "advanced", 4.0),
                ("Tableau", "beginner", 0.5)],
        edu=[("Universitas Indonesia", "S1", "Statistika", 2024)],
        exp=[("Bank Mandiri", "Intern Data Analyst", "2023-06", "2024-01", "Analisis NPL & dashboard")],
        sal=(7_000_000, 12_000_000), resume="Fresh grad statistika UI; magang Bank Mandiri",
    ),
    dict(
        email="siti.nurhaliza@example.com",
        full_name="Siti Nurhaliza",
        headline="Akuntan Junior di KAP — 2 tahun audit klien menengah",
        region_code="3578",
        skills=[("Akuntansi", "advanced", 2.5), ("Excel", "advanced", 3.0),
                ("Audit", "intermediate", 2.0), ("SAP", "beginner", 0.5)],
        edu=[("Politeknik Negeri Surabaya", "D3", "Akuntansi", 2022)],
        exp=[("KAP Tanudiredja Wibisana", "Junior Auditor", "2022-08", None, "Audit klien manufaktur")],
        sal=(7_000_000, 11_000_000), resume="Audit junior di Surabaya, target FMCG accounting",
    ),
    dict(
        email="budi.santoso@example.com",
        full_name="Budi Santoso",
        headline="Teknisi Otomotif — 5 tahun pengalaman bengkel Toyota",
        region_code="3271",
        skills=[("Mechanical", "advanced", 5.0), ("AutoCAD", "beginner", 1.0),
                ("TPM", "intermediate", 2.0), ("Quality Control", "intermediate", 3.0)],
        edu=[("SMK Negeri 1 Karawang", "SMA", "Teknik Otomotif", 2018)],
        exp=[("Auto2000", "Mekanik Senior", "2019-01", None, "Service & quality check")],
        sal=(6_000_000, 10_000_000), resume="SMK otomotif, 5 tahun di Auto2000",
    ),
    dict(
        email="putri.maharani@example.com",
        full_name="Putri Maharani",
        headline="Apoteker fresh-graduate UGM — minat QA farmasi",
        region_code="3471",
        skills=[("Farmasi", "advanced", 5.0), ("CPOB", "intermediate", 1.0),
                ("Lab Safety", "intermediate", 1.5), ("Bahasa Inggris", "intermediate", 3.0)],
        edu=[("Universitas Gadjah Mada", "S1", "Farmasi", 2024)],
        exp=[("Apotek Kimia Farma", "Intern Apoteker", "2023-06", "2023-12", "PKPA")],
        sal=(6_500_000, 11_000_000), resume="Lulusan Farmasi UGM, lulus apoteker, mencari QA produksi",
    ),
    dict(
        email="reza.pahlawan@example.com",
        full_name="Reza Pahlawan",
        headline="Senior Backend Engineer (Go/Java) — 6 tahun, ingin role remote",
        region_code="3273", preferred=["3174"],
        skills=[("Go", "expert", 5.0), ("Java", "advanced", 4.0), ("PostgreSQL", "advanced", 5.0),
                ("Kubernetes", "advanced", 3.0), ("Kafka", "intermediate", 2.0),
                ("Docker", "expert", 5.0), ("gRPC", "advanced", 3.0)],
        edu=[("Institut Teknologi Bandung", "S2", "Informatika", 2019),
             ("Institut Teknologi Bandung", "S1", "Teknik Informatika", 2017)],
        exp=[("Tokopedia", "Senior Engineer", "2020-03", None, "Microservice marketplace"),
             ("Bukalapak", "Software Engineer", "2017-07", "2020-02", "Backend payment")],
        sal=(28_000_000, 45_000_000), resume="S2 ITB CS, 6 tahun backend, fokus Go di Tokopedia",
    ),
    dict(
        email="maya.sari@example.com",
        full_name="Maya Sari",
        headline="Admin retail SMA lulusan — siap belajar entry-level",
        region_code="3175",
        skills=[("Excel", "beginner", 1.0), ("Komunikasi", "intermediate", 1.5),
                ("Customer Service", "intermediate", 1.0), ("Bahasa Indonesia", "advanced", 1.5)],
        edu=[("SMA Negeri 50 Jakarta", "SMA", "IPS", 2022)],
        exp=[("Alfamart", "Admin Toko", "2023-01", None, "Stok & kasir")],
        sal=(4_000_000, 6_500_000), resume="Lulusan SMA, 1 tahun admin Alfamart",
    ),
    dict(
        email="joko.widodo.p@example.com",
        full_name="Joko Widodo Pratama",
        headline="Supply chain analyst — 3 tahun di manufaktur tekstil Solo",
        region_code="3372",
        skills=[("Supply Chain", "advanced", 3.0), ("Excel", "advanced", 4.0),
                ("SAP", "intermediate", 2.0), ("S&OP", "intermediate", 2.0),
                ("Power BI", "beginner", 0.5)],
        edu=[("Universitas Gadjah Mada", "S1", "Teknik Industri", 2021)],
        exp=[("PT Sritex", "Supply Chain Analyst", "2021-08", None, "S&OP & demand planning")],
        sal=(10_000_000, 16_000_000), resume="S1 TI UGM, 3 tahun supply chain Sritex Solo",
    ),
    dict(
        email="dewi.kartika@example.com",
        full_name="Dewi Kartika",
        headline="Content writer & digital marketer — 4 tahun di media & startup",
        region_code="3174",
        skills=[("Content Writing", "advanced", 4.0), ("SEO", "advanced", 3.0),
                ("Bahasa Indonesia", "expert", 4.0), ("Bahasa Inggris", "advanced", 3.0),
                ("WordPress", "advanced", 3.0), ("Marketing", "intermediate", 2.0)],
        edu=[("Universitas Indonesia", "S1", "Ilmu Komunikasi", 2020)],
        exp=[("IDN Times", "Senior Writer", "2022-01", None, "Artikel viral & SEO"),
             ("Kompas.com", "Content Writer", "2020-08", "2021-12", "Newsroom")],
        sal=(9_000_000, 14_000_000), resume="S1 Komunikasi UI, 4 tahun content writer",
    ),
    dict(
        email="hendra.setiawan@example.com",
        full_name="Hendra Setiawan",
        headline="Hotel ops 2 tahun di Bali — sales target perhotelan budget",
        region_code="5171",
        skills=[("Hospitality", "advanced", 2.0), ("Sales", "intermediate", 2.0),
                ("Bahasa Inggris", "advanced", 3.0), ("Customer Service", "advanced", 2.0)],
        edu=[("STP Nusa Dua Bali", "D4", "Manajemen Perhotelan", 2022)],
        exp=[("RedDoorz Plus Bali", "Front Office Supervisor", "2022-06", None, "Operasional FO")],
        sal=(6_000_000, 11_000_000), resume="D4 Perhotelan Nusa Dua, 2 tahun front office RedDoorz",
    ),
    dict(
        email="linda.halim@example.com",
        full_name="Linda Halim",
        headline="Banker 7 tahun BCA — ingin pivot ke product/risk fintech",
        region_code="3171",
        skills=[("Risk Management", "advanced", 5.0), ("Banking", "expert", 7.0),
                ("SQL", "intermediate", 2.0), ("Excel", "expert", 7.0),
                ("Statistika", "intermediate", 2.0)],
        edu=[("Universitas Trisakti", "S1", "Manajemen", 2017)],
        exp=[("Bank BCA", "Relationship Manager", "2019-04", None, "Korporat & UKM"),
             ("Bank BCA", "MT Program", "2017-09", "2019-03", "Management trainee")],
        sal=(18_000_000, 28_000_000), resume="S1 Manajemen Trisakti, 7 tahun BCA",
    ),
    dict(
        email="agus.salim@example.com",
        full_name="Agus Salim",
        headline="Cook 3 tahun di restoran Bandung — ingin role F&B ops",
        region_code="3273",
        skills=[("Hospitality", "advanced", 3.0), ("Food Safety", "intermediate", 2.0),
                ("Operasional", "intermediate", 2.0), ("Bahasa Indonesia", "advanced", 3.0)],
        edu=[("SMK Pariwisata Bandung", "SMA", "Tata Boga", 2020)],
        exp=[("Karnivor Bandung", "Cook 1", "2021-02", None, "Line cook western")],
        sal=(5_000_000, 8_000_000), resume="SMK Boga + 3 tahun line cook",
    ),
    dict(
        email="rina.wijaya@example.com",
        full_name="Rina Wijaya",
        headline="UI Designer freelance — 3 tahun di startup & agency",
        region_code="3273", preferred=["3174"],
        skills=[("Figma", "expert", 3.0), ("UI/UX", "advanced", 3.0),
                ("Design System", "intermediate", 2.0), ("Prototyping", "advanced", 3.0),
                ("Illustration", "advanced", 4.0)],
        edu=[("Institut Teknologi Bandung", "S1", "Desain Komunikasi Visual", 2021)],
        exp=[("Freelance", "UI Designer", "2021-07", None, "Klien startup edukasi & B2B")],
        sal=(11_000_000, 18_000_000), resume="S1 DKV ITB, freelance UI designer",
    ),
    dict(
        email="bayu.aditya@example.com",
        full_name="Bayu Aditya",
        headline="Project engineer konstruksi 4 tahun — sertifikasi K3",
        region_code="3578",
        skills=[("AutoCAD", "advanced", 4.0), ("Project Management", "intermediate", 3.0),
                ("K3", "advanced", 4.0), ("MS Project", "intermediate", 2.0),
                ("Bahasa Inggris", "intermediate", 2.0)],
        edu=[("Institut Teknologi Sepuluh Nopember", "S1", "Teknik Sipil", 2020)],
        exp=[("Waskita Karya", "Project Engineer", "2020-09", None, "Tol Trans-Sumatra")],
        sal=(11_000_000, 17_000_000), resume="S1 Sipil ITS + 4 tahun Waskita",
    ),
    dict(
        email="nadia.putri@example.com",
        full_name="Nadia Putri",
        headline="HR generalist 2 tahun — minat People Analytics",
        region_code="3174",
        skills=[("Human Resources", "advanced", 2.0), ("Recruitment", "advanced", 2.0),
                ("Excel", "advanced", 4.0), ("Statistika", "intermediate", 2.0),
                ("Bahasa Inggris", "advanced", 4.0)],
        edu=[("Universitas Indonesia", "S2", "Psikologi Industri", 2023),
             ("Universitas Padjadjaran", "S1", "Psikologi", 2021)],
        exp=[("Halodoc", "HR Generalist", "2023-08", None, "Recruitment & employee experience")],
        sal=(11_000_000, 18_000_000), resume="S2 Psikologi UI, 2 tahun HR Halodoc",
    ),
    dict(
        email="faisal.rahman@example.com",
        full_name="Faisal Rahman",
        headline="Maintenance technician 5 tahun di pabrik tekstil",
        region_code="3273",
        skills=[("Mechanical", "advanced", 5.0), ("PLC", "intermediate", 3.0),
                ("Quality Control", "intermediate", 3.0), ("TPM", "advanced", 4.0)],
        edu=[("Politeknik Negeri Bandung", "D3", "Teknik Mesin", 2019)],
        exp=[("PT Trisula Textile", "Maintenance Tech", "2019-07", None, "Mesin tenun & finishing")],
        sal=(6_500_000, 11_000_000), resume="D3 Polban Mesin + 5 tahun maintenance",
    ),
    dict(
        email="citra.lestari@example.com",
        full_name="Citra Lestari",
        headline="Legal trainee 1 tahun — pasca ujian advokat",
        region_code="3573",
        skills=[("Hukum", "intermediate", 2.0), ("Bahasa Inggris", "advanced", 4.0),
                ("Riset", "advanced", 3.0), ("Drafting", "intermediate", 1.5)],
        edu=[("Universitas Brawijaya", "S1", "Ilmu Hukum", 2023)],
        exp=[("Kantor Hukum Lubis Santosa", "Junior Associate", "2023-09", None, "Litigasi & corporate")],
        sal=(8_000_000, 13_000_000), resume="S1 Hukum UB, 1 tahun KAP litigasi",
    ),
    dict(
        email="iwan.setyo@example.com",
        full_name="Iwan Setyo",
        headline="Sales pengalaman 8 tahun (retail & property) — target B2B sales",
        region_code="3471",
        skills=[("Sales", "expert", 8.0), ("Negotiation", "advanced", 6.0),
                ("Komunikasi", "expert", 8.0), ("Customer Service", "advanced", 5.0)],
        edu=[("SMA Negeri 9 Yogyakarta", "SMA", "IPS", 2014)],
        exp=[("Sinarmas Land", "Sales Executive", "2019-03", None, "Penjualan rumah cluster"),
             ("Erafone", "Sales Promotor", "2014-11", "2019-02", "Sales gadget")],
        sal=(7_000_000, 13_000_000), resume="SMA + 8 tahun sales retail & property",
    ),
    dict(
        email="yuni.astuti@example.com",
        full_name="Yuni Astuti",
        headline="Perawat 6 tahun RS Surabaya — eksplorasi healthtech ops",
        region_code="3578",
        skills=[("Keperawatan", "expert", 6.0), ("Customer Service", "advanced", 6.0),
                ("Health Operations", "intermediate", 2.0), ("Bahasa Indonesia", "expert", 6.0)],
        edu=[("Akademi Keperawatan Karya Husada", "D3", "Keperawatan", 2018)],
        exp=[("RS Premier Surabaya", "Perawat IGD", "2018-08", None, "IGD & rawat inap")],
        sal=(7_500_000, 13_000_000), resume="D3 Keperawatan + 6 tahun perawat RS",
    ),
    dict(
        email="aldi.pramudya@example.com",
        full_name="Aldi Pramudya",
        headline="QA Tester 1 tahun — target Software Engineer",
        region_code="3173",
        skills=[("QA Testing", "intermediate", 1.5), ("SQL", "intermediate", 1.5),
                ("Python", "beginner", 1.0), ("Selenium", "beginner", 1.0),
                ("Git", "intermediate", 1.5)],
        edu=[("Universitas Bina Nusantara", "S1", "Sistem Informasi", 2023)],
        exp=[("Halodoc", "QA Engineer", "2023-09", None, "Manual & automation testing")],
        sal=(7_500_000, 12_000_000), resume="S1 SI Binus + 1 tahun QA Halodoc",
    ),
    dict(
        email="sri.wahyuni@example.com",
        full_name="Sri Wahyuni",
        headline="Field officer pertanian 5 tahun — agritech & food security",
        region_code="3271",
        skills=[("Pertanian", "advanced", 5.0), ("Komunikasi", "advanced", 5.0),
                ("Excel", "intermediate", 3.0), ("Logistik", "intermediate", 3.0),
                ("Bahasa Indonesia", "expert", 5.0)],
        edu=[("Institut Pertanian Bogor", "S1", "Agribisnis", 2019)],
        exp=[("PT East West Seed Indonesia", "Field Trial Officer", "2019-08", None, "Field trial benih hortikultura")],
        sal=(7_000_000, 12_000_000), resume="S1 Agribisnis IPB + 5 tahun field officer",
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Courses & Bootcamps (15) — real Indonesian providers
# ─────────────────────────────────────────────────────────────────────────────

COURSES = [
    dict(name="Bangkit Academy — Machine Learning Path", provider="Bangkit (Kominfo + GoTo + Traveloka)",
         category="tech", skills_taught=["Python", "Machine Learning", "TensorFlow", "SQL"],
         duration="6 bulan", cost_idr=0, is_prakerja=True, level="intermediate",
         description="Program lead-by-industry, sertifikasi setara D2 Pemerintah."),
    dict(name="Hacktiv8 — Full-Stack JavaScript Bootcamp", provider="Hacktiv8",
         category="tech", skills_taught=["JavaScript", "Node.js", "React", "PostgreSQL", "Git"],
         duration="12 minggu intensif", cost_idr=28_000_000, level="beginner",
         description="Bootcamp full-stack ISA tersedia, alumni di Tokopedia/Gojek."),
    dict(name="Purwadhika — Data Science Bootcamp", provider="Purwadhika Digital Talent",
         category="tech", skills_taught=["Python", "Statistika", "Machine Learning", "Tableau", "SQL"],
         duration="16 minggu", cost_idr=23_500_000, level="intermediate",
         description="Bootcamp Data Science populer, partnership 250+ hiring partner."),
    dict(name="RevoU — Full-Stack Software Engineering", provider="RevoU",
         category="tech", skills_taught=["JavaScript", "Node.js", "React", "Git", "AWS"],
         duration="4 bulan", cost_idr=21_000_000, level="beginner",
         description="Bootcamp full-stack dengan job guarantee 4 bulan."),
    dict(name="Binar Academy — Android Engineering", provider="Binar Academy",
         category="tech", skills_taught=["Android", "Kotlin", "Git", "REST API"],
         duration="3 bulan", cost_idr=0, is_prakerja=True, level="beginner",
         description="Lulus pelatihan + sertifikat industri, banyak alumni di startup ID."),
    dict(name="Dicoding — Belajar Machine Learning untuk Pemula", provider="Dicoding",
         category="tech", skills_taught=["Python", "Machine Learning", "Statistika"],
         duration="1 bulan", cost_idr=0, is_prakerja=True, level="beginner",
         description="Kelas pengantar ML Bahasa Indonesia, terbukti gratis via Prakerja."),
    dict(name="Dicoding — Belajar Membuat Aplikasi Android", provider="Dicoding",
         category="tech", skills_taught=["Android", "Kotlin", "Git"],
         duration="1 bulan", cost_idr=400_000, is_prakerja=True, level="intermediate",
         description="Kelas Android Bahasa Indonesia, kurikulum Google certified."),
    dict(name="Google Data Analytics Professional Certificate", provider="Coursera ID",
         category="tech", skills_taught=["SQL", "Excel", "Tableau", "Statistika", "R"],
         duration="6 bulan (10 jam/minggu)", cost_idr=590_000,
         is_prakerja=False, level="beginner",
         description="Sertifikat Google, tersedia subsidi via beasiswa Coursera ID."),
    dict(name="IBM Data Science Professional Certificate", provider="Coursera ID",
         category="tech", skills_taught=["Python", "Machine Learning", "SQL", "Statistika"],
         duration="4 bulan", cost_idr=590_000, level="intermediate",
         description="Sertifikat IBM, fokus pipeline data science end-to-end."),
    dict(name="Skill Academy — Digital Marketing Bersertifikat", provider="Skill Academy by Ruangguru",
         category="marketing", skills_taught=["SEO", "Marketing", "Content Writing", "Excel"],
         duration="1 bulan", cost_idr=350_000, is_prakerja=True, level="beginner",
         description="Modul digital marketing Indonesia, lulus sertifikat resmi."),
    dict(name="MySkill — Excel & Power BI untuk Bisnis", provider="MySkill",
         category="finance", skills_taught=["Excel", "Power BI", "Data Analysis"],
         duration="1 bulan", cost_idr=199_000, level="beginner",
         description="Praktis untuk analis bisnis & supply chain."),
    dict(name="Pintaria — SAP Logistics for Supply Chain", provider="Pintaria",
         category="ops", skills_taught=["SAP", "Supply Chain", "S&OP", "Logistik"],
         duration="6 bulan", cost_idr=12_000_000, level="intermediate",
         description="Sertifikasi SAP untuk profesional supply chain Indonesia."),
    dict(name="Apple Developer Academy ID — iOS Development", provider="Apple Developer Academy (BINUS)",
         category="tech", skills_taught=["iOS", "Swift", "Design", "Git"],
         duration="9 bulan", cost_idr=0, level="intermediate",
         description="Akademi gratis Apple di Indonesia (BINUS Tangerang)."),
    dict(name="Cakap — Bahasa Inggris Karier", provider="Cakap",
         category="language", skills_taught=["Bahasa Inggris", "Komunikasi"],
         duration="3 bulan", cost_idr=900_000, is_prakerja=True, level="beginner",
         description="Live class English profesional Indonesia."),
    dict(name="Arkademi — Akuntansi Praktis untuk UMKM", provider="Arkademi",
         category="finance", skills_taught=["Akuntansi", "Excel", "Pajak"],
         duration="2 bulan", cost_idr=350_000, is_prakerja=True, level="beginner",
         description="Praktis akuntansi UMKM, mengantongi sertifikasi Prakerja."),
]


# ─────────────────────────────────────────────────────────────────────────────
#  Seed
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_PWD = "$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa"  # bcrypt of "demo"


async def seed(clear: bool) -> None:
    if clear and DATA_ROOT.exists():
        for sub in ["users", "seekers", "employers", "jobs", "applications",
                    "matches", "skill_gaps", "conversations", "ai_logs",
                    "gamification", "courses"]:
            d = DATA_ROOT / sub
            if d.exists():
                shutil.rmtree(d)
        print(f"[clear] wiped {DATA_ROOT}")

    repos = get_repositories()
    matcher = SemanticMatcher()

    # ── Employers ──────────────────────────────────────────────────────────
    emp_by_key: dict[str, Employer] = {}
    for key, name, ind, size, region, desc in EMPLOYERS:
        u = await repos.users.upsert(User(
            email=f"hr@{key}.id", password_hash=DEFAULT_PWD, role=UserRole.EMPLOYER,
        ))
        emp = await repos.employers.upsert(Employer(
            user_id=u.id, company_name=name, industry=ind, size=size,
            region_code=region, description=desc,
        ))
        emp_by_key[key] = emp
    print(f"[employers] {len(emp_by_key)} created")

    # ── Jobs ───────────────────────────────────────────────────────────────
    job_count = 0
    for jp in JOB_POSTINGS:
        (key, title, kbji, desc, resps, req, nice,
         edu, yrs, region, remote, smin, smax) = jp
        emp = emp_by_key[key]
        try:
            edu_lv = EducationLevel(edu)
        except ValueError:
            edu_lv = EducationLevel.S1
        job = JobPosting(
            employer_id=emp.id, title=title, kbji_code=kbji,
            description=desc, responsibilities=resps,
            required_skills=req, nice_to_have_skills=nice,
            education_min=edu_lv, experience_years_min=yrs,
            region_code=region, remote_allowed=remote,
            salary_min=smin, salary_max=smax,
        )
        await matcher.embed_job(job)
        await repos.jobs.upsert(job)
        job_count += 1
    print(f"[jobs] {job_count} created")

    # ── Seekers ────────────────────────────────────────────────────────────
    seeker_count = 0
    for s in SEEKERS:
        u = await repos.users.upsert(User(
            email=s["email"], password_hash=DEFAULT_PWD, role=UserRole.SEEKER,
        ))
        edu_objs = [Education(
            institution=inst,
            degree=EducationLevel(deg) if deg in EducationLevel.__members__ else EducationLevel.S1,
            major=maj, graduation_year=year,
        ) for (inst, deg, maj, year) in s["edu"]]
        exp_objs = [WorkExperience(
            company=c, title=t, start_date=sd, end_date=ed, description=desc,
        ) for (c, t, sd, ed, desc) in s["exp"]]
        skill_objs = [Skill(name=n, level=lv, years=yr) for (n, lv, yr) in s["skills"]]

        seeker = SeekerProfile(
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
        seeker_count += 1
    print(f"[seekers] {seeker_count} created")

    # ── Courses ────────────────────────────────────────────────────────────
    for c in COURSES:
        await repos.courses.upsert(Course(**c))
    print(f"[courses] {len(COURSES)} created")

    # ── Admin user ─────────────────────────────────────────────────────────
    await repos.users.upsert(User(
        email="admin@kerjacerdas.id", password_hash=DEFAULT_PWD, role=UserRole.ADMIN,
    ))
    print("[admin] admin@kerjacerdas.id seeded")

    print("\n[OK] Seed selesai.")
    print(f"  Employers : {len(emp_by_key)}")
    print(f"  Jobs      : {job_count}")
    print(f"  Seekers   : {seeker_count}")
    print(f"  Courses   : {len(COURSES)}")
    print("\nLogin demo (UI menerima password apa saja):")
    print("  admin@kerjacerdas.id     -> admin dashboard")
    print("  hr@goto.id               -> employer dashboard (GoTo)")
    print("  hr@bibit.id              -> employer dashboard (Bibit)")
    print("  andi.pratama@example.com -> seeker dashboard (fresh-grad data)")
    print("  reza.pahlawan@example.com -> seeker dashboard (senior backend)")
    print("  iwan.setyo@example.com   -> seeker dashboard (SMA + 8 thn sales)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clear", action="store_true", help="wipe data/* before seeding")
    args = ap.parse_args()
    asyncio.run(seed(clear=args.clear))
