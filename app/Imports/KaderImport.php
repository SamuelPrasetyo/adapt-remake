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
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KaderImport implements ToCollection, WithHeadingRow
{
    /** Hasil validasi import; dibaca controller setelah Excel::import. */
    public bool $valid = true;
    public string $errorMessage = '';

    /** Kolom WAJIB ada di baris header (di-slug snake_case oleh WithHeadingRow). */
    private const REQUIRED_HEADERS = [
        'batch', 'tahun', 'nama', 'nik', 'jenis_kelamin',
        'iq', 'ipk', 'company_shortname', 'divisi', 'departemen',
    ];

    private function fail(string $message): void
    {
        $this->valid = false;
        $this->errorMessage = $message;
    }

    public function collection(Collection $rows)
    {
        // Semua baris wajib memakai batch & tahun yang sedang berjalan.
        $current = Batch::current();
        if (!$current) {
            $this->fail('Tidak ada batch yang sedang berjalan. Import dibatalkan.');
            return;
        }

        // ── 1. Validasi STRUKTUR file: baris header harus memuat semua kolom wajib.
        //    Memberi notifikasi jelas bila user memakai file/template yang salah.
        if ($rows->isEmpty()) {
            $this->fail('File tidak berisi baris data. Pastikan baris pertama adalah header dan data mulai baris kedua.');
            return;
        }
        $headers = $rows->first()->keys()->map(fn ($h) => (string) $h)->all();
        $missing = array_values(array_diff(self::REQUIRED_HEADERS, $headers));
        if (!empty($missing)) {
            $this->fail(
                'Struktur kolom tidak sesuai. Kolom wajib berikut tidak ditemukan: '
                . implode(', ', $missing) . '. '
                . 'Unduh ulang "Download Template" dan jangan mengubah/menghapus baris header.'
            );
            return;
        }
        // Kolom nik_ktp opsional — bila tidak ada di file, seluruh baris dianggap tanpa KTP.
        $hasNikKtp = in_array('nik_ktp', $headers, true);

        // ── 2. Validasi batch/tahun tiap baris = batch berjalan (import dibatalkan total bila ada yang beda).
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
            $this->fail(
                'Data tidak valid. Kolom batch/tahun harus sesuai batch yang sedang berjalan '
                . "(Batch {$current->nama_batch} / {$current->tahun_batch}). "
                . count($mismatched) . " baris tidak sesuai: {$shown}"
                . (count($mismatched) > 5 ? ', ...' : '')
            );
            return; // batalkan total — tidak ada data yang disimpan
        }

        // ── 3. Validasi nik_ktp: panjang maksimum & duplikat DI DALAM file.
        $ktpToNik = [];       // nik_ktp => nik (dari file), untuk deteksi duplikat
        $invalidKtpLen = [];  // KTP yang melebihi 20 karakter
        $dupInFile = [];      // KTP yang dipakai >1 kader berbeda di file
        if ($hasNikKtp) {
            foreach ($rows as $row) {
                if (blank($row['nama'] ?? null) && blank($row['nik'] ?? null)) continue;
                $ktp = trim((string) ($row['nik_ktp'] ?? ''));
                if ($ktp === '') continue;
                $nik = trim((string) ($row['nik'] ?? ''));
                if (mb_strlen($ktp) > 20) {
                    $invalidKtpLen[] = ($row['nama'] ?? '-') . " ({$ktp})";
                    continue;
                }
                if (isset($ktpToNik[$ktp]) && $ktpToNik[$ktp] !== $nik) {
                    $dupInFile[] = $ktp;
                } else {
                    $ktpToNik[$ktp] = $nik;
                }
            }
            if (!empty($invalidKtpLen)) {
                $this->fail('NIK KTP maksimal 20 karakter. Baris tidak valid: '
                    . implode('; ', array_slice($invalidKtpLen, 0, 5)) . (count($invalidKtpLen) > 5 ? ', ...' : ''));
                return;
            }
            if (!empty($dupInFile)) {
                $this->fail('NIK KTP duplikat di dalam file (dipakai lebih dari satu kader): '
                    . implode(', ', array_unique($dupInFile)) . '. Pastikan satu KTP hanya untuk satu kader.');
                return;
            }

            // ── 4. Bentrok dengan kader LAIN yang sudah ada (nik berbeda, nik_ktp sama).
            if (!empty($ktpToNik)) {
                $conflicts = Kader::whereIn('nik_ktp', array_keys($ktpToNik))
                    ->get(['nik', 'nik_ktp', 'nama'])
                    ->filter(fn ($k) => ($ktpToNik[$k->nik_ktp] ?? null) !== (string) $k->nik);
                if ($conflicts->isNotEmpty()) {
                    $list = $conflicts->take(5)->map(fn ($k) => "{$k->nik_ktp} (dipakai {$k->nama})")->implode('; ');
                    $this->fail('NIK KTP sudah dipakai kader lain: ' . $list
                        . ($conflicts->count() > 5 ? ', ...' : '') . '. Import dibatalkan.');
                    return;
                }
            }
        }

        // ── 5. Bangun data + kumpulkan referensi Master yang tidak ditemukan.
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

            $ktp = $hasNikKtp ? trim((string) ($row['nik_ktp'] ?? '')) : '';
            $data[] = [
                'id'            => Str::uuid(),
                'nik'           => $row['nik'],
                'nik_ktp'       => $ktp !== '' ? $ktp : null, // '' → null agar unique(nik_ktp) aman
                'nama'          => $row['nama'],
                'jenis_kelamin' => $row['jenis_kelamin'],
                'iq'            => $row['iq'],
                'ipk'           => $row['ipk'],
                'company_code'  => $company->company_code,
                'id_divisi'     => $divisi->id,
                'id_departemen' => $departemen->id,
                'id_batch'      => $batch->id_batch,
                'created_at'    => now(),
                'created_by'    => Auth::user()->id,
            ];
        }

        if (!empty($data)) {
            Kader::upsert(
                $data,
                ['nik'],
                ['nik_ktp', 'nama', 'jenis_kelamin', 'iq', 'ipk', 'company_code', 'id_divisi', 'id_departemen', 'id_batch', 'updated_at']
            );
        }

        session()->flash('missingCompanies', $missingCompanies);
        session()->flash('missingDivisions', $missingDivisions);
        session()->flash('missingDepartments', $missingDepartments);
        session()->flash('missingBatches', $missingBatches);
    }

    public function headingRow(): int
    {
        return 1;
    }
}
