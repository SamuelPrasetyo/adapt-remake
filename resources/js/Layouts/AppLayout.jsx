import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';

const NAV = [
    { type: 'item', label: 'Dashboard', icon: 'home', href: '/dashboard', match: '/dashboard' },
    {
        type: 'group', label: 'Master', icon: 'grid',
        children: [
            { label: 'User',       href: '/user',       match: '/user' },
            { label: 'Divisi',     href: '/divisi',     match: '/divisi' },
            { label: 'Departemen', href: '/departemen', match: '/departemen' },
            { label: 'Batch',      href: '/batch',      match: '/batch' },
            { label: 'Nilai',      href: '/nilai',      match: '/nilai' },
            { label: 'Pertanyaan', href: '/pertanyaan', match: '/pertanyaan' },
            { label: 'Week',       href: '/week',       match: '/week' },
            { label: 'Kader',      href: '/kader',      match: '/kader' },
        ],
    },
    {
        type: 'group', label: 'Modul', icon: 'layers',
        children: [
            { label: 'Activity Log',      href: '/activity-log',       match: '/activity-log',      external: true },
            { label: 'Feedback',          href: '/feedbackadmin/index', match: '/feedbackadmin',     external: true },
            { label: 'Modul Pembelajaran', href: '/modul',             match: '/modul' },
            { label: 'Dokumen',           href: '/dokumen',            match: '/dokumen' },
        ],
    },
    {
        type: 'group', label: 'Report', icon: 'file',
        children: [
            { label: 'Learning Growth',   href: '/learning-index',       match: '/learning-index' },
            { label: 'Weekly Monitoring', href: '/ojt-index',            match: '/ojt-index' },
            { label: 'Feedback',          href: '/reportfeedback-index', match: '/reportfeedback-index' },
        ],
    },
];

function Icon({ name, className = 'w-5 h-5' }) {
    const paths = {
        home:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l9-9 9 9M5 10v10h14V10" />,
        grid:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
        layers:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm0 9l9 4.5-9 4.5-9-4.5L12 12z" />,
        file:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />,
        chevron: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />,
        logout:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />,
        key:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
        eye:     <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
        eyeoff:  <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>
            {paths[name]}
        </svg>
    );
}

