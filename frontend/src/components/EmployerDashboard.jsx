// Employer home: the real hiring funnel (applicants -> interview -> hired),
// how many applicants bring proven skills, jobs with share links, trust and
// plan status. Every number comes from the API — no placeholder quotas.
import { useEffect, useState } from 'react'
import { Briefcase, FileText, PlusCircle, QrCode, ShieldCheck } from 'lucide-react'
import useStore from '../store/useStore'
import { BrutalCard, DesignStyles, KC, topBtn } from './_design'
import JobShareModal from './JobShareModal'
import { fetchEmployerTrust } from '../services/api'

const REACHED_INTERVIEW = new Set(['interview', 'offered', 'hired'])

function Stat({ label, value, sub, color = KC.ink }) {
    return (
        <BrutalCard padding={16}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: KC.mute, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color, margin: '6px 0 2px' }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: KC.mute }}>{sub}</div>}
        </BrutalCard>
    )
}

export default function EmployerDashboard() {
    const {
        employerJobs, refreshEmployerJobs, navigate, employerProfile, loadEmployerProfile,
        employerApplications, loadEmployerApplications, user, openUpgradeModal,
    } = useStore()
    const [trust, setTrust] = useState(null)
    const [sharing, setSharing] = useState(null)

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerProfile()
        loadEmployerApplications()
        fetchEmployerTrust().then(setTrust).catch(() => setTrust(null))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const apps = (employerApplications || []).filter((a) => !a.locked)
    const total = employerApplications?.length || 0
    const interviews = apps.filter((a) => REACHED_INTERVIEW.has(a.status)).length
    const hired = apps.filter((a) => a.status === 'hired').length
    const withProof = apps.filter((a) => (a.skill_proof || []).some((p) => p.status === 'quiz' || p.status === 'hr_confirmed')).length
    const locked = total - apps.length
    const jobs = employerJobs || []
    const held = jobs.filter((j) => j.moderation_status && j.moderation_status !== 'published').length
    const badges = trust?.badges || {}
    const company = employerProfile?.company_name || user?.name || 'Perusahaan'

    const openJob = (id) => {
        useStore.setState({ selectedCandidateJobId: id })
        navigate('employer-candidates')
    }

    return (
        <div style={{ display: 'grid', gap: 18 }}>
            <DesignStyles />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: 13, color: KC.mute, fontWeight: 700 }}>{company}</div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: '2px 0 0', letterSpacing: '-1px' }}>Dashboard rekrutmen</h1>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={topBtn()} onClick={() => navigate('employer-upload')}><FileText size={14} /> Upload PDF lowongan</button>
                    <button style={topBtn(KC.orange, '#fff')} onClick={() => navigate('employer-post-job')}><PlusCircle size={14} /> Pasang lowongan</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <Stat label="Pelamar" value={total} sub={locked ? `${locked} terkunci (Lite)` : 'semua diperingkat'} />
                <Stat label="Punya skill terbukti" value={withProof} sub="lulus kuis / dikonfirmasi HR" color="#059669" />
                <Stat label="Sampai wawancara" value={interviews} color={KC.orange} />
                <Stat label="Diterima" value={hired} color={KC.indigo} />
            </div>

            {held > 0 && (
                <BrutalCard color={KC.yellowSoft} padding={14}>
                    <b>{held} lowongan ditahan / ditolak AutoMod.</b> Lihat alasannya di Lowongan Saya — perbaiki atau ajukan banding.
                    <button style={{ ...topBtn(), marginLeft: 10 }} onClick={() => navigate('employer-jobs')}>Lihat</button>
                </BrutalCard>
            )}

            <BrutalCard>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900, marginBottom: 10 }}><Briefcase size={17} /> Lowongan</div>
                {jobs.length === 0 && (
                    <p style={{ color: KC.mute }}>Belum ada lowongan. Pasang satu (gratis), lalu bagikan link / QR-nya di Instagram atau grup WhatsApp.</p>
                )}
                <div style={{ display: 'grid', gap: 10 }}>
                    {jobs.slice(0, 6).map((j) => (
                        <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${KC.ash}`, paddingBottom: 10 }}>
                            <div>
                                <div style={{ fontWeight: 800 }}>{j.title}</div>
                                <div style={{ fontSize: 12, color: KC.mute }}>
                                    {j.application_count || 0} pelamar · {j.is_active ? 'aktif' : (j.moderation_status === 'published' ? 'ditutup' : 'menunggu moderasi')} · paket {j.plan_tier === 'spark' ? 'Lite' : (j.plan_tier === 'beacon' ? 'Pro' : 'Max')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {j.is_active && j.public_code && <button style={{ ...topBtn(), padding: '7px 11px', fontSize: 12 }} onClick={() => setSharing(j)}><QrCode size={13} /> Link & QR</button>}
                                <button style={{ ...topBtn(KC.ink, '#fff'), padding: '7px 11px', fontSize: 12 }} onClick={() => openJob(j.id)}>Pelamar →</button>
                            </div>
                        </div>
                    ))}
                </div>
            </BrutalCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                <BrutalCard color={badges.company_email || badges.admin_reviewed ? KC.limeSoft : KC.orangeSoft}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 900 }}><ShieldCheck size={17} /> Kepercayaan</div>
                    <p style={{ fontSize: 13, margin: '6px 0 10px' }}>
                        {badges.company_email || badges.admin_reviewed
                            ? 'Lowongan baru langsung tayang dengan badge terpercaya.'
                            : 'Verifikasi email perusahaan atau ajukan "Ditinjau admin" agar lowongan langsung tayang dan lebih dipercaya pelamar.'}
                    </p>
                    <button style={topBtn()} onClick={() => navigate('employer-verification')}>Buka Kepercayaan →</button>
                </BrutalCard>
                <BrutalCard>
                    <div style={{ fontWeight: 900 }}>Paket</div>
                    <p style={{ fontSize: 13, margin: '6px 0 10px' }}>
                        Lite gratis: 1 lowongan aktif, semua pelamar diperingkat. Upgrade ke Pro atau Max untuk fitur ekstra.
                        untuk pelamar tanpa batas, pertanyaan wawancara AI, dan ekspor.
                    </p>
                    <button style={topBtn(KC.orange, '#fff')} onClick={() => openUpgradeModal()}>Lihat paket</button>
                </BrutalCard>
            </div>
            {sharing && <JobShareModal job={sharing} onClose={() => setSharing(null)} />}
        </div>
    )
}
