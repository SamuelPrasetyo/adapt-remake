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

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Legend, Tooltip);

/**
 * Grafik Learning Growth untuk batch arsip: nilai per modul in-class, berurutan sesuai
 * dokumen (Com Skill → Work Life Plan), plus garis KKM.
 *
 * Sumbu-X dilabeli "M1..Mn" — BUKAN kode fase F/L/S seperti report sistem, karena dokumen
 * arsip tidak punya fase; urutannya urutan modul di dokumen itu sendiri. Sengaja disingkat
 * supaya SEMUA label muat di kartu report yang sempit (tidak ada yang dilewati). Nama modul
 * aslinya tetap muncul sebagai judul tooltip, dan lengkapnya ada di halaman Detail Nilai
 * Training.
 *
 * Warna & gaya sengaja mengikuti chart Learning Growth report sistem (DevelopmentReportCard)
 * supaya report batch arsip dan batch sistem terbaca sebagai satu sistem.
 *
 * Komponen ini hanya menggambar kanvasnya; legenda dirakit pemanggilnya karena bentuknya
 * beda antara kartu report (sempit) dan halaman Detail Nilai Training (lebar).
 *
 * @param modul  [{ key, label }] urut tampil.
 * @param nilai  { [key]: number|null }.
 * @param height tinggi kanvas dalam px.
 */
export default function LearningGrowthChart({ modul = [], nilai = {}, kkm = 70, height = 150 }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const points = modul.map((m, i) => ({
        label: `M${i + 1}`,
        nama: m.label,
        score: nilai?.[m.key] ?? null,
    }));

    useEffect(() => {
        if (!canvasRef.current || points.length === 0) return;
        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(canvasRef.current, {
            type: "line",
            data: {
                labels: points.map((p) => p.label),
                datasets: [
                    {
                        label: "Nilai training",
                        data: points.map((p) => p.score),
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59,130,246,0.12)",
                        borderWidth: 2.5,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBorderColor: "#fff",
                        pointBorderWidth: 1.5,
                        fill: true,
                        spanGaps: true,
                    },
                    {
                        label: `KKM ${kkm}`,
                        data: points.map(() => kkm),
                        borderColor: "#f97316",
                        borderWidth: 1.5,
                        borderDash: [5, 4],
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        // Judul tooltip = nama modul aslinya, karena sumbu-X cuma "Modul n".
                        callbacks: { title: (it) => points[it[0]?.dataIndex]?.nama ?? it[0]?.label },
                    },
                },
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: "#f1f5f9" },
                        ticks: { stepSize: 20, font: { size: 10 } },
                    },
                    // autoSkip dimatikan: label sudah pendek (M1..Mn) jadi semuanya harus tampil,
                    // bukan dilewati selang-seling seperti saat labelnya masih "Modul n".
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, autoSkip: false, maxRotation: 0 } },
                },
            },
        });

        return () => {
            if (chartRef.current) chartRef.current.destroy();
        };
    }, [JSON.stringify(points), kkm]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
