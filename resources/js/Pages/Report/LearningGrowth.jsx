import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

export default function LearningGrowth({ kaders }) {
    const [nikKader, setNikKader] = useState('');
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    return (
        <AppLayout title="LEARNING GROWTH" breadcrumb="Report / Learning Growth">
            <div className="max-w-lg">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Pilih Kader</h2>
                    <p className="text-sm text-slate-500 mb-5">Pilih nama kader untuk melihat laporan Learning Growth.</p>

                    <form method="POST" action="/learning-growth">
                        <input type="hidden" name="_token" value={csrf} />

                        <div className="mb-5">
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

                        <button
                            type="submit"
                            disabled={!nikKader}
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
