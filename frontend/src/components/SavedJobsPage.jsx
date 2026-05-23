import useStore from '../store/useStore'

export default function SavedJobsPage() {
    const { savedJobs, toggleSaveJob, navigate } = useStore()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-kc-dark">Tersimpan</h1>
                <p className="text-sm text-kc-gray mt-1">{savedJobs.length} lowongan disimpan</p>
            </div>

            {savedJobs.length === 0 ? (
                <div className="border-2 border-kc-dark bg-white p-8 text-center">
                    <p className="text-sm text-kc-gray">Belum ada lowongan tersimpan.</p>
                    <button
                        onClick={() => navigate('seeker-match')}
                        className="mt-3 text-xs font-bold text-kc-dark border-2 border-kc-dark px-4 py-2 hover:bg-kc-dark hover:text-white transition-colors"
                    >
                        Cari Lowongan
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {savedJobs.map((job, i) => (
                        <div key={job.job_id || job.id || i} className="border-2 border-kc-dark bg-white p-4 flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono text-kc-gray">{job.company || 'Company'}</p>
                                <p className="font-bold text-sm text-kc-dark">{job.title || job.job_title}</p>
                                <p className="text-xs text-kc-gray mt-0.5">{job.location || 'Jakarta'} · {job.salary_range || 'Competitive'}</p>
                                {job.savedAt && (
                                    <p className="text-[10px] text-kc-gray mt-1 font-mono">
                                        Disimpan {new Date(job.savedAt).toLocaleDateString('id-ID')}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => toggleSaveJob(job)}
                                className="text-xs font-semibold text-kc-dark border border-kc-dark px-2 py-1 hover:bg-kc-peach transition-colors shrink-0"
                            >
                                Hapus
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
