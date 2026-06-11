<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Support\UploadName;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FormIdpController extends Controller
{
    public function index()
    {
        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        // Batch diambil dari data kader (tabel kader), BUKAN batch periode yang sedang
        // berjalan — pendampingan bisa 2-3 tahun melewati periode batch-nya.
        $idBatch = $kader ? $kader->id_batch : null;

        // Riwayat semua upload IDP kader ini (lintas batch), terbaru lebih dulu.
        $riwayat = Dokumen::where('dokumen.kader_id', $user->id)
            ->where('dokumen.jenis', 'FORM_IDP')
            ->leftJoin('batch as b', 'dokumen.id_batch', '=', 'b.id_batch')
            ->orderByDesc('dokumen.created_at')
            ->get(['dokumen.nama_file', 'dokumen.path_file', 'dokumen.status',
                   'dokumen.rejection_reason', 'dokumen.rejected_by_role',
                   'dokumen.created_at', 'b.nama_batch', 'b.tahun_batch']);

        $template = Dokumen::where('jenis', 'TEMPLATE_IDP')
            ->latest()
            ->first();

        return Inertia::render('FormIdp/Index', [
            'riwayat'     => $riwayat,
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
        // Hanya PDF maks 2MB. Boleh diupload berkali-kali tanpa limit — tiap upload
        // menjadi baris riwayat baru yang masing-masing melewati review Mentor/Admin MAI.
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:2048',
        ]);

        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        if (!$kader || $kader->id_batch === null) {
            return back()->withErrors(['file' => 'Batch Kader belum ditentukan. Hubungi Admin.']);
        }

        if (!Dokumen::where('jenis', 'TEMPLATE_IDP')->exists()) {
            return back()->withErrors(['file' => 'Template IDP belum tersedia. Hubungi Admin MAI untuk mengupload template terlebih dahulu.']);
        }

        // Batch dicatat dari data kader (tabel kader), bukan batch periode yang sedang
        // berjalan, agar dokumen tidak rancu saat pendampingan melewati periode batch.
        $idBatch = $kader->id_batch;

        $folder = public_path('uploads/form_idp');
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        // Format nama: idkader_form_idp_namakader_batchN
        $ext       = $request->file('file')->extension();
        $nameParts = [$user->id, 'form_idp', $user->name, 'batch' . $idBatch];
        $fileName  = UploadName::stored($nameParts, $ext);
        $request->file('file')->move($folder, $fileName);

        Dokumen::create([
            'nama_file' => UploadName::display($nameParts, $ext),
            'path_file' => 'uploads/form_idp/' . $fileName,
            'tipe'      => 'kader',
            'status'    => 'pending',
            'jenis'     => 'FORM_IDP',
            'kader_id'  => $user->id,
            'id_batch'  => $idBatch,
        ]);

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
                'nama_file' => $fileName,
                'path_file' => 'uploads/template_idp/' . $fileName,
            ]);
        } else {
            Dokumen::create([
                'nama_file' => $fileName,
                'path_file' => 'uploads/template_idp/' . $fileName,
                'tipe'      => 'admin',
                'status'    => 'approved',
                'jenis'     => 'TEMPLATE_IDP',
            ]);
        }

        return back()->with('success', 'Template IDP berhasil diupload.');
    }
}
