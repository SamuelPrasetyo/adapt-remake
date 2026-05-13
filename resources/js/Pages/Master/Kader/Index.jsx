import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const COLS = [
    { key: '_no',  label: 'No',   width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nik',  label: 'NIK',  sortable: true },
    { key: 'nama', label: 'Nama', sortable: true },
    { key: 'bu',   label: 'BU',   sortable: true },
    { key: 'divisi_name', label: 'Divisi',     sortable: true },
    { key: 'dept_name',   label: 'Departemen', sortable: true },
    { key: 'batch_name',  label: 'Batch',      sortable: true },
    { key: 'jenis_kelamin', label: 'JK',       align: 'center' },
];

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

function Field({ label, error, children }) {
    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
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

export default function KaderIndex({ kaders, companys, divisis, departemens, batchs }) {
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);

    const editForm = useForm({
        nama: '', nik: '', jenis_kelamin: '', iq: '', ipk: '',
        id_batch: '', id_divisi: '', id_departemen: '', company_code: '',
    });

    const openEdit = (row) => {
        setEditRow(row);
        editForm.setData({
            nama:          row.nama         ?? '',
            nik:           row.nik          ?? '',
            jenis_kelamin: row.jenis_kelamin ?? '',
            iq:            row.iq           ?? '',
            ipk:           row.ipk          ?? '',
            id_batch:      row.id_batch     ?? '',
            id_divisi:     row.id_divisi    ?? '',
            id_departemen: row.id_departemen ?? '',
            company_code:  row.company_code  ?? '',
        });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/kader/update/${editRow.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!importFile) return;
        const fd = new FormData();
        fd.append('file', importFile);
        fd.append('_token', document.querySelector('meta[name="csrf-token"]').content);
        router.post('/kader/import', fd, {
            forceFormData: true,
            onSuccess: () => { setImportOpen(false); setImportFile(null); },
        });
    };

    const SelectOpt = ({ field, options, placeholder }) => (
        <select value={editForm.data[field]} onChange={(e) => editForm.setData(field, e.target.value)} className={inputCls}>
            <option value="">{placeholder || 'Pilih...'}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );

    return (
        <AppLayout title="MASTER KADER" breadcrumb="Master / Kader">
            <DataTable
                columns={COLS}
                data={kaders}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionBtn onClick={() => openEdit(row)} color="blue" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </ActionBtn>
                    </div>
                )}
                headerActions={
                    <div className="flex gap-2">
                        <a href="/kader/export"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Export
                        </a>
                        <button onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button>
                    </div>
                }
            />

            {/* Edit Modal */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Kader" size="lg"
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
                    <div className="grid grid-cols-2 gap-x-4">
                        <Field label="Nama" error={editForm.errors.nama}>
                            <input type="text" value={editForm.data.nama} onChange={(e) => editForm.setData('nama', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="NIK" error={editForm.errors.nik}>
                            <input type="text" value={editForm.data.nik} onChange={(e) => editForm.setData('nik', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Jenis Kelamin" error={editForm.errors.jenis_kelamin}>
                            <select value={editForm.data.jenis_kelamin} onChange={(e) => editForm.setData('jenis_kelamin', e.target.value)} className={inputCls}>
                                <option value="">Pilih...</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </Field>
                        <Field label="Bisnis Unit" error={editForm.errors.company_code}>
                            <SelectOpt field="company_code" placeholder="Pilih BU..."
                                options={companys.map((c) => ({ value: c.company_code, label: c.company_shortname }))} />
                        </Field>
                        <Field label="Divisi" error={editForm.errors.id_divisi}>
                            <SelectOpt field="id_divisi" placeholder="Pilih Divisi..."
                                options={divisis.map((d) => ({ value: d.id, label: d.nama }))} />
                        </Field>
                        <Field label="Departemen" error={editForm.errors.id_departemen}>
                            <SelectOpt field="id_departemen" placeholder="Pilih Departemen..."
                                options={departemens.map((d) => ({ value: d.id, label: d.nama }))} />
                        </Field>
                        <Field label="Batch" error={editForm.errors.id_batch}>
                            <SelectOpt field="id_batch" placeholder="Pilih Batch..."
                                options={batchs.map((b) => ({ value: b.id_batch, label: `${b.nama_batch} (${b.tahun_batch})` }))} />
                        </Field>
                        <Field label="IQ" error={editForm.errors.iq}>
                            <input type="number" value={editForm.data.iq} onChange={(e) => editForm.setData('iq', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="IPK" error={editForm.errors.ipk}>
                            <input type="number" step="0.01" value={editForm.data.ipk} onChange={(e) => editForm.setData('ipk', e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); }}
                title="Import Kader" size="sm"
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
