<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\ModulTestResult;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MentorModulController extends Controller
{
    /**
     * Helper: ambil daftar mentor dari BU yang sama + resolve selectedMentor dari ?mentor_id.
     * Digunakan oleh Mentor role di halaman Program Saya dan Modul.
     */
    private function mentorSelectorData(Request $request)
    {
        $authUser = auth()->user();

        $mentors = Mentor::select('mentor.*', 'company.company_shortname as bu')
            ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
            ->whereNull('mentor.deleted_at')
            ->where('mentor.company_code', $authUser->company_code)
            ->orderBy('mentor.nama')
            ->get();

        $mentorId       = $request->query('mentor_id');
        $selectedMentor = $mentorId ? $mentors->firstWhere('id', $mentorId) : null;

        return [$mentors, $selectedMentor, $authUser];
    }

    /** Library modul untuk Mentor (semua modul, tab filter, role isMentor only). */
    public function index(Request $request)
    {
        [$mentors, $selectedMentor] = $this->mentorSelectorData($request);

        $moduls = Modul::orderBy('fase')->orderBy('kode_modul')->get();

        return Inertia::render('MentorModul/Index', [
            'moduls'         => $moduls,
            'mentors'        => $mentors,
            'selectedMentor' => $selectedMentor,
        ]);
    }

    /**
     * Program Saya — learning program Mentor.
     * Tanpa mentor_id: tampilkan program mentor yang login sendiri.
     * Dengan mentor_id: tampilkan program mentor lain dari BU yang sama.
     */
    public function programSaya(Request $request)
    {
        [$mentors, $selectedMentor, $authUser] = $this->mentorSelectorData($request);

        if ($selectedMentor) {
            // Lihat program mentor lain dari BU yang sama
            $mentorMaster = $selectedMentor;
            $targetUser   = $selectedMentor->user_id
                ? User::find($selectedMentor->user_id)
                : User::where('company_code', $mentorMaster->company_code)->where('name', $mentorMaster->nama)->first();
        } else {
            // Default: program mentor sendiri — hanya modul yang di-assign ke user account ini
            $mentorMaster = null;
            $targetUser   = $authUser;
        }

        $filters = [];
        if ($targetUser)    $filters[] = ['mentor',         $targetUser->id];
        if ($mentorMaster)  $filters[] = ['mentor_master',  $mentorMaster->id];

        if (empty($filters)) {
            $moduls = collect();
        } else {
            $moduls = Modul::whereHas('assignments', function ($q) use ($filters) {
                $q->where(function ($inner) use ($filters) {
                    foreach ($filters as $i => [$type, $id]) {
                        $method = $i === 0 ? 'where' : 'orWhere';
                        $inner->$method(function ($x) use ($type, $id) {
                            $x->where('assignable_type', $type)
                              ->where('assignable_id', $id);
                        });
                    }
                });
            })->orderBy('fase')->orderBy('kode_modul')->get();
        }

        $modulIds  = $moduls->pluck('id');
        $total     = $moduls->count();

        $completed = ($targetUser && $total > 0)
            ? ModulTestResult::where('user_id', $targetUser->id)
                ->whereIn('modul_id', $modulIds)
                ->where('tipe', 'post')->where('is_completed', 1)
                ->pluck('modul_id')->unique()->count()
            : 0;

        $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        $avgScore = ($targetUser && $total > 0)
            ? (float) round(ModulTestResult::where('user_id', $targetUser->id)
                ->whereIn('modul_id', $modulIds)
                ->where('tipe', 'post')->where('is_completed', 1)
                ->avg('score') ?? 0, 1)
            : 0;

        $company = Company::where('company_code', ($mentorMaster ? $mentorMaster->company_code : $authUser->company_code))->first();

        $profile = [
            'nama'    => $selectedMentor ? ($mentorMaster ? $mentorMaster->nama : $authUser->name) : $authUser->name,
            'jabatan' => $selectedMentor ? ($mentorMaster ? $mentorMaster->jabatan : null) : null,
            'company' => $company ? $company->company_name : null,
        ];

        $stats = [
            'progress'  => $progress,
            'completed' => $completed,
            'total'     => $total,
            'avg_score' => $avgScore,
            'status'    => $progress >= 60 ? 'On Track' : 'Perlu Perhatian',
        ];

        return Inertia::render('MentorProgramSaya/Index', [
            'moduls'         => $moduls->values(),
            'profile'        => $profile,
            'stats'          => $stats,
            'mentors'        => $mentors,
            'selectedMentor' => $selectedMentor,
        ]);
    }

    /** All Mentor — list progress semua mentor (Admin021 only, read-only). */
    public function allMentor()
    {
        $mentors = Mentor::select('mentor.*', 'company.company_shortname as bu', 'company.company_name')
            ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
            ->whereNull('mentor.deleted_at')
            ->orderBy('mentor.nama')
            ->get();

        $mentorUsers = User::where('type', 'Mentor')
            ->get()
            ->keyBy(fn($u) => $u->company_code . '|' . $u->name);

        $list = $mentors->map(function ($m) use ($mentorUsers) {
            $userKey    = $m->company_code . '|' . $m->nama;
            $targetUser = $mentorUsers->get($userKey);

            $modulIds = DB::table('modul_assignments')
                ->where(function ($q) use ($m, $targetUser) {
                    $q->where(function ($x) use ($m) {
                        $x->where('assignable_type', 'mentor_master')
                          ->where('assignable_id', $m->id);
                    });
                    if ($targetUser) {
                        $q->orWhere(function ($x) use ($targetUser) {
                            $x->where('assignable_type', 'mentor')
                              ->where('assignable_id', $targetUser->id);
                        });
                    }
                })
                ->pluck('modul_id')
                ->unique();

            $total = $modulIds->count();

            $completed = ($targetUser && $total > 0)
                ? ModulTestResult::where('user_id', $targetUser->id)
                    ->whereIn('modul_id', $modulIds)
                    ->where('tipe', 'post')->where('is_completed', 1)
                    ->pluck('modul_id')->unique()->count()
                : 0;

            $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

            $avgScore = ($targetUser && $total > 0)
                ? (float) round(ModulTestResult::where('user_id', $targetUser->id)
                    ->whereIn('modul_id', $modulIds)
                    ->where('tipe', 'post')->where('is_completed', 1)
                    ->avg('score') ?? 0, 1)
                : 0;

            return [
                'id'           => $m->id,
                'nama'         => $m->nama,
                'jabatan'      => $m->jabatan,
                'bu'           => $m->bu,
                'company_code' => $m->company_code,
                'company_name' => $m->company_name,
                'total'        => $total,
                'completed'    => $completed,
                'progress'     => $progress,
                'avg_score'    => $avgScore,
                'status'       => $total === 0
                    ? 'Belum Ada Modul'
                    : ($progress >= 60 ? 'On Track' : 'Perlu Perhatian'),
                'has_account'  => (bool) $targetUser,
            ];
        });

        $summary = [
            'total_mentor'    => $list->count(),
            'on_track'        => $list->where('status', 'On Track')->count(),
            'perlu_perhatian' => $list->where('status', 'Perlu Perhatian')->count(),
            'belum_mulai'     => $list->where('status', 'Belum Ada Modul')->count(),
            'avg_progress'    => $list->where('total', '>', 0)->avg('progress')
                ? (int) round($list->where('total', '>', 0)->avg('progress'))
                : 0,
        ];

        return Inertia::render('AllMentor/Index', [
            'mentors' => $list->values(),
            'summary' => $summary,
        ]);
    }
}
