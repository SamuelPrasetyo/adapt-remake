<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Menu "Upload > Dokumen" (Admin & Mentor) sebelumnya mengirim jenis surat/laporan/
 * formulir/lainnya yang TIDAK ada di enum kolom dokumen.jenis — di server strict
 * upload gagal (Data truncated), di server lama tersimpan NULL. Enum ditambah anggota
 * generik DOKUMEN/LAPORAN/LAINNYA khusus untuk menu tersebut (jenis lain tetap dipakai
 * fitur upload masing-masing: POST_ACTIVITY, FORM_IDP, WEEKLY_FEEDBACK, dst).
 *
 * Sekalian mengadopsi baris lama hasil menu itu (jenis NULL, tipe mentor, tanpa
 * mentor_id) menjadi milik Admin agar kembali terlihat & terkelola setelah
 * DokumenController memfilter daftar per role.
 */
return new class extends Migration
{
    private const JENIS_LAMA = [
        'OJT_REPORT', 'POST_ACTIVITY', 'FORM_IDP', 'TEMPLATE_IDP', 'PERJANJIAN_KERJA',
        'REFLEKSI', 'WEEKLY_FEEDBACK', 'TEMPLATE_PERJANJIAN_KERJA', 'TEMPLATE_WEEKLY_FEEDBACK',
    ];

    private const JENIS_BARU = ['DOKUMEN', 'LAPORAN', 'LAINNYA'];

    public function up(): void
    {
        $this->alterEnum(array_merge(self::JENIS_LAMA, self::JENIS_BARU));

        // Adopsi baris yatim dari menu Upload Dokumen lama → milik Admin, jenis LAINNYA.
        DB::table('dokumen')
            ->whereNull('jenis')
            ->where('tipe', 'mentor')
            ->whereNull('mentor_id')
            ->whereNull('kader_id')
            ->update(['tipe' => 'admin', 'jenis' => 'LAINNYA', 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Kembalikan baris bernilai enum baru ke NULL dulu agar penyempitan enum tidak gagal.
        DB::table('dokumen')->whereIn('jenis', self::JENIS_BARU)->update(['jenis' => null]);
        $this->alterEnum(self::JENIS_LAMA);
    }

    private function alterEnum(array $values): void
    {
        $list = implode("','", $values);
        DB::statement("ALTER TABLE dokumen MODIFY COLUMN jenis ENUM('{$list}') NULL DEFAULT NULL");
    }
};
