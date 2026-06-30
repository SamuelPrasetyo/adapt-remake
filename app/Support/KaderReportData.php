<?php

namespace App\Support;

use App\Http\Controllers\KaderSaya\PenilaianOjtController;
use App\Models\Company;
use App\Models\Dokumen;
use App\Models\Jawaban;
use App\Models\Modul;
use App\Models\ModulAssignment;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\User;

/**
 * Sumber tunggal data report per-kader: Learning Growth/LGS per fase, skor feedback
 * mingguan mentor ("Development Progress"), daftar feedback mentor, dan Penilaian OJT/FMC.
 *
 * Dipakai bersama oleh:
 *  - KaderSaya/Detail (KaderSayaController::show) — tab Learning Growth & header FMC.
 *  - Report New (ReportController::report_new) — "Management Trainee Development Report".
 *
 * Tujuannya agar hitungan LGS/FMC cukup ada di satu tempat — mengikuti prinsip
 * App\Support\ModulScore sebagai sumber tunggal rumus skor modul.
 */
class KaderReportData
{
    /**
     * @param  \App\Models\Kader  $kader  model kader yang sudah di-load (butuh ->id, ->nik, ->company_code, ->id_batch).
     * @return array{
     *   faseGroups: array, allFases: array, overallProgress: int, status: string,
     *   totalModuls: int, weeklyData: array, avgFeedback: float|null,
     *   mentorFeedbackList: array, penilaianList: array, penilaianSkorMap: array,
     *   penilaianKomentarMap: array, fmcScore: float|null
     * }
     */
    public static function build($kader): array
    {
        $kaderUser = User::where('nik', $kader->nik)->first();
        $userId    = $kaderUser ? $kaderUser->id : null;

        $companyId = Company::where('company_code', $kader->company_code)->value('company_id');

        $userModulIds    = $userId
            ? ModulAssignment::where('assignable_type', 'user')->where('assignable_id', $kader->id)->pluck('modul_id')
            : collect();
        $companyModulIds = $companyId
            ? ModulAssignment::where('assignable_type', 'company')->where('assignable_id', $companyId)->pluck('modul_id')
            : collect();
        $allModulIds = $userModulIds->merge($companyModulIds)->unique()->values()->all();

        // Urut per fase lalu `urutan` (diatur admin di Modul Pembelajaran) → kartu per-modul
        // Learning Growth tampil sesuai urutan itu. Titik grafik tetap urut penyelesaian.
        $moduls = Modul::whereIn('id', $allModulIds)
            ->orderBy('fase')
            ->orderByRaw('urutan IS NULL, urutan')
            ->orderBy('nama_modul')
            ->get(['id', 'kode_modul', 'nama_modul as nama', 'fase', 'has_test', 'has_post_activity']);

        $testResults = $userId
            ? ModulTestResult::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->where('is_completed', 1)->get(['modul_id', 'tipe', 'score', 'updated_at'])
            : collect();

        // $postTimeMap = kapan Post Test diselesaikan → dipakai mengurutkan titik grafik
        // Learning Growth berdasarkan urutan penyelesaian modul (lihat dokumentasi §10).
        $testMap     = [];
        $postTimeMap = [];
        foreach ($testResults as $t) {
            $testMap[$t->modul_id][$t->tipe] = (float) $t->score;
            if ($t->tipe === 'post') $postTimeMap[$t->modul_id] = $t->updated_at;
        }

        $readMap = $userId
            ? ModulReadingProgress::whereIn('modul_id', $allModulIds)->where('user_id', $userId)->pluck('progress', 'modul_id')->all()
            : [];

        $paData = $userId
            ? Dokumen::where('dokumen.kader_id', $userId)
                ->whereIn('dokumen.modul_id', $allModulIds)
                ->where('dokumen.jenis', 'POST_ACTIVITY')
                ->leftJoin('penilaian_post_activity', 'dokumen.id', '=', 'penilaian_post_activity.dokumen_id')
                ->select('dokumen.modul_id', 'penilaian_post_activity.nilai as pa_score', 'penilaian_post_activity.dinilai_at as pa_time')
                ->get()
            : collect();

        $docIds     = [];
        $paScoreMap = [];
        $paTimeMap  = [];
        foreach ($paData as $d) {
            $docIds[$d->modul_id] = true;
            if ($d->pa_score !== null) {
                $paScoreMap[$d->modul_id] = (float) $d->pa_score;
                $paTimeMap[$d->modul_id]  = $d->pa_time;
            }
        }

        $faseGroups       = [];
        $doneCheckpoints  = 0;
        $totalCheckpoints = 0;
        foreach ($moduls as $modul) {
            $fase = $modul->fase ?? 'Tanpa Fase';
            if (!isset($faseGroups[$fase])) {
                $faseGroups[$fase] = ['fase' => $fase, 'moduls' => [], 'done' => 0, 'total' => 0, 'scores' => []];
            }

            // Checkpoint hanya dihitung untuk komponen yang dimiliki modul (Materi selalu ada).
            $needPre  = (bool) $modul->has_test;
            $needPost = (bool) $modul->has_test;
            $needPA   = (bool) $modul->has_post_activity;

            $pre  = isset($testMap[$modul->id]['pre']);
            $mat  = ((int) ($readMap[$modul->id] ?? 0)) >= 100;
            $post = isset($testMap[$modul->id]['post']);
            $pa   = isset($docIds[$modul->id]);

            $required = 1 + (int) $needPre + (int) $needPost + (int) $needPA;
            $done     = (int) $mat
                + ($needPre  ? (int) $pre  : 0)
                + ($needPost ? (int) $post : 0)
                + ($needPA   ? (int) $pa   : 0);
            $doneCheckpoints  += $done;
            $totalCheckpoints += $required;

            // Skor Akhir modul = rumus tunggal ModulScore (Post Test + Post Activity, TANPA Pre Test).
            $modulScoreRaw = ModulScore::finalScore(
                (bool) $modul->has_test,
                (bool) $modul->has_post_activity,
                $testMap[$modul->id]['post'] ?? null,
                $paScoreMap[$modul->id] ?? null
            );
            $modulScore = $modulScoreRaw !== null ? (int) round($modulScoreRaw) : null;

            // Learning Growth Score (LGS) — titik grafik Learning Growth (rumus Stakeholder,
            // berbasis KENAIKAN nilai). KG dari pre→post test; AS dari nilai tugas; LGS
            // menggabungkannya (60/40) untuk modul ber-tugas, atau = KG bila tanpa tugas.
            $kgRaw = ModulScore::knowledgeGain(
                $testMap[$modul->id]['pre']  ?? null,
                $testMap[$modul->id]['post'] ?? null
            );
            $asRaw = $modul->has_post_activity
                ? ModulScore::applicationScore($paScoreMap[$modul->id] ?? null)
                : null;
            $growthRaw   = ModulScore::learningGrowth((bool) $modul->has_post_activity, $kgRaw, $asRaw);
            $growthScore = $growthRaw !== null ? (int) round($growthRaw) : null;

            // Avg per fase = rata-rata LGS (growth_score) — angka yang sama dengan badge tiap
            // modul, supaya Avg di header fase konsisten dengan skor per modul (bukan finalScore).
            if ($growthScore !== null) $faseGroups[$fase]['scores'][] = $growthScore;

            // completed_at = saat komponen penilai terakhir selesai → urutan titik di grafik.
            $completedAt = null;
            if ($growthScore !== null) {
                $times = [];
                if (isset($postTimeMap[$modul->id]))                                 $times[] = $postTimeMap[$modul->id];
                if ($modul->has_post_activity && isset($paTimeMap[$modul->id]))       $times[] = $paTimeMap[$modul->id];
                $times = array_filter(array_map(
                    fn ($t) => $t ? \Illuminate\Support\Carbon::parse($t) : null,
                    $times
                ));
                if (!empty($times)) $completedAt = collect($times)->max()->toIso8601String();
            }

            $faseGroups[$fase]['moduls'][] = [
                'id'                => $modul->id,
                'kode_modul'        => $modul->kode_modul,
                'nama'              => $modul->nama,
                'pre'               => $pre,
                'mat'               => $mat,
                'post'              => $post,
                'pa'                => $pa,
                'has_test'          => (bool) $modul->has_test,
                'has_post_activity' => (bool) $modul->has_post_activity,
                'need_pre'          => $needPre,
                'pre_score'         => isset($testMap[$modul->id]['pre'])  ? (int) round($testMap[$modul->id]['pre'])  : null,
                'post_score'        => isset($testMap[$modul->id]['post']) ? (int) round($testMap[$modul->id]['post']) : null,
                'pa_score'          => isset($paScoreMap[$modul->id])      ? (int) round($paScoreMap[$modul->id])      : null,
                'done'              => $done,
                'required'          => $required,
                'score'             => $modulScore,
                // Komponen grafik Learning Growth (rumus Stakeholder, berbasis kenaikan nilai).
                'kg'                => $kgRaw    !== null ? (int) round($kgRaw)    : null,
                'as'                => $asRaw    !== null ? (int) round($asRaw)    : null,
                'growth_score'      => $growthScore,
                'completed_at'      => $completedAt,
            ];
            $faseGroups[$fase]['total']++;
            if ($done >= $required) $faseGroups[$fase]['done']++;
        }

        // Avg per fase = rata-rata LGS modul (scores dikumpulkan dari $growthScore di atas).
        foreach ($faseGroups as &$fg) {
            $fg['progress']  = $fg['total'] > 0 ? (int) round(($fg['done'] / $fg['total']) * 100) : 0;
            $faseAvg         = ModulScore::average($fg['scores'], null);
            $fg['avg_score'] = $faseAvg !== null ? (int) round($faseAvg) : null;
            unset($fg['scores']);
        }
        unset($fg);
        uksort($faseGroups, fn($a, $b) => (int) preg_replace('/[^0-9]/', '', $a) <=> (int) preg_replace('/[^0-9]/', '', $b));
        $faseGroups = array_values($faseGroups);

        $totalModuls     = count($moduls);
        $totalCp         = $totalCheckpoints;
        $overallProgress = $totalCp > 0 ? (int) round(($doneCheckpoints / $totalCp) * 100) : 0;
        $status          = $overallProgress < 40 ? 'kritis' : ($overallProgress < 70 ? 'perlu_perhatian' : 'on_track');

        $weeklyData = [];
        if ($kader->nik) {
            $rows = Jawaban::selectRaw('AVG(jawaban) as avg_s, weeks.angka_week as week')
                ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
                ->where('nik_kader', $kader->nik)
                ->whereNotNull('nama_mentor')
                ->whereIn('id_pertanyaan', ['1', '2', '3', '4'])
                ->groupBy('weeks.angka_week')
                ->orderBy('weeks.angka_week')
                ->get();
            foreach ($rows as $r) {
                $weeklyData[] = ['week' => 'W' . $r->week, 'score' => round((float) $r->avg_s, 1)];
            }
        }

        // Avg Feedback = rata-rata skor feedback mingguan (rumus tunggal ModulScore::feedbackAverage):
        // tiap minggu = (Routine Job + Assignment + Pemahaman SOP + Project) / 4, lalu dibagi jumlah minggu.
        $avgFeedbackRaw = ModulScore::feedbackAverage(array_map(fn ($w) => $w['score'], $weeklyData));
        $avgFeedback    = $avgFeedbackRaw !== null ? round($avgFeedbackRaw, 1) : null;

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
            $idP2 = (int) $r->id_pertanyaan;
            if ($idP2 === 1)      $feedbackByWeek[$wk]['routine_job']   = $val;
            elseif ($idP2 === 2)  $feedbackByWeek[$wk]['assignment']    = $val;
            elseif ($idP2 === 3)  $feedbackByWeek[$wk]['pemahaman_sop'] = $val;
            elseif ($idP2 === 4)  $feedbackByWeek[$wk]['project']       = $val;
            elseif ($idP2 === 5)  $feedbackByWeek[$wk]['motivasi']      = $motivasiLabel[(int)$val] ?? $val;
            elseif ($idP2 === 6)  $feedbackByWeek[$wk]['area']          = $val;
        }
        $mentorFeedbackList = array_values($feedbackByWeek);

