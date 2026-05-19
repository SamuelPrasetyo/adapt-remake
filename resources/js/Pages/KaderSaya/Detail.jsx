import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Chart, LineController, LineElement, PointElement,
    LinearScale, CategoryScale, Filler, Legend, Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

const STATUS_META = {
    on_track:        { label: 'On Track',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    perlu_perhatian: { label: 'Perlu Perhatian', cls: 'bg-amber-100 text-amber-700 border-amber-300'       },
    kritis:          { label: 'Kritis',          cls: 'bg-rose-100 text-rose-700 border-rose-300'          },
};

const FASE_COLORS = ['purple', 'blue', 'orange', 'teal', 'pink'];
const FASE_PALETTE = [
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   bar: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700'     },
    { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  bar: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700'   },
    { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   bar: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700'     },
    { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   bar: 'bg-pink-500',   badge: 'bg-pink-100 text-pink-700'     },
];

function ScoreColor(score) {
    if (score == null) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
}

function CheckIcon({ done }) {
    return done
        ? <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /></svg>;
}

function LearningGrowthTab({ faseGroups, overallProgress, avgScore, weeklyData, cohortMap }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || weeklyData.length === 0) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const labels    = weeklyData.map(d => d.week);
        const scores    = weeklyData.map(d => d.score);
        const cohort    = labels.map(l => cohortMap[l] ?? null);

        chartInstance.current = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Kader ini',
                        data: scores,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.08)',
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        spanGaps: true,
                    },
                    {
                        label: 'Rata-rata Kohort',
                        data: cohort,
                        borderColor: '#94a3b8',
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
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: { mode: 'index', intersect: false },
                },
                scales: {
                    y: { min: 0, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
            },
        });

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [weeklyData, cohortMap]);

    return (
        <div className="space-y-6">
            {/* Fase cards */}
            <div className={`grid grid-cols-1 gap-4 ${faseGroups.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
                {faseGroups.map((fg, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    return (
                        <div key={fg.fase} className={`rounded-xl border p-4 ${pal.bg} ${pal.border}`}>
                            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pal.text}`}>{fg.fase}</div>
                            <div className={`text-3xl font-bold mb-2 ${pal.text}`}>{fg.progress}%</div>
                            <div className={`h-1.5 rounded-full bg-white/60 overflow-hidden mb-2`}>
                                <div className={`h-full rounded-full ${pal.bar}`} style={{ width: `${fg.progress}%` }} />
                            </div>
                            <div className="text-xs text-slate-600">
                                {fg.done}/{fg.total} modul selesai
                                {fg.avg_score != null && <> · Avg <span className={`font-semibold ${ScoreColor(fg.avg_score)}`}>{fg.avg_score}</span></>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly chart */}
            {weeklyData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800">Learning Growth — Avg Score per Minggu</h3>
                    </div>
                    <div style={{ height: 220 }}>
                        <canvas ref={chartRef} />
                    </div>
                </div>
            )}

            {/* Per-modul detail by fase — 2-column grid */}
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
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${pal.bar}`}>{mi + 1}</span>
                                        <span className="text-sm text-slate-800 truncate flex-1 min-w-0">{m.nama}</span>
                                        <div className="flex items-center gap-2 shrink-0 w-28">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pal.bar}`}
                                                    style={{ width: `${m.score ?? 0}%` }}
                                                />
                                            </div>
                                            {m.score != null ? (
                                                <span className={`text-sm font-bold w-7 text-right ${ScoreColor(m.score)}`}>{m.score}</span>
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

export default function KaderSayaDetail({
    kader,
    faseGroups = [],
    overallProgress = 0,
    avgScore,
    status = 'kritis',
    totalModuls = 0,
    weeklyData = [],
    cohortMap = {},
    currentWeek = 0,
    totalWeeks = 0,
}) {
    const [tab, setTab] = useState('learning');
    const meta = STATUS_META[status] || STATUS_META.on_track;

    const initials = (kader?.nama || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

    const doneModuls = faseGroups.reduce((acc, fg) => acc + fg.done, 0);

    const tabs = [
        { id: 'learning', label: 'Learning Growth' },
    ];

    return (
        <AppLayout title="KADER SAYA" breadcrumb="Kader Saya / Detail">
            <div className="mb-5">
                <Link
                    href="/kader-saya"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Daftar Kader
                </Link>
            </div>

            {/* Kader header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex flex-wrap items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900">{kader?.nama}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                                {meta.label}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            {kader?.divisi_name && <span>{kader.divisi_name}</span>}
                            {kader?.batch_name  && <span>Batch {kader.batch_name}{kader.batch_year ? ' ' + kader.batch_year : ''}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            {kader?.mentor_name && <span>Mentor: <span className="font-medium text-slate-700">{kader.mentor_name}</span></span>}
                            {totalWeeks > 0 && <span>Week: <span className="font-medium text-slate-700">{currentWeek} / {totalWeeks}</span></span>}
                            {totalModuls > 0 && <span>Modul: <span className="font-medium text-slate-700">{doneModuls}/{totalModuls} selesai</span></span>}
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
                        <div className="text-xs text-slate-500 mt-0.5">Overall Progress</div>
                    </div>
                    {faseGroups.map((fg, idx) => (
                        <div key={fg.fase} className="text-center">
                            <div className={`text-2xl font-bold ${['text-purple-600','text-blue-600','text-amber-600','text-teal-600'][idx % 4]}`}>
                                {fg.avg_score != null ? fg.avg_score : '—'}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">Avg {fg.fase}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-1">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                                tab === t.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {tab === 'learning' && (
                <LearningGrowthTab
                    faseGroups={faseGroups}
                    overallProgress={overallProgress}
                    avgScore={avgScore}
                    weeklyData={weeklyData}
                    cohortMap={cohortMap}
                />
            )}
        </AppLayout>
    );
}
