<?php

namespace App\Imports;

use App\Models\Batch;
use App\Models\Company;
use App\Models\Departemen;
use App\Models\Divisi;
use App\Models\Kader;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KaderImport implements ToCollection, WithHeadingRow
{
    public function collection(Collection $rows)
    {
        $data = [];
        foreach ($rows as $row) {
            $company = Company::where('company_shortname', $row['company_shortname'])->first();
            $divisi = Divisi::where('nama', $row['divisi'])->first();
            $departemen = Departemen::where('nama', $row['departemen'])->first();
            $batch = Batch::where('nama_batch', $row['batch'])->first();
            if (!$company || !$divisi || !$departemen || !$batch) {
                continue;
            }
            $data[] = [
                'id'            => Str::uuid(),
                'nik'           => $row['nik'],
                'nama'          => $row['nama'],
                'jenis_kelamin' => $row['jenis_kelamin'],
                'iq'            => $row['iq'],
                'ipk'           => $row['ipk'],
                'company_code'  => $company->company_code,
                'id_divisi'     => $divisi->id,
                'id_departemen' => $departemen->id,
                'id_batch'      => $batch->id_batch,
                'created_at'    => now(),
                'created_by'    => Auth::user()->id
            ];
            // Kader::insert($data);
        }
        Kader::upsert($data,['nik'],['nama','jenis_kelamin','iq','ipk','company_code','id_divisi','id_departemen','id_batch','created_at','updated_at']);
    }



    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    // public function model(array $row)
    // {
    //     $company = Company::where('company_shortname', $row['company_shortname'])->first();
    //     $divisi = Divisi::where('nama', $row['divisi'])->first();
    //     $departemen = Departemen::where('nama', $row['departemen'])->first();
    //     $batch = Batch::where('nama_batch', $row['batch'])->first();

    //     $kader = Kader::where('nik', $row['nik'])->first();
    //     $data = [
    //         'id'            => Str::uuid(),
    //         'nama'          => $row['nama'],
    //         'nik'          => $row['nik'],
    //         'jenis_kelamin' => $row['jenis_kelamin'],
    //         'iq'            => $row['iq'],
    //         'ipk'           => $row['ipk'],
    //         'company_code'  => $company->company_code,
    //         'id_divisi'     => $divisi->id,
    //         'id_departemen' => $departemen->id,
    //         'id_batch'      => $batch->id_batch,
    //         'created_at'    => now(),
    //         'updated_at'    => now()

    //     ];
    //     if ($kader) {
    //         Kader::where('nik', $row['nik'])->update([
    //             'nama'          => $row['nama'],
    //             'jenis_kelamin' => $row['jenis_kelamin'],
    //             'iq'            => $row['iq'],
    //             'ipk'           => $row['ipk'],
    //             'company_code'  => $company->company_code,
    //             'id_divisi'     => $divisi->id,
    //             'id_departemen' => $departemen->id,
    //             'id_batch'      => $batch->id_batch,
    //             'updated_at'    => now()
    //         ]);
    //         dd("ok");

    //         return;
    //     } else {
    //         return Kader::insert($data);
    //     }
    // }

    public function headingRow(): int
    {
        return 1;
    }
}
