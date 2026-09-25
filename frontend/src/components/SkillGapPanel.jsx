// "Rencana Belajar" — the centre of the seeker loop:
//   target job → skill yang kurang → belajar → lamar → umpan balik.
// Every number here comes from the API. The old fixed "20 jam per skill" and
// the linear "proyeksi match" simulator were removed: the system cannot
// measure either, and CLAUDE.md forbids shipping a metric it cannot measure.
// The skill-gap endpoint's match_before uses a different formula from the
// match list's score, so it is not shown — two different "%" for one job
// reads as a bug. The skill count is the honest, comparable figure.
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, BookOpen, CheckCircle2, Plus, Target } from 'lucide-react'
import useStore from '../store/useStore'
import { updateSeekerProfile } from '../services/api'
import { BrutalCard, DesignStyles, KC, selectStyle, topBtn } from './_design'
import { ProofChip } from './ProofUI'
import LoopSteps from './LoopSteps'

const skillName = (s) => (typeof s === 'string' ? s : s?.name || '')
const jobIdOf = (m) => m?.id || m?.job_id

// A course belongs to a skill when its category or name mentions the skill.
function coursesFor(skill, courses) {
    const key = skill.toLowerCase()
    return courses.filter((c) => `${c.category || ''} ${c.name || c.title || ''}`.toLowerCase().includes(key))
}

function CourseLink({ c }) {
    const label = c.name || c.title || 'Kursus'
    const meta = [c.provider, c.duration, c.price].filter(Boolean).join(' · ')
    const body = (
        <>
            <BookOpen size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><b>{label}</b>{meta && <span style={{ color: KC.mute }}> — {meta}</span>}</span>
        </>
    )
    const style = { display: 'flex', gap: 8, fontSize: 13, color: KC.ink, textDecoration: 'none', lineHeight: 1.45 }
    return c.url
        ? <a href={c.url} target="_blank" rel="noopener noreferrer" style={style}>{body}</a>
        : <div style={style}>{body}</div>
}

