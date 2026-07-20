import AppLayout from "@/Layouts/AppLayout";
import ArsipReportCard from "@/Components/Report/ArsipReportCard";

// Halaman Report Arsip (Batch 1–2). Kartunya dipakai ulang di tab "Report" pada
// Kader Saya / Detail — lihat @/Components/Report/ArsipReportCard.
export default function DevelopmentArsip(props) {
    return (
        <AppLayout title="REPORT ARSIP" breadcrumb="Report / Arsip Batch 1–2">
            <div className="max-w-5xl mx-auto">
                <ArsipReportCard {...props} backHref="/report-new" />
            </div>
        </AppLayout>
    );
}
