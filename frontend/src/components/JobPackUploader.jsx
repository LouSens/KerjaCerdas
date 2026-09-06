import { useState, useRef, useEffect } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { updateEmployerJob, deleteEmployerJob } from '../services/api'
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading, navigate } = useStore()
    const [selectedFile, setSelectedFile] = useState(null)
    const [parsedResult, setParsedResult] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const inputRef = useRef(null)
    // Tracks the still-pending (unconfirmed) draft batch so it can be
    // cleaned up if the employer abandons it — replaces it with a new
    // upload, or navigates/closes the tab without confirming.
    const pendingDraftIdsRef = useRef([])

    const discardPendingDrafts = () => {
        const ids = pendingDraftIdsRef.current
        pendingDraftIdsRef.current = []
        if (!ids.length) return
        // Best-effort — the batch was never confirmed, so nothing depends on
        // this succeeding synchronously; don't block the UI on it. keepalive
        // lets the browser finish these after the page starts unloading
        // instead of aborting them mid-flight (an ordinary fetch gets killed
        // the moment the document goes away).
        Promise.allSettled(ids.map(id => deleteEmployerJob(id, { keepalive: true }))).catch(() => {})
    }

    // React's unmount cleanup only fires on an in-app route change — it
    // never runs on a hard tab close/reload, since the JS runtime is torn
    // down before React gets a turn. `pagehide` is the one event guaranteed
    // to fire in both cases (including mobile Safari, where `beforeunload`
    // is unreliable), so it's what actually catches "closed the tab".
    useEffect(() => {
        window.addEventListener('pagehide', discardPendingDrafts)
        return () => {
            window.removeEventListener('pagehide', discardPendingDrafts)
            discardPendingDrafts()
        }
    }, [])

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas wajib PDF')
            return
        }
        setSelectedFile(file)

        try {
            const res = await uploadJobPack(file)
            if (!res || (!res.created_job_ids?.length && !res.jobs?.length)) {
                toast.error('Tidak ada lowongan yang berhasil diurai dari berkas PDF ini.')
                setSelectedFile(null)
                setParsedResult(null)
                return
            }

            const jobsList = (res.jobs && res.jobs.length > 0)
                ? res.jobs
                : res.created_job_ids.map((id, idx) => ({
                    id,
                    title: `Lowongan Terunggah #${idx + 1}`,
                    details: `ID: ${id.slice(0, 8)} · Berhasil diekstrak dari dokumen`,
                    valid: true,
                }))

            pendingDraftIdsRef.current = jobsList.map(j => j.id)
            setParsedResult({
                fileName: file.name,
                time: '< 2 s',
                jobs: jobsList,
            })
        } catch (e) {
            toast.error('Ekstraksi dokumen gagal: ' + (e.message || 'Periksa berkas Anda lalu coba unggah ulang.'))
            setSelectedFile(null)
            setParsedResult(null)
        }
    }

    // Job-pack uploads land as unpublished drafts (`is_active: false`) so a
    // batch of AI-parsed postings never goes live before the employer has
    // actually reviewed them. This confirms the reviewed batch and publishes
    // every job in it.
    const handleConfirmPublish = async () => {
        const jobs = parsedResult?.jobs || []
        if (!jobs.length) return
        // The batch is now "settled" — win or lose per-job below, none of
        // these drafts are abandoned/orphaned anymore, so the unmount
        // cleanup must leave them alone.
        pendingDraftIdsRef.current = []
        setPublishing(true)
        try {
            const results = await Promise.allSettled(
                jobs.map(job => updateEmployerJob(job.id, { is_active: true }))
            )
            const failedCount = results.filter(r => r.status === 'rejected').length
            await useStore.getState().refreshEmployerJobs()
            if (failedCount === 0) {
                toast.success(`${jobs.length} lowongan berhasil dipublikasikan dan siap dikelola!`)
            } else {
                toast.error(`${jobs.length - failedCount} dari ${jobs.length} lowongan berhasil dipublikasikan. ${failedCount} gagal — coba lagi dari Kelola Lowongan.`)
            }
            navigate('employer-jobs')
        } catch (e) {
            toast.error('Gagal mempublikasikan lowongan: ' + (e.message || 'Terjadi kesalahan'))
        } finally {
            setPublishing(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DesignStyles />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ font: '900 21px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, margin: '0 0 5px' }}>
                        Upload Job Pack
                    </h1>
                    <div style={{ font: '600 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                        Satu PDF berisi banyak lowongan sekaligus. AI memecahnya jadi entri terstruktur — dari jam menjadi detik.
                    </div>
                </div>
                <button
                    onClick={() => navigate('employer-post-job')}
                    style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
                >
                    Manual →
                </button>
            </div>

            {/* Dropzone Box */}
            <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
            />

            {!parsedResult ? (
                <>
                    <div
                        aria-busy={jobPackUploading}
                        onDragOver={(e) => {
                            if (jobPackUploading) return
                            e.preventDefault()
                            setDragActive(true)
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                            if (jobPackUploading) return
                            e.preventDefault()
                            setDragActive(false)
                            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
                        }}
                        onClick={() => {
                            if (jobPackUploading) return
                            inputRef.current?.click()
                        }}
                        style={{
                            background: '#fff',
                            border: `1.5px dashed ${dragActive ? KC.orange : KC.ink}`,
                            borderRadius: 14,
                            boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: '26px 18px',
                            textAlign: 'center',
                            cursor: jobPackUploading ? 'progress' : 'pointer',
                            pointerEvents: jobPackUploading ? 'none' : 'auto',
                            opacity: jobPackUploading ? 0.7 : 1,
                            animation: 'kcUp .4s both',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 13, background: '#FFF1EB', border: `1.5px solid ${KC.orange}`, display: 'grid', placeItems: 'center' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `13px solid ${KC.orange}` }} />
                        </div>
                        <div style={{ font: '800 14.5px/1.3 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 5 }}>
                            {jobPackUploading ? 'Mengurai Job Pack PDF…' : 'Ketuk atau seret Job Pack PDF ke sini'}
                        </div>
                        <div style={{ font: '400 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                            Maks 10 MB · header %PDF- divalidasi
                        </div>
                        <button
                            type="button"
                            disabled={jobPackUploading}
                            className="kc-btn"
                            style={{
                                marginTop: 14,
                                padding: '12px 18px',
                                background: jobPackUploading ? '#64748B' : KC.orange,
                                color: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 10,
                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                minHeight: 44,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            {jobPackUploading ? 'Memproses Berkas…' : 'Pilih Berkas PDF'}
                        </button>
                    </div>

                    <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 12, padding: '13px 15px' }}>
                        <div style={{ font: '800 12px/1.3 "Plus Jakarta Sans", sans-serif', color: '#92400E', marginBottom: 4 }}>
                            Format yang bekerja paling baik
                        </div>
                        <div style={{ font: '400 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#92400E' }}>
                            Satu lowongan per halaman, judul sebagai heading, keahlian dalam bullet. Hasil parsing tetap bisa diedit sebelum publikasi.
                        </div>
                    </div>
                </>
            ) : (
                /* Parsed Result Display */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 11, animation: 'kcSlideUp .35s both' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#10B981', display: 'grid', placeItems: 'center', color: '#fff', font: '900 14px/1 "Plus Jakarta Sans", sans-serif', flex: 'none' }}>
                            ✓
                        </div>
                        <div>
                            <div style={{ font: '800 13px/1.2 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                                {parsedResult.fileName} terurai
                            </div>
                            <div style={{ font: '700 11px/1.3 "JetBrains Mono", monospace', color: '#059669', marginTop: 2 }}>
                                {parsedResult.jobs.length} lowongan ditemukan · {parsedResult.time}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 15, animation: 'kcSlideUp .35s .07s both' }}>
                        <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#059669', marginBottom: 12 }}>
                            Daftar lowongan terurai · draf, menunggu konfirmasi publikasi
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {parsedResult.jobs.map((job, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        paddingBottom: 10,
                                        borderBottom: idx < parsedResult.jobs.length - 1 ? '1px dashed #E2E8F0' : 'none',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 19,
                                            height: 19,
                                            borderRadius: 5,
                                            background: '#10B981',
                                            border: '1.5px solid #10B981',
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: '#fff',
                                            font: '900 11px/1 "Plus Jakarta Sans", sans-serif',
                                            flex: 'none',
                                            marginTop: 1,
                                        }}
                                    >
                                        ✓
                                    </span>
                                    <div>
                                        <div style={{ font: '800 12.5px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                            {job.title}
                                        </div>
                                        <div style={{ font: '600 10.5px/1.35 "Plus Jakarta Sans", sans-serif', color: '#64748B', marginTop: 3 }}>
                                            {job.details}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => { discardPendingDrafts(); setParsedResult(null); setSelectedFile(null); }}
                            className="kc-btn"
                            style={{
                                flex: 'none',
                                padding: '14px 16px',
                                background: '#fff',
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.ink}`,
                                font: '800 12.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: KC.ink,
                                cursor: 'pointer',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            ← Unggah Ulang
                        </button>
                        <button
                            onClick={handleConfirmPublish}
                            disabled={publishing}
                            className="kc-btn"
                            style={{
                                flex: 1,
                                padding: 14,
                                background: publishing ? '#64748B' : KC.ink,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.orange}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: '#fff',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: publishing ? 'wait' : 'pointer',
                                animation: 'kcSlideUp .35s .14s both',
                            }}
                        >
                            {publishing ? 'Mempublikasikan…' : `Konfirmasi & Publikasikan (${parsedResult.jobs.length}) →`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
