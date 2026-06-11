import { useState, useRef, useEffect, useMemo } from "react";

/**
 * FilterPanel — satu tombol "Filter" yang membuka panel berisi semua filter.
 *
 * Setiap filter mendukung dua mode tampilan, dikontrol via filter.searchable:
 *   false (default) — pills/chip yang bisa diklik langsung
 *   true            — searchable dropdown: input search + daftar item scroll
 *
 * Props filter: [{ key, label, options, allLabel?, searchable? }]
 */

// Sub-komponen: filter berupa searchable dropdown (untuk filter dengan banyak opsi)
function SearchableSelect({ filter, activeVal, onSelect }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return filter.options;
        return filter.options.filter((o) => o.label.toLowerCase().includes(q));
    }, [search, filter.options]);

    return (
        <div className="space-y-1.5">
            {/* Search input */}
            <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Cari ${filter.label}...`}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                />
                {search && (
                    <button type="button" onClick={() => setSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Options list */}
            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400 text-center">Tidak ditemukan</p>
                ) : (
                    filtered.map((opt) => {
                        const isSelected = String(activeVal ?? "") === String(opt.value);
                        return (
                            <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => onSelect(isSelected ? "" : opt.value)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition ${
                                    isSelected
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Sub-komponen: filter berupa pill/chip (untuk filter dengan sedikit opsi)
function PillSelect({ filter, activeVal, onSelect }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {filter.options.map((opt) => {
                const isSelected = String(activeVal ?? "") === String(opt.value);
                return (
                    <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => onSelect(isSelected ? "" : opt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            isSelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                        }`}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function FilterPanel({ filters = [], values = {}, onChange, onReset }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const activeCount = useMemo(
        () => filters.filter((f) => values[f.key] != null && values[f.key] !== "").length,
        [filters, values]
    );

    const hasActive = activeCount > 0;

    return (
        <div className="relative" ref={ref}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition ${
                    hasActive
                        ? "text-blue-700 bg-blue-50 border-blue-300"
                        : "text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
                }`}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 01.707 1.707L13 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-4.586L3.293 5.707A1 1 0 013 5V4z" />
                </svg>
                Filter
                {hasActive && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold bg-blue-600 text-white leading-none">
                        {activeCount}
                    </span>
                )}
                <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Filter</span>
                        {hasActive && (
                            <button
                                type="button"
                                onClick={onReset}
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                            >
                                Reset Semua
                            </button>
                        )}
                    </div>

                    {/* Filter sections */}
                    <div className="max-h-120 overflow-y-auto divide-y divide-slate-100">
                        {filters.map((filter) => {
                            const activeVal = values[filter.key];
                            const isFilterActive = activeVal != null && activeVal !== "";

                            return (
                                <div key={filter.key} className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            {filter.label}
                                        </p>
                                        {isFilterActive && (
                                            <button
                                                type="button"
                                                onClick={() => onChange(filter.key, "")}
                                                className="text-[10px] text-slate-400 hover:text-red-500 transition"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>

                                    {filter.searchable ? (
                                        <SearchableSelect
                                            filter={filter}
                                            activeVal={activeVal}
                                            onSelect={(val) => onChange(filter.key, val)}
                                        />
                                    ) : (
                                        <PillSelect
                                            filter={filter}
                                            activeVal={activeVal}
                                            onSelect={(val) => onChange(filter.key, val)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer — ringkasan filter aktif */}
                    {hasActive && (
                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                            <p className="text-xs text-slate-500">
                                <span className="font-medium text-blue-600">{activeCount}</span> filter aktif
                                {" — "}
                                {filters
                                    .filter((f) => values[f.key] != null && values[f.key] !== "")
                                    .map((f) => {
                                        const opt = f.options?.find((o) => String(o.value) === String(values[f.key]));
                                        return opt?.label ?? values[f.key];
                                    })
                                    .join(", ")}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
