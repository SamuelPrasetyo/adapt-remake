import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/* ─── helpers ─────────────────────────────────────────────────────────── */

function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

const STATUS_CONFIG = {
    pending:         { label: 'Menunggu Mentor',  cls: 'bg-yellow-100 text-yellow-700' },
    mentor_approved: { label: 'Disetujui Mentor', cls: 'bg-blue-100 text-blue-700'    },
    approved:        { label: 'Disetujui',        cls: 'bg-green-100 text-green-700'  },
    rejected:        { label: 'Ditolak',          cls: 'bg-red-100 text-red-700'      },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

/* ─── reusable template card ───────────────────────────────────────────── */

function TemplateCard({ title, description, template, uploadRoute, deleteRoute }) {
    const { data, setData, post, processing, errors, reset } = useForm({ file: null });
    const [deleting, setDeleting] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(uploadRoute, { forceFormData: true, onSuccess: () => reset() });
    };

    const handleDelete = () => {
        if (!deleteRoute || !confirm('Hapus template ini? File akan dihapus permanen dan pengguna tidak lagi bisa mengunduhnya.')) return;
        router.delete(deleteRoute, {
            preserveScroll: true,
            onStart:  () => setDeleting(true),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                    {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
                </div>
                <span className="text-xs text-slate-400">Hanya satu template aktif</span>
            </div>

            {template && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-emerald-800">{template.nama_file}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Diupload {fmtDate(template.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={`/${template.path_file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh
                        </a>
                        {deleteRoute && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 disabled:opacity-50 transition"
                            >
                                {deleting ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {template ? 'Ganti Template' : 'Upload Template'}{' '}
                        <span className="text-slate-400 font-normal">(Excel/PDF/DOCX — maks 10MB)</span>
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.pdf,.docx"
                        onChange={(e) => setData('file', e.target.files[0])}
                        required
                        className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                </div>
                <button
                    type="submit"
                    disabled={processing || !data.file}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition"
                >
                    {processing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    )}
                    {processing ? 'Mengunggah...' : template ? 'Ganti Template' : 'Upload Template'}
                </button>
            </form>
        </div>
    );
}

/* ─── IDP uploads table with search, filter, pagination ──────────────── */

const PAGE_SIZE = 10;

function IdpUploadsTable({ uploads }) {
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatus] = useState('');
    const [page, setPage]           = useState(1);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return uploads.filter((r) => {
            const matchSearch =
                !q ||
                (r.kader_nama ?? '').toLowerCase().includes(q) ||
                (r.nama_batch ?? '').toLowerCase().includes(q) ||
                (r.nama_file  ?? '').toLowerCase().includes(q);
            const matchStatus = !statusFilter || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [uploads, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage   = Math.min(page, totalPages);
    const rows       = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
    const handleStatus = (e) => { setStatus(e.target.value); setPage(1); };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">Daftar Upload IDP Kader</h3>
            </div>

            {/* Search & Filter */}
            <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Cari nama kader, batch, atau file..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={handleStatus}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
                >
                    <option value="">Semua Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="text-left px-4 py-3">Kader</th>
                            <th className="text-left px-4 py-3">Batch</th>
                            <th className="text-left px-4 py-3">File</th>
                            <th className="text-left px-4 py-3">Status</th>
                            <th className="text-left px-4 py-3">Diupload</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    {uploads.length === 0
                                        ? 'Belum ada Kader yang mengupload file IDP.'
                                        : 'Tidak ada data yang sesuai dengan pencarian.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.nama_batch ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {r.path_file ? (
                                            <a href={`/${r.path_file}`} target="_blank" rel="noreferrer"
                                                className="text-blue-600 hover:underline text-xs">
                                                {r.nama_file ?? 'Unduh'}
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-xs">{r.nama_file ?? '—'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-slate-400">
                        Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} data
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ‹ Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === '...' ? (
                                    <span key={`el-${idx}`} className="px-2 text-xs text-slate-400">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-2.5 py-1.5 text-xs rounded-lg border transition ${
                                            p === safePage
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── main page ────────────────────────────────────────────────────────── */

const TABS = [
    { key: 'perjanjian_kerja', label: 'Perjanjian Kerja' },
    { key: 'weekly_feedback',  label: 'Weekly Feedback'  },
    { key: 'idp',              label: 'IDP'              },
];

export default function TemplateIndex({
    templatePerjanjianKerja,
    templateWeeklyFeedback,
    templateIdp,
    idpUploads = [],
}) {
    const validKeys = TABS.map((t) => t.key);
    const initialTab = validKeys.includes(new URLSearchParams(window.location.search).get('tab'))
        ? new URLSearchParams(window.location.search).get('tab')
        : 'perjanjian_kerja';
    const [activeTab, setActiveTab] = useState(initialTab);

    const switchTab = (key) => {
        setActiveTab(key);
        router.replace(`/template?tab=${key}`, { preserveScroll: true, preserveState: true });
    };

    return (
        <AppLayout title="TEMPLATE" breadcrumb="Dokumen / Template">
            <div className="space-y-5">
                {/* Tab header */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => switchTab(tab.key)}
                                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                                    activeTab === tab.key
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Perjanjian Kerja */}
                    {activeTab === 'perjanjian_kerja' && (
                        <div className="p-5">
                            <TemplateCard
                                title="Template Perjanjian Kerja"
                                description="Diunduh oleh Mentor sebagai acuan pengisian Perjanjian Kerja Kader"
                                template={templatePerjanjianKerja}
                                uploadRoute="/template-dokumen/perjanjian-kerja"
                                deleteRoute="/template-dokumen/perjanjian-kerja"
                            />
                        </div>
                    )}

                    {/* Tab: Weekly Feedback */}
                    {activeTab === 'weekly_feedback' && (
                        <div className="p-5">
                            <TemplateCard
                                title="Template Weekly Feedback"
                                description="Diunduh oleh Kader sebagai acuan pengisian laporan mingguan"
                                template={templateWeeklyFeedback}
                                uploadRoute="/template-dokumen/weekly-feedback"
                                deleteRoute="/template-dokumen/weekly-feedback"
                            />
                        </div>
                    )}

                    {/* Tab: IDP */}
                    {activeTab === 'idp' && (
                        <div className="p-5 space-y-5">
                            <TemplateCard
                                title="Template File IDP"
                                template={templateIdp}
                                uploadRoute="/form-idp/admin/upload-template"
                                deleteRoute="/template-dokumen/idp"
                            />
                        </div>
                    )}
                </div>

                {/* Upload table — only visible on IDP tab */}
                {activeTab === 'idp' && (
                    <IdpUploadsTable uploads={idpUploads} />
                )}
            </div>
        </AppLayout>
    );
}
