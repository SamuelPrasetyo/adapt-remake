import { useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import FilterableTable from "@/Components/FilterableTable";

const JENIS_LABEL = {
    OJT_REPORT:                "OJT Report",
    POST_ACTIVITY:             "Post Activity",
    FORM_IDP:                  "Form IDP",
    PERJANJIAN_KERJA:          "Perjanjian Kerja",
    REFLEKSI:                  "Refleksi",
    WEEKLY_FEEDBACK:           "Weekly Feedback",
    TEMPLATE_IDP:              "Template IDP",
    TEMPLATE_PERJANJIAN_KERJA: "Template Perjanjian Kerja",
    TEMPLATE_WEEKLY_FEEDBACK:  "Template Weekly Feedback",
};

const DOCUMENT_TABS = [
    { id: "OJT_REPORT",       label: "OJT Report" },
    { id: "POST_ACTIVITY",    label: "Post Activity" },
    { id: "FORM_IDP",         label: "Form IDP" },
    { id: "PERJANJIAN_KERJA", label: "Perjanjian Kerja" },
    { id: "REFLEKSI",         label: "Refleksi" },
    { id: "WEEKLY_FEEDBACK",  label: "Weekly Feedback" },
    { id: "template",         label: "Template" },
];

const TEMPLATE_JENIS = [
    "TEMPLATE_IDP",
    "TEMPLATE_PERJANJIAN_KERJA",
    "TEMPLATE_WEEKLY_FEEDBACK",
];

const VALID_TAB_IDS = DOCUMENT_TABS.map((t) => t.id);

const STATUS_LABEL = {
    pending:          "Menunggu",
    mentor_approved:  "Disetujui Mentor",
    approved:         "Disetujui",
    rejected:         "Ditolak",
};

const STATUS_COLOR = {
    pending:         "bg-amber-100 text-amber-700",
    mentor_approved: "bg-blue-100 text-blue-700",
    approved:        "bg-emerald-100 text-emerald-700",
    rejected:        "bg-red-100 text-red-700",
};

const TIPE_LABEL = { kader: "Kader", mentor: "Mentor", admin: "Admin" };

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLOR[status] ?? "bg-slate-100 text-slate-600"}`}>
            {STATUS_LABEL[status] ?? status ?? "—"}
        </span>
    );
}

function FileLink({ nama_file, path_file }) {
    if (!path_file)
        return <span className="text-slate-400 text-xs">{nama_file ?? "—"}</span>;
    return (
        <a
            href={`/${path_file}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline text-xs break-all"
        >
            {nama_file ?? "Unduh"}
        </a>
    );
}

