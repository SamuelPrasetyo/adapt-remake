<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Imports\DivisiImport;
use App\Models\ActivityLog;
use App\Models\Divisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;

class DivisiController extends Controller
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
        $divisis = Divisi::orderBy('nama', 'asc')->get();
        return Inertia::render('Master/Divisi/Index', ['divisis' => $divisis]);
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
        Divisi::insert([
            'id'            => Str::uuid(),
            'nama'          => $request->nama,
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ]);
        ActivityLog::activity_log('Menambah data Divisi');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('divisi.index');
    }
    public function import(Request $request)
    {

        Excel::import(new DivisiImport(), $request->file('file')->store('temp'));

        ActivityLog::activity_log('Mengimport data Divisi');
        Alert::success('Success', 'Data berhasil diupload!');
        return redirect()->route('divisi.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Divisi  $divisi
     * @return \Illuminate\Http\Response
     */
    public function show(Divisi $divisi)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Divisi  $divisi
     * @return \Illuminate\Http\Response
     */
    public function edit(Divisi $divisi)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Divisi  $divisi
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $divisi = Divisi::where('id', $id)->first();
        Divisi::where('id', $id)
            ->update([
                'nama' => strtoupper($request->nama) ?? strtoupper($divisi->nama),
                'updated_at'    => now(),
                'updated_by'    => Auth::user()->id
            ]);

        ActivityLog::activity_log('Mengedit data Divisi');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('divisi.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Divisi  $divisi
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Divisi::where('id', $id)->delete();
        ActivityLog::activity_log('Menghapus data Divisi');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('divisi.index');
    }
}
