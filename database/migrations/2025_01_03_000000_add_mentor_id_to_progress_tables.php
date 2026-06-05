<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Progress modul Mentor harus terpisah per mentor (tabel `mentor`), bukan per akun login
 * (tabel `users`). Satu akun Mentor bisa memegang banyak record mentor (mis. 1 akun =
 * Samuel + Rama + Deni), sehingga progress yang di-key oleh user_id saja membuat ketiganya
 * berbagi hasil test/post-activity yang sama.
 *
 * Migration ini menambah kolom mentor_id (mentor.id) pada tabel progress agar pengerjaan
 * modul oleh Mentor bisa dipisah per record mentor. Kader tetap pakai mentor_id = NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modul_test_results', function (Blueprint $table) {
            $table->char('mentor_id', 36)->nullable()->after('user_id')
                ->collation('utf8mb4_general_ci')
                ->comment('mentor.id — diisi bila pengerjaan oleh Mentor; NULL untuk Kader/akun sendiri');
            $table->index(['mentor_id', 'modul_id'], 'idx_mtr_mentor_modul');
        });

        Schema::table('modul_reading_progress', function (Blueprint $table) {
            $table->char('mentor_id', 36)->nullable()->after('user_id')
                ->collation('utf8mb4_general_ci')
                ->comment('mentor.id — diisi bila pengerjaan oleh Mentor; NULL untuk Kader/akun sendiri');
        });

        // Unique lama (user_id, modul_id) memblokir mentor berbeda dalam satu akun untuk
        // membaca materi modul yang sama. Ganti jadi (user_id, modul_id, mentor_id).
        Schema::table('modul_reading_progress', function (Blueprint $table) {
            $table->dropUnique('unique_user_modul');
            $table->unique(['user_id', 'modul_id', 'mentor_id'], 'unique_user_mentor_modul');
        });

        Schema::table('dokumen', function (Blueprint $table) {
            $table->char('mentor_master_id', 36)->nullable()->after('mentor_id')
                ->collation('utf8mb4_general_ci')
                ->comment('mentor.id — atribusi Post Activity ke record mentor tertentu; NULL untuk Kader/akun sendiri');
            $table->index(['mentor_master_id', 'modul_id', 'jenis'], 'idx_dok_mentor_modul');
        });
    }

    public function down(): void
    {
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropIndex('idx_dok_mentor_modul');
            $table->dropColumn('mentor_master_id');
        });

        Schema::table('modul_reading_progress', function (Blueprint $table) {
            $table->dropUnique('unique_user_mentor_modul');
            $table->unique(['user_id', 'modul_id'], 'unique_user_modul');
            $table->dropColumn('mentor_id');
        });

        Schema::table('modul_test_results', function (Blueprint $table) {
            $table->dropIndex('idx_mtr_mentor_modul');
            $table->dropColumn('mentor_id');
        });
    }
};
