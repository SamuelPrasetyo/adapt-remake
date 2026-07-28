import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import KaderAvatar from "@/Components/KaderAvatar";
import { getFaseLabel, getFaseNum } from "@/constants/fase";
import LearningGrowthTab from "./tabs/LearningGrowthTab";
import KandidatTab from "./tabs/KandidatTab";
import FeedbackTab from "./tabs/FeedbackTab";
import SummaryMonthlyTab from "./tabs/SummaryMonthlyTab";
import PenilaianOjtTab from "./tabs/PenilaianOjtTab";
import PerjanjianKerjaTab from "./tabs/PerjanjianKerjaTab";
import ReportTab from "./tabs/ReportTab";

const STATUS_META = {
    on_track:        { label: "On Track",        cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    perlu_perhatian: { label: "Slightly Delayed",  cls: "bg-amber-100 text-amber-700 border-amber-300"   },
    kritis:          { label: "Behind Schedule",           cls: "bg-rose-100 text-rose-700 border-rose-300"      },
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
        id: "kandidat",
        label: "Job Applicant",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
        id: "summary",
        label: "Summary Monthly Feedback",
        adminMaiOnly: true,
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
    {
        id: "report",
        label: "Report",
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
];

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
    monthlyFeedbackSummaries = {},
    canSummarizeMonthly = false,
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
    canViewKandidat = false,
    kandidat = null,
    nikKtp = null,
    kandidatError = null,
    developmentReport = null,
}) {
    // Summary Monthly Feedback = tab khusus Admin MAI; Perjanjian disembunyikan dari Kader.
    // Job Applicant = khusus Admin MAI 021 (backend juga tidak mengirim datanya ke role lain).
    // Report = Admin & Mentor (backend mengirim null untuk Kader, sejalan dengan menu Report).
    const visibleTabs = TABS.filter((t) => {
        if (kaderView && t.id === "perjanjian") return false;
        if (t.id === "kandidat" && !canViewKandidat) return false;
        if (t.id === "report" && kaderView) return false;
        if (t.adminMaiOnly && !canSummarizeMonthly) return false;
        return true;
    });
    const validTabIds = visibleTabs.map((t) => t.id);

    const hashTab = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    const [tab, setTab] = useState(validTabIds.includes(hashTab) ? hashTab : "learning");

    const handleTabChange = (id) => {
        setTab(id);
        window.location.hash = id;
    };

    // Kartu di daftar kader membawa ?mentor_id=&batch_id= ke sini, jadi tombol
    // kembali tinggal meneruskannya supaya filter daftar tidak ikut ter-reset.
    // Bila detail dibuka lewat link langsung, jatuh ke /kader-saya polos.
    const backHref = useMemo(() => {
        if (typeof window === "undefined") return "/kader-saya";
        const current = new URLSearchParams(window.location.search);
        const params = new URLSearchParams();
        for (const key of ["batch_id", "mentor_id"]) {
            const value = current.get(key);
            if (value) params.set(key, value);
        }
        const qs = params.toString();
        return qs ? `/kader-saya?${qs}` : "/kader-saya";
    }, []);

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
                    <Link href={backHref}
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
                    <KaderAvatar
                        src={kandidat?.profile?.foto}
                        initials={initials}
                        alt={kader?.nama}
                        zoomable
                        className="w-14 h-14 rounded-xl text-xl"
                        fallbackClass="bg-linear-to-br from-blue-500 to-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900">{kader?.nama}</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                                {meta.label}
                            </span>
                        </div>
                        {/* Identitas: BU sebagai badge, sisanya chip abu-abu agar tidak
                            terbaca sebagai satu kalimat panjang. */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {kader?.bu_name && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold ring-1 ring-blue-100">
                                    {/* <span className="text-[10px] uppercase tracking-wide text-blue-400">BU</span> */}
                                    {kader.bu_name}
                                </span>
                            )}
                            {kader?.divisi_name && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                    {kader.divisi_name}
                                </span>
                            )}
                            {kader?.batch_name && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                    Batch {kader.batch_name}{kader.batch_year ? " " + kader.batch_year : ""}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2.5">
                            {kader?.mentor_name && (
                                <span>Mentor: <span className="font-medium text-slate-700">{kader.mentor_name}</span></span>
                            )}
                            {kader?.mentor_name && totalWeeks > 0 && <span className="text-slate-300">•</span>}
                            {totalWeeks > 0 && (
                                <span>Week: <span className="font-medium text-slate-700">{currentWeek} / {totalWeeks}</span></span>
                            )}
                            {totalWeeks > 0 && totalModuls > 0 && <span className="text-slate-300">•</span>}
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
                    {visibleTabs.map((t) => (
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
            {tab === "kandidat" && canViewKandidat && (
                <KandidatTab kandidat={kandidat} nikKtp={nikKtp} kandidatError={kandidatError} kaderId={kader.id} />
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
            {tab === "summary" && canSummarizeMonthly && (
                <SummaryMonthlyTab
                    kaderId={kaderId}
                    monthlyFeedbackList={monthlyFeedbackList}
                    monthlyFeedbackSummaries={monthlyFeedbackSummaries}
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
            {tab === "report" && !kaderView && (
                <ReportTab report={developmentReport} />
            )}
        </AppLayout>
    );
}
