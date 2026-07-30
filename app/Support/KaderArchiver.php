<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Arsip & pulihkan kader (soft delete) — aksi hapus DEFAULT di Master Kader.
 *
 * Tidak ada satu baris pun yang dihapus: kader hanya ditandai deleted_at,
 * sehingga penilaian OJT, feedback, dokumen, dan report historisnya tetap utuh
 * dan bisa dikembalikan. Akun login-nya dimatikan (users.status = 'Nonaktif')
 * karena LoginController hanya menerima status 'Aktif'.
 *
 * Dipakai lewat query builder, bukan $model->delete(), karena Kader punya
 * composite $primaryKey yang merusak operasi berbasis instance Eloquent.
 */
class KaderArchiver
{
    /**
     * Arsipkan kader + nonaktifkan akun loginnya, dalam satu transaksi.
     *
     * @return bool false bila kader tidak ada / sudah terarsip
     */
    public static function archive(string $kaderId, string $actorId): bool
    {
        return DB::transaction(function () use ($kaderId, $actorId) {
            $kader = DB::table('kader')->where('id', $kaderId)->whereNull('deleted_at')->first();
            if (!$kader) return false;

            DB::table('kader')->where('id', $kaderId)->update([
                'deleted_at' => now(),
                'deleted_by' => $actorId,
            ]);

            // Matikan login. Status dibiarkan apa adanya bila akunnya tidak ada.
            DB::table('users')->where('nik', $kader->nik)->where('type', 'Kader')->update([
                'status'     => 'Nonaktif',
                'updated_at' => now(),
                'updated_by' => $actorId,
            ]);

            return true;
        });
    }

    /**
     * Pulihkan kader dari arsip + aktifkan kembali akun loginnya.
     *
     * @return bool false bila kader tidak ada / tidak sedang terarsip
     */
    public static function restore(string $kaderId, string $actorId): bool
    {
        return DB::transaction(function () use ($kaderId, $actorId) {
            $kader = DB::table('kader')->where('id', $kaderId)->whereNotNull('deleted_at')->first();
            if (!$kader) return false;

            DB::table('kader')->where('id', $kaderId)->update([
                'deleted_at' => null,
                'deleted_by' => null,
                'updated_at' => now(),
                'updated_by' => $actorId,
            ]);

            DB::table('users')->where('nik', $kader->nik)->where('type', 'Kader')->update([
                'status'     => 'Aktif',
                'updated_at' => now(),
                'updated_by' => $actorId,
            ]);

            return true;
        });
    }
}
