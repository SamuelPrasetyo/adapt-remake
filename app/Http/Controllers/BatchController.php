<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use Illuminate\Http\Request;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;

class BatchController extends Controller
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
        $batchs = Batch::orderBy('nama_batch', 'asc')->get();
        return view('pages.batch.index', compact('batchs'));
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
            'nama_batch'    => $request->nama_batch,
            'tahun_batch'   => $request->tahun_batch,
            'created_at'    => now(),
            'updated_at'    => now()
        ];

        Batch::insert($data);

        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('batch.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function show(Batch $batch)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function edit(Batch $batch)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $batch = Batch::where('id_batch', $id)->first();
        $data = [
            'nama_batch'    => $request->nama_batch ?? $batch->nama_batch,
            'tahun_batch'   => $request->tahun_batch ?? $batch->tahun_batch,
            'updated_at'    => now(),
        ];
        Batch::where('id_batch', $id)
            ->update($data);

        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('batch.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Batch::where('id_batch', $id)->delete();
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('batch.index');
    }
}
