import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

const OJT_OPTIONS = [
    { value: '1', label: 'OJT 1 (Januari – Maret)' },
    { value: '2', label: 'OJT 2 (April – Juni)' },
    { value: '3', label: 'OJT 3 (Juli – September)' },
    { value: '4', label: 'OJT 4 (Oktober – Desember)' },
];

export default function Weekly({ kaders }) {
    const [nikKader, setNikKader] = useState('');
    const [ojt, setOjt] = useState('');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    return (
        <AppLayout title="WEEKLY MONITORING" breadcrumb="Report / Weekly Monitoring">
            <div className="max-w-lg">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Pilih Kader & Periode OJT</h2>
                    <p className="text-sm text-slate-500 mb-5">Pilih nama kader dan periode OJT untuk melihat laporan Weekly Monitoring.</p>

                    <form method="POST" action="/ojt-monitoring">
                        <input type="hidden" name="_token" value={csrf} />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kader</label>
                            <select
                                name="nik_kader"
                                value={nikKader}
                                onChange={(e) => setNikKader(e.target.value)}
                                required
                                className={inputCls}
                            >
                                <option value="">Pilih Kader...</option>
                                {(kaders ?? []).map((k) => (
                                    <option key={k.nik} value={k.nik}>{k.nama}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Periode OJT</label>
                            <select
                                name="ojt"
                                value={ojt}
                                onChange={(e) => setOjt(e.target.value)}
                                required
                                className={inputCls}
                            >
                                <option value="">Pilih OJT...</option>
                                {OJT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={!nikKader || !ojt}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                        >
                            Lihat Laporan
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
