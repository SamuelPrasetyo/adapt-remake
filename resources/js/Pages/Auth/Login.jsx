import { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function Login() {
    const { loginError } = usePage().props;
    const [showPw, setShowPw]   = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nik: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login/store');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 relative overflow-hidden">

            {/* Dot grid — top right */}
            <div className="absolute top-8 right-8 grid grid-cols-7 gap-3 opacity-40 pointer-events-none select-none">
                {Array.from({ length: 35 }).map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                ))}
            </div>

            {/* Dot grid — bottom left */}
            <div className="absolute bottom-8 left-8 grid grid-cols-7 gap-3 opacity-40 pointer-events-none select-none">
                {Array.from({ length: 35 }).map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                ))}
            </div>

            {/* Card placeholder decorations — bottom left */}
            <div className="absolute bottom-16 left-16 pointer-events-none select-none">
                <div className="w-36 h-24 rounded-xl bg-indigo-100/70 border border-indigo-200/60 shadow-sm" />
                <div className="w-28 h-16 rounded-xl bg-indigo-50/80 border border-indigo-200/50 shadow-sm mt-2 ml-4" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/assets/img/Talent&DevelopmentLogo.png"
                            alt="ADAPT"
                            className="w-24 h-24 object-contain"
                        />
                    </div>
                    <h1 className="text-center text-lg font-bold text-slate-700 mb-6 tracking-wide">
                        TALENT &amp; DEVELOPMENT
                    </h1>

                    {loginError && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={data.nik}
                                onChange={(e) => setData('nik', e.target.value)}
                                placeholder="Masukkan username"
                                required
                                autoFocus
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPw ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition"
                        >
                            {processing ? 'Memproses...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                    © {new Date().getFullYear()} IT Mekar Armada Investama
                </p>
            </div>
        </div>
    );
}
