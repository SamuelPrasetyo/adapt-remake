import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const V = {
    success: {
        wrap:  'bg-emerald-50 border-emerald-200',
        text:  'text-emerald-800',
        bar:   'bg-emerald-400',
        barBg: 'bg-emerald-100',
        icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    error: {
        wrap:  'bg-red-50 border-red-200',
        text:  'text-red-800',
        bar:   'bg-red-400',
        barBg: 'bg-red-100',
        icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    warning: {
        wrap:  'bg-amber-50 border-amber-300',
        text:  'text-amber-800',
        bar:   'bg-amber-400',
        barBg: 'bg-amber-100',
        icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
    },
};

export default function Toast({ open, type = 'success', message, onClose, duration = 5000 }) {
    useEffect(() => {
        if (!open || !message) return;
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [open, message, onClose, duration]);

    if (!open || !message) return null;
    if (typeof document === 'undefined') return null;

    const v = V[type] ?? V.success;

    return createPortal(
        <div className="fixed top-5 right-5 z-9999 w-80 pointer-events-none">
            <div className={`toast-enter pointer-events-auto border rounded-xl shadow-lg overflow-hidden ${v.wrap}`}>
                <div className={`flex items-center gap-3 px-4 py-3.5 ${v.text}`}>
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {v.icon}
                    </svg>
                    <p className="text-sm font-medium flex-1">{message}</p>
                    <button type="button" onClick={onClose}
                        className="ml-1 opacity-50 hover:opacity-100 transition-opacity shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className={`h-1 ${v.barBg}`}>
                    <div className={`toast-bar h-full ${v.bar}`}
                        style={{ '--toast-duration': `${duration}ms` }} />
                </div>
            </div>
        </div>,
        document.body
    );
}
