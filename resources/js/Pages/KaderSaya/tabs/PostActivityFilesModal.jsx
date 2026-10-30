import { useState } from "react";
import Modal from "@/Components/Modal";
import FilePreviewModal from "@/Components/FilePreviewModal";

const STATUS = {
    pending:  { label: "Menunggu review", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "Disetujui",       cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Ditolak",         cls: "bg-red-100 text-red-600" },
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * Daftar file Post Activity yang diupload kader untuk satu modul (Admin MAI 021).
 * Props: { open, onClose, modul: { nama, pa_files: [{ nama_file, path_file, status, rejection_reason, nilai, uploaded_at }] } }
 */
export default function PostActivityFilesModal({ open, onClose, modul }) {
    const files = modul?.pa_files ?? [];
    // File yang sedang ditampilkan di penampil layar penuh.
    const [preview, setPreview] = useState(null);

    return (
        <>
        <Modal open={open} onClose={onClose} title="File Post Activity Kader" size="lg"
            footer={
                <button type="button" onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                    Tutup
                </button>
            }>
            <p className="text-sm font-semibold text-slate-700 mb-4">{modul?.nama}</p>
            <div className="space-y-2.5">
                {files.map((f, i) => {
                    const st = STATUS[f.status] ?? { label: f.status, cls: "bg-slate-100 text-slate-600" };
                    return (
                        <div key={i} className="rounded-xl border border-slate-200 p-3.5">
                            <div className="flex items-start gap-3">
                                <span className="w-9 h-9 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate" title={f.nama_file}>{f.nama_file}</p>
                                    <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-500">
                                        <span>Diupload {fmtDate(f.uploaded_at)}</span>
                                        <span className={`px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                                        {f.nilai != null && (
                                            <span className="font-semibold text-slate-700">Nilai: {Number(f.nilai).toFixed(0)}</span>
                                        )}
                                    </div>
                                    {f.status === "rejected" && f.rejection_reason && (
                                        <p className="text-xs text-red-600 mt-1">Alasan ditolak: "{f.rejection_reason}"</p>
                                    )}
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <button type="button" onClick={() => setPreview(f)}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                                        Lihat
                                    </button>
                                    <a href={encodeURI(`/${f.path_file}`)} download={f.nama_file}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
                                        Unduh
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
        <FilePreviewModal open={preview !== null} onClose={() => setPreview(null)} file={preview} />
        </>
    );
}
