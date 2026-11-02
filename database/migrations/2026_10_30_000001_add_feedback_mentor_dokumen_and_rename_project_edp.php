<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Weekly Feedback mentor:
 *  - Dokumen pendukung (PDF, wajib) disimpan sebagai dokumen.jenis = 'FEEDBACK_MENTOR'
 *    (kader_id = kader.id, id_week = weeks.id_week) — enum jenis ditambah anggota itu.
 *  - Komponen nilai "Project" (pertanyaan id 4) berganti nama menjadi "Project (EDP)".
 *    Hanya diubah bila namanya masih bawaan, supaya editan manual di Master Pertanyaan
 *    tidak tertimpa.
 */
return new class extends Migration
{
    private const JENIS_LAMA = [
        'OJT_REPORT', 'POST_ACTIVITY', 'FORM_IDP', 'TEMPLATE_IDP', 'PERJANJIAN_KERJA',
        'REFLEKSI', 'WEEKLY_FEEDBACK', 'TEMPLATE_PERJANJIAN_KERJA', 'TEMPLATE_WEEKLY_FEEDBACK',
        'DOKUMEN', 'LAPORAN', 'LAINNYA', 'PSIKOTEST',
    ];

    public function up(): void
    {
        $this->alterEnum(array_merge(self::JENIS_LAMA, ['FEEDBACK_MENTOR']));

        DB::table('pertanyaan')
            ->where('id_pertanyaan', 4)
            ->where('nama_pertanyaan', 'Project')
            ->update(['nama_pertanyaan' => 'Project (EDP)', 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('pertanyaan')
            ->where('id_pertanyaan', 4)
            ->where('nama_pertanyaan', 'Project (EDP)')
            ->update(['nama_pertanyaan' => 'Project', 'updated_at' => now()]);

        // Baris FEEDBACK_MENTOR harus dibuang dulu agar penyempitan enum tidak gagal.
        // File fisiknya dibiarkan di public/uploads/feedback_mentor — hapus manual bila perlu.
        DB::table('dokumen')->where('jenis', 'FEEDBACK_MENTOR')->delete();
        $this->alterEnum(self::JENIS_LAMA);
    }

    private function alterEnum(array $values): void
    {
        $list = implode("','", $values);
        DB::statement("ALTER TABLE dokumen MODIFY COLUMN jenis ENUM('{$list}') NULL DEFAULT NULL");
    }
};
