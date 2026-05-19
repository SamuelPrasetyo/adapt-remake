import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

const COLS = [
    { key: '_no',     label: 'No',      width: '60px', render: (_, __, i) => i + 1 },
    { key: 'nama',    label: 'Nama',    sortable: true },
    { key: 'jabatan', label: 'Jabatan', sortable: true },
    {
        key: 'bu', label: 'Company', sortable: true,
        render: (v, row) => (
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-200">
                {v || row.company_code}
            </span>
        ),
    },
];

function FormField({ label, error, children }) {
    return (
        <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        </div>
    );
}

function ActionBtn({ onClick, color, title, children }) {
    const colors = {
        blue:    'text-blue-600 hover:bg-blue-50',
        red:     'text-red-600 hover:bg-red-50',
        emerald: 'text-emerald-600 hover:bg-emerald-50',
    };
    return (
        <button type="button" onClick={onClick} title={title}
            className={`p-1.5 rounded-lg transition ${colors[color] || colors.blue}`}>
            {children}
        </button>
    );
}

export default function MentorIndex({ mentors, companys, kaders = [], assignments = [] }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignMentor, setAssignMentor] = useState(null);
    const [assignSearch, setAssignSearch] = useState('');
    const [assignKaderIds, setAssignKaderIds] = useState([]);
    const [assignProcessing, setAssignProcessing] = useState(false);

    const addForm  = useForm({ nama: '', jabatan: '', company_code: '' });
    const editForm = useForm({ nama: '', jabatan: '', company_code: '' });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/mentor/store', {
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({
            nama:         row.nama         ?? '',
            jabatan:      row.jabatan      ?? '',
            company_code: row.company_code ?? '',
        });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/mentor/update/${editRow.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Hapus mentor "${row.nama}"?`)) return;
        router.delete(`/mentor/delete/${row.id}`);
    };

    const openAssign = (mentor) => {
        setAssignMentor(mentor);
        const alreadyAssigned = assignments
            .filter((a) => a.mentor_id === mentor.id)
            .map((a) => a.kader_id);
        setAssignKaderIds(alreadyAssigned);
        setAssignSearch('');
        setAssignOpen(true);
    };

    const filteredKaders = useMemo(() => {
        let list = kaders;
        if (assignMentor?.company_code) {
            list = list.filter((k) => k.company_code === assignMentor.company_code);
        }
        if (!assignSearch.trim()) return list;
        const q = assignSearch.toLowerCase();
        return list.filter(
            (k) =>
                k.nama?.toLowerCase().includes(q) ||
                k.nik?.toLowerCase().includes(q) ||
                k.bu?.toLowerCase().includes(q)
        );
    }, [kaders, assignSearch, assignMentor]);

    const toggleKader = (id) => {
        setAssignKaderIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const submitAssign = (e) => {
        e.preventDefault();
        if (assignKaderIds.length === 0) {
            alert('Pilih minimal satu kader.');
            return;
        }
        setAssignProcessing(true);
        router.post('/mentor/assign-kader', {
            mentor_id: assignMentor.id,
            kader_ids: assignKaderIds,
        }, {
            onFinish: () => setAssignProcessing(false),
            onSuccess: () => setAssignOpen(false),
        });
    };

    return (
        <AppLayout title="MASTER MENTOR" breadcrumb="Master / Mentor">
            <DataTable
                columns={COLS}
                data={mentors}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionBtn onClick={() => openAssign(row)} color="emerald" title="Assign Kader">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </ActionBtn>
                        <ActionBtn onClick={() => openEdit(row)} color="blue" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </ActionBtn>
                        <ActionBtn onClick={() => handleDelete(row)} color="red" title="Hapus">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </ActionBtn>
                    </div>
                )}
                headerActions={
                    <button
                        onClick={() => setTambahOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Mentor
                    </button>
                }
            />

            {/* Tambah Modal */}
            <Modal
                open={tambahOpen}
                onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Tambah Mentor"
                size="sm"
                footer={
                    <>
                        <button type="button" onClick={() => { setTambahOpen(false); addForm.reset(); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" form="mentor-add-form" disabled={addForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                            {addForm.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="mentor-add-form" onSubmit={submitAdd}>
                    <FormField label="Nama" error={addForm.errors.nama}>
                        <input type="text" required value={addForm.data.nama}
                            onChange={(e) => addForm.setData('nama', e.target.value)} className={inputCls} />
                    </FormField>
                    <FormField label="Jabatan" error={addForm.errors.jabatan}>
                        <input type="text" required value={addForm.data.jabatan}
                            onChange={(e) => addForm.setData('jabatan', e.target.value)} className={inputCls} />
                    </FormField>
                    <FormField label="Company (BU)" error={addForm.errors.company_code}>
                        <select required value={addForm.data.company_code}
                            onChange={(e) => addForm.setData('company_code', e.target.value)} className={inputCls}>
                            <option value="">Pilih Company...</option>
                            {companys.map((c) => (
                                <option key={c.company_code} value={c.company_code}>
                                    {c.company_name} ({c.company_shortname})
                                </option>
                            ))}
                        </select>
                    </FormField>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Mentor"
                size="sm"
                footer={
                    <>
                        <button type="button" onClick={() => setEditOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" form="mentor-edit-form" disabled={editForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                            {editForm.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="mentor-edit-form" onSubmit={submitEdit}>
                    <FormField label="Nama" error={editForm.errors.nama}>
                        <input type="text" required value={editForm.data.nama}
                            onChange={(e) => editForm.setData('nama', e.target.value)} className={inputCls} />
                    </FormField>
                    <FormField label="Jabatan" error={editForm.errors.jabatan}>
                        <input type="text" required value={editForm.data.jabatan}
                            onChange={(e) => editForm.setData('jabatan', e.target.value)} className={inputCls} />
                    </FormField>
                    <FormField label="Company (BU)" error={editForm.errors.company_code}>
                        <select required value={editForm.data.company_code}
                            onChange={(e) => editForm.setData('company_code', e.target.value)} className={inputCls}>
                            <option value="">Pilih Company...</option>
                            {companys.map((c) => (
                                <option key={c.company_code} value={c.company_code}>
                                    {c.company_name} ({c.company_shortname})
                                </option>
                            ))}
                        </select>
                    </FormField>
                </form>
            </Modal>

            {/* Assign Kader Modal */}
            <Modal
                open={assignOpen}
                onClose={() => setAssignOpen(false)}
                title={assignMentor ? `Assign Kader ke ${assignMentor.nama}` : 'Assign Kader'}
                size="lg"
                footer={
                    <>
                        <button type="button" onClick={() => setAssignOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" form="mentor-assign-form" disabled={assignProcessing}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                            {assignProcessing ? 'Memproses...' : `Assign ${assignKaderIds.length} Kader`}
                        </button>
                    </>
                }
            >
                <form id="mentor-assign-form" onSubmit={submitAssign}>
                    <div className="mb-3">
                        <input type="text" placeholder="Cari kader (Nama / NIK)"
                            value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)}
                            className={inputCls} />
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                        {filteredKaders.length} kader · {assignKaderIds.length} dipilih
                    </div>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2">
                        {filteredKaders.length === 0 ? (
                            <div className="text-center py-8 text-sm text-slate-400">
                                Tidak ada kader yang cocok.
                            </div>
                        ) : filteredKaders.map((k) => {
                            const checked = assignKaderIds.includes(k.id);
                            return (
                                <label key={k.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition ${
                                        checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                                    }`}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleKader(k.id)}
                                        className="w-4 h-4 accent-emerald-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{k.nama}</div>
                                        <div className="text-xs text-slate-500 truncate">
                                            {k.nik} · {k.bu || k.company_code} {k.divisi_name ? `· ${k.divisi_name}` : ''}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
