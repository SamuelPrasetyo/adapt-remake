<?php

namespace App\Exports;

use App\Models\Kader;
use Maatwebsite\Excel\Concerns\FromCollection;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;

class KadersExport implements FromView, WithColumnWidths
{
    public function view(): View
    {
        return view('exports.kader_export', [
            'kaders' => Kader::select('kader.*', 'divisis.nama as divisi_name', 'departemens.nama as dept_name', 'company.company_shortname as bu', 'batch.nama_batch as batch_name','batch.tahun_batch')
            ->join('divisis', 'kader.id_divisi', 'divisis.id')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->join('company', 'kader.company_code', '=', 'company.company_code')
            ->orderBy('kader.nama', 'asc')
            ->get()
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
