<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ArsipDokumenController extends Controller
{
    public function index()
    {
        // Gunakan CONVERT + COLLATE seperti ApprovalController agar join kader_id (char/binary)
        // dengan users.id tidak menyebabkan collation mismatch error di MySQL.
        $dokumens = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('batch as b', 'd.id_batch', '=', 'b.id_batch')
            ->orderBy('d.created_at', 'desc')
            ->get([
                'd.id',
                'd.nama_file',
                'd.path_file',
                'd.jenis',
                'd.tipe',
                'd.status',
                'd.kader_id',
                'd.id_batch',
                'd.rejection_reason',
                'd.approved_at',
                'd.mentor_approved_at',
                'd.created_at',
                'ku.name as kader_nama',
                'ku.company_code as kader_bu',
                'b.nama_batch',
            ]);

        $batches = Batch::orderByDesc('id_batch')->get(['id_batch', 'nama_batch']);

        return Inertia::render('ArsipDokumen/Index', [
            'dokumens' => $dokumens,
            'batches'  => $batches,
        ]);
    }
}
