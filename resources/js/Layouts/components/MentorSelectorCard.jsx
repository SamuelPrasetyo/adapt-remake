import { useState, useRef, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";
import Icon from "./Icon";

export default function MentorSelectorCard({ user, mentors, selectedMentor, currentUrl }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    const showCard =
        (user?.type === "Admin" && user?.company_code === "021") ||
        user?.type === "Mentor";

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = useMemo(() => {
        if (!mentors || mentors.length === 0) return [];
        if (!search.trim()) return mentors;
        const q = search.toLowerCase();
        return mentors.filter(
            (m) =>
                m.nama?.toLowerCase().includes(q) ||
                m.jabatan?.toLowerCase().includes(q) ||
                m.bu?.toLowerCase().includes(q) ||
                m.company_code?.toLowerCase().includes(q)
        );
    }, [mentors, search]);

    const onDashboard = Array.isArray(mentors);

    // Hanya sembunyikan di /all-mentor; program-saya & mentor-modul tetap tampil
    if (!showCard) return null;
    if (currentUrl?.startsWith("/all-mentor")) return null;

    // Deteksi halaman program mentor
    const isMentorProgramPage = ["/program-saya", "/mentor-modul"].some(
        (p) => currentUrl?.startsWith(p)
    );

    const basePath = currentUrl?.startsWith("/kader-saya")
        ? "/kader-saya"
        : isMentorProgramPage
        ? currentUrl?.startsWith("/mentor-modul") ? "/mentor-modul" : "/program-saya"
        : "/dashboard";

    const pickMentor = (m) => {
        setOpen(false);
        setSearch("");
        router.visit(`${basePath}?mentor_id=${m.id}`, { preserveScroll: true });
    };

    const clearMentor = () => {
        setOpen(false);
        router.visit(basePath, { preserveScroll: true });
    };

    const goToDashboard = () => router.visit("/dashboard");

    const initial = selectedMentor?.nama?.charAt(0)?.toUpperCase() || null;
    const empty = !selectedMentor;
    const totalKader = (mentors || []).reduce(
        (acc, m) => acc + (m.kader_count || 0),
        0
    );

    // Label "clearMentor" default: nama sendiri di halaman program, "Semua Kader" di halaman lain
    const selfLabel = isMentorProgramPage ? (user?.name || "Mentor") : "Semua Kader";
    const selfSubLabel = isMentorProgramPage
        ? "Program Saya Sendiri"
        : onDashboard
        ? mentors?.length ? `${totalKader} kader · semua mentor` : "Klik untuk memilih"
        : "Buka Dashboard";
    const selfInitial = user?.name?.charAt(0)?.toUpperCase() || "M";

    return (
        <div className="shrink-0 px-3 pt-3 pb-1 relative" ref={ref}>
            <button
                type="button"
                onClick={() => {
                    if (!onDashboard && !isMentorProgramPage) {
                        goToDashboard();
                        return;
                    }
                    setOpen(!open);
                }}
                className={`w-full text-left p-3 rounded-xl transition border ${
                    empty
                        ? "border-white/15 bg-white/5 hover:bg-white/10"
                        : "border-blue-500/30 bg-linear-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/15 hover:to-indigo-500/15"
                }`}
                title={(!onDashboard && !isMentorProgramPage) ? "Buka Dashboard untuk pilih mentor" : ""}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            empty
                                ? "bg-slate-600 text-white"
                                : "bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                        }`}
                    >
                        {empty ? (
                            isMentorProgramPage ? (
                                <span className="text-sm font-bold">{selfInitial}</span>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            )
                        ) : (
                            <span className="text-sm font-bold">{initial}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        {empty ? (
                            <>
                                <div className="text-sm font-semibold text-white truncate">
                                    {selfLabel}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                    {selfSubLabel}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm font-semibold text-white truncate">
                                    {selectedMentor.nama}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                    {selectedMentor.jabatan}
                                </div>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/30 text-blue-100 ring-1 ring-blue-400/30">
                                        {selectedMentor.bu || selectedMentor.company_code}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    {(onDashboard || isMentorProgramPage) && (
                        <Icon
                            name="chevron"
                            className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                                open ? "rotate-180" : ""
                            }`}
                        />
                    )}
                </div>
            </button>

            {open && (onDashboard || isMentorProgramPage) && (
                <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/10">
                        <input
                            type="text"
                            placeholder="Cari mentor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {/* Top option: Semua Kader (kader pages) atau Program Sendiri (program pages) */}
                        <button
                            type="button"
                            onClick={clearMentor}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition border-b border-white/5 ${
                                empty ? "bg-blue-500/20" : "hover:bg-white/5"
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-white shrink-0 text-sm font-bold">
                                {isMentorProgramPage ? selfInitial : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">
                                    {selfLabel}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                    {isMentorProgramPage ? "Program Saya Sendiri" : `${totalKader} kader · semua mentor`}
                                </div>
                            </div>
                            {empty && (
                                <svg className="w-4 h-4 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        {filtered.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500">
                                {!mentors || mentors.length === 0
                                    ? "Belum ada mentor."
                                    : "Tidak ada mentor cocok."}
                            </div>
                        ) : (
                            filtered.map((m) => {
                                const isCurrent = selectedMentor?.id === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => pickMentor(m)}
                                        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition ${
                                            isCurrent ? "bg-blue-500/20" : "hover:bg-white/5"
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                            {m.nama?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">
                                                {m.nama}
                                            </div>
                                            <div className="text-[11px] text-slate-400 truncate">
                                                {isMentorProgramPage
                                                    ? (m.jabatan || "—")
                                                    : `${m.jabatan || "—"} · ${m.kader_count || 0} kader`}
                                            </div>
                                        </div>
                                        {isCurrent && (
                                            <svg className="w-4 h-4 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
