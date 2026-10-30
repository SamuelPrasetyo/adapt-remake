<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\Kader;
use App\Models\Modul;
use App\Models\ModulTestResult;
use App\Models\ModulUserAnswers;
use App\Models\SoalModul;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Detail jawaban Pre-Test / Post-Test seorang Kader — khusus Admin MAI (021).
 *
 * Berbeda dengan LearningController::myAnswers (tampilan Kader sendiri), endpoint ini
 * ikut mengirim kunci jawaban (is_benar) agar Admin bisa melihat jawaban yang benar
 * pada soal yang dijawab salah, plus ringkasan jumlah soal / benar / salah / skor.
 */
class KaderTestAnswerController extends Controller
{
    public function show($kaderId, $modulId, $type)
    {
        abort_unless(in_array($type, ['pre', 'post'], true), 404);

        $kader = Kader::where('id', $kaderId)->first(['id', 'nik']);
        abort_unless($kader, 404);

        $userId = User::where('nik', $kader->nik)->value('id');
        abort_unless($userId, 404);

        $modul = Modul::where('id', $modulId)->first(['id', 'kode_modul', 'nama_modul']);
        abort_unless($modul, 404);

        // Progres Kader selalu tersimpan dengan mentor_id NULL (mentor_id hanya dipakai akun Mentor).
        $result = ModulTestResult::where('user_id', $userId)
            ->where('modul_id', $modul->id)
            ->where('tipe', $type)
            ->where('is_completed', 1)
            ->whereNull('mentor_id')
            ->latest('id')
            ->first();

        if (!$result) {
            return response()->json(['message' => 'Kader belum mengerjakan test ini.'], 404);
        }

        $userAnswers = ModulUserAnswers::where('result_id', $result->id)->orderBy('id')->get();
        $soals       = SoalModul::with('jawabans')
            ->whereIn('id', $userAnswers->pluck('soal_modul_id'))
            ->get()
            ->keyBy('id');

        $items = $userAnswers->map(function ($ua) use ($soals) {
            $soal = $soals[$ua->soal_modul_id] ?? null;
            if (!$soal) return null;

            return [
                // is_correct = penilaian saat Kader submit (dasar skor), bukan kunci terkini.
                'soal'       => $soal->soal,
                'is_correct' => (bool) $ua->is_correct,
                'jawabans'   => $soal->jawabans->map(fn($j) => [
                    'id'       => $j->id,
                    'jawaban'  => $j->jawaban,
                    'is_benar' => (bool) $j->is_benar,
                    'selected' => $j->id == $ua->jawaban_modul_id,
                ])->values(),
            ];
        })->filter()->values();

        // Ringkasan dihitung dari seluruh jawaban tersimpan, termasuk soal yang sudah
        // dihapus dari bank soal, agar sejalan dengan skor yang tercatat.
        $total   = $userAnswers->count();
        $correct = $userAnswers->where('is_correct', 1)->count();

        return response()->json([
            'modul'   => ['kode' => $modul->kode_modul, 'nama' => $modul->nama_modul],
            'summary' => [
                'total'        => $total,
                'correct'      => $correct,
                'wrong'        => $total - $correct,
                'score'        => $result->score !== null ? round((float) $result->score, 2) : null,
                'completed_at' => $result->updated_at ? Carbon::parse($result->updated_at)->toIso8601String() : null,
            ],
            'items'   => $items,
        ]);
    }
}
