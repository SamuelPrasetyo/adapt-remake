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
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RealRashid\SweetAlert\Facades\Alert;

class KaderPerMentorController extends Controller
{
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
            Alert::warning('Failed', 'Mentor tidak ditemukan.');
            return back();
        }

        $selectedIds = collect($request->kader_ids ?? []);

        // Unassign kader yang tidak dipilih lagi
        $unassigned = ListKaderPerMentor::where('mentor_id', $mentor->id)
            ->whereNull('deleted_at')
            ->when($selectedIds->isNotEmpty(), fn($q) => $q->whereNotIn('kader_id', $selectedIds->all()))
            ->update(['deleted_at' => now()]);

        // Assign kader baru yang belum ada
        $kaders = Kader::whereIn('id', $selectedIds->all())
            ->where('company_code', $mentor->company_code)
            ->get();

        $inserted = 0;
        foreach ($kaders as $kader) {
            $existing = ListKaderPerMentor::where('kader_id', $kader->id)
                ->where('mentor_id', $mentor->id)
                ->first();

            if ($existing && is_null($existing->deleted_at)) {
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

        ActivityLog::activity_log("Sync assign Mentor {$mentor->nama}: +{$inserted} kader, -{$unassigned} unassign.");
        Alert::success('Success', "Assign berhasil diperbarui.");
        return back();
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
                'kader.company_code as company_code',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'company.company_shortname as bu',
                'mentor.nama as mentor_name'
            )
            ->join('kader', 'list_kader_per_mentor.kader_id', '=', 'kader.id')
            ->leftJoin('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->leftJoin('batch', 'list_kader_per_mentor.id_batch', '=', 'batch.id_batch')
            ->leftJoin('divisis', 'list_kader_per_mentor.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'list_kader_per_mentor.id_department', '=', 'departemens.id')
            ->leftJoin('company', 'list_kader_per_mentor.company_code', '=', 'company.company_code')
            ->where('list_kader_per_mentor.mentor_id', $mentor_id)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->when($idBatch, fn($q) => $q->where('list_kader_per_mentor.id_batch', $idBatch))
            ->orderBy('kader.nama', 'asc')
            ->get();

        return $this->attachProgressStats($rows);
    }

    /**
     * Daftar semua kader dalam satu BU (atau seluruh BU jika $companyCode = null),
     * lengkap dengan mentor (jika ada) dan stats progress modul.
     */
    public function listAllKadersInBU($companyCode = null, $idBatch = null)
    {
        $kadersQuery = Kader::select(
                'kader.id as k_id',
                'kader.id as kader_id',
                'kader.nik as nik_kader',
                'kader.nama as nama_kader',
                'kader.company_code',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year',
                'lkpm.mentor_id as mentor_id',
                'mentor.nama as mentor_name'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->leftJoin(DB::raw('list_kader_per_mentor lkpm'), function ($j) {
                $j->on('lkpm.kader_id', '=', 'kader.id')
                  ->whereNull('lkpm.deleted_at');
            })
            ->leftJoin('mentor', 'lkpm.mentor_id', '=', 'mentor.id')
            ->orderBy('kader.nama', 'asc');

        if ($companyCode) {
            $kadersQuery->where('kader.company_code', $companyCode);
        }

        if ($idBatch) {
            $kadersQuery->where('kader.id_batch', $idBatch);
        }

        $rows = $kadersQuery->get();
        return $this->attachProgressStats($rows);
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

        $modulFase = Modul::whereIn('id', $allModulIds)->pluck('fase', 'id');

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

        $docRows = Dokumen::whereIn('kader_id', $userIds)
            ->whereIn('modul_id', $allModulIds)
            ->where('jenis', 'POST_ACTIVITY')
            ->get(['kader_id', 'modul_id']);
        $docMap = [];
        foreach ($docRows as $d) {
            $docMap[$d->kader_id][$d->modul_id] = true;
        }

        return $rows->map(function ($row) use ($userMap, $kaderModuls, $modulFase, $rpMap, $trMap, $docMap) {
            $userId   = $userMap[$row->nik_kader] ?? null;
            $modulIds = array_filter(
                array_keys($kaderModuls[$row->k_id] ?? []),
                fn($mid) => isset($modulFase[$mid])
            );
            $total    = count($modulIds);

            $doneCheckpoints = 0;
            $faseStats = [];
            $scores = [];

            foreach ($modulIds as $mid) {
                $fase = $modulFase[$mid] ?? 'Tanpa Fase';

                $pre  = $userId && isset($trMap[$userId][$mid]['pre']);
                $mat  = $userId && (($rpMap[$userId][$mid] ?? 0) >= 100);
                $post = $userId && isset($trMap[$userId][$mid]['post']);
                $pa   = $userId && isset($docMap[$userId][$mid]);

                $modDone = (int)$pre + (int)$mat + (int)$post + (int)$pa;
                $doneCheckpoints += $modDone;

                if (!isset($faseStats[$fase])) $faseStats[$fase] = ['total' => 0, 'done' => 0];
                $faseStats[$fase]['total']++;
                if ($modDone === 4) $faseStats[$fase]['done']++;

                if ($userId) {
                    if (isset($trMap[$userId][$mid]['pre']))  $scores[] = $trMap[$userId][$mid]['pre'];
                    if (isset($trMap[$userId][$mid]['post'])) $scores[] = $trMap[$userId][$mid]['post'];
                }
            }

            $totalCp = $total * 4;
            $progress = $totalCp > 0 ? (int) round(($doneCheckpoints / $totalCp) * 100) : 0;

            ksort($faseStats);
            $faseAktif = null;
            foreach ($faseStats as $fase => $info) {
                if ($info['done'] < $info['total']) { $faseAktif = $fase; break; }
            }
            if (!$faseAktif && !empty($faseStats)) {
                $faseAktif = array_key_last($faseStats);
            }

            $avgScore = !empty($scores) ? (int) round(array_sum($scores) / count($scores)) : null;

            $status = 'on_track';
            if ($progress < 40)      $status = 'kritis';
            elseif ($progress < 70)  $status = 'perlu_perhatian';

            $row->fase_aktif       = $faseAktif;
            $row->progress_overall = $progress;
            $row->avg_score        = $avgScore;
            $row->status           = $status;
            $row->total_moduls     = $total;

            return $row;
        });
    }
}
