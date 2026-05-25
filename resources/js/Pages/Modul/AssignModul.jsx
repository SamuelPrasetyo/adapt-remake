import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const MAX_CHIPS = 3;

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
        </div>
    );
}

function ModulChips({ moduls, onShowAll }) {
    if (!moduls || moduls.length === 0) {
        return <span className="text-slate-400 text-xs">—</span>;
    }
    const shown = moduls.slice(0, MAX_CHIPS);
    const rest  = moduls.length - MAX_CHIPS;
    return (
        <div className="flex flex-wrap items-center gap-1">
            {shown.map((m) => (
                <span
                    key={m.id}
                    className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
                >
                    {m.kode_modul}
                </span>
            ))}
            {rest > 0 && (
                <button
                    type="button"
                    onClick={onShowAll}
                    className="text-[11px] text-slate-500 hover:text-blue-600 hover:underline"
                >
                    +{rest} lagi
                </button>
            )}
        </div>
    );
}

const KADER_COLS = [
    { key: '_no',        label: 'No',         width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nik',        label: 'NIK',        sortable: true },
    { key: 'nama',       label: 'Nama',       sortable: true },
    { key: 'bu',         label: 'BU',         sortable: true },
    { key: 'divisi_name', label: 'Divisi',    sortable: true },
    { key: 'dept_name',  label: 'Departemen', sortable: true },
    {
        key: 'total_modul',
        label: 'Total',
        sortable: true,
        width: '64px',
        render: (v) => (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {v ?? 0}
            </span>
        ),
    },
    { key: 'moduls', label: 'Modul Assigned' },
];

const MENTOR_COLS = [
    { key: '_no',     label: 'No',          width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nama',    label: 'Nama',        sortable: true },
    { key: 'nik',     label: 'NIK',         sortable: true, render: (v) => v ?? '—' },
    { key: 'bu',      label: 'BU',          sortable: true },
    { key: '_source', label: 'Source',      render: (v) => (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${v === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            {v === 'user' ? 'User' : 'Master'}
        </span>
    )},
    {
        key: 'total_modul',
        label: 'Total',
        sortable: true,
        width: '64px',
        render: (v) => (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                {v ?? 0}
            </span>
        ),
    },
    { key: 'moduls', label: 'Modul Assigned' },
];

export default function AssignModul({
    kaders       = [],
    mentors_data = [],
    moduls       = [],
    companies    = [],
    users        = [],
    mentors      = [],
}) {
    const [activeTab, setActiveTab] = useState('kader');
    const [buFilter,  setBuFilter]  = useState('');
    const [detailRow, setDetailRow] = useState(null);

    // Assign modal state
    const [assignOpen,           setAssignOpen]           = useState(false);
    const [assignType,           setAssignType]           = useState('');
    const [assignUserIds,        setAssignUserIds]        = useState([]);
    const [assignCompanyIds,     setAssignCompanyIds]     = useState([]);
    const [assignMentorSelected, setAssignMentorSelected] = useState([]);
    const [assignModulIds,       setAssignModulIds]       = useState([]);
    const [assignSearch,         setAssignSearch]         = useState('');
    const [assignTargetSearch,   setAssignTargetSearch]   = useState('');
    const [assignProcessing,     setAssignProcessing]     = useState(false);

    // Edit assign state
    const [editOpen,        setEditOpen]        = useState(false);
    const [editRow,         setEditRow]         = useState(null);
    const [editType,        setEditType]        = useState('');
    const [editTargetId,    setEditTargetId]    = useState(null);
    const [editModulIds,    setEditModulIds]    = useState([]);
    const [editBuModulIds,  setEditBuModulIds]  = useState([]); // kader: modul via company
    const [editSearch,      setEditSearch]      = useState('');
    const [editProcessing,  setEditProcessing]  = useState(false);
    const [editError,       setEditError]       = useState('');

    // BU options derived from both kaders and mentors_data
    const buOptions = useMemo(() => {
        const all = [...kaders, ...mentors_data];
        return [...new Set(all.map((r) => r.bu).filter(Boolean))].sort();
    }, [kaders, mentors_data]);

    const displayed = useMemo(() => {
        const base = activeTab === 'kader' ? kaders : mentors_data;
        if (!buFilter) return base;
        return base.filter((r) => r.bu === buFilter);
    }, [activeTab, kaders, mentors_data, buFilter]);

    // Assign modal helpers
    const filteredModuls = useMemo(() => {
        let list = moduls;
        if (assignType === 'mentor') list = list.filter((m) => (m.tipe ?? 'KADER') === 'MENTOR');
        else if (assignType) list = list.filter((m) => (m.tipe ?? 'KADER') === 'KADER');
        if (!assignSearch.trim()) return list;
        const q = assignSearch.toLowerCase();
        return list.filter(
            (m) => m.kode_modul?.toLowerCase().includes(q) || m.nama_modul?.toLowerCase().includes(q)
        );
    }, [moduls, assignSearch, assignType]);

    const filteredUsers = useMemo(() => {
        if (!assignTargetSearch.trim()) return users;
        const q = assignTargetSearch.toLowerCase();
        return users.filter((u) => u.nama?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }, [users, assignTargetSearch]);

    const filteredCompanies = useMemo(() => {
        if (!assignTargetSearch.trim()) return companies;
        const q = assignTargetSearch.toLowerCase();
        return companies.filter((c) => c.company_name?.toLowerCase().includes(q));
    }, [companies, assignTargetSearch]);

    const filteredMentors = useMemo(() => {
        if (!assignTargetSearch.trim()) return mentors;
        const q = assignTargetSearch.toLowerCase();
        return mentors.filter(
            (m) =>
                m.nama?.toLowerCase().includes(q) ||
                m.nik?.toLowerCase().includes(q) ||
                m.bu?.toLowerCase().includes(q)
        );
    }, [mentors, assignTargetSearch]);

    const toggleModul   = (id) => setAssignModulIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const toggleUser    = (id) => setAssignUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const toggleCompany = (id) => setAssignCompanyIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const toggleMentor  = (m) => {
        setAssignMentorSelected((prev) => {
            const exists = prev.find((x) => x.id === m.id && x._source === m._source);
            return exists
                ? prev.filter((x) => !(x.id === m.id && x._source === m._source))
                : [...prev, { id: m.id, _source: m._source }];
        });
    };
    const isMentorChecked = (m) => assignMentorSelected.some((x) => x.id === m.id && x._source === m._source);

    const openAssign = () => {
        setAssignType('');
        setAssignUserIds([]);
        setAssignCompanyIds([]);
        setAssignMentorSelected([]);
        setAssignModulIds([]);
        setAssignSearch('');
        setAssignTargetSearch('');
        setAssignOpen(true);
    };

    const submitAssign = (e) => {
        e.preventDefault();
        if (!assignType) return;

        if (assignType === 'mentor') {
            if (assignMentorSelected.length === 0) { alert('Pilih minimal satu mentor.'); return; }
            if (assignModulIds.length === 0)        { alert('Pilih minimal satu modul.'); return; }
            const mentorUserIds   = assignMentorSelected.filter((x) => x._source === 'user').map((x) => x.id);
            const mentorMasterIds = assignMentorSelected.filter((x) => x._source === 'master').map((x) => x.id);
            setAssignProcessing(true);
            router.post('/modul/assign', {
                type: 'mentor',
                modul_id: assignModulIds,
                mentor_user_ids:   mentorUserIds,
                mentor_master_ids: mentorMasterIds,
            }, { onFinish: () => setAssignProcessing(false), onSuccess: () => setAssignOpen(false) });
            return;
        }

        const targetIds = assignType === 'user' ? assignUserIds : assignCompanyIds;
        if (targetIds.length === 0) { alert(`Pilih minimal satu ${assignType === 'user' ? 'user' : 'Business Unit'}.`); return; }
        if (assignModulIds.length === 0) { alert('Pilih minimal satu modul.'); return; }

        const body = {
            type:     assignType,
            modul_id: assignModulIds,
            ...(assignType === 'user'    ? { user_id:    assignUserIds }       : {}),
            ...(assignType === 'company' ? { company_id: assignCompanyIds }    : {}),
        };
        setAssignProcessing(true);
        router.post('/modul/assign', body, {
            onFinish: () => setAssignProcessing(false),
            onSuccess: () => setAssignOpen(false),
        });
    };

    // Edit assign helpers
    const openEdit = (row, tab) => {
        setEditError('');
        setEditRow(row);
        setEditSearch('');

        let type, targetId, currentModulIds, buModulIds;

        if (tab === 'kader') {
            type            = 'user';
            targetId        = row.id;
            currentModulIds = (row.user_modul_ids ?? []).map(Number);
            const allModulIds = (row.moduls ?? []).map((m) => Number(m.id));
            buModulIds      = allModulIds.filter((id) => !currentModulIds.includes(id));
        } else {
            type            = row._source === 'user' ? 'mentor' : 'mentor_master';
            targetId        = row.id;
            currentModulIds = (row.moduls ?? []).map((m) => Number(m.id));
            buModulIds      = [];
        }

        setEditType(type);
        setEditTargetId(targetId);
        setEditModulIds(currentModulIds);
        setEditBuModulIds(buModulIds);
        setEditOpen(true);
    };

    const toggleEditModul = (id) => {
        const rowLockedIds = (editRow?.locked_modul_ids ?? []).map(Number);
        if (rowLockedIds.includes(id) || editBuModulIds.includes(id)) return;
        setEditModulIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        setEditError('');
        setEditProcessing(true);
        router.post('/modul/assign/update', {
            type:      editType,
            id:        editTargetId,
            modul_ids: editModulIds,
        }, {
            onFinish: () => setEditProcessing(false),
            onSuccess: () => setEditOpen(false),
            onError: (errs) => setEditError(errs.locked ?? 'Terjadi kesalahan.'),
        });
    };

    const editModulsFiltered = useMemo(() => {
        let list = moduls;
        if (editType === 'mentor' || editType === 'mentor_master') {
            list = list.filter((m) => (m.tipe ?? 'KADER') === 'MENTOR');
        } else {
            list = list.filter((m) => (m.tipe ?? 'KADER') === 'KADER');
        }
        if (!editSearch.trim()) return list;
        const q = editSearch.toLowerCase();
        return list.filter(
            (m) => m.kode_modul?.toLowerCase().includes(q) || m.nama_modul?.toLowerCase().includes(q)
        );
    }, [moduls, editType, editSearch]);

    // Column renderers
    const renderModulCell = (moduls, row) => (
        <ModulChips moduls={moduls} onShowAll={() => setDetailRow(row)} />
    );

    const renderEditBtn = (row) => (
        <button
            type="button"
            onClick={() => openEdit(row, activeTab)}
            title="Edit assignment modul"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </button>
    );

    const kaderCols = [
        ...KADER_COLS.map((c) => c.key === 'moduls' ? { ...c, render: (v, row) => renderModulCell(v, row) } : c),
        { key: '_edit', label: '', width: '48px', render: (_, row) => renderEditBtn(row) },
    ];
    const mentorCols = [
        ...MENTOR_COLS.map((c) => c.key === 'moduls' ? { ...c, render: (v, row) => renderModulCell(v, row) } : c),
        { key: '_edit', label: '', width: '48px', render: (_, row) => renderEditBtn(row) },
    ];

    const activeCols = activeTab === 'kader' ? kaderCols : mentorCols;

    return (
        <AppLayout title="ASSIGN MODUL" breadcrumb="Modul / Assign Modul">
            {/* Tab + Filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-medium">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('kader'); setBuFilter(''); }}
                        className={`px-4 py-1.5 transition ${activeTab === 'kader' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        Kader
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('mentor'); setBuFilter(''); }}
                        className={`px-4 py-1.5 transition ${activeTab === 'mentor' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        Mentor
                    </button>
                </div>

                <select
                    value={buFilter}
                    onChange={(e) => setBuFilter(e.target.value)}
                    className="px-3 py-1.5 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white min-w-[120px]"
                >
                    <option value="">Semua BU</option>
                    {buOptions.map((bu) => (
                        <option key={bu} value={bu}>{bu}</option>
                    ))}
                </select>

                <div className="ml-auto">
                    <button
                        type="button"
                        onClick={openAssign}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Assign Modul
                    </button>
                </div>
            </div>

            <DataTable key={activeTab} columns={activeCols} data={displayed} />

            {/* ===== DETAIL MODAL ===== */}
            <Modal
                open={!!detailRow}
                onClose={() => setDetailRow(null)}
                title={`Modul Assigned — ${detailRow?.nama ?? ''}`}
                size="xl"
                footer={
                    <button
                        type="button"
                        onClick={() => setDetailRow(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Tutup
                    </button>
                }
            >
                {detailRow && (
                    <div>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {detailRow.nik && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    NIK: {detailRow.nik}
                                </span>
                            )}
                            {detailRow.bu && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                    {detailRow.bu}
                                </span>
                            )}
                            {detailRow.divisi_name && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {detailRow.divisi_name}
                                </span>
                            )}
                            {detailRow.dept_name && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {detailRow.dept_name}
                                </span>
                            )}
                            {detailRow._source && (
                                <span className={`text-xs px-2.5 py-1 rounded-full ${detailRow._source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {detailRow._source === 'user' ? 'Mentor User' : 'Mentor Master'}
                                </span>
                            )}
                        </div>

                        {(!detailRow.moduls || detailRow.moduls.length === 0) ? (
                            <p className="text-sm text-slate-500 py-8 text-center">
                                Belum ada modul yang di-assign.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                                            <th className="pb-2 pr-3 font-medium">No</th>
                                            <th className="pb-2 pr-3 font-medium">Kode</th>
                                            <th className="pb-2 pr-3 font-medium">Nama Modul</th>
                                            <th className="pb-2 font-medium">Fase</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {detailRow.moduls.map((m, i) => (
                                            <tr key={m.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 pr-3 text-slate-400 text-xs">{i + 1}</td>
                                                <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">{m.kode_modul}</td>
                                                <td className="py-2.5 pr-3 font-medium text-slate-800">{m.nama_modul}</td>
                                                <td className="py-2.5">
                                                    {m.fase ? (
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                            Fase {m.fase}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ===== EDIT ASSIGN MODAL ===== */}
            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title={`Edit Modul — ${editRow?.nama ?? ''}`}
                size="2xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setEditOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="edit-assign-form"
                            disabled={editProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {editProcessing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="edit-assign-form" onSubmit={submitEdit}>
                    {/* Info row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {editRow?.nik && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                NIK: {editRow.nik}
                            </span>
                        )}
                        {editRow?.bu && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                {editRow.bu}
                            </span>
                        )}
                        {editRow?.divisi_name && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                {editRow.divisi_name}
                            </span>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
                            Ter-assign
                        </span>
                        {editBuModulIds.length > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
                                Via BU (tidak bisa diubah di sini)
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            Ada progress (tidak bisa dihapus)
                        </span>
                    </div>

                    {editError && (
                        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                            {editError}
                        </div>
                    )}

                    <input
                        type="text"
                        value={editSearch}
                        onChange={(e) => setEditSearch(e.target.value)}
                        placeholder="Cari modul..."
                        className={`${inputCls} mb-3`}
                    />

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {editModulsFiltered.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-6">Tidak ada modul ditemukan.</p>
                        )}
                        {editModulsFiltered.map((m) => {
                            const mid        = Number(m.id);
                            const rowLockedIds = (editRow?.locked_modul_ids ?? []).map(Number);
                            const isLocked   = rowLockedIds.includes(mid);
                            const isViBU     = editBuModulIds.includes(mid);
                            const isDisabled = isLocked || isViBU;
                            const isChecked  = editModulIds.includes(mid) || isViBU;

                            let rowCls = 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50';
                            if (isViBU)         rowCls = 'border-amber-200 bg-amber-50 opacity-75';
                            else if (isLocked)  rowCls = 'border-amber-300 bg-amber-50/60';
                            else if (isChecked) rowCls = 'border-emerald-400 bg-emerald-50';

                            return (
                                <label
                                    key={m.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition ${rowCls} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleEditModul(mid)}
                                            disabled={isDisabled}
                                            className="w-4 h-4 accent-emerald-600"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {m.kode_modul} - {m.nama_modul}
                                            </p>
                                            {m.fase && (
                                                <p className="text-xs text-slate-400">Fase {m.fase}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {isViBU && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">via BU</span>
                                        )}
                                        {isLocked && (
                                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </form>
            </Modal>

            {/* ===== ASSIGN MODAL ===== */}
            <Modal
                open={assignOpen}
                onClose={() => setAssignOpen(false)}
                title="Assign Modul"
                size="3xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setAssignOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="assign-form"
                            disabled={assignProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                            {assignProcessing ? 'Menyimpan...' : 'Assign Modul'}
                        </button>
                    </>
                }
            >
                <form id="assign-form" onSubmit={submitAssign}>
                    <div className="flex gap-6">
                        {/* Kiri: Konfigurasi */}
                        <div className="w-72 shrink-0 border-r border-slate-200 pr-6 flex flex-col">
                            <p className="text-sm font-semibold text-slate-700 mb-3">Konfigurasi Assign</p>

                            <Field label="Assign Ke">
                                <select
                                    value={assignType}
                                    required
                                    onChange={(e) => {
                                        setAssignType(e.target.value);
                                        setAssignUserIds([]);
                                        setAssignCompanyIds([]);
                                        setAssignMentorSelected([]);
                                        setAssignTargetSearch('');
                                    }}
                                    className={inputCls}
                                >
                                    <option value="">-- Pilih --</option>
                                    <option value="user">Individual (Kader)</option>
                                    <option value="company">Business Unit</option>
                                    <option value="mentor">Mentor</option>
                                </select>
                            </Field>

                            {assignType === 'user' && (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Pilih Kader
                                        {assignUserIds.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">{assignUserIds.length} dipilih</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={assignTargetSearch}
                                        onChange={(e) => setAssignTargetSearch(e.target.value)}
                                        placeholder="Cari kader..."
                                        className={`${inputCls} mb-2`}
                                    />
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                        {filteredUsers.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center py-4">Tidak ada kader ditemukan.</p>
                                        )}
                                        {filteredUsers.map((u) => {
                                            const checked = assignUserIds.includes(u.id);
                                            return (
                                                <label
                                                    key={u.id}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleUser(u.id)}
                                                        className="w-4 h-4 accent-emerald-600 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-slate-800 truncate">{u.nama}</p>
                                                        {u.nik && <p className="text-xs text-slate-400">{u.nik}</p>}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {assignType === 'company' && (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Pilih Business Unit
                                        {assignCompanyIds.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">{assignCompanyIds.length} dipilih</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={assignTargetSearch}
                                        onChange={(e) => setAssignTargetSearch(e.target.value)}
                                        placeholder="Cari business unit..."
                                        className={`${inputCls} mb-2`}
                                    />
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                        {filteredCompanies.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center py-4">Tidak ada business unit ditemukan.</p>
                                        )}
                                        {filteredCompanies.map((c) => {
                                            const checked = assignCompanyIds.includes(c.company_id);
                                            return (
                                                <label
                                                    key={c.company_id}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleCompany(c.company_id)}
                                                        className="w-4 h-4 accent-emerald-600 shrink-0"
                                                    />
                                                    <span className="text-sm text-slate-800 truncate">{c.company_name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {assignType === 'mentor' && (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Pilih Mentor
                                        {assignMentorSelected.length > 0 && (
                                            <span className="ml-2 text-xs font-normal text-emerald-600">{assignMentorSelected.length} dipilih</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={assignTargetSearch}
                                        onChange={(e) => setAssignTargetSearch(e.target.value)}
                                        placeholder="Cari mentor..."
                                        className={`${inputCls} mb-2`}
                                    />
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                        {filteredMentors.length === 0 && (
                                            <p className="text-xs text-slate-400 text-center py-4">Tidak ada mentor ditemukan.</p>
                                        )}
                                        {filteredMentors.map((m, idx) => {
                                            const checked = isMentorChecked(m);
                                            const isUser  = m._source === 'user';
                                            return (
                                                <label
                                                    key={`${m._source}-${m.id}-${idx}`}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleMentor(m)}
                                                        className="w-4 h-4 accent-emerald-600 shrink-0"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-slate-800 truncate">{m.nama}</p>
                                                        <p className="text-xs text-slate-400 truncate">
                                                            {m.nik ?? '—'}{m.bu ? ` · ${m.bu}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${isUser ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {isUser ? 'User' : 'Master'}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Kanan: Daftar Modul */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 mb-3">
                                Pilih Modul
                                {assignModulIds.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-emerald-600">
                                        {assignModulIds.length} dipilih
                                    </span>
                                )}
                            </p>
                            <input
                                type="text"
                                value={assignSearch}
                                onChange={(e) => setAssignSearch(e.target.value)}
                                placeholder="Cari modul..."
                                className={`${inputCls} mb-3`}
                            />
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {filteredModuls.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-6">Tidak ada modul ditemukan.</p>
                                )}
                                {filteredModuls.map((m) => {
                                    const checked = assignModulIds.includes(m.id);
                                    return (
                                        <label
                                            key={m.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleModul(m.id)}
                                                    className="w-4 h-4 accent-emerald-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {m.kode_modul} - {m.nama_modul}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {m.file_materi
                                                            ? (m.file_materi.split('_').slice(1).join('_') || m.file_materi.split('/').pop())
                                                            : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            {(m.tipe ?? 'KADER') === 'MENTOR'
                                                ? <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Mentor</span>
                                                : <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Fase {m.fase}</span>
                                            }
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
