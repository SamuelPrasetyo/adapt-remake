import { useEffect, useRef } from "react";
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Legend, Tooltip } from "chart.js";

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Legend, Tooltip);

// Warna batang mengikuti pita nilai relatif KKM: >=85 hijau (excellent), >=KKM biru (lulus),
// <KKM merah (di bawah KKM) — dipakai warna solid & versi hover-nya sedikit lebih gelap.
const barColor = (v, kkm) => {
    if (v == null) return { base: "#cbd5e1", hover: "#94a3b8" };
    if (v >= 85) return { base: "#10b981", hover: "#059669" };
    if (v >= kkm) return { base: "#3b82f6", hover: "#2563eb" };
    return { base: "#f43f5e", hover: "#e11d48" };
};

// Garis KKM digambar tangan lewat plugin, BUKAN dataset "line" — dataset kategori cuma
// menyambung titik di tengah tiap batang, jadi berhenti sebelum tepi kiri/kanan kanvas.
// Digambar di afterDraw (setelah SEMUA dataset, termasuk bar) supaya pasti selalu di
// lapisan paling atas, lurus dari tepi ke tepi chartArea. Keterangannya (label "KKM n")
// sengaja TIDAK digambar di kanvas — menutupi batang; dirakit sebagai legenda di bawah
// grafik oleh pemanggil, sama seperti pola legenda grafik report lain.
const kkmLinePlugin = {
    id: "kkmLine",
    afterDraw(chart) {
        const kkm = chart.$kkm;
        if (kkm == null) return;
        const { ctx, chartArea, scales } = chart;
        const y = scales.y.getPixelForValue(kkm);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#f97316";
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.restore();
    },
};

/**
 * Kanvas grafik batang untuk kartu report — dipakai saat sumbu-X-nya kategori independen
 * (mis. aspek Development Progress: Routine Job, SOP Understanding, ...), bukan urutan
 * waktu/modul, supaya tidak tersirat tren yang sebenarnya tidak ada di garis.
 *
 * Batang sengaja diberi warna solid (bukan opacity rendah) — grafik ini yang jadi fokus
 * utama kartu, dan garis KKM tetap kebaca karena Chart.js menggambar dataset "line" di
 * atas dataset "bar" secara default.
 *
 * @param labels    label sumbu-X.
 * @param data      nilai per label (sejajar 1:1 dengan labels).
 * @param kkm       nilai KKM digambar sebagai garis putus-putus overlay (keterangannya di legenda pemanggil).
 * @param points    metadata per titik ({ nama }) — sumber judul tooltip.
 */
export default function ReportBarChart({
    labels = [],
    data = [],
    kkm = 70,
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
            data: {
                labels,
                datasets: [
                    {
                        type: "bar",
                        label: "Skor",
                        data,
                        backgroundColor: data.map((v) => barColor(v, kkm).base),
                        hoverBackgroundColor: data.map((v) => barColor(v, kkm).hover),
                        borderRadius: 6,
                        maxBarThickness: 40,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Headroom di atas supaya batang bernilai 100 tidak terlihat mepet/terpotong
                // di tepi atas kartu.
                layout: { padding: { top: 14 } },
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (it) => points[it[0]?.dataIndex]?.nama ?? it[0]?.label ?? "",
                        },
                    },
                },
                scales: {
                    y: { min: 0, max: 100, grid: { color: "#f1f5f9" }, ticks: { stepSize: 20, font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 0 } },
                },
            },
            plugins: [kkmLinePlugin],
        });
        chartRef.current.$kkm = kkm;
        chartRef.current.update();

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [JSON.stringify(labels), JSON.stringify(data), kkm, JSON.stringify(points)]);

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
