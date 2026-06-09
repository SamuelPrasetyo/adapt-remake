import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FASE_LABELS } from '@/constants/fase';

function ModulCard({ modul }) {
    return (
        <Link
            href={`/learning/${modul.id}`}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-emerald-300 transition cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-400">{modul.kode_modul}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-snug">{modul.nama_modul}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {FASE_LABELS[String(modul.fase).replace(/^Fase\s+/i, '')] ?? `Fase ${modul.fase}`}
                </span>
            </div>
            {modul.tag_kompetensi && (
                <p className="text-xs text-slate-500">{modul.tag_kompetensi}</p>
            )}
            <div className="flex items-center mt-auto pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 ml-auto">
                    Buka Modul
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </Link>
    );
}

export default function MyModulIndex({ moduls = [] }) {
    const total = moduls.length;

    // Group di sisi React untuk menghindari masalah serialisasi PHP Collection keys
    const grouped = moduls.reduce((acc, m) => {
        const key = String(m.fase ?? '').replace(/^Fase\s+/i, '');
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    // Urutkan fase secara numerik
    const faseKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    const hasAny = faseKeys.length > 0;

    return (
        <AppLayout title="MY MODUL" breadcrumb="Modul / My Modul">
            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">{total}</div>
                <div>
                    <p className="font-semibold text-slate-900">Total Modul Assigned</p>
                    <p className="text-sm text-slate-500">Semua fase</p>
                </div>
            </div>

            {!hasAny && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center text-slate-500">
                    Belum ada modul yang di-assign ke kamu.
                </div>
            )}

            {faseKeys.map((fase) => {
                const items = grouped[fase];
                return (
                    <div key={fase} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-base font-bold text-slate-800">{FASE_LABELS[fase] ?? `Fase ${fase}`}</h3>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {items.length} modul
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((m) => <ModulCard key={m.id} modul={m} />)}
                        </div>
                    </div>
                );
            })}
        </AppLayout>
    );
}
