<?php

namespace App\Imports;

use Illuminate\Support\Str;

use App\Models\Departemen;
use App\Models\Divisi;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToCollection;

class DepartemenImport implements ToModel, WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        $departemen = Departemen::where('nama',$row['nama'])->first();
        $divisi = Divisi::where('nama',$row['divisi'])->first();
        if(!$departemen) {
            return new Departemen([
                'id'            => Str::uuid(),
                'nama'          => $row['nama'],
                'id_divisi'     => $divisi->id,
                'created_at'    => now(),
                'updated_at'    => now()
            ]);
        }else{
            return new Departemen([
                'id'            => Str::uuid(),
                'nama'          => $row['nama'] . ' '.rand(0,9999),
                'id_divisi'     => $divisi->id,
                'created_at'    => now(),
                'updated_at'    => now()
            ]);
        }
        
    }
    public function headingRow(): int
    {
        return 2;
    }
}
