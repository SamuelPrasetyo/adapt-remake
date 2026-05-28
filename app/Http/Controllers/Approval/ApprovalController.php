<?php

namespace App\Http\Controllers\Approval;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Dokumen;
use App\Models\PenilaianOjt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $ojtBase = DB::table('penilaian_ojt as p')
            ->leftJoin('kader', DB::raw('p.kader_id COLLATE utf8mb4_unicode_ci'), '=', DB::raw('kader.id COLLATE utf8mb4_unicode_ci'))
            ->leftJoin('company', DB::raw('kader.company_code COLLATE utf8mb4_unicode_ci'), '=', DB::raw('company.company_code COLLATE utf8mb4_unicode_ci'))
            ->leftJoin('users as creator', DB::raw('p.created_by COLLATE utf8mb4_unicode_ci'), '=', DB::raw('creator.id COLLATE utf8mb4_unicode_ci'))
            ->whereNotNull('p.final_score');

        $ojtPending = (clone $ojtBase)
            ->where('p.approval_status', 'pending')
            ->orderBy('p.updated_at', 'desc')
            ->get(['p.kader_id','p.fmc_number','p.final_score','p.updated_at',
                   'kader.nama as kader_nama','company.company_shortname as bu','creator.name as mentor_nama']);

        $ojtApproved = (clone $ojtBase)
            ->where('p.approval_status', 'approved')
            ->orderBy('p.approved_at', 'desc')
            ->limit(50)
            ->get(['p.kader_id','p.fmc_number','p.final_score','p.updated_at','p.approved_at',
                   'kader.nama as kader_nama','company.company_shortname as bu','creator.name as mentor_nama']);

        $paBase = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('users as mu', DB::raw('CONVERT(d.mentor_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'mu.id')
            ->leftJoin('modul as m', 'd.modul_id', '=', 'm.id')
            ->where('d.jenis', 'POST_ACTIVITY');

        $paPending = (clone $paBase)
            ->where('d.status', 'pending')
            ->orderBy('d.created_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.tipe','d.created_at','m.nama_modul',
                   DB::raw('COALESCE(ku.name, mu.name) as uploader_nama')]);

        $paApproved = (clone $paBase)
            ->where('d.status', 'approved')
            ->orderBy('d.approved_at', 'desc')
            ->limit(50)
            ->get(['d.id','d.nama_file','d.path_file','d.tipe','d.created_at','d.approved_at','m.nama_modul',
                   DB::raw('COALESCE(ku.name, mu.name) as uploader_nama')]);

        return Inertia::render('Approval/Index', [
            'ojtPending'  => $ojtPending,
            'paPending'   => $paPending,
            'ojtApproved' => $ojtApproved,
            'paApproved'  => $paApproved,
        ]);
    }

    public function approveOjt($kader_id, $fmc)
    {
        $penilaian = $this->findOjt($kader_id, $fmc);

        $penilaian->update([
            'approval_status'  => 'approved',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => null,
        ]);

        ActivityLog::activity_log("Approve Penilaian OJT FMC-{$fmc} (Kader ID {$kader_id})");

        return back()->with('approvalSuccess', "Penilaian OJT FMC-{$fmc} disetujui.");
    }

    public function rejectOjt(Request $request, $kader_id, $fmc)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $penilaian = $this->findOjt($kader_id, $fmc);

        $penilaian->update([
            'approval_status'  => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'approved_by'      => null,
            'approved_at'      => null,
        ]);

        ActivityLog::activity_log("Tolak Penilaian OJT FMC-{$fmc} (Kader ID {$kader_id})");

        return back()->with('approvalSuccess', "Penilaian OJT FMC-{$fmc} ditolak.");
    }

    public function approvePostActivity(Dokumen $dokumen)
    {
        $dokumen->update([
            'status'           => 'approved',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => null,
        ]);

        ActivityLog::activity_log("Approve Post Activity (Dokumen ID {$dokumen->id})");

        return back()->with('approvalSuccess', 'Post Activity disetujui.');
    }

    public function rejectPostActivity(Request $request, Dokumen $dokumen)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $dokumen->update([
            'status'           => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'approved_by'      => null,
            'approved_at'      => null,
        ]);

        ActivityLog::activity_log("Tolak Post Activity (Dokumen ID {$dokumen->id})");

        return back()->with('approvalSuccess', 'Post Activity ditolak.');
    }

    private function findOjt($kader_id, $fmc): PenilaianOjt
    {
        return PenilaianOjt::where('kader_id', $kader_id)
            ->where('fmc_number', (int) $fmc)
            ->firstOrFail();
    }
}
