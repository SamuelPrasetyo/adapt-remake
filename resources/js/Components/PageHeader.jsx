// PageHeader: judul halaman + breadcrumb + tombol aksi.
// Props: { title, breadcrumb?, actions? }
import React from 'react';

export default function PageHeader({ title, breadcrumb, actions }) {
    return (
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
                {breadcrumb && <div className="text-xs text-slate-500 mb-1">{breadcrumb}</div>}
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
    );
}
