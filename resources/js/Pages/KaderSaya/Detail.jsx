import { useState } from "react";
import { Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { getFaseLabel, getFaseNum } from "@/constants/fase";
import LearningGrowthTab from "./tabs/LearningGrowthTab";
import FeedbackTab from "./tabs/FeedbackTab";
import PenilaianOjtTab from "./tabs/PenilaianOjtTab";
import PerjanjianKerjaTab from "./tabs/PerjanjianKerjaTab";

const STATUS_META = {
    on_track:        { label: "On Track",        cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    perlu_perhatian: { label: "Perlu Perhatian",  cls: "bg-amber-100 text-amber-700 border-amber-300"   },
    kritis:          { label: "Kritis",           cls: "bg-rose-100 text-rose-700 border-rose-300"      },
};

const TABS = [
    {
        id: "learning",
        label: "Overview",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
    },
    {
        id: "feedback",
        label: "Feedback",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ),
    },
    {
        id: "penilaian",
        label: "Penilaian OJT",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
    },
    {
        id: "perjanjian",
        label: "Perjanjian Kerja",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
];

const VALID_TABS = TABS.map((t) => t.id);

export default function KaderSayaDetail({
    kader,
    faseGroups = [],
    overallProgress = 0,
    fmcScore = null,
    status = "kritis",
    totalModuls = 0,
    avgFeedback = null,
    currentWeek = 0,
    totalWeeks = 0,
    weeks = [],
    weeksKader = [],
    refleksi = [],
    mentorFeedbackList = [],
    monthlyPeriods = [],
    monthlyFeedbackList = [],
    mentorName = "",
    perjanjianKerja = null,
    templatePerjanjianKerja = null,
    canUpload = false,
    penilaianList = [],
    penilaianSkorMap = {},
    penilaianKomentarMap = {},
    penilaianStructure = null,
    canEditPenilaian = false,
    allFases = [],
    kaderView = false,
    weeklyFeedback = null,
}) {
    const hashTab = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    const [tab, setTab] = useState(VALID_TABS.includes(hashTab) ? hashTab : "learning");

    const handleTabChange = (id) => {
        setTab(id);
        window.location.hash = id;
    };

    const meta     = STATUS_META[status] || STATUS_META.on_track;
    const initials = (kader?.nama || "?").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
    const doneModuls = faseGroups.reduce((acc, fg) => acc + fg.done, 0);
    const kaderId  = kader?.id;

    return (
        <AppLayout
            title={kaderView ? "DASHBOARD" : "KADER SAYA"}
            breadcrumb={kaderView ? "Dashboard Kader" : "Kader Saya / Detail"}
        >
            {/* Back button — hanya untuk Admin/Mentor (Kader tidak punya daftar kader) */}
            {!kaderView && (
                <div className="mb-5">
                    <Link href="/kader-saya"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Daftar Kader
                    </Link>
                </div>
            )}

            {/* Kader header card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex flex-wrap items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900">{kader?.nama}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                                {meta.label}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            {kader?.divisi_name && <span>{kader.divisi_name}</span>}
                            {kader?.batch_name  && <span>Batch {kader.batch_name}{kader.batch_year ? " " + kader.batch_year : ""}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            {kader?.mentor_name && (
                                <span>Mentor: <span className="font-medium text-slate-700">{kader.mentor_name}</span></span>
                            )}
                            {totalWeeks > 0 && (
                                <span>Week: <span className="font-medium text-slate-700">{currentWeek} / {totalWeeks}</span></span>
                            )}
                            {totalModuls > 0 && (
                                <span>Modul: <span className="font-medium text-slate-700">{doneModuls}/{totalModuls} selesai</span></span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
                    {allFases.map((fase, idx) => {
                        const faseKey = getFaseNum(fase);
                        const label = getFaseLabel(fase);
                        const fg = faseGroups.find((g) => getFaseNum(g.fase) === faseKey);
                        const colors = ["text-purple-600","text-blue-600","text-amber-600","text-teal-600"];
                        const notAssigned = !fg;
                        return (
                            <div key={fase} className="text-center">
                                {notAssigned ? (
                                    <div className="flex items-center justify-center gap-1">
                                        <div className={`text-2xl font-bold ${colors[idx % 4]}`}>—</div>
                                        <div className="relative group">
                                            <svg className="w-4 h-4 text-amber-500 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-44 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                                                Modul {label} belum di-assign ke kader ini
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`text-2xl font-bold ${colors[idx % 4]}`}>
                                        {fg.avg_score != null ? fg.avg_score : "—"}
                                    </div>
                                )}
                                <div className="text-xs text-slate-500 mt-0.5">Avg {label}</div>
                            </div>
                        );
                    })}
                    <div className="text-center" title="Final Score Penilaian OJT dari FMC terakhir yang sudah dinilai & di-approve">
                        <div className="text-2xl font-bold text-blue-600">
                            {fmcScore != null ? fmcScore : "—"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">FMC</div>
                    </div>
                    <div className="text-center" title="Rata-rata skor feedback mingguan, dinormalisasi ke skala 100">
                        <div className="text-2xl font-bold text-rose-600">
                            {avgFeedback != null ? Math.round(avgFeedback * 10) : "—"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">Avg Feedback</div>
                    </div>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-slate-200 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
                <div className="flex gap-1 min-w-max">
                    {TABS.filter((t) => !(kaderView && t.id === "perjanjian")).map((t) => (
                        <button key={t.id} onClick={() => handleTabChange(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                                tab === t.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}>
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            {tab === "learning" && (
                <LearningGrowthTab faseGroups={faseGroups} allFases={allFases} />
            )}
            {tab === "feedback" && (
                <FeedbackTab
                    kader={kader}
                    weeks={weeks}
                    weeksKader={weeksKader}
                    refleksi={refleksi}
                    mentorFeedbackList={mentorFeedbackList}
                    monthlyPeriods={monthlyPeriods}
                    monthlyFeedbackList={monthlyFeedbackList}
                    mentorName={mentorName}
                    kaderId={kaderId}
                    showFeedbackForm={!kaderView}
                    kaderView={kaderView}
                    weeklyFeedback={weeklyFeedback}
                />
            )}
            {tab === "penilaian" && (
                <PenilaianOjtTab
                    kader={kader}
                    kaderId={kaderId}
                    penilaianList={penilaianList}
                    skorMap={penilaianSkorMap}
                    komentarMap={penilaianKomentarMap}
                    structure={penilaianStructure}
                    canEdit={canEditPenilaian}
                    kaderView={kaderView}
                />
            )}
            {tab === "perjanjian" && (
                <PerjanjianKerjaTab
                    kader={kader}
                    perjanjianKerja={perjanjianKerja}
                    templatePerjanjianKerja={templatePerjanjianKerja}
                    canUpload={canUpload}
                    kaderId={kaderId}
                />
            )}
        </AppLayout>
    );
}
