import { useCallback, useState } from "react";
import { router } from "@inertiajs/react";
import Toast from "@/Components/Toast";
import { BULAN_ID, MONTHLY_QUESTIONS } from "./FeedbackTab";

const MAX = 1000;

function SummaryCard({ m, kaderId, initialSummary = "", defaultOpen = false, onSaved }) {
    const [open, setOpen]     = useState(defaultOpen);
    const [summary, setSummary] = useState(initialSummary);
    const [saving, setSaving] = useState(false);

    const dirty  = summary !== initialSummary;
    const remaining = MAX - summary.length;

    const save = () => {
        setSaving(true);
        router.post(`/kader-saya/${kaderId}/monthly-summary`,
            { bulan: m.bulan, tahun: m.tahun, summary },
            {
                preserveScroll: true,
                preserveState:  true,
                onSuccess: () => onSaved?.(),
                onFinish:  () => setSaving(false),
            }
        );
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition text-left">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{BULAN_ID[m.bulan]} {m.tahun}</span>
                        {initialSummary
                            ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Sudah diringkas</span>
                            : <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Belum diringkas</span>
                        }
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{m.nama_mentor ? `Mentor: ${m.nama_mentor}` : ''}</p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {/* Monthly Feedback mentor — read-only */}
                    <div className="space-y-2">
                        {MONTHLY_QUESTIONS.map((q, i) => {
                            const val = m[`q${i + 1}`];
                            return val ? (
                                <div key={q.field} className="rounded-lg border-l-2 border-amber-300 bg-amber-50/60 px-3 py-2.5">
                                    <p className="text-[10px] font-semibold text-slate-500 mb-1 leading-snug">{i + 1}. {q.text}</p>
                                    <p className="text-xs text-slate-700 leading-relaxed italic">"{val}"</p>
                                </div>
                            ) : null;
                        })}
                    </div>

                    {/* Editor ringkasan Admin MAI */}
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                                Summary Monthly Feedback
                            </label>
                            <span className={`text-[11px] font-medium ${remaining <= 50 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {summary.length}/{MAX}
                            </span>
                        </div>
                        <textarea
                            rows={4}
                            maxLength={MAX}
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            placeholder="Tuliskan ringkasan Monthly Feedback bulan ini (maks 1000 karakter)..."
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white resize-none"
                        />
                        <div className="flex items-center justify-end gap-2 mt-2">
                            {dirty && <span className="text-[11px] text-amber-600 mr-auto">Perubahan belum disimpan</span>}
                            <button type="button" onClick={save} disabled={saving || !dirty}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {saving ? 'Menyimpan...' : 'Simpan Summary'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SummaryMonthlyTab({ kaderId, monthlyFeedbackList = [], monthlyFeedbackSummaries = {} }) {
    const [toast, setToast] = useState(false);
    const closeToast        = useCallback(() => setToast(false), []);
    const onSaved           = useCallback(() => setToast(true), []);

    return (
        <div>
            <Toast open={toast} type="success" message="Summary berhasil disimpan!" onClose={closeToast} duration={4000} />

            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <svg className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    Ringkas Monthly Feedback yang telah diisi Mentor. Expand tiap bulan pada Riwayat di bawah,
                    lalu tuliskan ringkasan (maks 1000 karakter). Tab ini hanya dapat diakses oleh Admin MAI.
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-800">Riwayat Monthly Feedback</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{monthlyFeedbackList.length}</span>
                </div>
                <div className="p-3">
                    {monthlyFeedbackList.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">
                            Belum ada Monthly Feedback dari Mentor untuk diringkas.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {monthlyFeedbackList.map((m, i) => (
                                <SummaryCard
                                    key={m.key}
                                    m={m}
                                    kaderId={kaderId}
                                    initialSummary={monthlyFeedbackSummaries?.[m.key] ?? ""}
                                    defaultOpen={i === 0}
                                    onSaved={onSaved}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
