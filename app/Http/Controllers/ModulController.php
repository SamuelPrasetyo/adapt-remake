<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Kader;
use Illuminate\Http\Request;
use App\Models\Modul;
use App\Models\KategoriModul;
use Illuminate\Support\Facades\DB;
use RealRashid\SweetAlert\Facades\Alert;
use Inertia\Inertia;

class ModulController extends Controller
{
    public function index()
    {
        $moduls = Modul::orderBy('created_at', 'desc')->get();
        $companies = Company::get();
        $users = Kader::get();
        $moduls = Modul::get();

        return Inertia::render('Modul/Index', [
            'moduls'    => $moduls,
            'companies' => $companies,
            'users'     => $users,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_modul' => 'required',
            'nama_modul' => 'required',
            'fase' => 'required',
            'tag_kompetensi' => 'nullable',
            'file_materi' => 'required|mimes:pdf|max:10240'
        ]);
        $fileName = time() . '_' . $request->file_materi->getClientOriginalName();
        $request->file_materi->move(public_path('uploads/modul'), $fileName);

        Modul::create([
            'kode_modul' => $request->kode_modul,
            'nama_modul' => $request->nama_modul,
            'fase' => $request->fase,
            'batch' => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi' => 'uploads/modul/' . $fileName
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

        $modul->update([
            'kode_modul' => $request->kode_modul,
            'nama_modul' => $request->nama_modul,
            'fase' => $request->fase,
            'batch' => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi' => $modul->file_materi
        ]);
        Alert::success('Success', 'Modul berhasil diupdate!');
        return back()->with('success', 'Modul berhasil diupdate');
    }

    public function destroy($id)
    {
        $modul = Modul::findOrFail($id);

        if ($modul->file && file_exists(public_path($modul->file))) {
            unlink(public_path($modul->file));
        }

        $modul->delete();
        Alert::success('Success', 'Modul berhasil dihapus!');
        return back()->with('success', 'Modul berhasil dihapus');
    }

    public function assign(Request $request)
    {
        $request->validate([
            'type'       => 'required|in:user,company',
            'modul_id'   => 'required|array|min:1',
            'user_id'    => 'required_if:type,user|array|min:1',
            'company_id' => 'required_if:type,company|array|min:1',
        ]);

        $type      = $request->type;
        $modulIds  = $request->modul_id;
        $targetIds = $type === 'user' ? $request->user_id : $request->company_id;

        $dataInsert = [];
        $now        = now();

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

        DB::table('modul_assignments')->insertOrIgnore($dataInsert);
        Alert::success('Success', 'Modul berhasil di-assign!');
        return back()->with('success', 'Modul berhasil di-assign');
    }

    public function peserta()
    {
        $kaders = Kader::select(
                'kader.id',
                'kader.nik',
                'kader.nama',
                'kader.company_code',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
            )
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->get();

        // Batch-load user-type assignments (no N+1)
        $kaderIds = $kaders->pluck('id');
        $userAssignments = DB::table('modul_assignments')
            ->join('modul', 'modul_assignments.modul_id', 'modul.id')
            ->whereIn('modul_assignments.assignable_id', $kaderIds)
            ->where('modul_assignments.assignable_type', 'user')
            ->select(
                'modul_assignments.assignable_id as kader_id',
                'modul.id',
                'modul.kode_modul',
                'modul.nama_modul',
                'modul.fase'
            )
            ->get()
            ->groupBy('kader_id');

        // Batch-load company-type assignments
        $companyCodes = $kaders->pluck('company_code')->filter()->unique();
        $companyMap   = Company::whereIn('company_code', $companyCodes)
                            ->pluck('company_id', 'company_code');

        $companyAssignments = collect();
        if ($companyMap->isNotEmpty()) {
            $companyAssignments = DB::table('modul_assignments')
                ->join('modul', 'modul_assignments.modul_id', 'modul.id')
                ->whereIn('modul_assignments.assignable_id', $companyMap->values())
                ->where('modul_assignments.assignable_type', 'company')
                ->select(
                    'modul_assignments.assignable_id as company_id',
                    'modul.id',
                    'modul.kode_modul',
                    'modul.nama_modul',
                    'modul.fase'
                )
                ->get()
                ->groupBy('company_id');
        }

        $result = $kaders->map(function ($k) use ($userAssignments, $companyAssignments, $companyMap) {
            $cid    = $companyMap[$k->company_code] ?? null;
            $moduls = collect($userAssignments[$k->id] ?? [])
                        ->concat($companyAssignments[$cid] ?? [])
                        ->unique('id')
                        ->values();

            return array_merge($k->toArray(), [
                'total_modul' => $moduls->count(),
                'moduls'      => $moduls,
            ]);
        });

        return Inertia::render('Modul/Peserta', ['kaders' => $result]);
    }
}
