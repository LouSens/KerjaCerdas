import { useState } from 'react'
import {
    Building2, Plus, Search, Briefcase, Users, Eye, MapPin,
    Wallet, Clock, Pause, Play, Trash2, ChevronDown, ChevronUp,
    Sparkles, GraduationCap, Star, TrendingUp, FileText, Send
} from 'lucide-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'

/**
 * EmployerDashboard — Unified employer experience.
 * Includes: stats overview, post job form, manage listings, and candidate search.
 */

const REGIONS = [
    { code: '3171', name: 'Jakarta Pusat' },
    { code: '3172', name: 'Jakarta Utara' },
    { code: '3173', name: 'Jakarta Barat' },
    { code: '3174', name: 'Jakarta Selatan' },
    { code: '3175', name: 'Jakarta Timur' },
    { code: '3273', name: 'Bandung' },
    { code: '3374', name: 'Semarang' },
    { code: '3578', name: 'Surabaya' },
    { code: '3471', name: 'Yogyakarta' },
    { code: '1371', name: 'Padang' },
    { code: '1275', name: 'Medan' },
    { code: '7371', name: 'Makassar' },
    { code: '6471', name: 'Balikpapan' },
    { code: '5171', name: 'Denpasar' },
]

const POPULAR_SKILLS = [
    'Python', 'JavaScript', 'React', 'SQL', 'Java', 'Go', 'TypeScript',
    'Docker', 'Kubernetes', 'AWS', 'Machine Learning', 'Data Analysis',
    'Excel', 'Figma', 'Node.js', 'PostgreSQL', 'MongoDB', 'Flutter',
    'Project Management', 'Communication', 'Marketing', 'Sales',
]

const EDUCATION_LEVELS = [
    { value: 'SMA', label: 'SMA/SMK' },
    { value: 'D3', label: 'D3 (Diploma)' },
    { value: 'S1', label: 'S1 (Sarjana)' },
    { value: 'S2', label: 'S2 (Master)' },
    { value: 'S3', label: 'S3 (Doktor)' },
]

