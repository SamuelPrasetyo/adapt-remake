import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';

/* ── Stepper item ─────────────────────────────────────────── */
function CheckItem({ done, title, sub, subColor = 'text-emerald-600', children, last }) {
    return (
        <div className={`relative pl-14 ${last ? '' : 'pb-7'}`}>
            {/* Vertical line */}
            {!last && (
                <span className="absolute left-[18px] top-10 w-0.5 h-full bg-slate-200" />
            )}
            {/* Circle */}
            <span className={`absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {done ? '✓' : '○'}
            </span>
            <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
            {sub && <p className={`text-sm mb-2 ${subColor}`}>{sub}</p>}
            {children}
        </div>
    );
}

/* ── Quiz modal (shared for pre & post) ───────────────────── */
function QuizModal({ open, onClose, title, color, soals, modulId, tipe }) {
    const [page, setPage] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const total = soals?.length ?? 0;
    const current = soals?.[page];
    const pct = total > 0 ? Math.round(((page + 1) / total) * 100) : 0;

    const handleClose = () => { setPage(0); setAnswers({}); onClose(); };

    const handleSubmit = () => {
        if (Object.keys(answers).length < total) {
            alert('Jawab semua soal terlebih dahulu.');
            return;
        }
        setSubmitting(true);
        router.post('/learning/test/submit', {
            modul_id: modulId,
            tipe,
            answers,
        }, {
            onFinish: () => { setSubmitting(false); handleClose(); },
        });
    };

    const barColor = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
    const btnColor = color === 'blue'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-emerald-600 hover:bg-emerald-700 text-white';

    return (
        <Modal open={open} onClose={handleClose} title={title} size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <button type="button" disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                        Previous
                    </button>
                    {page < total - 1 ? (
                        <button type="button" onClick={() => setPage(p => p + 1)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${btnColor}`}>
                            Next
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={submitting}
                            className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition ${btnColor}`}>
                            {submitting ? 'Menyimpan...' : 'Submit Test'}
                        </button>
                    )}
                </div>
            }>
            {current && (
                <div>
                    {/* Progress bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                            <span>Soal {page + 1} dari {total}</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                    </div>

                    {/* Question */}
                    <p className="font-semibold text-slate-800 mb-4 text-base leading-snug">{current.soal}</p>

                    {/* Options */}
                    <div className="space-y-2.5">
                        {current.jawabans?.map((j) => {
                            const selected = answers[current.id] === j.id;
                            return (
                                <label key={j.id}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition
                                        ${selected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <input type="radio" name={`q_${current.id}`} value={j.id}
                                        checked={selected}
                                        onChange={() => setAnswers(prev => ({ ...prev, [current.id]: j.id }))}
                                        className="mt-0.5 accent-blue-600 shrink-0" />
                                    <span className="text-sm text-slate-700">{j.jawaban}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
            {total === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">Belum ada soal tersedia.</p>
            )}
        </Modal>
    );
}

/* ── Materi PDF modal ─────────────────────────────────────── */
function MateriModal({ open, onClose, modul }) {
    const [progress, setProgress] = useState(0);
    const containerRef = useRef(null);

    const handleScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        const pct = Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100));
        setProgress(pct);
    };

    const fileUrl = modul?.file_materi ? `/${modul.file_materi}` : null;

    return (
        <Modal open={open} onClose={onClose} title={modul?.nama_modul ?? 'Materi'} size="3xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 flex-1 mr-4">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Tutup
                        </button>
                        {fileUrl && (
                            <a href={fileUrl} download
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition
                                    ${progress >= 100 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 pointer-events-none'}`}>
                                Download Materi
                            </a>
                        )}
                    </div>
                </div>
            }>
            <div ref={containerRef} onScroll={handleScroll}
                className="h-[70vh] overflow-y-auto rounded-lg border border-slate-200">
                {fileUrl
                    ? <iframe src={fileUrl} width="100%" height="1200px" title="materi" style={{ border: 'none', display: 'block' }} />
                    : <p className="text-sm text-slate-500 text-center py-12">File materi tidak tersedia.</p>
                }
            </div>
        </Modal>
    );
}

