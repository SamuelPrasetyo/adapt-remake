<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Dokumen;
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

    /**
     * Modul-modul yang Post Activity-nya sudah selesai (kuota 10 sesi Mentor disetujui).
     * Scope: mentor_master_id (record mentor) atau mentor_id (akun login, "Program Sendiri").
     * Mengembalikan koleksi modul_id.
     */
    private function paDoneModulIds($modulIds, ?string $mentorMasterId, $mentorUserId)
    {
        $ids = collect($modulIds)->all();
        if (empty($ids)) return collect();

        $q = Dokumen::whereIn('modul_id', $ids)
            ->where('jenis', 'POST_ACTIVITY')
            ->where('status', 'approved');

        if ($mentorMasterId) {
            $q->where('mentor_master_id', $mentorMasterId);
        } elseif ($mentorUserId) {
            $q->where('mentor_id', $mentorUserId)->whereNull('mentor_master_id');
        } else {
            return collect();
        }

        return $q->get(['modul_id'])
            ->groupBy('modul_id')
            ->filter(fn($g) => $g->count() >= 10) // Mentor: 10 sesi
            ->keys()
            ->values();
    }

    /**
     * Modul PA-only (tanpa Pre/Post Test) dianggap selesai bila kuota sesi Post Activity
     * Mentor (10 sesi) sudah disetujui. Mengembalikan jumlah modul PA-only yang selesai.
     */
    private function paOnlyCompletedCount($modulIds, ?string $mentorMasterId, $mentorUserId): int
    {
        return $this->paDoneModulIds($modulIds, $mentorMasterId, $mentorUserId)->count();
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

        $total = $moduls->count();

        // Komponen yang dinilai berbeda per modul (flags has_test/has_post_activity). Progress
        // di-key per record mentor (mentor.id) bila melihat mentor tertentu; untuk "Program Saya
        // Sendiri" pakai akun login (mentor_id NULL).
        $testModulIds = $moduls->where('has_test', true)->pluck('id');
        $paModulIds   = $moduls->where('has_post_activity', true)->pluck('id');

        $mmId = $mentorMaster ? $mentorMaster->id : null;
        $muId = $mentorMaster ? null : ($targetUser ? $targetUser->id : null);

        // Post-test yang sudah selesai per modul.
        $resultBase = null;
        if ($testModulIds->isNotEmpty()) {
            $resultBase = ModulTestResult::whereIn('modul_id', $testModulIds)
                ->where('tipe', 'post')->where('is_completed', 1);
            if ($mentorMaster) {
                $resultBase->where('mentor_id', $mentorMaster->id);
            } elseif ($targetUser) {
                $resultBase->where('user_id', $targetUser->id)->whereNull('mentor_id');
            } else {
                $resultBase = null;
            }
        }
        $postDone = $resultBase ? (clone $resultBase)->pluck('modul_id')->unique() : collect();

        // Post Activity yang sudah selesai per modul (kuota 10 sesi Mentor disetujui).
        $paDone = $this->paDoneModulIds($paModulIds, $mmId, $muId);

        // Modul selesai = SEMUA komponen yang dimilikinya selesai. Modul ber-test + Post Activity
        // baru dihitung selesai bila post-test DAN Post Activity beres — bukan post-test saja.
        $completed = $moduls->filter(function ($m) use ($postDone, $paDone) {
            $hasTest = (bool) $m->has_test;
            $hasPA   = (bool) $m->has_post_activity;
            if (!$hasTest && !$hasPA) return false;
            if ($hasTest && !$postDone->contains($m->id)) return false;
            if ($hasPA && !$paDone->contains($m->id)) return false;
            return true;
        })->count();

        $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        // Avg Score = rata-rata Skor Akhir tiap modul (rumus sama dengan halaman Detail Modul,
        // lihat Modul::finalScore) — bukan sekadar rata-rata post-test. Kumpulkan skor post-test
        // dan nilai Post Activity per modul, lalu rata-ratakan modul yang sudah bisa dinilai.
        $postScores = $resultBase
            ? (clone $resultBase)->get(['modul_id', 'score'])
                ->groupBy('modul_id')->map(fn ($g) => (float) $g->first()->score)
            : collect();

        $paScores = collect();
        if ($paModulIds->isNotEmpty()) {
            $paQuery = Dokumen::with('penilaian')
                ->whereIn('modul_id', $paModulIds)
                ->where('jenis', 'POST_ACTIVITY')
                ->where('status', 'approved');
            if ($mmId) {
                $paQuery->where('mentor_master_id', $mmId);
            } elseif ($muId) {
                $paQuery->where('mentor_id', $muId)->whereNull('mentor_master_id');
            } else {
                $paQuery = null;
            }
            if ($paQuery) {
                // Nilai PA diberikan di sesi terakhir; ambil dari dokumen approved yang punya penilaian.
                $paScores = $paQuery->orderBy('created_at')->get()
                    ->groupBy('modul_id')
                    ->map(fn ($docs) => optional(optional($docs->first(fn ($d) => $d->penilaian))->penilaian)->nilai)
                    ->reject(fn ($v) => $v === null)
                    ->map(fn ($v) => (float) $v);
            }
        }

        $finalScores = $moduls->map(fn ($m) => Modul::finalScore(
            (bool) $m->has_test,
            (bool) $m->has_post_activity,
            $postScores->get($m->id),
            $paScores->get($m->id)
        ))->reject(fn ($v) => $v === null);

        $avgScore = $finalScores->isNotEmpty() ? (float) round($finalScores->avg(), 1) : 0;

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

        $mentorUsers   = User::where('type', 'Mentor')->get();
        $usersById     = $mentorUsers->keyBy('id');
        $usersByName   = $mentorUsers->keyBy(fn($u) => $u->company_code . '|' . $u->name);

        // Flag komponen per modul untuk membedakan modul ber-test vs PA-only saat hitung progress.
        $modulFlags    = Modul::all(['id', 'has_test', 'has_post_activity'])->keyBy('id');

        $list = $mentors->map(function ($m) use ($usersById, $usersByName, $modulFlags) {
            // Akun login mentor: utamakan relasi mentor.user_id, fallback ke cocok nama+BU.
            $targetUser = ($m->user_id ? $usersById->get($m->user_id) : null)
                ?? $usersByName->get($m->company_code . '|' . $m->nama);

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

            // Modul ber-test selesai bila post-test selesai; modul PA-only bila kuota PA disetujui.
            $testModulIds   = $modulIds->filter(fn($mid) => (bool) (optional($modulFlags[$mid] ?? null)->has_test ?? true))->values();
            $paOnlyModulIds = $modulIds->filter(fn($mid) =>
                !((bool) (optional($modulFlags[$mid] ?? null)->has_test ?? true))
                && ((bool) (optional($modulFlags[$mid] ?? null)->has_post_activity ?? true))
            )->values();

            // Progress di-key per record mentor (mentor.id), bukan per akun login —
            // satu akun bisa memegang banyak mentor dengan progress yang berbeda.
            $completedTest = $testModulIds->isNotEmpty()
                ? ModulTestResult::where('mentor_id', $m->id)
                    ->whereIn('modul_id', $testModulIds)
                    ->where('tipe', 'post')->where('is_completed', 1)
                    ->pluck('modul_id')->unique()->count()
                : 0;
            $completedPA = $this->paOnlyCompletedCount($paOnlyModulIds, $m->id, null);
            $completed   = $completedTest + $completedPA;

            $progress = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

            $avgScore = ($total > 0)
                ? (float) round(ModulTestResult::where('mentor_id', $m->id)
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
