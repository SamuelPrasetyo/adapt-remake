<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Nonaktifkan & aktifkan kembali kader (Admin MAI).
 *
 * Bukan Arsip: baris kader tidak diberi deleted_at, jadi tetap tampil di All
 * Kader dan report historis. Yang berubah hanya kader.deactivated_at/by dan
 * akun loginnya (users.status = 'Nonaktif'), yang ditolak LoginController dan
 * EnsureAccountActive.
 *
 * Dipakai lewat query builder, bukan $model->save(), karena Kader punya
 * composite $primaryKey yang merusak operasi berbasis instance Eloquent.
 */
class KaderDeactivator
{
    /**
     * @return bool false bila kader tidak ada, terarsip, atau sudah nonaktif
     */
    public static function deactivate(string $kaderId, string $actorId): bool
    {
        return DB::transaction(function () use ($kaderId, $actorId) {
            $kader = DB::table('kader')
                ->where('id', $kaderId)
                ->whereNull('deleted_at')
                ->whereNull('deactivated_at')
                ->first();
            if (!$kader) return false;

            DB::table('kader')->where('id', $kaderId)->update([
                'deactivated_at' => now(),
                'deactivated_by' => $actorId,
                'updated_at'     => now(),
                'updated_by'     => $actorId,
            ]);

            DB::table('users')->where('nik', $kader->nik)->where('type', 'Kader')->update([
                'status'     => 'Nonaktif',
                'updated_at' => now(),
                'updated_by' => $actorId,
            ]);

            return true;
        });
    }

    /**
     * @return bool false bila kader tidak ada, terarsip, atau tidak sedang nonaktif
     */
    public static function reactivate(string $kaderId, string $actorId): bool
    {
        return DB::transaction(function () use ($kaderId, $actorId) {
            $kader = DB::table('kader')
                ->where('id', $kaderId)
                ->whereNull('deleted_at')
                ->whereNotNull('deactivated_at')
                ->first();
            if (!$kader) return false;

            DB::table('kader')->where('id', $kaderId)->update([
                'deactivated_at' => null,
                'deactivated_by' => null,
                'updated_at'     => now(),
                'updated_by'     => $actorId,
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
