import { useState, useEffect } from "react";
import { router, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import FilterableTable from "@/Components/FilterableTable";

const VALID_TABS = ["ojt", "pa", "idp", "history"];

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

// Satu dokumen Post Activity = 1 file (per sesi). Tetap dukung bentuk daftar bila ada.
function PaFiles({ row }) {
    const files = row.files?.length
        ? row.files
        : (row.path_file ? [{ nama_file: row.nama_file, path_file: row.path_file }] : []);
    if (files.length === 0) return <span className="text-slate-400 text-xs">{row.nama_file ?? "—"}</span>;
    return (
        <div className="flex flex-col gap-0.5">
            {files.map((f, i) => (
                <a key={i} href={`/${f.path_file}`} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs truncate max-w-xs">{f.nama_file ?? "Unduh"}</a>
            ))}
        </div>
    );
}

const BU_FILTER  = { key: "bu", label: "BU" };
const PABU_FILTER = { key: "uploader_bu", label: "BU" };
const BATCH_FILTER = { key: "nama_batch", label: "Batch" };

export default function ApprovalIndex({ ojtPending = [], paPending = [], ojtApproved = [], paApproved = [], idpPending = [], idpApproved = [] }) {
    const [tab, setTab] = useState(() => {
        // Prioritaskan hash URL (bisa dibagikan), lalu localStorage (tahan refresh walau Inertia
        // menghapus hash setelah aksi approve/reject), terakhir default "ojt".
        const hash = window.location.hash.replace("#", "");
        if (VALID_TABS.includes(hash)) return hash;
        const saved = typeof window !== "undefined" ? window.localStorage.getItem("approvalTab") : null;
        return VALID_TABS.includes(saved) ? saved : "ojt";
    });

    useEffect(() => {
        window.location.hash = tab;
        window.localStorage.setItem("approvalTab", tab);
    }, [tab]);
    const [reject, setReject] = useState(null); // { type, url, isHistory }
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    // Approve Post Activity butuh input nilai (0-100) dari Admin MAI.
    const [approvePa, setApprovePa] = useState(null); // { id }
    const [paNilai, setPaNilai] = useState("");
    const [paCatatan, setPaCatatan] = useState("");

    const doApprove = (url) => {
        setBusy(true);
        router.post(url, {}, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    const openApprovePa = (id) => { setApprovePa({ id }); setPaNilai(""); setPaCatatan(""); };

    const submitApprovePa = () => {
        if (!approvePa) return;
        const n = Number(paNilai);
        if (paNilai === "" || Number.isNaN(n) || n < 0 || n > 100) return;
        setBusy(true);
        router.post(`/approval/post-activity/${approvePa.id}/approve`, { nilai: n, catatan: paCatatan || null }, {
            preserveScroll: true,
            onSuccess: () => setApprovePa(null),
            onFinish: () => setBusy(false),
        });
    };

    const openReject = (type, url, isHistory = false) => { setReject({ type, url, isHistory }); setReason(""); };

    const submitReject = () => {
        if (!reject) return;
        setBusy(true);
        router.post(reject.url, { rejection_reason: reason || null }, {
            preserveScroll: true,
            onSuccess: () => setReject(null),
            onFinish: () => setBusy(false),
        });
    };

    const TabButton = ({ id, label, count }) => (
        <button onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === id ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>
            {label} {count > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{count}</span>}
        </button>
    );

    /* ───────── Column builders ───────── */
    const ojtKader  = { key: "kader_nama", label: "Kader", sortable: true, render: (v) => <span className="font-medium text-slate-700">{v ?? "—"}</span> };
    const ojtBU     = { key: "bu", label: "BU", sortable: true, render: (v) => v ?? "—" };
    const ojtFmc    = { key: "fmc_number", label: "FMC", align: "center", render: (v) => `FMC-${v}` };
    const ojtScore  = { key: "final_score", label: "Final Score", align: "center", render: (v) => v != null ? <span className="font-semibold text-emerald-600">{Number(v).toFixed(1)}</span> : "—" };
    const ojtMentor = { key: "mentor_nama", label: "Mentor", render: (v) => v ?? "—" };

    const ojtPendingCols  = [ojtKader, ojtBU, ojtFmc, ojtScore, ojtMentor, { key: "updated_at", label: "Diperbarui", sortable: true, render: (v) => fmtDate(v) }];
    const ojtApprovedCols = [ojtKader, ojtBU, ojtFmc, ojtScore, ojtMentor, { key: "approved_at", label: "Disetujui", sortable: true, render: (v) => fmtDate(v) }];

    const paUploader = { key: "uploader_nama", label: "Uploader", sortable: true, render: (v) => <span className="font-medium text-slate-700">{v ?? "—"}</span> };
    const paBU       = { key: "uploader_bu", label: "BU", sortable: true, render: (v) => v ?? "—" };
    const paTipe     = { key: "tipe", label: "Tipe", render: (v) => <span className="capitalize">{v ?? "—"}</span> };
    const paModul    = { key: "nama_modul", label: "Modul", render: (v) => v ?? "—" };
    const paFile     = { key: "nama_file", label: "File", render: (_, r) => <PaFiles row={r} /> };
    const paSesi     = {
        key: "session_no", label: "Sesi", align: "center", render: (_, r) => (
            r.required_sessions > 1
                ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.is_scoring ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{r.session_no}/{r.required_sessions}</span>
                : <span className="text-slate-400 text-xs">—</span>
        ),
    };

    const paPendingCols  = [paUploader, paBU, paTipe, paModul, paSesi, paFile, { key: "created_at", label: "Diupload", sortable: true, render: (v) => fmtDate(v) }];
    const paApprovedCols = [paUploader, paBU, paTipe, paModul, paFile, { key: "nilai", label: "Nilai", align: "center", render: (v) => v != null ? <span className="font-semibold text-emerald-600">{Number(v).toFixed(2)}</span> : "—" }, { key: "approved_at", label: "Disetujui", sortable: true, render: (v) => fmtDate(v) }];

    const idpKader = { key: "kader_nama", label: "Kader", sortable: true, render: (v) => <span className="font-medium text-slate-700">{v ?? "—"}</span> };
    const idpBatch = { key: "nama_batch", label: "Batch", sortable: true, render: (v) => v ?? "—" };
    const idpFile  = {
        key: "nama_file", label: "File", render: (_, r) => (
            r.path_file
                ? <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{r.nama_file ?? "Unduh"}</a>
                : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>
        ),
    };
    const idpStatus = {
        key: "status", label: "Status", render: (_, r) => (
            r.status === "pending"
                ? <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Menunggu Mentor</span>
                : <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Disetujui Mentor</span>
        ),
    };

    const idpPendingCols  = [idpKader, idpBatch, idpFile, idpStatus, { key: "created_at", label: "Diupload", sortable: true, render: (v) => fmtDate(v) }];
    const idpApprovedCols = [idpKader, idpBatch, idpFile, { key: "approved_at", label: "Disetujui", sortable: true, render: (v) => fmtDate(v) }];

    return (
        <AppLayout title="APPROVAL" breadcrumb="Approval">
            <div className="flex gap-2 mb-4 flex-wrap">
                <TabButton id="ojt" label="Penilaian OJT" count={ojtPending.length} />
                <TabButton id="pa" label="Post Activity" count={paPending.length} />
                <TabButton id="idp" label="Form IDP" count={idpPending.length} />
                <TabButton id="history" label="History Approved" count={0} />
            </div>

            {tab === "ojt" && (
                <FilterableTable
                    columns={ojtPendingCols}
                    data={ojtPending}
                    emptyMessage="Tidak ada penilaian OJT yang menunggu approval."
                    filters={[BU_FILTER]}
                    actions={(r) => (
                        <div className="flex items-center justify-end gap-2">
                            <Link href={`/kader-saya/${r.kader_id}`}
                                className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap border border-slate-300 text-slate-600 hover:bg-slate-50">Lihat</Link>
                            <button disabled={busy} onClick={() => doApprove(`/approval/ojt/${r.kader_id}/${r.fmc_number}/approve`)}
                                className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                            <button disabled={busy} onClick={() => openReject("ojt", `/approval/ojt/${r.kader_id}/${r.fmc_number}/reject`)}
                                className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                        </div>
                    )}
                />
            )}

            {tab === "pa" && (
                <FilterableTable
                    columns={paPendingCols}
                    data={paPending}
                    emptyMessage="Tidak ada Post Activity yang menunggu approval."
                    filters={[PABU_FILTER]}
                    actions={(r) => (
                        <div className="flex items-center justify-end gap-2">
                            {r.is_scoring ? (
                                <button disabled={busy} onClick={() => openApprovePa(r.id)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Setujui &amp; Nilai</button>
                            ) : (
                                <button disabled={busy} onClick={() => doApprove(`/approval/post-activity/${r.id}/approve`)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                            )}
                            <button disabled={busy} onClick={() => openReject("pa", `/approval/post-activity/${r.id}/reject`)}
                                className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                        </div>
                    )}
                />
            )}

            {tab === "idp" && (
                <FilterableTable
                    columns={idpPendingCols}
                    data={idpPending}
                    emptyMessage="Tidak ada Form IDP yang menunggu approval."
                    filters={[
                        { key: "status", label: "Status", options: [{ value: "pending", label: "Menunggu Mentor" }, { value: "mentor_approved", label: "Disetujui Mentor" }] },
                        BATCH_FILTER,
                    ]}
                    actions={(r) => {
                        const waitingMentor = r.status === "pending";
                        return (
                            <div className="flex items-center justify-end gap-2">
                                <button disabled={busy || waitingMentor} title={waitingMentor ? "Belum di-approve Mentor" : ""} onClick={() => doApprove(`/approval/form-idp/${r.id}/approve`)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
                                <button disabled={busy || waitingMentor} onClick={() => openReject("idp", `/approval/form-idp/${r.id}/reject`)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                            </div>
                        );
                    }}
                />
            )}

            {tab === "history" && (
                <div className="space-y-5">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Penilaian OJT — Sudah Disetujui</h3>
                        <FilterableTable
                            columns={ojtApprovedCols}
                            data={ojtApproved}
                            emptyMessage="Belum ada penilaian OJT yang disetujui."
                            filters={[BU_FILTER]}
                            actions={(r) => (
                                <button disabled={busy} onClick={() => openReject("ojt", `/approval/ojt/${r.kader_id}/${r.fmc_number}/reject`, true)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                            )}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Form IDP — Sudah Disetujui</h3>
                        <FilterableTable
                            columns={idpApprovedCols}
                            data={idpApproved}
                            emptyMessage="Belum ada Form IDP yang disetujui."
                            filters={[BATCH_FILTER]}
                            actions={(r) => (
                                <button disabled={busy} onClick={() => openReject("idp", `/approval/form-idp/${r.id}/reject`, true)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                            )}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Post Activity — Sudah Disetujui</h3>
                        <FilterableTable
                            columns={paApprovedCols}
                            data={paApproved}
                            emptyMessage="Belum ada Post Activity yang disetujui."
                            filters={[PABU_FILTER]}
                            actions={(r) => (
                                <button disabled={busy} onClick={() => openReject("pa", `/approval/post-activity/${r.id}/reject`, true)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                            )}
                        />
                    </div>
                </div>
            )}

            {approvePa && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setApprovePa(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Setujui &amp; Nilai Post Activity</h3>
                        <p className="text-xs text-slate-500 mt-1">Masukkan nilai Post Activity (0–100). Nilai ini digabung ke Skor Akhir modul.</p>
                        <label className="block mt-3 text-xs font-medium text-slate-600">Nilai <span className="text-red-500">*</span></label>
                        <input type="number" min={0} max={100} step="0.01" value={paNilai}
                            onChange={(e) => setPaNilai(e.target.value)}
                            placeholder="0 - 100"
                            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                        <label className="block mt-3 text-xs font-medium text-slate-600">Catatan (opsional)</label>
                        <textarea value={paCatatan} onChange={(e) => setPaCatatan(e.target.value)} rows={3}
                            placeholder="Catatan penilaian (opsional)..."
                            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setApprovePa(null)} disabled={busy}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50">Batal</button>
                            <button onClick={submitApprovePa} disabled={busy || paNilai === ""}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">{busy ? "Memproses..." : "Setujui & Nilai"}</button>
                        </div>
                    </div>
                </div>
            )}

            {reject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setReject(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Reject {reject.type === "ojt" ? "Penilaian OJT" : reject.type === "idp" ? "Form IDP" : "Post Activity"}</h3>
                        {reject.isHistory && (
                            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                Item ini sudah pernah disetujui. Reject akan membatalkan persetujuan tersebut.
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Alasan penolakan opsional. Akan ditampilkan ke Mentor/Kader.</p>
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
