import { useEffect, useMemo, useState } from "react";
import ImageLightbox from "@/Components/ImageLightbox";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const isUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

const formatIDR = (n) =>
    n == null ? null : "Rp " + Number(n).toLocaleString("id-ID");

const jkLabel = (jk) => (jk === "L" ? "Laki-laki" : jk === "P" ? "Perempuan" : null);

/* ── Small building blocks ────────────────────────────────────────────────── */

function Icon({ path, className = "w-5 h-5" }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
        </svg>
    );
}

// Tiap identitas card SELALU memakai warna yang sama (fixed order) — bukan warna acak —
// agar "Riwayat Lamaran" misalnya selalu sky di mana pun dilihat. Kombinasi dipilih lewat
// validator palet (bukan tebakan) supaya pasangan card yang bertetangga di layout tetap
// mudah dibedakan (termasuk untuk mata buta warna) — lihat dataviz skill.
const TONE_STYLES = {
    pink:   { chip: "bg-pink-100 text-pink-600",     accent: "border-pink-200" },
    indigo: { chip: "bg-indigo-100 text-indigo-600", accent: "border-indigo-200" },
    rose:   { chip: "bg-rose-100 text-rose-600",     accent: "border-rose-200" },
    sky:    { chip: "bg-sky-100 text-sky-600",       accent: "border-sky-200" },
    amber:  { chip: "bg-amber-100 text-amber-600",   accent: "border-amber-200" },
    cyan:   { chip: "bg-cyan-100 text-cyan-600",     accent: "border-cyan-200" },
    violet: { chip: "bg-violet-100 text-violet-600", accent: "border-violet-200" },
    orange: { chip: "bg-orange-100 text-orange-600", accent: "border-orange-200" },
    lime:   { chip: "bg-lime-100 text-lime-600",     accent: "border-lime-200" },
    slate:  { chip: "bg-slate-100 text-slate-400",   accent: "border-slate-100" },
};

