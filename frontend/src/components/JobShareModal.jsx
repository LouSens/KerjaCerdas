// Share a job where the employer already recruits: apply link (+ optional printable QR).
import toast from 'react-hot-toast'
import { Copy, Printer, X } from 'lucide-react'
import { KC, topBtn } from './_design'
import { publicJobQrUrl } from '../services/api'

export default function JobShareModal({ job, onClose }) {
    const url = `${window.location.origin}/j/${job.public_code}`
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link disalin')
        } catch {
            toast.error('Salin manual: ' + url)
        }
    }
    const print = () => {
        const w = window.open('', '_blank', 'width=600,height=800')
        if (!w) return
        const doc = w.document
        doc.title = `Poster ${job.title}`
        const box = doc.createElement('div')
        box.style.cssText = 'font-family:sans-serif;text-align:center;padding:40px'
        const h = doc.createElement('h1'); h.textContent = 'KAMI MEMBUKA LOWONGAN'
        const t = doc.createElement('h2'); t.textContent = job.title
        const img = doc.createElement('img'); img.src = publicJobQrUrl(job.public_code); img.style.width = '320px'
        const p = doc.createElement('p'); p.textContent = `Scan untuk melamar · ${url}`
        box.append(h, t, img, p)
        doc.body.append(box)
        img.onload = () => w.print()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,10,15,0.55)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div role="dialog" aria-label="Bagikan lowongan" style={{ background: KC.paper, border: `1.5px solid ${KC.ink}`, borderRadius: 14, boxShadow: `5px 5px 0 ${KC.ink}`, width: '100%', maxWidth: 420, padding: 20, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17 }}>
                    Bagikan lowongan
                    <button aria-label="Tutup" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>
                <p style={{ fontSize: 13, color: KC.mute }}>Tempel link ini di iklan lowongan Anda, situs karier, atau kirim ke pusat karier kampus / BKK SMK. Setiap pelamar masuk ke daftar Pelamar yang sudah diperingkat dan melihat skill yang masih kurang.</p>
                <img src={publicJobQrUrl(job.public_code)} alt={`QR ${url}`} style={{ width: 220, height: 220 }} />
                <div style={{ fontFamily: 'monospace', fontSize: 13, background: KC.surfaceAlt, borderRadius: 8, padding: 8, margin: '10px 0', wordBreak: 'break-all' }}>{url}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button style={topBtn(KC.ink, '#fff')} onClick={copy}><Copy size={14} /> Salin link</button>
                    <button style={topBtn()} onClick={print}><Printer size={14} /> Cetak poster</button>
                </div>
            </div>
        </div>
    )
}
