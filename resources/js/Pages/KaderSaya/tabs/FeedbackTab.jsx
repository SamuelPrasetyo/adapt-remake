import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { router, useForm, usePage } from "@inertiajs/react";
import FilterableTable from "@/Components/FilterableTable";
import Toast from "@/Components/Toast";


export const BULAN_ID = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MOTIVASI_OPTIONS = ["Sangat Kurang","Kurang","Cukup","Baik","Sangat Baik"];
const SCORE_OPTIONS    = Array.from({ length: 10 }, (_, i) => i + 1);

// Kategori slider Penilaian Kinerja — semua wajib diisi (lihat KirimFeedbackForm).
const SCORE_FIELDS = [['p1','Routine Job'],['p2','Assignment'],['p3','Pemahaman SOP'],['p4','Project']];
const EMPTY_FEEDBACK_FORM = { id_week: '', p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' };
const EMPTY_MONTHLY_FORM  = { id_week: '', m1: '', m2: '', m3: '' };

// Monthly Feedback mentor — pertanyaan kualitatif sebulan sekali (id_pertanyaan 13-15 di backend).
export const MONTHLY_QUESTIONS = [
    { field: "m1", text: "Bagaimana gambaran mentee bulan ini — mulai dari keseharian kerja, tugas yang diberikan, kepatuhan terhadap SOP, sampai kontribusinya di project?", placeholder: "Tuliskan gambaran kader bulan ini..." },
    { field: "m2", text: "Bagaimana sikap kerja dan etika mentee selama sebulan ini — misalnya dari sisi kedisiplinan, cara berkomunikasi, atau caranya menghadapi tekanan/masalah?", placeholder: "Tuliskan observasi sikap dan etika kader..." },
    { field: "m3", text: "Menurut Anda, kader ini sudah siap ke proses selanjutnya atau masih jadi pertimbangan?", placeholder: "Tuliskan penilaian kesiapan kader..." },
];

const MOTIVASI_BADGE = {
    'Sangat Kurang': 'bg-rose-100 text-rose-700',
    'Kurang':        'bg-orange-100 text-orange-700',
    'Cukup':         'bg-amber-100 text-amber-700',
    'Baik':          'bg-blue-100 text-blue-700',
    'Sangat Baik':   'bg-emerald-100 text-emerald-700',
};

const WF_STATUS_CONFIG = {
    pending:  { label: "Menunggu Review Mentor", cls: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Approved (Selesai)",     cls: "bg-green-100 text-green-700" },
    rejected: { label: "Ditolak — Upload Ulang", cls: "bg-red-100 text-red-700" },
};

function WfStatusBadge({ status }) {
    const cfg = WF_STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// Status pilihan minggu/bulan di dropdown feedback. Hanya 'open' yang bisa dipilih.
const WEEK_STATUS = {
    filled: { label: 'Sudah Diisi',    badge: 'bg-emerald-100 text-emerald-700' },
    open:   { label: 'Belum Diisi',    badge: 'bg-yellow-100 text-yellow-700' },
    locked: { label: 'Belum Waktunya', badge: 'bg-rose-100 text-rose-700' },
};

const weekStatus = (w) => (w.is_filled ? 'filled' : (!w.is_available ? 'locked' : 'open'));

function WeekStatusBadge({ status }) {
    const cfg = WEEK_STATUS[status];
    if (!cfg) return null;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
}

const SELECT_ACCENT = {
    blue:  'focus:ring-blue-500/30 focus:border-blue-500',
    amber: 'focus:ring-amber-500/30 focus:border-amber-500',
    violet:'focus:ring-violet-500/30 focus:border-violet-500',
};

/**
 * Dropdown pilihan minggu/bulan dengan badge status berwarna.
 *
 * Pakai listbox custom, bukan <select> native: <option> tidak bisa memuat badge
 * berwarna secara lintas-browser. Konsekuensinya atribut `required` bawaan browser
 * tidak berlaku — pemanggil WAJIB memvalidasi sendiri (lihat `missing` di tiap form).
 *
 * groups: [{ label: string|null, items: [{ value, label, status }] }]
 */
function WeekSelect({ groups, value, onChange, placeholder, disabled = false, accent = 'blue', invalid = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey  = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const items    = groups.flatMap(g => g.items);
    const selected = items.find(i => String(i.value) === String(value)) || null;
    const isEmpty  = items.length === 0;
    const locked   = disabled || isEmpty;

    return (
        <div className="relative" ref={ref}>
            <button type="button" disabled={locked} onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-lg bg-white text-left focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                    invalid ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500' : `border-slate-300 ${SELECT_ACCENT[accent] ?? SELECT_ACCENT.blue}`
                }`}>
                {selected ? (
                    <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-slate-800">{selected.label}</span>
                        <WeekStatusBadge status={selected.status} />
                    </span>
                ) : (
                    <span className="truncate text-slate-400">{placeholder}</span>
                )}
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                    {groups.map((g, gi) => (
                        <div key={g.label ?? gi}>
                            {g.label && (
                                <p className="sticky top-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 border-y border-slate-100">
                                    {g.label}
                                </p>
                            )}
                            {g.items.map(it => {
                                const selectable = it.status === 'open';
                                const active     = String(it.value) === String(value);
                                return (
                                    <button key={it.value} type="button" disabled={!selectable}
                                        onClick={() => { onChange(String(it.value)); setOpen(false); }}
                                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition ${
                                            selectable ? 'hover:bg-slate-50 text-slate-700' : 'cursor-not-allowed text-slate-400'
                                        } ${active ? 'bg-slate-100 font-semibold' : ''}`}>
                                        <span className="truncate">{it.label}</span>
                                        <WeekStatusBadge status={it.status} />
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

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

function StarRating({ value, onChange, max = 5 }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map(star => (
                <button key={star} type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none">
                    <svg className={`w-7 h-7 transition-colors ${star <= (hover || value) ? 'text-amber-400' : 'text-slate-200'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
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
            {open && <div className="border-t border-slate-100 px-3 py-3">{children}</div>}
        </div>
    );
}

function RefleksiCard({ r, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition text-left">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">Week {r.angka_week}</span>
                        {r.relevansi != null
                            ? <Stars value={parseInt(r.relevansi)} />
                            : r.motivasi != null && <Stars value={r.motivasi} />
                        }
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {r.bulan && r.tahun ? `${BULAN_ID[r.bulan]} ${r.tahun}` : ''}
                    </p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                    {[
                        ['Yang Dipelajari',    r.dipelajari, 'border-blue-300 bg-blue-50/60'],
                        ['Tantangan',          r.tantangan,  'border-amber-300 bg-amber-50/60'],
                        ['Rencana Improvement',r.rencana,    'border-emerald-300 bg-emerald-50/60'],
                    ].map(([label, val, cls]) => val ? (
                        <div key={label} className={`rounded-lg border-l-2 px-3 py-2.5 ${cls}`}>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
                            <p className="text-xs text-slate-700 leading-relaxed italic">"{val}"</p>
                        </div>
                    ) : null)}
                </div>
            )}
        </div>
    );
}

/**
 * Saat form kirim disembunyikan (mis. batch terkunci), daftar kartu memakai lebar penuh
 * halaman — satu kartu per baris jadi sangat boros. `wide` memecahnya jadi 2-3 kolom di
 * layar besar; `items-start` menjaga tinggi tiap kartu tetap independen saat di-expand.
 */
const listLayout = (wide) => wide
    ? 'grid gap-2 items-start md:grid-cols-2 2xl:grid-cols-3'
    : 'space-y-2';

function RefleksiAccordion({ refleksi, wide = false }) {
    if (refleksi.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada refleksi dari kader.</p>;
    return (
        <div className={listLayout(wide)}>
            {refleksi.map((r, i) => <RefleksiCard key={r.week_id} r={r} defaultOpen={i === 0} />)}
        </div>
    );
}

// Tile skor di riwayat: [key data, label penuh, field payload ke backend, label ringkas untuk kartu compact].
const FEEDBACK_TILES = [
    ['routine_job',   'Routine Job', 'p1', 'Routine'],
    ['assignment',    'Assignment',  'p2', 'Assign.'],
    ['pemahaman_sop', 'SOP',         'p3', 'SOP'],
    ['project',       'Project',     'p4', 'Project'],
];

const isBlank = (v) => v === null || v === undefined || v === '';

// Di atas panjang ini, "Area yang Perlu Ditingkatkan" biasanya kepotong oleh line-clamp-2
// pada lebar kartu compact — baru munculkan tombol "Lihat" pada kasus itu.
const AREA_BUBBLE_THRESHOLD = 70;

/**
 * Tombol kecil yang membuka catatan penuh dalam bubble mengambang (bukan modal) —
 * dipakai untuk teks yang kepotong oleh line-clamp di kartu compact. Di-render lewat
 * portal ke document.body supaya tidak ikut terpotong oleh `overflow-hidden` pada
 * AccordionSection/kartu di atasnya, dan posisinya dihitung dari getBoundingClientRect
 * tombol pemicunya (menempel di atas/bawah kartu, mengikuti ruang kosong yang tersedia).
 */
function NoteBubbleButton({ text, label = 'Area yang Perlu Ditingkatkan' }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos]   = useState(null);
    const btnRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const close  = () => setOpen(false);
        const onKey  = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        document.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const toggle = (e) => {
        e.stopPropagation();
        if (open) { setOpen(false); return; }
        const r = btnRef.current.getBoundingClientRect();
        const bw = 272, margin = 12;
        const left = Math.min(Math.max(r.left + r.width / 2 - bw / 2, margin), window.innerWidth - bw - margin);
        const below = (window.innerHeight - r.bottom) > 130;
        setPos({
            left, bw,
            top:    below ? r.bottom + 8 : null,
            bottom: below ? null : window.innerHeight - r.top + 8,
            tailX:  r.left + r.width / 2 - left - 5,
            below,
        });
        setOpen(true);
    };

    return (
        <>
            <button type="button" ref={btnRef} onClick={toggle}
                className={`inline-flex items-center gap-0.5 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full transition ${
                    open ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Lihat
            </button>
            {open && pos && createPortal(
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()}
                        className="absolute rounded-xl px-3 py-2.5 bg-slate-800 text-white shadow-xl"
                        style={{ left: pos.left, width: pos.bw, top: pos.top ?? undefined, bottom: pos.bottom ?? undefined }}>
                        <div className="absolute w-2.5 h-2.5 bg-slate-800 rotate-45 rounded-sm"
                            style={pos.below ? { top: -4, left: pos.tailX } : { bottom: -4, left: pos.tailX }} />
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
                            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-100">{text}</p>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}

/**
 * Kartu Week ringkas — selalu tampil penuh (tanpa accordion sendiri), dipakai di dalam
 * satu grup bulan. Skor diperkecil supaya beberapa kartu muat berdampingan; edit tetap
 * berlaku untuk seluruh nilai (bukan hanya yang kosong) selama `canEdit` true.
 */
function CompactFeedbackCard({ fb, canEdit = false, kaderId = null }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState({});
    const [saving, setSaving]   = useState(false);

    const gaps = FEEDBACK_TILES.filter(([key]) => isBlank(fb[key])).map(([, , field]) => field);
    if (isBlank(fb.motivasi)) gaps.push('p5');
    const canFill = canEdit && gaps.length > 0;

    const startEdit = () => {
        setDraft({
            p1: fb.routine_job   ?? '',
            p2: fb.assignment    ?? '',
            p3: fb.pemahaman_sop ?? '',
            p4: fb.project       ?? '',
            p5: fb.motivasi      ?? '',
            p6: fb.area          ?? '',
        });
        setEditing(true);
    };
    const cancelEdit = () => { setEditing(false); setDraft({}); };

    const saveEdit = () => {
        setSaving(true);
        router.post(`/kader-saya/${kaderId}/feedback/${fb.week_id}/update`, draft, {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
            onFinish:  () => setSaving(false),
        });
    };

    return (
        <div className={`rounded-lg border p-2.5 ${canFill ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700">Week {fb.angka_week}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                    {!editing && fb.motivasi && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${MOTIVASI_BADGE[fb.motivasi] ?? 'bg-slate-100 text-slate-600'}`}>
                            {fb.motivasi.toUpperCase()}
                        </span>
                    )}
                    {!editing && canFill && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            {gaps.length} kosong
                        </span>
                    )}
                    {canEdit && !editing && (
                        <button type="button" onClick={startEdit} title="Ubah nilai feedback"
                            className="text-slate-300 hover:text-blue-600 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1 mb-2">
                {FEEDBACK_TILES.map(([key, , field, compactLabel]) => {
                    const val   = fb[key];
                    const blank = isBlank(val);
                    return (
                        <div key={field} className="bg-white rounded-md border border-slate-100 py-1.5 px-1 text-center">
                            <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400 leading-tight h-4 flex items-center justify-center">
                                {compactLabel}
                            </p>
                            {editing ? (
                                <select value={draft[field] ?? ''} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                                    className="w-full text-[11px] font-bold text-center border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                                    <option value="">—</option>
                                    {SCORE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <p className={`text-sm font-bold leading-none ${!blank ? scoreColor(parseInt(val) * 10) : 'text-slate-300'}`}>
                                    {blank ? '—' : val}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {(editing || (canEdit && isBlank(fb.motivasi))) && (
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400 shrink-0">Motivasi</span>
                    {editing ? (
                        <select value={draft.p5 ?? ''} onChange={e => setDraft(d => ({ ...d, p5: e.target.value }))}
                            className="flex-1 text-[10px] px-1.5 py-1 border border-blue-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                            <option value="">--Pilih--</option>
                            {MOTIVASI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ) : (
                        <span className="text-[10px] text-slate-300 font-bold">—</span>
                    )}
                </div>
            )}

            {editing ? (
                <textarea rows={2} value={draft.p6 ?? ''} onChange={e => setDraft(d => ({ ...d, p6: e.target.value }))}
                    placeholder="Area yang perlu ditingkatkan..."
                    className="w-full px-2 py-1 text-[10.5px] border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none" />
            ) : fb.area ? (
                <div className="flex items-start gap-1.5 border-l-2 border-blue-300 pl-2">
                    <p className="flex-1 min-w-0 text-[10.5px] text-slate-600 leading-snug"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {fb.area}
                    </p>
                    {fb.area.length > AREA_BUBBLE_THRESHOLD && <NoteBubbleButton text={fb.area} />}
                </div>
            ) : null}

            {editing && (
                <div className="flex items-center gap-1.5 mt-2">
                    <button type="button" onClick={saveEdit} disabled={saving}
                        className="flex-1 px-2 py-1.5 text-[10.5px] font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 transition">
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button type="button" onClick={cancelEdit} disabled={saving}
                        className="px-2 py-1.5 text-[10.5px] font-semibold text-slate-500 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-60 transition">
                        Batal
                    </button>
                </div>
            )}
        </div>
    );
}

// Grid kartu week di dalam satu grup bulan yang terbuka — lebih lebar (3 kolom) kalau
// tidak ada kolom form di sebelahnya, 2 kolom kalau berbagi ruang dengan form.
const monthCardGrid = (wide) => wide
    ? 'grid gap-2 items-start sm:grid-cols-2 lg:grid-cols-3'
    : 'grid gap-2 items-start sm:grid-cols-2';

function groupFeedbackByMonth(list) {
    const groups = [];
    const byKey  = {};
    list.forEach((fb) => {
        const key = `${fb.tahun}-${fb.bulan}`;
        if (!byKey[key]) {
            byKey[key] = { key, bulan: fb.bulan, tahun: fb.tahun, nama_mentor: fb.nama_mentor, items: [] };
            groups.push(byKey[key]);
        }
        byKey[key].items.push(fb);
    });
    return groups;
}

function FeedbackMonthGroup({ group, defaultOpen = false, canEdit = false, kaderId = null, wide = false }) {
    const [open, setOpen] = useState(defaultOpen);

    const totalGaps = canEdit
        ? group.items.reduce((sum, fb) => {
            let n = FEEDBACK_TILES.filter(([key]) => isBlank(fb[key])).length;
            if (isBlank(fb.motivasi)) n += 1;
            return sum + n;
        }, 0)
        : 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition text-left">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{BULAN_ID[group.bulan]} {group.tahun}</span>
                        {totalGaps > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {totalGaps} NILAI KOSONG
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {group.items.length} feedback
                        {group.nama_mentor ? ` • Mentor: ${group.nama_mentor}` : ''}
                    </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {group.items.length}
                </span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className={`border-t border-slate-100 px-3 py-3 ${monthCardGrid(wide)}`}>
                    {group.items.map((fb) => (
                        <CompactFeedbackCard key={fb.week_id} fb={fb} canEdit={canEdit} kaderId={kaderId} />
                    ))}
                </div>
            )}
        </div>
    );
}

function RiwayatAccordion({ mentorFeedbackList, canEdit = false, kaderId = null, wide = false }) {
    if (mentorFeedbackList.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada feedback yang dikirim.</p>;
    const groups = useMemo(() => groupFeedbackByMonth(mentorFeedbackList), [mentorFeedbackList]);
    return (
        <div className="space-y-2">
            {groups.map((g, i) => (
                <FeedbackMonthGroup key={g.key} group={g} defaultOpen={i === 0} canEdit={canEdit} kaderId={kaderId} wide={wide} />
            ))}
        </div>
    );
}

function KirimFeedbackForm({ kader, weeks, mentorName, kaderId }) {
    const [form, setForm]         = useState(EMPTY_FEEDBACK_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [attempted, setAttempted]   = useState(false);
    const [toast, setToast]       = useState(false);
    const closeToast              = useCallback(() => setToast(false), []);

    const weekGroups = useMemo(() => {
        const groups = {};
        (weeks || []).forEach(w => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push({ value: w.id_week, label: `Week ${w.angka_week}`, status: weekStatus(w) });
        });
        return Object.values(groups);
    }, [weeks]);

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    // Slider bernilai kosong tetap menampilkan thumb di posisi 1. Kalau mentor menggeser/klik
    // tepat di angka 1, onChange tidak pernah jalan (nilai DOM tidak berubah) sehingga field
    // diam-diam tetap kosong — inilah yang dulu membuat nilai lolos jadi "—". Commit manual
    // saat pointer/keyboard dilepas menutup celah itu.
    const commitIfEmpty = (field) => (e) => {
        if (!form[field]) handleChange(field, e.currentTarget.value || '1');
    };

    // Semua kategori penilaian wajib; area improvement (p6) tetap opsional.
    // Week ikut dicek di sini karena WeekSelect bukan <select> native (tanpa `required`).
    const missing = useMemo(() => {
        const list = [];
        if (!form.id_week) list.push('Week');
        SCORE_FIELDS.forEach(([f, label]) => { if (!form[f]) list.push(label); });
        if (!form.p5) list.push('Motivasi & Keterlibatan');
        return list;
    }, [form]);

    const isMissing = (field) => attempted && !form[field];

    const resetScores = () => setForm(f => ({ ...f, p1: '', p2: '', p3: '', p4: '', p5: '' }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setAttempted(true);
        if (missing.length > 0) return;
        setSubmitting(true);
        router.post(`/kader-saya/${kaderId}/feedback`, form, {
            preserveScroll: true,
            onSuccess: () => { setToast(true); setForm(EMPTY_FEEDBACK_FORM); setAttempted(false); },
            onFinish:  () => setSubmitting(false),
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Toast open={toast} type="success" message="Feedback berhasil dikirim!" onClose={closeToast} duration={5000} />
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
                    <WeekSelect
                        groups={weekGroups}
                        value={form.id_week}
                        onChange={val => handleChange('id_week', val)}
                        placeholder={weekGroups.length === 0 ? '--Belum ada jadwal minggu--' : '--Pilih Week--'}
                        invalid={isMissing('id_week')}
                    />
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
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-600">
                            Penilaian Kinerja <span className="text-rose-500">*</span>
                        </p>
                        <button type="button" onClick={resetScores}
                            disabled={!form.p1 && !form.p2 && !form.p3 && !form.p4 && !form.p5}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:hover:text-slate-400 transition">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset semua
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {SCORE_FIELDS.map(([field, label]) => (
                            <div key={field}>
                                <div className="flex items-center justify-between mb-1">
                                    <label className={`text-xs ${isMissing(field) ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                                        {label}
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold w-6 text-right ${form[field] ? scoreColor(parseInt(form[field]) * 10) : (isMissing(field) ? 'text-rose-400' : 'text-slate-300')}`}>
                                            {form[field] || '—'}
                                        </span>
                                        <span className="w-4 h-4 flex items-center justify-center">
                                            {form[field] && (
                                                <button type="button" title={`Reset nilai ${label}`}
                                                    onClick={() => handleChange(field, '')}
                                                    className="text-slate-300 hover:text-rose-500 transition">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10" step="1"
                                    value={form[field] || 1}
                                    onChange={e => handleChange(field, e.target.value)}
                                    onPointerUp={commitIfEmpty(field)}
                                    onKeyUp={commitIfEmpty(field)}
                                    className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${
                                        form[field]
                                            ? 'bg-slate-200 accent-blue-600'
                                            : (isMissing(field) ? 'bg-rose-100 accent-rose-300' : 'bg-slate-200 accent-slate-300')
                                    }`}
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                    <span>1</span><span>5</span><span>10</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                            Motivasi &amp; Keterlibatan <span className="text-rose-500">*</span>
                        </label>
                        {form.p5 && (
                            <button type="button" onClick={() => handleChange('p5', '')}
                                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition">
                                Reset
                            </button>
                        )}
                    </div>
                    <select value={form.p5} onChange={e => handleChange('p5', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                            isMissing('p5')
                                ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500'
                                : 'border-slate-300 focus:ring-blue-500/30 focus:border-blue-500'
                        }`}>
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

                {attempted && missing.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs text-rose-700 leading-relaxed">
                            <p className="font-semibold">{missing.length} isian belum lengkap</p>
                            <p className="mt-0.5">
                                Lengkapi: <strong>{missing.join(', ')}</strong>.
                                Nilai yang masih &ldquo;—&rdquo; tidak akan tersimpan.
                            </p>
                        </div>
                    </div>
                )}

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

function IsiRefleksiForm({ weeksKader }) {
    const [form, setForm]             = useState({ id_week: '', p7: '', p8: '', p9: '', p10: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [attempted, setAttempted]   = useState(false);

    const weekGroups = useMemo(() => {
        const groups = {};
        (weeksKader || []).forEach(w => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push({ value: w.id_week, label: `Week ${w.angka_week}`, status: weekStatus(w) });
        });
        return Object.values(groups);
    }, [weeksKader]);

    const selectedWeek = (weeksKader || []).find(w => String(w.id_week) === String(form.id_week));

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setAttempted(true);
        if (!form.id_week) return; // WeekSelect bukan <select> native, `required` tidak berlaku
        setSubmitting(true);
        router.post('/dashboard-kader/refleksi', form, {
            preserveScroll: true,
            onSuccess: () => { setForm({ id_week: '', p7: '', p8: '', p9: '', p10: 0 }); setAttempted(false); },
            onFinish:  () => setSubmitting(false),
        });
    };

    return (
        <div className="px-2 pt-1 pb-2">
            <p className="text-xs text-slate-400 mb-4">
                Isi refleksi setelah menyelesaikan setiap minggu berjalan
                {selectedWeek ? ` — Week ${selectedWeek.angka_week}` : ''}.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
                        Periode Refleksi <span className="text-rose-500">*</span>
                    </label>
                    <WeekSelect
                        groups={weekGroups}
                        value={form.id_week}
                        onChange={val => handleChange('id_week', val)}
                        placeholder={weekGroups.length === 0 ? '--Belum ada jadwal--' : '--Pilih Week--'}
                        accent="violet"
                        invalid={attempted && !form.id_week}
                    />
                    {attempted && !form.id_week && (
                        <p className="text-[11px] text-rose-600 mt-1">Pilih periode refleksi terlebih dahulu.</p>
                    )}
                    {weekGroups.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5">Belum ada jadwal minggu. Hubungi admin untuk mengatur batch.</p>
                    )}
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-0.5">
                        1. Apa yang kamu pelajari dari modul / minggu ini?
                    </label>
                    <p className="text-xs text-slate-400 mb-1.5">Tuliskan insight utama, konsep baru, atau perspektif yang berubah.</p>
                    <textarea required rows={3} value={form.p7} onChange={e => handleChange('p7', e.target.value)}
                        placeholder="Saya belajar bahwa..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white resize-none" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-0.5">
                        2. Tantangan apa yang kamu hadapi?
                    </label>
                    <p className="text-xs text-slate-400 mb-1.5">Jujurlah — ini untuk perkembanganmu, bukan penilaian.</p>
                    <textarea rows={3} value={form.p8} onChange={e => handleChange('p8', e.target.value)}
                        placeholder="Saya merasa kesulitan ketika..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white resize-none" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-0.5">
                        3. Apa yang akan kamu improve minggu depan?
                    </label>
                    <p className="text-xs text-slate-400 mb-1.5">Tuliskan 1-3 langkah konkret yang bisa langsung kamu lakukan.</p>
                    <textarea rows={3} value={form.p9} onChange={e => handleChange('p9', e.target.value)}
                        placeholder="Saya akan..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white resize-none" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-0.5">
                        4. Seberapa relevan materi ini dengan pekerjaanmu?
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Klik bintang untuk memberi rating.</p>
                    <StarRating value={form.p10} onChange={val => handleChange('p10', val)} />
                    {form.p10 > 0 && (
                        <p className="text-xs text-slate-500 mt-1">Relevan ({form.p10}/5)</p>
                    )}
                </div>

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-60 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {submitting ? 'Menyimpan...' : 'Submit Refleksi'}
                </button>
            </form>
        </div>
    );
}

function WeeklyFeedbackUpload({ data }) {
    const { weeks = [], history = [], hasBatch = false, template = null } = data || {};
    const { data: form, setData, post, processing, errors, reset } = useForm({ id_week: "", file: null });

    const weekGroups = useMemo(() => {
        const groups = {};
        weeks.forEach((w) => {
            if (!w.bulan || !w.tahun) return;
            const key = `${w.tahun}-${String(w.bulan).padStart(2, "0")}`;
            if (!groups[key]) groups[key] = { label: `${BULAN_ID[w.bulan]} ${w.tahun}`, items: [] };
            groups[key].items.push(w);
        });
        return Object.values(groups);
    }, [weeks]);

    const selectedWeek = weeks.find((w) => String(w.id_week) === String(form.id_week)) || null;
    const canUpload = hasBatch && selectedWeek && selectedWeek.is_available
        && (selectedWeek.status === "none" || selectedWeek.status === "rejected");

    const lockMsg = (() => {
        if (!selectedWeek) return null;
        if (!selectedWeek.is_available) return "Minggu ini belum waktunya untuk upload.";
        if (selectedWeek.status === "pending") return "File minggu ini masih menunggu review Mentor.";
        if (selectedWeek.status === "approved") return "File minggu ini sudah disetujui Mentor dan tidak dapat diubah.";
        return null;
    })();

    const submit = (e) => {
        e.preventDefault();
        post("/weekly-feedback/upload", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const historyCols = [
        {
            key: "angka_week", label: "Week", sortable: true, render: (_, r) => (
                <div className="whitespace-nowrap">
                    <span className="font-medium text-slate-700">W{r.angka_week}</span>
                    {r.bulan && r.tahun && <span className="block text-xs text-slate-400">{BULAN_ID[r.bulan]} {r.tahun}</span>}
                </div>
            ),
        },
        {
            key: "nama_file", label: "File", render: (_, r) => (
                r.path_file
                    ? <a href={`/${r.path_file}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{r.nama_file}</a>
                    : <span className="text-slate-400 text-xs">{r.nama_file ?? "—"}</span>
            ),
        },
        {
            key: "status", label: "Status", render: (_, r) => (
                <div>
                    <WfStatusBadge status={r.status} />
                    {r.status === "rejected" && r.rejection_reason && (
                        <p className="text-[11px] text-red-600 mt-1 max-w-xs">"{r.rejection_reason}"</p>
                    )}
                </div>
            ),
        },
        { key: "updated_at", label: "Diupload", sortable: true, render: (_, r) => fmtDate(r.updated_at ?? r.created_at) },
    ];

    return (
        <div className="px-2 pt-1 pb-2 space-y-4">
            {/* Info bar */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">
                    Upload file laporan mingguan (PDF, DOCX, XLSX — maks 2MB) sesuai minggu. Setelah upload,
                    file menunggu review Mentor: <strong>Approved = selesai</strong>, <strong>Ditolak = upload ulang</strong>.
                </p>
            </div>

            {/* Template download / notif belum tersedia */}
            {template ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-800">Template Weekly Feedback</p>
                        <p className="text-[11px] text-emerald-600 mt-0.5 truncate">{template.nama_file}</p>
                    </div>
                    <a href={`/${template.path_file}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh Template
                    </a>
                </div>
            ) : (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.75-2.98l-6.93-12a2 2 0 00-3.5 0l-6.93 12A2 2 0 005.07 19z" />
                    </svg>
                    <div>
                        <p className="text-xs font-semibold text-amber-800">Template Weekly Feedback belum tersedia</p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                            Admin MAI belum mengunggah template Weekly Feedback. Anda tetap bisa mengupload file,
                            namun sebaiknya menunggu template resmi agar format laporan sesuai.
                        </p>
                    </div>
                </div>
            )}

            {/* Upload form */}
            {!hasBatch ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                    Batch Kader belum ditentukan. Hubungi Admin untuk mengatur batch Anda sebelum dapat mengunggah file.
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Week <span className="text-rose-500">*</span>
                        </label>
                        <select required value={form.id_week} onChange={(e) => setData("id_week", e.target.value)}
                            disabled={weekGroups.length === 0}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400">
                            <option value="">
                                {weekGroups.length === 0 ? "--Belum ada jadwal minggu--" : "--Pilih Week--"}
                            </option>
                            {weekGroups.map((g) => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.items.map((w) => {
                                        const disabled = !w.is_available || w.status === "pending" || w.status === "approved";
                                        const suffix = w.status === "approved" ? " — Approved"
                                            : w.status === "pending" ? " — menunggu review"
                                            : w.status === "rejected" ? " — ditolak, upload ulang"
                                            : (!w.is_available ? " — belum waktunya" : "");
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
                            <p className="text-xs text-amber-600 mt-1.5">Belum ada jadwal minggu untuk batch ini.</p>
                        )}
                    </div>

                    {lockMsg && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500">{lockMsg}</div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            File <span className="text-slate-400 font-normal">(PDF, DOCX, XLSX — maks 2MB)</span>
                        </label>
                        <input type="file" accept=".pdf,.docx,.xlsx"
                            onChange={(e) => setData("file", e.target.files[0])}
                            disabled={!canUpload}
                            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
                        {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                        {errors.id_week && <p className="mt-1 text-xs text-red-600">{errors.id_week}</p>}
                    </div>

                    <button type="submit" disabled={processing || !canUpload || !form.file}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {processing ? "Mengunggah..." : "Upload File"}
                    </button>
                </form>
            )}

            {/* History per week */}
            <div>
                <h4 className="text-xs font-semibold text-slate-600 mb-2">Riwayat Upload per Week</h4>
                <FilterableTable
                    columns={historyCols}
                    data={history}
                    perPage={5}
                    emptyMessage="Belum ada file yang diupload."
                    filters={[
                        { key: "status", label: "Status", options: [
                            { value: "pending", label: "Menunggu Review" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Ditolak" },
                        ] },
                        { key: "angka_week", label: "Week", labelFormat: (v) => `W${v}` },
                    ]}
                />
            </div>
        </div>
    );
}

function MonthlyFeedbackForm({ kader, kaderId, periods }) {
    const [form, setForm]             = useState(EMPTY_MONTHLY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [attempted, setAttempted]   = useState(false);
    const [toast, setToast]           = useState(false);
    const closeToast                  = useCallback(() => setToast(false), []);

    const handleChange = (field, val) => setForm(f => ({ ...f, [field]: val }));

    const periodGroups = useMemo(() => ([{
        label: null,
        items: (periods || []).map(p => ({
            value:  p.anchor_week_id,
            label:  `${BULAN_ID[p.bulan]} ${p.tahun}`,
            status: p.is_filled ? 'filled' : (!p.is_available ? 'locked' : 'open'),
        })),
    }]), [periods]);

    // Semua pertanyaan wajib terjawab; jawaban berisi spasi saja tidak dihitung.
    const missing = useMemo(
        () => MONTHLY_QUESTIONS.map((q, i) => (form[q.field] ?? '').trim() ? null : i + 1).filter(Boolean),
        [form],
    );

    const isMissing = (field) => attempted && !(form[field] ?? '').trim();
    const incomplete = !form.id_week || missing.length > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        setAttempted(true);
        if (incomplete) return;
        setSubmitting(true);
        router.post(`/kader-saya/${kaderId}/monthly-feedback`, form, {
            preserveScroll: true,
            onSuccess: () => { setToast(true); setForm(EMPTY_MONTHLY_FORM); setAttempted(false); },
            onFinish:  () => setSubmitting(false),
        });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Toast open={toast} type="success" message="Monthly Feedback berhasil dikirim!" onClose={closeToast} duration={5000} />
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Monthly Feedback</h3>
                    <p className="text-xs text-slate-400">Penilaian kualitatif bulanan untuk {kader?.nama}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Bulan Tahun <span className="text-rose-500">*</span>
                    </label>
                    <WeekSelect
                        groups={periodGroups}
                        value={form.id_week}
                        onChange={val => handleChange('id_week', val)}
                        placeholder={periods.length === 0 ? '--Belum ada jadwal bulan--' : '--Pilih Bulan--'}
                        accent="amber"
                        invalid={attempted && !form.id_week}
                    />
                    {periods.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-start gap-1">
                            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Belum ada jadwal bulan untuk batch ini. Atur tanggal batch &amp; generate jadwal minggu terlebih dahulu.
                        </p>
                    )}
                </div>

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        Penilaian Kualitatif <span className="text-rose-500">*</span>
                    </p>
                    <div className="space-y-4">
                        {MONTHLY_QUESTIONS.map((q, i) => (
                            <div key={q.field}>
                                <label className="flex items-start gap-2 mb-1.5">
                                    <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                        isMissing(q.field) ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    }`}>{i + 1}</span>
                                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">{q.text}</span>
                                </label>
                                <textarea required rows={3} value={form[q.field]} onChange={e => handleChange(q.field, e.target.value)}
                                    placeholder={q.placeholder}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
                                        isMissing(q.field)
                                            ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500'
                                            : 'border-slate-300 focus:ring-amber-500/30 focus:border-amber-500'
                                    }`} />
                                {isMissing(q.field) && (
                                    <p className="text-[11px] text-rose-600 mt-1">Pertanyaan ini wajib dijawab.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {attempted && incomplete && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs text-rose-700 leading-relaxed">
                            <p className="font-semibold">Isian belum lengkap</p>
                            {!form.id_week && <p className="mt-0.5">Pilih <strong>Bulan Tahun</strong> terlebih dahulu.</p>}
                            {missing.length > 0 && (
                                <p className="mt-0.5">
                                    Lengkapi pertanyaan nomor <strong>{missing.join(', ')}</strong> sebelum mengirim.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-60 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {submitting ? 'Mengirim...' : 'Kirim Monthly Feedback'}
                </button>
            </form>
        </div>
    );
}

function MonthlyCard({ m, defaultOpen = false, canEdit = false, kaderId = null }) {
    const [open, setOpen]       = useState(defaultOpen);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft]     = useState({});
    const [saving, setSaving]   = useState(false);
    const [attempted, setAttempted] = useState(false);

    const gaps = MONTHLY_QUESTIONS.filter((q, i) => isBlank(m[`q${i + 1}`])).length;

    const startEdit = () => {
        setDraft({ m1: m.q1 ?? '', m2: m.q2 ?? '', m3: m.q3 ?? '' });
        setOpen(true);
        setEditing(true);
    };
    const cancelEdit = () => { setEditing(false); setDraft({}); setAttempted(false); };

    const missing = MONTHLY_QUESTIONS
        .map((q, i) => (draft[`m${i + 1}`] ?? '').trim() ? null : i + 1)
        .filter(Boolean);

    const saveEdit = () => {
        setAttempted(true);
        if (missing.length > 0) return;
        setSaving(true);
        router.post(`/kader-saya/${kaderId}/monthly-feedback/update`,
            { bulan: m.bulan, tahun: m.tahun, ...draft }, {
                preserveScroll: true,
                onSuccess: () => cancelEdit(),
                onFinish:  () => setSaving(false),
            });
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition text-left">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{BULAN_ID[m.bulan]} {m.tahun}</span>
                        {canEdit && gaps > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {gaps} JAWABAN KOSONG
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{m.nama_mentor ? `Mentor: ${m.nama_mentor}` : ''}</p>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                    {MONTHLY_QUESTIONS.map((q, i) => {
                        const val   = m[`q${i + 1}`];
                        const field = `m${i + 1}`;
                        const blank = isBlank(val);
                        if (!editing && blank && !canEdit) return null;
                        return (
                            <div key={q.field} className={`relative rounded-lg border-l-2 px-3 py-2.5 ${
                                blank && canEdit ? 'border-amber-400 bg-amber-50' : 'border-amber-300 bg-amber-50/60'
                            }`}>
                                {canEdit && !editing && (
                                    <button type="button" onClick={startEdit} title="Ubah jawaban"
                                        className="absolute top-2 right-2 text-slate-300 hover:text-amber-600 transition">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                )}
                                <p className="text-[10px] font-semibold text-slate-500 mb-1 leading-snug pr-5">{i + 1}. {q.text}</p>
                                {editing ? (
                                    <>
                                        <textarea rows={3} value={draft[field] ?? ''} onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                                            placeholder={q.placeholder}
                                            className={`w-full px-2 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-2 resize-none ${
                                                attempted && !(draft[field] ?? '').trim()
                                                    ? 'border-rose-400 focus:ring-rose-500/30'
                                                    : 'border-amber-300 focus:ring-amber-500/30'
                                            }`} />
                                        {attempted && !(draft[field] ?? '').trim() && (
                                            <p className="text-[10px] text-rose-600 mt-1">Wajib dijawab.</p>
                                        )}
                                    </>
                                ) : (
                                    <p className={`text-xs leading-relaxed italic ${blank ? 'text-slate-300 font-bold' : 'text-slate-700'}`}>
                                        {blank ? '—' : `"${val}"`}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {editing && (
                        <div className="flex items-center gap-2 pt-1">
                            <button type="button" onClick={saveEdit} disabled={saving}
                                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-60 transition">
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            <button type="button" onClick={cancelEdit} disabled={saving}
                                className="px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition">
                                Batal
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MonthlyHistory({ list, canEdit = false, kaderId = null, wide = false }) {
    if (list.length === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada Monthly Feedback yang dikirim.</p>;
    return (
        <div className={listLayout(wide)}>
            {list.map((m, i) => (
                <MonthlyCard key={m.key} m={m} defaultOpen={i === 0} canEdit={canEdit} kaderId={kaderId} />
            ))}
        </div>
    );
}

const FOLDERS = [
    {
        id: "weekly", label: "Weekly", desc: "Feedback & refleksi mingguan",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: "monthly", label: "Monthly", desc: "Feedback kualitatif bulanan",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
];

const FOLDER_COLORS = {
    weekly:  { active: "text-blue-500",  inactive: "text-slate-400" },
    monthly: { active: "text-amber-500", inactive: "text-slate-400" },
};

function FolderTabs({ folder, onChange, folders = FOLDERS }) {
    return (
        <div className="flex items-end gap-1.5">
            {folders.map(f => {
                const active = folder === f.id;
                const clr = FOLDER_COLORS[f.id] ?? FOLDER_COLORS.weekly;
                return (
                    <button key={f.id} type="button" onClick={() => onChange(f.id)}
                        className={`relative flex items-center gap-2.5 px-5 py-3 rounded-t-xl border-2 border-b-0 transition-all ${
                            active
                                ? "bg-slate-50 border-slate-200 text-slate-800 -mb-0.5 z-10"
                                : "bg-slate-200/40 border-transparent text-slate-500 hover:bg-slate-200/70"
                        }`}>
                        <span className={active ? clr.active : clr.inactive}>{f.icon}</span>
                        <span className="text-left">
                            <span className="block text-sm font-semibold leading-tight">{f.label}</span>
                            <span className="block text-[11px] text-slate-400 leading-tight">{f.desc}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function MonthlyFolder({ kader, kaderId, monthlyPeriods, monthlyFeedbackList, showForm, canEdit = false }) {
    // Tanpa form, daftar riwayat memakai lebar penuh → pecah jadi beberapa kolom.
    const wide = !showForm;
    return (
        <div className={`grid grid-cols-1 gap-5 items-start ${showForm ? "lg:grid-cols-2" : ""}`}>
            {showForm && (
                <MonthlyFeedbackForm kader={kader} kaderId={kaderId} periods={monthlyPeriods} />
            )}
            <div className="space-y-3">
                <AccordionSection
                    defaultOpen
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                    title="Riwayat Monthly Feedback"
                    count={monthlyFeedbackList.length}
                >
                    <MonthlyHistory list={monthlyFeedbackList} canEdit={canEdit} kaderId={kaderId} wide={wide} />
                </AccordionSection>
            </div>
        </div>
    );
}

export default function FeedbackTab({ kader, weeks, weeksKader = [], refleksi, mentorFeedbackList = [], monthlyPeriods = [], monthlyFeedbackList = [], mentorName, kaderId, showFeedbackForm = true, kaderView = false, weeklyFeedback = null, showMonthly = true, feedbackEditable = false }) {
    const [folder, setFolder] = useState("weekly");

    // Kader batch arsip (Batch 1-2) tidak punya Monthly Feedback di sistem — folder-nya
    // disembunyikan supaya tidak menyisakan tab kosong.
    const folders = showMonthly ? FOLDERS : FOLDERS.filter(f => f.id !== "monthly");
    const active  = showMonthly ? folder : "weekly";

    // Mentor/Admin boleh mengubah feedback selama batch belum berakhir. Nilai ini
    // dihitung server dari tanggal_selesai batch — UI hanya mengikutinya.
    const canEdit = showFeedbackForm && !kaderView && feedbackEditable;

    return (
        <div>
            <FolderTabs folder={active} onChange={setFolder} folders={folders} />
            <div className="border-2 border-slate-200 rounded-b-2xl rounded-tr-2xl bg-slate-50 p-5">
            {!kaderView && !feedbackEditable && (
                <div className="flex items-start gap-2 mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg">
                    <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        <strong className="text-slate-600">Feedback terkunci.</strong> Masa batch kader ini sudah
                        berakhir, sehingga feedback tidak dapat dikirim maupun diubah lagi.
                    </p>
                </div>
            )}
            {active === "monthly" ? (
                <MonthlyFolder
                    kader={kader}
                    kaderId={kaderId}
                    monthlyPeriods={monthlyPeriods}
                    monthlyFeedbackList={monthlyFeedbackList}
                    showForm={showFeedbackForm && feedbackEditable}
                    canEdit={canEdit}
                />
            ) : (
                <WeeklyFolder
                    kader={kader}
                    weeks={weeks}
                    weeksKader={weeksKader}
                    refleksi={refleksi}
                    mentorFeedbackList={mentorFeedbackList}
                    mentorName={mentorName}
                    kaderId={kaderId}
                    showFeedbackForm={showFeedbackForm && feedbackEditable}
                    kaderView={kaderView}
                    weeklyFeedback={weeklyFeedback}
                    canEdit={canEdit}
                />
            )}
            </div>
        </div>
    );
}

function WeeklyFolder({ kader, weeks, weeksKader = [], refleksi, mentorFeedbackList = [], mentorName, kaderId, showFeedbackForm = true, kaderView = false, weeklyFeedback = null, canEdit = false }) {
    // Tanpa kolom form di sebelah kiri, daftar riwayat memakai lebar penuh → multi-kolom.
    const wide = !showFeedbackForm && !kaderView;
    return (
        <div className={`grid grid-cols-1 gap-5 items-start ${(showFeedbackForm || kaderView) ? "lg:grid-cols-2" : ""}`}>
            {kaderView ? (
                <div className="space-y-3">
                    <AccordionSection
                        defaultOpen
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                        title="Form Refleksi Kader"
                    >
                        <IsiRefleksiForm weeksKader={weeksKader} />
                    </AccordionSection>

                    {weeklyFeedback && (
                        <AccordionSection
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            }
                            title="Upload File Weekly Feedback"
                            count={weeklyFeedback.history?.length ?? 0}
                        >
                            <WeeklyFeedbackUpload data={weeklyFeedback} />
                        </AccordionSection>
                    )}
                </div>
            ) : showFeedbackForm ? (
                <KirimFeedbackForm kader={kader} weeks={weeks} mentorName={mentorName} kaderId={kaderId} />
            ) : null}

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
                    <RefleksiAccordion refleksi={refleksi} wide={wide} />
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
                    <RiwayatAccordion mentorFeedbackList={mentorFeedbackList} canEdit={canEdit} kaderId={kaderId} wide={wide} />
                </AccordionSection>
            </div>
        </div>
    );
}
