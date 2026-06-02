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

        $idBatch = $kader ? $kader->id_batch : null;

        $doc = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'FORM_IDP')
            ->where('id_batch', $idBatch)
            ->latest()
            ->first();

        $template = Dokumen::where('jenis', 'TEMPLATE_IDP')
            ->latest()
            ->first();

        return Inertia::render('FormIdp/Index', [
            'idp' => $doc ? [
                'nama_file'        => $doc->nama_file,
                'path_file'        => $doc->path_file,
                'status'           => $doc->status,
                'rejection_reason' => $doc->rejection_reason,
                'rejected_by_role' => $doc->rejected_by_role,
                'created_at'       => $doc->created_at,
                'can_reupload'     => $doc->status === 'rejected',
            ] : null,
            'hasBatch'    => $idBatch !== null,
            'hasTemplate' => $template !== null,
            'template'    => $template ? [
                'nama_file' => $template->nama_file,
                'path_file' => $template->path_file,
            ] : null,
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

        if (!Dokumen::where('jenis', 'TEMPLATE_IDP')->exists()) {
            return back()->withErrors(['file' => 'Template IDP belum tersedia. Hubungi Admin MAI untuk mengupload template terlebih dahulu.']);
        }

        $idBatch = $kader->id_batch;

        // Satu IDP per Kader per batch — blokir jika sudah ada yang pending/approved.
        $lastDoc = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'FORM_IDP')
            ->where('id_batch', $idBatch)
            ->latest()
            ->first();

        if ($lastDoc && in_array($lastDoc->status, ['pending', 'mentor_approved', 'approved'], true)) {
            $msg = [
                'approved'        => 'File IDP sudah disetujui Admin MAI dan tidak dapat diubah.',
                'mentor_approved' => 'File IDP sudah disetujui Mentor dan sedang menunggu review Admin MAI.',
                'pending'         => 'File IDP masih menunggu review Mentor.',
            ][$lastDoc->status];
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
            // Hapus file lama dari storage agar tidak menumpuk file sampah.
            $oldPath = public_path($lastDoc->path_file);
            if ($lastDoc->path_file && file_exists($oldPath)) {
                @unlink($oldPath);
            }
            $lastDoc->update([
                'nama_file'          => $request->file('file')->getClientOriginalName(),
                'path_file'          => 'uploads/form_idp/' . $fileName,
                'status'             => 'pending',
                'approved_by'        => null,
                'approved_at'        => null,
                'rejection_reason'   => null,
                'rejected_by_role'   => null,
                'mentor_approved_by' => null,
                'mentor_approved_at' => null,
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

    public function adminIndex()
    {
        $template = Dokumen::where('jenis', 'TEMPLATE_IDP')->latest()->first();

        $uploads = Dokumen::where('jenis', 'FORM_IDP')
            ->join('users as u', 'dokumen.kader_id', '=', 'u.id')
            ->leftJoin('batch as b', 'dokumen.id_batch', '=', 'b.id_batch')
            ->orderBy('dokumen.created_at', 'desc')
            ->get(['dokumen.id','dokumen.nama_file','dokumen.path_file','dokumen.status',
                   'dokumen.rejection_reason','dokumen.created_at','u.name as kader_nama','b.nama_batch']);

        return Inertia::render('FormIdp/Admin', [
            'template' => $template ? [
                'nama_file'  => $template->nama_file,
                'path_file'  => $template->path_file,
                'created_at' => $template->created_at,
            ] : null,
            'uploads' => $uploads,
        ]);
    }

    public function uploadTemplate(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,pdf,docx|max:10240',
        ]);

        $folder   = public_path('uploads/template_idp');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        $ext      = $request->file('file')->extension();
        $fileName = 'template_idp_' . now()->format('Ymd_His') . '.' . $ext;
        $request->file('file')->move($folder, $fileName);

        $existing = Dokumen::where('jenis', 'TEMPLATE_IDP')->first();
        if ($existing) {
            // Hapus file template lama dari storage sebelum diganti.
            $oldPath = public_path($existing->path_file);
            if ($existing->path_file && file_exists($oldPath)) {
                @unlink($oldPath);
            }
            $existing->update([
                'nama_file' => $request->file('file')->getClientOriginalName(),
                'path_file' => 'uploads/template_idp/' . $fileName,
            ]);
        } else {
            Dokumen::create([
                'nama_file' => $request->file('file')->getClientOriginalName(),
                'path_file' => 'uploads/template_idp/' . $fileName,
                'tipe'      => 'admin',
                'status'    => 'approved',
                'jenis'     => 'TEMPLATE_IDP',
            ]);
        }

        return back()->with('success', 'Template IDP berhasil diupload.');
    }
}
