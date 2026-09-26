// Employer candidate hub.
//   Pelamar (default): applicants who came through the job link / QR / board,
//     ranked by the proof-weighted match score (ApplicantList).
//   Talent pool: anonymised reverse matching (TalentSearch) — no names, no
//     contacts; share the job link to reach people.
// Candidates who have not applied stay anonymous; there is no way to buy an identity.
import { useEffect, useState } from 'react'
import { Inbox, Sparkles } from 'lucide-react'
import useStore from '../store/useStore'
import { DesignStyles, KC, selectStyle, topBtn } from './_design'
import ApplicantList from './ApplicantList'
import TalentSearch from './TalentSearch'

export default function EmployerCandidates() {
    const { employerJobs, refreshEmployerJobs, selectedCandidateJobId, loadEmployerApplications } = useStore()
    const [tab, setTab] = useState('applicants')

    useEffect(() => {
        refreshEmployerJobs()
        loadEmployerApplications()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // The selected job lives in the store, so the dashboard and the Asisten HR
    // panel can point here at a specific job even while this page is open.
    // Without a selection, open the job with the most applicants — not an
    // empty list that happens to be first.
    const busiest = [...employerJobs].sort((a, b) => (b.application_count || 0) - (a.application_count || 0))[0]
    const jobId = employerJobs.some((j) => j.id === selectedCandidateJobId) ? selectedCandidateJobId : busiest?.id
    const setJobId = (id) => useStore.setState({ selectedCandidateJobId: id })

    const job = employerJobs.find((j) => j.id === jobId)

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
            <DesignStyles />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: `1.5px solid ${KC.ink}`, paddingBottom: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Kandidat</h1>
                    <p style={{ color: KC.mute, margin: '6px 0 0', fontSize: 13.5 }}>
                        Semua pelamar diurutkan dari yang paling cocok. Skill yang <b>dikonfirmasi HR</b> bernilai penuh.
                    </p>
                </div>
                {employerJobs.length > 0 ? (
                    <select value={jobId || ''} onChange={(e) => setJobId(e.target.value)}
                        style={selectStyle({ boxShadow: `2.5px 2.5px 0 ${KC.ink}`, alignSelf: 'center', width: 280 })}>
                        {employerJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                ) : (
                    <span style={{ color: KC.mute, alignSelf: 'center' }}>Belum ada lowongan</span>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={topBtn(tab === 'applicants' ? KC.ink : '#fff', tab === 'applicants' ? '#fff' : KC.ink)} onClick={() => setTab('applicants')}>
                    <Inbox size={15} /> Pelamar
                </button>
                <button style={topBtn(tab === 'pool' ? KC.ink : '#fff', tab === 'pool' ? '#fff' : KC.ink)} onClick={() => setTab('pool')}>
                    <Sparkles size={15} /> Kandidat potensial
                </button>
            </div>

            {tab === 'applicants' && <ApplicantList job={job} />}
            {tab === 'pool' && <TalentSearch job={job} />}
        </div>
    )
}
