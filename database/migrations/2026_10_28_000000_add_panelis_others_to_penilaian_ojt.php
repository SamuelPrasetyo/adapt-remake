<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panelis tambahan "Others" pada Form Assessment MT FMC.
 *
 * Panelis 1 & 2 tetap wajib (kolom panelis1_* / panelis2_*). Others opsional,
 * maksimal 3 orang, disimpan sebagai JSON: [{"nama": "...", "peran": "..."}, ...].
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penilaian_ojt', function (Blueprint $table) {
            if (!Schema::hasColumn('penilaian_ojt', 'panelis_others')) {
                $table->json('panelis_others')->nullable()->after('panelis2_peran');
            }
        });
    }

    public function down(): void
    {
        Schema::table('penilaian_ojt', function (Blueprint $table) {
            if (Schema::hasColumn('penilaian_ojt', 'panelis_others')) {
                $table->dropColumn('panelis_others');
            }
        });
    }
};
