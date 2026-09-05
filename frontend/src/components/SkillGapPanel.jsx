import { useEffect, useMemo, useState } from 'react'
import useStore from '../store/useStore'
import toast from 'react-hot-toast'
import { KC, BrutalCard, Tag, topBtn, DesignStyles } from './_design'
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Clock,
    ExternalLink,
    GraduationCap,
    Sparkles,
    TrendingUp,
} from 'lucide-react'

const skillName = (skill) => typeof skill === 'string' ? skill : skill?.name

export default function SkillGapPanel() {
    const {
        profile, matches, navigate, skillGapResult, skillGapLoading,
        skillGapError, runSkillGap, loadSkillGap,
    } = useStore()
    const [targetJobId, setTargetJobId] = useState('')

    const targetJobs = useMemo(() => matches
        .filter(match => match?.job_id || match?.id)
        .map(match => ({
            id: match.job_id || match.id,
            title: match.title || match.job_title || 'Lowongan tanpa judul',
        })), [matches])

    useEffect(() => { loadSkillGap() }, [loadSkillGap])

    const currentSkills = (profile?.skills || []).map(skillName).filter(Boolean)
    const result = skillGapResult
    const matchingSkills = result?.matching_skills || []
    const missingSkills = result?.missing_skills || []
    const courses = result?.recommended_courses || []

    const runAnalysis = async () => {
        const analysis = await runSkillGap(targetJobId || null)
        if (analysis) toast.success('Analisis skill gap diperbarui untuk lowongan yang dipilih.')
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <DesignStyles />
            <header className="kc-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${KC.ink}`, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h1 className="kc-h1" style={{ animation: 'kc-fade-up .4s ease both' }}>Skill Gap dan Rencana Belajar</h1>
                    <p style={{ fontSize: 14, color: KC.mute, margin: '4px 0 0' }}>Bandingkan profil Anda dengan kebutuhan lowongan dan pilih langkah belajar yang relevan.</p>
                </div>
                <button className="kc-btn" onClick={() => navigate('seeker-match')} style={topBtn('#fff')}>Kembali ke Match</button>
            </header>

            {/* Analysis controls — always shown when user has any profile data */}
            <BrutalCard color="#FFFFFF" padding={22}>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <label htmlFor="skill-gap-target" style={{ display: 'block', fontSize: 12, fontWeight: 800, color: KC.ink, marginBottom: 6 }}>Lowongan target</label>
                        <select id="skill-gap-target" value={targetJobId} onChange={event => setTargetJobId(event.target.value)} style={{ width: '100%', border: `1.5px solid ${KC.ink}`, borderRadius: 8, padding: '10px 12px', background: '#fff', fontFamily: 'inherit', fontSize: 13 }}>
                            <option value="">Pilih otomatis dari lowongan paling relevan</option>
                            {targetJobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                        </select>
                    </div>
                    <button className="kc-btn" disabled={skillGapLoading} onClick={runAnalysis} style={{ ...topBtn(KC.orange, '#fff'), opacity: skillGapLoading ? 0.65 : 1 }}>
                        <Sparkles size={15} /> {skillGapLoading ? 'Menganalisis...' : 'Analisis Skill Gap'}
                    </button>
                </div>
                {!currentSkills.length && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: '12px 14px', background: '#FFF7ED', border: `1px solid ${KC.orange}`, borderRadius: 8 }}>
                        <AlertCircle size={17} color={KC.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: '#9A3412', lineHeight: 1.5, margin: 0 }}>
                            Profil Anda belum memiliki keahlian tercatat. Unggah CV atau tambahkan skill secara manual di halaman profil agar hasil analisis lebih akurat.
                            Anda tetap bisa menjalankan analisis — sistem akan mencocokkan berdasarkan seluruh profil yang tersedia.
                        </p>
                    </div>
                )}
                <p style={{ fontSize: 12, color: KC.mute, lineHeight: 1.5, margin: '12px 0 0' }}>Gap dihitung dari skill wajib pada lowongan dan skill yang tersimpan di profil. Rekomendasi kursus adalah referensi belajar, bukan kemitraan atau sertifikasi resmi.</p>
            </BrutalCard>

            {skillGapError && <BrutalCard color="#FFF4ED" padding={18}><div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#9A3412', fontSize: 13, lineHeight: 1.5 }}><AlertCircle size={17} style={{ flexShrink: 0, marginTop: 2 }} /><span>Analisis belum dapat dijalankan: {skillGapError}</span></div></BrutalCard>}

            {result && <>
                <BrutalCard color={KC.indigoSoft} padding={18}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <TrendingUp size={18} color={KC.indigo} />
                        <strong style={{ color: KC.ink }}>Target: {result.target_job_title || 'Lowongan terpilih'}</strong>
                        <Tag color="#fff" ink={KC.indigo} border={KC.indigo} size="sm">Gap {result.gap_severity || 'belum dihitung'}</Tag>
                        <span style={{ fontSize: 12, color: KC.inkLight }}>Kecocokan saat ini: {result.match_before ?? 0}%</span>
                        <span style={{ fontSize: 12, color: KC.inkLight }}>Estimasi upaya: {result.estimated_hours ?? 0} jam</span>
                    </div>
                    <p style={{ fontSize: 12, color: KC.inkLight, lineHeight: 1.5, margin: '10px 0 0' }}>Potensi setelah semua gap ditutup: {result.match_after ?? 0}%. Ini adalah estimasi skenario dari rubric yang sama, bukan jaminan diterima bekerja.</p>
                </BrutalCard>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
                    <SkillCard icon={<CheckCircle2 size={18} color={KC.lime} />} title="Skill yang sudah sesuai" subtitle="Irisan profil dengan kebutuhan lowongan" skills={matchingSkills} color={KC.lime} background={KC.limeSoft} prefix="✓" empty="Belum ada skill wajib yang sama persis. Lengkapi profil jika ada pengalaman relevan." />
                    <SkillCard icon={<TrendingUp size={18} color={KC.yellow} />} title="Skill yang perlu dipelajari" subtitle="Kebutuhan wajib yang belum ada di profil" skills={missingSkills} color={KC.yellow} background={KC.yellowSoft} prefix="+" empty="Tidak ada gap skill wajib untuk lowongan ini." />
                </div>

                <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, margin: 0, color: KC.ink }}>Referensi pembelajaran</h2>
                            <p style={{ fontSize: 13, color: KC.mute, margin: '2px 0 0' }}>Dihasilkan dari gap saat ini. Periksa informasi penyedia sebelum mendaftar.</p>
                        </div>
                        <Tag color={KC.indigoSoft} ink={KC.indigo} border={KC.indigo} size="sm"><GraduationCap size={13} /> {courses.length} rekomendasi</Tag>
                    </div>
                    {courses.length ? <div className="kc-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>{courses.map((course, index) => <CourseCard key={`${course.name || 'course'}-${index}`} course={course} />)}</div> : <EmptyCopy text="Tidak ada rekomendasi karena tidak ada gap skill wajib untuk lowongan ini." />}
                </section>
            </>}

            {!result && currentSkills.length && !skillGapLoading && !skillGapError && <BrutalCard color="#FFFFFF" padding={24}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}><BookOpen size={21} color={KC.indigo} style={{ flexShrink: 0, marginTop: 2 }} /><p style={{ fontSize: 13, color: KC.inkLight, lineHeight: 1.5, margin: 0 }}>Pilih target lowongan lalu jalankan analisis. Hasil akan tersimpan untuk akun Anda sehingga dapat dibandingkan setelah profil diperbarui.</p></div></BrutalCard>}
        </div>
    )
}

