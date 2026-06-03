<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Tabel yang perlu diubah ke utf8mb4_general_ci (sesuai adapt_nag):
    // - departemens, divisis, kader   → sudah ada di production dengan unicode_ci
    // - 6 tabel baru                  → dibuat migration 1 dengan unicode_ci (warisan config Laravel)
    private array $tables = [
        'departemens',
        'divisis',
        'kader',
        'mentor',
        'list_kader_per_mentor',
        'modul_reading_progress',
        'penilaian_ojt',
        'penilaian_ojt_komentar',
        'penilaian_ojt_skor',
    ];

    public function up(): void
    {
        // MySQL tidak mengizinkan CONVERT TO CHARACTER SET pada kolom yang direferensikan
        // atau mereferensikan FK — perlu drop FK dulu, convert, lalu add kembali.

        // Step 1: drop FK yang terlibat (child-tables first)
        DB::statement('ALTER TABLE `penilaian_ojt_komentar` DROP FOREIGN KEY `fk_pok_penilaian`');
        DB::statement('ALTER TABLE `penilaian_ojt_skor`     DROP FOREIGN KEY `fk_pos_penilaian`');
        DB::statement('ALTER TABLE `penilaian_ojt`          DROP FOREIGN KEY `fk_po_kader`');

        // Step 2: convert semua tabel
        foreach ($this->tables as $table) {
            DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        }

        // Step 3: restore FK constraints
        DB::statement('ALTER TABLE `penilaian_ojt`
            ADD CONSTRAINT `fk_po_kader`
            FOREIGN KEY (`kader_id`) REFERENCES `kader` (`id`) ON DELETE CASCADE');

        DB::statement('ALTER TABLE `penilaian_ojt_komentar`
            ADD CONSTRAINT `fk_pok_penilaian`
            FOREIGN KEY (`id_penilaian_ojt`) REFERENCES `penilaian_ojt` (`id_penilaian_ojt`) ON DELETE CASCADE');

        DB::statement('ALTER TABLE `penilaian_ojt_skor`
            ADD CONSTRAINT `fk_pos_penilaian`
            FOREIGN KEY (`id_penilaian_ojt`) REFERENCES `penilaian_ojt` (`id_penilaian_ojt`) ON DELETE CASCADE');
    }

    public function down(): void
    {
        // Drop FK → balik collation → restore FK
        DB::statement('ALTER TABLE `penilaian_ojt_komentar` DROP FOREIGN KEY `fk_pok_penilaian`');
        DB::statement('ALTER TABLE `penilaian_ojt_skor`     DROP FOREIGN KEY `fk_pos_penilaian`');
        DB::statement('ALTER TABLE `penilaian_ojt`          DROP FOREIGN KEY `fk_po_kader`');

        // departemens, divisis, kader → unicode_ci (collation lama di adapt_production)
        foreach (['departemens', 'divisis', 'kader'] as $table) {
            DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }

        // 6 tabel baru (dibuat migration 1 dengan unicode_ci)
        foreach (['mentor', 'list_kader_per_mentor', 'modul_reading_progress',
                  'penilaian_ojt', 'penilaian_ojt_komentar', 'penilaian_ojt_skor'] as $table) {
            DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }

        // Restore FK
        DB::statement('ALTER TABLE `penilaian_ojt`
            ADD CONSTRAINT `fk_po_kader`
            FOREIGN KEY (`kader_id`) REFERENCES `kader` (`id`) ON DELETE CASCADE');

        DB::statement('ALTER TABLE `penilaian_ojt_komentar`
            ADD CONSTRAINT `fk_pok_penilaian`
            FOREIGN KEY (`id_penilaian_ojt`) REFERENCES `penilaian_ojt` (`id_penilaian_ojt`) ON DELETE CASCADE');

        DB::statement('ALTER TABLE `penilaian_ojt_skor`
            ADD CONSTRAINT `fk_pos_penilaian`
            FOREIGN KEY (`id_penilaian_ojt`) REFERENCES `penilaian_ojt` (`id_penilaian_ojt`) ON DELETE CASCADE');
    }
};
