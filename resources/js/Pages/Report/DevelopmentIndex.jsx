import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const inputCls =
    "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const toRoman = (n) => {
    const num = parseInt(n, 10);
    return Number.isFinite(num) && ROMAN[num] ? ROMAN[num] : n;
};

export default function DevelopmentIndex({ kaders = [] }) {
    const [kaderId, setKaderId] = useState("");

    // Kelompokkan kader per batch agar dropdown lebih mudah dibaca.
    const grouped = useMemo(() => {
        const map = new Map();
        for (const k of kaders) {
            const key = `${k.nama_batch ?? "-"}|${k.tahun_batch ?? ""}`;
            if (!map.has(key)) {
                map.set(key, {
                    label: `Batch ${toRoman(k.nama_batch)}${k.tahun_batch ? ` · ${k.tahun_batch}` : ""}`,
                    items: [],
                });
            }
            map.get(key).items.push(k);
        }
        return [...map.values()];
    }, [kaders]);

    const submit = (e) => {
        e.preventDefault();
        if (kaderId) router.visit(`/report-new/${kaderId}`);
    };

    return (
        <AppLayout title="REPORT NEW" breadcrumb="Report / Report New">
            <div className="max-w-lg">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">
                        Management Trainee Development Report
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Pilih kader (Batch III ke atas) untuk melihat laporan perkembangan.
                    </p>

                    {kaders.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            Belum ada kader Batch III ke atas.
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nama Kader
                                </label>
                                <select
                                    value={kaderId}
                                    onChange={(e) => setKaderId(e.target.value)}
                                    required
                                    className={inputCls}
                                >
                                    <option value="">Pilih Kader...</option>
                                    {grouped.map((g) => (
                                        <optgroup key={g.label} label={g.label}>
                                            {g.items.map((k) => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={!kaderId}
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                            >
                                Lihat Report
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
