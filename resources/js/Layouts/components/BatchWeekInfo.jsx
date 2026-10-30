import { useState, useRef, useEffect } from "react";

// Ikon kalender di header → popover daftar batch beserta minggu berjalannya.
// Data dari shared prop `batchWeeks` (HandleInertiaRequests): Admin & Mentor melihat
// semua batch bertanggal, Kader hanya batch-nya sendiri.

const STATE_BADGE = {
    berjalan: { label: "Berjalan", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    selesai:  { label: "Selesai", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
    belum:    { label: "Belum Mulai", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
};

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function CalendarIcon({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function BatchRow({ b }) {
    const badge = STATE_BADGE[b.state] ?? STATE_BADGE.berjalan;
    const pct = b.totalWeeks ? Math.round((b.currentWeek / b.totalWeeks) * 100) : 0;
    const showWeek = b.state === "berjalan";

    return (
        <div className={`px-4 py-3 ${b.is_current ? "bg-blue-50/50" : ""}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-slate-800">Batch {b.nama_batch}</span>
                    {b.tahun_batch && <span className="text-xs text-slate-400">({b.tahun_batch})</span>}
                    {b.is_current && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white">
                            Saat ini
                        </span>
                    )}
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}>
                    {badge.label}
                </span>
            </div>

            {showWeek ? (
                <>
                    <div className="flex items-baseline justify-between mt-1.5">
                        <span className="text-sm font-semibold text-blue-600">
                            Minggu {b.currentWeek}
                            <span className="text-slate-400 font-normal">/{b.totalWeeks}</span>
                        </span>
                        <span className="text-[11px] text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 mt-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                </>
            ) : (
                <div className="text-xs text-slate-500 mt-1">{b.totalWeeks} minggu</div>
            )}

            <div className="text-[11px] text-slate-400 mt-1">
                {fmtDate(b.tanggal_mulai)} – {fmtDate(b.tanggal_selesai)}
            </div>
        </div>
    );
}

export default function BatchWeekInfo({ batches = [] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!batches.length) return null;

    const runningCount = batches.filter((b) => b.state === "berjalan").length;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`relative p-2 rounded-lg transition ${open ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
                title="Batch & minggu berjalan"
            >
                <CalendarIcon />
                {runningCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {runningCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-sm font-semibold text-slate-800">Batch & Minggu Berjalan</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            {runningCount} batch sedang berjalan
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {batches.map((b) => <BatchRow key={b.id_batch} b={b} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
