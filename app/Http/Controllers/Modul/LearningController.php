<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Company;
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

    public function detail($id)
    {
        $user  = auth()->user();
        $modul = Modul::findOrFail($id);

        $pretestResult  = ModulTestResult::where('user_id', $user->id)
            ->where('modul_id', $modul->id)
            ->where('tipe', 'pre')
            ->where('is_completed', 1)
            ->first();

        $posttestResult = ModulTestResult::where('user_id', $user->id)
            ->where('modul_id', $modul->id)
            ->where('tipe', 'post')
            ->where('is_completed', 1)
            ->first();

        $readingProgress = ModulReadingProgress::where('user_id', $user->id)
            ->where('modul_id', $modul->id)
            ->value('progress') ?? 0;

        $progress = [
            'pretest'          => (bool) $pretestResult,
            'pretest_score'    => $pretestResult?->score,
            'materi'           => $readingProgress >= 100,
            'materi_progress'  => $readingProgress,
            'posttest'         => (bool) $posttestResult,
            'posttest_score'   => $posttestResult?->score,
            'post_activity'    => false,
            'final_score'      => $posttestResult?->score ?? null,
        ];

        $pretest  = SoalModul::with('jawabans')
            ->where('modul_id', $modul->id)
            ->where('tipe', 'pre')
            ->get();

        $posttest = SoalModul::with('jawabans')
            ->where('modul_id', $modul->id)
            ->where('tipe', 'post')
            ->get();

        return Inertia::render('MyModul/Detail', [
            'modul'    => $modul,
            'progress' => $progress,
            'pretest'  => $pretest,
            'posttest' => $posttest,
        ]);
    }

    public function test($id, $type)
    {
        $modul = Modul::findOrFail($id);

        $soals = SoalModul::with('jawabans')
            ->where('modul_id', $id)
            ->where('tipe', $type)
            ->get();

        return view('pages.learning.test', compact(
            'modul',
            'soals',
            'type'
        ));
    }

    public function submitTest(Request $request)
    {
        $request->validate([
            'modul_id' => 'required',
            'tipe'     => 'required',
            'answers'  => 'required|array',
        ]);

        $alreadyDone = ModulTestResult::where('user_id', auth()->id())
            ->where('modul_id', $request->modul_id)
            ->where('tipe', $request->tipe)
            ->where('is_completed', 1)
            ->exists();

        if ($alreadyDone) {
            return back()->withErrors(['test' => 'Test ini sudah pernah dikerjakan dan tidak dapat diulang.']);
        }

        $correct = 0;
        $total = count($request->answers);

        // create result
        $result = ModulTestResult::create([
            'user_id' => auth()->user()->id,
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

    public function myAnswers($id, $type)
    {
        $user = auth()->user();

        $result = ModulTestResult::where('user_id', $user->id)
            ->where('modul_id', $id)
            ->where('tipe', $type)
            ->where('is_completed', 1)
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

        $record = ModulReadingProgress::firstOrCreate(
            ['user_id' => auth()->id(), 'modul_id' => $request->modul_id],
            ['progress' => $request->progress]
        );

        if ($request->progress > $record->progress) {
            $record->update(['progress' => $request->progress]);
        }

        return back();
    }

    public function ajax_test($id, $type)
    {
        $soals = SoalModul::with('jawabans')
            ->where('modul_id', $id)
            ->where('tipe', $type)
            ->get();

        return response()->json($soals);
    }
}
