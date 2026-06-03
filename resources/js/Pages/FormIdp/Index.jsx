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

export default function FormIdpIndex({ idp, hasBatch, hasTemplate, template }) {
    const { data, setData, post, processing, errors, reset } = useForm({ file: null });

    const canUpload = hasBatch && hasTemplate && (!idp || idp.can_reupload);

    const submit = (e) => {
        e.preventDefault();
        post('/form-idp/upload', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout title="UPLOAD FILE IDP" breadcrumb="Dokumen / Upload File IDP">
            <div className="max-w-2xl mx-auto space-y-6">

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

                {/* Info Card */}
                {idp ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-slate-700">File IDP Terakhir</h2>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-slate-500">Nama File</span>
                            <span className="font-medium text-slate-800 break-all">{idp.nama_file}</span>
                            <span className="text-slate-500">Status</span>
                            <div className="space-y-1">
                                <StatusBadge status={idp.status} />
                                {idp.status === 'rejected' && idp.rejected_by_role && (
                                    <p className="text-xs text-red-600 font-medium">
                                        {REJECTED_BY_LABEL[idp.rejected_by_role] ?? 'Ditolak'}
                                    </p>
                                )}
                            </div>
                            <span className="text-slate-500">Diunggah</span>
                            <span className="text-slate-600">
                                {new Date(idp.created_at).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'long', year: 'numeric',
                                })}
                            </span>
                        </div>

                        {idp.status === 'rejected' && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs font-semibold text-red-700 mb-0.5">
                                    {REJECTED_BY_LABEL[idp.rejected_by_role] ?? 'Ditolak'}
                                </p>
                                {idp.rejection_reason ? (
                                    <p className="text-sm text-red-600">{idp.rejection_reason}</p>
                                ) : (
                                    <p className="text-sm text-red-400 italic">Tidak ada alasan penolakan.</p>
                                )}
                            </div>
                        )}

                        <a
                            href={`/${idp.path_file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh File
                        </a>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-500">
                        Belum ada file IDP yang diunggah.
                    </div>
                )}

                {/* Upload Form */}
                {!hasBatch ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        Batch Kader belum ditentukan. Hubungi Admin untuk mengatur batch Anda sebelum dapat mengunggah file IDP.
                    </div>
                ) : !hasTemplate ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        Template IDP belum tersedia. Hubungi Admin MAI untuk mengupload template terlebih dahulu.
                    </div>
                ) : idp && !idp.can_reupload ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
                        {idp.status === 'approved'
                            ? 'File IDP sudah disetujui Admin MAI dan tidak dapat diubah.'
                            : idp.status === 'mentor_approved'
                            ? 'File IDP sudah disetujui Mentor dan sedang menunggu review Admin MAI.'
                            : 'File IDP masih menunggu review Mentor.'}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-700 mb-4">
                            {idp?.can_reupload ? 'Upload Ulang File IDP' : 'Upload File IDP'}
                        </h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    File <span className="text-slate-400 font-normal">(PDF, DOCX, XLSX — maks 2MB)</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.xlsx"
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
            </div>
        </AppLayout>
    );
}
