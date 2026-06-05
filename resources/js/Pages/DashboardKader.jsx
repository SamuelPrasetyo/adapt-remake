/*
 * ============================================================================
 * [DEPRECATED / TIDAK DIPAKAI LAGI]
 * ----------------------------------------------------------------------------
 * Halaman Dashboard Kader sekarang disamakan dengan "Kader Saya / Detail"
 * (resources/js/Pages/KaderSaya/Detail.jsx) yang dilihat Admin & Mentor.
 *
 * Controller DashboardController::dashboard_kader() TIDAK lagi me-render
 * page 'DashboardKader' ini — ia memanggil KaderSayaController::show().
 * Sehingga seluruh kode di bawah sudah non-aktif (dead code).
 *
 * Sengaja TIDAK dihapus agar bisa dipakai kembali bila diperlukan.
 * Hapus file ini bila sudah dipastikan tidak dibutuhkan.
 * ============================================================================
 */
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

/* ── SVG Line Chart ─────────────────────────────────────────── */
function LineChart({ labels, datasets, height = 260 }) {
    const [tooltip, setTooltip] = useState(null);

    const W = 600, H = height;
    const PAD = { top: 20, right: 24, bottom: 48, left: 36 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    const allValues = datasets.flatMap((d) => d.data);
    const minV = 0;
    const maxV = Math.max(10, ...allValues);
    const GRID_LINES = 5;

    const xScale = (i) => PAD.left + (labels.length > 1 ? (i / (labels.length - 1)) * cW : cW / 2);
    const yScale = (v) => PAD.top + cH - ((v - minV) / (maxV - minV)) * cH;

    const pointPath = (data) =>
        data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');

    const gridVals = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
        minV + ((maxV - minV) / GRID_LINES) * i
    );

    return (
        <div className="relative w-full overflow-x-auto">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ minWidth: 320 }}
                onMouseLeave={() => setTooltip(null)}
            >
                {/* Grid lines */}
                {gridVals.map((v) => {
                    const y = yScale(v);
                    return (
                        <g key={v}>
                            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
                            <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                                fontSize="9" fill="#94a3b8">{v % 1 === 0 ? v : v.toFixed(1)}</text>
                        </g>
                    );
                })}

                {/* X axis labels */}
                {labels.map((lbl, i) => (
                    <text key={i} x={xScale(i)} y={H - PAD.bottom + 14}
                        textAnchor="middle" fontSize="9" fill="#64748b">{lbl}</text>
                ))}

                {/* X axis title */}
                <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" letterSpacing="0.5">
                    TIME SPENT (BIWEEK)
                </text>

                {/* Lines */}
                {datasets.map((ds) => (
                    <path key={ds.label} d={pointPath(ds.data)}
                        fill="none" stroke={ds.color} strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                ))}

                {/* Dots + hover areas */}
                {labels.map((lbl, i) => (
                    <g key={i}
                        onMouseEnter={() => setTooltip({ x: xScale(i), y: Math.min(...datasets.map(d => yScale(d.data[i]))), i, lbl })}
                    >
                        <circle cx={xScale(i)} cy={0} r={14} fill="transparent"
                            style={{ cursor: 'crosshair' }} transform={`translate(0,${PAD.top + cH / 2 - PAD.top / 2})`} />
                        {datasets.map((ds) => (
                            <circle key={ds.label}
                                cx={xScale(i)} cy={yScale(ds.data[i])} r="4"
                                fill="white" stroke={ds.color} strokeWidth="2" />
                        ))}
                    </g>
                ))}

                {/* Tooltip */}
                {tooltip && (() => {
                    const bx = tooltip.x + 10;
                    const adjustedBx = bx + 120 > W - PAD.right ? tooltip.x - 130 : bx;
                    const by = PAD.top + 10;
                    const rowH = 16;
                    const bh = 18 + datasets.length * rowH;
                    return (
                        <g>
                            <rect x={adjustedBx} y={by} width={120} height={bh}
                                rx="6" fill="white" stroke="#e2e8f0" strokeWidth="1"
                                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))' }} />
                            <text x={adjustedBx + 8} y={by + 13} fontSize="9" fill="#475569" fontWeight="600">
                                Week {tooltip.lbl}
                            </text>
                            {datasets.map((ds, di) => (
                                <g key={ds.label}>
                                    <circle cx={adjustedBx + 12} cy={by + 13 + (di + 1) * rowH - 4}
                                        r="4" fill={ds.color} />
                                    <text x={adjustedBx + 22} y={by + 13 + (di + 1) * rowH}
                                        fontSize="9" fill="#475569">
                                        {ds.label}: <tspan fontWeight="600">{Number(ds.data[tooltip.i]).toFixed(2)}</tspan>
                                    </text>
                                </g>
                            ))}
                        </g>
                    );
                })()}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
                {datasets.map((ds) => (
                    <div key={ds.label} className="flex items-center gap-1.5">
                        <span className="w-6 h-0.5 rounded-full inline-block" style={{ backgroundColor: ds.color }} />
                        <span className="text-xs text-slate-500">{ds.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function DashboardKader({ week = [], avg = {}, learningG = {}, kkm = [], kaderInfo = {} }) {
    const reportWeeks = Object.keys(avg).map(Number).sort((a, b) => a - b);

    const rows = reportWeeks.map((w) => ({
        week: w,
        aveScore: avg[w] ?? 0,
        learningGrowth: learningG[w] ?? 0,
        batasNormal: 7,
    }));

    const chartLabels = reportWeeks;
    const avgData     = reportWeeks.map((w) => avg[w] ?? 0);
    const lgData      = reportWeeks.map((w) => learningG[w] ?? 0);
    const kkmData     = reportWeeks.map(() => 7);

    const datasets = [
        { label: 'Ave Score',      data: avgData,  color: '#22c55e' },
        { label: 'Learning Growth', data: lgData,  color: '#f59e0b' },
        { label: 'Batas Normal',   data: kkmData,  color: '#94a3b8' },
    ];

    return (
        <AppLayout title="DASHBOARD" breadcrumb="Dashboard Kader">
            {/* Profile card — simplified */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {kaderInfo.nama?.charAt(0)?.toUpperCase() || 'K'}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-base leading-tight">{kaderInfo.nama || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">NIK: {kaderInfo.nik || '—'}</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Learning Growth card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-linear-to-r from-sky-500 to-cyan-400 px-6 py-3.5">
                    <h5 className="text-center font-bold text-white tracking-widest text-sm uppercase">
                        Dashboard Learning Growth (Development)
                    </h5>
                </div>

                <div className="p-6">
                    {rows.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-16">Belum ada data penilaian.</p>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* ── Table ── */}
                            <div className="w-full lg:w-64 shrink-0">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rekap Data</p>
                                <div className="rounded-xl overflow-hidden border border-slate-200">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-center">Week</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-center">Ave Score</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-center leading-tight">Learning<br/>Growth</th>
                                                <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 text-center leading-tight">Batas<br/>Normal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rows.map((r, idx) => {
                                                const aboveKkm = r.aveScore >= r.batasNormal;
                                                return (
                                                    <tr key={r.week} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-xs font-semibold text-slate-700">{r.week}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${aboveKkm ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                                {r.aveScore}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-xs text-amber-600 font-semibold">{r.learningGrowth}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="text-xs text-slate-400 font-medium">{r.batasNormal}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Legend pills below table */}
                                <div className="mt-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border-2 border-emerald-400 shrink-0" />
                                        Ave Score ≥ KKM
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-100 border-2 border-red-400 shrink-0" />
                                        Ave Score &lt; KKM
                                    </div>
                                </div>
                            </div>

                            {/* ── Chart ── */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Grafik Perkembangan</p>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                    <LineChart labels={chartLabels} datasets={datasets} />
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
