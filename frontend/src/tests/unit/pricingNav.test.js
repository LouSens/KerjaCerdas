import { describe, expect, it } from 'vitest'
import useStore from '../../store/useStore'

describe('pricing navigation without paid plans', () => {
    it('keeps a signed-in user where they are and opens no payment screen', () => {
        useStore.setState({ isAuthenticated: true, userRole: 'seeker', activeView: 'seeker-skill-gap', upgradeModalOpen: false })
        useStore.getState().navigate('pricing')
        expect(useStore.getState().activeView).toBe('seeker-skill-gap')
        expect(useStore.getState().upgradeModalOpen).toBe(false)
    })

    it('never opens the upgrade modal from a leftover 402 handler', () => {
        useStore.setState({ upgradeModalOpen: false })
        useStore.getState().openUpgradeModal({ plan: 'beacon' })
        expect(useStore.getState().upgradeModalOpen).toBe(false)
    })
})
