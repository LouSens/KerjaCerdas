import { useState } from 'react'
import { Search, User, Briefcase, GraduationCap, MapPin, Wallet, Sparkles, ChevronDown, X } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * SearchForm — Profile input form for job matching.
 *
 * Features: interactive skill chips, salary slider, region select, animated submit.
 * Submits to POST /api/v1/match via Zustand store.
 */

const REGIONS = [
    { code: '3171', name: 'Jakarta Pusat' },
    { code: '3174', name: 'Jakarta Selatan' },
    { code: '3173', name: 'Jakarta Barat' },
    { code: '3172', name: 'Jakarta Utara' },
    { code: '3175', name: 'Jakarta Timur' },
    { code: '3578', name: 'Surabaya' },
    { code: '3573', name: 'Malang' },
    { code: '3471', name: 'Yogyakarta' },
    { code: '1271', name: 'Medan' },
    { code: '7371', name: 'Makassar' },
    { code: '5171', name: 'Denpasar' },
    { code: '3271', name: 'Bogor' },
    { code: '3273', name: 'Bandung' },
    { code: '6471', name: 'Balikpapan' },
    { code: '1571', name: 'Palembang' },
    { code: '3374', name: 'Semarang' },
]

const EDUCATION = [
    { value: 'SMA', label: 'SMA / SMK' },
    { value: 'D3', label: 'D3 (Diploma)' },
    { value: 'S1', label: 'S1 (Sarjana)' },
    { value: 'S2', label: 'S2 (Magister)' },
    { value: 'S3', label: 'S3 (Doktor)' },
]

const POPULAR_SKILLS = [
    'Python', 'SQL', 'Excel', 'JavaScript', 'React', 'Java', 'Docker',
    'Statistics', 'Machine Learning', 'Tableau', 'Go', 'TypeScript',
    'PostgreSQL', 'Redis', 'Spark', 'TensorFlow', 'PyTorch', 'Kubernetes',
    'Data Analysis', 'Business Analysis', 'Project Management', 'Figma',
]

