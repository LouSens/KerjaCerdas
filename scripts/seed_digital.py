"""Entry-level DIGITAL jobs at the seeded UMKM, plus the seekers and courses that
tell the booth story: a fresh graduate picks a digital target job, sees the one
skill it is missing, learns it, applies elsewhere, and is rejected with a reason.

Merged into scripts.seed_all (JOB_POSTINGS / SEEKERS / COURSES) and into
scripts.seed_outcomes (OUTCOMES / TARGETS). Same tuple/dict shapes as there.

Demo reading of the result:
  salsa.anindya@example.com   target "Desainer Grafis Junior" (missing: Editing Video)
                            + rejected at "Junior Web Developer" (skill_kurang,
                            missing: JavaScript) -> learning plan
  hr@konveksimakmur.id      "Desainer Grafis Junior" + "3D Artist Junior" with
                            applicants; one HR-confirmed Illustrator skill
"""

from __future__ import annotations

# (employer key, title, KBJI, description, responsibilities, required, nice-to-have,
#  min education, min years, region, remote, salary min, salary max)
DIGITAL_JOBS = [
    (
        "konveksi_makmur",
        "Desainer Grafis Junior",
        "2166",
        "Desain katalog, label, dan konten promosi untuk produk seragam & garmen custom.",
        ["Desain katalog & label produk", "Konten promosi media sosial", "Video pendek produk"],
        ["Adobe Illustrator", "Desain Konten Media Sosial", "Editing Video"],
        ["Adobe Photoshop", "Canva"],
        "SMA",
        0,
        "3372",
        True,
        4_500_000,
        6_500_000,
    ),
    (
        "konveksi_makmur",
        "3D Artist Junior (Katalog Produk)",
        "2166",
        "Membuat mockup 3D pakaian untuk katalog online, sebelum produk dijahit.",
        ["Mockup 3D produk garmen", "Render foto katalog", "Revisi desain bersama tim produksi"],
        ["Blender 3D", "Rendering Produk", "Adobe Photoshop"],
        ["Clo3D", "Substance Painter"],
        "SMA",
        0,
        "3372",
        True,
        5_000_000,
        7_500_000,
    ),
    (
        "catering_sedap",
        "Admin Media Sosial & Konten",
        "2432",
        "Mengelola Instagram & TikTok katering: jadwal konten, caption, dan iklan kecil.",
        ["Kalender konten mingguan", "Caption & balas pesan", "Iklan berbayar anggaran kecil"],
        ["Desain Konten Media Sosial", "Copywriting", "Instagram Ads"],
        ["Editing Video", "Canva"],
        "SMA",
        0,
        "7371",
        True,
        4_000_000,
        5_500_000,
    ),
    (
        "pasar_digital",
        "Junior Web Developer",
        "2513",
        "Membangun halaman toko & promo untuk penjual UMKM di marketplace Pasar Digital.",
        ["Halaman promo responsif", "Perbaikan bug tampilan", "Kolaborasi via Git"],
        ["HTML/CSS", "JavaScript", "Git"],
        ["React", "Figma"],
        "D3",
        0,
        "3174",
        True,
        6_000_000,
        9_000_000,
    ),
]

