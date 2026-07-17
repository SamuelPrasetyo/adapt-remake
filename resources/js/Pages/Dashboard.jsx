// Dashboard utama — Mentor/Admin021 panel + global stats.
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StatsCard from '@/Components/StatsCard';
import ProgressBar from '@/Components/ProgressBar';
import KaderAvatar from '@/Components/KaderAvatar';

const STATUS_META = {
    on_track:        { label: 'On Track',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',  dot: 'bg-emerald-500' },
    perlu_perhatian: { label: 'Perlu Perhatian', cls: 'bg-amber-50 text-amber-700 ring-amber-200',        dot: 'bg-amber-500'   },
    kritis:          { label: 'Kritis',          cls: 'bg-rose-50 text-rose-700 ring-rose-200',           dot: 'bg-rose-500'    },
};

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

function StatusBadge({ status }) {
    const m = STATUS_META[status] || STATUS_META.on_track;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${m.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    );
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
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ring-1 transition ${
                    current
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
                            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition ${
                                value === 'all' ? 'bg-blue-50' : 'hover:bg-slate-50'
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
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition ${
                                        isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
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

    const list  = batches || [];
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
                className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg text-sm font-medium ring-1 transition ${
                    current
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

const PAGE_SIZE = 10;

const FASE_LABELS = { '1': 'Foundation', '2': 'Self Learning', '3': 'Monthly Training' };
const FASE_COLORS = {
    '1': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    '2': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    '3': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
};

function KaderTable({ kaders, mentorFilter, mentors, onMentorFilter, batches, batchFilter, onBatchFilter, headerTitle, headerSubtitle, totalKaderInBatch }) {
    const list = kaders || [];
    const totalKader = list.length;
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(totalKader / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages);
    const pageItems  = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const start = totalKader === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const end   = Math.min(safePage * PAGE_SIZE, totalKader);

    // Reset ke halaman 1 saat data berubah (filter mentor)
    useEffect(() => { setPage(1); }, [kaders]);

    const pages = useMemo(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const result = new Set([1, totalPages, safePage]);
        if (safePage > 1) result.add(safePage - 1);
        if (safePage < totalPages) result.add(safePage + 1);
        return [...result].sort((a, b) => a - b);
    }, [totalPages, safePage]);

    return (
        <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] mb-6">
            {/* Header */}
            <div className="px-4 lg:px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{headerTitle}</div>
                        {headerSubtitle && (
                            <div className="text-xs font-medium text-slate-600">{headerSubtitle}</div>
                        )}
                        <div className="text-xs text-slate-500">{totalKader} kader ditampilkan</div>
                        {/* Filter — mobile: below info, desktop: hidden here */}
                        <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                            <BatchFilter batches={batches} value={batchFilter} onChange={onBatchFilter} />
                            <MentorFilter mentors={mentors} value={mentorFilter} onChange={onMentorFilter} totalKaderInBatch={totalKaderInBatch} />
                        </div>
                    </div>
                    {/* Filter — desktop only */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                            {totalKader} Kader
                        </span>
                        <BatchFilter batches={batches} value={batchFilter} onChange={onBatchFilter} />
                        <MentorFilter mentors={mentors} value={mentorFilter} onChange={onMentorFilter} totalKaderInBatch={totalKaderInBatch} />
                    </div>
                </div>
            </div>

            {/* Table */}
            {totalKader === 0 ? (
                <div className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mb-3">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-sm text-slate-600">Belum ada kader untuk filter ini.</div>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-b-2xl">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
                                    <th className="px-6 py-3 font-medium whitespace-nowrap">Nama Kader</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Mentor</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap">Fase Aktif</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap min-w-40">Progress Overall</th>
                                    <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Avg Score</th>
                                    <th className="px-6 py-3 font-medium whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageItems.map((k) => {
                                    const pct = Number(k.progress_overall || 0);
                                    const initials = (k.nama_kader || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
                                    return (
                                        <tr key={k.k_id || k.id}
                                            className="hover:bg-slate-50/60 transition cursor-pointer"
                                            onClick={() => router.visit(`/kader-saya/${k.k_id || k.kader_id}`)}>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <KaderAvatar
                                                        src={k.foto}
                                                        initials={initials}
                                                        alt={k.nama_kader}
                                                        className="w-9 h-9 rounded-full text-xs"
                                                        fallbackClass={`bg-linear-to-br ${avatarColor(k.nik_kader || k.nama_kader || '')}`}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 truncate max-w-40">{k.nama_kader}</div>
                                                        <div className="text-[11px] text-slate-500 truncate max-w-40">
                                                            {k.divisi_name || '—'}{k.dept_name ? ` · ${k.dept_name}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {k.mentors?.length > 0 ? (
                                                    <div className="space-y-2.5 max-w-56">
                                                        {k.mentors.map((m) => (
                                                            <div key={m.id} className="min-w-0">
                                                                <div className="text-sm font-medium text-slate-700 truncate">{m.nama}</div>
                                                                {m.jabatan && (
                                                                    <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset max-w-full truncate bg-blue-50 text-blue-700 ring-blue-200">
                                                                        <span className="truncate">{m.jabatan}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-sm">Belum di-assign</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {k.fase_aktif_list?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {k.fase_aktif_list.map((fase) => (
                                                            <span key={fase} className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${FASE_COLORS[fase] ?? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>
                                                                {FASE_LABELS[fase] ?? `Fase ${fase}`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${progressBarColor(pct)}`}
                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 w-10 text-right">{pct}%</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{k.total_moduls || 0} modul</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-slate-900">
                                                {k.avg_score != null ? k.avg_score : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <StatusBadge status={k.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                                Menampilkan {start}–{end} dari {totalKader} kader
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {pages.map((p, i) => {
                                    const prev = pages[i - 1];
                                    return (
                                        <React.Fragment key={p}>
                                            {prev && p - prev > 1 && (
                                                <span className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                                            )}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${
                                                    p === safePage
                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function Dashboard({
    stats,
    departemenProgress,
    mentorMonitoring,
    modulPerKategori,
    showMentorPanel,
    mentors,
    selectedMentor,
    mentorFilter = 'all',
    batches = [],
    batchFilter = 'all',
    kaders,
    buName,
    buShort,
    totalKaderInBatch,
}) {
    const s = stats || { kaderAktif: 0, batchBerjalan: 0, feedbackBelum: 0, idpBelum: 0 };

    // Navigasi dengan mempertahankan filter mentor & batch sekaligus.
    const navigateFilter = (next) => {
        const mf = next.mentor_id !== undefined ? next.mentor_id : mentorFilter;
        const bf = next.batch_id  !== undefined ? next.batch_id  : batchFilter;
        const params = {};
        if (mf && mf !== 'all') params.mentor_id = mf;
        if (bf && bf !== 'all') params.batch_id  = bf;
        router.visit('/dashboard', { data: params, preserveScroll: true });
    };
    const handleMentorFilter = (value) => navigateFilter({ mentor_id: value });
    const handleBatchFilter  = (value) => navigateFilter({ batch_id: value });

    const headerTitle = selectedMentor
        ? `Kader binaan — ${selectedMentor.nama}`
        : 'Semua Kader Aktif';
    const headerSubtitle = !selectedMentor && buName ? buName : null;

    const dep = departemenProgress?.length
        ? departemenProgress
        : [
              { label: 'Keuangan',  value: 75, color: 'green' },
              { label: 'Marketing', value: 60, color: 'blue' },
              { label: 'Produksi',  value: 45, color: 'cyan' },
              { label: 'HR',        value: 30, color: 'red' },
          ];
    const mon = mentorMonitoring?.length
        ? mentorMonitoring
        : [
              { label: 'Hendra Wijaya',  value: 3, max: 3, color: 'green' },
              { label: 'Lisa Nurhayati', value: 3, max: 4, color: 'green' },
              { label: 'Rizky Andika',   value: 1, max: 3, color: 'amber' },
              { label: 'Siti Wulandari', value: 0, max: 2, color: 'slate' },
          ];
    const kategoriDefault = [
        { kategori: 'Leadership', total: 8, color: 'blue' },
        { kategori: 'Technical',  total: 6, color: 'violet' },
        { kategori: 'Soft Skill', total: 5, color: 'amber' },
        { kategori: 'Compliance', total: 5, color: 'green' },
    ];
    const kategori = modulPerKategori?.length ? modulPerKategori : kategoriDefault;

    return (
        <AppLayout title="DASHBOARD" breadcrumb="Talent & Development · ADAPT Program">
            {/* <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] mb-6 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <div className="text-xl font-bold text-slate-900">Dashboard</div>
                    <div className="text-sm text-slate-500">Talent & Development · ADAPT Program{buShort ? ` · ${buShort}` : ''}</div>
                </div>
                <div className="flex gap-10 flex-wrap">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{s.totalKader}</div>
                        <div className="text-xs text-slate-500">Total kader</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-violet-600">{s.mentorAktif}</div>
                        <div className="text-xs text-slate-500">Mentor aktif</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600">{s.modulTersedia}</div>
                        <div className="text-xs text-slate-500">Modul tersedia</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-500">{s.dokPending}</div>
                        <div className="text-xs text-slate-500">Dok. pending</div>
                    </div>
                </div>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Jumlah Mentor" value={s.mentorCount} subtitle="Mentor terdaftar" color="blue" />
                <StatsCard title="Kader Aktif" value={s.kaderAktif} subtitle={`${s.batchBerjalan} batch berjalan`} color="green" />
                <StatsCard title="Feedback Belum Terisi" value={s.feedbackBelum} subtitle="Perlu diisi mentor" color="amber" />
                <StatsCard title="IDP Belum Lengkap" value={s.idpBelum} subtitle="Menunggu approve mentor" color="red" />
            </div>

            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-semibold text-slate-900 mb-4">Progress kader per departemen</h3>
                    <div className="space-y-4">
                        {dep.map((d, i) => (
                            <ProgressBar key={i} {...d} />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-semibold text-slate-900 mb-4">Weekly monitoring mentor</h3>
                    <div className="space-y-4">
                        {mon.map((m, i) => (
                            <ProgressBar
                                key={i}
                                label={m.label}
                                value={m.value}
                                max={m.max}
                                color={m.color}
                                showPercent={false}
                                suffix={`${m.value}/${m.max}`}
                            />
                        ))}
                    </div>
                </div>
            </div> */}

            <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-semibold text-slate-900 mb-4">Jumlah Modul per Kategori</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kategori.map((m, i) => (
                        <div
                            key={i}
                            className="border border-slate-200 rounded-xl p-4 hover:shadow-[var(--shadow-card-hover)] transition"
                        >
                            <div className="text-xs uppercase tracking-wider text-slate-500">{m.kategori}</div>
                            <div className="text-2xl font-bold mt-1 text-slate-900">{m.total}</div>
                            <div className="text-xs text-slate-500">modul</div>
                        </div>
                    ))}
                </div>
            </div>

            {showMentorPanel && (
                <section className="mt-6">
                    <KaderTable
                        kaders={kaders || []}
                        mentorFilter={mentorFilter}
                        mentors={mentors || []}
                        onMentorFilter={handleMentorFilter}
                        batches={batches || []}
                        batchFilter={batchFilter}
                        onBatchFilter={handleBatchFilter}
                        headerTitle={headerTitle}
                        headerSubtitle={headerSubtitle}
                        totalKaderInBatch={totalKaderInBatch}
                    />
                </section>
            )}
        </AppLayout>
    );
}
