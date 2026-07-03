import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

// Value = anggota enum dokumen.jenis khusus menu ini (jenis lain milik fitur upload masing-masing).
const JENIS_OPTIONS = [
    { value: 'DOKUMEN', label: 'Dokumen' },
    { value: 'LAPORAN', label: 'Laporan' },
    { value: 'LAINNYA', label: 'Lainnya' },
];

// Nama tanpa ekstensi — dipakai untuk default input Nama Dokumen (ekstensi ditambahkan backend).
const stripExt = (name) => (name ?? '').replace(/\.[^.]+$/, '');

const COLS = [
    { key: '_no',       label: 'No',       width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nama_file', label: 'Nama File', sortable: true },
    { key: 'jenis',     label: 'Jenis',    sortable: true },
    {
        key: 'path_file', label: 'File',
        render: (v, row) => v ? (
            <a href={`/${v}`} target="_blank" rel="noreferrer" download={row?.nama_file}
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
        <div className="mb-4">
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

export default function DokumenIndex({ dokumens }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);

    const addForm  = useForm({ file: null, nama: '', jenis: '' });
    const editForm = useForm({ file: null, nama: '', jenis: '' });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/dokumen/store', {
            forceFormData: true,
            onSuccess: () => { setTambahOpen(false); addForm.reset(); },
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({ file: null, nama: stripExt(row.nama_file), jenis: row.jenis ?? '' });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/dokumen/update/${editRow.id}`, {
            forceFormData: true,
            onSuccess: () => setEditOpen(false),
        });
    };

    const handleDelete = (row) => {
        if (!window.confirm(`Hapus dokumen "${row.nama_file}"?`)) return;
        router.delete(`/dokumen/delete/${row.id}`);
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
        <AppLayout title="DOKUMEN" breadcrumb="Modul / Dokumen">
            <DataTable
                columns={COLS}
                data={dokumens}
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
                        Upload Dokumen
                    </button>
                }
            />

            {/* Tambah Modal */}
            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Upload Dokumen"
                footer={<BtnRow onCancel={() => { setTambahOpen(false); addForm.reset(); }} formId="add-form" processing={addForm.processing} />}>
                <form id="add-form" onSubmit={submitAdd}>
                    <Field label="File (PDF, Word, Excel, PPT — maks 2MB)" error={addForm.errors.file}>
                        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                            onChange={(e) => {
                                const f = e.target.files[0];
                                // Default Nama Dokumen = nama file asli (tanpa ekstensi), tetap bisa diedit.
                                addForm.setData((d) => ({ ...d, file: f, nama: stripExt(f?.name) }));
                            }} required
                            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </Field>
                    <Field label="Nama Dokumen" error={addForm.errors.nama}>
                        <input type="text" value={addForm.data.nama} required maxLength={150}
                            onChange={(e) => addForm.setData('nama', e.target.value)}
                            placeholder="Nama dokumen yang tampil di daftar..."
                            className={inputCls} />
                    </Field>
                    <Field label="Jenis" error={addForm.errors.jenis}>
                        <select value={addForm.data.jenis} required
                            onChange={(e) => addForm.setData('jenis', e.target.value)} className={inputCls}>
                            <option value="">Pilih Jenis...</option>
                            {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Dokumen"
                footer={<BtnRow onCancel={() => setEditOpen(false)} formId="edit-form" processing={editForm.processing} />}>
                <form id="edit-form" onSubmit={submitEdit}>
                    <Field label="Ganti File (opsional)" error={editForm.errors.file}>
                        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                            onChange={(e) => editForm.setData('file', e.target.files[0])}
                            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </Field>
                    <Field label="Nama Dokumen" error={editForm.errors.nama}>
                        <input type="text" value={editForm.data.nama} required maxLength={150}
                            onChange={(e) => editForm.setData('nama', e.target.value)}
                            placeholder="Nama dokumen yang tampil di daftar..."
                            className={inputCls} />
                    </Field>
                    <Field label="Jenis" error={editForm.errors.jenis}>
                        <select value={editForm.data.jenis} required
                            onChange={(e) => editForm.setData('jenis', e.target.value)} className={inputCls}>
                            <option value="">Pilih Jenis...</option>
                            {JENIS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </Field>
                </form>
            </Modal>
        </AppLayout>
    );
}
