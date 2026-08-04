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

        // Nama kedua panelis wajib — form assessment ini memang milik panel, bukan 1 penilai.
        // Skor divalidasi lewat closure, bukan rule 'skor.*': item_code mengandung titik
        // (mis. "hard.1") sehingga Laravel akan salah membacanya sebagai path bersarang.
        $validated = $request->validate([
            'skor'                  => ['required', 'array', $this->skorLengkapRule()],
            'komentar'              => 'nullable|array',
            'komentar.*'            => 'nullable|string',
            'panelis'               => 'required|array',
            'panelis.1.nama'        => 'required|string|max:150',
            'panelis.1.peran'       => 'nullable|string|max:150',
            'panelis.2.nama'        => 'required|string|max:150',
            'panelis.2.peran'       => 'nullable|string|max:150',
            'final_report'                      => 'nullable|array',
            'final_report.final_recommendation' => 'nullable|in:recommended,not_recommended',
        ], [
            'skor.required'           => 'Semua nilai kompetensi wajib diisi.',
            'panelis.1.nama.required' => 'Nama Panelis 1 wajib diisi.',
            'panelis.2.nama.required' => 'Nama Panelis 2 wajib diisi.',
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
            } elseif ($penilaian->approval_status === 'approved') {
                abort(423, 'Penilaian sudah di-approve Admin MAI dan tidak dapat diubah.');
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

            // Identitas panel (bagian A form) + rekomendasi akhir.
            $penilaian->fill([
                'panelis1_nama'  => $validated['panelis'][1]['nama'],
                'panelis1_peran' => $validated['panelis'][1]['peran'] ?? null,
                'panelis2_nama'  => $validated['panelis'][2]['nama'],
                'panelis2_peran' => $validated['panelis'][2]['peran'] ?? null,
            ]);

            // Gunakan array_key_exists agar nilai null (field dikosongkan user) tetap tersimpan.
            // Operator ?? akan memilih fallback ke nilai lama ketika nilai baru adalah null,
            // padahal null di sini artinya user sengaja menghapus isi field.
            $fr = $validated['final_report'] ?? [];
            if (array_key_exists('final_recommendation', $fr)) {
                $penilaian->final_recommendation = $fr['final_recommendation'];
            }
            $penilaian->save();

            // Edit ulang dari Mentor (mis. setelah ditolak) mengembalikan ke antrian review.
            if ($penilaian->approval_status === 'rejected') {
                $penilaian->update([
                    'approval_status'  => 'pending',
                    'rejection_reason' => null,
                    'approved_by'      => null,
                    'approved_at'      => null,
                ]);
            }

            $this->recomputeScores($penilaian);

            return $penilaian->fresh();
        });

        ActivityLog::activity_log("Simpan Penilaian OJT FMC-{$fmc} untuk Kader {$kader->nama}");

        return back()->with('penilaianSuccess', "Penilaian FMC-{$fmc} berhasil disimpan.");
    }

    /**
     * Semua kompetensi (8 Hard + 8 Soft) wajib dinilai 0-100 — penilaian tidak boleh
     * disimpan setengah jalan karena skor kompositnya jadi menyesatkan.
     */
    private function skorLengkapRule(): callable
    {
        return function ($attribute, $value, $fail) {
            $belum = [];

            foreach (PenilaianOjtStructure::validItemCodes() as $code) {
                $skor = is_array($value) ? ($value[$code] ?? null) : null;

                if ($skor === null || $skor === '') {
                    $belum[] = $code;
                    continue;
                }

                if (!is_numeric($skor) || (int) $skor != $skor || $skor < 0 || $skor > 100) {
                    $fail('Setiap nilai kompetensi harus berupa angka bulat 0-100.');
                    return;
                }
            }

            if (!empty($belum)) {
                $fail('Semua nilai kompetensi wajib diisi — ' . count($belum) . ' kompetensi belum dinilai.');
            }
        };
    }

    /**
     * Hitung ulang skor komposit Hard/Soft + nilai akhir FMC dari skor yang ada di DB.
     */
    private function recomputeScores(PenilaianOjt $penilaian): void
    {
        $skorMap = PenilaianOjtSkor::where('id_penilaian_ojt', $penilaian->id_penilaian_ojt)
            ->whereNotNull('skor')
            ->pluck('skor', 'item_code')
            ->all();

        $scores = self::computeScores($skorMap);

        $penilaian->update([
            'hard_score'  => self::round2($scores['hard']),
            'soft_score'  => self::round2($scores['soft']),
            'final_score' => self::round2($scores['final']),
        ]);
    }

    /** Skor komposit hard/soft + nilai akhir (hard 70% + soft 30%). */
    public static function computeScores(array $skorMap): array
    {
        $hard = PenilaianOjtStructure::composite($skorMap, 'hard');
        $soft = PenilaianOjtStructure::composite($skorMap, 'soft');

        return [
            'hard'  => $hard,
            'soft'  => $soft,
            'final' => PenilaianOjtStructure::finalScore($hard, $soft),
        ];
    }

    private static function round2(?float $v): ?float
    {
        return $v === null ? null : round($v, 2);
    }

    /** item_code: hard.{no} / soft.{no} — sub_code catatan: catatan.kekuatan / catatan.pengembangan */
    private function sheetFromCode(string $code): ?string
    {
        $prefix = explode('.', $code)[0] ?? '';
        return in_array($prefix, ['hard', 'soft', 'catatan'], true) ? $prefix : null;
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
                'hard_score'           => ($rec && $rec->hard_score !== null)  ? (float) $rec->hard_score  : null,
                'soft_score'           => ($rec && $rec->soft_score !== null)  ? (float) $rec->soft_score  : null,
                'final_score'          => ($rec && $rec->final_score !== null) ? (float) $rec->final_score : null,
                'panelis1_nama'        => $rec ? $rec->panelis1_nama : null,
                'panelis1_peran'       => $rec ? $rec->panelis1_peran : null,
                'panelis2_nama'        => $rec ? $rec->panelis2_nama : null,
                'panelis2_peran'       => $rec ? $rec->panelis2_peran : null,
                'final_recommendation' => $rec ? $rec->final_recommendation : null,
                'approval_status'      => $rec ? ($rec->approval_status ?? 'pending') : 'pending',
                'approved_at'          => ($rec && $rec->approved_at) ? $rec->approved_at->toIso8601String() : null,
                'rejection_reason'     => $rec ? $rec->rejection_reason : null,
                'updated_at'           => ($rec && $rec->updated_at) ? $rec->updated_at->toIso8601String() : null,
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
