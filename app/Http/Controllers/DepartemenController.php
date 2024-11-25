<?php

namespace App\Http\Controllers;

use App\Imports\DepartemenImport;
use App\Models\ActivityLog;
use App\Models\Departemen;
use App\Models\Divisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class DepartemenController extends Controller
{
    public function __construct() {
        $this->middleware('auth');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $departemens = Departemen::select('departemens.*','divisis.nama as nama_divisi')
                                ->join('divisis','departemens.id_divisi','divisis.id')
                                ->orderBy('departemens.nama', 'asc')
                                ->get();
        $divisis = Divisi::get();
        return view('pages.departemen.index', compact('departemens','divisis'));
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
        Departemen::insert([
            'id'            => Str::uuid(),
            'nama'          => strtoupper($request->nama),
            'id_divisi'     => $request->id_divisi,
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ]);
        ActivityLog::activity_log('Menambah data Departemen');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('departemen.index');
    }
    public function import(Request $request)
    {

        Excel::import(new DepartemenImport(), $request->file('file')->store('temp'));
        ActivityLog::activity_log('Mengimport data Departemen');
        Alert::success('Success', 'Data berhasil diupload!');
        return redirect()->route('departemen.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Departemen  $departemen
     * @return \Illuminate\Http\Response
     */
    public function show(Departemen $departemen)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Departemen  $departemen
     * @return \Illuminate\Http\Response
     */
    public function edit(Departemen $departemen)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Departemen  $departemen
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $departemen = Departemen::where('id', $id)->first();
        Departemen::where('id', $id)
            ->update([
                'nama'          =>strtoupper($request->nama) ?? strtoupper($departemen->nama),
                'id_divisi'     => $request->id_divisi ?? $departemen->id_divisi,
                'updated_at'    => now(),
                'updated_by'    => Auth::user()->id
            ]);
        ActivityLog::activity_log('Mengubah data Departemen');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('departemen.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Departemen  $departemen
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Departemen::where('id', $id)->delete();
        ActivityLog::activity_log('Menghapus data Departemen');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('departemen.index');
    }
}
