/**
 * KerjaCerdas — Frontend Unit Tests: hasMeaningfulProfile
 * ==========================================================
 * Covers the fix for the AI-matching gate rejecting valid text-bearing
 * profiles: matcher.py's embed_seeker() builds the match embedding from
 * `headline` and `resume_text` too, not just the structured skills/
 * experience/education lists, so a headline-only profile or a CV upload
 * that yielded free-text resume content but no structured fields is
 * genuinely matchable and must pass this gate.
 */
import { describe, expect, it } from 'vitest'
import { hasMeaningfulProfile } from '../../store/useStore'

describe('hasMeaningfulProfile', () => {
    it('is false for a fully blank profile', () => {
        expect(hasMeaningfulProfile({
            headline: '', resume_text: '', skills: [], experience: [], education: [],
        })).toBe(false)
    })

    it('is false for null/undefined profile', () => {
        expect(hasMeaningfulProfile(null)).toBe(false)
        expect(hasMeaningfulProfile(undefined)).toBe(false)
    })

    it('is true when skills are present', () => {
        expect(hasMeaningfulProfile({ skills: [{ name: 'Python' }] })).toBe(true)
    })

    it('is true for a headline-only profile', () => {
        expect(hasMeaningfulProfile({
            headline: 'Fresh graduate mencari peluang di bidang apa saja',
            resume_text: '', skills: [], experience: [], education: [],
        })).toBe(true)
    })

    it('is true when only resume_text was extracted from a CV upload', () => {
        expect(hasMeaningfulProfile({
            headline: '', resume_text: 'Berpengalaman 3 tahun di bidang logistik.',
            skills: [], experience: [], education: [],
        })).toBe(true)
    })

    it('is false when headline/resume_text are only whitespace', () => {
        expect(hasMeaningfulProfile({
            headline: '   ', resume_text: '\n\t', skills: [], experience: [], education: [],
        })).toBe(false)
    })
})
