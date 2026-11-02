import { useState, useMemo, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable, { LocalPagination } from '@/Components/DataTable';
import Modal from '@/Components/Modal';
import FilePreviewModal from '@/Components/FilePreviewModal';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

// Batas maksimum mentor per kader — selaras dgn KaderPerMentorController::MAX_MENTORS_PER_KADER.
const MAX_MENTORS_PER_KADER = 5;
const RIWAYAT_PER_PAGE = 10;

// Dokumen pendukung pergantian mentor — selaras dgn KaderPerMentorController::PERGANTIAN_MAX_KB.
const PERGANTIAN_MAX_BYTES = 2 * 1024 * 1024;
const pergantianDocUrl = (id) => `/mentor/pergantian-dokumen/${id}?inline=1`;

const formatTanggal = (v) => {
    if (!v) return '—';
    const d = new Date(String(v).replace(' ', 'T'));
    return isNaN(d) ? v : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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

export default function MentorIndex({ mentors, companys, kaders = [], assignments = [], mentorUsers = [], pergantianMentor = [] }) {
    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignMentor, setAssignMentor] = useState(null);
    const [assignSearch, setAssignSearch] = useState('');
    const [assignKaderIds, setAssignKaderIds] = useState([]);
    const [assignProcessing, setAssignProcessing] = useState(false);
    const [showOtherBU, setShowOtherBU] = useState(false);
    const [assignFile, setAssignFile]     = useState(null);
    const [assignAlasan, setAssignAlasan] = useState('');
    const [assignErrors, setAssignErrors] = useState({});
    const [showRiwayat, setShowRiwayat]   = useState(false);
    const [previewDoc, setPreviewDoc]     = useState(null);
    const [riwayatOpen, setRiwayatOpen]     = useState(false);
    const [riwayatSearch, setRiwayatSearch] = useState('');
    const [riwayatPage, setRiwayatPage]     = useState(1);
    // Mobile: upload dokumen pergantian dipisah ke langkah kedua ('dokumen').
    // Layar lebar (lg+) menampilkan keduanya berdampingan sehingga langkah ini diabaikan.
    const [assignStep, setAssignStep]     = useState('pilih');
    const assignFileRef = useRef(null);

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

    // Peta kader_id -> daftar mentor { id, nama } (semua mentor aktif kader tsb).
    const mentorsByKader = useMemo(() => {
        const map = {};
        for (const a of assignments) {
            (map[a.kader_id] ||= []).push({ id: a.mentor_id, nama: a.mentor_name });
        }
        return map;
    }, [assignments]);

    const openAssign = (mentor) => {
        setAssignMentor(mentor);
        const alreadyAssigned = assignments
            .filter((a) => a.mentor_id === mentor.id)
            .map((a) => a.kader_id);
        setAssignKaderIds(alreadyAssigned);
        setAssignSearch('');
        setShowOtherBU(false);
        setAssignFile(null);
        setAssignAlasan('');
        setAssignErrors({});
        setShowRiwayat(false);
        setAssignStep('pilih');
        if (assignFileRef.current) assignFileRef.current.value = '';
        setAssignOpen(true);
    };

    // Kader yang tercatat di DB untuk mentor ini — bukan pilihan kerja yang sedang
    // diedit, supaya baris lintas BU tidak hilang begitu centangnya dilepas.
    const assignedHere = useMemo(
        () => assignments.filter((a) => a.mentor_id === assignMentor?.id).map((a) => a.kader_id),
        [assignments, assignMentor]
    );

    const isCrossBU = (k) =>
        !!assignMentor?.company_code && k.company_code !== assignMentor.company_code;

    // Default hanya kader se-BU mentor supaya list ringkas. Kader BU lain tampil
    // bila toggle dinyalakan, ATAU bila sudah ter-assign ke mentor ini — kalau
    // disembunyikan, admin tidak punya cara untuk meng-unassign-nya.
    const { filteredKaders, hiddenOtherBU } = useMemo(() => {
        const q = assignSearch.trim().toLowerCase();
        const matched = kaders.filter(
            (k) =>
                !q ||
                k.nama?.toLowerCase().includes(q) ||
                k.nik?.toLowerCase().includes(q) ||
                k.bu?.toLowerCase().includes(q)
        );

        const sameBU  = matched.filter((k) => !isCrossBU(k));
        const otherBU = matched.filter((k) => isCrossBU(k));
        const shownOther = showOtherBU
            ? otherBU
            : otherBU.filter((k) => assignedHere.includes(k.id));

        return {
            // Kader se-BU didahulukan, yang lintas BU menyusul di bawah.
            filteredKaders: [...sameBU, ...shownOther],
            hiddenOtherBU: otherBU.length - shownOther.length,
        };
    }, [kaders, assignSearch, assignMentor, showOtherBU, assignedHere]);

    // Jumlah mentor LAIN (selain mentor yang sedang di-assign) untuk satu kader.
    const otherMentorCount = (kaderId) =>
        (mentorsByKader[kaderId] || []).filter((m) => m.id !== assignMentor?.id).length;

    // Kader terkunci bila sudah punya MAX mentor dari mentor lain (tak bisa ditambah).
    const isKaderLocked = (kaderId) =>
        !assignKaderIds.includes(kaderId) && otherMentorCount(kaderId) >= MAX_MENTORS_PER_KADER;

    const toggleKader = (id) => {
        if (isKaderLocked(id)) return; // sudah penuh, tidak bisa ditambah
        setAssignKaderIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const kaderById = useMemo(
        () => Object.fromEntries(kaders.map((k) => [k.id, k])),
        [kaders]
    );

    // Kader yang berubah (ditambah / dilepas) di batch yang sudah berjalan → wajib
    // dokumen pendukung + alasan. Server tetap menegakkan aturan yang sama.
    const terdampak = useMemo(() => {
        const added   = assignKaderIds.filter((id) => !assignedHere.includes(id));
        const removed = assignedHere.filter((id) => !assignKaderIds.includes(id));
        return [...added, ...removed]
            .map((id) => kaderById[id])
            .filter((k) => k?.batch_started);
    }, [assignKaderIds, assignedHere, kaderById]);
    const needsDoc = terdampak.length > 0;
    const step = needsDoc ? assignStep : 'pilih';
    const docIncomplete = needsDoc && (!assignFile || !assignAlasan.trim());

    const riwayatMentor = useMemo(
        () => pergantianMentor.filter((r) => r.mentor_id === assignMentor?.id),
        [pergantianMentor, assignMentor]
    );

    // Riwayat semua mentor, dikelompokkan per submit: satu submit = satu dokumen + alasan
    // untuk beberapa kader. Baris dari submit yang sama berbagi mentor_id & created_at.
    const riwayatSemua = useMemo(() => {
        const groups = new Map();
        for (const r of pergantianMentor) {
            const key = `${r.mentor_id}|${r.created_at}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    docId:           r.id,
                    nama_file:       r.nama_file,
                    mentor_nama:     r.mentor_nama,
                    alasan:          r.alasan,
                    created_at:      r.created_at,
                    created_by_name: r.created_by_name,
                    tambah: [],
                    lepas:  [],
                });
            }
            groups.get(key)[r.aksi === 'ASSIGN' ? 'tambah' : 'lepas'].push(r.kader_nama || '—');
        }
        return [...groups.values()];
    }, [pergantianMentor]);

    const riwayatFiltered = useMemo(() => {
        const q = riwayatSearch.trim().toLowerCase();
        if (!q) return riwayatSemua;
        return riwayatSemua.filter((g) =>
            [g.mentor_nama, g.alasan, g.created_by_name, ...g.tambah, ...g.lepas]
                .some((v) => v?.toLowerCase().includes(q))
        );
    }, [riwayatSemua, riwayatSearch]);

    const riwayatTotalPages = Math.max(1, Math.ceil(riwayatFiltered.length / RIWAYAT_PER_PAGE));
    // Jaga halaman tetap valid bila hasil pencarian menyusut.
    const riwayatCurrentPage = Math.min(riwayatPage, riwayatTotalPages);
    const riwayatPageRows = riwayatFiltered.slice(
        (riwayatCurrentPage - 1) * RIWAYAT_PER_PAGE,
        riwayatCurrentPage * RIWAYAT_PER_PAGE
    );

    const onPickDokumen = (e) => {
        const file = e.target.files?.[0] ?? null;
        setAssignErrors((prev) => ({ ...prev, dokumen: null }));
        if (!file) { setAssignFile(null); return; }

        const ext = file.name.split('.').pop().toLowerCase();
        let err = null;
        if (ext !== 'pdf') err = 'Format dokumen harus PDF.';
        else if (file.size > PERGANTIAN_MAX_BYTES) err = 'Ukuran dokumen maksimal 2 MB.';

        if (err) {
            setAssignErrors((prev) => ({ ...prev, dokumen: err }));
            setAssignFile(null);
            e.target.value = '';
            return;
        }
        setAssignFile(file);
    };

    const submitAssign = (e) => {
        e.preventDefault();
        if (docIncomplete) {
            // Mobile: bawa ke langkah dokumen supaya pesan error-nya terlihat.
            setAssignStep('dokumen');
            setAssignErrors({
                dokumen: !assignFile ? 'Wajib upload dokumen pendukung pergantian mentor (PDF, maks. 2 MB).' : null,
                alasan:  !assignAlasan.trim() ? 'Wajib mengisi alasan pergantian mentor.' : null,
            });
            return;
        }

        setAssignProcessing(true);
        setAssignErrors({});
        router.post('/mentor/assign-kader', {
            mentor_id: assignMentor.id,
            kader_ids: assignKaderIds,
            ...(needsDoc ? { dokumen: assignFile, alasan: assignAlasan } : {}),
        }, {
            forceFormData: true,
            onError: setAssignErrors,
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
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setTambahOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Mentor
                        </button>
                        <button
                            onClick={() => { setRiwayatSearch(''); setRiwayatPage(1); setRiwayatOpen(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Riwayat Pergantian
                            {riwayatSemua.length > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-200 text-amber-800">
                                    {riwayatSemua.length}
                                </span>
                            )}
                        </button>
                    </div>
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
                title={step === 'dokumen'
                    ? 'Dokumen Pergantian Mentor'
                    : assignMentor ? `Assign Kader ke ${assignMentor.nama}` : 'Assign Kader'}
                // Ada kader batch berjalan yang berubah → lebarkan agar panel dokumen muat di kanan.
                size={needsDoc ? '2xl' : 'lg'}
                footer={
                    <>
                        {step === 'dokumen' ? (
                            <button type="button" onClick={() => setAssignStep('pilih')}
                                className="lg:hidden px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                                Kembali
                            </button>
                        ) : (
                            <button type="button" onClick={() => setAssignOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                                Batal
                            </button>
                        )}
                        {/* Mobile: belum di langkah dokumen → tombol lanjut, bukan submit. */}
                        {needsDoc && step === 'pilih' && (
                            <button type="button" onClick={() => setAssignStep('dokumen')}
                                className="lg:hidden px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition">
                                Lanjut: Upload Dokumen
                            </button>
                        )}
                        <button type="submit" form="mentor-assign-form"
                            disabled={assignProcessing || docIncomplete}
                            className={`${needsDoc && step === 'pilih' ? 'hidden lg:inline-flex' : 'inline-flex'} px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition`}>
                            {assignProcessing ? 'Memproses...' : `Assign ${assignKaderIds.length} Kader`}
                        </button>
                    </>
                }
            >
                <form id="mentor-assign-form" onSubmit={submitAssign}
                    className={needsDoc ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5' : ''}>
                    {/* Kolom kiri: daftar kader (disembunyikan di mobile saat langkah dokumen). */}
                    <div className={step === 'dokumen' ? 'hidden lg:block min-w-0' : 'min-w-0'}>
                    <div className="mb-3">
                        <input type="text" placeholder="Cari kader (Nama / NIK)"
                            value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)}
                            className={inputCls} />
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-xs text-slate-500">
                            {filteredKaders.length} kader · {assignKaderIds.length} dipilih
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                            <input type="checkbox" checked={showOtherBU}
                                onChange={(e) => setShowOtherBU(e.target.checked)}
                                className="w-3.5 h-3.5 accent-amber-500" />
                            Tampilkan kader BU lain
                        </label>
                    </div>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 border border-slate-200 rounded-lg p-2">
                        {filteredKaders.length === 0 ? (
                            <div className="text-center py-8 text-sm text-slate-400">
                                Tidak ada kader yang cocok
                                {assignMentor && ` di BU ${assignMentor.bu || assignMentor.company_code}`}.
                                {hiddenOtherBU > 0 && (
                                    <div className="mt-1.5 text-slate-500">
                                        <span className="font-medium text-slate-600">{hiddenOtherBU} kader</span> cocok di BU lain —{' '}
                                        <button type="button" onClick={() => setShowOtherBU(true)}
                                            className="font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2">
                                            Tampilkan
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : filteredKaders.map((k) => {
                            const checked    = assignKaderIds.includes(k.id);
                            const allMentors = mentorsByKader[k.id] || [];
                            const otherMentors = allMentors.filter((m) => m.id !== assignMentor?.id);
                            const locked     = isKaderLocked(k.id);
                            const crossBU    = isCrossBU(k);
                            // Jumlah mentor bila assign ini disimpan (mentor lain + mentor ini bila dicentang).
                            const effectiveCount = otherMentors.length + (checked ? 1 : 0);
                            return (
                                <label key={k.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition ${
                                        locked
                                            ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                                            : checked
                                                ? 'border-emerald-400 bg-emerald-50 cursor-pointer'
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
                                    }`}>
                                    <input type="checkbox" checked={checked} disabled={locked}
                                        onChange={() => toggleKader(k.id)}
                                        className="w-4 h-4 accent-emerald-600 shrink-0 disabled:cursor-not-allowed" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800 truncate">{k.nama}</span>
                                            <span className={`inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${
                                                effectiveCount >= MAX_MENTORS_PER_KADER
                                                    ? 'bg-rose-50 text-rose-600 ring-rose-200'
                                                    : effectiveCount > 0
                                                        ? 'bg-indigo-50 text-indigo-600 ring-indigo-200'
                                                        : 'bg-slate-50 text-slate-400 ring-slate-200'
                                            }`}>
                                                {effectiveCount}/{MAX_MENTORS_PER_KADER} mentor
                                            </span>
                                            {crossBU && (
                                                <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200">
                                                    Lintas BU
                                                </span>
                                            )}
                                            {!!k.batch_started && (
                                                <span title="Perubahan mentor wajib disertai dokumen pendukung"
                                                    className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200">
                                                    Batch berjalan
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-xs truncate ${crossBU ? 'text-amber-700' : 'text-slate-500'}`}>
                                            {k.nik} · {k.bu || k.company_code} {k.divisi_name ? `· ${k.divisi_name}` : ''}
                                        </div>
                                        {otherMentors.length > 0 && (
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                Mentor lain: <span className="text-slate-600">{otherMentors.map((m) => m.nama).join(', ')}</span>
                                                {locked && <span className="ml-1 text-rose-500 font-medium">· sudah penuh</span>}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    {/* Hasil ada tapi masih ada yang cocok di BU lain — tawarkan saat
                        admin sedang mencari, bukan sebagai noise permanen. */}
                    {filteredKaders.length > 0 && hiddenOtherBU > 0 && assignSearch.trim() && (
                        <div className="mt-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">{hiddenOtherBU} kader</span> lain yang cocok ada di BU lain —{' '}
                            <button type="button" onClick={() => setShowOtherBU(true)}
                                className="font-medium text-amber-600 hover:text-amber-700 underline underline-offset-2">
                                Tampilkan
                            </button>
                        </div>
                    )}

                    {/* Data batch di halaman bisa usang (mis. batch baru mulai hari ini) —
                        tetap tampilkan penolakan server agar admin tahu harus memuat ulang. */}
                    {!needsDoc && (assignErrors.dokumen || assignErrors.alasan) && (
                        <div className="mt-3 text-xs text-red-600">
                            {assignErrors.dokumen || assignErrors.alasan} Muat ulang halaman lalu coba lagi.
                        </div>
                    )}

                    {riwayatMentor.length > 0 && (
                        <div className="mt-3">
                            <button type="button" onClick={() => setShowRiwayat((v) => !v)}
                                className="text-xs font-medium text-slate-600 hover:text-slate-800">
                                {showRiwayat ? '▾' : '▸'} Riwayat Pergantian ({riwayatMentor.length})
                            </button>
                            {showRiwayat && (
                                <div className="mt-2 max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left font-medium">Tanggal</th>
                                                <th className="px-2 py-1.5 text-left font-medium">Kader</th>
                                                <th className="px-2 py-1.5 text-left font-medium">Aksi</th>
                                                <th className="px-2 py-1.5 text-left font-medium">Alasan</th>
                                                <th className="px-2 py-1.5" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {riwayatMentor.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="px-2 py-1.5 whitespace-nowrap text-slate-600">
                                                        {formatTanggal(r.created_at)}
                                                        {r.created_by_name && <div className="text-[10px] text-slate-400">{r.created_by_name}</div>}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-slate-700">{r.kader_nama || '—'}</td>
                                                    <td className="px-2 py-1.5">
                                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            r.aksi === 'ASSIGN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                            {r.aksi === 'ASSIGN' ? 'Tambah' : 'Lepas'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1.5 text-slate-600">{r.alasan || '—'}</td>
                                                    <td className="px-2 py-1.5 text-right">
                                                        <button type="button"
                                                            onClick={() => setPreviewDoc({ nama_file: r.nama_file, url: pergantianDocUrl(r.id) })}
                                                            className="font-medium text-blue-600 hover:text-blue-700">
                                                            Lihat
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    </div>

                    {/* Kolom kanan (lg+) / langkah kedua (mobile): pergantian mentor saat batch
                        sudah berjalan wajib dokumen pendukung + alasan. Selalu ter-mount selama
                        needsDoc supaya file yang dipilih tidak hilang saat pindah langkah. */}
                    {needsDoc && (
                        <div className={step === 'dokumen' ? 'block' : 'hidden lg:block'}>
                            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 lg:sticky lg:top-0">
                                <div className="text-sm font-semibold text-amber-800">
                                    Batch sudah berjalan — pergantian mentor wajib disertai dokumen pendukung
                                </div>
                                <div className="text-xs text-amber-700 mt-0.5 mb-2">
                                    Kader terdampak: {terdampak.map((k) => k.nama).join(', ')}
                                </div>
                                <FormField label="Dokumen Pendukung (PDF, maks. 2 MB)" error={assignErrors.dokumen}>
                                    <input ref={assignFileRef} type="file" accept="application/pdf,.pdf"
                                        onChange={onPickDokumen}
                                        className="block w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200" />
                                </FormField>
                                <FormField label="Alasan Pergantian" error={assignErrors.alasan}>
                                    <textarea rows={4} maxLength={500} value={assignAlasan}
                                        onChange={(e) => setAssignAlasan(e.target.value)}
                                        placeholder="Mis. mentor mutasi / resign, penyesuaian penempatan, ..."
                                        className={inputCls} />
                                    <div className="text-[11px] text-slate-400 text-right">{assignAlasan.length}/500</div>
                                </FormField>
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Riwayat Pergantian Mentor — semua mentor, satu baris per submit berdokumen. */}
            <Modal
                open={riwayatOpen}
                onClose={() => setRiwayatOpen(false)}
                title="Riwayat Pergantian Mentor"
                size="3xl"
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <p className="text-xs text-slate-500">
                        Perubahan mentor saat batch sudah berjalan, beserta dokumen pendukung & alasannya.
                    </p>
                    <input type="text" placeholder="Cari mentor / kader / alasan"
                        value={riwayatSearch}
                        onChange={(e) => { setRiwayatSearch(e.target.value); setRiwayatPage(1); }}
                        className={`${inputCls} sm:max-w-xs`} />
                </div>

                {riwayatFiltered.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-400">
                        {riwayatSemua.length === 0 ? 'Belum ada riwayat pergantian mentor.' : 'Tidak ada riwayat yang cocok.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                                    <th className="px-3 py-2 text-left font-semibold">Mentor</th>
                                    <th className="px-3 py-2 text-left font-semibold">Perubahan Kader</th>
                                    <th className="px-3 py-2 text-left font-semibold">Alasan</th>
                                    <th className="px-3 py-2 text-right font-semibold">Dokumen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {riwayatPageRows.map((g) => (
                                    <tr key={g.key} className="align-top">
                                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                                            {formatTanggal(g.created_at)}
                                            {g.created_by_name && (
                                                <div className="text-[11px] text-slate-400">oleh {g.created_by_name}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-slate-800">{g.mentor_nama || '—'}</td>
                                        <td className="px-3 py-2.5 space-y-1">
                                            {g.tambah.length > 0 && (
                                                <div className="text-xs">
                                                    <span className="mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">Tambah</span>
                                                    <span className="text-slate-700">{g.tambah.join(', ')}</span>
                                                </div>
                                            )}
                                            {g.lepas.length > 0 && (
                                                <div className="text-xs">
                                                    <span className="mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600">Lepas</span>
                                                    <span className="text-slate-700">{g.lepas.join(', ')}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600 whitespace-pre-line max-w-xs">{g.alasan || '—'}</td>
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                            <button type="button"
                                                onClick={() => setPreviewDoc({ nama_file: g.nama_file, url: pergantianDocUrl(g.docId) })}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                                                Lihat PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {riwayatFiltered.length > RIWAYAT_PER_PAGE && (
                    <LocalPagination
                        page={riwayatCurrentPage}
                        totalPages={riwayatTotalPages}
                        total={riwayatFiltered.length}
                        perPage={RIWAYAT_PER_PAGE}
                        onPageChange={setRiwayatPage}
                    />
                )}
            </Modal>

            <FilePreviewModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} file={previewDoc} />
        </AppLayout>
    );
}
