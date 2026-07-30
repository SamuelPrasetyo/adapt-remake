import AppLayout from "@/Layouts/AppLayout";
import { band, pickerBackHref } from "@/Components/Report/reportUi";

// Nilai dokumen ada yang bulat (90) dan ada yang desimal (93.3) — tampilkan apa adanya
// supaya tabel tidak penuh ".0" yang tidak ada di sumbernya.
const num = (v) => {
    if (v == null || v === "") return "—";
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
};
const avgFmt = (v) => (v == null ? "—" : Number(v).toFixed(1));

// Warna sel skor: tegas hanya untuk yang menonjol (di bawah KKM / excellent) agar
// 9 kolom nilai tetap enak dibaca.
const scoreTone = (v, kkm) => {
    if (v == null) return "text-slate-300";
    if (v < kkm) return "text-rose-700 bg-rose-50 font-semibold";
    if (v >= 85) return "text-emerald-700 font-semibold";
    return "text-slate-700";
};

const TH = "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 align-bottom";
const TD = "px-3 py-2.5 text-sm tabular-nums text-center whitespace-nowrap";

/**
 * Kolom Rank & Nama dibekukan saat tabel di-scroll ke samping.
 *
 * PENTING: lebar kolom Rank wajib dipatok lewat **min-width** (bukan cuma `w-`) dan harus sama
 * persis dengan offset sticky kolom Nama (4rem = left-16). Kalau hanya pakai `w-`, browser
 * boleh menyusutkan kolom itu ke min-content begitu tabel melebihi layar — offset Nama jadi
 * lebih besar dari lebar aslinya dan muncul celah tempat kolom berikutnya "tembus" di antaranya.
 * Ganti lebar kolom ini = ganti offset kolom Nama juga.
 */
const STICKY_RANK = "sticky left-0 w-16 min-w-[4rem]";
const STICKY_NAMA = "sticky left-16 border-r border-slate-200";

/**
 * Ukuran kartu kompetensi di ringkasan kader — ATUR DI SINI kalau mau diperbesar/perkecil.
 * Nilainya kelas Tailwind biasa, jadi cukup ganti angkanya (mis. value: "text-3xl").
 */
const CHIP = {
    label: "text-sm",   // nama kompetensi (Com Skill, Agile Leadership, …)
    value: "text-2xl",  // angka nilainya
    bar: "h-2",         // tebal bar progres
    pad: "px-4 py-3",   // padding dalam kartu
    cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", // jumlah kartu per baris
};

/**
 * Judul kolom tabel — ATUR DI SINI kalau mau ganti gaya headernya.
 *
 * SATU BARIS (aktif)  : judul memanjang ke samping, tabel jadi lebih lebar → scroll
 *                       horizontalnya lebih panjang, tapi header enak dibaca sekali lihat.
 * BEBERAPA BARIS      : tukar dengan baris yang dikomentari di bawahnya — judul boleh turun,
 *                       tabel lebih ramping & muat lebih banyak kolom tanpa scroll.
 */
const TABEL = {
    headerModul: "whitespace-nowrap",
    headerAvg: "whitespace-nowrap",
    // headerModul: "min-w-[5.5rem] max-w-[7rem] whitespace-normal",
    // headerAvg: "min-w-[6rem] whitespace-normal",
};

/** Ukuran identitas kader di ringkasan — ATUR DI SINI, sama seperti CHIP di atas. */
const FOCUS = {
    nama: "text-2xl", // nama kader yang sedang dibuka
    rank: "text-2xl", // angka peringkat (#1)
};

// Bar mini 0–100 untuk kartu ringkasan kader.
function ModulChip({ label, value, kkm }) {
    const pct = value == null ? 0 : Math.max(0, Math.min(100, Number(value)));
    const color = value == null ? "bg-slate-200" : value < kkm ? "bg-rose-500" : value >= 85 ? "bg-emerald-500" : "bg-blue-500";
    return (
        <div className={`rounded-lg border border-slate-200 ${CHIP.pad}`}>
            <div className="flex items-baseline justify-between gap-2">
                <span className={`${CHIP.label} leading-snug text-slate-600`}>{label}</span>
                <span className={`${CHIP.value} font-bold text-slate-800 tabular-nums shrink-0`}>{num(value)}</span>
            </div>
            <span className={`mt-2 block ${CHIP.bar} bg-slate-100 rounded-full overflow-hidden`}>
                <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
            </span>
        </div>
    );
}

