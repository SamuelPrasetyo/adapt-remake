import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function TemplateCard({ title, description, template, uploadRoute, formKey }) {
    const { data, setData, post, processing, errors, reset } = useForm({ file: null });

    const submit = (e) => {
        e.preventDefault();
        post(uploadRoute, { forceFormData: true, onSuccess: () => reset() });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                </div>
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
    );
}

export default function TemplateAdmin({ templatePerjanjianKerja, templateWeeklyFeedback }) {
    return (
        <AppLayout title="TEMPLATE DOKUMEN" breadcrumb="Dokumen / Template Dokumen">
            <div className="space-y-6">
                <TemplateCard
                    title="Template Perjanjian Kerja"
                    description="Diunduh oleh Mentor sebagai acuan pengisian Perjanjian Kerja Kader"
                    template={templatePerjanjianKerja}
                    uploadRoute="/template-dokumen/perjanjian-kerja"
                />
                <TemplateCard
                    title="Template Weekly Feedback"
                    description="Diunduh oleh Kader sebagai acuan pengisian laporan mingguan"
                    template={templateWeeklyFeedback}
                    uploadRoute="/template-dokumen/weekly-feedback"
                />
            </div>
        </AppLayout>
    );
}
