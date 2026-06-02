import { useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const STATUS_CONFIG = {
    mentor_approved: { label: "Disetujui Mentor", cls: "bg-blue-100 text-blue-700" },
    approved:        { label: "Disetujui Admin MAI", cls: "bg-green-100 text-green-700" },
    rejected:        { label: "Ditolak", cls: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
    return (
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function MentorIdp({ idpPending = [], idpProcessed = [] }) {
    const [reject, setReject] = useState(null); // { id }
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const doApprove = (id) => {
        setBusy(true);
        router.post(`/approval/idp/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const openReject = (id) => { setReject({ id }); setReason(""); };

    const submitReject = () => {
        if (!reject) return;
        setBusy(true);
        router.post(`/approval/idp/${reject.id}/reject`, { rejection_reason: reason || null }, {
            preserveScroll: true,
            onSuccess: () => setReject(null),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <AppLayout title="APPROVAL FORM IDP" breadcrumb="Approval / Form IDP">
            <div className="space-y-6">
                {/* Pending — menunggu review Mentor */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                        Menunggu Review Anda
                        {idpPending.length > 0 && (
                            <span className="ml-2 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{idpPending.length}</span>
                        )}
                    </h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="text-left px-4 py-3">Kader</th>
                                    <th className="text-left px-4 py-3">Batch</th>
                                    <th className="text-left px-4 py-3">File</th>
                                    <th className="text-left px-4 py-3">Diupload</th>
                                    <th className="text-right px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {idpPending.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tidak ada Form IDP yang menunggu review Anda.</td></tr>
                                )}
                                {idpPending.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                        <td className="px-4 py-3 text-slate-500">{r.nama_batch ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            {r.path_file ? (
                                                <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{r.nama_file ?? "Unduh"}</a>
                                            ) : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button disabled={busy} onClick={() => doApprove(r.id)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                                                <button disabled={busy} onClick={() => openReject(r.id)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Processed — riwayat */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">Riwayat</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="text-left px-4 py-3">Kader</th>
                                    <th className="text-left px-4 py-3">Batch</th>
                                    <th className="text-left px-4 py-3">File</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-left px-4 py-3">Diproses</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {idpProcessed.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada riwayat.</td></tr>
                                )}
                                {idpProcessed.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                        <td className="px-4 py-3 text-slate-500">{r.nama_batch ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            {r.path_file ? (
                                                <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{r.nama_file ?? "Unduh"}</a>
                                            ) : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                        <td className="px-4 py-3 text-slate-500">{fmtDate(r.mentor_approved_at ?? r.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {reject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setReject(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Reject Form IDP</h3>
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
