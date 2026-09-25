import { describe, expect, it, vi } from 'vitest'

vi.mock('../../store/useStore', () => ({ default: () => ({}) }))

import { buildInsights } from '../../components/EmployerHelpPanel'

const job = { id: 'j1', title: 'Admin Klinik', is_active: true, required_skills: ['Administrasi', 'Kasir'] }
const app = (over) => ({ job_id: 'j1', job_title: 'Admin Klinik', seeker_name: 'A', status: 'applied', match_score: 0.3, skill_proof: [], ...over })

describe('buildInsights (Asisten HR)', () => {
    it('flags new applicants and names the top one', () => {
        const [first] = buildInsights([job], [app({ seeker_name: 'Rudi', match_score: 0.52 }), app({ seeker_name: 'Maya' })])
        expect(first.key).toBe('fresh')
        expect(first.text).toContain('2 pelamar baru')
        expect(first.text).toContain('Rudi (skor 52)')
    })

    it('reports the skill most applicants lack once at least half lack it', () => {
        const missingAdmin = [{ name: 'Administrasi', status: 'missing' }, { name: 'Kasir', status: 'claimed' }]
        const out = buildInsights([job], [app({ status: 'reviewed', skill_proof: missingAdmin }), app({ status: 'reviewed', skill_proof: missingAdmin })])
        expect(out.find((i) => i.key === 'gap-j1').text).toContain('100% pelamar Admin Klinik belum punya Administrasi')
    })

    it('asks to confirm skills after an interview without an HR confirmation', () => {
        const out = buildInsights([job], [app({ status: 'interview' })])
        expect(out.some((i) => i.key === 'confirm')).toBe(true)
    })

    it('points at jobs that have no applicants', () => {
        const out = buildInsights([job, { id: 'j2', title: 'Kasir', is_active: true }], [app({ status: 'hired' })])
        expect(out.find((i) => i.key === 'empty').text).toContain('Kasir')
    })

    it('is empty when nothing is waiting', () => {
        const confirmed = [{ name: 'Kasir', status: 'hr_confirmed' }]
        expect(buildInsights([job], [app({ status: 'hired', skill_proof: confirmed })])).toEqual([])
    })
})
