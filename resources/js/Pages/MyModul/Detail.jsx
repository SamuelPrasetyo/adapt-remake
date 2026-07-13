import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Document, Page, pdfjs } from 'react-pdf';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import AppLayout from '@/Layouts/AppLayout';
import Modal from '@/Components/Modal';
import Toast from '@/Components/Toast';

// pdf.js worker via Vite ?worker -> di-emit sebagai .js (MIME benar),
// menghindari masalah .mjs yang di-serve sebagai application/octet-stream.
pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();

/* ── Locked button with tooltip ──────────────────────────── */
function LockedBtn({ message, label }) {
    return (
        <div className="relative group inline-block">
            <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50 select-none">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                {label}
            </div>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 w-56 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
                {message}
                <div className="absolute top-full left-5 border-4 border-transparent border-t-slate-800" />
            </div>
        </div>
    );
}

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
function QuizModal({ open, onClose, title, color, soals, modulId, tipe, mentorId, onSuccess, onError }) {
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
            mentor_id: mentorId ?? null,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); handleClose(); onSuccess?.(); },
            onError:   () => { setSubmitting(false); onError?.(); },
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

/* ── Review modal (lihat jawaban) ────────────────────────── */
function ReviewModal({ open, onClose, modulId, tipe, title, mentorId }) {
    const [page, setPage]       = useState(0);
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !modulId || !tipe) return;
        setLoading(true);
        setPage(0);
        setData(null);
        const qs = mentorId ? `?mentor_id=${mentorId}` : '';
        fetch(`/learning/${modulId}/answers/${tipe}${qs}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [open, modulId, tipe, mentorId]);

    const items   = data?.items ?? [];
    const total   = items.length;
    const current = items[page];
    const pct     = total > 0 ? Math.round(((page + 1) / total) * 100) : 0;

    return (
        <Modal open={open} onClose={onClose} title={`Detail Jawaban · ${title}`} size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                        Previous
                    </button>
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition">
                        Tutup
                    </button>
                    <button type="button" disabled={page >= total - 1} onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                        Next
                    </button>
                </div>
            }>
            {loading && <p className="text-center text-slate-400 py-12">Memuat data jawaban...</p>}

            {!loading && current && (
                <div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                        <span>Soal {page + 1} dari {total}</span>
                        <span className={`font-semibold ${current.is_correct ? 'text-emerald-600' : 'text-red-500'}`}>
                            {current.is_correct ? '✓ Benar' : '✗ Salah'}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    <p className="text-xs text-slate-400 mb-1">Soal:</p>
                    <div className="bg-slate-50 rounded-lg px-4 py-3 mb-5">
                        <p className="font-semibold text-slate-800 text-base leading-snug">{current.soal}</p>
                    </div>

                    <p className="text-xs text-slate-400 mb-2">Pilihan Jawaban:</p>
                    <div className="space-y-2.5">
                        {current.jawabans?.map((j, idx) => {
                            const letter   = ['A', 'B', 'C', 'D', 'E'][idx];
                            const isWrong  = j.selected && !current.is_correct;
                            const isRight  = j.selected && current.is_correct;
                            return (
                                <div key={j.id}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition
                                        ${isWrong  ? 'border-red-300 bg-red-50' :
                                          isRight  ? 'border-emerald-300 bg-emerald-50' :
                                                     'border-slate-200'}`}>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                        ${isWrong  ? 'bg-red-500 text-white' :
                                          isRight  ? 'bg-emerald-500 text-white' :
                                                     'bg-slate-200 text-slate-500'}`}>
                                        {isWrong ? '✗' : isRight ? '✓' : letter}
                                    </span>
                                    <span className="text-sm text-slate-700">{j.jawaban}</span>
                                    {isWrong && <span className="ml-auto text-xs font-semibold text-red-500 shrink-0">Jawaban kamu</span>}
                                    {isRight && <span className="ml-auto text-xs font-semibold text-emerald-600 shrink-0">Jawaban kamu</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!loading && total === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">Data jawaban tidak ditemukan.</p>
            )}
        </Modal>
    );
}

/* ── Post Activity upload (1 file per sesi) ───────────────── */
function PostActivityUpload({ modulId, mentorId }) {
    const [file, setFile]           = useState(null);
    const [error, setError]         = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const ALLOWED = ['pdf', 'docx', 'xlsx'];
    const MAX_BYTES = 2 * 1024 * 1024;

    const handleChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!ALLOWED.includes(ext)) { setError('Format tidak diizinkan. Gunakan PDF, DOCX, atau XLSX.'); setFile(null); return; }
        if (f.size > MAX_BYTES) { setError('Ukuran file melebihi batas 2 MB.'); setFile(null); return; }
        setError(null);
        setFile(f);
    };

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('modul_id', modulId);
        if (mentorId) fd.append('mentor_id', mentorId);
        router.post('/learning/post-activity/upload', fd, {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => { setUploading(false); setFile(null); if (fileRef.current) fileRef.current.value = ''; },
            onError: (errs) => { setUploading(false); setError(errs.file ?? 'Upload gagal. Coba lagi.'); },
        });
    };

    return (
        <div className="space-y-2 mt-1">
            <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.docx,.xlsx" onChange={handleChange} />

            <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => fileRef.current?.click()}
                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                    Pilih File
                </button>
                {file && (
                    <button type="button" onClick={handleUpload} disabled={uploading}
                        className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
                        {uploading ? 'Mengupload...' : 'Upload'}
                    </button>
                )}
            </div>

            {file && (
                <p className="text-xs text-slate-600 truncate max-w-xs">{file.name}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
            <p className="text-xs text-slate-400">Format: PDF, DOCX, XLSX · Maks. 2 MB · 1 file per sesi</p>
        </div>
    );
}

/* ── Materi PDF modal ─────────────────────────────────────── */
const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 0.5;
const ZOOM_MAX  = 3.0;

function MateriModal({ open, onClose, modul, mentorId, posttestDone, hasTest }) {
    const [progress, setProgress] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const [baseWidth, setBaseWidth] = useState(0);
    const [zoom, setZoom]           = useState(1.0);
    const [error, setError]         = useState(false);
    const progressRef  = useRef(0);
    const renderedRef  = useRef(0);
    const containerRef = useRef(null);

    // Reset state tiap modal dibuka/ditutup.
    useEffect(() => {
        if (!open) {
            setProgress(0);
            setNumPages(0);
            setZoom(1.0);
            setError(false);
            progressRef.current = 0;
            renderedRef.current = 0;
        }
    }, [open]);

    // Base width = lebar container (zoom 1.0 = fit width). Responsif terhadap resize.
    useEffect(() => {
        if (!open) return;
        const measure = () => {
            if (containerRef.current)
                setBaseWidth(Math.max(0, containerRef.current.clientWidth - 48));
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [open]);

    // Ctrl+scroll untuk zoom, seperti PDF viewer pada umumnya.
    useEffect(() => {
        if (!open) return;
        const onWheel = (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            setZoom(z => {
                const next = e.deltaY < 0 ? z + ZOOM_STEP : z - ZOOM_STEP;
                return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
            });
        };
        window.addEventListener('wheel', onWheel, { passive: false });
        return () => window.removeEventListener('wheel', onWheel);
    }, [open]);

    // Progress = posisi scroll vertikal terhadap total tinggi konten (hanya naik, tak turun).
    const handleScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        const pct = max <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / max) * 100));
        if (pct > progressRef.current) {
            progressRef.current = pct;
            setProgress(pct);
        }
    };

    // Setelah semua halaman selesai dirender: bila dokumen muat tanpa scroll, langsung 100%.
    const handlePageRender = () => {
        renderedRef.current += 1;
        if (numPages > 0 && renderedRef.current >= numPages) {
            const el = containerRef.current;
            if (el && el.scrollHeight - el.clientHeight <= 4 && progressRef.current < 100) {
                progressRef.current = 100;
                setProgress(100);
            }
        }
    };

    const handleClose = () => {
        if (modul?.id && progressRef.current > 0) {
            router.post('/learning/materi/progress',
                { modul_id: modul.id, progress: progressRef.current, mentor_id: mentorId ?? null },
                { preserveState: true, preserveScroll: true }
            );
        }
        onClose();
    };

    const zoomIn    = () => setZoom(z => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
    const zoomOut   = () => setZoom(z => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));
    const fitWidth  = () => setZoom(1.0);

    const fileUrl  = modul?.file_materi ? encodeURI(`/${modul.file_materi}`) : null;
    const pageWidth = baseWidth ? Math.round(baseWidth * zoom) : undefined;

    if (!open) return null;

    const canDownload = hasTest ? posttestDone : progress >= 100;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* ── Toolbar ── */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                {/* Judul */}
                <h3 className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0">
                    {modul?.nama_modul ?? 'Materi'}
                </h3>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}
                        title="Perkecil (Ctrl+Scroll↓)"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                    </button>
                    <button type="button" onClick={fitWidth}
                        title="Sesuaikan lebar layar"
                        className="min-w-14 h-8 px-2 text-xs font-mono text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                        {Math.round(zoom * 100)}%
                    </button>
                    <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_MAX}
                        title="Perbesar (Ctrl+Scroll↑)"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Info halaman */}
                {numPages > 0 && (
                    <span className="text-xs text-slate-400 shrink-0">{numPages} halaman</span>
                )}

                {/* Tombol tutup */}
                <button type="button" onClick={handleClose}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0"
                    aria-label="Tutup">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* ── Konten PDF ── scroll dilacak untuk reading progress */}
            <div ref={containerRef} onScroll={handleScroll}
                className="flex-1 overflow-auto bg-slate-100 px-6 py-4 flex flex-col items-center gap-3">
                {!fileUrl && (
                    <p className="text-sm text-slate-500 text-center py-12">File materi tidak tersedia.</p>
                )}
                {fileUrl && error && (
                    <p className="text-sm text-red-500 text-center py-12">Gagal memuat materi. File mungkin tidak ditemukan.</p>
                )}
                {fileUrl && !error && (
                    <Document file={fileUrl}
                        onLoadSuccess={({ numPages }) => { renderedRef.current = 0; setNumPages(numPages); }}
                        onLoadError={() => setError(true)}
                        loading={<p className="text-sm text-slate-400 text-center py-12">Memuat materi...</p>}>
                        {Array.from({ length: numPages }, (_, i) => (
                            <Page key={i} pageNumber={i + 1}
                                width={pageWidth || undefined}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                onRenderSuccess={handlePageRender}
                                className="shadow-md mb-4 bg-white" />
                        ))}
                    </Document>
                )}
            </div>

            {/* ── Footer ── progress bar + notif + download */}
            <div className="shrink-0 px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
                {hasTest && !posttestDone && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Materi dapat diunduh setelah mengerjakan Post-Test.
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{progress}%</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Tutup
                        </button>
                        {fileUrl && (
                            canDownload ? (
                                <a href={fileUrl} download
                                    className="px-4 py-2 text-sm font-medium rounded-lg transition bg-emerald-600 text-white hover:bg-emerald-700">
                                    Download Materi
                                </a>
                            ) : (
                                <span className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 text-slate-400 cursor-not-allowed select-none">
                                    Download Materi
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main page ────────────────────────────────────────────── */
const STATUS_LABEL = { pending: 'Menunggu review', approved: 'Disetujui', rejected: 'Ditolak' };
const STATUS_COLOR = { pending: 'text-amber-600', approved: 'text-emerald-600', rejected: 'text-red-500' };

export default function ModulDetail({ modul, progress = {}, pretest = [], posttest = [], selectedMentor = null }) {
    const [showPre, setShowPre]       = useState(false);
    const [showPost, setShowPost]     = useState(false);
    const [showMateri, setShowMateri] = useState(false);
    const [toast, setToast] = useState({ open: false, type: 'success', message: '', key: 0 });
    const [review, setReview] = useState(null); // null | { tipe, title }

    // Saat Mentor mengerjakan modul atas nama record mentor terpilih, progress disimpan per mentor.
    const mentorId = selectedMentor?.id ?? null;

    const showToast = (type, message) =>
        setToast(prev => ({ open: true, type, message, key: prev.key + 1 }));

    // Komponen modul dikustom per modul (default true untuk modul lama).
    const hasTest    = modul?.has_test ?? true;
    const hasPA      = modul?.has_post_activity ?? true;
    const hasPre     = hasTest;
    // Skor Akhir dihitung backend dari komponen yang dimiliki modul.
    const finalScore = progress.final_score;

    const materiLocked = hasPre && !progress.pretest;
    const postLocked   = (progress.materi_progress ?? 0) < 100;
    // Tanpa Post-Test sebagai gerbang, Post Activity terbuka setelah materi 100%.
    const paLocked     = hasTest ? !progress.posttest : (progress.materi_progress ?? 0) < 100;

    const openPre = () => {
        if (progress.pretest) { setReview({ tipe: 'pre', title: 'Pre-Test' }); return; }
        setShowPre(true);
    };

    const openPost = () => {
        if (postLocked) return;
        if (progress.posttest) { setReview({ tipe: 'post', title: 'Post-Test' }); return; }
        setShowPost(true);
    };

    const openMateri = () => {
        if (materiLocked) return;
        setShowMateri(true);
    };

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
                    {finalScore != null && (
                        <div className="text-right shrink-0">
                            <p className="text-4xl font-bold text-emerald-600">{Number(finalScore).toFixed(2)}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Skor Akhir</p>
                        </div>
                    )}
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
                                {!progress.pretest && (
                                    <button type="button" onClick={openPre}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                        Kerjakan Pre-Test
                                    </button>
                                )}
                            </CheckItem>
                        )}

                        <CheckItem done={(progress.materi_progress ?? 0) >= 100}
                            title="Materi Pembelajaran"
                            last={!hasTest && !hasPA && modul?.fase != 3}>
                            {!materiLocked && (
                                <div className="flex items-center gap-1.5 mb-2">
                                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span className="text-sm font-medium text-emerald-600">{progress.materi_progress ?? 0}%</span>
                                </div>
                            )}
                            {materiLocked
                                ? <LockedBtn label="Buka Materi" message="Selesaikan Pre-Test terlebih dahulu" />
                                : (
                                    <button type="button" onClick={openMateri}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                        Buka Materi
                                    </button>
                                )
                            }
                        </CheckItem>

                        {hasTest && (
                            <CheckItem done={progress.posttest}
                                title="Post-Test"
                                sub={progress.posttest ? `Skor: ${progress.posttest_score}` : 'Belum dikerjakan'}
                                last={!hasPA && modul?.fase != 3}>
                                {!progress.posttest && (
                                    postLocked
                                        ? <LockedBtn label="Kerjakan Post-Test" message="Baca materi hingga 100% terlebih dahulu" />
                                        : (
                                            <button type="button" onClick={openPost}
                                                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition">
                                                Kerjakan Post-Test
                                            </button>
                                        )
                                )}
                            </CheckItem>
                        )}

                        {hasPA && (
                        <CheckItem done={progress.post_activity}
                            title="Post Activity"
                            sub={progress.post_activity_required > 1
                                ? `${progress.post_activity_approved_count ?? 0}/${progress.post_activity_required} sesi disetujui`
                                : (progress.post_activity ? 'Sudah diupload' : 'Belum diupload')}
                            subColor={progress.post_activity ? 'text-emerald-600' : 'text-slate-500'}
                            last={modul?.fase != 3}>
                            {/* Riwayat sesi Post Activity */}
                            {progress.post_activity_sessions?.length > 0 && (
                                <ul className="space-y-1.5 mb-3">
                                    {progress.post_activity_sessions.map((s, i) => (
                                        <li key={i} className="flex items-center gap-2 flex-wrap text-xs">
                                            <span className="text-slate-400 w-14 shrink-0">Sesi {i + 1}</span>
                                            <a href={`/${s.path_file}`} target="_blank" rel="noreferrer"
                                                className="text-blue-600 hover:underline truncate max-w-xs">{s.nama_file}</a>
                                            <span className={`font-medium ${STATUS_COLOR[s.status] ?? 'text-slate-500'}`}>
                                                {STATUS_LABEL[s.status] ?? s.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Template acuan pengisian, ditempel per modul (opsional) — terbuka berbarengan dengan Upload Post Activity */}
                            {modul?.file_template_pa && !progress.post_activity && (
                                <div className="mb-2">
                                    {paLocked ? (
                                        <LockedBtn label="Unduh Template Post Activity" message={hasTest ? 'Selesaikan Post-Test terlebih dahulu' : 'Baca materi hingga 100% terlebih dahulu'} />
                                    ) : (
                                        <a href={`/${modul.file_template_pa}`} target="_blank" rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Unduh Template Post Activity
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Aksi sesuai state */}
                            {paLocked ? (
                                <LockedBtn label="Upload Post Activity" message={hasTest ? 'Selesaikan Post-Test terlebih dahulu' : 'Baca materi hingga 100% terlebih dahulu'} />
                            ) : progress.post_activity ? (
                                <div className="text-xs text-emerald-600 font-medium">
                                    ✓ Semua sesi Post Activity selesai{progress.post_activity_nilai != null ? ` · Nilai: ${Number(progress.post_activity_nilai).toFixed(2)}` : ''}.
                                </div>
                            ) : progress.post_activity_pending ? (
                                <div className="text-xs text-amber-600 font-medium">
                                    ⏳ Menunggu review Admin MAI. Sesi berikutnya dapat diupload setelah sesi ini disetujui.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {progress.post_activity_rejection_reason && (
                                        <div className="text-xs text-red-600 font-medium">
                                            ❌ Sesi terakhir ditolak Admin MAI{progress.post_activity_rejection_reason ? `: "${progress.post_activity_rejection_reason}"` : ''}. Silakan upload ulang.
                                        </div>
                                    )}
                                    {progress.post_activity_required > 1 && (
                                        <p className="text-xs text-slate-500">
                                            Upload Post Activity sesi {(progress.post_activity_approved_count ?? 0) + 1} dari {progress.post_activity_required}.
                                        </p>
                                    )}
                                    <PostActivityUpload modulId={modul?.id} mentorId={mentorId} />
                                </div>
                            )}
                        </CheckItem>
                        )}

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
                            <button type="button" onClick={openPre}
                                className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition">
                                Pre-Test
                            </button>
                        )}
                        {hasTest && (postLocked ? (
                            <div className="relative group">
                                <div className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 select-none">
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Post-Test
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none text-center">
                                    Baca materi hingga 100% terlebih dahulu
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={openPost}
                                className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition">
                                Post-Test
                            </button>
                        ))}
                        {materiLocked ? (
                            <div className="relative group">
                                <div className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 select-none">
                                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Baca Materi
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-52 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none text-center">
                                    Selesaikan Pre-Test terlebih dahulu
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={openMateri}
                                className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                                Baca Materi
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <QuizModal open={showPre} onClose={() => setShowPre(false)}
                title="Pre-Test" color="blue"
                soals={pretest} modulId={modul?.id} tipe="pre" mentorId={mentorId}
                onSuccess={() => showToast('success', 'Jawaban berhasil disimpan!')}
                onError={() => showToast('error', 'Gagal menyimpan jawaban. Coba lagi.')} />

            <QuizModal open={showPost} onClose={() => setShowPost(false)}
                title="Post-Test" color="green"
                soals={posttest} modulId={modul?.id} tipe="post" mentorId={mentorId}
                onSuccess={() => showToast('success', 'Jawaban berhasil disimpan!')}
                onError={() => showToast('error', 'Gagal menyimpan jawaban. Coba lagi.')} />

            <MateriModal open={showMateri} onClose={() => setShowMateri(false)} modul={modul} mentorId={mentorId} posttestDone={!!progress.posttest} hasTest={hasTest} />


            <ReviewModal open={review !== null} onClose={() => setReview(null)}
                modulId={modul?.id} tipe={review?.tipe} title={review?.title ?? ''} mentorId={mentorId} />

            <Toast
                key={toast.key}
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
            />
        </AppLayout>
    );
}
