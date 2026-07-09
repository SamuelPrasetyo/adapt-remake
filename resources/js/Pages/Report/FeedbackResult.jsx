import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const thCls = 'border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-center whitespace-nowrap';
const tdCls = 'border border-slate-300 px-2 py-1 text-xs text-center whitespace-nowrap';

function toRoman(num) {
    const map = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
    let n = Number(num), res = '';
    for (const [r, v] of map) { while (n >= v) { res += r; n -= v; } }
    return res;
}

function getMentor(mentor, nik) {
    const m = mentor[nik];
    if (!m) return '';
    if (Array.isArray(m)) return m.filter(Boolean).join(', ');
    return Object.values(m).filter(Boolean).join(', ');
}

export default function FeedbackResult({ datas, mentor, jawaban, pertanyaans, weeks, performance_sums, ojt, user_type, arr_week }) {
    const isMentor = user_type === 'Mentor';
    const exportUrl = isMentor
        ? `/reportfeedback/export/${ojt}`
        : `/reportfeedback-kader/export/${ojt}`;

    return (
        <AppLayout
            title="REPORT FEEDBACK"
            breadcrumb={`Report / Feedback / ${user_type} OJT ${ojt}`}
        >
            <div className="mb-4 flex items-center gap-3">
                <Link
                    href="/reportfeedback-index"
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg transition"
                >
                    ← Kembali
                </Link>
                <a
                    href={exportUrl}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                    Export Excel
                </a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-base font-semibold text-slate-800">
                        Report Feedback {user_type} OJT {ojt}
                    </h2>
                </div>

                <div className="overflow-x-auto p-4">
                    <table className="border-collapse text-xs">
                        <thead>
                            <tr>
                                <th className={thCls}>No</th>
                                <th className={thCls}>Bisnis Unit</th>
                                <th className={thCls}>Divisi</th>
                                <th className={thCls}>Departement</th>
                                <th className={thCls}>Mentor</th>
                                <th className={thCls}>Kader</th>
                                <th className={thCls}>Batch</th>
                                <th className={thCls}>IQ</th>
                                <th className={thCls}>Inch</th>
                                {isMentor ? (
                                    <>
                                        {weeks.map(wk =>
                                            pertanyaans.filter((_, i) => i < 4).map(q => (
                                                <th key={`${wk.id_week}-${q.id_pertanyaan}`} className={thCls} title={q.nama_pertanyaan?.replace(/<[^>]*>/g, '')}>
                                                    {(q.nama_pertanyaan?.replace(/<[^>]*>/g, '') ?? '').slice(0, 12)}… ({wk.angka_week})
                                                </th>
                                            ))
                                        )}
                                        <th className={thCls}>Rata-rata</th>
                                        {weeks.map(wk => (
                                            <th key={`im-${wk.id_week}`} className={thCls}>I &amp; M ({wk.angka_week})</th>
                                        ))}
                                        <th className={thCls}>AVG</th>
                                        {weeks.map(wk =>
                                            pertanyaans.filter((_, i) => i === 5).map(q => (
                                                <th key={`input-${wk.id_week}`} className={thCls}>Input Week ({wk.angka_week})</th>
                                            ))
                                        )}
                                        <th className={thCls}>Performance Summary</th>
                                        <th className={thCls}>Grade</th>
                                        <th className={thCls}>Summary Grade</th>
                                        <th className={thCls}>File Assessment</th>
                                    </>
                                ) : (
                                    weeks.map(wk =>
                                        pertanyaans.map(q => (
                                            <th key={`${wk.id_week}-${q.id_pertanyaan}`} className={thCls} title={q.nama_pertanyaan?.replace(/<[^>]*>/g, '')}>
                                                {(q.nama_pertanyaan?.replace(/<[^>]*>/g, '') ?? '').slice(0, 15)}{(q.nama_pertanyaan?.replace(/<[^>]*>/g, '') ?? '').length > 15 ? '…' : ''} ({wk.angka_week})
                                            </th>
                                        ))
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {datas.map((d, idx) => {
                                let rata1 = 0, c1 = 0, rata2 = 0, c2 = 0;

                                if (isMentor) {
                                    weeks.forEach(wk => {
                                        pertanyaans.forEach((q, qi) => {
                                            if (qi < 4) {
                                                const v = Number(jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? 0);
                                                rata1 += v;
                                                if (v) c1++;
                                            }
                                            if (qi === 4) {
                                                const v = Number(jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? 0);
                                                rata2 += v;
                                                if (v) c2++;
                                            }
                                        });
                                    });
                                }
                                const avgRata1 = c1 ? (rata1 / c1).toFixed(2) : 0;
                                const avgRata2 = c2 ? ((rata2 / c2) * 2).toFixed(2) : 0;
                                const rata3 = (avgRata1 != 0 || avgRata2 != 0)
                                    ? ((Number(avgRata1) + Number(avgRata2)) / 2).toFixed(2) : 0;

                                const ps = performance_sums?.find?.(p => p.nik_kader === d.nik_kader && String(p.ojt) === String(ojt));

                                return (
                                    <tr key={d.nik} className="hover:bg-slate-50">
                                        <td className={tdCls}>{idx + 1}</td>
                                        <td className={tdCls}>{d.company_name}</td>
                                        <td className={tdCls}>{d.divisi}</td>
                                        <td className={tdCls}>{d.departement}</td>
                                        <td className={tdCls}>{getMentor(mentor, d.nik)}</td>
                                        <td className={tdCls}>{d.nama}</td>
                                        <td className={tdCls}>{toRoman(d.nama_batch)} - {d.tahun_batch}</td>
                                        <td className={tdCls}>{d.iq}</td>
                                        <td className={tdCls}>{d.ipk}</td>

                                        {isMentor ? (
                                            <>
                                                {weeks.map(wk =>
                                                    pertanyaans.filter((_, i) => i < 4).map(q => (
                                                        <td key={`${wk.id_week}-${q.id_pertanyaan}`} className={tdCls}>
                                                            {jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? 0}
                                                        </td>
                                                    ))
                                                )}
                                                <td className={tdCls}>{avgRata1}</td>
                                                {weeks.map(wk =>
                                                    pertanyaans.filter((_, i) => i === 4).map(q => (
                                                        <td key={`im-${wk.id_week}`} className={tdCls}>
                                                            {jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? 0}
                                                        </td>
                                                    ))
                                                )}
                                                <td className={tdCls}>{avgRata2}</td>
                                                {weeks.map(wk =>
                                                    pertanyaans.filter((_, i) => i === 5).map(q => (
                                                        <td key={`inp-${wk.id_week}`} className={tdCls}>
                                                            {jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? '-'}
                                                        </td>
                                                    ))
                                                )}
                                                <td className={tdCls} style={{ maxWidth: 120 }}>
                                                    {ps?.desc ? ps.desc.slice(0, 30) + (ps.desc.length > 30 ? '…' : '') : '-'}
                                                </td>
                                                <td className={tdCls}>{ps?.grade ?? '-'}</td>
                                                <td className={tdCls}>{rata3}</td>
                                                <td className={tdCls}>
                                                    {ps?.file_assessment
                                                        ? <a href={`/storage/${ps.file_assessment}`} target="_blank" className="text-blue-600 underline">Lihat</a>
                                                        : '-'}
                                                </td>
                                            </>
                                        ) : (
                                            weeks.map(wk =>
                                                pertanyaans.map(q => (
                                                    <td key={`${wk.id_week}-${q.id_pertanyaan}`} className={tdCls}>
                                                        {jawaban?.[q.id_pertanyaan]?.[wk.id_week]?.[d.nik] ?? 0}
                                                    </td>
                                                ))
                                            )
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
