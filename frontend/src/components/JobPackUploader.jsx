/**
 * JobPackUploader — Clean enterprise bulk PDF job pack uploader.
 */
import { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading, navigate } = useStore()
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [successResult, setSuccessResult] = useState(null)
    const inputRef = useRef(null)

    const handleFile = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Format berkas wajib PDF')
            return
        }
        setSelectedFile(file)
        // uploadJobPack (store action) already handles its own success/error
        // toasts and never rethrows, so no try/catch or duplicate toast here.
        const res = await uploadJobPack(file)
        if (res) setSuccessResult(res)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Bulk Upload Lowongan (Job Pack PDF)
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Unggah 1 dokumen PDF kompilasi — AI otomatis mengekstrak seluruh posisi ke dalam sistem
                    </p>
                </div>
                <button onClick={() => navigate('employer-post-job')} style={topBtn('#fff')}>
                    Input Manual Lowongan →
                </button>
            </header>

            {/* Main Upload Box */}
            <div className="kc-grid-main">
                <BrutalCard color="#FFFFFF" padding={32} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                            e.preventDefault()
                            setDragActive(false)
                            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
                        }}
                        onClick={() => inputRef.current?.click()}
                        style={{
                            width: '100%',
                            padding: '40px 20px',
                            border: `2px dashed ${dragActive ? KC.orange : KC.ink}`,
                            borderRadius: 10,
                            background: dragActive ? KC.orangeSoft : KC.surface,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 12,
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', color: KC.ink }}>
                            <UploadCloud size={26} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: KC.ink }}>
                                {jobPackUploading ? 'Mengekstrak Dokumen Massal…' : 'Upload Dokumen Job Pack (PDF)'}
                            </h3>
                            <p style={{ fontSize: 12, color: KC.mute, margin: 0 }}>
                                Pilih atau drag & drop berkas PDF hingga 20 lowongan per dokumen (maks. 10 MB).
                            </p>
                        </div>
                    </div>

                    {successResult && (
                        <div style={{ width: '100%', padding: '16px', background: KC.limeSoft, border: `1px solid ${KC.lime}`, borderRadius: 8, textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#047857', marginBottom: 4 }}>
                                Ekstraksi Berhasil
                            </div>
                            <div style={{ fontSize: 12, color: '#065F46' }}>
                                Ditemukan 4 lowongan baru siap dipublikasikan ke dasbor rekrutmen.
                            </div>
                        </div>
                    )}
                </BrutalCard>

                {/* Right Column: Spec Tips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color="#FFFFFF" padding={22}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: KC.ink, margin: '0 0 12px' }}>
                            Spesifikasi Dokumen Job Pack
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: KC.inkLight, lineHeight: 1.45 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>Gunakan judul posisi yang jelas pada tiap halaman.</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>Sertakan daftar keahlian utama dan rentang kompensasi.</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>Format dokumen teks terstruktur (bukan gambar raster).</span>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}
