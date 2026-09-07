/**
 * KerjaCerdas — Frontend Unit Tests: SeekerSearch filter logic
 * ==============================================================
 * Covers the fix for mixed Remote+Onsite mode selection silently dropping
 * the location filter (isRemoteOnlyMode used to fire on "Remote" alone,
 * regardless of Onsite also being selected), which broadened results
 * beyond the selected region instead of scoping the Onsite half to it.
 */
import { describe, expect, it } from 'vitest'
import { buildJobSearchFilters, isRemoteOnlyMode } from '../../components/SeekerSearch'

describe('isRemoteOnlyMode', () => {
    it('is true when only Remote is selected', () => {
        expect(isRemoteOnlyMode(['Remote'])).toBe(true)
    })

    it('is false when Remote and Onsite are both selected', () => {
        expect(isRemoteOnlyMode(['Remote', 'Onsite'])).toBe(false)
    })

    it('is false when nothing is selected', () => {
        expect(isRemoteOnlyMode([])).toBe(false)
    })

    it('is false for Onsite alone', () => {
        expect(isRemoteOnlyMode(['Onsite'])).toBe(false)
    })
})

describe('buildJobSearchFilters', () => {
    const base = { selectedRegion: '3573', selectedIndustry: '', minSalary: 10 }

    it('drops the region filter for a pure Remote search', () => {
        const filters = buildJobSearchFilters({ ...base, selectedModes: ['Remote'] })
        expect(filters.region).toBeUndefined()
        expect(filters.remote_allowed).toBe(true)
    })

    it('keeps the selected region when Remote and Onsite are mixed', () => {
        const filters = buildJobSearchFilters({ ...base, selectedModes: ['Remote', 'Onsite'] })
        expect(filters.region).toBe('3573')
        expect(filters.remote_allowed).toBeUndefined()
    })

    it('keeps the region and filters onsite-only', () => {
        const filters = buildJobSearchFilters({ ...base, selectedModes: ['Onsite'] })
        expect(filters.region).toBe('3573')
        expect(filters.remote_allowed).toBe(false)
    })

    it('keeps the region when no mode is selected', () => {
        const filters = buildJobSearchFilters({ ...base, selectedModes: [] })
        expect(filters.region).toBe('3573')
        expect(filters.remote_allowed).toBeUndefined()
    })
})
