<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Menu "Upload > Dokumen Psikotest" (Admin MAI 021) menyimpan hasil psikotest tiap kader
 * sebagai dokumen.jenis = 'PSIKOTEST' (satu file per kader, dokumen.kader_id = kader.id).
 * Enum kolom jenis ditambah anggota PSIKOTEST; anggota lain tetap seperti migrasi
 * 2026_07_03_000000_add_generic_jenis_to_dokumen.
 */
return new class extends Migration
{
    private const JENIS_LAMA = [
        'OJT_REPORT', 'POST_ACTIVITY', 'FORM_IDP', 'TEMPLATE_IDP', 'PERJANJIAN_KERJA',
        'REFLEKSI', 'WEEKLY_FEEDBACK', 'TEMPLATE_PERJANJIAN_KERJA', 'TEMPLATE_WEEKLY_FEEDBACK',
        'DOKUMEN', 'LAPORAN', 'LAINNYA',
    ];

    public function up(): void
    {
        $this->alterEnum(array_merge(self::JENIS_LAMA, ['PSIKOTEST']));
    }

    public function down(): void
    {
        // Baris PSIKOTEST harus dibuang dulu agar penyempitan enum tidak gagal (Data truncated).
        // File fisiknya dibiarkan di public/uploads/psikotest — hapus manual bila perlu.
        DB::table('dokumen')->where('jenis', 'PSIKOTEST')->delete();
        $this->alterEnum(self::JENIS_LAMA);
    }

    private function alterEnum(array $values): void
    {
        $list = implode("','", $values);
        DB::statement("ALTER TABLE dokumen MODIFY COLUMN jenis ENUM('{$list}') NULL DEFAULT NULL");
    }
};
