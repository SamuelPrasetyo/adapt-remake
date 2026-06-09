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
    /** Hasil validasi import; dibaca controller setelah Excel::import. */
    public bool $valid = true;
    public string $errorMessage = '';

    public function collection(Collection $rows)
    {
        // Semua baris wajib memakai batch & tahun yang sedang berjalan.
        $current = Batch::current();
        if (!$current) {
            $this->valid = false;
            $this->errorMessage = 'Tidak ada batch yang sedang berjalan. Import dibatalkan.';
            return;
        }

        $mismatched = [];
        foreach ($rows as $row) {
            if (blank($row['nama'] ?? null) && blank($row['nik'] ?? null)) {
                continue; // lewati baris kosong
            }
            $rowBatch = trim((string) ($row['batch'] ?? ''));
            $rowTahun = trim((string) ($row['tahun'] ?? ''));
            if ($rowBatch !== (string) $current->nama_batch || $rowTahun !== (string) $current->tahun_batch) {
                $mismatched[] = ($row['nama'] ?? '-') . " (batch {$rowBatch}/{$rowTahun})";
            }
        }

        if (!empty($mismatched)) {
            $shown = implode('; ', array_slice($mismatched, 0, 5));
            $this->valid = false;
            $this->errorMessage = 'Data tidak valid. Kolom batch/tahun harus sesuai batch yang sedang berjalan '
                . "(Batch {$current->nama_batch} / {$current->tahun_batch}). "
                . count($mismatched) . " baris tidak sesuai: {$shown}"
                . (count($mismatched) > 5 ? ', ...' : '');
            return; // batalkan total — tidak ada data yang disimpan
        }

        $data = [];
        $missingCompanies = [];
        $missingDivisions = [];
        $missingDepartments = [];
        $missingBatches = [];
        foreach ($rows as $row) {
            if (blank($row['nama'] ?? null) && blank($row['nik'] ?? null)) {
                continue; // lewati baris kosong
            }
            $company = Company::where('company_shortname', $row['company_shortname'])->first();
            $divisi = Divisi::where('nama', $row['divisi'])->first();
            $departemen = Departemen::where('nama', $row['departemen'])->first();
            $batch = Batch::where('nama_batch', $row['batch'])->where('tahun_batch', $row['tahun'])->first();
            if (!$company) {
                $missingCompanies[] = $row['nama'] . ' - ' . $row['company_shortname'];
            }
            if (!$divisi) {
                $missingDivisions[] = $row['nama'] . ' - ' . $row['divisi'];
            }
            if (!$departemen) {
                $missingDepartments[] = $row['nama'] . ' - ' . $row['departemen'];
            }
            if (!$batch) {
                $missingBatches[] = $row['nama'] . ' - ' . $row['batch'] . ' (' . $row['tahun'] . ')';
            }

            if (!$company || !$divisi || !$departemen || !$batch) {
                continue;
            }
            // $first_char =substr($row['nik'],0,1);
            // if(!is_numeric($first_char))
            // {
            //     $row['nik'] = substr($row['nik'], 1);
            // }
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
        Kader::upsert($data, ['nik'], ['nama', 'jenis_kelamin', 'iq', 'ipk', 'company_code', 'id_divisi', 'id_departemen', 'id_batch', 'created_at', 'updated_at']);

        session()->flash('missingCompanies', $missingCompanies);
        session()->flash('missingDivisions', $missingDivisions);
        session()->flash('missingDepartments', $missingDepartments);
        session()->flash('missingBatches', $missingBatches);
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
