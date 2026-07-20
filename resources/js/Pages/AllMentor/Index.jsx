import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

function StatusPill({ status }) {
    const map = {
        'On Track':        { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50',  ring: 'ring-emerald-200' },
        'Slightly Delayed': { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',    ring: 'ring-amber-200'   },
        'Belum Ada Modul': { dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-50',    ring: 'ring-slate-200'   },
    };
    const s = map[status] ?? map['Belum Ada Modul'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ring-1 ${s.bg} ${s.text} ${s.ring}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status}
        </span>
    );
}

function SummaryCard({ label, value, accent }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${accent || 'text-slate-800'}`}>{value}</p>
        </div>
    );
}

function ProgressBar({ value }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${value}%`,
                        background: 'linear-gradient(90deg, #1b6ca8, #0e9aa7)',
                    }}
                />
            </div>
            <span className="text-xs font-medium text-slate-600 shrink-0 w-9 text-right">{value}%</span>
        </div>
    );
}

export default function AllMentorIndex({ mentors = [], summary = {} }) {
    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState('all');

    const filtered = useMemo(() => {
        let list = mentors;
        if (filter !== 'all') {
            list = list.filter((m) => m.status === filter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((m) =>
                m.nama?.toLowerCase().includes(q) ||
                m.jabatan?.toLowerCase().includes(q) ||
                m.bu?.toLowerCase().includes(q) ||
                m.company_name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [mentors, search, filter]);

    const FILTERS = [
        { id: 'all',             label: 'Semua',           count: mentors.length },
        { id: 'On Track',        label: 'On Track',        count: summary.on_track },
        { id: 'Slightly Delayed', label: 'Slightly Delayed', count: summary.perlu_perhatian },
        { id: 'Belum Ada Modul', label: 'Belum Ada Modul', count: summary.belum_mulai },
    ];

    return (
        <AppLayout title="ALL MENTOR" breadcrumb="Program & Modul / All Mentor">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <SummaryCard label="Total Mentor"    value={summary.total_mentor ?? 0} />
                <SummaryCard label="On Track"        value={summary.on_track ?? 0}        accent="text-emerald-600" />
                <SummaryCard label="Slightly Delayed" value={summary.perlu_perhatian ?? 0} accent="text-amber-600"  />
                <SummaryCard label="Avg Progress"    value={`${summary.avg_progress ?? 0}%`} accent="text-blue-600" />
            </div>

            {/* Filter + Search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                filter === f.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {f.label}
                            <span className={`ml-1.5 text-[10px] ${filter === f.id ? 'text-blue-200' : 'text-slate-400'}`}>
                                ({f.count ?? 0})
                            </span>
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari mentor, jabatan, atau BU..."
                    className="w-full sm:w-72 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3 w-12">No</th>
                                <th className="px-4 py-3">Mentor</th>
                                <th className="px-4 py-3">Business Unit</th>
                                <th className="px-4 py-3 w-56">Progress</th>
                                <th className="px-4 py-3 w-20 text-center">Modul</th>
                                <th className="px-4 py-3 w-24 text-center">Avg Score</th>
                                <th className="px-4 py-3 w-36">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-4 py-10 text-center text-slate-400">
                                        Tidak ada mentor cocok.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((m, idx) => (
                                <tr
                                    key={m.id}
                                    onClick={() => router.visit(`/all-mentor/${m.id}`)}
                                    className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50 cursor-pointer transition"
                                >
                                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            {m.foto ? (
                                                <img
                                                    src={`/storage/${m.foto}`}
                                                    alt={m.nama}
                                                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                    {m.nama?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-800 truncate">{m.nama}</p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {m.jabatan || '—'}
                                                    {!m.has_account && (
                                                        <span className="ml-1.5 text-[10px] font-medium text-amber-600">
                                                            (no account)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {m.bu || m.company_code || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ProgressBar value={m.progress} />
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600">
                                        {m.completed}/{m.total}
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                        {m.avg_score > 0 ? m.avg_score : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusPill status={m.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
