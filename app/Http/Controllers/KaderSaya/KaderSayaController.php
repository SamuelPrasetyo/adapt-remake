<?php

namespace App\Http\Controllers\KaderSaya;

use App\Constants\PenilaianOjtStructure;
use App\Http\Controllers\Controller;
use App\Http\Controllers\KaderSaya\PenilaianOjtController;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Http\Controllers\Modul\WeeklyFeedbackController;
use App\Models\Batch;
use App\Models\Company;
use App\Models\Dokumen;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\ModulAssignment;
use App\Models\Pertanyaan;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\User;
use App\Models\Week;
use App\Models\WeekKader;
use App\Support\KaderReportData;
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

        // Learning Growth/LGS per fase, skor feedback mingguan, daftar feedback mentor, dan
        // Penilaian OJT/FMC dihitung di satu tempat (dipakai bersama Report New).
        $report = KaderReportData::build($kader);

        $weeklyData  = $report['weeklyData'];
        $avgFeedback = $report['avgFeedback'];

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

        // Monthly Feedback mentor (pertanyaan 13-15) — sebulan sekali, difilter "Bulan Tahun".
        // Periode bulan diturunkan dari jadwal weeks batch; tiap bulan di-anchor ke minggu
        // pertamanya (angka_week terkecil) sebagai id_week penyimpanan jawaban.
        [$monthlyPeriods, $monthlyFeedbackList] = $this->buildMonthlyFeedback($kader, $today);

        $perjanjianKerja = Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PERJANJIAN_KERJA')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($perjanjianKerja) {
            $uploader = User::find($perjanjianKerja->mentor_id);
            $perjanjianKerja->uploaded_by_name = $uploader ? $uploader->name : '—';
        }

        return Inertia::render('KaderSaya/Detail', [
            'kader'              => $kader,
            'faseGroups'         => $report['faseGroups'],
            'overallProgress'    => $report['overallProgress'],
            'fmcScore'           => $report['fmcScore'],
            'status'             => $report['status'],
            'totalModuls'        => $report['totalModuls'],
            'avgFeedback'        => $avgFeedback,
            'currentWeek'        => $currentWeek,
            'totalWeeks'         => $totalWeeks,
            'weeks'              => $weeks,
            'weeksKader'         => $weeksKader,
            'refleksi'           => $refleksiList,
            'mentorFeedbackList' => $report['mentorFeedbackList'],
            'monthlyPeriods'     => $monthlyPeriods,
            'monthlyFeedbackList'=> $monthlyFeedbackList,
            'mentorName'         => $user->name,
            'perjanjianKerja'         => $perjanjianKerja,
            'templatePerjanjianKerja' => ($isAdmin021 || $isMentor)
                ? optional(Dokumen::where('jenis', 'TEMPLATE_PERJANJIAN_KERJA')->latest()->first(), fn($t) => [
                    'nama_file' => $t->nama_file,
                    'path_file' => $t->path_file,
                ])
                : null,
            'canUpload'          => $isAdmin021 || $isMentor,
            'penilaianList'      => $report['penilaianList'],
            'penilaianSkorMap'   => $report['penilaianSkorMap'],
            'penilaianKomentarMap' => $report['penilaianKomentarMap'],
            'penilaianStructure' => PenilaianOjtStructure::all(),
            'canEditPenilaian'   => $isMentor,
            'allFases'           => $report['allFases'],
            'kaderView'          => $isKader,
            // Upload Weekly Feedback hanya untuk Kader yang melihat dashboard-nya sendiri.
            'weeklyFeedback'     => $isKader ? WeeklyFeedbackController::dataFor($user) : null,
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

    /**
     * ID pertanyaan Monthly Feedback mentor (kualitatif, sebulan sekali) — diambil dinamis
     * dari master Pertanyaan lewat type, BUKAN di-hardcode. Ini menjaga fitur tetap benar
     * walau ID di produksi berbeda (id_pertanyaan AUTO_INCREMENT). Urutan ascending
     * id_pertanyaan = urutan pertanyaan m1, m2, m3 sesuai saat di-seed.
     *
     * @return int[]
     */
    private function monthlyQuestionIds(): array
    {
        return Pertanyaan::where('type', 'Mentor Monthly')
            ->orderBy('id_pertanyaan')
            ->pluck('id_pertanyaan')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Bangun daftar periode bulan (untuk dropdown "Bulan Tahun") dan riwayat Monthly Feedback.
     *
     * @return array{0: array, 1: array} [$monthlyPeriods, $monthlyFeedbackList]
     */
    private function buildMonthlyFeedback($kader, string $today): array
    {
        $questionIds = $this->monthlyQuestionIds();
        // Peta id_pertanyaan → posisi (0,1,2) untuk memetakan ke q1/q2/q3 tanpa berpatok ID tetap.
        $posOf = array_flip($questionIds);

        // Periode bulan diambil dari jadwal weeks batch (yang punya bulan & tahun terisi).
        $weeks = Week::query()
            ->when($kader->id_batch, fn ($q) => $q->forBatch($kader->id_batch))
            ->whereNotNull('bulan')
            ->whereNotNull('tahun')
            ->orderBy('tahun')
            ->orderBy('bulan')
            ->orderBy('angka_week')
            ->get(['id_week', 'angka_week', 'bulan', 'tahun', 'tanggal_mulai']);

        // Bulan yang sudah diisi Monthly Feedback (set "tahun-bulan").
        $filledMonths = Jawaban::where('jawaban.nik_kader', $kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->whereIn('jawaban.id_pertanyaan', $questionIds)
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->select('weeks.bulan', 'weeks.tahun')
            ->distinct()
            ->get()
            ->map(fn ($r) => $r->tahun . '-' . $r->bulan)
            ->all();

        $periods = [];
        foreach ($weeks as $w) {
            $monthKey = $w->tahun . '-' . $w->bulan;
            if (isset($periods[$monthKey])) continue; // minggu pertama bulan itu jadi anchor
            $periods[$monthKey] = [
                'anchor_week_id' => $w->id_week,
                'bulan'          => (int) $w->bulan,
                'tahun'          => (int) $w->tahun,
                'is_available'   => $w->tanggal_mulai && $w->tanggal_mulai->toDateString() <= $today,
                'is_filled'      => in_array($monthKey, $filledMonths, true),
            ];
        }
        $monthlyPeriods = array_values($periods);

        // Riwayat jawaban Monthly Feedback dikelompokkan per bulan.
        $monthlyRaw = Jawaban::whereIn('jawaban.id_pertanyaan', $questionIds)
            ->where('jawaban.nik_kader', $kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->select('weeks.bulan', 'weeks.tahun', 'jawaban.id_pertanyaan',
                     'jawaban.jawaban', 'jawaban.nama_mentor', 'jawaban.created_at')
            ->orderBy('weeks.tahun', 'desc')
            ->orderBy('weeks.bulan', 'desc')
            ->get();

        $byMonth = [];
        foreach ($monthlyRaw as $r) {
            $monthKey = $r->tahun . '-' . $r->bulan;
            if (!isset($byMonth[$monthKey])) {
                $byMonth[$monthKey] = [
                    'key'         => $monthKey,
                    'bulan'       => (int) $r->bulan,
                    'tahun'       => (int) $r->tahun,
                    'nama_mentor' => $r->nama_mentor,
                    'q1'          => null,
                    'q2'          => null,
                    'q3'          => null,
                ];
            }
            $val = strip_tags($r->jawaban ?? '');
            $pos = $posOf[(int) $r->id_pertanyaan] ?? null;
            if ($pos === 0)     $byMonth[$monthKey]['q1'] = $val;
            elseif ($pos === 1) $byMonth[$monthKey]['q2'] = $val;
            elseif ($pos === 2) $byMonth[$monthKey]['q3'] = $val;
        }

        return [$monthlyPeriods, array_values($byMonth)];
    }

    public function storeMonthlyFeedback(Request $request, $kader_id)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        // Anchor week harus milik batch kader & sudah berjalan.
        $week = Week::where('id_week', $request->id_week)
            ->when($kader->id_batch, fn ($q) => $q->forBatch($kader->id_batch))
            ->whereNotNull('tanggal_mulai')
            ->whereDate('tanggal_mulai', '<=', now()->toDateString())
            ->first();
        abort_if(!$week, 422, 'Periode bulan tidak valid atau belum berjalan.');

        $questionIds = $this->monthlyQuestionIds();

        // Satu Monthly Feedback per bulan per kader.
        $monthFilled = Jawaban::where('jawaban.nik_kader', $kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->whereIn('jawaban.id_pertanyaan', $questionIds)
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->where('weeks.bulan', $week->bulan)
            ->where('weeks.tahun', $week->tahun)
            ->exists();
        abort_if($monthFilled, 422, 'Feedback bulanan untuk periode ini sudah diisi.');

        $base = [
            'id_week'     => $week->id_week,
            'nama_mentor' => $user->name,
            'nik_kader'   => $kader->nik,
            'created_at'  => now(),
            'updated_at'  => now(),
            'created_by'  => $user->id,
        ];

        // Input m1/m2/m3 dipasangkan ke id_pertanyaan sesuai urutan (posisi), bukan ID tetap.
        $inputs = [$request->m1, $request->m2, $request->m3];

        $inserted = 0;
        foreach ($questionIds as $i => $pertanyaan) {
            $jawaban = $inputs[$i] ?? null;
            if ($jawaban === null || $jawaban === '') continue;
            Jawaban::create(array_merge($base, ['id_pertanyaan' => $pertanyaan, 'jawaban' => $jawaban]));
            $inserted++;
        }

        Log::info("[KaderSaya::storeMonthlyFeedback] done — {$inserted} rows inserted for kader NIK {$kader->nik} ({$week->bulan}/{$week->tahun})");

        return back()->with('monthlyFeedbackSuccess', true);
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
