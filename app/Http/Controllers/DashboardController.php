<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Models\Batch;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\User;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
    public function index(Request $request)
    {
        $stats = [
            'totalKader'    => User::where('type', 'Kader')->where('status', 'Aktif')->count(),
            'mentorAktif'   => User::where('type', 'Mentor')->where('status', 'Aktif')->count(),
            'modulTersedia' => class_exists(Modul::class) ? Modul::count() : 0,
            'dokPending'    => 0,
        ];

        $user = Auth::user();
        $isAdmin021      = $user->type === 'Admin' && $user->company_code === '021';
        $isMentorUser    = $user->type === 'Mentor';
        $showMentorPanel = $isAdmin021 || $isMentorUser;

        $mentors        = collect();
        $selectedMentor = null;
        $kaders         = collect();
        $buName         = null;
        $buShort        = null;
        $mentorFilter   = 'all';
        $batches        = collect();
        $batchFilter    = null;

        if ($showMentorPanel) {
            // Mentor user limited to BU sendiri; Admin 021 lihat semua
            $targetCompanyCode = $isMentorUser ? $user->company_code : null;

            $mentorsQuery = Mentor::select('mentor.*', 'company.company_shortname as bu', 'company.company_name as bu_full')
                ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
                ->whereNull('mentor.deleted_at')
                ->orderBy('mentor.nama', 'asc');

            if ($targetCompanyCode) {
                $mentorsQuery->where('mentor.company_code', $targetCompanyCode);
            }

            $mentors = $mentorsQuery->get();

            // Filter batch: default ke batch yang sedang berjalan; 'all' = semua batch.
            $batches      = Batch::orderByDesc('tanggal_mulai')->orderByDesc('id_batch')->get();
            $defaultBatch = optional(Batch::current())->id_batch;
            $batchFilter  = $request->query('batch_id', $defaultBatch);
            $idBatch      = ($batchFilter === 'all') ? null : $batchFilter;

            // kader_count per mentor — ikut filter batch yang dipilih
            $mentorIds = $mentors->pluck('id')->all();
            $countQuery = \App\Models\ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
                ->whereNull('deleted_at')
                ->select('mentor_id', DB::raw('COUNT(*) as c'))
                ->groupBy('mentor_id');
            if ($idBatch) {
                $countQuery->where('id_batch', $idBatch);
            }
            $countMap = $countQuery->pluck('c', 'mentor_id');
            $mentors->each(function ($m) use ($countMap) {
                $m->kader_count = (int) ($countMap[$m->id] ?? 0);
            });

            // Nama BU untuk header (Mentor punya BU spesifik; Admin 021 = "Semua BU")
            if ($targetCompanyCode) {
                $first = $mentors->first();
                $buName  = $first->bu_full ?? null;
                $buShort = $first->bu ?? null;
                if (!$buName) {
                    $co = \App\Models\Company::where('company_code', $targetCompanyCode)->first();
                    $buName  = $co->company_name ?? null;
                    $buShort = $co->company_shortname ?? null;
                }
            }

            $mentorFilter = $request->query('mentor_id', 'all');
            $perMentor    = app(KaderPerMentorController::class);

            if ($mentorFilter && $mentorFilter !== 'all') {
                $selectedMentor = $mentors->firstWhere('id', $mentorFilter);
                if ($selectedMentor) {
                    $kaders = $perMentor->listByMentorQuery($mentorFilter, $idBatch);
                } else {
                    // mentor_id tidak ditemukan -> fallback ke all
                    $mentorFilter = 'all';
                }
            }

            if ($mentorFilter === 'all') {
                $kaders = $perMentor->listAllKadersInBU($targetCompanyCode, $idBatch);
            }
        }

        return Inertia::render('Dashboard', [
            'stats'              => $stats,
            'departemenProgress' => [],
            'mentorMonitoring'   => [],
            'modulPerKategori'   => [],
            'showMentorPanel'    => $showMentorPanel,
            'mentors'            => $mentors,
            'selectedMentor'     => $selectedMentor,
            'mentorFilter'       => $mentorFilter,
            'batches'            => $batches,
            'batchFilter'        => $batchFilter !== null ? (string) $batchFilter : 'all',
            'kaders'             => $kaders,
            'buName'             => $buName,
            'buShort'            => $buShort,
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
