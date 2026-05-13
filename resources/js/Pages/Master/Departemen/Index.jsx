import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const COLS = [
    { key: '_no', label: 'No', width: '60px', render: (_, __, i) => i + 1 },
    { key: 'nama', label: 'Nama Departemen', sortable: true },
    { key: 'nama_divisi', label: 'Divisi', sortable: true },
];

function SelectField({ label, value, onChange, options, error, placeholder = 'Pilih...' }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <select
                value={value}
                onChange={onChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

function TextField({ label, value, onChange, error }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input type="text" value={value} onChange={onChange} required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

function ActionBtn({ onClick, color, title, children }) {
    const colors = { blue: 'text-blue-600 hover:bg-blue-50', red: 'text-red-600 hover:bg-red-50' };
    return (
        <button type="button" onClick={onClick} title={title}
            className={`p-1.5 rounded-lg transition ${colors[color]}`}>{children}</button>
    );
}

export default function DepartemenIndex({ departemens, divisis }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);

    const divisiOptions = divisis.map((d) => ({ value: d.id, label: d.nama }));

    const addForm  = useForm({ nama: '', id_divisi: '' });
    const editForm = useForm({ nama: '', id_divisi: '' });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/departemen/store', {
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({ nama: row.nama, id_divisi: row.id_divisi });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/departemen/update/${editRow.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Hapus departemen "${row.nama}"?`)) return;
        router.delete(`/departemen/delete/${row.id}`);
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!importFile) return;
        const fd = new FormData();
        fd.append('file', importFile);
        fd.append('_token', document.querySelector('meta[name="csrf-token"]').content);
        router.post('/departemen/import', fd, {
            forceFormData: true,
            onSuccess: () => { setImportOpen(false); setImportFile(null); },
        });
    };

    return (
        <AppLayout title="MASTER DEPARTEMEN" breadcrumb="Master / Departemen">
            <DataTable
                columns={COLS}
                data={departemens}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
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
                    <div className="flex gap-2">
                        <button onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button>
                        <button onClick={() => setTambahOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah
                        </button>
                    </div>
                }
            />

            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Tambah Departemen"
                footer={
                    <>
                        <button type="button" onClick={() => { setTambahOpen(false); addForm.reset(); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" form="add-form" disabled={addForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
                    </>
                }
            >
                <form id="add-form" onSubmit={submitAdd}>
                    <TextField label="Nama Departemen" value={addForm.data.nama}
                        onChange={(e) => addForm.setData('nama', e.target.value)} error={addForm.errors.nama} />
                    <SelectField label="Divisi" value={addForm.data.id_divisi}
                        onChange={(e) => addForm.setData('id_divisi', e.target.value)}
                        options={divisiOptions} error={addForm.errors.id_divisi} />
                </form>
            </Modal>

            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Departemen"
                footer={
                    <>
                        <button type="button" onClick={() => setEditOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" form="edit-form" disabled={editForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
                    </>
                }
            >
                <form id="edit-form" onSubmit={submitEdit}>
                    <TextField label="Nama Departemen" value={editForm.data.nama}
                        onChange={(e) => editForm.setData('nama', e.target.value)} error={editForm.errors.nama} />
                    <SelectField label="Divisi" value={editForm.data.id_divisi}
                        onChange={(e) => editForm.setData('id_divisi', e.target.value)}
                        options={divisiOptions} error={editForm.errors.id_divisi} />
                </form>
            </Modal>

            <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); }}
                title="Import Departemen" size="sm"
                footer={
                    <>
                        <button type="button" onClick={() => { setImportOpen(false); setImportFile(null); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" form="import-form"
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition">Upload</button>
                    </>
                }
            >
                <form id="import-form" onSubmit={submitImport}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">File Excel (.xlsx)</label>
                    <input type="file" accept=".xlsx,.csv"
                        onChange={(e) => setImportFile(e.target.files[0])} required
                        className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                </form>
            </Modal>
        </AppLayout>
    );
}
