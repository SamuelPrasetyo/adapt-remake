import { useEffect, useRef, useState, useMemo } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
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

const STATUS_META = {
    on_track: {
        label: "On Track",
        cls: "bg-emerald-100 text-emerald-700 border-emerald-300",
    },
    perlu_perhatian: {
        label: "Perlu Perhatian",
        cls: "bg-amber-100 text-amber-700 border-amber-300",
    },
    kritis: {
        label: "Kritis",
        cls: "bg-rose-100 text-rose-700 border-rose-300",
    },
};

const FASE_COLORS = ["purple", "blue", "orange", "teal", "pink"];
const FASE_PALETTE = [
    {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        bar: "bg-purple-500",
        badge: "bg-purple-100 text-purple-700",
    },
    {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        bar: "bg-blue-500",
        badge: "bg-blue-100 text-blue-700",
    },
    {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        bar: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700",
    },
    {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-700",
        bar: "bg-teal-500",
        badge: "bg-teal-100 text-teal-700",
    },
    {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-700",
        bar: "bg-pink-500",
        badge: "bg-pink-100 text-pink-700",
    },
];

function ScoreColor(score) {
    if (score == null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
}

function CheckIcon({ done }) {
    return done ? (
        <svg
            className="w-3.5 h-3.5 text-emerald-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 13l4 4L19 7"
            />
        </svg>
    ) : (
        <svg
            className="w-3.5 h-3.5 text-slate-300 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
        </svg>
    );
}

const BULAN_ID = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

const MOTIVASI_OPTIONS = [
    "Sangat Kurang",
    "Kurang",
    "Cukup",
    "Baik",
    "Sangat Baik",
];
const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

function Stars({ value, max = 5 }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${
                        i < value ? "text-amber-400" : "text-slate-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            {value != null && (
                <span className="ml-1 text-xs text-slate-500">{value}/5</span>
            )}
        </div>
    );
}

const MOTIVASI_COLOR = {
    'Sangat Kurang': 'bg-rose-50 text-rose-700 border-rose-200',
    'Kurang':        'bg-orange-50 text-orange-700 border-orange-200',
    'Cukup':         'bg-amber-50 text-amber-700 border-amber-200',
    'Baik':          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Sangat Baik':   'bg-teal-50 text-teal-700 border-teal-200',
};

function AccordionSection({ icon, title, count, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-slate-500">{icon}</span>
                    <span className="text-sm font-semibold text-slate-800">{title}</span>
                    {count != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                            {count}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-5 py-4">
                    {children}
                </div>
            )}
        </div>
    );
}

function EmptyAccordion({ label }) {
    return (
        <p className="text-sm text-slate-400 text-center py-8">{label}</p>
    );
}

function RefleksiAccordion({ refleksi }) {
    if (refleksi.length === 0) return <EmptyAccordion label="Belum ada refleksi dari kader." />;
    return (
        <div className="space-y-3">
            {refleksi.map(r => (
                <div key={r.week_id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">Week {r.angka_week}</span>
                            {r.bulan && r.tahun && (
                                <span className="text-xs text-slate-400">{BULAN_ID[r.bulan]} {r.tahun}</span>
                            )}
                        </div>
                        {r.motivasi != null && <Stars value={r.motivasi} />}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[['Yang Dipelajari', r.dipelajari, 'bg-blue-50 border-blue-100'],
                          ['Tantangan',        r.tantangan,  'bg-amber-50 border-amber-100'],
                          ['Rencana Improvement', r.rencana, 'bg-emerald-50 border-emerald-100']
                        ].map(([label, val, cls]) => val ? (
                            <div key={label} className={`rounded-lg border p-3 ${cls}`}>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                                <p className="text-xs text-slate-700 leading-relaxed">"{val}"</p>
                            </div>
                        ) : null)}
                    </div>
                </div>
            ))}
        </div>
    );
}

