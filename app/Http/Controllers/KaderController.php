<?php

namespace App\Http\Controllers;

use App\Models\Kader;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use RealRashid\SweetAlert\Facades\Alert;
use App\Imports\KaderImport;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Company;
use App\Models\Departemen;
use App\Models\Divisi;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Validators\ValidationException;

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
            ->join('divisis', 'kader.id_divisi', 'divisis.id')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->join('company', 'kader.company_code', '=', 'company.company_code')
            ->orderBy('kader.nama', 'asc')
            ->get();

        $companys = Company::get();
        $divisis = Divisi::get();
        $departemens = Departemen::get();
        $batchs = Batch::get();
        return view('pages.kader.index', compact('kaders', 'companys', 'divisis', 'departemens', 'batchs'));
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
        //
    }

    public function import(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|mimes:xlsx,csv'
        ]);

        try {
            Excel::import(new KaderImport, request()->file('file'));

            Alert::success('Success', 'Import data berhasil!');
            ActivityLog::activity_log('Mengimport data Kader');
            return redirect()->route('kader.index');
        } catch (\Exception $ex) {
            Alert::warning('Failed', 'Import data gagal!');
            return redirect()->route('kader.index');
        }
        // Excel::import(new KaderImport(), $request->file('file')->store('temp'));
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
        $kader = Kader::where('id', $id)->first();
        Kader::where('id', $id)
            ->update([
                'nama'              => $request->nama ?? $kader->nama,
                'nik'               => $request->nik ?? $kader->nik,
                'jenis_kelamin'     => $request->jenis_kelamin ?? $kader->jenis_kelamin,
                'iq'                => $request->iq ?? $kader->iq,
                'ipk'               => $request->ipk ?? $kader->ipk,
                'id_batch'          => $request->id_batch ?? $kader->id_batch,
                'id_divisi'         => $request->id_divisi ?? $kader->id_divisi,
                'id_departemen'     => $request->id_departemen ?? $kader->id_departemen,
                'company_code'      => $request->company_code ?? $kader->id_departemen,
                'updated_at'        => now(),
                'updated_by'        => Auth::user()->id
            ]);
            
        ActivityLog::activity_log('Mengubah data Kader');
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
