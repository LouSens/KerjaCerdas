import { describe, expect, it, vi } from 'vitest'

// A profile request we can resolve by hand, to reproduce "switch account while
// the previous account's request is still in flight".
let resolveProfile
vi.mock('../../services/api', async (importOriginal) => ({
    ...(await importOriginal()),
    fetchSeekerProfile: () => new Promise((resolve) => { resolveProfile = resolve }),
    setAuthToken: () => {},
}))

import useStore from '../../store/useStore'

describe('session epoch', () => {
    it('drops a response that belongs to the previous account', async () => {
        const pending = useStore.getState().loadSeekerProfile()
        useStore.getState().logout() // account changes while the request is in flight
        resolveProfile({ id: 'old-seeker', full_name: 'Akun Lama', skills: [{ name: 'Excel' }] })
        await pending
        expect(useStore.getState().profile.full_name).not.toBe('Akun Lama')
        expect(useStore.getState().seekerId).not.toBe('old-seeker')
    })

    it('still applies a response from the current session', async () => {
        const pending = useStore.getState().loadSeekerProfile()
        resolveProfile({ id: 'cur', full_name: 'Akun Sekarang', skills: [] })
        await pending
        expect(useStore.getState().profile.full_name).toBe('Akun Sekarang')
    })

    it('a session change clears loading flags a stale request would leave on', () => {
        useStore.setState({ agentLoading: true, skillGapLoading: true })
        useStore.getState().logout()
        expect(useStore.getState().agentLoading).toBe(false)
        expect(useStore.getState().skillGapLoading).toBe(false)
    })
})
