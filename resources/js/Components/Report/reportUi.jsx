// Elemen bersama kartu "Management Trainee Development Report" — dipakai varian sistem
// (DevelopmentReportCard) maupun arsip Batch 1–2 (ArsipReportCard).

export const KKM = 70;

// Band penilaian pada skala 0–100 (KKM 70).
export function band(v) {
    if (v == null) return { label: "—", cls: "bg-slate-100 text-slate-500" };
    if (v >= 85) return { label: "Excellent", cls: "bg-emerald-100 text-emerald-700" };
    if (v >= 70) return { label: "Good", cls: "bg-blue-100 text-blue-700" };
    if (v >= 60) return { label: "Cukup", cls: "bg-amber-100 text-amber-700" };
    return { label: "Perlu Perhatian", cls: "bg-rose-100 text-rose-700" };
}

export const fmt = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d));

export function SectionTitle({ code, children }) {
    return (
        <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-700 mb-3">
            <span className="text-slate-400">{code} ·</span> {children}
        </div>
    );
}

export const Info = ({ label, value }) => (
    <div className="px-5 py-4">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</div>
    </div>
);

// Avatar warna bergilir + inisial supaya daftar mentor tetap eye-catching walau lebih dari satu.
const MENTOR_AV = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
];
const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

// Kolom Mentor pada info row — nama + jabatan, ringkas & rapi meski kader punya banyak mentor.
export function MentorCell({ mentors = [] }) {
    return (
        <div className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5 flex items-center gap-1.5">
                Mentor
                {mentors.length > 1 && (
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        {mentors.length}
                    </span>
                )}
            </div>
            {mentors.length === 0 ? (
                <div className="text-sm font-semibold text-slate-400">Tidak ada mentor</div>
            ) : (
                <div className="space-y-2">
                    {mentors.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${MENTOR_AV[i % MENTOR_AV.length]}`}>
                                {initialsOf(m.nama)}
                            </span>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-800 leading-tight truncate" title={m.nama}>{m.nama}</div>
                                {m.jabatan && (
                                    <div className="text-[11px] text-slate-400 leading-tight truncate" title={m.jabatan}>{m.jabatan}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Header band + baris identitas kader — identik di kedua varian report.
export function ReportHeader({ kader = {}, periodeLabel }) {
    return (
        <>
            <div className="bg-slate-800 text-white px-6 py-5 flex items-start justify-between gap-4">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">New Armada Group · People Development</div>
                    <h2 className="text-lg font-bold tracking-wide mt-1">MANAGEMENT TRAINEE DEVELOPMENT REPORT</h2>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-[11px] uppercase tracking-widest text-slate-400">Periode</div>
                    <div className="text-sm font-semibold mt-1">{periodeLabel}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 border-b border-slate-100">
                <Info label="Nama" value={kader.nama} />
                <Info
                    label="MT Batch · Department"
                    value={[kader.batch_roman ? `Batch ${kader.batch_roman}` : kader.batch_name, kader.departemen].filter(Boolean).join(" · ")}
                />
                <Info label="Business Unit" value={kader.bu} />
                <MentorCell mentors={kader.mentors} />
            </div>
        </>
    );
}

// Tombol "Pilih kader lain" — hanya relevan di halaman Report (tab Kader Saya sudah
// punya kader yang sedang dibuka, jadi backHref dibiarkan kosong di sana).
export function BackToPickerLink({ href }) {
    if (!href) return null;
    return (
        <a
            href={href}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shrink-0"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Pilih kader lain
        </a>
    );
}
