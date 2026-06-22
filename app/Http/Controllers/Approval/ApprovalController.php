<?php

namespace App\Http\Controllers\Approval;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Dokumen;
use App\Models\PenilaianOjt;
use App\Models\PenilaianPostActivity;
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
            ->get(['p.kader_id','p.fmc_number','p.final_score','p.updated_at','p.approved_at',
                   'kader.nama as kader_nama','company.company_shortname as bu','creator.name as mentor_nama']);

        // Akun users Mentor dipakai bersama satu Business Unit; orang yang sebenarnya upload
        // ada di dokumen.mentor_master_id (record mentor terpilih). Ambil nama record mentor +
        // BU-nya (company_shortname), fallback ke nama akun users bila tak ada record terpilih.
        // Untuk uploader Kader, BU diambil lewat ku.nik = kader.nik (dokumen.kader_id = users.id,
        // bukan kader.id — sama seperti jembatan NIK di mentorKaderNiks()).
        $paBase = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('users as mu', DB::raw('CONVERT(d.mentor_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'mu.id')
            ->leftJoin('mentor as mt', 'd.mentor_master_id', '=', 'mt.id')
            ->leftJoin('company as co', 'mt.company_code', '=', 'co.company_code')
            ->leftJoin('kader as k', DB::raw('ku.nik COLLATE utf8mb4_unicode_ci'), '=', DB::raw('k.nik COLLATE utf8mb4_unicode_ci'))
            ->leftJoin('company as co2', 'k.company_code', '=', 'co2.company_code')
            ->leftJoin('modul as m', 'd.modul_id', '=', 'm.id')
            ->leftJoin('penilaian_post_activity as pa', 'pa.dokumen_id', '=', 'd.id')
            ->where('d.jenis', 'POST_ACTIVITY');

        $paPending = (clone $paBase)
            ->where('d.status', 'pending')
            ->orderBy('d.created_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.tipe','d.created_at','m.nama_modul',
                   DB::raw('COALESCE(co.company_shortname, co2.company_shortname) as uploader_bu'),
                   'd.modul_id','d.mentor_id','d.mentor_master_id','d.kader_id',
                   DB::raw('COALESCE(ku.name, mt.nama, mu.name) as uploader_nama')]);

        $paApproved = (clone $paBase)
            ->where('d.status', 'approved')
            ->orderBy('d.approved_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.tipe','d.created_at','d.approved_at','m.nama_modul','pa.nilai',
                   DB::raw('COALESCE(co.company_shortname, co2.company_shortname) as uploader_bu'),
                   DB::raw('COALESCE(ku.name, mt.nama, mu.name) as uploader_nama')]);

        // Post Activity Mentor = 10 sesi berurutan; sesi 1-9 cukup di-approve, sesi ke-10 (sesi terakhir)
        // baru diberi nilai. Hitung nomor sesi tiap dokumen pending agar UI tahu tombol mana yang dipakai.
        foreach ($paPending as $r) {
            $r->required_sessions = $this->paRequiredSessions($r->tipe);
            $r->session_no = $this->paApprovedCount($r) + 1;
            $r->is_scoring = $r->session_no >= $r->required_sessions;
        }

        $idpBase = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('batch as b', 'd.id_batch', '=', 'b.id_batch')
            ->where('d.jenis', 'FORM_IDP');

        // Admin MAI melihat IDP yang masih menunggu Mentor (pending) maupun yang sudah
        // di-approve Mentor (mentor_approved). Yang siap di-approve Admin tampil lebih dulu.
        $idpPending = (clone $idpBase)
            ->whereIn('d.status', ['pending', 'mentor_approved'])
            ->orderByRaw("FIELD(d.status, 'mentor_approved', 'pending')")
            ->orderBy('d.created_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.status','d.mentor_approved_at','d.created_at','ku.name as kader_nama','b.nama_batch']);

        $idpApproved = (clone $idpBase)
            ->where('d.status', 'approved')
            ->orderBy('d.approved_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.created_at','d.approved_at','ku.name as kader_nama','b.nama_batch']);

        return Inertia::render('Approval/Index', [
            'ojtPending'  => $ojtPending,
            'paPending'   => $paPending,
            'ojtApproved' => $ojtApproved,
            'paApproved'  => $paApproved,
            'idpPending'  => $idpPending,
            'idpApproved' => $idpApproved,
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

    public function approvePostActivity(Request $request, Dokumen $dokumen)
    {
        // Nilai hanya diberikan pada sesi terakhir (ke-10 untuk Mentor / ke-1 untuk Kader).
        // Sesi sebelumnya cukup di-approve tanpa nilai.
        $required = $this->paRequiredSessions($dokumen->tipe);
        $sessionNo = $this->paApprovedCount($dokumen, $dokumen->id) + 1;
        $isScoring = $sessionNo >= $required;

        $rules = ['catatan' => 'nullable|string'];
        if ($isScoring) {
            $rules['nilai'] = 'required|numeric|min:0|max:100';
        }
        $validated = $request->validate($rules);

        $dokumen->update([
            'status'           => 'approved',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => null,
        ]);

        if ($isScoring) {
            // Skor disimpan di tabel khusus penilaian_post_activity (1:1 ke dokumen).
            PenilaianPostActivity::updateOrCreate(
                ['dokumen_id' => $dokumen->id],
                [
                    'nilai'      => $validated['nilai'],
                    'catatan'    => $validated['catatan'] ?? null,
                    'dinilai_by' => Auth::id(),
                    'dinilai_at' => now(),
                ]
            );

            ActivityLog::activity_log("Approve & nilai Post Activity sesi terakhir (Dokumen ID {$dokumen->id}, nilai {$validated['nilai']})");

            return back()->with('approvalSuccess', 'Post Activity sesi terakhir disetujui & dinilai.');
        }

        ActivityLog::activity_log("Approve Post Activity sesi {$sessionNo} (Dokumen ID {$dokumen->id})");

        return back()->with('approvalSuccess', "Post Activity sesi {$sessionNo} disetujui.");
    }

    /** Jumlah sesi Post Activity yang diwajibkan: Mentor 10 sesi coaching, Kader cukup 1. */
    private function paRequiredSessions(?string $tipe): int
    {
        return $tipe === 'mentor' ? 10 : 1;
    }

    /**
     * Jumlah sesi Post Activity yang sudah disetujui untuk scope uploader yang sama
     * (modul + record mentor, atau modul + kader). `$exceptId` mengecualikan dokumen tertentu.
     * Menerima Dokumen (Eloquent) atau row hasil query builder.
     */
    private function paApprovedCount($doc, $exceptId = null): int
    {
        $isMentor = $doc->tipe === 'mentor';

        return Dokumen::where('jenis', 'POST_ACTIVITY')
            ->where('modul_id', $doc->modul_id)
            ->where('status', 'approved')
            ->when($exceptId, fn($q) => $q->where('id', '!=', $exceptId))
            ->when($isMentor, function ($q) use ($doc) {
                $q->where('mentor_id', $doc->mentor_id);
                $doc->mentor_master_id
                    ? $q->where('mentor_master_id', $doc->mentor_master_id)
                    : $q->whereNull('mentor_master_id');
            })
            ->when(!$isMentor, fn($q) => $q->where('kader_id', $doc->kader_id))
            ->count();
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

    public function approveIdp(Dokumen $dokumen)
    {
        // Approval bertingkat: Admin MAI hanya boleh approve setelah Mentor approve.
        if ($dokumen->status !== 'mentor_approved') {
            return back()->with('error', 'Form IDP belum di-approve oleh Mentor.');
        }

        $dokumen->update([
            'status'           => 'approved',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => null,
        ]);

        ActivityLog::activity_log("Approve Form IDP (Dokumen ID {$dokumen->id})");

        return back()->with('approvalSuccess', 'Form IDP disetujui.');
    }

    public function rejectIdp(Request $request, Dokumen $dokumen)
    {
        $validated = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $dokumen->update([
            'status'             => 'rejected',
            'rejection_reason'   => $validated['rejection_reason'] ?? null,
            'rejected_by_role'   => 'admin',
            'approved_by'        => null,
            'approved_at'        => null,
            'mentor_approved_by' => null,
            'mentor_approved_at' => null,
        ]);

        ActivityLog::activity_log("Tolak Form IDP (Dokumen ID {$dokumen->id})");

        return back()->with('approvalSuccess', 'Form IDP ditolak.');
    }

    /* ──────────────── Mentor: approval tingkat pertama Form IDP ──────────────── */

    /**
     * Halaman approval Form IDP untuk Mentor. Menampilkan IDP milik Kader dari BU
     * yang sama dengan Mentor (konsisten dengan akses Perjanjian Kerja).
     */
    public function mentorIdp()
    {
        $user = Auth::user();
        $niks = $this->mentorKaderNiks($user);

        $base = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('batch as b', 'd.id_batch', '=', 'b.id_batch')
            ->where('d.jenis', 'FORM_IDP')
            ->whereIn('ku.nik', $niks->all());

        $pending = (clone $base)
            ->where('d.status', 'pending')
            ->orderBy('d.created_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.created_at','ku.name as kader_nama','b.nama_batch']);

        $processed = (clone $base)
            ->whereIn('d.status', ['mentor_approved', 'approved', 'rejected'])
            ->orderBy('d.updated_at', 'desc')
            ->get(['d.id','d.nama_file','d.path_file','d.status','d.rejection_reason',
                   'd.mentor_approved_at','d.created_at','ku.name as kader_nama','b.nama_batch']);

        return Inertia::render('Approval/MentorIdp', [
            'idpPending'   => $pending,
            'idpProcessed' => $processed,
        ]);
    }

    public function mentorApproveIdp(Dokumen $dokumen)
    {
        $this->authorizeMentorIdp($dokumen);

        if ($dokumen->status !== 'pending') {
            return back()->with('error', 'Form IDP ini sudah diproses.');
        }

        $dokumen->update([
            'status'             => 'mentor_approved',
            'mentor_approved_by' => Auth::id(),
            'mentor_approved_at' => now(),
            'rejection_reason'   => null,
        ]);

        ActivityLog::activity_log("Mentor approve Form IDP (Dokumen ID {$dokumen->id})");

        return back()->with('success', 'Form IDP disetujui & diteruskan ke Admin MAI.');
    }

    public function mentorRejectIdp(Request $request, Dokumen $dokumen)
    {
        $this->authorizeMentorIdp($dokumen);

        if ($dokumen->status !== 'pending') {
            return back()->with('error', 'Form IDP ini sudah diproses.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $dokumen->update([
            'status'             => 'rejected',
            'rejection_reason'   => $validated['rejection_reason'] ?? null,
            'rejected_by_role'   => 'mentor',
            'mentor_approved_by' => null,
            'mentor_approved_at' => null,
        ]);

        ActivityLog::activity_log("Mentor tolak Form IDP (Dokumen ID {$dokumen->id})");

        return back()->with('success', 'Form IDP ditolak.');
    }

    /* ──────────────── Mentor: approval Weekly Feedback (1 level, final) ──────────────── */

    /**
     * Halaman approval Weekly Feedback untuk Mentor — file laporan mingguan milik Kader
     * dari daftar kader BU-nya (cakupan per-mentor, konsisten dengan Form IDP).
     */
    public function mentorWeekly()
    {
        $user = Auth::user();
        $niks = $this->mentorKaderNiks($user);

        $base = DB::table('dokumen as d')
            ->leftJoin('users as ku', DB::raw('CONVERT(d.kader_id USING utf8mb4) COLLATE utf8mb4_unicode_ci'), '=', 'ku.id')
            ->leftJoin('weeks as w', 'd.id_week', '=', 'w.id_week')
            ->leftJoin('batch as b', 'd.id_batch', '=', 'b.id_batch')
            ->where('d.jenis', 'WEEKLY_FEEDBACK')
            ->whereIn('ku.nik', $niks->all());

        $cols = ['d.id', 'd.nama_file', 'd.path_file', 'd.status', 'd.rejection_reason',
                 'd.created_at', 'd.updated_at', 'ku.name as kader_nama',
                 'w.angka_week', 'w.bulan', 'w.tahun', 'b.nama_batch'];

        $pending = (clone $base)
            ->where('d.status', 'pending')
            ->orderBy('d.created_at', 'desc')
            ->get($cols);

        $processed = (clone $base)
            ->whereIn('d.status', ['approved', 'rejected'])
            ->orderBy('d.updated_at', 'desc')
            ->get($cols);

        return Inertia::render('Approval/MentorWeekly', [
            'pending'   => $pending,
            'processed' => $processed,
        ]);
    }

    public function mentorApproveWeekly(Dokumen $dokumen)
    {
        $this->authorizeMentorWeekly($dokumen);

        if ($dokumen->status !== 'pending') {
            return back()->with('error', 'File Weekly Feedback ini sudah diproses.');
        }

        $dokumen->update([
            'status'           => 'approved',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => null,
            'rejected_by_role' => null,
        ]);

        ActivityLog::activity_log("Mentor approve Weekly Feedback (Dokumen ID {$dokumen->id})");

        return back()->with('success', 'File Weekly Feedback disetujui.');
    }

    public function mentorRejectWeekly(Request $request, Dokumen $dokumen)
    {
        $this->authorizeMentorWeekly($dokumen);

        if ($dokumen->status !== 'pending') {
            return back()->with('error', 'File Weekly Feedback ini sudah diproses.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $dokumen->update([
            'status'           => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'rejected_by_role' => 'mentor',
            'approved_by'      => null,
            'approved_at'      => null,
        ]);

        ActivityLog::activity_log("Mentor tolak Weekly Feedback (Dokumen ID {$dokumen->id})");

        return back()->with('success', 'File Weekly Feedback ditolak.');
    }

    /** Mentor hanya boleh memproses Weekly Feedback milik Kader di daftar kader BU-nya. */
    private function authorizeMentorWeekly(Dokumen $dokumen): void
    {
        if ($dokumen->jenis !== 'WEEKLY_FEEDBACK') {
            abort(404);
        }
        $user     = Auth::user();
        $niks     = $this->mentorKaderNiks($user);
        $kaderNik = DB::table('users')->where('id', $dokumen->kader_id)->value('nik');

        if (!$kaderNik || !$niks->contains($kaderNik)) {
            abort(403, 'File Weekly Feedback ini bukan milik Kader dari daftar Anda.');
        }
    }

    /** Mentor hanya boleh memproses IDP milik Kader yang ada di daftar kader BU-nya. */
    private function authorizeMentorIdp(Dokumen $dokumen): void
    {
        $user     = Auth::user();
        $niks     = $this->mentorKaderNiks($user);
        $kaderNik = DB::table('users')->where('id', $dokumen->kader_id)->value('nik');

        if (!$kaderNik || !$niks->contains($kaderNik)) {
            abort(403, 'Form IDP ini bukan milik Kader dari daftar Anda.');
        }
    }

    /**
     * Daftar NIK Kader yang menjadi tanggung jawab Mentor (cakupan per-mentor) —
     * dipetakan langsung ke Mentor yang login: users.id -> mentor.user_id -> mentor.id
     * -> list_kader_per_mentor.mentor_id -> kader.id -> kader.nik.
     * dokumen.kader_id menyimpan users.id, sedangkan pemetaan memakai kader.id,
     * sehingga relasi dijembatani lewat NIK (users.nik = kader.nik).
     */
    private function mentorKaderNiks($user)
    {
        $mentorIds = DB::table('mentor')
            ->whereNull('deleted_at')
            ->where('user_id', $user->id)
            ->pluck('id');
        if ($mentorIds->isEmpty()) {
            return collect();
        }

        $kaderIds = DB::table('list_kader_per_mentor')
            ->whereNull('deleted_at')
            ->whereIn('mentor_id', $mentorIds->all())
            ->pluck('kader_id');
        if ($kaderIds->isEmpty()) {
            return collect();
        }

        return DB::table('kader')->whereIn('id', $kaderIds->all())->pluck('nik');
    }

    private function findOjt($kader_id, $fmc): PenilaianOjt
    {
        return PenilaianOjt::where('kader_id', $kader_id)
            ->where('fmc_number', (int) $fmc)
            ->firstOrFail();
    }
}
