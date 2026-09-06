import { useState, useRef } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { createEmployerJob } from '../services/api'
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading, navigate } = useStore()
    const [selectedFile, setSelectedFile] = useState(null)
    const [parsedResult, setParsedResult] = useState(null)
    const [dragActive, setDragActive] = useState(false)
    const [publishing, setPublishing] = useState(false)
    // Which parsed postings the employer actually wants published — a job
    // pack can extract entries nobody asked to publish (a stray table row,
    // a listing that's actually closed, etc.), so confirming the batch must
    // let each one be reviewed and excluded, not just accepted wholesale.
    const [checkedIds, setCheckedIds] = useState(() => new Set())
    const inputRef = useRef(null)

    const toggleJobChecked = (localId) => {
        setCheckedIds(prev => {
            const next = new Set(prev)
            if (next.has(localId)) next.delete(localId)
            else next.add(localId)
            return next
        })
    }

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas wajib PDF')
            return
        }
        setSelectedFile(file)

        const startedAt = performance.now()
        try {
            // Parsing only extracts and returns the postings — nothing is
            // written to the database yet (see POST /uploads/job-pack), so
            // there is nothing to track or clean up if this batch is later
            // replaced or abandoned before the employer confirms it.
            const res = await uploadJobPack(file)
            if (!res?.jobs?.length) {
                toast.error('Tidak ada lowongan yang berhasil diurai dari berkas PDF ini.')
                setSelectedFile(null)
                setParsedResult(null)
                return
            }

            const elapsedSeconds = (performance.now() - startedAt) / 1000
            // Each job gets a stable idempotency token here, once, so it
            // stays the same across retries of handleConfirmPublish for
            // this same job — the server uses it to detect a duplicate
            // create request whose original response was lost.
            setParsedResult({
                fileName: file.name,
                time: `${elapsedSeconds.toFixed(1)} dtk`,
                jobs: res.jobs.map(job => ({ ...job, client_ref: crypto.randomUUID() })),
            })
            // Everything starts checked — reviewing is opt-out (uncheck what
            // you don't want), which matches what most packs need (mostly
            // real postings) without forcing a click per row for the common
            // case.
            setCheckedIds(new Set(res.jobs.map(j => j.local_id)))
        } catch (e) {
            toast.error('Ekstraksi dokumen gagal: ' + (e.message || 'Periksa berkas Anda lalu coba unggah ulang.'))
            setSelectedFile(null)
            setParsedResult(null)
        }
    }

    // Nothing exists in the database until this runs — this is the only
    // point a parsed posting is actually created (via the same endpoint the
    // manual "Pasang Lowongan" form uses), so an abandoned/replaced batch
    // simply never gets this far and never touches the database at all.
    const handleConfirmPublish = async () => {
        const jobs = (parsedResult?.jobs || []).filter(job => checkedIds.has(job.local_id))
        if (!jobs.length) return
        setPublishing(true)
        try {
            const results = await Promise.allSettled(
                jobs.map(job => createEmployerJob({
                    title: job.title,
                    description: job.description,
                    responsibilities: job.responsibilities,
                    required_skills: job.required_skills,
                    nice_to_have_skills: job.nice_to_have_skills,
                    education_min: job.education_min,
                    experience_years_min: job.experience_years_min,
                    region_code: job.region_code,
                    location: job.location,
                    remote_allowed: job.remote_allowed,
                    salary_min: job.salary_min,
                    salary_max: job.salary_max,
                    kbji_code: job.kbji_code,
                    client_ref: job.client_ref,
                }))
            )
            const succeededLocalIds = new Set(
                jobs.filter((_, i) => results[i].status === 'fulfilled').map(j => j.local_id)
            )
            const createdCount = succeededLocalIds.size
            const failedJobs = jobs.filter(j => !succeededLocalIds.has(j.local_id))
            await useStore.getState().refreshEmployerJobs()

            if (failedJobs.length === 0) {
                toast.success(`${createdCount} lowongan berhasil dipublikasikan dan siap dikelola!`)
                navigate('employer-jobs')
                return
            }

            // Failed postings were never persisted (createEmployerJob threw,
            // so there is no row for them in Kelola Lowongan to retry from)
            // — navigating away here would lose the only copy of them. Drop
            // only the ones that actually got created; anything still
            // unpublished (failed just now, or simply left unchecked) stays
            // on screen so retrying is one more click on this same button.
            setParsedResult(prev => prev ? { ...prev, jobs: prev.jobs.filter(j => !succeededLocalIds.has(j.local_id)) } : prev)
            setCheckedIds(new Set(failedJobs.map(j => j.local_id)))

            if (createdCount > 0) {
                toast.error(`${createdCount} dari ${jobs.length} lowongan berhasil dipublikasikan. ${failedJobs.length} gagal — coba lagi di bawah.`)
            } else {
                toast.error('Gagal mempublikasikan lowongan. Coba lagi.')
            }
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#059669' }}>
                                Daftar lowongan terurai · pilih yang ingin dipublikasikan
                            </div>
                            <div style={{ font: '700 10.5px/1 "JetBrains Mono", monospace', color: '#94A3B8' }}>
                                {checkedIds.size}/{parsedResult.jobs.length} dipilih
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {parsedResult.jobs.map((job, idx) => {
                                const checked = checkedIds.has(job.local_id)
                                return (
                                    <div
                                        key={job.local_id}
                                        onClick={() => toggleJobChecked(job.local_id)}
                                        role="checkbox"
                                        aria-checked={checked}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                toggleJobChecked(job.local_id)
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            paddingBottom: 10,
                                            borderBottom: idx < parsedResult.jobs.length - 1 ? '1px dashed #E2E8F0' : 'none',
                                            cursor: 'pointer',
                                            opacity: checked ? 1 : 0.5,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 19,
                                                height: 19,
                                                borderRadius: 5,
                                                background: checked ? '#10B981' : '#fff',
                                                border: `1.5px solid ${checked ? '#10B981' : '#CBD5E1'}`,
                                                display: 'grid',
                                                placeItems: 'center',
                                                color: '#fff',
                                                font: '900 11px/1 "Plus Jakarta Sans", sans-serif',
                                                flex: 'none',
                                                marginTop: 1,
                                            }}
                                        >
                                            {checked ? '✓' : ''}
                                        </span>
                                        <div>
                                            <div style={{ font: '800 12.5px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink, textDecoration: checked ? 'none' : 'line-through' }}>
                                                {job.title}
                                            </div>
                                            <div style={{ font: '600 10.5px/1.35 "Plus Jakarta Sans", sans-serif', color: '#64748B', marginTop: 3 }}>
                                                {job.details}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => { setParsedResult(null); setSelectedFile(null); setCheckedIds(new Set()) }}
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
                            disabled={publishing || checkedIds.size === 0}
                            className="kc-btn"
                            style={{
                                flex: 1,
                                padding: 14,
                                background: publishing || checkedIds.size === 0 ? '#64748B' : KC.ink,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.orange}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: '#fff',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: publishing || checkedIds.size === 0 ? 'not-allowed' : 'pointer',
                                animation: 'kcSlideUp .35s .14s both',
                            }}
                        >
                            {publishing
                                ? 'Mempublikasikan…'
                                : checkedIds.size === 0
                                    ? 'Pilih minimal 1 lowongan'
                                    : `Konfirmasi & Publikasikan (${checkedIds.size}) →`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
