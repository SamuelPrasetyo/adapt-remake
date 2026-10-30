import { useEffect, useState } from "react";
import Modal from "@/Components/Modal";
import { scoreTone } from "@/Components/Report/reportUi";

const TYPE_LABEL = { pre: "Pre-Test", post: "Post-Test" };
const LETTERS = ["A", "B", "C", "D", "E", "F"];
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const FILTERS = [
    { id: "all",   label: "Semua", match: () => true,          activeCls: "bg-slate-700 border-slate-700 text-white" },
    { id: "wrong", label: "Salah", match: (it) => !it.is_correct, icon: "✗", activeCls: "bg-red-500 border-red-500 text-white" },
    { id: "right", label: "Benar", match: (it) => it.is_correct,  icon: "✓", activeCls: "bg-emerald-500 border-emerald-500 text-white" },
];

function StatBox({ label, value, cls = "bg-slate-700" }) {
    return (
        <div className={`flex-1 rounded-xl px-3 py-2.5 text-center text-white ${cls}`}>
            <div className="text-xl font-bold leading-none">{value}</div>
            <div className="text-[11px] text-white/85 mt-1.5">{label}</div>
        </div>
    );
}

/**
 * Detail jawaban Pre/Post-Test kader untuk Admin MAI 021 — sama seperti modal "Detail Jawaban"
 * di sisi Kader, ditambah kunci jawaban pada soal yang salah dan ringkasan benar/salah/skor.
 *
 * Props: { open, onClose, kaderId, modul: { id, nama, pre_score, post_score, need_pre, has_test }, initialType }
 */
