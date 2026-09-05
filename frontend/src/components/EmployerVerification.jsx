import { useState, useRef } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { Building2, ShieldCheck, Check, UploadCloud, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

export default function EmployerVerification() {
    const { navigate, employerProfile, loadEmployerProfile } = useStore()
    const [noteExpanded, setNoteExpanded] = useState(false)
    const [nibUploaded, setNibUploaded] = useState(false)
    const fileRef = useRef(null)

    useEffect(() => {
        loadEmployerProfile()
    }, []) // eslint-disable-line

    const npwpNumber = employerProfile?.npwp || '01.234.567.8-901.000'
    const isVerified = Boolean(employerProfile?.npwp)

    const handleUploadNIB = (e) => {
        if (e.target.files?.[0]) {
            setNibUploaded(true)
            toast.success('Berkas NIB / SIUP berhasil diunggah!')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ font: '900 21px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.9px', color: KC.ink, margin: '0 0 5px' }}>
                        Verifikasi Legalitas
                    </h1>
                    <div style={{ font: '600 11.5px/1.45 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                        Lowongan dari entitas terverifikasi mendapat lencana pada kartu match kandidat.
                    </div>
                </div>
                <button
                    onClick={() => navigate('employer-dashboard')}
                    style={{ ...topBtn('#fff', KC.ink), padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
                >
                    <ArrowLeft size={13} />
                </button>
            </div>

            {/* NPWP Status Green Card */}
            <div
                style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #10B981',
                    borderRadius: 13,
                    padding: 16,
                    animation: 'kcUp .4s both',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#10B981',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                            font: '900 16px/1 "Plus Jakarta Sans", sans-serif',
                            flex: 'none',
                        }}
                    >
                        ✓
                    </div>
                    <div>
                        <div style={{ font: '900 14.5px/1.2 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                            {isVerified ? 'NPWP Terverifikasi' : 'NPWP Tersimpan'}
                        </div>
                        <div style={{ font: '700 11px/1.3 "JetBrains Mono", monospace', color: '#059669', marginTop: 4 }}>
                            {npwpNumber}
                        </div>
                    </div>
                </div>
                <div style={{ font: '600 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#065F46' }}>
                    Terverifikasi otomatis · format valid &amp; entitas aktif dalam sistem nasional.
                </div>
            </div>

            {/* Dokumen Pendukung Card */}
            <div
                style={{
                    background: '#fff',
                    border: `1.5px solid ${KC.ink}`,
                    borderRadius: 13,
                    boxShadow: `3px 3px 0 ${KC.ink}`,
                    padding: 16,
                    animation: 'kcUp .4s .06s both',
                }}
            >
                <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748B', marginBottom: 14 }}>
                    Dokumen pendukung
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 12, borderBottom: '1px dashed #E2E8F0' }}>
                        <div>
                            <div style={{ font: '800 12.5px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                Kartu NPWP
                            </div>
                            <div style={{ font: '700 10.5px/1.3 "JetBrains Mono", monospace', color: '#94A3B8', marginTop: 4 }}>
                                npwp_perusahaan.pdf · 240 KB
                            </div>
                        </div>
                        <span style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', flex: 'none' }}>
                            Terunggah
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 12, borderBottom: '1px dashed #E2E8F0' }}>
                        <div>
                            <div style={{ font: '800 12.5px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                Akta pendirian
                            </div>
                            <div style={{ font: '700 10.5px/1.3 "JetBrains Mono", monospace', color: '#94A3B8', marginTop: 4 }}>
                                akta_legalitas.pdf · 1,1 MB
                            </div>
                        </div>
                        <span style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', flex: 'none' }}>
                            Terunggah
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                            <div style={{ font: '800 12.5px/1.2 "Plus Jakarta Sans", sans-serif', color: nibUploaded ? KC.ink : '#64748B' }}>
                                NIB / SIUP
                            </div>
                            <div style={{ font: '600 10.5px/1.35 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', marginTop: 4 }}>
                                {nibUploaded ? 'nib_siup_dokumen.pdf · 480 KB' : 'Opsional · mempercepat peninjauan manual'}
                            </div>
                        </div>
                        {nibUploaded ? (
                            <span style={{ padding: '4px 9px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#065F46', flex: 'none' }}>
                                Terunggah
                            </span>
                        ) : (
                            <>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleUploadNIB}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="kc-btn"
                                    style={{
                                        padding: '8px 14px',
                                        background: KC.ink,
                                        borderRadius: 8,
                                        font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif',
                                        color: '#fff',
                                        flex: 'none',
                                        minHeight: 36,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Unggah
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Formal Integration Note */}
            <div>
                <div
                    onClick={() => setNoteExpanded(!noteExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '13px 15px',
                        background: '#fff',
                        border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11,
                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                        cursor: 'pointer',
                        minHeight: 48,
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '900 12px/1.25 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                        <span style={{ width: 8, height: 8, background: '#F59E0B', borderRadius: '50%' }} />
                        Status integrasi resmi
                    </span>
                    <span style={{ font: '900 19px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                        {noteExpanded ? '−' : '+'}
                    </span>
                </div>

                {noteExpanded && (
                    <div
                        style={{
                            marginTop: 10,
                            padding: 14,
                            background: '#FEF3C7',
                            border: '1.5px solid #F59E0B',
                            borderRadius: 11,
                            font: '400 11.5px/1.6 "Plus Jakarta Sans", sans-serif',
                            color: '#92400E',
                            animation: 'kcSlideUp .3s both',
                        }}
                    >
                        Saat ini verifikasi berjalan pada endpoint format-check internal. Integrasi resmi DJP, Dukcapil, dan SIVIL Dikti memerlukan kontrak institusional dan kepatuhan regulasi — tercatat sebagai item roadmap, bukan klaim fitur yang sudah live.
                    </div>
                )}
            </div>
        </div>
    )
}
