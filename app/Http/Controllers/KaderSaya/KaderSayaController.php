<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Models\Company;
use App\Models\Dokumen;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\ModulAssignment;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\User;
use App\Models\Week;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class KaderSayaController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        $user        = Auth::user();
        $isAdmin021  = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor    = $user->type === 'Mentor';

        $mentorsQuery = Mentor::select('mentor.*', 'company.company_shortname as bu')
            ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
            ->whereNull('mentor.deleted_at')
            ->orderBy('mentor.nama', 'asc');

        if ($isMentor) {
            $mentorsQuery->where('mentor.company_code', $user->company_code);
        }

        $mentors = $mentorsQuery->get();

        $mentorIds = $mentors->pluck('id')->all();
        $countMap  = ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
            ->whereNull('deleted_at')
            ->select('mentor_id', DB::raw('COUNT(*) as c'))
            ->groupBy('mentor_id')
            ->pluck('c', 'mentor_id');
        $mentors->each(fn($m) => $m->kader_count = (int) ($countMap[$m->id] ?? 0));

        $mentorFilter   = $request->query('mentor_id', 'all');
        $selectedMentor = null;
        $perMentor      = app(KaderPerMentorController::class);

        if ($mentorFilter && $mentorFilter !== 'all') {
            $selectedMentor = $mentors->firstWhere('id', $mentorFilter);
            if (!$selectedMentor) $mentorFilter = 'all';
        }

        $kaders = $mentorFilter !== 'all' && $selectedMentor
            ? $perMentor->listByMentorQuery($mentorFilter)
            : $perMentor->listAllKadersInBU($isMentor ? $user->company_code : null);

        $niks    = $kaders->pluck('nik_kader')->unique()->filter()->values()->all();
        $userMap = User::whereIn('nik', $niks)->pluck('id', 'nik');

        $faseRows = ModulTestResult::where('is_completed', 1)
            ->whereIn('modul_test_results.user_id', $userMap->values()->all())
            ->join('modul', 'modul_test_results.modul_id', '=', 'modul.id')
            ->select(
                'modul_test_results.user_id',
                'modul.fase',
                DB::raw('AVG(modul_test_results.score) as avg_score')
            )
            ->groupBy('modul_test_results.user_id', 'modul.fase')
            ->get();

        $faseScoreMap = [];
        foreach ($faseRows as $r) {
            $faseScoreMap[$r->user_id][$r->fase] = (int) round($r->avg_score);
        }

        $kaders = $kaders->map(function ($row) use ($userMap, $faseScoreMap) {
            $uid = $userMap[$row->nik_kader] ?? null;
            $row->fase_scores = $uid ? ($faseScoreMap[$uid] ?? []) : [];
            return $row;
        });

        return Inertia::render('KaderSaya/Index', [
            'kaders'         => $kaders->values(),
            'mentors'        => $mentors,
            'selectedMentor' => $selectedMentor,
            'mentorFilter'   => $mentorFilter,
        ]);
    }

    public function show($kader_id)
    {
        $user       = Auth::user();
        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';

        $kader = Kader::select(
                'kader.*',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year',
                'lkpm.mentor_id',
                'mentor.nama as mentor_name'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->leftJoin(DB::raw('list_kader_per_mentor lkpm'), function ($j) {
                $j->on('lkpm.kader_id', '=', 'kader.id')->whereNull('lkpm.deleted_at');
            })
            ->leftJoin('mentor', 'lkpm.mentor_id', '=', 'mentor.id')
            ->where('kader.id', $kader_id)
            ->first();

        if (!$kader) abort(404);

        if ($isMentor) {
            $hasAccess = ListKaderPerMentor::where('list_kader_per_mentor.kader_id', $kader->id)
                ->whereNull('list_kader_per_mentor.deleted_at')
                ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
                ->whereNull('mentor.deleted_at')
                ->where('mentor.company_code', $user->company_code)
                ->exists();
            if (!$hasAccess) abort(403);
        }

        $kaderUser = User::where('nik', $kader->nik)->first();
        $userId    = $kaderUser?->id;

        $companyId = Company::where('company_code', $kader->company_code)->value('company_id');

        $userModulIds    = $userId
            ? ModulAssignment::where('assignable_type', 'user')->where('assignable_id', $kader->id)->pluck('modul_id')
            : collect();
        $companyModulIds = $companyId
            ? ModulAssignment::where('assignable_type', 'company')->where('assignable_id', $companyId)->pluck('modul_id')
            : collect();
        $allModulIds = $userModulIds->merge($companyModulIds)->unique()->values()->all();

        $moduls = Modul::whereIn('id', $allModulIds)->orderBy('fase')->orderBy('nama_modul')->get(['id', 'nama_modul as nama', 'fase']);

        $testResults = $userId
            ? ModulTestResult::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->where('is_completed', 1)->get(['modul_id', 'tipe', 'score'])
            : collect();

        $testMap = [];
        foreach ($testResults as $t) {
            $testMap[$t->modul_id][$t->tipe] = (float) $t->score;
        }

        $readMap = $userId
            ? ModulReadingProgress::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->pluck('progress', 'modul_id')->all()
            : [];

        $docIds = $userId
            ? Dokumen::where('kader_id', $userId)->whereIn('modul_id', $allModulIds)->where('jenis', 'POST_ACTIVITY')->pluck('modul_id')->flip()->map(fn() => true)->all()
            : [];

        $faseGroups      = [];
        $doneCheckpoints = 0;
        foreach ($moduls as $modul) {
            $fase = $modul->fase ?? 'Tanpa Fase';
            if (!isset($faseGroups[$fase])) {
                $faseGroups[$fase] = ['fase' => $fase, 'moduls' => [], 'done' => 0, 'total' => 0, 'scores' => []];
            }

            $pre  = isset($testMap[$modul->id]['pre']);
            $mat  = ((int) ($readMap[$modul->id] ?? 0)) >= 100;
            $post = isset($testMap[$modul->id]['post']);
            $pa   = isset($docIds[$modul->id]);
            $done = (int)$pre + (int)$mat + (int)$post + (int)$pa;
            $doneCheckpoints += $done;

            $scores = [];
            if (isset($testMap[$modul->id]['pre']))  $scores[] = $testMap[$modul->id]['pre'];
            if (isset($testMap[$modul->id]['post'])) $scores[] = $testMap[$modul->id]['post'];
            $modulScore = !empty($scores) ? (int) round(array_sum($scores) / count($scores)) : null;
            if ($modulScore !== null) $faseGroups[$fase]['scores'][] = $modulScore;

            $faseGroups[$fase]['moduls'][] = [
                'id'    => $modul->id,
                'nama'  => $modul->nama,
                'pre'   => $pre,
                'mat'   => $mat,
                'post'  => $post,
                'pa'    => $pa,
                'done'  => $done,
                'score' => $modulScore,
            ];
            $faseGroups[$fase]['total']++;
            if ($done === 4) $faseGroups[$fase]['done']++;
        }

        $allFaseScores = [];
        foreach ($faseGroups as &$fg) {
            $fg['progress']  = $fg['total'] > 0 ? (int) round(($fg['done'] / $fg['total']) * 100) : 0;
            $fg['avg_score'] = !empty($fg['scores']) ? (int) round(array_sum($fg['scores']) / count($fg['scores'])) : null;
            if ($fg['avg_score'] !== null) $allFaseScores[] = $fg['avg_score'];
            unset($fg['scores']);
        }
        unset($fg);
        ksort($faseGroups);
        $faseGroups = array_values($faseGroups);

        $totalModuls     = count($moduls);
        $totalCp         = $totalModuls * 4;
        $overallProgress = $totalCp > 0 ? (int) round(($doneCheckpoints / $totalCp) * 100) : 0;
        $avgScoreOverall = !empty($allFaseScores) ? (int) round(array_sum($allFaseScores) / count($allFaseScores)) : null;
        $status          = $overallProgress < 40 ? 'kritis' : ($overallProgress < 70 ? 'perlu_perhatian' : 'on_track');

        $weeklyData = [];
        if ($kader->nik) {
            $rows = Jawaban::selectRaw('SUM(jawaban) / 4 as avg_s, weeks.angka_week as week')
                ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
                ->where('nik_kader', $kader->nik)
                ->whereNotNull('nama_mentor')
                ->whereNotIn('id_pertanyaan', ['5', '6'])
                ->groupBy('weeks.angka_week')
                ->orderBy('weeks.angka_week')
                ->get();
            foreach ($rows as $r) {
                $weeklyData[] = ['week' => 'W' . $r->week, 'score' => round((float) $r->avg_s, 1)];
            }
        }

        $cohortMap = [];
        if ($kader->id_batch) {
            $batchNiks  = Kader::where('id_batch', $kader->id_batch)->pluck('nik')->all();
            $cohortRows = DB::table('jawaban')
                ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
                ->selectRaw('weeks.angka_week as week, AVG(jawaban.jawaban) / 4 as avg_s')
                ->whereIn('jawaban.nik_kader', $batchNiks)
                ->whereNotNull('jawaban.nama_mentor')
                ->whereNotIn('jawaban.id_pertanyaan', ['5', '6'])
                ->groupBy('weeks.angka_week')
                ->orderBy('weeks.angka_week')
                ->get();
            foreach ($cohortRows as $r) {
                $cohortMap['W' . $r->week] = round((float) $r->avg_s, 1);
            }
        }

        $currentWeek = count($weeklyData);
        $totalWeeks  = Week::count();
        $weeks       = Week::orderBy('id_week')->get(['id_week', 'angka_week', 'bulan', 'tahun']);

        $refleksiQuery = Jawaban::whereIn('jawaban.id_pertanyaan', [7, 8, 9])
            ->where('jawaban.nik_kader', $kader->nik)
            ->whereNull('jawaban.nama_mentor')
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->select('jawaban.id_week', 'jawaban.id_pertanyaan', 'jawaban.jawaban',
                     'jawaban.id_jawaban', 'weeks.angka_week', 'weeks.bulan', 'weeks.tahun')
            ->orderBy('jawaban.id_week', 'desc')
            ->orderBy('jawaban.id_jawaban', 'desc');

        $refleksiRaw = $refleksiQuery->get();

        $motivasiMap = Jawaban::where('nik_kader', $kader->nik)
            ->where('id_pertanyaan', 5)
            ->whereNotNull('nama_mentor')
            ->pluck('jawaban', 'id_week')
            ->all();

        $refleksiByWeek = [];
        foreach ($refleksiRaw as $r) {
            $wk = $r->id_week;
            if (!isset($refleksiByWeek[$wk])) {
                $refleksiByWeek[$wk] = [
                    'week_id'    => $wk,
                    'angka_week' => $r->angka_week,
                    'bulan'      => $r->bulan,
                    'tahun'      => $r->tahun,
                    'motivasi'   => isset($motivasiMap[$wk]) ? (int) $motivasiMap[$wk] : null,
                    'dipelajari' => null,
                    'tantangan'  => null,
                    'rencana'    => null,
                ];
            }
            $key = match ((int) $r->id_pertanyaan) {
                7 => 'dipelajari',
                8 => 'tantangan',
                9 => 'rencana',
                default => null,
            };
            if ($key && $refleksiByWeek[$wk][$key] === null) {
                $refleksiByWeek[$wk][$key] = strip_tags($r->jawaban);
            }
        }
        $refleksiList = array_values($refleksiByWeek);

        $mentorFeedbackRaw = Jawaban::whereIn('jawaban.id_pertanyaan', [1, 2, 3, 4, 5, 6])
            ->where('jawaban.nik_kader', $kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->select('jawaban.id_week', 'jawaban.id_pertanyaan', 'jawaban.jawaban',
                     'jawaban.nama_mentor', 'weeks.angka_week', 'weeks.bulan', 'weeks.tahun')
            ->orderBy('jawaban.id_week', 'desc')
            ->orderBy('jawaban.id_pertanyaan', 'asc')
            ->get();

        $motivasiLabel  = [1 => 'Sangat Kurang', 2 => 'Kurang', 3 => 'Cukup', 4 => 'Baik', 5 => 'Sangat Baik'];
        $feedbackByWeek = [];
        foreach ($mentorFeedbackRaw as $r) {
            $wk = $r->id_week;
            if (!isset($feedbackByWeek[$wk])) {
                $feedbackByWeek[$wk] = [
                    'week_id'       => $wk,
                    'angka_week'    => $r->angka_week,
                    'bulan'         => $r->bulan,
                    'tahun'         => $r->tahun,
                    'nama_mentor'   => $r->nama_mentor,
                    'routine_job'   => null,
                    'assignment'    => null,
                    'pemahaman_sop' => null,
                    'project'       => null,
                    'motivasi'      => null,
                    'area'          => null,
                ];
            }
            $val = strip_tags($r->jawaban ?? '');
            match ((int) $r->id_pertanyaan) {
                1 => $feedbackByWeek[$wk]['routine_job']   = $val,
                2 => $feedbackByWeek[$wk]['assignment']    = $val,
                3 => $feedbackByWeek[$wk]['pemahaman_sop'] = $val,
                4 => $feedbackByWeek[$wk]['project']       = $val,
                5 => $feedbackByWeek[$wk]['motivasi']      = $motivasiLabel[(int)$val] ?? $val,
                6 => $feedbackByWeek[$wk]['area']          = $val,
                default => null,
            };
        }
        $mentorFeedbackList = array_values($feedbackByWeek);

        $perjanjianKerja = Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PERJANJIAN_KERJA')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($perjanjianKerja) {
            $uploader = User::find($perjanjianKerja->mentor_id);
            $perjanjianKerja->uploaded_by_name = $uploader?->name ?? '—';
        }

        return Inertia::render('KaderSaya/Detail', [
            'kader'              => $kader,
            'faseGroups'         => $faseGroups,
            'overallProgress'    => $overallProgress,
            'avgScore'           => $avgScoreOverall,
            'status'             => $status,
            'totalModuls'        => $totalModuls,
            'weeklyData'         => $weeklyData,
            'cohortMap'          => $cohortMap,
            'currentWeek'        => $currentWeek,
            'totalWeeks'         => $totalWeeks,
            'weeks'              => $weeks,
            'refleksi'           => $refleksiList,
            'mentorFeedbackList' => $mentorFeedbackList,
            'mentorName'         => $user->name,
            'perjanjianKerja'    => $perjanjianKerja,
            'canUpload'          => $isAdmin021 || $isMentor,
        ]);
    }

    public function storeFeedback(Request $request, $kader_id)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        Log::info('[KaderSaya::storeFeedback] incoming request', [
            'kader_id'  => $kader_id,
            'kader_nik' => $kader->nik,
            'mentor'    => $user->name,
            'request'   => $request->only(['id_week','p1','p2','p3','p4','p5','p6']),
        ]);

        $motivasiScore = [
            'Sangat Kurang' => 1,
            'Kurang'        => 2,
            'Cukup'         => 3,
            'Baik'          => 4,
            'Sangat Baik'   => 5,
        ];

        $base = [
            'id_week'     => $request->id_week,
            'nama_mentor' => $user->name,
            'nik_kader'   => $kader->nik,
            'created_at'  => now(),
            'updated_at'  => now(),
            'created_by'  => $user->id,
        ];

        $answers = [
            1 => $request->p1,
            2 => $request->p2,
            3 => $request->p3,
            4 => $request->p4,
            5 => $motivasiScore[$request->p5] ?? null,
            6 => $request->p6,
        ];

        $inserted = 0;
        foreach ($answers as $pertanyaan => $jawaban) {
            if ($jawaban === null || $jawaban === '') continue;
            Jawaban::create(array_merge($base, ['id_pertanyaan' => $pertanyaan, 'jawaban' => $jawaban]));
            $inserted++;
        }

        Log::info("[KaderSaya::storeFeedback] done — {$inserted} rows inserted");

        return back()->with('feedbackSuccess', true);
    }
}
