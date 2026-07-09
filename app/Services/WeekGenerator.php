<?php

namespace App\Services;

use App\Models\Batch;
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
 * - weeks_kader = refleksi kader, mingguan (angka_week 1..N).
 * - weeks       = feedback mentor, mingguan (angka_week 1..N),
 *                 tanggalnya sama dengan minggu kader yang bersangkutan.
 *
 * Update aman: baris yang sudah ada dipertahankan (id_week & angka_week tetap),
 * hanya tanggal_mulai/bulan/tahun yang dihitung ulang -> link `jawaban` tidak putus.
 * Baris berlebih (saat durasi mengecil) hanya dihapus bila belum punya jawaban.
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

        // weeks_kader: 1..N (mingguan)
        for ($w = 1; $w <= $n; $w++) {
            $tgl = $anchor->copy()->addWeeks($w - 1);
            self::upsertWeek(WeekKader::class, $batch->id_batch, $w, $tgl, $uid);
        }
        self::pruneExtra(WeekKader::class, $batch->id_batch, $n);

        // weeks (mentor): mingguan 1..N. Dulu dwi-mingguan (genap 2,4,..); kini tiap minggu.
        // Karena rumus tanggal sama (anchor + (w-1) minggu), baris genap lama dipertahankan
        // (id_week & tanggal tetap) dan re-generate hanya menambah minggu ganjil yang hilang.
        $mentorCount = 0;
        for ($w = 1; $w <= $n; $w++) {
            $tgl = $anchor->copy()->addWeeks($w - 1);
            self::upsertWeek(Week::class, $batch->id_batch, $w, $tgl, $uid);
            $mentorCount++;
        }
        self::pruneExtra(Week::class, $batch->id_batch, $n);

        return ['kader_total' => $n, 'mentor_total' => $mentorCount, 'skipped' => false];
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

        $existing = $model::where('id_batch', $idBatch)
            ->where('angka_week', $angkaWeek)
            ->first();

        if ($existing) {
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

    /** Hapus week dengan angka_week > N, tapi hanya yang belum punya jawaban. */
    private static function pruneExtra(string $model, $idBatch, int $n): void
    {
        $extras = $model::where('id_batch', $idBatch)
            ->where('angka_week', '>', $n)
            ->get();

        foreach ($extras as $week) {
            if (!Jawaban::where('id_week', $week->id_week)->exists()) {
                $week->delete();
            }
        }
    }
}
