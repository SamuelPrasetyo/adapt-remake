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
use App\Models\MonthlyFeedbackSummary;
use App\Models\Pertanyaan;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\User;
use App\Models\Week;
use App\Models\WeekKader;
use App\Support\ArsipKaderDetail;
use App\Support\KaderDevelopmentReport;
use App\Support\KaderReportData;
use App\Support\KandidatData;
use App\Support\ModulScore;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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
        $batches      = Batch::newestFirst()->get();
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
        $totalKaderInBatch = Kader::when($idBatch, fn($q) => $q->where('kader.id_batch', $idBatch))
            // Scope yang sama dengan $kaders di atas, supaya kader lintas BU ikut
            // terhitung dan angkanya tidak berbeda dari isi daftarnya.
            ->when($isMentor, fn($q) => $perMentor->scopeKaderToBU($q, $user->company_code))
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
                'company.company_name as bu_name',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->where('kader.id', $kader_id)
            ->first();

        if (!$kader) abort(404);

        // Batch 1-2 = data arsip (diimpor dari Excel, tidak melewati sistem). Kadernya tidak
        // pernah lewat portal rekrutmen Career MAI dan tidak punya Monthly Feedback di sistem,
        // jadi tab "Job Applicant" & "Summary Monthly Feedback" tidak relevan — hanya menyisakan
        // Overview, Feedback, Penilaian OJT, Perjanjian Kerja, dan Report.
        $isArsipBatch = $kader->batch_name !== null && (int) $kader->batch_name <= 2;

        // Semua mentor aktif kader ini (bisa lebih dari satu).
        $assignedMentors = ListKaderPerMentor::join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->where('list_kader_per_mentor.kader_id', $kader->id)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->whereNull('mentor.deleted_at')
            ->orderBy('mentor.nama', 'asc')
            ->pluck('mentor.nama')
            ->unique()
            ->values();
        $kader->mentor_id   = null;
        $kader->mentor_name = $assignedMentors->isNotEmpty() ? $assignedMentors->implode(', ') : null;
        $kader->mentors     = $assignedMentors;

        // Mentor boleh membuka kader satu BU dengannya, walau kader itu belum di-assign ke
        // mentor mana pun — daftar Kader Saya (listAllKadersInBU) memang menampilkan SELURUH
        // kader BU termasuk yang belum punya mentor, jadi tanpa ini kader tampil di daftar
        // tapi 403 saat diklik. Jalur assignment tetap dipertahankan supaya mentor yang
        // membina kader dari BU lain tidak kehilangan akses.
        if ($isMentor) {
            $hasAccess = $kader->company_code === $user->company_code
                || ListKaderPerMentor::where('list_kader_per_mentor.kader_id', $kader->id)
                    ->whereNull('list_kader_per_mentor.deleted_at')
                    ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
                    ->whereNull('mentor.deleted_at')
                    ->where('mentor.company_code', $user->company_code)
                    ->exists();
            if (!$hasAccess) abort(403);
        }

        // Peringatan "belum di-assign" untuk Admin/Mentor: detail tetap terbuka, tapi aksi
        // yang menuntut relasi mentor-kader (mis. simpan Penilaian OJT) akan ditolak.
        $mentorUnassigned = !$isKader && $assignedMentors->isEmpty();

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

        // Refleksi kader diisi terhadap jadwal weeks_kader (dwi-mingguan, tabel terpisah),
        // bukan weeks (jadwal feedback mentor) — id_week kedua tabel bisa bernilai sama.
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

        // Summary Monthly Feedback — hanya Admin MAI (021) yang boleh melihat/menulis, dan
        // tidak untuk batch arsip (tab-nya disembunyikan; batch 1-2 tak punya Monthly Feedback).
        // Dikirim sebagai map "tahun-bulan" => summary agar tiap kartu Riwayat bisa prefill.
        $canSummarizeMonthly      = $isAdmin021 && !$isArsipBatch;
        $monthlyFeedbackSummaries = $canSummarizeMonthly
            ? MonthlyFeedbackSummary::where('kader_id', $kader->id)
                ->get(['bulan', 'tahun', 'summary'])
                ->keyBy(fn ($s) => $s->tahun . '-' . $s->bulan)
                ->map(fn ($s) => $s->summary)
            : [];

        $perjanjianKerja = Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PERJANJIAN_KERJA')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($perjanjianKerja) {
            $uploader = User::find($perjanjianKerja->mentor_id);
            $perjanjianKerja->uploaded_by_name = $uploader ? $uploader->name : '—';
        }

        // Data kandidat (portal rekrutmen Career MAI), ditautkan via kader.nik_ktp = kandidat.ktp.
        // Dibungkus try/catch: bila DB career_mai tak terjangkau, detail kader tetap tampil.
        //
        // KHUSUS Admin MAI 021, dan bukan kader batch arsip. Data ini berisi informasi pribadi
        // (KTP, alamat, ekspektasi gaji, kontak keluarga, hasil asesmen) — menyembunyikan tab di
        // frontend saja TIDAK cukup, karena props Inertia terbaca dari view-source. Jadi jangan
        // dikirim sama sekali ke Kader/Mentor. Sekaligus menghemat query ke career_mai.
        $canViewKandidat = $isAdmin021 && !$isArsipBatch;
        $kandidat = null;
        $kandidatError = null;
        if ($canViewKandidat && !empty($kader->nik_ktp)) {
            try {
                $kandidat = KandidatData::forKtp($kader->nik_ktp);
            } catch (\Throwable $e) {
                Log::warning('[KaderSaya::show] gagal ambil data kandidat Career MAI: ' . $e->getMessage());
                $kandidatError = 'Tidak dapat terhubung ke database Career MAI. Coba lagi nanti.';
            }
        }

        // nik_ktp ikut terbawa select kader.* — sembunyikan dari siapa pun yang tabnya tidak
        // terbuka agar nomor KTP tidak ikut terserialisasi ke props.
        if (!$canViewKandidat) {
            $kader->makeHidden('nik_ktp');
        }

        // Tab "Report" — kartu Management Trainee Development Report yang sama persis dengan
        // menu Report (Admin & Mentor; menu Report memang tidak dibuka untuk Kader).
        // Batch 1-2 otomatis memakai varian arsip; null bila tidak ada data report.
        $developmentReport = $isKader ? null : KaderDevelopmentReport::forTab($kader, $report);

        // Batch arsip: Overview & Penilaian OJT diisi dari dokumen training + report_arsip,
        // karena kadernya tidak pernah di-assign modul maupun mengisi form FMC di sistem.
        // faseGroups-nya dibentuk sebagai fase Monthly Training supaya Overview tampil sama
        // seperti batch sistem; progress/status dipatok 100% & "On Track" (program sudah tuntas).
        $arsipDetail = $isArsipBatch ? ArsipKaderDetail::build($kader) : null;

        return Inertia::render('KaderSaya/Detail', [
            'kader'              => $kader,
            'faseGroups'         => $isArsipBatch ? $arsipDetail['faseGroups'] : $report['faseGroups'],
            'overallProgress'    => $isArsipBatch ? ArsipKaderDetail::PROGRESS : $report['overallProgress'],
            // Stat "FMC" batch arsip = rata-rata OJT 1-4 (report_arsip.fmc_avg), penilaiannya
            // sudah tuntas. Batch sistem tetap memakai FMC terakhir yang dinilai & di-approve.
            'fmcScore'           => $isArsipBatch ? ($arsipDetail['ojt']['final'] ?? null) : $report['fmcScore'],
            'status'             => $isArsipBatch ? ArsipKaderDetail::STATUS : $report['status'],
            'totalModuls'        => $isArsipBatch ? $arsipDetail['totalModuls'] : $report['totalModuls'],
            'avgFeedback'        => $avgFeedback,
            'currentWeek'        => $currentWeek,
            'totalWeeks'         => $totalWeeks,
            'weeks'              => $weeks,
            'weeksKader'         => $weeksKader,
            'refleksi'           => $refleksiList,
            'mentorFeedbackList' => $report['mentorFeedbackList'],
            // Feedback terkunci otomatis begitu batch berakhir (turunan tanggal, tanpa cron).
            'feedbackEditable'   => $this->feedbackEditable($kader),
            'monthlyPeriods'     => $monthlyPeriods,
            'monthlyFeedbackList'=> $monthlyFeedbackList,
            'monthlyFeedbackSummaries' => $monthlyFeedbackSummaries,
            'canSummarizeMonthly'      => $canSummarizeMonthly,
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
            // Banner peringatan kader tanpa mentor aktif (Admin/Mentor saja).
            'mentorUnassigned'   => $mentorUnassigned,
            'allFases'           => $isArsipBatch ? $arsipDetail['allFases'] : $report['allFases'],
            'kaderView'          => $isKader,
            // Upload Weekly Feedback hanya untuk Kader yang melihat dashboard-nya sendiri.
            'weeklyFeedback'     => $isKader ? WeeklyFeedbackController::dataFor($user) : null,
            // Data kandidat rekrutmen (tab Job Applicant) — hanya Admin MAI 021, non-arsip.
            'canViewKandidat'    => $canViewKandidat,
            'kandidat'           => $kandidat,
            'nikKtp'             => $canViewKandidat ? $kader->nik_ktp : null,
            'kandidatError'      => $kandidatError,
            // Tab Report — null bila role Kader atau kader tanpa data report.
            'developmentReport'  => $developmentReport,
            // Isi tab Overview & Penilaian OJT versi arsip; null untuk batch sistem (3+).
            'arsipDetail'        => $arsipDetail,
        ]);
    }

    /**
     * Cek keberadaan berkas kandidat di portal Career MAI (server-to-server, bebas CORS).
     * Dipakai tab Kandidat agar berkas yang hilang memunculkan notifikasi di aplikasi,
     * bukan halaman 404 portal. Anti-SSRF: hanya URL di bawah base storage yang diizinkan.
     *
     * @return \Illuminate\Http\JsonResponse status: found | missing | error
     */
    public function kandidatFileExists(Request $request)
    {
        $url  = (string) $request->query('url', '');
        $base = rtrim((string) config('services.career_mai.asset_url'), '/');

        if ($base === '' || !str_starts_with($url, $base . '/')) {
            return response()->json(['status' => 'error'], 422);
        }

        try {
            $status = Http::timeout(10)->head($url)->status();
            return response()->json(['status' => ($status >= 200 && $status < 400) ? 'found' : 'missing']);
        } catch (\Throwable $e) {
            Log::warning('[KaderSaya::kandidatFileExists] gagal cek berkas: ' . $e->getMessage());
            return response()->json(['status' => 'error']);
        }
    }

    public function storeFeedback(Request $request, $kader_id)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        abort_if(!$this->feedbackEditable($kader), 403,
            'Batch sudah berakhir — feedback tidak dapat dikirim lagi.');

        // Semua kategori penilaian wajib — dulu field kosong hanya di-skip diam-diam saat insert
        // sehingga feedback bisa tersimpan sebagian (nilai tampil "—" di riwayat).
        $request->validate([
            'id_week' => 'required',
            'p1'      => 'required|integer|between:1,10',
            'p2'      => 'required|integer|between:1,10',
            'p3'      => 'required|integer|between:1,10',
            'p4'      => 'required|integer|between:1,10',
            'p5'      => 'required|in:Sangat Kurang,Kurang,Cukup,Baik,Sangat Baik',
            'p6'      => 'nullable|string',
        ], [], [
            'p1' => 'Routine Job',
            'p2' => 'Assignment',
            'p3' => 'Pemahaman SOP',
            'p4' => 'Project',
            'p5' => 'Motivasi & Keterlibatan',
        ]);

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
     * Apakah feedback kader ini masih boleh diubah?
     *
     * Lock dihitung on-read dari tanggal_selesai batch — tidak ada cron/scheduler yang
     * perlu menyalakannya (lihat Batch::feedbackEditable()). Kader tanpa batch, atau batch
     * arsip yang tanggalnya NULL, otomatis terkunci.
     */
    private function feedbackEditable($kader): bool
    {
        if (!$kader->id_batch) return false;
        $batch = Batch::find($kader->id_batch);

        return $batch ? $batch->feedbackEditable() : false;
    }

    /**
     * Ubah feedback mingguan yang sudah terkirim (termasuk melengkapi kategori kosong).
     *
     * Nilai yang sudah terisi BOLEH ditimpa selama batch masih berjalan; setelah batch
     * berakhir seluruh perubahan ditolak di sini, bukan hanya disembunyikan di UI.
     */
    public function updateFeedback(Request $request, $kader_id, $id_week)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        abort_if(!$this->feedbackEditable($kader), 403,
            'Batch sudah berakhir — feedback tidak dapat diubah lagi.');

        $request->validate([
            'p1' => 'nullable|integer|between:1,10',
            'p2' => 'nullable|integer|between:1,10',
            'p3' => 'nullable|integer|between:1,10',
            'p4' => 'nullable|integer|between:1,10',
            'p5' => 'nullable|in:Sangat Kurang,Kurang,Cukup,Baik,Sangat Baik',
            'p6' => 'nullable|string',
        ], [], [
            'p1' => 'Routine Job',
            'p2' => 'Assignment',
            'p3' => 'Pemahaman SOP',
            'p4' => 'Project',
            'p5' => 'Motivasi & Keterlibatan',
            'p6' => 'Area yang Perlu Ditingkatkan',
        ]);

        // Week harus SUDAH punya feedback mentor — mencegah route ini dipakai membuat
        // feedback baru dan melewati validasi ketersediaan minggu di storeFeedback().
        $existing = Jawaban::where('nik_kader', $kader->nik)
            ->where('id_week', $id_week)
            ->whereNotNull('nama_mentor')
            ->whereIn('id_pertanyaan', [1, 2, 3, 4, 5, 6])
            ->get();
        abort_if($existing->isEmpty(), 404, 'Feedback minggu ini belum pernah dikirim.');

        $motivasiScore = [
            'Sangat Kurang' => 1,
            'Kurang'        => 2,
            'Cukup'         => 3,
            'Baik'          => 4,
            'Sangat Baik'   => 5,
        ];

        // Hanya field yang dikirim yang disentuh — field yang tidak ada di payload
        // dibiarkan apa adanya, bukan dikosongkan.
        $answers = [];
        foreach ([1 => 'p1', 2 => 'p2', 3 => 'p3', 4 => 'p4'] as $pertanyaan => $key) {
            if ($request->filled($key)) $answers[$pertanyaan] = $request->$key;
        }
        if ($request->filled('p5')) $answers[5] = $motivasiScore[$request->p5] ?? null;
        if ($request->has('p6'))    $answers[6] = trim((string) $request->p6);

        // Feedback tetap diatribusikan ke mentor penulis aslinya; created_by mencatat
        // siapa yang mengubah.
        $namaMentor = $existing->first()->nama_mentor;
        $changed    = 0;

        foreach ($answers as $pertanyaan => $jawaban) {
            if ($jawaban === null) continue;

            $row = $existing->firstWhere('id_pertanyaan', $pertanyaan);

            if ($row) {
                if ((string) $row->jawaban === (string) $jawaban) continue; // tidak ada perubahan
                Jawaban::where('id_jawaban', $row->id_jawaban)
                    ->update(['jawaban' => $jawaban, 'updated_at' => now()]);
            } elseif ($jawaban !== '') {
                Jawaban::create([
                    'id_week'       => $id_week,
                    'id_pertanyaan' => $pertanyaan,
                    'jawaban'       => $jawaban,
                    'nama_mentor'   => $namaMentor,
                    'nik_kader'     => $kader->nik,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                    'created_by'    => $user->id,
                ]);
            } else {
                continue;
            }
            $changed++;
        }

        Log::info('[KaderSaya::updateFeedback] done', [
            'kader_nik' => $kader->nik,
            'id_week'   => $id_week,
            'oleh'      => $user->name,
            'berubah'   => $changed,
        ]);

        return back()->with('feedbackSuccess', true);
    }

    /**
     * Ubah Monthly Feedback yang sudah terkirim. Dikunci oleh aturan yang sama dengan
     * updateFeedback(): selama batch masih berjalan boleh diubah, setelah itu ditolak.
     */
    public function updateMonthlyFeedback(Request $request, $kader_id)
    {
        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        abort_if(!$this->feedbackEditable($kader), 403,
            'Batch sudah berakhir — Monthly Feedback tidak dapat diubah lagi.');

        $request->merge(collect(['m1', 'm2', 'm3'])
            ->mapWithKeys(fn ($k) => [$k => is_string($request->$k) ? trim($request->$k) : $request->$k])
            ->all());

        $data = $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|between:2000,2100',
            'm1'    => 'required|string|min:3',
            'm2'    => 'required|string|min:3',
            'm3'    => 'required|string|min:3',
        ], [], [
            'm1' => 'Pertanyaan 1 (gambaran mentee)',
            'm2' => 'Pertanyaan 2 (sikap kerja & etika)',
            'm3' => 'Pertanyaan 3 (kesiapan kader)',
        ]);

        $questionIds = $this->monthlyQuestionIds();

        // Baris Monthly Feedback bulan tsb — dicari lewat weeks karena jawaban di-anchor
        // ke salah satu minggu di bulan itu.
        $weekIds = Week::query()
            ->when($kader->id_batch, fn ($q) => $q->forBatch($kader->id_batch))
            ->where('bulan', $data['bulan'])
            ->where('tahun', $data['tahun'])
            ->pluck('id_week');
        abort_if($weekIds->isEmpty(), 404, 'Periode bulan tidak ditemukan pada batch kader.');

        $existing = Jawaban::where('nik_kader', $kader->nik)
            ->whereIn('id_week', $weekIds)
            ->whereNotNull('nama_mentor')
            ->whereIn('id_pertanyaan', $questionIds)
            ->get();
        abort_if($existing->isEmpty(), 404, 'Monthly Feedback bulan ini belum pernah dikirim.');

        $anchorWeek = $existing->first()->id_week;
        $namaMentor = $existing->first()->nama_mentor;
        $inputs     = [$data['m1'], $data['m2'], $data['m3']];
        $changed    = 0;

        foreach ($questionIds as $i => $pertanyaan) {
            $jawaban = $inputs[$i] ?? null;
            if ($jawaban === null) continue;

            $row = $existing->firstWhere('id_pertanyaan', $pertanyaan);

            if ($row) {
                if ((string) $row->jawaban === (string) $jawaban) continue;
                Jawaban::where('id_jawaban', $row->id_jawaban)
                    ->update(['jawaban' => $jawaban, 'updated_at' => now()]);
            } else {
                Jawaban::create([
                    'id_week'       => $anchorWeek,
                    'id_pertanyaan' => $pertanyaan,
                    'jawaban'       => $jawaban,
                    'nama_mentor'   => $namaMentor,
                    'nik_kader'     => $kader->nik,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                    'created_by'    => $user->id,
                ]);
            }
            $changed++;
        }

        Log::info('[KaderSaya::updateMonthlyFeedback] done', [
            'kader_nik' => $kader->nik,
            'periode'   => $data['bulan'] . '/' . $data['tahun'],
            'oleh'      => $user->name,
            'berubah'   => $changed,
        ]);

        return back()->with('monthlyFeedbackSuccess', true);
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

        abort_if(!$this->feedbackEditable($kader), 403,
            'Batch sudah berakhir — Monthly Feedback tidak dapat dikirim lagi.');

        // Ketiga pertanyaan wajib terjawab — dulu jawaban kosong hanya di-skip saat insert,
        // jadi Monthly Feedback bisa tersimpan dengan pertanyaan yang bolong. Input di-trim
        // dulu supaya jawaban berisi spasi saja tidak lolos `required`.
        $request->merge(collect(['m1', 'm2', 'm3'])
            ->mapWithKeys(fn ($k) => [$k => is_string($request->$k) ? trim($request->$k) : $request->$k])
            ->all());

        $request->validate([
            'id_week' => 'required',
            'm1'      => 'required|string|min:3',
            'm2'      => 'required|string|min:3',
            'm3'      => 'required|string|min:3',
        ], [], [
            'm1' => 'Pertanyaan 1 (gambaran mentee)',
            'm2' => 'Pertanyaan 2 (sikap kerja & etika)',
            'm3' => 'Pertanyaan 3 (kesiapan kader)',
        ]);

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

    /**
     * Simpan/ubah ringkasan Monthly Feedback (Summary) — HANYA Admin MAI (021).
     * Satu ringkasan per kader per (bulan, tahun); updateOrCreate aman karena
     * ada UNIQUE(kader_id, bulan, tahun) di tabel. Maks 500 karakter.
     */
    public function storeMonthlyFeedbackSummary(Request $request, $kader_id)
    {
        $user = Auth::user();
        abort_unless($user->type === 'Admin' && $user->company_code === '021', 403);

        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) abort(404);

        $data = $request->validate([
            'bulan'   => ['required', 'integer', 'between:1,12'],
            'tahun'   => ['required', 'integer', 'between:2000,2100'],
            'summary' => ['nullable', 'string', 'max:1000'],
        ]);

        $summary = trim($data['summary'] ?? '');

        if ($summary === '') {
            // Kosongkan = hapus ringkasan bulan tsb.
            MonthlyFeedbackSummary::where('kader_id', $kader->id)
                ->where('bulan', $data['bulan'])
                ->where('tahun', $data['tahun'])
                ->delete();

            return back()->with('summaryFeedbackSuccess', true);
        }

        $row = MonthlyFeedbackSummary::firstOrNew([
            'kader_id' => $kader->id,
            'bulan'    => $data['bulan'],
            'tahun'    => $data['tahun'],
        ]);
        if (!$row->exists) $row->created_by = $user->id;
        $row->summary    = $summary;
        $row->updated_by = $user->id;
        $row->save();

        Log::info("[KaderSaya::storeMonthlyFeedbackSummary] saved for kader {$kader->id} ({$data['bulan']}/{$data['tahun']}) by {$user->name}");

        return back()->with('summaryFeedbackSuccess', true);
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
