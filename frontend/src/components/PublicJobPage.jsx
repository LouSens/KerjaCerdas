// Public job page behind the shareable link / QR poster: /j/<code>.
// Visitor flow: see the job -> sign up -> quick profile -> prove skills
// (optional quizzes) -> apply. Applications are tagged source="link" so we
// can measure whether QR / share-link traffic converts better than the board.
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BadgeCheck, Flag, MapPin, PlayCircle, Wallet } from 'lucide-react'
import useStore from '../store/useStore'
import { BrutalCard, KC, topBtn } from './_design'
import { ProofChip, ProofLegend } from './ProofUI'
import QuizModal from './QuizModal'
import QuickProfileForm from './QuickProfileForm'
import ReportJobModal from './ReportJobModal'
import { applyToJob, fetchPublicJob, fetchQuizSkills } from '../services/api'

const rupiah = (n) => (n ? `Rp${Math.round(n / 1e6 * 10) / 10}jt` : '')

export default function PublicJobPage() {
    const { code } = useParams()
    const location = useLocation()
    const { isAuthenticated, userRole, profile, seekerId, openAuthModal, loadSeekerProfile } = useStore()
    const [job, setJob] = useState(null)
    const [error, setError] = useState('')
    const [skills, setSkills] = useState([])
    const [quizSkill, setQuizSkill] = useState(null)
    const [applied, setApplied] = useState(null)
    const [reporting, setReporting] = useState(false)

    useEffect(() => {
        fetchPublicJob(code).then(setJob).catch((e) => setError(e.message))
    }, [code])

    const isSeeker = isAuthenticated && userRole === 'seeker'
    const hasProfile = Boolean(seekerId) || (profile?.skills?.length > 0)

    const loadSkills = useCallback(() => {
        if (isSeeker && job?.id && hasProfile) {
            fetchQuizSkills(job.id).then((r) => setSkills(r.items)).catch(() => setSkills([]))
        }
    }, [isSeeker, job?.id, hasProfile])
    useEffect(() => { loadSkills() }, [loadSkills])
    useEffect(() => { if (isSeeker) loadSeekerProfile() }, [isSeeker, loadSeekerProfile])

    const apply = async () => {
        try {
            const r = await applyToJob(job.id, '', { source: 'link' })
            setApplied(r)
            toast.success(r.already_applied ? 'Kamu sudah melamar lowongan ini' : 'Lamaran terkirim!', { id: 'apply-job' })
        } catch (e) {
            toast.error(e.message, { id: 'apply-job' })
        }
    }

    if (error) return <Shell><BrutalCard><p style={{ fontWeight: 700 }}>{error}</p></BrutalCard></Shell>
    if (!job) return <Shell><p>Memuat lowongan…</p></Shell>

    const returnPath = `${location.pathname}${location.search}`
    return (
        <Shell>
            <BrutalCard>
                <div style={{ fontSize: 13, color: KC.mute, fontWeight: 700 }}>{job.company_name}</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, margin: '4px 0 8px' }}>{job.title}</h1>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, color: KC.inkLight }}>
                    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={14} />{job.location}</span>
                    {job.salary_max > 0 && <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Wallet size={14} />{rupiah(job.salary_min)}–{rupiah(job.salary_max)}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
                    {[['email_verified', 'Email terverifikasi'], ['company_email', 'Email perusahaan'], ['admin_reviewed', 'Ditinjau admin']]
                        .filter(([k]) => job.badges?.[k])
                        .map(([k, label]) => (
                            <span key={k} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 12, fontWeight: 700, color: '#065F46', background: KC.limeSoft, border: '1px solid #10B981', borderRadius: 999, padding: '3px 9px' }}>
                                <BadgeCheck size={13} />{label}
                            </span>
                        ))}
                </div>
                <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{job.description}</p>
                <div style={{ fontWeight: 800, marginTop: 8 }}>Skill yang dibutuhkan</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {(job.required_skills || []).map((s) => <span key={s} style={{ fontSize: 13, border: `1px solid ${KC.borderMuted}`, borderRadius: 999, padding: '3px 10px' }}>{s}</span>)}
                </div>
                <button onClick={() => (isAuthenticated ? setReporting(true) : openAuthModal('login', 'seeker', returnPath))}
                    style={{ marginTop: 14, background: 'none', border: 'none', color: KC.mute, cursor: 'pointer', fontSize: 12, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <Flag size={12} /> Laporkan lowongan
                </button>
            </BrutalCard>

            {!job.accepting_applications && (
                <BrutalCard color={KC.yellowSoft}><b>Lowongan ini sedang tidak menerima lamaran.</b></BrutalCard>
            )}

            {job.accepting_applications && !isAuthenticated && (
                <BrutalCard color={KC.orangeSoft}>
                    <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Lamar lewat KerjaCerdas: lihat skor kecocokanmu, buktikan skill, dan dapat rekomendasi belajar — gratis.</p>
                    <button style={topBtn(KC.orange, '#fff')} onClick={() => openAuthModal('register', 'seeker', returnPath)}>Daftar & lamar</button>
                    <button style={{ ...topBtn(), marginLeft: 8 }} onClick={() => openAuthModal('login', 'seeker', returnPath)}>Sudah punya akun</button>
                </BrutalCard>
            )}

            {job.accepting_applications && isAuthenticated && userRole !== 'seeker' && (
                <BrutalCard><p>Kamu masuk sebagai perusahaan. Masuk dengan akun pencari kerja untuk melamar.</p></BrutalCard>
            )}

            {job.accepting_applications && isSeeker && !hasProfile && (
                <QuickProfileForm suggestedSkills={job.required_skills || []} onSaved={loadSeekerProfile} />
            )}

            {job.accepting_applications && isSeeker && hasProfile && !applied && (
                <BrutalCard>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>1. Buktikan skill-mu (opsional, ±3 menit per skill)</div>
                    <ProofLegend />
                    <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                        {skills.map((s) => (
                            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <ProofChip name={s.skill} status={s.proof} />
                                {s.quiz_available && (s.proof === 'claimed' || s.proof === 'missing') && (
                                    <button style={topBtn()} onClick={() => setQuizSkill(s.skill)}><PlayCircle size={14} /> Ikut kuis</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div style={{ fontWeight: 900, margin: '18px 0 6px' }}>2. Kirim lamaran</div>
                    <button style={topBtn(KC.orange, '#fff')} onClick={apply}>Lamar sekarang</button>
                </BrutalCard>
            )}

            {applied && (
                <BrutalCard color={KC.limeSoft}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>Lamaran terkirim ✓</div>
                    {applied.match_score != null && (
                        <p>Skor kecocokanmu saat melamar: <b>{Math.round(applied.match_score * 100)}</b> ({applied.band}). Skor naik setiap kali kamu membuktikan skill.</p>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(applied.skill_proof || []).map((p) => <ProofChip key={p.name} name={p.name} status={p.status} compact />)}
                    </div>
                </BrutalCard>
            )}

            {quizSkill && <QuizModal key={quizSkill} skill={quizSkill} onClose={() => setQuizSkill(null)} onDone={() => { loadSkills(); loadSeekerProfile() }} />}
            {reporting && <ReportJobModal code={job.public_code} reasons={job.report_reasons} onClose={() => setReporting(false)} />}
        </Shell>
    )
}

function Shell({ children }) {
    return (
        <div style={{ minHeight: '100vh', background: KC.bone }}>
            <header style={{ padding: '14px 16px', borderBottom: `1.5px solid ${KC.ink}`, background: KC.paper }}>
                <a href="/" style={{ fontWeight: 900, fontSize: 18, color: KC.ink, textDecoration: 'none' }}>KerjaCerdas</a>
            </header>
            <main style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'grid', gap: 16 }}>{children}</main>
        </div>
    )
}
