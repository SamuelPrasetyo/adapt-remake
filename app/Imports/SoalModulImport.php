<?php

namespace App\Imports;

use App\Models\JawabanModul;
use App\Models\SoalModul;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class SoalModulImport implements ToCollection, WithHeadingRow
{
    private int $modulId;
    public int $imported = 0;
    public int $skipped  = 0;
    public array $errors = [];

    public function __construct(int $modulId)
    {
        $this->modulId = $modulId;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $rowNum = $index + 2;

            $soal        = trim($row['soal'] ?? '');
            $jawabanA    = trim($row['jawaban_a'] ?? '');
            $jawabanB    = trim($row['jawaban_b'] ?? '');
            $jawabanC    = trim($row['jawaban_c'] ?? '');
            $jawabanD    = trim($row['jawaban_d'] ?? '');
            $benar       = strtoupper(trim($row['jawaban_benar'] ?? ''));

            if (empty($soal)) continue;

            if (!in_array($benar, ['A', 'B', 'C', 'D'])) {
                $this->errors[] = "Baris {$rowNum}: kolom jawaban_benar harus berisi A, B, C, atau D.";
                continue;
            }

            if (!$jawabanA || !$jawabanB || !$jawabanC || !$jawabanD) {
                $this->errors[] = "Baris {$rowNum}: semua pilihan jawaban (A-D) wajib diisi.";
                continue;
            }

            // Skip jika soal dengan teks yang sama sudah ada di modul ini
            $alreadyExists = SoalModul::where('modul_id', $this->modulId)
                ->where('soal', $soal)
                ->exists();
            if ($alreadyExists) {
                $this->skipped++;
                continue;
            }

            $jawabans = [
                'A' => $jawabanA,
                'B' => $jawabanB,
                'C' => $jawabanC,
                'D' => $jawabanD,
            ];

            DB::beginTransaction();
            try {
                foreach (['pre', 'post'] as $tipe) {
                    $soalModul = SoalModul::create([
                        'modul_id' => $this->modulId,
                        'soal'     => $soal,
                        'tipe'     => $tipe,
                    ]);

                    foreach ($jawabans as $label => $teks) {
                        JawabanModul::create([
                            'soal_id'  => $soalModul->id,
                            'jawaban'  => $teks,
                            'is_benar' => $label === $benar ? 1 : 0,
                        ]);
                    }
                }

                DB::commit();
                $this->imported++;
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->errors[] = "Baris {$rowNum}: gagal disimpan — {$e->getMessage()}";
            }
        }
    }

    public function headingRow(): int
    {
        return 1;
    }
}
