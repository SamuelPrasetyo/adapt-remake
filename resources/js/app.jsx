import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';

// Show a fullscreen "session expired" screen instead of the raw Laravel 403 error page
router.on('invalid', (event) => {
    event.preventDefault();

    if (document.getElementById('session-expired-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'session-expired-overlay';
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:200002',
        'background:#0f172a',
        'display:flex', 'align-items:center', 'justify-content:center',
        'font-family:Inter,ui-sans-serif,system-ui,sans-serif',
    ].join(';');

    overlay.innerHTML = `
        <div style="text-align:center;color:#fff;padding:2rem;max-width:420px;width:100%">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem">
                <svg width="28" height="28" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <h1 style="font-size:1.5rem;font-weight:700;margin:0 0 .75rem">Sesi Telah Berakhir</h1>
            <p style="font-size:.9375rem;color:#94a3b8;line-height:1.6;margin:0 0 2rem">
                Sesi Anda sudah tidak aktif karena terlalu lama tidak digunakan atau koneksi internet terputus.<br>Silahkan login kembali untuk melanjutkan.
            </p>
            <a href="/login"
               style="display:inline-block;padding:.75rem 2rem;background:#3b82f6;color:#fff;border-radius:.5rem;font-size:.9375rem;font-weight:600;text-decoration:none;transition:background .15s">
                Login Kembali
            </a>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
});

createInertiaApp({
    title: (title) => (title ? `${title} · Talent & Development` : 'Talent & Development'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#3b82f6',
        showSpinner: false,
    },
});
