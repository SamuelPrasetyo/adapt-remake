<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Hapus PERMANEN seorang kader beserta seluruh turunannya — tidak bisa dibatalkan.
 *
 * Hanya dipanggil dari jalur yang sudah dijaga berlapis (Admin MAI 021, dari tab
 * Arsip, konfirmasi ketik NIK). Untuk penghapusan sehari-hari pakai KaderArchiver.
 *
 * Kenapa manual dan bukan cascade DB: dari belasan tabel yang menautkan kader,
 * hanya 4 yang punya FK constraint, dan tautannya lewat tiga identitas berbeda
 * (kader.id, users.id, nik) dengan dua kolom yang namanya menyesatkan. Peta
 * lengkapnya ada di App\Support\KaderRelations — kalau ada tabel baru, tambahkan
 * di KEDUA kelas supaya "yang dihitung" dan "yang dihapus" tidak pernah beda.
 *
 * Sebelum menghapus, seluruh baris di-snapshot ke JSON di
 * storage/app/purged-kader/ sebagai jaring pengaman terakhir.
 */
class KaderPurger
{
    /** Folder snapshot di disk `local` (storage/app). */
    public const SNAPSHOT_DIR = 'purged-kader';

    /**
     * @return array{snapshot:string,deleted:array<string,int>,files_deleted:int,files_missing:int}
     */
    public static function purge(string $kaderId): array
    {
        $kader = DB::table('kader')->where('id', $kaderId)->first();
        if (!$kader) {
            throw new \RuntimeException('Kader tidak ditemukan.');
        }

        $id     = KaderRelations::identity($kader);
        $userId = $id['user_id'];
        $nik    = $id['nik'];

        $dokIds       = KaderRelations::dokumenIds($id);
        $penilaianIds = DB::table('penilaian_ojt')->where('kader_id', $kaderId)
            ->pluck('id_penilaian_ojt')->all();
        $resultIds    = $userId
            ? DB::table('modul_test_results')->where('user_id', $userId)->pluck('id')->all()
            : [];

        // Query builder per tabel, dipakai dua kali: sekali untuk snapshot, sekali
        // untuk delete. Urutan array = urutan hapus (anak sebelum induk).
        $targets = [
            'modul_user_answers'         => fn() => DB::table('modul_user_answers')->whereIn('result_id', $resultIds ?: [-1]),
            'modul_test_results'         => fn() => self::byUser('modul_test_results', $userId),
            'modul_test_attempts'        => fn() => self::byUser('modul_test_attempts', $userId),
            'modul_reading_progress'     => fn() => self::byUser('modul_reading_progress', $userId),
            'modul_activity'             => fn() => self::byUser('modul_activity', $userId),
            'user_jawaban'               => fn() => self::byUser('user_jawaban', $userId),
            'evaluasi_mentor'            => fn() => self::byUser('evaluasi_mentor', $userId),
            'modul_user'                 => fn() => self::byUser('modul_user', $userId),
            'modul_assignments'          => fn() => DB::table('modul_assignments')
                ->where('assignable_type', 'user')->where('assignable_id', $kaderId),
            'penilaian_post_activity'    => fn() => DB::table('penilaian_post_activity')
                ->whereIn('dokumen_id', $dokIds ?: [-1]),
            'dokumen'                    => fn() => DB::table('dokumen')->whereIn('id', $dokIds ?: [-1]),
            'penilaian_ojt_skor'         => fn() => DB::table('penilaian_ojt_skor')
                ->whereIn('id_penilaian_ojt', $penilaianIds ?: ['-']),
            'penilaian_ojt_komentar'     => fn() => DB::table('penilaian_ojt_komentar')
                ->whereIn('id_penilaian_ojt', $penilaianIds ?: ['-']),
            'penilaian_ojt'              => fn() => DB::table('penilaian_ojt')->where('kader_id', $kaderId),
            'monthly_feedback_summaries' => fn() => DB::table('monthly_feedback_summaries')->where('kader_id', $kaderId),
            'list_kader_per_mentor'      => fn() => DB::table('list_kader_per_mentor')->where('kader_id', $kaderId),
            'report_arsip'               => fn() => DB::table('report_arsip')->where('kader_id', $kaderId),
            'jawaban'                    => fn() => self::byNik('jawaban', 'nik_kader', $nik),
            'feedback_mai'               => fn() => self::byNik('feedback_mai', 'nik_kader', $nik),
            'performance_summary'        => fn() => self::byNik('performance_summary', 'nik_kader', $nik),
            'users'                      => fn() => $nik === ''
                ? DB::table('users')->whereRaw('1 = 0')
                : DB::table('users')->where('nik', $nik)->where('type', 'Kader'),
            'kader'                      => fn() => DB::table('kader')->where('id', $kaderId),
        ];

        // Snapshot dulu, di luar transaksi — kalau menulis file gagal, batalkan
        // seluruh purge sebelum ada satu baris pun yang hilang.
        $snapshot = ['purged_at' => now()->toDateTimeString(), 'identity' => $id, 'rows' => []];
        foreach ($targets as $table => $query) {
            $snapshot['rows'][$table] = $query()->get()->map(fn($r) => (array) $r)->all();
        }

        $path = self::SNAPSHOT_DIR . '/' . ($nik !== '' ? $nik : $kaderId) . '_' . now()->format('Ymd_His') . '.json';
        $written = Storage::disk('local')->put(
            $path,
            json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        if (!$written) {
            throw new \RuntimeException('Gagal menulis snapshot backup — penghapusan dibatalkan.');
        }

        // Path file diambil dari snapshot dokumen; file baru dihapus setelah DB
        // commit, supaya kegagalan transaksi tidak menyisakan record tanpa file.
        $filePaths = array_values(array_filter(array_map(
            fn($row) => $row['path_file'] ?? null,
            $snapshot['rows']['dokumen']
        )));

        $deleted = DB::transaction(function () use ($targets) {
            $out = [];
            foreach ($targets as $table => $query) {
                $n = $query()->delete();
                if ($n > 0) $out[$table] = $n;
            }
            return $out;
        });

        $filesDeleted = 0;
        $filesMissing = 0;
        foreach ($filePaths as $p) {
            if (Storage::disk('public')->exists($p)) {
                Storage::disk('public')->delete($p);
                $filesDeleted++;
            } else {
                $filesMissing++;
            }
        }

        return [
            'snapshot'      => $path,
            'deleted'       => $deleted,
            'files_deleted' => $filesDeleted,
            'files_missing' => $filesMissing,
        ];
    }

    /** Query kosong bila kader tidak punya akun users — semua tabel ini ber-key users.id. */
    private static function byUser(string $table, ?string $userId)
    {
        return $userId
            ? DB::table($table)->where('user_id', $userId)
            : DB::table($table)->whereRaw('1 = 0');
    }

    private static function byNik(string $table, string $column, string $nik)
    {
        return $nik === ''
            ? DB::table($table)->whereRaw('1 = 0')
            : DB::table($table)->where($column, $nik);
    }
}
