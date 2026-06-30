import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { getFaseNum } from "@/constants/fase";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Legend,
    Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

const KKM = 7.0;

// Band penilaian pada skala 0–10 (KKM 7.0).
function band(v) {
    if (v == null) return { label: "—", cls: "bg-slate-100 text-slate-500" };
    if (v >= 8.5) return { label: "Excellent", cls: "bg-emerald-100 text-emerald-700" };
    if (v >= 7) return { label: "Good", cls: "bg-blue-100 text-blue-700" };
    if (v >= 6) return { label: "Cukup", cls: "bg-amber-100 text-amber-700" };
    return { label: "Perlu Perhatian", cls: "bg-rose-100 text-rose-700" };
}

const fmt = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d));
const signed = (v) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}`);

// Rentang sumbu-Y adaptif (selalu memuat KKM & semua titik), dikunci ke skala 0–10.
const yRange = (vals) => {
    const v = vals.filter((x) => x != null);
    if (!v.length) return { min: 5, max: 9 };
    const lo = Math.min(...v, KKM);
    const hi = Math.max(...v, KKM);
    return { min: Math.max(0, Math.floor(lo - 0.5)), max: Math.min(10, Math.ceil(hi + 0.5)) };
};

const avgOf = (pts) => {
    const s = pts.filter((p) => p != null);
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
};
const growthOf = (pts) => {
    const s = pts.filter((p) => p != null);
    return s.length >= 2 ? s[s.length - 1] - s[0] : null;
};

function SectionTitle({ code, children }) {
    return (
        <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-700 mb-3">
            <span className="text-slate-400">{code} ·</span> {children}
        </div>
    );
}

export default function Development({
    kader = {},
    faseGroups = [],
    penilaianList = [],
    developmentByFmc = {},
    fmcFinalScores = {},
    fmcApproved = {},
    grandScore = null,
    fmcWindows = [],
    currentFmc = 1,
}) {
    // view: 1 | 2 | 3 (per FMC) atau "final" (Grand Score).
    const [view, setView] = useState(currentFmc);
    const isFinal = view === "final";
    const selFmc = isFinal ? 3 : Number(view);
    const selWindow = isFinal ? null : fmcWindows.find((w) => w.fmc === Number(view)) ?? null;

    // ── Section A · Learning Growth (kumulatif s/d FMC terpilih) ──────────────
    // Titik = LGS per modul (skala internal 0–100) → tampil 0–10. Modul disaring
    // berdasarkan completed_at: di view FMC, hanya modul yang SELESAI s/d akhir FMC itu.
    const cutoff = isFinal ? null : selWindow ? new Date(selWindow.end) : null;
    const inWindow = (m) => {
        if (m.growth_score == null) return false;
        if (cutoff == null) return true;
        if (!m.completed_at) return false;
        return new Date(m.completed_at) <= cutoff;
    };
    const modulsOf = (n) =>
        (faseGroups.find((g) => getFaseNum(g.fase) === String(n))?.moduls ?? []).filter(inWindow);
    const byCompletion = (arr) =>
        [...arr].sort((a, b) => {
            if (a.completed_at && b.completed_at) return new Date(a.completed_at) - new Date(b.completed_at);
            if (a.completed_at) return -1;
            if (b.completed_at) return 1;
            return 0;
        });
    const toPoint = (prefix) => (m, i) => ({
        label: `${prefix}${i + 1}`,
        nama: m.nama,
        score: m.growth_score != null ? m.growth_score / 10 : null,
    });
    const inClassPoints = useMemo(
        () => [...byCompletion(modulsOf(1)).map(toPoint("F")), ...byCompletion(modulsOf(3)).map(toPoint("L"))],
        [faseGroups, view]
    );
    const selfPoints = useMemo(() => byCompletion(modulsOf(2)).map(toPoint("S")), [faseGroups, view]);
    const allPoints = useMemo(() => [...inClassPoints, ...selfPoints], [inClassPoints, selfPoints]);

    const avgInClass = avgOf(inClassPoints.map((p) => p.score));
    const avgSelf = avgOf(selfPoints.map((p) => p.score));
    const lgScore = avgOf(allPoints.map((p) => p.score));
    const inClassGrowth = growthOf(inClassPoints.map((p) => p.score));
    const selfGrowth = growthOf(selfPoints.map((p) => p.score));

    // ── Section B · Development Progress (skor mentor pada FMC terpilih) ──────
    const dp = (isFinal ? developmentByFmc.all : developmentByFmc[view]) ?? [];
    const dpScores = dp.map((d) => d.score);
    const dpAvg = avgOf(dpScores);
    const dpScored = dp.filter((d) => d.score != null);
    const dpHigh = dpScored.length ? dpScored.reduce((a, b) => (b.score > a.score ? b : a)) : null;
    const dpLow = dpScored.length ? dpScored.reduce((a, b) => (b.score < a.score ? b : a)) : null;

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

    // ── Charts ───────────────────────────────────────────────────────────────
    const lgChartRef = useRef(null);
    const lgChart = useRef(null);
    const dpChartRef = useRef(null);
    const dpChart = useRef(null);

    useEffect(() => {
        if (!lgChartRef.current || allPoints.length === 0) return;
        if (lgChart.current) lgChart.current.destroy();
        const labels = allPoints.map((p) => p.label);
        const inClass = allPoints.map((p, i) => (i < inClassPoints.length ? p.score : null));
        const selfL = allPoints.map((p, i) => (i >= inClassPoints.length ? p.score : null));
        lgChart.current = new Chart(lgChartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "In-Class", data: inClass, borderColor: "#3b82f6", backgroundColor: "#3b82f6", borderWidth: 2.5, tension: 0.35, pointRadius: 4, spanGaps: true, clip: false },
                    { label: "Self-Learning", data: selfL, borderColor: "#10b981", backgroundColor: "#10b981", borderWidth: 2.5, tension: 0.35, pointRadius: 4, spanGaps: true, clip: false },
                    { label: "KKM", data: labels.map(() => KKM), borderColor: "#f97316", borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { title: (it) => allPoints[it[0]?.dataIndex]?.nama ?? it[0]?.label } },
                },
                scales: {
                    y: { ...yRange(allPoints.map((p) => p.score)), grid: { color: "#f1f5f9" }, ticks: { stepSize: 1, font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
            },
        });
        return () => { if (lgChart.current) lgChart.current.destroy(); };
    }, [JSON.stringify(allPoints), inClassPoints.length]);

    useEffect(() => {
        if (!dpChartRef.current || dpScored.length === 0) return;
        if (dpChart.current) dpChart.current.destroy();
        const labels = dp.map((d) => d.label);
        dpChart.current = new Chart(dpChartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "Skor", data: dp.map((d) => d.score), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.12)", borderWidth: 2.5, tension: 0.35, pointRadius: 5, fill: true, spanGaps: true },
                    { label: "KKM", data: labels.map(() => KKM), borderColor: "#f97316", borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, fill: false },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ...yRange(dpScores), grid: { color: "#f1f5f9" }, ticks: { stepSize: 1, font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
            },
        });
        return () => { if (dpChart.current) dpChart.current.destroy(); };
    }, [JSON.stringify(dp)]);

    const lgBand = band(lgScore);
    const dpBand = band(dpAvg);

    const periodeLabel = isFinal ? "FMC 1–3 · Final Score" : `FMC ${selFmc} · ${selWindow?.label ?? "—"}`;
    const badgeLabel = isFinal ? "Grand Score" : selWindow?.label ?? "—";

    const Info = ({ label, value }) => (
        <div className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</div>
        </div>
    );

    return (
        <AppLayout
            title="REPORT NEW"
            breadcrumb="Report / Report New"
            headerActions={<a href="/report-new" className="text-sm text-slate-500 hover:text-slate-800 transition">← Pilih kader lain</a>}
        >
            <div className="max-w-5xl mx-auto space-y-4">
                {/* MODE LAPORAN — per FMC + Final Score */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Filter Report</span>
                    <select
                        value={view}
                        onChange={(e) => setView(e.target.value === "final" ? "final" : Number(e.target.value))}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                        {fmcWindows.map((w) => (
                            <option key={w.fmc} value={w.fmc}>
                                FMC {w.fmc} — {w.label}
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
                    {/* Header band */}
                    <div className="bg-slate-800 text-white px-6 py-5 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">New Armada Group · People &amp; Organization</div>
                            <h2 className="text-lg font-bold tracking-wide mt-1">MANAGEMENT TRAINEE DEVELOPMENT REPORT</h2>
                            <div className="text-xs text-slate-300 mt-0.5">Learning Progress &amp; Development Tracking</div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[11px] uppercase tracking-widest text-slate-400">Periode</div>
                            <div className="text-sm font-semibold mt-1">{periodeLabel}</div>
                            <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium uppercase tracking-wide">{badgeLabel}</span>
                        </div>
                    </div>

                    {/* Info row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 border-b border-slate-100">
                        <Info label="Nama" value={kader.nama} />
                        <Info label="MT Batch" value={kader.batch_roman ? `Batch ${kader.batch_roman}` : kader.batch_name} />
                        <Info label="Business Unit" value={kader.bu} />
                        <Info label="Department · Mentor" value={[kader.departemen, kader.mentor].filter(Boolean).join(" · ")} />
                    </div>

                    {/* FMC timeline */}
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {fmcWindows.map((f) => {
                                const st = isFinal || f.fmc < selFmc ? "selesai" : f.fmc === selFmc ? "berjalan" : "belum";
                                const stMap = {
                                    berjalan: { t: "Berjalan", c: "bg-amber-100 text-amber-700" },
                                    selesai: { t: "Selesai", c: "bg-emerald-100 text-emerald-700" },
                                    belum: { t: "Belum Dimulai", c: "bg-slate-100 text-slate-500" },
                                };
                                const active = !isFinal && f.fmc === selFmc;
                                return (
                                    <div key={f.fmc} className={`rounded-lg border px-4 py-2.5 flex items-center justify-between ${active ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-700">FMC {f.fmc}</div>
                                            <div className="text-[11px] text-slate-400">{f.label}</div>
                                        </div>
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${stMap[st].c}`}>{stMap[st].t}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-3">
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

                    {/* Body: A / B / C */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                        {/* A · LEARNING GROWTH */}
                        <div className="p-5">
                            <SectionTitle code="A">Learning Growth</SectionTitle>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-3xl font-bold text-slate-800">{fmt(lgScore)}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${lgBand.cls}`}>{lgBand.label}</span>
                            </div>
                            <div style={{ height: 150 }}>
                                {allPoints.length ? <canvas ref={lgChartRef} /> : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada modul selesai pada periode ini</div>}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                    <div className="text-[11px] text-slate-500">In-Class Growth</div>
                                    <div className="text-base font-bold text-blue-600">{signed(inClassGrowth)}</div>
                                    <div className="text-[10px] text-slate-400">Foundation + Leadership</div>
                                </div>
                                <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                    <div className="text-[11px] text-slate-500">Self-Learning Growth</div>
                                    <div className="text-base font-bold text-emerald-600">{signed(selfGrowth)}</div>
                                    <div className="text-[10px] text-slate-400">Sub-Functional OJT</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> In-Class (Avg Post)</span>
                                    <span className="font-semibold text-slate-800">{fmt(avgInClass)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600"><span className="w-4 h-0.5 bg-emerald-500 inline-block" /> Self-Learning (Avg Post)</span>
                                    <span className="font-semibold text-slate-800">{fmt(avgSelf)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600"><span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM</span>
                                    <span className="font-semibold text-slate-800">{KKM.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {/* B · DEVELOPMENT PROGRESS */}
                        <div className="p-5">
                            <SectionTitle code="B">Development Progress</SectionTitle>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-3xl font-bold text-slate-800">{fmt(dpAvg)}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${dpBand.cls}`}>{dpBand.label}</span>
                            </div>
                            <div style={{ height: 150 }}>
                                {dpScored.length ? <canvas ref={dpChartRef} /> : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada feedback mentor pada periode ini</div>}
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Tertinggi</span>
                                    <span className="font-semibold text-slate-800">{dpHigh ? `${dpHigh.label} — ${fmt(dpHigh.score)}` : "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Terendah</span>
                                    <span className="font-semibold text-slate-800">{dpLow ? `${dpLow.label} — ${fmt(dpLow.score)}` : "—"}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                    <span className="text-slate-500">Rata-rata</span>
                                    <span className="font-semibold text-slate-800">{fmt(dpAvg)}</span>
                                </div>
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
                                            { c: "bg-blue-400", label: "OJT Performance", v: penApproved ? pen?.ojt_score : null },
                                            { c: "bg-emerald-400", label: "Value", v: penApproved ? pen?.value_score : null },
                                            { c: "bg-amber-400", label: "Test & Presentation", v: penApproved ? pen?.presentation_score : null },
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
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Catatan Mentor / HR People Development</div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {pen?.overview || pen?.mentor_comments ||
                                    "Belum ada catatan perkembangan untuk periode ini. Catatan akan terisi mengikuti hasil Penilaian OJT dan feedback mentor."}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {["Konsistensi Belajar", "Self-Directed Learning", "Komunikasi Mentor"].map((t) => (
                                    <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                            {["Mentor", "HR / People Development", "Division Head"].map((role) => (
                                <div key={role} className="text-center">
                                    <div className="text-sm text-slate-400 mb-10">{role}</div>
                                    <div className="border-t border-slate-300 pt-1 text-xs text-slate-400">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
