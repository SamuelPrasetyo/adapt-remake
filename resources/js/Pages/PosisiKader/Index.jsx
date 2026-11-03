import { useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import DataTable from "@/Components/DataTable";
import FilterPanel from "@/Components/FilterPanel";

const STATUS_OPTIONS = [
    { value: "lengkap", label: "Lengkap" },
    { value: "belum",   label: "Belum Lengkap" },
];

function batchLabel(b) {
    return `Batch ${b.nama_batch}${b.tahun_batch ? ` (${b.tahun_batch})` : ""}`;
}

function fmtDate(s) {
    if (!s) return null;
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

// Bandingkan seperti server (PosisiKaderController::clean): spasi dirapikan, kosong = null.
const norm = (v) => {
    const s = (v ?? "").replace(/\s+/g, " ").trim();
    return s === "" ? null : s;
};

function StatCard({ label, value, tone }) {
    const tones = {
        slate:   "text-slate-800",
        emerald: "text-emerald-600",
        amber:   "text-amber-600",
    };
    return (
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] px-4 py-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className={`text-xl font-semibold ${tones[tone]}`}>{value}</div>
        </div>
    );
}

function PosisiInput({ value, original, maxLength, placeholder, onChange }) {
    const dirty = norm(value) !== norm(original);
    return (
        <input
            type="text"
            value={value ?? ""}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full min-w-[180px] px-2.5 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition ${
                dirty ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"
            }`}
        />
    );
}

export default function PosisiKaderIndex({ kaders = [], batches = [], batchFilter = "all", maxLength = 150 }) {
    const [statusFilter, setStatusFilter] = useState("");
    // Perubahan yang belum disimpan: { [kader_id]: { posisi_awal, posisi_graduate } }.
    const [edits, setEdits]     = useState({});
    const [saving, setSaving]   = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError]     = useState(null);
    const fileRef = useRef(null);

    const valueOf = (r, field) => (edits[r.id] && field in edits[r.id] ? edits[r.id][field] : r[field]);

    const setField = (r, field, value) =>
        setEdits((e) => ({ ...e, [r.id]: { ...e[r.id], [field]: value } }));

    // Baris yang nilainya benar-benar beda dari data tersimpan.
    const dirtyRows = useMemo(
        () =>
            kaders.filter(
                (r) =>
                    edits[r.id] &&
                    (norm(valueOf(r, "posisi_awal")) !== norm(r.posisi_awal) ||
                        norm(valueOf(r, "posisi_graduate")) !== norm(r.posisi_graduate)),
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kaders, edits],
    );
    const hasDirty = dirtyRows.length > 0;

    const total         = kaders.length;
    const awalTerisi    = kaders.filter((k) => k.posisi_awal).length;
    const graduateTerisi = kaders.filter((k) => k.posisi_graduate).length;

    const data = useMemo(() => {
        const lengkap = (k) => k.posisi_awal && k.posisi_graduate;
        if (statusFilter === "lengkap") return kaders.filter(lengkap);
        if (statusFilter === "belum") return kaders.filter((k) => !lengkap(k));
        return kaders;
    }, [kaders, statusFilter]);

    const confirmDiscard = () =>
        !hasDirty || window.confirm(`Ada ${dirtyRows.length} perubahan yang belum disimpan. Buang perubahan?`);

    const filters = [
        {
            key: "batch",
            label: "Batch",
            searchable: true,
            options: batches.map((b) => ({ value: String(b.id_batch), label: batchLabel(b) })),
        },
        { key: "status", label: "Status Posisi", options: STATUS_OPTIONS },
    ];
    const filterValues = {
        batch:  batchFilter === "all" ? "" : batchFilter,
        status: statusFilter,
    };

    const visitBatch = (value) => {
        if (!confirmDiscard()) return;
        setEdits({});
        router.get(
            "/posisi-kader",
            { batch_id: value === "" ? "all" : value },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleFilterChange = (key, value) => {
        if (key === "batch") visitBatch(value);
        else setStatusFilter(value);
    };

    const handleFilterReset = () => {
        setStatusFilter("");
        if (batchFilter !== "all") visitBatch("");
    };

    const save = () => {
        const rows = dirtyRows.map((r) => ({
            id: r.id,
            posisi_awal: norm(valueOf(r, "posisi_awal")),
            posisi_graduate: norm(valueOf(r, "posisi_graduate")),
        }));
        router.post("/posisi-kader/bulk", { rows }, {
            preserveScroll: true,
            preserveState: true,
            onStart: () => { setSaving(true); setError(null); },
            onSuccess: () => setEdits({}),
            onError: (errs) => setError(Object.values(errs)[0] ?? "Gagal menyimpan. Coba lagi."),
            onFinish: () => setSaving(false),
        });
    };

    const templateUrl = `/posisi-kader/template?batch_id=${encodeURIComponent(batchFilter)}`;

    const pickImport = () => {
        if (!confirmDiscard()) return;
        fileRef.current.value = "";
        fileRef.current.click();
    };

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        router.post("/posisi-kader/import", { file }, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onStart: () => { setImporting(true); setError(null); },
            onSuccess: () => setEdits({}),
            onError: (errs) => setError(errs.file ?? "Import gagal. Coba lagi."),
            onFinish: () => setImporting(false),
        });
    };

    const columns = [
        { key: "_no", label: "No", width: "52px", render: (_, __, i) => i + 1 },
        {
            key: "nama",
            label: "Kader",
            sortable: true,
            render: (v, r) => (
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{v}</span>
                        {r.is_nonaktif && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                                Non Aktif
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-500">{r.nik}</div>
                </div>
            ),
        },
        { key: "bu", label: "BU", sortable: true, render: (v) => v ?? "—" },
        { key: "dept_name", label: "Departemen", sortable: true, render: (v) => v ?? "—" },
        { key: "divisi_name", label: "Divisi", sortable: true, render: (v) => v ?? "—" },
        {
            key: "posisi_awal",
            label: "Posisi Awal",
            sortable: true,
            render: (_, r) => (
                <PosisiInput
                    value={valueOf(r, "posisi_awal")}
                    original={r.posisi_awal}
                    maxLength={maxLength}
                    placeholder="Isi posisi awal"
                    onChange={(v) => setField(r, "posisi_awal", v)}
                />
            ),
        },
        {
            key: "posisi_graduate",
            label: "Posisi After Graduate",
            sortable: true,
            render: (_, r) => (
                <div>
                    <PosisiInput
                        value={valueOf(r, "posisi_graduate")}
                        original={r.posisi_graduate}
                        maxLength={maxLength}
                        placeholder="Isi posisi setelah graduate"
                        onChange={(v) => setField(r, "posisi_graduate", v)}
                    />
                    {r.posisi_updated_at && (
                        <div className="text-[11px] text-slate-400 mt-1">
                            Diubah {fmtDate(r.posisi_updated_at)}
                            {r.posisi_updated_by ? ` · ${r.posisi_updated_by}` : ""}
                        </div>
                    )}
                </div>
            ),
        },
    ];

    const busy = saving || importing;

    return (
        <AppLayout title="POSISI KADER" breadcrumb="Overview / Posisi Kader">
            <div className="space-y-4 pb-20">
                <div>
                    <h2 className="text-base font-semibold text-slate-800">Posisi Kader</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Isi posisi awal dan posisi setelah graduation program MT langsung di tabel, atau
                        unduh template (sudah berisi daftar kader batch terpilih), isi kolom posisi, lalu import.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total Kader" value={total} tone="slate" />
                    <StatCard label="Posisi Awal Terisi" value={`${awalTerisi} / ${total}`} tone="emerald" />
                    <StatCard label="Posisi After Graduate Terisi" value={`${graduateTerisi} / ${total}`} tone="amber" />
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={data}
                    perPage={15}
                    emptyMessage="Tidak ada kader ditemukan."
                    headerActions={
                        <div className="flex items-center gap-2">
                            <FilterPanel
                                filters={filters}
                                values={filterValues}
                                onChange={handleFilterChange}
                                onReset={handleFilterReset}
                            />
                            <a
                                href={templateUrl}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Template
                            </a>
                            <button
                                type="button"
                                onClick={pickImport}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v12" />
                                </svg>
                                {importing ? "Mengimport..." : "Import"}
                            </button>
                        </div>
                    }
                />

                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />

                {hasDirty && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl bg-slate-900 text-white shadow-lg px-4 py-2.5">
                        <span className="text-sm">
                            <b>{dirtyRows.length}</b> kader diubah, belum disimpan
                        </span>
                        <button
                            type="button"
                            onClick={() => setEdits({})}
                            disabled={busy}
                            className="px-3 py-1.5 text-sm rounded-lg text-slate-200 hover:bg-white/10 disabled:opacity-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={busy}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition"
                        >
                            {saving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
