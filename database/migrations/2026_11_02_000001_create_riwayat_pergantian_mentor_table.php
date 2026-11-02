<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Riwayat assign/unassign kader ke mentor dari Master Mentor.
 *
 * Satu baris per kader yang berubah per submit. Bila batch kader sudah berjalan
 * (batch.tanggal_mulai <= hari ini), submit wajib menyertakan dokumen pendukung PDF
 * + alasan — keduanya disimpan di semua baris dari submit tsb (satu file dipakai
 * bersama). Perubahan sebelum batch mulai tetap dicatat dengan kolom file NULL.
 *
 * Sengaja tidak memakai tabel dokumen: unique index (kader_id, jenis, id_batch, id_week)
 * di sana tidak memungkinkan lebih dari satu pergantian per kader per batch.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_pergantian_mentor', function (Blueprint $table) {
            // Samakan dgn kader/mentor (general_ci) — default config Laravel (unicode_ci)
            // bikin JOIN gagal "Illegal mix of collations".
            $table->charset   = 'utf8mb4';
            $table->collation = 'utf8mb4_general_ci';

            $table->char('id', 36)->primary();
            $table->char('mentor_id', 36);
            $table->char('kader_id', 36);
            $table->integer('id_batch')->nullable();
            $table->enum('aksi', ['ASSIGN', 'UNASSIGN']);
            $table->text('alasan')->nullable();
            $table->string('nama_file')->nullable();
            $table->string('path_file')->nullable();
            // users.id memakai unicode_ci — kolom ini di-JOIN ke sana, jadi ikut unicode_ci.
            $table->char('created_by', 36)->collation('utf8mb4_unicode_ci')->nullable()->comment('users.id (admin)');
            $table->timestamp('created_at')->nullable();

            $table->index(['kader_id', 'id_batch']);
            $table->index('mentor_id');
        });
    }

    public function down(): void
    {
        // File fisiknya dibiarkan di public/uploads/pergantian_mentor — hapus manual bila perlu.
        Schema::dropIfExists('riwayat_pergantian_mentor');
    }
};
