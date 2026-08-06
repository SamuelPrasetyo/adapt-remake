<?php

namespace App\Console\Commands;

use App\Models\Batch;
use App\Models\Dokumen;
use App\Models\FeedbackMai;
use App\Models\Jawaban;
use App\Models\Week;
use App\Models\WeekKader;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Perbaikan SEKALI JALAN: kembalikan jadwal ke ritme dwi-mingguan (angka_week genap
 * 2, 4, 6, ..) untuk kedua jadwal, berikut data yang terlanjur terisi.
 *
 * Minggu GENAP selalu dipertahankan apa adanya — isinya tidak pernah digeser. Yang
 * diurus hanya minggu ganjil, dan perlakuannya beda per jadwal:
 *
 *  - `weeks_kader` (refleksi kader) — isi minggu ganjil DIARSIPKAN (soft delete),
 *    tidak digeser. Kader sudah banyak yang mengisi minggu genap juga, jadi
 *    menggeser hanya akan menabrak isi yang sudah benar dan mendorong data ke
 *    minggu yang belum berjalan.
 *
 *  - `weeks` (feedback mentor) — isi minggu ganjil DIPINDAH ke minggu genap
 *    berikutnya (W -> W+1) selama slot itu masih kosong; kalau sudah terisi, yang
 *    ganjil diarsipkan karena isi minggu genap yang lebih berhak. Feedback mentor
 *    ikut jadi nilai (Learning Growth / avg score), jadi sebisa mungkin tidak hilang
 *    dan mentor tidak perlu mengisi ulang. Pakai --mentor=arsip untuk menyamakan
 *    perlakuannya dengan refleksi kader (semua minggu ganjil diarsipkan).
 *
 * Tiga tabel menyimpan id_week dan ketiganya ikut diurus:
 *  - `jawaban`      — dibedakan lewat nama_mentor: NOT NULL = feedback mentor
 *                     (`weeks`), NULL = refleksi kader (`weeks_kader`). Pembedaan ini
 *                     wajib karena id_week kedua tabel bisa bernilai sama.
 *  - `feedback_mai` — user_type 'mentor' -> weeks, 'kader' -> weeks_kader.
 *  - `dokumen`      — jenis WEEKLY_FEEDBACK (hanya sisi mentor). Tidak punya soft
 *                     delete, jadi hanya dipindah; kalau bentrok dilaporkan.
 *
 * Baris week ganjilnya: dihapus permanen bila memang tidak pernah ada isinya, dan
 * di-soft delete bila isinya diarsipkan (arsip perlu minggu acuan agar bisa
 * dipulihkan). Week warisan batch arsip (id_batch NULL) TIDAK disentuh. Aman
 * diulang: batch yang jadwalnya sudah genap semua tidak dikerjakan lagi.
 */
class RevertWeeksBiweekly extends Command
{
    protected $signature = 'weeks:revert-biweekly
                            {--batch= : id_batch tertentu (kosong = semua batch)}
                            {--mentor=forward : Perlakuan minggu ganjil feedback mentor: forward (geser ke minggu genap bila kosong) atau arsip}
                            {--dry-run : Tampilkan rencana perubahan lalu batalkan (tidak menyimpan)}
                            {--force : Langsung simpan tanpa konfirmasi}';

    protected $description = 'Kembalikan jadwal weeks & weeks_kader ke dwi-mingguan (2,4,6,..): isi minggu ganjil dipindah/diarsipkan, minggu genap dipertahankan.';

    /** Ringkasan per jadwal untuk laporan akhir. */
    private array $stat = [];

