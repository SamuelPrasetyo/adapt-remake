<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Soft delete untuk Master Kader.
 *
 * Kader tidak dihapus permanen oleh aksi biasa — cukup diarsipkan (deleted_at
 * terisi) supaya seluruh jejaknya (penilaian OJT, feedback mentor, dokumen,
 * progress modul, report arsip) tetap utuh dan bisa dipulihkan. Mengikuti
 * konvensi yang sudah dipakai tabel `mentor` dan `list_kader_per_mentor`:
 * kolom manual deleted_at + deleted_by, bukan hanya trait Eloquent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            if (!Schema::hasColumn('kader', 'deleted_at')) {
                $table->timestamp('deleted_at')->nullable()->after('updated_by');
            }
            if (!Schema::hasColumn('kader', 'deleted_by')) {
                $table->char('deleted_by', 36)->nullable()->after('deleted_at');
            }
        });

        if (!$this->hasIndex('kader', 'idx_kader_deleted_at')) {
            Schema::table('kader', function (Blueprint $table) {
                $table->index('deleted_at', 'idx_kader_deleted_at');
            });
        }
    }

    public function down(): void
    {
        if ($this->hasIndex('kader', 'idx_kader_deleted_at')) {
            Schema::table('kader', function (Blueprint $table) {
                $table->dropIndex('idx_kader_deleted_at');
            });
        }

        Schema::table('kader', function (Blueprint $table) {
            $drop = array_values(array_filter(
                ['deleted_at', 'deleted_by'],
                fn($c) => Schema::hasColumn('kader', $c)
            ));
            if ($drop) $table->dropColumn($drop);
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return count(DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index])) > 0;
    }
};
