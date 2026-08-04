import { Fragment, useState } from "react";
import PenilaianOjtModal from "../penilaian/PenilaianOjtModal";
import { scoreTone } from "@/Components/Report/reportUi";

const FMC_LIST = [1, 2, 3];

const fmt1 = (v) => (v == null ? "—" : Number(v).toFixed(1));

/** Panah penghubung antar tahap OJT — disembunyikan saat kartu sudah membungkus ke baris baru. */
function StepArrow() {
    return (
        <svg className="hidden xl:block w-5 h-5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
    );
}

/** Cincin progres 0–100 untuk Final Score; warnanya ikut band KKM. */
function ScoreRing({ value, size = 168, stroke = 14 }) {
    const pct = value == null ? 0 : Math.max(0, Math.min(100, Number(value)));
    const r = (size - stroke) / 2;
    const keliling = 2 * Math.PI * r;
    const c = size / 2;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
            <circle
                cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
                className={scoreTone(value).stroke}
                strokeDasharray={`${(pct / 100) * keliling} ${keliling}`}
                transform={`rotate(-90 ${c} ${c})`}
            />
        </svg>
    );
}

/**
 * Penilaian OJT kader batch arsip (Batch 1-2) — read-only.
 *
 * Batch arsip tidak pernah mengisi form FMC di sistem; yang tersimpan hanya skor akhir
 * OJT 1-4 hasil impor Excel (report_arsip). Ditampilkan sebagai alur OJT 1 → 4 yang
 * bermuara ke Final Score (rata-rata OJT 1-4), tanpa tombol lihat/isi karena memang tidak
 * ada form penilaian di baliknya.
 */
