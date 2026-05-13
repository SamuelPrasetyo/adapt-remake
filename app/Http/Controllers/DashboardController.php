<?php

namespace App\Http\Controllers;

use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Modul;
use App\Models\User;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
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
        $stats = [
            'totalKader'    => User::where('type', 'Kader')->where('status', 'Aktif')->count(),
            'mentorAktif'   => User::where('type', 'Mentor')->where('status', 'Aktif')->count(),
            'modulTersedia' => class_exists(Modul::class) ? Modul::count() : 0,
            'dokPending'    => 0,
        ];

        return Inertia::render('Dashboard', [
            'stats'              => $stats,
            'departemenProgress' => [],
            'mentorMonitoring'   => [],
            'modulPerKategori'   => [],
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

    public function dashboard_kader()
    {
        $user_kader = Auth::user();
        $reports = Jawaban::selectRaw("SUM(jawaban) / 4 as avg,nik_kader,weeks.angka_week as week")
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->where('nik_kader', $user_kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->whereNotIn('id_pertanyaan', ['5', '6'])
            ->groupBy('nik_kader', 'week')
            ->get();
        $data_count = count($reports);
        $avg = [];
        $learningG = [];
        $kkm = [];
        $data_lg = [];
        $temp_avg = 0;
        $title['nama_kader'] = '';
        foreach ($reports as $val) {
            $cal = ($val->avg + $temp_avg) / $data_count;
            $temp_avg += $val->avg;

            $rounded = round($cal, 2);
            $data_lg[$val->week] =  $rounded;

            $learningG[$val->week] =  $rounded;

            $avg[$val->week] = $val->avg;

            array_push($kkm, 7);
        }
        $weeks = Week::orderBy('angka_week', 'asc')->get();
        $week = [];
        foreach ($weeks as $w) {
            array_push($week, $w->angka_week);
        }

        $kader = Kader::select('kader.nama as nama_kader', 'kader.nik', 'divisis.nama as nama_divisi', 'departemens.nama as nama_departemen', 'company.company_name')
            ->where('nik', $user_kader->nik)
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->first();

        $kaderInfo = [
            'nama'       => $kader->nama_kader  ?? '',
            'nik'        => $kader->nik          ?? '',
            'divisi'     => $kader->nama_divisi  ?? '',
            'departemen' => $kader->nama_departemen ?? '',
            'bu'         => $kader->company_name ?? '',
        ];

        return Inertia::render('DashboardKader', [
            'week'      => $weeks->pluck('angka_week')->values(),
            'avg'       => $avg,
            'learningG' => $learningG,
            'kkm'       => $kkm,
            'kaderInfo' => $kaderInfo,
        ]);
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
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
