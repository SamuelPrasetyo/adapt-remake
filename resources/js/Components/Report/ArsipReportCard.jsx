import { KKM, band, fmt, SectionTitle, ReportHeader, BackToPickerLink } from "./reportUi";

const x10 = (v) => (v == null ? null : Number(v) * 10); // 0–10 → 0–100

// Baris rincian: label + bar 0–100 + angka. Dipakai untuk OJT 1–4 & aspek Development.
function ScoreRow({ label, value }) {
    const v = value;
    const pct = v == null ? 0 : Math.max(0, Math.min(100, v));
    const color = v == null ? "bg-slate-200" : v >= 70 ? "bg-blue-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-slate-600">{label}</span>
            <span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="w-10 text-right font-semibold text-slate-800 tabular-nums">{fmt(v)}</span>
        </div>
    );
}

function BigScore({ value }) {
    const b = band(value);
    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold text-slate-800">{fmt(value)}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${b.cls}`}>{b.label}</span>
        </div>
    );
}

/**
 * Kartu report arsip Batch 1–2: skor akhir historis saja (tanpa grafik & breakdown FMC),
 * karena datanya tidak melalui sistem. Dipakai halaman Report Arsip & tab Report Kader Saya.
 *
 * @param backHref      URL tombol "Pilih kader lain"; kosongkan saat dipakai embedded.
 * @param trainingHref  URL rincian nilai in-class training; null bila batch kader belum
 *                      punya dokumennya (baru Batch 2 — lihat App\Support\HasilTrainingMt).
 */
export default function ArsipReportCard({ kader = {}, scores = {}, backHref = null, trainingHref = null }) {
    const ojt = (scores.ojt ?? []).map((o) => ({ ...o, v: x10(o.score) }));
    const dev = (scores.dev ?? []).map((d) => ({ ...d, v: x10(d.score) }));
    const hasDev = dev.some((d) => d.v != null);
    const isResign = scores.status === "resign";

    const periodeLabel = `Batch ${kader.batch_roman ?? kader.batch_name}${kader.batch_year ? ` · ${kader.batch_year}` : ""}`;

    return (
        <div className="space-y-4">
            {/* Bar aksi + penanda arsip */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <BackToPickerLink href={backHref} />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700 bg-amber-100 rounded-lg self-start sm:self-auto">
                        📁 Data Arsip · Batch {kader.batch_roman ?? scores.batch_no}
                    </span>
                    {trainingHref && (
                        <a
                            href={trainingHref}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 sm:ml-auto"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 17v-6h6v6m-9 4h12a2 2 0 002-2V7l-4-4H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Detail Nilai Training
                        </a>
                    )}
                </div>
                <p className="text-xs text-slate-400">
                    Skor akhir historis — tanpa grafik & tanpa breakdown FMC (data tidak melalui sistem)
                </p>
            </div>

            {/* REPORT CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <ReportHeader kader={kader} periodeLabel={periodeLabel} />

                {isResign && (
                    <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-sm text-rose-700 font-medium">
                        ⚠️ Kader ini tercatat <b>resign</b> di tengah program — sebagian nilai OJT tidak lengkap.
                    </div>
                )}

                {/* Body: A / B / C (statis, tanpa grafik) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                    {/* A · LEARNING GROWTH */}
                    <div className="p-5">
                        <SectionTitle code="A">Learning Growth</SectionTitle>
                        <BigScore value={scores.learning_growth} />
                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM
                                </span>
                                <span className="font-semibold text-slate-800">{KKM}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pt-1">Skor akhir rata-rata Learning Growth (arsip).</p>
                        </div>
                    </div>

                    {/* B · DEVELOPMENT PROGRESS */}
                    <div className="p-5">
                        <SectionTitle code="B">Development Progress</SectionTitle>
                        <BigScore value={scores.development_progress} />
                        {hasDev ? (
                            <div className="space-y-2.5">
                                {dev.map((d, i) => (
                                    <ScoreRow key={i} label={d.label} value={d.v} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-400">Rincian aspek tidak tersedia untuk batch ini — hanya skor akhir.</p>
                        )}
                    </div>

                    {/* C · FINAL OJT ASSESSMENT */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <SectionTitle code="C">Final OJT Assessment</SectionTitle>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">Arsip</span>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 mb-4 text-center">
                            <div className="text-[11px] uppercase tracking-wide text-emerald-600">Final Score OJT · Rata-rata OJT 1–4</div>
                            <div className="text-3xl font-bold text-emerald-700 mt-1">{fmt(scores.fmc_avg)}</div>
                        </div>
                        <div className="space-y-2.5">
                            {ojt.map((o, i) => (
                                <ScoreRow key={i} label={o.label} value={o.v} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
