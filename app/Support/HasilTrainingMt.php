<?php

namespace App\Support;

use App\Models\Kader;

/**
 * Detail nilai in-class training MT untuk batch arsip (1 & 2).
 *
 * Batch arsip tidak melalui sistem, jadi rincian nilai trainingnya tidak ada di database —
 * hanya tersedia sebagai dokumen. Dokumen itu diketik ulang menjadi file JSON statis di
 * resources/data/ dan dibaca apa adanya oleh helper ini (read-only, tidak pernah ditulis).
 *
 * Menambah batch baru = taruh filenya di resources/data lalu daftarkan di self::FILES;
 * tombol & halamannya otomatis aktif untuk batch tersebut.
 *
 * Bentuk kolom tiap dokumen boleh beda — file mendeklarasikan sendiri kolom identitasnya
 * ("identitas": BU/Area untuk Batch 2, BU/Mentor/Jabatan untuk Batch 1) dan judul kolom
 * rata-ratanya (meta.label_avg), jadi frontend tidak perlu tahu batch mana yang dibuka.
 */
class HasilTrainingMt
{
    /** batch_no → nama file di resources/data. Batch yang tak terdaftar = belum ada datanya. */
    private const FILES = [
        1 => 'hasil_training_mt_batch_1.json',
        2 => 'hasil_training_mt_batch_2.json',
    ];

    /** Cache per-request supaya file yang sama tidak dibaca/di-decode berulang. */
    private static array $cache = [];

    /** Apakah batch ini sudah punya dokumen hasil training. */
    public static function availableFor(?int $batchNo): bool
    {
        return $batchNo !== null && isset(self::FILES[$batchNo]);
    }

    /** URL halaman detail nilai training kader, atau null bila batchnya belum punya data. */
    public static function hrefFor(string $kaderId, ?int $batchNo): ?string
    {
        return self::availableFor($batchNo) ? "/report-arsip/{$kaderId}/hasil-training" : null;
    }

    /**
     * Props halaman detail nilai training: seluruh tabel batch + penanda baris kader ini.
     * Seluruh tabel ikut dikirim karena halaman ini memang menampilkan dokumen sumbernya,
     * bukan sekadar potongan satu kader.
     *
     * @return array|null null bila batch kader belum punya dokumen hasil training.
     */
    public static function forKader($kader): ?array
    {
        $ctx = self::resolve($kader);
        if (!$ctx) return null;

        return [
            'meta'      => $ctx['data']['meta'] ?? [],
            'identitas' => $ctx['data']['identitas'] ?? [],
            'modul'     => $ctx['data']['modul'] ?? [],
            'peserta'   => $ctx['peserta'],
            'ringkas'   => self::ringkas($ctx['data']['modul'] ?? [], $ctx['peserta']),
            'focusNo'   => $ctx['focusNo'],
            'kader'     => [
                'id'         => $ctx['row']->id,
                'nama'       => $ctx['row']->nama,
                'bu'         => $ctx['row']->bu,
                'batch_name' => $ctx['row']->batch_name,
                'batch_year' => $ctx['row']->batch_year,
            ],
        ];
    }

