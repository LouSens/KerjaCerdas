import { useRef } from 'react'
import { UploadCloud, Loader2, Briefcase } from 'lucide-react'
import useStore from '../store/useStore'

export default function JobPackUploader() {
    const { uploadJobPack, jobPackUploading } = useStore()
    const inputRef = useRef(null)
    return (
        <section className="bg-white rounded-2xl border-2 border-dashed border-surface-300 p-6 text-center">
            <span className="inline-flex w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mb-3">
                {jobPackUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </span>
            <h3 className="text-base font-bold">Upload Job Pack (PDF)</h3>
            <p className="text-sm text-surface-600 mb-4 max-w-md mx-auto">
                PDF berisi satu atau banyak job description. Gemini akan memecah, mengisi skill wajib, gaji, lokasi, dan langsung mempublikasikan.
            </p>
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => uploadJobPack(e.target.files?.[0])} />
            <button
                onClick={() => inputRef.current?.click()}
                disabled={jobPackUploading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
                <Briefcase className="w-4 h-4" />
                {jobPackUploading ? 'Memproses…' : 'Pilih file PDF'}
            </button>
        </section>
    )
}
