import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
const fmtDate  = (v) => { const d = dateOnly(v); return d ? d.split('-').reverse().join('/') : '-'; };
const isActive = (row) => {
    const today = new Date().toISOString().slice(0, 10);
    const m = dateOnly(row.tanggal_mulai);
    const s = dateOnly(row.tanggal_selesai);
    return !!m && !!s && m <= today && today <= s;
};

const COLS = [
    { key: '_no',        label: 'No',         width: '60px', render: (_, __, i) => i + 1 },
    { key: 'nama_batch', label: 'Nama Batch',  sortable: true },
    { key: 'tahun_batch',label: 'Tahun Batch', sortable: true },
    { key: 'tanggal_mulai',   label: 'Mulai',   render: (v) => fmtDate(v) },
    { key: 'tanggal_selesai', label: 'Selesai', render: (v) => fmtDate(v) },
    { key: '_status', label: 'Status', render: (_, row) => (
        isActive(row)
            ? <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Aktif</span>
            : <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">Nonaktif</span>
    ) },
];

function TextField({ label, value, onChange, error, type = 'text', required = true }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input type={type} value={value} onChange={onChange} required={required}
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

export default function BatchIndex({ batchs }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);

    const addForm  = useForm({ nama_batch: '', tahun_batch: '', tanggal_mulai: '', tanggal_selesai: '' });
    const editForm = useForm({ nama_batch: '', tahun_batch: '', tanggal_mulai: '', tanggal_selesai: '' });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/batch/store', {
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({
            nama_batch: row.nama_batch,
            tahun_batch: row.tahun_batch,
            tanggal_mulai: dateOnly(row.tanggal_mulai),
            tanggal_selesai: dateOnly(row.tanggal_selesai),
        });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/batch/update/${editRow.id_batch}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Hapus batch "${row.nama_batch}"?`)) return;
        router.delete(`/batch/delete/${row.id_batch}`);
    };

    return (
        <AppLayout title="MASTER BATCH" breadcrumb="Master / Batch">
            <DataTable
                columns={COLS}
                data={batchs}
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
                title="Tambah Batch" size="sm"
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
                    <TextField label="Nama Batch" value={addForm.data.nama_batch}
                        onChange={(e) => addForm.setData('nama_batch', e.target.value)} error={addForm.errors.nama_batch} />
                    <TextField label="Tahun Batch" type="number" value={addForm.data.tahun_batch}
                        onChange={(e) => addForm.setData('tahun_batch', e.target.value)} error={addForm.errors.tahun_batch} />
                    <TextField label="Tanggal Mulai" type="date" required={false} value={addForm.data.tanggal_mulai}
                        onChange={(e) => addForm.setData('tanggal_mulai', e.target.value)} error={addForm.errors.tanggal_mulai} />
                    <TextField label="Tanggal Selesai" type="date" required={false} value={addForm.data.tanggal_selesai}
                        onChange={(e) => addForm.setData('tanggal_selesai', e.target.value)} error={addForm.errors.tanggal_selesai} />
                </form>
            </Modal>

            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Batch" size="sm"
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
                    <TextField label="Nama Batch" value={editForm.data.nama_batch}
                        onChange={(e) => editForm.setData('nama_batch', e.target.value)} error={editForm.errors.nama_batch} />
                    <TextField label="Tahun Batch" type="number" value={editForm.data.tahun_batch}
                        onChange={(e) => editForm.setData('tahun_batch', e.target.value)} error={editForm.errors.tahun_batch} />
                    <TextField label="Tanggal Mulai" type="date" required={false} value={editForm.data.tanggal_mulai}
                        onChange={(e) => editForm.setData('tanggal_mulai', e.target.value)} error={editForm.errors.tanggal_mulai} />
                    <TextField label="Tanggal Selesai" type="date" required={false} value={editForm.data.tanggal_selesai}
                        onChange={(e) => editForm.setData('tanggal_selesai', e.target.value)} error={editForm.errors.tanggal_selesai} />
                </form>
            </Modal>
        </AppLayout>
    );
}
