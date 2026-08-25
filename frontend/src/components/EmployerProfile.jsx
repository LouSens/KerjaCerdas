/**
 * EmployerProfile — company profile editing page.
 * Section 2.4: Previously missing from sidebar and not reachable.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, DesignStyles } from './_design'
import { updateEmployerProfile } from '../services/api'
import toast from 'react-hot-toast'

const INDUSTRIES = [
    'Teknologi', 'Keuangan & Perbankan', 'E-Commerce', 'Logistik',
    'Manufaktur', 'Kesehatan', 'Pendidikan', 'Media & Hiburan',
    'Konsultan', 'FMCG', 'Properti', 'Agrikultur', 'Lainnya',
]

const COMPANY_SIZES = [
    '1-10 karyawan', '11-50 karyawan', '51-200 karyawan',
    '201-500 karyawan', '501-1000 karyawan', '1000+ karyawan',
]

const labelStyle = {
    fontSize: 11, fontWeight: 900, letterSpacing: 0.6,
    textTransform: 'uppercase', color: '#64748b',
    marginBottom: 6, display: 'block',
}
const inputStyle = {
    padding: '10px 14px', background: '#fff', border: '2px solid #0f172a',
    borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
}

export default function EmployerProfile() {
    const { employerProfile, loadEmployerProfile, navigate } = useStore()
    const [form, setForm] = useState({
        company_name: '', npwp: '', industry: '', size: '',
        region_code: '3171', website: '', description: '',
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { loadEmployerProfile() }, []) // eslint-disable-line

    useEffect(() => {
        if (employerProfile) {
            setForm({
                company_name: employerProfile.company_name || '',
                npwp: employerProfile.npwp || '',
                industry: employerProfile.industry || '',
                size: employerProfile.size || '',
                region_code: employerProfile.region_code || '3171',
                website: employerProfile.website || '',
                description: employerProfile.description || '',
            })
        }
    }, [employerProfile])

    const handleSave = async () => {
        if (!form.company_name.trim()) { toast.error('Nama perusahaan wajib diisi'); return }
        setSaving(true)
        try {
            await updateEmployerProfile(form)
            await loadEmployerProfile()
            toast.success('Profil perusahaan tersimpan!')
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            toast.error('Gagal menyimpan: ' + e.message)
        } finally { setSaving(false) }
    }

    const F = ({ k, label, placeholder, type = 'text' }) => (
        <div>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
        </div>
    )
    const S = ({ k, label, options }) => (
        <div>
            <label style={labelStyle}>{label}</label>
            <select value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Pilih...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '2px solid #0f172a' }}>
                <div>
                    <h1 className="kc-h1">Profil Perusahaan</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Informasi yang ditampilkan ke kandidat dan untuk verifikasi NPWP.
                    </p>
                </div>
                <button onClick={() => navigate('employer-verification')} style={{ padding: '10px 16px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `2px 2px 0 ${KC.ink}` }}>
                    Verifikasi NPWP
                </button>
            </header>

            <BrutalCard color="#fff" padding={28}>
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>Informasi Perusahaan</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <F k="company_name" label="Nama Perusahaan *" placeholder="PT KerjaCerdas Indonesia" />
                        <F k="npwp" label="NPWP (15 digit)" placeholder="12.345.678.9-123.000" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <S k="industry" label="Industri" options={INDUSTRIES} />
                        <S k="size" label="Ukuran Perusahaan" options={COMPANY_SIZES} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <F k="region_code" label="Kode Wilayah" placeholder="3171 (Jakarta Pusat)" />
                        <F k="website" label="Website" placeholder="https://perusahaan.com" type="url" />
                    </div>
                    <div>
                        <label style={labelStyle}>Deskripsi Perusahaan</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Ceritakan tentang perusahaan, budaya kerja, dan visi misi..." rows={4}
                            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', background: saved ? KC.lime : KC.orange, color: '#fff', border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}`, opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Menyimpan...' : saved ? 'Tersimpan' : 'Simpan Profil'}
                    </button>
                    <button onClick={() => navigate('employer-post-job')} style={{ padding: '12px 24px', background: '#fff', color: KC.ink, border: `2px solid ${KC.ink}`, borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: `3px 3px 0 ${KC.ink}` }}>
                        Pasang Lowongan
                    </button>
                </div>
            </BrutalCard>
        </div>
    )
}
