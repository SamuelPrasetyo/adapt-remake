import { useEffect, useRef } from "react";
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

export default function LearningGrowthTab({ faseGroups, weeklyData, cohortMap }) {
    const chartRef      = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || weeklyData.length === 0) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const labels = weeklyData.map((d) => d.week);
        const scores = weeklyData.map((d) => d.score);
        const cohort = labels.map((l) => cohortMap[l] ?? null);

        chartInstance.current = new Chart(chartRef.current, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Kader ini",
                        data: scores,
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59,130,246,0.08)",
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        spanGaps: true,
                    },
                    {
                        label: "Rata-rata Kohort",
                        data: cohort,
                        borderColor: "#94a3b8",
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        tension: 0.4,
                        pointRadius: 0,
                        spanGaps: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: { mode: "index", intersect: false },
                },
                scales: {
                    y: { min: 0, max: 100, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
            },
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [weeklyData, cohortMap]);

    return (
        <div className="space-y-6">
            {/* Fase summary cards */}
            <div className={`grid grid-cols-1 gap-4 ${faseGroups.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
                {faseGroups.map((fg, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    return (
                        <div key={fg.fase} className={`rounded-xl border p-4 ${pal.bg} ${pal.border}`}>
                            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pal.text}`}>{fg.fase}</div>
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

            {/* Weekly score chart */}
            {weeklyData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">
                        Learning Growth — Avg Score per Minggu
                    </h3>
                    <div style={{ height: 220 }}>
                        <canvas ref={chartRef} />
                    </div>
                </div>
            )}

            {/* Per-modul detail by fase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faseGroups.map((fg, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    return (
                        <div key={fg.fase} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className={`px-5 py-3 flex items-center justify-between ${pal.bg} border-b ${pal.border}`}>
                                <span className={`text-sm font-semibold ${pal.text}`}>{fg.fase}</span>
                                {fg.avg_score != null && (
                                    <span className="text-sm text-slate-500">
                                        Avg: <span className={`font-bold ${pal.text}`}>{fg.avg_score}</span>
                                    </span>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100">
                                {fg.moduls.map((m, mi) => (
                                    <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${pal.bar}`}>
                                            {mi + 1}
                                        </span>
                                        <span className="text-sm text-slate-800 truncate flex-1 min-w-0">{m.nama}</span>
                                        <div className="flex items-center gap-2 shrink-0 w-28">
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
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
