import React, { useState, useRef, useEffect } from "react";
import { Link, usePage, router, useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import Toast from "@/Components/Toast";
import { ADMIN_NAV, KADER_NAV } from "./navConfig";
import Icon from "./components/Icon";
import NavGroup from "./components/NavGroup";
import MentorSelectorCard from "./components/MentorSelectorCard";
import PasswordInput from "./components/PasswordInput";

export default function AppLayout({
    title,
    breadcrumb,
    headerActions,
    children,
}) {
    const { url, props } = usePage();
    const currentPath = url.split('?')[0];
    const user = props?.auth?.user;
    const flash = props?.flash;
    const mentors = props?.mentors;
    const selectedMentor = props?.selectedMentor;

    const nav = user?.type === "Kader" ? KADER_NAV : ADMIN_NAV;

    const [profileOpen, setProfileOpen] = useState(false);
    const [cpOpen, setCpOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const profileRef = useRef(null);
    const navRef = useRef(null);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const saved = sessionStorage.getItem('sidebar-scroll');
        if (saved) nav.scrollTop = parseInt(saved, 10);
        const onScroll = () => sessionStorage.setItem('sidebar-scroll', nav.scrollTop);
        nav.addEventListener('scroll', onScroll, { passive: true });
        return () => nav.removeEventListener('scroll', onScroll);
    }, []);
    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
        key: 0,
    });

    const cpForm = useForm({ password_lama: "", password: "", password2: "" });

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (flash?.success) {
            setToast((prev) => ({
                open: true,
                type: "success",
                message: flash.success,
                key: prev.key + 1,
            }));
        } else if (flash?.error) {
            const msg =
                typeof flash.error === "string"
                    ? flash.error
                    : "Terjadi kesalahan.";
            setToast((prev) => ({
                open: true,
                type: "error",
                message: msg,
                key: prev.key + 1,
            }));
        }
    }, [flash?.success, flash?.error]);

    const handleLogout = async () => {
        const csrf =
            document.querySelector('meta[name="csrf-token"]')?.content ?? "";
        try {
            await fetch("/logout", {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrf },
                credentials: "same-origin",
            });
        } catch (_) {}
        window.location.replace("/login");
    };

    const openCp = () => {
        setProfileOpen(false);
        cpForm.reset();
        setCpOpen(true);
    };

    const submitCp = (e) => {
        e.preventDefault();
        if (cpForm.data.password !== cpForm.data.password2) {
            cpForm.setError("password2", "Konfirmasi password tidak cocok");
            return;
        }
        cpForm.post(`/user/change_password/${user?.id}`, {
            onSuccess: () => {
                setCpOpen(false);
                cpForm.reset();
            },
        });
    };

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — fixed, independent scroll */}
            <aside className={`w-64 shrink-0 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                {/* Sidebar header — pinned, never scrolls */}
                <div className="shrink-0 px-6 py-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/30">
                                T
                            </div>
                            <div>
                                <div className="font-bold text-sm tracking-wide">
                                    TALENT & DEV
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                    ADAPT Program
                                </div>
                            </div>
                        </div>
                        {/* Close button — mobile only */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mentor Selector Card — Admin 021 + Mentor only */}
                <MentorSelectorCard
                    user={user}
                    mentors={mentors}
                    selectedMentor={selectedMentor}
                    currentUrl={currentPath}
                />

                {/* Nav — scrolls independently when overflow */}
                <nav ref={navRef} className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {nav.map((item, i) => {
                        if (item.type === "section") {
                            const isAdmin = user?.type === "Admin";
                            const isAdmin021 = isAdmin && user?.company_code === "021";
                            const isMentor = user?.type === "Mentor";
                            const nextSectionIdx = nav.slice(i + 1).findIndex((n) => n.type === "section");
                            const slice = nextSectionIdx === -1 ? nav.slice(i + 1) : nav.slice(i + 1, i + 1 + nextSectionIdx);
                            const sectionVisible = slice.some((next) => {
                                if (next.type === "group") {
                                    return next.children.some((c) => {
                                        if (c.requires === "admin021") return isAdmin021;
                                        if (c.requires === "admin") return isAdmin;
                                        return true;
                                    });
                                }
                                if (next.requires === "admin") return isAdmin;
                                if (next.requires === "admin021") return isAdmin021;
                                if (next.requires === "mentor_or_admin021") return isMentor || isAdmin021;
                                if (next.requires === "mentor_only") return isMentor;
                                return true;
                            });
                            if (!sectionVisible) return null;
                            return (
                                <p key={i} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                                    {item.label}
                                </p>
                            );
                        }

                        if (item.type === "group")
                            return (
                                <NavGroup
                                    key={i}
                                    item={item}
                                    currentUrl={currentPath}
                                    user={user}
                                />
                            );

                        if (item.requires === "admin021") {
                            if (!(user?.type === "Admin" && user?.company_code === "021")) return null;
                        }

                        if (item.requires === "mentor_or_admin021") {
                            const ok = user?.type === "Mentor" ||
                                (user?.type === "Admin" && user?.company_code === "021");
                            if (!ok) return null;
                        }

                        if (item.requires === "mentor_only") {
                            if (user?.type !== "Mentor") return null;
                        }

                        const isActive =
                            currentPath === item.match ||
                            currentPath.startsWith(item.match + "/");
                        const navHref = item.preserveMentor && selectedMentor
                            ? `${item.href}?mentor_id=${selectedMentor.id}`
                            : item.href;
                        return (
                            <Link
                                key={i}
                                href={navHref}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                    isActive
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                <Icon name={item.icon} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content — offset by sidebar width on desktop */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Header — fixed, stays on top while page scrolls */}
                <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-20">
                    <div className="flex items-center gap-3">
                        {/* Hamburger button — mobile only */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-sm lg:text-lg font-semibold tracking-wide uppercase text-slate-900">
                                {title || "TALENT & DEVELOPMENT"}
                            </h1>
                            {breadcrumb && (
                                <div className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                                    {breadcrumb}
                                </div>
                            )}
                        </div>
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
                                        {user?.name?.charAt(0)?.toUpperCase() ||
                                            "U"}
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-32">
                                        {user?.name || "—"}
                                    </p>
                                    <p className="text-xs text-slate-500 leading-tight">
                                        {user?.type || "—"}
                                    </p>
                                </div>
                                <Icon
                                    name="chevron"
                                    className={`w-4 h-4 text-slate-400 transition-transform ${
                                        profileOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-14 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                    <div className="py-1">
                                        {user?.type !== "Mentor" && (
                                            <button
                                                type="button"
                                                onClick={openCp}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                <Icon
                                                    name="key"
                                                    className="w-4 h-4 text-slate-400"
                                                />
                                                Ganti Password
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                                        >
                                            <Icon
                                                name="logout"
                                                className="w-4 h-4"
                                            />
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

                <Toast
                    key={toast.key}
                    open={toast.open}
                    type={toast.type}
                    message={toast.message}
                    onClose={() =>
                        setToast((prev) => ({ ...prev, open: false }))
                    }
                />

                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>

                <footer className="px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
                    2024 © IT Mekar Armada Investama
                </footer>
            </div>

            {/* Change Password Modal */}
            <Modal
                open={cpOpen}
                onClose={() => {
                    setCpOpen(false);
                    cpForm.reset();
                    cpForm.clearErrors();
                }}
                title="Ganti Password"
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setCpOpen(false);
                                cpForm.reset();
                                cpForm.clearErrors();
                            }}
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
                            {cpForm.processing ? "Menyimpan..." : "Simpan"}
                        </button>
                    </>
                }
            >
                <form id="cp-form" onSubmit={submitCp}>
                    <PasswordInput
                        id="password_lama"
                        label="Password Lama"
                        value={cpForm.data.password_lama}
                        onChange={(e) =>
                            cpForm.setData("password_lama", e.target.value)
                        }
                        error={cpForm.errors.password_lama}
                    />
                    <PasswordInput
                        id="password_baru"
                        label="Password Baru"
                        value={cpForm.data.password}
                        onChange={(e) =>
                            cpForm.setData("password", e.target.value)
                        }
                        error={cpForm.errors.password}
                    />
                    <PasswordInput
                        id="password2"
                        label="Konfirmasi Password Baru"
                        value={cpForm.data.password2}
                        onChange={(e) =>
                            cpForm.setData("password2", e.target.value)
                        }
                        error={cpForm.errors.password2}
                    />
                </form>
            </Modal>
        </div>
    );
}
