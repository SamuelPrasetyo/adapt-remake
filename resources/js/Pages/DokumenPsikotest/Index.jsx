import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import DataTable from "@/Components/DataTable";
import FilterPanel from "@/Components/FilterPanel";
import Modal from "@/Components/Modal";

// Samakan dengan DokumenPsikotestController (ALLOWED & MAX_SIZE_KB) — dicek di sini dulu
// supaya file yang jelas ditolak tidak sempat diupload.
const ALLOWED_EXT = ["pdf", "jpg", "jpeg", "png"];
const MAX_BYTES   = 2 * 1024 * 1024;

const STATUS_OPTIONS = [
    { value: "sudah", label: "Sudah Upload" },
    { value: "belum", label: "Belum Upload" },
];

const fileUrl = (id, inline = false) =>
    `/dokumen-psikotest/file/${id}${inline ? "?inline=1" : ""}`;

function fmtSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function batchLabel(b) {
    return `Batch ${b.nama_batch}${b.tahun_batch ? ` (${b.tahun_batch})` : ""}`;
}

function ActionBtn({ onClick, href, color, title, disabled, children }) {
    const colors = {
        slate: "text-slate-600 hover:bg-slate-100",
        blue:  "text-blue-600 hover:bg-blue-50",
        red:   "text-red-600 hover:bg-red-50",
    };
    const cls = `p-1.5 rounded-lg transition ${colors[color]} disabled:opacity-30 disabled:cursor-not-allowed`;
    if (href) {
        return (
            <a href={href} target="_blank" rel="noreferrer" title={title} className={cls}>
                {children}
            </a>
        );
    }
    return (
        <button type="button" onClick={onClick} title={title} disabled={disabled} className={cls}>
            {children}
        </button>
    );
}

function StatCard({ label, value, tone }) {
    const tones = {
        slate:   "text-slate-800",
        emerald: "text-emerald-600",
        amber:   "text-amber-600",
    };
    return (
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] px-4 py-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`text-xl font-semibold ${tones[tone]}`}>{value}</div>
        </div>
    );
}

