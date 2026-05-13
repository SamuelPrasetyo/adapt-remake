import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const FASE_OPTIONS = ['1', '2', '3', '4'].map((v) => ({ value: v, label: `Fase ${v}` }));

const COLS = [
    { key: '_no',        label: 'No',   width: '52px', render: (_, __, i) => i + 1 },
    { key: 'kode_modul', label: 'Kode', sortable: true },
    { key: 'nama_modul', label: 'Nama Modul', sortable: true },
    { key: 'fase',       label: 'Fase', sortable: true },
    { key: 'tag_kompetensi', label: 'Tag Kompetensi' },
    {
        key: 'file_materi', label: 'File',
        render: (v) => v ? (
            <a href={`/${v}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                Unduh
            </a>
        ) : <span className="text-slate-400 text-xs">-</span>,
    },
];

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

function Field({ label, error, children }) {
    return (
        <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
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

export default function ModulIndex({ moduls }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);

    const addForm  = useForm({ kode_modul: '', nama_modul: '', fase: '', tag_kompetensi: '', file_materi: null });
    const editForm = useForm({ kode_modul: '', nama_modul: '', fase: '', tag_kompetensi: '', file_materi: null });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/modul/store', {
            forceFormData: true,
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({
            kode_modul:     row.kode_modul     ?? '',
            nama_modul:     row.nama_modul     ?? '',
            fase:           row.fase           ?? '',
            tag_kompetensi: row.tag_kompetensi ?? '',
            file_materi:    null,
        });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.post(`/modul/update/${editRow.id}`, {
            forceFormData: true,
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Hapus modul "${row.nama_modul}"?`)) return;
        router.delete(`/modul/delete/${row.id}`);
    };

    const ModulForm = ({ form, formId, onSubmit }) => (
        <form id={formId} onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-x-4">
                <Field label="Kode Modul" error={form.errors.kode_modul}>
                    <input type="text" value={form.data.kode_modul} required
                        onChange={(e) => form.setData('kode_modul', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Fase" error={form.errors.fase}>
                    <select value={form.data.fase} required
                        onChange={(e) => form.setData('fase', e.target.value)} className={inputCls}>
                        <option value="">Pilih Fase...</option>
                        {FASE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Nama Modul" error={form.errors.nama_modul}>
                <input type="text" value={form.data.nama_modul} required
                    onChange={(e) => form.setData('nama_modul', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tag Kompetensi" error={form.errors.tag_kompetensi}>
                <input type="text" value={form.data.tag_kompetensi}
                    onChange={(e) => form.setData('tag_kompetensi', e.target.value)} className={inputCls}
                    placeholder="Opsional" />
            </Field>
            <Field label="File Materi (PDF, maks 10MB)" error={form.errors.file_materi}>
                <input type="file" accept=".pdf"
                    onChange={(e) => form.setData('file_materi', e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </Field>
        </form>
    );

    const BtnRow = ({ onCancel, formId, processing }) => (
        <>
            <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
            <button type="submit" form={formId} disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
        </>
    );

    return (
        <AppLayout title="DAFTAR MODUL" breadcrumb="Modul / Daftar Modul">
            <DataTable
                columns={COLS}
                data={moduls}
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
                        Tambah Modul
                    </button>
                }
            />

            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Tambah Modul" size="lg"
                footer={<BtnRow onCancel={() => { setTambahOpen(false); addForm.reset(); }} formId="add-form" processing={addForm.processing} />}>
                <ModulForm form={addForm} formId="add-form" onSubmit={submitAdd} />
            </Modal>

            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Modul" size="lg"
                footer={<BtnRow onCancel={() => setEditOpen(false)} formId="edit-form" processing={editForm.processing} />}>
                <ModulForm form={editForm} formId="edit-form" onSubmit={submitEdit} />
            </Modal>
        </AppLayout>
    );
}
