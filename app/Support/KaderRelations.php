<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Peta seluruh data yang bergantung pada seorang kader, plus penghitungnya.
 *
 * Dipakai untuk dua hal:
 *  1. Preflight sebelum hapus — admin melihat persis apa yang akan hilang, dan
 *     hapus permanen otomatis dikunci bila kader sudah punya jejak data.
 *  2. Sumber tunggal daftar tabel untuk App\Support\KaderPurger, supaya
 *     "yang dihitung" dan "yang dihapus" tidak pernah beda.
 *
 * PENTING — kader ditaut lewat TIGA identitas berbeda (lihat juga KaderNikSync):
 *  A. kader.id  → penilaian_ojt, monthly_feedback_summaries, list_kader_per_mentor,
 *                 report_arsip, dan dokumen Perjanjian Kerja.
 *  B. users.id  → seluruh progress modul/tes/dokumen kader. users ditemukan via
 *                 users.nik = kader.nik; tanpa akun users, grup B pasti kosong.
 *  C. nik       → jawaban.nik_kader, feedback_mai.nik_kader, performance_summary.
 *
 * Dua jebakan penamaan yang sudah terbukti di data produksi — jangan "dirapikan":
 *  - `dokumen.kader_id` TIDAK konsisten. Dokumen upload kader (POST_ACTIVITY /
 *    FORM_IDP / WEEKLY_FEEDBACK) menyimpan users.id, sedangkan PERJANJIAN_KERJA
 *    menyimpan kader.id. Karena itu dokumen selalu dicari dengan KEDUA id.
 *  - `modul_assignments.assignable_type = 'user'` tapi assignable_id berisi
 *    kader.id, bukan users.id (dicek: 26/26 id cocok ke kader, 0 ke users).
 */
class KaderRelations
{
    /**
     * Resolusi ketiga identitas kader. $kader boleh object/array hasil query.
     *
     * @return array{kader_id:string,nik:string,user_id:?string}
     */
    public static function identity($kader): array
    {
        $kaderId = (string) (is_array($kader) ? ($kader['id'] ?? '') : ($kader->id ?? ''));
        $nik     = trim((string) (is_array($kader) ? ($kader['nik'] ?? '') : ($kader->nik ?? '')));

        return [
            'kader_id' => $kaderId,
            'nik'      => $nik,
            'user_id'  => $nik === ''
                ? null
                : DB::table('users')->where('nik', $nik)->where('type', 'Kader')->value('id'),
        ];
    }

    /**
     * Id semua dokumen milik kader — dicari lewat kader.id DAN users.id sekaligus,
     * karena dokumen.kader_id menyimpan salah satu dari keduanya (lihat catatan kelas).
     *
     * @return array<int,int>
     */
    public static function dokumenIds(array $identity): array
    {
        $keys = array_values(array_filter([$identity['kader_id'], $identity['user_id']]));
        if (!$keys) return [];

        return DB::table('dokumen')->whereIn('kader_id', $keys)->pluck('id')->all();
    }

    /**
     * Rincian dependensi, sudah dikelompokkan sesuai bahasa yang dimengerti admin.
     * Grup dengan count 0 tetap disertakan agar UI bisa menampilkan daftar penuh.
     *
     * Dua angka yang sengaja dibedakan:
     *  - `total`    : semua yang akan ikut terhapus — untuk ditampilkan ke admin.
     *  - `blocking` : yang mengunci hapus permanen. Akun login TIDAK dihitung
     *                 karena bukan jejak kerja kader: akun itu turunan yang bisa
     *                 dibuat ulang lewat Master User > Generate Akun Kader. Kalau
     *                 ikut dihitung, tidak akan pernah ada kader yang dianggap
     *                 "bersih" dan salah input pun tak bisa dihapus.
     *
     * @return array{identity:array,groups:array<int,array{key:string,label:string,count:int,blocking:bool}>,total:int,blocking:int,files:int,has_account:bool}
     */
    public static function summary($kader): array
    {
        $id       = self::identity($kader);
        $kaderId  = $id['kader_id'];
        $userId   = $id['user_id'];
        $nik      = $id['nik'];
        $dokIds   = self::dokumenIds($id);

        // Hasil tes dipakai lagi untuk menghitung jawaban per soal (modul_user_answers).
        $resultIds = $userId
            ? DB::table('modul_test_results')->where('user_id', $userId)->pluck('id')->all()
            : [];

        $countBy = function (string $table, string $column, $value): int {
            if ($value === null || $value === '') return 0;
            return (int) DB::table($table)->where($column, $value)->count();
        };

        $groups = [
            [
                'key'   => 'penilaian_ojt',
                'label' => 'Penilaian OJT / FMC (beserta skor & komentarnya)',
                'count' => $countBy('penilaian_ojt', 'kader_id', $kaderId),
            ],
            [
                'key'   => 'feedback',
                'label' => 'Feedback mentor, MAI & summary bulanan',
                'count' => $countBy('jawaban', 'nik_kader', $nik)
                    + $countBy('feedback_mai', 'nik_kader', $nik)
                    + $countBy('monthly_feedback_summaries', 'kader_id', $kaderId)
                    + $countBy('evaluasi_mentor', 'user_id', $userId),
            ],
            [
                'key'   => 'dokumen',
                'label' => 'Dokumen upload (IDP, Post Activity, Perjanjian Kerja) + filenya',
                'count' => count($dokIds),
            ],
            [
                'key'   => 'progress_modul',
                'label' => 'Progress modul, pre/post test & jawaban kuis',
                'count' => $countBy('modul_user', 'user_id', $userId)
                    + $countBy('modul_test_results', 'user_id', $userId)
                    + $countBy('modul_test_attempts', 'user_id', $userId)
                    + $countBy('modul_reading_progress', 'user_id', $userId)
                    + $countBy('modul_activity', 'user_id', $userId)
                    + $countBy('user_jawaban', 'user_id', $userId)
                    + (count($resultIds)
                        ? (int) DB::table('modul_user_answers')->whereIn('result_id', $resultIds)->count()
                        : 0),
            ],
            [
                'key'   => 'mentor',
                'label' => 'Penugasan mentor (list kader per mentor)',
                'count' => $countBy('list_kader_per_mentor', 'kader_id', $kaderId),
            ],
            [
                'key'   => 'assignment_modul',
                'label' => 'Assignment modul pembelajaran',
                'count' => $kaderId === '' ? 0 : (int) DB::table('modul_assignments')
                    ->where('assignable_type', 'user')
                    ->where('assignable_id', $kaderId)
                    ->count(),
            ],
            [
                'key'   => 'report_arsip',
                'label' => 'Report arsip Batch 1-2 (hasil import Excel, tidak ada sumber lain)',
                'count' => $countBy('report_arsip', 'kader_id', $kaderId),
            ],
            [
                'key'   => 'performance',
                'label' => 'Performance summary',
                'count' => $countBy('performance_summary', 'nik_kader', $nik),
            ],
            [
                'key'      => 'akun',
                'label'    => 'Akun login kader',
                'count'    => $userId ? 1 : 0,
                'blocking' => false,
            ],
        ];

        // Semua grup mengunci hapus permanen kecuali yang sudah menyatakan sendiri.
        $groups = array_map(fn($g) => $g + ['blocking' => true], $groups);

        return [
            'identity'    => $id,
            'groups'      => $groups,
            'total'       => array_sum(array_column($groups, 'count')),
            'blocking'    => array_sum(array_column(
                array_filter($groups, fn($g) => $g['blocking']),
                'count'
            )),
            'files'       => count($dokIds),
            'has_account' => (bool) $userId,
        ];
    }
}
