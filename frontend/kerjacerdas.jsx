import { useState, useRef, useEffect } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_JOBS = [
    { job_id: "job-001", title: "Data Analyst", company: "Bank Mandiri", region: "Jakarta Pusat", salary_min: 8000000, salary_max: 15000000, required_skills: ["Python", "SQL", "Excel", "Tableau", "Statistics"], education_min: "S1", experience_min: 1, match_score: 0.91, skill_overlap: 0.80, explanation: "Kecocokan tinggi: 4/5 skill sesuai, lokasi Jakarta cocok", logo: "🏦" },
    { job_id: "job-002", title: "Machine Learning Engineer", company: "Gojek", region: "Jakarta Selatan", salary_min: 15000000, salary_max: 30000000, required_skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Docker"], education_min: "S1", experience_min: 2, match_score: 0.84, skill_overlap: 0.60, explanation: "Kecocokan baik: skill Python dan SQL sesuai, perlu belajar PyTorch", logo: "🚀" },
    { job_id: "job-003", title: "BI Analyst", company: "Tokopedia", region: "Jakarta Barat", salary_min: 10000000, salary_max: 18000000, required_skills: ["SQL", "Python", "Tableau", "Business Analysis"], education_min: "S1", experience_min: 1, match_score: 0.79, skill_overlap: 0.75, explanation: "Cocok untuk karier BI: skill analitik kuat, tambah business analysis", logo: "🛒" },
    { job_id: "job-004", title: "Data Engineer", company: "Traveloka", region: "Jakarta Selatan", salary_min: 12000000, salary_max: 22000000, required_skills: ["Python", "SQL", "Spark", "Kafka", "Airflow"], education_min: "S1", experience_min: 2, match_score: 0.72, skill_overlap: 0.40, explanation: "Potensi besar: Python sesuai, perlu belajar ekosistem big data", logo: "✈️" },
    { job_id: "job-005", title: "Backend Engineer", company: "Bukalapak", region: "Jakarta Selatan", salary_min: 10000000, salary_max: 20000000, required_skills: ["Python", "Go", "PostgreSQL", "Redis", "Docker"], education_min: "S1", experience_min: 1, match_score: 0.68, skill_overlap: 0.40, explanation: "Python backend cocok, perlu tambah Go dan infrastructure", logo: "🛍️" },
    { job_id: "job-006", title: "Data Scientist", company: "OVO", region: "Jakarta Selatan", salary_min: 13000000, salary_max: 25000000, required_skills: ["Python", "Statistics", "ML", "SQL", "R"], education_min: "S2", experience_min: 2, match_score: 0.65, skill_overlap: 0.60, explanation: "Perlu S2 dan pengalaman ML lebih dalam", logo: "💳" },
];

const SKILL_GAP_DATA = {
    "job-001": { matching: ["Python", "SQL", "Excel"], missing: ["Tableau", "Statistics"], severity: "low", courses: [{ name: "Tableau untuk Analisis Data", provider: "Coursera", duration: "1 bulan" }, { name: "Statistika Dasar", provider: "Dicoding", duration: "1 bulan" }], months: 2 },
    "job-002": { matching: ["Python", "SQL"], missing: ["TensorFlow", "PyTorch", "Docker"], severity: "high", courses: [{ name: "Deep Learning Specialization", provider: "Coursera", duration: "3 bulan" }, { name: "Docker Fundamentals", provider: "Dicoding", duration: "1 bulan" }], months: 4 },
    "job-003": { matching: ["SQL", "Python", "Tableau"], missing: ["Business Analysis"], severity: "low", courses: [{ name: "Business Analysis Fundamentals", provider: "Skill Academy", duration: "1 bulan" }], months: 1 },
    "job-004": { matching: ["Python", "SQL"], missing: ["Spark", "Kafka", "Airflow"], severity: "high", courses: [{ name: "Apache Spark dengan Python", provider: "Coursera", duration: "2 bulan" }, { name: "Data Pipeline with Airflow", provider: "Udemy", duration: "2 bulan" }], months: 4 },
    "job-005": { matching: ["Python", "PostgreSQL"], missing: ["Go", "Redis", "Docker"], severity: "medium", courses: [{ name: "Pemrograman Go", provider: "Dicoding", duration: "2 bulan" }, { name: "Docker & Container", provider: "Dicoding", duration: "1 bulan" }], months: 3 },
    "job-006": { matching: ["Python", "SQL", "Statistics"], missing: ["ML Advanced", "R"], severity: "medium", courses: [{ name: "Machine Learning A-Z", provider: "Coursera", duration: "2 bulan" }], months: 2 },
};

const ADVISOR_RESPONSES = [
    "Berdasarkan profil kamu, saya rekomendasikan untuk fokus ke karier **Data Analyst** dulu sebagai batu loncatan. Skill Python dan SQL kamu sudah solid — ini fondasi yang sangat berharga. \n\nLangkah konkretnya: tambahkan Tableau atau Power BI (2-4 minggu belajar) dan ikuti proyek portfolio di Kaggle. Ini akan membuat CV kamu jauh lebih menarik bagi rekruter.\n\nSetelah 1-2 tahun sebagai Data Analyst, kamu bisa pivot ke Machine Learning Engineer dengan pengalaman domain yang kuat. Jalur ini lebih efektif daripada langsung melamar ML Engineer tanpa pengalaman industri.",
    "Pertanyaan bagus! Untuk fresh graduate di Indonesia tahun 2026, peluang terbaik ada di sektor **fintech dan e-commerce** — kedua industri ini aktif merekrut data talent dan memberikan gaji kompetitif.\n\nBank digital seperti SeaBank, Blu, dan Jago juga sedang ekspansi besar-besaran. Mereka sering lebih terbuka terhadap kandidat dengan skill ML dibanding bank konvensional.\n\nTips salary negotiation: riset benchmark gaji di Glassdoor dan LinkedIn sebelum interview. Data Analyst junior di Jakarta range Rp 7-12 juta adalah angka wajar.",
    "Untuk meningkatkan peluang lolos screening ATS (Applicant Tracking System), pastikan CV kamu menggunakan **keyword yang sama** dengan job description. Ini sangat penting karena banyak perusahaan besar menggunakan ATS yang menyaring CV otomatis.\n\nFormat CV: 1 halaman untuk fresh graduate, 2 halaman untuk pengalaman 3+ tahun. Gunakan bullet points dengan angka konkret: 'Meningkatkan efisiensi query SQL sebesar 40%' lebih kuat dari 'Mengerjakan analisis data'.\n\nPortfolio GitHub aktif adalah differentiator besar — banyak kandidat data tidak punya ini.",
];

const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Color system ─────────────────────────────────────────────────────────────
const C = {
    bg: "#060d14",
    card: "#0c1824",
    cardBorder: "#1a2d42",
    accent: "#00c2ff",
    accent2: "#0066ff",
    green: "#00e57a",
    yellow: "#ffc340",
    red: "#ff5e5e",
    text: "#e2eaf3",
    muted: "#4d6680",
    surface: "#0f1f30",
};

const scoreColor = (s) => s >= 0.85 ? C.green : s >= 0.70 ? C.yellow : C.red;
const severityColor = (s) => s === "low" ? C.green : s === "medium" ? C.yellow : C.red;

export default function KerjaCerdas() {
    const [tab, setTab] = useState("home");
    const [profile, setProfile] = useState({ name: "Budi Santoso", skills: ["Python", "SQL", "Excel"], experience: 1, education: "S1 Informatika", region: "Jakarta", salary: 12000000 });
    const [searching, setSearching] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [skillGap, setSkillGap] = useState(null);
    const [loadingGap, setLoadingGap] = useState(false);
    const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "Halo! Saya adalah asisten karier AI kamu. Mau tanya apa hari ini tentang karier atau pencarian kerja?" }]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [advisorIdx, setAdvisorIdx] = useState(0);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

    const handleSearch = async () => {
        setSearching(true);
        setJobs([]);
        await sleep(1800);
        setJobs(MOCK_JOBS);
        setSearching(false);
        setTab("results");
    };

    const handleSelectJob = async (job) => {
        setSelectedJob(job);
        setSkillGap(null);
        setLoadingGap(true);
        await sleep(1200);
        setSkillGap(SKILL_GAP_DATA[job.job_id]);
        setLoadingGap(false);
        setTab("detail");
    };

    const handleChat = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setChatInput("");
        setChatMessages(m => [...m, { role: "user", content: userMsg }]);
        setChatLoading(true);
        await sleep(1500);
        setChatMessages(m => [...m, { role: "assistant", content: ADVISOR_RESPONSES[advisorIdx % ADVISOR_RESPONSES.length] }]);
        setAdvisorIdx(i => i + 1);
        setChatLoading(false);
    };

    const skillTags = (skills, matched = [], missing = []) => skills.map(s => {
        const isMatch = matched.map(x => x.toLowerCase()).includes(s.toLowerCase());
        const isMiss = missing.map(x => x.toLowerCase()).includes(s.toLowerCase());
        return (
            <span key={s} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontFamily: "monospace", border: "1px solid", borderColor: isMiss ? C.red : isMatch ? C.green : C.cardBorder, color: isMiss ? C.red : isMatch ? C.green : C.muted, background: isMiss ? "rgba(255,94,94,0.08)" : isMatch ? "rgba(0,229,122,0.08)" : "transparent" }}>
                {isMiss ? "✗ " : isMatch ? "✓ " : ""}{s}
            </span>
        );
    });

    return (
        <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.text, maxWidth: "1100px", margin: "0 auto", padding: "0 1rem" }}>

            {/* Navbar */}
            <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0", borderBottom: `1px solid ${C.cardBorder}`, marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>⚡</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>KerjaCerdas</div>
                        <div style={{ fontSize: "0.62rem", color: C.muted, letterSpacing: "0.08em" }}>AI JOB MATCHING · INDONESIA</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                    {["home", "results", "advisor"].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ padding: "0.4rem 1rem", borderRadius: 6, border: "1px solid", borderColor: tab === t ? C.accent : C.cardBorder, background: tab === t ? `rgba(0,194,255,0.1)` : "transparent", color: tab === t ? C.accent : C.muted, cursor: "pointer", fontSize: "0.78rem", transition: "all 0.15s" }}>
                            {t === "home" ? "🔍 Cari Kerja" : t === "results" ? "📋 Hasil" : "🤖 Advisor AI"}
                        </button>
                    ))}
                </div>
            </nav>

            {/* HOME TAB */}
            {tab === "home" && (
                <div>
                    {/* Hero */}
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem 2rem", position: "relative" }}>
                        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "400px", height: "200px", background: `radial-gradient(ellipse, rgba(0,194,255,0.06) 0%, transparent 70%)`, pointerEvents: "none" }} />
                        <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, border: `1px solid rgba(0,194,255,0.3)`, background: "rgba(0,194,255,0.06)", fontSize: "0.7rem", color: C.accent, letterSpacing: "0.1em", marginBottom: "1rem" }}>
                            ✦ HACKATHON 2026 · DIGDAYA × OJK
                        </div>
                        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.04em", margin: "0 0 0.75rem" }}>
                            Temukan Pekerjaan Impian<br />
                            <span style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dengan Kecerdasan Buatan</span>
                        </h1>
                        <p style={{ color: C.muted, maxWidth: 480, margin: "0 auto 2rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
                            AI kami menganalisis 50,000+ lowongan untuk menemukan pekerjaan yang paling cocok dengan skill dan tujuan karier kamu di seluruh Indonesia.
                        </p>
                    </div>

                    {/* Profile Form */}
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: "1.75rem", maxWidth: 680, margin: "0 auto" }}>
                        <div style={{ fontSize: "0.72rem", color: C.muted, letterSpacing: "0.1em", marginBottom: "1.25rem" }}>PROFIL PENCARI KERJA</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                            {[
                                { label: "Nama Lengkap", key: "name", type: "text" },
                                { label: "Pendidikan", key: "education", type: "text" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: "0.72rem", color: C.muted, display: "block", marginBottom: 4 }}>{f.label}</label>
                                    <input value={profile[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: "0.5rem 0.75rem", color: C.text, fontSize: "0.85rem", boxSizing: "border-box" }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: "0.72rem", color: C.muted, display: "block", marginBottom: 4 }}>Pengalaman Kerja</label>
                                <select value={profile.experience} onChange={e => setProfile({ ...profile, experience: +e.target.value })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: "0.5rem 0.75rem", color: C.text, fontSize: "0.85rem" }}>
                                    {[0, 1, 2, 3, 5].map(y => <option key={y} value={y}>{y === 0 ? "Fresh Graduate" : `${y} tahun`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.72rem", color: C.muted, display: "block", marginBottom: 4 }}>Ekspektasi Gaji</label>
                                <select value={profile.salary} onChange={e => setProfile({ ...profile, salary: +e.target.value })} style={{ width: "100%", background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 6, padding: "0.5rem 0.75rem", color: C.text, fontSize: "0.85rem" }}>
                                    {[5000000, 8000000, 12000000, 15000000, 20000000].map(s => <option key={s} value={s}>{fmt(s)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.72rem", color: C.muted, display: "block", marginBottom: "0.5rem" }}>Skills Kamu</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {["Python", "SQL", "Excel", "Tableau", "JavaScript", "React", "Java", "Docker", "Statistics", "Machine Learning"].map(skill => {
                                    const active = profile.skills.includes(skill);
                                    return (
                                        <button key={skill} onClick={() => setProfile(p => ({ ...p, skills: active ? p.skills.filter(s => s !== skill) : [...p.skills, skill] }))} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid", borderColor: active ? C.accent : C.cardBorder, background: active ? `rgba(0,194,255,0.12)` : "transparent", color: active ? C.accent : C.muted, cursor: "pointer", fontSize: "0.75rem", transition: "all 0.15s" }}>
                                            {active ? "✓ " : ""}{skill}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={handleSearch} disabled={searching} style={{ width: "100%", padding: "0.85rem", borderRadius: 8, border: "none", background: searching ? C.surface : `linear-gradient(90deg, ${C.accent2}, ${C.accent})`, color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: searching ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                            {searching ? (
                                <span>
                                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>
                                    {" "} AI sedang menganalisis 50,000+ lowongan...
                                </span>
                            ) : "⚡ Temukan Pekerjaan dengan AI"}
                        </button>
                    </div>

                    {/* Stats bar */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "3rem", padding: "2rem 0", marginTop: "1rem" }}>
                        {[["50,000+", "Lowongan Aktif"], ["34", "Provinsi"], ["87%", "Akurasi Matching"], ["140ms", "Rata-rata Respons"]].map(([n, l]) => (
                            <div key={l} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: C.accent, fontVariantNumeric: "tabular-nums" }}>{n}</div>
                                <div style={{ fontSize: "0.68rem", color: C.muted }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESULTS TAB */}
            {tab === "results" && (
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Hasil Matching untuk {profile.name}</h2>
                            <p style={{ margin: "0.25rem 0 0", color: C.muted, fontSize: "0.78rem" }}>Ditemukan {jobs.length} lowongan · Skills: {profile.skills.join(", ")}</p>
                        </div>
                        <button onClick={() => setTab("home")} style={{ padding: "0.4rem 1rem", borderRadius: 6, border: `1px solid ${C.cardBorder}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: "0.78rem" }}>← Ubah Profil</button>
                    </div>

                    {jobs.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem", color: C.muted }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
                            Belum ada hasil. Coba cari dulu dari halaman beranda.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {jobs.map((job, idx) => (
                                <div key={job.job_id} onClick={() => handleSelectJob(job)} style={{ background: C.card, border: `1px solid ${idx === 0 ? "rgba(0,229,122,0.3)" : C.cardBorder}`, borderRadius: 10, padding: "1.25rem 1.5rem", cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
                                    {idx === 0 && <div style={{ position: "absolute", top: "0.75rem", right: "1rem", background: "rgba(0,229,122,0.15)", border: "1px solid rgba(0,229,122,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: "0.62rem", color: C.green, letterSpacing: "0.1em" }}>★ TOP MATCH</div>}
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surface, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{job.logo}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                                                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>{job.title}</h3>
                                                <span style={{ color: C.muted, fontSize: "0.8rem" }}>· {job.company}</span>
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: C.muted, margin: "0.25rem 0 0.6rem" }}>📍 {job.region} · {fmt(job.salary_min)}–{fmt(job.salary_max)} · Min. {job.education_min}</div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{skillTags(job.required_skills)}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: scoreColor(job.match_score), fontVariantNumeric: "tabular-nums" }}>{Math.round(job.match_score * 100)}%</div>
                                            <div style={{ fontSize: "0.6rem", color: C.muted }}>MATCH</div>
                                            <div style={{ marginTop: "0.5rem" }}>
                                                <div style={{ width: 60, height: 4, background: C.surface, borderRadius: 2 }}>
                                                    <div style={{ width: `${job.skill_overlap * 100}%`, height: "100%", background: scoreColor(job.skill_overlap), borderRadius: 2 }} />
                                                </div>
                                                <div style={{ fontSize: "0.6rem", color: C.muted, marginTop: 2 }}>{Math.round(job.skill_overlap * 100)}% skill</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>💡 {job.explanation}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* DETAIL TAB */}
            {tab === "detail" && selectedJob && (
                <div>
                    <button onClick={() => setTab("results")} style={{ padding: "0.4rem 1rem", borderRadius: 6, border: `1px solid ${C.cardBorder}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: "0.78rem", marginBottom: "1.25rem" }}>← Kembali ke Hasil</button>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        {/* Job Details */}
                        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "1.5rem" }}>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                                <div style={{ width: 50, height: 50, borderRadius: 12, background: C.surface, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{selectedJob.logo}</div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{selectedJob.title}</h2>
                                    <div style={{ color: C.muted, fontSize: "0.8rem" }}>{selectedJob.company} · {selectedJob.region}</div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                                {[["💰 Gaji", `${fmt(selectedJob.salary_min)}–${fmt(selectedJob.salary_max)}`], ["🎓 Pendidikan", selectedJob.education_min], ["💼 Pengalaman", `${selectedJob.experience_min}+ tahun`], ["🤖 Match Score", `${Math.round(selectedJob.match_score * 100)}%`]].map(([l, v]) => (
                                    <div key={l} style={{ background: C.surface, borderRadius: 8, padding: "0.75rem" }}>
                                        <div style={{ fontSize: "0.65rem", color: C.muted }}>{l}</div>
                                        <div style={{ fontSize: "0.88rem", fontWeight: 600, marginTop: 2 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: C.muted, marginBottom: "0.5rem" }}>SKILLS YANG DIBUTUHKAN</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {skillGap ? skillTags(selectedJob.required_skills, skillGap.matching, skillGap.missing) : skillTags(selectedJob.required_skills)}
                            </div>
                        </div>

                        {/* Skill Gap */}
                        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "1.5rem" }}>
                            <div style={{ fontSize: "0.72rem", color: C.muted, letterSpacing: "0.1em", marginBottom: "1rem" }}>ANALISIS SKILL GAP</div>
                            {loadingGap ? (
                                <div style={{ textAlign: "center", padding: "2rem", color: C.muted }}>
                                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔄</div>
                                    AI menganalisis skill gap...
                                </div>
                            ) : skillGap ? (
                                <div>
                                    {/* Severity badge */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                        <div style={{ flex: 1, height: 6, background: C.surface, borderRadius: 3 }}>
                                            <div style={{ width: `${(skillGap.matching.length / selectedJob.required_skills.length) * 100}%`, height: "100%", background: severityColor(skillGap.severity), borderRadius: 3 }} />
                                        </div>
                                        <span style={{ fontSize: "0.72rem", color: severityColor(skillGap.severity), border: "1px solid", borderColor: severityColor(skillGap.severity), borderRadius: 20, padding: "2px 10px" }}>
                                            {skillGap.severity === "low" ? "Gap Kecil" : skillGap.severity === "medium" ? "Gap Sedang" : "Gap Besar"}
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                        <div style={{ background: "rgba(0,229,122,0.06)", border: "1px solid rgba(0,229,122,0.2)", borderRadius: 8, padding: "0.75rem" }}>
                                            <div style={{ fontSize: "0.65rem", color: C.green, marginBottom: 4 }}>✓ SKILL KAMU</div>
                                            {skillGap.matching.map(s => <div key={s} style={{ fontSize: "0.78rem", color: C.green }}>• {s}</div>)}
                                        </div>
                                        <div style={{ background: "rgba(255,94,94,0.06)", border: "1px solid rgba(255,94,94,0.2)", borderRadius: 8, padding: "0.75rem" }}>
                                            <div style={{ fontSize: "0.65rem", color: C.red, marginBottom: 4 }}>✗ PERLU DIPELAJARI</div>
                                            {skillGap.missing.map(s => <div key={s} style={{ fontSize: "0.78rem", color: C.red }}>• {s}</div>)}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: "0.72rem", color: C.muted, marginBottom: "0.6rem" }}>📚 REKOMENDASI KURSUS</div>
                                    {skillGap.courses.map((c, i) => (
                                        <div key={i} style={{ background: C.surface, borderRadius: 8, padding: "0.6rem 0.75rem", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{c.name}</div>
                                                <div style={{ fontSize: "0.65rem", color: C.muted }}>{c.provider}</div>
                                            </div>
                                            <span style={{ fontSize: "0.65rem", color: C.accent, background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)", borderRadius: 20, padding: "2px 8px" }}>{c.duration}</span>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.75rem", background: "rgba(0,194,255,0.06)", border: "1px solid rgba(0,194,255,0.15)", borderRadius: 8, fontSize: "0.78rem", color: C.accent }}>
                                        ⏱ Estimasi siap melamar: <strong>{skillGap.months} bulan</strong>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                        <button onClick={() => setTab("advisor")} style={{ padding: "0.75rem 2rem", borderRadius: 8, border: "none", background: `linear-gradient(90deg, ${C.accent2}, ${C.accent})`, color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                            💬 Diskusi dengan AI Advisor tentang Lowongan Ini
                        </button>
                    </div>
                </div>
            )}

            {/* ADVISOR TAB */}
            {tab === "advisor" && (
                <div style={{ maxWidth: 680, margin: "0 auto" }}>
                    <div style={{ marginBottom: "1rem" }}>
                        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>🤖 Asisten Karier AI</h2>
                        <p style={{ margin: "0.25rem 0 0", color: C.muted, fontSize: "0.78rem" }}>Powered by Google Gemini · Bahasa Indonesia · Konteks pasar kerja Indonesia</p>
                    </div>

                    {/* Chat area */}
                    <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, height: "420px", overflowY: "auto", padding: "1.25rem", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.75rem", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: msg.role === "user" ? `linear-gradient(135deg, ${C.accent2}, ${C.accent})` : C.surface, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>
                                    {msg.role === "user" ? "👤" : "🤖"}
                                </div>
                                <div style={{ maxWidth: "75%", background: msg.role === "user" ? `rgba(0,102,255,0.15)` : C.surface, border: `1px solid ${msg.role === "user" ? "rgba(0,102,255,0.3)" : C.cardBorder}`, borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.83rem", lineHeight: 1.7 }}>
                                    {msg.content.split("\n").map((line, j) => (
                                        <div key={j} style={{ marginBottom: line === "" ? "0.5rem" : 0 }}>
                                            {line.replace(/\*\*(.*?)\*\*/g, "").includes("**") ? line : line.split("**").map((part, k) => k % 2 === 1 ? <strong key={k} style={{ color: C.accent }}>{part}</strong> : part)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surface, border: `1px solid ${C.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                                <div style={{ background: C.surface, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: "0.75rem 1rem", display: "flex", gap: 4 }}>
                                    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Suggestion chips */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {["Karier apa yang cocok untuk saya?", "Bagaimana cara naik gaji?", "Tips CV untuk Data Analyst?"].map(s => (
                            <button key={s} onClick={() => setChatInput(s)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${C.cardBorder}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: "0.72rem" }}>
                                {s}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChat()} placeholder="Tanya tentang karier, skill, atau lowongan kerja..." style={{ flex: 1, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: "0.75rem 1rem", color: C.text, fontSize: "0.85rem" }} />
                        <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} style={{ padding: "0.75rem 1.25rem", borderRadius: 8, border: "none", background: `linear-gradient(90deg, ${C.accent2}, ${C.accent})`, color: "white", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", opacity: chatLoading || !chatInput.trim() ? 0.5 : 1, fontWeight: 700, fontSize: "0.85rem" }}>
                            Kirim ↑
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", padding: "2rem 0 1rem", fontSize: "0.65rem", color: C.muted, borderTop: `1px solid ${C.cardBorder}`, marginTop: "2rem" }}>
                KERJACERDAS v0.1 · HACKATHON DEMO · BUILT ON ANTIGRAVITY PROTOCOL · AI/ML TRACK
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        * { box-sizing: border-box; }
        input, select, button { outline: none; }
        input:focus, select:focus { border-color: #00c2ff !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2d42; border-radius: 2px; }
      `}</style>
        </div>
    );
}