export default function SearchForm() {
    const { profile, updateProfile, searchJobs, matchLoading } = useStore()
    const [showAllSkills, setShowAllSkills] = useState(false)

    /**
     * Handles form submission for job search.
     */
    const handleSubmit = (e) => {
        e.preventDefault()
        searchJobs()
    }

    /**
     * Formats salary value to Indonesian currency display string.
     */
    const formatSalary = (val) => {
        return `Rp ${(val / 1_000_000).toFixed(0)} juta`
    }

    /**
     * Toggles a skill in the profile's comma-separated skills string.
     */
    const toggleSkill = (skill) => {
        const current = profile.skills.split(',').map(s => s.trim()).filter(Boolean)
        const exists = current.some(s => s.toLowerCase() === skill.toLowerCase())
        if (exists) {
            updateProfile('skills', current.filter(s => s.toLowerCase() !== skill.toLowerCase()).join(', '))
        } else {
            updateProfile('skills', [...current, skill].join(', '))
        }
    }

    const currentSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    const displayedSkills = showAllSkills ? POPULAR_SKILLS : POPULAR_SKILLS.slice(0, 12)

    return (
        <form onSubmit={handleSubmit} className="bg-white border-[3px] border-ink rounded-[1.5rem] md:rounded-[2rem] shadow-[8px_8px_0px_#111827] overflow-hidden animate-fade-in transition-all duration-300">
            {/* Form Header */}
            <div className="p-5 sm:p-6 md:p-8 border-b-[3px] border-ink bg-[#B8FF6D]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border-[3px] border-ink flex items-center justify-center shadow-[4px_4px_0px_#111827]">
                        <User className="w-6 h-6 text-ink" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-ink uppercase tracking-tight">Profil Pencari Kerja</h2>
                        <p className="text-sm font-bold mt-1 text-ink/80">Sesuaikan profil untuk mencocokkan AI dengan lowongan</p>
                    </div>
                </div>
            </div>

            {/* Form Body */}
            <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-black text-ink mb-3 uppercase tracking-wider">
                            <User className="w-4 h-4 text-brand-500" />
                            Nama Lengkap
                        </label>
                        <input
                            id="input-name"
                            type="text"
                            className="w-full bg-surface-50 border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-bold placeholder-surface-400 focus:outline-none focus:bg-[#FF90E8]/10 focus:shadow-[4px_4px_0px_#111827] transition-all"
                            placeholder="Budi Santoso"
                            value={profile.name}
                            onChange={(e) => updateProfile('name', e.target.value)}
                        />
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-black text-ink mb-3 uppercase tracking-wider">
                            <Briefcase className="w-4 h-4 text-brand-500" />
                            Pengalaman (Tahun)
                        </label>
                        <input
                            id="input-experience"
                            type="number"
                            min="0"
                            max="30"
                            className="w-full bg-surface-50 border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-bold placeholder-surface-400 focus:outline-none focus:bg-[#FFC900]/10 focus:shadow-[4px_4px_0px_#111827] transition-all tabular-nums"
                            value={profile.experience_years}
                            onChange={(e) => updateProfile('experience_years', parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {/* Education */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-black text-ink mb-3 uppercase tracking-wider">
                            <GraduationCap className="w-4 h-4 text-brand-500" />
                            Pendidikan Terakhir
                        </label>
                        <div className="relative">
                            <select
                                id="input-education"
                                className="w-full bg-surface-50 border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-bold appearance-none cursor-pointer focus:outline-none focus:bg-[#00E5FF]/10 focus:shadow-[4px_4px_0px_#111827] transition-all pr-12"
                                value={profile.education_level}
                                onChange={(e) => updateProfile('education_level', e.target.value)}
                            >
                                {EDUCATION.map((e) => (
                                    <option key={e.value} value={e.value} className="bg-white text-ink font-bold">{e.label}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <ChevronDown className="w-5 h-5 text-ink" />
                            </div>
                        </div>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-black text-ink mb-3 uppercase tracking-wider">
                            <MapPin className="w-4 h-4 text-brand-500" />
                            Lokasi Preferensi
                        </label>
                        <div className="relative">
                            <select
                                id="input-region"
                                className="w-full bg-surface-50 border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-bold appearance-none cursor-pointer focus:outline-none focus:bg-[#B8FF6D]/10 focus:shadow-[4px_4px_0px_#111827] transition-all pr-12"
                                value={profile.region_code}
                                onChange={(e) => updateProfile('region_code', e.target.value)}
                            >
                                {REGIONS.map((r) => (
                                    <option key={r.code} value={r.code} className="bg-white text-ink font-bold">{r.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <ChevronDown className="w-5 h-5 text-ink" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills — Interactive Chips */}
                <div className="bg-surface-100 border-[3px] border-ink rounded-2xl p-5 md:p-6 shadow-[4px_4px_0px_#111827]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <label className="flex items-center gap-2 text-sm font-black text-ink uppercase tracking-wider">
                            <Sparkles className="w-5 h-5 text-brand-500 fill-brand-500" />
                            Keahlian & Skill
                            <span className="bg-brand-500 text-white px-2 py-0.5 rounded-md text-[10px] ml-2 border-[2px] border-ink shadow-[2px_2px_0px_#111827]">
                                {currentSkills.length} DICEK
                            </span>
                        </label>
                    </div>

                    {/* Manual input */}
                    <input
                        id="input-skills"
                        type="text"
                        className="w-full bg-white border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-bold placeholder-surface-400 mb-6 focus:outline-none focus:shadow-[4px_4px_0px_#111827] transition-shadow"
                        placeholder="Tambah skill koma-terpisah (e.g., Python, SQL, Docker...)"
                        value={profile.skills}
                        onChange={(e) => updateProfile('skills', e.target.value)}
                    />

                    {/* Quick skill chips */}
                    <div className="flex flex-wrap gap-2.5">
                        {displayedSkills.map(skill => {
                            const active = currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())
                            return (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`skill-tag-interactive font-black text-xs md:text-sm px-4 py-2 rounded-xl border-[3px] transition-all ${active
                                        ? 'bg-[#FFC900] text-ink border-ink shadow-[4px_4px_0px_#111827] -translate-y-1'
                                        : 'bg-white text-surface-600 border-ink hover:bg-surface-100 hover:text-ink hover:shadow-[4px_4px_0px_#111827] hover:-translate-y-1'
                                        }`}
                                >
                                    {active && <span className="text-ink mr-2">✔</span>}
                                    {skill}
                                    {active && <X className="w-4 h-4 ml-1.5 text-ink/70" strokeWidth={3} />}
                                </button>
                            )
                        })}
                        <button
                            type="button"
                            onClick={() => setShowAllSkills(!showAllSkills)}
                            className="px-4 py-2 rounded-xl text-xs md:text-sm font-black text-surface-500 hover:text-ink hover:bg-surface-200 border-[3px] border-transparent transition-colors"
                        >
                            {showAllSkills ? 'Ciutkan Daftar ←' : `Tampilkan ${POPULAR_SKILLS.length - 12} Lainnya +`}
                        </button>
                    </div>
                </div>

                {/* Salary Slider */}
                <div className="pt-4">
                    <label className="flex items-center justify-between text-sm font-black text-ink mb-4 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-brand-500" />
                            Target Kompensasi
                        </span>
                        <span className="bg-ink text-white px-3 py-1.5 rounded-lg border-2 border-transparent shadow-[4px_4px_0px_#B8FF6D] text-sm tabular-nums">
                            {formatSalary(profile.salary_expectation)}
                        </span>
                    </label>
                    <div className="relative pt-2">
                        <input
                            id="input-salary"
                            type="range"
                            min="3000000"
                            max="50000000"
                            step="1000000"
                            className="w-full accent-ink h-3 rounded-full cursor-pointer bg-surface-200 border-2 border-ink appearance-none outline-none"
                            value={profile.salary_expectation}
                            onChange={(e) => updateProfile('salary_expectation', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-between text-xs font-black text-surface-500 mt-3 tabular-nums px-1">
                        <span>Rp 3Jt</span>
                        <span>Rp 25Jt</span>
                        <span>Rp 50Jt</span>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 md:p-8 border-t-[3px] border-ink bg-[#00E5FF]">
                <button
                    id="btn-search"
                    type="submit"
                    disabled={matchLoading || currentSkills.length === 0}
                    className="w-full bg-ink text-white font-black text-base md:text-lg px-8 py-4 md:py-5 rounded-[1rem] border-[3px] border-ink shadow-[6px_6px_0px_#111827] md:shadow-[8px_8px_0px_#111827] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-[4px_4px_0px_#111827]"
                >
                    {matchLoading ? (
                        <>
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Menganalisis Jutaan Dataset...
                        </>
                    ) : (
                        <>
                            <Search className="w-6 h-6" strokeWidth={3} />
                            TEMUKAN PEKERJAAN
                        </>
                    )}
                </button>
                {currentSkills.length === 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2 bg-white border-[3px] border-ink rounded-lg py-2 px-4 w-fit mx-auto shadow-[2px_2px_0px_#111827] transform -rotate-1">
                        <span className="text-xs font-black text-ink uppercase tracking-tight">▲ Pilih minimal 1 skill dlu boss</span>
                    </div>
                )}
            </div>
        </form>
    )
}