function fmtDate(s) {
    if (!s) return "—";
    return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function ArsipDokumenIndex({ dokumens = [], batches = [] }) {
    const [tab, setTab] = useState(() => {
        const hash = window.location.hash.replace("#", "");
        if (VALID_TAB_IDS.includes(hash)) return hash;
        const saved = typeof window !== "undefined" ? window.localStorage.getItem("arsipTab") : null;
        return VALID_TAB_IDS.includes(saved) ? saved : "OJT_REPORT";
    });

    useEffect(() => {
        window.location.hash = tab;
        window.localStorage.setItem("arsipTab", tab);
    }, [tab]);

    // ── Filter definitions ────────────────────────────────────────────────
    const batchFilter = {
        key: "nama_batch",
        label: "Batch",
        allLabel: "Semua Batch",
        searchable: true,
        options: batches.map((b) => ({ value: b.nama_batch, label: b.nama_batch })),
    };

    const statusFilter = {
        key: "status",
        label: "Status",
        allLabel: "Semua Status",
        options: [
            { value: "pending",         label: "Menunggu" },
            { value: "mentor_approved", label: "Disetujui Mentor" },
            { value: "approved",        label: "Disetujui" },
            { value: "rejected",        label: "Ditolak" },
        ],
    };

    const uploaderFilter = {
        key: "tipe",
        label: "Uploader",
        allLabel: "Semua",
        options: [
            { value: "kader",  label: "Kader" },
            { value: "mentor", label: "Mentor" },
            { value: "admin",  label: "Admin" },
        ],
    };

    const templateJenisFilter = {
        key: "jenis",
        label: "Jenis Template",
        allLabel: "Semua Template",
        options: [
            { value: "TEMPLATE_IDP",                label: "Template IDP" },
            { value: "TEMPLATE_PERJANJIAN_KERJA",   label: "Template Perjanjian Kerja" },
            { value: "TEMPLATE_WEEKLY_FEEDBACK",    label: "Template Weekly Feedback" },
        ],
    };

    // ── Column definitions ────────────────────────────────────────────────
    const colKader = {
        key: "kader_nama",
        label: "Nama",
        sortable: true,
        render: (v, r) => (
            <div className="min-w-0">
                <div className="font-medium text-slate-800 text-sm truncate">{v ?? "—"}</div>
                {r.kader_bu && <div className="text-xs text-slate-500">{r.kader_bu}</div>}
            </div>
        ),
    };

    const colBU    = { key: "kader_bu",    label: "BU",    sortable: true, render: (v) => v ?? "—" };
    const colBatch = { key: "nama_batch",  label: "Batch", sortable: true, render: (v) => v ?? "—" };

    const colFile = {
        key: "nama_file",
        label: "File",
        render: (v, r) => <FileLink nama_file={v} path_file={r.path_file} />,
    };

    const colStatus = {
        key: "status",
        label: "Status",
        render: (v) => <StatusBadge status={v} />,
    };

    const colTipe = {
        key: "tipe",
        label: "Uploader",
        render: (v) => <span className="capitalize text-xs">{TIPE_LABEL[v] ?? v ?? "—"}</span>,
    };

    const colUpload = {
        key: "created_at",
        label: "Diupload",
        sortable: true,
        render: (v) => <span className="text-xs whitespace-nowrap">{fmtDate(v)}</span>,
    };

    const colApproved = {
        key: "approved_at",
        label: "Tgl Disetujui",
        sortable: true,
        render: (v) => <span className="text-xs whitespace-nowrap">{fmtDate(v)}</span>,
    };

    const colRejection = {
        key: "rejection_reason",
        label: "Alasan Tolak",
        render: (v) => v
            ? <span className="text-xs text-red-600 italic">{v}</span>
            : <span className="text-slate-300 text-xs">—</span>,
    };

    // ── Tab data & column/filter config ─────────────────────────────────
    const byJenis = (jenis) =>
        Array.isArray(jenis)
            ? dokumens.filter((d) => jenis.includes(d.jenis))
            : dokumens.filter((d) => d.jenis === jenis);

    const TAB_CONFIG = {
        OJT_REPORT: {
            columns: [colKader, colBatch, colFile, colStatus, colApproved, colRejection],
            filters: [batchFilter, statusFilter],
        },
        POST_ACTIVITY: {
            columns: [colKader, colBatch, colFile, colTipe, colStatus, colUpload, colApproved],
            filters: [batchFilter, statusFilter, uploaderFilter],
        },
        FORM_IDP: {
            columns: [colKader, colBatch, colFile, colStatus, colUpload, colApproved],
            filters: [batchFilter, statusFilter],
        },
        PERJANJIAN_KERJA: {
            columns: [colKader, colBatch, colFile, colStatus, colUpload, colApproved],
            filters: [batchFilter, statusFilter],
        },
        REFLEKSI: {
            columns: [colKader, colBatch, colFile, colStatus, colUpload, colApproved],
            filters: [batchFilter, statusFilter],
        },
        WEEKLY_FEEDBACK: {
            columns: [colKader, colBatch, colFile, colStatus, colUpload, colApproved, colRejection],
            filters: [batchFilter, statusFilter],
        },
        template: {
            columns: [
                {
                    key: "jenis",
                    label: "Jenis",
                    sortable: true,
                    render: (v) => (
                        <span className="text-xs font-medium text-slate-700">
                            {JENIS_LABEL[v] ?? v ?? "—"}
                        </span>
                    ),
                },
                colBatch,
                colFile,
                colStatus,
                colUpload,
            ],
            filters: [templateJenisFilter, batchFilter, statusFilter],
        },
    };

    const currentTab   = tab;
    const data         = currentTab === "template" ? byJenis(TEMPLATE_JENIS) : byJenis(currentTab);
    const config       = TAB_CONFIG[currentTab] ?? TAB_CONFIG.OJT_REPORT;
    const tabInfo      = DOCUMENT_TABS.find((t) => t.id === currentTab);

    // ── Counts per tab ────────────────────────────────────────────────────
    const countOf = (id) =>
        id === "template"
            ? byJenis(TEMPLATE_JENIS).length
            : byJenis(id).length;

    return (
        <AppLayout title="ARSIP DOKUMEN" breadcrumb="Arsip Dokumen">
            <div className="space-y-4">
                {/* Header summary */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">Arsip Dokumen</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Seluruh dokumen yang telah diupload — tersedia sebagai arsip untuk keperluan laporan.
                        </p>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto whitespace-nowrap">
                        Total: <span className="font-semibold text-slate-700">{dokumens.length}</span> dokumen
                    </div>
                </div>

                {/* Tabs — scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {DOCUMENT_TABS.map((t) => {
                        const count   = countOf(t.id);
                        const active  = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
                                    active
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                {t.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    active ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <FilterableTable
                    key={currentTab}
                    columns={config.columns}
                    data={data}
                    filters={config.filters}
                    perPage={15}
                    emptyMessage={`Tidak ada dokumen ${tabInfo?.label ?? ""} ditemukan.`}
                />
            </div>
        </AppLayout>
    );
}