// Preview di dalam halaman (tanpa unduh): PDF lewat viewer bawaan browser, JPG/PNG
// sebagai gambar. File diambil dari route psikotest.file?inline=1 (dicek role), bukan
// dari path public — karena itu tidak memakai FilePreviewModal yang butuh path_file.
function PsikotestPreview({ doc, onClose }) {
    useEffect(() => {
        if (!doc) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        const prevOverflow = document.body.style.overflow;
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [doc, onClose]);

    if (!doc) return null;

    const ext = (doc.nama_file ?? "").split(".").pop().toLowerCase();
    const src = fileUrl(doc.id, true);
    const isPdf = ext === "pdf";

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-700 text-white text-[11px] font-bold uppercase">{ext}</span>
                <h3 className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0" title={doc.nama_file}>
                    {doc.nama_file}
                </h3>
                {/* PDF: unduh lewat tombol bawaan viewer browser, jadi tombol sendiri disembunyikan. */}
                {!isPdf && (
                    <a href={fileUrl(doc.id)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh
                    </a>
                )}
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto bg-slate-100">
                {isPdf ? (
                    <iframe src={src} title={doc.nama_file} className="w-full h-full border-0" />
                ) : (
                    <div className="min-h-full flex items-center justify-center p-4">
                        <img src={src} alt={doc.nama_file} className="max-w-full h-auto shadow-sm rounded bg-white" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DokumenPsikotestIndex({ kaders = [], batches = [], batchFilter = "all" }) {
    const [statusFilter, setStatusFilter] = useState("");
    // { id: kader_id, progress } selama upload berjalan. Upload dibuat satu per satu:
    // visit Inertia baru membatalkan visit yang masih berjalan.
    const [uploading, setUploading] = useState(null);
    const [rowErrors, setRowErrors] = useState({});
    const [preview, setPreview]     = useState(null);
    // Konfirmasi Ganti/Hapus: { type: 'replace' | 'delete', row } — modal, bukan window.confirm.
    const [confirm, setConfirm]     = useState(null);
    const [deleting, setDeleting]   = useState(false);

    // Satu input file tersembunyi dipakai bersama; baris tujuan disimpan di targetRef.
    const inputRef  = useRef(null);
    const targetRef = useRef(null);

    const closePreview = useCallback(() => setPreview(null), []);

    const setRowError = (id, msg) => setRowErrors((e) => ({ ...e, [id]: msg }));

    const total = kaders.length;
    const sudah = kaders.filter((k) => k.has_file).length;

    const data = useMemo(() => {
        if (statusFilter === "sudah") return kaders.filter((k) => k.has_file);
        if (statusFilter === "belum") return kaders.filter((k) => !k.has_file);
        return kaders;
    }, [kaders, statusFilter]);

    // Satu tombol "Filter" berisi Batch (server-side, ganti halaman) & Status (client-side).
    const filters = [
        {
            key: "batch",
            label: "Batch",
            searchable: true,
            options: batches.map((b) => ({ value: String(b.id_batch), label: batchLabel(b) })),
        },
        { key: "status", label: "Status Upload", options: STATUS_OPTIONS },
    ];
    const filterValues = {
        batch:  batchFilter === "all" ? "" : batchFilter,
        status: statusFilter,
    };

    // preserveState: panel filter tetap terbuka & filter Status tidak ter-reset saat ganti batch.
    const visitBatch = (value) =>
        router.get(
            "/dokumen-psikotest",
            { batch_id: value === "" ? "all" : value },
            { preserveScroll: true, preserveState: true },
        );

    const handleFilterChange = (key, value) => {
        if (key === "batch") visitBatch(value);
        else setStatusFilter(value);
    };

    const handleFilterReset = () => {
        setStatusFilter("");
        if (batchFilter !== "all") visitBatch("");
    };

    // Ganti file minta konfirmasi dulu; upload pertama langsung membuka pemilih file.
    const requestUpload = (row) => {
        if (row.has_file) setConfirm({ type: "replace", row });
        else pickFile(row);
    };

    const pickFile = (row) => {
        targetRef.current = row;
        inputRef.current.value = "";
        inputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        const row  = targetRef.current;
        if (!file || !row) return;

        const ext = file.name.split(".").pop().toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            setRowError(row.id, "Format file harus PDF, JPG, atau PNG.");
            return;
        }
        if (file.size > MAX_BYTES) {
            setRowError(row.id, "Ukuran file maksimal 2 MB.");
            return;
        }

        // preserveState: halaman, pencarian & filter tabel tidak ter-reset sehingga admin
        // bisa langsung lanjut ke baris berikutnya.
        router.post(`/dokumen-psikotest/${row.id}`, { file }, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onStart: () => {
                setRowError(row.id, null);
                setUploading({ id: row.id, progress: 0 });
            },
            onProgress: (ev) => setUploading({ id: row.id, progress: ev?.percentage ?? 0 }),
            onError: (errs) => setRowError(row.id, errs.file ?? "Upload gagal. Coba lagi."),
            onFinish: () => setUploading(null),
        });
    };

    const closeConfirm = () => !deleting && setConfirm(null);

    const handleConfirm = () => {
        const { type, row } = confirm;
        if (type === "replace") {
            setConfirm(null);
            // Masih di dalam handler klik, jadi browser mengizinkan membuka pemilih file.
            pickFile(row);
            return;
        }
        router.delete(fileUrl(row.psikotest.id), {
            preserveScroll: true,
            preserveState: true,
            onStart: () => setDeleting(true),
            onFinish: () => { setDeleting(false); setConfirm(null); },
        });
    };

    const columns = [
        { key: "_no", label: "No", width: "52px", render: (_, __, i) => i + 1 },
        {
            key: "nama",
            label: "Kader",
            sortable: true,
            render: (v, r) => (
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{v}</span>
                        {r.is_nonaktif && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                                Non Aktif
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500">{r.nik}</div>
                </div>
            ),
        },
        { key: "bu", label: "BU", sortable: true, render: (v) => v ?? "—" },
        { key: "nama_batch", label: "Batch", sortable: true, render: (v) => v ?? "—" },
        {
            key: "has_file",
            label: "File Psikotest",
            sortable: true,
            render: (_, r) => {
                const isUploading = uploading?.id === r.id;
                const err = rowErrors[r.id];
                const doc = r.psikotest;
                return (
                    <div className="min-w-[220px] max-w-sm">
                        {isUploading ? (
                            <div>
                                <div className="text-xs text-blue-600 mb-1">
                                    Mengupload... {Math.round(uploading.progress)}%
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all"
                                        style={{ width: `${uploading.progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : doc ? (
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-xs font-medium text-slate-700 truncate" title={doc.nama_file}>
                                        {doc.nama_file}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    {[fmtSize(doc.size_bytes), fmtDate(doc.created_at), doc.uploaded_by_name]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </div>
                            </div>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                Belum diupload
                            </span>
                        )}
                        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
                    </div>
                );
            },
        },
    ];

    const actions = (r) => {
        const doc = r.psikotest;
        return (
            <div className="flex items-center justify-end gap-1">
                {doc && (
                    <>
                        <ActionBtn onClick={() => setPreview(doc)} color="slate" title="Lihat">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </ActionBtn>
                        <ActionBtn href={fileUrl(doc.id)} color="slate" title="Unduh">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                        </ActionBtn>
                    </>
                )}
                <button
                    type="button"
                    onClick={() => requestUpload(r)}
                    disabled={uploading !== null}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        doc
                            ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                            : "text-white bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    {doc ? "Ganti" : "Upload"}
                </button>
                {doc && (
                    <ActionBtn onClick={() => setConfirm({ type: "delete", row: r })} color="red" title="Hapus" disabled={uploading !== null}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </ActionBtn>
                )}
            </div>
        );
    };

    return (
        <AppLayout title="DOKUMEN PSIKOTEST" breadcrumb="Upload / Dokumen Psikotest">
            <div className="space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-800">Dokumen Psikotest</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Upload hasil psikotest tiap kader langsung dari tabel. Satu file per kader
                        (PDF, JPG, atau PNG — maks 2 MB); upload ulang akan menggantikan file lama.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total Kader" value={total} tone="slate" />
                    <StatCard label="Sudah Upload" value={sudah} tone="emerald" />
                    <StatCard label="Belum Upload" value={total - sudah} tone="amber" />
                </div>

                <DataTable
                    columns={columns}
                    data={data}
                    actions={actions}
                    perPage={15}
                    emptyMessage="Tidak ada kader ditemukan."
                    headerActions={
                        <FilterPanel
                            filters={filters}
                            values={filterValues}
                            onChange={handleFilterChange}
                            onReset={handleFilterReset}
                        />
                    }
                />

                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_EXT.map((x) => `.${x}`).join(",")}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <PsikotestPreview doc={preview} onClose={closePreview} />

                <Modal
                    open={confirm !== null}
                    onClose={closeConfirm}
                    size="sm"
                    title={confirm?.type === "delete" ? "Hapus File Psikotest" : "Ganti File Psikotest"}
                    footer={
                        <>
                            <button type="button" onClick={closeConfirm} disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition">
                                Batal
                            </button>
                            <button type="button" onClick={handleConfirm} disabled={deleting}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition ${
                                    confirm?.type === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                }`}>
                                {confirm?.type === "delete" ? (deleting ? "Menghapus..." : "Hapus") : "Pilih File Baru"}
                            </button>
                        </>
                    }
                >
                    {confirm && (
                        <div className="space-y-3 text-sm text-slate-600">
                            <p>
                                {confirm.type === "delete"
                                    ? "File psikotest kader berikut akan dihapus permanen:"
                                    : "File psikotest kader berikut akan digantikan oleh file baru yang Anda pilih:"}
                            </p>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="font-medium text-slate-800">{confirm.row.nama}</div>
                                <div className="text-xs text-slate-500 break-all mt-0.5">
                                    {confirm.row.psikotest?.nama_file}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
