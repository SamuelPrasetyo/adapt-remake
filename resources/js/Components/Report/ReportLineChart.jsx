import { useEffect, useRef } from "react";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
    Legend,
    Tooltip,
} from "chart.js";
import { KKM } from "./reportUi";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

/**
 * Rentang sumbu-Y tetap 0–100 supaya semua grafik report sebanding satu sama lain.
 */
export const yRange = () => ({ min: 0, max: 100 });

export const avgOf = (vals) => {
    const s = vals.filter((v) => v != null);
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null;
};

/** Garis KKM: dataset datar yang dipakai sama di semua grafik report. */
export const kkmDataset = (len) => ({
    label: `KKM ${KKM}`,
    data: Array.from({ length: len }, () => KKM),
    borderColor: "#f97316",
    borderWidth: 1.5,
    borderDash: [5, 4],
    pointRadius: 0,
    fill: false,
});

/**
 * Kanvas grafik garis untuk kartu report sistem — dipakai ketiga grafik di
 * DevelopmentReportCard (Pre/Post Test, Post Activity, Development Progress).
 *
 * Legenda sengaja TIDAK digambar Chart.js; tiap grafik merakit legendanya sendiri di bawah
 * kanvas supaya bisa menampilkan angka rata-rata di sampingnya.
 *
 * @param labels    label sumbu-X (mis. F1, L1, S1) — sejajar 1:1 dengan `points`.
 * @param datasets  dataset Chart.js siap pakai (termasuk garis KKM bila perlu).
 * @param yValues   semua nilai yang digambar, untuk menghitung rentang sumbu-Y.
 * @param points    metadata per titik ({ nama, kode_modul }) — sumber judul tooltip.
 *                  Judul HARUS diambil dari sini lewat dataIndex, bukan dari datasetIndex,
 *                  karena satu index-x dipakai bersama oleh beberapa dataset sekaligus.
 */
export default function ReportLineChart({
    labels = [],
    datasets = [],
    yValues = [],
    points = [],
    height = 150,
    emptyMessage = "Belum ada data pada periode ini",
}) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || labels.length === 0) return;
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Beberapa dataset berbagi kategori-x yang sama (mis. Pre & Post satu modul),
                // jadi tooltip dikumpulkan per index supaya semuanya terbaca sekaligus.
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (it) => {
                                const p = points[it[0]?.dataIndex];
                                if (!p) return it[0]?.label ?? "";
                                return p.kode_modul ? `${p.kode_modul} — ${p.nama}` : p.nama;
                            },
                        },
                    },
                },
                scales: {
                    y: { ...yRange(yValues), grid: { color: "#f1f5f9" }, ticks: { stepSize: 20, font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 0 } },
                },
            },
        });

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [JSON.stringify(labels), JSON.stringify(datasets), JSON.stringify(yValues), JSON.stringify(points)]);

    return (
        <div style={{ height }}>
            {labels.length ? (
                <canvas ref={canvasRef} />
            ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center px-2">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
}
