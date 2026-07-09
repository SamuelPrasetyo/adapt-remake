import { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// Ringkasan angka hasil impor sebagai kartu kecil.
function StatCard({ label, value, tone = "slate" }) {
    const tones = {
        slate: "bg-slate-50 text-slate-700 border-slate-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return (
        <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
            <div className="text-2xl font-bold leading-none">{value}</div>
            <div className="text-[11px] uppercase tracking-wide mt-1 opacity-80">{label}</div>
        </div>
    );
}

const actionBadge = (a) => {
    if (a === "created") return "bg-emerald-100 text-emerald-700";
    if (a === "matched") return "bg-blue-100 text-blue-700";
    return "bg-rose-100 text-rose-700"; // skipped-unmatched
};

const fmt = (v) => (v === null || v === undefined ? "—" : Number(v).toFixed(2).replace(/\.00$/, ""));

export default function ImportArsip({ result = null }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, progress, reset } = useForm({ file: null });
    const [fileName, setFileName] = useState("");

    const submit = (e) => {
        e.preventDefault();
        post("/report-import-arsip", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset("file");
                setFileName("");
            },
        });
    };

    const s = result?.summary;
    const warnings = result?.warnings ?? [];
    const kaders = result?.kaders ?? [];

    return (
        <AppLayout title="IMPORT ARSIP BATCH 1 & 2" breadcrumb="Report / Import Arsip">
            <div className="max-w-5xl space-y-6">
                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        {flash.error}
                    </div>
                )}

                {/* Uploader */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">
                        Import Arsip Skor Batch 1 &amp; 2
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Unggah file <b>Data MT batch 1 &amp; 2.xlsx</b> (2 sheet: <i>batch 1</i> &amp; <i>batch 2</i>).
                        Batch 1 dibuat baru, Batch 2 dicocokkan dengan kader yang sudah ada. Menjalankan
                        ulang aman — data yang sama akan di-<i>update</i>, bukan diduplikasi.
                    </p>

                    <form onSubmit={submit} className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0] ?? null;
                                    setData("file", f);
                                    setFileName(f?.name ?? "");
                                }}
                            />
                            <span className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 border-dashed rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition">
                                📄 {fileName || "Pilih file .xlsx…"}
                            </span>
                        </label>
                        <button
                            type="submit"
                            disabled={!data.file || processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                        >
                            {processing ? "Mengimpor…" : "Import"}
                        </button>
                    </form>
                    {progress && (
                        <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}
                </div>

                {/* Hasil */}
                {result && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            <StatCard label="Batch 1 dibuat" value={s.batch1_created} tone="emerald" />
                            <StatCard label="Batch 1 cocok" value={s.batch1_matched} tone="blue" />
                            <StatCard label="Batch 2 cocok" value={s.batch2_matched} tone="blue" />
                            <StatCard label="Batch 2 tak cocok" value={s.batch2_unmatched} tone={s.batch2_unmatched ? "amber" : "slate"} />
                            <StatCard label="Mentor baru" value={s.mentors_created} tone="slate" />
                            <StatCard label="Link mentor" value={s.links_created} tone="slate" />
                            <StatCard label="Skor tersimpan" value={s.arsip_upserted} tone="emerald" />
                        </div>

                        {warnings.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="text-sm font-semibold text-amber-800 mb-2">
                                    ⚠️ Catatan ({warnings.length})
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                                    {warnings.map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                Rincian per kader ({kaders.length})
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                                            <th className="px-4 py-2">Batch</th>
                                            <th className="px-4 py-2">No</th>
                                            <th className="px-4 py-2">Nama</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">BU</th>
                                            <th className="px-4 py-2 text-right">Learning</th>
                                            <th className="px-4 py-2 text-right">Dev</th>
                                            <th className="px-4 py-2 text-right">FMC</th>
                                            <th className="px-4 py-2">Mentor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kaders.map((k, i) => (
                                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="px-4 py-2 text-slate-500">{k.batch}</td>
                                                <td className="px-4 py-2 text-slate-500">{k.no ?? "—"}</td>
                                                <td className="px-4 py-2 font-medium text-slate-800">{k.nama}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${actionBadge(k.action)}`}>
                                                        {k.action}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">{k.company ?? "—"}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{fmt(k.scores?.learning_growth)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{fmt(k.scores?.development_progress)}</td>
                                                <td className="px-4 py-2 text-right tabular-nums">{fmt(k.scores?.fmc_avg)}</td>
                                                <td className="px-4 py-2 text-slate-600">
                                                    {k.mentors?.length ? k.mentors.join(" · ") : "—"}
                                                    {k.scores?.status === "resign" && (
                                                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 text-[10px]">resign</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
