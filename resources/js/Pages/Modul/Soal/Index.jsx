import { useState, useRef, useEffect } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';
import Toast from '@/Components/Toast';

const TIPE_OPTIONS = [
    { value: 'pre',  label: 'Pre-Test' },
    { value: 'post', label: 'Post-Test' },
];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const COLS = [
    { key: '_no',       label: 'No',    width: '60px', render: (_, __, i) => i + 1 },
    { key: 'soal',      label: 'Soal',  sortable: true, width: '55%' },
    { key: 'nama_modul',label: 'Modul', sortable: true },
    {
        key: 'tipe', label: 'Tipe',
        render: () => (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pre/Post Test
            </span>
        ),
    },
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
    const colors = {
        blue:   'text-blue-600 hover:bg-blue-50',
        red:    'text-red-600 hover:bg-red-50',
        green:  'text-green-600 hover:bg-green-50',
    };
    return (
        <button type="button" onClick={onClick} title={title}
            className={`p-1.5 rounded-lg transition ${colors[color]}`}>{children}</button>
    );
}

const emptyJawabans = () => [
    { jawaban: '', is_benar: true },
    { jawaban: '', is_benar: false },
    { jawaban: '', is_benar: false },
    { jawaban: '', is_benar: false },
];

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

function JawabanFields({ jawabans, setFn, prefix }) {
    return (
        <div className="space-y-3">
            {jawabans.map((j, idx) => (
                <div key={idx} className="flex items-start gap-3">
                    <div className="flex items-center mt-2.5">
                        <input
                            type="radio"
                            name={`${prefix}-correct`}
                            checked={j.is_benar}
                            onChange={() => setFn(idx, 'is_benar', true)}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            title="Tandai sebagai jawaban benar"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-slate-600 bg-slate-100 rounded-full shrink-0">
                                {OPTION_LABELS[idx]}
                            </span>
                            <input
                                type="text"
                                value={j.jawaban}
                                required
                                onChange={(e) => setFn(idx, 'jawaban', e.target.value)}
                                placeholder={`Jawaban ${OPTION_LABELS[idx]}`}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>
            ))}
            <p className="text-xs text-slate-500">Pilih radio button untuk menandai jawaban yang benar.</p>
        </div>
    );
}

