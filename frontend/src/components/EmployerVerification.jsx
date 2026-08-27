import { VerificationScreen } from './VerificationDashboard'
import { Building2, FileText, Mail } from 'lucide-react'

const EMPLOYER_DOCS = [
    { id: 'npwp', name: 'NPWP Perusahaan (DJP)', desc: 'Validasi legalitas institusi dan nomor pokok wajib pajak via DJP Online', icon: Building2 },
    { id: 'akta', name: 'Akta Pendirian AHU', desc: 'Verifikasi surat keputusan kementerian hukum & HAM RI', icon: FileText },
    { id: 'domain', name: 'Email Korporat / PIC', desc: 'Validasi kepemilikan domain perusahaan dan otorisasi perwakilan', icon: Mail },
]

export default function EmployerVerification() {
    return <VerificationScreen role="employer" docsSpec={EMPLOYER_DOCS} />
}
