<?php

namespace App\Http\Controllers\Master\Mentor;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\Mentor;
use App\Models\Modul;
use App\Models\ModulAssignment;
use App\Models\ModulReadingProgress;
use App\Models\ModulTestResult;
use App\Models\ReportArsip;
use App\Models\User;
use App\Support\ArsipKaderDetail;
use App\Support\HasilTrainingMt;
use App\Support\KandidatData;
use App\Support\ModulScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class KaderPerMentorController extends Controller
{
    /** Batas maksimum mentor aktif yang boleh dimiliki satu kader. */
    public const MAX_MENTORS_PER_KADER = 5;

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function assignKader(Request $request)
    {
        $request->validate([
            'mentor_id'   => 'required|string',
            'kader_ids'   => 'nullable|array',
            'kader_ids.*' => 'string',
        ]);

        $mentor = Mentor::where('id', $request->mentor_id)
            ->whereNull('deleted_at')
            ->first();

        if (!$mentor) {
            return back()->with('error', 'Mentor tidak ditemukan.');
        }

        $selectedIds = collect($request->kader_ids ?? []);

        // Unassign kader yang tidak dipilih lagi (khusus mentor ini)
        $unassigned = ListKaderPerMentor::where('mentor_id', $mentor->id)
            ->whereNull('deleted_at')
            ->when($selectedIds->isNotEmpty(), fn($q) => $q->whereNotIn('kader_id', $selectedIds->all()))
            ->update(['deleted_at' => now()]);

        // Jumlah mentor LAIN yang sudah aktif per kader — untuk enforce batas maksimum.
        $otherMentorCount = $selectedIds->isEmpty()
            ? collect()
            : ListKaderPerMentor::whereIn('kader_id', $selectedIds->all())
                ->whereNull('deleted_at')
                ->where('mentor_id', '!=', $mentor->id)
                ->select('kader_id', DB::raw('COUNT(DISTINCT mentor_id) as c'))
                ->groupBy('kader_id')
                ->pluck('c', 'kader_id');

        // Assign kader baru yang belum ada
        $kaders = Kader::whereIn('id', $selectedIds->all())
            ->where('company_code', $mentor->company_code)
            ->get();

        $inserted = 0;
        $skipped  = [];
        foreach ($kaders as $kader) {
            $existing = ListKaderPerMentor::where('kader_id', $kader->id)
                ->where('mentor_id', $mentor->id)
                ->first();

            if ($existing && is_null($existing->deleted_at)) {
                continue; // sudah ter-assign ke mentor ini
            }

            // Tolak bila kader sudah mencapai batas maksimum mentor (dari mentor lain).
            if ((int) ($otherMentorCount[$kader->id] ?? 0) >= self::MAX_MENTORS_PER_KADER) {
                $skipped[] = $kader->nama;
                continue;
            }

            if ($existing) {
                // Restore soft-deleted record
                $existing->update(['deleted_at' => null]);
            } else {
                ListKaderPerMentor::insert([
                    'id'            => Str::uuid(),
                    'kader_id'      => $kader->id,
                    'mentor_id'     => $mentor->id,
                    'company_code'  => $kader->company_code,
                    'id_batch'      => $kader->id_batch,
                    'id_divisi'     => $kader->id_divisi,
                    'id_department' => $kader->id_departemen,
                    'created_by'    => Auth::user()->id,
                    'created_at'    => now(),
                ]);
            }
            $inserted++;
        }

        $skipNote = count($skipped) ? ", skip " . count($skipped) : "";
        ActivityLog::activity_log("Sync assign Mentor {$mentor->nama}: +{$inserted} kader, -{$unassigned} unassign{$skipNote}.");

        if (!empty($skipped)) {
            return back()->with('error',
                count($skipped) . " kader sudah mencapai batas " . self::MAX_MENTORS_PER_KADER
                    . " mentor dan dilewati: " . implode(', ', $skipped) . ".");
        }

        return back()->with('success', 'Assign berhasil diperbarui.');
    }

    public function listByMentor($mentor_id)
    {
        $mentor = Mentor::where('id', $mentor_id)
            ->whereNull('deleted_at')
            ->first();

        if (!$mentor) {
            abort(404, 'Mentor tidak ditemukan.');
        }

        $user = Auth::user();
        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentorSameBU = $user->type === 'Mentor' && $user->company_code === $mentor->company_code;

        if (!$isAdmin021 && !$isMentorSameBU) {
            abort(403, 'Tidak diizinkan mengakses data mentor di BU lain.');
        }

        $kaders = $this->listByMentorQuery($mentor_id);

        return response()->json([
            'mentor' => $mentor,
            'kaders' => $kaders,
        ]);
    }

    public function listByMentorQuery($mentor_id, $idBatch = null)
    {
        $rows = ListKaderPerMentor::select(
                'list_kader_per_mentor.id',
                'list_kader_per_mentor.kader_id',
                'list_kader_per_mentor.mentor_id',
                'kader.id as k_id',
                'kader.nama as nama_kader',
                'kader.nik as nik_kader',
                'kader.nik_ktp as nik_ktp',
                'kader.company_code as company_code',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'company.company_shortname as bu'
            )
            ->join('kader', 'list_kader_per_mentor.kader_id', '=', 'kader.id')
            ->leftJoin('batch', 'list_kader_per_mentor.id_batch', '=', 'batch.id_batch')
            ->leftJoin('divisis', 'list_kader_per_mentor.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'list_kader_per_mentor.id_department', '=', 'departemens.id')
            ->leftJoin('company', 'list_kader_per_mentor.company_code', '=', 'company.company_code')
            ->where('list_kader_per_mentor.mentor_id', $mentor_id)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->when($idBatch, fn($q) => $q->where('list_kader_per_mentor.id_batch', $idBatch))
            ->orderBy('kader.nama', 'asc')
            ->get()
            // Satu kader bisa punya >1 assignment ke mentor ini secara historis; jaga tetap unik.
            ->unique('k_id')
            ->values();

        // Tampilkan SEMUA mentor kader (bukan hanya mentor yang difilter) agar kartu konsisten.
        $this->attachMentors($rows, $idBatch);
        $this->attachKandidatPhotos($rows);

        return $this->attachProgressStats($rows);
    }

    /**
     * Menempelkan daftar mentor (bisa >1) tiap kader ke setiap baris:
     *  - $row->mentors      : array [{ id, nama, jabatan }]
     *  - $row->mentor_count : jumlah mentor aktif
     *  - $row->mentor_name  : nama mentor digabung koma (backward compatible)
     *  - $row->mentor_id    : mentor pertama (backward compatible)
     */
    protected function attachMentors($rows, $idBatch = null)
    {
        if ($rows->isEmpty()) return;

        $kaderIds = $rows->pluck('k_id')->unique()->filter()->values()->all();

        $byKader = ListKaderPerMentor::select(
                'list_kader_per_mentor.kader_id',
                'mentor.id as mentor_id',
                'mentor.nama as mentor_name',
                'mentor.jabatan as mentor_jabatan'
            )
            ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->whereIn('list_kader_per_mentor.kader_id', $kaderIds)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->whereNull('mentor.deleted_at')
            ->when($idBatch, fn($q) => $q->where('list_kader_per_mentor.id_batch', $idBatch))
            ->orderBy('mentor.nama', 'asc')
            ->get()
            ->unique(fn($r) => $r->kader_id . '|' . $r->mentor_id)
            ->groupBy('kader_id');

        $rows->each(function ($row) use ($byKader) {
            $list = $byKader->get($row->k_id, collect());
            $row->mentors = $list->map(fn($m) => [
                'id'      => $m->mentor_id,
                'nama'    => $m->mentor_name,
                'jabatan' => $m->mentor_jabatan,
            ])->values()->all();
            $row->mentor_count   = $list->count();
            $row->mentor_name    = $list->pluck('mentor_name')->implode(', ') ?: null;
            $row->mentor_id      = $list->first()->mentor_id ?? null;
            $row->mentor_jabatan = $list->first()->mentor_jabatan ?? null;
        });
    }

    /**
     * Daftar semua kader dalam satu BU (atau seluruh BU jika $companyCode = null),
     * lengkap dengan mentor (jika ada) dan stats progress modul.
     */
    public function listAllKadersInBU($companyCode = null, $idBatch = null)
    {
        // Query murni kader (tanpa join mentor) agar satu kader = satu baris,
        // walau punya >1 mentor. Daftar mentor ditempel via attachMentors().
        $kadersQuery = Kader::select(
                'kader.id as k_id',
                'kader.id as kader_id',
                'kader.nik as nik_kader',
                'kader.nik_ktp as nik_ktp',
                'kader.nama as nama_kader',
                'kader.company_code',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->orderBy('kader.nama', 'asc');

        if ($companyCode) {
            $kadersQuery->where('kader.company_code', $companyCode);
        }

        if ($idBatch) {
            $kadersQuery->where('kader.id_batch', $idBatch);
        }

        $rows = $kadersQuery->get();

        $this->attachMentors($rows, $idBatch);
        $this->attachKandidatPhotos($rows);

        return $this->attachProgressStats($rows);
    }

    /**
     * Menempelkan `$row->foto` (URL foto kandidat Career MAI) tiap kader yang sudah
     * ditautkan lewat nik_ktp. Satu query untuk seluruh daftar.
     *
     * Sengaja dibungkus try/catch: Dashboard & daftar kader TIDAK boleh ikut tumbang
     * hanya karena DB portal rekrutmen tak terjangkau — foto sekadar pemanis, kader
     * tanpa foto jatuh ke avatar inisial.
     */
    protected function attachKandidatPhotos($rows)
    {
        if ($rows->isEmpty()) return;

        $photos = [];
        try {
            $photos = KandidatData::photosForKtps(
                $rows->pluck('nik_ktp')->filter()->unique()->values()->all()
            );
        } catch (\Throwable $e) {
            Log::warning('[KaderPerMentor] gagal ambil foto kandidat Career MAI: ' . $e->getMessage());
        }

        $rows->each(function ($r) use ($photos) {
            $ktp = trim((string) ($r->nik_ktp ?? ''));
            $r->foto = ($ktp !== '' && isset($photos[$ktp])) ? $photos[$ktp] : null;
        });
    }

    protected function attachProgressStats($rows)
    {
        if ($rows->isEmpty()) return $rows;

        $kaderIds      = $rows->pluck('k_id')->unique()->filter()->values()->all();
        $niks          = $rows->pluck('nik_kader')->unique()->filter()->values()->all();
        $companyCodes  = $rows->pluck('company_code')->unique()->filter()->values()->all();

        $userMap = User::whereIn('nik', $niks)->pluck('id', 'nik');

        $companyIdMap = Company::whereIn('company_code', $companyCodes)
            ->pluck('company_id', 'company_code');

        $userAssigns = ModulAssignment::where('assignable_type', 'user')
            ->whereIn('assignable_id', $kaderIds)
            ->get(['modul_id', 'assignable_id']);

        $companyAssigns = ModulAssignment::where('assignable_type', 'company')
            ->whereIn('assignable_id', $companyIdMap->values()->all())
            ->get(['modul_id', 'assignable_id']);

        $companyCodeByPk = $companyIdMap->flip();

        $kaderModuls = [];
        foreach ($kaderIds as $kid) {
            $kaderModuls[$kid] = [];
        }
        foreach ($userAssigns as $a) {
            $kaderModuls[$a->assignable_id][$a->modul_id] = true;
        }
        $kaderCompany = $rows->keyBy('k_id')->map(fn($r) => $r->company_code);
        foreach ($companyAssigns as $a) {
            $code = $companyCodeByPk[$a->assignable_id] ?? null;
            if (!$code) continue;
            foreach ($kaderCompany as $kid => $kcode) {
                if ($kcode === $code) {
                    $kaderModuls[$kid][$a->modul_id] = true;
                }
            }
        }

        $allModulIds = collect($kaderModuls)
            ->flatMap(fn($s) => array_keys($s))
            ->unique()
            ->values()
            ->all();

        $modulFase  = Modul::whereIn('id', $allModulIds)->pluck('fase', 'id');
        $modulFlags = Modul::whereIn('id', $allModulIds)->get(['id', 'has_test', 'has_post_activity'])->keyBy('id');

        $userIds = $userMap->values()->all();

        $rpRows = ModulReadingProgress::whereIn('user_id', $userIds)
            ->whereIn('modul_id', $allModulIds)
            ->get(['user_id', 'modul_id', 'progress']);
        $rpMap = [];
        foreach ($rpRows as $r) {
            $rpMap[$r->user_id][$r->modul_id] = (int) $r->progress;
        }

        $trRows = ModulTestResult::whereIn('user_id', $userIds)
            ->whereIn('modul_id', $allModulIds)
            ->where('is_completed', 1)
            ->get(['user_id', 'modul_id', 'tipe', 'score']);
        $trMap = [];
        foreach ($trRows as $t) {
            $trMap[$t->user_id][$t->modul_id][$t->tipe] = (float) $t->score;
        }

        $docRows = Dokumen::whereIn('dokumen.kader_id', $userIds)
            ->whereIn('dokumen.modul_id', $allModulIds)
            ->where('dokumen.jenis', 'POST_ACTIVITY')
            ->leftJoin('penilaian_post_activity', 'dokumen.id', '=', 'penilaian_post_activity.dokumen_id')
            ->get(['dokumen.kader_id', 'dokumen.modul_id', 'penilaian_post_activity.nilai as pa_score']);
        $docMap     = [];
        $paScoreMap = [];
        foreach ($docRows as $d) {
            $docMap[$d->kader_id][$d->modul_id] = true;
            if ($d->pa_score !== null) {
                $paScoreMap[$d->kader_id][$d->modul_id] = (float) $d->pa_score;
            }
        }

        $stats = $rows->map(function ($row) use ($userMap, $kaderModuls, $modulFase, $modulFlags, $rpMap, $trMap, $docMap, $paScoreMap) {
            $userId   = $userMap[$row->nik_kader] ?? null;
            $modulIds = array_filter(
                array_keys($kaderModuls[$row->k_id] ?? []),
                fn($mid) => isset($modulFase[$mid])
            );
            $total    = count($modulIds);

            $doneCheckpoints  = 0;
            $totalCheckpoints = 0;
            $faseStats  = [];
            $scores     = [];   // Skor Akhir per modul (untuk avg keseluruhan)
            $faseScores = [];   // Skor Akhir per modul dikelompokkan per fase

            foreach ($modulIds as $mid) {
                $fase = $modulFase[$mid] ?? 'Tanpa Fase';

                // Checkpoint hanya dihitung untuk komponen yang dimiliki modul (Materi selalu ada).
                $hasTest  = (bool) (optional($modulFlags[$mid] ?? null)->has_test ?? true);
                $hasPA    = (bool) (optional($modulFlags[$mid] ?? null)->has_post_activity ?? true);
                $needPre  = $hasTest;
                $needPost = $hasTest;
                $needPA   = $hasPA;

                $pre  = $userId && isset($trMap[$userId][$mid]['pre']);
                $mat  = $userId && (($rpMap[$userId][$mid] ?? 0) >= 100);
                $post = $userId && isset($trMap[$userId][$mid]['post']);
                $pa   = $userId && isset($paScoreMap[$userId][$mid]);

                $required = 1 + (int) $needPre + (int) $needPost + (int) $needPA;
                $modDone  = (int) $mat
                    + ($needPre  ? (int) $pre  : 0)
                    + ($needPost ? (int) $post : 0)
                    + ($needPA   ? (int) $pa   : 0);
                $doneCheckpoints  += $modDone;
                $totalCheckpoints += $required;

                if (!isset($faseStats[$fase])) $faseStats[$fase] = ['total' => 0, 'done' => 0];
                $faseStats[$fase]['total']++;
                if ($modDone >= $required) $faseStats[$fase]['done']++;

                // Skor Akhir modul = rumus tunggal ModulScore (Post Test + Post Activity, TANPA Pre Test).
                $modScore = ModulScore::finalScore(
                    $hasTest,
                    $hasPA,
                    $userId ? ($trMap[$userId][$mid]['post'] ?? null) : null,
                    $userId ? ($paScoreMap[$userId][$mid] ?? null) : null
                );
                if ($modScore !== null) {
                    $scores[]            = $modScore;
                    $faseScores[$fase][] = $modScore;
                }
            }

            $totalCp = $totalCheckpoints;
            $progress = $totalCp > 0 ? (int) round(($doneCheckpoints / $totalCp) * 100) : 0;

            ksort($faseStats);
            $faseAktifList = [];
            foreach ($faseStats as $fase => $info) {
                if ($info['done'] < $info['total']) {
                    $faseAktifList[] = $fase;
                }
            }
            if (empty($faseAktifList) && !empty($faseStats)) {
                $faseAktifList[] = array_key_last($faseStats);
            }
            $faseAktif = $faseAktifList[0] ?? null;

            $avgRaw   = ModulScore::average($scores, null);
            $avgScore = $avgRaw !== null ? (int) round($avgRaw) : null;

            // Skor per fase (untuk badge "F1: 67" di list Kader Saya), rumus sama dengan avg keseluruhan.
            $faseScoreMap = [];
            foreach ($faseScores as $f => $list) {
                $favg = ModulScore::average($list, null);
                if ($favg !== null) $faseScoreMap[$f] = (int) round($favg);
            }

            $status = 'on_track';
            if ($progress < 40)      $status = 'kritis';
            elseif ($progress < 70)  $status = 'perlu_perhatian';

            $row->fase_aktif       = $faseAktif;
            $row->fase_aktif_list  = $faseAktifList;
            $row->progress_overall = $progress;
            $row->avg_score        = $avgScore;
            $row->fase_scores      = $faseScoreMap;
            $row->status           = $status;
            $row->total_moduls     = $total;

            return $row;
        });

        return $this->applyArsipStats($stats);
    }

    /**
     * Timpa statistik progres untuk kader batch arsip (Batch 1-2) — dipakai Dashboard
     * & daftar Kader Saya.
     *
     * Kader batch arsip tidak pernah di-assign modul, jadi hitungan checkpoint di atas
     * selalu 0% + status "Behind Schedule" — menyesatkan untuk program yang sudah tuntas.
     * Angkanya diambil dari sumber yang sama dengan halaman detail: progress dipatok 100%
     * (lihat App\Support\ArsipKaderDetail), modul = nilai in-class training pada fase
     * Monthly Training, dan Avg Score = skor Learning Growth di report_arsip.
     */
    protected function applyArsipStats($rows)
    {
        $arsip = $rows->filter(fn ($r) => $r->batch_name !== null && (int) $r->batch_name <= 2);
        if ($arsip->isEmpty()) return $rows;

        $lgByKader = ReportArsip::whereIn('kader_id', $arsip->pluck('k_id')->filter()->values()->all())
            ->pluck('learning_growth', 'kader_id');

        $fase = ArsipKaderDetail::FASE;

        // Item hasil filter adalah objek yang sama dengan di $rows, jadi cukup diubah di sini.
        foreach ($arsip as $row) {
            $lg  = $lgByKader[$row->k_id] ?? null;
            $avg = $lg === null ? null : (int) round((float) $lg);

            $row->progress_overall = ArsipKaderDetail::PROGRESS;
            $row->status           = ArsipKaderDetail::STATUS;
            $row->total_moduls     = HasilTrainingMt::modulCountFor((int) $row->batch_name);
            $row->fase_aktif       = $fase;
            $row->fase_aktif_list  = [$fase];
            $row->avg_score        = $avg;
            $row->fase_scores      = $avg === null ? [] : [$fase => $avg];
        }

        return $rows;
    }
}
