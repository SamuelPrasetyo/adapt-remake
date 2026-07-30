<?php

namespace App\Http\Controllers;

use App\Http\Controllers\KaderSaya\KaderSayaController;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Models\Batch;
use App\Models\Dokumen;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\User;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct() {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin021      = $user->type === 'Admin' && $user->company_code === '021';
        $isMentorUser    = $user->type === 'Mentor';
        $showMentorPanel = $isAdmin021 || $isMentorUser;

        // Kartu statistik: Mentor di-scope ke BU sendiri; MAI (Admin) melihat semua BU.
        $stats = $this->buildStats($isMentorUser ? $user->company_code : null);

        $mentors        = collect();
        $selectedMentor = null;
        $kaders         = collect();
        $buName         = null;
        $buShort        = null;
        $mentorFilter   = 'all';
        $batches        = collect();
        $batchFilter    = null;

        if ($showMentorPanel) {
            // Mentor user limited to BU sendiri; Admin 021 lihat semua
            $targetCompanyCode = $isMentorUser ? $user->company_code : null;

            $mentorsQuery = Mentor::select('mentor.*', 'company.company_shortname as bu', 'company.company_name as bu_full')
                ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
                ->whereNull('mentor.deleted_at')
                ->orderBy('mentor.nama', 'asc');

            if ($targetCompanyCode) {
                $mentorsQuery->where('mentor.company_code', $targetCompanyCode);
            }

            $mentors = $mentorsQuery->get();

            // Filter batch: default ke batch yang sedang berjalan; 'all' = semua batch.
            $batches      = Batch::newestFirst()->get();
            $defaultBatch = optional(Batch::current())->id_batch;
            $batchFilter  = $request->query('batch_id', $defaultBatch);
            $idBatch      = ($batchFilter === 'all') ? null : $batchFilter;

            // kader_count per mentor — ikut filter batch yang dipilih
            $mentorIds = $mentors->pluck('id')->all();
            $countQuery = \App\Models\ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
                ->whereNull('deleted_at')
                ->select('mentor_id', DB::raw('COUNT(*) as c'))
                ->groupBy('mentor_id');
            if ($idBatch) {
                $countQuery->where('id_batch', $idBatch);
            }
            $countMap = $countQuery->pluck('c', 'mentor_id');
            $mentors->each(function ($m) use ($countMap) {
                $m->kader_count = (int) ($countMap[$m->id] ?? 0);
            });

            // Nama BU untuk header (Mentor punya BU spesifik; Admin 021 = "Semua BU")
            if ($targetCompanyCode) {
                $first = $mentors->first();
                $buName  = $first->bu_full ?? null;
                $buShort = $first->bu ?? null;
                if (!$buName) {
                    $co = \App\Models\Company::where('company_code', $targetCompanyCode)->first();
                    $buName  = $co->company_name ?? null;
                    $buShort = $co->company_shortname ?? null;
                }
            }

            $mentorFilter = $request->query('mentor_id', 'all');
            $perMentor    = app(KaderPerMentorController::class);

            if ($mentorFilter && $mentorFilter !== 'all') {
                $selectedMentor = $mentors->firstWhere('id', $mentorFilter);
                if ($selectedMentor) {
                    $kaders = $perMentor->listByMentorQuery($mentorFilter, $idBatch);
                } else {
                    // mentor_id tidak ditemukan -> fallback ke all
                    $mentorFilter = 'all';
                }
            }

            if ($mentorFilter === 'all') {
                $kaders = $perMentor->listAllKadersInBU($targetCompanyCode, $idBatch);
            }
        }

        // Jumlah modul per kategori — diambil dari kolom tag_kompetensi.
        $kategoriDefs = [
            'FOUNDATION'    => 'Foundation',
            'SELF_LEARNING' => 'Self Learning',
            'LEADERSHIP'    => 'Leadership',
            'MENTOR'        => 'Mentor',
        ];
        $tagCounts = Modul::select('tag_kompetensi', DB::raw('COUNT(*) as c'))
            ->groupBy('tag_kompetensi')
            ->pluck('c', 'tag_kompetensi');
        $modulPerKategori = collect($kategoriDefs)
            ->map(fn($label, $val) => ['kategori' => $label, 'total' => (int) ($tagCounts[$val] ?? 0)])
            ->values();

        // Jumlah SEMUA kader di batch yang dipilih (termasuk yang belum di-assign ke mentor).
        $totalKaderInBatch = 0;
        if ($showMentorPanel) {
            $totalKaderInBatch = Kader::when($idBatch, fn($q) => $q->where('kader.id_batch', $idBatch))
                ->when(
                    $targetCompanyCode ?? null,
                    // Pakai scope yang sama dengan daftar kadernya supaya kader lintas
                    // BU ikut terhitung — kalau tidak, angkanya beda dari isi tabel.
                    fn($q, $cc) => app(KaderPerMentorController::class)->scopeKaderToBU($q, $cc)
                )
                ->count();
        }

        return Inertia::render('Dashboard', [
            'stats'              => $stats,
            'departemenProgress' => [],
            'mentorMonitoring'   => [],
            'modulPerKategori'   => $modulPerKategori,
            'showMentorPanel'    => $showMentorPanel,
            'mentors'            => $mentors,
            'selectedMentor'     => $selectedMentor,
            'mentorFilter'       => $mentorFilter,
            'batches'            => $batches,
            'batchFilter'        => $batchFilter !== null ? (string) $batchFilter : 'all',
            'kaders'             => $kaders,
            'buName'             => $buName,
            'buShort'            => $buShort,
            'totalKaderInBatch'  => $totalKaderInBatch,
        ]);
    }

    /**
     * Statistik kartu Dashboard.
     * $companyCode = null → MAI (semua BU); selain itu → per BU (Mentor).
     */
    private function buildStats(?string $companyCode): array
    {
        // Batch yang sedang berjalan (rentang tanggalnya mencakup hari ini).
        $runningBatchIds = Batch::active()->pluck('id_batch');

        // Kader aktif = kader pada batch yang sedang berjalan (BU difilter untuk Mentor).
        $kaderQuery = Kader::whereIn('kader.id_batch', $runningBatchIds);
        if ($companyCode) {
            // Ikut menyertakan kader lintas BU yang dibina mentor BU ini — kalau tidak,
            // kartu Kader Aktif & Feedback Belum Terisi mengabaikan mereka.
            app(KaderPerMentorController::class)->scopeKaderToBU($kaderQuery, $companyCode);
        }
        $activeKaders = $kaderQuery->get(['nik', 'id_batch']);

        // Feedback belum terisi = slot (kader × minggu feedback yang sudah berjalan) yang belum
        // diisi Mentor. Feedback mentor = jawaban dengan nama_mentor NOT NULL & id_pertanyaan 1–6
        // (mengacu ke tabel `weeks`, bukan refleksi kader di `weeks_kader`).
        $availableWeeksByBatch = [];
        foreach ($runningBatchIds as $bid) {
            $availableWeeksByBatch[$bid] = Week::available()->forBatch($bid)->pluck('id_week')->all();
        }
        $totalSlots = 0;
        $allWeekIds = [];
        foreach ($activeKaders as $k) {
            $wids = $availableWeeksByBatch[$k->id_batch] ?? [];
            $totalSlots += count($wids);
            foreach ($wids as $wid) {
                $allWeekIds[$wid] = true;
            }
        }
        $niks = $activeKaders->pluck('nik')->filter()->unique()->all();
        $filledSlots = 0;
        if ($totalSlots > 0 && !empty($niks)) {
            $filledSlots = Jawaban::whereIn('nik_kader', $niks)
                ->whereNotNull('nama_mentor')
                ->whereIn('id_pertanyaan', [1, 2, 3, 4, 5, 6])
                ->whereIn('id_week', array_keys($allWeekIds))
                ->distinct()
                ->get(['nik_kader', 'id_week'])
                ->count();
        }
        $feedbackBelum = max(0, $totalSlots - $filledSlots);

        // IDP belum lengkap = Form IDP yang belum di-approve Mentor (status masih 'pending').
        $idpQuery = Dokumen::where('jenis', 'FORM_IDP')->where('status', 'pending');
        if ($companyCode) {
            $idpQuery->whereIn('kader_id', User::where('company_code', $companyCode)->pluck('id'));
        }
        $idpBelum = $idpQuery->count();

        // Jumlah mentor = mentor unik yang di-assign ke kader pada batch berjalan.
        // Mentor yang sama membina beberapa kader tetap dihitung satu.
        $mentorQuery = \App\Models\ListKaderPerMentor::join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->whereIn('list_kader_per_mentor.id_batch', $runningBatchIds)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->whereNull('mentor.deleted_at');
        if ($companyCode) {
            $mentorQuery->where('mentor.company_code', $companyCode);
        }
        $mentorCount = $mentorQuery->distinct()->count('list_kader_per_mentor.mentor_id');

        return [
            'mentorCount'   => $mentorCount,
            'kaderAktif'    => $activeKaders->count(),
            'batchBerjalan' => $runningBatchIds->count(),
            'feedbackBelum' => $feedbackBelum,
            'idpBelum'      => $idpBelum,
        ];
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    public function storeRefleksi(Request $request)
    {
        return app(KaderSayaController::class)->storeRefleksi($request);
    }

    public function dashboard_kader()
    {
        // Dashboard Kader disamakan dengan tampilan "Kader Saya / Detail" yang
        // dilihat Admin & Mentor. Kader login melihat detail dirinya sendiri
        // dalam mode read-only (lihat KaderSayaController::show() — properti
        // kaderView, canUpload, canEditPenilaian otomatis false untuk Kader).
        $user  = Auth::user();
        $kader = Kader::where('nik', $user->nik)->first();

        if (!$kader) {
            abort(404, 'Data kader tidak ditemukan.');
        }

        return app(KaderSayaController::class)->show($kader->id);

        /*
        |----------------------------------------------------------------------
        | Implementasi lama (grafik Learning Growth sederhana) — di-comment,
        | jangan dihapus. Pasangannya di resources/js/Pages/DashboardKader.jsx
        | (juga di-comment). Hapus blok ini bila sudah dipastikan tidak dipakai.
        |----------------------------------------------------------------------
        $user_kader = Auth::user();
        $reports = Jawaban::selectRaw("SUM(jawaban) / 4 as avg,nik_kader,weeks.angka_week as week")
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->where('nik_kader', $user_kader->nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->whereNotIn('id_pertanyaan', ['5', '6'])
            ->groupBy('nik_kader', 'week')
            ->get();
        $data_count = count($reports);
        $avg = [];
        $learningG = [];
        $kkm = [];
        $data_lg = [];
        $temp_avg = 0;
        $title['nama_kader'] = '';
        foreach ($reports as $val) {
            $cal = ($val->avg + $temp_avg) / $data_count;
            $temp_avg += $val->avg;

            $rounded = round($cal, 2);
            $data_lg[$val->week] =  $rounded;

            $learningG[$val->week] =  $rounded;

            $avg[$val->week] = $val->avg;

            array_push($kkm, 7);
        }
        $weeks = Week::orderBy('angka_week', 'asc')->get();
        $week = [];
        foreach ($weeks as $w) {
            array_push($week, $w->angka_week);
        }

        $kader = Kader::select('kader.nama as nama_kader', 'kader.nik', 'divisis.nama as nama_divisi', 'departemens.nama as nama_departemen', 'company.company_name')
            ->where('nik', $user_kader->nik)
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->first();

        $kaderInfo = [
            'nama'       => $kader->nama_kader  ?? '',
            'nik'        => $kader->nik          ?? '',
            'divisi'     => $kader->nama_divisi  ?? '',
            'departemen' => $kader->nama_departemen ?? '',
            'bu'         => $kader->company_name ?? '',
        ];

        return Inertia::render('DashboardKader', [
            'week'      => $weeks->pluck('angka_week')->values(),
            'avg'       => $avg,
            'learningG' => $learningG,
            'kkm'       => $kkm,
            'kaderInfo' => $kaderInfo,
        ]);
        */
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
