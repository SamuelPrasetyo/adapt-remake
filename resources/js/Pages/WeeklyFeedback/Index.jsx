import { useMemo } from "react";
import { useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import FilterableTable from "@/Components/FilterableTable";

const BULAN_ID = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const STATUS_CONFIG = {
    pending:  { label: "Menunggu Review Mentor", cls: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Approved (Selesai)",     cls: "bg-green-100 text-green-700" },
    rejected: { label: "Ditolak — Upload Ulang", cls: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function WeeklyFeedbackIndex({ weeks = [], history = [], hasBatch = false }) {
    const { data, setData, post, processing, errors, reset } = useForm({ id_week: "", file: null });

    const weekGroups = useMemo(() => {
        const groups = {};
        weeks.forEach((w) => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, "0")}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push(w);
        });
        return Object.values(groups);
    }, [weeks]);

    const selectedWeek = weeks.find((w) => String(w.id_week) === String(data.id_week)) || null;
    const canUpload = hasBatch && selectedWeek && selectedWeek.is_available
        && (selectedWeek.status === "none" || selectedWeek.status === "rejected");

    const lockMsg = (() => {
        if (!selectedWeek) return null;
        if (!selectedWeek.is_available) return "Minggu ini belum waktunya untuk upload.";
        if (selectedWeek.status === "pending") return "File minggu ini masih menunggu review Mentor.";
        if (selectedWeek.status === "approved") return "File minggu ini sudah disetujui Mentor dan tidak dapat diubah.";
        return null;
    })();

    const submit = (e) => {
        e.preventDefault();
        post("/weekly-feedback/upload", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const historyCols = [
        {
            key: "angka_week", label: "Week", sortable: true, render: (_, r) => (
                <div className="whitespace-nowrap">
                    <span className="font-medium text-slate-700">W{r.angka_week}</span>
                    {r.bulan && r.tahun && <span className="block text-xs text-slate-400">{BULAN_ID[r.bulan]} {r.tahun}</span>}
                </div>
            ),
        },
        {
            key: "nama_file", label: "File", render: (_, r) => (
                r.path_file
                    ? <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{r.nama_file}</a>
                    : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>
            ),
        },
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
        { key: "updated_at", label: "Diupload", sortable: true, render: (_, r) => fmtDate(r.updated_at ?? r.created_at) },
    ];

    return (
        <AppLayout title="UPLOAD FILE WEEKLY FEEDBACK" breadcrumb="Dokumen / Upload File Weekly Feedback">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Info bar */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800">Laporan / Feedback Mingguan</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        Upload file laporan mingguan (PDF, DOCX, XLSX — maks 2MB) sesuai minggu. Setelah upload,
                        file menunggu review Mentor: <strong>Approved = selesai</strong>, <strong>Ditolak = upload ulang</strong>.
                    </p>
                </div>

                {/* Upload Form */}
                {!hasBatch ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        Batch Kader belum ditentukan. Hubungi Admin untuk mengatur batch Anda sebelum dapat mengunggah file.
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-700 mb-4">Upload File Mingguan</h2>
                        <form onSubmit={submit} className="space-y-4">
                            {/* Week dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Week <span className="text-rose-500">*</span>
                                </label>
                                <select required value={data.id_week} onChange={(e) => setData("id_week", e.target.value)}
                                    disabled={weekGroups.length === 0}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400">
                                    <option value="">
                                        {weekGroups.length === 0 ? "--Belum ada jadwal minggu--" : "--Pilih Week--"}
                                    </option>
                                    {weekGroups.map((g) => (
                                        <optgroup key={g.label} label={g.label}>
                                            {g.items.map((w) => {
                                                const disabled = !w.is_available || w.status === "pending" || w.status === "approved";
                                                const suffix = w.status === "approved" ? " — Approved"
                                                    : w.status === "pending" ? " — menunggu review"
                                                    : w.status === "rejected" ? " — ditolak, upload ulang"
                                                    : (!w.is_available ? " — belum waktunya" : "");
                                                return (
                                                    <option key={w.id_week} value={w.id_week} disabled={disabled}>
                                                        {BULAN_ID[w.bulan]} W{w.angka_week}{suffix}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ))}
                                </select>
                                {weekGroups.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1.5">Belum ada jadwal minggu untuk batch ini.</p>
                                )}
                            </div>

                            {lockMsg && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500">{lockMsg}</div>
                            )}

                            {/* File input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    File <span className="text-slate-400 font-normal">(PDF, DOCX, XLSX — maks 2MB)</span>
                                </label>
                                <input type="file" accept=".pdf,.docx,.xlsx"
                                    onChange={(e) => setData("file", e.target.files[0])}
                                    disabled={!canUpload}
                                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
                                {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                                {errors.id_week && <p className="mt-1 text-xs text-red-600">{errors.id_week}</p>}
                            </div>

                            <button type="submit" disabled={processing || !canUpload || !data.file}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition">
                                {processing ? "Mengunggah..." : "Upload File"}
                            </button>
                        </form>
                    </div>
                )}

                {/* History per week */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-700 mb-2">Riwayat Upload per Week</h2>
                    <FilterableTable
                        columns={historyCols}
                        data={history}
                        emptyMessage="Belum ada file yang diupload."
                        filters={[
                            { key: "status", label: "Status", options: [
                                { value: "pending", label: "Menunggu Review" },
                                { value: "approved", label: "Approved" },
                                { value: "rejected", label: "Ditolak" },
                            ] },
                            { key: "angka_week", label: "Week", labelFormat: (v) => `W${v}` },
                        ]}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
