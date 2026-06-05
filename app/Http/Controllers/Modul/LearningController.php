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
        $postActivityDoc = Dokumen::with('penilaian', 'files')
            ->where('modul_id', $modul->id)
            ->where('jenis', 'POST_ACTIVITY')
            ->when($userType === 'kader',  fn($q) => $q->where('kader_id', $user->id))
            ->when($userType !== 'kader', function ($q) use ($user, $mentorId) {
                $q->where('mentor_id', $user->id);
                $mentorId ? $q->where('mentor_master_id', $mentorId) : $q->whereNull('mentor_master_id');
            })
            ->latest()
            ->first();

        // Skor Akhir = rata-rata 50/50 post-test & nilai Post Activity, hanya bila KEDUANYA ada.
        $paNilai       = $postActivityDoc ? optional($postActivityDoc->penilaian)->nilai : null;
        // Daftar file Post Activity; fallback ke kolom dokumen lama bila belum ada baris dokumen_files.
        $postActivityFiles = $postActivityDoc
            ? ($postActivityDoc->files->isNotEmpty()
                ? $postActivityDoc->files->map(fn($f) => ['nama_file' => $f->nama_file, 'path_file' => $f->path_file])->values()
                : collect([['nama_file' => $postActivityDoc->nama_file, 'path_file' => $postActivityDoc->path_file]]))
            : collect();
        $posttestScore = $posttestResult ? $posttestResult->score : null;
        $finalScore    = ($posttestScore !== null && $paNilai !== null)
            ? round(($posttestScore + $paNilai) / 2, 2)
            : null;

        $progress = [
            'pretest'               => (bool) $pretestResult,
            'pretest_score'         => $pretestResult ? $pretestResult->score : null,
            'materi'                => $readingProgress >= 100,
            'materi_progress'       => $readingProgress,
            'posttest'              => (bool) $posttestResult,
            'posttest_score'        => $posttestResult ? $posttestResult->score : null,
            'post_activity'             => (bool) $postActivityDoc,
            'post_activity_file'        => $postActivityDoc ? $postActivityDoc->nama_file : null,
            'post_activity_files'       => $postActivityFiles->values(),
            'post_activity_status'      => $postActivityDoc ? $postActivityDoc->status : null,
            'post_activity_nilai'       => $paNilai,
            'post_activity_rejection_reason' => $postActivityDoc ? $postActivityDoc->rejection_reason : null,
            'post_activity_can_reupload'     => !$postActivityDoc || $postActivityDoc->status === 'rejected',
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
        // Satu Post Activity bisa berisi banyak file (maks 10) — di-review & dinilai sekali sebagai satu paket.
        $request->validate([
            'modul_id' => 'required|integer',
            'files'    => 'required|array|min:1|max:10',
            'files.*'  => 'required|file|mimes:pdf,docx,xlsx|max:2048',
        ]);

        $user     = auth()->user();
        $userType = strtolower($user->type ?? '');
        $mentorMasterId = optional($this->activeMentor($request))->id;

        // Cegah upload ulang jika dokumen terakhir masih menunggu review / sudah disetujui.
        $lastDoc = Dokumen::with('files')
            ->where('modul_id', $request->modul_id)
            ->where('jenis', 'POST_ACTIVITY')
            ->when($userType === 'kader', fn($q) => $q->where('kader_id', $user->id))
            ->when($userType !== 'kader', function ($q) use ($user, $mentorMasterId) {
                $q->where('mentor_id', $user->id);
                $mentorMasterId ? $q->where('mentor_master_id', $mentorMasterId) : $q->whereNull('mentor_master_id');
            })
            ->latest()
            ->first();

        if ($lastDoc && in_array($lastDoc->status, ['pending', 'approved'], true)) {
            $msg = $lastDoc->status === 'approved'
                ? 'Post Activity sudah disetujui Admin MAI dan tidak dapat diubah.'
                : 'Post Activity masih menunggu review Admin MAI.';
            return back()->withErrors(['files' => $msg]);
        }

        // Re-upload setelah ditolak — hapus dokumen lama (semua file + row) agar tidak menumpuk file sampah.
        if ($lastDoc && $lastDoc->status === 'rejected') {
            $oldPaths = $lastDoc->files->pluck('path_file')->push($lastDoc->path_file)->filter()->unique();
            foreach ($oldPaths as $oldPath) {
                $full = public_path($oldPath);
                if (file_exists($full)) {
                    @unlink($full);
                }
            }
            $lastDoc->files()->delete();
            $lastDoc->delete();
        }

        $folder = public_path('uploads/post_activity');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        // Simpan tiap file ke disk; tampung metadata-nya untuk dibuatkan baris dokumen_files.
        $stored = [];
        foreach ($request->file('files') as $uploaded) {
            $originalName = $uploaded->getClientOriginalName();
            $fileName = time() . '_' . uniqid() . '.' . $uploaded->extension();
            $uploaded->move($folder, $fileName);
            $stored[] = [
                'nama_file' => $originalName,
                'path_file' => 'uploads/post_activity/' . $fileName,
            ];
        }

        // File pertama disimpan juga di kolom dokumen.nama_file/path_file sebagai perwakilan
        // (kompatibilitas dengan tampilan lama); daftar lengkap ada di dokumen_files.
        $dokumen = Dokumen::create([
            'nama_file' => $stored[0]['nama_file'],
            'path_file' => $stored[0]['path_file'],
            'tipe'      => $userType === 'kader' ? 'kader' : 'mentor',
            'status'    => 'pending',
            'jenis'     => 'POST_ACTIVITY',
            'modul_id'  => $request->modul_id,
            'kader_id'  => $userType === 'kader'  ? $user->id : null,
            'mentor_id' => $userType === 'mentor' ? $user->id : null,
            'mentor_master_id' => $userType === 'mentor' ? $mentorMasterId : null,
        ]);

        $dokumen->files()->createMany($stored);

        $msg = count($stored) > 1
            ? count($stored) . ' file berhasil diupload.'
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
