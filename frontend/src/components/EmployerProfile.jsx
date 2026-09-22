// Employer company profile: editable company data + real trust badges, plan
// and job counts (no placeholder numbers). The website is what the
// "Email perusahaan terverifikasi" badge compares the login email against.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BadgeCheck, Building2, Crown, LogOut, ShieldCheck } from 'lucide-react'
import useStore from '../store/useStore'
import { BrutalCard, DesignStyles, KC, topBtn } from './_design'
import { fetchEmployerTrust, fetchMyPlans, updateEmployerProfile } from '../services/api'

const inputStyle = { width: '100%', padding: '10px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 9, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }

export default function EmployerProfile() {
    const { employerProfile, loadEmployerProfile, navigate, logout, user, openUpgradeModal, employerJobs, refreshEmployerJobs } = useStore()
    const [form, setForm] = useState({ company_name: '', industry: '', website: '', description: '' })
    const [saving, setSaving] = useState(false)
    const [trust, setTrust] = useState(null)
    const [plans, setPlans] = useState(null)

    useEffect(() => {
        loadEmployerProfile()
        refreshEmployerJobs()
        fetchEmployerTrust().then(setTrust).catch(() => setTrust(null))
        fetchMyPlans().then(setPlans).catch(() => setPlans(null))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (employerProfile) {
            setForm({
                company_name: employerProfile.company_name || '',
                industry: employerProfile.industry || '',
                website: employerProfile.website || '',
                description: employerProfile.description || '',
            })
        }
    }, [employerProfile])

    const save = async () => {
        setSaving(true)
        try {
            const website = form.website.trim()
            await updateEmployerProfile({
                company_name: form.company_name.trim(),
                industry: form.industry.trim(),
                description: form.description,
                website: website ? (website.startsWith('http') ? website : `https://${website}`) : '',
            })
            await loadEmployerProfile()
            fetchEmployerTrust().then(setTrust).catch(() => {})
            toast.success('Profil perusahaan disimpan')
        } catch (e) {
            toast.error('Gagal menyimpan: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    const active = (employerJobs || []).filter((j) => j.is_active).length
    const lighthouse = plans?.lighthouse_until
    const planLabel = lighthouse ? `Max 5x s/d ${String(lighthouse).slice(0, 10)}` : 'Lite (gratis)'
    const badges = trust?.badges || {}

    return (
        <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
            <DesignStyles />
            <BrutalCard color={KC.ink} shadow={KC.orange}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: '#fff' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Building2 size={28} />
                        <div>
                            <div style={{ fontWeight: 900, fontSize: 20 }}>{form.company_name || 'Perusahaan'}</div>
                            <div style={{ fontSize: 13, opacity: 0.7 }}>{user?.email}</div>
                        </div>
                    </div>
                    <button onClick={logout} style={{ ...topBtn('transparent', '#FCA5A5', '#FCA5A5'), boxShadow: 'none' }}><LogOut size={13} /> Keluar</button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {[['email_verified', 'Email terverifikasi'], ['company_email', 'Email perusahaan'], ['admin_reviewed', 'Ditinjau admin']].map(([k, label]) => (
                        <span key={k} style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                            color: badges[k] ? '#10B981' : 'rgba(255,255,255,.55)', border: `1px solid ${badges[k] ? '#10B981' : 'rgba(255,255,255,.3)'}` }}>
                            <BadgeCheck size={13} /> {label}{badges[k] ? '' : ' — belum'}
                        </span>
                    ))}
                </div>
            </BrutalCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <BrutalCard padding={16}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: KC.mute, textTransform: 'uppercase' }}>Paket</div>
                    <div style={{ fontWeight: 900, fontSize: 18, margin: '6px 0' }}>{planLabel}</div>
                    <button style={{ ...topBtn('#F59E0B', KC.ink), background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', padding: '10px 16px', fontSize: 13 }} onClick={() => openUpgradeModal()}><Crown size={15} /> Upgrade Premium</button>
                </BrutalCard>
                <BrutalCard padding={16}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: KC.mute, textTransform: 'uppercase' }}>Lowongan aktif</div>
                    <div style={{ fontWeight: 900, fontSize: 26, margin: '6px 0' }}>{active}<span style={{ fontSize: 14, color: KC.mute }}> / {lighthouse ? 5 : 1} (+ lowongan Pro)</span></div>
                    <button style={topBtn()} onClick={() => navigate('employer-jobs')}>Kelola lowongan</button>
                </BrutalCard>
            </div>

            <BrutalCard>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>Data perusahaan</div>
                <div style={{ display: 'grid', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Nama usaha
                        <input style={inputStyle} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                    </label>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Industri
                        <input style={inputStyle} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Contoh: F&B / Ritel / Logistik" />
                    </label>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Website
                        <input style={inputStyle} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="tokomaju.co.id" />
                        <span style={{ fontSize: 12, color: KC.mute, fontWeight: 400 }}>Jika email login memakai domain website ini dan sudah diverifikasi, lowongan mendapat badge &quot;Email perusahaan&quot;.</span>
                    </label>
                    <label style={{ fontSize: 13, fontWeight: 700 }}>Deskripsi singkat
                        <textarea rows={3} style={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </label>
                    <button style={topBtn(KC.ink, '#fff')} disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
                </div>
            </BrutalCard>

            <button onClick={() => navigate('employer-verification')} style={{ ...topBtn(), justifyContent: 'space-between', padding: 15 }}>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><ShieldCheck size={16} /> Kepercayaan, badge & pedoman lowongan</span> →
            </button>
        </div>
    )
}
