<?php

namespace App\Console\Commands;

use App\Models\ReportArsip;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Backfill rincian aspek Development Progress ke tabel report_arsip dari feedback
 * mingguan mentor (tabel jawaban).
 *
 * Latar: skor Batch 1-2 diimpor dari Excel arsip (App\Support\ArsipImporter). Untuk
 * Batch 2, Excel HANYA mengisi rata-rata Development Progress (kolom P), 4 aspek
 * pembentuknya (kolom L-O) kosong → report_arsip.dev_* NULL, sehingga halaman report
 * arsip menampilkan "Rincian aspek tidak tersedia".
 *
 * Ternyata Batch 2 dulu MEMAKAI sistem: feedback mingguan mentornya masih tersimpan
 * di tabel `jawaban` (id_pertanyaan 1 Routine Job, 2 Assignment, 3 SOP, 4 Project;
 * skala 0-10). Command ini menghitung rata-rata tiap aspek (rumus sama dgn Report
 * Batch 3+ di ReportController::report_new) dan mengisikannya ke report_arsip.dev_*.
 *
 * Sekali jalan di production. Idempotent & aman:
 *  - Default hanya mengisi kolom aspek yang masih NULL (tak menimpa data Excel Batch 1).
 *  - --overwrite untuk menimpa nilai aspek yang sudah ada.
 *  - --dry-run untuk pratinjau tanpa menulis.
 *
 * Catatan: development_progress (skor besar) TIDAK diubah — tetap nilai arsip Excel
 * yang otoritatif. Rata-rata 4 aspek hasil hitung ditampilkan hanya sbg pembanding.
 */
class BackfillArsipDevAspek extends Command
{
    protected $signature = 'report:backfill-dev-aspek
        {--batch=2 : nama_batch yang diproses (default 2)}
        {--overwrite : timpa kolom aspek yang sudah terisi}
        {--dry-run : tampilkan rencana tanpa menulis ke DB}';

    protected $description = 'Isi rincian aspek Development Progress (report_arsip.dev_*) dari feedback mingguan mentor (jawaban) untuk kader arsip.';

    /** id_pertanyaan aspek → kolom report_arsip. */
    private const ASPEK = [
        1 => ['col' => 'dev_job_routine', 'label' => 'Routine Job'],
        2 => ['col' => 'dev_assignment',  'label' => 'Assignment'],
        3 => ['col' => 'dev_sop',         'label' => 'SOP'],
        4 => ['col' => 'dev_project',     'label' => 'Project'],
    ];

