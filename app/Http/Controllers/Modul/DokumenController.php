<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Support\UploadName;
use Illuminate\Http\Request;
use App\Models\Dokumen;
use Inertia\Inertia;

/**
 * Menu "Upload > Dokumen" — repositori dokumen umum, dipakai dua role:
 *  - Admin  : melihat & mengelola dokumen tipe 'admin' (hanya Admin MAI/021 yang punya akses Admin).
 *  - Mentor : melihat & mengelola dokumen tipe 'mentor' MILIKNYA sendiri (dokumen.mentor_id = users.id).
 *
 * Jenis yang valid di menu ini hanya anggota enum generik (DOKUMEN/LAPORAN/LAINNYA) —
 * jenis lain (POST_ACTIVITY, FORM_IDP, dst) milik fitur upload masing-masing dan tidak
 * pernah lewat menu ini.
 */
class DokumenController extends Controller
{
    private const JENIS_OPTIONS = ['DOKUMEN', 'LAPORAN', 'LAINNYA'];

    public function index()
    {
        $dokumens = $this->ownedQuery()->orderBy('created_at', 'desc')->get();
        return Inertia::render('Dokumen/Index', ['dokumens' => $dokumens]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file'  => 'required|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx|max:2048',
            'nama'  => 'required|string|max:150',
            'jenis' => 'required|in:' . implode(',', self::JENIS_OPTIONS),
        ]);

        $user     = auth()->user();
        $isMentor = $user->type === 'Mentor';
        $ext      = $request->file->extension();

        // nama_file (display) = PERSIS ketikan user (spasi & kapital dipertahankan, tanpa slug);
        // nama disk tetap slug + suffix unik via UploadName::stored agar aman & tak bentrok.
        $fileName = UploadName::stored([$request->nama], $ext);
        $request->file->move(public_path('uploads/dokumen'), $fileName);

        Dokumen::create([
            'nama_file' => trim($request->nama) . '.' . strtolower($ext),
            'path_file' => 'uploads/dokumen/' . $fileName,
            'tipe'      => $isMentor ? 'mentor' : 'admin',
            'mentor_id' => $isMentor ? $user->id : null,
            'jenis'     => $request->jenis,
        ]);

        return back()->with('success', 'Dokumen berhasil diupload');
    }

    public function update(Request $request, $id)
    {
        $dokumen = $this->ownedQuery()->where('id', $id)->firstOrFail();

        $request->validate([
            'file'  => 'nullable|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx|max:2048',
            'nama'  => 'required|string|max:150',
            'jenis' => 'required|in:' . implode(',', self::JENIS_OPTIONS),
        ]);

        if ($request->hasFile('file')) {
            if ($dokumen->path_file && file_exists(public_path($dokumen->path_file))) {
                unlink(public_path($dokumen->path_file));
            }
            $ext      = $request->file->extension();
            $fileName = UploadName::stored([$request->nama], $ext);
            $request->file->move(public_path('uploads/dokumen'), $fileName);
            $dokumen->path_file = 'uploads/dokumen/' . $fileName;
        } else {
            // Rename tanpa ganti file: pertahankan ekstensi lama.
            $ext = pathinfo($dokumen->nama_file, PATHINFO_EXTENSION) ?: pathinfo($dokumen->path_file, PATHINFO_EXTENSION);
        }

        // nama_file (display) = persis ketikan user, tanpa slug — konsisten dengan store().
        $dokumen->nama_file = trim($request->nama) . '.' . strtolower($ext);

        $dokumen->jenis  = $request->jenis;
        $dokumen->save();

        return back()->with('success', 'Dokumen berhasil diupdate');
    }

    public function destroy($id)
    {
        $dokumen = $this->ownedQuery()->where('id', $id)->firstOrFail();

        if ($dokumen->path_file && file_exists(public_path($dokumen->path_file))) {
            unlink(public_path($dokumen->path_file));
        }

        $dokumen->delete();

        return back()->with('success', 'Dokumen berhasil dihapus');
    }

    /**
     * Scope dokumen yang boleh dilihat/dikelola user login di menu ini.
     * Dibatasi jenis generik saja — dokumen fitur lain (template, IDP, post activity,
     * dst) dikelola lewat menunya masing-masing, bukan dari sini.
     */
    private function ownedQuery()
    {
        $user = auth()->user();

        $q = Dokumen::whereIn('jenis', self::JENIS_OPTIONS);

        return $user->type === 'Mentor'
            ? $q->where('tipe', 'mentor')->where('mentor_id', $user->id)
            : $q->where('tipe', 'admin');
    }
}
