import { useState, useRef, useEffect } from "react";

// Dropdown filter reusable (pola sama dengan filter di Modul/Soal/Index).
// Props:
//   label:    teks tombol (mis. "Status", "Batch", "Week", "BU")
//   value:    nilai aktif ("" = semua)
//   options:  [{ value, label }]
//   onChange: (value) => void
//   allLabel: teks opsi "semua" (default "Semua")
export default function FilterDropdown({ label, value, options = [], onChange, allLabel = "Semua" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const active = value !== "" && value != null;
    const current = options.find((o) => String(o.value) === String(value));

    return (
        <div className="relative" ref={ref}>
            <button type="button" onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition ${
                    active ? "text-blue-700 bg-blue-50 border-blue-300" : "text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M7 8h10M11 12h2M11 16h2" />
                </svg>
                {active ? `${label}: ${current?.label ?? value}` : label}
                {active && <span className="w-2 h-2 rounded-full bg-blue-600" />}
            </button>
            {open && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                    <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${!active ? "font-medium text-blue-600" : "text-slate-700"}`}>
                        {allLabel}
                    </button>
                    {options.map((o) => (
                        <button key={String(o.value)} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                                String(value) === String(o.value) ? "font-medium text-blue-600" : "text-slate-700"
                            }`}>
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
