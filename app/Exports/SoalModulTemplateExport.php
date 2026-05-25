<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class SoalModulTemplateExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    public function headings(): array
    {
        return ['soal', 'jawaban_a', 'jawaban_b', 'jawaban_c', 'jawaban_d', 'jawaban_benar'];
    }

    public function array(): array
    {
        return [
            ['Contoh: Apa fungsi utama dari manajemen?', 'Perencanaan', 'Produksi', 'Distribusi', 'Pemasaran', 'A'],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 60,
            'B' => 30,
            'C' => 30,
            'D' => 30,
            'E' => 30,
            'F' => 15,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2563EB']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
