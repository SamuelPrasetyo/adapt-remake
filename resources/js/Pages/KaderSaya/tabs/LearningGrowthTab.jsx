import { getFaseLabel, getFaseNum } from "@/constants/fase";

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

export default function LearningGrowthTab({ faseGroups, allFases = [] }) {
    const displayFases = allFases.length > 0 ? allFases : faseGroups.map((fg) => fg.fase);
    const fgByFase = (fase) => faseGroups.find((g) => faseNum(g.fase) === faseNum(fase));

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
                                            {/* Angka per modul = Skor Modul (60% Post Test + 40% Post Activity; satu
                                                komponen saja → 100%). BUKAN LGS/growth_score — itu khusus grafik
                                                Learning Growth di Report. */}
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
