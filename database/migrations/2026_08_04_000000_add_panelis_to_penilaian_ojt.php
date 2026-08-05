<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Form Penilaian OJT berganti ke "Form Assessment MT FMC": komponennya
 * Hard Competency (bobot 70%) + Soft Competency (bobot 30%).
 *
 * Formnya SATU untuk kedua panelis — skor yang diinput HR BU sudah merupakan
 * rata-rata penilaian Panelis 1 & 2, jadi yang disimpan per panelis hanya identitasnya
 * (nama & peran), bukan skornya.
 *
 * Kolom lama (ojt_score/value_score/presentation_score + overview/strengths/weakness/
 * mentor_comments) sengaja TIDAK di-drop supaya penilaian yang terlanjur tersimpan
 * dengan form lama tidak hilang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('penilaian_ojt', function (Blueprint $table) {
            $table->string('panelis1_nama', 150)->nullable()->after('fmc_number');
            $table->string('panelis1_peran', 150)->nullable()->after('panelis1_nama');
            $table->string('panelis2_nama', 150)->nullable()->after('panelis1_peran');
            $table->string('panelis2_peran', 150)->nullable()->after('panelis2_nama');

            $table->decimal('hard_score', 5, 2)->nullable()->after('panelis2_peran')
                ->comment('Cached: skor komposit Hard Competency (rata-rata 2 panelis)');
            $table->decimal('soft_score', 5, 2)->nullable()->after('hard_score')
                ->comment('Cached: skor komposit Soft Competency (rata-rata 2 panelis)');
        });

        $this->normalisasiKodePerPanelis();
    }

    /**
     * Sisa uji coba form versi per-panelis: item_code p1.hard.1 / p2.hard.1 dirata-ratakan
     * jadi hard.1, dan catatan p1./p2. digabung. Idempotent — tidak melakukan apa pun bila
     * tidak ada baris berprefiks p1./p2.
     */
    private function normalisasiKodePerPanelis(): void
    {
        $skor = DB::table('penilaian_ojt_skor')
            ->where('item_code', 'like', 'p_.%')
            ->get();

        foreach ($skor->groupBy('id_penilaian_ojt') as $idPenilaian => $rows) {
            $byCode = [];
            foreach ($rows as $row) {
                // p1.hard.3 → hard.3
                $kodeBaru = preg_replace('/^p\d+\./', '', $row->item_code);
                if ($row->skor !== null) $byCode[$kodeBaru][] = (float) $row->skor;
            }

            foreach ($byCode as $kodeBaru => $nilai) {
                DB::table('penilaian_ojt_skor')->updateOrInsert(
                    ['id_penilaian_ojt' => $idPenilaian, 'item_code' => $kodeBaru],
                    [
                        'sheet' => explode('.', $kodeBaru)[0],
                        'skor'  => (int) round(array_sum($nilai) / count($nilai)),
                    ]
                );
            }
        }

        DB::table('penilaian_ojt_skor')->where('item_code', 'like', 'p_.%')->delete();

        $komentar = DB::table('penilaian_ojt_komentar')
            ->where('sub_code', 'like', 'p_.%')
            ->get();

        foreach ($komentar->groupBy('id_penilaian_ojt') as $idPenilaian => $rows) {
            $byCode = [];
            foreach ($rows as $row) {
                // p1.kekuatan → catatan.kekuatan
                $kodeBaru = 'catatan.' . preg_replace('/^p\d+\./', '', $row->sub_code);
                if (trim((string) $row->komentar) !== '') $byCode[$kodeBaru][] = trim($row->komentar);
            }

            foreach ($byCode as $kodeBaru => $teks) {
                DB::table('penilaian_ojt_komentar')->updateOrInsert(
                    ['id_penilaian_ojt' => $idPenilaian, 'sub_code' => $kodeBaru],
                    ['sheet' => 'catatan', 'komentar' => implode("\n\n", array_unique($teks))]
                );
            }
        }

        DB::table('penilaian_ojt_komentar')->where('sub_code', 'like', 'p_.%')->delete();
    }

    public function down(): void
    {
        Schema::table('penilaian_ojt', function (Blueprint $table) {
            $table->dropColumn([
                'panelis1_nama', 'panelis1_peran', 'panelis2_nama', 'panelis2_peran',
                'hard_score', 'soft_score',
            ]);
        });
    }
};
