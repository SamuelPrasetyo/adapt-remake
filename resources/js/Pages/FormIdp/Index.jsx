import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const STATUS_CONFIG = {
    pending:         { label: 'Menunggu Review Mentor', cls: 'bg-yellow-100 text-yellow-700' },
    mentor_approved: { label: 'Menunggu Review Admin MAI', cls: 'bg-blue-100 text-blue-700'  },
    approved:        { label: 'Disetujui',              cls: 'bg-green-100 text-green-700'  },
    rejected:        { label: 'Ditolak',                cls: 'bg-red-100 text-red-700'      },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
    return (
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

const REJECTED_BY_LABEL = {
    mentor: 'Ditolak oleh Mentor',
    admin:  'Ditolak oleh Admin MAI',
};

export default function FormIdpIndex({ riwayat = [], hasBatch, hasTemplate, template }) {
    const { data, setData, post, processing, errors, reset } = useForm({ file: null });

    const submit = (e) => {
        e.preventDefault();
        post('/form-idp/upload', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout title="UPLOAD FILE IDP" breadcrumb="Dokumen / Upload File IDP">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Download Template */}
                {template ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-blue-800">Template File IDP Tersedia</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Unduh template, isi, lalu upload kembali di bawah.
                            </p>
                        </div>
                        <a
                            href={`/${template.path_file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh Template
                        </a>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        Template belum tersedia. Hubungi Admin MAI untuk mendapatkan template IDP.
                    </div>
                )}

                {/* Upload Form — IDP boleh diupload berkali-kali tanpa limit */}
                {!hasBatch ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        Batch Kader belum ditentukan. Hubungi Admin untuk mengatur batch Anda sebelum dapat mengunggah file IDP.
                    </div>
                ) : !hasTemplate ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        Template IDP belum tersedia. Hubungi Admin MAI untuk mengupload template terlebih dahulu.
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-700 mb-1">Upload File IDP</h2>
                        <p className="text-xs text-slate-400 mb-4">
                            File IDP dapat diupload berkali-kali; setiap upload tersimpan sebagai riwayat dan akan direview Mentor lalu Admin MAI.
                        </p>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    File <span className="text-slate-400 font-normal">(PDF — maks 2MB)</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => setData('file', e.target.files[0])}
                                    required
                                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {errors.file && (
                                    <p className="mt-1 text-xs text-red-600">{errors.file}</p>
                                )}
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
                                {processing ? 'Mengunggah...' : 'Upload File'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Riwayat Upload */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-700">Riwayat Upload File IDP</h2>
                    </div>
                    {riwayat.length === 0 ? (
                        <div className="p-5 text-sm text-slate-500">Belum ada file IDP yang diunggah.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {riwayat.map((doc, i) => (
                                <li key={i} className="px-5 py-4 space-y-2">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <a
                                                href={`/${doc.path_file}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-blue-600 hover:underline break-all"
                                            >
                                                {doc.nama_file}
                                            </a>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {doc.nama_batch ? `Batch ${doc.nama_batch}${doc.tahun_batch ? ' ' + doc.tahun_batch : ''} · ` : ''}
                                                {new Date(doc.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit', month: 'long', year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <StatusBadge status={doc.status} />
                                    </div>
                                    {doc.status === 'rejected' && (
                                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-xs font-semibold text-red-700 mb-0.5">
                                                {REJECTED_BY_LABEL[doc.rejected_by_role] ?? 'Ditolak'}
                                            </p>
                                            {doc.rejection_reason ? (
                                                <p className="text-xs text-red-600">{doc.rejection_reason}</p>
                                            ) : (
                                                <p className="text-xs text-red-400 italic">Tidak ada alasan penolakan.</p>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
