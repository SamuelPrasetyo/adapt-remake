import AppLayout from "@/Layouts/AppLayout";

const KKM = 70;

// Band penilaian skala 0–100 (KKM 70) — sama dengan Report New.
function band(v) {
    if (v == null) return { label: "—", cls: "bg-slate-100 text-slate-500" };
    if (v >= 85) return { label: "Excellent", cls: "bg-emerald-100 text-emerald-700" };
    if (v >= 70) return { label: "Good", cls: "bg-blue-100 text-blue-700" };
    if (v >= 60) return { label: "Cukup", cls: "bg-amber-100 text-amber-700" };
    return { label: "Perlu Perhatian", cls: "bg-rose-100 text-rose-700" };
}

const fmt = (v, d = 1) => (v == null ? "—" : Number(v).toFixed(d));
const x10 = (v) => (v == null ? null : Number(v) * 10); // 0–10 → 0–100

function SectionTitle({ code, children }) {
    return (
        <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-700 mb-3">
            <span className="text-slate-400">{code} ·</span> {children}
        </div>
    );
}

const MENTOR_AV = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
];
const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

function MentorCell({ mentors = [] }) {
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

const Info = ({ label, value }) => (
    <div className="px-5 py-4">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</div>
    </div>
);

// Baris rincian: label + bar 0–100 + angka. Dipakai untuk OJT 1–4 & aspek Development.
function ScoreRow({ label, value }) {
    const v = value;
    const pct = v == null ? 0 : Math.max(0, Math.min(100, v));
    const color = v == null ? "bg-slate-200" : v >= 70 ? "bg-blue-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-slate-600">{label}</span>
            <span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
            </span>
            <span className="w-10 text-right font-semibold text-slate-800 tabular-nums">{fmt(v)}</span>
        </div>
    );
}

function BigScore({ value }) {
    const b = band(value);
    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl font-bold text-slate-800">{fmt(value)}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${b.cls}`}>{b.label}</span>
        </div>
    );
}

export default function DevelopmentArsip({ kader = {}, scores = {} }) {
    const ojt = (scores.ojt ?? []).map((o) => ({ ...o, v: x10(o.score) }));
    const dev = (scores.dev ?? []).map((d) => ({ ...d, v: x10(d.score) }));
    const hasDev = dev.some((d) => d.v != null);
    const isResign = scores.status === "resign";

    return (
        <AppLayout title="REPORT ARSIP" breadcrumb="Report / Arsip Batch 1–2">
            <div className="max-w-5xl mx-auto space-y-4">
                {/* Bar aksi + penanda arsip */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <a
                        href="/report-new"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Pilih kader lain
                    </a>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700 bg-amber-100 rounded-lg">
                        📁 Data Arsip · Batch {kader.batch_roman ?? scores.batch_no}
                    </span>
                    <span className="text-xs text-slate-400 sm:ml-auto">
                        Skor akhir historis — tanpa grafik & tanpa breakdown FMC (data tidak melalui sistem)
                    </span>
                </div>

                {/* REPORT CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header band */}
                    <div className="bg-slate-800 text-white px-6 py-5 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">New Armada Group · People Development</div>
                            <h2 className="text-lg font-bold tracking-wide mt-1">MANAGEMENT TRAINEE DEVELOPMENT REPORT</h2>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[11px] uppercase tracking-widest text-slate-400">Periode</div>
                            <div className="text-sm font-semibold mt-1">
                                Batch {kader.batch_roman ?? kader.batch_name}{kader.batch_year ? ` · ${kader.batch_year}` : ""}
                            </div>
                        </div>
                    </div>

                    {/* Info row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 border-b border-slate-100">
                        <Info label="Nama" value={kader.nama} />
                        <Info
                            label="MT Batch · Department"
                            value={[kader.batch_roman ? `Batch ${kader.batch_roman}` : kader.batch_name, kader.departemen].filter(Boolean).join(" · ")}
                        />
                        <Info label="Business Unit" value={kader.bu} />
                        <MentorCell mentors={kader.mentors} />
                    </div>

                    {isResign && (
                        <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 text-sm text-rose-700 font-medium">
                            ⚠️ Kader ini tercatat <b>resign</b> di tengah program — sebagian nilai OJT tidak lengkap.
                        </div>
                    )}

                    {/* Body: A / B / C (statis, tanpa grafik) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                        {/* A · LEARNING GROWTH */}
                        <div className="p-5">
                            <SectionTitle code="A">Learning Growth</SectionTitle>
                            <BigScore value={scores.learning_growth} />
                            <div className="space-y-1.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <span className="w-4 border-t border-dashed border-orange-500 inline-block" /> KKM
                                    </span>
                                    <span className="font-semibold text-slate-800">{KKM}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 pt-1">Skor akhir rata-rata Learning Growth (arsip).</p>
                            </div>
                        </div>

                        {/* B · DEVELOPMENT PROGRESS */}
                        <div className="p-5">
                            <SectionTitle code="B">Development Progress</SectionTitle>
                            <BigScore value={scores.development_progress} />
                            {hasDev ? (
                                <div className="space-y-2.5">
                                    {dev.map((d, i) => (
                                        <ScoreRow key={i} label={d.label} value={d.v} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400">Rincian aspek tidak tersedia untuk batch ini — hanya skor akhir.</p>
                            )}
                        </div>

                        {/* C · FINAL OJT ASSESSMENT */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <SectionTitle code="C">Final OJT Assessment</SectionTitle>
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">Arsip</span>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 mb-4 text-center">
                                <div className="text-[11px] uppercase tracking-wide text-emerald-600">Final Score OJT · Rata-rata OJT 1–4</div>
                                <div className="text-3xl font-bold text-emerald-700 mt-1">{fmt(scores.fmc_avg)}</div>
                            </div>
                            <div className="space-y-2.5">
                                {ojt.map((o, i) => (
                                    <ScoreRow key={i} label={o.label} value={o.v} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
