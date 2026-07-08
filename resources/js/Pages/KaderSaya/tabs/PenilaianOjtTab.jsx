import { useState } from "react";
import PenilaianOjtModal from "../penilaian/PenilaianOjtModal";

const FMC_LIST = [1, 2, 3];

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
}) {
    // ─────────────────────────────────────────────────────────────
    // NOTE: Tampilan Penilaian OJT (kartu FMC-1/2/3) dinonaktifkan
    // sementara karena ada perubahan form Penilaian OJT dari stakeholder.
    // Kode lama TIDAK DIHAPUS — hanya di-comment (lihat blok di bawah).
    // Untuk mengaktifkan kembali: hapus return notifikasi di bawah ini
    // dan un-comment blok "TAMPILAN LAMA".
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-sm py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                On Development
            </span>
            <h3 className="text-lg font-bold text-slate-800">Penilaian OJT sedang diperbarui</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                Fitur Penilaian OJT untuk sementara tidak tersedia.
                Mohon menunggu, fitur ini akan kembali aktif setelah penyesuaian selesai.
            </p>
        </div>
    );

    /* ─────────────────────────────────────────────────────────────
     * TAMPILAN LAMA (dinonaktifkan sementara — JANGAN DIHAPUS).
     * Un-comment blok di bawah untuk mengaktifkan kembali Penilaian OJT.
     * ─────────────────────────────────────────────────────────────
    const [openFmc, setOpenFmc] = useState(null);

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

            {/* Info box "Cara Pengisian" *}
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
                                ? "Klik \"Isi Penilaian\" pada FMC yang sedang berjalan. Terdiri dari 4 tab: OJT Sheet (30%), Value Sheet (30%), Presentation Sheet (40%), dan Final Report. Skor menggunakan skala 0–100. Nilai akhir otomatis terhitung dari weighted average."
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
    ───────────────────────────────────────────────────────────── */
}
