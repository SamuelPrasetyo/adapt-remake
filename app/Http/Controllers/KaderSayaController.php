<?php

namespace App\Http\Controllers;

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

        // Attach kader_count
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

        // Attach per-fase avg scores (batch query)
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

        // Moduls assigned to this kader
        $companyId = Company::where('company_code', $kader->company_code)->value('company_id');

        $userModulIds    = $userId
            ? ModulAssignment::where('assignable_type', 'user')->where('assignable_id', $kader->id)->pluck('modul_id')
            : collect();
        $companyModulIds = $companyId
            ? ModulAssignment::where('assignable_type', 'company')->where('assignable_id', $companyId)->pluck('modul_id')
            : collect();
        $allModulIds = $userModulIds->merge($companyModulIds)->unique()->values()->all();

        $moduls = Modul::whereIn('id', $allModulIds)->orderBy('fase')->orderBy('nama_modul')->get(['id', 'nama_modul as nama', 'fase']);

        // Test results
        $testResults = $userId
            ? ModulTestResult::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->where('is_completed', 1)->get(['modul_id', 'tipe', 'score'])
            : collect();

        $testMap = [];
        foreach ($testResults as $t) {
            $testMap[$t->modul_id][$t->tipe] = (float) $t->score;
        }

        // Reading progress
        $readMap = $userId
            ? ModulReadingProgress::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->pluck('progress', 'modul_id')->all()
            : [];

        // Post-activity docs
        $docIds = $userId
            ? Dokumen::where('kader_id', $userId)->whereIn('modul_id', $allModulIds)->where('jenis', 'POST_ACTIVITY')->pluck('modul_id')->flip()->map(fn() => true)->all()
            : [];

        // Build per-fase groups
        $faseGroups = [];
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

        // Weekly chart from jawaban table
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

        // Cohort average from same batch
        $cohortMap = [];
        if ($kader->id_batch) {
            $batchNiks = Kader::where('id_batch', $kader->id_batch)->pluck('nik')->all();
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

        return Inertia::render('KaderSaya/Detail', [
            'kader'           => $kader,
            'faseGroups'      => $faseGroups,
            'overallProgress' => $overallProgress,
            'avgScore'        => $avgScoreOverall,
            'status'          => $status,
            'totalModuls'     => $totalModuls,
            'weeklyData'      => $weeklyData,
            'cohortMap'       => $cohortMap,
            'currentWeek'     => $currentWeek,
            'totalWeeks'      => $totalWeeks,
        ]);
    }
}