export default function TestAnswerModal({ open, onClose, kaderId, modul, initialType = "pre" }) {
    const [type, setType]       = useState(initialType);
    const [page, setPage]       = useState(0);
    // Data Pre & Post dimuat sekaligus → pindah tab instan & bisa saling dibandingkan.
    const [cache, setCache]     = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [filter, setFilter]   = useState("all");

    // Tipe test yang sudah dikerjakan kader (punya skor) → bisa dipilih lewat toggle.
    const types = modul
        ? [modul.need_pre && modul.pre_score != null && "pre", modul.has_test && modul.post_score != null && "post"].filter(Boolean)
        : [];
    const typesKey = types.join(",");

    useEffect(() => {
        if (!open || !modul?.id || !kaderId) return;
        let cancelled = false;
        setType(initialType);
        setPage(0);
        setFilter("all");
        setCache({});
        setError(null);
        setLoading(true);
        const load = (t) =>
            fetch(`/kader-saya/${kaderId}/modul/${modul.id}/answers/${t}`, { headers: { Accept: "application/json" } })
                .then(async (r) => {
                    const d = await r.json().catch(() => null);
                    if (!r.ok) throw new Error(d?.message ?? "Gagal memuat data jawaban.");
                    return [t, d];
                });
        const toLoad = typesKey ? typesKey.split(",") : [initialType];
        Promise.all(toLoad.map(load))
            .then((pairs) => { if (!cancelled) { setCache(Object.fromEntries(pairs)); setLoading(false); } })
            .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, [open, kaderId, modul?.id, initialType, typesKey]);

    const data    = cache[type];
    const items   = data?.items ?? [];
    const total   = items.length;
    const current = items[page];
    const summary = data?.summary;

    // Index soal yang tampil sesuai filter; Previous/Next berpindah di dalam daftar ini.
    // Soal terpilih bisa berada di luar filter (hasil pindah tab) → navigasi tetap jalan
    // karena dicari berdasarkan urutan index, bukan posisi di daftar.
    const matcher = FILTERS.find((f) => f.id === filter)?.match ?? (() => true);
    const visible = items.map((it, i) => (matcher(it) ? i : -1)).filter((i) => i >= 0);
    const prevIdx = [...visible].reverse().find((i) => i < page);
    const nextIdx = visible.find((i) => i > page);
    const inFilter = visible.includes(page);
    const changeFilter = (id) => {
        setFilter(id);
        const m = FILTERS.find((f) => f.id === id).match;
        const first = items.findIndex(m);
        if (first >= 0) setPage(first);
    };

    // Soal yang sama di test lainnya, dicocokkan lewat teks soal (urutan Post-Test diacak per kader).
    const otherType = type === "pre" ? "post" : "pre";
    const findIn = (t, soal) => (cache[t]?.items ?? []).findIndex((it) => norm(it.soal) === norm(soal));
    const otherIdx  = current ? findIn(otherType, current.soal) : -1;
    const otherItem = otherIdx >= 0 ? cache[otherType].items[otherIdx] : null;

    // Pindah tab: filter dipertahankan; soal terpilih ikut pindah ke soal yang sama di tab tujuan.
    const switchType = (t) => {
        if (t === type) return;
        const target = cache[t]?.items ?? [];
        const m = FILTERS.find((f) => f.id === filter).match;
        const same = current ? findIn(t, current.soal) : -1;
        const first = target.findIndex(m);
        setType(t);
        setPage(same >= 0 ? same : first >= 0 ? first : 0);
    };

    return (
        <Modal open={open} onClose={onClose} title={`Detail Jawaban Kader · ${TYPE_LABEL[type]}`} size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <button type="button" disabled={prevIdx == null} onClick={() => setPage(prevIdx)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                        Previous
                    </button>
                    <button type="button" disabled={nextIdx == null} onClick={() => setPage(nextIdx)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition">
                        Next
                    </button>
                </div>
            }>
            {/* Modul + toggle Pre/Post */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <p className="text-sm font-semibold text-slate-700 min-w-0 truncate">{modul?.nama}</p>
                {types.length > 1 && (
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0">
                        {types.map((t) => (
                            <button key={t} type="button" onClick={() => switchType(t)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                                    type === t ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}>
                                {TYPE_LABEL[t]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && <p className="text-center text-slate-400 py-12">Memuat data jawaban...</p>}
            {!loading && error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

            {!loading && !error && summary && (
                <>
                    {/* Ringkasan */}
                    <div className="flex gap-2 mb-4">
                        <StatBox label="Jumlah Soal" value={summary.total} />
                        <StatBox label="Benar" value={summary.correct} cls="bg-emerald-500" />
                        <StatBox label="Salah" value={summary.wrong} cls="bg-red-500" />
                        <StatBox label={`Skor ${TYPE_LABEL[type]}`}
                            value={summary.score != null ? Number(summary.score).toFixed(0) : "—"}
                            cls={scoreTone(summary.score).bar} />
                    </div>

                    {/* Filter (sekaligus legenda warna) + navigasi soal */}
                    {total > 0 && (
                        <div className="mb-5">
                            <div className="flex gap-1.5 mb-2.5">
                                {FILTERS.map((f) => {
                                    const count = items.filter(f.match).length;
                                    const active = filter === f.id;
                                    return (
                                        <button key={f.id} type="button" disabled={count === 0}
                                            onClick={() => changeFilter(f.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition disabled:opacity-40 ${
                                                active ? f.activeCls : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}>
                                            {f.icon && <span>{f.icon}</span>}
                                            {f.label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {visible.map((i) => {
                                    const ok = items[i].is_correct;
                                    return (
                                        <button key={i} type="button" onClick={() => setPage(i)}
                                            title={`Soal ${i + 1} · ${ok ? "Benar" : "Salah"}`}
                                            className={`w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center leading-none transition ${
                                                ok ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                                   : "bg-red-50 border-red-500 text-red-600"
                                            } ${i === page ? "ring-2 ring-offset-2 ring-blue-500" : "hover:opacity-80"}`}>
                                            <span className="text-xs font-bold">{i + 1}</span>
                                            <span className="text-[11px] font-bold mt-0.5">{ok ? "✓" : "✗"}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!loading && !error && current && (
                <div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                        <span>Soal {page + 1} dari {total}</span>
                        <span className={`font-semibold ${current.is_correct ? "text-emerald-600" : "text-red-500"}`}>
                            {current.is_correct ? "✓ Benar" : "✗ Salah"}
                        </span>
                    </div>

                    {/* Pembanding: status soal yang sama di test lainnya */}
                    {otherItem && (
                        <button type="button" onClick={() => switchType(otherType)}
                            className={`w-full flex items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg border text-xs transition hover:brightness-95 ${
                                otherItem.is_correct ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"
                            }`}>
                            <span>
                                Di {TYPE_LABEL[otherType]} (soal no. {otherIdx + 1}):{" "}
                                <span className="font-bold">{otherItem.is_correct ? "✓ Benar" : "✗ Salah"}</span>
                                {current.is_correct !== otherItem.is_correct && (
                                    <span className="font-semibold">
                                        {current.is_correct
                                            ? (type === "post" ? " → membaik di Post-Test" : " → memburuk di Post-Test")
                                            : (type === "post" ? " → memburuk di Post-Test" : " → membaik di Post-Test")}
                                    </span>
                                )}
                            </span>
                            <span className="font-semibold shrink-0">Lihat →</span>
                        </button>
                    )}
                    {!inFilter && (
                        <p className="text-[11px] text-slate-400 mb-2">
                            Soal ini tidak termasuk filter "{FILTERS.find((f) => f.id === filter).label}" — ditampilkan sebagai pembanding.
                        </p>
                    )}

                    <p className="text-xs text-slate-400 mb-1">Soal:</p>
                    <div className="bg-slate-50 rounded-lg px-4 py-3 mb-5">
                        <p className="font-semibold text-slate-800 text-base leading-snug">{current.soal}</p>
                    </div>

                    <p className="text-xs text-slate-400 mb-2">Pilihan Jawaban:</p>
                    <div className="space-y-2.5">
                        {current.jawabans?.map((j, idx) => {
                            const isKey    = j.is_benar;
                            const isWrong  = j.selected && !isKey;
                            const isRight  = j.selected && isKey;
                            // Kunci jawaban yang tidak dipilih kader (kader menjawab salah).
                            const isMissed = isKey && !j.selected;
                            return (
                                <div key={j.id}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition ${
                                        isWrong  ? "border-red-300 bg-red-50" :
                                        isRight  ? "border-emerald-300 bg-emerald-50" :
                                        isMissed ? "border-emerald-300 border-dashed bg-emerald-50/40" :
                                                   "border-slate-200"
                                    }`}>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isWrong            ? "bg-red-500 text-white" :
                                        isRight || isMissed ? "bg-emerald-500 text-white" :
                                                             "bg-slate-200 text-slate-500"
                                    }`}>
                                        {isWrong ? "✗" : isRight || isMissed ? "✓" : LETTERS[idx]}
                                    </span>
                                    <span className="text-sm text-slate-700">{j.jawaban}</span>
                                    {isWrong && <span className="ml-auto text-xs font-semibold text-red-500 shrink-0">Jawaban Kader</span>}
                                    {isRight && <span className="ml-auto text-xs font-semibold text-emerald-600 shrink-0">Jawaban Kader · Benar</span>}
                                    {isMissed && <span className="ml-auto text-xs font-semibold text-emerald-600 shrink-0">Jawaban Benar</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!loading && !error && data && total === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">Data jawaban tidak ditemukan.</p>
            )}
        </Modal>
    );
}
