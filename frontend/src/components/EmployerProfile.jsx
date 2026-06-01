/**
 * EmployerProfile — edit company profile form.
 * Calls updateEmployerProfile API and refreshes store employerProfile on save.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { updateEmployerProfile } from '../services/api'
import { KC, BrutalCard, Tag, DesignStyles } from './_design'
import toast from 'react-hot-toast'

const INDUSTRIES = [
    'Teknologi', 'Keuangan & Perbankan', 'E-commerce', 'Logistik',
    'Kesehatan', 'Pendidikan', 'Manufaktur', 'Retail', 'Media & Hiburan',
    'Konsultansi', 'Pemerintahan', 'Agrikultur', 'Energi', 'Lainnya',
]
const SIZES = [
    { value: 'startup', label: 'Startup (1–50 karyawan)' },
    { value: 'sme', label: 'SME (50–250 karyawan)' },
    { value: 'mid', label: 'Mid-size (250–1000 karyawan)' },
    { value: 'enterprise', label: 'Enterprise (1000+ karyawan)' },
]
const REGIONS = [
    { code: '3171', label: 'Jakarta Pusat' },
    { code: '3172', label: 'Jakarta Utara' },
    { code: '3173', label: 'Jakarta Barat' },
    { code: '3174', label: 'Jakarta Selatan' },
    { code: '3175', label: 'Jakarta Timur' },
    { code: '3273', label: 'Bandung' },
    { code: '3578', label: 'Surabaya' },
    { code: '3471', label: 'Yogyakarta' },
    { code: '5171', label: 'Denpasar' },
    { code: '1275', label: 'Medan' },
    { code: '7371', label: 'Makassar' },
    { code: '6371', label: 'Balikpapan' },
]

export default function EmployerProfile() {
    const { employerProfile, loadEmployerProfile, user } = useStore()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        company_name: '', industry: '', size: 'sme',
        region_code: '3171', website: '', description: '', npwp: '',
    })

    useEffect(() => {
        loadEmployerProfile()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (employerProfile) {
            setForm({
                company_name: employerProfile.company_name || user.name || '',
                industry: employerProfile.industry || '',
                size: employerProfile.size || 'sme',
                region_code: employerProfile.region_code || '3171',
                website: employerProfile.website || '',
                description: employerProfile.description || '',
                npwp: employerProfile.npwp || '',
            })
        }
    }, [employerProfile, user.name])

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.company_name.trim()) {
            toast.error('Nama perusahaan wajib diisi')
            return
        }
        setSaving(true)
        try {
            await updateEmployerProfile(form)
            await loadEmployerProfile()
            toast.success('Profil perusahaan tersimpan!')
        } catch (err) {
            toast.error('Gagal simpan: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const inp = (extra = {}) => ({
        padding: '10px 14px', background: '#fff', border: `2px solid ${KC.ink}`,
        borderRadius: 10, fontSize: 13, fontWeight: 600, width: '100%',
        boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
        ...extra,
    })
    const label = { fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 6, display: 'block' }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `2px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .5s ease both' }}>Profil Perusahaan</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Profil lengkap meningkatkan kepercayaan kandidat dan visibilitas posting lowongan.
                    </p>
                </div>
                {employerProfile?.verified === 'verified' && (
                    <Tag color={KC.lime}>✓ NPWP Terverifikasi</Tag>
                )}
            </header>

            <form onSubmit={handleSave}>
                <div className="kc-grid-main">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <BrutalCard color="#fff" padding={24}>
                            <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 20px', letterSpacing: -0.4 }}>Informasi Perusahaan</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={label}>Nama Perusahaan *</label>
                                    <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                                        placeholder="PT. Contoh Indonesia" style={inp()} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={label}>Industri</label>
                                        <select value={form.industry} onChange={e => set('industry', e.target.value)} style={inp()}>
                                            <option value="">Pilih industri…</option>
                                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={label}>Ukuran Perusahaan</label>
                                        <select value={form.size} onChange={e => set('size', e.target.value)} style={inp()}>
                                            {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={label}>Lokasi Utama</label>
                                        <select value={form.region_code} onChange={e => set('region_code', e.target.value)} style={inp()}>
                                            {REGIONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={label}>Website</label>
                                        <input value={form.website} onChange={e => set('website', e.target.value)}
                                            placeholder="https://perusahaan.com" style={inp()} type="url" />
                                    </div>
                                </div>
                                <div>
                                    <label style={label}>Nomor NPWP</label>
                                    <input value={form.npwp} onChange={e => set('npwp', e.target.value)}
                                        placeholder="00.000.000.0-000.000" style={inp()} />
                                </div>
                                <div>
                                    <label style={label}>Deskripsi Perusahaan</label>
                                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                                        rows={5} placeholder="Ceritakan tentang perusahaan, kultur, dan misi Anda…"
                                        style={{ ...inp(), resize: 'vertical', lineHeight: 1.6 }} />
                                </div>
                            </div>
                        </BrutalCard>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <BrutalCard color={KC.orange} padding={20} style={{ color: '#fff' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>🏢</div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 8px' }}>Profil lengkap = lebih dipercaya</h3>
                            <p style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                                Kandidat 3× lebih sering melamar ke perusahaan dengan profil lengkap + terverifikasi.
                            </p>
                        </BrutalCard>

                        <BrutalCard color="#fff" padding={20}>
                            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: KC.mute, marginBottom: 12 }}>Checklist Profil</div>
                            {[
                                ['Nama perusahaan', !!form.company_name],
                                ['Industri', !!form.industry],
                                ['Ukuran', !!form.size],
                                ['Website', !!form.website],
                                ['Deskripsi', form.description.length > 20],
                            ].map(([label, ok]) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, marginBottom: 6, color: ok ? KC.ink : KC.mute }}>
                                    <span style={{ width: 18, height: 18, borderRadius: 5, background: ok ? KC.lime : '#fff', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', fontSize: 11 }}>{ok ? '✓' : ''}</span>
                                    {label}
                                </div>
                            ))}
                        </BrutalCard>

                        <button type="submit" disabled={saving} style={{
                            padding: '14px 20px', background: KC.ink, color: '#fff',
                            border: `2px solid ${KC.ink}`, borderRadius: 12, fontWeight: 900,
                            fontSize: 15, cursor: saving ? 'wait' : 'pointer',
                            boxShadow: `4px 4px 0 ${KC.orange}`, opacity: saving ? 0.7 : 1,
                            fontFamily: 'inherit', transition: 'opacity .15s',
                        }}>
                            {saving ? 'Menyimpan…' : 'Simpan Profil →'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
