import AppLayout from '@/Layouts/AppLayout';

function DownloadIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

export default function FmMentor({ feedbacks }) {
    return (
        <AppLayout title="FEEDBACK MAI — MENTOR" breadcrumb="Report / Feedback MAI Mentor">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800">List Feedback MAI</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 w-12">No</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">Week</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 w-28">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(feedbacks ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">
                                        Tidak ada data
                                    </td>
                                </tr>
                            ) : (feedbacks ?? []).map((fb, idx) => (
                                <tr key={`${fb.id_week}-${fb.nik_kader}`} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-center text-slate-600">{idx + 1}</td>
                                    <td className="px-4 py-3 text-center text-slate-700">Week {fb.angka_week}</td>
                                    <td className="px-4 py-3 text-center">
                                        <a
                                            href={`/feedback_mai-mentor/export/${fb.id_week}/${fb.nik_kader}`}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                        >
                                            <DownloadIcon />
                                            PDF
                                        </a>
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
