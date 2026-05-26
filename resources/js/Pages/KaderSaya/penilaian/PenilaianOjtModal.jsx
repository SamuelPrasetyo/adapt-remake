import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import Toast from "@/Components/Toast";

const SHEET_TABS = [
    { id: "ojt",   label: "OJT Sheet",          weight: "30%" },
    { id: "value", label: "Value Sheet",        weight: "30%" },
    { id: "pres",  label: "Presentation Sheet", weight: "40%" },
    { id: "final", label: "Final Report",       weight: "" },
];

function avgOrNull(arr) {
    const nums = arr.filter(v => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v)));
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + Number(b), 0) / nums.length;
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

/* ---------- Aggregators per sheet ---------- */

function computeOjtAspekScores(skor, ojtStruct) {
    return ojtStruct.map(aspek => {
        const vals = [];
        for (const sub of aspek.subs) {
            for (const ind of sub.indicators) {
                const code = `ojt.${aspek.no}.${sub.code}.${ind.no}`;
                if (skor[code] != null && skor[code] !== "") vals.push(Number(skor[code]));
            }
        }
        return avgOrNull(vals);
    });
}

function computeValueAspekScores(skor, valueStruct) {
    return valueStruct.map(aspek => {
        const vals = aspek.indicators
            .map(ind => skor[`value.${aspek.no}.${ind.no}`])
            .filter(v => v != null && v !== "");
        return avgOrNull(vals);
    });
}

function computePresSectionScores(skor, presStruct) {
    return presStruct.map(section => {
        const vals = section.indicators
            .map(ind => skor[`pres.${section.code}.${ind.no}`])
            .filter(v => v != null && v !== "");
        return avgOrNull(vals);
    });
}

/* ---------- Sub-components ---------- */

