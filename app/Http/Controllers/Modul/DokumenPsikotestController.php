<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Models\User;
use App\Support\UploadName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Menu "Upload > Dokumen Psikotest" — khusus Admin MAI (021), route dijaga can:isAdmin021.
 *
 * Menampilkan daftar kader per batch dalam satu tabel; tiap baris punya tombol upload
 * sendiri supaya hasil psikotest bisa diupload beruntun tanpa membuka detail tiap kader.
 *
 * Satu file per kader: tersimpan sebagai dokumen.jenis = 'PSIKOTEST' dengan
 * dokumen.kader_id = kader.id (pola sama dengan PERJANJIAN_KERJA). Upload ulang
 * menggantikan file lama.
 */
class DokumenPsikotestController extends Controller
{
    private const MAX_SIZE_KB = 2048;
    private const ALLOWED     = 'pdf,jpg,jpeg,png';

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        // Filter batch: default ke batch yang sedang berjalan; 'all' = semua batch.
        $batches     = Batch::newestFirst()->get(['id_batch', 'nama_batch', 'tahun_batch']);
        $batchFilter = $request->query('batch_id', optional(Batch::current())->id_batch);
        $idBatch     = ($batchFilter === 'all') ? null : $batchFilter;

        // Kader Non Aktif tetap ditampilkan (berkasnya tetap perlu diarsipkan), ditandai di UI.
        $kaders = Kader::select(
                'kader.id',
                'kader.nik',
                'kader.nama',
                'kader.deactivated_at',
                'company.company_shortname as bu',
                'batch.nama_batch',
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->when($idBatch, fn ($q) => $q->where('kader.id_batch', $idBatch))
            ->orderBy('kader.nama')
            ->get();

        // Urut lama → baru lalu keyBy: bila ada baris ganda, yang terbaru yang dipakai.
        $docs = Dokumen::where('jenis', 'PSIKOTEST')
            ->whereIn('kader_id', $kaders->pluck('id'))
            ->orderBy('created_at')
            ->get(['id', 'kader_id', 'nama_file', 'path_file', 'mentor_id', 'created_at'])
            ->keyBy('kader_id');

        $uploaderNames = User::whereIn('id', $docs->pluck('mentor_id')->filter()->unique())
            ->pluck('name', 'id');

        // path_file sengaja TIDAK diteruskan ke frontend: lihat/unduh lewat route
        // psikotest.file, bukan link langsung ke folder public.
        $rows = $kaders->map(function ($k) use ($docs, $uploaderNames) {
            $doc = $docs->get($k->id);

            return [
                'id'           => $k->id,
                'nik'          => $k->nik,
                'nama'         => $k->nama,
                'bu'           => $k->bu,
                'nama_batch'   => $k->nama_batch,
                'is_nonaktif'  => $k->deactivated_at !== null,
                'has_file'     => $doc !== null,
                'psikotest'    => $doc ? [
                    'id'               => $doc->id,
                    'nama_file'        => $doc->nama_file,
                    'created_at'       => $doc->created_at,
                    'uploaded_by_name' => $uploaderNames[$doc->mentor_id] ?? '—',
                    'size_bytes'       => $this->fileSize($doc->path_file),
                ] : null,
            ];
        })->values();

        return Inertia::render('DokumenPsikotest/Index', [
            'kaders'      => $rows,
            'batches'     => $batches,
            'batchFilter' => $batchFilter !== null ? (string) $batchFilter : 'all',
        ]);
    }

    public function store(Request $request, $kader_id)
    {
        $request->validate([
            'file' => 'required|file|mimes:' . self::ALLOWED . '|max:' . self::MAX_SIZE_KB,
        ], [
            'file.required' => 'Pilih file psikotest untuk diupload.',
            'file.mimes'    => 'Format file harus PDF, JPG, atau PNG.',
            'file.max'      => 'Ukuran file maksimal 2 MB.',
        ]);

        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->firstOrFail();

        // Satu file per kader — file & baris lama dibuang sebelum menyimpan yang baru.
        $this->deleteExisting($kader_id);

        $file       = $request->file('file');
        $ext        = $file->getClientOriginalExtension();
        $nameParts  = [$kader_id, 'psikotest', $kader->nama];
        $storedName = UploadName::stored($nameParts, $ext);
        $dir        = public_path('uploads/psikotest/' . $kader_id);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $file->move($dir, $storedName);

        Dokumen::create([
            'kader_id'  => $kader_id,
            'mentor_id' => $user->id,
            'id_batch'  => $kader->id_batch,
            'nama_file' => UploadName::display($nameParts, $ext),
            'path_file' => 'uploads/psikotest/' . $kader_id . '/' . $storedName,
            'tipe'      => 'admin',
            // Bukan bagian alur approval, jadi tanpa status.
            'status'    => null,
            'jenis'     => 'PSIKOTEST',
        ]);

        ActivityLog::activity_log("Upload Dokumen Psikotest untuk Kader {$kader->nama}");

        return back()->with('success', "Dokumen psikotest {$kader->nama} berhasil diupload.");
    }

    public function destroy($id)
    {
        $doc   = $this->findDoc($id);
        $nama  = Kader::where('id', $doc->kader_id)->value('nama') ?? '';

        $this->deleteFile($doc);
        $doc->delete();

        ActivityLog::activity_log("Hapus Dokumen Psikotest Kader {$nama} (ID {$id})");

        return back()->with('success', 'Dokumen psikotest berhasil dihapus.');
    }

    /**
     * ?inline=1 menampilkan file di tab browser (tombol "Lihat"); tanpa itu mengunduh.
     */
    public function file(Request $request, $id)
    {
        $doc  = $this->findDoc($id);
        $path = public_path($doc->path_file);

        if (!is_file($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return response()->download($path, $doc->nama_file, [], $disposition);
    }

    private function findDoc($id): Dokumen
    {
        return Dokumen::where('id', $id)->where('jenis', 'PSIKOTEST')->firstOrFail();
    }

    private function deleteExisting($kader_id): void
    {
        Dokumen::where('kader_id', $kader_id)
            ->where('jenis', 'PSIKOTEST')
            ->get()
            ->each(function ($old) {
                $this->deleteFile($old);
                $old->delete();
            });
    }

    private function deleteFile(Dokumen $doc): void
    {
        $path = public_path($doc->path_file);
        if (is_file($path)) {
            unlink($path);
        }
    }

    private function fileSize(?string $pathFile): ?int
    {
        if (!$pathFile) return null;

        $full = public_path($pathFile);

        return is_file($full) ? (filesize($full) ?: null) : null;
    }
}
