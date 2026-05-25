import { VerificationScreen } from './VerificationDashboard'

const EMPLOYER_DOCS = [
    { id: 'npwp', name: 'NPWP Perusahaan', desc: 'Verifikasi badan usaha via DJP', icon: '🏢' },
    { id: 'akta', name: 'Akta Pendirian', desc: 'Verifikasi via AHU Kemenkumham', icon: '📜' },
    { id: 'domain', name: 'Email Korporat', desc: 'OTP ke domain perusahaan', icon: '📧' },
]

export default function EmployerVerification() {
    return <VerificationScreen role="employer" docsSpec={EMPLOYER_DOCS} />
}
