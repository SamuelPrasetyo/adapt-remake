<?php

namespace App\Http\Controllers\Master\Mentor;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\Mentor;
use App\Models\User;
use App\Support\UploadName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

        // Assignment aktif + nama mentor, dipakai UI untuk menampilkan kader ini
        // sudah dibina mentor siapa saja & badge jumlah mentornya.
        $assignments = ListKaderPerMentor::select(
                'list_kader_per_mentor.mentor_id',
                'list_kader_per_mentor.kader_id',
                'mentor.nama as mentor_name'
            )
            ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->whereNull('mentor.deleted_at')
            ->get();

        $mentorUsers = User::where('type', 'Mentor')
            ->orderBy('name')
            ->get(['id', 'name', 'nik', 'company_code']);

        return Inertia::render('Master/Mentor/Index', [
            'mentors'     => $mentors,
            'companys'    => $companys,
            'kaders'      => $kaders,
            'assignments' => $assignments,
            'mentorUsers' => $mentorUsers,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama'         => 'required|string|max:255',
            'jabatan'      => 'required|string|max:255',
            'company_code' => 'required|string|max:255',
            'foto'         => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $file     = $request->file('foto');
            $ext      = $file->getClientOriginalExtension();
            $filename = UploadName::stored(['mentor', $request->nama], $ext);
            $fotoPath = $file->storeAs('mentors', $filename, 'public');
        }

        Mentor::insert([
            'id'           => Str::uuid(),
            'nama'         => $request->nama,
            'jabatan'      => $request->jabatan,
            'company_code' => $request->company_code,
            'user_id'      => $request->user_id ?: null,
            'foto'         => $fotoPath,
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
            'foto'         => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $updateData = [
            'nama'         => $request->nama,
            'jabatan'      => $request->jabatan,
            'company_code' => $request->company_code,
            'user_id'      => $request->user_id ?: null,
            'updated_by'   => Auth::user()->id,
            'updated_at'   => now(),
        ];

        if ($request->hasFile('foto')) {
            $mentor = Mentor::where('id', $id)->whereNull('deleted_at')->first();
            if ($mentor && $mentor->foto) {
                Storage::disk('public')->delete($mentor->foto);
            }
            $file     = $request->file('foto');
            $ext      = $file->getClientOriginalExtension();
            $filename = UploadName::stored(['mentor', $request->nama], $ext);
            $updateData['foto'] = $file->storeAs('mentors', $filename, 'public');
        }

        Mentor::where('id', $id)
            ->whereNull('deleted_at')
            ->update($updateData);

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
