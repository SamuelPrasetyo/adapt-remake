<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Dokumen;
use App\Models\Jawaban;
use App\Models\Week;
use App\Models\WeekKader;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Generator jadwal minggu per-batch.
 *
 * Aturan (disepakati):
 * - Anchor W1   = hari Minggu pertama pada/atau setelah batch.tanggal_mulai.
 * - Jumlah week = mengikuti durasi batch (tanggal_mulai s/d tanggal_selesai).
 * - weeks_kader = refleksi kader, dwi-mingguan (angka_week genap 2,4,..<=N).
 * - weeks       = feedback mentor, dwi-mingguan (angka_week genap 2,4,..<=N),
 *                 tanggalnya sama dengan minggu kader yang bersangkutan.
 *
 * Update aman: baris yang sudah ada dipertahankan (id_week & angka_week tetap),
 * hanya tanggal_mulai/bulan/tahun yang dihitung ulang -> link `jawaban` tidak putus.
 * Baris di luar jadwal (durasi mengecil / minggu ganjil sisa era mingguan) hanya
 * dihapus bila belum punya data — pemindahan datanya lewat `weeks:revert-biweekly`.
 */
class WeekGenerator
{
    /**
     * Sinkronkan weeks + weeks_kader untuk satu batch.
     *
     * @return array{kader_total:int, mentor_total:int, skipped:bool}
     */
    public static function syncForBatch(Batch $batch): array
    {
        if (!$batch->tanggal_mulai || !$batch->tanggal_selesai) {
            return ['kader_total' => 0, 'mentor_total' => 0, 'skipped' => true];
        }

        $start = Carbon::parse($batch->tanggal_mulai)->startOfDay();
        $end   = Carbon::parse($batch->tanggal_selesai)->startOfDay();

        // Anchor: hari Minggu pertama pada/atau setelah tanggal_mulai.
        $anchor = $start->copy();
        if ($anchor->dayOfWeek !== Carbon::SUNDAY) {
            $anchor = $anchor->next(Carbon::SUNDAY);
        }

        if ($end->lt($anchor)) {
            return ['kader_total' => 0, 'mentor_total' => 0, 'skipped' => true];
        }

        // N = jumlah minggu dari anchor s/d end (inklusif).
        $n   = (int) floor($anchor->diffInDays($end) / 7) + 1;
        $uid = Auth::id();

        // Keduanya genap 2,4,..<=N — refleksi kader & feedback mentor sama-sama
        // diisi tiap 2 minggu, dan tanggalnya sejajar.
        $weeks = [];
        for ($w = 2; $w <= $n; $w += 2) {
            $tgl = $anchor->copy()->addWeeks($w - 1);
            self::upsertWeek(WeekKader::class, $batch->id_batch, $w, $tgl, $uid);
            self::upsertWeek(Week::class, $batch->id_batch, $w, $tgl, $uid);
            $weeks[] = $w;
        }
        self::pruneOutside(WeekKader::class, $batch->id_batch, $weeks);
        self::pruneOutside(Week::class, $batch->id_batch, $weeks);

        return ['kader_total' => count($weeks), 'mentor_total' => count($weeks), 'skipped' => false];
    }

    /** Upsert satu baris week berdasarkan (id_batch, angka_week). */
    private static function upsertWeek(string $model, $idBatch, int $angkaWeek, Carbon $tgl, $uid): void
    {
        $payload = [
            'tanggal_mulai' => $tgl->toDateString(),
            'bulan'         => (int) $tgl->month,
            'tahun'         => (int) $tgl->year,
            'updated_at'    => now(),
            'updated_by'    => $uid,
        ];

        // withTrashed: minggu yang pernah diarsipkan harus dipulihkan, bukan dibuat
        // ulang sebagai baris kedua dengan angka_week yang sama.
        $existing = $model::withTrashed()
            ->where('id_batch', $idBatch)
            ->where('angka_week', $angkaWeek)
            ->first();

        if ($existing) {
            if ($existing->trashed()) {
                $payload['deleted_at'] = null;
            }
            $existing->fill($payload)->save();
            return;
        }

        $model::create($payload + [
            'id_batch'   => $idBatch,
            'angka_week' => $angkaWeek,
            'created_at' => now(),
            'created_by' => $uid,
        ]);
    }

    /**
     * Hapus week yang di luar jadwal (durasi batch mengecil, atau minggu ganjil sisa
     * era jadwal mingguan) — tapi hanya yang belum punya data.
     */
    private static function pruneOutside(string $model, $idBatch, array $valid): void
    {
        $extras = $model::where('id_batch', $idBatch)
            ->whereNotIn('angka_week', $valid)
            ->get();

        foreach ($extras as $week) {
            if (!self::hasData($model, $week->id_week)) {
                $week->delete();
            }
        }
    }

    /**
     * Apakah week ini sudah dipakai?
     *
     * `jawaban.id_week` menunjuk ke weeks ATAU weeks_kader — dua tabel dengan id yang
     * bisa bertabrakan — dan hanya dibedakan lewat nama_mentor (feedback mentor vs
     * refleksi kader), jadi pengecekannya wajib dipersempit sesuai tabelnya. Upload
     * Weekly Feedback (dokumen) ikut mengunci week milik mentor.
     */
    private static function hasData(string $model, $idWeek): bool
    {
        if ($model === WeekKader::class) {
            return Jawaban::where('id_week', $idWeek)->whereNull('nama_mentor')->exists();
        }

        return Jawaban::where('id_week', $idWeek)->whereNotNull('nama_mentor')->exists()
            || Dokumen::where('id_week', $idWeek)->where('jenis', 'WEEKLY_FEEDBACK')->exists();
    }
}
