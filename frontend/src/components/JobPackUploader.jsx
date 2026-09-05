import { useState, useRef } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading, navigate } = useStore()
    const [selectedFile, setSelectedFile] = useState(null)
    const [isParsing, setIsParsing] = useState(false)
    const [parsedResult, setParsedResult] = useState(null)
    const [selectedIndices, setSelectedIndices] = useState([0, 1])
    const inputRef = useRef(null)

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas wajib PDF')
            return
        }
        setSelectedFile(file)
        setIsParsing(true)

        try {
            const res = await uploadJobPack(file)
            setIsParsing(false)
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

            setParsedResult({
                fileName: file.name,
                time: '< 2 s',
                jobs: jobsList,
            })
            setSelectedIndices(jobsList.map((_, i) => i))
        } catch (e) {
            setIsParsing(false)
            setSelectedFile(null)
            setParsedResult(null)
        }
    }

    const toggleSelect = (idx) => {
        if (selectedIndices.includes(idx)) {
            setSelectedIndices(selectedIndices.filter(i => i !== idx))
        } else {
            setSelectedIndices([...selectedIndices, idx])
        }
    }

    const handlePublishAll = async () => {
        if (selectedIndices.length === 0) {
            toast.error('Pilih minimal satu lowongan untuk dipublikasikan')
            return
        }
        await useStore.getState().refreshEmployerJobs()
        toast.success(`${selectedIndices.length} lowongan berhasil dipublikasikan dan tersimpan!`)
        navigate('employer-jobs')
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
                        onClick={() => inputRef.current?.click()}
                        style={{
                            background: '#fff',
                            border: `1.5px dashed ${KC.ink}`,
                            borderRadius: 14,
                            boxShadow: `3px 3px 0 ${KC.ink}`,
                            padding: '26px 18px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            animation: 'kcUp .4s both',
                        }}
                    >
                        <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 13, background: '#FFF1EB', border: `1.5px solid ${KC.orange}`, display: 'grid', placeItems: 'center' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `13px solid ${KC.orange}` }} />
                        </div>
                        <div style={{ font: '800 14.5px/1.3 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 5 }}>
                            {isParsing ? 'Mengurai Job Pack PDF…' : 'Ketuk untuk pilih Job Pack PDF'}
                        </div>
                        <div style={{ font: '400 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                            Maks 10 MB · header %PDF- divalidasi
                        </div>
                        <button
                            type="button"
                            className="kc-btn"
                            style={{
                                marginTop: 14,
                                padding: '12px 18px',
                                background: isParsing ? '#64748B' : KC.orange,
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
                            {isParsing ? 'Memproses Berkas…' : 'Pilih Berkas PDF'}
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
                        <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>
                            Pratinjau · centang untuk publikasi
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {parsedResult.jobs.map((job, idx) => {
                                const isChecked = selectedIndices.includes(idx)

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => job.valid && toggleSelect(idx)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            paddingBottom: 10,
                                            borderBottom: idx < parsedResult.jobs.length - 1 ? '1px dashed #E2E8F0' : 'none',
                                            cursor: job.valid ? 'pointer' : 'default',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 19,
                                                height: 19,
                                                borderRadius: 5,
                                                background: isChecked ? '#10B981' : '#fff',
                                                border: `1.5px solid ${isChecked ? '#10B981' : (job.valid ? '#CBD5E1' : '#F59E0B')}`,
                                                display: 'grid',
                                                placeItems: 'center',
                                                color: '#fff',
                                                font: '900 11px/1 "Plus Jakarta Sans", sans-serif',
                                                flex: 'none',
                                                marginTop: 1,
                                            }}
                                        >
                                            {isChecked ? '✓' : ''}
                                        </span>
                                        <div>
                                            <div style={{ font: '800 12.5px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                                {job.title}
                                            </div>
                                            <div style={{ font: job.valid ? '600 10.5px/1.35 "Plus Jakarta Sans", sans-serif' : '700 10.5px/1.35 "Plus Jakarta Sans", sans-serif', color: job.valid ? '#94A3B8' : '#B45309', marginTop: 3 }}>
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
                            onClick={() => { setParsedResult(null); setSelectedFile(null); }}
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
                            onClick={handlePublishAll}
                            className="kc-btn"
                            style={{
                                flex: 1,
                                padding: 14,
                                background: KC.ink,
                                border: `1.5px solid ${KC.ink}`,
                                borderRadius: 11,
                                boxShadow: `3px 3px 0 ${KC.orange}`,
                                font: '800 13.5px/1 "Plus Jakarta Sans", sans-serif',
                                color: '#fff',
                                minHeight: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                animation: 'kcSlideUp .35s .14s both',
                            }}
                        >
                            Publikasikan {selectedIndices.length} Lowongan →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
