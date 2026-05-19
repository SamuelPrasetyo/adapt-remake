<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\Mentor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use RealRashid\SweetAlert\Facades\Alert;

class MentorController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $mentors = Mentor::select('mentor.*', 'company.company_shortname as bu')
            ->leftJoin('company', 'mentor.company_code', '=', 'company.company_code')
            ->whereNull('mentor.deleted_at')
            ->orderBy('mentor.nama', 'asc')
            ->get();

        // Attach kader_count so AppLayout sidebar shows correct numbers
        $mentorIds = $mentors->pluck('id')->all();
        $countMap  = ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
            ->whereNull('deleted_at')
            ->select('mentor_id', DB::raw('COUNT(*) as c'))
            ->groupBy('mentor_id')
            ->pluck('c', 'mentor_id');
        $mentors->each(fn($m) => $m->kader_count = (int) ($countMap[$m->id] ?? 0));

        $companys = Company::orderBy('company_shortname', 'asc')->get();

        $kaders = Kader::select(
                'kader.id',
                'kader.nik',
                'kader.nama',
                'kader.company_code',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->orderBy('kader.nama', 'asc')
            ->get();

        // Existing assignments: array of {mentor_id, kader_id}
        $assignments = ListKaderPerMentor::whereIn('mentor_id', $mentorIds)
            ->whereNull('deleted_at')
            ->get(['mentor_id', 'kader_id']);

        return Inertia::render('Master/Mentor/Index', [
            'mentors'     => $mentors,
            'companys'    => $companys,
            'kaders'      => $kaders,
            'assignments' => $assignments,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama'         => 'required|string|max:255',
            'jabatan'      => 'required|string|max:255',
            'company_code' => 'required|string|max:255',
        ]);

        Mentor::insert([
            'id'           => Str::uuid(),
            'nama'         => $request->nama,
            'jabatan'      => $request->jabatan,
            'company_code' => $request->company_code,
            'created_by'   => Auth::user()->id,
            'created_at'   => now(),
        ]);

        ActivityLog::activity_log('Menambah data Mentor');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('mentor.index');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama'         => 'required|string|max:255',
            'jabatan'      => 'required|string|max:255',
            'company_code' => 'required|string|max:255',
        ]);

        Mentor::where('id', $id)
            ->whereNull('deleted_at')
            ->update([
                'nama'         => $request->nama,
                'jabatan'      => $request->jabatan,
                'company_code' => $request->company_code,
                'updated_by'   => Auth::user()->id,
                'updated_at'   => now(),
            ]);

        ActivityLog::activity_log('Mengedit data Mentor');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('mentor.index');
    }

    public function destroy($id)
    {
        Mentor::where('id', $id)
            ->whereNull('deleted_at')
            ->update([
                'deleted_by' => Auth::user()->id,
                'deleted_at' => now(),
            ]);

        ActivityLog::activity_log('Menghapus data Mentor');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('mentor.index');
    }
}
