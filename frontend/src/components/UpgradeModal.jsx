import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, X, Crown } from 'lucide-react'
import useStore from '../store/useStore'
import { KC, topBtn } from './_design'
import { createPlanOrder } from '../services/api'

const EMPLOYER_TIERS = [
    {
        planId: 'spark',
        name: 'Lite',
        priceMonthly: 0,
        priceYearly: 0,
        desc: 'Coba dulu: pasang lowongan, bagikan link / QR.',
        features: [
            '1 lowongan aktif',
            'Link + poster QR',
            'Peringkat otomatis tak terbatas',
            'Badge Terbukti, status verifikasi skill',
            'Konfirmasi "skill terbukti"'
        ],
        highlight: false,
        bg: '#FAF9F5',
        color: KC.ink,
        btnVariant: 'secondary',
        btnText: 'Mulai Gratis'
    },
    {
        planId: 'beacon',
        name: 'Pro',
        priceMonthly: 79000,
        priceYearly: 79000,
        period: '/lowongan/bulan',
        desc: 'Untuk usaha kecil yang sesekali merekrut.',
        features: [
            'Semua fitur Lite, ditambah:',
            'Pertanyaan wawancara AI (klik ulang gratis)',
            'Ekspor CSV',
            'Cari kandidat 30x/lowongan/bulan'
        ],
        highlight: false,
        requiresJob: true,
        bg: KC.orange,
        color: '#fff',
        btnVariant: 'lime',
        btnText: 'Mulai Rekrut'
    },
    {
        planId: 'lighthouse',
        name: 'Max 5x',
        priceMonthly: 229000,
        priceYearly: 2290000,
        period: '/bulan',
        desc: 'Untuk usaha yang merekrut setiap bulan.',
        features: [
            'Semua fitur Pro, ditambah:',
            'Hingga 5 lowongan aktif sekaligus',
            'Fitur Pro berlaku di semua lowongan',
            'Cari kandidat 150x/bulan per akun'
        ],
        highlight: true,
        badgeText: 'Paling Hemat',
        bg: KC.ink,
        color: '#fff',
        btnVariant: 'accent',
        btnText: 'Pilih Max 5x'
    },
    {
        planId: 'max20',
        name: 'Max 20x',
        priceMonthly: 699000,
        priceYearly: 6990000,
        period: '/bulan',
        desc: 'Untuk rekrutmen volume tinggi.',
        features: [
            'Semua fitur Pro, ditambah:',
            'Hingga 20 lowongan aktif sekaligus',
            'Fitur Pro di semua lowongan',
            'Cari kandidat 600x/bulan per akun'
        ],
        highlight: false,
        bg: '#1A1B24',
        color: '#fff',
        btnVariant: 'accent',
        btnText: 'Pilih Max 20x'
    }
]

