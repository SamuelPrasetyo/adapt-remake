import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const STATUS_CONFIG = {
    pending:         { label: 'Menunggu Mentor',   cls: 'bg-yellow-100 text-yellow-700' },
    mentor_approved: { label: 'Disetujui Mentor',  cls: 'bg-blue-100 text-blue-700'    },
    approved:        { label: 'Disetujui',         cls: 'bg-green-100 text-green-700'  },
    rejected:        { label: 'Ditolak',           cls: 'bg-red-100 text-red-700'      },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function FormIdpAdmin({ template, uploads = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({ file: null });

    const submit = (e) => {
        e.preventDefault();
        post('/form-idp/admin/upload-template', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout title="TEMPLATE IDP" breadcrumb="Modul / Template IDP">
            <div className="space-y-6">

                {/* Template Upload Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">Template File IDP</h2>
                        <span className="text-xs text-slate-400">Hanya satu template aktif</span>
                    </div>

                    {template && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-emerald-800">{template.nama_file}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Diupload {fmtDate(template.created_at)}</p>
                            </div>
                            <a
                                href={`/${template.path_file}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Unduh
                            </a>
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

                {/* Uploads List */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-700">Daftar Upload IDP Kader</h2>
                    </div>
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
                            {uploads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                        Belum ada Kader yang mengupload file IDP.
                                    </td>
                                </tr>
                            )}
                            {uploads.map((r) => (
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
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
