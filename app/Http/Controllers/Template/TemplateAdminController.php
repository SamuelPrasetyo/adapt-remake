<?php

namespace App\Http\Controllers\Template;

use App\Http\Controllers\Controller;
use App\Models\Dokumen;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateAdminController extends Controller
{
    public function index()
    {
        $templatePk  = Dokumen::where('jenis', 'TEMPLATE_PERJANJIAN_KERJA')->latest()->first();
        $templateWf  = Dokumen::where('jenis', 'TEMPLATE_WEEKLY_FEEDBACK')->latest()->first();
        $templateIdp = Dokumen::where('jenis', 'TEMPLATE_IDP')->latest()->first();

        $idpUploads = Dokumen::where('dokumen.jenis', 'FORM_IDP')
            ->join('users as u', 'dokumen.kader_id', '=', 'u.id')
            ->leftJoin('batch as b', 'dokumen.id_batch', '=', 'b.id_batch')
            ->orderBy('dokumen.created_at', 'desc')
            ->get(['dokumen.id', 'dokumen.nama_file', 'dokumen.path_file', 'dokumen.status',
                   'dokumen.rejection_reason', 'dokumen.created_at', 'u.name as kader_nama', 'b.nama_batch']);

        return Inertia::render('Template/Index', [
            'templatePerjanjianKerja' => $templatePk ? [
                'nama_file'  => $templatePk->nama_file,
                'path_file'  => $templatePk->path_file,
                'created_at' => $templatePk->created_at,
            ] : null,
            'templateWeeklyFeedback' => $templateWf ? [
                'nama_file'  => $templateWf->nama_file,
                'path_file'  => $templateWf->path_file,
                'created_at' => $templateWf->created_at,
            ] : null,
            'templateIdp' => $templateIdp ? [
                'nama_file'  => $templateIdp->nama_file,
                'path_file'  => $templateIdp->path_file,
                'created_at' => $templateIdp->created_at,
            ] : null,
            'idpUploads' => $idpUploads,
        ]);
    }

    public function uploadPerjanjianKerja(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,pdf,docx|max:10240',
        ]);

        $this->replaceTemplate(
            $request,
            'TEMPLATE_PERJANJIAN_KERJA',
            'uploads/template_perjanjian_kerja',
            'template_perjanjian_kerja'
        );

        return back()->with('success', 'Template Perjanjian Kerja berhasil diupload.');
    }

    public function uploadWeeklyFeedback(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,pdf,docx|max:10240',
        ]);

        $this->replaceTemplate(
            $request,
            'TEMPLATE_WEEKLY_FEEDBACK',
            'uploads/template_weekly_feedback',
            'template_weekly_feedback'
        );

        return back()->with('success', 'Template Weekly Feedback berhasil diupload.');
    }

    private function replaceTemplate(Request $request, string $jenis, string $dir, string $prefix): void
    {
        $folder = public_path($dir);
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        $ext      = $request->file('file')->extension();
        $fileName = $prefix . '_' . now()->format('Ymd_His') . '.' . $ext;
        $request->file('file')->move($folder, $fileName);

        $existing = Dokumen::where('jenis', $jenis)->first();
        if ($existing) {
            $oldPath = public_path($existing->path_file);
            if ($existing->path_file && file_exists($oldPath)) {
                @unlink($oldPath);
            }
            $existing->update([
                'nama_file' => $request->file('file')->getClientOriginalName(),
                'path_file' => $dir . '/' . $fileName,
            ]);
        } else {
            Dokumen::create([
                'nama_file' => $request->file('file')->getClientOriginalName(),
                'path_file' => $dir . '/' . $fileName,
                'tipe'      => 'admin',
                'status'    => 'approved',
                'jenis'     => $jenis,
            ]);
        }
    }
}