        $allFases = Modul::distinct()
            ->whereNotNull('fase')
            ->pluck('fase')
            ->filter()
            ->sortBy(fn($f) => (int) preg_replace('/[^0-9]/', '', $f))
            ->values()
            ->all();

        $penilaianData = PenilaianOjtController::getDataForKader($kader->id);

        // Stat "FMC" = rata-rata Final Score Penilaian OJT, HANYA dari FMC yang sudah dinilai.
        // FMC yang belum dinilai tidak ikut membagi (bila baru FMC-1 terisi, tampilkan utuh).
        $fmcScored = array_values(array_filter(
            array_column($penilaianData['penilaianList'], 'final_score'),
            fn ($v) => $v !== null
        ));
        $fmcScore = !empty($fmcScored) ? round(array_sum($fmcScored) / count($fmcScored), 1) : null;

        return [
            'faseGroups'           => $faseGroups,
            'allFases'             => $allFases,
            'overallProgress'      => $overallProgress,
            'status'               => $status,
            'totalModuls'          => $totalModuls,
            'weeklyData'           => $weeklyData,
            'avgFeedback'          => $avgFeedback,
            'mentorFeedbackList'   => $mentorFeedbackList,
            'penilaianList'        => $penilaianData['penilaianList'],
            'penilaianSkorMap'     => $penilaianData['skorMap'],
            'penilaianKomentarMap' => $penilaianData['komentarMap'],
            'fmcScore'             => $fmcScore,
        ];
    }
}
