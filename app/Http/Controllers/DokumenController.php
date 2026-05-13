<?php

// app/Http/Controllers/DokumenController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Dokumen;
use Inertia\Inertia;

class DokumenController extends Controller
{
    public function index()
    {
        $dokumens = Dokumen::orderBy('created_at', 'desc')->get();
        return Inertia::render('Dokumen/Index', ['dokumens' => $dokumens]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx|max:2048',
        ]);

        $fileName = time() . '_' . uniqid() . '.' . $request->file->extension();
        $request->file->move(public_path('uploads/dokumen'), $fileName);

        $originalName = $request->file('file')->getClientOriginalName();

        Dokumen::create([
            'nama_file' => $originalName,
            'path_file' => 'uploads/dokumen/' . $fileName,
            'tipe' => 'mentor',
            'status' => 'pending',
            'jenis' => $request->jenis
        ]);

        return back()->with('success', 'Dokumen berhasil diupload');
    }

    public function update(Request $request, $id)
    {
        $dokumen = Dokumen::findOrFail($id);

        if ($request->hasFile('file')) {

            if ($dokumen->path_file && file_exists(public_path($dokumen->path_file))) {
                unlink(public_path($dokumen->path_file));
            }

            $fileName = time() . '_' . uniqid() . '.' . $request->file->extension();
            $request->file->move(public_path('uploads/dokumen'), $fileName);

            $dokumen->path_file = 'uploads/dokumen/' . $fileName;

            // ambil nama asli file baru
            $dokumen->nama_file = $request->file('file')->getClientOriginalName();
        }

        $dokumen->update([
            'nama_file' => $dokumen->nama_file,
            'status' => $request->status,
            'jenis' => $request->jenis,
            'path_file' => $dokumen->path_file
        ]);

        return back()->with('success', 'Dokumen berhasil diupdate');
    }

    public function destroy($id)
    {
        $dokumen = Dokumen::findOrFail($id);

        if ($dokumen->path_file && file_exists(public_path($dokumen->path_file))) {
            unlink(public_path($dokumen->path_file));
        }

        $dokumen->delete();

        return back()->with('success', 'Dokumen berhasil dihapus');
    }
}
