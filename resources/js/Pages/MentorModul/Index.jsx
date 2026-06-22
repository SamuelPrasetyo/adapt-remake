import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { FASE_LABELS, getFaseNum } from '@/constants/fase';

const PAGE_SIZE = 9;

const TABS = [
    { id: 'all',    label: 'Semua' },
    { id: 'mentor', label: 'Modul Mentor' },
    { id: '1',      label: 'Foundation' },
    { id: '2',      label: 'Self Learning' },
    { id: '3',      label: 'Monthly Training' },
    { id: '4',      label: 'Administration' },
];

const FASE_CONFIG = {
    '3': { label: FASE_LABELS['3'], badgeClass: 'bg-emerald-900 text-emerald-100' },
    '1': { label: FASE_LABELS['1'], badgeClass: 'bg-sky-100 text-sky-700' },
    '2': { label: FASE_LABELS['2'], badgeClass: 'bg-green-100 text-green-700' },
    '4': { label: FASE_LABELS['4'], badgeClass: 'bg-slate-100 text-slate-600' },
};

const faseKey = getFaseNum;

function EyeIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}


function SearchIcon() {
    return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
    );
}

function ModulCard({ modul }) {
    const key = faseKey(modul.fase);
    const isMentor = modul.tipe === 'MENTOR';
    const faseConf = isMentor
        ? { label: 'Modul Mentor', badgeClass: 'bg-violet-100 text-violet-700' }
        : (FASE_CONFIG[key] ?? { label: modul.fase, badgeClass: 'bg-slate-100 text-slate-600' });

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
                </div>
            )}
        </div>
    );
}

export default function MentorModulIndex({ moduls = [] }) {
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch]       = useState('');
    const [page, setPage]           = useState(1);

    const counts = useMemo(() => {
        const c = { all: moduls.length, mentor: 0 };
        moduls.forEach(m => {
            if (m.tipe === 'MENTOR') { c.mentor++; return; }
            const k = faseKey(m.fase);
            c[k] = (c[k] ?? 0) + 1;
        });
        return c;
    }, [moduls]);

    const filtered = useMemo(() => {
        let list = moduls;
        if (activeTab === 'mentor') {
            list = list.filter(m => m.tipe === 'MENTOR');
        } else if (activeTab !== 'all') {
            list = list.filter(m => m.tipe !== 'MENTOR' && faseKey(m.fase) === activeTab);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(m =>
                m.nama_modul?.toLowerCase().includes(q) ||
                m.kode_modul?.toLowerCase().includes(q) ||
                m.tag_kompetensi?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [moduls, activeTab, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages);
    const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    function handleTabChange(id) {
        setActiveTab(id);
        setPage(1);
    }

    function handleSearch(e) {
        setSearch(e.target.value);
        setPage(1);
    }

    return (
        <AppLayout title="Modul" breadcrumb="Program & Modul / Modul">
            {/* Tab filter + search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-1.5 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                    {TABS.map(tab => {
                        if (tab.id !== 'all' && !counts[tab.id]) return null;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                                {counts[tab.id] > 0 && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-blue-500 text-blue-100' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {counts[tab.id]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative shrink-0 w-full sm:w-56">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Cari nama / kode modul…"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Card grid */}
            {paginated.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-500 shadow-sm border border-slate-200">
                    {search ? `Tidak ada modul yang cocok dengan "${search}".` : 'Belum ada modul di kategori ini.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginated.map(m => <ModulCard key={m.id} modul={m} />)}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-slate-500">
                        Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} modul
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            ‹ Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-sm rounded-lg transition ${
                                            p === safePage
                                                ? 'bg-blue-600 text-white font-semibold'
                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )
                        }
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Next ›
                        </button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
