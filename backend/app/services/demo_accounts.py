"""Seeded accounts offered as one-click logins while DEMO_MODE is on.

Each one shows a different step of the loop, so a booth visitor can see the
whole product without typing a password. The list is fixed here — the endpoint
never logs in an arbitrary email, never an admin, and does not exist at all
when demo mode is off. Accounts come from scripts.seed_all + seed_outcomes.
"""

from __future__ import annotations

# (email, role, name shown on the button, what this account demonstrates)
DEMO_ACCOUNTS: list[tuple[str, str, str, str]] = [
    ("salsa.anindya@example.com", "seeker", "Salsa Anindya",
     "Lulusan DKV · target Desainer Grafis · ditolak dengan alasan → rencana belajar"),
    ("maya.sari@example.com", "seeker", "Maya Sari",
     "Ditolak dengan alasan dari HR → rencana belajar untuk lowongan itu"),
    ("rudi.hartono@example.com", "seeker", "Rudi Hartono",
     "Sedang tahap wawancara · skill sudah dikonfirmasi HR"),
    ("bambang.suryanto@example.com", "seeker", "Bambang Suryanto",
     "Sudah diterima kerja · skill terbukti ikut ke lamaran berikutnya"),
    ("andi.pratama@example.com", "seeker", "Andi Pratama",
     "Lulusan baru S1 · banyak lowongan cocok untuk dijadikan target"),
    ("hr@konveksimakmur.id", "employer", "Konveksi Makmur Jaya",
     "Lowongan desain grafis & 3D · pelamar terperingkat · peta skill"),
    ("hr@kliniksehat.id", "employer", "Klinik Sehat Keluarga",
     "Pelamar terperingkat · peta skill · tolak dengan alasan · Asisten HR"),
    ("hr@kelontongmakmur.id", "employer", "Toko Kelontong Makmur Jaya",
     "Satu kandidat sudah diterima · konfirmasi skill setelah wawancara"),
    ("hr@warungbahari.id", "employer", "Warung Makan Bahari Nusantara",
     "Usaha kecil dengan dua lowongan aktif"),
]

DEMO_EMAILS = {email for email, *_ in DEMO_ACCOUNTS}
