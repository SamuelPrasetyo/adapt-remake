<?php

namespace App\Imports;

use Illuminate\Support\Str;

use App\Models\Divisi;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToCollection;

class DivisiImport implements ToModel,WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        return new Divisi([
            'id'            => Str::uuid(),
            'nama'          => $row['nama'],
            'created_at'    => now(),
            'updated_at'    => now()
        ]);
    }
    public function headingRow(): int
    {
        return 1;
    }
    

}