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
 * - Skor Akhir = rata-rata komponen yang SUDAH dinilai di antara:
 *     • Post Test       (bila modul punya test / has_test = true)
 *     • Post Activity   (bila modul punya PA  / has_post_activity = true)
 *   Komponen yang belum dinilai diabaikan (mis. Post Activity masih pending → skor = Post Test
 *   saja). Mengembalikan null bila belum ada satu pun komponen yang bisa dinilai.
 */
class ModulScore
{
    /**
     * Skor Akhir satu modul. Pre Test diabaikan.
     *
     * @param  bool        $hasTest    modul punya Pre/Post Test
     * @param  bool        $hasPA      modul punya Post Activity
     * @param  float|int|null $postScore  skor Post Test (null bila belum dikerjakan)
     * @param  float|int|null $paNilai    nilai Post Activity (null bila belum dinilai)
     * @return float|null   null bila belum ada komponen yang bisa dinilai
     */
    public static function finalScore(bool $hasTest, bool $hasPA, $postScore, $paNilai): ?float
    {
        $parts = [];
        if ($hasTest && $postScore !== null) $parts[] = (float) $postScore;
        if ($hasPA   && $paNilai   !== null) $parts[] = (float) $paNilai;

        if (empty($parts)) return null;

        return round(array_sum($parts) / count($parts), 2);
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
}
