import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { Plus, ArrowLeft, Users, Edit3, ArrowRight, FileText } from 'lucide-react'

function formatSalary(min, max) {
    if (!min && !max) return 'Rp 20–35 jt'
    const fmt = (n) => `Rp ${Math.round(n / 1000000)} jt`
    if (min && max) return `${fmt(min)}–${fmt(max)}`
    return fmt(min || max)
}

const DEFAULT_JOBS = [
    {
        id: 'job-be-1',
        title: 'Senior Backend Engineer (Go)',
        location: 'Jakarta',
        work_type: 'Hybrid',
        salary: 'Rp 28–42 jt',
        status: 'active',
        candidates_count: 42,
        strong_count: 2,
        unlocked_count: 3,
        interview_count: 2,
    },
    {
        id: 'job-da-2',
        title: 'Product Data Analyst',
        location: 'Jakarta',
        work_type: 'Onsite',
        salary: 'Rp 18–26 jt',
        status: 'active',
        candidates_count: 28,
        strong_count: 1,
        unlocked_count: 0,
        interview_count: 0,
    },
    {
        id: 'job-fe-draft',
        title: 'Frontend Engineer (React)',
        location: 'Jakarta',
        work_type: 'Remote',
        salary: 'Rp 22–32 jt',
        status: 'draft',
        candidates_count: 31,
        strong_count: 0,
        unlocked_count: 0,
        interview_count: 0,
    },
    {
        id: 'job-devops-closed',
        title: 'DevOps Platform Specialist',
        location: 'Bandung',
        work_type: 'Hybrid',
        salary: 'Rp 25–38 jt',
        status: 'closed',
        candidates_count: 19,
        strong_count: 3,
        unlocked_count: 2,
        interview_count: 1,
    },
]

