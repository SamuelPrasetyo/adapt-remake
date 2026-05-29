import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

function DownloadIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

export default function FmKader({ kaders, feedbacks }) {
    const [openKader, setOpenKader] = useState(null);

    const feedbacksByNik = (nik) =>
        (feedbacks ?? []).filter((f) => f.nik_kader === nik);

    return (
        <AppLayout title="FEEDBACK MAI — KADER" breadcrumb="Report / Feedback MAI Kader">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800">List Feedback MAI</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 w-12">No</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">NIK</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">Kader</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 w-24">File</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(kaders ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                                        Tidak ada data
                                    </td>
                                </tr>
                            ) : (kaders ?? []).map((kader, idx) => (
                                <tr key={kader.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-center text-slate-600">{idx + 1}</td>
                                    <td className="px-4 py-3 text-center text-slate-700">{kader.nik}</td>
                                    <td className="px-4 py-3 text-center text-slate-700">{kader.nama}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setOpenKader(kader)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                            </svg>
                                            Files
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {openKader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">File Feedback MAI</h3>
                                <p className="text-xs text-slate-500">{openKader.nama}</p>
                            </div>
                            <button
                                onClick={() => setOpenKader(null)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">
                            {feedbacksByNik(openKader.nik).length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Belum ada file feedback</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-slate-600">Week</th>
                                            <th className="px-3 py-2 text-center text-xs font-medium text-slate-600">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {feedbacksByNik(openKader.nik).map((fb) => (
                                            <tr key={fb.id_week}>
                                                <td className="px-3 py-2 text-center text-slate-700">
                                                    Week {fb.angka_week}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <a
                                                        href={`/feedback_mai-kader/export/${fb.id_week}/${openKader.nik}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                    >
                                                        <DownloadIcon />
                                                        PDF
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
