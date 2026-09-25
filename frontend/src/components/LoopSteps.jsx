// The seeker loop as a strip of five steps, so every screen on the path says
// where the user is: target → skill kurang → belajar → lamar → umpan balik.
import { KC } from './_design'

export const LOOP_STEPS = ['Pilih target', 'Lihat skill yang kurang', 'Belajar', 'Lamar', 'Umpan balik HR']

export default function LoopSteps({ active = 0 }) {
    return (
        <ol aria-label="Alur KerjaCerdas" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
            {LOOP_STEPS.map((label, i) => {
                const done = i < active
                const current = i === active
                return (
                    <li key={label} aria-current={current ? 'step' : undefined} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999,
                        border: `1.5px solid ${current ? KC.ink : KC.borderMuted}`,
                        background: current ? KC.orange : done ? KC.limeSoft : '#fff',
                        color: current ? '#fff' : KC.ink, fontSize: 12, fontWeight: 800,
                    }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{done ? '✓' : i + 1}</span>
                        {label}
                    </li>
                )
            })}
        </ol>
    )
}