export default function SkillGapPanel() {
    const {
        matches, profile, skillGapResult, runSkillGap, loadSkillGap, loadSeekerProfile,
        focusJobId, openTargetJob, navigate, runAgent, isJobApplied,
    } = useStore()
    const [picked, setPicked] = useState('')
    const [busySkill, setBusySkill] = useState(null)

    useEffect(() => {
        // Arriving from "Jadikan target" already ran the analysis for focusJobId.
        if (!focusJobId) loadSkillGap()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const targetId = skillGapResult?.target_job_id || focusJobId
    const missing = skillGapResult?.missing_skills || []
    const matching = skillGapResult?.matching_skills || []
    const courses = skillGapResult?.recommended_courses || []
    const total = missing.length + matching.length

    const proofByName = useMemo(() => {
        const out = {}
        for (const s of profile?.skills || []) {
            if (typeof s === 'object' && s?.name) out[s.name.toLowerCase()] = s.proof_level || 'claimed'
        }
        return out
    }, [profile])

    const unmatchedCourses = courses.filter((c) => !missing.some((m) => coursesFor(m, [c]).length))

    const analyse = () => {
        const id = picked || targetId
        toast.promise(runSkillGap(id || undefined), {
            loading: 'Menganalisis skill yang kurang…', success: 'Rencana belajar diperbarui', error: 'Gagal menganalisis',
        })
    }

    // Learning a skill makes it a CLAIM on the profile — it counts, but only an
    // HR confirmation after the interview makes it proven.
    const markLearned = async (skill) => {
        setBusySkill(skill)
        try {
            const names = (profile?.skills || []).map(skillName).filter(Boolean)
            await updateSeekerProfile({ skills: [...new Set([...names, skill])] })
            await loadSeekerProfile?.()
            // Refresh both views of the same job: this plan and the match list
            // the seeker returns to ("Kembali ke lowongan & lamar").
            await Promise.all([runSkillGap(targetId), runAgent({ explicitIntent: 'match_jobs' })])
            toast.success(`${skill} ditambahkan ke profil`)
        } catch (e) {
            toast.error(e.message || 'Gagal menyimpan')
        } finally {
            setBusySkill(null)
        }
    }

    return (
        <div style={{ display: 'grid', gap: 18 }}>
            <DesignStyles />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Rencana Belajar</h1>
                    <p style={{ color: KC.mute, margin: '6px 0 0', fontSize: 14 }}>
                        Skill apa yang dibutuhkan lowongan incaranmu, dan cara menutupnya.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select value={picked || targetId || ''} onChange={(e) => setPicked(e.target.value)}
                        style={selectStyle({ width: 280 })}>
                        <option value="">Pilih lowongan target</option>
                        {targetId && !(matches || []).some((m) => jobIdOf(m) === targetId) && (
                            <option value={targetId}>{skillGapResult?.target_job_title || 'Lowongan target'}</option>
                        )}
                        {(matches || []).map((m) => (
                            <option key={jobIdOf(m)} value={jobIdOf(m)}>{m.title} · {m.company || m.company_name}</option>
                        ))}
                    </select>
                    <button style={topBtn(KC.orange, '#fff')} onClick={analyse}>Analisis</button>
                </div>
            </div>

            <LoopSteps active={skillGapResult ? 1 : 0} />

            {!skillGapResult ? (
                <BrutalCard color={KC.orangeSoft}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 900 }}><Target size={18} /> Belum ada lowongan target</div>
                    <p style={{ margin: '8px 0 12px', fontSize: 14 }}>
                        Buka satu lowongan di <b>Lowongan Cocok</b>, lalu tekan <b>Jadikan target</b>. Kami tunjukkan skill yang kurang dan kursus untuk menutupnya.
                    </p>
                    <button style={topBtn(KC.ink, '#fff')} onClick={() => navigate('seeker-match')}>Lihat lowongan cocok →</button>
                </BrutalCard>
            ) : (
                <>
                    <BrutalCard>
                        <div style={{ fontSize: 12, fontWeight: 800, color: KC.mute, textTransform: 'uppercase' }}>Target</div>
                        <div style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 10px' }}>{skillGapResult.target_job_title || 'Lowongan'}</div>
                        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 14 }}>
                            <span><b style={{ fontSize: 20 }}>{matching.length}/{total}</b> skill wajib sudah kamu punya</span>
                        </div>
                    </BrutalCard>

                    {missing.length === 0 ? (
                        <BrutalCard color={KC.limeSoft}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900 }}><CheckCircle2 size={18} /> Semua skill wajib sudah ada di profilmu</div>
                            <p style={{ margin: '6px 0 0', fontSize: 14 }}>Saatnya melamar. HR akan mengonfirmasi skill-mu saat wawancara.</p>
                        </BrutalCard>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            <h2 style={{ fontSize: 17, fontWeight: 900, margin: '4px 0 0' }}>Skill yang perlu kamu pelajari ({missing.length})</h2>
                            {missing.map((skill) => {
                                const own = coursesFor(skill, courses)
                                return (
                                    <BrutalCard key={skill} padding={16}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <ProofChip name={skill} status="missing" />
                                            <button style={{ ...topBtn(), padding: '7px 11px', fontSize: 12 }} disabled={busySkill === skill}
                                                onClick={() => markLearned(skill)}>
                                                <Plus size={13} /> {busySkill === skill ? 'Menyimpan…' : 'Sudah saya kuasai — tambah ke profil'}
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                                            {own.length
                                                ? own.map((c, i) => <CourseLink key={i} c={c} />)
                                                : <span style={{ fontSize: 13, color: KC.mute }}>Lihat kursus yang relevan di bawah.</span>}
                                        </div>
                                    </BrutalCard>
                                )
                            })}
                        </div>
                    )}

                    {unmatchedCourses.length > 0 && missing.length > 0 && (
                        <BrutalCard>
                            <div style={{ fontWeight: 900, marginBottom: 10 }}>Kursus yang relevan</div>
                            <div style={{ display: 'grid', gap: 8 }}>{unmatchedCourses.map((c, i) => <CourseLink key={i} c={c} />)}</div>
                        </BrutalCard>
                    )}

                    {matching.length > 0 && (
                        <BrutalCard>
                            <div style={{ fontWeight: 900, marginBottom: 10 }}>Sudah kamu punya</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {matching.map((s) => <ProofChip key={s} name={s} status={proofByName[s.toLowerCase()] || 'claimed'} />)}
                            </div>
                        </BrutalCard>
                    )}

                    <BrutalCard color={KC.ink} shadow={KC.orange} style={{ color: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ fontSize: 14, maxWidth: 520, lineHeight: 1.5 }}>
                                Skill yang kamu tambahkan dihitung sebagai <b>klaim</b>. Skill menjadi <b>dikonfirmasi</b> setelah HR mengujinya di wawancara.
                            </div>
                            {targetId && (isJobApplied(targetId) ? (
                                <button style={topBtn(KC.orange, '#fff', KC.orange)} onClick={() => navigate('seeker-applications')}>
                                    Lihat lamaranku <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button style={topBtn(KC.orange, '#fff', KC.orange)} onClick={() => openTargetJob(targetId)}>
                                    Kembali ke lowongan & lamar <ArrowRight size={14} />
                                </button>
                            ))}
                        </div>
                    </BrutalCard>
                </>
            )}
        </div>
    )
}
