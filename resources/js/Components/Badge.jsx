// Badge: label kecil dengan variant warna.
// Props: { label, variant?: 'success' | 'danger' | 'warning' | 'info' | 'default' }
import React from 'react';

const STYLES = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    danger:  'bg-red-50 text-red-700 ring-red-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    info:    'bg-blue-50 text-blue-700 ring-blue-200',
    default: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function Badge({ label, variant = 'default' }) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${
                STYLES[variant] || STYLES.default
            }`}
        >
            {label}
        </span>
    );
}
