import { useEffect, useRef } from "react";
import { getFaseLabel, getFaseNum } from "@/constants/fase";
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

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Legend,
    Tooltip
);

export const FASE_PALETTE = [
    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   bar: "bg-blue-500",   badge: "bg-blue-100 text-blue-700"   },
    { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  bar: "bg-amber-500",  badge: "bg-amber-100 text-amber-700"  },
    { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700",   bar: "bg-teal-500",   badge: "bg-teal-100 text-teal-700"   },
    { bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-700",   bar: "bg-pink-500",   badge: "bg-pink-100 text-pink-700"   },
];

export function scoreColor(score) {
    if (score == null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
}

const faseNum = getFaseNum;
const faseLabel = getFaseLabel;

// Growth = selisih skor modul terakhir vs pertama yang sudah dinilai dalam satu rangkaian.
function growthOf(points) {
    const scored = points.filter((p) => p.score != null);
    if (scored.length < 2) return null;
    return scored[scored.length - 1].score - scored[0].score;
}

function GrowthCard({ title, fases }) {
    return (
        <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500 mb-2">{title}</div>
            <div className="flex flex-wrap gap-1.5">
                {fases.map((f) => (
                    <span key={f.label} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${f.badge}`}>
                        {f.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function LearningGrowthTab({ faseGroups, allFases = [] }) {
    const displayFases = allFases.length > 0 ? allFases : faseGroups.map((fg) => fg.fase);
    const fgByFase = (fase) => faseGroups.find((g) => faseNum(g.fase) === faseNum(fase));

    const chartRef      = useRef(null);
    const chartInstance = useRef(null);

    // Titik grafik = Skor Akhir per modul (bukan rata-rata fase) agar naik-turunnya terlihat.
    // In-Class = modul Foundation (F1..) disambung modul Monthly Training/Leadership (L1..)
    // dalam SATU garis; Self-Learning (S1..) jadi garis terpisah.
    const modulsOf = (n) => fgByFase(n)?.moduls ?? [];
    const inClassPoints = [
        ...modulsOf(1).map((m, i) => ({ label: `F${i + 1}`, nama: m.nama, score: m.score })),
        ...modulsOf(3).map((m, i) => ({ label: `L${i + 1}`, nama: m.nama, score: m.score })),
    ];
    const selfPoints = modulsOf(2).map((m, i) => ({ label: `S${i + 1}`, nama: m.nama, score: m.score }));

    const allPoints = [...inClassPoints, ...selfPoints];

    useEffect(() => {
        if (!chartRef.current || allPoints.length === 0) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const labels  = allPoints.map((p) => p.label);
        const inClass = allPoints.map((p, i) => (i < inClassPoints.length ? p.score : null));
        const selfL   = allPoints.map((p, i) => (i >= inClassPoints.length ? p.score : null));

        // Garis pemisah putus-putus antara segmen In-Class dan Self-Learning (seperti mock).
        const dividerPlugin = {
            id: "segmentDivider",
            afterDraw(chart) {
                if (inClassPoints.length === 0 || selfPoints.length === 0) return;
                const xScale = chart.scales.x;
                const x = (xScale.getPixelForValue(inClassPoints.length - 1)
                         + xScale.getPixelForValue(inClassPoints.length)) / 2;
                const { top, bottom } = chart.chartArea;
                const ctx = chart.ctx;
                ctx.save();
                ctx.strokeStyle = "#cbd5e1";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
                ctx.stroke();
                ctx.restore();
            },
        };

        chartInstance.current = new Chart(chartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "In-Class (Foundation + Leadership)",
                        data: inClass,
                        borderColor: "#3b82f6",
                        backgroundColor: "#3b82f6",
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        spanGaps: true,
                        clip: false,
                    },
                    {
                        label: "Self-Learning",
                        data: selfL,
                        borderColor: "#10b981",
                        backgroundColor: "#10b981",
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        spanGaps: true,
                        clip: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top", labels: { boxWidth: 12, font: { size: 13 } } },
                    tooltip: {
                        callbacks: {
                            title: (items) => items.map((it) => allPoints[it.dataIndex]?.nama ?? it.label),
                        },
                    },
                },
                layout: { padding: { top: 8, bottom: 0 } },
                scales: {
                    y: { min: 0, max: 100, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
            },
            plugins: [dividerPlugin],
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [JSON.stringify(allPoints), inClassPoints.length]);

    return (
        <div className="space-y-6">
            {/* Fase summary cards */}
            <div className={`grid grid-cols-1 gap-4 ${displayFases.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                {displayFases.map((fase, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    const fg = fgByFase(fase);
                    const label = faseLabel(fase);
                    if (!fg) {
                        return (
                            <div key={fase} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                                    <div className="relative group">
                                        <svg className="w-4 h-4 text-amber-500 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                                            Modul {label} belum di-assign ke kader ini
                                            <div className="absolute bottom-full right-2 border-4 border-transparent border-b-slate-800" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-3xl font-bold mb-2 text-slate-400">—</div>
                                <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mb-2" />
                                <div className="text-xs text-slate-500">Belum di-assign</div>
                            </div>
                        );
                    }
                    return (
                        <div key={fase} className={`rounded-xl border p-4 ${pal.bg} ${pal.border}`}>
                            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pal.text}`}>{label}</div>
                            <div className={`text-3xl font-bold mb-2 ${pal.text}`}>{fg.progress}%</div>
                            <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mb-2">
                                <div className={`h-full rounded-full ${pal.bar}`} style={{ width: `${fg.progress}%` }} />
                            </div>
                            <div className="text-xs text-slate-600">
                                {fg.done}/{fg.total} modul selesai
                                {fg.avg_score != null && (
                                    <> · Avg <span className={`font-semibold ${scoreColor(fg.avg_score)}`}>{fg.avg_score}</span></>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Learning Growth per modul: In-Class (Foundation + Leadership) & Self-Learning */}
            {allPoints.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">
                        Learning Growth — Skor Akhir per Modul
                    </h3>
                    <div style={{ height: 240 }}>
                        <canvas ref={chartRef} />
                    </div>
                    {/* <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <GrowthCard
                            title="In-Class"
                            fases={[
                                { label: "Foundation (Fase 1)", badge: "bg-purple-100 text-purple-700" },
                                { label: "Leadership / Monthly Training (Fase 3)", badge: "bg-amber-100 text-amber-700" },
                            ]}
                        />
                        <GrowthCard
                            title="Self-Learning"
                            fases={[
                                { label: "Self-Learning (Fase 2)", badge: "bg-blue-100 text-blue-700" },
                            ]}
                        />
                    </div> */}
                </div>
            )}

            {/* Per-modul detail by fase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayFases.map((fase, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    const fg = fgByFase(fase);
                    const label = faseLabel(fase);
                    if (!fg) {
                        return (
                            <div key={fase} className="bg-white rounded-xl border border-dashed border-slate-300">
                                <div className="px-5 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-200 rounded-t-xl">
                                    <span className="text-sm font-semibold text-slate-500">{label}</span>
                                    <div className="relative group">
                                        <svg className="w-4 h-4 text-amber-500 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                                            Modul {label} belum di-assign ke kader ini
                                            <div className="absolute bottom-full right-2 border-4 border-transparent border-b-slate-800" />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-6 text-center text-sm text-slate-400">
                                    Belum ada modul {label} yang di-assign
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={fase} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className={`px-5 py-3 flex items-center justify-between ${pal.bg} border-b ${pal.border}`}>
                                <span className={`text-sm font-semibold ${pal.text}`}>{label}</span>
                                {fg.avg_score != null && (
                                    <span className="text-sm text-slate-500">
                                        Avg: <span className={`font-bold ${pal.text}`}>{fg.avg_score}</span>
                                    </span>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100">
                                {fg.moduls.map((m, mi) => (
                                    <div key={m.id} className="px-5 py-3 space-y-2">
                                        {/* baris atas: badge + nama + skor bar */}
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${pal.bar}`}>
                                                {mi + 1}
                                            </span>
                                            <span className="text-sm text-slate-800 truncate flex-1 min-w-0">{m.nama}</span>
                                            <div className="flex items-center gap-2 shrink-0 w-24">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${pal.bar}`} style={{ width: `${m.score ?? 0}%` }} />
                                                </div>
                                                {m.score != null ? (
                                                    <span className={`text-sm font-bold w-7 text-right ${scoreColor(m.score)}`}>{m.score}</span>
                                                ) : (
                                                    <span className="text-sm text-slate-300 w-7 text-right">—</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* baris bawah: kartu skor equal-width 1 baris */}
                                        {(m.need_pre || m.has_test || m.has_post_activity) && (
                                            <div className="flex items-stretch gap-2">
                                                {m.need_pre && (
                                                    <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-blue-50 border border-blue-200 py-2 gap-1">
                                                        <span className="text-[10px] font-medium text-blue-600 leading-none">Pre Test</span>
                                                        <span className={`text-sm font-bold leading-none ${scoreColor(m.pre_score)}`}>
                                                            {m.pre_score != null ? m.pre_score : '—'}
                                                        </span>
                                                    </div>
                                                )}
                                                {m.has_test && (
                                                    <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-amber-50 border border-amber-200 py-2 gap-1">
                                                        <span className="text-[10px] font-medium text-amber-600 leading-none">Post Test</span>
                                                        <span className={`text-sm font-bold leading-none ${scoreColor(m.post_score)}`}>
                                                            {m.post_score != null ? m.post_score : '—'}
                                                        </span>
                                                    </div>
                                                )}
                                                {m.has_post_activity && (
                                                    <div className="flex-1 flex flex-col items-center justify-center rounded-lg bg-rose-50 border border-rose-200 py-2 gap-1">
                                                        <span className="text-[10px] font-medium text-rose-600 leading-none">Post Activity</span>
                                                        <span className={`text-sm font-bold leading-none ${scoreColor(m.pa_score)}`}>
                                                            {m.pa_score != null ? m.pa_score : '—'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
