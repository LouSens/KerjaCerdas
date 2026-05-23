import { useState } from 'react';
import { ShieldCheck, UserCheck, GraduationCap, ArrowRight, Lock, ServerCrash, CheckCircle2 } from 'lucide-react';
import { verifyEducation, verifyIdentity } from '../services/api';

export default function VerificationDashboard() {
    const [ekycStatus, setEkycStatus] = useState('unverified'); // 'unverified', 'loading', 'verified', 'failed'
    const [sivilStatus, setSivilStatus] = useState('unverified'); // 'unverified', 'loading', 'verified', 'failed'
    
    const [ekycData, setEkycData] = useState({ nik: '', name: '', dob: '' });
    const [sivilData, setSivilData] = useState({ ijazah: '', university: '', major: '' });
    
    const [sivilResult, setSivilResult] = useState(null);
    const [verificationHash, setVerificationHash] = useState(null);

    const handleVerifyEkyc = async (e) => {
        e.preventDefault();
        setEkycStatus('loading');
        try {
            const data = await verifyIdentity({
                nik: ekycData.nik,
                full_name: ekycData.name,
                date_of_birth: ekycData.dob
            });
            if (data.status === 'VERIFIED') {
                setVerificationHash(data.verification_hash);
                setEkycStatus('verified');
            } else {
                setEkycStatus('failed');
            }
        } catch (error) {
            setEkycStatus('failed');
        }
    };

    const handleVerifySivil = async (e) => {
        e.preventDefault();
        setSivilStatus('loading');
        try {
            const data = await verifyEducation({
                ijazah_number: sivilData.ijazah,
                university_name: sivilData.university,
                major: sivilData.major
            });
            if (data.status === 'VERIFIED') {
                setSivilResult(data.verified_data);
                setSivilStatus('verified');
            } else {
                setSivilStatus('failed');
            }
        } catch (error) {
            setSivilStatus('failed');
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    Keamanan & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-600">Verifikasi</span>
                </h1>
                <p className="text-slate-500 text-sm max-w-2xl">
                    Tingkatkan kepercayaan profil Anda dengan memverifikasi data secara resmi. 
                    Kandidat terverifikasi mendapat respon HRD hingga 3x lebih cepat.
                </p>
            </div>

            {/* Privacy Guarantee Notice */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-emerald-900 mb-1">Jaminan Privasi Verifikasi Demo</h3>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        Data identitas Anda digunakan hanya untuk simulasi verifikasi pada demo ini.
                        KerjaCerdas menampilkan status hasil verifikasi dan hash referensi mock agar alur UI dapat diuji
                        tanpa ketergantungan pada layanan verifikasi eksternal.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ─── E-KYC CARD ─── */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-brand-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Verifikasi KTP</h2>
                                <p className="text-xs text-slate-500">Integrasi e-KYC Dukcapil</p>
                            </div>
                        </div>
                        {ekycStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                            </span>
                        )}
                    </div>

                    {ekycStatus === 'verified' ? (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-xs text-slate-500 mb-2">Data Terverifikasi Resmi</div>
                            <div className="font-mono text-sm font-medium text-slate-700 mb-1">
                                NIK: {ekycData.nik.substring(0, 4)}********{ekycData.nik.substring(12)}
                            </div>
                            <div className="text-sm font-medium text-slate-900 mb-3">Nama: {ekycData.name}</div>
                            
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
                                <div className="text-[10px] sm:text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5" />
                                    Hash Referensi Verifikasi
                                </div>
                                <div className="font-mono text-[10px] sm:text-xs text-emerald-600 break-all leading-relaxed">
                                    {verificationHash || '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200">
                                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4" /> Skor Kecocokan Biometrik: 98.5%
                                </span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyEkyc} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-600">Nomor Induk Kependudukan (NIK)</label>
                                    {ekycData.nik.length === 16 && (
                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Valid
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        maxLength={16}
                                        required
                                        placeholder="Contoh: 3171xxxxxxxxxxxx"
                                        value={ekycData.nik}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setEkycData({...ekycData, nik: val});
                                            if (ekycStatus === 'failed') setEkycStatus('unverified');
                                        }}
                                        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all placeholder:text-slate-400
                                            ${ekycData.nik.length === 16 ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500' : 'border-slate-200 focus:ring-brand-500/20 focus:border-brand-500'}
                                            ${ekycStatus === 'failed' ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                                    />
                                    {ekycData.nik.length > 0 && ekycData.nik.length < 16 && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                                            {ekycData.nik.length}/16
                                        </span>
                                    )}
                                </div>
                                {ekycStatus === 'failed' && <p className="text-rose-500 text-xs mt-1.5 font-medium">Verifikasi gagal. NIK tidak valid atau simulasi (hindari awalan 99).</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Sesuai KTP</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={ekycData.name}
                                        onChange={e => setEkycData({...ekycData, name: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Tanggal Lahir</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={ekycData.dob}
                                        onChange={e => setEkycData({...ekycData, dob: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-slate-600"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={ekycStatus === 'loading' || ekycData.nik.length < 16}
                                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {ekycStatus === 'loading' ? 'Memverifikasi...' : 'Verifikasi Sekarang (Gratis)'}
                            </button>
                        </form>
                    )}
                </div>

                {/* ─── SIVIL CARD ─── */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Verifikasi Ijazah</h2>
                                <p className="text-xs text-slate-500">SIVIL Kemdikbudristek</p>
                            </div>
                        </div>
                        {sivilStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                            </span>
                        )}
                    </div>

                    {sivilStatus === 'verified' && sivilResult ? (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-xs text-slate-500 mb-3">Tercatat di Database SIVIL</div>
                            
                            <div className="space-y-2">
                                <div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Universitas</div>
                                    <div className="text-sm font-medium text-slate-900">{sivilResult.university}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Program Studi</div>
                                    <div className="text-sm font-medium text-slate-900">{sivilResult.major} ({sivilResult.degree})</div>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tahun Lulus</div>
                                        <div className="text-sm font-medium text-slate-900">{sivilResult.graduation_year}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status</div>
                                        <div className="text-sm font-medium text-emerald-600">{sivilResult.status}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifySivil} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nomor Ijazah Nasional (PIN)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Nomor seri ijazah..."
                                    value={sivilData.ijazah}
                                    onChange={e => setSivilData({...sivilData, ijazah: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-400"
                                />
                                {sivilStatus === 'failed' && <p className="text-rose-500 text-xs mt-1.5 font-medium">Ijazah tidak ditemukan di database SIVIL.</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Perguruan Tinggi</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Nama Universitas"
                                        value={sivilData.university}
                                        onChange={e => setSivilData({...sivilData, university: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Program Studi</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Nama Prodi"
                                        value={sivilData.major}
                                        onChange={e => setSivilData({...sivilData, major: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={sivilStatus === 'loading' || !sivilData.ijazah}
                                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {sivilStatus === 'loading' ? 'Mencari di SIVIL...' : 'Cek Keaslian Ijazah'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
