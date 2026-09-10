import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadEmployerProfile = vi.fn()

vi.mock('../../store/useStore', () => ({
    default: () => ({
        navigate: vi.fn(),
        employerProfile: { npwp: '01.234.567.8-901.000' },
        loadEmployerProfile,
    }),
}))

import EmployerVerification from '../../components/EmployerVerification'

describe('EmployerVerification', () => {
    beforeEach(() => {
        loadEmployerProfile.mockClear()
    })

    it('renders the verification page for an authenticated employer', () => {
        const html = renderToStaticMarkup(<EmployerVerification />)

        expect(html).toContain('Verifikasi Legalitas')
        expect(html).toContain('NPWP Terverifikasi')
    })
})