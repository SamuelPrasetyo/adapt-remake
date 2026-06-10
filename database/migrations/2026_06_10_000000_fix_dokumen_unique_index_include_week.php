<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * uniq_idp_per_batch (kader_id, jenis, id_batch) terlalu ketat untuk WEEKLY_FEEDBACK:
 * Kader upload satu file per MINGGU dalam batch yang sama, sehingga upload minggu
 * kedua selalu gagal "Duplicate entry". Index diganti agar menyertakan id_week.
 *
 * id_week diubah menjadi NOT NULL DEFAULT 0 (0 = dokumen tidak terikat minggu).
 * Tanpa ini keunikan FORM_IDP per batch hilang, karena kolom NULL pada unique
 * index MySQL tidak pernah dianggap duplikat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropUnique('uniq_idp_per_batch');
        });

        DB::table('dokumen')->whereNull('id_week')->update(['id_week' => 0]);
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `id_week` int NOT NULL DEFAULT 0 COMMENT 'weeks.id_week untuk WEEKLY_FEEDBACK; 0 = tidak terikat minggu'");

        Schema::table('dokumen', function (Blueprint $table) {
            $table->unique(['kader_id', 'jenis', 'id_batch', 'id_week'], 'uniq_dokumen_per_batch_week');
        });
    }

    public function down(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropUnique('uniq_dokumen_per_batch_week');
        });

        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `id_week` int NULL DEFAULT NULL COMMENT 'Minggu (weeks.id_week) untuk dokumen WEEKLY_FEEDBACK'");
        DB::table('dokumen')->where('id_week', 0)->update(['id_week' => null]);

        Schema::table('dokumen', function (Blueprint $table) {
            $table->unique(['kader_id', 'jenis', 'id_batch'], 'uniq_idp_per_batch');
        });
    }
};