/* ── Main page ────────────────────────────────────────────── */
export default function ModulDetail({ modul, progress = {}, pretest = [], posttest = [] }) {
    const [showPre, setShowPre]     = useState(false);
    const [showPost, setShowPost]   = useState(false);
    const [showMateri, setShowMateri] = useState(false);

    const hasPre  = modul?.fase != 3;
    const finalScore = progress.final_score ?? '—';

    return (
        <AppLayout title="DETAIL MODUL" breadcrumb="Modul / My Modul / Detail">
            {/* ── Header card ── */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-xs font-mono text-slate-400 mb-1">{modul?.kode_modul}</p>
                        <h1 className="text-2xl font-bold text-slate-900">{modul?.nama_modul}</h1>
                        {modul?.tag_kompetensi && (
                            <p className="text-sm text-slate-500 mt-1">{modul.tag_kompetensi}</p>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-4xl font-bold text-emerald-600">{finalScore}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Skor Akhir</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Left: checklist ── */}
                <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800 mb-6">Checklist Pembelajaran</h2>

                    <div>
                        {hasPre && (
                            <CheckItem done={progress.pretest}
                                title="Pre-Test"
                                sub={progress.pretest ? `Sudah dikerjakan · Skor: ${progress.pretest_score}` : 'Belum dikerjakan'}>
                                <button type="button" onClick={() => setShowPre(true)}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                    {progress.pretest ? 'Lihat Jawaban' : 'Kerjakan Pre-Test'}
                                </button>
                            </CheckItem>
                        )}

                        <CheckItem done={progress.materi}
                            title="Materi Pembelajaran"
                            sub={`Progress membaca: ${progress.materi_progress ?? 0}%`}>
                            <button type="button" onClick={() => setShowMateri(true)}
                                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                Buka Materi
                            </button>
                        </CheckItem>

                        <CheckItem done={progress.posttest}
                            title="Post-Test"
                            sub={progress.posttest ? `Skor: ${progress.posttest_score}` : 'Belum dikerjakan'}>
                            <button type="button" onClick={() => setShowPost(true)}
                                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                {progress.posttest ? 'Lihat Jawaban' : 'Kerjakan Post-Test'}
                            </button>
                        </CheckItem>

                        <CheckItem done={progress.post_activity}
                            title="Post Activity"
                            sub={progress.post_activity ? 'Tugas berhasil diupload' : 'Belum diupload'}
                            subColor={progress.post_activity ? 'text-emerald-600' : 'text-slate-500'}
                            last={modul?.fase != 3}>
                            {progress.post_activity && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                    ✓ Uploaded
                                </span>
                            )}
                        </CheckItem>

                        {modul?.fase == 3 && (
                            <CheckItem done title="Evaluasi Mentor"
                                sub="Mentor memberikan evaluasi terhadap performa OJT."
                                last>
                            </CheckItem>
                        )}
                    </div>
                </div>

                {/* ── Right: quick actions ── */}
                <div className="w-full lg:w-60 shrink-0">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
                        {hasPre && (
                            <button type="button" onClick={() => setShowPre(true)}
                                className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition">
                                Pre-Test
                            </button>
                        )}
                        <button type="button" onClick={() => setShowPost(true)}
                            className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition">
                            Post-Test
                        </button>
                        <button type="button" onClick={() => setShowMateri(true)}
                            className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                            Baca Materi
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <QuizModal open={showPre} onClose={() => setShowPre(false)}
                title="Pre-Test" color="blue"
                soals={pretest} modulId={modul?.id} tipe="pre" />

            <QuizModal open={showPost} onClose={() => setShowPost(false)}
                title="Post-Test" color="green"
                soals={posttest} modulId={modul?.id} tipe="post" />

            <MateriModal open={showMateri} onClose={() => setShowMateri(false)} modul={modul} />
        </AppLayout>
    );
}
