import { useState, useEffect } from "react";
import { router, Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const VALID_TABS = ["ojt", "pa", "idp", "history"];

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

// Satu Post Activity bisa berisi banyak file (maks 10). Tampilkan semuanya sebagai daftar unduhan.
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

export default function ApprovalIndex({ ojtPending = [], paPending = [], ojtApproved = [], paApproved = [], idpPending = [], idpApproved = [] }) {
    const [tab, setTab] = useState(() => {
        const hash = window.location.hash.replace("#", "");
        return VALID_TABS.includes(hash) ? hash : "ojt";
    });

    useEffect(() => {
        window.location.hash = tab;
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

    return (
        <AppLayout title="APPROVAL" breadcrumb="Approval">
            <div className="flex gap-2 mb-4">
                <button onClick={() => setTab("ojt")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === "ojt" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>
                    Penilaian OJT {ojtPending.length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{ojtPending.length}</span>}
                </button>
                <button onClick={() => setTab("pa")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === "pa" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>
                    Post Activity {paPending.length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{paPending.length}</span>}
                </button>
                <button onClick={() => setTab("idp")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === "idp" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>
                    Form IDP {idpPending.length > 0 && <span className="ml-1 px-1.5 rounded-full bg-amber-400 text-amber-900 text-xs">{idpPending.length}</span>}
                </button>
                <button onClick={() => setTab("history")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${tab === "history" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>
                    History Approved
                </button>
            </div>

            {tab === "ojt" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Kader</th>
                                <th className="text-left px-4 py-3">BU</th>
                                <th className="text-center px-4 py-3">FMC</th>
                                <th className="text-center px-4 py-3">Final Score</th>
                                <th className="text-left px-4 py-3">Mentor</th>
                                <th className="text-left px-4 py-3">Diperbarui</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ojtPending.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Tidak ada penilaian OJT yang menunggu approval.</td></tr>
                            )}
                            {ojtPending.map((r) => (
                                <tr key={`${r.kader_id}-${r.fmc_number}`} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.bu ?? "—"}</td>
                                    <td className="px-4 py-3 text-center">FMC-{r.fmc_number}</td>
                                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{r.final_score != null ? Number(r.final_score).toFixed(1) : "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.mentor_nama ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.updated_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/kader-saya/${r.kader_id}`}
                                                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Lihat</Link>
                                            <button disabled={busy} onClick={() => doApprove(`/approval/ojt/${r.kader_id}/${r.fmc_number}/approve`)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                                            <button disabled={busy} onClick={() => openReject("ojt", `/approval/ojt/${r.kader_id}/${r.fmc_number}/reject`)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "pa" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Uploader</th>
                                <th className="text-left px-4 py-3">Tipe</th>
                                <th className="text-left px-4 py-3">Modul</th>
                                <th className="text-left px-4 py-3">File</th>
                                <th className="text-left px-4 py-3">Diupload</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paPending.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tidak ada Post Activity yang menunggu approval.</td></tr>
                            )}
                            {paPending.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{r.uploader_nama ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-500 capitalize">{r.tipe ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.nama_modul ?? "—"}</td>
                                    <td className="px-4 py-3"><PaFiles row={r} /></td>
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button disabled={busy} onClick={() => openApprovePa(r.id)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Setujui & Nilai</button>
                                            <button disabled={busy} onClick={() => openReject("pa", `/approval/post-activity/${r.id}/reject`)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "idp" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Kader</th>
                                <th className="text-left px-4 py-3">Batch</th>
                                <th className="text-left px-4 py-3">File</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Diupload</th>
                                <th className="text-right px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {idpPending.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Tidak ada Form IDP yang menunggu approval.</td></tr>
                            )}
                            {idpPending.map((r) => {
                                const waitingMentor = r.status === "pending";
                                return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                    <td className="px-4 py-3 text-slate-500">{r.nama_batch ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        {r.path_file ? (
                                            <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{r.nama_file ?? "Unduh"}</a>
                                        ) : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {waitingMentor ? (
                                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Menunggu Mentor</span>
                                        ) : (
                                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Disetujui Mentor</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button disabled={busy || waitingMentor} title={waitingMentor ? "Belum di-approve Mentor" : ""} onClick={() => doApprove(`/approval/form-idp/${r.id}/approve`)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
                                            <button disabled={busy || waitingMentor} onClick={() => openReject("idp", `/approval/form-idp/${r.id}/reject`)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "history" && (
                <div className="space-y-5">
                    {/* OJT Approved */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Penilaian OJT — Sudah Disetujui</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="text-left px-4 py-3">Kader</th>
                                        <th className="text-left px-4 py-3">BU</th>
                                        <th className="text-center px-4 py-3">FMC</th>
                                        <th className="text-center px-4 py-3">Final Score</th>
                                        <th className="text-left px-4 py-3">Mentor</th>
                                        <th className="text-left px-4 py-3">Disetujui</th>
                                        <th className="text-right px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ojtApproved.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Belum ada penilaian OJT yang disetujui.</td></tr>
                                    )}
                                    {ojtApproved.map((r) => (
                                        <tr key={`${r.kader_id}-${r.fmc_number}`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.bu ?? "—"}</td>
                                            <td className="px-4 py-3 text-center">FMC-{r.fmc_number}</td>
                                            <td className="px-4 py-3 text-center font-semibold text-emerald-600">{r.final_score != null ? Number(r.final_score).toFixed(1) : "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.mentor_nama ?? "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{fmtDate(r.approved_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button disabled={busy} onClick={() => openReject("ojt", `/approval/ojt/${r.kader_id}/${r.fmc_number}/reject`, true)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* IDP Approved */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Form IDP — Sudah Disetujui</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="text-left px-4 py-3">Kader</th>
                                        <th className="text-left px-4 py-3">Batch</th>
                                        <th className="text-left px-4 py-3">File</th>
                                        <th className="text-left px-4 py-3">Disetujui</th>
                                        <th className="text-right px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {idpApproved.length === 0 && (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada Form IDP yang disetujui.</td></tr>
                                    )}
                                    {idpApproved.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{r.kader_nama ?? "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.nama_batch ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                {r.path_file ? (
                                                    <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{r.nama_file ?? "Unduh"}</a>
                                                ) : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{fmtDate(r.approved_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button disabled={busy} onClick={() => openReject("idp", `/approval/form-idp/${r.id}/reject`, true)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PA Approved */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Post Activity — Sudah Disetujui</h3>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="text-left px-4 py-3">Uploader</th>
                                        <th className="text-left px-4 py-3">Tipe</th>
                                        <th className="text-left px-4 py-3">Modul</th>
                                        <th className="text-left px-4 py-3">File</th>
                                        <th className="text-center px-4 py-3">Nilai</th>
                                        <th className="text-left px-4 py-3">Disetujui</th>
                                        <th className="text-right px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paApproved.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Belum ada Post Activity yang disetujui.</td></tr>
                                    )}
                                    {paApproved.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{r.uploader_nama ?? "—"}</td>
                                            <td className="px-4 py-3 text-slate-500 capitalize">{r.tipe ?? "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.nama_modul ?? "—"}</td>
                                            <td className="px-4 py-3"><PaFiles row={r} /></td>
                                            <td className="px-4 py-3 text-center font-semibold text-emerald-600">{r.nilai != null ? Number(r.nilai).toFixed(2) : "—"}</td>
                                            <td className="px-4 py-3 text-slate-500">{fmtDate(r.approved_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button disabled={busy} onClick={() => openReject("pa", `/approval/post-activity/${r.id}/reject`, true)}
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {approvePa && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setApprovePa(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-semibold text-slate-800">Setujui & Nilai Post Activity</h3>
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
