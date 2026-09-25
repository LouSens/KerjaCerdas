import { describe, expect, it } from 'vitest'
import { skillCoverage } from '../../components/ApplicantSkillMap'

describe('skillCoverage', () => {
    const items = [
        { skill_proof: [{ name: 'Excel', status: 'hr_confirmed' }, { name: 'SQL', status: 'missing' }] },
        { skill_proof: [{ name: 'Excel', status: 'claimed' }, { name: 'SQL', status: 'missing' }] },
        { skill_proof: [{ name: 'Excel', status: 'quiz' }, { name: 'SQL', status: 'claimed' }] },
    ]

    it('buckets each applicant per required skill', () => {
        const rows = skillCoverage(items, ['Excel', 'SQL'])
        expect(rows).toEqual([
            { skill: 'Excel', confirmed: 1, listed: 2, missing: 0 },
            { skill: 'SQL', confirmed: 0, listed: 1, missing: 2 },
        ])
    })

    it('only an HR confirmation counts as confirmed', () => {
        const [excel] = skillCoverage([{ skill_proof: [{ name: 'Excel', status: 'quiz' }] }], ['Excel'])
        expect(excel.confirmed).toBe(0)
        expect(excel.listed).toBe(1)
    })

    it('keeps required skills nobody has reported yet', () => {
        expect(skillCoverage([], ['Kasir'])).toEqual([{ skill: 'Kasir', confirmed: 0, listed: 0, missing: 0 }])
    })
})
