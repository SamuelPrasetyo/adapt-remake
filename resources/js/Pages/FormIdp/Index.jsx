import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const STATUS = {
    pending:  { label: "Menunggu review Admin MAI", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "Disetujui Admin MAI",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Ditolak Admin MAI",          cls: "bg-red-50 text-red-700 border-red-200" },
};

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function FormIdpIndex({ idp = null, hasBatch = true }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const ALLOWED = ["pdf", "docx", "xlsx"];
    const MAX_BYTES = 2 * 1024 * 1024;

    const canUpload = hasBatch && (!idp || idp.can_reupload);

    const handleChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        if (!ALLOWED.includes(ext)) {
            setError("Format tidak diizinkan. Gunakan PDF, DOCX, atau XLSX.");
            setFile(null);
            return;
        }
        if (f.size > MAX_BYTES) {
            setError("Ukuran file melebihi batas 2 MB.");
            setFile(null);
            return;
        }
        setError(null);
        setFile(f);
    };

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        router.post("/form-idp/upload", fd, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { setUploading(false); setFile(null); if (fileRef.current) fileRef.current.value = ""; },
            onError: (errs) => { setUploading(false); setError(errs.file ?? "Upload gagal. Coba lagi."); },
        });
    };

    return (
        <AppLayout title="UPLOAD FILE IDP" breadcrumb="Modul / Upload File IDP">
            <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800">Form IDP</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Unggah dokumen IDP Anda. File hanya dapat diunggah <span className="font-medium">satu kali per batch</span> dan
                        memerlukan persetujuan Admin MAI.
                    </p>

                    {!hasBatch && (
                        <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                            Batch Anda belum ditentukan. Hubungi Admin sebelum mengunggah File IDP.
                        </div>
                    )}

                    {idp && (
                        <div className="mt-5 rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">File terunggah</p>
                                    {idp.path_file ? (
                                        <a href={`/${idp.path_file}`} target="_blank" rel="noreferrer"
                                            className="text-sm text-blue-600 hover:underline break-all">{idp.nama_file}</a>
                                    ) : <span className="text-sm text-slate-600">{idp.nama_file}</span>}
                                    <p className="text-xs text-slate-400 mt-0.5">Diunggah {fmtDate(idp.created_at)}</p>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${STATUS[idp.status]?.cls ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    {STATUS[idp.status]?.label ?? idp.status}
                                </span>
                            </div>
                            {idp.status === "rejected" && (
                                <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                                    Ditolak{idp.rejection_reason ? `: "${idp.rejection_reason}"` : ""}. Silakan unggah ulang.
                                </div>
                            )}
                        </div>
                    )}

                    {canUpload ? (
                        <div className="mt-5 space-y-2">
                            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx" onChange={handleChange} />
                            <div className="flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                    Pilih File
                                </button>
                                {file && (
                                    <button type="button" onClick={handleUpload} disabled={uploading}
                                        className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
                                        {uploading ? "Mengupload..." : "Upload"}
                                    </button>
                                )}
                            </div>
                            {file && <p className="text-xs text-slate-600 truncate max-w-xs">{file.name}</p>}
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <p className="text-xs text-slate-400">Format: PDF, DOCX, XLSX · Maks. 2 MB</p>
                        </div>
                    ) : idp && hasBatch ? (
                        <p className="mt-5 text-sm text-slate-500">
                            {idp.status === "approved"
                                ? "File IDP sudah disetujui dan tidak dapat diubah."
                                : "File IDP sedang menunggu review Admin MAI."}
                        </p>
                    ) : null}
                </div>
            </div>
        </AppLayout>
    );
}
