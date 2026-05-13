import AppLayout from '@/Layouts/AppLayout';

export default function DashboardKader({ week = [], avg = {}, learningG = {}, kkm = [], kaderInfo = {} }) {
    const weekLabels = (Array.isArray(week) && week.length > 0)
        ? week
        : Object.keys(avg).map(Number).sort((a, b) => a - b);

    const avgValues = weekLabels.map((w) => avg?.[w] ?? 0);
    const totalWeek = weekLabels.length;
    const meanScore = avgValues.length
        ? (avgValues.reduce((a, b) => a + (Number(b) || 0), 0) / avgValues.length).toFixed(2)
        : '—';
    const kkmVal = kkm?.[0] ?? 7;

    return (
        <AppLayout title="DASHBOARD" breadcrumb="Dashboard Kader">
            {/* Profile card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
                <div className="flex flex-wrap items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0">
                        {kaderInfo.nama?.charAt(0)?.toUpperCase() || 'K'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 truncate">{kaderInfo.nama || '—'}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">NIK: {kaderInfo.nik || '—'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {kaderInfo.bu && (
                                <span className="text-xs text-slate-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">{kaderInfo.bu}</span>
                            )}
                            {kaderInfo.divisi && (
                                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">{kaderInfo.divisi}</span>
                            )}
                            {kaderInfo.departemen && (
                                <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">{kaderInfo.departemen}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total Week Dinilai</p>
                    <p className="text-3xl font-bold text-blue-600">{totalWeek}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Rata-rata Score</p>
                    <p className="text-3xl font-bold text-emerald-600">{meanScore}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">KKM</p>
                    <p className="text-3xl font-bold text-violet-600">{kkmVal}</p>
                </div>
            </div>

            {/* Weekly progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-5">Progress Mingguan</h3>
                {weekLabels.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">Belum ada data penilaian.</p>
                ) : (
                    <div className="space-y-4">
                        {weekLabels.map((w, i) => {
                            const score = Number(avgValues[i]) || 0;
                            const pct   = Math.min(100, (score / 10) * 100);
                            const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-400' : 'bg-red-400';
                            const meetsKkm = score >= kkmVal;
                            return (
                                <div key={w}>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="font-medium text-slate-700">Week {w}</span>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meetsKkm ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                            {score.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${color}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
