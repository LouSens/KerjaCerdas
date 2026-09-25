/**
 * Asisten HR — the employer's floating panel.
 *
 * "Insight" tab: next actions computed from the employer's OWN jobs and
 * applicants (one API read, no AI call, Rp0): new applicants to review, the
 * skill most applicants lack per job, interviews without a skill confirmation,
 * the best candidate not yet invited, jobs with no applicants. Every insight
 * comes with the button that acts on it.
 * "Panduan" tab: the static how-to tips.
 */
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react'
import useStore from '../store/useStore'
import { fetchEmployerApplications } from '../services/api'
import { KC, topBtn } from './_design'
import { skillCoverage } from './ApplicantSkillMap'

const TIPS = [
    ['Tulis skill wajib yang spesifik', 'Cantumkan skill wajib secara spesifik (mis. "Excel pivot table", bukan hanya "komputer"). Pelamar melihat persis skill mana yang kurang, dan peta skill Anda jadi lebih tajam.'],
    ['Memahami skor kecocokan', 'Skor = 35% kemiripan profil–lowongan + 40% skill + 15% pengalaman + 10% pendidikan. Skill yang hanya ada di profil dihitung 30%; skill yang Anda konfirmasi setelah wawancara 100%. Strong ≥65, Possible ≥45, Stretch <45.'],
    ['Tolak dengan alasan', 'Saat menolak, pilih satu dari 8 alasan. Pelamar melihat alasan itu beserta skill yang kurang, lalu mendapat rencana belajar — penolakan jadi arahan, bukan diam.'],
    ['Konfirmasi skill setelah wawancara', 'Buka "Wawancara & konfirmasi skill" dan tandai skill yang benar-benar dikuasai. Konfirmasi Anda ikut ke lamaran kandidat berikutnya — bukti terkuat di platform.'],
    ['Bagikan link lamaran', 'Di Lowongan Saya, klik "Link lamaran". Tempel di iklan lowongan, situs karier, atau kirim ke pusat karier kampus / BKK SMK.'],
    ['Kenapa lowongan ditahan?', 'AutoMod menolak lowongan yang meminta biaya dari pelamar dan menahan syarat usia/penampilan/jenis kelamin tanpa alasan. Anda mendapat kalimat yang bermasalah, cara memperbaikinya, dan bisa banding.'],
]

const AFTER_INTERVIEW = new Set(['interview', 'offered', 'hired'])

export function buildInsights(jobs, apps) {
    const out = []
    const active = jobs.filter((j) => j.is_active)
    const byJob = (id) => apps.filter((a) => a.job_id === id && !a.locked)

    const fresh = apps.filter((a) => a.status === 'applied' && !a.locked)
    if (fresh.length) {
        const top = [...fresh].sort((a, b) => (b.match_score || 0) - (a.match_score || 0))[0]
        out.push({ key: 'fresh', tone: 'orange', jobId: top.job_id, cta: 'Tinjau pelamar',
            text: `${fresh.length} pelamar baru belum ditinjau. Teratas: ${top.seeker_name} (skor ${Math.round((top.match_score || 0) * 100)}) untuk ${top.job_title}.` })
    }
    for (const job of active) {
        const list = byJob(job.id)
        if (list.length < 2) continue
        const rows = skillCoverage(list, job.required_skills || [])
        const worst = rows.reduce((a, b) => (b.missing > a.missing ? b : a), rows[0])
        const pct = worst ? Math.round((worst.missing / list.length) * 100) : 0
        if (pct >= 50) {
            out.push({ key: `gap-${job.id}`, tone: 'rose', jobId: job.id, cta: 'Lihat peta skill',
                text: `${pct}% pelamar ${job.title} belum punya ${worst.skill}. Pertimbangkan: jadikan nice-to-have, latih saat onboarding, atau kabari kampus/BKK mitra.` })
        }
    }
    const unconfirmed = apps.filter((a) => AFTER_INTERVIEW.has(a.status) && !(a.skill_proof || []).some((p) => p.status === 'hr_confirmed'))
    if (unconfirmed.length) {
        out.push({ key: 'confirm', tone: 'lime', jobId: unconfirmed[0].job_id, cta: 'Konfirmasi skill',
            text: `${unconfirmed.length} kandidat sudah diwawancarai tapi skill-nya belum dikonfirmasi. Konfirmasi Anda ikut ke lamaran mereka berikutnya.` })
    }
    for (const job of active) {
        const waiting = byJob(job.id).filter((a) => a.status === 'applied' || a.status === 'reviewed')
        const best = waiting.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))[0]
        if (best && (best.match_score || 0) >= 0.45) {
            out.push({ key: `best-${job.id}`, tone: 'indigo', jobId: job.id, cta: 'Buka kandidat',
                text: `${best.seeker_name} (skor ${Math.round(best.match_score * 100)}) adalah kandidat terbaik ${job.title} dan belum diundang wawancara.` })
        }
    }
    const empty = active.filter((j) => byJob(j.id).length === 0)
    if (empty.length) {
        out.push({ key: 'empty', tone: 'yellow', view: 'employer-jobs', cta: 'Ambil link lamaran',
            text: `${empty.length} lowongan aktif belum punya pelamar (${empty.map((j) => j.title).slice(0, 2).join(', ')}). Bagikan link lamarannya.` })
    }
    return out
}

