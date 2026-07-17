<?php

namespace App\Exports;

use App\Models\Kader;
use Maatwebsite\Excel\Concerns\FromCollection;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;

class KadersExport implements FromView, WithColumnWidths
{
    /** id_batch untuk filter; null = semua batch. */
    public function __construct(private ?int $idBatch = null)
    {
    }

    public function view(): View
    {
        $query = Kader::select('kader.*', 'divisis.nama as divisi_name', 'departemens.nama as dept_name', 'company.company_shortname as bu', 'batch.nama_batch as batch_name','batch.tahun_batch')
            ->join('divisis', 'kader.id_divisi', 'divisis.id')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->join('company', 'kader.company_code', '=', 'company.company_code')
            ->when($this->idBatch !== null, fn ($q) => $q->where('kader.id_batch', $this->idBatch))
            ->orderBy('kader.nama', 'asc');

        return view('exports.kader_export', [
            'kaders' => $query->get(),
        ]);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 30, 
            'B' => 15, 
            'C' => 15, 
            'D' => 10, 
            'E' => 10, 
            'F' => 20, 
            'G' => 10, 
            'H' => 15, 
        ];
    }
}
