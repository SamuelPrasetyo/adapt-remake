<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Dummy Weekly Feedback mentor untuk kader batch arsip (Batch 1 & 2).
 *
 * Latar: report Batch 1-2 (tabel report_arsip) berisi skor akhir hasil impor Excel,
 * tetapi feedback mingguannya bolong — Batch 1 tidak punya sama sekali, dan sebagian
 * kader Batch 2 berhenti di tengah jalan. Akibatnya tab Feedback di "Kader Saya"
 * terlihat kosong padahal reportnya bernilai.
 *
 * Seeder ini HANYA mengisi minggu yang masih kosong, dengan nilai acak 1-10 yang
 * rata-ratanya dikunci ke skor Development Progress per aspek di report
 * (report_arsip.dev_*, skala 0-10):
 *   id_pertanyaan 1 Routine Job  -> dev_job_routine
 *   id_pertanyaan 2 Assignment   -> dev_assignment
 *   id_pertanyaan 3 SOP          -> dev_sop
 *   id_pertanyaan 4 Project      -> dev_project
 * Dengan begitu kartu "Feedback Dikirim" terisi sampai Week 48 dan stat "Avg Feedback"
 * di header kader tetap konsisten dengan Development Progress di report.
 *
 * Yang TIDAK disentuh: refleksi kader (id_pertanyaan 7-10) dan Monthly Feedback
 * (pertanyaan type "Mentor Monthly") — keduanya bukan feedback mingguan mentor.
 * report_arsip juga tidak diubah sama sekali; skor report tetap angka arsip Excel.
 *
 * Jalankan:  php artisan db:seed --class=DummyWeeklyFeedbackArsipSeeder
 *
 * Aman diulang (idempotent): minggu yang sudah punya feedback dilewati, dan nilai
 * acaknya deterministik per NIK kader sehingga menjalankan ulang tidak mengacak ulang
 * minggu yang sudah terisi seeder ini.
 */
class DummyWeeklyFeedbackArsipSeeder extends Seeder
{
    /** nama_batch yang diproses (batch arsip). */
    private const BATCH_NUMBERS = [1, 2];

    /** Minggu terakhir yang diisi — jadwal warisan batch arsip berhenti di angka_week 48. */
    private const MAX_WEEK = 48;

    /** Rentang nilai aspek pada form Weekly Feedback (slider 1-10). */
    private const MIN_SCORE = 1;
    private const MAX_SCORE = 10;

    /** id_pertanyaan aspek kinerja -> kolom target di report_arsip (skala 0-10). */
    private const ASPEK = [
        1 => 'dev_job_routine',
        2 => 'dev_assignment',
        3 => 'dev_sop',
        4 => 'dev_project',
    ];

    /** Semua id_pertanyaan yang dianggap "satu paket" feedback mingguan mentor. */
    private const WEEKLY_QUESTIONS = [1, 2, 3, 4, 5, 6];

    /**
     * Isian "Area yang Perlu Ditingkatkan" (id_pertanyaan 6). Disimpan sebagai HTML
     * karena form aslinya memakai rich text editor (frontend melakukan strip_tags).
     */
    private const AREA_POOL = [
        'Ketelitian dalam pengolahan data perlu ditingkatkan agar laporan lebih akurat.',
        'Lebih proaktif bertanya ke departemen terkait saat menemui kendala pekerjaan.',
        'Kecepatan penyajian data dan laporan mingguan masih bisa dipercepat.',
        'Pemahaman SOP sudah baik, tinggal konsisten menerapkannya di pekerjaan harian.',
        'Perlu memperkuat skill komunikasi saat berkoordinasi lintas departemen.',
        'Tingkatkan inisiatif dalam mengambil tugas tambahan di luar rutinitas.',
        'Dokumentasi progress project perlu dirapikan agar mudah ditelusuri.',
        'Manajemen waktu perlu diperbaiki supaya target mingguan tercapai tepat waktu.',
        'Perbanyak eksplorasi proses kerja di area lain untuk memperluas wawasan.',
        'Analisa masalah sudah tajam, tinggal perkuat usulan solusinya.',
        'Tingkatkan kedisiplinan dalam melaporkan progress harian ke mentor.',
        'Perlu lebih percaya diri saat memaparkan hasil kerja di forum.',
        'Konsistensi kualitas pekerjaan dijaga, jangan turun saat beban kerja naik.',
        'Follow up hasil koordinasi perlu lebih rapi agar tidak ada yang terlewat.',
    ];

