import { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import Toast from "@/Components/Toast";

/**
 * Tab "Dokumen" pada detail Kader Saya, dipecah jadi dua sub-tab:
 *  1. Perjanjian Kerja : wajib, satu file per kader. Upload oleh Admin MAI & Mentor.
 *  2. Dokumen Lainnya  : opsional, boleh banyak file. Upload/hapus khusus Admin MAI,
 *                        tersimpan dengan Kategori File "Lainnya" (dokumen.jenis = LAINNYA).
 */

// Perjanjian Kerja — satu file, sesuai batas lama.
const PK_MAX_SIZE_MB    = 8;
const PK_MAX_SIZE_BYTES = PK_MAX_SIZE_MB * 1024 * 1024;

// Dokumen Lainnya — banyak file sekaligus, batas per file lebih kecil.
const LAIN_MAX_SIZE_MB    = 5;
const LAIN_MAX_SIZE_BYTES = LAIN_MAX_SIZE_MB * 1024 * 1024;
const MAX_FILES           = 10;
// Batas total per submit. Tanpa ini request bisa melampaui post_max_size PHP, dan
// PHP mengosongkan $_POST sehingga admin cuma melihat error "pilih minimal satu dokumen".
const MAX_BATCH_MB    = 50;
const MAX_BATCH_BYTES = MAX_BATCH_MB * 1024 * 1024;

const PK_EXT      = ["pdf", "doc", "docx"];
const LAIN_EXT    = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png"];
const PK_ACCEPT   = PK_EXT.map((e) => `.${e}`).join(",");
const LAIN_ACCEPT = LAIN_EXT.map((e) => `.${e}`).join(",");

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSize(bytes) {
    if (bytes == null) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function extOf(name = "") {
    const parts = String(name).split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function stripExt(name = "") {
    const i = String(name).lastIndexOf(".");
    return i > 0 ? String(name).slice(0, i) : String(name);
}

// Warna ikon mengikuti jenis file supaya daftar panjang tetap mudah dipindai.
const EXT_STYLE = {
    pdf:  { cls: "bg-rose-50 text-rose-600 border-rose-200",          label: "PDF" },
    doc:  { cls: "bg-blue-50 text-blue-600 border-blue-200",          label: "DOC" },
    docx: { cls: "bg-blue-50 text-blue-600 border-blue-200",          label: "DOC" },
    xls:  { cls: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "XLS" },
    xlsx: { cls: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "XLS" },
    ppt:  { cls: "bg-orange-50 text-orange-600 border-orange-200",    label: "PPT" },
    pptx: { cls: "bg-orange-50 text-orange-600 border-orange-200",    label: "PPT" },
    jpg:  { cls: "bg-violet-50 text-violet-600 border-violet-200",    label: "IMG" },
    jpeg: { cls: "bg-violet-50 text-violet-600 border-violet-200",    label: "IMG" },
    png:  { cls: "bg-violet-50 text-violet-600 border-violet-200",    label: "IMG" },
};

function FileBadge({ name }) {
    const meta = EXT_STYLE[extOf(name)];

    if (!meta) {
        return (
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        );
    }

    return (
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 text-[10px] font-bold tracking-wide ${meta.cls}`}>
            {meta.label}
        </div>
    );
}

function Spinner({ className = "w-4 h-4" }) {
    return (
        <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

function CloudUploadIcon() {
    return (
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.5-1.51A4.5 4.5 0 0117 16h-1m-4-5v8m0-8l-2.5 2.5M12 11l2.5 2.5" />
            </svg>
        </div>
    );
}

/** Tombol "mata" — lihat dokumen di tab baru tanpa mengunduh. */
function ViewAction({ href, title = "Lihat dokumen" }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            title={title}
            className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        </a>
    );
}

function DownloadAction({ href, title = "Unduh dokumen" }) {
    return (
        <a
            href={href}
            title={title}
            className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
        </a>
    );
}

function DeleteAction({ onClick, title = "Hapus dokumen" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    );
}

/** Baris satu dokumen di daftar "File Terlampir". */
function AttachedFileRow({ nama_file, meta, actions }) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            <FileBadge name={nama_file} />
            <div className="flex-1 min-w-44">
                <p className="text-sm font-medium text-slate-800 break-all">{nama_file}</p>
                <p className="text-xs text-slate-400 mt-0.5">{meta}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">{actions}</div>
        </div>
    );
}

function AttachedHeading({ count }) {
    return (
        <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">File Terlampir</p>
            {count > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {count}
                </span>
            )}
        </div>
    );
}

function EmptyAttached({ text }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3.5 py-6 text-center">
            <p className="text-sm text-slate-400">{text}</p>
        </div>
    );
}

/**
 * Area drop bersama untuk kedua sub-tab.
 * Tampil sebagai zona besar dengan ikon cloud + tombol "Pilih File", sesuai
 * pola upload di referensi desain.
 */
function DropZone({
    inputRef,
    accept,
    multiple = false,
    disabled = false,
    uploading = false,
    hint,
    onFiles,
}) {
    const [dragging, setDragging] = useState(false);

    const open = () => { if (!disabled) inputRef.current?.click(); };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={(e) => {
                    onFiles(e.target.files);
                    if (inputRef.current) inputRef.current.value = "";
                }}
            />
            <div
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!disabled) onFiles(e.dataTransfer?.files);
                }}
                className={`rounded-xl border-2 border-dashed px-6 py-9 text-center transition
                    ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50/60"}
                    ${disabled ? "opacity-60" : ""}`}
            >
                {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                        <Spinner />
                        Mengupload...
                    </div>
                ) : (
                    <>
                        <CloudUploadIcon />
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                            {dragging ? "Lepaskan file di sini" : "Pilih File atau seret ke sini"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{hint}</p>
                        <button
                            type="button"
                            onClick={open}
                            disabled={disabled}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Pilih File
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

/** Kepala kartu: judul + subtitle di kiri, aksi opsional di kanan. */
function CardHead({ title, subtitle, right }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {right}
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Sub-tab 1 — Perjanjian Kerja
 * ------------------------------------------------------------------ */

function PerjanjianPanel({ doc, canUpload, kaderId, template, showToast }) {
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const handleFiles = (fileList) => {
        const file = (fileList || [])[0];
        if (!file) return;

        if (!PK_EXT.includes(extOf(file.name))) {
            showToast("Format dokumen harus PDF, DOC, atau DOCX.", "error");
            return;
        }
        if (file.size > PK_MAX_SIZE_BYTES) {
            showToast(
                `Ukuran dokumen maksimal ${PK_MAX_SIZE_MB} MB. File "${file.name}" berukuran ${formatSize(file.size)}.`,
                "error"
            );
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        router.post(`/kader-saya/${kaderId}/perjanjian-kerja`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => showToast("Perjanjian Kerja berhasil diupload."),
            onError:   (errors) => showToast(errors?.file || "Gagal mengupload dokumen.", "error"),
            onFinish:  () => setUploading(false),
        });
    };

    const handleDelete = () => {
        if (!doc || !confirm("Hapus dokumen perjanjian kerja ini?")) return;
        router.delete(`/perjanjian-kerja/${doc.id}`, {
            preserveScroll: true,
            onSuccess: () => showToast("Perjanjian Kerja berhasil dihapus."),
            onError:   () => showToast("Gagal menghapus dokumen.", "error"),
        });
    };

    const size = formatSize(doc?.size_bytes);

    return (
        <div className="space-y-5">
            <CardHead
                title="Upload Perjanjian Kerja"
                subtitle="Pastikan dokumen sudah ditandatangani."
                right={template && (
                    <a
                        href={`/${template.path_file}`}
                        target="_blank"
                        rel="noreferrer"
                        title={template.nama_file}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh Template
                    </a>
                )}
            />

            {/* Template belum ada — hanya relevan bagi yang bisa upload */}
            {!template && canUpload && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.75-2.98l-6.93-12a2 2 0 00-3.5 0l-6.93 12A2 2 0 005.07 19z" />
                    </svg>
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Template Perjanjian Kerja belum tersedia</p>
                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                            Admin MAI belum mengunggah template Perjanjian Kerja. Anda tetap bisa mengupload
                            dokumen, namun disarankan menunggu template resmi sebagai acuan pengisian.
                        </p>
                    </div>
                </div>
            )}

            {canUpload && (
                <DropZone
                    inputRef={fileRef}
                    accept={PK_ACCEPT}
                    disabled={uploading}
                    uploading={uploading}
                    onFiles={handleFiles}
                    hint={
                        <>
                            File maksimal {PK_MAX_SIZE_MB}MB. Format yang didukung: PDF, DOC, DOCX.
                            {doc && " Mengupload file baru akan menggantikan dokumen yang sudah ada."}
                        </>
                    }
                />
            )}

            <div className="space-y-2">
                <AttachedHeading count={doc ? 1 : 0} />
                {doc ? (
                    <AttachedFileRow
                        nama_file={doc.nama_file}
                        meta={`Diunggah ${doc.uploaded_by_name} pada ${formatDate(doc.created_at)}${size ? ` · ${size}` : ""}`}
                        actions={
                            <>
                                <ViewAction href={`/perjanjian-kerja/${doc.id}/download?inline=1`} />
                                <DownloadAction href={`/perjanjian-kerja/${doc.id}/download`} />
                                {canUpload && <DeleteAction onClick={handleDelete} />}
                            </>
                        }
                    />
                ) : (
                    <EmptyAttached
                        text={canUpload
                            ? "Belum ada Perjanjian Kerja — upload dokumen yang sudah ditandatangani."
                            : "Belum ada Perjanjian Kerja untuk kader ini."}
                    />
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Sub-tab 2 — Dokumen Lainnya
 * ------------------------------------------------------------------ */

let stagedSeq = 0;

function DokumenLainnyaPanel({ docs, canManage, kaderId, showToast }) {
    const [staged, setStaged]       = useState([]);   // { key, file, label }
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const addFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;

        const accepted = [];
        const rejected = [];
        let slots = MAX_FILES - staged.length;
        let total = staged.reduce((sum, s) => sum + s.file.size, 0);

        for (const file of incoming) {
            if (slots <= 0) {
                rejected.push(`${file.name} (antrean penuh, maks. ${MAX_FILES} file)`);
                continue;
            }
            if (!LAIN_EXT.includes(extOf(file.name))) {
                rejected.push(`${file.name} (format tidak didukung)`);
                continue;
            }
            if (file.size > LAIN_MAX_SIZE_BYTES) {
                rejected.push(`${file.name} (${formatSize(file.size)}, maks. ${LAIN_MAX_SIZE_MB} MB)`);
                continue;
            }
            if (total + file.size > MAX_BATCH_BYTES) {
                rejected.push(`${file.name} (total antrean melebihi ${MAX_BATCH_MB} MB — upload bertahap)`);
                continue;
            }
            accepted.push({ key: `f${++stagedSeq}`, file, label: stripExt(file.name) });
            total += file.size;
            slots--;
        }

        if (accepted.length) setStaged((prev) => [...prev, ...accepted]);
        if (rejected.length) showToast(`Tidak bisa diupload — ${rejected.join("; ")}`, "error");
    };

    const setLabel = (key, label) =>
        setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, label } : s)));

    const removeStaged = (key) =>
        setStaged((prev) => prev.filter((s) => s.key !== key));

    const handleUpload = () => {
        if (!staged.length || uploading) return;

        const formData = new FormData();
        staged.forEach((s, i) => {
            formData.append(`files[${i}]`, s.file);
            formData.append(`nama[${i}]`, s.label.trim());
        });

        const count = staged.length;
        setUploading(true);
        router.post(`/kader-saya/${kaderId}/dokumen-lainnya`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setStaged([]);
                showToast(`${count} dokumen berhasil diupload.`);
            },
            onError: (errors) => {
                const first = Object.values(errors || {})[0];
                showToast(first || "Gagal mengupload dokumen.", "error");
            },
            onFinish: () => setUploading(false),
        });
    };

    const handleDelete = (doc) => {
        if (!confirm(`Hapus dokumen "${doc.nama_file}"?`)) return;
        router.delete(`/dokumen-lainnya/${doc.id}`, {
            preserveScroll: true,
            onSuccess: () => showToast("Dokumen berhasil dihapus."),
            onError:   () => showToast("Gagal menghapus dokumen.", "error"),
        });
    };

    const stagedTotal = staged.reduce((sum, s) => sum + s.file.size, 0);

    return (
        <div className="space-y-5">
            <CardHead
                title="Upload Dokumen Lainnya"
                subtitle={canManage
                    ? "Dokumen pendukung selain Perjanjian Kerja — tersimpan dengan Kategori File “Lainnya”."
                    : "Dokumen pendukung yang diunggah Admin MAI. Anda dapat melihat & mengunduhnya."}
            />

            {canManage && (
                <DropZone
                    inputRef={fileRef}
                    accept={LAIN_ACCEPT}
                    multiple
                    disabled={uploading}
                    uploading={uploading}
                    onFiles={addFiles}
                    hint={`File maksimal ${LAIN_MAX_SIZE_MB}MB per file. Format yang didukung: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG. Bisa pilih beberapa file sekaligus (maks. ${MAX_FILES} file & ${MAX_BATCH_MB} MB per upload).`}
                />
            )}

            {/* Antrean sebelum disimpan — nama tiap dokumen masih bisa diubah */}
            {canManage && staged.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                            Siap diupload · {staged.length} file · {formatSize(stagedTotal)}
                        </p>
                        <p className="text-xs text-blue-600">Nama dokumen bisa diubah sebelum disimpan</p>
                    </div>

                    <ul className="space-y-2">
                        {staged.map((s) => (
                            <li key={s.key} className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap items-center gap-3">
                                <FileBadge name={s.file.name} />
                                <div className="flex-1 min-w-56">
                                    <input
                                        type="text"
                                        value={s.label}
                                        maxLength={150}
                                        disabled={uploading}
                                        onChange={(e) => setLabel(s.key, e.target.value)}
                                        placeholder="Nama dokumen"
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-slate-50"
                                    />
                                    <p className="text-xs text-slate-400 mt-1 break-all">
                                        {s.file.name} · {formatSize(s.file.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeStaged(s.key)}
                                    disabled={uploading}
                                    title="Keluarkan dari antrean"
                                    className="p-2 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Spinner /> : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            )}
                            {uploading ? "Mengupload..." : `Upload ${staged.length} Dokumen`}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStaged([])}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <AttachedHeading count={docs.length} />
                {docs.length > 0 ? (
                    <ul className="space-y-2">
                        {docs.map((doc) => {
                            const size = formatSize(doc.size_bytes);
                            return (
                                <li key={doc.id}>
                                    <AttachedFileRow
                                        nama_file={doc.nama_file}
                                        meta={`Diunggah ${doc.uploaded_by_name} pada ${formatDate(doc.created_at)}${size ? ` · ${size}` : ""}`}
                                        actions={
                                            <>
                                                <ViewAction href={`/dokumen-lainnya/${doc.id}/download?inline=1`} />
                                                <DownloadAction href={`/dokumen-lainnya/${doc.id}/download`} />
                                                {canManage && <DeleteAction onClick={() => handleDelete(doc)} />}
                                            </>
                                        }
                                    />
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <EmptyAttached
                        text={canManage
                            ? "Belum ada dokumen lainnya — tambahkan SK, NDA, sertifikat, atau berkas administrasi lain."
                            : "Admin MAI belum mengunggah dokumen pendukung untuk kader ini."}
                    />
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */

export default function DokumenTab({
    perjanjianKerja,
    canUpload,
    kaderId,
    templatePerjanjianKerja = null,
    dokumenLainnya = [],
    canManageDokumenLainnya = false,
}) {
    const [sub, setSub]     = useState("perjanjian");
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const showToast  = (message, type = "success") => setToast({ open: true, type, message });
    const closeToast = () => setToast((t) => ({ ...t, open: false }));

    const SUB_TABS = [
        { id: "perjanjian", label: "Perjanjian Kerja", count: perjanjianKerja ? 1 : 0 },
        { id: "lainnya",    label: "Dokumen Lainnya",  count: dokumenLainnya.length },
    ];

    return (
        <>
            <Toast open={toast.open} type={toast.type} message={toast.message} onClose={closeToast} />

            <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Judul area */}
                    <div className="px-5 pt-5">
                        <h2 className="text-lg font-bold text-slate-800">Upload Dokumen</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Kelola dokumen perjanjian kerja dan dokumen penting lainnya untuk kader ini.
                        </p>
                    </div>

                    {/* Sub-tab */}
                    <div className="mt-4 px-5 border-b border-slate-200 flex gap-1 overflow-x-auto">
                        {SUB_TABS.map((t) => {
                            const active = sub === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSub(t.id)}
                                    className={`relative flex items-center gap-2 px-3.5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition
                                        ${active
                                            ? "border-blue-600 text-blue-700"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                        }`}
                                >
                                    {t.label}
                                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
                                        ${active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                        {t.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Isi sub-tab */}
                    <div className="p-5">
                        {sub === "perjanjian" ? (
                            <PerjanjianPanel
                                doc={perjanjianKerja}
                                canUpload={canUpload}
                                kaderId={kaderId}
                                template={templatePerjanjianKerja}
                                showToast={showToast}
                            />
                        ) : (
                            <DokumenLainnyaPanel
                                docs={dokumenLainnya}
                                canManage={canManageDokumenLainnya}
                                kaderId={kaderId}
                                showToast={showToast}
                            />
                        )}
                    </div>
                </div>

                {/* Catatan akses — berlaku untuk kedua sub-tab */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Akses dokumen</p>
                        <ul className="text-xs text-amber-700 mt-1 space-y-0.5 leading-relaxed">
                            <li>· <span className="font-semibold">Perjanjian Kerja</span> — Mentor BU yang bersangkutan &amp; Admin Holding: upload, lihat &amp; unduh.</li>
                            <li>· <span className="font-semibold">Dokumen Lainnya</span> — upload &amp; hapus hanya Admin MAI; Mentor hanya lihat &amp; unduh.</li>
                            <li>· Kader tidak melihat tab ini. Pastikan dokumen sudah ditandatangani sebelum upload.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
