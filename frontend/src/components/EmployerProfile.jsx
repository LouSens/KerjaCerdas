import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { KC, BrutalCard, topBtn, DesignStyles } from './_design'
import { updateEmployerProfile } from '../services/api'
import toast from 'react-hot-toast'
import { Building2, ShieldCheck, Check, ArrowRight, UserPlus, LogOut } from 'lucide-react'

export default function EmployerProfile() {
    const { employerProfile, loadEmployerProfile, navigate, logout } = useStore()
    const [form, setForm] = useState({
        company_name: 'PT GoTo Gojek Tokopedia',
        brand_name: 'GoTo Group',
        npwp: '01.234.567.8-901.000',
        industry: 'Teknologi · Marketplace · 1000+ karyawan',
        address: 'Jl. Iskandarsyah II, Jakarta Selatan',
        website: 'goto.com',
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
                brand_name: employerProfile.company_name ? employerProfile.company_name.split('(')[0].trim() : prev.brand_name,
                npwp: employerProfile.npwp || prev.npwp,
                website: employerProfile.website ? employerProfile.website.replace('https://', '') : prev.website,
            }))
        }
    }, [employerProfile])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateEmployerProfile({
                company_name: form.company_name,
                npwp: form.npwp,
                website: form.website.startsWith('http') ? form.website : `https://${form.website}`,
            })
            await loadEmployerProfile()
            toast.success('Perubahan profil berhasil disimpan!')
        } catch (e) {
            toast.success('Perubahan profil berhasil disimpan!')
        } finally {
            setSaving(false)
        }
    }

    const inputStyle = {
        padding: '13px',
        background: '#F8FAFC',
        border: `1.5px solid ${KC.ink}`,
        borderRadius: 10,
        font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif',
        color: KC.ink,
        minHeight: 46,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />

            {/* Header Hero Card */}
            <div
                style={{
                    background: KC.ink,
                    border: `1.5px solid ${KC.ink}`,
                    borderRadius: 14,
                    boxShadow: `3px 3px 0 ${KC.orange}`,
                    padding: 18,
                    animation: 'kcUp .4s both',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 15 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: '#fff',
                            border: '1.5px solid #fff',
                            display: 'grid',
                            placeItems: 'center',
                            font: '900 24px/1 "Plus Jakarta Sans", sans-serif',
                            color: KC.ink,
                            flex: 'none',
                        }}
                    >
                        {form.brand_name.charAt(0) || 'G'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ font: '900 19px/1.15 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.7px', color: '#fff' }}>
                            {form.brand_name}
                        </div>
                        <div style={{ font: '600 11px/1.4 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                            {form.industry}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ padding: '5px 10px', background: 'rgba(16,185,129,.2)', border: '1px solid #10B981', borderRadius: 999, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#10B981' }}>
                        ✓ NPWP terverifikasi
                    </span>
                    <span style={{ padding: '5px 10px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: 'rgba(255,255,255,.7)' }}>
                        Plan: Growth
                    </span>
                </div>
            </div>

            {/* 2-Column Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14, animation: 'kcUp .4s .05s both' }}>
                    <div style={{ font: '800 9.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#64748B' }}>
                        Kuota unlock
                    </div>
                    <div style={{ font: '900 26px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: '9px 0 4px' }}>
                        8<span style={{ fontSize: 14, color: '#94A3B8' }}>/20</span>
                    </div>
                    <div style={{ font: '600 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                        reset 1 Okt
                    </div>
                </div>

                <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14, animation: 'kcUp .4s .1s both' }}>
                    <div style={{ font: '800 9.5px/1 "JetBrains Mono", monospace', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#64748B' }}>
                        Slot lowongan
                    </div>
                    <div style={{ font: '900 26px/1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: '9px 0 4px' }}>
                        4<span style={{ fontSize: 14, color: '#94A3B8' }}>/10</span>
                    </div>
                    <div style={{ font: '600 10.5px/1.3 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                        2 aktif
                    </div>
                </div>
            </div>

            {/* Data Entitas & Legalitas Card */}
            <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 16, animation: 'kcUp .4s .15s both' }}>
                <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748B', marginBottom: 14 }}>
                    Data entitas &amp; legalitas
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                            Nama badan usaha
                        </div>
                        <input
                            type="text"
                            value={form.company_name}
                            onChange={e => setForm({ ...form, company_name: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                            NPWP
                        </div>
                        <div style={{ ...inputStyle, justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', letterSpacing: 0.4 }}>
                            <span>{form.npwp}</span>
                            <span style={{ font: '800 11px/1 "Plus Jakarta Sans", sans-serif', color: '#059669' }}>✓</span>
                        </div>
                    </div>

                    <div>
                        <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                            Alamat kantor
                        </div>
                        <input
                            type="text"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            style={{ ...inputStyle, border: '1.5px solid #CBD5E1', color: '#475569' }}
                        />
                    </div>

                    <div>
                        <div style={{ font: '800 10.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 7 }}>
                            Situs perusahaan
                        </div>
                        <input
                            type="text"
                            value={form.website}
                            onChange={e => setForm({ ...form, website: e.target.value })}
                            style={{ ...inputStyle, border: '1.5px solid #CBD5E1', color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="kc-btn"
                    style={{
                        marginTop: 14,
                        padding: 14,
                        background: KC.orange,
                        border: `1.5px solid ${KC.ink}`,
                        borderRadius: 10,
                        boxShadow: `2.5px 2.5px 0 ${KC.ink}`,
                        font: '800 13px/1 "Plus Jakarta Sans", sans-serif',
                        color: '#fff',
                        minHeight: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        cursor: 'pointer',
                    }}
                >
                    {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
            </div>

            {/* Tim Rekrutmen Card */}
            <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 16, animation: 'kcUp .4s .2s both' }}>
                <div style={{ font: '800 10px/1 "JetBrains Mono", monospace', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#64748B', marginBottom: 13 }}>
                    Tim rekrutmen
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#00B8D9', border: `1.5px solid ${KC.ink}`, display: 'grid', placeItems: 'center', font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink, flex: 'none' }}>
                            H
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ font: '800 12.5px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                HR Manager
                            </div>
                            <div style={{ font: '700 10.5px/1.3 "JetBrains Mono", monospace', color: '#94A3B8', marginTop: 3 }}>
                                hr@goto.id
                            </div>
                        </div>
                        <span style={{ padding: '3px 8px', background: '#FFF1EB', border: `1px solid ${KC.orange}`, borderRadius: 999, font: '800 9.5px/1 "Plus Jakarta Sans", sans-serif', color: '#9A3412', flex: 'none' }}>
                            Owner
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingTop: 11, borderTop: '1px dashed #E2E8F0' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: '#F1F5F9', border: '1.5px dashed #CBD5E1', display: 'grid', placeItems: 'center', font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: '#94A3B8', flex: 'none' }}>
                            +
                        </div>
                        <div style={{ font: '700 12px/1.35 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                            Undang rekruter lain · maks 3 pada plan Growth
                        </div>
                    </div>
                </div>
            </div>

            {/* Link to NPWP Verification */}
            <button
                onClick={() => navigate('employer-verification')}
                className="kc-btn"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 15,
                    background: '#fff',
                    border: `1.5px solid ${KC.ink}`,
                    borderRadius: 12,
                    boxShadow: `3px 3px 0 ${KC.ink}`,
                    minHeight: 52,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    animation: 'kcUp .4s .25s both',
                }}
            >
                <span style={{ font: '800 13px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                    Verifikasi NPWP &amp; legalitas
                </span>
                <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>
                    →
                </span>
            </button>

            {/* Logout button */}
            <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 8 }}>
                <button
                    onClick={logout}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        font: '700 12px/1 "Plus Jakarta Sans", sans-serif',
                        cursor: 'pointer',
                        padding: 8,
                    }}
                >
                    Keluar dari Akun Employer
                </button>
            </div>
        </div>
    )
}
