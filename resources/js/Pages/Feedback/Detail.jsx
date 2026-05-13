import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';

const thCls = 'border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 text-left whitespace-nowrap';
const tdCls = 'border border-slate-200 px-3 py-2 text-xs text-slate-700';

function isFilePath(val) {
    return val && (val.includes('.pdf') || val.includes('.xlsx') || val.includes('.xls'));
}

function stripHtml(str) {
    return str ? String(str).replace(/<[^>]*>/g, '') : '';
}

function truncate(str, n = 50) {
    const s = stripHtml(str);
    return s.length > n ? s.slice(0, n) + '…' : s;
}

function FileOrText({ value }) {
    const clean = stripHtml(value ?? '');
    if (isFilePath(clean)) {
        return (
            <a href={`/assets/file/${clean}`} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline text-xs">
                {clean}
            </a>
        );
    }
    return <span>{truncate(clean)}</span>;
}

export default function FeedbackDetail({ jawabans, week, title, isUserOnly, userType }) {
    const isMentor = title?.type === 'Mentor';

    const [editOpen, setEditOpen]   = useState(false);
    const [editRow, setEditRow]     = useState(null);
    const [essay, setEssay]         = useState('');
    const [processing, setProcessing] = useState(false);

    const openEdit = (row) => {
        setEditRow(row);
        setEssay(stripHtml(row.essay_revisi ?? ''));
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.put(`/feedback/update/${editRow.id_jawaban}`, { essay_revisi: essay }, {
            onFinish: () => { setProcessing(false); setEditOpen(false); },
        });
    };

    return (
        <AppLayout
            title="FEEDBACK"
            breadcrumb={`Modul / Feedback / Detail Week ${week || '-'}`}
        >
            <div className="mb-4">
                <Link href="/feedbackadmin/index"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg transition">
                    ← Kembali
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800">
                        Detail Feedback Week {week || '-'}
                    </h2>
                    {title && isMentor && (
                        <p className="text-sm text-slate-500 mt-0.5">Mentor: {title.nama_mentor}</p>
                    )}
                </div>

                <div className="overflow-x-auto p-4">
                    {/* ===== Mode isUserOnly (Kader all) ===== */}
                    {isUserOnly ? (
                        <table className="border-collapse w-full">
                            <thead>
                                <tr>
                                    <th className={thCls} style={{ width: 40 }}>No</th>
                                    <th className={thCls}>Nama</th>
                                    {jawabans[0]?.items?.map((item, i) => (
                                        <th key={i} className={thCls}>
                                            (W{item.angka_week}) Pertanyaan {(i % 5) + 1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {jawabans.map((group, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className={`${tdCls} text-center`}>{idx + 1}</td>
                                        <td className={tdCls}>{group.nama}</td>
                                        {group.items?.map((item, i) => (
                                            <td key={i} className={tdCls}>
                                                <FileOrText value={item.jawaban} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {jawabans.length === 0 && (
                                    <tr>
                                        <td colSpan="99" className="text-center text-sm text-slate-400 py-8">
                                            Tidak ada data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                    /* ===== Mode specific user + week ===== */
                        <table className="border-collapse w-full">
                            <thead>
                                <tr>
                                    <th className={thCls} style={{ width: 40 }}>No</th>
                                    <th className={thCls}>Nama Kader</th>
                                    <th className={thCls} style={{ width: '30%' }}>Pertanyaan</th>
                                    <th className={thCls} style={{ width: '30%' }}>Jawaban</th>
                                    {isMentor && (
                                        <>
                                            <th className={thCls} style={{ width: '20%' }}>Revisi Essay</th>
                                            <th className={thCls} style={{ width: 80 }}>Aksi</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {jawabans.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className={`${tdCls} text-center`}>{idx + 1}</td>
                                        <td className={tdCls}>{stripHtml(row.nama_kader)}</td>
                                        <td className={tdCls}>{stripHtml(row.nama_pertanyaan)}</td>
                                        <td className={tdCls}>
                                            <FileOrText value={row.jawaban} />
                                        </td>
                                        {isMentor && (
                                            <>
                                                <td className={tdCls}>
                                                    {stripHtml(row.essay_revisi) || '-'}
                                                </td>
                                                <td className={`${tdCls} text-center`}>
                                                    {String(row.id_pertanyaan) === '6' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(row)}
                                                            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {jawabans.length === 0 && (
                                    <tr>
                                        <td colSpan="99" className="text-center text-sm text-slate-400 py-8">
                                            Tidak ada data.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ===== Edit Revisi Essay Modal ===== */}
            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Revisi Essay"
                size="md"
                footer={
                    <>
                        <button type="button" onClick={() => setEditOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" form="edit-essay-form" disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                            {processing ? 'Menyimpan...' : 'Update'}
                        </button>
                    </>
                }
            >
                <form id="edit-essay-form" onSubmit={submitEdit}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Revisi Essay</label>
                    <textarea
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        placeholder="Tulis revisi essay..."
                    />
                </form>
            </Modal>
        </AppLayout>
    );
}
