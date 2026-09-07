import { useState, useEffect } from 'react'
import { searchJobs, fetchJobRegions, fetchJobIndustries } from '../services/api'
import useStore from '../store/useStore'
import { KC, DesignStyles, topBtn, useIsMobile } from './_design'
import JobDetailModal from './JobDetailModal'

// This page is the deliberate "manual track" — results are plain filtered
// listings, never re-ranked or narrowed by AI score (see the header/banner
// copy below). A job's score is shown only when it's already known from a
// prior AI-match run (see matchScoreById), purely as context — never as a
// filter or sort key. Band thresholds mirror the backend's real cutoffs
// (matcher.py: band_strong_threshold=0.65, band_possible_threshold=0.45).
const bandOf = (pct) => (pct >= 65 ? 'strong' : pct >= 45 ? 'possible' : 'stretch')

// Pure so it's directly unit-testable (see tests/unit/seekerSearchFilters.test.js)
// without rendering the component. Remote jobs aren't tied to any one place,
// so a pure Remote search should ignore location — but if Onsite is ALSO
// selected (a mixed search), location still means something for the Onsite
// half, so it must only be dropped when Remote is the SOLE selected mode.
export const isRemoteOnlyMode = (selectedModes) =>
    selectedModes.includes('Remote') && !selectedModes.includes('Onsite')

// Single source of truth for turning the filter UI state into the params
// sent to GET /jobs, so handleSearch and any future caller can't drift
// from isRemoteOnlyMode's definition of "location no longer applies".
export const buildJobSearchFilters = ({ selectedModes, selectedRegion, selectedIndustry, minSalary }) => {
    const hasRemoteSignal = selectedModes.includes('Remote') || selectedModes.includes('Hybrid')
    const hasOnsiteSignal = selectedModes.includes('Onsite')
    const remoteAllowed = hasRemoteSignal && !hasOnsiteSignal
        ? true
        : (hasOnsiteSignal && !hasRemoteSignal ? false : undefined)

    return {
        region: isRemoteOnlyMode(selectedModes) ? undefined : (selectedRegion || undefined),
        industry: selectedIndustry || undefined,
        remote_allowed: remoteAllowed,
        salary_min: minSalary > 10 ? minSalary * 1_000_000 : undefined,
    }
}

// (Remote or Hybrid) AND Onsite selected, with a region picked, can't be
// expressed as one GET /jobs query: the backend's `region` filter is a
// plain equality check with no "OR remote from anywhere" — sending region
// with no remote_allowed constraint (the only single-query option) would
// require EVERY result, remote/hybrid postings included, to carry that
// exact region code, silently excluding those headquartered elsewhere.
// Two scoped queries + a client-side union (below) is how the frontend
// expresses that union without backend changes. Hybrid has to be checked
// alongside Remote here because buildJobSearchFilters' hasRemoteSignal
// already treats them the same (the backend has no separate hybrid flag —
// see remote_allowed above) — omitting Hybrid would leave this same bug
// for a Hybrid+Onsite+region search.
export const isMixedRemoteAndOnsite = (selectedModes) =>
    (selectedModes.includes('Remote') || selectedModes.includes('Hybrid')) &&
    selectedModes.includes('Onsite')

export const mergeUniqueJobs = (...lists) => {
    const byId = new Map()
    for (const list of lists) {
        for (const job of list || []) {
            if (job && job.id != null) byId.set(job.id, job)
        }
    }
    return [...byId.values()]
}

const PAGE_SIZE = 20

