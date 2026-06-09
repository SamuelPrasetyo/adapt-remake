import { useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import FilterableTable from "@/Components/FilterableTable";

const BULAN_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const STATUS_CONFIG = {
    approved: { label: "Disetujui", cls: "bg-green-100 text-green-700" },
    rejected: { label: "Ditolak",   cls: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
    return (
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function weekLabel(r) {
    if (!r.angka_week) return "—";
    const month = r.bulan ? ` · ${BULAN_ID[r.bulan]}${r.tahun ? ` ${r.tahun}` : ""}` : "";
    return `W${r.angka_week}${month}`;
}

function fileLink(r) {
    return r.path_file ? (
        <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{r.nama_file ?? "Unduh"}</a>
    ) : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>;
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

const WEEK_FILTER = { key: "angka_week", label: "Week", labelFormat: (v) => `W${v}` };

export default function MentorWeekly({ pending = [], processed = [] }) {
    const [reject, setReject] = useState(null); // { id }
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const doApprove = (id) => {
        setBusy(true);
        router.post(`/approval/weekly-feedback/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const openReject = (id) => { setReject({ id }); setReason(""); };

    const submitReject = () => {
        if (!reject) return;
        setBusy(true);
        router.post(`/approval/weekly-feedback/${reject.id}/reject`, { rejection_reason: reason || null }, {
            preserveScroll: true,
            onSuccess: () => setReject(null),
            onFinish: () => setBusy(false),
        });
    };

    const kaderCol = { key: "kader_nama", label: "Kader", sortable: true, render: (v) => <span className="font-medium text-slate-700">{v ?? "—"}</span> };
    const weekCol  = { key: "angka_week", label: "Week", sortable: true, render: (_, r) => weekLabel(r) };
    const batchCol = { key: "nama_batch", label: "Batch", render: (v) => v ?? "—" };
    const fileCol  = { key: "nama_file", label: "File", render: (_, r) => fileLink(r) };

    const pendingCols = [
        kaderCol, weekCol, batchCol, fileCol,
        { key: "created_at", label: "Diupload", sortable: true, render: (v) => fmtDate(v) },
    ];

    const processedCols = [
        kaderCol, weekCol, batchCol, fileCol,
        {
            key: "status", label: "Status", render: (_, r) => (
                <div>
                    <StatusBadge status={r.status} />
                    {r.status === "rejected" && r.rejection_reason && (
                        <p className="text-[11px] text-red-600 mt-1 max-w-xs">"{r.rejection_reason}"</p>
                    )}
                </div>
            ),
        },
        { key: "updated_at", label: "Diproses", sortable: true, render: (_, r) => fmtDate(r.updated_at ?? r.created_at) },
    ];

    return (
        <AppLayout title="APPROVAL WEEKLY FEEDBACK" breadcrumb="Approval / Weekly Feedback">
            <div className="space-y-6">
                {/* Pending — menunggu review Mentor */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                        Menunggu Review Anda
                        {pending.length > 0 && (
                            <span className="ml-2 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{pending.length}</span>
                        )}
                    </h3>
                    <FilterableTable
                        columns={pendingCols}
                        data={pending}
                        emptyMessage="Tidak ada file yang menunggu review Anda."
                        filters={[{ key: "nama_batch", label: "Batch" }, WEEK_FILTER]}
                        actions={(r) => (
                            <div className="flex items-center justify-end gap-2">
                                <button disabled={busy} onClick={() => doApprove(r.id)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                                <button disabled={busy} onClick={() => openReject(r.id)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                            </div>
                        )}
                    />
                </div>

                {/* Processed — riwayat */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Riwayat</h3>
                    <FilterableTable
                        columns={processedCols}
                        data={processed}
                        emptyMessage="Belum ada riwayat."
                        filters={[
                            { key: "status", label: "Status", options: [{ value: "approved", label: "Disetujui" }, { value: "rejected", label: "Ditolak" }] },
                            { key: "nama_batch", label: "Batch" },
                            WEEK_FILTER,
                        ]}
                    />
                </div>
            </div>

            {reject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setReject(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Reject Weekly Feedback</h3>
                        <p className="text-xs text-slate-500 mt-1">Alasan penolakan opsional. Akan ditampilkan ke Kader agar dapat upload ulang.</p>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                            placeholder="Tulis alasan penolakan (opsional)..."
                            className="mt-3 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setReject(null)} disabled={busy}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Batal</button>
                            <button onClick={submitReject} disabled={busy}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">{busy ? "Memproses..." : "Reject"}</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