const TONE = {
    orange: [KC.orangeSoft, KC.orange], rose: [KC.roseSoft, '#F87171'], lime: [KC.limeSoft, KC.lime],
    indigo: [KC.indigoSoft, KC.indigo], yellow: [KC.yellowSoft, KC.yellow],
}

export default function EmployerHelpPanel() {
    const { isAuthenticated, userRole, employerJobs, refreshEmployerJobs, navigate, activeView } = useStore()
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('insight')
    const [apps, setApps] = useState([])
    const [expanded, setExpanded] = useState(null)
    const isEmployer = isAuthenticated && userRole === 'employer'

    // Refresh on open and whenever the employer moves between pages, so the
    // count on the button reflects the actions they just took.
    useEffect(() => {
        if (!isEmployer) return undefined
        let alive = true
        fetchEmployerApplications().then((r) => alive && setApps(r?.items || [])).catch(() => {})
        if (!employerJobs?.length) refreshEmployerJobs?.()
        return () => { alive = false }
    }, [isEmployer, open, activeView]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!isEmployer) return null
    const insights = buildInsights(employerJobs || [], apps)

    const act = (ins) => {
        setOpen(false)
        if (ins.jobId) useStore.setState({ selectedCandidateJobId: ins.jobId })
        navigate(ins.view || 'employer-candidates')
    }

    return (
        <>
            <style>{`
            .kc-hr-btn { position: fixed; bottom: 24px; right: 24px; z-index: 40; }
            .kc-hr-panel { position: fixed; bottom: 92px; right: 24px; z-index: 40; width: 380px;
              max-width: calc(100vw - 2rem); max-height: calc(100vh - 7rem); }
            @media (max-width: 768px) {
              .kc-hr-btn { bottom: calc(76px + env(safe-area-inset-bottom, 0px)); right: 14px; }
              .kc-hr-panel { bottom: calc(132px + env(safe-area-inset-bottom, 0px)); right: 10px; left: 10px;
                width: auto; max-height: calc(100vh - 150px); }
            }`}</style>

            <button className="kc-hr-btn" onClick={() => setOpen((o) => !o)} aria-label="Asisten HR"
                style={{ ...topBtn(open ? '#fff' : KC.ink, open ? KC.ink : '#fff', KC.ink), padding: '10px 14px', borderRadius: 999, boxShadow: `3px 3px 0 ${KC.orange}` }}>
                {open ? <X size={16} /> : <Lightbulb size={16} />}
                <span style={{ fontSize: 13 }}>Asisten HR</span>
                {!open && insights.length > 0 && (
                    <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: KC.orange, color: '#fff', fontSize: 11, fontWeight: 900, display: 'grid', placeItems: 'center', padding: '0 5px' }}>
                        {insights.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="kc-hr-panel" role="dialog" aria-label="Asisten HR"
                    style={{ background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 14, boxShadow: `5px 5px 0 ${KC.ink}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', borderBottom: `2px solid ${KC.ink}`, background: KC.yellowSoft }}>
                        <div style={{ fontWeight: 900 }}>Asisten HR</div>
                        <div style={{ fontSize: 12, color: KC.mute }}>Langkah berikutnya dari lowongan & pelamar Anda</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            {[['insight', `Insight (${insights.length})`], ['guide', 'Panduan']].map(([k, label]) => (
                                <button key={k} onClick={() => setTab(k)}
                                    style={{ ...topBtn(tab === k ? KC.ink : '#fff', tab === k ? '#fff' : KC.ink), padding: '5px 11px', fontSize: 12, boxShadow: 'none' }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 10 }}>
                        {tab === 'insight' && insights.length === 0 && (
                            <p style={{ fontSize: 13, color: KC.mute, margin: 4 }}>Semua beres — tidak ada tindakan yang menunggu.</p>
                        )}
                        {tab === 'insight' && insights.map((ins) => (
                            <div key={ins.key} style={{ background: TONE[ins.tone][0], borderLeft: `4px solid ${TONE[ins.tone][1]}`, borderRadius: 8, padding: '10px 12px' }}>
                                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{ins.text}</div>
                                <button onClick={() => act(ins)} style={{ ...topBtn(), padding: '5px 10px', fontSize: 12, marginTop: 8, boxShadow: 'none' }}>
                                    {ins.cta} <ArrowRight size={12} />
                                </button>
                            </div>
                        ))}
                        {tab === 'guide' && TIPS.map(([title, body], i) => (
                            <div key={title} style={{ border: `1.5px solid ${KC.ink}`, borderRadius: 8 }}>
                                <button onClick={() => setExpanded(expanded === i ? null : i)}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '9px 11px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, textAlign: 'left', fontFamily: 'inherit' }}>
                                    {title} {expanded === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {expanded === i && <div style={{ padding: '0 11px 10px', fontSize: 12.5, lineHeight: 1.55, color: KC.inkLight }}>{body}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