/**
 * Rincian nilai in-class training MT untuk kader batch arsip (baru Batch 2).
 * Menampilkan dokumen sumbernya utuh — satu tabel seluruh peserta batch, dengan baris
 * kader yang sedang dibuka disorot. Props disusun App\Support\HasilTrainingMt.
 */
export default function HasilTraining({
    meta = {},
    identitas = [],
    modul = [],
    peserta = [],
    ringkas = {},
    focusNo = null,
    kader = {},
}) {
    const kkm = meta.kkm ?? 70;
    const labelAvg = meta.label_avg ?? "Avg per Kader";
    const batchLabel = meta.batch_roman ?? meta.batch_no ?? kader.batch_name;
    const focus = peserta.find((p) => p.no === focusNo) ?? null;
    const focusBand = band(focus?.avg ?? null);
    const perModul = ringkas.per_modul ?? {};

    return (
        <AppLayout title="HASIL TRAINING MT" breadcrumb={`Report / Arsip Batch 1–2 / Hasil Training Batch ${batchLabel}`}>
            <div className="max-w-7xl mx-auto space-y-4">
                {/* Bar aksi */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Balik langsung ke picker kader (bukan ke report kadernya), lengkap dengan
                        kelompok/batch/halaman yang sedang dipilih — sama seperti tombol
                        "Pilih kader lain" di halaman report arsip. */}
                    <a
                        href={pickerBackHref("arsip")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Report
                    </a>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700 bg-amber-100 rounded-lg self-start sm:self-auto">
                        📁 Data Arsip · Batch {batchLabel}
                    </span>
                </div>

                {/* Kartu ringkas kader yang sedang dibuka */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-800 text-white px-6 py-5 flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                                New Armada Group · People Development
                            </div>
                            <h2 className="text-lg font-bold tracking-wide mt-1">
                                {(meta.judul ?? "Hasil Training MT").toUpperCase()} · BATCH {batchLabel}
                            </h2>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-[11px] uppercase tracking-widest text-slate-400">Peserta</div>
                            <div className="text-sm font-semibold mt-1">{ringkas.jml_kader ?? peserta.length} kader</div>
                        </div>
                    </div>

                    {focus ? (
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                                <div className="min-w-0">
                                    <div className="text-xs uppercase tracking-wide text-slate-400">Kader dibuka</div>
                                    <div className={`${FOCUS.nama} font-bold text-slate-800 truncate mt-0.5`}>{focus.nama}</div>
                                    {/* Kolom identitas ikut dokumennya: BU/Area (Batch 2) atau
                                        BU/Mentor/Jabatan (Batch 1). */}
                                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm">
                                        {identitas.map((c) => (
                                            <span key={c.key}>
                                                <span className="text-slate-400">{c.label}: </span>
                                                <span className="text-slate-600">{focus[c.key] || "—"}</span>
                                            </span>
                                        ))}
                                    </div>
                                    {focus.nama_db && focus.nama_db !== focus.nama && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            Tercatat di sistem sebagai “{focus.nama_db}”
                                        </div>
                                    )}
                                </div>
                                <div className="sm:ml-auto flex items-center gap-6 shrink-0">
                                    <div className="text-center">
                                        <div className="text-xs uppercase tracking-wide text-slate-400">Peringkat</div>
                                        <div className={`${FOCUS.rank} font-bold text-slate-700 mt-0.5`}>
                                            #{focus.rank}
                                            <span className="text-sm font-normal text-slate-400"> / {peserta.length}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-3 text-center">
                                        <div className="text-[11px] uppercase tracking-wide text-blue-600">{labelAvg}</div>
                                        <div className="text-3xl font-bold text-blue-700 mt-0.5 tabular-nums">{avgFmt(focus.avg)}</div>
                                        <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded ${focusBand.cls}`}>
                                            {focusBand.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`grid ${CHIP.cols} gap-3`}>
                                {modul.map((m) => (
                                    <ModulChip key={m.key} label={m.label} value={focus.nilai?.[m.key] ?? null} kkm={kkm} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-5 text-sm text-amber-800 bg-amber-50 border-t border-amber-100">
                            ⚠️ <b>{kader.nama}</b> tidak tercatat pada dokumen hasil training Batch {batchLabel}. Tabel di bawah
                            tetap ditampilkan sebagai arsip nilai training batch tersebut.
                        </div>
                    )}
                </div>

                {/* Grafik Learning Growth-nya TIDAK diulang di sini — sudah ada di Section A
                    kartu report arsip. Halaman ini fokus ke rincian angka & tabel dokumennya. */}

                {/* Tabel dokumen sumber — seluruh peserta batch */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Tabel Nilai Training · Batch {batchLabel}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Diurutkan dari nilai tertinggi · Skala 0–100 · KKM {kkm} · {labelAvg} = rata-rata {modul.length} modul.
                            </p>
                        </div>
                        <div className="sm:ml-auto text-xs text-slate-500">
                            Rata-rata kelas <span className="font-bold text-slate-800 tabular-nums">{avgFmt(ringkas.avg_kelas)}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className={`${TH} ${STICKY_RANK} z-20 bg-slate-50 text-center`}>Rank</th>
                                    <th className={`${TH} ${STICKY_NAMA} z-20 bg-slate-50 text-left min-w-[15rem]`}>
                                        Nama
                                    </th>
                                    {identitas.map((c) => (
                                        <th key={c.key} className={`${TH} text-left ${TABEL.headerModul}`}>
                                            {c.label}
                                        </th>
                                    ))}
                                    {modul.map((m) => (
                                        <th key={m.key} className={`${TH} text-center ${TABEL.headerModul}`}>
                                            {m.label}
                                        </th>
                                    ))}
                                    <th className={`${TH} text-center bg-blue-50 text-blue-700 border-l border-blue-100 ${TABEL.headerAvg}`}>
                                        {labelAvg}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {peserta.map((p) => {
                                    const isFocus = p.no === focusNo;
                                    const rowBg = isFocus ? "bg-blue-50" : "bg-white";
                                    return (
                                        <tr key={p.no} className={`${rowBg} ${isFocus ? "" : "hover:bg-slate-50"} group`}>
                                            <td className={`${TD} ${STICKY_RANK} z-10 ${rowBg} ${isFocus ? "" : "group-hover:bg-slate-50"} ${isFocus ? "font-bold text-blue-800" : "text-slate-400"}`}>
                                                {p.rank}
                                            </td>
                                            <td
                                                className={`px-3 py-2.5 text-sm text-left whitespace-nowrap ${STICKY_NAMA} z-10 ${rowBg} ${
                                                    isFocus ? "" : "group-hover:bg-slate-50"
                                                }`}
                                            >
                                                <span className={isFocus ? "font-bold text-blue-800" : "text-slate-700"}>{p.nama}</span>
                                                {isFocus && (
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                                        Kader ini
                                                    </span>
                                                )}
                                            </td>
                                            {identitas.map((c) => (
                                                <td key={c.key} className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">
                                                    {p[c.key] || "—"}
                                                </td>
                                            ))}
                                            {modul.map((m) => {
                                                const v = p.nilai?.[m.key] ?? null;
                                                return (
                                                    <td key={m.key} className={`${TD} ${scoreTone(v, kkm)}`}>
                                                        {num(v)}
                                                    </td>
                                                );
                                            })}
                                            <td className={`${TD} font-bold border-l border-blue-100 ${isFocus ? "text-blue-800" : "text-slate-800"}`}>
                                                {avgFmt(p.avg)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <td className={`${TD} ${STICKY_RANK} z-10 bg-slate-50`} />
                                    <td className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${STICKY_NAMA} z-10 bg-slate-50`}>
                                        Rata-rata Kelas
                                    </td>
                                    {identitas.map((c) => (
                                        <td key={c.key} className="px-3 py-2.5" />
                                    ))}
                                    {modul.map((m) => (
                                        <td key={m.key} className={`${TD} font-semibold text-slate-600`}>
                                            {avgFmt(perModul[m.key] ?? null)}
                                        </td>
                                    ))}
                                    <td className={`${TD} font-bold text-blue-700 bg-blue-50 border-l border-blue-100`}>
                                        {avgFmt(ringkas.avg_kelas)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-wide text-slate-400">Keterangan</span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block" /> Di bawah KKM ({kkm})
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" /> ≥ 85 (Excellent)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> Baris kader yang dibuka
                        </span>
                        {meta.keterangan && <span className="text-slate-400">· {meta.keterangan}</span>}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
