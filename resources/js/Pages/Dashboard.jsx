// Dashboard utama — meniru gaya Nexus: gradient stats + progress bars.
import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import StatsCard from '@/Components/StatsCard';
import ProgressBar from '@/Components/ProgressBar';

export default function Dashboard({
    stats,
    departemenProgress,
    mentorMonitoring,
    modulPerKategori,
}) {
    const s = stats || { totalKader: 0, mentorAktif: 0, modulTersedia: 0, dokPending: 0 };
    const dep = departemenProgress?.length
        ? departemenProgress
        : [
              { label: 'Keuangan',  value: 75, color: 'green' },
              { label: 'Marketing', value: 60, color: 'blue' },
              { label: 'Produksi',  value: 45, color: 'cyan' },
              { label: 'HR',        value: 30, color: 'red' },
          ];
    const mon = mentorMonitoring?.length
        ? mentorMonitoring
        : [
              { label: 'Hendra Wijaya',  value: 3, max: 3, color: 'green' },
              { label: 'Lisa Nurhayati', value: 3, max: 4, color: 'green' },
              { label: 'Rizky Andika',   value: 1, max: 3, color: 'amber' },
              { label: 'Siti Wulandari', value: 0, max: 2, color: 'slate' },
          ];
    const kategoriDefault = [
        { kategori: 'Leadership', total: 8, color: 'blue' },
        { kategori: 'Technical',  total: 6, color: 'violet' },
        { kategori: 'Soft Skill', total: 5, color: 'amber' },
        { kategori: 'Compliance', total: 5, color: 'green' },
    ];
    const kategori = modulPerKategori?.length ? modulPerKategori : kategoriDefault;

    return (
        <AppLayout title="DASHBOARD" breadcrumb="Talent & Development · ADAPT Program">
            <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] mb-6 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <div className="text-xl font-bold text-slate-900">Dashboard</div>
                    <div className="text-sm text-slate-500">Talent & Development · ADAPT Program</div>
                </div>
                <div className="flex gap-10 flex-wrap">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{s.totalKader}</div>
                        <div className="text-xs text-slate-500">Total kader</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-violet-600">{s.mentorAktif}</div>
                        <div className="text-xs text-slate-500">Mentor aktif</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600">{s.modulTersedia}</div>
                        <div className="text-xs text-slate-500">Modul tersedia</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-red-500">{s.dokPending}</div>
                        <div className="text-xs text-slate-500">Dok. pending</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard title="Kader Aktif" value={s.totalKader} subtitle="3 batch berjalan" color="green" />
                <StatsCard title="Dokumen Masuk" value="127" subtitle="11 pending review" color="blue" />
                <StatsCard title="Modul Terunduh" value="384" subtitle="Bulan ini" color="violet" />
                <StatsCard title="IDP belum lengkap" value="24" subtitle="dari 48 kader" color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-semibold text-slate-900 mb-4">Progress kader per departemen</h3>
                    <div className="space-y-4">
                        {dep.map((d, i) => (
                            <ProgressBar key={i} {...d} />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                    <h3 className="font-semibold text-slate-900 mb-4">Weekly monitoring mentor</h3>
                    <div className="space-y-4">
                        {mon.map((m, i) => (
                            <ProgressBar
                                key={i}
                                label={m.label}
                                value={m.value}
                                max={m.max}
                                color={m.color}
                                showPercent={false}
                                suffix={`${m.value}/${m.max}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-semibold text-slate-900 mb-4">Kelola modul per kategori</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kategori.map((m, i) => (
                        <div
                            key={i}
                            className="border border-slate-200 rounded-xl p-4 hover:shadow-[var(--shadow-card-hover)] transition"
                        >
                            <div className="text-xs uppercase tracking-wider text-slate-500">{m.kategori}</div>
                            <div className="text-2xl font-bold mt-1 text-slate-900">{m.total}</div>
                            <div className="text-xs text-slate-500">modul</div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
