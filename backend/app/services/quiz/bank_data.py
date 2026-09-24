"""Starter skill-quiz question bank (DRAFT — pending human review).

Scenario-based multiple choice, Bahasa Indonesia, graded by answer key only
(no AI call per attempt). Every item is seeded with `reviewed=False`: before
public launch an HR practitioner / teacher must review each question (a
budgeted one-time "quiz bank review" cost). Six items per skill;
each quiz draws 5 at random, so the bank must grow to ~30 per skill before
leaked questions stop mattering.

Row format: (skill_key, skill_label, question, [option A..D], correct_index)
skill_key must equal services.matching.evidence.skill_key(label).
"""

from __future__ import annotations

BANK: list[tuple[str, str, str, list[str], int]] = [
    # ── Excel dasar ─────────────────────────────────────────────────────────
    ("excel", "Excel", "Kolom B2:B20 berisi total penjualan harian. Rumus untuk menjumlahkan semuanya adalah…", ["=SUM(B2:B20)", "=COUNT(B2:B20)", "=TOTAL(B2-B20)", "=ADD(B2,B20)"], 0),
    ("excel", "Excel", "Kamu ingin menghitung berapa sel di C2:C50 yang berisi kata \"Lunas\". Fungsi yang tepat…", ["=SUMIF(C2:C50,\"Lunas\")", "=COUNTIF(C2:C50,\"Lunas\")", "=IF(C2:C50=\"Lunas\")", "=VLOOKUP(\"Lunas\",C2:C50)"], 1),
    ("excel", "Excel", "Rumus =A2*B2 disalin ke baris 3 menjadi =A3*B3. Agar B2 tidak ikut berubah, tulis…", ["=A2*B2!", "=A2*$B$2", "=A2*(B2)", "=A2*#B2"], 1),
    ("excel", "Excel", "Kamu perlu mengambil harga barang dari tabel master berdasarkan kode barang. Fungsi yang paling tepat…", ["CONCAT", "VLOOKUP / XLOOKUP", "ROUND", "TODAY"], 1),
    ("excel", "Excel", "Data 500 baris perlu dilihat hanya untuk kota \"Bekasi\" tanpa menghapus data lain. Langkah tercepat…", ["Hapus baris selain Bekasi", "Gunakan fitur Filter", "Ketik ulang data Bekasi", "Ubah warna font"], 1),
    ("excel", "Excel", "Hasil =C2/D2 menampilkan #DIV/0!. Artinya…", ["Rumus salah ketik", "D2 bernilai 0 atau kosong", "Angka terlalu besar", "Sel dikunci"], 1),
    # ── Customer service ────────────────────────────────────────────────────
    ("customer service", "Customer Service", "Pelanggan marah karena pesanannya terlambat. Langkah pertama yang paling tepat…", ["Menjelaskan bahwa itu bukan salahmu", "Mendengarkan, lalu meminta maaf atas ketidaknyamanannya", "Langsung menawarkan diskon besar", "Mengalihkan ke atasan tanpa bicara"], 1),
    ("customer service", "Customer Service", "Pelanggan bertanya hal yang kamu belum tahu jawabannya. Sebaiknya…", ["Menebak jawaban agar cepat", "Bilang \"tidak tahu\" lalu diam", "Sampaikan akan dicek, catat, dan beri kabar dengan batas waktu jelas", "Minta pelanggan cari sendiri di internet"], 2),
    ("customer service", "Customer Service", "Chat pelanggan masuk saat jam ramai dan belum bisa dijawab lengkap. Respons terbaik…", ["Abaikan sampai sepi", "Balas singkat: pesan diterima dan perkiraan waktu jawaban", "Tutup chat", "Balas dengan stiker saja"], 1),
    ("customer service", "Customer Service", "Keluhan sama muncul dari banyak pelanggan minggu ini. Tindakan paling berguna…", ["Menjawab satu per satu tanpa mencatat", "Mencatat pola keluhan dan melapor ke tim terkait", "Menghapus ulasan buruk", "Menyalahkan kurir"], 1),
    ("customer service", "Customer Service", "Pelanggan meminta refund di luar kebijakan toko. Jawaban yang tepat…", ["Menolak dengan kasar", "Menyetujui saja agar cepat selesai", "Jelaskan kebijakan dengan sopan dan tawarkan alternatif yang diizinkan", "Tidak membalas"], 2),
    ("customer service", "Customer Service", "Kalimat pembuka yang paling profesional saat menerima telepon…", ["\"Ya, kenapa?\"", "\"Halo, dengan KerjaCerdas Store, saya Rina. Ada yang bisa dibantu?\"", "\"Siapa ini?\"", "\"Tunggu sebentar\" lalu ditinggal"], 1),
    # ── Komunikasi ──────────────────────────────────────────────────────────
    ("komunikasi", "Komunikasi", "Atasan memberi instruksi yang kurang jelas. Sikap terbaik…", ["Mengerjakan sesuai tebakan", "Mengulang poin instruksi dan menanyakan bagian yang belum jelas", "Menunggu ditegur", "Bertanya ke teman saja"], 1),
    ("komunikasi", "Komunikasi", "Kamu harus menyampaikan kabar keterlambatan proyek ke klien. Cara terbaik…", ["Tidak memberi tahu sampai ditanya", "Sampaikan lebih awal, jelaskan sebab dan rencana penyelesaiannya", "Salahkan rekan kerja", "Kirim pesan tanpa detail"], 1),
    ("komunikasi", "Komunikasi", "Email ke atasan sebaiknya…", ["Panjang dan detail tanpa subjek", "Subjek jelas, isi singkat, poin penting di awal", "Pakai singkatan chat", "Tanpa salam dan penutup"], 1),
    ("komunikasi", "Komunikasi", "Rekan kerja mengkritik pekerjaanmu di rapat. Respons yang paling dewasa…", ["Membalas kritik dengan kritik", "Mendengarkan, bertanya contoh konkret, lalu menindaklanjuti", "Diam lalu mengeluh di belakang", "Keluar dari rapat"], 1),
    ("komunikasi", "Komunikasi", "Saat presentasi, audiens tampak bingung. Sebaiknya…", ["Mempercepat bicara", "Berhenti sejenak, tanyakan bagian yang belum jelas, beri contoh", "Mengabaikan", "Membaca slide lebih keras"], 1),
    ("komunikasi", "Komunikasi", "Mendengarkan aktif berarti…", ["Menunggu giliran bicara", "Fokus, tidak memotong, dan merangkum ulang maksud lawan bicara", "Sambil membalas chat", "Langsung memberi solusi"], 1),
    # ── Sales ───────────────────────────────────────────────────────────────
    ("sales", "Sales", "Calon pembeli bilang \"harganya mahal\". Respons awal yang tepat…", ["Langsung turunkan harga", "Tanyakan dibanding apa, lalu jelaskan manfaat yang relevan baginya", "Bilang produk lain lebih mahal", "Akhiri percakapan"], 1),
    ("sales", "Sales", "Sebelum menawarkan produk ke pelanggan baru, langkah paling penting…", ["Menjelaskan semua fitur", "Menggali kebutuhan pelanggan dengan pertanyaan", "Memberi diskon", "Membandingkan dengan kompetitor"], 1),
    ("sales", "Sales", "Target bulan ini 40 transaksi, sudah tercapai 25 di minggu ke-3. Tindakan terbaik…", ["Santai karena masih ada waktu", "Hitung sisa per hari dan fokus ke prospek yang paling siap membeli", "Minta target diturunkan", "Tunggu pelanggan datang"], 1),
    ("sales", "Sales", "Pelanggan lama tidak membeli lagi 3 bulan. Langkah yang baik…", ["Hapus dari daftar", "Hubungi untuk menanyakan kabar dan kebutuhan terbarunya", "Kirim promo tiap hari", "Tunggu dia kembali"], 1),
    ("sales", "Sales", "Follow-up setelah presentasi penjualan sebaiknya dilakukan…", ["Tidak perlu", "1-2 hari setelahnya dengan ringkasan dan langkah berikutnya", "Setelah sebulan", "Hanya jika pelanggan menghubungi"], 1),
    ("sales", "Sales", "Cross-selling artinya…", ["Menjual ke kota lain", "Menawarkan produk pelengkap yang relevan dengan pembelian pelanggan", "Menjual dengan harga lebih rendah", "Menjual lewat marketplace"], 1),
    # ── Bahasa Inggris dasar ────────────────────────────────────────────────
    ("bahasa inggris", "Bahasa Inggris", "\"Could you send me the invoice by Friday?\" artinya…", ["Kamu bisa kirim invoice hari Jumat?", "Bisakah kamu mengirim invoice paling lambat Jumat?", "Kamu mengirim invoice Jumat lalu", "Invoice sudah dikirim Jumat"], 1),
    ("bahasa inggris", "Bahasa Inggris", "Pilih kalimat yang benar…", ["She don't like coffee.", "She doesn't like coffee.", "She not like coffee.", "She doesn't likes coffee."], 1),
    ("bahasa inggris", "Bahasa Inggris", "Balasan yang sopan untuk \"Thank you for your help\"…", ["Okay.", "You're welcome.", "Yes, thank you.", "No problem, bye."], 1),
    ("bahasa inggris", "Bahasa Inggris", "\"The meeting has been postponed\" artinya rapat…", ["Dibatalkan permanen", "Ditunda", "Dipercepat", "Sudah selesai"], 1),
    ("bahasa inggris", "Bahasa Inggris", "Kata yang tepat: \"I have worked here ___ 2023.\"", ["for", "since", "at", "during"], 1),
    ("bahasa inggris", "Bahasa Inggris", "\"Please find attached the report\" biasanya ditulis di…", ["Pesan suara", "Email yang menyertakan lampiran laporan", "Poster", "Kontrak kerja"], 1),
    # ── Kasir ───────────────────────────────────────────────────────────────
    ("kasir", "Kasir", "Total belanja Rp87.500, pelanggan membayar Rp100.000. Kembaliannya…", ["Rp12.500", "Rp13.500", "Rp22.500", "Rp11.500"], 0),
    ("kasir", "Kasir", "Harga Rp60.000 diskon 15%. Yang dibayar pelanggan…", ["Rp45.000", "Rp51.000", "Rp54.000", "Rp9.000"], 1),
    ("kasir", "Kasir", "Di akhir shift uang di laci kurang Rp20.000 dari catatan. Tindakan yang benar…", ["Menutup dengan uang pribadi diam-diam", "Mencatat selisih dan melapor ke supervisor sesuai prosedur", "Mengubah catatan penjualan", "Mengabaikan"], 1),
    ("kasir", "Kasir", "Pelanggan membayar dengan QRIS tapi notifikasi belum masuk. Sebaiknya…", ["Langsung serahkan barang", "Cek status di aplikasi/mesin sampai transaksi berhasil sebelum menyerahkan barang", "Minta bayar dua kali", "Batalkan pesanan"], 1),
    ("kasir", "Kasir", "Uang kertas yang diterima terlihat mencurigakan (palsu). Langkah pertama…", ["Menerima saja", "Periksa ciri keaslian (dilihat, diraba, diterawang) dan minta pembayaran lain dengan sopan jika ragu", "Menuduh pelanggan", "Merobek uangnya"], 1),
    ("kasir", "Kasir", "Membeli 3 barang @Rp12.500 dan 2 barang @Rp7.000. Totalnya…", ["Rp51.500", "Rp37.500", "Rp44.500", "Rp52.500"], 0),
    # ── Administrasi ────────────────────────────────────────────────────────
    ("administrasi", "Administrasi", "Cara penamaan file yang paling memudahkan pencarian…", ["dokumen_baru_final_fix.docx", "2026-09_Invoice_PTMaju_No015.pdf", "scan1.pdf", "untitled.docx"], 1),
    ("administrasi", "Administrasi", "Ada 3 tugas: laporan diminta atasan hari ini, arsip rutin, dan rapat minggu depan. Urutan prioritas…", ["Arsip - rapat - laporan", "Laporan hari ini - arsip - persiapan rapat", "Rapat - arsip - laporan", "Kerjakan acak"], 1),
    ("administrasi", "Administrasi", "Surat masuk dari klien sebaiknya…", ["Ditumpuk di meja", "Dicatat di agenda surat masuk, diberi nomor, lalu diteruskan ke yang berwenang", "Langsung dibuang setelah dibaca", "Disimpan di tas"], 1),
    ("administrasi", "Administrasi", "Menjadwalkan rapat untuk 6 orang dari divisi berbeda, langkah efisien…", ["Telepon satu per satu setiap hari", "Cek kalender bersama, usulkan 2-3 pilihan waktu, kirim undangan resmi", "Tentukan sendiri tanpa konfirmasi", "Tunggu semua orang kosong"], 1),
    ("administrasi", "Administrasi", "Data karyawan (alamat, nomor HP) di spreadsheet sebaiknya…", ["Dibagikan ke grup umum", "Disimpan dengan akses terbatas hanya untuk yang berwenang", "Dicetak dan ditempel", "Dikirim ke email pribadi"], 1),
    ("administrasi", "Administrasi", "Notulen rapat yang baik minimal berisi…", ["Semua obrolan kata per kata", "Keputusan, tindak lanjut, penanggung jawab, dan tenggat", "Daftar hadir saja", "Opini penulis"], 1),
    # ── SQL dasar ───────────────────────────────────────────────────────────
    ("sql", "SQL", "Query untuk mengambil semua kolom dari tabel orders…", ["GET * FROM orders", "SELECT * FROM orders", "SHOW orders ALL", "FETCH orders"], 1),
    ("sql", "SQL", "Menampilkan pelanggan dari kota 'Bandung' saja…", ["SELECT * FROM customers WHERE city = 'Bandung'", "SELECT * FROM customers IF city = 'Bandung'", "SELECT city = 'Bandung' FROM customers", "FILTER customers BY 'Bandung'"], 0),
    ("sql", "SQL", "Menghitung jumlah transaksi per kota…", ["SELECT city, COUNT(*) FROM orders GROUP BY city", "SELECT COUNT(city) FROM orders", "SELECT city FROM orders ORDER BY COUNT", "SELECT SUM(city) FROM orders"], 0),
    ("sql", "SQL", "Mengurutkan produk dari harga termahal…", ["ORDER BY price ASC", "ORDER BY price DESC", "SORT price HIGH", "GROUP BY price"], 1),
    ("sql", "SQL", "Menggabungkan tabel orders dan customers berdasarkan customer_id memakai…", ["UNION", "JOIN ... ON orders.customer_id = customers.id", "MERGE ALL", "CONCAT"], 1),
    ("sql", "SQL", "Filter hasil agregasi (misal kota dengan > 100 transaksi) memakai…", ["WHERE COUNT(*) > 100", "HAVING COUNT(*) > 100", "LIMIT 100", "ORDER BY 100"], 1),
]