export default function SoalModulIndex({ soals, moduls }) {
    const [tambahOpen, setTambahOpen]   = useState(false);
    const [editOpen, setEditOpen]       = useState(false);
    const [editRow, setEditRow]         = useState(null);
    const [viewOpen, setViewOpen]       = useState(false);
    const [viewRow, setViewRow]         = useState(null);
    const [deleteOpen, setDeleteOpen]   = useState(false);
    const [deleteRow, setDeleteRow]     = useState(null);
    const [deleting, setDeleting]       = useState(false);
    const [importOpen, setImportOpen]   = useState(false);
    const [importModulId, setImportModulId] = useState('');
    const [importFile, setImportFile]   = useState(null);
    const [importing, setImporting]     = useState(false);
    const fileInputRef = useRef(null);
    const [filterModulId, setFilterModulId] = useState('');
    const [filterOpen, setFilterOpen]       = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const [notif, setNotif] = useState({ open: false, type: 'success', message: '', key: 0 });
    const { flash = {} } = usePage().props;
    const importErrors = flash.import_errors ?? [];

    useEffect(() => {
        if (flash.import_success) showNotif('success', flash.import_success);
    }, [flash.import_success]);

    const showNotif = (type, msg) => {
        setNotif(prev => ({ open: true, type, message: msg, key: prev.key + 1 }));
    };

    const closeImport = () => {
        setImportOpen(false);
        setImportModulId('');
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const submitImport = (e) => {
        e.preventDefault();
        if (!importModulId || !importFile) return;
        setImporting(true);
        router.post('/soal-modul/import', { modul_id: importModulId, file: importFile }, {
            forceFormData: true,
            onSuccess: () => { setImporting(false); closeImport(); },
            onError: () => { setImporting(false); showNotif('error', 'Gagal mengimport file. Periksa format file.'); },
        });
    };

    const addForm  = useForm({ modul_id: '', soal: '', jawabans: emptyJawabans() });
    const editForm = useForm({ modul_id: '', soal: '', jawabans: emptyJawabans() });

    // --- jawaban helpers ---
    const setAddJawaban = (idx, field, value) => {
        const next = addForm.data.jawabans.map((j, i) => {
            if (field === 'is_benar') return { ...j, is_benar: i === idx };
            return i === idx ? { ...j, [field]: value } : j;
        });
        addForm.setData('jawabans', next);
    };

    const setEditJawaban = (idx, field, value) => {
        const next = editForm.data.jawabans.map((j, i) => {
            if (field === 'is_benar') return { ...j, is_benar: i === idx };
            return i === idx ? { ...j, [field]: value } : j;
        });
        editForm.setData('jawabans', next);
    };

    // --- submit ---
    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/soal-modul/store', {
            onSuccess: () => {
                setTambahOpen(false);
                addForm.reset();
                addForm.setData('jawabans', emptyJawabans());
                showNotif('success', 'Soal berhasil ditambahkan!');
            },
            onError: () => showNotif('error', 'Terjadi kesalahan. Periksa kembali form.', true),
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        const jawabans = row.jawabans && row.jawabans.length === 4
            ? row.jawabans.map(j => ({ jawaban: j.jawaban, is_benar: !!j.is_benar }))
            : emptyJawabans();
        editForm.setData({ modul_id: row.modul_id, soal: row.soal, jawabans });
        setEditOpen(true);
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/soal-modul/update/${editRow.id}`, {
            onSuccess: () => {
                setEditOpen(false);
                showNotif('success', 'Soal berhasil diupdate!');
            },
            onError: () => showNotif('error', 'Terjadi kesalahan. Periksa kembali form.'),
        });
    };

    const openDelete = (row) => { setDeleteRow(row); setDeleteOpen(true); };
    const confirmDelete = () => {
        setDeleting(true);
        router.delete(`/soal-modul/delete/${deleteRow.id}`, {
            onSuccess: () => {
                setDeleting(false);
                setDeleteOpen(false);
                showNotif('success', 'Soal berhasil dihapus!');
            },
            onError: () => {
                setDeleting(false);
                setDeleteOpen(false);
                showNotif('error', 'Gagal menghapus soal.');
            },
        });
    };

    const BtnRow = ({ onCancel, formId, processing }) => (
        <>
            <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                Batal
            </button>
            <button type="submit" form={formId} disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                Simpan
            </button>
        </>
    );

    const filteredSoals = filterModulId
        ? soals.filter(s => String(s.modul_id) === String(filterModulId))
        : soals;

    return (
        <AppLayout title="SOAL PRE/POST TEST" breadcrumb="Modul / Soal Pre/Post Test">
            <Toast
                key={notif.key}
                open={notif.open}
                type={notif.type}
                message={notif.message}
                onClose={() => setNotif(prev => ({ ...prev, open: false }))}
            />

            <DataTable
                columns={COLS}
                data={filteredSoals}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        <ActionBtn onClick={() => { setViewRow(row); setViewOpen(true); }} color="green" title="Lihat Jawaban">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </ActionBtn>
                        <ActionBtn onClick={() => openEdit(row)} color="blue" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </ActionBtn>
                        <ActionBtn onClick={() => openDelete(row)} color="red" title="Hapus">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </ActionBtn>
                    </div>
                )}
                searchPrefix={
                    <div className="relative" ref={filterRef}>
                        <button type="button" onClick={() => setFilterOpen(v => !v)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition ${filterModulId ? 'text-blue-700 bg-blue-50 border-blue-300' : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M7 8h10M11 12h2M11 16h2" />
                            </svg>
                            Filter
                            {filterModulId && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </button>
                        {filterOpen && (
                            <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                                <button type="button" onClick={() => { setFilterModulId(''); setFilterOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${!filterModulId ? 'font-medium text-blue-600' : 'text-slate-700'}`}>
                                    Semua Modul
                                </button>
                                {moduls.map(m => (
                                    <button key={m.id} type="button"
                                        onClick={() => { setFilterModulId(String(m.id)); setFilterOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${String(filterModulId) === String(m.id) ? 'font-medium text-blue-600' : 'text-slate-700'}`}>
                                        {m.nama_modul}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                }
                headerActions={
                    <div className="flex items-center gap-2">
                        <a href="/soal-modul/template"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Template
                        </a>
                        <button onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import Excel
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

            {/* Modal Tambah */}
            <Modal open={tambahOpen} onClose={() => { setTambahOpen(false); addForm.reset(); addForm.setData('jawabans', emptyJawabans()); }}
                title="Tambah Soal" size="lg"
                footer={<BtnRow onCancel={() => { setTambahOpen(false); addForm.reset(); addForm.setData('jawabans', emptyJawabans()); }} formId="add-form" processing={addForm.processing} />}>
                <form id="add-form" onSubmit={submitAdd}>
                    <Field label="Modul">
                        <select value={addForm.data.modul_id} required
                            onChange={(e) => addForm.setData('modul_id', e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Modul...</option>
                            {moduls.map((m) => <option key={m.id} value={m.id}>{m.nama_modul}</option>)}
                        </select>
                        {addForm.errors.modul_id && <p className="text-xs text-red-600 mt-1">{addForm.errors.modul_id}</p>}
                    </Field>
                    <Field label="Pertanyaan">
                        <textarea rows="3" value={addForm.data.soal} required
                            onChange={(e) => addForm.setData('soal', e.target.value)}
                            className={inputCls} />
                        {addForm.errors.soal && <p className="text-xs text-red-600 mt-1">{addForm.errors.soal}</p>}
                    </Field>
                    <Field label="Pilihan Jawaban">
                        <JawabanFields jawabans={addForm.data.jawabans} setFn={setAddJawaban} prefix="add" />
                    </Field>
                </form>
            </Modal>

            {/* Modal Edit */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Soal" size="lg"
                footer={<BtnRow onCancel={() => setEditOpen(false)} formId="edit-form" processing={editForm.processing} />}>
                <form id="edit-form" onSubmit={submitEdit}>
                    <Field label="Modul">
                        <select value={editForm.data.modul_id} required
                            onChange={(e) => editForm.setData('modul_id', e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Modul...</option>
                            {moduls.map((m) => <option key={m.id} value={m.id}>{m.nama_modul}</option>)}
                        </select>
                    </Field>
                    <Field label="Pertanyaan">
                        <textarea rows="3" value={editForm.data.soal} required
                            onChange={(e) => editForm.setData('soal', e.target.value)}
                            className={inputCls} />
                    </Field>
                    <Field label="Pilihan Jawaban">
                        <JawabanFields jawabans={editForm.data.jawabans} setFn={setEditJawaban} prefix="edit" />
                    </Field>
                </form>
            </Modal>

            {/* Modal Lihat Jawaban */}
            <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Detail Jawaban" size="md"
                footer={
                    <button onClick={() => setViewOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                        Tutup
                    </button>
                }>
                {viewRow && (
                    <div>
                        <p className="text-sm text-slate-700 font-medium mb-1">Soal:</p>
                        <p className="text-sm text-slate-800 mb-4 bg-slate-50 rounded-lg px-3 py-2">{viewRow.soal}</p>
                        <p className="text-sm text-slate-700 font-medium mb-2">Pilihan Jawaban:</p>
                        <div className="space-y-2">
                            {viewRow.jawabans && viewRow.jawabans.map((j, idx) => (
                                <div key={j.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${j.is_benar ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}>
                                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full shrink-0 ${j.is_benar ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {OPTION_LABELS[idx]}
                                    </span>
                                    <span className="text-sm text-slate-800 flex-1">{j.jawaban}</span>
                                    {j.is_benar ? (
                                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Benar</span>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Konfirmasi Hapus" size="sm"
                footer={
                    <>
                        <button type="button" onClick={() => setDeleteOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="button" onClick={confirmDelete} disabled={deleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </>
                }>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Hapus soal ini?</p>
                        <p className="text-sm text-slate-500 mt-1">Semua jawaban terkait soal ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                </div>
            </Modal>
            {/* Modal Import Excel */}
            <Modal open={importOpen} onClose={closeImport} title="Import Soal dari Excel" size="md"
                footer={
                    <>
                        <button type="button" onClick={closeImport}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                            Batal
                        </button>
                        <button type="submit" form="import-form" disabled={importing || !importModulId || !importFile}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                            {importing ? 'Mengimport...' : 'Import'}
                        </button>
                    </>
                }>
                <form id="import-form" onSubmit={submitImport}>
                    <Field label="Modul">
                        <select value={importModulId} required
                            onChange={(e) => setImportModulId(e.target.value)}
                            className={inputCls}>
                            <option value="">Pilih Modul...</option>
                            {moduls.map((m) => <option key={m.id} value={m.id}>{m.nama_modul}</option>)}
                        </select>
                    </Field>
                    <Field label="File Excel (.xlsx / .xls)">
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" required
                            onChange={(e) => setImportFile(e.target.files[0] ?? null)}
                            className={inputCls} />
                        <p className="text-xs text-slate-500 mt-1">
                            Gunakan template yang sudah diunduh. Kolom: <strong>soal, jawaban_a, jawaban_b, jawaban_c, jawaban_d, jawaban_benar</strong> (isi A/B/C/D).
                        </p>
                    </Field>
                    {importErrors.length > 0 && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-700 mb-1">Error pada baris berikut:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {importErrors.map((err, i) => <li key={i} className="text-xs text-red-600">{err}</li>)}
                            </ul>
                        </div>
                    )}
                </form>
            </Modal>
        </AppLayout>
    );
}
