<?php

namespace App\Http\Controllers;

use App\Models\Nilai;
use Illuminate\Http\Request;
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
            'updated_at'    => now()
        ];
        Nilai::insert($data);

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
            ]);

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
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('nilai.index');
    }
}