export default function EmployerDashboard() {
    const { user, postedJobs, postJob, removePostedJob, toggleJobStatus } = useStore()
    const [activeSection, setActiveSection] = useState('overview') // overview | post | manage | search
    const [expandedJob, setExpandedJob] = useState(null)

    /**
     * Computes summary statistics for the employer dashboard.
     */
    const stats = {
        totalJobs: postedJobs.length,
        activeJobs: postedJobs.filter(j => j.status === 'active').length,
        totalViews: postedJobs.reduce((acc, j) => acc + (j.views || 0), 0),
        totalApplicants: postedJobs.reduce((acc, j) => acc + (j.applicants || 0), 0),
    }

    const sections = [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'post', label: 'Pasang Lowongan', icon: Plus },
        { id: 'manage', label: 'Kelola Lowongan', icon: FileText, badge: stats.totalJobs },
        { id: 'search', label: 'Cari Kandidat', icon: Search },
    ]

    return (
        <div className="space-y-6 animate-fade-in text-ink">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 uppercase tracking-tight">
                        <Building2 className="w-8 h-8 text-brand-500 drop-shadow-sm" />
                        Dashboard Employer
                    </h2>
                    <p className="text-base font-semibold text-surface-500 mt-1">
                        Selamat datang, <span className="text-ink font-black">{user.name || 'Employer'}</span>
                    </p>
                </div>
                <button
                    onClick={() => setActiveSection('post')}
                    className="bg-brand-400 hover:bg-brand-500 text-ink font-black px-6 py-3 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_0px_#111827] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#111827] flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    PASANG LOWONGAN BARU
                </button>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                {sections.map(({ id, label, icon: Icon, badge }) => (
                    <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl border-2 transition-all font-bold text-sm shadow-sm ${
                            activeSection === id 
                                ? 'bg-ink text-surface-50 border-ink shadow-[4px_4px_0px_0px_#111827]' 
                                : 'bg-white text-surface-600 border-surface-200 hover:border-ink hover:text-ink'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border-2 ${
                                activeSection === id 
                                    ? 'bg-brand-400 text-ink border-ink' 
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                                {badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW ── */}
            {activeSection === 'overview' && <OverviewSection stats={stats} postedJobs={postedJobs} setActiveSection={setActiveSection} />}

            {/* ── POST JOB ── */}
            {activeSection === 'post' && <PostJobSection postJob={postJob} setActiveSection={setActiveSection} />}

            {/* ── MANAGE LISTINGS ── */}
            {activeSection === 'manage' && (
                <ManageSection
                    postedJobs={postedJobs}
                    expandedJob={expandedJob}
                    setExpandedJob={setExpandedJob}
                    toggleJobStatus={toggleJobStatus}
                    removePostedJob={removePostedJob}
                />
            )}

            {/* ── CANDIDATE SEARCH ── */}
            {activeSection === 'search' && <CandidateSearchSection />}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  OVERVIEW SECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OverviewSection — Stats cards and quick actions for employers.
 */
function OverviewSection({ stats, postedJobs, setActiveSection }) {
    const statCards = [
        { label: 'Lowongan Aktif', value: stats.activeJobs, icon: Briefcase, color: 'emerald' },
        { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'brand' },
        { label: 'Total Pelamar', value: stats.totalApplicants, icon: Users, color: 'purple' },
        { label: 'Total Lowongan', value: stats.totalJobs, icon: FileText, color: 'cyan' },
    ]

    return (
        <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color }, i) => (
                    <div
                        key={label}
                        className="bg-white border-2 border-surface-200 rounded-3xl p-6 shadow-brutal-sm text-center animate-slide-up hover:shadow-brutal-md hover:-translate-y-1 transition-all"
                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-${color}-100 border-2 border-${color}-200 mx-auto mb-3 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 text-${color}-600`} />
                        </div>
                        <div className="text-4xl font-black tabular-nums tracking-tighter">{value}</div>
                        <div className="text-xs font-bold text-surface-500 uppercase tracking-widest mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveSection('post')}
                    className="bg-white border-2 border-surface-200 rounded-3xl p-6 text-left group hover:shadow-brutal-md hover:-translate-y-1 transition-all shadow-brutal-sm"
                >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-300 border-2 border-emerald-500 flex items-center justify-center mb-4 group-hover:rotate-6 group-hover:scale-110 transition-all shadow-sm group-hover:shadow-[4px_4px_0px_#10b981]">
                        <Plus className="w-6 h-6 text-emerald-900" />
                    </div>
                    <h3 className="font-extrabold text-lg mb-1 uppercase tracking-tight text-ink">Pasang Lowongan Baru</h3>
                    <p className="text-sm font-semibold text-surface-500">Publikasikan lowongan dan jangkau 50K+ pencari kerja potensial.</p>
                </button>

                <button
                    onClick={() => setActiveSection('search')}
                    className="bg-white border-2 border-surface-200 rounded-3xl p-6 text-left group hover:shadow-brutal-md hover:-translate-y-1 transition-all shadow-brutal-sm"
                >
                    <div className="w-12 h-12 rounded-2xl bg-brand-300 border-2 border-brand-500 flex items-center justify-center mb-4 group-hover:rotate-6 group-hover:scale-110 transition-all shadow-sm group-hover:shadow-[4px_4px_0px_#6366f1]">
                        <Search className="w-6 h-6 text-brand-900" />
                    </div>
                    <h3 className="font-extrabold text-lg mb-1 uppercase tracking-tight text-ink">Cari Kandidat</h3>
                    <p className="text-sm font-semibold text-surface-500">Gunakan AI untuk menemukan talenta terbaik secara instan.</p>
                </button>
            </div>

            {/* Recent postings */}
            {postedJobs.length > 0 && (
                <div className="bg-white border-2 border-surface-200 rounded-3xl shadow-brutal-sm p-6">
                    <h3 className="text-base font-black mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Clock className="w-5 h-5 text-brand-500" />
                        Lowongan Terbaru
                    </h3>
                    <div className="space-y-3">
                        {postedJobs.slice(0, 3).map((job) => (
                            <div key={job.job_id} className="bg-surface-50 border-2 border-surface-200 rounded-2xl p-4 flex items-center justify-between hover:border-ink transition-colors cursor-pointer group">
                                <div>
                                    <h4 className="text-base font-bold text-ink group-hover:text-brand-600 transition-colors uppercase">{job.title}</h4>
                                    <p className="text-xs font-semibold text-surface-500 mt-1 flex items-center gap-2">
                                        <MapPin className="w-3 h-3"/> {job.region_name}
                                        <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                                        <Users className="w-3 h-3"/> {job.applicants}
                                        <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                                        <Eye className="w-3 h-3"/> {job.views}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg border-2 ${
                                    job.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                    {job.status === 'active' ? 'Aktif' : 'Dijeda'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST JOB FORM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PostJobSection — Form to create and publish a new job listing.
 */
function PostJobSection({ postJob, setActiveSection }) {
    const [form, setForm] = useState({
        title: '',
        company: '',
        description: '',
        required_skills: [],
        education_min: 'S1',
        experience_min: 0,
        salary_min: 5000000,
        salary_max: 15000000,
        region_code: '3171',
        region_name: 'Jakarta Pusat',
        job_type: 'full-time',
    })
    const [skillInput, setSkillInput] = useState('')
    const [showAllSkills, setShowAllSkills] = useState(false)

    /**
     * Updates a single form field.
     */
    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    /**
     * Toggles a skill chip on/off in the required skills list.
     */
    const toggleSkill = (skill) => {
        setForm(prev => ({
            ...prev,
            required_skills: prev.required_skills.includes(skill)
                ? prev.required_skills.filter(s => s !== skill)
                : [...prev.required_skills, skill],
        }))
    }

    /**
     * Adds a custom skill from the text input.
     */
    const addCustomSkill = () => {
        const skills = skillInput.split(',').map(s => s.trim()).filter(Boolean)
        skills.forEach(s => {
            if (!form.required_skills.includes(s)) {
                setForm(prev => ({ ...prev, required_skills: [...prev.required_skills, s] }))
            }
        })
        setSkillInput('')
    }

    /**
     * Validates and submits the job posting.
     */
    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.title.trim()) return toast.error('Judul lowongan wajib diisi')
        if (!form.company.trim()) return toast.error('Nama perusahaan wajib diisi')
        if (form.required_skills.length === 0) return toast.error('Tambahkan minimal 1 skill')

        postJob(form)
        setActiveSection('manage')
    }

    const displayedSkills = showAllSkills ? POPULAR_SKILLS : POPULAR_SKILLS.slice(0, 12)

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
            <div className="bg-white border-2 border-surface-200 rounded-3xl p-6 sm:p-8 shadow-brutal-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-surface-100">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center -rotate-6 shadow-sm">
                        <Plus className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl uppercase tracking-tight text-ink">Pasang Lowongan Baru</h3>
                        <p className="text-sm font-semibold text-surface-500 mt-1">Isi detail lowongan untuk segera dipublikasikan</p>
                    </div>
                </div>

                {/* Title & Company */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-500" />
                            Judul Lowongan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="contoh: Data Scientist"
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink placeholder:text-surface-400 focus:border-ink focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-1 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            Nama Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.company}
                            onChange={(e) => updateField('company', e.target.value)}
                            placeholder="PT Contoh Indonesia"
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink placeholder:text-surface-400 focus:border-ink focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-1 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Deskripsi Pekerjaan
                    </label>
                    <textarea
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Jelaskan tanggung jawab, kualifikasi, dan benefit yang ditawarkan..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink placeholder:text-surface-400 focus:border-ink focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-1 outline-none transition-all resize-none"
                    />
                </div>

                {/* Skills */}
                <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Skills yang Dibutuhkan ({form.required_skills.length} dipilih)
                    </label>
                    <div className="flex gap-2 mb-3">
                        <input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                            placeholder="Ketik & tekan Enter untuk tambah skill manual..."
                            className="flex-1 px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink placeholder:text-surface-400 focus:border-ink focus:shadow-[4px_4px_0px_#111827] focus:-translate-y-1 outline-none transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {displayedSkills.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                                    form.required_skills.includes(skill)
                                        ? 'bg-ink border-ink text-surface-50 shadow-[2px_2px_0px_#111827] translate-y-[-1px]'
                                        : 'bg-white border-surface-200 text-surface-600 hover:border-ink hover:text-ink hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[-1px]'
                                }`}
                            >
                                {skill}
                            </button>
                        ))}
                        {!showAllSkills && (
                            <button
                                type="button"
                                onClick={() => setShowAllSkills(true)}
                                className="px-4 py-2 rounded-xl text-brand-600 bg-brand-50 border-2 border-brand-200 font-black text-xs hover:bg-brand-100 transition-colors"
                            >
                                +{POPULAR_SKILLS.length - 12} lainnya
                            </button>
                        )}
                    </div>
                </div>

                {/* Education, Experience, Region, Job Type */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-500" />
                            Pendidikan Minimum
                        </label>
                        <select
                            value={form.education_min}
                            onChange={(e) => updateField('education_min', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all cursor-pointer"
                        >
                            {EDUCATION_LEVELS.map(({ value, label }) => (
                                <option key={value} value={value} className="bg-white">{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            Pengalaman Minimum (tahun)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={30}
                            value={form.experience_min}
                            onChange={(e) => updateField('experience_min', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            Lokasi Kerja
                        </label>
                        <select
                            value={form.region_code}
                            onChange={(e) => {
                                const r = REGIONS.find(r => r.code === e.target.value)
                                updateField('region_code', e.target.value)
                                updateField('region_name', r?.name || '')
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all cursor-pointer"
                        >
                            {REGIONS.map(({ code, name }) => (
                                <option key={code} value={code} className="bg-white">{name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-500" />
                            Tipe Pekerjaan
                        </label>
                        <select
                            value={form.job_type}
                            onChange={(e) => updateField('job_type', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all cursor-pointer"
                        >
                            <option value="full-time" className="bg-white">Full-time</option>
                            <option value="part-time" className="bg-white">Part-time</option>
                            <option value="contract" className="bg-white">Kontrak</option>
                            <option value="freelance" className="bg-white">Freelance</option>
                            <option value="internship" className="bg-white">Magang</option>
                        </select>
                    </div>
                </div>

                {/* Salary Range */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-500" />
                            Gaji Minimum (Rp)
                        </label>
                        <input
                            type="number"
                            value={form.salary_min}
                            onChange={(e) => updateField('salary_min', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-500" />
                            Gaji Maksimum (Rp)
                        </label>
                        <input
                            type="number"
                            value={form.salary_max}
                            onChange={(e) => updateField('salary_max', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" className="w-full bg-emerald-400 hover:bg-emerald-500 text-ink border-2 border-ink shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all rounded-2xl py-4 text-base font-black flex items-center justify-center gap-2 uppercase tracking-wide">
                    <Send className="w-5 h-5" />
                    Publikasikan Lowongan Sekarang
                </button>
            </div>
        </form>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MANAGE LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ManageSection — List and manage posted job listings.
 */
function ManageSection({ postedJobs, expandedJob, setExpandedJob, toggleJobStatus, removePostedJob }) {
    if (postedJobs.length === 0) {
        return (
            <div className="bg-white border-2 border-surface-200 shadow-brutal-sm p-12 text-center rounded-3xl">
                <div className="w-20 h-20 rounded-[2rem] bg-surface-100 border-2 border-surface-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FileText className="w-10 h-10 text-surface-400" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight text-ink">Belum Ada Lowongan</h3>
                <p className="text-base font-semibold text-surface-500 max-w-md mx-auto">
                    Mulai publikasikan lowongan pertama Anda untuk menarik kandidat terbaik.
                </p>
            </div>
        )
    }

    /**
     * Formats an ISO date to a relative time string.
     */
    const formatDate = (iso) => {
        if (!iso) return ''
        const d = new Date(iso)
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    /**
     * Formats salary in Indonesian Rupiah.
     */
    const fmtSalary = (v) => `Rp ${(v / 1_000_000).toFixed(0)} juta`

    return (
        <div className="space-y-4">
            {postedJobs.map((job, i) => (
                <div
                    key={job.job_id}
                    className="bg-white border-2 border-surface-200 rounded-3xl overflow-hidden shadow-brutal-sm animate-slide-up transition-all hover:-translate-y-1 hover:shadow-brutal-md"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-black text-lg uppercase tracking-tight text-ink truncate">{job.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-md border-2 text-[10px] font-black uppercase tracking-wider ${
                                        job.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                        {job.status === 'active' ? 'Aktif' : 'Dijeda'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-semibold text-surface-500 flex-wrap">
                                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{job.company}</span>
                                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.region_name}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(job.posted_at)}</span>
                                </div>

                                {/* Metrics */}
                                <div className="flex items-center gap-5 mt-4">
                                    <span className="flex items-center gap-1.5 text-sm font-bold text-surface-600 bg-surface-50 px-3 py-1.5 rounded-xl border-2 border-surface-200">
                                        <Eye className="w-4 h-4 text-brand-600" />
                                        {job.views} views
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm font-bold text-surface-600 bg-surface-50 px-3 py-1.5 rounded-xl border-2 border-surface-200">
                                        <Users className="w-4 h-4 text-emerald-600" />
                                        {job.applicants} pelamar
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm font-bold text-surface-600 bg-surface-50 px-3 py-1.5 rounded-xl border-2 border-surface-200">
                                        <Wallet className="w-4 h-4 text-amber-600" />
                                        {fmtSalary(job.salary_min)}–{fmtSalary(job.salary_max)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => toggleJobStatus(job.job_id)}
                                    className="p-3 rounded-xl border-2 border-surface-200 bg-surface-50 hover:bg-surface-100 hover:border-ink transition-colors shadow-sm focus:outline-none"
                                    title={job.status === 'active' ? 'Jeda lowongan' : 'Aktifkan lowongan'}
                                >
                                    {job.status === 'active'
                                        ? <Pause className="w-5 h-5 text-amber-600" />
                                        : <Play className="w-5 h-5 text-emerald-600" />
                                    }
                                </button>
                                <button
                                    onClick={() => setExpandedJob(expandedJob === job.job_id ? null : job.job_id)}
                                    className="p-3 rounded-xl border-2 border-surface-200 bg-surface-50 hover:bg-surface-100 hover:border-ink transition-colors shadow-sm focus:outline-none"
                                >
                                    {expandedJob === job.job_id
                                        ? <ChevronUp className="w-5 h-5 text-ink" />
                                        : <ChevronDown className="w-5 h-5 text-ink" />
                                    }
                                </button>
                                <button
                                    onClick={() => removePostedJob(job.job_id)}
                                    className="p-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-500 transition-colors shadow-sm focus:outline-none"
                                >
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Expanded details */}
                    {expandedJob === job.job_id && (
                        <div className="px-6 pb-6 pt-0 border-t-2 border-surface-200 mt-0 bg-surface-50">
                            <div className="pt-5 space-y-4">
                                {job.description && (
                                    <div>
                                        <p className="text-xs font-black text-surface-500 uppercase tracking-widest mb-2">Deskripsi</p>
                                        <p className="text-sm font-semibold text-ink leading-relaxed whitespace-pre-line">{job.description}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-black text-surface-500 uppercase tracking-widest mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(job.required_skills || []).map((skill, si) => (
                                            <span key={si} className="px-3 py-1 bg-white border-2 border-surface-200 rounded-lg text-xs font-bold text-ink shadow-[2px_2px_0px_#111827]">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CANDIDATE SEARCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CandidateSearchSection — AI-powered candidate search for employers.
 */
function CandidateSearchSection() {
    const [searchSkills, setSearchSkills] = useState('')
    const [searchResults, setSearchResults] = useState(null)

    /**
     * Simulates AI-powered candidate search with demo data.
     */
    const handleSearch = () => {
        if (!searchSkills.trim()) return toast.error('Masukkan skill yang dicari')

        // Demo results
        const demoResults = [
            { name: 'Andi Pratama', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'], experience: 3, education: 'S1', region: 'Jakarta', score: 92 },
            { name: 'Siti Nurhaliza', skills: ['Python', 'Data Analysis', 'SQL', 'Tableau'], experience: 2, education: 'S1', region: 'Bandung', score: 87 },
            { name: 'Budi Hartono', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], experience: 4, education: 'S1', region: 'Surabaya', score: 84 },
            { name: 'Dewi Lestari', skills: ['Python', 'SQL', 'Excel', 'Statistics'], experience: 1, education: 'S1', region: 'Yogyakarta', score: 79 },
            { name: 'Reza Firmansyah', skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'], experience: 5, education: 'S2', region: 'Jakarta', score: 75 },
        ]
        setSearchResults(demoResults)
        toast.success(`${demoResults.length} kandidat ditemukan!`)
    }

    return (
        <div className="space-y-6">
            {/* Search input */}
            <div className="bg-white border-2 border-surface-200 rounded-3xl p-6 shadow-brutal-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-100 border-2 border-brand-300 flex items-center justify-center -rotate-6 shadow-sm">
                        <Search className="w-6 h-6 text-brand-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tight text-ink">Cari Kandidat dengan AI</h3>
                        <p className="text-sm font-semibold text-surface-500 mt-1">Masukkan skill yang dibutuhkan untuk menemukan kandidat terbaik</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        value={searchSkills}
                        onChange={(e) => setSearchSkills(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="contoh: Python, Machine Learning, SQL"
                        className="flex-1 px-4 py-3 rounded-xl bg-surface-50 border-2 border-surface-200 text-sm font-semibold text-ink placeholder:text-surface-400 focus:border-ink focus:shadow-[4px_4px_0px_#111827] outline-none transition-all"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-brand-400 hover:bg-brand-500 text-ink font-black uppercase tracking-wider px-8 py-3 rounded-xl border-2 border-ink shadow-[4px_4px_0px_#111827] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#111827] flex items-center justify-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        Cari
                    </button>
                </div>
            </div>

            {/* Results */}
            {searchResults && (
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-2 uppercase tracking-wide text-ink">
                        <Users className="w-6 h-6 text-brand-500" />
                        {searchResults.length} Kandidat Cocok Teratas
                    </h3>
                    {searchResults.map((candidate, i) => (
                        <div
                            key={i}
                            className="bg-white border-2 border-surface-200 rounded-3xl p-6 shadow-brutal-sm animate-slide-up transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_#111827]"
                            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                {/* Score */}
                                <div className="w-16 h-16 rounded-[1.2rem] bg-brand-50 border-2 border-brand-300 flex items-center justify-center shrink-0 shadow-sm">
                                    <span className="text-xl font-black text-brand-600">{candidate.score}%</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-black text-lg uppercase text-ink tracking-tight">{candidate.name}</h4>
                                        {i === 0 && <span className="bg-amber-300 text-amber-900 border-2 border-amber-500 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><Star className="w-3 h-3" /> Top Match</span>}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm font-bold text-surface-500 flex-wrap">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{candidate.region}</span>
                                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4"/>{candidate.experience} thn pengalaman</span>
                                        <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4"/>{candidate.education}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {candidate.skills.map((s, si) => (
                                            <span key={si} className="px-3 py-1 bg-surface-50 border-2 border-surface-200 rounded-lg text-xs font-bold text-ink shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full sm:w-auto mt-4 sm:mt-0 px-5 py-3 rounded-xl border-2 border-surface-200 bg-white hover:border-ink hover:shadow-[4px_4px_0px_#111827] transition-all font-black text-sm uppercase tracking-wider text-ink">
                                    Lihat Profil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!searchResults && (
                <div className="text-center py-16 bg-white border-2 border-surface-200 rounded-3xl shadow-brutal-sm mt-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-brand-50 border-2 border-brand-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Users className="w-10 h-10 text-brand-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-ink">Temukan Kandidat Terbaik</h3>
                    <p className="text-base font-semibold text-surface-500 max-w-md mx-auto">
                        Masukkan skill yang dibutuhkan di atas dan biarkan AI menemukan kandidat yang paling cocok untuk peran ini.
                    </p>
                </div>
            )}
        </div>
    )
}