function NavGroup({ item, currentUrl }) {
    const hasActive = item.children.some((c) => currentUrl === c.match || currentUrl.startsWith(c.match + '/'));
    const [open, setOpen] = useState(hasActive);
    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
                <span className="flex items-center gap-3">
                    <Icon name={item.icon} className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                </span>
                <Icon name="chevron" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="mt-1 ml-3 pl-4 border-l border-white/10 space-y-1">
                    {item.children.map((child) => {
                        const isActive = currentUrl === child.match || currentUrl.startsWith(child.match + '/');
                        const cls = `block px-3 py-1.5 text-sm rounded-md transition ${
                            isActive ? 'bg-blue-500/20 text-white font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`;
                        return child.external ? (
                            <a key={child.href} href={child.href} className={cls}>
                                {child.label}
                            </a>
                        ) : (
                            <Link key={child.href} href={child.href} className={cls}>
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PasswordInput({ id, label, value, onChange, error }) {
    const [show, setShow] = useState(false);
    return (
        <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    required
                    className="w-full pr-10 pl-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    <Icon name={show ? 'eyeoff' : 'eye'} className="w-4 h-4" />
                </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

export default function AppLayout({ title, breadcrumb, headerActions, children }) {
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const flash = props?.flash;

    const [profileOpen, setProfileOpen] = useState(false);
    const [cpOpen, setCpOpen] = useState(false);
    const profileRef = useRef(null);

    const cpForm = useForm({ password_lama: '', password: '', password2: '' });

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
        try {
            await fetch('/logout', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf },
                credentials: 'same-origin',
            });
        } catch (_) {}
        // replace() removes current entry from history → back button can't return here
        window.location.replace('/login');
    };

    const openCp = () => {
        setProfileOpen(false);
        cpForm.reset();
        setCpOpen(true);
    };

    const submitCp = (e) => {
        e.preventDefault();
        if (cpForm.data.password !== cpForm.data.password2) {
            cpForm.setError('password2', 'Konfirmasi password tidak cocok');
            return;
        }
        cpForm.post(`/user/change_password/${user?.id}`, {
            onSuccess: () => { setCpOpen(false); cpForm.reset(); },
        });
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar — fixed, independent scroll */}
            <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen z-40">
                {/* Sidebar header — pinned, never scrolls */}
                <div className="shrink-0 px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/30">
                            T
                        </div>
                        <div>
                            <div className="font-bold text-sm tracking-wide">TALENT & DEV</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">ADAPT Program</div>
                        </div>
                    </div>
                </div>

                {/* Nav — scrolls independently when overflow */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV.map((item, i) => {
                        if (item.type === 'group') return <NavGroup key={i} item={item} currentUrl={url} />;
                        const isActive = url === item.match || url.startsWith(item.match + '/');
                        return (
                            <Link
                                key={i}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                    isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon name={item.icon} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

            </aside>

            {/* Main content — offset by sidebar width */}
            <div className="flex-1 flex flex-col min-w-0 ml-64">
                {/* Header — fixed, stays on top while page scrolls */}
                <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-30">
                    <div>
                        <h1 className="text-lg font-semibold tracking-wide uppercase text-slate-900">
                            {title || 'TALENT & DEVELOPMENT'}
                        </h1>
                        {breadcrumb && <div className="text-xs text-slate-500 mt-0.5">{breadcrumb}</div>}
                    </div>
                    <div className="flex items-center gap-4">
                        {headerActions}
                        {/* Profile: avatar + name always visible, click → dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-3 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition focus:outline-none"
                            >
                                <div className="relative shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-32">{user?.name || '—'}</p>
                                    <p className="text-xs text-slate-500 leading-tight">{user?.type || '—'}</p>
                                </div>
                                <Icon name="chevron" className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-14 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                    <div className="py-1">
                                        {user?.type !== 'Mentor' && (
                                            <button
                                                type="button"
                                                onClick={openCp}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                <Icon name="key" className="w-4 h-4 text-slate-400" />
                                                Ganti Password
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setProfileOpen(false); handleLogout(); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                                        >
                                            <Icon name="logout" className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Spacer — compensates for fixed header height */}
                <div className="h-16 shrink-0" />

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-8 mt-4 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-8 mt-4 px-4 py-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {typeof flash.error === 'string' ? flash.error : 'Terjadi kesalahan.'}
                    </div>
                )}

                <main className="flex-1 p-8 overflow-x-hidden">{children}</main>

                <footer className="px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
                    2024 © IT Mekar Armada Investama
                </footer>
            </div>

            {/* Change Password Modal */}
            <Modal
                open={cpOpen}
                onClose={() => { setCpOpen(false); cpForm.reset(); cpForm.clearErrors(); }}
                title="Ganti Password"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => { setCpOpen(false); cpForm.reset(); cpForm.clearErrors(); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="cp-form"
                            disabled={cpForm.processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {cpForm.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <form id="cp-form" onSubmit={submitCp}>
                    <PasswordInput
                        id="password_lama"
                        label="Password Lama"
                        value={cpForm.data.password_lama}
                        onChange={(e) => cpForm.setData('password_lama', e.target.value)}
                        error={cpForm.errors.password_lama}
                    />
                    <PasswordInput
                        id="password_baru"
                        label="Password Baru"
                        value={cpForm.data.password}
                        onChange={(e) => cpForm.setData('password', e.target.value)}
                        error={cpForm.errors.password}
                    />
                    <PasswordInput
                        id="password2"
                        label="Konfirmasi Password Baru"
                        value={cpForm.data.password2}
                        onChange={(e) => cpForm.setData('password2', e.target.value)}
                        error={cpForm.errors.password2}
                    />
                </form>
            </Modal>
        </div>
    );
}
