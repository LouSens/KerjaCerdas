<div align="center">

# KerjaCerdas — Frontend (Seeker & Employer Dashboard)

*Hackathon x Digdaya 2026 Submission*

## 🚀 Tech Stack
- **Framework**: React 18 + Vite (for ultra-fast development)
- **Styling**: Tailwind CSS (Utility-first styling)
- **State Management**: Zustand (Lightweight, performant)
- **Animations**: Framer Motion (Smooth micro-interactions)
- **Icons**: Lucide React

## ✨ Key Components
- **`AuthModal.jsx`**: Seamless login/register experience.
- **`Footer.jsx`**: Persistent navigation and branding.
- **`kerjacerdas.jsx`**: The main demo dashboard featuring Job Matching, Skill Gap visualizations, and the AI Advisor chat interface.

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

## 📂 Structure
- `src/components/`: Reusable UI components.
- `src/store/`: Zustand global state definitions.
- `public/`: Static assets (logos, images).
- `tailwind.config.js`: Custom theme for the KerjaCerdas brand.

---

## 🏆 Hackathon Judging Criteria

### Alignment with Problem Statement
KerjaCerdas merespons langsung tantangan **triple mismatch** di Indonesia: kesenjangan keahlian, ketidakcocokan pencarian berbasis kata kunci konvensional, dan kurangnya kepercayaan kredensial (terutama bagi lulusan non-PTN top). UI frontend kami dirancang untuk memecahkan asimetri informasi ini melalui Dashboard Pencari Kerja yang interaktif, menampilkan persentase kecocokan semantik secara *real-time* dan AI Career Advisor lokal berbahasa Indonesia.

### Technical Quality
Secara teknis, platform ini dibangun menggunakan **React 18 + Vite** untuk performa *rendering* super cepat, dipadukan dengan **FastAPI dan LangGraph** di sisi backend. Inovasi arsitektur terlihat dari penggunaan *state management* yang efisien (Zustand), serta degradasi visual yang mulus (*graceful degradation*) jika API AI tidak tersedia. MVP ini siap pakai dan dapat langsung memproses upload CV PDF nyata menjadi *insight* berbasis *semantic vector*.

### 2. Effectiveness & Impact
**Target**: Memfasilitasi penurunan waktu rekrutmen untuk HR dari 45 hari menjadi di bawah 15 hari [ESTIMATE] melalui **"Top 5 Kandidat"** UI. Untuk *seeker*, UI ini didesain agar mudah diakses, memberikan *lonjakan relevansi match* sebesar 4x lipat [ESTIMATE] yang terukur via *Match Score* visual.

### 3. Business Model Feasibility
**Integrasi B2B**: UI *Employer* didesain secara spesifik untuk memfasilitasi konversi *freemium* ke berbayar (Pay-Per-Post). Dengan harga terjangkau Rp 499rb [ESTIMATE], dashboard ini memperlihatkan secara *live* kandidat potensial bahkan sebelum HR membayar, menciptakan *FOMO* yang mendorong transaksi B2B secara langsung. *Revenue stream* lain seperti afiliasi kursus diintegrasikan langsung pada UI rekomendasi pelatihan.

### Uniqueness / Creativity
KerjaCerdas membedakan dirinya melalui:
1. **AI Semantic Ranking Visuals**: Menampilkan persentase kesesuaian komprehensif, bukan urutan pencarian kata kunci.
2. **Zero-Friction Verification Layer**: Elemen *badge* terverifikasi secara visual pada kartu pencari kerja yang mendobrak bias rekrutmen.
3. **Floating AI Advisor**: *Widget chat* persisten di seluruh antarmuka yang siap memberi konsultasi karier berbasis konteks pengguna saat itu juga.

### Market Needs
Validasi desain UI/UX berakar pada wawancara dengan puluhan HR Manager dan pencari kerja. Terdapat kebutuhan besar akan platform pencarian yang efisien, murah, dan adil. Frontend kami memadukan transparansi (menjelaskan *mengapa* AI merekomendasikan sebuah loker) dengan kepraktisan (hanya butuh klik *upload* CV untuk melihat semua analisis) sesuai preferensi pekerja Gen-Z dan Milenial Indonesia.

---
<div align="center">
*Built for Hackathon 2026*
</div>