function RiwayatAccordion({ mentorFeedbackList }) {
    if (mentorFeedbackList.length === 0) return <EmptyAccordion label="Belum ada feedback yang dikirim." />;
    return (
        <div className="space-y-3">
            {mentorFeedbackList.map(fb => (
                <div key={fb.week_id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">Week {fb.angka_week}</span>
                            {fb.bulan && fb.tahun && (
                                <span className="text-xs text-slate-400">{BULAN_ID[fb.bulan]} {fb.tahun}</span>
                            )}
                            {fb.nama_mentor && (
                                <span className="text-xs text-slate-400">· {fb.nama_mentor}</span>
                            )}
                        </div>
                        {fb.motivasi && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${MOTIVASI_COLOR[fb.motivasi] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {fb.motivasi}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        {[['Routine Job', fb.routine_job], ['Assignment', fb.assignment],
                          ['Pemahaman SOP', fb.pemahaman_sop], ['Project', fb.project]
                        ].map(([label, val]) => (
                            <div key={label} className="text-center bg-white rounded-lg py-2 px-2 border border-slate-100">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                                <p className={`text-xl font-bold ${val != null ? ScoreColor(parseInt(val) * 10) : 'text-slate-300'}`}>
                                    {val ?? '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                    {fb.area && (
                        <div className="bg-white rounded-lg border border-slate-100 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Area yang Perlu Ditingkatkan</p>
                            <p className="text-xs text-slate-700 leading-relaxed">"{fb.area}"</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function KirimFeedbackForm({ kader, weeks, mentorName, kaderId }) {
    const { props } = usePage();
    const flash = props.feedbackSuccess;

    const [form, setForm] = useState({ id_week: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(!!flash);

    const weekGroups = useMemo(() => {
        const groups = {};
        (weeks || []).forEach(w => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push(w);
        });
        return Object.values(groups);
    }, [weeks]);

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/kader-saya/${kaderId}/feedback`, form, {
            preserveScroll: true,
            onSuccess: () => { setSent(true); setForm({ id_week: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' }); },
            onFinish:  () => setSubmitting(false),
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Kirim Feedback ke Kader</h3>
                    <p className="text-xs text-slate-400">Penilaian mingguan untuk {kader?.nama}</p>
                </div>
            </div>

            {sent && (
                <div className="mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Feedback berhasil dikirim!
                </div>
            )}

            {/* Mentor → Kader */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Mentor</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{mentorName}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Kader</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{kader?.nama}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Week */}
                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Week <span className="text-rose-500">*</span>
                    </label>
                    <select required value={form.id_week} onChange={e => handleChange('id_week', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                        <option value="">--Pilih Week--</option>
                        {weekGroups.map(g => (
                            <optgroup key={g.label} label={g.label}>
                                {g.items.map(w => (
                                    <option key={w.id_week} value={w.id_week}>
                                        {BULAN_ID[w.bulan]} W{w.angka_week}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Penilaian Kinerja */}
                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">Penilaian Kinerja</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[['p1','Routine Job'],['p2','Assignment'],['p3','Pemahaman SOP'],['p4','Project']].map(([field, label]) => (
                            <div key={field}>
                                <label className="text-xs text-slate-500 block mb-1">{label}</label>
                                <select value={form[field]} onChange={e => handleChange(field, e.target.value)}
                                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                                    <option value="">—</option>
                                    {SCORE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Motivasi */}
                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Motivasi &amp; Keterlibatan</label>
                    <select value={form.p5} onChange={e => handleChange('p5', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                        <option value="">--Pilih Nilai--</option>
                        {MOTIVASI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                {/* Area */}
                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Area yang Perlu Ditingkatkan</label>
                    <textarea rows={4} value={form.p6} onChange={e => handleChange('p6', e.target.value)}
                        placeholder="Tuliskan area yang perlu ditingkatkan minggu depan..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none" />
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {submitting ? 'Mengirim...' : 'Kirim Feedback'}
                </button>
            </form>
        </div>
    );
}

function FeedbackTab({ kader, weeks, refleksi, mentorFeedbackList = [], mentorName, kaderId }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start" style={{ alignItems: 'start' }}>
            {/* Kiri: Form kirim feedback */}
            <KirimFeedbackForm
                kader={kader}
                weeks={weeks}
                mentorName={mentorName}
                kaderId={kaderId}
            />

            {/* Kanan: Accordion refleksi + riwayat */}
            <div className="space-y-3">
                <AccordionSection
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    title="Refleksi Kader"
                    count={refleksi.length}
                >
                    <RefleksiAccordion refleksi={refleksi} />
                </AccordionSection>

                <AccordionSection
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    }
                    title="Feedback Dikirim"
                    count={mentorFeedbackList.length}
                >
                    <RiwayatAccordion mentorFeedbackList={mentorFeedbackList} />
                </AccordionSection>
            </div>
        </div>
    );
}

function LearningGrowthTab({
    faseGroups,
    overallProgress,
    avgScore,
    weeklyData,
    cohortMap,
}) {
    const chartRef = useRef(null);
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
                    legend: {
                        position: "top",
                        labels: { boxWidth: 12, font: { size: 11 } },
                    },
                    tooltip: { mode: "index", intersect: false },
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: "#f1f5f9" },
                        ticks: { font: { size: 11 } },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [weeklyData, cohortMap]);

    return (
        <div className="space-y-6">
            {/* Fase cards */}
            <div
                className={`grid grid-cols-1 gap-4 ${
                    faseGroups.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""
                }`}
            >
                {faseGroups.map((fg, idx) => {
                    const pal = FASE_PALETTE[idx % FASE_PALETTE.length];
                    return (
                        <div
                            key={fg.fase}
                            className={`rounded-xl border p-4 ${pal.bg} ${pal.border}`}
                        >
                            <div
                                className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pal.text}`}
                            >
                                {fg.fase}
                            </div>
                            <div
                                className={`text-3xl font-bold mb-2 ${pal.text}`}
                            >
                                {fg.progress}%
                            </div>
                            <div
                                className={`h-1.5 rounded-full bg-white/60 overflow-hidden mb-2`}
                            >
                                <div
                                    className={`h-full rounded-full ${pal.bar}`}
                                    style={{ width: `${fg.progress}%` }}
                                />
                            </div>
                            <div className="text-xs text-slate-600">
                                {fg.done}/{fg.total} modul selesai
                                {fg.avg_score != null && (
                                    <>
                                        {" "}
                                        · Avg{" "}
                                        <span
                                            className={`font-semibold ${ScoreColor(
                                                fg.avg_score
                                            )}`}
                                        >
                                            {fg.avg_score}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly chart */}
            {weeklyData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Learning Growth — Avg Score per Minggu
                        </h3>
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
                        <div
                            key={fg.fase}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                        >
                            <div
                                className={`px-5 py-3 flex items-center justify-between ${pal.bg} border-b ${pal.border}`}
                            >
                                <span
                                    className={`text-sm font-semibold ${pal.text}`}
                                >
                                    {fg.fase}
                                </span>
                                {fg.avg_score != null && (
                                    <span className="text-sm text-slate-500">
                                        Avg:{" "}
                                        <span
                                            className={`font-bold ${pal.text}`}
                                        >
                                            {fg.avg_score}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100">
                                {fg.moduls.map((m, mi) => (
                                    <div
                                        key={m.id}
                                        className="px-5 py-3 flex items-center gap-3"
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${pal.bar}`}
                                        >
                                            {mi + 1}
                                        </span>
                                        <span className="text-sm text-slate-800 truncate flex-1 min-w-0">
                                            {m.nama}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0 w-28">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pal.bar}`}
                                                    style={{
                                                        width: `${
                                                            m.score ?? 0
                                                        }%`,
                                                    }}
                                                />
                                            </div>
                                            {m.score != null ? (
                                                <span
                                                    className={`text-sm font-bold w-7 text-right ${ScoreColor(
                                                        m.score
                                                    )}`}
                                                >
                                                    {m.score}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-300 w-7 text-right">
                                                    —
                                                </span>
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
    status = "kritis",
    totalModuls = 0,
    weeklyData = [],
    cohortMap = {},
    currentWeek = 0,
    totalWeeks = 0,
    weeks = [],
    refleksi = [],
    mentorFeedbackList = [],
    mentorName = "",
}) {
    const validTabs = ["learning", "feedback"];
    const hashTab = typeof window !== "undefined"
        ? window.location.hash.replace("#", "")
        : "";
    const [tab, setTab] = useState(validTabs.includes(hashTab) ? hashTab : "learning");

    const handleTabChange = (id) => {
        setTab(id);
        window.location.hash = id;
    };
    const meta = STATUS_META[status] || STATUS_META.on_track;

    const initials = (kader?.nama || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("");

    const doneModuls = faseGroups.reduce((acc, fg) => acc + fg.done, 0);

    const kaderId = kader?.id;

    const tabs = [
        {
            id: "learning",
            label: "Learning Growth",
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            id: "feedback",
            label: "Feedback",
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            ),
        },
    ];

    return (
        <AppLayout title="KADER SAYA" breadcrumb="Kader Saya / Detail">
            <div className="mb-5">
                <Link
                    href="/kader-saya"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                        />
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
                            <h1 className="text-xl font-bold text-slate-900">
                                {kader?.nama}
                            </h1>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}
                            >
                                {meta.label}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            {kader?.divisi_name && (
                                <span>{kader.divisi_name}</span>
                            )}
                            {kader?.batch_name && (
                                <span>
                                    Batch {kader.batch_name}
                                    {kader.batch_year
                                        ? " " + kader.batch_year
                                        : ""}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            {kader?.mentor_name && (
                                <span>
                                    Mentor:{" "}
                                    <span className="font-medium text-slate-700">
                                        {kader.mentor_name}
                                    </span>
                                </span>
                            )}
                            {totalWeeks > 0 && (
                                <span>
                                    Week:{" "}
                                    <span className="font-medium text-slate-700">
                                        {currentWeek} / {totalWeeks}
                                    </span>
                                </span>
                            )}
                            {totalModuls > 0 && (
                                <span>
                                    Modul:{" "}
                                    <span className="font-medium text-slate-700">
                                        {doneModuls}/{totalModuls} selesai
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {overallProgress}%
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Overall Progress
                        </div>
                    </div>
                    {faseGroups.map((fg, idx) => (
                        <div key={fg.fase} className="text-center">
                            <div
                                className={`text-2xl font-bold ${
                                    [
                                        "text-purple-600",
                                        "text-blue-600",
                                        "text-amber-600",
                                        "text-teal-600",
                                    ][idx % 4]
                                }`}
                            >
                                {fg.avg_score != null ? fg.avg_score : "—"}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Avg {fg.fase}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-1">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                                tab === t.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {tab === "learning" && (
                <LearningGrowthTab
                    faseGroups={faseGroups}
                    overallProgress={overallProgress}
                    avgScore={avgScore}
                    weeklyData={weeklyData}
                    cohortMap={cohortMap}
                />
            )}
            {tab === "feedback" && (
                <FeedbackTab
                    kader={kader}
                    weeks={weeks}
                    refleksi={refleksi}
                    mentorFeedbackList={mentorFeedbackList}
                    mentorName={mentorName}
                    kaderId={kaderId}
                />
            )}
        </AppLayout>
    );
}
