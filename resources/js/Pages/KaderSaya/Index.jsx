import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const STATUS_META = {
    on_track:        { label: 'On Track',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    perlu_perhatian: { label: 'Perlu Perhatian', cls: 'bg-amber-50 text-amber-700 ring-amber-200',       dot: 'bg-amber-500'  },
    kritis:          { label: 'Kritis',          cls: 'bg-rose-50 text-rose-700 ring-rose-200',          dot: 'bg-rose-500'   },
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

function progressColor(pct) {
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
}

const FASE_LABELS = {
    '1': 'Foundation',
    '2': 'Self Learning',
    '3': 'Monthly Training',
    '4': 'Administration',
};

function FaseScoreBadge({ fase, score }) {
    const num = String(fase).replace(/^Fase\s+/i, '');
    const label = FASE_LABELS[num] || `Fase ${num}`;
    const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
            {label}: {score}
        </span>
    );
}

function MentorDropdown({ mentors, value, onChange, totalKaderInBatch }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const filtered = useMemo(() => {
        const list = mentors || [];
        if (!q.trim()) return list;
        const s = q.toLowerCase();
        return list.filter(m => m.nama?.toLowerCase().includes(s));
    }, [mentors, q]);

    const current = value === 'all' ? null : (mentors || []).find(m => m.id === value);
    const totalKader = totalKaderInBatch ?? (mentors || []).reduce((acc, m) => acc + (m.kader_count || 0), 0);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ring-1 transition ${
                    current ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                }`}
            >
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate max-w-[200px]">
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
                            autoFocus
                            type="text"
                            placeholder="Cari mentor..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        <button
                            type="button"
                            onClick={() => { onChange('all'); setOpen(false); setQ(''); }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition ${value === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                            <span className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center text-white text-xs shrink-0">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </span>
                            <div>
                                <div className="font-medium">Semua Kader</div>
                                <div className="text-xs text-slate-500">{totalKader} kader · semua mentor</div>
                            </div>
                        </button>
                        {filtered.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => { onChange(m.id); setOpen(false); setQ(''); }}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition ${value === m.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                                <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColor(m.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                    {m.nama?.charAt(0)?.toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{m.nama}</div>
                                    <div className="text-xs text-slate-500">{m.kader_count || 0} kader</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BatchDropdown({ batches, value, onChange }) {
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ring-1 transition ${
                    current ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
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
                    <div className="max-h-64 overflow-y-auto py-1">
                        {list.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-slate-500">Belum ada batch.</div>
                        ) : list.map((b) => {
                            const sel = String(value) === String(b.id_batch);
                            return (
                                <button
                                    key={b.id_batch}
                                    type="button"
                                    onClick={() => { onChange(String(b.id_batch)); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition ${sel ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <span className="flex-1 min-w-0 font-medium truncate">{batchLabel(b)}</span>
                                    {isActiveBatch(b) && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">Aktif</span>
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

function KaderCard({ kader }) {
    const initials = (kader.nama_kader || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
    const pct      = Number(kader.progress_overall || 0);
    const meta     = STATUS_META[kader.status] || STATUS_META.on_track;
    const faseEntries = Object.entries(kader.fase_scores || {}).sort(([a], [b]) => String(a).localeCompare(String(b)));

    return (
        <Link
            href={`/kader-saya/${kader.k_id}`}
            className="flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-300 transition-all group"
        >
            <div className="p-5 flex-1">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor(kader.nik_kader || kader.nama_kader)} flex items-center justify-center text-base font-bold text-white shrink-0`}>
                        {initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition wrap-break-word">{kader.nama_kader}</div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                            {kader.divisi_name || '—'}
                            {kader.batch_name ? ` · Batch ${kader.batch_name}${kader.batch_year ? ' ' + kader.batch_year : ''}` : ''}
                        </div>
                    </div>
                </div>

                {/* Fase score badges */}
                {faseEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {faseEntries.map(([fase, score]) => (
                            <FaseScoreBadge key={fase} fase={fase} score={score} />
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Progress Overall</span>
                        <span className="text-sm font-bold text-slate-800">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-slate-400">{kader.total_moduls || 0} modul</div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 rounded-b-2xl border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Mentor: <span className="font-medium text-slate-700">{kader.mentor_name || '—'}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 shrink-0 ${meta.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                </span>
                {/* {kader.avg_score != null && (
                    <span className="text-xs font-semibold text-slate-700">
                        Avg: {kader.avg_score}
                    </span>
                )} */}
            </div>
        </Link>
    );
}

export default function KaderSayaIndex({ kaders = [], mentors = [], selectedMentor, mentorFilter = 'all', batches = [], batchFilter = 'all', totalKaderInBatch }) {
    const [search, setSearch] = useState('');

    // Navigasi dengan mempertahankan filter mentor & batch sekaligus.
    const navigateFilter = (next) => {
        const mf = next.mentor_id !== undefined ? next.mentor_id : mentorFilter;
        const bf = next.batch_id  !== undefined ? next.batch_id  : batchFilter;
        const params = {};
        if (mf && mf !== 'all') params.mentor_id = mf;
        if (bf && bf !== 'all') params.batch_id  = bf;
        router.visit('/kader-saya', { data: params, preserveScroll: true });
    };
    const handleMentorFilter = (value) => navigateFilter({ mentor_id: value });
    const handleBatchFilter  = (value) => navigateFilter({ batch_id: value });

    const filtered = useMemo(() => {
        if (!search.trim()) return kaders;
        const q = search.toLowerCase();
        return kaders.filter(k =>
            k.nama_kader?.toLowerCase().includes(q) ||
            k.nik_kader?.toLowerCase().includes(q) ||
            k.divisi_name?.toLowerCase().includes(q)
        );
    }, [kaders, search]);

    const headerLabel = selectedMentor
        ? `Kader binaan — ${selectedMentor.nama}`
        : 'Semua Kader';

    return (
        <AppLayout title="KADER SAYA" breadcrumb="Kader Saya">
            <div className="flex flex-col gap-3 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{headerLabel}</h2>
                    <p className="text-sm text-slate-500">{filtered.length} kader ditampilkan</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="text"
                        placeholder="Cari nama / NIK / divisi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white flex-1 min-w-0"
                    />
                    {batches.length > 0 && (
                        <BatchDropdown batches={batches} value={batchFilter} onChange={handleBatchFilter} />
                    )}
                    {mentors.length > 0 && (
                        <MentorDropdown mentors={mentors} value={mentorFilter} onChange={handleMentorFilter} totalKaderInBatch={totalKaderInBatch} />
                    )}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl ring-1 ring-slate-200 py-20 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mb-3">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-500">Belum ada kader.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((k) => (
                        <KaderCard key={k.k_id} kader={k} />
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
