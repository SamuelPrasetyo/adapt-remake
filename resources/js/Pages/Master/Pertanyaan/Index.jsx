import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';
import { renderStatusBadge } from '@/Components/DataTable';

const TYPE_OPTIONS = [
    { value: 'Kader',  label: 'Kader' },
    { value: 'Mentor', label: 'Mentor' },
];
const STATUS_OPTIONS = [
    { value: 'Aktif',      label: 'Aktif' },
    { value: 'Tidak Aktif',label: 'Tidak Aktif' },
];

const COLS = [
    { key: '_no',             label: 'No',         width: '60px', render: (_, __, i) => i + 1 },
    { key: 'nama_pertanyaan', label: 'Pertanyaan',  sortable: true },
    { key: 'type',            label: 'Type',        sortable: true },
    { key: 'status',          label: 'Status',      render: (v) => renderStatusBadge(v) },
];

function Field({ label, children }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
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

export default function PertanyaanIndex({ pertanyaans }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);

    const addForm  = useForm({ nama_pertanyaan: '', type: '' });
    const editForm = useForm({ nama_pertanyaan: '', type: '', status: '' });

    const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/pertanyaan/store', {
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({ nama_pertanyaan: row.nama_pertanyaan, type: row.type, status: row.status });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/pertanyaan/update/${editRow.id_pertanyaan}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm('Hapus pertanyaan ini?')) return;
        router.delete(`/pertanyaan/delete/${row.id_pertanyaan}`);
    };

    const BtnRow = ({ onCancel, formId, processing }) => (
        <>
            <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
            <button type="submit" form={formId} disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
        </>
    );

    return (
        <AppLayout title="MASTER PERTANYAAN" breadcrumb="Master / Pertanyaan">
            <DataTable
                columns={COLS}
                data={pertanyaans}
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
                    <button onClick={() => setTambahOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah
                    </button>
                }
            />

            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Tambah Pertanyaan"
                footer={<BtnRow onCancel={() => { setTambahOpen(false); addForm.reset(); }} formId="add-form" processing={addForm.processing} />}>
                <form id="add-form" onSubmit={submitAdd}>
                    <Field label="Pertanyaan">
                        <textarea rows="3" value={addForm.data.nama_pertanyaan} required
                            onChange={(e) => addForm.setData('nama_pertanyaan', e.target.value)}
                            className={inputCls} />
                        {addForm.errors.nama_pertanyaan && <p className="text-xs text-red-600 mt-1">{addForm.errors.nama_pertanyaan}</p>}
                    </Field>
                    <Field label="Type">
                        <select value={addForm.data.type} required
                            onChange={(e) => addForm.setData('type', e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Type...</option>
                            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {addForm.errors.type && <p className="text-xs text-red-600 mt-1">{addForm.errors.type}</p>}
                    </Field>
                </form>
            </Modal>

            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Pertanyaan"
                footer={<BtnRow onCancel={() => setEditOpen(false)} formId="edit-form" processing={editForm.processing} />}>
                <form id="edit-form" onSubmit={submitEdit}>
                    <Field label="Pertanyaan">
                        <textarea rows="3" value={editForm.data.nama_pertanyaan} required
                            onChange={(e) => editForm.setData('nama_pertanyaan', e.target.value)}
                            className={inputCls} />
                    </Field>
                    <Field label="Type">
                        <select value={editForm.data.type} required
                            onChange={(e) => editForm.setData('type', e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Type...</option>
                            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Status">
                        <select value={editForm.data.status} required
                            onChange={(e) => editForm.setData('status', e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Status...</option>
                            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                </form>
            </Modal>
        </AppLayout>
    );
}
