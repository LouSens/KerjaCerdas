/**
 * EmployerProfile — Clean enterprise company profile and legal entity management.
 */
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, topBtn, Tag, DesignStyles } from './_design'
import { updateEmployerProfile } from '../services/api'
import toast from 'react-hot-toast'
import { Building2, ShieldCheck, CheckCircle2 } from 'lucide-react'

const INDUSTRIES = [
    'Teknologi & Perangkat Lunak',
    'Keuangan, FinTech & Perbankan',
    'E-Commerce & Logistik',
    'Telekomunikasi & Infrastruktur',
    'Kesehatan & Farmasi',
    'Pendidikan & EdTech',
    'FMCG & Retail Modern',
    'Manufaktur & Energi',
]

// The API stores one of four canonical values; the label is display-only.
// Sending the label used to persist a value the backend could not read back.
const COMPANY_SIZES = [
    { value: 'startup', label: '1 - 50 Karyawan (Startup)' },
    { value: 'sme', label: '51 - 200 Karyawan (UKM)' },
    { value: 'mid', label: '201 - 1000 Karyawan (Menengah)' },
    { value: 'enterprise', label: '1000+ Karyawan (Enterprise)' },
]

export default function EmployerProfile() {
    const { employerProfile, loadEmployerProfile, navigate } = useStore()
    const [form, setForm] = useState({
        company_name: 'GoTo Group (PT GoTo Gojek Tokopedia Tbk)',
        npwp: '01.234.567.8-012.000',
        industry: 'Teknologi & Perangkat Lunak',
        size: 'enterprise',
        region_code: '3171',
        website: 'https://gotocompany.com',
        description: 'Ekosistem digital terdepan di Indonesia yang mengintegrasikan layanan on-demand, e-commerce, dan teknologi finansial.',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadEmployerProfile()
    }, []) // eslint-disable-line

    useEffect(() => {
        if (employerProfile) {
            setForm(prev => ({
                ...prev,
                company_name: employerProfile.company_name || prev.company_name,
                npwp: employerProfile.npwp || prev.npwp,
                industry: employerProfile.industry || prev.industry,
                size: employerProfile.size || prev.size,
                website: employerProfile.website || prev.website,
                description: employerProfile.description || prev.description,
            }))
        }
    }, [employerProfile])

    const handleSave = async () => {
        if (!form.company_name.trim()) {
            toast.error('Nama perusahaan wajib diisi')
            return
        }
        setSaving(true)
        try {
            await updateEmployerProfile(form)
            await loadEmployerProfile()
            toast.success('Profil perusahaan berhasil diperbarui!')
        } catch (e) {
            toast.error('Gagal menyimpan: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: `1.5px solid ${KC.ink}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: '#fff',
        outline: 'none',
    }

    const labelStyle = {
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: KC.mute,
        display: 'block',
        marginBottom: 5,
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />

            {/* Header */}
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}` }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>
                        Profil Entitas & Perusahaan
                    </h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>
                        Informasi institusi resmi untuk verifikasi NPWP dan keterbukaan profil rekrutmen
                    </p>
                </div>
                <button onClick={() => navigate('employer-verification')} style={topBtn('#fff')}>
                    <ShieldCheck size={14} color={KC.lime} /> Status Validasi NPWP →
                </button>
            </header>

            {/* Form Card */}
            <div className="kc-grid-main">
                <BrutalCard color="#FFFFFF" padding={26} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="kc-grid-2-col">
                        <div>
                            <label style={labelStyle}>Nama Resmi Entitas Bisnis</label>
                            <input
                                type="text"
                                value={form.company_name}
                                onChange={e => setForm({ ...form, company_name: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Nomor Pokok Wajib Pajak (NPWP)</label>
                            <input
                                type="text"
                                value={form.npwp}
                                onChange={e => setForm({ ...form, npwp: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div className="kc-grid-2-col">
                        <div>
                            <label style={labelStyle}>Sektor Industri</label>
                            <select
                                value={form.industry}
                                onChange={e => setForm({ ...form, industry: e.target.value })}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                {INDUSTRIES.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Skala Organisasi</label>
                            <select
                                value={form.size}
                                onChange={e => setForm({ ...form, size: e.target.value })}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                {COMPANY_SIZES.map(sz => (
                                    <option key={sz.value} value={sz.value}>{sz.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Situs Web Resmi Institusi</label>
                        <input
                            type="text"
                            value={form.website}
                            onChange={e => setForm({ ...form, website: e.target.value })}
                            placeholder="https://perusahaan.co.id"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Deskripsi Profil & Budaya Kerja</label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="kc-btn"
                            style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 24px', fontSize: 13 }}
                        >
                            {saving ? 'Menyimpan…' : 'Simpan Perubahan Profil'}
                        </button>
                    </div>
                </BrutalCard>

                {/* Right Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <BrutalCard color="#FFFFFF" padding={20}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Building2 size={18} color={KC.ink} />
                            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: KC.ink, margin: 0 }}>
                                Kredibilitas Institusi
                            </h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: KC.inkLight }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} />
                                <span>NPWP Aktif DJP Online</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} />
                                <span>Domain Korporat Terverifikasi</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={15} color={KC.lime} />
                                <span>Badge Prioritas Pelamar Kerja</span>
                            </div>
                        </div>
                    </BrutalCard>
                </div>
            </div>
        </div>
    )
}
