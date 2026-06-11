import { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import Toast from "@/Components/Toast";

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function FileIcon() {
    return (
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
    );
}

function UploadZone({ hasDoc, uploading, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={uploading}
            className={`w-full rounded-xl border-2 border-dashed px-6 py-7 text-center transition
                ${hasDoc
                    ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }
                disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            {uploading ? (
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Mengupload...
                </div>
            ) : hasDoc ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Dokumen sudah ada — klik untuk mengganti
                </div>
            ) : (
                <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Klik untuk upload dokumen
                    </div>
                    <p className="text-xs text-slate-400">PDF, DOC, atau DOCX · Maks. 5 MB</p>
                </div>
            )}
        </button>
    );
}

export default function PerjanjianKerjaTab({ kader, perjanjianKerja, canUpload, kaderId, templatePerjanjianKerja = null }) {
    const [uploading, setUploading] = useState(false);
    const [toast, setToast]         = useState({ open: false, type: "success", message: "" });
    const fileRef = useRef(null);

    const showToast = (message, type = "success") => setToast({ open: true, type, message });
    const closeToast = () => setToast(t => ({ ...t, open: false }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        router.post(`/kader-saya/${kaderId}/perjanjian-kerja`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => showToast("Dokumen berhasil diupload."),
            onError:   () => showToast("Gagal mengupload dokumen.", "error"),
            onFinish:  () => { setUploading(false); if (fileRef.current) fileRef.current.value = ""; },
        });
    };

    const handleDelete = () => {
        if (!perjanjianKerja || !confirm("Hapus dokumen perjanjian kerja ini?")) return;
        router.delete(`/perjanjian-kerja/${perjanjianKerja.id}`, {
            preserveScroll: true,
            onSuccess: () => showToast("Dokumen berhasil dihapus."),
            onError:   () => showToast("Gagal menghapus dokumen.", "error"),
        });
    };

    return (
        <>
        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={closeToast} />
        <div className="space-y-4">
            {/* Template download */}
            {templatePerjanjianKerja && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div>
                        <p className="text-sm font-semibold text-emerald-800">Template Perjanjian Kerja</p>
                        <p className="text-xs text-emerald-600 mt-0.5">{templatePerjanjianKerja.nama_file}</p>
                    </div>
                    <a
                        href={`/${templatePerjanjianKerja.path_file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh Template
                    </a>
                </div>
            )}

            {/* Section header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Perjanjian Kerja</h2>
                <div className="relative group">
                    <button className="flex items-center gap-1.5 text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Info Akses
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-4 z-10
                        opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Siapa yang bisa akses?</p>
                        <ul className="text-xs text-slate-500 space-y-1">
                            <li>· Mentor BU yang bersangkutan — upload &amp; unduh</li>
                            <li>· Admin (Holding) — upload, unduh &amp; kelola semua BU</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Current document card */}
            {perjanjianKerja ? (
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                    <FileIcon />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{perjanjianKerja.nama_file}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Diupload {perjanjianKerja.uploaded_by_name} · {formatDate(perjanjianKerja.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={`/perjanjian-kerja/${perjanjianKerja.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh
                        </a>
                        {canUpload && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-400">Belum ada dokumen</p>
                        <p className="text-xs text-slate-300 mt-0.5">Upload perjanjian kerja yang sudah ditandatangani</p>
                    </div>
                </div>
            )}

            {/* Upload zone — only visible to authorized roles */}
            {canUpload && (
                <>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <UploadZone
                        hasDoc={!!perjanjianKerja}
                        uploading={uploading}
                        onClick={() => fileRef.current?.click()}
                    />
                </>
            )}

            {/* Akses Holding info box */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-800">Akses Holding</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Dokumen yang diupload dapat dilihat dan diunduh Admin Holding untuk keperluan
                        administrasi. Pastikan sudah ditandatangani sebelum upload.
                    </p>
                </div>
            </div>
        </div>
        </>
    );
}
