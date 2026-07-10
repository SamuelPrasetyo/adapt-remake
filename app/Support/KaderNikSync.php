<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Sinkronisasi perubahan NIK kader ke semua tabel yang menautkan data lewat NIK
 * (bukan lewat kader.id). Dipanggil saat admin mengubah NIK di Master Kader —
 * misal upgrade NIK sementara → NIK resmi — supaya login & progress tidak orphan.
 *
 * Peta identitas:
 *  - users.nik              → kunci login + satu-satunya tautan users↔kader.
 *                             users.id TIDAK diubah, sehingga semua data ber-key
 *                             users.id (modul_test_results, modul_reading_progress,
 *                             dokumen.kader_id, jawaban.created_by, dst.) tetap
 *                             tertaut tanpa perlu disentuh.
 *  - jawaban.nik_kader      → feedback mentor tentang kader (weekly/monthly).
 *  - feedback_mai.nik_kader → feedback MAI.
 *
 * Tabel ber-key kader.id (penilaian_ojt, list_kader_per_mentor, modul_assignments,
 * monthly_feedback_summaries, report_arsip) aman karena kader.id tidak berubah.
 */
class KaderNikSync
{
    /**
     * Ganti NIK lama → baru pada tabel-tabel bertautan NIK, dalam satu transaksi.
     * Aman dipanggil di dalam transaksi luar (Laravel memakai savepoint).
     *
     * @return array{users:int,jawaban:int,feedback_mai:int} jumlah baris ter-update per tabel
     */
    public static function rename(string $oldNik, string $newNik): array
    {
        $oldNik = trim($oldNik);
        $newNik = trim($newNik);
        if ($oldNik === '' || $newNik === '' || $oldNik === $newNik) {
            return ['users' => 0, 'jawaban' => 0, 'feedback_mai' => 0];
        }

        return DB::transaction(function () use ($oldNik, $newNik) {
            return [
                'users'        => DB::table('users')->where('nik', $oldNik)
                    ->update(['nik' => $newNik, 'updated_at' => now()]),
                'jawaban'      => DB::table('jawaban')->where('nik_kader', $oldNik)
                    ->update(['nik_kader' => $newNik]),
                'feedback_mai' => DB::table('feedback_mai')->where('nik_kader', $oldNik)
                    ->update(['nik_kader' => $newNik]),
            ];
        });
    }
}
