import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';

const COLS = [
    { key: '_no',        label: 'No',             width: '52px', render: (_, __, i) => i + 1 },
    { key: 'desc',       label: 'Deskripsi',       sortable: true },
    { key: 'nama',       label: 'Dilakukan Oleh',  sortable: true },
    {
        key: 'created_at', label: 'Waktu', sortable: true,
        render: (v) => v
            ? new Date(v).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '-',
    },
];

export default function ActivityLogIndex({ logs }) {
    return (
        <AppLayout title="ACTIVITY LOG" breadcrumb="Modul / Activity Log">
            <DataTable columns={COLS} data={logs} />
        </AppLayout>
    );
}
