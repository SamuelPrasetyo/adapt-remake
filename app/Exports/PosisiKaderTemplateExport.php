<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Template update posisi kader — sudah terisi daftar kader (per batch) beserta
 * posisi yang tersimpan saat ini. Admin cukup mengisi/mengubah dua kolom posisi
 * (latar kuning) lalu mengimpornya kembali lewat PosisiKaderController::import.
 *
 * Baris dicocokkan lewat kolom NIK, jadi NIK tidak boleh diubah. Heading harus
 * sama dengan PosisiKaderController::HEADER_*.
 */
class PosisiKaderTemplateExport extends DefaultValueBinder implements FromArray, WithHeadings, WithColumnWidths, WithStyles, WithTitle, WithCustomValueBinder
{
    public const HEADINGS = ['No', 'NIK', 'Nama Kader', 'BU', 'Departemen', 'Divisi', 'Posisi Awal', 'Posisi After Graduate'];

    /** @param \Illuminate\Support\Collection $kaders hasil query PosisiKaderController::kaderQuery() */
    public function __construct(private $kaders)
    {
    }

    public function headings(): array
    {
        return self::HEADINGS;
    }

    public function array(): array
    {
        return $this->kaders->values()->map(fn ($k, $i) => [
            $i + 1,
            // Teks, bukan angka: NIK panjang/berawalan 0 tidak rusak di Excel.
            (string) $k->nik,
            $k->nama,
            $k->bu,
            $k->dept_name,
            $k->divisi_name,
            $k->posisi_awal,
            $k->posisi_graduate,
        ])->all();
    }

    /** Kolom NIK (B) selalu teks — tanpa ini NIK berawalan 0 kehilangan angka nolnya. */
    public function bindValue(Cell $cell, $value)
    {
        if ($cell->getColumn() === 'B') {
            $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function title(): string
    {
        return 'Posisi Kader';
    }

    public function columnWidths(): array
    {
        return ['A' => 6, 'B' => 18, 'C' => 30, 'D' => 10, 'E' => 24, 'F' => 24, 'G' => 30, 'H' => 30];
    }

    public function styles(Worksheet $sheet): array
    {
        $last = max(2, $this->kaders->count() + 1);

        // NIK disimpan sebagai teks agar Excel tidak mengubahnya ke notasi ilmiah.
        $sheet->getStyle("B2:B{$last}")->getNumberFormat()->setFormatCode('@');
        $sheet->freezePane('A2');

        return [
            1 => [
                'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2563EB']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            // Kolom yang boleh diisi admin ditandai kuning.
            "G2:H{$last}" => [
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFEF9C3']],
            ],
        ];
    }
}
