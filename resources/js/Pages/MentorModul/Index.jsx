import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const TABS = [
    { id: 'all', label: 'Semua' },
    { id: '3', label: 'Modul Mentor', sublabel: 'Fase 3' },
    { id: '1', label: 'Fase 1', sublabel: 'View' },
    { id: '2', label: 'Fase 2', sublabel: 'View' },
    { id: '4', label: 'Administrasi' },
];

const FASE_CONFIG = {
    '3': { label: 'Mentor', badgeClass: 'bg-emerald-900 text-emerald-100' },
    '1': { label: 'Fase 1', badgeClass: 'bg-sky-100 text-sky-700' },
    '2': { label: 'Fase 2', badgeClass: 'bg-green-100 text-green-700' },
    '4': { label: 'Administrasi', badgeClass: 'bg-slate-100 text-slate-600' },
};

// Normalizes "Fase 1" → "1" or 1 → "1"
function faseKey(fase) {
    const s = String(fase);
    const m = s.match(/\d+/);
    return m ? m[0] : s;
}

function EyeIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

function ModulCard({ modul }) {
    const key = faseKey(modul.fase);
    const faseConf = FASE_CONFIG[key] ?? { label: modul.fase, badgeClass: 'bg-slate-100 text-slate-600' };
    const isViewOnly = key === '1' || key === '2';

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-wide">{modul.kode_modul}</p>
                <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${faseConf.badgeClass}`}>
                    {faseConf.label}
                </span>
            </div>

            <div>
                <p className="text-sm font-bold text-slate-800 leading-snug">{modul.nama_modul}</p>
                {modul.tag_kompetensi && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{modul.tag_kompetensi}</p>
                )}
            </div>

            {isViewOnly && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <LockIcon />
                    View &amp; Unduh saja
                </p>
            )}

            {modul.file_materi && (
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                    <a
                        href={`/${modul.file_materi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
                    >
                        <EyeIcon />
                        Lihat Materi
                    </a>
                    <a
                        href={`/${modul.file_materi}`}
                        download
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <DownloadIcon />
                        Unduh Materi
                    </a>
                </div>
            )}
        </div>
    );
}

export default function MentorModulIndex({ moduls = [] }) {
    const [activeTab, setActiveTab] = useState('all');

    const counts = useMemo(() => {
        const c = { all: moduls.length };
        moduls.forEach(m => {
            const k = faseKey(m.fase);
            c[k] = (c[k] ?? 0) + 1;
        });
        return c;
    }, [moduls]);

    const filtered = useMemo(() => {
        if (activeTab === 'all') return moduls;
        return moduls.filter(m => faseKey(m.fase) === activeTab);
    }, [moduls, activeTab]);

    return (
        <AppLayout title="Modul" breadcrumb="Program & Modul / Modul">
            <p className="text-sm text-slate-500 mb-6">
                Library modul mengajar program MT
            </p>

            {/* Tab filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-1.5 flex flex-wrap gap-1">
                {TABS.map(tab => {
                    if (tab.id !== 'all' && !counts[tab.id]) return null;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                            {tab.sublabel && (
                                <span className={`ml-1 text-xs ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                                    ({tab.sublabel})
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Card grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-500 shadow-sm border border-slate-200">
                    Belum ada modul di kategori ini.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(m => <ModulCard key={m.id} modul={m} />)}
                </div>
            )}
        </AppLayout>
    );
}
