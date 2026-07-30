import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import Modal from '@/Components/Modal';

const COLS = [
    { key: '_no',  label: 'No',   width: '52px', render: (_, __, i) => i + 1 },
    { key: 'nik',  label: 'NIK',  sortable: true },
    {
        key: 'nik_ktp', label: 'NIK KTP', sortable: true,
        render: (v) => v
            ? <span className="font-mono text-xs">{v}</span>
            : <span className="text-slate-300 italic text-xs">—</span>,
    },
    { key: 'nama', label: 'Nama', sortable: true },
    { key: 'bu',   label: 'BU',   sortable: true },
    { key: 'divisi_name', label: 'Divisi',     sortable: true },
    { key: 'dept_name',   label: 'Departemen', sortable: true },
    { key: 'batch_name',  label: 'Batch',      sortable: true },
    { key: 'jenis_kelamin', label: 'JK',       align: 'center' },
];

// Tab Arsip: kolom operasional (divisi/dept) ditukar dengan info pengarsipan,
// karena yang dicari admin di sini adalah "siapa yang mengarsipkan, kapan".
const ARSIP_COLS = [
    ...COLS.filter((c) => !['divisi_name', 'dept_name', 'nik_ktp'].includes(c.key)),
    {
        key: 'deleted_at', label: 'Diarsipkan', sortable: true,
        render: (v, row) => (
            <div className="text-xs">
                <div className="text-slate-600">{v ? String(v).slice(0, 16).replace('T', ' ') : '—'}</div>
                <div className="text-slate-400">oleh {row.deleted_by_name ?? '—'}</div>
            </div>
        ),
    },
];

const TEMPLATE_COLS = [
    { name: 'batch',             note: 'Otomatis — jangan diubah', locked: true },
    { name: 'tahun',             note: 'Otomatis — jangan diubah', locked: true },
    { name: 'nama',              note: 'Nama lengkap kader' },
    { name: 'nik',               note: 'NIK (No. Induk Karyawan) unik' },
    { name: 'nik_ktp',           note: 'No. KTP 16 digit (opsional, unik)' },
    { name: 'jenis_kelamin',     note: 'L atau P' },
    { name: 'iq',                note: 'Angka, mis. 110' },
    { name: 'ipk',               note: 'Angka, mis. 3.45' },
    { name: 'company_shortname', note: 'WAJIB singkatan (mis. MAI)' },
    { name: 'divisi',            note: 'Sesuai nama di Master' },
    { name: 'departemen',        note: 'Sesuai nama di Master' },
];

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";
const readonlyCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed select-none";

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
    const colors = {
        blue:    'text-blue-600 hover:bg-blue-50',
        red:     'text-red-600 hover:bg-red-50',
        amber:   'text-amber-600 hover:bg-amber-50',
        emerald: 'text-emerald-600 hover:bg-emerald-50',
    };
    return (
        <button type="button" onClick={onClick} title={title}
            className={`p-1.5 rounded-lg transition ${colors[color]}`}>{children}</button>
    );
}

const Icon = {
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    archive: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    restore: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
};

function Svg({ children, className = 'w-4 h-4' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
    );
}

