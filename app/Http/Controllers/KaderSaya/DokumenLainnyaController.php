<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Dokumen;
use App\Models\Kader;
use App\Support\UploadName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Tab "Dokumen" pada detail Kader Saya berisi dua bagian:
 *  - Perjanjian Kerja  : wajib, satu file per kader (App\Http\Controllers\KaderSaya\PerjanjianKerjaController)
 *  - Dokumen Lainnya   : opsional, boleh banyak file per kader — dikelola di sini.
 *
 * Semua file di sini tersimpan sebagai dokumen.jenis = 'LAINNYA' (Kategori File "Lainnya")
 * dengan dokumen.kader_id = kader.id, sama seperti PERJANJIAN_KERJA (lihat App\Support\KaderRelations
 * soal kader_id yang bisa berisi kader.id ATAU users.id).
 *
 * Upload & hapus HANYA Admin MAI (company_code 021); Mentor boleh melihat & mengunduh
 * dokumen kader yang dibinanya.
 */
class DokumenLainnyaController extends Controller
{
    /** Batas per sekali submit — menahan request kelewat besar, bukan batas total per kader. */
    private const MAX_FILES   = 10;
    private const MAX_SIZE_KB = 5120;
    private const ALLOWED     = 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png';

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function store(Request $request, $kader_id)
    {
        $request->validate([
            'files'   => 'required|array|min:1|max:' . self::MAX_FILES,
            'files.*' => 'file|mimes:' . self::ALLOWED . '|max:' . self::MAX_SIZE_KB,
            'nama'    => 'nullable|array',
            'nama.*'  => 'nullable|string|max:150',
        ], [
            'files.required' => 'Pilih minimal satu dokumen untuk diupload.',
            'files.max'      => 'Maksimal ' . self::MAX_FILES . ' dokumen per sekali upload.',
            'files.*.mimes'  => 'Format dokumen harus PDF, Word, Excel, PowerPoint, atau gambar (JPG/PNG).',
            'files.*.max'    => 'Ukuran setiap dokumen maksimal 5 MB.',
            'nama.*.max'     => 'Nama dokumen maksimal 150 karakter.',
        ]);

        $user  = Auth::user();
        $kader = Kader::where('id', $kader_id)->firstOrFail();

        $this->authorizeManage($user);

        $dir = public_path('uploads/dokumen_kader/' . $kader_id);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $labels = $request->input('nama', []);
        $saved  = 0;

        foreach ($request->file('files') as $i => $file) {
            $ext = $file->getClientOriginalExtension();

            // Label dari admin dipakai apa adanya sebagai nama tampil (spasi & kapital
            // dipertahankan), seperti menu Upload > Dokumen — dokumen lainnya tidak punya
            // jenis baku, jadi nama yang diketik admin justru informasi utamanya.
            // Bila dikosongkan, jatuh ke nama file asli.
            $label = trim((string) ($labels[$i] ?? ''));
            if ($label === '') {
                $label = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            }
            $label = mb_substr($label, 0, 150);

            // Nama di disk tetap lewat UploadName agar unik & aman dari karakter aneh.
            $storedName = UploadName::stored([$kader_id, 'dokumen', $label], $ext);
            $file->move($dir, $storedName);

            Dokumen::create([
                'kader_id'  => $kader_id,
                'mentor_id' => $user->id,
                'nama_file' => $label . '.' . strtolower($ext),
                'path_file' => 'uploads/dokumen_kader/' . $kader_id . '/' . $storedName,
                'tipe'      => 'admin',
                // Dokumen lainnya bukan bagian alur approval (lihat ApprovalController yang
                // hanya menangani POST_ACTIVITY/FORM_IDP/WEEKLY_FEEDBACK), jadi tanpa status.
                'status'    => null,
                'jenis'     => 'LAINNYA',
            ]);

            $saved++;
        }

        ActivityLog::activity_log("Upload {$saved} Dokumen Lainnya untuk Kader {$kader->nama}");

        return back()->with('dokumenSuccess', $saved . ' dokumen berhasil diupload.');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $doc  = $this->findKaderDoc($id);

        $this->authorizeManage($user);

        $path = public_path($doc->path_file);
        if (file_exists($path)) {
            unlink($path);
        }
        $doc->delete();

        ActivityLog::activity_log("Hapus Dokumen Lainnya ID {$id}");

        return back()->with('dokumenSuccess', 'Dokumen berhasil dihapus.');
    }

    /**
     * ?inline=1 menampilkan dokumen di tab browser (tombol "mata" di tab Dokumen);
     * tanpa parameter itu tetap mengunduh.
     */
    public function download(Request $request, $id)
    {
        $user = Auth::user();
        $doc  = $this->findKaderDoc($id);

        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';

        if (!$isAdmin021 && !$isMentor) {
            abort(403);
        }

        $path = public_path($doc->path_file);
        if (!file_exists($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return response()->download($path, $doc->nama_file, [], $disposition);
    }

    /**
     * Hanya dokumen LAINNYA yang terikat kader — baris LAINNYA dari menu
     * Upload > Dokumen (kader_id NULL) dikelola lewat menunya sendiri.
     */
    private function findKaderDoc($id): Dokumen
    {
        return Dokumen::where('id', $id)
            ->where('jenis', 'LAINNYA')
            ->whereNotNull('kader_id')
            ->firstOrFail();
    }

    private function authorizeManage($user): void
    {
        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';

        if (!$isAdmin021) {
            abort(403, 'Hanya Admin MAI yang dapat mengelola dokumen lainnya.');
        }
    }
}
