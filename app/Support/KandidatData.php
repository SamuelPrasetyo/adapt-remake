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
            'languages'      => self::languages($db, $ids),
            'disc'           => self::disc($db, $ids),
            'mbti'           => self::mbti($db, $ids),
        ];
    }

    /**
     * Peta `ktp => URL foto` untuk DAFTAR kader (Dashboard / Kader Saya) — cukup satu
     * query, jadi jangan panggil forKtp() per kader di dalam loop.
     *
     * Satu KTP bisa punya beberapa baris kandidat (mendaftar >1 kali): dipakai foto dari
     * pendaftaran TERBARU yang benar-benar punya foto, sehingga baris terbaru tanpa foto
     * tidak menutupi foto lama yang masih ada.
     *
     * @param  string[] $ktps
     * @return array<string,string>  hanya memuat KTP yang punya foto
     */
    public static function photosForKtps(array $ktps): array
    {
        $ktps = array_values(array_filter(array_unique(
            array_map(fn ($k) => trim((string) $k), $ktps)
        )));
        if (empty($ktps)) {
            return [];
        }

        $rows = DB::connection(self::CONN)->table('kandidat')
            ->whereIn('ktp', $ktps)
            ->orderByDesc('created_at')
            ->get(['ktp', 'foto_kandidat']);

        $out = [];
        foreach ($rows as $r) {
            $ktp = trim((string) $r->ktp);
            if ($ktp === '' || isset($out[$ktp])) {
                continue;
            }
            $url = self::assetUrl($r->foto_kandidat, 'foto');
            if ($url !== null) {
                $out[$ktp] = $url;
            }
        }

        return $out;
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
                // ja.alasan_ditolak SENGAJA tidak ikut dikirim: catatan penilaian internal
                // rekrutmen ("Psikotes tidak lolos", dst) tidak layak tampil di profil kader
                // yang sekarang sudah jadi karyawan. Kolomnya tetap ada di portal.
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

    /**
     * Gabungan pengalaman kerja dari DUA tabel portal:
     *  - pengalaman_mt : form MT (sumber utama & terkaya — ada gaji & alasan keluar),
     *                    presisi BULAN ("2024-02").
     *  - pengalaman    : flow lama, presisi tanggal penuh.
     * Keduanya nyaris disjoint (hanya ~10 kandidat punya keduanya), jadi digabung
     * tanpa dedup; membaca salah satunya saja membuat mayoritas data hilang.
     */
    private static function experiences($db, array $ids): array
    {
        if (empty($ids)) return [];

        $out = [];

        foreach ($db->table('pengalaman_mt')->whereIn('id_kandidat', $ids)->get() as $e) {
            $gaji = self::toInt(self::cleanText($e->gaji));
            $out[] = [
                'nm_company' => self::cleanText($e->perusahaan),
                'jabatan'    => self::cleanText($e->posisi),
                'tgl_masuk'  => self::formatMonth($e->bulan_masuk),
                'tgl_keluar' => self::formatMonth($e->bulan_keluar),
                'deskripsi'  => self::cleanText($e->tugas),
                'deskripsi_list' => self::bulletize($e->tugas),
                // Gaji 0 = tidak diisi, bukan digaji nol.
                'gaji'       => ($gaji !== null && $gaji > 0) ? $gaji : null,
                'alasan'     => self::cleanText($e->alasan),
                '_sort'      => substr(trim((string) $e->bulan_masuk), 0, 7),
            ];
        }

        foreach ($db->table('pengalaman')->whereIn('id_kandidat', $ids)->get() as $e) {
            $out[] = [
                'nm_company' => self::cleanText($e->nm_company),
                'jabatan'    => self::cleanText($e->jabatan),
                'tgl_masuk'  => self::formatDate($e->tgl_masuk, false),
                'tgl_keluar' => self::formatDate($e->tgl_keluar, false),
                'deskripsi'  => self::cleanText($e->deskripsi),
                'deskripsi_list' => self::bulletize($e->deskripsi),
                'gaji'       => null,
                'alasan'     => null,
                '_sort'      => substr(trim((string) $e->tgl_masuk), 0, 7),
            ];
        }

        // Buang baris hampa (portal mengizinkan submit form pengalaman kosong) —
        // tanpa ini timeline menampilkan entri "—" tanpa isi apa pun.
        $out = array_values(array_filter(
            $out,
            fn ($e) => $e['nm_company'] || $e['jabatan'] || $e['tgl_masuk'] || $e['deskripsi']
        ));

        // Terbaru dulu. Kunci urut disamakan ke "YYYY-MM" karena dua sumber
        // beda presisi; nilai kosong/"0000-.." otomatis jatuh ke bawah.
        usort($out, fn ($a, $b) => strcmp($b['_sort'], $a['_sort']));

        return array_map(function ($e) { unset($e['_sort']); return $e; }, $out);
    }

    /**
     * Kemampuan bahasa. Satu baris `bahasa` memuat 3 bahasa sekaligus (Indonesia,
     * Inggris, dan satu bahasa lain bebas) — dipecah jadi daftar per bahasa.
     * Diambil baris TERBARU saja; baris lama = pengisian ulang, bukan tambahan.
     */
    private static function languages($db, array $ids): array
    {
        if (empty($ids)) return [];

        $b = $db->table('bahasa')->whereIn('id_kandidat', $ids)->orderByDesc('created_at')->first();
        if (!$b) return [];

        $rows = [
            ['Indonesia', $b->indo_bicara, $b->indo_baca, $b->indo_tulis],
            ['Inggris', $b->inggris_bicara, $b->inggris_baca, $b->inggris_tulis],
            [self::cleanText($b->lain_nama), $b->lain_bicara, $b->lain_baca, $b->lain_tulis],
        ];

        $out = [];
        foreach ($rows as [$nama, $bicara, $baca, $tulis]) {
            // Bahasa lain sering kosong atau diisi "-" → jangan tampilkan baris hampa.
            if (!$nama || (!$bicara && !$baca && !$tulis)) continue;
            $out[] = ['nama' => $nama, 'bicara' => $bicara, 'baca' => $baca, 'tulis' => $tulis];
        }

        return $out;
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

    /**
     * Riwayat pendidikan. Sumber utama = pendidikan_mt (form MT: jenjang/institusi
     * bebas ketik + tahun & IPK). Tabel lama pendidikan_kandidat (id_pendidikan /
     * id_universitas berelasi ke master) ikut dibaca agar record lama tidak hilang.
     */
    private static function educations($db, array $ids): array
    {
        if (empty($ids)) return [];

        $out = [];

        foreach ($db->table('pendidikan_mt')->whereIn('id_kandidat', $ids)->get() as $e) {
            $out[] = [
                'jenjang'     => self::cleanText($e->jenjang),
                'universitas' => self::cleanText($e->institusi),
                'jurusan'     => self::cleanText($e->jurusan),
                'tahun'       => self::cleanText($e->tahun),
                'ipk'         => self::cleanText($e->ipk),
                // Numerik: kolom tahun varchar bebas ketik, sesekali berisi teks.
                // Dibanding sebagai string, teks sampah justru menang atas tahun asli.
                '_sort'       => (int) preg_replace('/\D/', '', (string) $e->tahun),
            ];
        }

        foreach (
            $db->table('pendidikan_kandidat as pk')
                ->leftJoin('pendidikan as p', 'pk.id_pendidikan', '=', 'p.id')
                ->leftJoin('universitas as u', 'pk.id_universitas', '=', 'u.id')
                ->whereIn('pk.id_kandidat', $ids)
                ->select('p.nama as jenjang', 'u.nama as universitas', 'pk.nama_jurusan')
                ->get() as $e
        ) {
            $out[] = [
                'jenjang'     => self::cleanText($e->jenjang),
                'universitas' => self::cleanText($e->universitas),
                'jurusan'     => self::cleanText($e->nama_jurusan),
                'tahun'       => null,
                'ipk'         => null,
                '_sort'       => 0,
            ];
        }

        // Jenjang terakhir (tahun terbesar) di atas; tanpa tahun → paling bawah.
        usort($out, fn ($a, $b) => $b['_sort'] <=> $a['_sort']);

        return array_map(function ($e) { unset($e['_sort']); return $e; }, $out);
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

    /**
     * Nilai kosong di portal tidak konsisten: ada '', '-', dan spasi. Semuanya
     * dianggap kosong agar frontend menampilkan '—', bukan tanda hubung menggantung.
     */
    private static function cleanText($v): ?string
    {
        $v = trim((string) $v);
        return ($v === '' || $v === '-') ? null : $v;
    }

    /**
     * Memecah deskripsi tugas menjadi daftar butir. Kandidat mengetik bebas di portal:
     * ada yang memakai "-", "•", "·", ada yang bernomor "1.", dan ada yang menempel
     * jadi satu paragraf tanpa baris baru sama sekali. Tanpa dipecah, semuanya
     * menggumpal jadi satu blok teks di web maupun PDF.
     *
     * Tiga aturan yang menjaga agar teks biasa tidak ikut terpotong:
     *  - "-" / "–" / "*" hanya diakui sebagai penanda bila salah satu baris memang
     *    DIAWALI penanda itu. Tanpa syarat ini, tanda hubung di tengah kalimat
     *    ("sell-out", "incoming-delivery") ikut memotong.
     *  - Pemotongan hanya memakai karakter yang benar-benar mengawali baris. Teks
     *    berbutir "*" yang memuat "13 November 2023 – 05 Juli 2024" tidak boleh ikut
     *    terpotong di en-dash-nya, begitu pula "dokumen - dokumen" pada daftar "*".
     *  - Baris baru DI DALAM satu butir adalah bungkus baris (soft wrap) dari formulir
     *    portal, bukan butir baru — jadi dirapatkan kembali jadi satu kalimat.
     *
     * Teks pengantar sebelum penanda pertama ("Jobdesk:", "Driver") dikembalikan
     * terpisah sebagai `intro` agar tidak tampil sebagai butir palsu.
     *
     * @return array{type:string,intro:?string,items:string[]}|null  null bila bukan daftar
     */
    private static function bulletize($v): ?array
    {
        $text = trim(str_replace(["\r\n", "\r"], "\n", (string) $v));
        if ($text === '') return null;

        $lines = explode("\n", $text);
        $diawali = function (string $pola) use ($lines): bool {
            foreach ($lines as $l) {
                if (preg_match('/^[ \t]*' . $pola . '/u', $l)) return true;
            }
            return false;
        };

        // Karakter bullet sejati tidak pernah muncul di tengah kalimat biasa, jadi
        // boleh dipotong di mana pun; sisanya wajib terbukti mengawali sebuah baris.
        $penanda = null;
        foreach (['•', '·'] as $c) {
            if (mb_strpos($text, $c) !== false) { $penanda = $c; break; }
        }
        if ($penanda === null) {
            foreach (['-', '–', '—', '*'] as $c) {
                if ($diawali(preg_quote($c, '/'))) { $penanda = $c; break; }
            }
        }

        if ($penanda !== null) {
            $q      = preg_quote($penanda, '/');
            $type   = 'ul';
            $awalan = '/^' . $q . '/u';
            // Bullet sejati boleh menempel di mana saja; "-"/"*" wajib di awal teks
            // atau setelah spasi supaya tidak memotong kata bertanda hubung.
            $pisah  = in_array($penanda, ['•', '·'], true)
                ? '/' . $q . '+[ \t]*/u'
                : '/(?:^|\s)' . $q . '+[ \t]*(?=\S)/u';
        } elseif ($diawali('\d+[.)][ \t]')) {
            $type   = 'ol';
            $awalan = '/^[ \t]*\d+[.)][ \t]/u';
            $pisah  = '/(?:^|\n)[ \t]*\d+[.)][ \t]*(?=\S)/u';
        } else {
            return null;
        }

        $parts = preg_split($pisah, $text);
        $rapi  = fn ($s) => trim(preg_replace('/\s+/u', ' ', $s));

        // Bagian sebelum penanda pertama = kalimat pengantar, bukan butir.
        $intro = null;
        if (!preg_match($awalan, $text) && count($parts) > 1) {
            $intro = $rapi(array_shift($parts)) ?: null;
        }

        // Butir tanpa huruf/angka dibuang: isian "-" atau "•" belaka (portal
        // mengizinkannya) tak boleh berubah jadi butir kosong menggantung.
        $items = [];
        foreach ($parts as $part) {
            $part = $rapi($part);
            if ($part !== '' && preg_match('/[\p{L}\p{N}]/u', $part)) $items[] = $part;
        }

        return $items ? ['type' => $type, 'intro' => $intro, 'items' => $items] : null;
    }

    private const MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    private const MONTHS_SHORT = [
        1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
        7 => 'Jul', 8 => 'Agu', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
    ];

    /**
     * pengalaman_mt menyimpan periode dengan presisi BULAN ("2024-02"), jadi
     * ditampilkan "Feb 2024" — bukan dd/mm/yyyy yang mengarang tanggal.
     */
    private static function formatMonth($value): ?string
    {
        $value = trim((string) $value);
        if ($value === '' || str_starts_with($value, '0000')) return null;
        if (preg_match('/^(\d{4})-(\d{1,2})$/', $value, $m)) {
            $mo = (int) $m[2];
            return ($mo >= 1 && $mo <= 12) ? self::MONTHS_SHORT[$mo] . ' ' . $m[1] : $m[1];
        }
        return self::formatDate($value, false); // jaga-jaga bila ada tanggal penuh
    }

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
