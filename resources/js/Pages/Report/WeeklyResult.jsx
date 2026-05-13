import { useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Chart, LineController, LineElement, PointElement,
    LinearScale, CategoryScale, Legend, Tooltip,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

const cellSm = 'border border-black text-center px-1 py-0.5 text-[11px]';
const thSm   = 'border border-black text-center px-1 py-0.5 text-[9px] bg-white';
const bgGray = { backgroundColor: '#E5E4E2' };

function LineChart({ labels, datasets, id }) {
    const ref = useRef(null);
    useEffect(() => {
        const chart = new Chart(ref.current, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } },
            },
        });
        return () => chart.destroy();
    }, []);
    return <canvas ref={ref} />;
}

function avg(vals) {
    const nonZero = vals.filter(v => v != null && v != 0 && v !== '0');
    if (!nonZero.length) return 0;
    return (nonZero.reduce((s, v) => s + Number(v), 0) / nonZero.length).toFixed(2);
}

export default function WeeklyResult({
    title, pertanyaans, data, data2, data3,
    week_arr, avg_week, data_lg, data_kkm, learningG,
    avg_2, performance_sums, mentor_percent, kader_percent,
    months, weeksWithRange, file,
}) {
    const labels    = week_arr;
    const avgData   = labels.map(w => avg_week[w]  ?? 0);
    const lgData    = labels.map(w => data_lg[w]   ?? 0);
    const kkmData   = labels.map(w => data_kkm[w]  ?? 7);
    const avg2Data  = labels.map(w => avg_2[w]     ?? 0);

    const mentorNames = Array.isArray(title.nama_mentor)
        ? Object.values(title.nama_mentor).filter(Boolean).join(', ')
        : title.nama_mentor ?? '';

    return (
        <AppLayout title="OJT MONITORING" breadcrumb={`Report / Weekly Monitoring / ${title.nama_kader}`}>
            <div className="mb-4">
                <Link href="/ojt-index" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                    ← Kembali
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Report Header */}
                <div className="grid grid-cols-12 border-b border-black">
                    <div className="col-span-2 flex items-center justify-center p-2 border-r border-black">
                        <img src="/assets/img/logomai.png" alt="MAI" className="h-12 object-contain" />
                    </div>
                    <div className="col-span-8 flex items-center justify-center p-3 text-center border-r border-black">
                        <h5 className="font-bold text-sm leading-snug">
                            REPORT OJT {title.ojt} BATCH {title.batch}<br />MONITORING SUMMARY BY CHC MAI
                        </h5>
                    </div>
                    <div className="col-span-2 flex items-center justify-center p-2">
                        <img src="/assets/img/NAG.png" alt="NAG" className="h-14 object-contain" />
                    </div>
                </div>

                {/* Kader Info */}
                <div className="grid grid-cols-2 p-4 border-b border-black gap-2 text-sm">
                    <div className="space-y-0.5">
                        {[['PERIOD', title.rangeMonth], ['MANTEE NAME', title.nama_kader?.toUpperCase()], ['MENTOR NAME', mentorNames.toUpperCase()], ['MT BATCH', title.batch], ['IQ', title.iq], ['INCH', title.ipk]].map(([k, v]) => (
                            <p key={k} className="m-0"><strong>{k}</strong> : {v}</p>
                        ))}
                    </div>
                    <div className="space-y-0.5">
                        {[['DIVISION', title.divisi], ['DEPARTEMENT', title.departemen], ['BUSSINESS UNIT', title.bu]].map(([k, v]) => (
                            <p key={k} className="m-0"><strong>{k}</strong> : {v}</p>
                        ))}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Overview label */}
                    <div className="bg-sky-300 text-center py-1 font-semibold text-sm border border-black">OVERVIEW</div>

                    {/* Performance Results + Chart */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="bg-sky-300 text-center py-1 font-semibold text-xs border border-black mb-0">
                                OJT {title.ojt} PERFORMANCE RESULTS
                            </div>
                            <div className="overflow-x-auto">
                                <table className="border-collapse text-[9px] w-full">
                                    <thead>
                                        <tr>
                                            <th rowSpan={2} className={thSm}>NO</th>
                                            <th rowSpan={2} className={thSm}>
                                                {file?.file_assessment
                                                    ? <a href={`/storage/${file.file_assessment}`} target="_blank" className="text-blue-600 underline">ASSESSMENT POINT</a>
                                                    : 'ASSESSMENT POINT'}
                                            </th>
                                            {months.map(m => (
                                                <th key={m} colSpan={2} className={thSm}>{m}</th>
                                            ))}
                                            <th rowSpan={2} className={thSm}>AVE</th>
                                        </tr>
                                        <tr>
                                            {weeksWithRange.map(w => (
                                                <th key={w.week} className={thSm}>{w.week}<br /><small>{w.range}</small></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pertanyaans.length > 0 ? pertanyaans.map((q, idx) => {
                                            const vals = week_arr.map(w => data[q.id] ? (data[q.id][w] ?? 0) : 0);
                                            const nonZero = vals.filter(v => v != 0);
                                            const rowAvg = nonZero.length ? (nonZero.reduce((s, v) => s + Number(v), 0) / nonZero.length).toFixed(2) : 0;
                                            return (
                                                <tr key={q.id}>
                                                    <td className={cellSm} style={bgGray}>{idx + 1}</td>
                                                    <td className={`${cellSm} text-left`} style={bgGray}>{q.nama}</td>
                                                    {vals.map((v, i) => (
                                                        <td key={i} className={cellSm} style={bgGray}>{v}</td>
                                                    ))}
                                                    <td className={cellSm} style={bgGray}>{rowAvg}</td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={99} className={cellSm} style={bgGray}>Empty Data</td></tr>
                                        )}
                                        {/* AVE SCORE row */}
                                        <tr>
                                            <td colSpan={2} className={cellSm} style={bgGray}>AVE SCORE</td>
                                            {week_arr.map(w => <td key={w} className={cellSm} style={bgGray}>{avg_week[w] ?? 0}</td>)}
                                            <td rowSpan={3} className={cellSm} style={bgGray}></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className={cellSm} style={bgGray}>LEARNING GROWTH</td>
                                            {week_arr.map(w => <td key={w} className={cellSm} style={bgGray}>{data_lg[w] ?? 0}</td>)}
                                        </tr>
                                        <tr>
                                            <td colSpan={2} className={cellSm} style={bgGray}>BATAS MINIMUM</td>
                                            {week_arr.map(w => <td key={w} className={cellSm} style={bgGray}>{data_kkm[w] ?? 0}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="w-72 shrink-0 bg-white rounded p-2">
                            <LineChart
                                labels={labels}
                                datasets={[
                                    { label: 'Ave Score',      data: avgData, borderColor: 'rgb(50,205,50)',   backgroundColor: 'rgb(50,205,50)',   borderWidth: 3, tension: 0.4 },
                                    { label: 'Learning growth', data: lgData,  borderColor: 'rgb(255,191,0)',   backgroundColor: 'rgb(255,191,0)',   borderWidth: 3, tension: 0.4 },
                                    { label: 'Batas Normal',    data: kkmData, borderColor: 'rgb(169,169,169)', backgroundColor: 'rgb(169,169,169)', borderWidth: 3, tension: 0.4 },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Feedback Results + Chart 2 */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="bg-sky-300 text-center py-1 font-semibold text-xs border border-black mb-0">FEEDBACK RESULTS</div>
                            <div className="overflow-x-auto">
                                <table className="border-collapse text-[9px] w-full">
                                    <thead>
                                        <tr>
                                            <th className={thSm}>POINT</th>
                                            {week_arr.map(w => <th key={w} className={thSm}>W{w}</th>)}
                                            <th className={thSm}>AVE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(data2).length > 0 ? (
                                            <tr>
                                                <td className={cellSm} style={bgGray}>INVOLMENT & MOTIVATION</td>
                                                {week_arr.map(w => <td key={w} className={cellSm} style={bgGray}>{data2[w] ?? 0}</td>)}
                                                <td className={cellSm} style={bgGray}>{avg(week_arr.map(w => data2[w]))}</td>
                                            </tr>
                                        ) : (
                                            <tr><td colSpan={99} className={cellSm} style={bgGray}>Empty Data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="w-72 shrink-0 bg-white rounded p-2">
                            <LineChart
                                labels={labels}
                                datasets={[
                                    { label: 'Ave Score', data: avg2Data, borderColor: 'rgb(50,205,50)', backgroundColor: 'rgb(50,205,50)', borderWidth: 3, tension: 0.4 },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Mentors Input + Feedback Presence */}
                    <div className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="bg-sky-300 text-center py-1 font-semibold text-xs border border-black mb-0">MENTORS INPUT</div>
                            <table className="border-collapse text-xs w-full">
                                <tbody>
                                    {week_arr.map(w => (
                                        <tr key={w}>
                                            <th className={`${thSm} w-24`}>Week {w}</th>
                                            <td className="border border-black px-2 py-1 text-xs text-left">{data3[w] ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="w-72 shrink-0 border border-black p-4">
                            <h5 className="text-sm font-bold text-center mb-4">WEEKLY FEEDBACK PRESENCE</h5>
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold w-20">MENTOR :</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded h-7 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${Math.min(mentor_percent, 100)}%` }}
                                    >
                                        {Math.round(mentor_percent * 100) / 100}%
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold w-20">MENTEE :</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded h-7 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${Math.min(kader_percent, 100)}%` }}
                                    >
                                        {Math.round(kader_percent * 100) / 100}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Summary */}
                    <div>
                        <h6 className="text-sm font-semibold mb-1">PERFORMANCE SUMMARY</h6>
                        <div className="border border-black min-h-20 p-3 text-sm whitespace-pre-wrap">
                            {performance_sums?.desc ?? ''}
                        </div>
                    </div>

                    {/* Approval */}
                    <div className="flex justify-end">
                        <div className="grid grid-cols-3 w-96">
                            {['PREPARED', 'CHECKED', 'APPROVED'].map((label, i) => (
                                <div key={label} className={`border border-black ${i < 2 ? 'border-r-0' : ''} text-center py-1`}>
                                    <p className="text-xs font-bold m-0">{label}</p>
                                </div>
                            ))}
                            {['HR DATA ANALYST', 'PEOPLE DEVELOPMENT', 'CHC DIVISION HEAD'].map((label, i) => (
                                <div key={label} className={`border border-black border-t-0 ${i < 2 ? 'border-r-0' : ''} text-center py-8`}>
                                    <p className="text-xs font-bold">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