// Rincian data yang akan ikut terhapus, hasil preflight /kader/{id}/dependencies.
function ImpactList({ info, title }) {
    if (!info?.groups?.length) return null;
    return (
        <div className="mt-3">
            {title && (
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            )}
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {info.groups.map((g) => (
                    <li key={g.key} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                        <span className="text-slate-600">{g.label}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                            {g.count}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-1.5 text-right text-xs text-slate-500">
                Total <b className="text-slate-700">{info.total}</b> baris data
                {info.files > 0 && <> + <b className="text-slate-700">{info.files}</b> file upload</>}
            </p>
        </div>
    );
}

function TabBtn({ active, onClick, children, count }) {
    return (
        <button type="button" onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                active ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {children}
            {count > 0 && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>{count}</span>
            )}
        </button>
    );
}

// Dropdown dengan search — dirender via portal ke document.body agar tidak
// terpotong oleh overflow-y-auto milik modal.
function SearchableSelect({ value, onChange, options, placeholder }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const [pos, setPos]       = useState({});
    const btnRef  = useRef(null);
    const dropRef = useRef(null);

    // Hitung posisi fixed berdasarkan letak tombol saat dibuka.
    const calcPos = () => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };

    // Tutup dropdown saat klik di luar tombol + dropdown.
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                dropRef.current && !dropRef.current.contains(e.target) &&
                btnRef.current  && !btnRef.current.contains(e.target)
            ) {
                setOpen(false);
                setSearch('');
            }
        };
        // Tutup saat modal/halaman di-scroll, tapi biarkan scroll di dalam dropdown sendiri.
        const closeOnScroll = (e) => {
            if (dropRef.current && dropRef.current.contains(e.target)) return;
            setOpen(false);
            setSearch('');
        };
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', closeOnScroll, true);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', closeOnScroll, true);
        };
    }, [open]);

    const handleToggle = () => {
        if (!open) calcPos();
        setOpen((v) => !v);
        setSearch('');
    };

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setSearch('');
    };

    const selected = options.find((o) => String(o.value) === String(value));
    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                className={`${inputCls} flex items-center justify-between text-left`}
            >
                <span className={`truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {selected ? selected.label : (placeholder || 'Pilih...')}
                </span>
                <svg className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && createPortal(
                <div
                    ref={dropRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
                    className="bg-white border border-slate-200 rounded-lg shadow-xl"
                >
                    <div className="p-2 border-b border-slate-100">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari..."
                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                    </div>
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-slate-400 italic">Tidak ada data</li>
                        ) : filtered.map((o) => (
                            <li key={o.value}
                                onMouseDown={() => handleSelect(o)}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${
                                    String(o.value) === String(value)
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-slate-700'
                                }`}
                            >
                                {o.label}
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </>
    );
}

// Field set dipakai bersama modal Tambah & Edit.
// id_batch sudah di-set oleh parent saat modal dibuka — field ini hanya read-only display.
function KaderFields({ form, companys, divisis, departemens, batchs }) {
    const batchRecord = batchs.find((b) => String(b.id_batch) === String(form.data.id_batch));
    const batchLabel  = batchRecord
        ? `Batch ${batchRecord.nama_batch} / ${batchRecord.tahun_batch}`
        : '—';

    const buOptions   = companys.map((c) => {
        const short = c.company_shortname && c.company_shortname !== '-' ? c.company_shortname : null;
        return { value: c.company_code, label: short ? `${short} - ${c.company_name}` : c.company_name };
    });
    const divisiOptions = divisis.map((d) => ({ value: d.id, label: d.nama }));
    const deptOptions   = departemens.map((d) => ({ value: d.id, label: d.nama }));

    return (
        <div className="grid grid-cols-2 gap-x-4">
            <Field label="Nama" error={form.errors.nama}>
                <input type="text" value={form.data.nama}
                    onChange={(e) => form.setData('nama', e.target.value)} className={inputCls} />
            </Field>
            <Field label="NIK" error={form.errors.nik}>
                <input type="text" value={form.data.nik}
                    onChange={(e) => form.setData('nik', e.target.value)} className={inputCls} />
            </Field>
            <Field label="NIK KTP" error={form.errors.nik_ktp}>
                <input type="text" inputMode="numeric" maxLength={20} value={form.data.nik_ktp}
                    onChange={(e) => form.setData('nik_ktp', e.target.value)} className={inputCls}
                    placeholder="No. KTP untuk tautan data kandidat" />
                <p className="text-[11px] text-slate-400 mt-0.5">Menautkan kader ke data kandidat (Career MAI). Opsional.</p>
            </Field>
            <Field label="Jenis Kelamin" error={form.errors.jenis_kelamin}>
                <select value={form.data.jenis_kelamin}
                    onChange={(e) => form.setData('jenis_kelamin', e.target.value)} className={inputCls}>
                    <option value="">Pilih...</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </select>
            </Field>

            {/* Batch — read-only, hanya batch berjalan yang boleh diinput */}
            <Field label="Batch (periode berjalan)" error={form.errors.id_batch}>
                <input type="text" value={batchLabel} readOnly className={readonlyCls}
                    title="Batch sudah dikunci sesuai periode berjalan" />
            </Field>

            <Field label="Bisnis Unit" error={form.errors.company_code}>
                <SearchableSelect
                    value={form.data.company_code}
                    onChange={(v) => form.setData('company_code', v)}
                    options={buOptions}
                    placeholder="Pilih Bisnis Unit..."
                />
            </Field>
            <Field label="Divisi" error={form.errors.id_divisi}>
                <SearchableSelect
                    value={form.data.id_divisi}
                    onChange={(v) => form.setData('id_divisi', v)}
                    options={divisiOptions}
                    placeholder="Pilih Divisi..."
                />
            </Field>
            <Field label="Departemen" error={form.errors.id_departemen}>
                <SearchableSelect
                    value={form.data.id_departemen}
                    onChange={(v) => form.setData('id_departemen', v)}
                    options={deptOptions}
                    placeholder="Pilih Departemen..."
                />
            </Field>
            <Field label="IQ" error={form.errors.iq}>
                <input type="number" value={form.data.iq}
                    onChange={(e) => form.setData('iq', e.target.value)} className={inputCls} />
            </Field>
            <Field label="IPK" error={form.errors.ipk}>
                <input type="number" step="0.01" value={form.data.ipk}
                    onChange={(e) => form.setData('ipk', e.target.value)} className={inputCls} />
            </Field>
        </div>
    );
}

