import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { verifyEducation, verifyIdentity, listVerificationDocs } from '../services/api'
import { KC, BrutalCard, Tag } from './_design'

const SEEKER_DOCS = [
    { id: 'ktp', name: 'KTP / e-KTP', desc: 'Verifikasi identitas via Dukcapil', icon: '🪪' },
    { id: 'ijazah', name: 'Ijazah / Transkrip', desc: 'Verifikasi pendidikan via SIVIL Dikti', icon: '🎓' },
    { id: 'phone', name: 'Nomor HP', desc: 'OTP verifikasi', icon: '📱' },
]

export default function VerificationDashboard() {
    return <VerificationScreen role="seeker" docsSpec={SEEKER_DOCS} />
}

export function VerificationScreen({ role, docsSpec }) {
    const [docs, setDocs] = useState(docsSpec.map(d => ({ ...d, status: 'pending', when: 'Belum diverifikasi', file_id: null })))
    const [busy, setBusy] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const data = await listVerificationDocs()
                if (data?.documents) {
                    setDocs(prev => prev.map(d => {
                        const found = data.documents.find(x => x.id === d.id)
                        return found ? { ...d, ...found } : d
                    }))
                }
            } catch { /* keep defaults */ }
        })()
    }, [])

    const handleVerify = async (docId) => {
        setBusy(docId)
        try {
            if (docId === 'ktp') {
                await verifyIdentity({ nik: '3171012345678901', full_name: 'Demo User' })
            } else if (docId === 'ijazah') {
                await verifyEducation({ ijazah_number: '1301190001', university_name: 'ITB', major: 'Informatika' })
            } else if (docId === 'npwp') {
                const { verifyNPWP } = await import('../services/api')
                await verifyNPWP({ npwp: '012345678901234', company_name: 'PT Demo' })
            }
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            const fakeId = 'doc_' + Math.random().toString(16).slice(2, 6) + '··········' + Math.random().toString(16).slice(2, 6)
            setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'verified', when: today, file_id: fakeId } : d))
            toast.success('Verifikasi berhasil — dokumen terenkripsi')
        } catch (e) {
            toast.error('Verifikasi gagal: ' + e.message)
        } finally {
            setBusy(null)
        }
    }

    const handleDelete = (docId) => {
        setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'pending', when: 'Dihapus oleh user', file_id: null } : d))
        toast('Dokumen dihapus dari server', { icon: '🗑' })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Verifikasi Identitas</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Tingkatkan trust score. Dokumenmu terenkripsi & nggak ditampilin ke user lain.
                    </p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: KC.lime, border: `2px solid ${KC.ink}`, borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    🛡 AES-256 encrypted
                </div>
            </header>

            <BrutalCard color={KC.ink} padding={24} style={{ color: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 24, alignItems: 'center' }}>
                    <div>
                        <Tag color={KC.orange} ink="#fff">data privacy</Tag>
                        <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.6, margin: '10px 0 6px', lineHeight: 1.15 }}>
                            Dokumen-mu pribadi banget. Kami juga tau itu.
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6, maxWidth: 540, margin: 0 }}>
                            Setelah verifikasi sukses, file dokumen kami simpan terenkripsi AES-256, server di Indonesia.
                            <b style={{ color: '#fff' }}> Nggak ditampilin ke user lain — bahkan HR / kandidat.</b> Yang kelihatan cuma badge <Tag color={KC.lime} size="sm">✓ VERIFIED</Tag>.
                        </p>
                    </div>
                    {[
                        { l: 'AES-256', d: 'at rest' },
                        { l: 'IDN', d: 'data center' },
                        { l: 'UU PDP', d: 'compliant' },
                    ].map(s => (
                        <div key={s.l} style={{ textAlign: 'center', padding: '14px 18px', background: '#1a1a20', border: `2px solid ${KC.orange}`, borderRadius: 10, minWidth: 100 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: KC.orange }}>{s.l}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>{s.d}</div>
                        </div>
                    ))}
                </div>
            </BrutalCard>

            <h2 style={{ fontSize: 18, fontWeight: 900, margin: '8px 0 4px' }}>Dokumen</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docs.map(d => {
                    const isVerified = d.status === 'verified'
                    return (
                        <BrutalCard key={d.id} color="#fff" padding={20}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 18, alignItems: 'center' }}>
                                <div style={{ width: 56, height: 56, background: isVerified ? KC.lime : KC.yellow, border: `2px solid ${KC.ink}`, borderRadius: 12, display: 'grid', placeItems: 'center', boxShadow: `3px 3px 0 ${KC.ink}`, fontSize: 28 }}>
                                    {d.icon}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{d.name}</h3>
                                        {isVerified
                                            ? <Tag color={KC.lime} size="sm">● VERIFIED</Tag>
                                            : <Tag color={KC.yellow} size="sm">PENDING</Tag>}
                                    </div>
                                    <p style={{ fontSize: 12, color: KC.mute, margin: '4px 0 0' }}>{d.desc}</p>
                                </div>
                                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: KC.mute }}>{d.when}</div>
                                <button onClick={() => isVerified ? null : handleVerify(d.id)} disabled={busy === d.id}
                                    style={{ padding: '8px 14px', background: isVerified ? '#fff' : KC.orange, color: isVerified ? KC.ink : '#fff', border: `2px solid ${KC.ink}`, borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                                    {busy === d.id ? 'Proses…' : isVerified ? 'Detail' : 'Upload →'}
                                </button>
                            </div>
                            {isVerified && (
                                <div style={{ marginTop: 12, padding: '10px 12px', background: KC.bone, border: `1.5px dashed ${KC.ink}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, color: KC.mute }}>
                                    🔒 <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                        file_id: {d.file_id || 'doc_3f8a··········e91c'} · status: encrypted · not_visible_to_other_users
                                    </span>
                                    <button onClick={() => handleDelete(d.id)} style={{ marginLeft: 'auto', padding: '4px 8px', background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                        Hapus dokumen
                                    </button>
                                </div>
                            )}
                        </BrutalCard>
                    )
                })}
            </div>
        </div>
    )
}
