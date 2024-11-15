<?php

namespace App\Http\Controllers;

use App\Models\cr;
use App\Models\Jawaban;
use App\Models\Week;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function learning_growth()
    {
        $reports = Jawaban::selectRaw("SUM(jawaban) / 4 as avg,nik_kader,weeks.angka_week as week")
                        ->join('weeks','jawaban.id_week','weeks.id_week')
                        ->whereNotNull('nama_mentor')
                        ->where('nik_kader','1122')
                        ->whereNotIn('id_pertanyaan',['5','6'])
                        ->groupBy('nik_kader','week')
                        ->get();
        $data_count = count($reports);
        $avg = [];
        $learningG = [];
        $kkm = [];
        $temp_avg = 0;
        foreach($reports as $val){
            $cal = ($val->avg + $temp_avg)/$data_count;
            $rounded = round($cal, 2);
            $data_lg[$val->week] =  $rounded;

            array_push($learningG,$rounded);
            $temp_avg+=$val->avg;

            array_push($avg,$val->avg);
            array_push($kkm,7);
        }
        $weeks = Week::orderBy('angka_week','asc')->get();
        $week = [];
        foreach($weeks as $w){
            array_push($week,$w->angka_week);
        }

        $avg = json_encode($avg, JSON_NUMERIC_CHECK);
        $week = json_encode($week, JSON_NUMERIC_CHECK);
        $learningG = json_encode($learningG, JSON_NUMERIC_CHECK);
        $kkm = json_encode($kkm, JSON_NUMERIC_CHECK);
        // dd($data,$labels);

        return view('pages.report.learning_growth',compact('week','reports','avg','learningG','kkm','data_lg'));
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

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function show(cr $cr)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function edit(cr $cr)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, cr $cr)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function destroy(cr $cr)
    {
        //
    }
}
