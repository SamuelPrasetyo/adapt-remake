// DataTable: tabel data reusable dengan sort, search, pagination client-side + server-side.
// Props:
//   columns:        [{ key, label, sortable?, render?(value, row, globalIndex), align?, width? }]
//   data:           array of rows
//   actions?:       (row) => ReactNode
//   searchable?:    boolean (default true)
//   exportable?:    boolean
//   onExport?:      () => void
//   pagination?:    Laravel paginator shape — jika ada, gunakan server pagination
//   onSearch?:      (query) => void
//   onSort?:        (key, dir) => void
//   loading?:       boolean
//   headerActions?: ReactNode
//   emptyMessage?:  string
//   perPage?:       number (default 10, hanya berlaku saat tidak ada prop pagination)
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';

function SortIcon({ active, dir }) {
    return (
        <span className="inline-flex flex-col ml-1 text-[8px] leading-none">
            <span className={active && dir === 'asc' ? 'text-blue-600' : 'text-slate-300'}>▲</span>
            <span className={active && dir === 'desc' ? 'text-blue-600' : 'text-slate-300'}>▼</span>
        </span>
    );
}

function LocalPagination({ page, totalPages, total, perPage, onPageChange }) {
    const from = Math.min((page - 1) * perPage + 1, total);
    const to   = Math.min(page * perPage, total);

    // Tampilkan maks 7 tombol halaman
    const pageNums = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageNums.push(i);
    } else {
        const start = Math.max(2, page - 2);
        const end   = Math.min(totalPages - 1, page + 2);
        pageNums.push(1);
        if (start > 2) pageNums.push('…');
        for (let i = start; i <= end; i++) pageNums.push(i);
        if (end < totalPages - 1) pageNums.push('…');
        pageNums.push(totalPages);
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 text-sm">
            <div className="text-slate-500">
                Menampilkan{' '}
                <span className="font-medium text-slate-900">{from}</span>–
                <span className="font-medium text-slate-900">{to}</span>{' '}
                dari <span className="font-medium text-slate-900">{total}</span> data
            </div>
            <div className="flex items-center gap-1 flex-wrap">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    ‹
                </button>
                {pageNums.map((n, i) =>
                    n === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
                    ) : (
                        <button
                            key={n}
                            onClick={() => onPageChange(n)}
                            className={`px-3 py-1.5 rounded-md text-sm transition ${
                                n === page
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {n}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default function DataTable({
    columns,
    data = [],
    actions,
    searchable = true,
    exportable = false,
    onExport,
    pagination,
    onSearch,
    onSort,
    loading = false,
    headerActions,
    emptyMessage = 'Tidak ada data',
    perPage = 10,
}) {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState({ key: null, dir: 'asc' });
    const [localPage, setLocalPage] = useState(1);

    // Reset ke halaman 1 saat search/sort berubah
    useEffect(() => { setLocalPage(1); }, [query, sort.key, sort.dir]);

    const processed = useMemo(() => {
        let rows = [...data];
        if (!onSearch && query) {
            const q = query.toLowerCase();
            rows = rows.filter((r) =>
                Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q))
            );
        }
        if (!onSort && sort.key) {
            rows.sort((a, b) => {
                const av = a[sort.key];
                const bv = b[sort.key];
                if (av == null) return 1;
                if (bv == null) return -1;
                if (av < bv) return sort.dir === 'asc' ? -1 : 1;
                if (av > bv) return sort.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return rows;
    }, [data, query, sort, onSearch, onSort]);

    const useServerPagination = !!pagination;

    // Rows yang ditampilkan (client-side slice jika tidak ada server pagination)
    const displayRows = useServerPagination
        ? processed
        : processed.slice((localPage - 1) * perPage, localPage * perPage);

    const totalLocalPages = Math.max(1, Math.ceil(processed.length / perPage));
    const showLocalPagination = !useServerPagination && processed.length > perPage;

    const handleSort = (col) => {
        if (!col.sortable) return;
        const dir = sort.key === col.key && sort.dir === 'asc' ? 'desc' : 'asc';
        setSort({ key: col.key, dir });
        if (onSort) onSort(col.key, dir);
    };

    const handleSearch = (val) => {
        setQuery(val);
        if (onSearch) onSearch(val);
    };

    const totalCols = columns.length + (actions ? 1 : 0);

    return (
        <div className="bg-white rounded-2xl shadow-[var(--shadow-card)]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                    {exportable && (
                        <button
                            type="button"
                            onClick={onExport}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Export Excel
                        </button>
                    )}
                    {headerActions}
                </div>

                {searchable && (
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-64"
                        />
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col)}
                                    className={`px-6 py-3 font-semibold ${
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                    } ${col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                                    style={col.width ? { width: col.width } : undefined}
                                >
                                    <span className="inline-flex items-center">
                                        {col.label}
                                        {col.sortable && <SortIcon active={sort.key === col.key} dir={sort.dir} />}
                                    </span>
                                </th>
                            ))}
                            {actions && <th className="px-6 py-3 text-right font-semibold">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={totalCols} className="px-6 py-16 text-center text-slate-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : displayRows.length === 0 ? (
                            <tr>
                                <td colSpan={totalCols} className="px-6 py-16 text-center">
                                    <div className="inline-flex flex-col items-center text-slate-500">
                                        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3l-2 3h-6l-2-3H4" />
                                        </svg>
                                        {emptyMessage}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayRows.map((row, i) => {
                                const globalIndex = useServerPagination
                                    ? ((pagination.from ?? 1) - 1 + i)
                                    : ((localPage - 1) * perPage + i);
                                return (
                                    <tr key={row.id ?? row.id_batch ?? row.id_nilai ?? row.id_week ?? row.id_pertanyaan ?? row.nik ?? i} className="hover:bg-slate-50/70 transition">
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-6 py-3 ${
                                                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                                }`}
                                            >
                                                {col.render ? col.render(row[col.key], row, globalIndex) : row[col.key]}
                                            </td>
                                        ))}
                                        {actions && <td className="px-6 py-3 text-right">{actions(row)}</td>}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Server-side pagination */}
            {useServerPagination && pagination.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 text-sm">
                    <div className="text-slate-500">
                        Menampilkan <span className="font-medium text-slate-900">{pagination.from}</span>–
                        <span className="font-medium text-slate-900">{pagination.to}</span> dari{' '}
                        <span className="font-medium text-slate-900">{pagination.total}</span> data
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                        {pagination.links?.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                preserveState
                                preserveScroll
                                disabled={!link.url}
                                className={`px-3 py-1.5 rounded-md text-sm transition ${
                                    link.active
                                        ? 'bg-blue-500 text-white'
                                        : link.url
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Client-side pagination */}
            {showLocalPagination && (
                <LocalPagination
                    page={localPage}
                    totalPages={totalLocalPages}
                    total={processed.length}
                    perPage={perPage}
                    onPageChange={setLocalPage}
                />
            )}
        </div>
    );
}

export const renderStatusBadge = (value) => {
    const v = String(value || '').toUpperCase();
    if (['AKTIF', 'ACTIVE'].includes(v)) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200">
                AKTIF
            </span>
        );
    }
    if (['TIDAK AKTIF', 'NONAKTIF', 'INACTIVE'].includes(v)) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-red-50 text-red-700 ring-red-200">
                NONAKTIF
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset bg-slate-100 text-slate-700 ring-slate-200">
            {v || '-'}
        </span>
    );
};

export const renderTypeBadge = (value) => {
    const colors = {
        Admin:  'bg-purple-50 text-purple-700 ring-purple-200',
        Kader:  'bg-blue-50 text-blue-700 ring-blue-200',
        Mentor: 'bg-amber-50 text-amber-700 ring-amber-200',
    };
    const cls = colors[value] || 'bg-slate-100 text-slate-700 ring-slate-200';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${cls}`}>
            {value || '-'}
        </span>
    );
};

export const renderOnlineDot = (lastActivity) => {
    if (!lastActivity) {
        return (
            <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500">Offline</span>
            </span>
        );
    }
    const diffMin = (Date.now() - new Date(lastActivity).getTime()) / 60000;
    const online = diffMin <= 5;
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs text-slate-500">{online ? 'Online' : 'Offline'}</span>
        </span>
    );
};
