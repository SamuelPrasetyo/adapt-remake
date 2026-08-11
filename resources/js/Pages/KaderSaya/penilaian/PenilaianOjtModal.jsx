import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import Toast from "@/Components/Toast";

/**
 * Form Assessment MT FMC — dinilai panel berisi 2 panelis, tapi formnya SATU:
 * skor yang diinput sudah merupakan rata-rata penilaian Panelis 1 & 2.
 *
 *   Tab "Informasi & Panelis" : bagian A (identitas evaluasi + input Nama Panelis 1 & 2)
 *   Tab "Penilaian"           : bagian B (Hard 100%), C (Soft 100%), D (70/30), E (catatan panel)
 *
 * Kode skor: {hard|soft}.{no} — catatan: catatan.{kekuatan|pengembangan}
 */

const PANELIS = [1, 2];

/**
 * Jabatan Panelis mengikuti aturan tetap (Read-Only, tidak diketik bebas):
 * Panelis 1 = BOD/Direksi, Panelis 2 = HR + nama Business Unit lengkap kader.
 */
function panelisPeranDefault(p, kader) {
    if (p === 1) return "BOD/Direksi";
    const bu = kader?.bu_name || kader?.bu || "";
    return bu ? `HR ${bu}` : "HR";
}

function fmt(score) {
    if (score === null || score === undefined) return "—";
    return Number(score).toFixed(1);
}

function scoreLabel(score) {
    if (score === null || score === undefined) return "";
    const v = Number(score) / 10;
    if (v >= 9) return "Sangat Baik";
    if (v >= 7) return "Baik";
    if (v >= 5) return "Cukup";
    if (v >= 3) return "Kurang";
    if (v >= 1) return "Sangat Kurang";
    return "";
}

/** Skor komposit 1 sheet: Σ(skor × bobot) ÷ Σ(bobot terisi) — bobot dinormalisasi ke item yang sudah dinilai. */
function composite(skor, items, sheet) {
    let weighted = 0;
    let bobotSum = 0;
    for (const item of items) {
        const v = skor[`${sheet}.${item.no}`];
        if (v === null || v === undefined || v === "") continue;
        weighted += Number(v) * item.bobot;
        bobotSum += item.bobot;
    }
    return bobotSum > 0 ? weighted / bobotSum : null;
}

/** Nilai akhir: Hard 70% + Soft 30% (dinormalisasi bila salah satu belum ada). */
function finalScoreOf(hard, soft, weights) {
    let sum = 0;
    let weightSum = 0;
    if (hard !== null) { sum += hard * weights.hard; weightSum += weights.hard; }
    if (soft !== null) { sum += soft * weights.soft; weightSum += weights.soft; }
    return weightSum > 0 ? sum / weightSum : null;
}

/* ---------- Sub-components ---------- */

