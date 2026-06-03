import { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_TTL   = 30 * 24 * 60 * 60 * 1000; // bersihkan dismissal lama setelah 30 hari

function storageKey(userId) {
    return `inbox_dismissed_${userId}`;
}

function loadDismissed(userId) {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return {};
        const data = JSON.parse(raw);
        const cutoff = Date.now() - DISMISS_TTL;
        return Object.fromEntries(Object.entries(data).filter(([, ts]) => ts > cutoff));
    } catch {
        return {};
    }
}

function saveDismissed(userId, data) {
    try {
        localStorage.setItem(storageKey(userId), JSON.stringify(data));
    } catch {}
}

function itemKey(item) {
    if (item.type === "ojt") return `ojt_fmc${item.fmc_number}_${item.updated_at ?? ""}${item.kader_nama ?? ""}`;
    if (item.type === "idp") return `idp_${item.nama_file ?? ""}_${item.updated_at ?? ""}`;
    if (item.type === "idp_review") return `idprev_${item.nama_file ?? ""}_${item.kader_nama ?? ""}_${item.updated_at ?? ""}`;
    return `pa_${item.nama_file ?? ""}_${item.updated_at ?? ""}`;
}

function fmtDate(s) {
    if (!s) return "";
    return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ── Bell icon SVG ── */
function BellIcon({ className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

/* ── Admin MAI: bell buka dropdown, klik item baru ke /approval ── */
function AdminBell({ pendingCount }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title="Notifikasi Approval"
            >
                <BellIcon />
                {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">Notifikasi Approval</span>
                    </div>
                    <div className="px-4 py-4">
                        {pendingCount > 0 ? (
                            <p className="text-sm text-slate-600">
                                Ada <span className="font-bold text-amber-600">{pendingCount}</span> item menunggu persetujuan Anda.
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400">Tidak ada item yang menunggu approval.</p>
                        )}
                    </div>
                    <div className="px-4 pb-4">
                        <button
                            type="button"
                            onClick={() => { setOpen(false); router.visit("/approval"); }}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            Buka Halaman Approval
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Kader & Mentor: dropdown dengan dismiss ── */
function UserBell({ inbox, userId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const [dismissed, setDismissed] = useState(() => loadDismissed(userId));

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

    const visible = (inbox?.items ?? []).filter((item) => {
        if (dismissed[itemKey(item)]) return false;
        if (item.updated_at && new Date(item.updated_at) < cutoff) return false;
        return true;
    });

    const dismiss = (item) => {
        const key = itemKey(item);
        const next = { ...dismissed, [key]: Date.now() };
        setDismissed(next);
        saveDismissed(userId, next);
    };

    const dismissAll = () => {
        const next = { ...dismissed };
        visible.forEach((item) => { next[itemKey(item)] = Date.now(); });
        setDismissed(next);
        saveDismissed(userId, next);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title="Notifikasi"
            >
                <BellIcon />
                {visible.length > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {visible.length > 99 ? "99+" : visible.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">Notifikasi Approval</span>
                        <div className="flex items-center gap-2">
                            {visible.length > 0 && (
                                <>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{visible.length}</span>
                                    <button
                                        onClick={dismissAll}
                                        className="text-xs text-slate-400 hover:text-slate-600 transition"
                                        title="Tutup semua"
                                    >
                                        Tutup semua
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info: auto-expire */}
                    {visible.length > 0 && (
                        <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                            <p className="text-[11px] text-slate-400">Notifikasi otomatis hilang setelah 7 hari.</p>
                        </div>
                    )}

                    {/* Item list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {visible.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                Tidak ada notifikasi baru.
                            </div>
                        ) : visible.map((item, i) => {
                            const isReview = item.type === "idp_review";
                            const approved = item.approval_status === "approved";
                            const actorLabel = item.actor === "mentor" ? "Mentor" : "Admin MAI";
                            const dotColor = isReview ? "bg-amber-500" : approved ? "bg-emerald-500" : "bg-red-500";
                            return (
                                <div key={i}
                                    onClick={isReview ? () => { setOpen(false); router.visit("/approval/idp"); } : undefined}
                                    className={`px-4 py-3 hover:bg-slate-50 transition group relative ${isReview ? "cursor-pointer" : ""}`}>
                                    <div className="flex items-start gap-2.5 pr-6">
                                        <span className={`mt-1 shrink-0 w-2 h-2 rounded-full ${dotColor}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 line-clamp-2">
                                                {item.type === "ojt"
                                                    ? `OJT FMC-${item.fmc_number}${item.kader_nama ? ` · ${item.kader_nama}` : ""}`
                                                    : item.type === "idp" || isReview
                                                    ? `Form IDP${item.kader_nama ? ` · ${item.kader_nama}` : ""}${item.nama_file ? ` (${item.nama_file})` : ""}`
                                                    : `Post Activity${item.modul_nama ? ` · ${item.modul_nama}` : ""}${item.nama_file ? ` (${item.nama_file})` : ""}`
                                                }
                                            </p>
                                            {isReview ? (
                                                <p className="text-xs mt-0.5 font-medium text-amber-600">⌛ Menunggu review Anda</p>
                                            ) : (
                                                <p className={`text-xs mt-0.5 font-medium ${approved ? "text-emerald-600" : "text-red-600"}`}>
                                                    {approved ? `✓ Disetujui ${actorLabel}` : `✗ Ditolak ${actorLabel}`}
                                                </p>
                                            )}
                                            {!isReview && !approved && item.rejection_reason && (
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-3">"{item.rejection_reason}"</p>
                                            )}
                                            {item.final_score != null && (
                                                <p className="text-[11px] text-slate-400 mt-0.5">Score: {Number(item.final_score).toFixed(1)}</p>
                                            )}
                                            {item.updated_at && (
                                                <p className="text-[10px] text-slate-300 mt-1">{fmtDate(item.updated_at)}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Dismiss button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); dismiss(item); }}
                                        className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition opacity-0 group-hover:opacity-100"
                                        title="Tutup notifikasi ini"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Export utama ── */
export default function InboxBell({ inbox, user }) {
    if (!user) return null;

    const isAdmin021 = user.type === "Admin" && user.company_code === "021";

    if (isAdmin021) {
        return <AdminBell pendingCount={inbox?.pending_count ?? 0} />;
    }

    if (user.type === "Kader" || user.type === "Mentor") {
        return <UserBell inbox={inbox} userId={user.id} />;
    }

    return null;
}