    public function handle(): int
    {
        $mode = $this->option('mentor');
        if (!in_array($mode, ['forward', 'arsip'], true)) {
            $this->error('--mentor hanya menerima "forward" atau "arsip".');
            return self::FAILURE;
        }

        $this->stat = ['mentor' => $this->blankStat(), 'kader' => $this->blankStat()];

        $dry      = (bool) $this->option('dry-run');
        $batchIds = Batch::query()
            ->when($this->option('batch'), fn($q, $b) => $q->where('id_batch', $b))
            ->orderBy('id_batch')
            ->pluck('id_batch');

        if ($batchIds->isEmpty()) {
            $this->warn('Tidak ada batch yang cocok.');
            return self::SUCCESS;
        }

        DB::beginTransaction();

        try {
            foreach ($batchIds as $idBatch) {
                $batch = Batch::find($idBatch);
                $this->newLine();
                $this->line("Batch {$batch->nama_batch} ({$batch->tahun_batch}) [id {$idBatch}]");

                $this->revertMentorWeeks($idBatch, $mode);
                $this->revertKaderWeeks($idBatch);
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Gagal: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->line('RINGKASAN');
        $this->table(['Item', "weeks (mentor: {$mode})", 'weeks_kader (kader: arsip)'], [
            ['Baris data dipindah ke minggu genap', $this->stat['mentor']['rows_moved'],      $this->stat['kader']['rows_moved']],
            ['Baris data diarsipkan (soft delete)', $this->stat['mentor']['rows_archived'],   $this->stat['kader']['rows_archived']],
            ['Baris week ganjil diarsipkan',        $this->stat['mentor']['weeks_archived'],  $this->stat['kader']['weeks_archived']],
            ['Baris week ganjil dihapus (kosong)',  $this->stat['mentor']['weeks_deleted'],   $this->stat['kader']['weeks_deleted']],
            ['Baris week perlu cek manual',         $this->stat['mentor']['weeks_kept'],      $this->stat['kader']['weeks_kept']],
        ]);

        if ($dry) {
            DB::rollBack();
            $this->warn('DRY-RUN: tidak ada perubahan yang disimpan.');
            return self::SUCCESS;
        }

        if (!$this->option('force') && !$this->confirm('Simpan perubahan di atas ke database?', false)) {
            DB::rollBack();
            $this->line('Dibatalkan — tidak ada perubahan yang disimpan.');
            return self::SUCCESS;
        }

        DB::commit();
        $this->info('Selesai. Feedback mentor & refleksi kader kembali dwi-mingguan (2, 4, 6, ..).');

        return self::SUCCESS;
    }

    private function blankStat(): array
    {
        return [
            'rows_moved'     => 0,
            'rows_archived'  => 0,
            'weeks_archived' => 0,
            'weeks_deleted'  => 0,
            'weeks_kept'     => 0,
        ];
    }

    /** `weeks`: minggu ganjil digeser ke W+1 bila slotnya kosong, sisanya diarsipkan. */
    private function revertMentorWeeks($idBatch, string $mode): void
    {
        $weeks   = Week::where('id_batch', $idBatch)->orderBy('angka_week')->get();
        $byAngka = $weeks->keyBy('angka_week');
        $odds    = $weeks->filter(fn($w) => (int) $w->angka_week % 2 === 1);

        $this->line('  weeks (feedback mentor) — ' . $weeks->count() . ' baris, ' . $odds->count() . ' ganjil');

        if ($odds->isEmpty()) {
            $this->line('    sudah dwi-mingguan, tidak ada yang diubah.');
            return;
        }

        foreach ($odds as $week) {
            $target = $mode === 'forward' ? $byAngka->get((int) $week->angka_week + 1) : null;
            $this->handleOddWeek($week, $target, true);
        }
        $this->reportWeekRows('mentor');
    }

    /** `weeks_kader`: minggu ganjil diarsipkan seluruhnya, minggu genap dibiarkan. */
    private function revertKaderWeeks($idBatch): void
    {
        $weeks = WeekKader::where('id_batch', $idBatch)->orderBy('angka_week')->get();
        $odds  = $weeks->filter(fn($w) => (int) $w->angka_week % 2 === 1);

        $this->line('  weeks_kader (refleksi kader) — ' . $weeks->count() . ' baris, ' . $odds->count() . ' ganjil');

        if ($odds->isEmpty()) {
            $this->line('    sudah dwi-mingguan, tidak ada yang diubah.');
            return;
        }

        foreach ($odds as $week) {
            $this->handleOddWeek($week, null, false);
        }
        $this->reportWeekRows('kader');
    }

    private function reportWeekRows(string $key): void
    {
        $s = $this->stat[$key];
        $this->line("    {$s['weeks_deleted']} baris minggu ganjil kosong dihapus"
            . ($s['weeks_archived'] > 0 ? ", {$s['weeks_archived']} baris berisi diarsipkan" : '')
            . '.');
    }

    /**
     * Urus satu minggu ganjil: isinya dipindah ke $to bila ada slot kosong, sisanya
     * diarsipkan. $to null = tidak ada pemindahan sama sekali (mode arsip / jadwal kader).
     */
    private function handleOddWeek($week, $to, bool $mentor): void
    {
        $key   = $mentor ? 'mentor' : 'kader';
        $angka = (int) $week->angka_week;

        $jawabanIds = Jawaban::where('id_week', $week->id_week)
            ->where(fn($q) => $mentor ? $q->whereNotNull('nama_mentor') : $q->whereNull('nama_mentor'))
            ->pluck('nik_kader', 'id_jawaban');
        $fmaiIds = FeedbackMai::where('id_week', $week->id_week)
            ->where('user_type', $mentor ? 'mentor' : 'kader')
            ->pluck('nik_kader', 'id_feedbackmai');
        $dokumen = $mentor
            ? Dokumen::where('id_week', $week->id_week)->where('jenis', 'WEEKLY_FEEDBACK')->get()
            : collect();

        if ($jawabanIds->isEmpty() && $fmaiIds->isEmpty() && $dokumen->isEmpty()) {
            $week->forceDelete();
            $this->stat[$key]['weeks_deleted']++;
            return;
        }

        $pindahJawaban = [];
        $pindahFmai    = [];
        $pindahDokumen = [];
        $stuckDokumen  = 0;

        if ($to) {
            // Slot yang sudah terisi di minggu tujuan — isi minggu genap tidak boleh ditimpa.
            $adaJawaban = Jawaban::where('id_week', $to->id_week)
                ->where(fn($q) => $mentor ? $q->whereNotNull('nama_mentor') : $q->whereNull('nama_mentor'))
                ->pluck('nik_kader')
                ->flip();
            $adaFmai = FeedbackMai::where('id_week', $to->id_week)
                ->where('user_type', $mentor ? 'mentor' : 'kader')
                ->pluck('nik_kader')
                ->flip();
            $adaDokumen = Dokumen::where('id_week', $to->id_week)
                ->where('jenis', 'WEEKLY_FEEDBACK')
                ->pluck('kader_id')
                ->flip();

            // Per kader, bukan per baris: satu pengisian = beberapa baris jawaban, dan
            // separuh pindah separuh tidak akan memecah isian jadi dua minggu.
            foreach ($jawabanIds as $id => $nik) {
                if (!$adaJawaban->has($nik)) $pindahJawaban[] = $id;
            }
            foreach ($fmaiIds as $id => $nik) {
                if (!$adaFmai->has($nik)) $pindahFmai[] = $id;
            }
            foreach ($dokumen as $d) {
                if ($adaDokumen->has($d->kader_id)) $stuckDokumen++;
                else $pindahDokumen[] = $d->id;
            }

            if (!empty($pindahJawaban)) {
                Jawaban::whereIn('id_jawaban', $pindahJawaban)->update(['id_week' => $to->id_week]);
            }
            if (!empty($pindahFmai)) {
                FeedbackMai::whereIn('id_feedbackmai', $pindahFmai)->update(['id_week' => $to->id_week]);
            }
            if (!empty($pindahDokumen)) {
                Dokumen::whereIn('id', $pindahDokumen)->update(['id_week' => $to->id_week]);
            }
        } else {
            $stuckDokumen = $dokumen->count();
        }

        // Sisanya diarsipkan: bentrok dengan minggu genap yang sudah terisi, atau
        // mode arsip / jadwal refleksi kader yang memang tidak digeser.
        $arsipJawaban = array_values(array_diff($jawabanIds->keys()->all(), $pindahJawaban));
        $arsipFmai    = array_values(array_diff($fmaiIds->keys()->all(), $pindahFmai));

        if (!empty($arsipJawaban)) {
            Jawaban::whereIn('id_jawaban', $arsipJawaban)->delete();
        }
        if (!empty($arsipFmai)) {
            FeedbackMai::whereIn('id_feedbackmai', $arsipFmai)->delete();
        }

        $dipindah  = count($pindahJawaban) + count($pindahFmai) + count($pindahDokumen);
        $diarsip   = count($arsipJawaban) + count($arsipFmai);
        $kader     = $jawabanIds->merge($fmaiIds)->unique()->count();
        $this->stat[$key]['rows_moved']    += $dipindah;
        $this->stat[$key]['rows_archived'] += $diarsip;

        $pesan = "    Week {$angka}: {$kader} kader — ";
        $pesan .= $to ? "{$dipindah} baris pindah ke Week " . (int) $to->angka_week . ', ' : '';
        $pesan .= "{$diarsip} baris diarsipkan.";
        $this->info($pesan);

        // Dokumen tidak punya soft delete: kalau tidak bisa dipindah, file-nya harus
        // diurus manual dan baris week-nya jangan disentuh dulu.
        if ($stuckDokumen > 0) {
            $this->stat[$key]['weeks_kept']++;
            $this->warn("    Week {$angka}: {$stuckDokumen} dokumen Weekly Feedback tidak bisa dipindah — baris week dipertahankan, perlu cek manual.");
            return;
        }

        if ($diarsip > 0) {
            // Arsip butuh baris minggunya tetap ada (walau ikut tersembunyi) supaya bisa dipulihkan.
            $week->delete();
            $this->stat[$key]['weeks_archived']++;
        } else {
            $week->forceDelete();
            $this->stat[$key]['weeks_deleted']++;
        }
    }
}
