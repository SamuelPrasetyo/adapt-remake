<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Kader;
use App\Support\KandidatAttachments;
use App\Support\KandidatData;
use App\Support\OfficeToPdf;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Export PDF tab Job Applicant (Kader Saya › detail).
 *
 * Dokumen dibentuk di server (dompdf) sebagai CV satu kolom A4 potret, lalu
 * frontend menggabungnya dengan berkas lampiran (CV, Ijazah, Transkrip, dan
 * Interview/Panel/Psikogram tiap lamaran) menjadi satu berkas PDF.
 * Penggabungan sengaja di sisi klien: berkas lampiran portal kerap PDF versi
 * >1.4 yang tidak terbaca pustaka merge PHP gratis.
 *
 * Seluruh endpoint di sini KHUSUS Admin MAI 021 — sama seperti tabnya, karena
 * isinya data pribadi kandidat (KTP, alamat, gaji, kontak keluarga, asesmen).
 */
class KandidatExportController extends Controller
{
    /** Batas ukuran berkas lampiran yang diproksikan (25 MB). */
    private const MAX_FILE_BYTES = 25 * 1024 * 1024;

    /** Dokumen profil (tanpa lampiran) — dipakai frontend sebagai halaman awal PDF. */
    public function pdf($kader_id)
    {
        [$kader, $kandidat] = $this->resolve($kader_id);

        $pdf = Pdf::loadView('pdf.kandidat', [
            'kandidat'    => $kandidat,
            'kader'       => $kader,
            'attachments' => KandidatAttachments::list($kandidat),
            'fotoData'    => $this->inlinePhoto($kandidat['profile']['foto'] ?? null),
        ])->setPaper('a4', 'portrait');

        ActivityLog::activity_log('Mengexport PDF Job Applicant kader ' . $kader->nama);

        return $pdf->stream('job-applicant.pdf');
    }

    /** Daftar lampiran berikut urutan gabungnya (frontend mengunduh lewat berkas()). */
    public function lampiran($kader_id)
    {
        [, $kandidat] = $this->resolve($kader_id);

        return response()->json([
            'attachments' => KandidatAttachments::list($kandidat),
        ]);
    }

    /**
     * Proksi unduh berkas kandidat dari portal Career MAI (server-to-server,
     * bebas CORS). Anti-SSRF: hanya URL di bawah base storage yang diizinkan.
     */
    public function berkas(Request $request)
    {
        $this->authorizeAdmin();

        $url  = (string) $request->query('url', '');
        $base = rtrim((string) config('services.career_mai.asset_url'), '/');

        if ($base === '' || !str_starts_with($url, $base . '/')) {
            abort(422, 'URL berkas tidak dikenali.');
        }

        try {
            $res = Http::timeout(30)->get($url);
        } catch (\Throwable $e) {
            Log::warning('[KandidatExport::berkas] gagal unduh berkas: ' . $e->getMessage());
            abort(502, 'Gagal mengunduh berkas dari portal Career MAI.');
        }

        if (!$res->successful()) {
            abort(404, 'Berkas tidak ditemukan di portal Career MAI.');
        }

        $body = $res->body();
        if (strlen($body) > self::MAX_FILE_BYTES) {
            abort(413, 'Berkas terlalu besar untuk digabung.');
        }

        // Berkas Word (CV kandidat banyak yang .docx) dikonversi dulu ke PDF di
        // sini, supaya penggabung di frontend cukup menangani PDF & gambar.
        $ext = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
        if (OfficeToPdf::isSupported($ext)) {
            $pdf = OfficeToPdf::convert($body, $ext);
            if ($pdf === null) {
                abort(415, 'Berkas Word tidak dapat dikonversi ke PDF.');
            }
            return response($pdf, 200, [
                'Content-Type'  => 'application/pdf',
                'X-Converted'   => $ext . '->pdf',
                'Cache-Control' => 'no-store',
            ]);
        }

        return response($body, 200, [
            'Content-Type'  => $res->header('Content-Type') ?: 'application/octet-stream',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * @return array{0:\App\Models\Kader,1:array}
     */
    private function resolve($kader_id): array
    {
        $this->authorizeAdmin();

        // Kader::find() tidak dipakai: primaryKey model ini array, jadi query eksplisit.
        $kader = Kader::where('id', $kader_id)->first();
        if (!$kader) {
            abort(404);
        }

        $kandidat = !empty($kader->nik_ktp) ? KandidatData::forKtp($kader->nik_ktp) : null;
        if (!$kandidat) {
            abort(404, 'Data kandidat tidak ditemukan untuk kader ini.');
        }

        return [$kader, $kandidat];
    }

    private function authorizeAdmin(): void
    {
        $user = Auth::user();
        if (!$user || $user->type !== 'Admin' || $user->company_code !== '021') {
            abort(403);
        }
    }

    /**
     * Foto kandidat disisipkan sebagai data URI, bukan URL: dompdf harus menembak
     * portal saat render (lambat/menggantung bila portal tak responsif), dan
     * kegagalannya menghentikan seluruh dokumen.
     */
    private function inlinePhoto(?string $url): ?string
    {
        if (!$url || !preg_match('#^https?://#i', $url)) {
            return null;
        }

        try {
            $res = Http::timeout(8)->get($url);
            if (!$res->successful()) {
                return null;
            }
            $type = $res->header('Content-Type') ?: 'image/jpeg';
            if (!str_starts_with($type, 'image/')) {
                return null;
            }
            return 'data:' . $type . ';base64,' . base64_encode($res->body());
        } catch (\Throwable $e) {
            Log::warning('[KandidatExport::inlinePhoto] gagal ambil foto: ' . $e->getMessage());
            return null;
        }
    }
}
