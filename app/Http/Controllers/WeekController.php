<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;

class WeekController extends Controller
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
        $weeks = Week::orderBy('angka_week', 'asc')->get();
        return view('pages.week.index', compact('weeks'));
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
            'angka_week'    => $request->angka_week,
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ];
        Week::insert($data);
        ActivityLog::activity_log('Menambah data Week');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('week.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Week  $week
     * @return \Illuminate\Http\Response
     */
    public function show(Week $week)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Week  $week
     * @return \Illuminate\Http\Response
     */
    public function edit(Week $week)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Week  $week
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $week = Week::where('id_week', $id)->first();
        Week::where('id_week', $id)
            ->update([
                'angka_week'    => $request->angka_week ?? $week->angka_week,
                'updated_at'    => now(),
                'updated_by'    => Auth::user()->id
            ]);
        ActivityLog::activity_log('Mengubah data Week');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('week.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Week  $week
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Week::where('id_week', $id)->delete();
        ActivityLog::activity_log('Menghapus data Week');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('week.index');
    }
}