<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Kader;
use Illuminate\Http\Request;
use App\Models\Modul;
use Illuminate\Support\Facades\DB;
use RealRashid\SweetAlert\Facades\Alert;
use Inertia\Inertia;

class ModulController extends Controller
{
    public function index()
    {
        $moduls = Modul::get();

        return Inertia::render('Modul/Index', [
            'moduls' => $moduls,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_modul'     => 'required',
            'nama_modul'     => 'required',
            'tipe'           => 'required|in:KADER,MENTOR',
            'fase'           => 'required_if:tipe,KADER',
            'tag_kompetensi' => 'nullable',
            'file_materi'    => 'required|mimes:pdf|max:10240'
        ]);
        $fileName = time() . '_' . $request->file_materi->getClientOriginalName();
        $request->file_materi->move(public_path('uploads/modul'), $fileName);

        $faseValue = $request->tipe === 'MENTOR' ? null : preg_replace('/[^0-9]/', '', (string) $request->fase);

        Modul::create([
            'kode_modul'     => $request->kode_modul,
            'nama_modul'     => $request->nama_modul,
            'tipe'           => $request->tipe,
            'fase'           => $faseValue,
            'batch'          => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi'    => 'uploads/modul/' . $fileName
        ]);
        Alert::success('Success', 'Modul berhasil ditambahkan!');
        return back()->with('success', 'Modul berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $modul = Modul::findOrFail($id);

        if ($request->hasFile('file_materi')) {

            if ($modul->file_materi && file_exists(public_path($modul->file_materi))) {
                unlink(public_path($modul->file_materi));
            }

            $fileName = time() . '_' . $request->file_materi->getClientOriginalName();
            $request->file_materi->move(public_path('uploads/modul'), $fileName);

            $modul->file_materi = 'uploads/modul/' . $fileName;
        }

        $tipe = $request->tipe ?? $modul->tipe;
        $faseValue = $tipe === 'MENTOR' ? null : preg_replace('/[^0-9]/', '', (string) $request->fase);
        $modul->update([
            'kode_modul'     => $request->kode_modul,
            'nama_modul'     => $request->nama_modul,
            'tipe'           => $tipe,
            'fase'           => $faseValue,
            'batch'          => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi'    => $modul->file_materi
        ]);
        Alert::success('Success', 'Modul berhasil diupdate!');
        return back()->with('success', 'Modul berhasil diupdate');
    }

    public function destroy($id)
    {
        $modul = Modul::findOrFail($id);

        if ($modul->file_materi && file_exists(public_path($modul->file_materi))) {
            unlink(public_path($modul->file_materi));
        }

        $modul->delete();
        Alert::success('Success', 'Modul berhasil dihapus!');
        return back()->with('success', 'Modul berhasil dihapus');
    }

    public function assign(Request $request)
    {
        $request->validate([
            'type'               => 'required|in:user,company,mentor',
            'modul_id'           => 'required|array|min:1',
            'user_id'            => 'required_if:type,user|array|min:1',
            'company_id'         => 'required_if:type,company|array|min:1',
            'mentor_user_ids'    => 'array',
            'mentor_master_ids'  => 'array',
        ]);

        $type     = $request->type;
        $modulIds = $request->modul_id;
        $dataInsert = [];
        $now        = now();

        if ($type === 'mentor') {
            $mentorUserIds   = $request->mentor_user_ids   ?? [];
            $mentorMasterIds = $request->mentor_master_ids ?? [];

            if (empty($mentorUserIds) && empty($mentorMasterIds)) {
                return back()->withErrors(['mentor' => 'Pilih minimal satu mentor.']);
            }

            foreach ($mentorUserIds as $uid) {
                foreach ($modulIds as $modulId) {
                    $dataInsert[] = ['modul_id' => $modulId, 'assignable_id' => $uid, 'assignable_type' => 'mentor', 'created_at' => $now, 'updated_at' => $now];
                }
            }
            foreach ($mentorMasterIds as $mid) {
                foreach ($modulIds as $modulId) {
                    $dataInsert[] = ['modul_id' => $modulId, 'assignable_id' => $mid, 'assignable_type' => 'mentor_master', 'created_at' => $now, 'updated_at' => $now];
                }
            }
        } else {
            $targetIds = $type === 'user' ? $request->user_id : $request->company_id;
            foreach ($targetIds as $targetId) {
                foreach ($modulIds as $modulId) {
                    $dataInsert[] = [
                        'modul_id'        => $modulId,
                        'assignable_id'   => $targetId,
                        'assignable_type' => $type,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ];
                }
            }
        }

        DB::table('modul_assignments')->insertOrIgnore($dataInsert);
        Alert::success('Success', 'Modul berhasil di-assign!');
        return back()->with('success', 'Modul berhasil di-assign');
    }

    public function assignPage()
    {
        // Kader dengan modul yang sudah di-assign
        $kaders = Kader::select(
                'kader.id', 'kader.nik', 'kader.nama', 'kader.company_code',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
            )
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->get();

        $kaderIds = $kaders->pluck('id');
        $userAssignments = DB::table('modul_assignments')
            ->join('modul', 'modul_assignments.modul_id', 'modul.id')
            ->whereIn('modul_assignments.assignable_id', $kaderIds)
            ->where('modul_assignments.assignable_type', 'user')
            ->select(
                'modul_assignments.assignable_id as kader_id',
                'modul.id', 'modul.kode_modul', 'modul.nama_modul', 'modul.fase'
            )
            ->get()->groupBy('kader_id');

        $companyCodes = $kaders->pluck('company_code')->filter()->unique();
        $companyMap   = Company::whereIn('company_code', $companyCodes)->pluck('company_id', 'company_code');
        $companyAssignments = collect();
        if ($companyMap->isNotEmpty()) {
            $companyAssignments = DB::table('modul_assignments')
                ->join('modul', 'modul_assignments.modul_id', 'modul.id')
                ->whereIn('modul_assignments.assignable_id', $companyMap->values())
                ->where('modul_assignments.assignable_type', 'company')
                ->select(
                    'modul_assignments.assignable_id as company_id',
                    'modul.id', 'modul.kode_modul', 'modul.nama_modul', 'modul.fase'
                )
                ->get()->groupBy('company_id');
        }

        $kadersResult = $kaders->map(function ($k) use ($userAssignments, $companyAssignments, $companyMap) {
            $cid         = $companyMap[$k->company_code] ?? null;
            $userModuls  = collect($userAssignments[$k->id] ?? []);
            $moduls      = $userModuls->concat($companyAssignments[$cid] ?? [])->unique('id')->values();
            return array_merge($k->toArray(), [
                'total_modul'    => $moduls->count(),
                'moduls'         => $moduls,
                'user_modul_ids' => $userModuls->pluck('id')->values(),
            ]);
        });

        // Batch-resolve users.id dari kader.id via NIK
        // COLLATE diperlukan karena users.nik (unicode_ci) vs kader.nik (general_ci)
        // Gunakan alias eksplisit karena pluck() tidak handle dot-notation dengan baik
        $kaderUsersMap = DB::table('users')
            ->join('kader', DB::raw('users.nik COLLATE utf8mb4_general_ci'), '=', 'kader.nik')
            ->whereIn('kader.id', $kaderIds)
            ->selectRaw('users.id as users_id, kader.id as kader_uuid')
            ->pluck('users_id', 'kader_uuid'); // kader.id => users.id

        $kaderUserIds = $kaderUsersMap->values()->filter()->unique();
        $kaderTestByUser = $kaderUserIds->isNotEmpty()
            ? DB::table('modul_test_results')->whereIn('user_id', $kaderUserIds)
                ->select('user_id', 'modul_id')->get()->groupBy('user_id')
            : collect();
        $kaderDokByUser  = $kaderUserIds->isNotEmpty()
            ? DB::table('dokumen')->whereIn('kader_id', $kaderUserIds)
                ->where('jenis', 'POST_ACTIVITY')
                ->select('kader_id as user_id', 'modul_id')->get()->groupBy('user_id')
            : collect();

        $kadersResult = $kadersResult->map(function ($k) use ($kaderUsersMap, $kaderTestByUser, $kaderDokByUser) {
            $uid    = $kaderUsersMap[$k['id']] ?? null;
            $locked = $uid
                ? collect($kaderTestByUser[$uid] ?? [])->pluck('modul_id')
                    ->merge(collect($kaderDokByUser[$uid] ?? [])->pluck('modul_id'))
                    ->unique()->values()->toArray()
                : [];
            return array_merge($k, ['locked_modul_ids' => $locked]);
        });

        // Mentor dari users table
        $mentorUsers = DB::table('users')
            ->where('users.type', 'Mentor')->where('users.status', 'Aktif')
            ->leftJoin('company', 'users.company_code', 'company.company_code')
            ->select('users.id', 'users.name as nama', 'users.nik', 'company.company_shortname as bu')
            ->orderBy('users.name')->get();

        // Mentor dari master mentor
        $mentorMasters = DB::table('mentor')
            ->whereNull('mentor.deleted_at')
            ->leftJoin('company', 'mentor.company_code', 'company.company_code')
            ->select('mentor.id', 'mentor.nama', DB::raw('NULL as nik'), 'company.company_shortname as bu')
            ->orderBy('mentor.nama')->get();

        $muIds = $mentorUsers->pluck('id');
        $muAssignments = collect();
        if ($muIds->isNotEmpty()) {
            $muAssignments = DB::table('modul_assignments')
                ->join('modul', 'modul_assignments.modul_id', 'modul.id')
                ->whereIn('modul_assignments.assignable_id', $muIds)
                ->where('modul_assignments.assignable_type', 'mentor')
                ->select(
                    'modul_assignments.assignable_id as mentor_id',
                    'modul.id', 'modul.kode_modul', 'modul.nama_modul', 'modul.fase'
                )
                ->get()->groupBy('mentor_id');
        }

        $mmIds = $mentorMasters->pluck('id');
        $mmAssignments = collect();
        if ($mmIds->isNotEmpty()) {
            $mmAssignments = DB::table('modul_assignments')
                ->join('modul', 'modul_assignments.modul_id', 'modul.id')
                ->whereIn('modul_assignments.assignable_id', $mmIds)
                ->where('modul_assignments.assignable_type', 'mentor_master')
                ->select(
                    'modul_assignments.assignable_id as mentor_id',
                    'modul.id', 'modul.kode_modul', 'modul.nama_modul', 'modul.fase'
                )
                ->get()->groupBy('mentor_id');
        }

        // Progress mentor users (users.id langsung sebagai kader_id di dokumen)
        $muTestByUser = $muIds->isNotEmpty()
            ? DB::table('modul_test_results')->whereIn('user_id', $muIds)
                ->select('user_id', 'modul_id')->get()->groupBy('user_id')
            : collect();
        $muDokByUser  = $muIds->isNotEmpty()
            ? DB::table('dokumen')->whereIn('kader_id', $muIds)
                ->where('jenis', 'POST_ACTIVITY')
                ->select('kader_id as user_id', 'modul_id')->get()->groupBy('user_id')
            : collect();

        $mentorUsersData = $mentorUsers->map(fn($m) => [
            'id' => $m->id, 'nama' => $m->nama, 'nik' => $m->nik, 'bu' => $m->bu,
            '_source'          => 'user',
            'moduls'           => collect($muAssignments[$m->id] ?? [])->unique('id')->values(),
            'total_modul'      => count($muAssignments[$m->id] ?? []),
            'locked_modul_ids' => collect($muTestByUser[$m->id] ?? [])->pluck('modul_id')
                ->merge(collect($muDokByUser[$m->id] ?? [])->pluck('modul_id'))
                ->unique()->values()->toArray(),
        ]);
        $mentorMastersData = $mentorMasters->map(fn($m) => [
            'id' => $m->id, 'nama' => $m->nama, 'nik' => null, 'bu' => $m->bu,
            '_source'          => 'master',
            'moduls'           => collect($mmAssignments[$m->id] ?? [])->unique('id')->values(),
            'total_modul'      => count($mmAssignments[$m->id] ?? []),
            'locked_modul_ids' => [],
        ]);
        $mentorsData = $mentorUsersData->concat($mentorMastersData)->sortBy('nama')->values();

        // Data untuk Assign Modal
        $moduls    = Modul::get();
        $companies = Company::get();
        $users     = Kader::get();

        $mentorUsersModal = DB::table('users')
            ->where('users.type', 'Mentor')->where('users.status', 'Aktif')
            ->leftJoin('company', 'users.company_code', 'company.company_code')
            ->select('users.id', 'users.name as nama', 'users.nik', 'company.company_shortname as bu')
            ->orderBy('users.name')->get()
            ->map(fn($m) => array_merge((array) $m, ['_source' => 'user']));

        $mentorMastersModal = DB::table('mentor')
            ->whereNull('mentor.deleted_at')
            ->leftJoin('company', 'mentor.company_code', 'company.company_code')
            ->select('mentor.id', 'mentor.nama', DB::raw('NULL as nik'), 'company.company_shortname as bu')
            ->orderBy('mentor.nama')->get()
            ->map(fn($m) => array_merge((array) $m, ['_source' => 'master']));

        $mentors = $mentorUsersModal->concat($mentorMastersModal)->sortBy('nama')->values();

        return Inertia::render('Modul/AssignModul', [
            'kaders'       => $kadersResult,
            'mentors_data' => $mentorsData,
            'moduls'       => $moduls,
            'companies'    => $companies,
            'users'        => $users,
            'mentors'      => $mentors,
        ]);
    }

    /**
     * Resolve users.id dari kader.id via NIK — karena progress tables memakai users.id.
     */
    private function resolveUsersIdFromKader(string $kaderId): ?string
    {
        return DB::table('users')
            ->join('kader', DB::raw('users.nik COLLATE utf8mb4_general_ci'), '=', 'kader.nik')
            ->where('kader.id', $kaderId)
            ->selectRaw('users.id as users_id')
            ->value('users_id');
    }

    /**
     * Resolve semua users.id dari company_id via NIK kader di company tersebut.
     */
    private function resolveUsersIdsFromCompany(int $companyId): \Illuminate\Support\Collection
    {
        $niks = DB::table('kader')
            ->join('company', 'kader.company_code', '=', 'company.company_code')
            ->where('company.company_id', $companyId)
            ->pluck('kader.nik');
        if ($niks->isEmpty()) return collect();
        // COLLATE agar cocok dengan users.nik yang utf8mb4_unicode_ci
        return DB::table('users')
            ->whereRaw('nik COLLATE utf8mb4_general_ci IN (' . implode(',', array_fill(0, $niks->count(), '?')) . ')', $niks->toArray())
            ->pluck('id');
    }

    /**
     * Ambil modul_id yang sudah ada progress (Pre/Post Test atau Post Activity).
     * $userIds: single string atau Collection of users.id
     * $filterModulIds: optional — hanya cek modul tertentu
     */
    private function fetchLockedByProgress(string|\Illuminate\Support\Collection $userIds, array $filterModulIds = []): \Illuminate\Support\Collection
    {
        $single = is_string($userIds);
        $test = DB::table('modul_test_results');
        $dok  = DB::table('dokumen')->where('jenis', 'POST_ACTIVITY');

        if ($single) {
            $test->where('user_id', $userIds);
            $dok->where('kader_id', $userIds);
        } else {
            $test->whereIn('user_id', $userIds);
            $dok->whereIn('kader_id', $userIds);
        }

        if (!empty($filterModulIds)) {
            $test->whereIn('modul_id', $filterModulIds);
            $dok->whereIn('modul_id', $filterModulIds);
        }

        return $test->pluck('modul_id')->merge($dok->pluck('modul_id'))->unique();
    }

    public function getLockedModuls(Request $request)
    {
        $type = $request->type;
        $id   = $request->id;

        $lockedIds = collect();

        if ($type === 'user') {
            // $id = kader.id → resolve ke users.id dulu
            $usersId = $this->resolveUsersIdFromKader($id);
            if ($usersId) {
                $lockedIds = $this->fetchLockedByProgress($usersId);
            }
        } elseif ($type === 'mentor') {
            // $id sudah users.id (mentor dari tabel users)
            $lockedIds = $this->fetchLockedByProgress($id);
        } elseif ($type === 'company') {
            $userIds = $this->resolveUsersIdsFromCompany((int) $id);
            if ($userIds->isNotEmpty()) {
                $lockedIds = $this->fetchLockedByProgress($userIds);
            }
        }
        // mentor_master: tidak ada users.id → tidak ada progress

        return response()->json(['locked_modul_ids' => $lockedIds->values()]);
    }

    public function updateAssign(Request $request)
    {
        $request->validate([
            'type'      => 'required|in:user,company,mentor,mentor_master',
            'id'        => 'required',
            'modul_ids' => 'present|array',
        ]);

        $type   = $request->type;
        $id     = $request->id;
        $newIds = $request->modul_ids ?? [];

        $currentIds = DB::table('modul_assignments')
            ->where('assignable_type', $type)
            ->where('assignable_id', $id)
            ->pluck('modul_id')
            ->toArray();

        $removedIds = array_values(array_diff($currentIds, $newIds));

        if (!empty($removedIds)) {
            $lockedIds = collect();

            if ($type === 'user') {
                $usersId = $this->resolveUsersIdFromKader($id);
                if ($usersId) {
                    $lockedIds = $this->fetchLockedByProgress($usersId, $removedIds);
                }
            } elseif ($type === 'mentor') {
                $lockedIds = $this->fetchLockedByProgress($id, $removedIds);
            } elseif ($type === 'company') {
                $userIds = $this->resolveUsersIdsFromCompany((int) $id);
                if ($userIds->isNotEmpty()) {
                    $lockedIds = $this->fetchLockedByProgress($userIds, $removedIds);
                }
            }

            if ($lockedIds->isNotEmpty()) {
                $names = DB::table('modul')->whereIn('id', $lockedIds)->pluck('kode_modul')->implode(', ');
                return back()->withErrors(['locked' => "Modul berikut tidak dapat dihapus karena sudah ada progress kader: {$names}"]);
            }
        }

        DB::table('modul_assignments')
            ->where('assignable_type', $type)
            ->where('assignable_id', $id)
            ->delete();

        if (!empty($newIds)) {
            $now = now();
            DB::table('modul_assignments')->insert(
                array_map(fn($mid) => [
                    'modul_id'        => $mid,
                    'assignable_id'   => $id,
                    'assignable_type' => $type,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ], $newIds)
            );
        }

        Alert::success('Success', 'Assignment modul berhasil diupdate!');
        return back()->with('success', 'Assignment modul berhasil diupdate');
    }

}
