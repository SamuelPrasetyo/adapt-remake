<?php

namespace App\Http\Controllers\KaderSaya;

use App\Constants\PenilaianOjtStructure;
use App\Http\Controllers\Controller;
use App\Http\Controllers\KaderSaya\PenilaianOjtController;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Models\Batch;
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
use App\Models\WeekKader;
use App\Support\ModulScore;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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

        // Filter batch: default ke batch yang sedang berjalan; 'all' = semua batch.
        $batches      = Batch::orderByDesc('tanggal_mulai')->orderByDesc('id_batch')->get();
        $defaultBatch = optional(Batch::current())->id_batch;
        $batchFilter  = $request->query('batch_id', $defaultBatch);
        $idBatch      = ($batchFilter === 'all') ? null : $batchFilter;

        // Jumlah kader per mentor mengikuti filter batch — seorang mentor bisa membina kader
        // di banyak batch, jadi tanpa filter ini angkanya gabungan semua batch (tidak akurat).
        $mentorIds = $mentors->pluck('id')->all();
        $countMap  = ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
            ->whereNull('deleted_at')
            ->when($idBatch, fn($q) => $q->where('id_batch', $idBatch))
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
            ? $perMentor->listByMentorQuery($mentorFilter, $idBatch)
            : $perMentor->listAllKadersInBU($isMentor ? $user->company_code : null, $idBatch);

        // fase_scores & avg_score di-set oleh KaderPerMentorController::attachProgressStats
        // memakai rumus tunggal ModulScore (Post Test + Post Activity, TANPA Pre Test).

        // Jumlah SEMUA kader di batch yang dipilih (termasuk yang belum di-assign ke mentor).
        $totalKaderInBatch = Kader::when($idBatch, fn($q) => $q->where('id_batch', $idBatch))
            ->when($isMentor, fn($q) => $q->where('company_code', $user->company_code))
            ->count();

        return Inertia::render('KaderSaya/Index', [
            'kaders'             => $kaders->values(),
            'mentors'            => $mentors,
            'selectedMentor'     => $selectedMentor,
            'mentorFilter'       => $mentorFilter,
            'batches'            => $batches,
            'batchFilter'        => $batchFilter !== null ? (string) $batchFilter : 'all',
            'totalKaderInBatch'  => $totalKaderInBatch,
        ]);
    }

    public function show($kader_id)
    {
        $user       = Auth::user();
        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';
        // Kader yang melihat dashboard dirinya sendiri (via DashboardController::dashboard_kader)
        // mendapat tampilan read-only: tanpa tombol kembali & tanpa form/aksi khusus mentor.
        $isKader    = $user->type === 'Kader';

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

            // Avg per fase = rata-rata LGS (growth_score) modul yang sudah punya skor —
            // konsisten dengan angka per modul di kartu & titik di grafik Learning Growth
            // (sum LGS modul / jumlah modul ber-skor), bukan finalScore/Skor Akhir.
            if ($growthScore !== null) $faseGroups[$fase]['scores'][] = $growthScore;

            // completed_at = saat komponen penilai terakhir selesai → urutan titik di grafik.
            // Modul ber-tugas selesai saat Post Activity dinilai; tanpa tugas saat Post Test.
            $completedAt = null;
            if ($growthScore !== null) {
                $times = [];
                if (isset($postTimeMap[$modul->id]))                           $times[] = $postTimeMap[$modul->id];
                if ($modul->has_post_activity && isset($paTimeMap[$modul->id])) $times[] = $paTimeMap[$modul->id];
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

        // Avg per fase = rata-rata sederhana LGS modul (sum growth_score / jumlah modul ber-skor)
        // via ModulScore::average — bukan finalScore, agar selaras dengan kartu & grafik.
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

        $currentWeek = count($weeklyData);
        $totalWeeks  = $kader->id_batch
            ? Week::forBatch($kader->id_batch)->count()
            : Week::count();

        // Dropdown feedback: tampilkan SEMUA minggu batch ini; opsi di-disable di UI
        // bila belum berjalan (is_available) atau sudah terisi (is_filled).
        // Validasi anti-fraud tetap ketat di storeFeedback().
        $filledWeeks = Jawaban::where('nik_kader', $kader->nik)
            ->whereNotNull('nama_mentor')
            ->whereIn('id_pertanyaan', [1, 2, 3, 4, 5, 6])
            ->distinct()
            ->pluck('id_week')
            ->all();

        $weeksQuery = Week::query();
        if ($kader->id_batch) {
            $weeksQuery->forBatch($kader->id_batch);
        }
        $today = now()->toDateString();
        $weeks = $weeksQuery->orderBy('angka_week')
            ->get(['id_week', 'angka_week', 'bulan', 'tahun', 'tanggal_mulai'])
            ->map(fn ($w) => [
                'id_week'      => $w->id_week,
                'angka_week'   => $w->angka_week,
                'bulan'        => $w->bulan,
                'tahun'        => $w->tahun,
                'is_available' => $w->tanggal_mulai && $w->tanggal_mulai->toDateString() <= $today,
                'is_filled'    => in_array($w->id_week, $filledWeeks),
            ]);

        // Refleksi kader diisi terhadap jadwal weeks_kader (48 minggu), bukan weeks (jadwal feedback mentor).
        $refleksiQuery = Jawaban::whereIn('jawaban.id_pertanyaan', [7, 8, 9, 10])
            ->where('jawaban.nik_kader', $kader->nik)
            ->whereNull('jawaban.nama_mentor')
            ->join('weeks_kader', 'jawaban.id_week', '=', 'weeks_kader.id_week')
            ->select('jawaban.id_week', 'jawaban.id_pertanyaan', 'jawaban.jawaban',
                     'jawaban.id_jawaban', 'weeks_kader.angka_week', 'weeks_kader.bulan', 'weeks_kader.tahun')
            ->orderBy('jawaban.id_week', 'desc')
            ->orderBy('jawaban.id_jawaban', 'desc');

        $refleksiRaw = $refleksiQuery->get();

        $motivasiMap = Jawaban::where('nik_kader', $kader->nik)
            ->where('id_pertanyaan', 5)
            ->whereNotNull('nama_mentor')
            ->pluck('jawaban', 'id_week')
            ->all();

        $refleksiByWeek = [];
        foreach ($refleksiRaw as $r) {
            $wk = $r->id_week;
            if (!isset($refleksiByWeek[$wk])) {
                $refleksiByWeek[$wk] = [
                    'week_id'    => $wk,
                    'angka_week' => $r->angka_week,
                    'bulan'      => $r->bulan,
                    'tahun'      => $r->tahun,
                    'motivasi'   => isset($motivasiMap[$wk]) ? (int) $motivasiMap[$wk] : null,
                    'dipelajari' => null,
                    'tantangan'  => null,
                    'rencana'    => null,
                    'relevansi'  => null,
                ];
            }
            $idP = (int) $r->id_pertanyaan;
            if ($idP === 7)      $key = 'dipelajari';
            elseif ($idP === 8)  $key = 'tantangan';
            elseif ($idP === 9)  $key = 'rencana';
            elseif ($idP === 10) $key = 'relevansi';
            else                 $key = null;
            if ($key && $refleksiByWeek[$wk][$key] === null) {
                $refleksiByWeek[$wk][$key] = strip_tags($r->jawaban);
            }
        }
        $refleksiList = array_values($refleksiByWeek);

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

        // Jadwal weeks_kader untuk form isi refleksi kader — hanya relevan saat kaderView.
        $weeksKader = collect();
        if ($kader->id_batch) {
            $filledWeeksKader = Jawaban::where('nik_kader', $kader->nik)
                ->whereNull('nama_mentor')
                ->whereIn('id_pertanyaan', [7, 8, 9])
                ->distinct()
                ->pluck('id_week')
                ->all();
            $weeksKader = WeekKader::forBatch($kader->id_batch)
                ->orderBy('angka_week')
                ->get(['id_week', 'angka_week', 'bulan', 'tahun', 'tanggal_mulai'])
                ->map(fn ($w) => [
                    'id_week'      => $w->id_week,
                    'angka_week'   => $w->angka_week,
                    'bulan'        => $w->bulan,
                    'tahun'        => $w->tahun,
                    'is_available' => $w->tanggal_mulai && $w->tanggal_mulai->toDateString() <= $today,
                    'is_filled'    => in_array($w->id_week, $filledWeeksKader),
                ]);
        }

        $perjanjianKerja = Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PERJANJIAN_KERJA')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($perjanjianKerja) {
            $uploader = User::find($perjanjianKerja->mentor_id);
            $perjanjianKerja->uploaded_by_name = $uploader ? $uploader->name : '—';
        }

        $penilaianData = PenilaianOjtController::getDataForKader($kader->id);

        // Stat "FMC" di header = rata-rata Final Score Penilaian OJT, HANYA dari FMC yang
        // sudah dinilai. FMC yang belum dinilai tidak ikut membagi — bila baru FMC-1 yang
        // terisi, tampilkan nilai FMC-1 utuh (jangan dibagi 2/3 dulu).
        $fmcScored = array_values(array_filter(
            array_column($penilaianData['penilaianList'], 'final_score'),
            fn ($v) => $v !== null
        ));
        $fmcScore = !empty($fmcScored) ? round(array_sum($fmcScored) / count($fmcScored), 1) : null;

        $allFases = Modul::distinct()
            ->whereNotNull('fase')
            ->pluck('fase')
            ->filter()
            ->sortBy(fn($f) => (int) preg_replace('/[^0-9]/', '', $f))
            ->values()
            ->all();

        return Inertia::render('KaderSaya/Detail', [
            'kader'              => $kader,
            'faseGroups'         => $faseGroups,
            'overallProgress'    => $overallProgress,
            'fmcScore'           => $fmcScore,
            'status'             => $status,
            'totalModuls'        => $totalModuls,
            'avgFeedback'        => $avgFeedback,
            'currentWeek'        => $currentWeek,
            'totalWeeks'         => $totalWeeks,
            'weeks'              => $weeks,
            'weeksKader'         => $weeksKader,
            'refleksi'           => $refleksiList,
            'mentorFeedbackList' => $mentorFeedbackList,
            'mentorName'         => $user->name,
            'perjanjianKerja'         => $perjanjianKerja,
            'templatePerjanjianKerja' => ($isAdmin021 || $isMentor)
                ? optional(Dokumen::where('jenis', 'TEMPLATE_PERJANJIAN_KERJA')->latest()->first(), fn($t) => [
                    'nama_file' => $t->nama_file,
                    'path_file' => $t->path_file,
                ])
                : null,
            'canUpload'          => $isAdmin021 || $isMentor,
            'penilaianList'      => $penilaianData['penilaianList'],
            'penilaianSkorMap'   => $penilaianData['skorMap'],
            'penilaianKomentarMap' => $penilaianData['komentarMap'],
            'penilaianStructure' => PenilaianOjtStructure::all(),
            'canEditPenilaian'   => $isMentor,
            'allFases'           => $allFases,
            'kaderView'          => $isKader,
        ]);
    }

    public function storeFeedback(Request $request, $kader_id)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        // Anti-fraud: week harus milik batch kader, sudah berjalan, & belum terisi.
        $weekValid = Week::available()
            ->where('id_week', $request->id_week)
            ->when($kader->id_batch, fn($q) => $q->forBatch($kader->id_batch))
            ->exists();
        $weekFilled = Jawaban::where('nik_kader', $kader->nik)
            ->where('id_week', $request->id_week)
            ->whereNotNull('nama_mentor')
            ->exists();
        abort_if(!$weekValid || $weekFilled, 422, 'Week tidak valid, belum berjalan, atau sudah terisi.');

        Log::info('[KaderSaya::storeFeedback] incoming request', [
            'kader_id'  => $kader_id,
            'kader_nik' => $kader->nik,
            'mentor'    => $user->name,
            'request'   => $request->only(['id_week','p1','p2','p3','p4','p5','p6']),
        ]);

        $motivasiScore = [
            'Sangat Kurang' => 1,
            'Kurang'        => 2,
            'Cukup'         => 3,
            'Baik'          => 4,
            'Sangat Baik'   => 5,
        ];

        $base = [
            'id_week'     => $request->id_week,
            'nama_mentor' => $user->name,
            'nik_kader'   => $kader->nik,
            'created_at'  => now(),
            'updated_at'  => now(),
            'created_by'  => $user->id,
        ];

        $answers = [
            1 => $request->p1,
            2 => $request->p2,
            3 => $request->p3,
            4 => $request->p4,
            5 => $motivasiScore[$request->p5] ?? null,
            6 => $request->p6,
        ];

        $inserted = 0;
        foreach ($answers as $pertanyaan => $jawaban) {
            if ($jawaban === null || $jawaban === '') continue;
            Jawaban::create(array_merge($base, ['id_pertanyaan' => $pertanyaan, 'jawaban' => $jawaban]));
            $inserted++;
        }

        Log::info("[KaderSaya::storeFeedback] done — {$inserted} rows inserted");

        return back()->with('feedbackSuccess', true);
    }

    public function storeRefleksi(Request $request)
    {
        $user  = Auth::user();
        $kader = Kader::where('nik', $user->nik)->first();
        if (!$kader) abort(404, 'Data kader tidak ditemukan.');

        $weekValid = WeekKader::available()
            ->where('id_week', $request->id_week)
            ->when($kader->id_batch, fn($q) => $q->forBatch($kader->id_batch))
            ->exists();

        $weekFilled = Jawaban::where('nik_kader', $kader->nik)
            ->where('id_week', $request->id_week)
            ->whereNull('nama_mentor')
            ->whereIn('id_pertanyaan', [7, 8, 9])
            ->exists();

        abort_if(!$weekValid || $weekFilled, 422, 'Week tidak valid, belum berjalan, atau sudah terisi.');

        $base = [
            'id_week'     => $request->id_week,
            'nama_mentor' => null,
            'nik_kader'   => $kader->nik,
            'created_at'  => now(),
            'updated_at'  => now(),
            'created_by'  => $user->id,
        ];

        $answers = [
            7  => $request->p7,
            8  => $request->p8,
            9  => $request->p9,
            10 => $request->p10,
        ];

        $inserted = 0;
        foreach ($answers as $pertanyaan => $jawaban) {
            if ($jawaban === null || $jawaban === '') continue;
            Jawaban::create(array_merge($base, ['id_pertanyaan' => $pertanyaan, 'jawaban' => $jawaban]));
            $inserted++;
        }

        Log::info("[KaderSaya::storeRefleksi] done — {$inserted} rows inserted for kader NIK {$kader->nik}");

        return back()->with('success', 'Refleksi berhasil disimpan!');
    }
}