    /**
     * Data grafik Learning Growth satu kader — dipakai Section A kartu report arsip supaya
     * batch arsip punya grafik seperti report sistem (batch 3+).
     *
     * @return array|null null bila batchnya belum punya dokumen ATAU kadernya tak tercatat
     *                    di dokumen itu (kartu tetap tampil, hanya tanpa grafik).
     */
    public static function chartFor($kader): ?array
    {
        $ctx = self::resolve($kader);
        if (!$ctx || $ctx['focusNo'] === null) return null;

        $focus = null;
        foreach ($ctx['peserta'] as $p) {
            if ($p['no'] === $ctx['focusNo']) { $focus = $p; break; }
        }
        if (!$focus) return null;

        return [
            'modul' => $ctx['data']['modul'] ?? [],
            'nilai' => $focus['nilai'] ?? [],
            'avg'   => $focus['avg'] ?? null,
            'kkm'   => $ctx['data']['meta']['kkm'] ?? 70,
            'rank'  => $focus['rank'] ?? null,
            'total' => count($ctx['peserta']),
        ];
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    /**
     * Dokumen batch kader + daftar pesertanya (sudah berperingkat) + nomor baris kadernya.
     * Dipakai bersama forKader() & chartFor() supaya aturan pencocokannya cuma ada satu.
     *
     * @return array|null {row, data, peserta, focusNo}; null bila batch belum punya dokumen.
     */
    private static function resolve($kader): ?array
    {
        $row = Kader::select(
                'kader.id',
                'kader.nama',
                'company.company_name as bu',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->where('kader.id', $kader->id)
            ->first();

        if (!$row) return null;

        $batchNo = $row->batch_name !== null ? (int) $row->batch_name : null;
        $data    = self::load($batchNo);
        if (!$data) return null;

        $peserta = self::withRank($data['peserta'] ?? []);
        $target  = self::normName($row->nama);

        // Cocokkan by nama ternormalisasi — sama seperti ArsipImporter mencocokkan Batch 2 ke
        // kader existing. Baris dokumen boleh menyimpan "nama_db" bila ejaannya beda dari DB.
        $focusNo = null;
        foreach ($peserta as $p) {
            $names = array_filter([$p['nama'] ?? null, $p['nama_db'] ?? null]);
            foreach ($names as $name) {
                if (self::normName($name) === $target) {
                    $focusNo = $p['no'];
                    break 2;
                }
            }
        }

        return ['row' => $row, 'data' => $data, 'peserta' => $peserta, 'focusNo' => $focusNo];
    }

    /** Baca + decode file dokumen batch (cached). null bila batch belum punya file. */
    private static function load(?int $batchNo): ?array
    {
        if (!self::availableFor($batchNo)) return null;

        if (!array_key_exists($batchNo, self::$cache)) {
            $path = resource_path('data/' . self::FILES[$batchNo]);
            $json = is_file($path) ? json_decode((string) file_get_contents($path), true) : null;
            self::$cache[$batchNo] = is_array($json) ? $json : null;
        }

        return self::$cache[$batchNo];
    }

    /**
     * Beri peringkat (1 = avg tertinggi) DAN kembalikan sudah terurut dari nilai tertinggi.
     * Dokumen Batch 1 memang sudah terurut begitu, Batch 2 masih urut BU — disamakan di sini
     * supaya tabelnya konsisten. Nomor asli dokumen tetap ada di kolom "no".
     */
    private static function withRank(array $peserta): array
    {
        usort($peserta, fn ($a, $b) => ($b['avg'] ?? 0) <=> ($a['avg'] ?? 0));

        foreach ($peserta as $i => &$p) {
            $p['rank'] = $i + 1;
        }
        unset($p);

        return $peserta;
    }

    /** Rata-rata per modul + rata-rata kelas, untuk baris footer & pembanding kader. */
    private static function ringkas(array $modul, array $peserta): array
    {
        $perModul = [];
        foreach ($modul as $m) {
            $vals = [];
            foreach ($peserta as $p) {
                $v = $p['nilai'][$m['key']] ?? null;
                if ($v !== null) $vals[] = (float) $v;
            }
            $perModul[$m['key']] = $vals ? round(array_sum($vals) / count($vals), 1) : null;
        }

        $avgs = array_values(array_filter(array_column($peserta, 'avg'), fn ($v) => $v !== null));

        return [
            'per_modul' => $perModul,
            'avg_kelas' => $avgs ? round(array_sum($avgs) / count($avgs), 1) : null,
            'jml_kader' => count($peserta),
        ];
    }

    private static function normName(string $s): string
    {
        return preg_replace('/\s+/', ' ', mb_strtolower(trim($s)));
    }
}
