<?php

namespace App\Http\Controllers;

use App\Models\Pertanyaan;
use Illuminate\Http\Request;
use RealRashid\SweetAlert\Facades\Alert;

class PertanyaanController extends Controller
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
        $pertanyaans = Pertanyaan::orderBy('nama_pertanyaan','asc')->get();
        return view('pages.pertanyaan.index', compact('pertanyaans'));
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
            'nama_pertanyaan'    => $request->nama_pertanyaan,
            'created_at'    => now(),
            'updated_at'    => now()
        ];
        Pertanyaan::insert($data);

        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('pertanyaan.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Pertanyaan  $pertanyaan
     * @return \Illuminate\Http\Response
     */
    public function show(Pertanyaan $pertanyaan)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Pertanyaan  $pertanyaan
     * @return \Illuminate\Http\Response
     */
    public function edit(Pertanyaan $pertanyaan)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Pertanyaan  $pertanyaan
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $pertanyaan = Pertanyaan::where('id_pertanyaan', $id)->first();
        Pertanyaan::where('id_pertanyaan', $id)
            ->update([
                'nama_pertanyaan'   => $request->nama_pertanyaan ?? $pertanyaan->nama_pertanyaan,
                'type'              => $request->type ?? $pertanyaan->nama_pertanyaan,
                'updated_at'        => now(),
            ]);

        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('pertanyaan.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Pertanyaan  $pertanyaan
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Pertanyaan::where('id_pertanyaan', $id)->delete();
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('pertanyaan.index');
    }
}
