<div align="center">

# KerjaCerdas — Frontend (Seeker & Employer Dashboard)

## 🚀 Tech Stack
- **Framework**: React 18 + Vite (for ultra-fast development)
- **Styling**: Tailwind CSS (Utility-first styling)
- **State Management**: Zustand (Lightweight, performant)
- **Animations**: Framer Motion (Smooth micro-interactions)
- **Icons**: Lucide React

## ✨ Key Components
- **`AuthModal.jsx`**: Seamless login/register experience for Seeker & Employer.
- **`SeekerDashboard.jsx`**: The main demo dashboard featuring Job Matching and Skill Gap visualization.
- **`EmployerDashboard.jsx`**: Dashboard for HR to post jobs and view AI-ranked candidates.
- **`FloatingAdvisor.jsx`**: The AI Advisor chat interface.

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

## 🎯 Design Highlights

- **Explainable match visuals** — job cards show a per-factor score breakdown instead of a single opaque ranking number.
- **Verification badges** — visual indicators on seeker/employer cards for completed identity checks (currently backed by demo-mode verification — see [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)).
- **Floating AI Advisor** — a persistent chat widget available across the authenticated app for conversational job search and career questions.

See [`docs/PRODUCT_FEATURES.md`](../docs/PRODUCT_FEATURES.md) for full feature descriptions and [`docs/PRODUCT_OVERVIEW.md`](../docs/PRODUCT_OVERVIEW.md) for the problem this UI is designed around.
</div>
