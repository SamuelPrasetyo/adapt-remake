<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Soft delete untuk isi feedback/refleksi dan jadwal minggunya.
 *
 * Dipakai saat jadwal dikembalikan ke ritme dwi-mingguan (`weeks:revert-biweekly`):
 * isi minggu ganjil tidak dihapus permanen, hanya diarsipkan supaya masih bisa
 * dipulihkan bila suatu saat diperlukan. Baris `weeks`/`weeks_kader` ganjilnya ikut
 * di-soft delete — kalau dihapus permanen, jawaban yang diarsipkan akan menunjuk ke
 * minggu yang sudah tidak ada dan tidak bisa dipulihkan utuh.
 *
 * Mengikuti konvensi tabel `kader`/`mentor`: kolom deleted_at + index.
 */
return new class extends Migration
{
    /** Tabel yang mendapat deleted_at => kolom yang diikuti posisinya. */
    private array $targets = [
        'jawaban'      => 'updated_at',
        'feedback_mai' => 'updated_at',
        'weeks'        => 'updated_by',
        'weeks_kader'  => 'updated_by',
    ];

    public function up(): void
    {
        foreach ($this->targets as $table => $after) {
            if (!Schema::hasTable($table)) continue;

            Schema::table($table, function (Blueprint $t) use ($table, $after) {
                if (!Schema::hasColumn($table, 'deleted_at')) {
                    $col = $t->timestamp('deleted_at')->nullable();
                    if (Schema::hasColumn($table, $after)) $col->after($after);
                }
            });

            $index = "idx_{$table}_deleted_at";
            if (!$this->hasIndex($table, $index)) {
                Schema::table($table, function (Blueprint $t) use ($index) {
                    $t->index('deleted_at', $index);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->targets as $table => $after) {
            if (!Schema::hasTable($table)) continue;

            $index = "idx_{$table}_deleted_at";
            if ($this->hasIndex($table, $index)) {
                Schema::table($table, function (Blueprint $t) use ($index) {
                    $t->dropIndex($index);
                });
            }

            if (Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('deleted_at');
                });
            }
        }
    }

    private function hasIndex(string $table, string $index): bool
    {
        return count(DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index])) > 0;
    }
};
