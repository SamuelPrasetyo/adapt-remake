import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';
import { FASE_LABELS } from '@/constants/fase';

const FASE_OPTIONS = [
    { value: '1', label: 'Foundation' },
    { value: '2', label: 'Self Learning' },
    { value: '3', label: 'Monthly Training' },
    { value: '4', label: 'Administration' },
];
const TIPE_OPTIONS = [{ value: 'KADER', label: 'Kader' }, { value: 'MENTOR', label: 'Mentor' }];
const TAG_OPTIONS = [
    { value: 'FOUNDATION',    label: 'Foundation' },
    { value: 'SELF_LEARNING', label: 'Self Learning' },
    { value: 'LEADERSHIP',    label: 'Leadership' },
    { value: 'MENTOR',        label: 'Mentor' },
];
const TAG_LABELS = Object.fromEntries(TAG_OPTIONS.map((o) => [o.value, o.label]));

const COLS = [
    { key: '_no',        label: 'No',   width: '52px', render: (_, __, i) => i + 1 },
    { key: 'kode_modul', label: 'Kode', sortable: true },
    { key: 'nama_modul', label: 'Nama Modul', sortable: true },
    { key: 'tipe',       label: 'Tipe', sortable: true, render: (v) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v === 'MENTOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{v ?? 'KADER'}</span>
    )},
    { key: 'fase',       label: 'Fase', sortable: true, render: (v) => v ? (FASE_LABELS[v] ?? v) : <span className="text-slate-400">—</span> },
    { key: 'tag_kompetensi', label: 'Tag Kompetensi', render: (v) => TAG_LABELS[v] ?? (v || <span className="text-slate-400">—</span>) },
    {
        key: 'komponen', label: 'Komponen',
        render: (_, row) => {
            const hasTest = row.has_test ?? true;
            const hasPA   = row.has_post_activity ?? true;
            const chip = (label, on) => (
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${on ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>{label}</span>
            );
            return (
                <div className="flex items-center gap-1">
                    {chip('Test', hasTest)}
                    {chip('PA', hasPA)}
                </div>
            );
        },
    },
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

function ModulForm({ form, formId, onSubmit, currentFile }) {
    const isMentor = form.data.tipe === 'MENTOR';
    return (
        <form id={formId} onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-x-4">
                <Field label="Kode Modul" error={form.errors.kode_modul}>
                    <input type="text" value={form.data.kode_modul} required
                        onChange={(e) => form.setData('kode_modul', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Tipe Modul" error={form.errors.tipe}>
                    <select value={form.data.tipe} required
                        onChange={(e) => { form.setData('tipe', e.target.value); if (e.target.value === 'MENTOR') form.setData('fase', ''); }}
                        className={inputCls}>
                        {TIPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
                <Field label="Fase" error={form.errors.fase}>
                    <select value={form.data.fase} required={!isMentor} disabled={isMentor}
                        onChange={(e) => form.setData('fase', e.target.value)}
                        className={`${inputCls} ${isMentor ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}>
                        <option value="">{isMentor ? 'Tidak berlaku' : 'Pilih Fase...'}</option>
                        {!isMentor && FASE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Field>
            </div>
            <Field label="Nama Modul" error={form.errors.nama_modul}>
                <input type="text" value={form.data.nama_modul} required
                    onChange={(e) => form.setData('nama_modul', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tag Kompetensi" error={form.errors.tag_kompetensi}>
                <select value={form.data.tag_kompetensi} required
                    onChange={(e) => form.setData('tag_kompetensi', e.target.value)} className={inputCls}>
                    <option value="">Pilih Tag Kompetensi...</option>
                    {TAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </Field>
            <Field label="Komponen Modul" error={form.errors.has_test || form.errors.has_post_activity}>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.data.has_test}
                            onChange={(e) => form.setData('has_test', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30" />
                        Pre/Post Test
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.data.has_post_activity}
                            onChange={(e) => form.setData('has_post_activity', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30" />
                        Post Activity
                    </label>
                    {form.data.has_post_activity && (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                            {isMentor
                                ? 'Modul Mentor: Post Activity dapat diupload hingga 10 kali (10 sesi coaching, tiap sesi direview Admin MAI).'
                                : 'Modul Kader: Post Activity hanya dapat diupload 1 kali.'}
                        </p>
                    )}
                </div>
            </Field>
            <Field label="File Materi (PDF, maks 8MB)" error={form.errors.file_materi}>
                <input type="file" accept=".pdf"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 8 * 1024 * 1024) {
                            form.setError('file_materi', 'Ukuran file terlalu besar. Maksimal 8 MB.');
                            e.target.value = '';
                            return;
                        }
                        form.setData('file_materi', file);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {currentFile && !form.data.file_materi && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>File saat ini:&nbsp;</span>
                        <a href={`/${currentFile}`} target="_blank" rel="noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-xs">
                            {currentFile.split('/').pop().replace(/^\d+_/, '')}
                        </a>
                        <span className="text-slate-400">(kosongkan jika tidak ingin mengganti)</span>
                    </div>
                )}
                {form.data.file_materi && (
                    <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        File baru dipilih: {form.data.file_materi.name}
                    </p>
                )}
            </Field>
        </form>
    );
}

function BtnRow({ onCancel, formId, processing }) {
    return (
        <>
            <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
            <button type="submit" form={formId} disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
        </>
    );
}

export default function ModulIndex({ moduls }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);

    const addForm  = useForm({ kode_modul: '', nama_modul: '', tipe: 'KADER', fase: '', tag_kompetensi: '', has_test: true, has_post_activity: true, file_materi: null });
    const editForm = useForm({ kode_modul: '', nama_modul: '', tipe: 'KADER', fase: '', tag_kompetensi: '', has_test: true, has_post_activity: true, file_materi: null });

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
            kode_modul:        row.kode_modul     ?? '',
            nama_modul:        row.nama_modul     ?? '',
            tipe:              row.tipe           ?? 'KADER',
            fase:              row.fase           ?? '',
            tag_kompetensi:    row.tag_kompetensi ?? '',
            has_test:          row.has_test          ?? true,
            has_post_activity: row.has_post_activity ?? true,
            file_materi:       null,
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

    return (
        <AppLayout title="MODUL PEMBELAJARAN" breadcrumb="Modul / Modul Pembelajaran">
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

            {/* ===== TAMBAH MODAL ===== */}
            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); }}
                title="Tambah Modul" size="2xl"
                footer={<BtnRow onCancel={() => { setTambahOpen(false); addForm.reset(); }} formId="add-form" processing={addForm.processing} />}>
                <ModulForm form={addForm} formId="add-form" onSubmit={submitAdd} />
            </Modal>

            {/* ===== EDIT MODAL ===== */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Modul" size="2xl"
                footer={<BtnRow onCancel={() => setEditOpen(false)} formId="edit-form" processing={editForm.processing} />}>
                <ModulForm form={editForm} formId="edit-form" onSubmit={submitEdit} currentFile={editRow?.file_materi} />
            </Modal>
        </AppLayout>
    );
}
