<?php

namespace App\Console\Commands;

use App\Models\Batch;
use App\Services\WeekGenerator;
use Illuminate\Console\Command;

class GenerateWeeks extends Command
{
    protected $signature = 'weeks:generate {batch? : id_batch tertentu (kosong = semua batch)}';

    protected $description = 'Generate/sinkronkan jadwal weeks + weeks_kader untuk batch (berdasarkan tanggal batch).';

    public function handle(): int
    {
        $query = Batch::query();
        if ($id = $this->argument('batch')) {
            $query->where('id_batch', $id);
        }

        $batches = $query->get();
        if ($batches->isEmpty()) {
            $this->warn('Tidak ada batch yang cocok.');
            return self::SUCCESS;
        }

        foreach ($batches as $batch) {
            $res = WeekGenerator::syncForBatch($batch);
            if ($res['skipped']) {
                $this->line("- {$batch->nama_batch} (id {$batch->id_batch}): dilewati (tanggal batch belum lengkap).");
            } else {
                $this->info("- {$batch->nama_batch} (id {$batch->id_batch}): {$res['kader_total']} week kader, {$res['mentor_total']} week mentor.");
            }
        }

        return self::SUCCESS;
    }
}
