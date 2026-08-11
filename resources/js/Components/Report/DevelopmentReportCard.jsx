import { useMemo, useState } from "react";
import { getFaseNum } from "@/constants/fase";
import { KKM, band, fmt, SectionTitle, ReportHeader, BackToPickerLink } from "./reportUi";
import ReportLineChart, { avgOf, kkmDataset } from "./ReportLineChart";
import ReportBarChart from "./ReportBarChart";

// Warna kelompok fase — dipakai bersama oleh dataset Chart.js & legenda di bawah grafik.
// (Padanan Tailwind-nya: bg-blue-500 / bg-emerald-500.)
const IN_CLASS_COLOR = "#3b82f6";
const SELF_COLOR = "#10b981";
// Pre Test dibuat KONTRAS KUAT terhadap Post Test pasangannya (bukan sekadar dashed atau
// hue tetangga) supaya dua garis dalam satu grafik tidak pernah tertukar:
//   biru (post)    ⇄ merah  (pre)   — In-Class
//   hijau (post)   ⇄ ungu   (pre)   — Self-Learning
// (Tailwind: rose-600 / purple-500.)
const IN_CLASS_PRE_COLOR = "#e11d48";
const SELF_PRE_COLOR = "#a855f7";

const lineStyle = (color, dashed = false) => ({
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2.5,
    tension: 0.35,
    pointRadius: 4,
    pointHoverRadius: 6,
    // spanGaps SENGAJA false: satu modul bisa punya Post Test tanpa Pre Test, dan garis tidak
    // boleh melompati titik kosong itu — kalau dijembatani, grafik memperlihatkan nilai
    // yang sebenarnya tidak ada.
    spanGaps: false,
    clip: false,
    ...(dashed
        ? { borderDash: [6, 4], pointBackgroundColor: "#fff", pointBorderColor: color, pointBorderWidth: 2 }
        : {}),
});

/**
 * Menyusun titik satu grafik Learning Growth.
 *
 * Sumbu-X: fase 1 (F1..Fn) → fase 3 (L1..Ln) → fase 2 (S1..Sn), masing-masing diurutkan
 * menurut kapan komponen yang digambar grafik ini selesai. Dua kelompok garis:
 * In-Class = fase 1 + 3, Self-Learning = fase 2.
 *
 * Tiap grafik memanggil ini dengan `timeOf`-nya sendiri, jadi urutan titik antar grafik
 * memang boleh berbeda untuk modul yang sama — itu yang diminta: modul yang Post Test-nya
 * selesai duluan belum tentu Post Activity-nya juga dinilai duluan.
 *
 * @param eligible modul layak tampil di grafik ini (nilainya sudah ada).
 * @param timeOf   waktu selesai komponen grafik ini → kunci urut & filter jendela FMC.
 * @param cutoff   akhir jendela FMC terpilih; null = view Final Score (tanpa batas).
 */
const buildSeries = (faseGroups, { eligible, timeOf, cutoff }) => {
    const modulsOf = (n) =>
        (faseGroups.find((g) => getFaseNum(g.fase) === String(n))?.moduls ?? []).filter((m) => {
            if (!eligible(m)) return false;
            if (cutoff == null) return true;
            const t = timeOf(m);
            return t ? new Date(t) <= cutoff : false;
        });

    // Modul tanpa timestamp (data lama) diurut paling belakang, bukan dibuang.
    const sorted = (arr) =>
        [...arr].sort((a, b) => {
            const ta = timeOf(a);
            const tb = timeOf(b);
            if (ta && tb) return new Date(ta) - new Date(tb);
            if (ta) return -1;
            if (tb) return 1;
            return 0;
        });

    const toPoints = (arr, prefix) =>
        sorted(arr).map((m, i) => ({ label: `${prefix}${i + 1}`, nama: m.nama, kode_modul: m.kode_modul, m }));

    const inClass = [...toPoints(modulsOf(1), "F"), ...toPoints(modulsOf(3), "L")];
    const self = toPoints(modulsOf(2), "S");

    return { inClass, self, all: [...inClass, ...self] };
};

// Dataset sepanjang sumbu-X penuh, berisi nilai hanya di rentang kelompoknya sendiri (sisanya
// null) — supaya In-Class & Self-Learning tergambar sebagai dua garis terpisah di satu sumbu.
const masked = (all, from, to, get) => all.map((p, i) => (i >= from && i < to ? get(p.m) : null));

