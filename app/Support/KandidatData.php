<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Sumber tunggal data kandidat (portal rekrutmen Career MAI) untuk ditampilkan
 * di detail Kader Saya. Menautkan kader → kandidat lewat kader.nik_ktp = kandidat.ktp.
 *
 * Satu orang (KTP) bisa punya BEBERAPA baris kandidat (mendaftar >1 kali). Semua
 * relasi (lamaran, pengalaman, sertifikasi, asesmen) di-key ke kandidat.id, jadi
 * kita kumpulkan seluruh id milik KTP tsb lalu agregasi. Profil diambil dari baris
 * kandidat TERBARU. Koneksi 'career_mai' bersifat read-only.
 */
class KandidatData
{
    private const CONN = 'career_mai';

    /**
     * @return array|null  Struktur data kandidat, atau null bila KTP tidak ditemukan.
     */
    public static function forKtp(?string $ktp): ?array
    {
        $ktp = trim((string) $ktp);
        if ($ktp === '') {
            return null;
        }

        $db = DB::connection(self::CONN);

        $kandidats = $db->table('kandidat as k')
            ->leftJoin('agama as a', 'k.id_agama', '=', 'a.id')
            ->leftJoin('kawin as kw', 'k.id_kawin', '=', 'kw.id')
            ->leftJoin('pendidikan as p', 'k.id_pendidikan', '=', 'p.id')
            ->leftJoin('universitas as u', 'k.id_universitas', '=', 'u.id')
            ->where('k.ktp', $ktp)
            ->orderByDesc('k.created_at')
            ->select(
                'k.*',
                'a.nama as agama_nama',
                'kw.nama as kawin_nama',
                'p.nama as pendidikan_nama',
                'u.nama as universitas_nama'
            )
            ->get();

        if ($kandidats->isEmpty()) {
            return null;
        }

        $ids     = $kandidats->pluck('id')->filter()->values()->all();
        $primary = $kandidats->first();

        return [
            'ktp'            => $ktp,
            'assetBaseUrl'   => self::assetBaseUrl(),
            'profile'        => self::profile($primary),
            'applications'   => self::applications($db, $ids, $kandidats),
            'experiences'    => self::experiences($db, $ids),
            'certifications' => self::certifications($db, $ids),
            'educations'     => self::educations($db, $ids),
            'disc'           => self::disc($db, $ids),
            'mbti'           => self::mbti($db, $ids),
        ];
    }

    private static function assetBaseUrl(): ?string
    {
        $url = config('services.career_mai.asset_url');
        return $url ? rtrim($url, '/') : null;
    }

    private static function profile($k): array
    {
        return [
            'nama_lengkap'     => $k->nama_lengkap,
            'jk'               => $k->jk, // 'L' | 'P' | null
            'email'            => $k->email,
            'no_wa'            => $k->no_wa,
            'tempat_lahir'     => $k->tempat_lahir,
            'tgl_lahir'        => self::formatDate($k->tgl_lahir),
            'umur'             => self::ageFrom($k->tgl_lahir),
            'kewarganegaraan'  => $k->kewarganegaraan,
            'alamat'           => $k->alamat,
            'domisili'         => $k->domisili,
            'kota'             => $k->kota,
            'provinsi'         => $k->provinsi,
            'rumah'            => $k->rumah,
            'npwp'             => $k->npwp,
            'tinggi'           => $k->tinggi,
            'berat'            => $k->berat,
            'goldar'           => $k->goldar,
            'resus'            => $k->resus,
            'sim'              => $k->sim,
            'agama'            => $k->agama_nama,
            'status_kawin'     => $k->kawin_nama,
            'pendidikan'       => $k->pendidikan_nama,
            'universitas'      => $k->universitas_nama,
            'jurusan'          => $k->nm_jurusan,
            'ekspektasi_gaji'  => self::toInt($k->gaji),
            'lokasi_rekrutmen' => $k->lokasi_rekrutmen,
            'foto'             => self::assetUrl($k->foto_kandidat, 'foto'),
            'cv'               => self::assetUrl($k->nm_file, 'cv'),
            'file_ijazah'      => self::assetUrl($k->file_ijazah, 'ijazah'),
            'file_transkrip'   => self::assetUrl($k->file_transkrip, 'transkrip'),
            'ayah'             => $k->ayah,
            'hp_ayah'          => $k->hp_ayah,
            'ibu'              => $k->ibu,
            'hp_ibu'           => $k->hp_ibu,
            'darurat_nama'     => $k->darurat_nama,
            'darurat_hp'       => $k->darurat_hp,
            'darurat_hubungan' => $k->darurat_hubungan,
            'daftar_pada'      => self::formatDate($k->created_at),
        ];
    }

