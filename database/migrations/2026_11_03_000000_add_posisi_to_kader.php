<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Posisi kader di program MT: posisi saat masuk (awal) & setelah graduation.
 * Diisi Admin MAI dari menu "Posisi Kader" (input tabel atau import template Excel).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            if (!Schema::hasColumn('kader', 'posisi_awal')) {
                $table->string('posisi_awal', 150)->nullable();
            }
            if (!Schema::hasColumn('kader', 'posisi_graduate')) {
                $table->string('posisi_graduate', 150)->nullable();
            }
            if (!Schema::hasColumn('kader', 'posisi_updated_at')) {
                $table->timestamp('posisi_updated_at')->nullable();
            }
            if (!Schema::hasColumn('kader', 'posisi_updated_by')) {
                $table->char('posisi_updated_by', 36)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            $drop = array_values(array_filter(
                ['posisi_awal', 'posisi_graduate', 'posisi_updated_at', 'posisi_updated_by'],
                fn($c) => Schema::hasColumn('kader', $c)
            ));
            if ($drop) $table->dropColumn($drop);
        });
    }
};
