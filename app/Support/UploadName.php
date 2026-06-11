<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Penamaan seragam untuk semua file upload: {id_pemilik}_{jenis}_{nama_pemilik}[_{konteks}].{ext}
 * Contoh: 6e8982f7..._weekly_feedback_budi_santoso_week3.docx
 *
 * Dua varian dipakai berpasangan:
 *  - display(): disimpan di dokumen.nama_file — yang tampil di UI dan menjadi nama saat download.
 *  - stored(): nama fisik di disk — sama seperti display() plus suffix time+uniqid agar
 *    dua upload apa pun tidak mungkin bentrok atau saling menimpa.
 */
class UploadName
{
    public static function display(array $parts, string $extension): string
    {
        return self::base($parts) . '.' . strtolower($extension);
    }

    public static function stored(array $parts, string $extension): string
    {
        return self::base($parts) . '_' . time() . '_' . uniqid() . '.' . strtolower($extension);
    }

    private static function base(array $parts): string
    {
        $slug = collect($parts)
            ->filter(fn ($p) => $p !== null && $p !== '')
            ->map(fn ($p) => Str::slug((string) $p, '_'))
            ->filter()
            ->implode('_');

        return $slug !== '' ? $slug : 'file';
    }
}
