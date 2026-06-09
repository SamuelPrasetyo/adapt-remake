import { useState, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';

/* ── Rating 1-10 ──────────────────────────────────────────── */
function RatingRow({ name, value, onChange }) {
    return (
        <div className="flex gap-3 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-xs text-slate-500">{n}</span>
                    <input
                        type="radio"
                        name={name}
                        value={n}
                        required
                        checked={value === String(n)}
                        onChange={() => onChange(String(n))}
                        className="w-4 h-4 accent-blue-600"
                    />
                </label>
            ))}
        </div>
    );
}

/* ── Mentor form ──────────────────────────────────────────── */
function MentorForm({ subject, kaders, pertanyaan, idPertanyaan, nilai }) {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
    const [nikKader, setNikKader] = useState('');
    const [weeks, setWeeks]       = useState([]);
    const [loadingWeek, setLoadingWeek] = useState(false);

    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const pertanyaanKeys = Object.keys(pertanyaan).sort((a, b) => Number(a) - Number(b));

    const fetchWeeks = async (nik) => {
        if (!nik) { setWeeks([]); return; }
        setLoadingWeek(true);
        try {
            const res = await fetch('/api/fetch-weeks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ id_kader: nik }),
            });
            const data = await res.json();
            setWeeks(data.weeks ?? []);
        } finally {
            setLoadingWeek(false);
        }
    };

    const handleKaderChange = (e) => {
        setNikKader(e.target.value);
        fetchWeeks(e.target.value);
    };

    const setAnswer = (key, val) => setAnswers((prev) => ({ ...prev, [key]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const form = e.target;
        const fd = new FormData(form);
        router.post('/feedback-survey/store', Object.fromEntries(fd.entries()), {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">Feedback &amp; Survey</h2>
                {subject && (
                    <p className="text-sm text-slate-600 mb-4">{subject}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mentor</label>
                        <input type="text" name="nama_mentor" required placeholder="Nama mentor" className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kader</label>
                        <select name="nik_kader" value={nikKader} onChange={handleKaderChange} required className={inputCls}>
                            <option value="">-- Pilih Kader --</option>
                            {kaders.map((k) => (
                                <option key={k.nik} value={k.nik}>{k.nik} - {k.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Week</label>
                        <select name="id_week" required className={inputCls} disabled={!nikKader || loadingWeek}>
                            <option value="">{loadingWeek ? 'Memuat...' : '-- Pilih Week --'}</option>
                            {weeks.map((w) => (
                                <option key={w.id_week} value={w.id_week} disabled={w.is_filled}>
                                    Week {w.angka_week}{w.is_filled ? ' (sudah diisi)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Questions */}
            {pertanyaanKeys.map((key, idx) => {
                const num     = Number(key);
                const isLast  = idx === pertanyaanKeys.length - 1;
                const isSecondLast = idx === pertanyaanKeys.length - 2;
                return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                        <input type="hidden" name={`id_pertanyaan${num}`} value={idPertanyaan[key]} />
                        <h3 className="text-sm font-medium text-slate-800 mb-3">
                            {num}. {pertanyaan[key]}
                        </h3>
                        {isLast ? (
                            /* Pertanyaan terakhir: textarea */
                            <textarea
                                name={`pertanyaan${num}_mentor`}
                                rows={3}
                                placeholder="Jawaban..."
                                className={inputCls}
                            />
                        ) : isSecondLast ? (
                            /* Pertanyaan ke-2 dari belakang: dropdown nilai */
                            <select name={`pertanyaan${num}_mentor`} required className={`${inputCls} max-w-xs`}>
                                <option value="">-- Pilih Nilai --</option>
                                {nilai.map((n) => (
                                    <option key={n.nama_nilai} value={n.nama_nilai}>{n.nama_nilai}</option>
                                ))}
                            </select>
                        ) : (
                            /* Sisanya: rating 1-10 */
                            <RatingRow
                                name={`pertanyaan${num}_mentor`}
                                value={answers[`pertanyaan${num}_mentor`] ?? ''}
                                onChange={(v) => setAnswer(`pertanyaan${num}_mentor`, v)}
                            />
                        )}
                    </div>
                );
            })}

            <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition"
            >
                {submitting ? 'Menyimpan...' : 'Submit'}
            </button>
        </form>
    );
}

/* ── Kader form ───────────────────────────────────────────── */
function KaderForm({ subject, weeks, pertanyaan, idPertanyaan }) {
    const [submitting, setSubmitting] = useState(false);
    const pertanyaanKeys = Object.keys(pertanyaan).sort((a, b) => Number(a) - Number(b));

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData(e.target);
        router.post('/feedback-survey-kader/store', fd, {
            forceFormData: true,
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">Feedback &amp; Survey Kader</h2>
                {subject && <p className="text-sm text-slate-600 mb-4">{subject}</p>}
                <div className="max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Week</label>
                    <select name="id_week" required className={inputCls}>
                        <option value="">-- Pilih Week --</option>
                        {weeks.map((w) => (
                            <option key={w.id_week} value={w.id_week}>Week {w.angka_week}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Questions */}
            {pertanyaanKeys.map((key, idx) => {
                const num = Number(key);
                const isLast = idx === pertanyaanKeys.length - 1;
                return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-5">
                        <input type="hidden" name={`id_pertanyaan${num}`} value={idPertanyaan[key]} />
                        <h3 className="text-sm font-medium text-slate-800 mb-3">
                            {num}. {pertanyaan[key]}
                            {isLast ? ' (PDF)' : ''}
                        </h3>
                        {isLast ? (
                            <div className="flex items-center gap-4">
                                <input type="file" name={`jawaban_kader[${num}]`} accept=".pdf" required className="text-sm" />
                                <a
                                    href="/assets/file/WeeklyReport.xlsx"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Form
                                </a>
                            </div>
                        ) : (
                            <textarea
                                name={`jawaban_kader[${num}]`}
                                rows={3}
                                required
                                placeholder="Jawaban..."
                                className={inputCls}
                            />
                        )}
                    </div>
                );
            })}

            <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition"
            >
                {submitting ? 'Menyimpan...' : 'Submit'}
            </button>
        </form>
    );
}

/* ── Main page ────────────────────────────────────────────── */
export default function FeedbackSurvey({ subject, weeks, kaders, pertanyaan, idPertanyaan, nilai, userType }) {
    const [started, setStarted] = useState(false);

    if (!started) {
        return (
            <AppLayout title="FEEDBACK SURVEY" breadcrumb="Feedback Survey">
                <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-slate-700 mb-2">Feedback &amp; Survey</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            Klik tombol di bawah untuk memulai pengisian feedback.
                        </p>
                        <button
                            onClick={() => setStarted(true)}
                            className="px-8 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            Mulai
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="FEEDBACK SURVEY" breadcrumb="Feedback Survey">
            <div className="max-w-3xl">
                {userType === 'Kader' ? (
                    <KaderForm
                        subject={subject}
                        weeks={weeks}
                        pertanyaan={pertanyaan}
                        idPertanyaan={idPertanyaan}
                    />
                ) : (
                    <MentorForm
                        subject={subject}
                        kaders={kaders}
                        pertanyaan={pertanyaan}
                        idPertanyaan={idPertanyaan}
                        nilai={nilai}
                    />
                )}
            </div>
        </AppLayout>
    );
}