// Badge band nilai (Excellent/Good/…) — dipakai seragam di semua grafik kartu ini.
// Ikon centang hanya muncul kalau nilainya ada; band(null) cuma menampilkan "—".
function BandBadge({ value }) {
    const b = band(value);
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${b.cls}`}>
            {value != null && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {b.label}
        </span>
    );
}

// Kotak "Tertinggi"/"Terendah" di bawah grafik Development Progress — kartu report dibuat
// lebih lebar (lihat pembungkus di halaman Report) supaya "Nama — Skor" muat satu baris
// walau nama aspeknya panjang (mis. "SOP Understanding").
function ExtremeStat({ label, tone, icon, item }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
                </svg>
            </span>
            <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="text-[13px] font-semibold text-slate-800 leading-snug">
                    {item ? `${item.label} — ${fmt(item.score)}` : "—"}
                </div>
            </div>
        </div>
    );
}

/**
 * Kartu "Management Trainee Development Report" untuk batch 3+ (data sistem).
 * Dipakai halaman Report (Pages/Report/Development) & tab Report di Kader Saya.
 *
 * @param backHref  URL tombol "Pilih kader lain"; kosongkan saat dipakai embedded.
 */
export default function DevelopmentReportCard({
    kader = {},
    faseGroups = [],
    penilaianList = [],
    developmentByFmc = {},
    monthlySummariesByFmc = {},
    fmcFinalScores = {},
    fmcApproved = {},
    grandScore = null,
    fmcWindows = [],
    currentFmc = 1,
    backHref = null,
}) {
    // view: 1 | 2 | 3 (per FMC) atau "final" (Grand Score).
    const [view, setView] = useState(currentFmc);
    const isFinal = view === "final";
    const selFmc = isFinal ? 3 : Number(view);
    const selWindow = isFinal ? null : fmcWindows.find((w) => w.fmc === Number(view)) ?? null;

    // ── Section A · Learning Growth ──────────────────────────────────────────
    // Dua grafik terpisah berisi NILAI ASLI (tanpa rumus turunan): Pre/Post Test dan Post
    // Activity. Keduanya dibatasi jendela FMC terpilih memakai waktu selesai komponennya
    // masing-masing, jadi pipeline-nya berdiri sendiri-sendiri.
    const cutoff = isFinal ? null : selWindow ? new Date(selWindow.end) : null;

    // Grafik 1 — Pre/Post Test. Post Test yang menandai tahap ini selesai (Pre selalu
    // mendahuluinya), jadi keanggotaan & urutan titik memakai Post Test.
    const test = useMemo(
        () =>
            buildSeries(faseGroups, {
                eligible: (m) => m.post_score != null,
                timeOf: (m) => m.post_completed_at,
                cutoff,
            }),
        [faseGroups, view]
    );

    // Grafik 2 — Post Activity. Hanya yang SUDAH DINILAI Admin MAI; submission yang belum
    // dinilai tidak punya angka untuk dibandingkan dengan KKM.
    const pa = useMemo(
        () =>
            buildSeries(faseGroups, {
                eligible: (m) => m.has_post_activity && m.pa_score != null,
                timeOf: (m) => m.pa_completed_at,
                cutoff,
            }),
        [faseGroups, view]
    );

    const testLabels = test.all.map((p) => p.label);
    const testSplit = test.inClass.length;
    const testDatasets = testLabels.length
        ? [
              { label: "In-Class · Post Test", data: masked(test.all, 0, testSplit, (m) => m.post_score), ...lineStyle(IN_CLASS_COLOR) },
              { label: "In-Class · Pre Test", data: masked(test.all, 0, testSplit, (m) => m.pre_score), ...lineStyle(IN_CLASS_PRE_COLOR, true) },
              { label: "Self-Learning · Post Test", data: masked(test.all, testSplit, test.all.length, (m) => m.post_score), ...lineStyle(SELF_COLOR) },
              { label: "Self-Learning · Pre Test", data: masked(test.all, testSplit, test.all.length, (m) => m.pre_score), ...lineStyle(SELF_PRE_COLOR, true) },
              kkmDataset(testLabels.length),
          ]
        : [];
    // Sumbu-Y grafik 1 harus memuat garis Pre DAN Post sekaligus.
    const testYValues = test.all.flatMap((p) => [p.m.pre_score, p.m.post_score]);

    const paLabels = pa.all.map((p) => p.label);
    const paSplit = pa.inClass.length;
    const paDatasets = paLabels.length
        ? [
              { label: "In-Class", data: masked(pa.all, 0, paSplit, (m) => m.pa_score), ...lineStyle(IN_CLASS_COLOR) },
              { label: "Self-Learning", data: masked(pa.all, paSplit, pa.all.length, (m) => m.pa_score), ...lineStyle(SELF_COLOR) },
              kkmDataset(paLabels.length),
          ]
        : [];
    const paYValues = pa.all.map((p) => p.m.pa_score);

    const avgBy = (pts, key) => avgOf(pts.map((p) => p.m[key]));
    const testScore = avgBy(test.all, "post_score");
    const paScore = avgBy(pa.all, "pa_score");

    // ── Section B · Development Progress (skor mentor pada FMC terpilih) ──────
    // Skor feedback mentor disimpan skala 1–10; ditampilkan per-100 agar seragam dgn KKM & OJT.
    const dpRaw = (isFinal ? developmentByFmc.all : developmentByFmc[view]) ?? [];
    const dp = dpRaw.map((d) => ({ ...d, score: d.score != null ? d.score * 10 : null }));
    const dpScores = dp.map((d) => d.score);
    const dpAvg = avgOf(dpScores);
    const dpScored = dp.filter((d) => d.score != null);
    const dpHigh = dpScored.length ? dpScored.reduce((a, b) => (b.score > a.score ? b : a)) : null;
    // Semua skor sama rata → tidak ada aspek yang benar-benar "terendah", jadi kotaknya
    // ditampilkan kosong ("—") daripada mengulang aspek yang sama dengan Tertinggi.
    const dpAllTied = dpScored.length > 1 && dpScored.every((d) => d.score === dpScored[0].score);
    const dpLow = dpScored.length && !dpAllTied ? dpScored.reduce((a, b) => (b.score < a.score ? b : a)) : null;
    const dpLabels = dpScored.length ? dp.map((d) => d.label) : [];

    // ── Section C · Final OJT Assessment ─────────────────────────────────────
    // Nilai dianggap FINAL hanya bila approval_status === 'approved'. Sudah dinilai tapi
    // belum di-approve → status "Menunggu Approval" & nilai disembunyikan (belum fix).
    const pen = penilaianList.find((p) => p.fmc === selFmc) ?? null;
    const penApproved = !!pen && pen.final_score != null && pen.approval_status === "approved";
    const penPending = !!pen && pen.final_score != null && pen.approval_status !== "approved";
    const cStatus = isFinal
        ? grandScore != null
            ? "approved"
            : "not_assessed"
        : penApproved
        ? "approved"
        : penPending
        ? "pending_approval"
        : "not_assessed";
    const cBadge = {
        approved: { t: "Selesai", c: "bg-emerald-100 text-emerald-700" },
        pending_approval: { t: "Menunggu Approval", c: "bg-amber-100 text-amber-700" },
        not_assessed: { t: "Menunggu", c: "bg-slate-100 text-slate-500" },
    }[cStatus];

    const periodeLabel = isFinal ? "FMC 1–3 · Final Score" : `FMC ${selFmc} · ${selWindow?.label ?? "—"}`;

    // ── Section D · Catatan Perkembangan Bulanan (Summary Monthly Feedback) ────
    // Ringkasan per bulan yang jatuh di jendela FMC terpilih; view Final = semua bulan.
    const monthlyNotes = (isFinal ? monthlySummariesByFmc.all : monthlySummariesByFmc[view]) ?? [];

    return (
        <div className="space-y-4">
            {/* MODE LAPORAN — per FMC + Final Score */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <BackToPickerLink href={backHref} />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Filter Report</span>
                <select
                    value={view}
                    onChange={(e) => setView(e.target.value === "final" ? "final" : Number(e.target.value))}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                    {fmcWindows.map((w) => (
                        <option key={w.fmc} value={w.fmc}>
                            FMC {w.fmc} : {w.label}
                        </option>
                    ))}
                    <option value="final" disabled={grandScore == null}>
                        Final Score (Grand Score){grandScore == null ? " — menunggu FMC 1–3 dinilai" : ""}
                    </option>
                </select>
                <span className="text-xs text-slate-400 sm:ml-auto">
                    {isFinal ? "Rata-rata akhir FMC 1–3" : "Pilih FMC untuk melihat perkembangan per periode"}
                </span>
            </div>

            {/* REPORT CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <ReportHeader kader={kader} periodeLabel={periodeLabel} />

                {/* FMC timeline */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {fmcWindows.map((f) => (
                                <span key={f.fmc} className={`h-1.5 w-12 rounded-full ${isFinal || f.fmc < selFmc ? "bg-slate-700" : f.fmc === selFmc ? "bg-amber-500" : "bg-slate-200"}`} />
                            ))}
                            <span className="text-xs text-slate-500 ml-2">{isFinal ? "Program lengkap FMC 1–3" : `FMC ${selFmc} dari 3`}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                            {isFinal ? "Penilaian OJT lengkap" : `Penilaian OJT: ${selWindow?.penilaianLabel ?? "—"}`}
                        </span>
                    </div>
                </div>

                {/* A · LEARNING GROWTH — selebar kartu, dua grafik nilai asli berdampingan */}
                <div className="px-6 py-5 border-b border-slate-100">
                    <SectionTitle code="A">Learning Growth</SectionTitle>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        {/* A1 · Pre / Post Test */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Pre / Post Test</span>
                                <span className="flex flex-col items-center">
                                    <div className="text-2xl font-bold text-slate-800 leading-none">{fmt(testScore)}</div>
                                    <div className="mt-1">
                                        <BandBadge value={testScore} />
                                    </div>
                                </span>
                            </div>
                            <ReportLineChart
                                labels={testLabels}
                                datasets={testDatasets}
                                yValues={testYValues}
                                points={test.all}
                                height={190}
                                emptyMessage="Belum ada Post Test selesai pada periode ini"
                            />
                            {/* Empat angka dirapikan jadi tabel mini Pre × Post supaya tidak jadi 4 baris */}
                            <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1.5 items-center text-sm">
                                <span />
                                <span className="text-[11px] uppercase tracking-wide text-slate-400 text-right w-10">Pre</span>
                                <span className="text-[11px] uppercase tracking-wide text-slate-400 text-right w-10">Post</span>

                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="w-3 border-t-2 border-dashed border-rose-600 inline-block" />
                                    <span className="w-3 h-0.5 bg-blue-500 inline-block" /> In-Class
                                </span>
                                <span className="font-semibold text-slate-800 text-right">{fmt(avgBy(test.inClass, "pre_score"))}</span>
                                <span className="font-semibold text-slate-800 text-right">{fmt(avgBy(test.inClass, "post_score"))}</span>

                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="w-3 border-t-2 border-dashed border-purple-500 inline-block" />
                                    <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Self-Learning
                                </span>
                                <span className="font-semibold text-slate-800 text-right">{fmt(avgBy(test.self, "pre_score"))}</span>
                                <span className="font-semibold text-slate-800 text-right">{fmt(avgBy(test.self, "post_score"))}</span>

                                <span className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM
                                </span>
                                <span />
                                <span className="font-semibold text-slate-800 text-right">{KKM}</span>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-400">Garis putus-putus (merah/ungu) = Pre Test</div>
                        </div>

                        {/* A2 · Post Activity */}
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Post Activity</span>
                                <span className="flex flex-col items-center">
                                    <div className="text-2xl font-bold text-slate-800 leading-none">{fmt(paScore)}</div>
                                    <div className="mt-1">
                                        <BandBadge value={paScore} />
                                    </div>
                                </span>
                            </div>
                            <ReportLineChart
                                labels={paLabels}
                                datasets={paDatasets}
                                yValues={paYValues}
                                points={pa.all}
                                height={190}
                                emptyMessage="Belum ada Post Activity dinilai pada periode ini"
                            />
                            <div className="mt-3 space-y-1.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="w-4 h-0.5 bg-blue-500 inline-block" /> In-Class
                                    </span>
                                    <span className="font-semibold text-slate-800">{fmt(avgBy(pa.inClass, "pa_score"))}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="w-4 h-0.5 bg-emerald-500 inline-block" /> Self-Learning
                                    </span>
                                    <span className="font-semibold text-slate-800">{fmt(avgBy(pa.self, "pa_score"))}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM
                                    </span>
                                    <span className="font-semibold text-slate-800">{KKM}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body: B / C */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    {/* B · DEVELOPMENT PROGRESS */}
                    <div className="p-5 bg-white">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <SectionTitle code="B">Development Progress</SectionTitle>
                                <p className="text-xs text-slate-400 -mt-2">Skor rata-rata aspek pengembangan dari feedback mentor</p>
                            </div>
                            <div className="flex flex-col items-center shrink-0">
                                <div className="text-2xl font-bold text-slate-800 leading-none">{fmt(dpAvg)}</div>
                                <div className="mt-1">
                                    <BandBadge value={dpAvg} />
                                </div>
                            </div>
                        </div>
                        <ReportBarChart
                            labels={dpLabels}
                            data={dp.map((d) => d.score)}
                            kkm={KKM}
                            points={dp.map((d) => ({ nama: d.label }))}
                            height={170}
                            emptyMessage="Belum ada feedback mentor pada periode ini"
                        />
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM {KKM}
                        </div>
                        <div className="mt-3 rounded-xl bg-white/80 border border-slate-100 divide-x divide-slate-100 grid grid-cols-2 overflow-hidden">
                            <ExtremeStat
                                label="Tertinggi"
                                tone="bg-emerald-100 text-emerald-600"
                                icon="M13 7h8m0 0v8m0-8L11 17l-4-4-6 6"
                                item={dpHigh}
                            />
                            <ExtremeStat
                                label="Terendah"
                                tone="bg-rose-100 text-rose-600"
                                icon="M13 17h8m0 0V9m0 8L11 7 7 11l-6-6"
                                item={dpLow}
                            />
                        </div>
                    </div>

                    {/* C · FINAL OJT ASSESSMENT */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <SectionTitle code="C">Final OJT Assessment</SectionTitle>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${cBadge.c}`}>{cBadge.t}</span>
                        </div>

                        {isFinal ? (
                            <>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 mb-4 text-center">
                                    <div className="text-[11px] uppercase tracking-wide text-emerald-600">Grand Score · Rata-rata FMC 1–3</div>
                                    <div className="text-3xl font-bold text-emerald-700 mt-1">{fmt(grandScore)}</div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {[1, 2, 3].map((f) => (
                                        <div key={f} className="flex items-center justify-between">
                                            <span className="text-slate-600">Final Score FMC {f}</span>
                                            {fmcApproved[f] ? (
                                                <span className="font-semibold text-slate-800">{fmt(fmcFinalScores[f])}</span>
                                            ) : (
                                                <span className="text-xs font-medium text-amber-600">Menunggu Approval</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                {cStatus === "approved" ? (
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 mb-4 text-center">
                                        <div className="text-[11px] uppercase tracking-wide text-emerald-600">Final Score FMC {selFmc}</div>
                                        <div className="text-3xl font-bold text-emerald-700 mt-1">{fmt(pen.final_score)}</div>
                                    </div>
                                ) : cStatus === "pending_approval" ? (
                                    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-6 mb-4 text-center">
                                        <svg className="w-6 h-6 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <div className="text-sm font-medium text-amber-700">Menunggu Approval</div>
                                        <div className="text-xs text-amber-600/80 mt-0.5">Nilai sudah diisi mentor, belum disetujui (belum final)</div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 mb-4 text-center">
                                        <svg className="w-6 h-6 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <div className="text-sm text-slate-500">Penilaian belum dilaksanakan</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Jadwal: {selWindow?.penilaianLabel ?? "—"}</div>
                                    </div>
                                )}
                                <div className="space-y-2 text-sm">
                                    {[
                                        { c: "bg-blue-400", label: "Hard Competency (70%)", v: penApproved ? pen?.hard_score : null },
                                        { c: "bg-emerald-400", label: "Soft Competency (30%)", v: penApproved ? pen?.soft_score : null },
                                    ].map((r) => (
                                        <div key={r.label} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-slate-600"><span className={`w-2.5 h-2.5 rounded-full ${r.c}`} /> {r.label}</span>
                                            <span className="font-semibold text-slate-800">{fmt(r.v)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* D · CATATAN PERKEMBANGAN */}
                <div className="px-6 py-5 border-t border-slate-100">
                    <SectionTitle code="D">Catatan Perkembangan</SectionTitle>
                    {/* Ringkasan Monthly Feedback per bulan (disusun Admin MAI) */}
                    {monthlyNotes.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Catatan Mentor</div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Belum ada catatan perkembangan untuk periode ini. Catatan akan terisi mengikuti hasil Penilaian OJT dan feedback mentor.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {monthlyNotes.map((n) => (
                                <div key={`${n.tahun}-${n.bulan}`} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{n.label}</div>
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{n.summary}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                        {[
                            { role: pen?.panelis1_peran || "Panelis 1", name: pen?.panelis1_nama },
                            { role: pen?.panelis2_peran || "Panelis 2", name: pen?.panelis2_nama },
                            { role: "Mentor", name: kader?.mentor },
                        ].map(({ role, name }, i) => (
                            <div key={i} className="text-center">
                                <div className="text-sm text-slate-400 mb-10">{role}</div>
                                <div className="border-t border-slate-300 pt-1 text-xs text-slate-600">({name || "         "})</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
