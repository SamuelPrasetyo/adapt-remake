// Master User — DataTable + 3 modal berfungsi (Tambah, Edit, Generate Kader).
import React, { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import PageHeader from '@/Components/PageHeader';
import DataTable, { renderStatusBadge, renderOnlineDot } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';

function IconBtn({ title, color = 'blue', onClick, children }) {
    const palette = {
        blue:   'bg-blue-50 text-blue-600 hover:bg-blue-100',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
        amber:  'bg-amber-50 text-amber-600 hover:bg-amber-100',
        red:    'bg-red-50 text-red-600 hover:bg-red-100',
    };
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition ${palette[color]}`}
        >
            {children}
        </button>
    );
}

function EyeIcon({ open }) {
    return open ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    );
}

function TambahModal({ open, onClose, kaders, companys }) {
    const [userType, setUserType] = useState('Kader');
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);
    const form = useForm({
        nik_kader: '',
        nik_mentor: '',
        company_code: '',
        name: '',
        password: '',
        password2: '',
        type: 'Kader',
    });

    const handleSwitch = (t) => {
        setUserType(t);
        setShowPwd(false);
        setShowPwd2(false);
        form.setData({
            ...form.data,
            type: t,
            password: '',
            password2: '',
            nik_kader: t === 'Mentor' ? '' : form.data.nik_kader,
            nik_mentor: t === 'Kader' ? '' : form.data.nik_mentor,
            company_code: t === 'Kader' ? '' : form.data.company_code,
            name: t === 'Kader' ? '' : form.data.name,
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (form.data.password !== form.data.password2) {
            alert('Konfirmasi password tidak cocok');
            return;
        }
        form.post('/user/store', {
            onSuccess: () => {
                form.reset();
                setUserType('Kader');
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tambah Data User"
            size="lg"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={form.processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition shadow-sm shadow-blue-500/30"
                    >
                        {form.processing ? 'Menyimpan...' : 'Submit'}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="flex gap-6">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="userType"
                            checked={userType === 'Kader'}
                            onChange={() => handleSwitch('Kader')}
                            className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Kader</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="radio"
                            name="userType"
                            checked={userType === 'Mentor'}
                            onChange={() => handleSwitch('Mentor')}
                            className="text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Mentor</span>
                    </label>
                </div>

                {userType === 'Kader' ? (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">NIK Kader</label>
                        <select
                            value={form.data.nik_kader}
                            onChange={(e) => form.setData('nik_kader', e.target.value)}
                            className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm"
                        >
                            <option value="">-- Pilih Kader --</option>
                            {kaders.map((k) => (
                                <option key={k.nik} value={k.nik}>
                                    {k.nik} - {k.nama}
                                </option>
                            ))}
                        </select>
                        {form.errors.nik_kader && (
                            <p className="mt-1 text-xs text-red-600">{form.errors.nik_kader}</p>
                        )}
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">NIK Mentor</label>
                            <input
                                type="text"
                                placeholder="nomor induk karyawan"
                                value={form.data.nik_mentor}
                                onChange={(e) => form.setData('nik_mentor', e.target.value)}
                                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bisnis Unit</label>
                            <select
                                value={form.data.company_code}
                                onChange={(e) => form.setData('company_code', e.target.value)}
                                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm"
                            >
                                <option value="">-- Pilih Bisnis Unit --</option>
                                {companys.map((c) => (
                                    <option key={c.company_code} value={c.company_code}>
                                        {c.company_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama</label>
                            <input
                                type="text"
                                placeholder="nama user"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm"
                            />
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi</label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                placeholder="kata sandi"
                                autoComplete="new-password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm pr-9"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd((v) => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPwd} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi Kata Sandi</label>
                        <div className="relative">
                            <input
                                type={showPwd2 ? 'text' : 'password'}
                                placeholder="ulangi kata sandi"
                                autoComplete="new-password"
                                value={form.data.password2}
                                onChange={(e) => form.setData('password2', e.target.value)}
                                className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm pr-9"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd2((v) => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                            >
                                <EyeIcon open={showPwd2} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function EditModal({ open, onClose, row }) {
    const form = useForm({ nama: row?.name || '' });

    React.useEffect(() => {
        if (row) form.setData('nama', row.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [row?.id]);

    const submit = (e) => {
        e.preventDefault();
        form.put(`/user/update/${row.id}`, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit User"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={form.processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition shadow-sm shadow-blue-500/30"
                    >
                        {form.processing ? 'Menyimpan...' : 'Update'}
                    </button>
                </>
            }
        >
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama</label>
                <input
                    type="text"
                    placeholder="nama user"
                    value={form.data.nama}
                    onChange={(e) => form.setData('nama', e.target.value)}
                    className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/30 text-sm"
                />
            </div>
        </Modal>
    );
}

function GenerateKaderModal({ open, onClose, kadersUnassigned }) {
    const hasUnassigned = kadersUnassigned && kadersUnassigned.length > 0;

    const handleGenerate = () => {
        router.get('/user/generatekader');
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={hasUnassigned ? 'Generate Akun Kader' : 'Informasi'}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        Close
                    </button>
                    {hasUnassigned && (
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition shadow-sm shadow-blue-500/30"
                        >
                            Generate
                        </button>
                    )}
                </>
            }
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        hasUnassigned ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={
                                hasUnassigned
                                    ? 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    : 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                            }
                        />
                    </svg>
                </div>
                <div className="flex-1">
                    {hasUnassigned ? (
                        <>
                            <p className="text-sm text-slate-700 mb-2">
                                Kader berikut belum memiliki akun, apakah ingin dibuatkan?
                            </p>
                            <ul className="text-sm text-slate-600 space-y-0.5 max-h-48 overflow-y-auto bg-slate-50 rounded-lg p-3">
                                {kadersUnassigned.map((k) => (
                                    <li key={k.nik}>
                                        • {k.nama} <span className="text-slate-400 text-xs">({k.nik})</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="text-sm text-slate-700">Semua Kader Sudah Memiliki Akun.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default function UserIndex({ users = [], kaders = [], companys = [], kadersUnassigned = [] }) {
    const { props } = usePage();
    const authUser = props?.auth?.user;
    const isAdmin = authUser?.type === 'Admin';

    const [tambahOpen, setTambahOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [generateOpen, setGenerateOpen] = useState(false);

    const data = users.map((u, i) => ({ ...u, no: i + 1 }));

    const columns = [
        { key: 'no',    label: 'NO',          width: '60px', align: 'center' },
        { key: 'nik',   label: 'NIK',         sortable: true, align: 'center' },
        { key: 'name',  label: 'NAMA',        sortable: true },
        {
            key: 'type',
            label: 'TYPE',
            sortable: true,
            align: 'center',
            render: (v) => (
                <Badge
                    label={v}
                    variant={v === 'Kader' ? 'info' : v === 'Mentor' ? 'warning' : 'default'}
                />
            ),
        },
        { key: 'bu',     label: 'BISNIS UNIT', sortable: true, align: 'center' },
        {
            key: 'status',
            label: 'STATUS',
            sortable: true,
            align: 'center',
            render: (v) => renderStatusBadge(v),
        },
        {
            key: 'last_activity',
            label: 'ONLINE',
            align: 'center',
            render: (v) => renderOnlineDot(v),
        },
    ];

    const openEdit = (row) => {
        setEditRow(row);
        setEditOpen(true);
    };

    const handleChangeStatus = (row) => {
        if (confirm('Apakah anda yakin ingin mengubah status user ini?')) {
            router.post(`/user/change_status/${row.id}`);
        }
    };

    const handleResetPassword = (row) => {
        if (confirm('Apakah anda yakin ingin mereset password user ini?')) {
            router.post(`/user/resetpassword/${row.id}`);
        }
    };

    const actions = (row) => {
        if (!isAdmin || row.id === authUser?.id) {
            return (
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" title="No actions" />
            );
        }
        return (
            <div className="inline-flex items-center gap-1.5">
                <IconBtn title="Edit Nama" color="blue" onClick={() => openEdit(row)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.6-9.4z" />
                    </svg>
                </IconBtn>
                <IconBtn title="Change Status" color="amber" onClick={() => handleChangeStatus(row)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </IconBtn>
                {(row.type === 'Mentor' || row.type === 'Kader') && (
                    <IconBtn title="Reset Password" color="indigo" onClick={() => handleResetPassword(row)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 11.001 4.001A2 2 0 0115 7zm0 0V5m0 6v2m0 0l-3 3m3-3l3 3M3 12a9 9 0 0118 0 9 9 0 01-18 0z" />
                        </svg>
                    </IconBtn>
                )}
            </div>
        );
    };

    const headerActions = (
        <>
            <button
                type="button"
                onClick={() => setGenerateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Kader
            </button>
            <button
                type="button"
                onClick={() => setTambahOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition shadow-sm shadow-blue-500/30"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah
            </button>
        </>
    );

    return (
        <AppLayout title="MASTER USER" breadcrumb="Master / User">
            <PageHeader title="Data User" breadcrumb="Kelola akun mentor dan kader" />

            <DataTable
                columns={columns}
                data={data}
                actions={actions}
                headerActions={headerActions}
                searchable
                emptyMessage="Belum ada user terdaftar"
            />

            <TambahModal
                open={tambahOpen}
                onClose={() => setTambahOpen(false)}
                kaders={kaders}
                companys={companys}
            />
            <EditModal open={editOpen} onClose={() => setEditOpen(false)} row={editRow} />
            <GenerateKaderModal
                open={generateOpen}
                onClose={() => setGenerateOpen(false)}
                kadersUnassigned={kadersUnassigned}
            />
        </AppLayout>
    );
}
