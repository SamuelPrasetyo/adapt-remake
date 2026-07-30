<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Monthly Feedback mentor — 3 pertanyaan kualitatif yang diisi mentor sebulan sekali
 * (berbeda dari feedback mingguan). Disimpan di tabel jawaban dengan id_week di-anchor
 * ke minggu pertama bulan terkait; filter di UI memakai label "Bulan Tahun".
 *
 * type = 'Mentor Monthly' agar terpisah dari 'Mentor' (weekly) di master Pertanyaan.
 * id_pertanyaan DIBIARKAN AUTO_INCREMENT (tidak dipaksa manual) supaya aman di produksi
 * meski ID tertentu sudah terpakai pertanyaan lain. Aplikasi mengacu ke pertanyaan ini
 * lewat type-nya, bukan ID tetap (lihat KaderSayaController::monthlyQuestionIds()).
 *
 * Idempotent: updateOrInsert dikunci pada (type + nama_pertanyaan) sehingga menjalankan
 * ulang tidak membuat baris duplikat. Urutan array = urutan tampil pertanyaan m1, m2, m3.
 */
return new class extends Migration
{
    private array $questions = [
        'Bagaimana gambaran mentee bulan ini — mulai dari keseharian kerja, tugas yang diberikan, kepatuhan terhadap SOP, sampai kontribusinya di project?',
        'Bagaimana sikap kerja dan etika mentee selama sebulan ini — misalnya dari sisi kedisiplinan, cara berkomunikasi, atau caranya menghadapi tekanan/masalah?',
        'Menurut Anda, kader ini sudah siap ke proses selanjutnya atau masih jadi pertimbangan?',
    ];

    public function up(): void
    {
        foreach ($this->questions as $text) {
            DB::table('pertanyaan')->updateOrInsert(
                ['type' => 'Mentor Monthly', 'nama_pertanyaan' => $text],
                ['status' => 'Aktif', 'updated_at' => now()],
            );
        }
    }

    public function down(): void
    {
        DB::table('pertanyaan')
            ->where('type', 'Mentor Monthly')
            ->whereIn('nama_pertanyaan', $this->questions)
            ->delete();
    }
};