    public function handle(): int
    {
        $batchNo   = (int) $this->option('batch');
        $overwrite = (bool) $this->option('overwrite');
        $dryRun    = (bool) $this->option('dry-run');

        // Kader arsip target: yang punya baris report_arsip untuk batch ini.
        $rows = DB::table('report_arsip as ra')
            ->join('kader as k', 'k.id', '=', 'ra.kader_id')
            ->where('ra.batch_no', $batchNo)
            ->orderBy('k.nama')
            ->get(['ra.kader_id', 'ra.dev_job_routine', 'ra.dev_assignment', 'ra.dev_sop', 'ra.dev_project', 'ra.development_progress', 'k.nik', 'k.nama']);

        if ($rows->isEmpty()) {
            $this->warn("Tidak ada baris report_arsip untuk batch {$batchNo}.");
            return self::SUCCESS;
        }

        // Rata-rata tiap aspek per kader dari feedback mentor (numerik, nama_mentor terisi).
        $niks = $rows->pluck('nik')->filter()->unique()->all();
        $agg  = DB::table('jawaban')
            ->selectRaw('nik_kader, id_pertanyaan, AVG(jawaban + 0) AS avg_val, COUNT(*) AS n')
            ->whereIn('nik_kader', $niks)
            ->whereIn('id_pertanyaan', array_keys(self::ASPEK))
            ->whereNotNull('nama_mentor')
            ->where('nama_mentor', '<>', '')
            ->whereRaw("jawaban REGEXP '^[0-9]+([.][0-9]+)?$'")
            ->groupBy('nik_kader', 'id_pertanyaan')
            ->get();

        // map[nik][id_pertanyaan] = avg (0-10)
        $byNik = [];
        foreach ($agg as $a) {
            $byNik[$a->nik_kader][(int) $a->id_pertanyaan] = (float) $a->avg_val;
        }

        $header  = ['Kader', 'Job', 'Assign', 'SOP', 'Project', 'Avg4', 'DevProg', 'Aksi'];
        $tableRows = [];
        $updates   = [];   // kader_id => [col => val]
        $stat = ['updated' => 0, 'skipped_filled' => 0, 'skipped_nodata' => 0];

        foreach ($rows as $r) {
            $aspek = $byNik[$r->nik] ?? [];
            if (empty($aspek)) {
                $stat['skipped_nodata']++;
                $tableRows[] = [$this->short($r->nama), '—', '—', '—', '—', '—', $this->num($r->development_progress), 'skip: no feedback'];
                continue;
            }

            $set = [];
            $vals = [];
            foreach (self::ASPEK as $idp => $meta) {
                $col     = $meta['col'];
                $current = $r->{$col};
                $val     = isset($aspek[$idp]) ? round($aspek[$idp], 2) : null;
                $vals[$idp] = $val;

                if ($val === null) continue;                       // aspek ini tak ada di feedback
                if ($current !== null && !$overwrite) continue;    // sudah terisi, jaga data lama
                $set[$col] = $val;
            }

            $avg4 = count(array_filter($vals, fn ($v) => $v !== null))
                ? round(array_sum(array_filter($vals, fn ($v) => $v !== null)) / count(array_filter($vals, fn ($v) => $v !== null)) * 10, 1)
                : null;

            $cells = [
                $this->short($r->nama),
                $this->x10($vals[1]), $this->x10($vals[2]), $this->x10($vals[3]), $this->x10($vals[4]),
                $avg4 === null ? '—' : number_format($avg4, 1),
                $this->num($r->development_progress),
            ];

            if (empty($set)) {
                $stat['skipped_filled']++;
                $cells[] = 'skip: sudah terisi';
            } else {
                $updates[$r->kader_id] = $set;
                $stat['updated']++;
                $cells[] = 'isi: ' . implode(',', array_keys($set));
            }
            $tableRows[] = $cells;
        }

        $this->table($header, $tableRows);
        $this->line("Kolom aspek 0-10 (ditampilkan ×10 = 0-100). Avg4 = rata-rata 4 aspek ×10 (pembanding DevProg).");

        if ($dryRun) {
            $this->warn("DRY-RUN: {$stat['updated']} kader akan di-update, "
                . "{$stat['skipped_filled']} dilewati (sudah terisi), {$stat['skipped_nodata']} tanpa feedback. Tidak ada penulisan.");
            return self::SUCCESS;
        }

        if (empty($updates)) {
            $this->info("Tidak ada yang perlu di-update ({$stat['skipped_filled']} sudah terisi, {$stat['skipped_nodata']} tanpa feedback).");
            return self::SUCCESS;
        }

        DB::transaction(function () use ($updates) {
            foreach ($updates as $kaderId => $set) {
                ReportArsip::where('kader_id', $kaderId)->update($set);
            }
        });

        $this->info("Selesai: {$stat['updated']} kader di-update, "
            . "{$stat['skipped_filled']} dilewati (sudah terisi), {$stat['skipped_nodata']} tanpa feedback.");

        return self::SUCCESS;
    }

    private function short(string $s): string
    {
        return mb_strlen($s) > 22 ? mb_substr($s, 0, 21) . '…' : $s;
    }

    private function num($v): string
    {
        return $v === null ? '—' : number_format((float) $v, 1);
    }

    /** Tampilkan skor aspek 0-10 sebagai 0-100 (×10), seperti di frontend. */
    private function x10($v): string
    {
        return $v === null ? '—' : number_format((float) $v * 10, 1);
    }
}
