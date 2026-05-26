<?php

namespace App\Http\Controllers\KaderSaya;

use App\Constants\PenilaianOjtStructure;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\PenilaianOjt;
use App\Models\PenilaianOjtKomentar;
use App\Models\PenilaianOjtSkor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PenilaianOjtController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * POST /kader-saya/{kader_id}/penilaian/{fmc}
     * Upsert penilaian + skor + komentar. Hanya Mentor (yang menjadi pembimbing kader) yang boleh.
     */
    public function store(Request $request, $kader_id, $fmc)
    {
        $user = Auth::user();
        $fmc  = (int) $fmc;

        if (!in_array($fmc, PenilaianOjtStructure::FMC_NUMBERS, true)) {
            abort(404, 'FMC tidak valid.');
        }

        $kader = Kader::where('id', $kader_id)->firstOrFail();

        $this->authorizeWrite($user, $kader_id);

        $validated = $request->validate([
            'skor'                       => 'nullable|array',
            'skor.*'                     => 'nullable|integer|min:0|max:100',
            'komentar'                   => 'nullable|array',
            'komentar.*'                 => 'nullable|string',
            'final_report'               => 'nullable|array',
            'final_report.overview'      => 'nullable|string',
            'final_report.strengths'     => 'nullable|string',
            'final_report.weakness'      => 'nullable|string',
            'final_report.mentor_comments' => 'nullable|string',
            'final_report.final_recommendation' => 'nullable|in:recommended,not_recommended',
        ]);

        $validItemCodes = array_flip(PenilaianOjtStructure::validItemCodes());
        $validSubCodes  = array_flip(PenilaianOjtStructure::validSubCodes());

        $penilaian = DB::transaction(function () use ($user, $kader, $fmc, $validated, $validItemCodes, $validSubCodes) {
            $penilaian = PenilaianOjt::where('kader_id', $kader->id)
                ->where('fmc_number', $fmc)
                ->first();

            if (!$penilaian) {
                $penilaian = PenilaianOjt::create([
                    'id_penilaian_ojt' => (string) Str::uuid(),
                    'kader_id'         => $kader->id,
                    'fmc_number'       => $fmc,
                    'created_by'       => $user->id,
                ]);
            }

            // Upsert skor: hanya item_code yg valid
            foreach (($validated['skor'] ?? []) as $itemCode => $skor) {
                if (!isset($validItemCodes[$itemCode])) continue;

                $sheet = $this->sheetFromCode($itemCode);
                if (!$sheet) continue;

                PenilaianOjtSkor::updateOrCreate(
                    ['id_penilaian_ojt' => $penilaian->id_penilaian_ojt, 'item_code' => $itemCode],
                    ['sheet' => $sheet, 'skor' => $skor === '' ? null : $skor]
                );
            }

            // Upsert komentar
            foreach (($validated['komentar'] ?? []) as $subCode => $komentar) {
                if (!isset($validSubCodes[$subCode])) continue;

                $sheet = $this->sheetFromCode($subCode);
                if (!$sheet) continue;

                PenilaianOjtKomentar::updateOrCreate(
                    ['id_penilaian_ojt' => $penilaian->id_penilaian_ojt, 'sub_code' => $subCode],
                    ['sheet' => $sheet, 'komentar' => $komentar ?: null]
                );
            }

            // Final report fields
            if (!empty($validated['final_report'])) {
                $fr = $validated['final_report'];
                $penilaian->fill([
                    'overview'             => $fr['overview']             ?? $penilaian->overview,
                    'strengths'            => $fr['strengths']            ?? $penilaian->strengths,
                    'weakness'             => $fr['weakness']             ?? $penilaian->weakness,
                    'mentor_comments'      => $fr['mentor_comments']      ?? $penilaian->mentor_comments,
                    'final_recommendation' => $fr['final_recommendation'] ?? $penilaian->final_recommendation,
                ]);
                $penilaian->save();
            }

            $this->recomputeScores($penilaian);

            return $penilaian->fresh();
        });

        ActivityLog::activity_log("Simpan Penilaian OJT FMC-{$fmc} untuk Kader {$kader->nama}");

        return back()->with('penilaianSuccess', "Penilaian FMC-{$fmc} berhasil disimpan.");
    }

    /**
     * Hitung ulang ojt_score, value_score, presentation_score, final_score
     * berdasarkan semua skor yang ada di DB.
     */
    private function recomputeScores(PenilaianOjt $penilaian): void
    {
        $skorMap = PenilaianOjtSkor::where('id_penilaian_ojt', $penilaian->id_penilaian_ojt)
            ->whereNotNull('skor')
            ->pluck('skor', 'item_code')
            ->all();

        $ojtScore   = self::computeOjtGrand($skorMap);
        $valueScore = self::computeValueGrand($skorMap);
        $presScore  = self::computePresentationGrand($skorMap);

        $weights = PenilaianOjtStructure::WEIGHTS;
        $parts = [];
        $weightSum = 0;
        if ($ojtScore   !== null) { $parts[] = $ojtScore   * $weights['ojt'];          $weightSum += $weights['ojt']; }
        if ($valueScore !== null) { $parts[] = $valueScore * $weights['value'];        $weightSum += $weights['value']; }
        if ($presScore  !== null) { $parts[] = $presScore  * $weights['presentation']; $weightSum += $weights['presentation']; }
        $finalScore = $weightSum > 0 ? round(array_sum($parts) / $weightSum * 1, 2) : null;
        // Note: kalau 3 sheet lengkap, $weightSum = 1.0, jadi finalScore = sum(parts). Kalau partial, normalize.

        $penilaian->update([
            'ojt_score'          => $ojtScore   !== null ? round($ojtScore, 2)   : null,
            'value_score'        => $valueScore !== null ? round($valueScore, 2) : null,
            'presentation_score' => $presScore  !== null ? round($presScore, 2)  : null,
            'final_score'        => $finalScore,
        ]);
    }

    public static function computeOjtGrand(array $skorMap): ?float
    {
        $aspekScores = [];
        foreach (PenilaianOjtStructure::ojt() as $aspek) {
            $vals = [];
            foreach ($aspek['subs'] as $sub) {
                foreach ($sub['indicators'] as $ind) {
                    $code = "ojt.{$aspek['no']}.{$sub['code']}.{$ind['no']}";
                    if (isset($skorMap[$code])) $vals[] = (float) $skorMap[$code];
                }
            }
            if (!empty($vals)) $aspekScores[] = array_sum($vals) / count($vals);
        }
        return empty($aspekScores) ? null : array_sum($aspekScores) / count($aspekScores);
    }

    public static function computeValueGrand(array $skorMap): ?float
    {
        $aspekScores = [];
        foreach (PenilaianOjtStructure::value() as $aspek) {
            $vals = [];
            foreach ($aspek['indicators'] as $ind) {
                $code = "value.{$aspek['no']}.{$ind['no']}";
                if (isset($skorMap[$code])) $vals[] = (float) $skorMap[$code];
            }
            if (!empty($vals)) $aspekScores[] = array_sum($vals) / count($vals);
        }
        return empty($aspekScores) ? null : array_sum($aspekScores) / count($aspekScores);
    }

    public static function computePresentationGrand(array $skorMap): ?float
    {
        $sectionScores = [];
        foreach (PenilaianOjtStructure::presentation() as $section) {
            $vals = [];
            foreach ($section['indicators'] as $ind) {
                $code = "pres.{$section['code']}.{$ind['no']}";
                if (isset($skorMap[$code])) $vals[] = (float) $skorMap[$code];
            }
            if (!empty($vals)) $sectionScores[] = array_sum($vals) / count($vals);
        }
        return empty($sectionScores) ? null : array_sum($sectionScores) / count($sectionScores);
    }

    private function sheetFromCode(string $code): ?string
    {
        $prefix = explode('.', $code, 2)[0] ?? '';
        return match ($prefix) {
            'ojt'   => 'ojt',
            'value' => 'value',
            'pres'  => 'presentation',
            default => null,
        };
    }

    /**
     * Otorisasi WRITE: hanya Mentor (yang menjadi pembimbing kader ini) yang boleh.
     * Admin021 (read-only) ditolak di sini.
     */
    private function authorizeWrite($user, $kader_id): void
    {
        if ($user->type !== 'Mentor') {
            abort(403, 'Hanya Mentor yang dapat menginput Penilaian OJT.');
        }

        $hasAccess = ListKaderPerMentor::where('list_kader_per_mentor.kader_id', $kader_id)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->whereNull('mentor.deleted_at')
            ->where('mentor.company_code', $user->company_code)
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Kader tidak ada dalam daftar bimbingan Anda.');
        }
    }

    /**
     * Helper: ambil semua data penilaian untuk 1 kader (3 FMC),
     * dipakai oleh KaderSayaController::show() untuk pass ke Inertia.
     * Return: ['penilaianList' => [{fmc:1,...}], 'skorMap' => {fmc => {code => skor}}, 'komentarMap' => {fmc => {code => text}}]
     */
    public static function getDataForKader(string $kader_id): array
    {
        $records = PenilaianOjt::where('kader_id', $kader_id)
            ->orderBy('fmc_number')
            ->get();

        $byFmc = $records->keyBy('fmc_number');

        $penilaianList = [];
        $skorMap       = [];
        $komentarMap   = [];

        foreach (PenilaianOjtStructure::FMC_NUMBERS as $fmc) {
            $rec = $byFmc->get($fmc);
            $penilaianList[] = [
                'fmc'                  => $fmc,
                'exists'               => (bool) $rec,
                'ojt_score'            => $rec?->ojt_score          !== null ? (float) $rec->ojt_score          : null,
                'value_score'          => $rec?->value_score        !== null ? (float) $rec->value_score        : null,
                'presentation_score'   => $rec?->presentation_score !== null ? (float) $rec->presentation_score : null,
                'final_score'          => $rec?->final_score        !== null ? (float) $rec->final_score        : null,
                'overview'             => $rec?->overview,
                'strengths'            => $rec?->strengths,
                'weakness'             => $rec?->weakness,
                'mentor_comments'      => $rec?->mentor_comments,
                'final_recommendation' => $rec?->final_recommendation,
                'updated_at'           => $rec?->updated_at?->toIso8601String(),
            ];

            if ($rec) {
                $skorMap[$fmc] = PenilaianOjtSkor::where('id_penilaian_ojt', $rec->id_penilaian_ojt)
                    ->pluck('skor', 'item_code')
                    ->map(fn($v) => $v !== null ? (int) $v : null)
                    ->all();
                $komentarMap[$fmc] = PenilaianOjtKomentar::where('id_penilaian_ojt', $rec->id_penilaian_ojt)
                    ->pluck('komentar', 'sub_code')
                    ->all();
            } else {
                $skorMap[$fmc]     = (object) [];
                $komentarMap[$fmc] = (object) [];
            }
        }

        return [
            'penilaianList' => $penilaianList,
            'skorMap'       => $skorMap,
            'komentarMap'   => $komentarMap,
        ];
    }
}
