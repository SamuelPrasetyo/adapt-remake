<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Models\Week;
use App\Support\UploadName;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Weekly Feedback — file laporan mingguan yang diupload Kader (docx/xlsx/pdf, maks 2MB),
 * terikat ke jadwal `weeks` per batch, dan butuh approval Mentor saja.
 *
 * Satu baris per (kader, week). Setelah upload, slot terkunci sampai Mentor bereaksi:
 * Approved = selesai, Reject = minta upload ulang (re-upload menimpa baris yang sama).
 * Pola dokumen mengikuti Modul\FormIdpController.
 */
class WeeklyFeedbackController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $user    = auth()->user();
        $kader   = Kader::where('nik', $user->nik)->first();
        $idBatch = $kader ? $kader->id_batch : null;

        $weekRows = $idBatch
            ? Week::forBatch($idBatch)->orderBy('angka_week')
                ->get(['id_week', 'angka_week', 'bulan', 'tahun', 'tanggal_mulai'])
            : collect();
        $weekMeta = $weekRows->keyBy('id_week');

        // Semua upload weekly feedback milik kader ini (1 baris per week).
        $docs = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'WEEKLY_FEEDBACK')
            ->get(['id', 'nama_file', 'path_file', 'status', 'rejection_reason',
                   'id_week', 'created_at', 'updated_at']);
        $docByWeek = $docs->keyBy('id_week');

        $today = now()->toDateString();

        // Dropdown: tampilkan SEMUA week batch; UI men-disable yang belum berjalan,
        // sedang pending, atau sudah approved. Week yang ditolak tetap bisa dipilih
        // untuk upload ulang. Validasi anti-fraud tetap ketat di store().
        $weeks = $weekRows->map(function ($w) use ($docByWeek, $today) {
            $doc = $docByWeek->get($w->id_week);
            return [
                'id_week'      => $w->id_week,
                'angka_week'   => $w->angka_week,
                'bulan'        => $w->bulan,
                'tahun'        => $w->tahun,
                'is_available' => $w->tanggal_mulai && $w->tanggal_mulai->toDateString() <= $today,
                'status'       => $doc->status ?? 'none',
            ];
        })->values();

        // Arsip/history per week (urut week desc).
        $history = $docs->map(function ($d) use ($weekMeta) {
            $w = $weekMeta->get($d->id_week);
            return [
                'id'               => $d->id,
                'nama_file'        => $d->nama_file,
                'path_file'        => $d->path_file,
                'status'           => $d->status,
                'rejection_reason' => $d->rejection_reason,
                'id_week'          => $d->id_week,
                'angka_week'       => $w->angka_week ?? null,
                'bulan'            => $w->bulan ?? null,
                'tahun'            => $w->tahun ?? null,
                'created_at'       => $d->created_at,
                'updated_at'       => $d->updated_at,
            ];
        })->sortByDesc('angka_week')->values();

        $template = Dokumen::where('jenis', 'TEMPLATE_WEEKLY_FEEDBACK')->latest()->first();

        return Inertia::render('WeeklyFeedback/Index', [
            'weeks'    => $weeks,
            'history'  => $history,
            'hasBatch' => $idBatch !== null,
            'template' => $template ? [
                'nama_file' => $template->nama_file,
                'path_file' => $template->path_file,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_week' => 'required|integer',
            'file'    => 'required|file|mimes:docx,xlsx,pdf|max:2048',
        ]);

        $user  = auth()->user();
        $kader = Kader::where('nik', $user->nik)->first();

        if (!$kader || $kader->id_batch === null) {
            return back()->withErrors(['file' => 'Batch Kader belum ditentukan. Hubungi Admin.']);
        }
        $idBatch = $kader->id_batch;

        // Anti-fraud: week harus milik batch kader & sudah berjalan (tak bisa minggu depan).
        $week = Week::available()
            ->where('id_week', $request->id_week)
            ->forBatch($idBatch)
            ->first();
        if (!$week) {
            return back()->withErrors(['file' => 'Week tidak valid atau belum waktunya.']);
        }

        // Satu baris per (kader, week). Blokir bila masih pending / sudah approved.
        $existing = Dokumen::where('kader_id', $user->id)
            ->where('jenis', 'WEEKLY_FEEDBACK')
            ->where('id_week', $request->id_week)
            ->first();

        if ($existing && in_array($existing->status, ['pending', 'approved'], true)) {
            $msg = $existing->status === 'approved'
                ? 'File minggu ini sudah disetujui Mentor dan tidak dapat diubah.'
                : 'File minggu ini masih menunggu review Mentor.';
            return back()->withErrors(['file' => $msg]);
        }

        $folder = public_path('uploads/weekly_feedback/' . $user->id);
        if (!file_exists($folder)) {
            mkdir($folder, 0755, true);
        }

        // Format nama: idkader_weekly_feedback_namakader_weekN
        $ext       = $request->file('file')->extension();
        $nameParts = [$user->id, 'weekly_feedback', $user->name, 'week' . $week->angka_week];
        $fileName  = UploadName::stored($nameParts, $ext);
        $request->file('file')->move($folder, $fileName);

        $relPath = 'uploads/weekly_feedback/' . $user->id . '/' . $fileName;

        try {
            if ($existing) {
                // Re-upload setelah ditolak — perbarui baris yang sama, hapus file lama.
                $oldPath = public_path($existing->path_file);
                if ($existing->path_file && file_exists($oldPath)) {
                    @unlink($oldPath);
                }
                $existing->update([
                    'nama_file'        => UploadName::display($nameParts, $ext),
                    'path_file'        => $relPath,
                    'status'           => 'pending',
                    'approved_by'      => null,
                    'approved_at'      => null,
                    'rejection_reason' => null,
                    'rejected_by_role' => null,
                ]);
            } else {
                Dokumen::create([
                    'nama_file' => UploadName::display($nameParts, $ext),
                    'path_file' => $relPath,
                    'tipe'      => 'kader',
                    'status'    => 'pending',
                    'jenis'     => 'WEEKLY_FEEDBACK',
                    'kader_id'  => $user->id,
                    'id_batch'  => $idBatch,
                    'id_week'   => $request->id_week,
                ]);
            }
        } catch (\Illuminate\Database\QueryException $e) {
            // Insert/update gagal (mis. double-submit kena unique index) —
            // hapus file yang baru dipindah agar tidak jadi sampah di disk.
            @unlink($folder . '/' . $fileName);
            return back()->withErrors(['file' => 'Upload gagal diproses. Silakan muat ulang halaman dan coba lagi.']);
        }

        ActivityLog::activity_log('Upload Weekly Feedback (Week ID ' . $request->id_week . ')');

        return back()->with('success', 'File Weekly Feedback berhasil diupload.');
    }
}
