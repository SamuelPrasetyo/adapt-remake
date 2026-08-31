import React, { useState, useMemo, useRef, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { Head, Link, router } from "@inertiajs/react";
import KaderAvatar from "@/Components/KaderAvatar";

const AVATAR_COLORS = [
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-violet-500 to-purple-500',
    'from-cyan-500 to-sky-500',
];

function avatarColor(seed = '') {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function progressBarColor(pct) {
    if (pct >= 70) return 'bg-linear-to-r from-emerald-500 to-emerald-600';
    if (pct >= 40) return 'bg-linear-to-r from-amber-500 to-amber-600';
    return 'bg-linear-to-r from-rose-500 to-rose-600';
}

function MentorFilter({ mentors, value, onChange, totalKaderInBatch }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const mentorSum = useMemo(
        () => (mentors || []).reduce((acc, m) => acc + (m.kader_count || 0), 0),
        [mentors]
    );
    const totalKader = totalKaderInBatch ?? mentorSum;

    const filtered = useMemo(() => {
        const list = mentors || [];
        if (!q.trim()) return list;
        const s = q.toLowerCase();
        return list.filter(m =>
            m.nama?.toLowerCase().includes(s) ||
            m.jabatan?.toLowerCase().includes(s)
        );
    }, [mentors, q]);

    const current = value === 'all' ? null : (mentors || []).find(m => m.id === value);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ring-1 transition ${current
                    ? 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                    }`}
            >
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate max-w-[180px]">
                    {current ? current.nama : `Semua Mentor (${totalKader})`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-72 z-30 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Cari mentor..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                        <button
                            type="button"
                            onClick={() => { onChange('all'); setOpen(false); setQ(''); }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition ${value === 'all' ? 'bg-blue-50' : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-900">Semua Kader</div>
                                <div className="text-[11px] text-slate-500">{totalKader} kader · semua mentor</div>
                            </div>
                            {value === 'all' && (
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400">Mentor</div>

                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-slate-500">Tidak ada mentor cocok.</div>
                        ) : filtered.map((m) => {
                            const isActive = value === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => { onChange(m.id); setOpen(false); setQ(''); }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${avatarColor(m.id || m.nama || '')} flex items-center justify-center text-xs font-bold text-white`}>
                                        {m.nama?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900 truncate">{m.nama}</div>
                                        <div className="text-[11px] text-slate-500 truncate">
                                            {m.jabatan || '—'} · {m.kader_count || 0} kader
                                        </div>
                                    </div>
                                    {isActive && (
                                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function BatchFilter({ batches, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const list = batches || [];
    const today = new Date().toISOString().slice(0, 10);
    const isActiveBatch = (b) => {
        const m = b.tanggal_mulai ? String(b.tanggal_mulai).slice(0, 10) : null;
        const s = b.tanggal_selesai ? String(b.tanggal_selesai).slice(0, 10) : null;
        return !!m && !!s && m <= today && today <= s;
    };
    const batchLabel = (b) => `Batch ${b.nama_batch}${b.tahun_batch ? ` (${b.tahun_batch})` : ''}`;
    const current = value === 'all' ? null : list.find(b => String(b.id_batch) === String(value));
    const label = value === 'all' ? 'Semua Batch' : (current ? batchLabel(current) : 'Pilih Batch');

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ring-1 transition ${current
                    ? 'bg-violet-50 text-violet-700 ring-violet-200 hover:bg-violet-100'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                    }`}
            >
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate max-w-40">{label}</span>
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-64 z-30 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
                    <div className="max-h-72 overflow-y-auto py-1">
                        {list.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-slate-500">Belum ada batch.</div>
                        ) : list.map((b) => {
                            const sel = String(value) === String(b.id_batch);
                            return (
                                <button
                                    key={b.id_batch}
                                    type="button"
                                    onClick={() => { onChange(String(b.id_batch)); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition ${sel ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                                >
                                    <span className="flex-1 min-w-0 text-sm font-medium text-slate-900 truncate">{batchLabel(b)}</span>
                                    {isActiveBatch(b) && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">Aktif</span>
                                    )}
                                    {sel && (
                                        <svg className="w-4 h-4 text-violet-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                        <div className="border-t border-slate-100 my-1" />
                        <button
                            type="button"
                            onClick={() => { onChange('all'); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium transition ${value === 'all' ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                            Semua Batch
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MonthFilter({ value, onChange, options = [] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const current = options.find(o => o.id === value);
    const label = current ? current.label : 'Pilih Bulan';

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ring-1 transition ${value !== 'all'
                    ? 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                    }`}
            >
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate max-w-40">{label}</span>
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-48 z-30 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
                    <div className="py-1">
                        {options.map((o) => {
                            const sel = value === o.id;
                            return (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => { onChange(o.id); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition ${sel ? 'bg-amber-50 text-amber-700 font-medium' : 'hover:bg-slate-50 text-slate-700 text-sm'}`}
                                >
                                    <span className="flex-1 min-w-0 truncate">{o.label}</span>
                                    {sel && (
                                        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export const BULAN_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function KaderFeedback({ kaders = [], batches = [], weekMonthMap = {} }) {
    const [search, setSearch] = useState("");
    const [batchFilter, setBatchFilter] = useState(() => {
        if (batches && batches.length > 0) {
            return String(batches[0].id_batch);
        }
        return "all";
    });
    const [mentorFilter, setMentorFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'nama_kader', direction: 'asc' });
    const [checklistView, setChecklistView] = useState('mentor'); // 'mentor' | 'kader'

    const availableMonths = useMemo(() => {
        const keys = new Set();
        if (batchFilter === 'all') {
            Object.values(weekMonthMap).forEach(batchMonths => {
                Object.keys(batchMonths).forEach(k => keys.add(k));
            });
        } else {
            const batchMonths = weekMonthMap[batchFilter] || {};
            Object.keys(batchMonths).forEach(k => keys.add(k));
        }

        const sorted = Array.from(keys).sort(); // "2026-07"
        return [
            { id: 'all', label: 'Semua Bulan' },
            ...sorted.map(k => {
                const [y, m] = k.split('-');
                return { id: k, label: `${BULAN_ID[parseInt(m, 10)]} ${y}` };
            })
        ];
    }, [weekMonthMap, batchFilter]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <svg className="w-3 h-3 ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
        }
        if (sortConfig.direction === 'asc') {
            return <svg className="w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
        }
        return <svg className="w-3 h-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
    };

    const derivedMentors = useMemo(() => {
        if (!kaders) return [];
        const map = new Map();

        let batchKaders = kaders;
        if (batchFilter !== 'all') {
            batchKaders = kaders.filter(k => k.id_batch == batchFilter);
        }

        batchKaders.forEach(k => {
            if (k.mentors && k.mentors.length > 0) {
                k.mentors.forEach(m => {
                    const key = m.nama;
                    if (!map.has(key)) {
                        map.set(key, {
                            id: key,
                            nama: m.nama,
                            jabatan: m.jabatan,
                            kader_count: 0
                        });
                    }
                    map.get(key).kader_count += 1;
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
    }, [kaders, batchFilter]);

    const filteredKaders = useMemo(() => {
        if (!kaders || !Array.isArray(kaders)) return [];

        let result = kaders;

        // Filter by batch
        if (batchFilter !== 'all') {
            result = result.filter(kader => kader.id_batch == batchFilter);
        }

        // Filter by mentor
        if (mentorFilter !== 'all') {
            result = result.filter(kader => kader.mentors && kader.mentors.some(m => m.nama === mentorFilter));
        }

        // Filter by search
        if (search.trim()) {
            const lowerSearch = search.toLowerCase();
            result = result.filter((kader) =>
                kader.nama_kader?.toLowerCase().includes(lowerSearch) ||
                kader.bu?.toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Map with original index for 'No' sorting
        let mapped = result.map((kader, index) => ({ ...kader, originalIndex: index + 1 }));

        // 3. Sort
        mapped.sort((a, b) => {
            if (sortConfig.key === 'nama_kader') {
                const nameA = a.nama_kader || '';
                const nameB = b.nama_kader || '';
                return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }
            if (sortConfig.key === 'bu') {
                const buA = a.bu || '';
                const buB = b.bu || '';
                return sortConfig.direction === 'asc' ? buA.localeCompare(buB) : buB.localeCompare(buA);
            }
            if (sortConfig.key === 'nama_mentor') {
                const nameA = a.mentors?.[0]?.nama || '';
                const nameB = b.mentors?.[0]?.nama || '';
                return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }
            if (sortConfig.key === 'status_feedback') {
                const statusA = a.has_feedback ? 1 : 0;
                const statusB = b.has_feedback ? 1 : 0;
                return sortConfig.direction === 'asc' ? statusA - statusB : statusB - statusA;
            }
            if (sortConfig.key === 'avg_score') {
                const scoreA = a.avg_score !== null ? Number(a.avg_score) : -1;
                const scoreB = b.avg_score !== null ? Number(b.avg_score) : -1;
                return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            }
            return 0;
        });

        return mapped;
    }, [kaders, search, sortConfig, batchFilter, mentorFilter]);
    return (
        <AppLayout title="NILAI FEEDBACK" breadcrumb="Nilai Feedback">
            <Head title="Nilai Feedback" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Data Feedback Weekly</h1>
                        <p className="text-sm text-slate-500 mt-0.5">{filteredKaders.length} kader ditemukan</p>
                    </div>
                </div>

                {/* View Toggle */}
                {filteredKaders.length > 0 && (
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button
                            onClick={() => setChecklistView('mentor')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${checklistView === 'mentor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            Mentor
                        </button>
                        <button
                            onClick={() => setChecklistView('kader')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${checklistView === 'kader' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                        >
                            Kader
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] mb-6">
                <div className="px-4 lg:px-6 pt-4 pb-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative w-full lg:max-w-md flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Kader atau BU..."
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-150"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Search & Badges */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                        <BatchFilter
                            batches={batches}
                            value={batchFilter}
                            onChange={(val) => {
                                setBatchFilter(val);
                                setMentorFilter('all'); // Reset mentor filter when batch changes
                                setMonthFilter('all');  // Reset month filter when batch changes
                            }}
                        />

                        <MonthFilter
                            value={monthFilter}
                            onChange={setMonthFilter}
                            options={availableMonths}
                        />

                        {derivedMentors.length > 0 && (
                            <MentorFilter
                                mentors={derivedMentors}
                                value={mentorFilter}
                                onChange={setMentorFilter}
                                totalKaderInBatch={(kaders || []).filter(k => batchFilter === 'all' || k.id_batch == batchFilter).length}
                            />
                        )}

                    </div>
                </div>


                {/* Table */}
                <div className="overflow-x-auto rounded-b-2xl border-t-0 border-slate-100 relative">
                    <table className="w-full text-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 select-none">
                                <th className="px-6 py-3 font-medium whitespace-nowrap text-slate-500 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center">No</div>
                                </th>
                                <th className="px-6 py-3 font-medium whitespace-nowrap text-slate-500 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center">Nama Kader</div>
                                </th>
                                <th className="px-4 py-3 font-medium whitespace-nowrap cursor-pointer group hover:text-slate-700 bg-slate-50 border-b border-slate-100" onClick={() => handleSort('bu')}>
                                    <div className="flex items-center">BU <SortIcon columnKey="bu" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium whitespace-nowrap cursor-pointer group hover:text-slate-700 bg-slate-50 border-b border-slate-100" onClick={() => handleSort('nama_mentor')}>
                                    <div className="flex items-center">Mentor <SortIcon columnKey="nama_mentor" /></div>
                                </th>
                                <th className="px-4 py-3 font-medium text-center whitespace-nowrap text-slate-500 bg-slate-50 border-b border-slate-100 w-[360px] min-w-[360px]">
                                    <div className="flex items-center justify-center">Checklist Mingguan {checklistView === 'mentor' ? 'Skor Mentor' : 'Kader'}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredKaders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 border-b border-slate-100">
                                        Tidak ada data kader yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredKaders.map((kader, index) => {
                                    const initials = (kader.nama_kader || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

                                    return (
                                        <tr
                                            key={kader.id}
                                            className="group hover:bg-slate-50/60 transition cursor-pointer"
                                            onClick={() => router.visit(`/kader-saya/${kader.id}`)}
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-slate-500 bg-white group-hover:bg-slate-50 border-b border-slate-100 align-top">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-3 bg-white group-hover:bg-slate-50 border-b border-slate-100 align-top">
                                                <div className="flex items-center gap-3">
                                                    <KaderAvatar
                                                        src={kader.foto}
                                                        initials={initials}
                                                        alt={kader.nama_kader}
                                                        className="w-9 h-9 rounded-full text-xs shrink-0"
                                                        fallbackClass={`bg-linear-to-br ${avatarColor(kader.nama_kader || '')}`}
                                                    />
                                                    <div className="w-full">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="font-medium text-slate-900" title={kader.nama_kader}>{kader.nama_kader}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-700 bg-white group-hover:bg-slate-50 border-b border-slate-100 align-top">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-slate-700" title={kader.bu}>
                                                        {kader.bu || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 bg-white group-hover:bg-slate-50 border-b border-slate-100 align-top">
                                                {kader.mentors?.length > 0 ? (
                                                    <div className="space-y-2.5 max-w-full">
                                                        {kader.mentors.map((m, i) => (
                                                            <div key={i}>
                                                                <div className="text-sm font-medium text-slate-700" title={m.nama}>{m.nama}</div>
                                                                {m.jabatan && (
                                                                    <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-200 max-w-full" title={m.jabatan}>
                                                                        {m.jabatan}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">Belum di-assign</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center border-b border-slate-100 align-top">
                                                <div className="flex flex-wrap gap-1.5 items-center justify-start py-1 w-full max-w-[340px] mx-auto">
                                                    {(() => {
                                                        let displayWeeks = [];
                                                        if (monthFilter !== 'all') {
                                                            displayWeeks = weekMonthMap[kader.id_batch]?.[monthFilter] || [];
                                                        } else {
                                                            const allWeeksSet = new Set();
                                                            const batchMonths = weekMonthMap[kader.id_batch] || {};
                                                            Object.values(batchMonths).forEach(weeks => {
                                                                weeks.forEach(w => allWeeksSet.add(w));
                                                            });
                                                            displayWeeks = Array.from(allWeeksSet).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

                                                            // Fallback for legacy batches without weeks defined
                                                            if (displayWeeks.length === 0) {
                                                                displayWeeks = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];
                                                            }
                                                        }

                                                        if (displayWeeks.length === 0) {
                                                            if (kader.id_batch == 1 || kader.id_batch == 2) {
                                                                return <span className="text-xs text-rose-500 italic max-w-xs block text-center leading-relaxed font-medium">Feedback terkunci. Masa batch kader ini sudah berakhir, sehingga feedback tidak dapat dikirim maupun diubah lagi.</span>;
                                                            }
                                                            return <span className="text-xs text-slate-400 italic">Tidak ada jadwal</span>;
                                                        }

                                                        if (checklistView === 'mentor') {
                                                            return displayWeeks.map(w => {
                                                                const score = kader.weekly_scores && kader.weekly_scores[w] !== undefined ? kader.weekly_scores[w] : null;
                                                                if (score !== null) {
                                                                    return (
                                                                        <div key={w} className="w-8 h-8 shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md flex flex-col items-center justify-center shadow-sm">
                                                                            <span className="text-[9px] font-semibold leading-none opacity-60 mb-[1px]">W{w}</span>
                                                                            <span className="text-[10px] font-bold leading-none">{Math.round(Number(score) * 10)}</span>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div key={w} className="w-8 h-8 shrink-0 bg-rose-50 border border-rose-200 text-rose-500 rounded-md flex flex-col items-center justify-center shadow-sm">
                                                                            <span className="text-[9px] font-semibold leading-none opacity-60 mb-[1px]">W{w}</span>
                                                                            <span className="text-[10px] font-bold leading-none">—</span>
                                                                        </div>
                                                                    );
                                                                }
                                                            });
                                                        } else {
                                                            const filledWeeks = new Set(kader.filled_mentee_weeks || []);
                                                            return displayWeeks.map(w => {
                                                                const filled = filledWeeks.has(w) || filledWeeks.has(Number(w));
                                                                return (
                                                                    <div key={w} className={`w-8 h-8 shrink-0 rounded-md flex flex-col items-center justify-center shadow-sm ${filled
                                                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                                                        : 'bg-rose-50 border border-rose-200 text-rose-500'
                                                                        }`}>
                                                                        <span className="text-[9px] font-semibold leading-none opacity-60 mb-[1px]">W{w}</span>
                                                                        <span className="text-[10px] font-bold leading-none flex items-center justify-center">
                                                                            {filled ? (
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            ) : (
                                                                                '—'
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            });
                                                        }
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
