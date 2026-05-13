import { useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Chart, LineController, LineElement, PointElement,
    LinearScale, CategoryScale, Legend, Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const cellCls = 'border border-black text-center px-2 py-0.5 text-xs';
const bgGray = { backgroundColor: '#E5E4E2' };

export default function LearningGrowthResult({ title, reports, avg, week, learningG, kkm, data_lg }) {
    const chartRef = useRef(null);

    useEffect(() => {
        const labels = [...week].sort((a, b) => a - b);
        const avgData  = labels.map(w => avg[w]       ?? null);
        const lgData   = labels.map(w => learningG[w] ?? null);
        const kkmData  = labels.map(() => 7);

        const chart = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Ave Score',      data: avgData, borderColor: 'rgb(50,205,50)',   backgroundColor: 'rgb(50,205,50)',   borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'Learning growth', data: lgData,  borderColor: 'rgb(255,191,0)',   backgroundColor: 'rgb(255,191,0)',   borderWidth: 3, tension: 0.4, spanGaps: true },
                    { label: 'Batas Normal',    data: kkmData, borderColor: 'rgb(169,169,169)', backgroundColor: 'rgb(169,169,169)', borderWidth: 3, tension: 0.4 },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } },
            },
        });
        return () => chart.destroy();
    }, []);

    return (
        <AppLayout title="LEARNING GROWTH" breadcrumb={`Report / Learning Growth / ${title.nama_kader}`}>
            <div className="mb-4">
                <Link
                    href="/learning-index"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                    ← Kembali
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-sky-400 px-6 py-3 text-center">
                    <h2 className="text-base font-bold text-white">LEARNING GROWTH (DEVELOPMENT)</h2>
                </div>

                <div className="p-6" style={bgGray}>
                    {/* Info + Aspek */}
                    <div className="flex flex-wrap gap-8 mb-6">
                        <div className="flex-1 grid gap-y-1 text-sm" style={{ gridTemplateColumns: '110px 1fr' }}>
                            {[['Nama', title.nama_kader], ['Divisi', title.divisi], ['Departemen', title.departemen], ['BU', title.bu]].map(([k, v]) => (
                                <>
                                    <span key={k + 'k'}>{k}</span>
                                    <span key={k + 'v'}>: {v}</span>
                                </>
                            ))}
                        </div>
                        <div className="shrink-0 w-60">
                            <p className="text-sm font-medium text-center mb-2">Aspek Penilaian:</p>
                            <div className="flex gap-2">
                                {[['Routine Job', 'Assignment'], ['SOP', 'Project']].map(([top, bot]) => (
                                    <div key={top} className="flex-1 bg-blue-700 rounded text-white text-xs text-center">
                                        <div className="py-1">{top}</div>
                                        <hr className="border-white/30" />
                                        <div className="py-1">{bot}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table + Chart */}
                    <div className="flex flex-wrap gap-4">
                        <div className="shrink-0 overflow-x-auto">
                            <table className="border-collapse text-xs">
                                <thead>
                                    <tr>
                                        {['Week', 'Ave Score', 'Learning Growth', 'Batas Normal'].map(h => (
                                            <th key={h} className={`${cellCls} bg-white`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(r => (
                                        <tr key={r.week}>
                                            <td className={cellCls} style={bgGray}>{r.week}</td>
                                            <td className={cellCls} style={bgGray}>{r.avg}</td>
                                            <td className={cellCls} style={bgGray}>{data_lg[r.week]}</td>
                                            <td className={cellCls} style={bgGray}>7</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex-1 min-w-0 bg-white rounded p-4 shadow-sm">
                            <canvas ref={chartRef} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
