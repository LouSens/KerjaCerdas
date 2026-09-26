// One-click demo logins, shown in the auth modal only when the server runs in
// DEMO_MODE (the endpoint 404s otherwise, and this renders nothing). Each
// account shows a different step of the loop — see
// backend/app/services/demo_accounts.py. No password ever reaches the browser.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, User } from 'lucide-react'
import useStore from '../store/useStore'
import { fetchDemoAccounts } from '../services/api'

const INK = '#090A0F'
const ORANGE = '#FF4800'

export default function DemoAccounts() {
    const { demoLogin } = useStore()
    const [accounts, setAccounts] = useState([])
    const [busy, setBusy] = useState(null)

    useEffect(() => {
        let alive = true
        fetchDemoAccounts().then((r) => alive && setAccounts(r?.accounts || [])).catch(() => {})
        return () => { alive = false }
    }, [])

    if (!accounts.length) return null

    const go = async (email) => {
        setBusy(email)
        try {
            await demoLogin(email)
        } catch (e) {
            toast.error(e.message || 'Gagal masuk ke akun demo')
        } finally {
            setBusy(null)
        }
    }

    const group = (role, label) => {
        const list = accounts.filter((a) => a.role === role)
        if (!list.length) return null
        return (
            <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: '#64748B' }}>{label}</div>
                {list.map((a) => (
                    <button key={a.email} type="button" onClick={() => go(a.email)} disabled={!!busy}
                        style={{
                            display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', width: '100%',
                            padding: '9px 11px', background: '#fff', border: `1.5px solid ${INK}`, borderRadius: 9,
                            boxShadow: `2px 2px 0 ${INK}`, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
                            opacity: busy && busy !== a.email ? 0.5 : 1,
                        }}>
                        <span style={{ flexShrink: 0, marginTop: 1, color: ORANGE }}>
                            {a.role === 'employer' ? <Building2 size={16} /> : <User size={16} />}
                        </span>
                        <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: INK }}>
                                {busy === a.email ? 'Masuk…' : `Masuk sebagai ${a.name}`}
                            </span>
                            <span style={{ display: 'block', fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>{a.story}</span>
                        </span>
                    </button>
                ))}
            </div>
        )
    }

    return (
        <div style={{ border: `1.5px dashed ${ORANGE}`, background: '#FFF0EB', borderRadius: 11, padding: 12, marginBottom: 16, display: 'grid', gap: 10 }}>
            <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: INK }}>Coba akun demo — tanpa kata sandi</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Setiap akun menunjukkan langkah berbeda. Data fiktif.</div>
            </div>
            {group('seeker', 'Pencari kerja')}
            {group('employer', 'HR perusahaan')}
        </div>
    )
}
