import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const COLS = [
    { key: '_no',        label: 'No',          width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nik',        label: 'NIK',         sortable: true },
    { key: 'nama',       label: 'Nama',        sortable: true },
    { key: 'bu',         label: 'BU',          sortable: true },
    { key: 'divisi_name',  label: 'Divisi',    sortable: true },
    { key: 'dept_name',    label: 'Departemen', sortable: true },
    {
        key: 'total_modul',
        label: 'Total Modul',
        sortable: true,
        render: (v) => (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {v ?? 0}
            </span>
        ),
    },
];

export default function PesertaKader({ kaders = [] }) {
    const [selected, setSelected] = useState(null);

    return (
        <AppLayout title="PESERTA KADER" breadcrumb="Modul / Peserta Kader">
            <DataTable
                columns={COLS}
                data={kaders}
                actions={(row) => (
                    <button
                        type="button"
                        onClick={() => setSelected(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detail
                    </button>
                )}
            />

            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={`Modul Assigned — ${selected?.nama ?? ''}`}
                size="xl"
                footer={
                    <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Tutup
                    </button>
                }
            >
                {selected && (
                    <div>
                        {/* Kader meta badges */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                NIK: {selected.nik}
                            </span>
                            {selected.bu && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                    {selected.bu}
                                </span>
                            )}
                            {selected.divisi_name && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {selected.divisi_name}
                                </span>
                            )}
                            {selected.dept_name && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {selected.dept_name}
                                </span>
                            )}
                        </div>

                        {/* Module list */}
                        {(!selected.moduls || selected.moduls.length === 0) ? (
                            <p className="text-sm text-slate-500 py-8 text-center">
                                Belum ada modul yang di-assign untuk peserta ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                                            <th className="pb-2 pr-3 font-medium">No</th>
                                            <th className="pb-2 pr-3 font-medium">Kode</th>
                                            <th className="pb-2 pr-3 font-medium">Nama Modul</th>
                                            <th className="pb-2 font-medium">Fase</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selected.moduls.map((m, i) => (
                                            <tr key={m.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 pr-3 text-slate-400 text-xs">{i + 1}</td>
                                                <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">{m.kode_modul}</td>
                                                <td className="py-2.5 pr-3 font-medium text-slate-800">{m.nama_modul}</td>
                                                <td className="py-2.5">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                        Fase {m.fase}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
