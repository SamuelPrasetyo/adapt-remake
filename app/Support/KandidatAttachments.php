<?php

namespace App\Support;

/**
 * Daftar berkas kandidat yang ikut digabung ke Export PDF Job Applicant.
 *
 * Sumber tunggal URUTAN lampiran — dipakai oleh halaman "Daftar Lampiran" di
 * dokumen PDF sekaligus oleh frontend saat menggabung berkas. Urutannya:
 * berkas pribadi (Dokumen) dulu, baru berkas per lamaran (Interview, Panel,
 * Psikogram) mengikuti urutan Riwayat Lamaran.
 */
class KandidatAttachments
{
    /**
     * @param  array|null $kandidat  hasil KandidatData::forKtp()
     * @return array<int,array{label:string,group:string,url:string}>
     */
    public static function list(?array $kandidat): array
    {
        if (!$kandidat) {
            return [];
        }

        $out = [];
        $p   = $kandidat['profile'] ?? [];

        foreach ([
            'CV / Lamaran' => $p['cv'] ?? null,
            'Ijazah'       => $p['file_ijazah'] ?? null,
            'Transkrip'    => $p['file_transkrip'] ?? null,
        ] as $label => $url) {
            if (self::isUrl($url)) {
                $out[] = ['label' => $label, 'group' => 'Dokumen', 'url' => $url];
            }
        }

        foreach (($kandidat['applications'] ?? []) as $app) {
            $job = $app['nm_job'] ?? 'Lamaran';
            foreach ([
                'Interview' => $app['file_interview'] ?? null,
                'Panel'     => $app['file_panel'] ?? null,
                'Psikogram' => $app['file_psikogram'] ?? null,
            ] as $label => $url) {
                if (self::isUrl($url)) {
                    $out[] = ['label' => $label, 'group' => $job, 'url' => $url];
                }
            }
        }

        return $out;
    }

    /**
     * Berkas hanya bisa digabung bila berupa URL penuh (butuh base URL portal
     * Career MAI); tanpa itu nilai di DB cuma nama berkas yang tak bisa diunduh.
     */
    private static function isUrl($v): bool
    {
        return is_string($v) && preg_match('#^https?://#i', $v) === 1;
    }
}
