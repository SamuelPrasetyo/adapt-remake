import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import DataTable from "@/Components/DataTable";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const toRoman = (n) => {
    const num = parseInt(n, 10);
    return Number.isFinite(num) && ROMAN[num] ? ROMAN[num] : n;
};

// Dropdown pilih batch dengan search + badge jumlah kader per batch.
function BatchSelect({ batches, value, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const selected = batches.find((b) => b.key === value);
    const filtered = batches.filter((b) => b.label.toLowerCase().includes(search.toLowerCase()));

    const Badge = ({ count, active }) => (
        <span
            className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold shrink-0 ${
                active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
            }`}
        >
            {count}
        </span>
    );

    return (
        <div ref={wrapRef} className="relative max-w-sm">
            <button
                type="button"
                onClick={() => {
                    setOpen((v) => !v);
                    setSearch("");
                }}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            >
                {selected ? (
                    <span className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-800 truncate">{selected.label}</span>
                        <Badge count={selected.count} active />
                    </span>
                ) : (
                    <span className="text-slate-400">Pilih batch...</span>
                )}
                <svg
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-20 mt-1.5 w-full min-w-[16rem] bg-white border border-slate-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari batch..."
                                className="w-full pl-8 pr-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2.5 text-sm text-slate-400 italic">Batch tidak ditemukan</li>
                        ) : (
                            filtered.map((b) => {
                                const active = b.key === value;
                                return (
                                    <li
                                        key={b.key}
                                        onMouseDown={() => {
                                            onChange(b.key);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition ${
                                            active ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span className="truncate">{b.label}</span>
                                        <Badge count={b.count} active={active} />
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

const ARSIP_PLACEHOLDER = "ARSIP (Batch 1-2)";
const cellOrDash = (v) => (v && v !== ARSIP_PLACEHOLDER ? v : "—");

const COLS = [
    { key: "_no", label: "No", width: "52px", render: (_, __, i) => i + 1 },
    { key: "nik", label: "NIK", sortable: true },
    { key: "nama", label: "Nama", sortable: true },
    { key: "bu", label: "Business Unit", sortable: true, render: cellOrDash },
    { key: "divisi_name", label: "Divisi", sortable: true, render: cellOrDash },
    { key: "dept_name", label: "Departemen", sortable: true, render: cellOrDash },
];

// Baca state awal dari query string (?group=&batch=) agar refresh halaman tetap
// menampilkan kelompok/batch yang sama, bukan kembali ke default.
function readInitialParams() {
    const params = new URLSearchParams(window.location.search);
    return { group: params.get("group") || "", batchKey: params.get("batch") || "" };
}

export default function DevelopmentIndex({ kaders = [] }) {
    // Kelompok batch: 'system' = Batch 3+, 'arsip' = Batch 1-2. Default ke kelompok
    // yang datanya ada (utamakan sistem bila ada, jika tidak ke arsip), kecuali
    // sudah ada pilihan tersimpan di URL dari kunjungan/refresh sebelumnya.
    const hasSystem = kaders.some((k) => k.group === "system");
    const hasArsip = kaders.some((k) => k.group === "arsip");
    const initial = useMemo(readInitialParams, []);
    const validInitialGroup = ["system", "arsip"].includes(initial.group)
        && (initial.group === "system" ? hasSystem : hasArsip);
    const [group, setGroup] = useState(validInitialGroup ? initial.group : (hasSystem ? "system" : "arsip"));

    const byGroup = useMemo(() => kaders.filter((k) => k.group === group), [kaders, group]);

    // Daftar batch unik dalam kelompok terpilih, terurut dari batch terbaru.
    const batches = useMemo(() => {
        const map = new Map();
        for (const k of byGroup) {
            const key = `${k.nama_batch ?? "-"}|${k.tahun_batch ?? ""}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    nama_batch: k.nama_batch,
                    tahun_batch: k.tahun_batch,
                    label: `Batch ${toRoman(k.nama_batch)}${k.tahun_batch ? ` · ${k.tahun_batch}` : ""}`,
                    count: 0,
                });
            }
            map.get(key).count += 1;
        }
        return [...map.values()];
    }, [byGroup]);

    const [batchKey, setBatchKey] = useState(validInitialGroup ? initial.batchKey : "");
    const activeBatchKey = batches.some((b) => b.key === batchKey) ? batchKey : batches[0]?.key ?? "";

    // Simpan pilihan kelompok/batch ke URL supaya bertahan saat halaman di-refresh.
    const syncUrl = (nextGroup, nextBatchKey) => {
        const params = new URLSearchParams();
        params.set("group", nextGroup);
        if (nextBatchKey) params.set("batch", nextBatchKey);
        router.replace(`/report-new?${params.toString()}`, { preserveScroll: true, preserveState: true });
    };

    const rows = useMemo(
        () => byGroup.filter((k) => `${k.nama_batch ?? "-"}|${k.tahun_batch ?? ""}` === activeBatchKey),
        [byGroup, activeBatchKey]
    );

    const goToReport = (k) => {
        const base = group === "arsip" ? "/report-arsip/" : "/report-new/";
        router.visit(base + k.id);
    };

    const TabBtn = ({ value, label, sub }) => {
        const active = group === value;
        return (
            <button
                type="button"
                onClick={() => {
                    setGroup(value);
                    setBatchKey("");
                    syncUrl(value, "");
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-left transition ${
                    active
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                }`}
            >
                <div className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-700"}`}>{label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
            </button>
        );
    };

    const actions = (row) => (
        <button
            type="button"
            onClick={() => goToReport(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Lihat Report
        </button>
    );

    return (
        <AppLayout title="REPORT" breadcrumb="Report">
            <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">
                        Management Trainee Development Report
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Pilih kelompok batch, lalu pilih batch untuk melihat daftar kadernya.
                    </p>

                    {/* Filter kelompok batch */}
                    <div className="flex gap-3 mb-5">
                        <TabBtn value="system" label="Batch 3+" sub="Report sistem lengkap" />
                        <TabBtn value="arsip" label="Batch 1 & 2" sub="Arsip skor (historis)" />
                    </div>

                    {batches.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            {group === "arsip"
                                ? "Belum ada data arsip Batch 1 & 2. Impor dulu via menu “Import Arsip B1–2”."
                                : "Belum ada kader Batch 3 ke atas."}
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Batch</label>
                            <BatchSelect
                                batches={batches}
                                value={activeBatchKey}
                                onChange={(key) => {
                                    setBatchKey(key);
                                    syncUrl(group, key);
                                }}
                            />
                        </div>
                    )}
                </div>

                {batches.length > 0 && (
                    <DataTable
                        columns={COLS}
                        data={rows}
                        actions={actions}
                        perPage={10}
                        emptyMessage="Tidak ada kader pada batch ini."
                    />
                )}
            </div>
        </AppLayout>
    );
}