function SkillCard({ icon, title, subtitle, skills, color, background, prefix, empty }) {
    return <BrutalCard color="#FFFFFF" padding={22}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>{icon}<div><h2 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: KC.ink }}>{title}</h2><span style={{ fontSize: 12, color: KC.mute }}>{subtitle}</span></div></div>
        {skills.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{skills.map((skill, index) => <span key={`${skillName(skill)}-${index}`} style={{ padding: '5px 10px', background, border: `1px solid ${color}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: KC.ink }}>{prefix} {skillName(skill)}</span>)}</div> : <EmptyCopy text={empty} />}
    </BrutalCard>
}

function EmptyCopy({ text }) {
    return <p style={{ fontSize: 13, color: KC.mute, lineHeight: 1.5, margin: 0 }}>{text}</p>
}

function CourseCard({ course }) {
    const hasUrl = typeof course.url === 'string' && /^https:\/\//i.test(course.url)
    return <BrutalCard color="#FFFFFF" padding={20} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: KC.mute }}>{course.provider || 'Penyedia belum diverifikasi'}</span><span style={{ fontSize: 11, fontWeight: 700, color: KC.inkLight, background: KC.surface, padding: '2px 8px', borderRadius: 6, border: `1px solid ${KC.ash}` }}>{course.price || 'Biaya belum diverifikasi'}</span></div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: KC.ink, lineHeight: 1.3 }}>{course.name || 'Rekomendasi pembelajaran'}</h3>
            <p style={{ fontSize: 12, color: KC.inkLight, lineHeight: 1.5, margin: 0 }}>{course.description || 'Periksa kurikulum dan persyaratan langsung pada penyedia.'}</p>
        </div>
        <div style={{ paddingTop: 12, borderTop: `1px solid ${KC.ash}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: KC.mute, fontWeight: 600 }}><Clock size={12} /> {course.duration || 'Durasi belum diverifikasi'}</span>{hasUrl && <a href={course.url} target="_blank" rel="noreferrer" className="kc-btn" style={{ ...topBtn(KC.ink, '#fff'), padding: '6px 12px', fontSize: 11, textDecoration: 'none' }}>Periksa penyedia <ExternalLink size={12} /></a>}</div>
    </BrutalCard>
}