function PenilaianOjtArsip({ ojt }) {
    return (
        <div className="space-y-5">
            {ojt.status === "resign" && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
                    ⚠️ Kader ini tercatat <b>resign</b> di tengah program — sebagian nilai OJT tidak lengkap.
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-center gap-3 xl:gap-2">
                    {ojt.list.map((o) => (
                        <Fragment key={o.label}>
                            <div className="flex-1 min-w-38 rounded-2xl border border-slate-200 px-4 py-5 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{o.label}</div>
                                {o.score != null ? (
                                    <>
                                        <div className={`text-4xl font-bold mt-2 ${scoreTone(o.score).text}`}>{fmt1(o.score)}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{scoreLabel(o.score)}</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-4xl font-bold text-slate-300 mt-2">—</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Belum dinilai</div>
                                    </>
                                )}
                                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                                    {o.score != null ? "Nilai arsip" : "Tidak ada nilai"}
                                </div>
                            </div>
                            <StepArrow />
                        </Fragment>
                    ))}

                    <div className="flex flex-col items-center shrink-0 px-2">
                        <div className="relative" style={{ width: 168, height: 168 }}>
                            <ScoreRing value={ojt.final} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">
                                    Final Score OJT
                                </div>
                                <div className={`text-4xl font-bold leading-none mt-1 ${scoreTone(ojt.final).text}`}>{fmt1(ojt.final)}</div>
                                <div className="text-xs text-slate-400 mt-1">{scoreLabel(ojt.final)}</div>
                            </div>
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-2">
                            Rata-rata OJT 1–4
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function statusFromPenilaian(p) {
    if (!p?.exists) return { label: "Belum mulai", cls: "text-slate-400" };
    if (p.approval_status === "approved") return { label: "Disetujui ✓ (terkunci)", cls: "text-emerald-600" };
    if (p.approval_status === "rejected") return { label: "Ditolak Admin MAI", cls: "text-red-600" };
    if (p.final_score == null) return { label: "Draft", cls: "text-amber-600" };
    return { label: "Menunggu approval", cls: "text-amber-600" };
}

function scoreLabel(score) {
    if (score == null) return "—";
    const v = Number(score) / 10;
    if (v >= 9)    return "Sangat Baik";
    if (v >= 7)    return "Baik";
    if (v >= 5)    return "Cukup";
    if (v >= 3)    return "Kurang";
    if (v >= 1)    return "Sangat Kurang";
    return "—";
}

export default function PenilaianOjtTab({
    kader,
    kaderId,
    penilaianList = [],
    skorMap = {},
    komentarMap = {},
    structure,
    canEdit = false,
    kaderView = false,
    arsipOjt = null,
}) {
    const [openFmc, setOpenFmc] = useState(null);

    // Kader batch arsip: nilainya sudah final di report_arsip, tidak bergantung pada form
    // FMC — jadi ditampilkan apa adanya.
    if (arsipOjt) return <PenilaianOjtArsip ojt={arsipOjt} />;

    const byFmc = Object.fromEntries(penilaianList.map(p => [p.fmc, p]));

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FMC_LIST.map((fmc) => {
                    const p = byFmc[fmc];
                    const status = statusFromPenilaian(p);
                    const hasData = p?.exists;
                    const locked = p?.approval_status === "approved";
                    // FMC-N terkunci jika FMC sebelumnya belum ada data
                    const prevMissing = fmc > 1 && !byFmc[fmc - 1]?.exists;
                    const fmcCanEdit = canEdit && !locked && !prevMissing;

                    return (
                        <div key={fmc} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col transition ${
                            prevMissing ? "border-slate-200 opacity-60" : "border-slate-200"
                        }`}>
                            <div className="text-center mb-3 flex items-center justify-center gap-1.5">
                                <div className="text-xs font-semibold text-slate-500 tracking-wide">FMC-{fmc}</div>
                                {prevMissing && (
                                    <span title={`Isi FMC-${fmc - 1} terlebih dahulu`}>
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center py-2">
                                {prevMissing ? (
                                    <div className="text-center px-2">
                                        <div className="text-3xl text-slate-300 font-bold mb-2">🔒</div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Isi FMC-{fmc - 1} terlebih dahulu sebelum mengisi FMC-{fmc}.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {p?.final_score != null ? (
                                            <>
                                                <div className="text-4xl font-bold text-emerald-600">{Number(p.final_score).toFixed(1)}</div>
                                                <div className="text-xs text-slate-400 mt-1">{scoreLabel(p.final_score)}</div>
                                            </>
                                        ) : (
                                            <div className="text-3xl text-slate-300 font-bold">—</div>
                                        )}
                                        <div className={`text-xs font-medium mt-3 ${status.cls}`}>{status.label}</div>
                                        {hasData && (p?.panelis1_nama || p?.panelis2_nama) && (
                                            <div className="text-[11px] text-slate-400 mt-1.5 text-center px-2 leading-relaxed">
                                                Panelis: {[p.panelis1_nama, p.panelis2_nama].filter(Boolean).join(" & ")}
                                            </div>
                                        )}
                                        {p?.approval_status === "rejected" && p?.rejection_reason && (
                                            <div className="text-[11px] text-red-500 mt-1 text-center px-2">"{p.rejection_reason}"</div>
                                        )}
                                    </>
                                )}
                            </div>

                            {!kaderView && (
                                <button
                                    type="button"
                                    disabled={prevMissing}
                                    onClick={() => !prevMissing && setOpenFmc(fmc)}
                                    className={`mt-3 w-full px-3 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                                        prevMissing
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : hasData
                                                ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                >
                                    {prevMissing
                                        ? "🔒 Terkunci"
                                        : hasData
                                            ? (fmcCanEdit ? "✏️ Edit" : "👁️ Lihat")
                                            : (fmcCanEdit ? "📋 Isi Penilaian" : "👁️ Lihat")}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info box "Cara Pengisian" */}
            {!kaderView && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-900">Cara Pengisian</p>
                        <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                            {canEdit
                                ? "Klik \"Isi Penilaian\" pada FMC yang sedang berjalan. Isi Nama Panelis 1 & 2 terlebih dahulu, lalu satu lembar penilaian Hard Competency dan Soft Competency (skala 0–100) — skor yang diinput adalah rata-rata penilaian kedua panelis. Nilai akhir otomatis terhitung dari Hard 70% + Soft 30%."
                                : "Anda mode lihat saja (Admin). Penilaian OJT hanya dapat diinput oleh Mentor pembimbing Kader."}
                        </p>
                    </div>
                </div>
            )}

            {openFmc !== null && (
                <PenilaianOjtModal
                    fmc={openFmc}
                    kader={kader}
                    kaderId={kaderId}
                    structure={structure}
                    initialSkor={skorMap[openFmc] || {}}
                    initialKomentar={komentarMap[openFmc] || {}}
                    initialFinalReport={byFmc[openFmc] || {}}
                    canEdit={canEdit}
                    onClose={() => setOpenFmc(null)}
                />
            )}
        </div>
    );
}
