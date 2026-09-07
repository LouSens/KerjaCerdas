/**
 * KerjaCerdas — Frontend Unit Tests: SeekerSearch filter logic
 * ==============================================================
 * Covers the fix for mixed Remote+Onsite mode selection silently dropping
 * the location filter (isRemoteOnlyMode used to fire on "Remote" alone,
 * regardless of Onsite also being selected), which broadened results
 * beyond the selected region instead of scoping the Onsite half to it.
 */
import { describe, expect, it } from 'vitest'
import {
    buildJobSearchFilters,
    isMixedRemoteAndOnsite,
    isRemoteOnlyMode,
    mergeUniqueJobs,
} from '../../components/SeekerSearch'

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

describe('isMixedRemoteAndOnsite', () => {
    it('is true when both Remote and Onsite are selected', () => {
        expect(isMixedRemoteAndOnsite(['Remote', 'Onsite'])).toBe(true)
    })

    it('is true when both Hybrid and Onsite are selected', () => {
        expect(isMixedRemoteAndOnsite(['Hybrid', 'Onsite'])).toBe(true)
    })

    it('is false for Remote alone, Hybrid alone, Onsite alone, or neither', () => {
        expect(isMixedRemoteAndOnsite(['Remote'])).toBe(false)
        expect(isMixedRemoteAndOnsite(['Hybrid'])).toBe(false)
        expect(isMixedRemoteAndOnsite(['Onsite'])).toBe(false)
        expect(isMixedRemoteAndOnsite([])).toBe(false)
    })
})

describe('mergeUniqueJobs', () => {
    it('unions two result lists and dedupes by id', () => {
        const onsite = [{ id: 'a' }, { id: 'b' }]
        const remote = [{ id: 'b' }, { id: 'c' }]
        const merged = mergeUniqueJobs(onsite, remote)
        expect(merged.map(j => j.id).sort()).toEqual(['a', 'b', 'c'])
    })

    it('tolerates undefined/empty lists', () => {
        expect(mergeUniqueJobs(undefined, [{ id: 'x' }], [])).toEqual([{ id: 'x' }])
        expect(mergeUniqueJobs()).toEqual([])
    })
})
