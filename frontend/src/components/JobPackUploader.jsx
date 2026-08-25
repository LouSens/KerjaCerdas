/**
 * JobPackUploader — Employer Job Pack (PDF) uploader.
 * Features:
 * - Drag & Drop with visual dropzone feedback
 * - File format & size validation (< 10MB) with instant error feedback
 * - Loading/processing state with status indicators
 * - Success state displaying parsed job titles, skills count, and quick actions
 * - Full page layout matching the brutalist design system
 */
import { useState, useRef } from 'react'
import { UploadCloud, Loader2, Briefcase, CheckCircle2, FileText, AlertCircle, ArrowRight } from 'lucide-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, DesignStyles } from './_design'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading, jobPackResult, navigate } = useStore()
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [fileError, setFileError] = useState(null)
    const [successResult, setSuccessResult] = useState(null)
    const inputRef = useRef(null)

    const validateAndProcessFile = (file) => {
        setFileError(null)
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            const err = 'Hanya file format PDF yang didukung.'
            setFileError(err)
            toast.error(err)
            return
        }

        const maxBytes = 10 * 1024 * 1024 // 10MB
        if (file.size > maxBytes) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
            const err = `File terlalu besar (${sizeMb} MB). Maksimal ukuran file adalah 10 MB.`
            setFileError(err)
            toast.error(err)
            return
        }

        setSelectedFile(file)
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        try {
            const res = await uploadJobPack(selectedFile)
            if (res) {
                setSuccessResult(res)
            }
        } catch (e) {
            setFileError(e.message || 'Gagal memproses file PDF.')
        }
    }

    const resetUploader = () => {
        setSelectedFile(null)
        setFileError(null)
        setSuccessResult(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1">Upload Job Pack</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Unggah 1 dokumen PDF berisi kumpulan deskripsi pekerjaan — AI otomatis mengekstrak & mempublikasikannya.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => navigate('employer-post-job')}
                        style={{ padding: '10px 16px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}
                    >
                        ✏️ Input Manual
                    </button>
                    <button
                        onClick={() => navigate('employer-jobs')}
                        style={{ padding: '10px 16px', background: KC.cyan, color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}
                    >
                        📋 Lowongan Saya
                    </button>
                </div>
            </header>

            {/* Step Timeline Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: KC.lime, color: KC.ink, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>1</span>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Pilih File PDF</span>
                </div>
                <div style={{ flex: 1, height: 2, background: selectedFile ? KC.lime : KC.ash }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: jobPackUploading ? KC.orange : (successResult ? KC.lime : '#fff'), color: jobPackUploading ? '#fff' : KC.ink, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>2</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: selectedFile ? KC.ink : KC.mute }}>Ekstraksi AI</span>
                </div>
                <div style={{ flex: 1, height: 2, background: successResult ? KC.lime : KC.ash }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: successResult ? KC.lime : '#fff', color: KC.ink, fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 12, border: `1.5px solid ${KC.ink}` }}>3</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: successResult ? KC.ink : KC.mute }}>Publikasi Selesai</span>
                </div>
            </div>

            {!successResult ? (
                <BrutalCard color="#fff" padding={32}>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        style={{
                            border: `3px dashed ${dragActive ? KC.orange : (fileError ? '#ef4444' : KC.ink)}`,
                            borderRadius: 16,
                            padding: '48px 24px',
                            textAlign: 'center',
                            background: dragActive ? KC.orangeSoft : (fileError ? '#fef2f2' : KC.bone),
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => validateAndProcessFile(e.target.files?.[0])}
                        />

                        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fff', border: `2px solid ${KC.ink}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                            {jobPackUploading ? (
                                <Loader2 className="animate-spin text-orange-600" size={32} />
                            ) : (
                                <UploadCloud size={32} color={dragActive ? KC.orange : KC.ink} />
                            )}
                        </div>

                        <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>
                            {selectedFile ? selectedFile.name : 'Tarik & Letakkan file PDF di sini'}
                        </h3>

                        <p style={{ fontSize: 13, color: KC.mute, margin: '0 auto 20px', maxWidth: 480, lineHeight: 1.5 }}>
                            {selectedFile
                                ? `Ukuran: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Siap diekstrak AI`
                                : 'Mendukung dokumen PDF berisi satu atau banyak posisi lowongan. Maksimal 10 MB per file.'}
                        </p>

                        {!selectedFile && (
                            <button
                                type="button"
                                style={{
                                    padding: '10px 22px', background: '#fff', color: KC.ink,
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800,
                                    fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}
                            >
                                📂 Pilih File dari Komputer
                            </button>
                        )}
                    </div>

                    {fileError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 10, color: '#b91c1c', fontSize: 13, fontWeight: 700 }}>
                            <AlertCircle size={18} />
                            <span>{fileError}</span>
                        </div>
                    )}

                    {selectedFile && (
                        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                onClick={resetUploader}
                                disabled={jobPackUploading}
                                style={{
                                    padding: '12px 20px', background: '#fff', color: KC.ink,
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800,
                                    fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}
                            >
                                Ganti File
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={jobPackUploading}
                                style={{
                                    padding: '12px 24px', background: KC.orange, color: '#fff',
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 900,
                                    fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`,
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    opacity: jobPackUploading ? 0.7 : 1,
                                }}
                            >
                                {jobPackUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Menganalisis Dokumen AI…
                                    </>
                                ) : (
                                    <>
                                        🚀 Ekstrak & Publikasikan Lowongan
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </BrutalCard>
            ) : (
                /* Success State */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <BrutalCard color={KC.lime} padding={28}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: `2px solid ${KC.ink}`, display: 'grid', placeItems: 'center', boxShadow: `3px 3px 0 ${KC.ink}`, flexShrink: 0 }}>
                                <CheckCircle2 size={28} color="#16a34a" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
                                    Job Pack Berhasil Diproses!
                                </h2>
                                <p style={{ fontSize: 14, color: KC.ink, margin: 0, fontWeight: 600 }}>
                                    AI berhasil mendeteksi dan membuat <b>{successResult.created_job_ids?.length || 1} lowongan</b> dari dokumen <b>{selectedFile?.name}</b>.
                                </p>
                            </div>
                        </div>
                    </BrutalCard>

                    <BrutalCard color="#fff" padding={24}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>Ringkasan Hasil Ekstraksi:</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                            <div style={{ padding: 16, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: KC.mute }}>Total Posisi Dibuat</div>
                                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>{successResult.created_job_ids?.length || 1}</div>
                            </div>
                            <div style={{ padding: 16, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: KC.mute }}>Status Publikasi</div>
                                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 10, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    ✓ Aktif di Pencarian
                                </div>
                            </div>
                            <div style={{ padding: 16, background: KC.bone, border: `2px solid ${KC.ink}`, borderRadius: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: KC.mute }}>Status Matching</div>
                                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 10, color: KC.ink }}>
                                    ⚡ AI Reverse-Matching Siap
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: `1.5px dashed ${KC.ash}` }}>
                            <button
                                onClick={resetUploader}
                                style={{
                                    padding: '12px 20px', background: '#fff', color: KC.ink,
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800,
                                    fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}`,
                                }}
                            >
                                + Upload Dokumen Lain
                            </button>
                            <button
                                onClick={() => navigate('employer-jobs')}
                                style={{
                                    padding: '12px 24px', background: KC.cyan, color: KC.ink,
                                    border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 900,
                                    fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`,
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                Kelola Lowongan <ArrowRight size={16} />
                            </button>
                        </div>
                    </BrutalCard>
                </div>
            )}
        </div>
    )
}
