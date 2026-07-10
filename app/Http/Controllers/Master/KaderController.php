<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Exports\KadersExport;
use App\Exports\KaderTemplateExport;
use App\Models\Kader;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use RealRashid\SweetAlert\Facades\Alert;
use App\Imports\KaderImport;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Company;
use App\Models\Departemen;
use App\Models\Divisi;
use App\Models\FeedbackMai;
use App\Support\KaderNikSync;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Validators\ValidationException;
use Inertia\Inertia;

class KaderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $kaders = Kader::select('kader.*', 'divisis.nama as divisi_name', 'departemens.nama as dept_name', 'company.company_shortname as bu', 'batch.nama_batch as batch_name','batch.tahun_batch')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->orderBy('kader.nama', 'asc')
            ->get();

        $companys = Company::get();
        $divisis = Divisi::get();
        $departemens = Departemen::get();
        $batchs = Batch::get();
        $currentBatch = Batch::current();
        return Inertia::render('Master/Kader/Index', [
            'kaders'     => $kaders,
            'companys'   => $companys,
            'divisis'    => $divisis,
            'departemens'=> $departemens,
            'batchs'     => $batchs,
            'currentBatch' => $currentBatch ? [
                'id_batch'    => $currentBatch->id_batch,
                'nama_batch'  => $currentBatch->nama_batch,
                'tahun_batch' => $currentBatch->tahun_batch,
            ] : null,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'          => 'required|string|max:255',
            'nik'           => 'required|string|max:255|unique:kader,nik',
            'jenis_kelamin' => 'required|in:L,P',
            'iq'            => 'nullable|numeric',
            'ipk'           => 'nullable|numeric',
            'company_code'  => 'required',
            'id_divisi'     => 'required',
            'id_departemen' => 'required',
            'id_batch'      => 'required',
        ], [], [
            'nik'           => 'NIK',
            'jenis_kelamin' => 'Jenis Kelamin',
            'company_code'  => 'Bisnis Unit',
            'id_divisi'     => 'Divisi',
            'id_departemen' => 'Departemen',
            'id_batch'      => 'Batch',
        ]);

        Kader::insert([
            'id'            => Str::uuid(),
            'nik'           => $validated['nik'],
            'nama'          => $validated['nama'],
            'jenis_kelamin' => $validated['jenis_kelamin'],
            'iq'            => $validated['iq'] ?? '0',
            'ipk'           => $validated['ipk'] ?? '0',
            'company_code'  => $validated['company_code'],
            'id_divisi'     => $validated['id_divisi'],
            'id_departemen' => $validated['id_departemen'],
            'id_batch'      => $validated['id_batch'],
            'created_at'    => now(),
            'created_by'    => Auth::user()->id,
        ]);

        ActivityLog::activity_log('Menambah data Kader');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('kader.index');
    }

    public function export_kader()
    {
        $file_name = 'kaders_'.date('d-m-Y_H:i:s') . '.xlsx';

        return Excel::download(new KadersExport,$file_name);
    }

    public function downloadTemplate()
    {
        return Excel::download(new KaderTemplateExport, 'template_import_kader.xlsx');
    }

    public function import(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|mimes:xlsx,csv'
        ]);

        try {
            $importer = new KaderImport;
            Excel::import($importer, request()->file('file'));

            if (!$importer->valid) {
                Alert::warning('Data Tidak Valid', $importer->errorMessage);
                return redirect()->route('kader.index');
            }

            Alert::success('Success', 'Import data berhasil!');
            ActivityLog::activity_log('Mengimport data Kader');
            return redirect()->route('kader.index');
        } catch (\Exception $ex) {
            Alert::warning('Failed', 'Import data gagal!');
            return redirect()->route('kader.index');
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function show(Kader $kader)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function edit(Kader $kader)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $kader = Kader::where('id', $id)->firstOrFail();

        // NIK harus unik di kader (selain dirinya) DAN tidak boleh sudah dipakai akun
        // login lain (users.nik = kunci login); akun milik kader ini sendiri (nik lama)
        // dikecualikan karena akan ikut di-rename oleh KaderNikSync.
        $request->validate([
            'nik' => [
                'nullable', 'string', 'max:255',
                Rule::unique('kader', 'nik')->ignore($id, 'id'),
                Rule::unique('users', 'nik')->ignore($kader->nik, 'nik'),
            ],
        ], [
            'nik.unique' => 'NIK sudah dipakai kader/akun lain.',
        ], [
            'nik' => 'NIK',
        ]);

        $oldNik = (string) $kader->nik;
        $newNik = (string) ($request->nik ?? $kader->nik);

        DB::transaction(function () use ($request, $id, $kader, $oldNik, $newNik) {
            Kader::where('id', $id)
                ->update([
                    'nama'              => $request->nama ?? $kader->nama,
                    'nik'               => $newNik,
                    'jenis_kelamin'     => $request->jenis_kelamin ?? $kader->jenis_kelamin,
                    'iq'                => $request->iq ?? $kader->iq,
                    'ipk'               => $request->ipk ?? $kader->ipk,
                    'id_batch'          => $request->id_batch ?? $kader->id_batch,
                    'id_divisi'         => $request->id_divisi ?? $kader->id_divisi,
                    'id_departemen'     => $request->id_departemen ?? $kader->id_departemen,
                    'company_code'      => $request->company_code ?? $kader->company_code,
                    'updated_at'        => now(),
                    'updated_by'        => Auth::user()->id
                ]);

            // NIK berubah (mis. NIK sementara → NIK resmi): sinkronkan users.nik
            // (users.id dipertahankan → progress modul/test/dokumen tetap tertaut)
            // + nik_kader di jawaban & feedback_mai. Lihat App\Support\KaderNikSync.
            if ($newNik !== $oldNik) {
                KaderNikSync::rename($oldNik, $newNik);
            }
        });

        // Catatan: activity_log.desc bukan utf8mb4 — hindari karakter multibyte (mis. panah unicode).
        ActivityLog::activity_log($newNik !== $oldNik
            ? "Mengubah data Kader (NIK {$oldNik} -> {$newNik}, login & feedback tersinkron)"
            : 'Mengubah data Kader');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('kader.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function destroy(Kader $kader)
    {
        //
    }


}
