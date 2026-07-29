import LearningGrowthChart from "./LearningGrowthChart";
import { KKM, band, fmt, scoreTone, SectionTitle, ReportHeader, BackToPickerLink } from "./reportUi";

const x10 = (v) => (v == null ? null : Number(v) * 10); // 0–10 → 0–100

// Baris rincian: label + bar 0–100 + angka. Dipakai untuk OJT 1–4 & aspek Development.
function ScoreRow({ label, value }) {
    const v = value;
    const pct = v == null ? 0 : Math.max(0, Math.min(100, v));
    const color = scoreTone(v).bar;
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
 *                      punya dokumennya (lihat App\Support\HasilTrainingMt).
 * @param training      Titik grafik Learning Growth Section A ({modul, nilai, kkm, avg, rank,
 *                      total}); null bila kadernya tak tercatat di dokumen training.
 */
export default function ArsipReportCard({
    kader = {},
    scores = {},
    backHref = null,
    trainingHref = null,
    training = null,
}) {
    const ojt = (scores.ojt ?? []).map((o) => ({ ...o, v: x10(o.score) }));
    const dev = (scores.dev ?? []).map((d) => ({ ...d, v: x10(d.score) }));
    const hasDev = dev.some((d) => d.v != null);
    const isResign = scores.status === "resign";

    const periodeLabel = `Batch ${kader.batch_roman ?? kader.batch_name}${kader.batch_year ? ` · ${kader.batch_year}` : ""}`;

    return (
        <div className="space-y-4">
            {/* Bar aksi (penanda arsip disembunyikan) */}
            {(backHref || trainingHref) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <BackToPickerLink href={backHref} />
                    {trainingHref && (
                        <a
                            href={trainingHref}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shrink-0 sm:ml-auto"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            Detail Nilai MT
                        </a>
                    )}
                </div>
            </div>
            )}

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
                    {/* A · LEARNING GROWTH — bergrafik seperti report sistem bila batchnya punya
                        dokumen hasil training; kalau tidak, jatuh balik ke skor akhir saja. */}
                    <div className="p-5">
                        <SectionTitle code="A">Learning Growth</SectionTitle>
                        <BigScore value={scores.learning_growth} />
                        {training && (
                            <LearningGrowthChart
                                modul={training.modul}
                                nilai={training.nilai}
                                kkm={training.kkm ?? KKM}
                                height={150}
                            />
                        )}
                        <div className={`space-y-1.5 text-sm ${training ? "mt-3" : ""}`}>
                            {training && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-slate-600">
                                            <span className="w-4 h-0.5 bg-blue-500 inline-block" /> Nilai training (avg)
                                        </span>
                                        <span className="font-semibold text-slate-800">{fmt(training.avg)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600">Peringkat</span>
                                        <span className="font-semibold text-slate-800">
                                            #{training.rank} <span className="font-normal text-slate-400">/ {training.total}</span>
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM
                                </span>
                                <span className="font-semibold text-slate-800">{training?.kkm ?? KKM}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 pt-1">
                                {training
                                    ? `M1–M${training.modul.length} = modul in-class berurutan, ${training.modul[0]?.label} → ${
                                          training.modul[training.modul.length - 1]?.label
                                      }. Nama tiap modul muncul saat titiknya di-hover.`
                                    : "Skor akhir rata-rata Learning Growth (arsip)."}
                            </p>
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