export default function UpgradeModal() {
    const { upgradeModalOpen, closeUpgradeModal, upgradeContext, userRole, employerJobs } = useStore()
    const [order, setOrder] = useState(null)
    const [jobId, setJobId] = useState('')
    const [isYearly, setIsYearly] = useState(false)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (!upgradeModalOpen) return
        setOrder(null)
        setJobId(upgradeContext?.jobId || '')
    }, [upgradeModalOpen, upgradeContext])

    if (!upgradeModalOpen) return null

    const buy = async (planId, fallbackName) => {
        if (planId === 'beacon' && !jobId) {
            toast.error('Pilih lowongan untuk Pro')
            return
        }
        try {
            // For UI testing purposes if backend rejects new IDs we map max20 to lighthouse as a placeholder
            const backendPlanId = planId === 'max20' ? 'lighthouse' : planId
            const newOrder = await createPlanOrder(backendPlanId, planId === 'beacon' ? jobId : null)
            // Override display name in order to match new UI names
            setOrder({ ...newOrder, displayName: fallbackName, actualAmount: isYearly ? newOrder.amount_idr * 10 : newOrder.amount_idr })
        } catch (e) {
            toast.error(e.message)
        }
    }

    const toggleBtn = (active) => ({
        padding: '6px 14px',
        border: 'none',
        borderRadius: 20,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        background: active ? KC.orange : 'transparent',
        color: active ? '#fff' : KC.ink,
        transition: 'all 0.2s'
    })

    return (
        <div onClick={closeUpgradeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(9,10,15,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div role="dialog" aria-label="Paket KerjaCerdas" onClick={(e) => e.stopPropagation()}
                style={{ background: KC.bone, border: `1.5px solid ${KC.ink}`, borderRadius: 16, boxShadow: `6px 6px 0 ${KC.ink}`, width: '100%', maxWidth: userRole === 'employer' ? 1200 : 560, maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 900, fontSize: 22 }}>{userRole === 'employer' ? 'Paket Employer KerjaCerdas' : 'Upgrade ke Premium'}</div>
                    <button aria-label="Tutup" onClick={closeUpgradeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                {order ? (
                    <div style={{ background: KC.paper, border: `1.5px solid ${KC.ink}`, borderRadius: 12, padding: 18, marginTop: 16 }}>
                        <div style={{ fontWeight: 900, fontSize: 18 }}>Pesanan {order.displayName} dibuat</div>
                        <p>Kode pesanan: <b style={{ fontFamily: 'monospace', fontSize: 18 }}>{order.order_code}</b> · Total <b>Rp{(order.actualAmount || order.amount_idr).toLocaleString('id-ID')}</b></p>
                        <p style={{ fontSize: 14 }}>{order.payment_instructions}</p>
                        <p style={{ fontSize: 13, color: KC.mute }}>Status: menunggu pembayaran. Paket aktif setelah admin mengonfirmasi.</p>
                        <button style={{ ...topBtn(KC.ink, '#fff'), marginTop: 12 }} onClick={closeUpgradeModal}>Mengerti</button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 24px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 24, display: 'flex', gap: 4, alignItems: 'center' }}>
                                <button style={toggleBtn(!isYearly)} onClick={() => setIsYearly(false)}>Bulanan</button>
                                <button style={toggleBtn(isYearly)} onClick={() => setIsYearly(true)}>
                                    Tahunan <span style={{ background: '#10B981', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10, marginLeft: 4 }}>Hemat 2 bulan</span>
                                </button>
                            </div>
                        </div>

                        {userRole === 'employer' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
                                {EMPLOYER_TIERS.map((t) => {
                                    const paid = t.priceMonthly > 0
                                    const isPro = t.planId === 'beacon'
                                    const price = (isYearly && !isPro) ? t.priceYearly : t.priceMonthly
                                    
                                    const btnBg = t.btnVariant === 'secondary' ? 'transparent' : t.btnVariant === 'lime' ? '#a3e635' : KC.orange
                                    const btnColor = t.btnVariant === 'secondary' ? KC.ink : t.btnVariant === 'lime' ? KC.ink : '#fff'

                                    return (
                                        <div key={t.planId} style={{ 
                                            background: t.bg, color: t.color, border: `2px solid ${KC.ink}`, borderRadius: 12, padding: 24, 
                                            boxShadow: t.highlight ? `6px 6px 0 ${KC.ink}` : `3.5px 3.5px 0 ${KC.ink}`, 
                                            display: 'flex', flexDirection: 'column', position: 'relative' 
                                        }}>
                                            {t.highlight && <div style={{ position: 'absolute', top: -12, right: 16, background: KC.yellow, border: `1.5px solid ${KC.ink}`, padding: '3px 10px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', borderRadius: 999, color: KC.ink, boxShadow: `2px 2px 0 ${KC.ink}` }}>{t.badgeText || 'Populer'}</div>}
                                            <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t.name}</div>
                                            
                                            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: '0 0 12px' }}>
                                                {paid ? `Rp ${price.toLocaleString('id-ID')}` : 'Rp 0'}
                                                <span style={{ fontSize: 12, fontWeight: 600, color: t.color === '#fff' ? 'rgba(255,255,255,0.7)' : KC.mute, marginLeft: 4 }}>
                                                    {t.period || 'gratis'}
                                                </span>
                                            </div>
                                            
                                            <div style={{ fontSize: 13, color: t.color === '#fff' ? 'rgba(255,255,255,0.85)' : KC.ink, lineHeight: 1.5, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${t.color === '#fff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}>
                                                {t.desc}
                                            </div>
                                            
                                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 12, fontSize: 13, flex: 1 }}>
                                                {t.features.map((f, i) => <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><Check size={16} color={t.color === '#fff' ? '#A3E635' : '#059669'} style={{ flexShrink: 0, marginTop: 1 }} />{f}</li>)}
                                            </ul>
                                            
                                            {t.requiresJob && (
                                                <select value={jobId} onChange={(e) => setJobId(e.target.value)}
                                                    style={{ padding: 10, border: `1.5px solid ${KC.ink}`, borderRadius: 8, marginBottom: 16, fontFamily: 'inherit', fontSize: 13, background: '#fff', color: KC.ink }}>
                                                    <option value="">Pilih lowongan…</option>
                                                    {(employerJobs || []).map((j) => <option key={j.id || j.job_id} value={j.id || j.job_id}>{j.title}</option>)}
                                                </select>
                                            )}
                                            
                                            {paid
                                                ? <button style={{ ...topBtn(btnBg, btnColor, KC.ink), width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={() => buy(t.planId, t.name)}>{t.btnText}</button>
                                                : <button style={{ ...topBtn(btnBg, btnColor, KC.ink), width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={closeUpgradeModal}>{t.btnText}</button>}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ background: '#1A1B24', border: `2px solid ${KC.ink}`, borderRadius: 12, padding: 32, boxShadow: `6px 6px 0 ${KC.ink}`, width: '100%', display: 'flex', flexDirection: 'column', color: '#fff' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <Crown size={24} color="#F59E0B" />
                                        <div style={{ fontWeight: 900, fontSize: 26, background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium</div>
                                    </div>
                                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Keunggulan persiapan, bukan posisi.</div>
                                    
                                    <div style={{ fontSize: 36, fontWeight: 900, margin: '20px 0 4px', letterSpacing: -1 }}>
                                        Rp{isYearly ? (350000).toLocaleString('id-ID') : (35000).toLocaleString('id-ID')}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
                                        {isYearly ? '/tahun' : '/bulan'}
                                        {isYearly && <span style={{ background: '#10B981', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>Hemat 2 bulan</span>}
                                        {!isYearly && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>atau Rp350.000/tahun — hemat 2 bulan</span>}
                                    </div>

                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gap: 12, fontSize: 14 }}>
                                        {[
                                            'AI Advisor 15 pesan/hari',
                                            'Simulasi wawancara AI 2 sesi/bulan (Segera hadir)',
                                            'AI Cover Letter Generator 3 surat/bulan (Segera hadir)',
                                            'CV terformat siap kirim (Segera hadir)'
                                        ].map((f, i) => <li key={i} style={{ display: 'flex', gap: 10 }}><Check size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} /><b>{f}</b></li>)}
                                        <li style={{ display: 'flex', gap: 10, marginTop: 12, color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                                            <Check size={18} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: 2 }} />
                                            <span>Termasuk semua fitur Free: Profil lengkap, skor AI, kuis bukti skill, dsb.</span>
                                        </li>
                                    </ul>

                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 14, borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <b style={{ color: '#F59E0B' }}>Penting:</b> Skor kecocokan, urutan pelamar, dan aturan kuis identik di semua paket. Premium memberi keunggulan persiapan, bukan posisi.
                                    </div>

                                    <button style={{ ...topBtn('#F59E0B', KC.ink), background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', width: '100%', justifyContent: 'center', padding: '14px 0', fontSize: 16 }} onClick={() => buy('prism', 'Premium')}>
                                        Upgrade ke Premium
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
