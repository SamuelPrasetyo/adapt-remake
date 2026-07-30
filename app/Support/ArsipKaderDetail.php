<?php

namespace App\Support;

use App\Models\ReportArsip;

/**
 * Props tab "Overview" & "Penilaian OJT" halaman Kader Saya / Detail untuk kader batch
 * arsip (Batch 1-2).
 *
 * Kader batch arsip tidak pernah di-assign modul di sistem dan tidak pernah mengisi form
 * FMC, jadi kedua tab itu selalu kosong bila memakai sumber data sistem. Sebagai gantinya:
 *
 *   Overview      <- nilai in-class training dari dokumen arsip (resources/data, lihat
 *                    App\Support\HasilTrainingMt) — Com Skill s/d Work Life Plan, disusun
 *                    sebagai faseGroups sehingga tampilannya sama persis dengan batch 3+.
 *   Penilaian OJT <- skor OJT 1-4 & Final Score dari report_arsip, sama dengan Section C
 *                    kartu report arsip.
 *
 * Keduanya read-only: data historis, tidak ada form untuk mengubahnya.
 */
class ArsipKaderDetail
{
    /**
     * Program kader batch arsip sudah tuntas, jadi progress & status TIDAK diturunkan dari
     * checkpoint modul (yang memang kosong) melainkan dipatok di sini.
     */
    public const PROGRESS = 100;
    public const STATUS   = 'on_track';

    /**
     * Fase tempat nilai in-class training arsip ditempatkan: "3" = Monthly Training
     * (lihat FASE_LABELS di resources/js/constants/fase.js). Trainingnya memang kelas
     * bulanan, bukan modul Foundation / Self Learning yang di-assign lewat sistem.
     */
    public const FASE = '3';

    /**
     * @param  \App\Models\Kader  $kader  butuh ->id.
     * @return array{faseGroups: array, allFases: array, totalModuls: int, ojt: array|null}
     */
    public static function build($kader): array
    {
        $arsip = ReportArsip::where('kader_id', $kader->id)->first();

        // null bila batchnya belum punya dokumen training ATAU kadernya tak tercatat di
        // dokumen itu — fase tetap tampil, hanya tanpa rincian per modul.
        $training = HasilTrainingMt::chartFor($kader);
        $moduls   = self::moduls($training);

        // Avg fase = skor Learning Growth arsip; dipakai apa adanya dari report bila
        // rincian per modulnya tidak tersedia.
        $avg = $training['avg'] ?? ($arsip ? $arsip->learning_growth : null);

        return [
            'faseGroups' => [[
                'fase'      => self::FASE,
                'moduls'    => $moduls,
                'done'      => count($moduls),
                'total'     => count($moduls),
                'progress'  => self::PROGRESS,
                'avg_score' => $avg === null ? null : round((float) $avg, 1),
            ]],
            'allFases'    => [self::FASE],
            'totalModuls' => count($moduls),
            'ojt'         => self::ojt($arsip),
        ];
    }

    /**
     * Modul in-class training dalam bentuk yang dipahami LearningGrowthTab.
     *
     * Tiap modul arsip hanya punya SATU nilai (0-100) — tidak ada Pre/Post Test maupun
     * Post Activity — jadi flag komponennya dimatikan supaya kartu skor per komponen
     * tidak ikut muncul dan tiap modul otomatis terhitung selesai.
     */
    private static function moduls(?array $training): array
    {
        $moduls = [];
        foreach ($training['modul'] ?? [] as $m) {
            $nilai = $training['nilai'][$m['key']] ?? null;
            $moduls[] = [
                'id'                => $m['key'],
                'kode_modul'        => null,
                'nama'              => $m['label'],
                'score'             => $nilai === null ? null : round((float) $nilai, 1),
                'has_test'          => false,
                'has_post_activity' => false,
                'need_pre'          => false,
                'pre_score'         => null,
                'post_score'        => null,
                'pa_score'          => null,
                'done'              => 1,
                'required'          => 1,
            ];
        }

        return $moduls;
    }

    /**
     * Skor OJT 1-4 + Final Score. ojt1-4 disimpan skala 0-10 mengikuti format Excel arsip
     * dan dinaikkan ke 0-100 di sini; fmc_avg (= rata-rata OJT 1-4) memang sudah 0-100.
     *
     * `final` inilah yang dipakai stat "FMC" di header untuk batch arsip. Beda dengan batch
     * sistem yang memakai FMC terakhir yang di-approve, karena penilaian batch arsip sudah
     * tuntas — angka yang bermakna adalah rata-rata akhirnya, sama dengan Section C report.
     */
    private static function ojt(?ReportArsip $arsip): ?array
    {
        if (!$arsip) return null;

        $list = [];
        foreach ([1, 2, 3, 4] as $n) {
            $val = $arsip->{'ojt' . $n};
            $list[] = [
                'label' => 'OJT ' . $n,
                'score' => $val === null ? null : round((float) $val * 10, 1),
            ];
        }

        return [
            'list'   => $list,
            'final'  => $arsip->fmc_avg !== null ? round((float) $arsip->fmc_avg, 1) : null,
            'status' => $arsip->status,
        ];
    }
}
