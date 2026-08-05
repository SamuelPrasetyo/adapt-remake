<?php

namespace App\Constants;

/**
 * Struktur "Form Assessment MT Batch III FMC" (panel assessor).
 *
 * Tiap FMC dinilai oleh panel berisi 2 panelis, tapi FORMNYA SATU: skor yang diinput
 * HR BU sudah merupakan rata-rata penilaian Panelis 1 & 2. Yang dicatat per panelis
 * hanya identitasnya (nama & peran).
 *
 *   A. Informasi evaluasi + Nama Panelis 1 & 2
 *   B. Hard Competency (8 kompetensi, bobot internal total 100%)
 *   C. Soft Competency (8 kompetensi, bobot internal total 100%)
 *   D. Nilai akhir = (komposit hard × 70%) + (komposit soft × 30%)
 *   E. Area Kekuatan & Area Pengembangan (catatan panel)
 */
class PenilaianOjtStructure
{
    /** Bobot rekapitulasi skor panelis (bagian D pada form). */
    public const WEIGHTS = [
        'hard' => 0.70,
        'soft' => 0.30,
    ];

    public const FMC_NUMBERS = [1, 2, 3];

    public const PANELIS_NUMBERS = [1, 2];

    public static function all(): array
    {
        return [
            'hard'    => self::hard(),
            'soft'    => self::soft(),
            'weights' => self::WEIGHTS,
            'panelis' => self::PANELIS_NUMBERS,
        ];
    }

    /** B. HARD COMPETENCY — bobot dalam persen, total 100%. */
    public static function hard(): array
    {
        return [
            ['no' => 1, 'name' => 'Business Process Understanding',                   'bobot' => 22],
            ['no' => 2, 'name' => 'Problem Solving & Root Cause Analysis',            'bobot' => 17],
            ['no' => 3, 'name' => 'Data Analysis & Reporting',                        'bobot' => 15],
            ['no' => 4, 'name' => 'Project Management',                               'bobot' => 14],
            ['no' => 5, 'name' => 'Operational Excellence & Continuous Improvement',  'bobot' => 11],
            ['no' => 6, 'name' => 'Policy, SOP & Compliance Understanding',           'bobot' => 10],
            ['no' => 7, 'name' => 'Financial & Cost Awareness',                       'bobot' => 7],
            ['no' => 8, 'name' => 'Digital & System Literacy',                        'bobot' => 4],
        ];
    }

    /** C. SOFT COMPETENCY — bobot dalam persen, total 100%. */
    public static function soft(): array
    {
        return [
            ['no' => 1, 'name' => 'Proactive Ownership',                          'bobot' => 20],
            ['no' => 2, 'name' => 'Care & Effective Communication',               'bobot' => 17],
            ['no' => 3, 'name' => 'Customer Focus',                               'bobot' => 13],
            ['no' => 4, 'name' => 'Team Collaboration',                           'bobot' => 13],
            ['no' => 5, 'name' => 'Developing Self & Others',                     'bobot' => 13],
            ['no' => 6, 'name' => 'Business Result & Continuous Improvement',     'bobot' => 10],
            ['no' => 7, 'name' => 'People Partnership & Stakeholder Management',  'bobot' => 7],
            ['no' => 8, 'name' => 'Business Acumen & Cost Awareness',             'bobot' => 7],
        ];
    }

    public static function items(string $sheet): array
    {
        return $sheet === 'hard' ? self::hard() : self::soft();
    }

    /**
     * Daftar valid item_code untuk skor. Format: {hard|soft}.{no}
     */
    public static function validItemCodes(): array
    {
        $codes = [];
        foreach (['hard', 'soft'] as $sheet) {
            foreach (self::items($sheet) as $item) {
                $codes[] = "{$sheet}.{$item['no']}";
            }
        }
        return $codes;
    }

    /**
     * Daftar valid sub_code untuk catatan panel.
     */
    public static function validSubCodes(): array
    {
        return ['catatan.kekuatan', 'catatan.pengembangan'];
    }

    /**
     * Skor komposit 1 sheet (hard/soft): Σ(skor × bobot) ÷ Σ(bobot terisi).
     * Bila baru sebagian kompetensi yang dinilai, bobot dinormalisasi ke yang terisi saja
     * supaya angka sementara tidak terlihat jatuh. NULL = belum ada skor sama sekali.
     */
    public static function composite(array $skorMap, string $sheet): ?float
    {
        $weighted = 0.0;
        $bobotSum = 0.0;

        foreach (self::items($sheet) as $item) {
            $code = "{$sheet}.{$item['no']}";
            if (!isset($skorMap[$code]) || $skorMap[$code] === null || $skorMap[$code] === '') continue;

            $weighted += (float) $skorMap[$code] * $item['bobot'];
            $bobotSum += $item['bobot'];
        }

        return $bobotSum > 0 ? $weighted / $bobotSum : null;
    }

    /** Nilai akhir: hard 70% + soft 30% (dinormalisasi bila salah satu kosong). */
    public static function finalScore(?float $hard, ?float $soft): ?float
    {
        $sum = 0.0;
        $weightSum = 0.0;

        if ($hard !== null) { $sum += $hard * self::WEIGHTS['hard']; $weightSum += self::WEIGHTS['hard']; }
        if ($soft !== null) { $sum += $soft * self::WEIGHTS['soft']; $weightSum += self::WEIGHTS['soft']; }

        return $weightSum > 0 ? $sum / $weightSum : null;
    }
}
