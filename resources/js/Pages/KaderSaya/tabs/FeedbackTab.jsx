import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

const BULAN_ID = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MOTIVASI_OPTIONS = ["Sangat Kurang","Kurang","Cukup","Baik","Sangat Baik"];
const SCORE_OPTIONS    = Array.from({ length: 10 }, (_, i) => i + 1);

const MOTIVASI_COLOR = {
    'Sangat Kurang': 'bg-rose-50 text-rose-700 border-rose-200',
    'Kurang':        'bg-orange-50 text-orange-700 border-orange-200',
    'Cukup':         'bg-amber-50 text-amber-700 border-amber-200',
    'Baik':          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Sangat Baik':   'bg-teal-50 text-teal-700 border-teal-200',
};

function scoreColor(score) {
    if (score == null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
}

function Stars({ value, max = 5 }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < value ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            {value != null && <span className="ml-1 text-xs text-slate-500">{value}/5</span>}
        </div>
    );
}

function AccordionSection({ icon, title, count, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-2.5">
                    <span className="text-slate-500">{icon}</span>
                    <span className="text-sm font-semibold text-slate-800">{title}</span>
                    {count != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">{count}</span>
                    )}
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
        </div>
    );
}

function RefleksiAccordion({ refleksi }) {
    if (refleksi.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada refleksi dari kader.</p>;
    return (
        <div className="space-y-3">
            {refleksi.map(r => (
                <div key={r.week_id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">Week {r.angka_week}</span>
                            {r.bulan && r.tahun && (
                                <span className="text-xs text-slate-400">{BULAN_ID[r.bulan]} {r.tahun}</span>
                            )}
                        </div>
                        {r.motivasi != null && <Stars value={r.motivasi} />}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[['Yang Dipelajari', r.dipelajari, 'bg-blue-50 border-blue-100'],
                          ['Tantangan',        r.tantangan,  'bg-amber-50 border-amber-100'],
                          ['Rencana Improvement', r.rencana, 'bg-emerald-50 border-emerald-100']
                        ].map(([label, val, cls]) => val ? (
                            <div key={label} className={`rounded-lg border p-3 ${cls}`}>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                                <p className="text-xs text-slate-700 leading-relaxed">"{val}"</p>
                            </div>
                        ) : null)}
                    </div>
                </div>
            ))}
        </div>
    );
}

function RiwayatAccordion({ mentorFeedbackList }) {
    if (mentorFeedbackList.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada feedback yang dikirim.</p>;
    return (
        <div className="space-y-3">
            {mentorFeedbackList.map(fb => (
                <div key={fb.week_id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">Week {fb.angka_week}</span>
                            {fb.bulan && fb.tahun && <span className="text-xs text-slate-400">{BULAN_ID[fb.bulan]} {fb.tahun}</span>}
                            {fb.nama_mentor && <span className="text-xs text-slate-400">· {fb.nama_mentor}</span>}
                        </div>
                        {fb.motivasi && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${MOTIVASI_COLOR[fb.motivasi] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                {fb.motivasi}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                        {[['Routine Job', fb.routine_job], ['Assignment', fb.assignment],
                          ['Pemahaman SOP', fb.pemahaman_sop], ['Project', fb.project]
                        ].map(([label, val]) => (
                            <div key={label} className="text-center bg-white rounded-lg py-2 px-2 border border-slate-100">
                                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                                <p className={`text-xl font-bold ${val != null ? scoreColor(parseInt(val) * 10) : 'text-slate-300'}`}>
                                    {val ?? '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                    {fb.area && (
                        <div className="bg-white rounded-lg border border-slate-100 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Area yang Perlu Ditingkatkan</p>
                            <p className="text-xs text-slate-700 leading-relaxed">"{fb.area}"</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function KirimFeedbackForm({ kader, weeks, mentorName, kaderId }) {
    const { props } = usePage();
    const flash = props.feedbackSuccess;

    const [form, setForm]         = useState({ id_week: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent]         = useState(!!flash);

    const weekGroups = useMemo(() => {
        const groups = {};
        (weeks || []).forEach(w => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push(w);
        });
        return Object.values(groups);
    }, [weeks]);

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(`/kader-saya/${kaderId}/feedback`, form, {
            preserveScroll: true,
            onSuccess: () => { setSent(true); setForm({ id_week: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' }); },
            onFinish:  () => setSubmitting(false),
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Kirim Feedback ke Kader</h3>
                    <p className="text-xs text-slate-400">Penilaian mingguan untuk {kader?.nama}</p>
                </div>
            </div>

            {sent && (
                <div className="mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Feedback berhasil dikirim!
                </div>
            )}

            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Mentor</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{mentorName}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Kader</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{kader?.nama}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Week <span className="text-rose-500">*</span>
                    </label>
                    <select required value={form.id_week} onChange={e => handleChange('id_week', e.target.value)}
                        disabled={weekGroups.length === 0}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                        <option value="">
                            {weekGroups.length === 0 ? '--Belum ada jadwal minggu--' : '--Pilih Week--'}
                        </option>
                        {weekGroups.map(g => (
                            <optgroup key={g.label} label={g.label}>
                                {g.items.map(w => {
                                    const disabled = !w.is_available || w.is_filled;
                                    const suffix = w.is_filled ? ' — sudah diisi'
                                        : (!w.is_available ? ' — belum waktunya' : '');
                                    return (
                                        <option key={w.id_week} value={w.id_week} disabled={disabled}>
                                            {BULAN_ID[w.bulan]} W{w.angka_week}{suffix}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        ))}
                    </select>
                    {weekGroups.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1">
                            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Belum ada jadwal minggu untuk batch ini. Atur tanggal mulai &amp; selesai batch, lalu simpan untuk men-generate jadwal.
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold text-slate-600 mb-3">Penilaian Kinerja</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {[['p1','Routine Job'],['p2','Assignment'],['p3','Pemahaman SOP'],['p4','Project']].map(([field, label]) => (
                            <div key={field}>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs text-slate-500">{label}</label>
                                    <span className={`text-sm font-bold w-6 text-right ${form[field] ? scoreColor(parseInt(form[field]) * 10) : 'text-slate-300'}`}>
                                        {form[field] || '—'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10" step="1"
                                    value={form[field] || 1}
                                    onChange={e => handleChange(field, e.target.value)}
                                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                    <span>1</span><span>5</span><span>10</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Motivasi &amp; Keterlibatan</label>
                    <select value={form.p5} onChange={e => handleChange('p5', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white">
                        <option value="">--Pilih Nilai--</option>
                        {MOTIVASI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Area yang Perlu Ditingkatkan</label>
                    <textarea rows={4} value={form.p6} onChange={e => handleChange('p6', e.target.value)}
                        placeholder="Tuliskan area yang perlu ditingkatkan minggu depan..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white resize-none" />
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {submitting ? 'Mengirim...' : 'Kirim Feedback'}
                </button>
            </form>
        </div>
    );
}

export default function FeedbackTab({ kader, weeks, refleksi, mentorFeedbackList = [], mentorName, kaderId }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <KirimFeedbackForm kader={kader} weeks={weeks} mentorName={mentorName} kaderId={kaderId} />

            <div className="space-y-3">
                <AccordionSection
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                    title="Refleksi Kader"
                    count={refleksi.length}
                >
                    <RefleksiAccordion refleksi={refleksi} />
                </AccordionSection>

                <AccordionSection
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    }
                    title="Feedback Dikirim"
                    count={mentorFeedbackList.length}
                >
                    <RiwayatAccordion mentorFeedbackList={mentorFeedbackList} />
                </AccordionSection>
            </div>
        </div>
    );
}