const EMPTY_KADER = {
    nama: '', nik: '', nik_ktp: '', jenis_kelamin: '', iq: '', ipk: '',
    id_batch: '', id_divisi: '', id_departemen: '', company_code: '',
};

export default function KaderIndex({
    kaders, kadersArsip = [], canViewArsip = false, canPurge = false,
    companys, divisis, departemens, batchs, currentBatch,
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen]     = useState(false);
    const [editRow, setEditRow]       = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [exportOpen, setExportOpen] = useState(false);
    const exportRef = useRef(null);

    // ?tab=arsip dipakai UserController::change_status untuk mengarahkan admin
    // ke sini saat ia mencoba mengaktifkan akun kader yang datanya terarsip.
    const [tab, setTab] = useState(() => {
        const wanted = new URLSearchParams(window.location.search).get('tab');
        return wanted === 'arsip' && canViewArsip ? 'arsip' : 'aktif';
    });
    const isArsip = tab === 'arsip';

    // Modal hapus: `info` diisi hasil preflight, jadi admin melihat persis apa
    // yang akan hilang sebelum memutuskan. null = masih memuat.
    const [delRow, setDelRow]   = useState(null);
    const [delInfo, setDelInfo] = useState(null);
    const [busy, setBusy]       = useState(false);

    // Modal hapus permanen (khusus Admin MAI, dari tab Arsip).
    const [purgeRow, setPurgeRow]   = useState(null);
    const [purgeInfo, setPurgeInfo] = useState(null);
    const [purgeNik, setPurgeNik]   = useState('');

    const loadImpact = async (row, setInfo) => {
        setInfo(null);
        try {
            const res = await fetch(`/kader/${row.id}/dependencies`, {
                headers: { Accept: 'application/json' },
            });
            setInfo(await res.json());
        } catch {
            setInfo({ error: true });
        }
    };

    const openDelete = (row) => { setDelRow(row); loadImpact(row, setDelInfo); };
    const closeDelete = () => { setDelRow(null); setDelInfo(null); };

    const openPurge = (row) => { setPurgeRow(row); setPurgeNik(''); loadImpact(row, setPurgeInfo); };
    const closePurge = () => { setPurgeRow(null); setPurgeInfo(null); setPurgeNik(''); };

    // Server menentukan sendiri arsip vs hapus permanen — tombol ini cuma memicu.
    const confirmDelete = () => {
        setBusy(true);
        router.delete(`/kader/delete/${delRow.id}`, {
            onFinish: () => { setBusy(false); closeDelete(); },
        });
    };

    // Pulihkan sekaligus mengaktifkan akun login — satu aksi, tidak perlu ke Master User.
    const confirmRestore = (row) => {
        if (!window.confirm(
            `Pulihkan kader "${row.nama}" dari arsip?\n\n`
            + 'Kader akan kembali muncul di daftar aktif dan akun loginnya diaktifkan kembali.'
        )) return;
        router.post(`/kader/${row.id}/restore`);
    };

    const confirmPurge = () => {
        setBusy(true);
        router.delete(`/kader/${purgeRow.id}/purge`, {
            data: { confirm_nik: purgeNik },
            onFinish: () => { setBusy(false); closePurge(); },
        });
    };

    // Tutup dropdown export saat klik di luar area tombol.
    useEffect(() => {
        if (!exportOpen) return;
        const onClick = (e) => {
            if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [exportOpen]);

    // Batch terbaru di atas agar batch berjalan mudah dijangkau.
    const exportBatches = [...(batchs ?? [])].sort(
        (a, b) => Number(b.nama_batch) - Number(a.nama_batch),
    );

    const createForm = useForm({ ...EMPTY_KADER });
    const editForm   = useForm({ ...EMPTY_KADER });

    const fieldProps = { companys, divisis, departemens, batchs };

    const openCreate = () => {
        createForm.clearErrors();
        createForm.setData({
            ...EMPTY_KADER,
            // Kunci ke batch berjalan — admin tidak boleh pilih batch lama.
            id_batch: currentBatch?.id_batch ?? '',
        });
        setCreateOpen(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post('/kader/store', {
            onSuccess: () => setCreateOpen(false),
        });
    };

    const openEdit = (row) => {
        setEditRow(row);
        editForm.clearErrors();
        editForm.setData({
            nama:          row.nama          ?? '',
            nik:           row.nik           ?? '',
            nik_ktp:       row.nik_ktp       ?? '',
            jenis_kelamin: row.jenis_kelamin ?? '',
            iq:            row.iq            ?? '',
            ipk:           row.ipk           ?? '',
            // Pertahankan batch asal kader saat edit — tidak dipaksa ke current.
            id_batch:      row.id_batch      ?? '',
            id_divisi:     row.id_divisi     ?? '',
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

    return (
        <AppLayout title="MASTER KADER" breadcrumb="Master / Kader">
            {isArsip && (
                <div className="mb-3 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <Svg className="w-4 h-4 shrink-0 mt-0.5">{Icon.archive}</Svg>
                    <p>
                        Kader di arsip tidak muncul di daftar aktif, laporan, maupun penugasan mentor, dan
                        akun loginnya dinonaktifkan — tapi <b>seluruh datanya masih utuh</b>. Memulihkan kader
                        sekaligus mengaktifkan kembali akun loginnya, jadi tidak perlu diaktifkan lagi di Master User.
                        {!canPurge && ' Penghapusan permanen beserta seluruh datanya dilakukan oleh Admin MAI yang ditunjuk.'}
                    </p>
                </div>
            )}

            <DataTable
                key={tab}
                columns={isArsip ? ARSIP_COLS : COLS}
                data={isArsip ? kadersArsip : kaders}
                emptyMessage={isArsip ? 'Tidak ada kader di arsip' : 'Tidak ada data'}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        {isArsip ? (
                            <>
                                <ActionBtn onClick={() => confirmRestore(row)} color="emerald"
                                    title="Pulihkan kader + aktifkan akun loginnya">
                                    <Svg>{Icon.restore}</Svg>
                                </ActionBtn>
                                {canPurge && (
                                    <ActionBtn onClick={() => openPurge(row)} color="red" title="Hapus permanen">
                                        <Svg>{Icon.trash}</Svg>
                                    </ActionBtn>
                                )}
                            </>
                        ) : (
                            <>
                                <ActionBtn onClick={() => openEdit(row)} color="blue" title="Edit">
                                    <Svg>{Icon.edit}</Svg>
                                </ActionBtn>
                                <ActionBtn onClick={() => openDelete(row)} color="red" title="Hapus">
                                    <Svg>{Icon.trash}</Svg>
                                </ActionBtn>
                            </>
                        )}
                    </div>
                )}
                headerActions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tab Arsip untuk semua Admin MAI; selain itu datanya tidak
                            dikirim server sama sekali. Tombol hapus permanennya
                            terpisah, lihat canPurge. */}
                        {canViewArsip && (
                            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                                <TabBtn active={!isArsip} onClick={() => setTab('aktif')}>Aktif</TabBtn>
                                <TabBtn active={isArsip} onClick={() => setTab('arsip')} count={kadersArsip.length}>
                                    Arsip
                                </TabBtn>
                            </div>
                        )}
                        {!isArsip && <><button onClick={openCreate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah
                        </button>
                        <div className="relative" ref={exportRef}>
                            <button type="button" onClick={() => setExportOpen((v) => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Export
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {exportOpen && (
                                <div className="absolute right-0 z-20 mt-1 w-56 py-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Export per Batch</div>
                                    {exportBatches.map((b) => (
                                        <a key={b.id_batch} href={`/kader/export?batch=${b.id_batch}`}
                                            onClick={() => setExportOpen(false)}
                                            className="flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50">
                                            <span>Batch {b.nama_batch}
                                                <span className="text-slate-400"> / {b.tahun_batch}</span>
                                            </span>
                                            {String(b.id_batch) === String(currentBatch?.id_batch) && (
                                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Berjalan</span>
                                            )}
                                        </a>
                                    ))}
                                    <div className="my-1 border-t border-slate-100" />
                                    <a href="/kader/export" onClick={() => setExportOpen(false)}
                                        className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50">
                                        Semua Batch
                                    </a>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button></>}
                    </div>
                }
            />

            {/* Tambah Modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah Kader" size="2xl"
                footer={
                    <>
                        <button type="button" onClick={() => setCreateOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" form="create-form" disabled={createForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Simpan</button>
                    </>
                }
            >
                <form id="create-form" onSubmit={submitCreate}>
                    <KaderFields form={createForm} {...fieldProps} />
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Kader" size="2xl"
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
                    <KaderFields form={editForm} {...fieldProps} />
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); }}
                title="Import Kader" size="xl"
                footer={
                    <>
                        <button type="button" onClick={() => { setImportOpen(false); setImportFile(null); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" form="import-form"
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition">Upload</button>
                    </>
                }
            >
                {/* Template guide */}
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-slate-800">Format Template Excel</h4>
                        <a href="/kader/template"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Download Template
                        </a>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                        Baris pertama harus berisi nama kolom persis seperti di bawah. Kolom <b>company_shortname</b>,
                        <b> divisi</b>, dan <b>departemen</b> harus cocok dengan data Master yang sudah ada.
                    </p>

                    {/* Catatan penting */}
                    <div className="mb-3 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="space-y-1">
                            <p>
                                Kolom <b>batch</b> dan <b>tahun</b> sudah otomatis terisi sesuai periode berjalan
                                {currentBatch ? <> (<b>Batch {currentBatch.nama_batch} / {currentBatch.tahun_batch}</b>)</> : null} saat template di-download. <b>Jangan diubah</b> — biarkan apa adanya.
                            </p>
                            <p>
                                Kolom <b>company_shortname</b> <b>wajib diisi singkatan company</b> (mis. <b>MAI</b>),
                                bukan nama panjang perusahaan.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-xs">
                            <thead>
                                <tr>
                                    {TEMPLATE_COLS.map((c) => (
                                        <th key={c.name}
                                            className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap ${
                                                c.locked ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                            }`}>
                                            {c.name}{c.locked && <span className="ml-1 text-amber-100">🔒</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-slate-200">
                                    {TEMPLATE_COLS.map((c) => (
                                        <td key={c.name}
                                            className={`px-2 py-1.5 whitespace-nowrap ${c.locked ? 'text-amber-700 font-medium' : 'text-slate-500'}`}>
                                            {c.note}
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200 bg-white">
                                    <td className="px-2 py-1.5 whitespace-nowrap font-semibold text-amber-700">{currentBatch?.nama_batch ?? '—'}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap font-semibold text-amber-700">{currentBatch?.tahun_batch ?? '—'}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">Budi Santoso</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">60320250001</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">3201234567890001</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">L</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">110</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">3.45</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">MAI</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">PRODUCTION</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">ASSEMBLY</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <form id="import-form" onSubmit={submitImport}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">File Excel (.xlsx)</label>
                    <input type="file" accept=".xlsx,.csv"
                        onChange={(e) => setImportFile(e.target.files[0])} required
                        className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                </form>
            </Modal>

            {/* Hapus — tingkatnya ditentukan hasil preflight, bukan pilihan admin.
                Kader bersih boleh langsung hilang; kader berdata hanya diarsipkan. */}
            <Modal open={!!delRow} onClose={closeDelete} title="Hapus Kader" size="lg"
                footer={
                    <>
                        <button type="button" onClick={closeDelete}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="button" onClick={confirmDelete} disabled={!delInfo || delInfo.error || busy}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition ${
                                delInfo?.blocking === 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                            }`}>
                            {delInfo?.blocking === 0 ? 'Hapus Permanen' : 'Arsipkan'}
                        </button>
                    </>
                }
            >
                {!delInfo && <p className="text-sm text-slate-500">Memeriksa data terkait…</p>}

                {delInfo?.error && (
                    <p className="text-sm text-red-600">Gagal memeriksa data terkait. Coba tutup dan ulangi.</p>
                )}

                {delInfo && !delInfo.error && (
                    <>
                        <p className="text-sm text-slate-700">
                            Anda akan menghapus <b>{delInfo.nama}</b>
                            <span className="font-mono text-xs text-slate-500"> ({delInfo.nik})</span>.
                        </p>

                        {delInfo.blocking === 0 ? (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                Kader ini <b>belum punya data terkait apa pun</b> — tidak ada penilaian, feedback,
                                dokumen, maupun progress modul. Karena itu kader ini akan
                                <b> dihapus permanen</b> beserta akun loginnya, dan <b>tidak bisa dipulihkan</b>.
                            </div>
                        ) : (
                            <>
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    Kader ini punya data terkait, jadi akan <b>dipindahkan ke Arsip</b> — belum ada
                                    yang dihapus sekarang, dan masih bisa dipulihkan. Akun loginnya dinonaktifkan.
                                </div>
                                <ImpactList info={delInfo}
                                    title="Data terkait yang akan ikut terhapus bila nanti dihapus permanen" />
                                <p className="mt-3 text-xs text-slate-500">
                                    {delInfo.can_purge
                                        ? 'Untuk menghapusnya sekaligus datanya, buka tab Arsip lalu pilih Hapus Permanen.'
                                        : 'Kader bisa dipulihkan lagi dari tab Arsip. Penghapusan permanen beserta data di atas dilakukan oleh Admin MAI yang ditunjuk.'}
                                </p>
                            </>
                        )}
                    </>
                )}
            </Modal>

            {/* Hapus permanen — pengelola Arsip, wajib mengetik ulang NIK kader. */}
            <Modal open={!!purgeRow} onClose={closePurge} title="Hapus Permanen" size="lg"
                footer={
                    <>
                        <button type="button" onClick={closePurge}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">Batal</button>
                        <button type="button" onClick={confirmPurge}
                            disabled={busy || !purgeInfo || purgeNik.trim() !== purgeInfo.nik}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                            Hapus Permanen
                        </button>
                    </>
                }
            >
                {!purgeInfo && <p className="text-sm text-slate-500">Memeriksa data terkait…</p>}

                {purgeInfo && (
                    <>
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                            <b>Tindakan ini tidak bisa dibatalkan.</b> Kader <b>{purgeInfo.nama}</b>
                            <span className="font-mono text-xs"> ({purgeInfo.nik})</span>, seluruh data di bawah,
                            {purgeInfo.files > 0 && <> {purgeInfo.files} file uploadnya,</>} dan akun loginnya akan
                            dihapus dari sistem. Kader ini tidak akan bisa dipulihkan lagi.
                        </div>

                        <ImpactList info={purgeInfo} title="Data terkait yang akan ikut terhapus" />

                        <p className="mt-3 text-xs text-slate-500">
                            Cadangan seluruh baris yang dihapus tetap disimpan sebagai file JSON di
                            <span className="font-mono"> storage/app/purged-kader/</span> untuk keperluan audit.
                        </p>

                        <label className="mt-4 block text-sm font-medium text-slate-700">
                            Ketik NIK <span className="font-mono font-semibold text-red-600">{purgeInfo.nik}</span> untuk mengonfirmasi
                        </label>
                        <input type="text" value={purgeNik} onChange={(e) => setPurgeNik(e.target.value)}
                            autoComplete="off" placeholder={purgeInfo.nik}
                            className="mt-1 w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500" />
                    </>
                )}
            </Modal>
        </AppLayout>
    );
}
