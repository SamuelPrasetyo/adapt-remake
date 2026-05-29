<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Dokumen;
use App\Models\Kader;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormIdpController extends Controller
{
    public function index()
    {
        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        $idBatch = $kader?->id_batch;

        $doc = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'FORM_IDP')
            ->where('id_batch', $idBatch)
            ->latest()
            ->first();

        return Inertia::render('FormIdp/Index', [
            'idp' => $doc ? [
                'nama_file'        => $doc->nama_file,
                'path_file'        => $doc->path_file,
                'status'           => $doc->status,
                'rejection_reason' => $doc->rejection_reason,
                'created_at'       => $doc->created_at,
                'can_reupload'     => $doc->status === 'rejected',
            ] : null,
            'hasBatch' => $idBatch !== null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,docx,xlsx|max:2048',
        ]);

        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        if (!$kader || $kader->id_batch === null) {
            return back()->withErrors(['file' => 'Batch Kader belum ditentukan. Hubungi Admin.']);
        }

        $idBatch = $kader->id_batch;

        // Satu IDP per Kader per batch — blokir jika sudah ada yang pending/approved.
        $lastDoc = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'FORM_IDP')
            ->where('id_batch', $idBatch)
            ->latest()
            ->first();

        if ($lastDoc && in_array($lastDoc->status, ['pending', 'approved'], true)) {
            $msg = $lastDoc->status === 'approved'
                ? 'File IDP sudah disetujui Admin MAI dan tidak dapat diubah.'
                : 'File IDP masih menunggu review Admin MAI.';
            return back()->withErrors(['file' => $msg]);
        }

        $folder = public_path('uploads/form_idp');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        $ext      = $request->file('file')->extension();
        $fileName = time() . '_' . uniqid() . '.' . $ext;
        $request->file('file')->move($folder, $fileName);

        if ($lastDoc) {
            // Re-upload setelah ditolak — perbarui baris yang sama agar unique key terjaga.
            $lastDoc->update([
                'nama_file'        => $request->file('file')->getClientOriginalName(),
                'path_file'        => 'uploads/form_idp/' . $fileName,
                'status'           => 'pending',
                'approved_by'      => null,
                'approved_at'      => null,
                'rejection_reason' => null,
            ]);
        } else {
            Dokumen::create([
                'nama_file' => $request->file('file')->getClientOriginalName(),
                'path_file' => 'uploads/form_idp/' . $fileName,
                'tipe'      => 'kader',
                'status'    => 'pending',
                'jenis'     => 'FORM_IDP',
                'kader_id'  => $user->id,
                'id_batch'  => $idBatch,
            ]);
        }

        return back()->with('success', 'File IDP berhasil diupload.');
    }
}
