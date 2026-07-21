<?php

namespace App\Support;

/**
 * Sumber tunggal rumus skor modul ADAPT.
 *
 * SEMUA halaman yang menampilkan "Skor Akhir" / "Avg Score" modul WAJIB memakai helper ini
 * (Program Saya, Kader Saya list & detail, Dashboard "Kader binaan", Detail Modul). Tujuannya
 * agar rumus seragam dan cukup diubah di satu tempat — bukan satu-per-satu di tiap controller.
 *
 * ATURAN PENTING:
 * - Pre Test TIDAK PERNAH masuk Skor Akhir. Pre Test hanya alat ukur kemampuan awal sebelum
 *   belajar, jadi tidak boleh menaikkan/menurunkan skor pencapaian.
 * - Skor Modul = (60% × Post Test) + (40% × Post Activity), memakai komponen yang SUDAH dinilai:
 *     • Post Test       (bila modul punya test / has_test = true)
 *     • Post Activity   (bila modul punya PA  / has_post_activity = true)
 *   Bila hanya SATU komponen yang tersedia/dinilai (mis. modul tanpa PA, atau PA masih pending),
 *   komponen itu berbobot 100% — bukan dianggap 0. Mengembalikan null bila belum ada satu pun
 *   komponen yang bisa dinilai.
 */
class ModulScore
{
    /** Bobot Skor Modul saat Post Test & Post Activity dua-duanya sudah dinilai. Total harus 1.0. */
    public const POST_TEST_WEIGHT     = 0.6;
    public const POST_ACTIVITY_WEIGHT = 0.4;

    /**
     * Skor Akhir satu modul. Pre Test diabaikan.
     *
     *   Skor Modul = (60% × Post Test) + (40% × Post Activity)
     *
     * Hanya salah satu komponen yang ada → komponen itu dipakai 100%.
     *
     * @param  bool        $hasTest    modul punya Pre/Post Test
     * @param  bool        $hasPA      modul punya Post Activity
     * @param  float|int|null $postScore  skor Post Test (null bila belum dikerjakan)
     * @param  float|int|null $paNilai    nilai Post Activity (null bila belum dinilai)
     * @return float|null   null bila belum ada komponen yang bisa dinilai
     */
    public static function finalScore(bool $hasTest, bool $hasPA, $postScore, $paNilai): ?float
    {
        $post = ($hasTest && $postScore !== null) ? (float) $postScore : null;
        $pa   = ($hasPA   && $paNilai   !== null) ? (float) $paNilai   : null;

        if ($post !== null && $pa !== null) {
            return round(self::POST_TEST_WEIGHT * $post + self::POST_ACTIVITY_WEIGHT * $pa, 2);
        }

        if ($post !== null) return round($post, 2);
        if ($pa   !== null) return round($pa, 2);

        return null;
    }