DIGITAL_SEEKERS = [
    {
        "email": "salsa.anindya@example.com",
        "full_name": "Salsa Anindya",
        "headline": "Lulusan baru DKV 2025 — desain grafis & konten media sosial",
        "region_code": "3372",
        "preferred": ["3372", "3174"],
        "skills": [
            ("Adobe Illustrator", "intermediate", 2.0),
            ("Desain Konten Media Sosial", "intermediate", 1.5),
            ("Adobe Photoshop", "intermediate", 2.0),
            ("HTML/CSS", "beginner", 0.5),
            ("Git", "beginner", 0.5),
        ],
        "edu": [("Universitas Sebelas Maret", "S1", "Desain Komunikasi Visual", 2025)],
        "exp": [("Studio Kreatif Kampus", "Desainer Magang", "2024-07", "2024-12", "Poster & konten Instagram acara")],
        "sal": (4_000_000, 6_000_000),
        "resume": "Lulusan DKV 2025; portofolio poster, feed Instagram, dan label produk UMKM.",
    },
    {
        "email": "dimas.saputra@example.com",
        "full_name": "Dimas Saputra",
        "headline": "Lulusan SMK Multimedia — desain, editing video & 3D",
        "region_code": "3372",
        "preferred": ["3372"],
        "skills": [
            ("Adobe Illustrator", "intermediate", 2.0),
            ("Editing Video", "intermediate", 2.0),
            ("Blender 3D", "beginner", 1.0),
            ("Adobe Photoshop", "intermediate", 2.0),
        ],
        "edu": [("SMK Negeri 4 Surakarta", "SMA", "Multimedia", 2024)],
        "exp": [("Freelance", "Editor Video", "2024-08", None, "Video pendek produk untuk toko online")],
        "sal": (4_000_000, 6_500_000),
        "resume": "SMK Multimedia 2024; freelance editing video produk dan desain label.",
    },
]

_PROVIDER = "Kelas Digital UMKM"  # fictional, like the seeded UMKM

DIGITAL_COURSES = [
    {
        "name": "Dasar Editing Video untuk Konten",
        "provider": _PROVIDER,
        "category": "design",
        "skills_taught": ["Editing Video"],
        "duration": "3 minggu",
        "cost_idr": 0,
        "level": "beginner",
        "description": "Potong, susun, dan beri teks video pendek produk untuk Reels & TikTok.",
    },
    {
        "name": "Copywriting & Iklan Instagram untuk Usaha Kecil",
        "provider": _PROVIDER,
        "category": "marketing",
        "skills_taught": ["Copywriting", "Instagram Ads"],
        "duration": "3 minggu",
        "cost_idr": 0,
        "level": "beginner",
        "description": "Menulis caption yang menjual dan menjalankan iklan Instagram beranggaran kecil.",
    },
    {
        "name": "Blender 3D: Mockup & Render Produk",
        "provider": _PROVIDER,
        "category": "design",
        "skills_taught": ["Blender 3D", "Rendering Produk"],
        "duration": "1 bulan",
        "cost_idr": 0,
        "level": "beginner",
        "description": "Membuat mockup 3D produk dan merender foto katalog tanpa sesi foto.",
    },
    {
        "name": "Desain Konten Media Sosial dengan Illustrator & Photoshop",
        "provider": _PROVIDER,
        "category": "design",
        "skills_taught": ["Desain Konten Media Sosial", "Adobe Illustrator", "Adobe Photoshop"],
        "duration": "1 bulan",
        "cost_idr": 0,
        "level": "beginner",
        "description": "Feed, story, dan label produk yang konsisten dengan identitas merek.",
    },
    {
        "name": "HTML/CSS & JavaScript untuk Pemula",
        "provider": _PROVIDER,
        "category": "tech",
        "skills_taught": ["HTML/CSS", "JavaScript", "Git"],
        "duration": "1 bulan",
        "cost_idr": 0,
        "level": "beginner",
        "description": "Membangun halaman web responsif pertama dan menyimpannya dengan Git.",
    },
]

# Same shape as scripts.seed_outcomes.OUTCOMES.
DIGITAL_OUTCOMES = [
    ("salsa.anindya@example.com", "pasar_digital", "Junior Web Developer", "rejected", "skill_kurang", [],
     "Terima kasih. Untuk posisi ini kami butuh kandidat yang sudah bisa JavaScript."),
    ("dimas.saputra@example.com", "konveksi_makmur", "Desainer Grafis Junior", "interview", "",
     ["Adobe Illustrator"], "Wawancara & tes desain label hari Rabu."),
    ("dimas.saputra@example.com", "konveksi_makmur", "3D Artist Junior (Katalog Produk)", "applied", "", [], ""),
]

# Same shape as scripts.seed_outcomes.TARGETS: plan already points at the target on first login.
DIGITAL_TARGETS = [("salsa.anindya@example.com", "konveksi_makmur", "Desainer Grafis Junior")]
