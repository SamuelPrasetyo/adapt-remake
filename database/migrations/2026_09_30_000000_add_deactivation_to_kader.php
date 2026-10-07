<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Status Non Aktif untuk kader.
 *
 * Berbeda dari Arsip (deleted_at): kader Non Aktif TIDAK disembunyikan oleh
 * global scope SoftDeletes. Ia tetap tampil di All Kader (dengan badge) dan di
 * report historis, hanya akun loginnya dimatikan dan ia dikecualikan dari
 * statistik aktif.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            if (!Schema::hasColumn('kader', 'deactivated_at')) {
                $table->timestamp('deactivated_at')->nullable()->after('deleted_by');
            }
            if (!Schema::hasColumn('kader', 'deactivated_by')) {
                $table->char('deactivated_by', 36)->nullable()->after('deactivated_at');
            }
        });

        if (!$this->hasIndex('kader', 'idx_kader_deactivated_at')) {
            Schema::table('kader', function (Blueprint $table) {
                $table->index('deactivated_at', 'idx_kader_deactivated_at');
            });
        }
    }

    public function down(): void
    {
        if ($this->hasIndex('kader', 'idx_kader_deactivated_at')) {
            Schema::table('kader', function (Blueprint $table) {
                $table->dropIndex('idx_kader_deactivated_at');
            });
        }

        Schema::table('kader', function (Blueprint $table) {
            $drop = array_values(array_filter(
                ['deactivated_at', 'deactivated_by'],
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