    /**
     * Rata-rata Skor Akhir beberapa modul. Nilai null (modul belum bisa dinilai) tidak ikut
     * dijumlah. Hasil TIDAK dibulatkan agar pemanggil bebas membulatkan sesuai tampilan.
     *
     * @param  array      $finalScores  daftar hasil finalScore() per modul (boleh berisi null)
     * @param  int|null   $divisor      null  → bagi jumlah modul yang sudah punya skor
     *                                  angka → bagi angka itu (mis. total modul di-assign),
     *                                          sehingga modul belum dinilai menurunkan rata-rata
     * @return float|null null bila tak ada skor sama sekali (mode null) / divisor <= 0
     */
    public static function average(array $finalScores, ?int $divisor = null): ?float
    {
        $scored = array_values(array_filter($finalScores, fn ($s) => $s !== null));

        if ($divisor === null) {
            return empty($scored) ? null : array_sum($scored) / count($scored);
        }

        if ($divisor <= 0) return null;

        return array_sum($scored) / $divisor;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Rumus "Learning Growth" (dokumentasi Stakeholder). Dipakai oleh grafik
    // Learning Growth di Kader Saya / Detail. Berbeda dari finalScore() di atas:
    // di sini titik grafik = LGS (Learning Growth Score) yang berbasis KENAIKAN
    // nilai (KG) pre→post test, bukan rata-rata skor mentah Post Test + PA.
    // ──────────────────────────────────────────────────────────────────────────

    /** Skor maksimum tiap komponen (pre/post test & nilai tugas) — default 100. */
    public const MAX_SCORE = 100.0;

    /** Bobot KG & AS pada LGS modul ber-tugas. Total harus 1.0 (lihat learningGrowth). */
    public const KG_WEIGHT = 0.6;
    public const AS_WEIGHT = 0.4;

    /**
     * KG (Knowledge Gain) — persentase "ruang naik" yang berhasil dipakai dari pre→post test.
     *
     *   KG = (post − pre) / (max − pre)
     *
     * Kasus khusus: pre sudah = max (sempurna sejak awal) → KG = 100% (hindari bagi 0).
     * Dikembalikan dalam skala 0–100. Null bila pre/post belum ada (tak bisa dihitung).
     *
     * @param  float|int|null $preScore  skor Pre Test
     * @param  float|int|null $postScore skor Post Test
     */
    public static function knowledgeGain($preScore, $postScore, float $max = self::MAX_SCORE): ?float
    {
        if ($preScore === null || $postScore === null) return null;

        $pre  = (float) $preScore;
        $post = (float) $postScore;

        if ($pre >= $max) return 100.0;

        return round((($post - $pre) / ($max - $pre)) * 100, 2);
    }

    /**
     * AS (Application Score) — nilai tugas (Post Activity) relatif nilai tertinggi.
     *
     *   AS = nilai / max
     *
     * Hanya untuk modul ber-Post Activity. Skala 0–100. Null bila belum dinilai
     * (0% berarti "tugas jelek", bukan "tidak ada tugas" — dua hal berbeda).
     *
     * @param  float|int|null $paNilai nilai Post Activity
     */
    public static function applicationScore($paNilai, float $max = self::MAX_SCORE): ?float
    {
        if ($paNilai === null || $max <= 0) return null;

        return round(((float) $paNilai / $max) * 100, 2);
    }

    /**
     * LGS (Learning Growth Score) — skor akhir satu modul untuk grafik Learning Growth.
     *
     *   • modul ber-tugas (hasPA): LGS = (KG_WEIGHT × KG) + (AS_WEIGHT × AS)
     *   • modul tanpa tugas:        LGS = KG
     *
     * Null bila komponen yang diperlukan belum lengkap (titik tidak digambar di grafik):
     * KG wajib selalu ada; modul ber-tugas WAJIB punya AS juga.
     *
     * @param  bool       $hasPA modul punya Post Activity
     * @param  float|null $kg    hasil knowledgeGain()
     * @param  float|null $as    hasil applicationScore() (null bila modul tanpa tugas)
     */
    public static function learningGrowth(bool $hasPA, ?float $kg, ?float $as): ?float
    {
        if ($kg === null) return null;

        if (!$hasPA) return round($kg, 2);

        if ($as === null) return null;

        return round(self::KG_WEIGHT * $kg + self::AS_WEIGHT * $as, 2);
    }

    /**
     * Skor feedback mingguan = rata-rata 4 aspek Penilaian Kinerja yang diberikan mentor:
     * (Routine Job + Assignment + Pemahaman SOP + Project) / 4. Skala mengikuti slider 1–10.
     *
     * Catatan: query SQL weeklyData (KaderSayaController) memakai SUM(4 aspek)/4 yang ekuivalen
     * dengan rumus ini — jika nanti dipindah ke PHP, pakai helper ini agar tetap satu sumber.
     *
     * @return float|null null bila belum ada satu pun aspek terisi
     */
    public static function feedbackWeekScore($routineJob, $assignment, $pemahamanSop, $project): ?float
    {
        $parts = array_filter(
            [$routineJob, $assignment, $pemahamanSop, $project],
            fn ($v) => $v !== null
        );

        if (empty($parts)) return null;

        return array_sum($parts) / 4;
    }

    /**
     * Avg Feedback = rata-rata skor feedback mingguan di seluruh minggu yang sudah diisi mentor.
     * Langkah kedua dari rumus: skor per minggu (lihat feedbackWeekScore) dibagi jumlah minggu.
     *
     * @param  array $weekScores  daftar skor per minggu (boleh berisi null untuk minggu kosong)
     * @return float|null null bila belum ada minggu yang diisi
     */
    public static function feedbackAverage(array $weekScores): ?float
    {
        $scored = array_values(array_filter($weekScores, fn ($s) => $s !== null));

        if (empty($scored)) return null;

        return array_sum($scored) / count($scored);
    }
}
