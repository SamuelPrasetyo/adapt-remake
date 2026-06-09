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
    public int $updated  = 0;
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

            if ($soal === '') continue;

            if (!in_array($benar, ['A', 'B', 'C', 'D'])) {
                $this->errors[] = "Baris {$rowNum}: kolom jawaban_benar harus berisi A, B, C, atau D.";
                continue;
            }

            if (!$jawabanA || !$jawabanB || !$jawabanC || !$jawabanD) {
                $this->errors[] = "Baris {$rowNum}: semua pilihan jawaban (A-D) wajib diisi.";
                continue;
            }

            // Jawaban terurut A→D beserta penanda jawaban benar.
            $jawabans = [
                ['jawaban' => $jawabanA, 'is_benar' => $benar === 'A' ? 1 : 0],
                ['jawaban' => $jawabanB, 'is_benar' => $benar === 'B' ? 1 : 0],
                ['jawaban' => $jawabanC, 'is_benar' => $benar === 'C' ? 1 : 0],
                ['jawaban' => $jawabanD, 'is_benar' => $benar === 'D' ? 1 : 0],
            ];

            DB::beginTransaction();
            try {
                $created = false;
                $changed = false;

                // Soal disimpan sebagai pasangan pre & post. Sinkronkan keduanya
                // dengan kunci unik (modul_id, teks soal, tipe):
                //   belum ada      → insert
                //   ada tapi beda  → update jawaban / kunci jawaban
                //   ada & sama     → lewati
                foreach (['pre', 'post'] as $tipe) {
                    $soalModul = SoalModul::where('modul_id', $this->modulId)
                        ->where('soal', $soal)
                        ->where('tipe', $tipe)
                        ->first();

                    if (!$soalModul) {
                        $soalModul = SoalModul::create([
                            'modul_id' => $this->modulId,
                            'soal'     => $soal,
                            'tipe'     => $tipe,
                        ]);
                        $this->writeJawabans($soalModul->id, $jawabans);
                        $created = true;
                        continue;
                    }

                    if ($this->jawabansChanged($soalModul->id, $jawabans)) {
                        JawabanModul::where('soal_id', $soalModul->id)->delete();
                        $this->writeJawabans($soalModul->id, $jawabans);
                        $changed = true;
                    }
                }

                DB::commit();

                if ($created) {
                    $this->imported++;
                } elseif ($changed) {
                    $this->updated++;
                } else {
                    $this->skipped++;
                }
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->errors[] = "Baris {$rowNum}: gagal disimpan — {$e->getMessage()}";
            }
        }
    }

    /**
     * Tulis 4 pilihan jawaban (A→D) untuk satu soal.
     */
    private function writeJawabans(int $soalId, array $jawabans): void
    {
        foreach ($jawabans as $j) {
            JawabanModul::create([
                'soal_id'  => $soalId,
                'jawaban'  => $j['jawaban'],
                'is_benar' => $j['is_benar'],
            ]);
        }
    }

    /**
     * Bandingkan jawaban yang sudah tersimpan dengan jawaban dari file.
     * Berbeda bila jumlah, teks salah satu jawaban, atau kunci jawaban berubah.
     */
    private function jawabansChanged(int $soalId, array $jawabans): bool
    {
        $existing = JawabanModul::where('soal_id', $soalId)
            ->orderBy('id')
            ->get(['jawaban', 'is_benar']);

        if ($existing->count() !== count($jawabans)) {
            return true;
        }

        foreach ($jawabans as $i => $j) {
            $cur = $existing[$i];
            if (trim($cur->jawaban) !== $j['jawaban'] || (int) $cur->is_benar !== $j['is_benar']) {
                return true;
            }
        }

        return false;
    }

    public function headingRow(): int
    {
        return 1;
    }
}
