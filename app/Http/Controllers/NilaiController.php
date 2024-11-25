<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Nilai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;

class NilaiController extends Controller
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
        $nilais = Nilai::orderBy('nama_nilai', 'asc')->get();
        return view('pages.nilai.index', compact('nilais'));
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
        $data = [
            'nama_nilai'    => $request->nama_nilai,
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ];
        Nilai::insert($data);
        ActivityLog::activity_log('Menambah data Nilai');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('nilai.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Nilai  $nilai
     * @return \Illuminate\Http\Response
     */
    public function show(Nilai $nilai)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Nilai  $nilai
     * @return \Illuminate\Http\Response
     */
    public function edit(Nilai $nilai)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Nilai  $nilai
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $nilai = Nilai::where('id_nilai', $id)->first();
        Nilai::where('id_nilai', $id)
            ->update([
                'nama_nilai'    => $request->nama_nilai ?? $nilai->nama_nilai,
                'updated_at'    => now(),
                'updated_by'    => Auth::user()->id
            ]);

        ActivityLog::activity_log('Mengubah data Nilai');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('nilai.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Nilai  $nilai
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Nilai::where('id_nilai', $id)->delete();
        ActivityLog::activity_log('Menghapus data Nilai');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('nilai.index');
    }
}
