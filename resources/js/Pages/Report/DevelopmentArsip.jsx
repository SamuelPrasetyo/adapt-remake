import AppLayout from "@/Layouts/AppLayout";
import ArsipReportCard from "@/Components/Report/ArsipReportCard";
import { pickerBackHref, withPickerParams } from "@/Components/Report/reportUi";

// Halaman Report Arsip (Batch 1–2). Kartunya dipakai ulang di tab "Report" pada
// Kader Saya / Detail — lihat @/Components/Report/ArsipReportCard.
export default function DevelopmentArsip({ trainingHref = null, ...props }) {
    return (
        <AppLayout title="REPORT ARSIP" breadcrumb="Report / Arsip Batch 1–2">
            <div className="max-w-7xl mx-auto">
                <ArsipReportCard
                    {...props}
                    backHref={pickerBackHref("arsip")}
                    trainingHref={trainingHref ? withPickerParams(trainingHref) : null}
                />
            </div>
        </AppLayout>
    );
}
