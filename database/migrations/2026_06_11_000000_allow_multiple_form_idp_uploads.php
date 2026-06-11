<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kader kini boleh mengupload File IDP berkali-kali (riwayat versi) walau batch-nya sama,
 * karena pendampingan berjalan 2-3 tahun meski batch hanya setahun sekali. Unique index
 * uniq_dokumen_per_batch_week memblokir baris FORM_IDP kedua, jadi diganti index biasa.
 *
 * Keunikan WEEKLY_FEEDBACK (satu baris per kader per minggu) tetap dijaga di level
 * aplikasi: WeeklyFeedbackController::store mengecek baris existing lalu meng-update
 * baris yang sama, bukan membuat baris baru.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropUnique('uniq_dokumen_per_batch_week');
            $table->index(['kader_id', 'jenis', 'id_batch', 'id_week'], 'idx_dokumen_per_batch_week');
        });
    }

    public function down(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropIndex('idx_dokumen_per_batch_week');
            $table->unique(['kader_id', 'jenis', 'id_batch', 'id_week'], 'uniq_dokumen_per_batch_week');
        });
    }
};
