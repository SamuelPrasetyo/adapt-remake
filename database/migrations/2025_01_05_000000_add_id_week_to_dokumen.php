<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Weekly Feedback (jenis = WEEKLY_FEEDBACK) adalah file laporan mingguan yang diupload
 * Kader dan terikat ke jadwal `weeks` per batch. Kolom id_week menautkan dokumen ke
 * minggu yang bersangkutan. Nullable agar jenis dokumen lain (FORM_IDP, POST_ACTIVITY,
 * PERJANJIAN_KERJA, TEMPLATE_IDP) yang tidak terikat minggu tetap valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            if (!Schema::hasColumn('dokumen', 'id_week')) {
                $table->integer('id_week')->nullable()->after('id_batch')
                    ->comment('Minggu (weeks.id_week) untuk dokumen WEEKLY_FEEDBACK');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            if (Schema::hasColumn('dokumen', 'id_week')) {
                $table->dropColumn('id_week');
            }
        });
    }
};
