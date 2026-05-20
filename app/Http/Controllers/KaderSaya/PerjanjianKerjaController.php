<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PerjanjianKerjaController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function store(Request $request, $kader_id)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,docx,xlsx|max:2048',
        ]);

        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->firstOrFail();

        $this->authorizeAccess($user, $kader_id);

        // Hard-delete existing PERJANJIAN_KERJA for this kader before storing the new one
        $existing = Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PERJANJIAN_KERJA')
            ->get();

        foreach ($existing as $old) {
            $oldPath = public_path($old->path_file);
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
            $old->delete();
        }

        $file         = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $storedName   = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $dir          = public_path('uploads/perjanjian_kerja/' . $kader_id);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $file->move($dir, $storedName);

        Dokumen::create([
            'kader_id'  => $kader_id,
            'mentor_id' => $user->id,
            'nama_file' => $originalName,
            'path_file' => 'uploads/perjanjian_kerja/' . $kader_id . '/' . $storedName,
            'tipe'      => 'mentor',
            'status'    => 'pending',
            'jenis'     => 'PERJANJIAN_KERJA',
        ]);

        ActivityLog::activity_log("Upload Perjanjian Kerja untuk Kader {$kader->nama}");

        return back()->with('perjanjianSuccess', 'Dokumen berhasil diupload.');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $doc  = Dokumen::where('id', $id)->where('jenis', 'PERJANJIAN_KERJA')->firstOrFail();

        $this->authorizeAccess($user, $doc->kader_id);

        $path = public_path($doc->path_file);
        if (file_exists($path)) {
            unlink($path);
        }
        $doc->delete();

        ActivityLog::activity_log("Hapus Perjanjian Kerja ID {$id}");

        return back()->with('perjanjianSuccess', 'Dokumen berhasil dihapus.');
    }

    public function download($id)
    {
        $user = Auth::user();
        $doc  = Dokumen::where('id', $id)->where('jenis', 'PERJANJIAN_KERJA')->firstOrFail();

        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';

        if (!$isAdmin021 && !$isMentor) {
            abort(403);
        }

        $path = public_path($doc->path_file);
        if (!file_exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return response()->download($path, $doc->nama_file);
    }

    private function authorizeAccess($user, $kader_id)
    {
        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';

        if (!$isAdmin021 && !$isMentor) {
            abort(403);
        }

        if ($isMentor) {
            $hasAccess = ListKaderPerMentor::where('list_kader_per_mentor.kader_id', $kader_id)
                ->whereNull('list_kader_per_mentor.deleted_at')
                ->join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
                ->whereNull('mentor.deleted_at')
                ->where('mentor.company_code', $user->company_code)
                ->exists();

            if (!$hasAccess) {
                abort(403, 'Kader tidak ada dalam daftar kader Anda.');
            }
        }
    }
}