function ScoreInput({ value, onChange, disabled, invalid }) {
    if (disabled) {
        return (
            <div className="w-20 sm:w-24 text-center text-lg font-semibold text-slate-700">
                {value !== null && value !== "" && value !== undefined ? value : "—"}
            </div>
        );
    }
    return (
        <input
            type="number"
            min="0"
            max="100"
            value={value ?? ""}
            placeholder="—"
            onKeyDown={(e) => {
                if (["-", "+", "e", "E", "."].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) => {
                const v = e.target.value;
                if (v === "") return onChange(null);
                const n = Math.max(0, Math.min(100, Number(v)));
                onChange(String(n));
            }}
            className={`w-20 sm:w-24 px-2.5 py-2 text-lg text-center font-semibold border rounded-lg focus:ring-2 outline-none ${
                invalid
                    ? "border-rose-400 bg-rose-50 focus:ring-rose-400 focus:border-rose-500"
                    : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
        />
    );
}

function TextField({ value, onChange, disabled, placeholder, label, required, invalid }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {disabled ? (
                <div className="px-3 py-2 text-base text-slate-700 bg-slate-50 border border-slate-200 rounded-lg min-h-11">
                    {value || <span className="italic text-slate-400">—</span>}
                </div>
            ) : (
                <input
                    type="text"
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 text-base border rounded-lg focus:ring-2 outline-none ${
                        invalid
                            ? "border-rose-400 bg-rose-50 focus:ring-rose-400 focus:border-rose-500"
                            : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                />
            )}
            {invalid && <p className="text-xs text-rose-600 mt-1">Wajib diisi.</p>}
        </div>
    );
}

function NoteField({ value, onChange, disabled, placeholder }) {
    if (disabled) {
        return (
            <div className="text-base text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-16 whitespace-pre-wrap">
                {value || <span className="italic text-slate-400">Belum ada catatan</span>}
            </div>
        );
    }
    return (
        <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
            <span className="text-base text-slate-800 mt-0.5">{value || <span className="italic text-slate-400">—</span>}</span>
        </div>
    );
}

/** Tabel kompetensi: No | Kompetensi | Bobot | Skor (0-100). Di layar kecil jadi daftar kartu. */
function CompetencyTable({ title, subtitle, items, sheet, skor, setSkor, disabled, showErrors }) {
    const komposit = composite(skor, items, sheet);
    const isEmpty  = (code) => { const v = skor[code]; return v === null || v === undefined || v === ""; };
    const belum    = items.filter(item => isEmpty(`${sheet}.${item.no}`)).length;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 bg-slate-800 text-white flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>}
                </div>
                {!disabled && belum > 0 && (
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        showErrors ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"
                    }`}>
                        {belum} belum diisi
                    </span>
                )}
            </div>

            {/* Mobile: satu kartu per kompetensi — tabel 4 kolom terlalu sempit di layar HP */}
            <div className="md:hidden divide-y divide-slate-100">
                {items.map(item => {
                    const code = `${sheet}.${item.no}`;
                    return (
                        <div key={item.no} className="flex items-start gap-3 px-4 py-3">
                            <span className="w-5 pt-2 text-sm font-semibold text-slate-400 shrink-0">{item.no}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 leading-snug">{item.name}</p>
                                <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-500">
                                    Bobot {item.bobot}%
                                </span>
                            </div>
                            <ScoreInput value={skor[code]} onChange={(v) => setSkor(code, v)} disabled={disabled}
                                invalid={showErrors && isEmpty(code)} />
                        </div>
                    );
                })}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-100 font-bold text-slate-800">
                    <span className="text-sm">Skor Komposit (0-100)</span>
                    <span className="text-lg">{fmt(komposit)}</span>
                </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-140">
                    <thead>
                        <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-2.5 text-left w-12">No</th>
                            <th className="px-4 py-2.5 text-left">Kompetensi</th>
                            <th className="px-4 py-2.5 text-center w-24">Bobot</th>
                            <th className="px-4 py-2.5 text-center w-36">Skor (0-100) <span className="text-rose-500">*</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(item => {
                            const code = `${sheet}.${item.no}`;
                            return (
                                <tr key={item.no} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3 text-base font-semibold text-slate-400">{item.no}</td>
                                    <td className="px-4 py-3 text-base text-slate-700">{item.name}</td>
                                    <td className="px-4 py-3 text-center text-base font-medium text-slate-600">{item.bobot}%</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <ScoreInput value={skor[code]} onChange={(v) => setSkor(code, v)} disabled={disabled}
                                invalid={showErrors && isEmpty(code)} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-800">
                            <td className="px-4 py-3 text-base" colSpan={2}>Skor Komposit (0-100)</td>
                            <td className="px-4 py-3 text-center text-base">
                                {items.reduce((a, b) => a + b.bobot, 0).toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 text-center text-lg">{fmt(komposit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

/* ---------- Tab: Informasi & Panelis (bagian A) ---------- */

function InfoSheet({ kader, fmc, panelisInfo, setPanelisInfo, tanggalEvaluasi, disabled, showErrors }) {
    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-slate-800 text-white">
                    <h3 className="text-base font-bold">A. Informasi Evaluasi</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 p-4 sm:p-5">
                    <InfoRow label="Nama Kader"      value={kader?.nama} />
                    <InfoRow label="NIK"             value={kader?.nik} />
                    <InfoRow label="Business Unit"   value={kader?.bu_name || kader?.bu} />
                    <InfoRow label="Divisi"          value={kader?.divisi_name} />
                    <InfoRow label="Departemen"      value={kader?.dept_name} />
                    <InfoRow label="Periode Evaluasi" value={`FMC-${fmc}`} />
                    <InfoRow label="Tanggal Evaluasi" value={tanggalEvaluasi} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-slate-800 text-white">
                    <h3 className="text-base font-bold">Panelis</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                        Nama kedua panelis wajib diisi sebelum penilaian dapat dimulai.
                    </p>
                </div>
                <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                    {PANELIS.map(p => (
                        <div key={p} className="border border-slate-200 rounded-xl p-4">
                            <div className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Panelis {p}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField
                                    label={`Nama Panelis ${p}`}
                                    required
                                    value={panelisInfo[p]?.nama}
                                    onChange={(v) => setPanelisInfo(p, "nama", v)}
                                    placeholder="Nama lengkap panelis"
                                    disabled={disabled}
                                    invalid={showErrors && (panelisInfo[p]?.nama ?? "").trim() === ""}
                                />
                                <TextField
                                    label="Peran Panelis"
                                    value={panelisInfo[p]?.peran}
                                    disabled
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- Tab: Penilaian (bagian B, C, D, E) ---------- */

function PenilaianSheet({ panelisInfo, structure, skor, setSkor, komentar, setKomentar, disabled, weights, scores, finalReport, setFinalReport, showErrors, missingCount }) {
    const hardItems = structure?.hard || [];
    const softItems = structure?.soft || [];

    return (
        <div className="space-y-5">
            {!disabled && showErrors && missingCount > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
                    ⚠️ <b>{missingCount} nilai kompetensi</b> belum diisi. Semua kompetensi Hard &amp; Soft wajib dinilai
                    (0–100) sebelum penilaian dapat disimpan — kolom yang kosong ditandai merah.
                </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">PANEL</span>
                {PANELIS.map(p => (
                    <span key={p} className="text-base font-semibold text-blue-900">
                        {p > 1 && <span className="text-blue-400 mr-3">&amp;</span>}
                        {panelisInfo[p]?.nama || <span className="italic font-normal text-blue-500">Panelis {p} belum diisi</span>}
                        {panelisInfo[p]?.peran && <span className="text-sm font-normal text-blue-700"> ({panelisInfo[p].peran})</span>}
                    </span>
                ))}
                <span className="w-full text-xs text-blue-700">
                    Skor yang diinput merupakan <b>rata-rata penilaian kedua panelis</b> (satu form untuk panel).
                </span>
            </div>

            <CompetencyTable
                title="B. Hard Competency"
                subtitle="Bobot internal 100% · semua kompetensi wajib dinilai"
                items={hardItems}
                sheet="hard"
                skor={skor}
                setSkor={setSkor}
                disabled={disabled}
                showErrors={showErrors}
            />

            <CompetencyTable
                title="C. Soft Competency"
                subtitle="Bobot internal 100% · semua kompetensi wajib dinilai"
                items={softItems}
                sheet="soft"
                skor={skor}
                setSkor={setSkor}
                disabled={disabled}
                showErrors={showErrors}
            />

            {/* D. Rekapitulasi */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-slate-800 text-white">
                    <h3 className="text-base font-bold">D. Rekapitulasi Skor Panel</h3>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                    {[
                        { label: "Skor Komposit Hard Competency", value: scores.hard, bobot: weights.hard },
                        { label: "Skor Komposit Soft Competency", value: scores.soft, bobot: weights.soft },
                    ].map(r => (
                        <div key={r.label} className="flex items-center justify-between gap-3 sm:gap-4 text-sm sm:text-base">
                            <span className="text-slate-600">{r.label}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500 w-24 text-right">Bobot {Math.round(r.bobot * 100)}%</span>
                                <span className="font-semibold text-slate-800 w-14 text-right">{fmt(r.value)}</span>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-base font-bold text-slate-800">NILAI AKHIR</span>
                        <span className="text-2xl font-bold text-emerald-600">{fmt(scores.finalScore)}</span>
                    </div>
                </div>
            </div>

            {/* E. Catatan panel */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-slate-800 text-white">
                    <h3 className="text-base font-bold">E. Area Kekuatan & Area Pengembangan</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Catatan panel</p>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Area Kekuatan</label>
                        <NoteField
                            value={komentar["catatan.kekuatan"]}
                            onChange={(v) => setKomentar("catatan.kekuatan", v)}
                            disabled={disabled}
                            placeholder="Tuliskan area kekuatan Kader menurut panel..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Area Pengembangan</label>
                        <NoteField
                            value={komentar["catatan.pengembangan"]}
                            onChange={(v) => setKomentar("catatan.pengembangan", v)}
                            disabled={disabled}
                            placeholder="Tuliskan area pengembangan Kader menurut panel..."
                        />
                    </div>
                </div>
            </div>

            {/* Final Recommendation */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-bold text-slate-800 mb-3">Final Recommendation</label>
                {disabled ? (
                    <div className="text-sm font-semibold">
                        {finalReport.final_recommendation === "recommended" && <span className="text-emerald-600">✓ Recommended</span>}
                        {finalReport.final_recommendation === "not_recommended" && <span className="text-rose-600">✗ Not Recommended</span>}
                        {!finalReport.final_recommendation && <span className="italic text-slate-400">Belum dipilih</span>}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: "recommended",     label: "✓ Recommended",     cls: "border-emerald-300 text-emerald-700 bg-emerald-50", activeCls: "ring-2 ring-emerald-500 bg-emerald-100" },
                            { value: "not_recommended", label: "✗ Not Recommended", cls: "border-rose-300 text-rose-700 bg-rose-50",         activeCls: "ring-2 ring-rose-500 bg-rose-100" },
                        ].map(opt => {
                            const active = finalReport.final_recommendation === opt.value;
                            return (
                                <button
                                    type="button"
                                    key={opt.value}
                                    onClick={() => setFinalReport({ ...finalReport, final_recommendation: active ? null : opt.value })}
                                    className={`px-4 py-2 text-sm font-semibold border rounded-lg transition ${opt.cls} ${active ? opt.activeCls : ""}`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- Main Modal ---------- */

export default function PenilaianOjtModal({
    fmc,
    kader,
    kaderId,
    structure,
    initialSkor = {},
    initialKomentar = {},
    initialFinalReport = {},
    canEdit: canEditProp = false,
    onClose,
}) {
    const approvalStatus = initialFinalReport?.approval_status ?? "pending";
    const locked = approvalStatus === "approved";
    const canEdit = canEditProp && !locked;
    const weights = structure?.weights || { hard: 0.7, soft: 0.3 };

    const [activeTab, setActiveTab] = useState("info");
    const formScrollRef = useRef(null);
    const [skor, setSkorState] = useState(initialSkor || {});
    const [komentar, setKomentarState] = useState(initialKomentar || {});
    const [panelisInfo, setPanelisInfoState] = useState({
        1: { nama: initialFinalReport.panelis1_nama ?? "", peran: panelisPeranDefault(1, kader) },
        2: { nama: initialFinalReport.panelis2_nama ?? "", peran: panelisPeranDefault(2, kader) },
    });
    const [finalReport, setFinalReport] = useState({
        final_recommendation: initialFinalReport.final_recommendation ?? null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const setSkor = (code, val) => setSkorState(prev => ({ ...prev, [code]: val }));
    const setKomentar = (code, val) => setKomentarState(prev => ({ ...prev, [code]: val }));
    const setPanelisInfo = (p, field, val) =>
        setPanelisInfoState(prev => ({ ...prev, [p]: { ...prev[p], [field]: val } }));

    // Nama kedua panelis adalah gerbang: tanpa itu, lembar penilaian belum bisa dibuka.
    const panelisReady = PANELIS.every(p => (panelisInfo[p]?.nama ?? "").trim() !== "");
    const tabLocked = canEdit && !panelisReady;

    // Semua kompetensi Hard & Soft wajib dinilai — skor komposit tidak boleh setengah jalan.
    const missingCount = useMemo(() => {
        const items = [
            ...(structure?.hard || []).map(i => `hard.${i.no}`),
            ...(structure?.soft || []).map(i => `soft.${i.no}`),
        ];
        return items.filter(code => {
            const v = skor[code];
            return v === null || v === undefined || v === "";
        }).length;
    }, [skor, structure]);

    const tanggalEvaluasi = useMemo(() => {
        const iso = initialFinalReport?.updated_at;
        const d = iso ? new Date(iso) : new Date();
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    }, [initialFinalReport?.updated_at]);

    // ESC close
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // Live-compute scores
    const scores = useMemo(() => {
        const hard = composite(skor, structure?.hard || [], "hard");
        const soft = composite(skor, structure?.soft || [], "soft");
        return { hard, soft, finalScore: finalScoreOf(hard, soft, weights) };
    }, [skor, structure, weights]);

    const TABS = [
        { id: "info",      label: "Informasi & Panelis" },
        { id: "penilaian", label: "Penilaian", gated: true },
    ];

    const goTab = (id) => {
        setActiveTab(id);
        formScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    };

    const handleSubmit = () => {
        if (!canEdit) return;

        // Validasi klien: nama panelis + seluruh nilai kompetensi. Server memvalidasi hal
        // yang sama, ini hanya supaya user langsung diarahkan ke field yang kosong.
        setShowErrors(true);

        if (!panelisReady) {
            setToast({ open: true, type: "error", message: "Nama Panelis 1 dan 2 wajib diisi." });
            goTab("info");
            return;
        }
        if (missingCount > 0) {
            setToast({ open: true, type: "error", message: `${missingCount} nilai kompetensi belum diisi.` });
            goTab("penilaian");
            return;
        }

        setSubmitting(true);

        // Skor kosong dikirim sebagai null (bukan 0) supaya nilai yang sengaja dihapus
        // ikut terhapus di DB, bukan tertinggal memakai nilai lama.
        const skorPayload = {};
        Object.entries(skor).forEach(([k, v]) => {
            skorPayload[k] = (v === null || v === "" || v === undefined) ? null : Number(v);
        });

        router.post(`/kader-saya/${kaderId}/penilaian/${fmc}`, {
            skor: skorPayload,
            komentar,
            panelis: {
                1: { nama: panelisInfo[1].nama.trim(), peran: panelisInfo[1].peran?.trim() || null },
                2: { nama: panelisInfo[2].nama.trim(), peran: panelisInfo[2].peran?.trim() || null },
            },
            final_report: finalReport,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setToast({ open: true, type: "success", message: `Penilaian FMC-${fmc} berhasil disimpan.` });
                setTimeout(() => onClose?.(), 700);
            },
            onError: (errors) => {
                const pesan = Object.values(errors || {})[0];
                setToast({ open: true, type: "error", message: pesan || "Gagal menyimpan penilaian." });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, open: false }))} />
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 shrink-0">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Form Assessment MT — FMC-{fmc}</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                            {kader?.nama} {kader?.dept_name ? `· ${kader.dept_name}` : ""}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-3xl leading-none p-1 shrink-0"
                        aria-label="Close"
                    >×</button>
                </div>

                {/* Approval status banner */}
                {locked && (
                    <div className="px-4 sm:px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-sm text-emerald-700 shrink-0">
                        🔒 Penilaian sudah <b>disetujui Admin MAI</b> dan terkunci — tidak dapat diubah.
                    </div>
                )}
                {approvalStatus === "rejected" && canEditProp && (
                    <div className="px-4 sm:px-6 py-2.5 bg-red-50 border-b border-red-200 text-sm text-red-700 shrink-0">
                        ❌ Ditolak Admin MAI{initialFinalReport?.rejection_reason ? `: "${initialFinalReport.rejection_reason}"` : ""}. Perbaiki lalu simpan ulang untuk diajukan kembali.
                    </div>
                )}
                {tabLocked && (
                    <div className="px-4 sm:px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-sm text-amber-700 shrink-0">
                        ✏️ Isi <b>Nama Panelis 1 & 2</b> pada tab Informasi &amp; Panelis untuk membuka lembar penilaian.
                    </div>
                )}

                {/* Tab strip */}
                <div className="flex border-b border-slate-200 px-4 sm:px-6 shrink-0 overflow-x-auto">
                    {TABS.map(t => {
                        const disabledTab = t.gated && tabLocked;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                disabled={disabledTab}
                                onClick={() => !disabledTab && goTab(t.id)}
                                className={`px-4 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base font-semibold transition border-b-2 -mb-px whitespace-nowrap ${
                                    activeTab === t.id
                                        ? "border-blue-500 text-blue-600"
                                        : disabledTab
                                            ? "border-transparent text-slate-300 cursor-not-allowed"
                                            : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {disabledTab && "🔒 "}{t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Body: 2 kolom di desktop, form + bar ringkasan di bawah untuk layar kecil */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Form (scrollable) */}
                    <div ref={formScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 bg-slate-50">
                        {activeTab === "info" && (
                            <InfoSheet
                                kader={kader}
                                fmc={fmc}
                                panelisInfo={panelisInfo}
                                setPanelisInfo={setPanelisInfo}
                                tanggalEvaluasi={tanggalEvaluasi}
                                disabled={!canEdit}
                                showErrors={showErrors}
                            />
                        )}
                        {activeTab === "penilaian" && (
                            <PenilaianSheet
                                panelisInfo={panelisInfo}
                                structure={structure}
                                skor={skor}
                                setSkor={setSkor}
                                komentar={komentar}
                                setKomentar={setKomentar}
                                disabled={!canEdit}
                                weights={weights}
                                scores={scores}
                                finalReport={finalReport}
                                setFinalReport={setFinalReport}
                                showErrors={showErrors}
                                missingCount={missingCount}
                            />
                        )}
                    </div>

                    {/* Ringkasan skor + aksi: sidebar kanan di desktop, bar bawah di layar kecil */}
                    <div className="shrink-0 w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-row lg:flex-col items-center lg:items-stretch gap-3 lg:gap-4 p-3 lg:p-5 lg:overflow-y-auto">
                        {/* Layar kecil: rincian Hard/Soft sudah ada di bagian D, jadi cukup nilai akhirnya */}
                        <div className="lg:hidden flex items-baseline gap-2 mr-auto min-w-0">
                            <span className="text-xs text-slate-500 shrink-0">Nilai Akhir</span>
                            <span className="text-2xl font-bold text-emerald-600">{fmt(scores.finalScore)}</span>
                        </div>

                        <div className="hidden lg:block bg-slate-900 text-white rounded-2xl p-5">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                Nilai Akhir FMC-{fmc}
                            </div>
                            <div className="text-xs text-slate-500 mb-4">
                                Hard {Math.round(weights.hard * 100)}% · Soft {Math.round(weights.soft * 100)}%
                            </div>
                            <div className="text-5xl font-bold leading-none text-emerald-400">{fmt(scores.finalScore)}</div>
                            <div className="text-sm text-slate-400 mt-2">{scoreLabel(scores.finalScore) || "—"}</div>
                            <div className="border-t border-slate-700 mt-4 pt-3 space-y-2">
                                {[
                                    { label: "Hard Competency", v: scores.hard },
                                    { label: "Soft Competency", v: scores.soft },
                                ].map(r => (
                                    <div key={r.label} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{r.label}</span>
                                        <span className="text-base font-bold">{fmt(r.v)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-700 mt-3 pt-3 text-xs text-slate-400 leading-relaxed">
                                Panel: {PANELIS.map(p => panelisInfo[p]?.nama).filter(Boolean).join(" & ") || "—"}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-row lg:flex-col gap-2 lg:mt-auto shrink-0">
                            {canEdit && (missingCount > 0 || !panelisReady) && (
                                <p className="hidden lg:block text-xs text-amber-600 leading-relaxed">
                                    {!panelisReady
                                        ? "Nama Panelis 1 & 2 wajib diisi."
                                        : `${missingCount} nilai kompetensi belum diisi.`}
                                </p>
                            )}
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            <span className="hidden sm:inline">Simpan Penilaian</span>
                                            <span className="sm:hidden lg:hidden">Simpan</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full px-4 py-2.5 lg:py-3 text-sm lg:text-base font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition whitespace-nowrap"
                            >
                                {canEdit ? "Batal" : "Tutup"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
