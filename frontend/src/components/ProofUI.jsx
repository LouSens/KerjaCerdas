// Shared "proof of skill" UI: proof chips and the email-verification card.
// Proof levels come from the backend only (claimed / quiz / hr_confirmed);
// the UI never sets or upgrades proof itself.
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, CircleDashed, Mail, ShieldCheck, XCircle } from 'lucide-react'
import { KC, topBtn } from './_design'
import { fetchVerificationStatus, sendEmailOtp, verifyEmailOtp } from '../services/api'

export const PROOF_META = {
    hr_confirmed: { label: 'Dikonfirmasi HR', short: '✓ HR', color: '#065F46', bg: KC.limeSoft, border: '#059669', icon: ShieldCheck },
    // Legacy level: quizzes are off in the UI (config/features.js), but profiles
    // that passed one keep it. It is a knowledge check, not proof — so it is
    // never labelled "Terbukti"; only an HR confirmation is.
    quiz: { label: 'Lulus kuis dasar', short: 'Kuis ✓', color: '#065F46', bg: KC.limeSoft, border: '#10B981', icon: CheckCircle2 },
    claimed: { label: 'Ada di profil (klaim)', short: 'Klaim', color: KC.inkLight, bg: KC.surfaceAlt, border: KC.borderMuted, icon: CircleDashed },
    missing: { label: 'Belum dimiliki', short: 'Belum ada', color: '#991B1B', bg: KC.roseSoft, border: '#FCA5A5', icon: XCircle },
}

export function ProofChip({ name, status = 'claimed', compact = false }) {
    const meta = PROOF_META[status] || PROOF_META.claimed
    const Icon = meta.icon
    return (
        <span
            title={`${name}: ${meta.label}`}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: compact ? '2px 7px' : '3px 9px', borderRadius: 999,
                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                fontSize: compact ? 11 : 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}
        >
            <Icon size={compact ? 11 : 12} />
            {name}
            {!compact && <span style={{ fontWeight: 600, opacity: 0.75 }}>· {meta.short}</span>}
        </span>
    )
}

export function ProofLegend() {
    return (
        <p style={{ fontSize: 12, color: KC.mute, margin: '6px 0 0' }}>
            Skor skill: skill yang hanya <b>ada di profil</b> dihitung 30%,
            <b> dikonfirmasi HR</b> setelah wawancara 100%. Profil menyaring, wawancara memastikan.
        </p>
    )
}

export function EmailVerifyCard({ onVerified }) {
    const [state, setState] = useState({ loading: true, verified: false, email: '' })
    const [sent, setSent] = useState(false)
    const [code, setCode] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let alive = true
        fetchVerificationStatus()
            .then((r) => alive && setState({ loading: false, verified: r.email_verified, email: r.email }))
            .catch(() => alive && setState((s) => ({ ...s, loading: false })))
        return () => { alive = false }
    }, [])

    const send = async () => {
        setBusy(true)
        try {
            const r = await sendEmailOtp()
            if (r.status === 'ALREADY_VERIFIED') {
                setState((s) => ({ ...s, verified: true }))
                return
            }
            setSent(true)
            if (r.mode === 'demo') {
                toast(`Mode demo (email belum dikonfigurasi). Kode: ${r.demo_code}`, { duration: 8000 })
            } else {
                toast.success(`Kode dikirim ke ${r.email}`)
            }
        } catch (e) {
            toast.error(e.message)
        } finally {
            setBusy(false)
        }
    }

    const verify = async () => {
        setBusy(true)
        try {
            await verifyEmailOtp(code.trim())
            setState((s) => ({ ...s, verified: true }))
            toast.success('Email terverifikasi')
            onVerified?.()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setBusy(false)
        }
    }

    if (state.loading) return null
    return (
        <div style={{ border: `1.5px solid ${KC.ink}`, borderRadius: 12, padding: 16, background: KC.paper, boxShadow: `3px 3px 0 ${KC.ink}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                <Mail size={18} /> Verifikasi email
                {state.verified && <span style={{ color: '#059669', fontSize: 13 }}>✓ terverifikasi</span>}
            </div>
            <p style={{ fontSize: 13, color: KC.mute, margin: '6px 0 10px' }}>
                Satu-satunya verifikasi identitas di aplikasi. KerjaCerdas tidak meminta NIK/KTP —
                HR memeriksa KTP saat wawancara.
            </p>
            {!state.verified && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {sent && (
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6 digit kode"
                            inputMode="numeric"
                            style={{ padding: '9px 12px', border: `1.5px solid ${KC.ink}`, borderRadius: 9, width: 140, fontFamily: 'inherit' }}
                        />
                    )}
                    {sent
                        ? <button style={topBtn(KC.ink, '#fff')} disabled={busy || code.length !== 6} onClick={verify}>Verifikasi</button>
                        : <button style={topBtn(KC.ink, '#fff')} disabled={busy} onClick={send}>Kirim kode ke {state.email}</button>}
                    {sent && <button style={topBtn()} disabled={busy} onClick={send}>Kirim ulang</button>}
                </div>
            )}
        </div>
    )
}