export default function SeekerSearch() {
    const isMobile = useIsMobile()
    // Jobs already scored by a prior AI-match run (dashboard/results screen),
    // keyed by job id — joined onto this page's plain filtered listings so a
    // job can show its real score as context, without this page ever calling
    // the matcher or re-ranking/filtering by it itself.
    const { matches } = useStore()
    const matchScoreById = new Map(
        (matches || [])
            .filter(m => m.job_id != null && typeof m.score === 'number')
            .map(m => [m.job_id, Math.round(m.score > 1 ? m.score : m.score * 100)])
    )
    const [query, setQuery] = useState('')
    const [filterPanelOpen, setFilterPanelOpen] = useState(false)
    // Stores the region CODE (e.g. "3171"), not the display name — the picker
    // below renders real names fetched from the backend, but the value sent
    // to the API has to be the code jobs are actually stored under.
    const [selectedRegion, setSelectedRegion] = useState('')
    const [regions, setRegions] = useState([])
    // Employer industries actually present in the data — not a fixed,
    // IT-skewed category list — so UMKM/non-tech postings surface as real
    // filterable divisions instead of being lumped together.
    const [selectedIndustry, setSelectedIndustry] = useState('')
    const [industries, setIndustries] = useState([])
    const [selectedModes, setSelectedModes] = useState([])
    const [minSalary, setMinSalary] = useState(10)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchError, setSearchError] = useState(null)
    const [selectedJob, setSelectedJob] = useState(null)

    // Pagination bookkeeping. The mixed Remote/Hybrid+Onsite+region path
    // (see isMixedRemoteAndOnsite) runs two independent GET /jobs queries
    // and unions them, so each split needs its own offset/total — a single
    // combined pair can't express "the onsite split has more pages but the
    // remote split doesn't" or vice versa.
    const [offset, setOffset] = useState(0)
    const [total, setTotal] = useState(0)
    const [onsiteOffset, setOnsiteOffset] = useState(0)
    const [onsiteTotal, setOnsiteTotal] = useState(0)
    const [remoteOffset, setRemoteOffset] = useState(0)
    const [remoteTotal, setRemoteTotal] = useState(0)

    const isRemoteMode = isRemoteOnlyMode(selectedModes)
    const isMixedSearch = isMixedRemoteAndOnsite(selectedModes) &&
        Boolean(buildJobSearchFilters({ selectedModes, selectedRegion, selectedIndustry, minSalary }).region)
    const hasMore = isMixedSearch
        ? onsiteOffset < onsiteTotal || remoteOffset < remoteTotal
        : offset < total

    useEffect(() => {
        handleSearch()
        fetchJobRegions()
            .then(res => setRegions(res?.items || []))
            .catch(err => { console.error('Failed to load regions', err); setRegions([]) })
        fetchJobIndustries()
            .then(res => setIndustries(res?.items || []))
            .catch(err => { console.error('Failed to load industries', err); setIndustries([]) })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isRemoteMode && selectedRegion) setSelectedRegion('')
    }, [isRemoteMode]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setSearchError(null)
        try {
            const filters = buildJobSearchFilters({ selectedModes, selectedRegion, selectedIndustry, minSalary })

            if (isMixedRemoteAndOnsite(selectedModes) && filters.region) {
                // See isMixedRemoteAndOnsite above: one query can't express
                // "onsite in this region OR remote from anywhere", so issue
                // both scoped queries and union the results client-side.
                // Each split's own total/offset drives loadMore below.
                const [onsiteRes, remoteRes] = await Promise.all([
                    searchJobs(query, 0, PAGE_SIZE, { ...filters, remote_allowed: false }),
                    searchJobs(query, 0, PAGE_SIZE, { ...filters, region: undefined, remote_allowed: true }),
                ])
                setResults(mergeUniqueJobs(onsiteRes?.items, remoteRes?.items))
                setOnsiteOffset(onsiteRes?.items?.length || 0)
                setOnsiteTotal(onsiteRes?.total || 0)
                setRemoteOffset(remoteRes?.items?.length || 0)
                setRemoteTotal(remoteRes?.total || 0)
                setOffset(0)
                setTotal(0)
            } else {
                const res = await searchJobs(query, 0, PAGE_SIZE, filters)
                setResults(res?.items || [])
                setOffset(res?.items?.length || 0)
                setTotal(res?.total || 0)
                setOnsiteOffset(0)
                setOnsiteTotal(0)
                setRemoteOffset(0)
                setRemoteTotal(0)
            }
        } catch (err) {
            console.error('Search failed', err)
            setResults([])
            setSearchError('Pencarian gagal dimuat. Periksa koneksi Anda lalu coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const loadMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        try {
            const filters = buildJobSearchFilters({ selectedModes, selectedRegion, selectedIndustry, minSalary })

            if (isMixedSearch) {
                const [onsiteRes, remoteRes] = await Promise.all([
                    onsiteOffset < onsiteTotal
                        ? searchJobs(query, onsiteOffset, PAGE_SIZE, { ...filters, remote_allowed: false })
                        : Promise.resolve(null),
                    remoteOffset < remoteTotal
                        ? searchJobs(query, remoteOffset, PAGE_SIZE, { ...filters, region: undefined, remote_allowed: true })
                        : Promise.resolve(null),
                ])
                setResults(prev => mergeUniqueJobs(prev, onsiteRes?.items, remoteRes?.items))
                if (onsiteRes) {
                    setOnsiteOffset(o => o + (onsiteRes.items?.length || 0))
                    setOnsiteTotal(onsiteRes.total || 0)
                }
                if (remoteRes) {
                    setRemoteOffset(o => o + (remoteRes.items?.length || 0))
                    setRemoteTotal(remoteRes.total || 0)
                }
            } else {
                const res = await searchJobs(query, offset, PAGE_SIZE, filters)
                setResults(prev => mergeUniqueJobs(prev, res?.items))
                setOffset(o => o + (res?.items?.length || 0))
                setTotal(res?.total || total)
            }
        } catch (err) {
            console.error('Load more failed', err)
        } finally {
            setLoadingMore(false)
        }
    }

    const toggleMode = (m) => {
        setSelectedModes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
    }

    const resetFilters = () => {
        setSelectedRegion('')
        setSelectedIndustry('')
        setSelectedModes([])
        setMinSalary(10)
        setQuery('')
    }

    const displayList = results
    const activeFilterCount = (selectedRegion ? 1 : 0) + (selectedIndustry ? 1 : 0) + selectedModes.length + (minSalary > 10 ? 1 : 0)

    // ─────────────────────────────────────────────────────────────────────────
    // DESKTOP LAYOUT (Desktop v2 · Screen D07)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <DesignStyles />
                <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

                {/* Desktop Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, paddingBottom: 22, borderBottom: `1.5px solid ${KC.ink}` }}>
                    <div>
                        <h1 style={{ font: '900 30px/1.1 "Plus Jakarta Sans", sans-serif', letterSpacing: '-1.2px', color: KC.ink, margin: 0 }}>
                            Cari Lowongan
                        </h1>
                        <p style={{ font: '400 13.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', margin: '8px 0 0' }}>
                            Jalur manual — hasil tidak diurutkan oleh skor AI. Skor tetap ditampilkan sebagai konteks.
                        </p>
                    </div>
                    <span style={{ padding: '8px 14px', background: '#E0F2FE', border: '1.5px solid #0284C7', borderRadius: 8, font: '800 12px/1 "Plus Jakarta Sans", sans-serif', color: '#075985', flexShrink: 0 }}>
                        Dual-Track Search
                    </span>
                </div>

                {/* Big Search Input Bar */}
                <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                        padding: '15px 18px', background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`,
                    }}>
                        <div style={{ width: 15, height: 15, border: '2.5px solid #64748B', borderRadius: '50%', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ketik kata kunci lowongan atau nama posisi…"
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                width: '100%', font: '700 14px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink,
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="kc-btn"
                        style={{
                            padding: '15px 26px', background: KC.orange, border: `1.5px solid ${KC.ink}`,
                            borderRadius: 11, boxShadow: `3px 3px 0 ${KC.ink}`, font: '800 14px/1 "Plus Jakarta Sans", sans-serif',
                            color: '#fff', cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        {loading ? 'Mencari…' : 'Cari'}
                    </button>
                </div>

                {/* 2-Column Grid: Left Sticky Filter (288px) + Right Results */}
                <div style={{ display: 'grid', gridTemplateColumns: '288px minmax(0, 1fr)', gap: 24 }}>
                    {/* Left Sticky Filter Panel */}
                    <div style={{
                        background: '#fff', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 13, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 22, alignSelf: 'flex-start',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span style={{ font: '900 15px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>Filter</span>
                            <button
                                onClick={resetFilters}
                                style={{ background: 'none', border: 'none', font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange, cursor: 'pointer', padding: 0 }}
                            >
                                Reset
                            </button>
                        </div>

                        {/* Location */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Lokasi
                        </div>
                        {isRemoteMode ? (
                            <div style={{ padding: '10px 12px', background: '#F1F5F9', border: '1.5px dashed #94A3B8', borderRadius: 9, font: '600 11.5px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', marginBottom: 20 }}>
                                Lowongan Remote tidak terikat lokasi — filter ini dinonaktifkan.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                                {regions.length === 0 ? (
                                    <span style={{ font: '600 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                        Memuat daftar lokasi…
                                    </span>
                                ) : regions.map(r => {
                                    const on = selectedRegion === r.code
                                    return (
                                        <span
                                            key={r.code}
                                            onClick={() => setSelectedRegion(on ? '' : r.code)}
                                            style={{
                                                padding: '8px 13px',
                                                background: on ? KC.ink : '#FEF3C7',
                                                border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                                borderRadius: 999,
                                                font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                                color: on ? '#fff' : '#B45309',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {r.name} <span style={{ opacity: 0.6, fontWeight: 700 }}>({r.job_count})</span>
                                        </span>
                                    )
                                })}
                            </div>
                        )}

                        {/* Industry / Division */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Kategori / Divisi
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                            {industries.length === 0 ? (
                                <span style={{ font: '600 11.5px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                    Memuat daftar kategori…
                                </span>
                            ) : industries.map(ind => {
                                const on = selectedIndustry === ind.name
                                return (
                                    <span
                                        key={ind.name}
                                        onClick={() => setSelectedIndustry(on ? '' : ind.name)}
                                        style={{
                                            padding: '8px 13px',
                                            background: on ? KC.ink : '#E0F2FE',
                                            border: `1.5px solid ${on ? KC.ink : '#0284C7'}`,
                                            borderRadius: 999,
                                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                            color: on ? '#fff' : '#075985',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {ind.name} <span style={{ opacity: 0.6, fontWeight: 700 }}>({ind.job_count})</span>
                                    </span>
                                )
                            })}
                        </div>

                        {/* Work Mode */}
                        <div style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155', marginBottom: 10 }}>
                            Mode kerja
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                            {['Remote', 'Hybrid', 'Onsite'].map(mode => {
                                const on = selectedModes.includes(mode)
                                return (
                                    <span
                                        key={mode}
                                        onClick={() => toggleMode(mode)}
                                        style={{
                                            padding: '8px 13px',
                                            background: on ? KC.ink : '#FEF3C7',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            borderRadius: 999,
                                            font: '800 12px/1 "Plus Jakarta Sans", sans-serif',
                                            color: on ? '#fff' : '#B45309',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {mode}
                                    </span>
                                )
                            })}
                        </div>

                        {/* Salary Slider */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
                            <span style={{ font: '800 11.5px/1 "Plus Jakarta Sans", sans-serif', color: '#334155' }}>Gaji minimum</span>
                            <span style={{ font: '900 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.orange }}>Rp {minSalary} jt</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={minSalary}
                            onChange={(e) => setMinSalary(Number(e.target.value))}
                            style={{ width: '100%', accentColor: KC.orange, cursor: 'pointer' }}
                        />
                    </div>

                    {/* Right Results Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ font: '700 12.5px/1 "JetBrains Mono", monospace', color: searchError ? '#B91C1C' : '#64748B' }}>
                                {searchError || `${displayList.length} hasil · ${activeFilterCount} filter aktif`}
                            </span>
                            <span style={{ font: '800 13px/1 "Plus Jakarta Sans", sans-serif', color: KC.ink }}>
                                Urutkan: Relevansi ▾
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {loading && (
                                <div style={{ background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 32, textAlign: 'center', font: '700 14px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                    Memuat lowongan dari database...
                                </div>
                            )}

                            {!loading && displayList.length === 0 && (
                                <div style={{
                                    background: '#fff', border: `1.5px solid ${KC.ink}`, borderRadius: 13,
                                    boxShadow: `3px 3px 0 ${KC.ink}`, padding: '40px 24px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                                    <div style={{ font: '900 18px/1.2 "Plus Jakarta Sans", sans-serif', color: KC.ink, marginBottom: 8 }}>
                                        Tidak Ada Lowongan Ditemukan
                                    </div>
                                    <div style={{ font: '500 13px/1.5 "Plus Jakarta Sans", sans-serif', color: '#64748B', maxWidth: 440, margin: '0 auto 20px' }}>
                                        Tidak ada data lowongan yang sesuai kriteria pencarian dari database. Silakan sesuaikan kata kunci atau atur ulang filter lokasi dan gaji.
                                    </div>
                                    <button
                                        onClick={() => { resetFilters(); handleSearch(); }}
                                        className="kc-btn"
                                        style={{ ...topBtn(KC.orange, '#fff'), padding: '10px 20px', fontSize: 13 }}
                                    >
                                        Reset Filter & Muat Semua Lowongan
                                    </button>
                                </div>
                            )}

                            {!loading && displayList.map((item, idx) => {
                                // Real score from a prior AI-match run, if this job happens to
                                // be in it — context only, never used to filter/sort this list.
                                const matchPct = matchScoreById.get(item.id)
                                const band = matchPct != null ? bandOf(matchPct) : null
                                const bandFg = band === 'strong' ? '#065F46' : band === 'possible' ? '#B45309' : '#075985'
                                const bandBorder = band === 'strong' ? '#10B981' : band === 'possible' ? '#F59E0B' : '#0284C7'
                                const bandBg = band === 'strong' ? '#ECFDF5' : band === 'possible' ? '#FEF3C7' : '#E0F2FE'
                                const bandLabel = band === 'strong' ? 'Strong Fit' : band === 'possible' ? 'Possible Fit' : 'Stretch Fit'
                                return (
                                <div
                                    key={item.id || idx}
                                    style={{
                                        background: '#fff',
                                        border: `1.5px solid ${KC.ink}`,
                                        borderRadius: 12,
                                        boxShadow: `3px 3px 0 ${KC.ink}`,
                                        padding: '19px 21px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 20,
                                        animation: 'kcUp .4s both',
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                                            <span style={{ font: '700 12.5px/1 "Plus Jakarta Sans", sans-serif', color: '#64748B' }}>
                                                {item.company || item.company_name}
                                            </span>
                                            {band ? (
                                                <span style={{
                                                    padding: '3px 9px',
                                                    background: bandBg,
                                                    border: `1px solid ${bandBorder}`,
                                                    borderRadius: 999,
                                                    font: '800 10px/1.3 "Plus Jakarta Sans", sans-serif',
                                                    color: bandFg,
                                                }}>
                                                    {bandLabel}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div style={{ font: '900 19px/1.2 "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.7px', color: KC.ink, marginBottom: 7 }}>
                                            {item.title}
                                        </div>
                                        <div style={{ font: '600 12px/1.4 "Plus Jakarta Sans", sans-serif', color: '#94A3B8' }}>
                                            {item.location || item.region_name || 'Jakarta'} · {item.work_type || 'Onsite'} &nbsp;·&nbsp; {item.salary_range || 'Kompetitif'} &nbsp;·&nbsp; {item.skills_text || (item.required_skills || []).join(', ')}
                                        </div>
                                    </div>

                                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {band ? (
                                            <div style={{
                                                textAlign: 'center', padding: '9px 13px',
                                                background: bandBg,
                                                border: `1.5px solid ${bandBorder}`,
                                                borderRadius: 9,
                                            }}>
                                                <div style={{ font: '900 18px/1 "Plus Jakarta Sans", sans-serif', color: bandFg }}>
                                                    {matchPct}%
                                                </div>
                                                <div style={{ font: '800 8.5px/1.5 "Plus Jakarta Sans", sans-serif', color: bandFg, letterSpacing: 0.5 }}>
                                                    MATCH
                                                </div>
                                            </div>
                                        ) : null}
                                        <button
                                            onClick={() => setSelectedJob(item)}
                                            className="kc-btn"
                                            style={{ ...topBtn(KC.ink, '#fff', KC.orange), padding: '11px 17px', fontSize: 12, whiteSpace: 'nowrap' }}
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                                )
                            })}

                            {!loading && hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="kc-btn"
                                    style={{ ...topBtn('#fff', KC.ink), padding: '12px 20px', fontSize: 13, alignSelf: 'center' }}
                                >
                                    {loadingMore ? 'Memuat…' : 'Muat Lebih Banyak'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOBILE LAYOUT (Mobile Spec · Frame 08)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DesignStyles />
            <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Mobile Header */}
            <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.9, color: KC.ink, margin: '0 0 11px', lineHeight: 1.1 }}>
                    Cari Lowongan
                </h1>

                {/* Search Bar + Filter Toggle */}
                <div style={{ display: 'flex', gap: 9, marginBottom: 11 }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 9,
                        padding: '12px 13px', background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 11, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, minHeight: 46,
                    }}>
                        <div style={{ width: 13, height: 13, border: '2.5px solid #64748B', borderRadius: '50%', flexShrink: 0 }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Cari lowongan atau keahlian…"
                            style={{
                                border: 'none', background: 'transparent', outline: 'none',
                                width: '100%', fontSize: 13, fontWeight: 700, color: KC.ink,
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setFilterPanelOpen(v => !v)}
                        style={{
                            width: 46, height: 46, background: '#090A0F',
                            border: `1.5px solid ${KC.ink}`, borderRadius: 11,
                            boxShadow: `2.5px 2.5px 0 ${KC.orange}`,
                            display: 'grid', placeItems: 'center', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 16 }}>
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2 }} />
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2, width: 11 }} />
                            <div style={{ height: 2.5, background: '#fff', borderRadius: 2, width: 6 }} />
                        </div>
                    </button>
                </div>

                {/* Collapsible Mobile Filter Drawer */}
                {filterPanelOpen && (
                    <div style={{
                        background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`,
                        padding: 14, marginBottom: 11, animation: 'kcSlideUp .3s both',
                    }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 800, letterSpacing: 0.7, textTransform: 'uppercase', color: '#64748B', marginBottom: 11 }}>
                            Filter manual
                        </div>

                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 7 }}>Lokasi</div>
                        {isRemoteMode ? (
                            <div style={{ padding: '9px 11px', background: '#F1F5F9', border: '1.5px dashed #94A3B8', borderRadius: 9, fontSize: 11, lineHeight: 1.5, color: '#64748B', marginBottom: 13 }}>
                                Lowongan Remote tidak terikat lokasi — filter ini dinonaktifkan.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 13 }}>
                                {regions.length === 0 ? (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Memuat daftar lokasi…</span>
                                ) : regions.map(r => {
                                    const on = selectedRegion === r.code
                                    return (
                                        <span
                                            key={r.code}
                                            onClick={() => setSelectedRegion(on ? '' : r.code)}
                                            style={{
                                                padding: '8px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                                background: on ? KC.ink : '#FEF3C7',
                                                color: on ? '#fff' : '#B45309',
                                                border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                                cursor: 'pointer', minHeight: 38, display: 'inline-flex', alignItems: 'center',
                                            }}
                                        >
                                            {r.name} <span style={{ opacity: 0.6, marginLeft: 4 }}>({r.job_count})</span>
                                        </span>
                                    )
                                })}
                            </div>
                        )}

                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 7 }}>Kategori / Divisi</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 13 }}>
                            {industries.length === 0 ? (
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Memuat daftar kategori…</span>
                            ) : industries.map(ind => {
                                const on = selectedIndustry === ind.name
                                return (
                                    <span
                                        key={ind.name}
                                        onClick={() => setSelectedIndustry(on ? '' : ind.name)}
                                        style={{
                                            padding: '8px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                            background: on ? KC.ink : '#E0F2FE',
                                            color: on ? '#fff' : '#075985',
                                            border: `1.5px solid ${on ? KC.ink : '#0284C7'}`,
                                            cursor: 'pointer', minHeight: 38, display: 'inline-flex', alignItems: 'center',
                                        }}
                                    >
                                        {ind.name} <span style={{ opacity: 0.6, marginLeft: 4 }}>({ind.job_count})</span>
                                    </span>
                                )
                            })}
                        </div>

                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#334155', marginBottom: 7 }}>Mode kerja</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 13 }}>
                            {['Remote', 'Hybrid', 'Onsite'].map(mode => {
                                const on = selectedModes.includes(mode)
                                return (
                                    <span
                                        key={mode}
                                        onClick={() => toggleMode(mode)}
                                        style={{
                                            padding: '8px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
                                            background: on ? KC.ink : '#FEF3C7',
                                            color: on ? '#fff' : '#B45309',
                                            border: `1.5px solid ${on ? KC.ink : '#F59E0B'}`,
                                            cursor: 'pointer', minHeight: 38, display: 'inline-flex', alignItems: 'center',
                                        }}
                                    >
                                        {mode}
                                    </span>
                                )
                            })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#334155' }}>Gaji minimum</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: KC.orange }}>Rp {minSalary} jt</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={minSalary}
                            onChange={(e) => setMinSalary(Number(e.target.value))}
                            style={{ width: '100%', accentColor: KC.orange, cursor: 'pointer', marginBottom: 14 }}
                        />

                        <div style={{ display: 'flex', gap: 9 }}>
                            <button
                                onClick={resetFilters}
                                style={{
                                    flex: 'none', padding: '11px 14px', background: '#fff',
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    fontSize: 11.5, fontWeight: 800, color: KC.ink, cursor: 'pointer',
                                }}
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => { setFilterPanelOpen(false); handleSearch(); }}
                                style={{
                                    flex: 1, padding: '11px 14px', background: KC.orange,
                                    border: `1.5px solid ${KC.ink}`, borderRadius: 9,
                                    boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                Terapkan · {displayList.length} hasil
                            </button>
                        </div>
                    </div>
                )}

                {/* Subtitle & Sort */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>
                        {displayList.length} hasil · {activeFilterCount} filter aktif
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: KC.ink }}>
                        Relevansi ▾
                    </span>
                </div>
            </div>

            {/* Mobile Dual-Track Banner */}
            <div style={{
                padding: '11px 13px', background: '#E0F2FE', border: '1.5px solid #0284C7',
                borderRadius: 11, fontSize: 11, lineHeight: 1.5, color: '#075985', fontWeight: 600,
            }}>
                <b>Dual-track:</b> hasil pencarian manual tidak dipengaruhi skor AI. Skor kecocokan tetap ditampilkan sebagai konteks, bukan urutan.
            </div>

            {/* Mobile Results List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {loading && (
                    <div style={{ background: '#FFFFFF', border: `1.5px solid ${KC.ink}`, borderRadius: 12, boxShadow: `2.5px 2.5px 0 ${KC.ink}`, padding: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                        Memuat lowongan dari database...
                    </div>
                )}

                {!loading && displayList.length === 0 && (
                    <div style={{
                        background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                        borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: '28px 18px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: KC.ink, marginBottom: 6 }}>
                            Tidak Ada Lowongan Ditemukan
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>
                            Tidak ada lowongan yang sesuai filter pencarian. Coba ubah kata kunci atau reset filter.
                        </div>
                        <button
                            onClick={() => { resetFilters(); handleSearch(); }}
                            style={{
                                width: '100%', padding: '11px 16px', background: KC.orange,
                                border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                                boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                                color: '#fff', cursor: 'pointer',
                            }}
                        >
                            Reset Filter & Tampilkan Semua
                        </button>
                    </div>
                )}

                {!loading && displayList.map((item, idx) => {
                    const matchPct = matchScoreById.get(item.id)
                    const band = matchPct != null ? bandOf(matchPct) : null
                    const bandFg = band === 'strong' ? '#065F46' : band === 'possible' ? '#B45309' : '#075985'
                    const bandBorder = band === 'strong' ? '#10B981' : band === 'possible' ? '#F59E0B' : '#0284C7'
                    const bandBg = band === 'strong' ? '#ECFDF5' : band === 'possible' ? '#FEF3C7' : '#E0F2FE'
                    return (
                    <div
                        key={item.id || idx}
                        onClick={() => setSelectedJob(item)}
                        style={{
                            background: '#FFFFFF', border: `1.5px solid ${KC.ink}`,
                            borderRadius: 12, boxShadow: `3px 3px 0 ${KC.ink}`, padding: 14,
                            cursor: 'pointer', animation: 'kcUp .4s both',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11 }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5 }}>
                                    {item.company || item.company_name}
                                </div>
                                <div style={{ fontSize: 15.5, fontWeight: 900, letterSpacing: -0.5, color: KC.ink, marginBottom: 5, lineHeight: 1.2 }}>
                                    {item.title}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>
                                    {item.location || item.region_name || 'Jakarta'} · {item.work_type || 'Onsite'} · {item.salary_range || 'Kompetitif'}
                                </div>
                            </div>
                            {band ? (
                                <div style={{
                                    flexShrink: 0, textAlign: 'center', padding: '6px 8px',
                                    background: bandBg,
                                    border: `1px solid ${bandBorder}`,
                                    borderRadius: 8,
                                }}>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: bandFg }}>
                                        {matchPct}%
                                    </div>
                                    <div style={{ fontSize: 7.5, fontWeight: 800, color: bandFg, letterSpacing: 0.3 }}>
                                        MATCH
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    )
                })}

                {!loading && hasMore && (
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        style={{
                            width: '100%', padding: '11px 16px', background: '#fff',
                            border: `1.5px solid ${KC.ink}`, borderRadius: 10,
                            boxShadow: `2.5px 2.5px 0 ${KC.ink}`, fontSize: 12, fontWeight: 800,
                            color: KC.ink, cursor: 'pointer',
                        }}
                    >
                        {loadingMore ? 'Memuat…' : 'Muat Lebih Banyak'}
                    </button>
                )}
            </div>
        </div>
    )
}