    public function run()
    {
        $batches = DB::table('batch')
            ->whereRaw('CAST(nama_batch AS UNSIGNED) IN (' . implode(',', self::BATCH_NUMBERS) . ')')
            ->orderByRaw('CAST(nama_batch AS UNSIGNED)')
            ->get(['id_batch', 'nama_batch', 'tahun_batch']);

        if ($batches->isEmpty()) {
            $this->say('warn', 'Tidak ada batch arsip (nama_batch 1-2) di database. Tidak ada yang dikerjakan.');
            return;
        }

        $rows    = [];   // baris jawaban siap insert
        $report  = [];   // ringkasan per kader untuk ditampilkan
        $skipped = [];

        foreach ($batches as $batch) {
            $weeks = $this->weeksFor($batch->id_batch);

            if ($weeks->isEmpty()) {
                $skipped[] = ["Batch {$batch->nama_batch}", '(semua kader)', 'tidak ada jadwal weeks s/d Week ' . self::MAX_WEEK];
                continue;
            }

            $kaders = DB::table('kader as k')
                ->leftJoin('report_arsip as ra', 'ra.kader_id', '=', 'k.id')
                ->where('k.id_batch', $batch->id_batch)
                ->orderBy('k.nama')
                ->get([
                    'k.id', 'k.nik', 'k.nama',
                    'ra.development_progress',
                    'ra.dev_job_routine', 'ra.dev_assignment', 'ra.dev_sop', 'ra.dev_project',
                ]);

            foreach ($kaders as $kader) {
                $result = $this->seedKader($batch, $weeks, $kader);

                if (isset($result['skip'])) {
                    $skipped[] = ["Batch {$batch->nama_batch}", $kader->nama, $result['skip']];
                    continue;
                }

                $rows     = array_merge($rows, $result['rows']);
                $report[] = $result['summary'];
            }
        }

        if (empty($rows)) {
            $this->renderSkipped($skipped);
            $this->say('info', 'Tidak ada minggu kosong yang perlu diisi — semua kader batch arsip sudah lengkap.');
            return;
        }

        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('jawaban')->insert($chunk);
            }
        });

        $this->renderReport($report);
        $this->renderSkipped($skipped);
        $this->say('info', sprintf(
            'Selesai: %d baris jawaban dibuat untuk %d kader batch arsip.',
            count($rows),
            count($report)
        ));
    }

    /**
     * Jadwal minggu yang dipakai batch arsip.
     *
     * Batch 1-2 tidak punya tanggal_mulai sehingga WeekGenerator melewatinya — feedback
     * lama Batch 2 menempel pada jadwal warisan (weeks.id_batch NULL, angka_week 2..48).
     * Jadwal milik batch dipakai lebih dulu bila memang sudah ada.
     */
    private function weeksFor($idBatch)
    {
        $own = DB::table('weeks')
            ->where('id_batch', $idBatch)
            ->where('angka_week', '<=', self::MAX_WEEK)
            ->orderBy('angka_week')
            ->get(['id_week', 'angka_week']);

        if ($own->isNotEmpty()) return $own;

        return DB::table('weeks')
            ->whereNull('id_batch')
            ->where('angka_week', '<=', self::MAX_WEEK)
            ->orderBy('angka_week')
            ->get(['id_week', 'angka_week']);
    }

    /**
     * Susun baris jawaban untuk satu kader.
     *
     * @return array{rows?: array, summary?: array, skip?: string}
     */
    private function seedKader($batch, $weeks, $kader): array
    {
        if (empty($kader->nik)) {
            return ['skip' => 'kader tanpa NIK'];
        }

        // Target rata-rata tiap aspek (0-10). Aspek yang kosong di report jatuh ke
        // Development Progress (0-100) supaya kader tetap dapat data yang masuk akal.
        $targets = [];
        foreach (self::ASPEK as $idp => $col) {
            $val = $kader->{$col};
            if ($val === null && $kader->development_progress !== null) {
                $val = ((float) $kader->development_progress) / 10;
            }
            $targets[$idp] = $val === null ? null : (float) $val;
        }

        if (count(array_filter($targets, fn ($v) => $v !== null)) === 0) {
            return ['skip' => 'tidak ada skor di report_arsip (tidak ada acuan nilai)'];
        }

        $weekIds = $weeks->pluck('id_week')->all();

        // Satu minggu diperlakukan utuh: minggu yang sudah punya jawaban mentor apa pun
        // dianggap terisi dan tidak disentuh, supaya data asli tidak tercampur dummy.
        $filledWeekIds = DB::table('jawaban')
            ->where('nik_kader', $kader->nik)
            ->whereNotNull('nama_mentor')
            ->whereIn('id_pertanyaan', self::WEEKLY_QUESTIONS)
            ->whereIn('id_week', $weekIds)
            ->distinct()
            ->pluck('id_week')
            ->all();

        $missingWeeks = $weeks->whereNotIn('id_week', $filledWeekIds)->values();
        $missingCount = $missingWeeks->count();

        if ($missingCount === 0) {
            return ['skip' => 'sudah lengkap s/d Week ' . self::MAX_WEEK];
        }

        // nama_mentor wajib terisi — kolom inilah pembeda feedback mentor vs refleksi kader.
        $mentorName = $this->mentorNameFor($kader);
        if ($mentorName === null) {
            return ['skip' => 'tidak punya mentor (nama_mentor tidak bisa ditentukan)'];
        }

        // Nilai yang sudah ada ikut diperhitungkan agar rata-rata AKHIR (lama + dummy)
        // tetap sama dengan skor report.
        $existing = DB::table('jawaban')
            ->selectRaw('id_pertanyaan, SUM(jawaban + 0) AS s, COUNT(*) AS n')
            ->where('nik_kader', $kader->nik)
            ->whereNotNull('nama_mentor')
            ->whereIn('id_pertanyaan', array_keys(self::ASPEK))
            ->whereIn('id_week', $weekIds)
            ->whereRaw("jawaban REGEXP '^[0-9]+([.][0-9]+)?$'")
            ->groupBy('id_pertanyaan')
            ->get()
            ->keyBy('id_pertanyaan');

        // Deterministik per kader: menjalankan ulang seeder menghasilkan angka yang sama.
        mt_srand(crc32('adapt-arsip-weekly|' . $kader->nik));

        // scores[id_pertanyaan][index minggu] = nilai 1-10
        $scores = [];
        foreach (self::ASPEK as $idp => $col) {
            if ($targets[$idp] === null) continue;

            $existingSum = (float) ($existing[$idp]->s ?? 0);
            $existingN   = (int) ($existing[$idp]->n ?? 0);

            $totalTarget = (int) round($targets[$idp] * ($existingN + $missingCount));
            $scores[$idp] = $this->randomScores($missingCount, (int) round($totalTarget - $existingSum));
        }

        $now      = Carbon::now();
        $baseYear = (int) ($batch->tahun_batch ?: $now->year);
        $rows     = [];

        foreach ($missingWeeks as $i => $week) {
            $answers = [];
            foreach (self::ASPEK as $idp => $col) {
                if (isset($scores[$idp])) $answers[$idp] = $scores[$idp][$i];
            }

            // Motivasi (skala 1-5) diturunkan dari rata-rata aspek minggu itu agar selaras.
            $answers[5] = $this->motivasiFrom($answers);
            $answers[6] = '<p>' . self::AREA_POOL[mt_rand(0, count(self::AREA_POOL) - 1)] . '</p>';

            // weeks batch arsip tidak punya tanggal; created_at diperkirakan dari tahun batch
            // supaya urutan kronologisnya wajar (kolom ini tidak dipakai untuk perhitungan).
            $at = Carbon::create($baseYear, 1, 1)
                ->addWeeks((int) $week->angka_week)
                ->addDays(mt_rand(0, 4))
                ->setTime(mt_rand(8, 17), mt_rand(0, 59));
            if ($at->greaterThan($now)) $at = $now->copy();

            foreach ($answers as $idp => $jawaban) {
                $rows[] = [
                    'id_week'       => $week->id_week,
                    'id_pertanyaan' => $idp,
                    'jawaban'       => (string) $jawaban,
                    'nama_mentor'   => $mentorName,
                    'nik_kader'     => $kader->nik,
                    'created_by'    => null,
                    'created_at'    => $at,
                    'updated_at'    => $at,
                ];
            }
        }

        return [
            'rows'    => $rows,
            'summary' => [
                'Batch ' . $batch->nama_batch,
                $this->short($kader->nama),
                count($filledWeekIds) . ' + ' . $missingCount . ' = ' . $weeks->count(),
                implode(' / ', array_map(
                    fn ($idp) => $targets[$idp] === null ? '—' : number_format($targets[$idp] * 10, 1),
                    array_keys(self::ASPEK)
                )),
                count($rows),
            ],
        ];
    }

    /**
     * Nama mentor untuk kolom jawaban.nama_mentor: pakai nama yang sudah dipakai di
     * feedback lama kader ini (konsisten dengan riwayat), kalau tidak ada baru ambil
     * mentor aktif yang di-assign.
     */
    private function mentorNameFor($kader): ?string
    {
        $fromHistory = DB::table('jawaban')
            ->where('nik_kader', $kader->nik)
            ->whereNotNull('nama_mentor')
            ->where('nama_mentor', '<>', '')
            ->orderByDesc('id_jawaban')
            ->value('nama_mentor');

        if ($fromHistory) return $fromHistory;

        return DB::table('list_kader_per_mentor as l')
            ->join('mentor as m', 'm.id', '=', 'l.mentor_id')
            ->where('l.kader_id', $kader->id)
            ->whereNull('l.deleted_at')
            ->whereNull('m.deleted_at')
            ->orderBy('m.nama')
            ->value('m.nama');
    }

    /**
     * $m bilangan bulat MIN_SCORE..MAX_SCORE yang jumlahnya tepat $sum, tersebar wajar
     * di sekitar rata-rata (bukan angka seragam) sehingga terlihat seperti input mentor.
     *
     * @return int[]
     */
    private function randomScores(int $m, int $sum): array
    {
        if ($m <= 0) return [];

        // Jaga-jaga bila skor report mustahil dicapai pada rentang 1-10.
        $sum  = max($m * self::MIN_SCORE, min($m * self::MAX_SCORE, $sum));
        $mean = $sum / $m;

        $vals = [];
        for ($i = 0; $i < $m; $i++) {
            // Dua acak dijumlahkan -> sebaran segitiga, lebih rapat di sekitar rata-rata.
            $jitter = (mt_rand(0, 1000) + mt_rand(0, 1000)) / 1000 - 1;   // -1 .. +1
            $vals[] = $this->clampScore((int) round($mean + $jitter * 1.6));
        }

        // Koreksi selisih pembulatan supaya jumlahnya PERSIS $sum.
        $guard = 0;
        while (($diff = $sum - array_sum($vals)) !== 0 && $guard++ < $m * 100) {
            $i = mt_rand(0, $m - 1);
            if ($diff > 0 && $vals[$i] < self::MAX_SCORE)      $vals[$i]++;
            elseif ($diff < 0 && $vals[$i] > self::MIN_SCORE)  $vals[$i]--;
        }

        return $vals;
    }

    private function clampScore(int $v): int
    {
        return max(self::MIN_SCORE, min(self::MAX_SCORE, $v));
    }

    /**
     * Motivasi & Keterlibatan (1-5) diturunkan dari rata-rata aspek minggu tsb.
     * Backend menyimpan angkanya, frontend memetakan ke label Sangat Kurang..Sangat Baik.
     */
    private function motivasiFrom(array $answers): int
    {
        $vals = array_filter($answers, fn ($v) => is_int($v));
        if (empty($vals)) return 3;

        $avg = array_sum($vals) / count($vals);

        if ($avg >= 9.0) return 5;
        if ($avg >= 7.5) return 4;
        if ($avg >= 6.0) return 3;
        if ($avg >= 4.5) return 2;

        return 1;
    }

    private function short(string $s): string
    {
        return mb_strlen($s) > 26 ? mb_substr($s, 0, 25) . '…' : $s;
    }

    private function renderReport(array $report): void
    {
        if (empty($report) || !$this->command) return;

        $this->command->table(
            ['Batch', 'Kader', 'Week (ada + baru = total)', 'Target aspek ×10 (Job/Assign/SOP/Project)', 'Baris'],
            $report
        );
    }

    private function renderSkipped(array $skipped): void
    {
        if (empty($skipped) || !$this->command) return;

        $this->command->warn('Dilewati:');
        $this->command->table(['Batch', 'Kader', 'Alasan'], $skipped);
    }

    private function say(string $level, string $message): void
    {
        if ($this->command) $this->command->{$level}($message);
    }
}
