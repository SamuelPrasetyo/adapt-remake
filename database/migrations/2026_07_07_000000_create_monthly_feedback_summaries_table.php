<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Summary Monthly Feedback — ringkasan yang ditulis Admin MAI atas Monthly Feedback
 * mentor (tersimpan di tabel `jawaban`, type 'Mentor Monthly'). Satu ringkasan per
 * kader per bulan; dikunci UNIQUE(kader_id, bulan, tahun) sehingga updateOrCreate
 * di controller cukup untuk membuat/mengubah tanpa baris duplikat.
 *
 * Kolom `summary` bertipe TEXT (tanpa batas panjang di DB); batas 1000 karakter
 * dijaga di level aplikasi lewat validasi controller (max:1000).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('monthly_feedback_summaries')) return;

        Schema::create('monthly_feedback_summaries', function (Blueprint $table) {
            $table->charset   = 'utf8mb4';
            $table->collation = 'utf8mb4_general_ci';

            $table->bigIncrements('id');
            $table->char('kader_id', 36);
            $table->unsignedTinyInteger('bulan')->comment('1-12');
            $table->unsignedSmallInteger('tahun');
            $table->text('summary');
            $table->char('created_by', 36)->nullable()->comment('users.id (Admin MAI)');
            $table->char('updated_by', 36)->nullable()->comment('users.id (Admin MAI)');
            $table->timestamps();

            $table->unique(['kader_id', 'bulan', 'tahun'], 'uniq_kader_month');
            $table->index('kader_id', 'idx_mfs_kader');
            $table->foreign('kader_id', 'fk_mfs_kader')
                ->references('id')->on('kader')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_feedback_summaries');
    }
};
