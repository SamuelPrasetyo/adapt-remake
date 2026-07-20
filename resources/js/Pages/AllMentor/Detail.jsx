import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ nama, foto }) {
    if (foto) {
        return (
            <img
                src={`/storage/${foto}`}
                alt={nama}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-md shrink-0"
            />
        );
    }
    return (
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-md shrink-0">
            {nama?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}

/* ─── Status Badge ────────────────────────────────────────── */
function StatusBadge({ progress, total }) {
    if (total === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-slate-300 text-slate-500 bg-slate-50">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                BELUM ADA MODUL
            </span>
        );
    }
    const onTrack = progress >= 60;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            onTrack
                ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                : 'border-amber-400 text-amber-700 bg-amber-50'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {onTrack ? 'ON TRACK' : 'SLIGHTLY DELAYED'}
        </span>
    );
}

/* ─── Stat Item (no box, clean) ──────────────────────────── */
function StatItem({ label, value, accent }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{label}</span>
            <span className={`text-xl md:text-2xl font-bold ${accent || 'text-slate-800'}`}>{value ?? '—'}</span>
        </div>
    );
}

/* ─── Score Circle (SVG arc) ─────────────────────────────── */
function computePct(value) {
    if (value == null) return 0;
    if (typeof value === 'number') return Math.min(100, Math.max(0, value));
    const match = String(value).match(/^(\d+)\/(\d+)$/);
    if (match) return Math.min(100, (parseInt(match[1]) / parseInt(match[2])) * 100);
    return 0;
}

function ScoreCircle({ label, value, color }) {
    const SIZE   = 64;
    const STROKE = 5;
    const R      = (SIZE - STROKE) / 2;
    const C      = 2 * Math.PI * R;
    const pct    = computePct(value);
    const offset = C * (1 - pct / 100);

    const arcColor = { blue: '#3b82f6', amber: '#f59e0b', red: '#ef4444' }[color] || '#94a3b8';
    const txtClass = { blue: 'text-blue-600', amber: 'text-amber-500', red: 'text-red-500' }[color] || 'text-slate-400';

    const display = value != null
        ? (typeof value === 'number' ? Math.round(value) : value)
        : null;

    return (
        <div className="flex flex-col items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</span>
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle
                        cx={SIZE / 2} cy={SIZE / 2} r={R}
                        fill="none" stroke="#e2e8f0" strokeWidth={STROKE}
                    />
                    {/* Arc */}
                    {value != null && (
                        <circle
                            cx={SIZE / 2} cy={SIZE / 2} r={R}
                            fill="none"
                            stroke={arcColor}
                            strokeWidth={STROKE}
                            strokeDasharray={C}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold leading-none ${display != null ? txtClass : 'text-slate-300'}`}>
                        {display ?? '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ─── Module Card ─────────────────────────────────────────── */
function ModulCard({ modul, index }) {
    const hasCircles = modul.has_test || modul.has_pa;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

                {/* Left: number + info */}
                <div className="flex gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-0.5">
                            {modul.kode_modul}
                        </p>
                        <h3 className="font-bold text-slate-800 text-base md:text-lg leading-snug">
                            {modul.nama_modul}
                        </h3>

                        {modul.is_done && (
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 border border-emerald-500 text-emerald-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    SELESAI
                                </span>
                            </div>
                        )}

                        <div className="mt-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skor Akhir: </span>
                            <span className={`text-2xl font-bold ${modul.final_score != null ? 'text-blue-600' : 'text-slate-300'}`}>
                                {modul.final_score ?? '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: score circles */}
                {hasCircles && (
                    <div className="flex items-center gap-4 pl-12 sm:pl-0 shrink-0">
                        {modul.has_test && (
                            <ScoreCircle
                                label="Pre Test"
                                value={modul.pre_score != null ? Math.round(modul.pre_score) : null}
                                color="blue"
                            />
                        )}
                        {modul.has_test && (
                            <ScoreCircle
                                label="Post Test"
                                value={modul.post_score != null ? Math.round(modul.post_score) : null}
                                color="amber"
                            />
                        )}
                        {modul.has_pa && (
                            <ScoreCircle
                                label="Activity"
                                value={modul.pa_score != null
                                    ? Math.round(modul.pa_score)
                                    : modul.pa_sessions > 0
                                        ? `${modul.pa_sessions}/10`
                                        : null}
                                color="red"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function AllMentorDetail({ mentor = {}, moduls = [], summary = {} }) {
    return (
        <AppLayout title="DETAIL MENTOR" breadcrumb={`Program & Modul / All Mentor / ${mentor.nama}`}>

            {/* Back */}
            <div className="mb-4">
                <Link
                    href="/all-mentor"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke All Mentor
                </Link>
            </div>

            {/* ── Header Card ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-6">

                    {/* Left: Avatar + name + subtitle + progress bar */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar nama={mentor.nama} foto={mentor.foto} />
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800">{mentor.nama}</h2>
                                <StatusBadge progress={summary.progress} total={summary.total} />
                            </div>
                            <p className="text-sm text-slate-500 mb-3">
                                {[mentor.jabatan, mentor.bu && `${mentor.bu}${mentor.company_name ? ` (${mentor.company_name})` : ''}`]
                                    .filter(Boolean).join(' · ')}
                            </p>
                            {!mentor.has_account && (
                                <p className="text-[11px] text-amber-600 font-medium mb-2">Belum memiliki akun login</p>
                            )}
                            {/* Progress bar */}
                            <div className="flex items-center gap-3 max-w-xs">
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(100, summary.progress)}%`,
                                            background: summary.progress >= 60 ? '#10b981' : summary.progress >= 30 ? '#f59e0b' : '#ef4444',
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 shrink-0">{summary.progress}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats — clean, no outer box */}
                    <div className="flex items-center justify-center md:justify-start gap-6 md:gap-8 shrink-0">
                        <StatItem
                            label="Progress"
                            value={`${summary.progress}%`}
                            accent={summary.progress >= 60 ? 'text-emerald-600' : 'text-amber-600'}
                        />
                        <div className="w-px h-8 bg-slate-200 shrink-0" />
                        <StatItem
                            label="Avg Score"
                            value={summary.avg_score}
                            accent="text-blue-600"
                        />
                        <div className="w-px h-8 bg-slate-200 shrink-0" />
                        <StatItem
                            label="Modul Selesai"
                            value={`${summary.completed}/${summary.total}`}
                            accent="text-slate-800"
                        />
                    </div>
                </div>
            </div>

            {/* ── Module Scoring Board ─────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Modul Mentor</h3>
                    {summary.avg_score != null && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                            Avg: {summary.avg_score}
                        </span>
                    )}
                </div>

                {moduls.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-14 text-center text-slate-400 text-sm">
                        Belum ada modul yang di-assign ke mentor ini.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {moduls.map((mod, idx) => (
                            <ModulCard key={mod.id} modul={mod} index={idx} />
                        ))}
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
