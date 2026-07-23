<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;

/**
 * Konversi berkas Word (.doc/.docx/.rtf) menjadi PDF agar bisa digabung ke
 * Export PDF Job Applicant — CV kandidat di portal Career MAI banyak yang .docx.
 *
 * Dua jalur, dicoba berurutan:
 *  1. LibreOffice headless (paling setia pada tata letak asli) bila binernya ada.
 *     Setel path-nya lewat env LIBREOFFICE_PATH.
 *  2. PhpWord + dompdf — murni PHP, jalan di mana saja. Tata letak rumit
 *     (kolom, header/footer, sebagian gambar) bisa berubah, tetapi isi tetap
 *     terbaca dan berkasnya ikut tergabung.
 */
class OfficeToPdf
{
    /** Ekstensi yang bisa dikonversi → format reader PhpWord. */
    private const READERS = [
        'docx' => 'Word2007',
        'doc'  => 'MsDoc',
        'rtf'  => 'RTF',
        'odt'  => 'ODText',
    ];

    public static function isSupported(string $ext): bool
    {
        return isset(self::READERS[strtolower($ext)]);
    }

    /**
     * @param  string $bytes isi berkas Word
     * @param  string $ext   ekstensi asli (docx|doc|rtf|odt)
     * @return string|null   isi berkas PDF, atau null bila gagal
     */
    public static function convert(string $bytes, string $ext): ?string
    {
        $ext = strtolower($ext);
        if (!self::isSupported($ext)) {
            return null;
        }

        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kandidat-pdf-' . bin2hex(random_bytes(6));
        if (!mkdir($dir) && !is_dir($dir)) {
            return null;
        }

        $src = $dir . DIRECTORY_SEPARATOR . 'berkas.' . $ext;
        file_put_contents($src, $bytes);

        try {
            return self::viaLibreOffice($src, $dir) ?? self::viaPhpWord($src, $ext, $dir);
        } finally {
            self::cleanup($dir);
        }
    }

    /**
     * LibreOffice menulis hasilnya sebagai <nama>.pdf di --outdir. Prosesnya
     * diberi profil pengguna sendiri (-env:UserInstallation) agar aman dipanggil
     * bersamaan dari beberapa request.
     */
    private static function viaLibreOffice(string $src, string $dir): ?string
    {
        $bin = self::libreOfficeBinary();
        if (!$bin) {
            return null;
        }

        $cmd = sprintf(
            '%s -env:UserInstallation=%s --headless --norestore --convert-to pdf --outdir %s %s',
            escapeshellarg($bin),
            escapeshellarg('file:///' . str_replace('\\', '/', $dir) . '/profile'),
            escapeshellarg($dir),
            escapeshellarg($src)
        );

        @exec($cmd . ' 2>&1', $out, $code);

        $pdf = preg_replace('/\.[^.]+$/', '.pdf', $src);
        if ($code === 0 && is_file($pdf)) {
            return file_get_contents($pdf) ?: null;
        }

        Log::warning('[OfficeToPdf] LibreOffice gagal (kode ' . $code . '): ' . implode(' ', (array) $out));
        return null;
    }

    private static function libreOfficeBinary(): ?string
    {
        $candidates = array_filter([
            config('services.libreoffice.path'),
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
            '/usr/bin/soffice',
            '/usr/bin/libreoffice',
            '/opt/libreoffice/program/soffice',
        ]);

        foreach ($candidates as $bin) {
            if (is_file($bin)) {
                return $bin;
            }
        }

        return null;
    }

    private static function viaPhpWord(string $src, string $ext, string $dir): ?string
    {
        try {
            // PhpWord menulis PDF lewat renderer luar; dompdf sudah dipakai aplikasi ini.
            Settings::setPdfRendererName(Settings::PDF_RENDERER_DOMPDF);
            Settings::setPdfRendererPath(base_path('vendor/dompdf/dompdf'));

            $doc = IOFactory::load($src, self::READERS[$ext]);
            $out = $dir . DIRECTORY_SEPARATOR . 'hasil.pdf';
            IOFactory::createWriter($doc, 'PDF')->save($out);

            $pdf = is_file($out) ? file_get_contents($out) : null;
            return ($pdf && str_starts_with($pdf, '%PDF')) ? $pdf : null;
        } catch (\Throwable $e) {
            Log::warning('[OfficeToPdf] PhpWord gagal mengonversi ' . $ext . ': ' . $e->getMessage());
            return null;
        }
    }

    private static function cleanup(string $dir): void
    {
        foreach ((array) glob($dir . DIRECTORY_SEPARATOR . '*') as $f) {
            is_dir($f) ? self::cleanup($f) : @unlink($f);
        }
        @rmdir($dir);
    }
}