    /**
     * Gabungan lamaran dari job_applications (sumber utama, terkaya) + lamaran
     * langsung yang tersimpan di baris kandidat (data lama), didedup per id_job.
     */
    private static function applications($db, array $ids, $kandidats): array
    {
        if (empty($ids)) return [];

        $rows = $db->table('job_applications as ja')
            ->leftJoin('job as j', 'ja.id_job', '=', 'j.id')
            ->leftJoin('company as c', 'j.id_company', '=', 'c.id')
            ->leftJoin('progress as pr', 'ja.id_progress', '=', 'pr.id')
            ->whereIn('ja.id_kandidat', $ids)
            ->orderByDesc('ja.created_at')
            ->select(
                'ja.id_job',
                'ja.ekspektasi_gaji',
                'ja.alasan_ditolak',
                'ja.file_interview',
                'ja.file_panel',
                'ja.file_psikogram',
                'ja.created_at',
                'ja.updated_at',
                'j.nm_job',
                'j.tipe',
                'c.singkat_company',
                'c.nm_company',
                'pr.nama as progress_nama',
                'pr.no_urut as progress_urut'
            )
            ->get();

        $out  = [];
        $seen = [];
        foreach ($rows as $r) {
            if ($r->id_job) $seen[$r->id_job] = true;
            $out[] = [
                'nm_job'          => $r->nm_job ?: 'Posisi tidak diketahui',
                'tipe'            => $r->tipe,
                'company'         => $r->singkat_company ?: $r->nm_company,
                'progress'        => $r->progress_nama,
                'progress_urut'   => self::toInt($r->progress_urut),
                'ekspektasi_gaji' => self::toInt($r->ekspektasi_gaji),
                'alasan_ditolak'  => $r->alasan_ditolak,
                'file_interview'  => self::assetUrl($r->file_interview, 'interview'),
                'file_panel'      => self::assetUrl($r->file_panel, 'panel'),
                'file_psikogram'  => self::assetUrl($r->file_psikogram, 'psikogram'),
                'applied_at'      => self::formatDate($r->created_at),
                'updated_at'      => self::formatDate($r->updated_at),
            ];
        }

        // Lamaran langsung dari baris kandidat (flow lama) yang belum ada di job_applications.
        $directJobIds = $kandidats->pluck('id_job')->filter()->reject(fn ($id) => isset($seen[$id]))->unique()->values();
        if ($directJobIds->isNotEmpty()) {
            $jobs = $db->table('job as j')
                ->leftJoin('company as c', 'j.id_company', '=', 'c.id')
                ->whereIn('j.id', $directJobIds->all())
                ->select('j.id', 'j.nm_job', 'j.tipe', 'c.singkat_company', 'c.nm_company')
                ->get()->keyBy('id');
            $progressNames = $db->table('progress')->pluck('nama', 'id');
            $progressUrut  = $db->table('progress')->pluck('no_urut', 'id');

            foreach ($kandidats as $k) {
                if (!$k->id_job || isset($seen[$k->id_job])) continue;
                $seen[$k->id_job] = true;
                $job = $jobs->get($k->id_job);
                $out[] = [
                    'nm_job'          => $job->nm_job ?? 'Posisi tidak diketahui',
                    'tipe'            => $job->tipe ?? null,
                    'company'         => $job ? ($job->singkat_company ?: $job->nm_company) : null,
                    'progress'        => $progressNames[$k->id_progress] ?? null,
                    'progress_urut'   => self::toInt($progressUrut[$k->id_progress] ?? null),
                    'ekspektasi_gaji' => self::toInt($k->gaji),
                    'alasan_ditolak'  => $k->alasan_ditolak,
                    'file_interview'  => null,
                    'file_panel'      => null,
                    'file_psikogram'  => null,
                    'applied_at'      => self::formatDate($k->created_at),
                    'updated_at'      => self::formatDate($k->updated_at),
                ];
            }
        }

        return $out;
    }

    private static function experiences($db, array $ids): array
    {
        if (empty($ids)) return [];
        return $db->table('pengalaman')
            ->whereIn('id_kandidat', $ids)
            ->orderByDesc('tgl_masuk')
            ->get()
            ->map(fn ($e) => [
                'nm_company' => $e->nm_company,
                'jabatan'    => $e->jabatan,
                'tgl_masuk'  => self::formatDate($e->tgl_masuk, false),
                'tgl_keluar' => self::formatDate($e->tgl_keluar, false),
                'deskripsi'  => $e->deskripsi,
            ])->all();
    }

    private static function certifications($db, array $ids): array
    {
        if (empty($ids)) return [];
        return $db->table('sertifikasi')
            ->whereIn('id_kandidat', $ids)
            ->orderByDesc('tahun')
            ->get()
            ->map(fn ($s) => [
                'nama'    => $s->nama,
                'lembaga' => $s->lembaga,
                'tahun'   => $s->tahun,
            ])->all();
    }

