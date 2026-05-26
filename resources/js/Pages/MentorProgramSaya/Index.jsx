import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

function ModulCard({ modul, selectedMentor }) {
    const href = selectedMentor
        ? `/learning/${modul.id}?mentor_id=${selectedMentor.id}`
        : `/learning/${modul.id}`;
    return (
        <Link
            href={href}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 hover:shadow-md hover:border-emerald-300 transition cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-400">{modul.kode_modul}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-snug">{modul.nama_modul}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Fase {String(modul.fase ?? '').replace(/^Fase\s+/i, '')}
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

function StatusBadge({ status }) {
    const isOnTrack = status === 'On Track';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
            isOnTrack ? 'bg-white/20 text-white' : 'bg-white/20 text-amber-200'
        }`}>
            {status}
            <span className={`w-2 h-2 rounded-full ${isOnTrack ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </span>
    );
}

export default function MentorProgramSayaIndex({
    moduls  = [],
    profile = {},
    stats   = {},
    selectedMentor = null,
}) {
    const { progress = 0, completed = 0, total = 0, avg_score = 0, status = 'On Track' } = stats;
    const { nama = '', jabatan, company } = profile;

    const grouped = moduls.reduce((acc, m) => {
        const key = String(m.fase ?? '').replace(/^Fase\s+/i, '');
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    const faseKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    const hasAny = faseKeys.length > 0;

    return (
        <AppLayout title="PROGRAM SAYA" breadcrumb="Program & Modul / Program Saya">

            {/* ── Hero card ── */}
            <div className="rounded-2xl overflow-hidden mb-3 shadow-md"
                style={{ background: 'linear-gradient(135deg, #0f4c75 0%, #1b6ca8 40%, #0e9aa7 100%)' }}>
                <div className="p-6">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase mb-3">
                        Coach &amp; Mentor Certification Program
                    </p>
                    <h2 className="text-2xl font-bold text-white mb-0.5">{nama || '—'}</h2>
                    {(jabatan || company) && (
                        <p className="text-sm text-white/70 mb-5">
                            {[jabatan, company].filter(Boolean).join(' · ')}
                        </p>
                    )}

                    {total > 0 && (
                        <div className="flex flex-wrap items-end gap-8">
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-1">Progress</p>
                                <p className="text-3xl font-bold text-white">{progress}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-1">Modul Selesai</p>
                                <p className="text-3xl font-bold text-white">{completed}/{total}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-1">Avg Score</p>
                                <p className="text-3xl font-bold text-white">{avg_score > 0 ? avg_score : '—'}</p>
                            </div>
                            <div className="pb-1">
                                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase mb-2">Status</p>
                                <StatusBadge status={status} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Progress bar ── */}
            {total > 0 && (
                <div className="bg-white rounded-2xl px-5 py-3.5 shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #1b6ca8, #0e9aa7)',
                                }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 shrink-0 whitespace-nowrap">
                            {completed} dari {total} modul selesai
                        </p>
                    </div>
                </div>
            )}

            {/* ── Modul grid ── */}
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
                            <h3 className="text-base font-bold text-slate-800">Fase {fase}</h3>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {items.length} modul
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((m) => <ModulCard key={m.id} modul={m} selectedMentor={selectedMentor} />)}
                        </div>
                    </div>
                );
            })}
        </AppLayout>
    );
}
