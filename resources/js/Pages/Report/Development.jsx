import AppLayout from "@/Layouts/AppLayout";
import DevelopmentReportCard from "@/Components/Report/DevelopmentReportCard";

// Halaman Report New (batch 3+). Kartunya sendiri dipakai ulang di tab "Report" pada
// Kader Saya / Detail — lihat @/Components/Report/DevelopmentReportCard.
export default function Development(props) {
    return (
        <AppLayout title="REPORT" breadcrumb="Report">
            <div className="max-w-5xl mx-auto">
                <DevelopmentReportCard {...props} backHref="/report-new" />
            </div>
        </AppLayout>
    );
}
