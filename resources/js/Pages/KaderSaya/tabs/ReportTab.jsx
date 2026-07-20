import DevelopmentReportCard from "@/Components/Report/DevelopmentReportCard";
import ArsipReportCard from "@/Components/Report/ArsipReportCard";

/**
 * Tab "Report" — kartu Management Trainee Development Report yang sama persis dengan
 * menu Report, tanpa tombol "Pilih kader lain" (kadernya sudah jelas di halaman ini).
 * `mode` ditentukan backend: 'system' (batch 3+) atau 'arsip' (batch 1–2).
 */
export default function ReportTab({ report = null }) {
    if (!report) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-sm font-medium text-slate-600">Report belum tersedia</div>
                <p className="text-xs text-slate-400 mt-1">
                    Kader ini belum punya data report — untuk Batch 1–2, arsip nilainya perlu diimpor lebih dulu.
                </p>
            </div>
        );
    }

    const { mode, ...props } = report;

    return mode === "arsip" ? <ArsipReportCard {...props} /> : <DevelopmentReportCard {...props} />;
}