    private static function educations($db, array $ids): array
    {
        if (empty($ids)) return [];
        return $db->table('pendidikan_kandidat as pk')
            ->leftJoin('pendidikan as p', 'pk.id_pendidikan', '=', 'p.id')
            ->leftJoin('universitas as u', 'pk.id_universitas', '=', 'u.id')
            ->whereIn('pk.id_kandidat', $ids)
            ->select('p.nama as jenjang', 'u.nama as universitas', 'pk.nama_jurusan')
            ->get()
            ->map(fn ($e) => [
                'jenjang'     => $e->jenjang,
                'universitas' => $e->universitas,
                'jurusan'     => $e->nama_jurusan,
            ])->all();
    }

    private static function disc($db, array $ids): ?array
    {
        if (empty($ids)) return null;
        $d = $db->table('disc_result')->whereIn('id_kandidat', $ids)->orderByDesc('created_at')->first();
        if (!$d) return null;
        return [
            'strength' => [
                'D' => self::toInt($d->strength_d), 'I' => self::toInt($d->strength_i),
                'S' => self::toInt($d->strength_s), 'C' => self::toInt($d->strength_c),
            ],
            'weakness' => [
                'D' => self::toInt($d->weakness_d), 'I' => self::toInt($d->weakness_i),
                'S' => self::toInt($d->weakness_s), 'C' => self::toInt($d->weakness_c),
            ],
        ];
    }

    private static function mbti($db, array $ids): ?array
    {
        if (empty($ids)) return null;
        $m = $db->table('mbti_result')->whereIn('id_kandidat', $ids)->orderByDesc('created_at')->first();
        if (!$m) return null;
        return [
            'type'       => $m->personality_type,
            'dimensions' => [
                ['left' => 'Introvert',  'right' => 'Ekstrovert', 'lkey' => 'I', 'rkey' => 'E',
                 'lval' => self::toInt($m->introvert), 'rval' => self::toInt($m->ekstrovert)],
                ['left' => 'Sensing',    'right' => 'Intuition',  'lkey' => 'S', 'rkey' => 'N',
                 'lval' => self::toInt($m->sensing),   'rval' => self::toInt($m->intuition)],
                ['left' => 'Thinking',   'right' => 'Feeling',    'lkey' => 'T', 'rkey' => 'F',
                 'lval' => self::toInt($m->thinking),  'rval' => self::toInt($m->feeling)],
                ['left' => 'Judging',    'right' => 'Perceiving', 'lkey' => 'J', 'rkey' => 'P',
                 'lval' => self::toInt($m->judging),   'rval' => self::toInt($m->perceiving)],
            ],
        ];
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Bentuk URL berkas kandidat di portal Career MAI.
     *
     * Penyimpanan nama file di DB tidak konsisten: record baru menyimpan path lengkap
     * (mis. "uploads/foto/abc.jpg"), record lama hanya nama file ("abc.jpg"). Maka:
     *  - sudah berupa path (ada "/")  → dipakai apa adanya di bawah base URL.
     *  - hanya nama file              → diberi prefix "uploads/{folder}/".
     *
     * @param string $folder subfolder di uploads/ (foto|cv|ijazah|transkrip|interview|panel|psikogram)
     */
    private static function assetUrl(?string $file, string $folder): ?string
    {
        $file = trim((string) $file);
        if ($file === '') return null;
        if (preg_match('#^https?://#i', $file)) return $file; // sudah URL penuh

        $base = self::assetBaseUrl();
        // Tanpa base URL, kirim nama file mentah (frontend menampilkan sebagai nama, bukan tautan).
        if (!$base) return $file;

        $file = ltrim($file, '/');
        if (!str_contains($file, '/')) {
            $file = "uploads/{$folder}/{$file}";
        }
        // Encode tiap segmen (nama file sering mengandung spasi/karakter khusus),
        // tapi pertahankan pemisah '/' agar struktur path tetap benar.
        $file = implode('/', array_map('rawurlencode', explode('/', $file)));
        return $base . '/' . $file;
    }

    private static function toInt($v): ?int
    {
        return ($v === null || $v === '') ? null : (int) $v;
    }

    private const MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    private static function formatDate($value, bool $withMonthName = true): ?string
    {
        $value = trim((string) $value);
        if ($value === '' || str_starts_with($value, '0000')) return null;
        $ts = strtotime($value);
        if ($ts === false) return null;
        $d = (int) date('j', $ts);
        $m = (int) date('n', $ts);
        $y = date('Y', $ts);
        return $withMonthName ? "{$d} " . (self::MONTHS[$m] ?? $m) . " {$y}" : sprintf('%02d/%02d/%s', $d, $m, $y);
    }

    private static function ageFrom($value): ?int
    {
        $value = trim((string) $value);
        if ($value === '' || str_starts_with($value, '0000')) return null;
        $ts = strtotime($value);
        if ($ts === false) return null;
        $age = (int) floor((time() - $ts) / (365.25 * 24 * 3600));
        return ($age > 0 && $age < 120) ? $age : null;
    }
}
