import { useState, useMemo, useRef } from 'react';
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
    {
        key: 'user_id', label: 'User Account',
        render: (v) => v
            ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />Terhubung</span>
            : <span className="text-xs text-slate-400">—</span>,
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

export default function MentorIndex({ mentors, companys, kaders = [], assignments = [], mentorUsers = [] }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignMentor, setAssignMentor] = useState(null);
    const [assignSearch, setAssignSearch] = useState('');
    const [assignKaderIds, setAssignKaderIds] = useState([]);
    const [assignProcessing, setAssignProcessing] = useState(false);

    const [addPhotoPreview, setAddPhotoPreview]   = useState(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const addFileRef  = useRef(null);
    const editFileRef = useRef(null);

    const addForm  = useForm({ nama: '', jabatan: '', company_code: '', user_id: '', foto: null });
    const editForm = useForm({ _method: 'PUT', nama: '', jabatan: '', company_code: '', user_id: '', foto: null });

    const closeTambah = () => {
        setTambahOpen(false);
        addForm.reset();
        setAddPhotoPreview(null);
        if (addFileRef.current) addFileRef.current.value = '';
    };

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/mentor/store', {
            forceFormData: true,
            onSuccess: () => closeTambah(),
        });
    };

    const closeEdit = () => {
        setEditOpen(false);
        setEditPhotoPreview(null);
        if (editFileRef.current) editFileRef.current.value = '';
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({
            _method:      'PUT',
            nama:         row.nama         ?? '',
            jabatan:      row.jabatan      ?? '',
            company_code: row.company_code ?? '',
            user_id:      row.user_id      ?? '',
            foto:         null,
        });
        setEditPhotoPreview(row.foto ? `/storage/${row.foto}` : null);
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.post(`/mentor/update/${editRow.id}`, {
            forceFormData: true,
            onSuccess: () => closeEdit(),
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
                onClose={closeTambah}
                title="Tambah Mentor"
                size="sm"
                footer={
                    <>
                        <button type="button" onClick={closeTambah}
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
                    <FormField label="Foto Mentor (Opsional)" error={addForm.errors.foto}>
                        <div
                            className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 transition cursor-pointer"
                            onClick={() => addFileRef.current?.click()}
                        >
                            {addPhotoPreview ? (
                                <img src={addPhotoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover shadow" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs text-slate-500">{addPhotoPreview ? 'Klik untuk ganti foto' : 'Klik untuk pilih foto'}</span>
                            <span className="text-xs text-slate-400">JPG, PNG, JPEG · Maks. 2MB</span>
                        </div>
                        <input
                            ref={addFileRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                addForm.setData('foto', file);
                                setAddPhotoPreview(URL.createObjectURL(file));
                            }}
                        />
                    </FormField>
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
                            onChange={(e) => { addForm.setData('company_code', e.target.value); addForm.setData('user_id', ''); }} className={inputCls}>
                            <option value="">Pilih Company...</option>
                            {companys.map((c) => (
                                <option key={c.company_code} value={c.company_code}>
                                    {c.company_name} ({c.company_shortname})
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="User Account (Login)" error={addForm.errors.user_id}>
                        <select value={addForm.data.user_id}
                            onChange={(e) => addForm.setData('user_id', e.target.value)} className={inputCls}>
                            <option value="">— Tidak dihubungkan —</option>
                            {mentorUsers.filter(u => !addForm.data.company_code || u.company_code === addForm.data.company_code).map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.nik})</option>
                            ))}
                        </select>
                    </FormField>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                open={editOpen}
                onClose={closeEdit}
                title="Edit Mentor"
                size="sm"
                footer={
                    <>
                        <button type="button" onClick={closeEdit}
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
                    <FormField label="Foto Mentor (Opsional)" error={editForm.errors.foto}>
                        <div
                            className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 transition cursor-pointer"
                            onClick={() => editFileRef.current?.click()}
                        >
                            {editPhotoPreview ? (
                                <img src={editPhotoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover shadow" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            )}
                            <span className="text-xs text-slate-500">{editPhotoPreview ? 'Klik untuk ganti foto' : 'Klik untuk pilih foto'}</span>
                            <span className="text-xs text-slate-400">JPG, PNG, JPEG · Maks. 2MB</span>
                        </div>
                        <input
                            ref={editFileRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                editForm.setData('foto', file);
                                setEditPhotoPreview(URL.createObjectURL(file));
                            }}
                        />
                    </FormField>
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
                            onChange={(e) => { editForm.setData('company_code', e.target.value); editForm.setData('user_id', ''); }} className={inputCls}>
                            <option value="">Pilih Company...</option>
                            {companys.map((c) => (
                                <option key={c.company_code} value={c.company_code}>
                                    {c.company_name} ({c.company_shortname})
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="User Account (Login)" error={editForm.errors.user_id}>
                        <select value={editForm.data.user_id}
                            onChange={(e) => editForm.setData('user_id', e.target.value)} className={inputCls}>
                            <option value="">— Tidak dihubungkan —</option>
                            {mentorUsers.filter(u => !editForm.data.company_code || u.company_code === editForm.data.company_code).map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.nik})</option>
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
