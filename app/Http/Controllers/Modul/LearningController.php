<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Dokumen;
use App\Models\Mentor;
use App\Models\JawabanModul;
use App\Models\Kader;
use App\Models\Modul;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\ModulUserAnswers;
use App\Models\SoalModul;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LearningController extends Controller
{
    /**
     * Record mentor aktif untuk konteks pengerjaan modul.
     *
     * Satu akun Mentor bisa memegang banyak record mentor (tabel `mentor`). Mentor yang login
     * mengerjakan modul atas nama record mentor yang dipilih lewat ?mentor_id (lihat sidebar
     * MentorSelectorCard) — scope-nya BU/company_code yang sama, persis seperti dropdown selector.
     *
     * Mengembalikan null untuk Kader, atau Mentor yang belum memilih record ("Program Saya Sendiri").
     */
    private function activeMentor(Request $request): ?Mentor
    {
        $user = auth()->user();
        if (strtolower($user->type ?? '') !== 'mentor') {
            return null;
        }

        $mentorId = $request->input('mentor_id');
        if (!$mentorId) {
            return null;
        }

        return Mentor::whereNull('deleted_at')
            ->where('id', $mentorId)
            ->where('company_code', $user->company_code)
            ->first();
    }

    public function index()
    {
        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        if (!$kader) {
            return Inertia::render('MyModul/Index', [
                'moduls'  => [],
                'grouped' => [],
            ]);
        }

        // users.company_code links to company.company_code; modul_assignments stores company.company_id (PK)
        $company   = Company::where('company_code', $user->company_code)->first();
        $companyId = $company ? $company->company_id : null;

        $moduls = Modul::whereHas('assignments', function ($q) use ($kader, $companyId) {
            $q->where(function ($x) use ($kader) {
                $x->where('assignable_type', 'user')
                  ->where('assignable_id', $kader->id);
            });
            if ($companyId) {
                $q->orWhere(function ($x) use ($companyId) {
                    $x->where('assignable_type', 'company')
                      ->where('assignable_id', $companyId);
                });
            }
        })
        ->orderBy('fase')
        ->get();

        $grouped = $moduls->groupBy('fase');

        return Inertia::render('MyModul/Index', [
            'moduls'  => $moduls->values(),
            'grouped' => $grouped,
        ]);
    }

    public function detail(Request $request, $id)
    {
        $user  = auth()->user();
        $modul = Modul::findOrFail($id);

        // Progress di-scope per record mentor bila Mentor memilih mentor (?mentor_id),
        // selain itu per akun login (mentor_id NULL = Kader / "Program Saya Sendiri").
        $mentorId = optional($this->activeMentor($request))->id;
        $scopeMentor = function ($query) use ($mentorId) {
            return $mentorId ? $query->where('mentor_id', $mentorId) : $query->whereNull('mentor_id');
        };

        $pretestResult  = $scopeMentor(
            ModulTestResult::where('user_id', $user->id)
                ->where('modul_id', $modul->id)
                ->where('tipe', 'pre')
                ->where('is_completed', 1)
        )->first();

        $posttestResult = $scopeMentor(
            ModulTestResult::where('user_id', $user->id)
                ->where('modul_id', $modul->id)
                ->where('tipe', 'post')
                ->where('is_completed', 1)
        )->first();

        $readingProgress = $scopeMentor(
            ModulReadingProgress::where('user_id', $user->id)
                ->where('modul_id', $modul->id)
        )->value('progress') ?? 0;

        $userType = strtolower($user->type ?? '');
        // Post Activity Mentor = 10 sesi (1 jam coaching/minggu), upload 1 file per sesi secara berurutan:
        // tiap sesi harus di-approve Admin MAI dulu sebelum sesi berikutnya. Kader cukup 1 sesi per modul.
        $isMentor         = $userType !== 'kader';
        $requiredSessions = $isMentor ? 10 : 1;

        $postActivityDocs = Dokumen::with('penilaian')
            ->where('modul_id', $modul->id)
            ->where('jenis', 'POST_ACTIVITY')
            ->when($userType === 'kader',  fn($q) => $q->where('kader_id', $user->id))
            ->when($userType !== 'kader', function ($q) use ($user, $mentorId) {
                $q->where('mentor_id', $user->id);
                $mentorId ? $q->where('mentor_master_id', $mentorId) : $q->whereNull('mentor_master_id');
            })
            ->orderBy('created_at')
            ->get();

        $approvedDocs   = $postActivityDocs->where('status', 'approved')->values();
        $approvedCount  = $approvedDocs->count();
        $pendingDoc     = $postActivityDocs->firstWhere('status', 'pending');
        $rejectedDoc    = $postActivityDocs->where('status', 'rejected')->last();
        $paDone         = $approvedCount >= $requiredSessions;

        // Nilai Post Activity hanya diberikan pada sesi terakhir (ke-10 untuk Mentor / ke-1 untuk Kader);
        // ambil dari dokumen approved yang punya penilaian.
        $scoringDoc = $approvedDocs->first(fn($d) => $d->penilaian);
        $paNilai    = $scoringDoc ? optional($scoringDoc->penilaian)->nilai : null;

        // Riwayat sesi untuk ditampilkan di checklist (urut sesi 1..n).
        $sessions = $postActivityDocs->map(fn($d) => [
            'nama_file'        => $d->nama_file,
            'path_file'        => $d->path_file,
            'status'           => $d->status,
            'nilai'            => optional($d->penilaian)->nilai,
            'rejection_reason' => $d->rejection_reason,
        ])->values();

        // Skor Akhir memakai komponen yang dimiliki modul:
        // - punya keduanya  → rata-rata 50/50 post-test & Post Activity (hanya bila keduanya dinilai)
        // - hanya test      → skor post-test
        // - hanya PA        → nilai Post Activity
        $hasTest       = (bool) $modul->has_test;
        $hasPA         = (bool) $modul->has_post_activity;
        $posttestScore = $posttestResult ? $posttestResult->score : null;

        if ($hasTest && $hasPA) {
            $finalScore = ($posttestScore !== null && $paNilai !== null)
                ? round(($posttestScore + $paNilai) / 2, 2)
                : null;
        } elseif ($hasTest) {
            $finalScore = $posttestScore;
        } elseif ($hasPA) {
            $finalScore = $paNilai;
        } else {
            $finalScore = null;
        }

        $progress = [
            'pretest'               => (bool) $pretestResult,
            'pretest_score'         => $pretestResult ? $pretestResult->score : null,
            'materi'                => $readingProgress >= 100,
            'materi_progress'       => $readingProgress,
            'posttest'              => (bool) $posttestResult,
            'posttest_score'        => $posttestResult ? $posttestResult->score : null,
            'post_activity'                  => $paDone,
            'post_activity_required'         => $requiredSessions,
            'post_activity_approved_count'   => $approvedCount,
            'post_activity_sessions'         => $sessions,
            'post_activity_pending'          => (bool) $pendingDoc,
            'post_activity_rejection_reason' => $rejectedDoc ? $rejectedDoc->rejection_reason : null,
            // Boleh upload sesi berikutnya bila tak ada yang menunggu review & belum mencapai kuota.
            'post_activity_can_upload'       => !$pendingDoc && $approvedCount < $requiredSessions,
            'post_activity_nilai'            => $paNilai,
            'final_score'           => $finalScore,
        ];

        $pretest  = SoalModul::with('jawabans')
            ->where('modul_id', $modul->id)
            ->where('tipe', 'pre')
            ->get();

        $posttest = SoalModul::with('jawabans')
            ->where('modul_id', $modul->id)
            ->where('tipe', 'post')
            ->get()
            ->shuffle()
            ->map(fn($s) => tap($s, fn($s) => $s->setRelation('jawabans', $s->jawabans->shuffle()->values())))
            ->values();

        $mentors        = null;
        $selectedMentor = null;
        if ($user->type === 'Mentor') {
            $mentors = Mentor::select('mentor.*', 'company.company_shortname as bu')
                ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
                ->whereNull('mentor.deleted_at')
                ->where('mentor.company_code', $user->company_code)
                ->orderBy('mentor.nama')
                ->get();

            $mentorId       = request()->query('mentor_id');
            $selectedMentor = $mentorId ? $mentors->firstWhere('id', $mentorId) : null;
        }

        return Inertia::render('MyModul/Detail', [
            'modul'          => $modul,
            'progress'       => $progress,
            'pretest'        => $pretest,
            'posttest'       => $posttest,
            'mentors'        => $mentors,
            'selectedMentor' => $selectedMentor,
        ]);
    }

    public function test($id, $type)
    {
        return redirect()->route('learning.detail', $id);
    }

    public function submitTest(Request $request)
    {
        $request->validate([
            'modul_id' => 'required',
            'tipe'     => 'required',
            'answers'  => 'required|array',
        ]);

        $mentorId = optional($this->activeMentor($request))->id;

        $alreadyDone = ModulTestResult::where('user_id', auth()->id())
            ->where('modul_id', $request->modul_id)
            ->where('tipe', $request->tipe)
            ->where('is_completed', 1)
            ->when($mentorId, fn($q) => $q->where('mentor_id', $mentorId))
            ->when(!$mentorId, fn($q) => $q->whereNull('mentor_id'))
            ->exists();

        if ($alreadyDone) {
            return back()->withErrors(['test' => 'Test ini sudah pernah dikerjakan dan tidak dapat diulang.']);
        }

        $correct = 0;
        $total = count($request->answers);

        // create result
        $result = ModulTestResult::create([
            'user_id' => auth()->user()->id,
            'mentor_id' => $mentorId,
            'modul_id' => $request->modul_id,
            'tipe' => $request->tipe,
        ]);

        foreach ($request->answers as $soalId => $jawabanId) {

            $jawaban = JawabanModul::find($jawabanId);

            $isCorrect = $jawaban->is_benar ? 1 : 0;

            if ($isCorrect) {
                $correct++;
            }

            ModulUserAnswers::create([
                'result_id' => $result->id,
                'soal_modul_id' => $soalId,
                'jawaban_modul_id' => $jawabanId,
                'is_correct' => $isCorrect
            ]);
        }

        // score
        $score = ($correct / $total) * 100;

        $result->update([
            'score' => $score,
            'is_completed' => 1
        ]);

        return back();
    }

    public function myAnswers(Request $request, $id, $type)
    {
        $user = auth()->user();
        $mentorId = optional($this->activeMentor($request))->id;

        $result = ModulTestResult::where('user_id', $user->id)
            ->where('modul_id', $id)
            ->where('tipe', $type)
            ->where('is_completed', 1)
            ->when($mentorId, fn($q) => $q->where('mentor_id', $mentorId))
            ->when(!$mentorId, fn($q) => $q->whereNull('mentor_id'))
            ->firstOrFail();

        $userAnswers = ModulUserAnswers::where('result_id', $result->id)->get();
        $soalIds     = $userAnswers->pluck('soal_modul_id');
        $soals       = SoalModul::with('jawabans')->whereIn('id', $soalIds)->get()->keyBy('id');

        $items = $userAnswers->map(function ($ua) use ($soals) {
            $soal = $soals[$ua->soal_modul_id] ?? null;
            if (!$soal) return null;

            return [
                'soal'       => $soal->soal,
                'is_correct' => (bool) $ua->is_correct,
                'jawabans'   => $soal->jawabans->map(fn($j) => [
                    'id'       => $j->id,
                    'jawaban'  => $j->jawaban,
                    'selected' => $j->id == $ua->jawaban_modul_id,
                ])->values(),
            ];
        })->filter()->values();

        return response()->json([
            'score' => $result->score,
            'items' => $items,
        ]);
    }

    public function saveReadingProgress(Request $request)
    {
        $request->validate([
            'modul_id' => 'required|integer',
            'progress' => 'required|integer|min:0|max:100',
        ]);

        $mentorId = optional($this->activeMentor($request))->id;

        $record = ModulReadingProgress::firstOrCreate(
            ['user_id' => auth()->id(), 'modul_id' => $request->modul_id, 'mentor_id' => $mentorId],
            ['progress' => $request->progress]
        );

        if ($request->progress > $record->progress) {
            $record->update(['progress' => $request->progress]);
        }

        return back();
    }

    public function uploadPostActivity(Request $request)
    {
        // Satu file per upload. Mentor mengisi Post Activity per sesi coaching (maks 10 sesi),
        // berurutan: sesi berikutnya baru bisa diupload setelah sesi sebelumnya di-approve Admin MAI.
        $request->validate([
            'modul_id' => 'required|integer',
            'file'     => 'required|file|mimes:pdf,docx,xlsx|max:2048',
        ]);

        $user     = auth()->user();
        $userType = strtolower($user->type ?? '');
        $isMentor = $userType !== 'kader';
        $mentorMasterId = optional($this->activeMentor($request))->id;
        $maxSessions = $isMentor ? 10 : 1;

        // Query baru tiap dipanggil (builder bersifat mutable) untuk men-scope dokumen ke uploader.
        $scopeQuery = function () use ($request, $userType, $user, $mentorMasterId) {
            return Dokumen::where('modul_id', $request->modul_id)
                ->where('jenis', 'POST_ACTIVITY')
                ->when($userType === 'kader', fn($q) => $q->where('kader_id', $user->id))
                ->when($userType !== 'kader', function ($q) use ($user, $mentorMasterId) {
                    $q->where('mentor_id', $user->id);
                    $mentorMasterId ? $q->where('mentor_master_id', $mentorMasterId) : $q->whereNull('mentor_master_id');
                });
        };

        // Masih ada sesi menunggu review → belum boleh upload sesi berikutnya.
        if ($scopeQuery()->where('status', 'pending')->exists()) {
            return back()->withErrors(['file' => 'Masih ada Post Activity yang menunggu review Admin MAI.']);
        }

        // Kuota sesi sudah penuh (10 untuk Mentor / 1 untuk Kader).
        $approvedCount = $scopeQuery()->where('status', 'approved')->count();
        if ($approvedCount >= $maxSessions) {
            $msg = $isMentor
                ? 'Semua 10 sesi Post Activity sudah disetujui.'
                : 'Post Activity sudah disetujui Admin MAI dan tidak dapat diubah.';
            return back()->withErrors(['file' => $msg]);
        }

        // Upload ulang setelah ditolak — bersihkan dokumen yang ditolak (file + row) agar tak menumpuk.
        foreach ($scopeQuery()->where('status', 'rejected')->get() as $rejected) {
            $full = public_path($rejected->path_file);
            if ($rejected->path_file && file_exists($full)) {
                @unlink($full);
            }
            $rejected->delete();
        }

        $folder = public_path('uploads/post_activity');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        $ext      = $request->file('file')->extension();
        $fileName = time() . '_' . uniqid() . '.' . $ext;
        $originalName = $request->file('file')->getClientOriginalName();
        $request->file('file')->move($folder, $fileName);

        Dokumen::create([
            'nama_file' => $originalName,
            'path_file' => 'uploads/post_activity/' . $fileName,
            'tipe'      => $isMentor ? 'mentor' : 'kader',
            'status'    => 'pending',
            'jenis'     => 'POST_ACTIVITY',
            'modul_id'  => $request->modul_id,
            'kader_id'  => $isMentor ? null : $user->id,
            'mentor_id' => $isMentor ? $user->id : null,
            'mentor_master_id' => $isMentor ? $mentorMasterId : null,
        ]);

        $sessionNo = $approvedCount + 1;
        $msg = $isMentor
            ? "Post Activity sesi {$sessionNo}/{$maxSessions} berhasil diupload."
            : 'File berhasil diupload.';

        return back()->with('success', $msg);
    }

    public function ajax_test($id, $type)
    {
        $soals = SoalModul::with('jawabans')
            ->where('modul_id', $id)
            ->where('tipe', $type)
            ->get();

        if ($type === 'post') {
            $soals = $soals->shuffle()
                ->map(fn($s) => tap($s, fn($s) => $s->setRelation('jawabans', $s->jawabans->shuffle()->values())))
                ->values();
        }

        return response()->json($soals);
    }
}