export default function EmployerJobs() {
    const { employerJobs, refreshEmployerJobs, navigate } = useStore()
    const [filterTab, setFilterTab] = useState('all') // 'all' | 'active' | 'draft' | 'closed'

    useEffect(() => {
        refreshEmployerJobs()
    }, []) // eslint-disable-line

    // Merge backend employerJobs with default mock jobs if needed
    const allJobs = (employerJobs && employerJobs.length > 0)
        ? employerJobs.map((j, i) => ({
            id: j.id || `job-${i}`,
            title: j.title || 'Posisi Rekrutmen',
            location: j.region_code || j.location || 'Jakarta',
            work_type: j.remote_allowed ? 'Remote' : (j.work_type || 'Hybrid'),
            salary: formatSalary(j.salary_min, j.salary_max),
            status: j.is_active === false ? 'draft' : 'active',
            candidates_count: j.application_count ?? (i === 0 ? 42 : i === 1 ? 28 : 15),
            strong_count: i === 0 ? 2 : 1,
            unlocked_count: i === 0 ? 3 : 0,
            interview_count: i === 0 ? 2 : 0,
        }))
        : DEFAULT_JOBS

    // Add draft if not present
    const hasDraft = allJobs.some(j => j.status === 'draft')
    const combinedJobs = hasDraft ? allJobs : [...allJobs, DEFAULT_JOBS[2]]

    const filteredJobs = combinedJobs.filter(j => {
        if (filterTab === 'active') return j.status === 'active'
        if (filterTab === 'draft') return j.status === 'draft'
        if (filterTab === 'closed') return j.status === 'closed'
        return true
    })

    const activeCount = combinedJobs.filter(j => j.status === 'active').length
    const draftCount = combinedJobs.filter(j => j.status === 'draft').length
    const closedCount = combinedJobs.filter(j => j.status === 'closed').length

    const handleReviewCandidates = (jobId) => {
        useStore.setState({ selectedCandidateJobId: jobId })
        navigate('employer-candidates')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DesignStyles />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ font: '900 22px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, margin: '0 0 5px' }}>
                        Lowongan Saya
                    </h1>
                    <div style={{ font: '600 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                        {combinedJobs.length} lowongan · {activeCount} aktif, {draftCount} draf{closedCount > 0 ? `, ${closedCount} ditutup` : ''}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('employer-upload')}
                        className="kc-btn"
                        style={{ ...topBtn('#fff', KC.ink), padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FileText size={14} /> Upload Job Pack
                    </button>
                    <button
                        onClick={() => navigate('employer-post-job')}
                        className="kc-btn"
                        style={{ ...topBtn(KC.orange, '#fff'), padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Plus size={14} /> + Pasang Lowongan
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
                <button
                    onClick={() => setFilterTab('all')}
                    style={{
                        padding: '7px 12px',
                        background: filterTab === 'all' ? KC.ink : '#F1F5F9',
                        color: filterTab === 'all' ? '#fff' : '#475569',
                        border: `1.5px solid ${filterTab === 'all' ? KC.ink : '#CBD5E1'}`,
                        borderRadius: 999,
                        font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        flex: 'none',
                    }}
                >
                    Semua {combinedJobs.length}
                </button>
                <button
                    onClick={() => setFilterTab('active')}
                    style={{
                        padding: '7px 12px',
                        background: filterTab === 'active' ? '#ECFDF5' : '#fff',
                        color: '#065F46',
                        border: '1.5px solid #10B981',
                        borderRadius: 999,
                        font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        flex: 'none',
                    }}
                >
                    ● Aktif {activeCount}
                </button>
                <button
                    onClick={() => setFilterTab('draft')}
                    style={{
                        padding: '7px 12px',
                        background: filterTab === 'draft' ? '#FEF3C7' : '#fff',
                        color: '#B45309',
                        border: '1.5px solid #F59E0B',
                        borderRadius: 999,
                        font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        flex: 'none',
                    }}
                >
                    Draf {draftCount}
                </button>
                {closedCount > 0 && (
                    <button
                        onClick={() => setFilterTab('closed')}
                        style={{
                            padding: '7px 12px',
                            background: filterTab === 'closed' ? '#E2E8F0' : '#fff',
                            color: '#475569',
                            border: '1.5px solid #CBD5E1',
                            borderRadius: 999,
                            font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            flex: 'none',
                        }}
                    >
                        Ditutup {closedCount}
                    </button>
                )}
            </div>

            {/* Job List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredJobs.map((job) => {
                    const isDraft = job.status === 'draft'

                    if (isDraft) {
                        return (
                            <div
                                key={job.id}
                                style={{
                                    background: '#F1F5F9',
                                    border: '1.5px dashed #CBD5E1',
                                    borderRadius: 13,
                                    padding: 15,
                                    animation: 'kcUp .4s both',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                                    <div>
                                        <div style={{ font: '900 15px/1.25 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.4px', color: '#64748B', marginBottom: 5 }}>
                                            {job.title}
                                        </div>
                                        <div style={{ font: '600 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                            Belum dipublikasikan · estimasi {job.candidates_count} kandidat
                                        </div>
                                    </div>
                                    <span style={{ padding: '4px 9px', background: '#fff', border: '1px solid #CBD5E1', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#475569', flex: 'none' }}>
                                        Draf
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate('employer-post-job')}
                                    className="kc-btn"
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        padding: '11px 13px',
                                        background: KC.ink,
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 9,
                                        font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                        color: '#fff',
                                        minHeight: 44,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Lanjutkan Draf →
                                </button>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={job.id}
                            style={{
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 13,
                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                padding: 15,
                                animation: 'kcUp .4s both',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                                <div>
                                    <div style={{ font: '900 15px/1.25 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.4px', color: KC.ink, marginBottom: 5 }}>
                                        {job.title}
                                    </div>
                                    <div style={{ font: '600 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                        {job.location} · {job.work_type} · {job.salary}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 9px',
                                    background: job.status === 'active' ? '#ECFDF5' : '#F1F5F9',
                                    border: `1px solid ${job.status === 'active' ? '#10B981' : '#CBD5E1'}`,
                                    borderRadius: 999,
                                    font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif',
                                    color: job.status === 'active' ? '#065F46' : '#475569',
                                    flex: 'none',
                                }}>
                                    {job.status === 'active' ? 'Aktif' : 'Ditutup'}
                                </span>
                            </div>

                            {/* 4-Metric Grid */}
                            <div style={{ display: 'flex', gap: 8, padding: '11px 0', borderTop: '1px dashed #E2E8F0', borderBottom: '1px dashed #E2E8F0', marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '900 16px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>{job.candidates_count}</div>
                                    <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Kandidat</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '900 16px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>{job.strong_count}</div>
                                    <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Strong</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '900 16px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>{job.unlocked_count}</div>
                                    <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Unlocked</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ font: '900 16px/1 "Plus Jakarta Sans", sans-serif', color: '#6366F1' }}>{job.interview_count}</div>
                                    <div style={{ font: '700 9px/1.2 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 3 }}>Interview</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: 9 }}>
                                <button
                                    onClick={() => navigate('employer-post-job')}
                                    className="kc-btn"
                                    style={{
                                        flex: 'none',
                                        padding: '11px 16px',
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 9,
                                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                        font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif',
                                        color: KC.ink,
                                        minHeight: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleReviewCandidates(job.id)}
                                    className="kc-btn"
                                    style={{
                                        flex: 1,
                                        padding: '11px 13px',
                                        background: KC.orange,
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 9,
                                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                        font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                        color: '#fff',
                                        minHeight: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Lihat Kandidat AI →
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
