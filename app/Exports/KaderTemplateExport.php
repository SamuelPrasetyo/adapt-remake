<?php

namespace App\Exports;

use App\Models\Batch;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class KaderTemplateExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    /**
     * Heading harus sama persis dengan key yang dibaca KaderImport
     * (Maatwebsite WithHeadingRow akan men-slug heading menjadi snake_case).
     */
    public function headings(): array
    {
        // batch & tahun di kiri agar langsung terlihat dan tidak mudah diubah.
        return ['batch', 'tahun', 'nama', 'nik', 'jenis_kelamin', 'iq', 'ipk', 'company_shortname', 'divisi', 'departemen'];
    }

    public function array(): array
    {
        $batch      = Batch::current();
        $namaBatch  = $batch->nama_batch  ?? '';
        $tahunBatch = $batch->tahun_batch ?? '';

        return [
            [$namaBatch, $tahunBatch, 'Budi Santoso', '60320250001', 'L', '110', '3.45', 'MAI', 'PRODUCTION', 'ASSEMBLY'],
            [$namaBatch, $tahunBatch, 'Siti Aminah',  '60320250002', 'P', '105', '3.60', 'MAI', 'QUALITY',    'QUALITY'],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,   // batch
            'B' => 8,   // tahun
            'C' => 25,  // nama
            'D' => 18,  // nik
            'E' => 14,  // jenis_kelamin
            'F' => 8,   // iq
            'G' => 8,   // ipk
            'H' => 22,  // company_shortname
            'I' => 22,  // divisi
            'J' => 22,  // departemen
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