function ScoreInput({ value, onChange, disabled }) {
    if (disabled) {
        return (
            <div className="w-20 text-center text-sm font-semibold text-slate-700">
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
            onChange={(e) => {
                const v = e.target.value;
                if (v === "") return onChange(null);
                const n = Math.max(0, Math.min(100, Number(v)));
                onChange(String(n));
            }}
            className="w-20 px-2.5 py-1.5 text-sm text-center font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
    );
}

function CommentField({ value, onChange, disabled, placeholder }) {
    if (disabled) {
        return (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 min-h-[44px] whitespace-pre-wrap">
                {value || <span className="italic text-slate-400">Belum ada komentar</span>}
            </div>
        );
    }
    return (
        <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            placeholder={placeholder || "Tulis komentar untuk sub-aspek ini..."}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
    );
}

function ScoreRow({ no, text, value, onChange, disabled }) {
    return (
        <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
            <div className="w-6 text-xs font-semibold text-slate-400 pt-1.5 shrink-0">{no}.</div>
            <div className="flex-1 text-xs text-slate-700 leading-relaxed pt-1.5">{text}</div>
            <ScoreInput value={value} onChange={onChange} disabled={disabled} />
        </div>
    );
}

function AspekScoreBadge({ label, score }) {
    return (
        <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 mt-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
            <span className="text-base font-bold text-slate-800">{fmt(score)}</span>
        </div>
    );
}

/* ---------- Tab Content ---------- */

function OjtSheet({ ojtStruct, skor, komentar, setSkor, setKomentar, disabled }) {
    return (
        <div className="space-y-5">
            {ojtStruct.map(aspek => {
                const aspekVals = [];
                aspek.subs.forEach(sub => sub.indicators.forEach(ind => {
                    const v = skor[`ojt.${aspek.no}.${sub.code}.${ind.no}`];
                    if (v != null && v !== "") aspekVals.push(Number(v));
                }));
                const aspekScore = avgOrNull(aspekVals);

                return (
                    <div key={aspek.no} className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-800">{aspek.no}. {aspek.name}</h3>
                        {aspek.desc && <p className="text-xs italic text-slate-500 mt-1 leading-relaxed">{aspek.desc}</p>}

                        <div className="space-y-4 mt-3">
                            {aspek.subs.map(sub => (
                                <div key={sub.code} className="border-l-2 border-purple-200 pl-3">
                                    <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">
                                        {sub.code.toUpperCase()}. {sub.name}
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {sub.indicators.map(ind => {
                                            const code = `ojt.${aspek.no}.${sub.code}.${ind.no}`;
                                            return (
                                                <ScoreRow
                                                    key={ind.no}
                                                    no={ind.no}
                                                    text={ind.text}
                                                    value={skor[code]}
                                                    onChange={(v) => setSkor(code, v)}
                                                    disabled={disabled}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Komentar Sub-Aspek {sub.code.toUpperCase()}</label>
                                        <CommentField
                                            value={komentar[`ojt.${aspek.no}.${sub.code}`]}
                                            onChange={(v) => setKomentar(`ojt.${aspek.no}.${sub.code}`, v)}
                                            disabled={disabled}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <AspekScoreBadge label={`Skor Aspek ${aspek.no} — ${aspek.name}`} score={aspekScore} />
                    </div>
                );
            })}
        </div>
    );
}

function ValueSheet({ valueStruct, skor, komentar, setSkor, setKomentar, disabled }) {
    return (
        <div className="space-y-5">
            {valueStruct.map(aspek => {
                const vals = aspek.indicators
                    .map(ind => skor[`value.${aspek.no}.${ind.no}`])
                    .filter(v => v != null && v !== "")
                    .map(Number);
                const aspekScore = avgOrNull(vals);

                return (
                    <div key={aspek.no} className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-800">{aspek.no}. {aspek.name}</h3>
                        {aspek.desc && <p className="text-xs italic text-slate-500 mt-1 leading-relaxed">{aspek.desc}</p>}

                        <div className="divide-y divide-slate-100 mt-3">
                            {aspek.indicators.map(ind => {
                                const code = `value.${aspek.no}.${ind.no}`;
                                return (
                                    <ScoreRow
                                        key={ind.no}
                                        no={ind.no}
                                        text={ind.text}
                                        value={skor[code]}
                                        onChange={(v) => setSkor(code, v)}
                                        disabled={disabled}
                                    />
                                );
                            })}
                        </div>

                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Komentar — {aspek.name}</label>
                            <CommentField
                                value={komentar[`value.${aspek.no}`]}
                                onChange={(v) => setKomentar(`value.${aspek.no}`, v)}
                                disabled={disabled}
                            />
                        </div>

                        <AspekScoreBadge label={`Skor Aspek ${aspek.no}`} score={aspekScore} />
                    </div>
                );
            })}
        </div>
    );
}

function PresentationSheet({ presStruct, skor, komentar, setSkor, setKomentar, disabled }) {
    return (
        <div className="space-y-5">
            {presStruct.map(section => {
                const vals = section.indicators
                    .map(ind => skor[`pres.${section.code}.${ind.no}`])
                    .filter(v => v != null && v !== "")
                    .map(Number);
                const sectionScore = avgOrNull(vals);

                return (
                    <div key={section.code} className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-bold text-slate-800">{section.code}. {section.name}</h3>
                        {section.desc && <p className="text-xs italic text-slate-500 mt-1 leading-relaxed">{section.desc}</p>}

                        <div className="divide-y divide-slate-100 mt-3">
                            {section.indicators.map(ind => {
                                const code = `pres.${section.code}.${ind.no}`;
                                return (
                                    <ScoreRow
                                        key={ind.no}
                                        no={ind.no}
                                        text={ind.text}
                                        value={skor[code]}
                                        onChange={(v) => setSkor(code, v)}
                                        disabled={disabled}
                                    />
                                );
                            })}
                        </div>

                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Komentar — {section.name}</label>
                            <CommentField
                                value={komentar[`pres.${section.code}`]}
                                onChange={(v) => setKomentar(`pres.${section.code}`, v)}
                                disabled={disabled}
                            />
                        </div>

                        <AspekScoreBadge label={`Skor Section ${section.code}`} score={sectionScore} />
                    </div>
                );
            })}
        </div>
    );
}

function FinalReportSheet({ finalReport, setFinalReport, scores, disabled }) {
    const { ojtGrand, valueGrand, presGrand, finalScore } = scores;

    return (
        <div className="space-y-5">
            {/* Summary scores */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">Ringkasan Skor</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <div className="text-xs text-slate-400">OJT (30%)</div>
                        <div className="text-2xl font-bold">{fmt(ojtGrand)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Value (30%)</div>
                        <div className="text-2xl font-bold">{fmt(valueGrand)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400">Presentation (40%)</div>
                        <div className="text-2xl font-bold">{fmt(presGrand)}</div>
                    </div>
                </div>
                <div className="border-t border-slate-700 pt-3 flex items-end justify-between">
                    <div>
                        <div className="text-xs text-slate-400">Final Score</div>
                        <div className="text-4xl font-bold text-emerald-400">{fmt(finalScore)}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-300">{scoreLabel(finalScore)}</div>
                </div>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                    Overview <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                </label>
                {disabled ? (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
                        {finalReport.overview || <span className="italic text-slate-400">—</span>}
                    </div>
                ) : (
                    <textarea
                        value={finalReport.overview ?? ""}
                        onChange={(e) => setFinalReport({ ...finalReport, overview: e.target.value })}
                        rows={3}
                        placeholder="Tulis overview umum mengenai performa Kader pada FMC ini..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                )}
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-bold text-slate-800 mb-2">A. Strengths</label>
                {disabled ? (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
                        {finalReport.strengths || <span className="italic text-slate-400">—</span>}
                    </div>
                ) : (
                    <textarea
                        value={finalReport.strengths ?? ""}
                        onChange={(e) => setFinalReport({ ...finalReport, strengths: e.target.value })}
                        rows={3}
                        placeholder="Tuliskan kekuatan/strengths Kader..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                )}
            </div>

            {/* Weakness */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-bold text-slate-800 mb-2">B. Weakness</label>
                {disabled ? (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
                        {finalReport.weakness || <span className="italic text-slate-400">—</span>}
                    </div>
                ) : (
                    <textarea
                        value={finalReport.weakness ?? ""}
                        onChange={(e) => setFinalReport({ ...finalReport, weakness: e.target.value })}
                        rows={3}
                        placeholder="Tuliskan kelemahan/weakness Kader..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                )}
            </div>

            {/* Mentor's Comments */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="block text-sm font-bold text-slate-800 mb-2">Mentor's Comments</label>
                {disabled ? (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
                        {finalReport.mentor_comments || <span className="italic text-slate-400">—</span>}
                    </div>
                ) : (
                    <textarea
                        value={finalReport.mentor_comments ?? ""}
                        onChange={(e) => setFinalReport({ ...finalReport, mentor_comments: e.target.value })}
                        rows={3}
                        placeholder="Komentar keseluruhan dari Mentor..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                )}
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
    canEdit = false,
    onClose,
}) {
    const [activeTab, setActiveTab] = useState("ojt");
    const [skor, setSkorState] = useState(initialSkor || {});
    const [komentar, setKomentarState] = useState(initialKomentar || {});
    const [finalReport, setFinalReport] = useState({
        overview:             initialFinalReport.overview ?? "",
        strengths:            initialFinalReport.strengths ?? "",
        weakness:             initialFinalReport.weakness ?? "",
        mentor_comments:      initialFinalReport.mentor_comments ?? "",
        final_recommendation: initialFinalReport.final_recommendation ?? null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const setSkor = (code, val) => setSkorState(prev => ({ ...prev, [code]: val }));
    const setKomentar = (code, val) => setKomentarState(prev => ({ ...prev, [code]: val }));

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
        const ojtAspekScores  = computeOjtAspekScores(skor, structure?.ojt || []);
        const valueAspekScores = computeValueAspekScores(skor, structure?.value || []);
        const presSectionScores = computePresSectionScores(skor, structure?.presentation || []);

        const ojtGrand   = avgOrNull(ojtAspekScores);
        const valueGrand = avgOrNull(valueAspekScores);
        const presGrand  = avgOrNull(presSectionScores);

        const w = structure?.weights || { ojt: 0.3, value: 0.3, presentation: 0.4 };
        const parts = [];
        let weightSum = 0;
        if (ojtGrand   !== null) { parts.push(ojtGrand   * w.ojt);          weightSum += w.ojt; }
        if (valueGrand !== null) { parts.push(valueGrand * w.value);        weightSum += w.value; }
        if (presGrand  !== null) { parts.push(presGrand  * w.presentation); weightSum += w.presentation; }
        const finalScore = weightSum > 0 ? parts.reduce((a, b) => a + b, 0) / weightSum : null;

        return { ojtGrand, valueGrand, presGrand, finalScore };
    }, [skor, structure]);

    const handleSubmit = () => {
        if (!canEdit) return;
        setSubmitting(true);

        // Strip empty skor (null/"") agar tidak terkirim sebagai 0
        const skorPayload = {};
        Object.entries(skor).forEach(([k, v]) => {
            if (v !== null && v !== "" && v !== undefined) skorPayload[k] = Number(v);
        });

        router.post(`/kader-saya/${kaderId}/penilaian/${fmc}`, {
            skor: skorPayload,
            komentar,
            final_report: finalReport,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setToast({ open: true, type: "success", message: `Penilaian FMC-${fmc} berhasil disimpan.` });
                setTimeout(() => onClose?.(), 700);
            },
            onError: () => {
                setToast({ open: true, type: "error", message: "Gagal menyimpan penilaian." });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const showSheetFooter = activeTab !== "final";
    const footerScore =
        activeTab === "ojt"   ? scores.ojtGrand :
        activeTab === "value" ? scores.valueGrand :
        activeTab === "pres"  ? scores.presGrand : null;
    const footerWeight =
        activeTab === "ojt"   ? 30 :
        activeTab === "value" ? 30 :
        activeTab === "pres"  ? 40 : 0;

    return (
        <>
        <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast(t => ({ ...t, open: false }))} />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Penilaian OJT — FMC-{fmc}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {kader?.nama} {kader?.dept_name ? `· ${kader.dept_name}` : ""}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1"
                        aria-label="Close"
                    >×</button>
                </div>

                {/* Tab strip */}
                <div className="flex border-b border-slate-200 px-5 shrink-0 overflow-x-auto">
                    {SHEET_TABS.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap ${
                                activeTab === t.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {t.label} {t.weight && <span className="text-xs font-normal text-slate-400 ml-1">({t.weight})</span>}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                    {activeTab === "ojt"   && <OjtSheet           ojtStruct={structure?.ojt || []}   skor={skor} komentar={komentar} setSkor={setSkor} setKomentar={setKomentar} disabled={!canEdit} />}
                    {activeTab === "value" && <ValueSheet         valueStruct={structure?.value || []} skor={skor} komentar={komentar} setSkor={setSkor} setKomentar={setKomentar} disabled={!canEdit} />}
                    {activeTab === "pres"  && <PresentationSheet  presStruct={structure?.presentation || []} skor={skor} komentar={komentar} setSkor={setSkor} setKomentar={setKomentar} disabled={!canEdit} />}
                    {activeTab === "final" && <FinalReportSheet   finalReport={finalReport} setFinalReport={setFinalReport} scores={scores} disabled={!canEdit} />}
                </div>

                {/* Footer */}
                {showSheetFooter && (
                    <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
                        <div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">
                                Grand Score Sheet (bobot {footerWeight}%)
                            </div>
                            <div className="text-xs text-slate-500">Rata-rata dari semua aspek</div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">{fmt(footerScore)}</div>
                            <div className="text-xs text-slate-400">{scoreLabel(footerScore)}</div>
                        </div>
                    </div>
                )}

                {/* Action bar */}
                <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        {canEdit ? "Batal" : "Tutup"}
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : "💾 Simpan Penilaian"}
                        </button>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
