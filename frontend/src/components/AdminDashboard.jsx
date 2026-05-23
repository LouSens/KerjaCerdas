import { useEffect } from 'react'
import { Users, Briefcase, Bot, AlertTriangle, Activity } from 'lucide-react'
import useStore from '../store/useStore'

/**
 * AdminDashboard — operations cockpit. Five panels:
 *   • Platform metrics (users, jobs, applications)
 *   • AI performance (latency, success rate, flagged calls)
 *   • Recent users (CRM scroll)
 *   • Job moderation queue
 *   • Revenue (phase 2 placeholder)
 */
export default function AdminDashboard() {
    const { adminMetrics, adminAI, adminUsers, refreshAdmin } = useStore()
    useEffect(() => { refreshAdmin() }, [refreshAdmin])

    if (!adminMetrics) return <p className="text-sm text-surface-500">Memuat metrik…</p>

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Admin Cockpit</h1>
                    <p className="text-sm text-surface-600">Monitoring real-time pengguna, AI, dan kesehatan platform.</p>
                </div>
                <button onClick={refreshAdmin} className="text-xs font-bold text-rose-600 hover:underline">Refresh</button>
            </header>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card icon={Users}     tint="indigo"  label="Total User"   value={adminMetrics.users.total} />
                <Card icon={Briefcase} tint="emerald" label="Lowongan"     value={adminMetrics.jobs.total} sub={`${adminMetrics.jobs.active} aktif`} />
                <Card icon={Activity}  tint="cyan"    label="Aplikasi"     value={adminMetrics.applications} />
                <Card icon={Bot}       tint="rose"    label="AI Success %" value={adminAI ? `${Math.round(adminAI.success_rate * 100)}%` : '—'} sub={adminAI ? `${adminAI.avg_latency_ms}ms` : ''} />
            </section>

            <section className="grid lg:grid-cols-2 gap-4">
                {/* Users CRM */}
                <div className="bg-white rounded-2xl border border-surface-200 p-5">
                    <h2 className="text-sm font-bold mb-3">Pengguna Terbaru</h2>
                    {adminUsers.length === 0 ? (
                        <p className="text-sm text-surface-500">Belum ada pengguna terdaftar.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-surface-500 text-left">
                                    <th className="py-2">Email</th><th>Role</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100">
                                {adminUsers.slice(0, 8).map(u => (
                                    <tr key={u.id}>
                                        <td className="py-2 font-mono text-xs truncate max-w-[220px]">{u.email}</td>
                                        <td>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                u.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                                                u.role === 'employer' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-indigo-100 text-indigo-700'
                                            }`}>{u.role}</span>
                                        </td>
                                        <td className="text-xs">{u.is_active ? '✓ aktif' : '✗'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* AI performance */}
                <div className="bg-white rounded-2xl border border-surface-200 p-5">
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-rose-600" /> Gemini Performance
                    </h2>
                    {!adminAI || adminAI.count === 0 ? (
                        <p className="text-sm text-surface-500">Belum ada call AI yang tercatat.</p>
                    ) : (
                        <div className="space-y-3">
                            <Row label="Total calls" value={adminAI.count} />
                            <Row label="Avg latency" value={`${adminAI.avg_latency_ms} ms`} />
                            <Row label="Success rate" value={`${Math.round(adminAI.success_rate * 100)}%`} />
                            <Row label="Flagged" value={adminAI.flagged} warn={adminAI.flagged > 0} />
                            {adminAI.by_task && (
                                <div className="pt-2 mt-2 border-t border-surface-100">
                                    <p className="text-[10px] uppercase tracking-wider text-surface-500 mb-1">Per task</p>
                                    {Object.entries(adminAI.by_task).map(([k, v]) => (
                                        <Row key={k} label={k} value={v} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Revenue placeholder */}
            <section className="bg-surface-50 rounded-2xl border border-dashed border-surface-300 p-5">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                        <p className="text-sm font-bold">Billing & Revenue — Phase 2</p>
                        <p className="text-xs text-surface-600">
                            MRR, paid employers, dan conversion funnel akan ditampilkan setelah modul tagihan aktif.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

function Card({ icon: Icon, tint, label, value, sub }) {
    const c = {
        indigo:  'from-indigo-500 to-blue-500',
        emerald: 'from-emerald-500 to-teal-500',
        cyan:    'from-cyan-500 to-sky-500',
        rose:    'from-rose-500 to-pink-500',
    }[tint]
    return (
        <div className="bg-white rounded-2xl border border-surface-200 p-4">
            <span className={`inline-grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br ${c} text-white mb-2`}>
                <Icon className="w-4 h-4" />
            </span>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-[11px] text-surface-500 font-bold uppercase tracking-wider">{label}</p>
            {sub && <p className="text-[11px] text-surface-500 mt-0.5">{sub}</p>}
        </div>
    )
}

function Row({ label, value, warn }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">{label}</span>
            <span className={`font-bold ${warn ? 'text-rose-600' : ''}`}>{value}</span>
        </div>
    )
}
