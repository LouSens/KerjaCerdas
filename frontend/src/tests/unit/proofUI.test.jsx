import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../store/useStore', () => ({
    default: () => ({ navigate: vi.fn(), openUpgradeModal: vi.fn() }),
}))

import { ProofChip, ProofLegend } from '../../components/ProofUI'
import TrustCenter from '../../components/TrustCenter'

describe('ProofChip', () => {
    it('labels each proof level honestly', () => {
        // A quiz is a knowledge check, never labelled as proof.
        expect(renderToStaticMarkup(<ProofChip name="Excel" status="quiz" />)).toContain('Kuis')
        expect(renderToStaticMarkup(<ProofChip name="Excel" status="quiz" />)).not.toContain('Terbukti')
        expect(renderToStaticMarkup(<ProofChip name="Excel" status="claimed" />)).toContain('Klaim')
        expect(renderToStaticMarkup(<ProofChip name="Excel" status="hr_confirmed" />)).toContain('HR')
        expect(renderToStaticMarkup(<ProofChip name="Excel" status="missing" />)).toContain('Belum ada')
    })

    it('explains the profile vs HR-confirmed weights', () => {
        const html = renderToStaticMarkup(<ProofLegend />)
        expect(html).toContain('30%')
        expect(html).toContain('100%')
    })
})

describe('TrustCenter', () => {
    it('never asks for NPWP and shows the three badges', () => {
        const html = renderToStaticMarkup(<TrustCenter />)
        expect(html).toContain('Email perusahaan terverifikasi')
        expect(html).toContain('Ditinjau admin')
        expect(html).not.toContain('Masukkan NPWP')
    })
})