function Card({ title, icon, count, action, children, className = "", tone = "slate" }) {
    const t = TONE_STYLES[tone] || TONE_STYLES.slate;
    return (
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {title && (
                <header className={`flex items-center gap-2.5 px-5 py-3.5 border-b-2 ${t.accent}`}>
                    {icon && <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${t.chip}`}>{icon}</span>}
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    {count != null && (
                        <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-semibold rounded-full ${t.chip}`}>
                            {count}
                        </span>
                    )}
                    {action && <div className="ml-auto">{action}</div>}
                </header>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

// Foto kandidat: tampilkan gambar bila URL valid, tapi fallback ke avatar inisial
// bila gambar gagal dimuat (sebagian berkas record lama tidak ada di server portal).
// Hanya foto asli yang bisa dibuka penuh — avatar inisial tidak ada yang diperbesar.
function Avatar({ src, initials, name }) {
    const [failed, setFailed] = useState(false);
    const [zoom, setZoom] = useState(false);

    if (isUrl(src) && !failed) {
        return (
            <>
                <button type="button" onClick={() => setZoom(true)}
                    title="Lihat foto ukuran penuh" aria-label="Lihat foto ukuran penuh"
                    className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <img src={src} alt={name || initials} onError={() => setFailed(true)}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-slate-100 cursor-zoom-in hover:brightness-95 transition" />
                </button>
                {zoom && <ImageLightbox src={src} alt={name || initials} onClose={() => setZoom(false)} />}
            </>
        );
    }
    return (
        <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
            {initials}
        </div>
    );
}

function InfoItem({ label, value, mono = false }) {
    const empty = value == null || value === "";
    return (
        <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</dt>
            <dd className={`text-sm text-slate-800 mt-0.5 break-words ${mono ? "font-mono" : ""} ${empty ? "text-slate-300 italic" : ""}`}>
                {empty ? "—" : value}
            </dd>
        </div>
    );
}

// Notifikasi mengambang (auto-hilang) — dipakai saat berkas kandidat tidak ditemukan.
function Toast({ msg, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 6000);
        return () => clearTimeout(t);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <div className="fixed bottom-4 right-4 z-[70] max-w-sm">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white shadow-lg px-4 py-3">
                <span className="text-rose-500 shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" path="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </span>
                <p className="text-sm text-slate-700 leading-snug">{msg}</p>
                <button type="button" onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-600 shrink-0" aria-label="Tutup">
                    <Icon className="w-4 h-4" path="M6 18L18 6M6 6l12 12" />
                </button>
            </div>
        </div>
    );
}

// Berkas kandidat: cek dulu ke backend (bebas CORS) apakah sumbernya ada. Bila ada, buka
// di tab baru; bila tidak, tampilkan notifikasi — bukan halaman 404 portal Career MAI.
function FileLink({ label, value }) {
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);

    if (!value) return null;

    // Tanpa base URL (nilai bukan URL penuh) → tampilkan nama saja, tidak bisa diklik.
    if (!isUrl(value)) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg" title={value}>
                <Icon className="w-4 h-4" path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                {label}
            </span>
        );
    }

    const handleClick = async () => {
        if (busy) return;
        setBusy(true);
        // Pra-buka tab kosong dalam gesture klik agar tidak diblok popup blocker.
        const win = window.open("", "_blank");
        try {
            const res = await fetch(`/kandidat/file-exists?url=${encodeURIComponent(value)}`, {
                headers: { Accept: "application/json" },
            });
            const data = res.ok ? await res.json() : { status: "error" };
            if (data.status === "found") {
                if (win) win.location.href = value;
                else window.open(value, "_blank");
            } else {
                if (win) win.close();
                setToast(
                    data.status === "missing"
                        ? "Berkas tidak ditemukan di server portal Career MAI (kemungkinan berkas lama belum termigrasi)."
                        : "Tidak dapat memeriksa berkas saat ini. Coba lagi nanti."
                );
            }
        } catch {
            if (win) win.close();
            setToast("Gagal memeriksa berkas. Periksa koneksi Anda.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button type="button" onClick={handleClick} disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-60 disabled:cursor-wait">
                {busy ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                ) : (
                    <Icon className="w-4 h-4" path="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                )}
                {label}
            </button>
            {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
        </>
    );
}

function EmptyState({ title, desc, tone = "slate" }) {
    const tones = {
        slate: "text-slate-400",
        amber: "text-amber-500",
        rose: "text-rose-500",
    };
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className={`${tones[tone]} mb-3`}>
                <Icon className="w-12 h-12" path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">{title}</h3>
            {desc && <p className="text-sm text-slate-400 mt-1 max-w-md">{desc}</p>}
        </div>
    );
}

/* ── DISC & MBTI ──────────────────────────────────────────────────────────── */

const DISC_META = {
    D: { label: "Dominance", color: "#ef4444" },
    I: { label: "Influence", color: "#f59e0b" },
    S: { label: "Steadiness", color: "#10b981" },
    C: { label: "Compliance", color: "#3b82f6" },
};

function DiscBars({ title, data, max }) {
    return (
        <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-2.5">{title}</h4>
            <div className="space-y-2">
                {Object.keys(DISC_META).map((k) => {
                    const val = data[k] ?? 0;
                    const pct = max > 0 ? Math.round((val / max) * 100) : 0;
                    return (
                        <div key={k} className="flex items-center gap-2.5">
                            <span className="w-4 text-xs font-bold text-slate-600 text-center shrink-0">{k}</span>
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: DISC_META[k].color }} />
                            </div>
                            <span className="w-5 text-xs font-semibold text-slate-700 text-right shrink-0 tabular-nums">{val}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DiscPanel({ disc }) {
    const max = useMemo(() => {
        const all = [...Object.values(disc.strength), ...Object.values(disc.weakness)];
        return Math.max(10, ...all.map((v) => v ?? 0));
    }, [disc]);
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(DISC_META).map(([k, m]) => (
                    <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                        <b className="text-slate-700">{k}</b> {m.label}
                    </span>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DiscBars title="Kekuatan (Strength)" data={disc.strength} max={max} />
                <DiscBars title="Area Pengembangan (Weakness)" data={disc.weakness} max={max} />
            </div>
        </div>
    );
}

function MbtiPanel({ mbti }) {
    return (
        <div>
            {mbti.type && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-2xl font-bold tracking-widest shadow-sm">
                        {mbti.type}
                    </div>
                    <span className="text-xs text-slate-400">Tipe kepribadian MBTI</span>
                </div>
            )}
            <div className="space-y-3">
                {mbti.dimensions.map((d, i) => {
                    const leftWins = d.lval >= d.rval;
                    return (
                        <div key={i}>
                            <div className="flex justify-between text-[11px] mb-1">
                                <span className={leftWins ? "font-semibold text-indigo-600" : "text-slate-400"}>
                                    {d.left} <b>{d.lval}%</b>
                                </span>
                                <span className={!leftWins ? "font-semibold text-indigo-600" : "text-slate-400"}>
                                    <b>{d.rval}%</b> {d.right}
                                </span>
                            </div>
                            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-[2px]">
                                <div className={`h-full ${leftWins ? "bg-indigo-500" : "bg-slate-300"}`} style={{ width: `${d.lval}%` }} />
                                <div className={`h-full ${!leftWins ? "bg-indigo-500" : "bg-slate-300"}`} style={{ width: `${d.rval}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Applications ─────────────────────────────────────────────────────────── */

function ApplicationCard({ app }) {
    return (
        <div className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug">{app.nm_job}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        {app.company && (
                            <span className="inline-flex items-center gap-1">
                                <Icon className="w-3.5 h-3.5" path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-4m-6 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
                                {app.company}
                            </span>
                        )}
                        {app.tipe && <span className="uppercase tracking-wide text-[10px] font-semibold text-slate-400">{app.tipe}</span>}
                        {app.applied_at && <span>Melamar {app.applied_at}</span>}
                    </div>
                </div>
            </div>

            {(app.ekspektasi_gaji != null || app.alasan_ditolak) && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                    {app.ekspektasi_gaji != null && (
                        <span className="text-slate-500">Ekspektasi gaji: <b className="text-slate-700">{formatIDR(app.ekspektasi_gaji)}</b></span>
                    )}
                    {app.alasan_ditolak && (
                        <span className="text-rose-600">Alasan ditolak: {app.alasan_ditolak}</span>
                    )}
                </div>
            )}

            {(app.file_interview || app.file_panel || app.file_psikogram) && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <FileLink label="Interview" value={app.file_interview} />
                    <FileLink label="Panel" value={app.file_panel} />
                    <FileLink label="Psikogram" value={app.file_psikogram} />
                </div>
            )}
        </div>
    );
}

function Applications({ applications }) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return applications;
        return applications.filter(
            (a) =>
                (a.nm_job || "").toLowerCase().includes(s) ||
                (a.company || "").toLowerCase().includes(s) ||
                (a.progress || "").toLowerCase().includes(s)
        );
    }, [q, applications]);

    return (
        <Card
            title="Riwayat Lamaran"
            tone="sky"
            count={applications.length}
            icon={<Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
            action={
                applications.length > 3 ? (
                    <div className="relative">
                        <Icon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" path="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari posisi..."
                            className="w-40 sm:w-52 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
                    </div>
                ) : null
            }
        >
            {applications.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-6">Belum ada riwayat lamaran.</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-6">Tidak ada lamaran yang cocok dengan pencarian.</p>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {filtered.map((a, i) => <ApplicationCard key={i} app={a} />)}
                </div>
            )}
        </Card>
    );
}

/* ── Bahasa ───────────────────────────────────────────────────────────────── */

// Tingkat kemampuan selalu tampil sebagai TEKS; warna hanya penegas, tidak pernah
// jadi satu-satunya pembeda (aman untuk pembaca buta warna).
const LEVEL_CLS = {
    aktif:    "bg-emerald-50 text-emerald-700",
    pasif:    "bg-amber-50 text-amber-700",
    terbatas: "bg-slate-100 text-slate-500",
};

function LevelCell({ value }) {
    if (!value) return <td className="py-1.5 text-center text-slate-300">—</td>;
    return (
        <td className="py-1.5 text-center">
            <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${LEVEL_CLS[value] || "bg-slate-100 text-slate-500"}`}>
                {value}
            </span>
        </td>
    );
}

function Languages({ languages }) {
    return (
        <Card title="Kemampuan Bahasa" tone="lime" count={languages.length || undefined}
            icon={<Icon path="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />}>
            {languages.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Belum ada data kemampuan bahasa.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                            <th className="text-left font-medium pb-1.5">Bahasa</th>
                            <th className="font-medium pb-1.5">Bicara</th>
                            <th className="font-medium pb-1.5">Baca</th>
                            <th className="font-medium pb-1.5">Tulis</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {languages.map((l, i) => (
                            <tr key={i}>
                                <td className="py-1.5 text-slate-700 font-medium">{l.nama}</td>
                                <LevelCell value={l.bicara} />
                                <LevelCell value={l.baca} />
                                <LevelCell value={l.tulis} />
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
}

/* ── Main tab ─────────────────────────────────────────────────────────────── */

export default function KandidatTab({ kandidat, nikKtp, kandidatError }) {
    // Belum ada NIK KTP → kader belum ditautkan ke data kandidat.
    if (!nikKtp) {
        return (
            <Card>
                <EmptyState
                    tone="amber"
                    title="NIK KTP belum diisi"
                    desc="Kader ini belum ditautkan ke data kandidat. Isi NIK KTP kader melalui menu Master › Kader (tambah/edit) atau import Excel, lalu data kandidat rekrutmen akan tampil di sini."
                />
            </Card>
        );
    }
    if (kandidatError) {
        return (
            <Card>
                <EmptyState tone="rose" title="Gagal memuat data kandidat" desc={kandidatError} />
            </Card>
        );
    }
    if (!kandidat) {
        return (
            <Card>
                <EmptyState
                    title="Data kandidat tidak ditemukan"
                    desc={`Tidak ada kandidat di Career MAI dengan NIK KTP ${nikKtp}. Pastikan NIK KTP kader sudah benar.`}
                />
            </Card>
        );
    }

    const p = kandidat.profile;
    const initials = (p.nama_lengkap || "?").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");

    // Pendidikan terakhir = entri pertama educations (sudah diurut tahun terbaru dulu
    // oleh backend). Kolom profil p.pendidikan hanya dipakai sebagai cadangan: di flow
    // MT kolom itu hampir selalu kosong, sedangkan riwayatnya ada di pendidikan_mt.
    const lastEdu = kandidat.educations?.[0] ?? null;
    const lastEducation = lastEdu?.jenjang || p.pendidikan || "—";
    const lastEducationFull = lastEdu
        ? [lastEdu.jenjang, lastEdu.jurusan, lastEdu.universitas, lastEdu.tahun].filter(Boolean).join(" · ")
        : (p.pendidikan || "—");

    return (
        <div className="space-y-5">
            {/* Hero identitas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                <div className="px-5 sm:px-6 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="-mt-12 shrink-0">
                            <Avatar src={p.foto} initials={initials} name={p.nama_lengkap} />
                        </div>
                        <div className="flex-1 min-w-0 sm:pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900">{p.nama_lengkap}</h2>
                                {jkLabel(p.jk) && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.jk === "P" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                                        {jkLabel(p.jk)}
                                    </span>
                                )}
                                {p.umur && <span className="text-xs text-slate-400">{p.umur} tahun</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                                {p.email && (
                                    <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 hover:text-blue-600 break-all">
                                        <Icon className="w-4 h-4 shrink-0" path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        {p.email}
                                    </a>
                                )}
                                {p.no_wa && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Icon className="w-4 h-4 shrink-0" path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        {p.no_wa}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KPI ringkas. Empat item: di mobile jatuh rata 2 kolom × 2 baris,
                        di layar lebar satu baris penuh.
                        Ekspektasi gaji sengaja TIDAK di sini: kolom profil kandidat.gaji
                        hampir selalu kosong di flow MT — nilainya per-lamaran dan sudah
                        tampil di tiap kartu Riwayat Lamaran. */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                        <Kpi label="Total Lamaran" value={kandidat.applications.length} />
                        <Kpi label="Pendidikan Terakhir" value={lastEducation} title={lastEducationFull} />
                        <Kpi label="Pengalaman Kerja" value={`${kandidat.experiences.length} posisi`} />
                        <Kpi label="Total Sertifikasi" value={kandidat.certifications.length} />
                    </div>
                </div>
            </div>

            {/* Grid utama */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Kolom kiri: data pribadi + dokumen + keluarga */}
                <div className="space-y-5 lg:col-span-1">
                    <Card title="Data Pribadi" tone="pink" icon={<Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                            <div className="col-span-2">
                                <InfoItem label="NIK KTP" value={kandidat.ktp} mono />
                            </div>
                            <InfoItem label="Tempat Lahir" value={p.tempat_lahir} />
                            <InfoItem label="Tanggal Lahir" value={p.tgl_lahir} />
                            <InfoItem label="Agama" value={p.agama} />
                            <InfoItem label="Status Kawin" value={p.status_kawin} />
                            <InfoItem label="Kewarganegaraan" value={p.kewarganegaraan} />
                            <InfoItem label="NPWP" value={p.npwp} mono />
                            <InfoItem label="Gol. Darah" value={p.goldar ? `${p.goldar}${p.resus && p.resus !== "" ? " " + p.resus : ""}` : null} />
                            <InfoItem label="Tinggi / Berat" value={p.tinggi || p.berat ? `${p.tinggi || "–"} cm / ${p.berat || "–"} kg` : null} />
                            <InfoItem label="SIM" value={p.sim} />
                            <InfoItem label="Status Rumah" value={p.rumah} />
                            <div className="col-span-2">
                                <InfoItem label="Kota / Provinsi" value={[p.kota, p.provinsi].filter(Boolean).join(", ") || null} />
                            </div>
                            <div className="col-span-2">
                                <InfoItem label="Alamat" value={p.alamat} />
                            </div>
                            {p.domisili && (
                                <div className="col-span-2">
                                    <InfoItem label="Domisili" value={p.domisili} />
                                </div>
                            )}
                            <InfoItem label="Lokasi Rekrutmen" value={p.lokasi_rekrutmen} />
                            <InfoItem label="Terdaftar" value={p.daftar_pada} />
                        </dl>
                    </Card>

                    {(p.cv || p.file_ijazah || p.file_transkrip) && (
                        <Card title="Dokumen" tone="indigo" icon={<Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />}>
                            <div className="flex flex-wrap gap-2">
                                <FileLink label="CV / Lamaran" value={p.cv} />
                                <FileLink label="Ijazah" value={p.file_ijazah} />
                                <FileLink label="Transkrip" value={p.file_transkrip} />
                            </div>
                            {!isUrl(p.cv) && (p.cv || p.file_ijazah || p.file_transkrip) && (
                                <p className="text-[11px] text-slate-400 mt-3">
                                    Berkas tersimpan di portal Career MAI. Setel <code className="text-slate-500">CAREER_MAI_ASSET_URL</code> agar dapat diunduh langsung.
                                </p>
                            )}
                        </Card>
                    )}

                    {(p.ayah || p.ibu || p.darurat_nama) && (
                        <Card title="Keluarga & Kontak Darurat" tone="rose" icon={<Icon path="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.83-4M7 12a3 3 0 10-2.83-4" />}>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                                <InfoItem label="Ayah" value={p.ayah} />
                                <InfoItem label="HP Ayah" value={p.hp_ayah} />
                                <InfoItem label="Ibu" value={p.ibu} />
                                <InfoItem label="HP Ibu" value={p.hp_ibu} />
                                {p.darurat_nama && (
                                    <>
                                        <InfoItem label="Kontak Darurat" value={p.darurat_nama} />
                                        <InfoItem label="Hubungan" value={p.darurat_hubungan} />
                                        <InfoItem label="HP Darurat" value={p.darurat_hp} />
                                    </>
                                )}
                            </dl>
                        </Card>
                    )}
                </div>

                {/* Kolom kanan: lamaran, pengalaman, pendidikan, sertifikasi, asesmen */}
                <div className="space-y-5 lg:col-span-2">
                    <Applications applications={kandidat.applications} />

                    <Card title="Pengalaman Kerja" tone="amber" count={kandidat.experiences.length}
                        icon={<Icon path="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}>
                        {kandidat.experiences.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">Belum ada data pengalaman kerja.</p>
                        ) : (
                            <ol className="relative border-l-2 border-slate-100 ml-1.5 space-y-5">
                                {kandidat.experiences.map((e, i) => (
                                    <li key={i} className="ml-5">
                                        <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                            <h4 className="text-sm font-semibold text-slate-800">{e.jabatan || "—"}</h4>
                                            <span className="text-xs text-slate-400">
                                                {[e.tgl_masuk, e.tgl_keluar].filter(Boolean).join(" – ") || ""}
                                            </span>
                                        </div>
                                        {e.nm_company && <p className="text-xs text-slate-500 mt-0.5">{e.nm_company}</p>}
                                        {e.deskripsi && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{e.deskripsi}</p>}
                                        {(e.gaji != null || e.alasan) && (
                                            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-[11px]">
                                                {e.gaji != null && (
                                                    <span className="text-slate-500">Gaji: <b className="text-slate-700">{formatIDR(e.gaji)}</b></span>
                                                )}
                                                {e.alasan && <span className="text-slate-500">Alasan keluar: {e.alasan}</span>}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card title="Pendidikan" tone="cyan" count={kandidat.educations.length || undefined}
                            icon={<Icon path="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />}>
                            {kandidat.educations.length === 0 ? (
                                <div className="text-sm text-slate-500">
                                    <p className="font-medium text-slate-700">{p.pendidikan || "—"}</p>
                                    {p.universitas && <p className="text-xs text-slate-500 mt-0.5">{p.universitas}</p>}
                                    {p.jurusan && <p className="text-xs text-slate-400 mt-0.5">{p.jurusan}</p>}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {kandidat.educations.map((e, i) => (
                                        <li key={i} className="text-sm">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <p className="font-medium text-slate-700">{e.jenjang || "—"}{e.jurusan ? ` · ${e.jurusan}` : ""}</p>
                                                {e.tahun && <span className="text-xs text-slate-400 shrink-0">{e.tahun}</span>}
                                            </div>
                                            {e.universitas && <p className="text-xs text-slate-500 mt-0.5">{e.universitas}</p>}
                                            {e.ipk && <p className="text-xs text-slate-400 mt-0.5">IPK/Nilai: {e.ipk}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <Card title="Sertifikasi" tone="violet" count={kandidat.certifications.length || undefined}
                            icon={<Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}>
                            {kandidat.certifications.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Belum ada sertifikasi.</p>
                            ) : (
                                <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                    {kandidat.certifications.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-700 leading-snug">{c.nama}</p>
                                                <p className="text-xs text-slate-400">
                                                    {[c.lembaga, c.tahun].filter(Boolean).join(" · ")}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    {(kandidat.languages?.length > 0) && <Languages languages={kandidat.languages} />}

                    {(kandidat.disc || kandidat.mbti) && (
                        <Card title="Hasil Asesmen" tone="orange" icon={<Icon path="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {kandidat.disc && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">DISC</h4>
                                        <DiscPanel disc={kandidat.disc} />
                                    </div>
                                )}
                                {kandidat.mbti && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">MBTI</h4>
                                        <MbtiPanel mbti={kandidat.mbti} />
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function Kpi({ label, value, title }) {
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={title || String(value)}>{value}</div>
        </div>
    );
}
