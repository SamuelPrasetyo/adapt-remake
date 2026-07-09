<?php

namespace App\Support;

use App\Models\ReportArsip;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Importer arsip skor Batch 1 & 2 dari file Excel "Data MT batch 1 & 2.xlsx".
 *
 * Struktur Excel (2 sheet: "batch 1", "batch 2"), data mulai baris 3:
 *   A No · B Nama · C Mentor · D Jabatan Mentor · E Bisnis Unit ·
 *   F Learning Growth (0-100) · G-J OJT 1-4 (0-10) · K avg OJT (formula) ·
 *   L-O aspek Development (0-10, batch 1 saja) · P avg Development (0-10)
 *
 * Konsep:
 *  - Batch 2  : dicocokkan by nama ke kader yang SUDAH ada (company tidak ditimpa).
 *  - Batch 1  : kader dibuat baru (nik sintetis), + baris Batch 1 & placeholder divisi/dept.
 *  - Mentor   : dibuat/di-dedup di Master Mentor (company benar, jabatan dari kolom D) + link
 *               transaksional ke kader (maks 5, lihat [[multi-mentor-per-kader]]).
 *  - Skor     : disimpan di tabel report_arsip (F, K*10, P*10, rincian OJT & aspek).
 *
 * Idempotent: menjalankan ulang meng-update, tidak menduplikat.
 */
class ArsipImporter
{
    public const MAX_MENTORS = 5;

    /** Bisnis Unit Excel (kunci ter-kanonikalisasi) → company_code. */
    private const COMPANY_MAP = [
        'MEKAR ARMADA JAYA'          => '001',
        'ARMADA AUTO TARA'           => '012',
        'ARMINDO PERKASA'            => '017',
        'ARMADA TUNAS JAYA'          => '015',
        'TUNAS MOBIL'                => '035',
        'ITO SEISAKUSHO ARMADA'      => '045',
        'CITRA CLASSIC FURNITURE'    => '004',
        'GRAND ARTOS HOTEL'          => '040',
        'ARTOS HOTEL'                => '040',
        'ARTOS LAUNDRY'              => '047',
        'ARMADA INTERNATIONAL MOTOR' => '003',
        'KJJ'                        => '048',
        'ARTOS MALL'                 => '039',
        'BPR AMI'                    => '010',
        'LARAS ASRI'                 => '050',
    ];

    /**
     * Alias nama Excel → nama di DB, untuk kader yang penulisannya beda (dikonfirmasi manual
     * sebagai orang yang sama). Kunci & nilai memakai bentuk ter-normalisasi (lihat normName).
     */
    private const NAME_ALIAS = [
        'm dzikron fadhlurrohman' => 'muhammad dzikron',
    ];

    private string $actorId;
    private array  $result;

    public function __construct(string $actorId)
    {
        $this->actorId = $actorId;
        $this->result  = [
            'summary'   => [
                'batch1_created' => 0, 'batch1_matched' => 0,
                'batch2_matched' => 0, 'batch2_unmatched' => 0,
                'mentors_created' => 0, 'links_created' => 0, 'arsip_upserted' => 0,
            ],
            'kaders'    => [],   // per baris: batch, no, nama, action, company, mentors, scores
            'warnings'  => [],
        ];
    }

    public static function run(string $filePath, string $actorId, bool $commit = true): array
    {
        $importer = new self($actorId);
        return $importer->execute($filePath, $commit);
    }

    private function execute(string $filePath, bool $commit): array
    {
        $reader = IOFactory::createReaderForFile($filePath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($filePath);

        $run = function () use ($spreadsheet) {
            $this->ensureCompanyLarasAsri();
            $placeholder = $this->ensurePlaceholderOrg();
            $batch1Id    = $this->ensureBatch('1', 2024);
            $batch2Id    = $this->batchIdByName('2');

            foreach ($spreadsheet->getSheetNames() as $i => $name) {
                $batchNo = str_contains(strtolower($name), '1') ? 1 : (str_contains(strtolower($name), '2') ? 2 : null);
                if ($batchNo === null) continue;
                $this->processSheet($spreadsheet->getSheet($i), $batchNo, $batch1Id, $batch2Id, $placeholder);
            }
        };

        if ($commit) {
            DB::transaction($run);
        } else {
            // Dry-run: jalankan di dalam transaksi lalu rollback agar DB tak berubah.
            DB::beginTransaction();
            try { $run(); } finally { DB::rollBack(); }
        }

        return $this->result;
    }

    // ── Master data prasyarat ────────────────────────────────────────────────

    private function ensureCompanyLarasAsri(): void
    {
        if (DB::table('company')->where('company_code', '050')->exists()) return;
        $nextId = (int) DB::table('company')->max('company_id') + 1;
        DB::table('company')->insert([
            'company_id'        => $nextId,
            'company_code'      => '050',
            'line_business'     => 'Other',
            'company_name'      => 'LARAS ASRI',
            'company_shortname' => 'LA',
        ]);
        $this->result['warnings'][] = "Company baru dibuat: 'LARAS ASRI' (kode 050, company_id $nextId).";
    }

    /** Placeholder divisi & departemen untuk kader arsip batch 1 (Excel tak punya data ini). */
    private function ensurePlaceholderOrg(): array
    {
        $divId = DB::table('divisis')->where('nama', 'ARSIP (Batch 1-2)')->value('id');
        if (!$divId) {
            $divId = (string) Str::uuid();
            DB::table('divisis')->insert([
                'id' => $divId, 'nama' => 'ARSIP (Batch 1-2)',
                'created_by' => $this->actorId, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $deptId = DB::table('departemens')->where('nama', 'ARSIP (Batch 1-2)')->value('id');
        if (!$deptId) {
            $deptId = (string) Str::uuid();
            DB::table('departemens')->insert([
                'id' => $deptId, 'nama' => 'ARSIP (Batch 1-2)', 'id_divisi' => $divId,
                'created_by' => $this->actorId, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        return ['id_divisi' => $divId, 'id_departemen' => $deptId];
    }

    private function ensureBatch(string $nama, int $tahun): string
    {
        $id = $this->batchIdByName($nama);
        if ($id !== null) return $id;
        $newId = DB::table('batch')->insertGetId([
            'nama_batch' => $nama, 'tahun_batch' => $tahun,
            'created_by' => $this->actorId, 'created_at' => now(),
        ], 'id_batch');
        return (string) $newId;
    }

    private function batchIdByName(string $nama): ?string
    {
        $id = DB::table('batch')->where('nama_batch', $nama)->value('id_batch');
        return $id !== null ? (string) $id : null;
    }

    // ── Proses per sheet ─────────────────────────────────────────────────────

    private function processSheet($sheet, int $batchNo, string $batch1Id, ?string $batch2Id, array $ph): void
    {
        // Lookup kader existing per batch (untuk match by nama).
        $targetBatchId = $batchNo === 1 ? $batch1Id : $batch2Id;
        $existing = [];
        if ($targetBatchId !== null) {
            foreach (DB::table('kader')->where('id_batch', $targetBatchId)->get() as $k) {
                $existing[$this->normName($k->nama)] = $k;
            }
        }

        $emptyStreak = 0;
        for ($r = 3; $r <= 250; $r++) {
            $nama = trim((string) $sheet->getCell("B$r")->getValue());
            if ($nama === '') {
                if (++$emptyStreak >= 8) break;
                continue;
            }
            $emptyStreak = 0;

            $no        = $this->numOrNull($sheet->getCell("A$r")->getValue());
            $mentorRaw = trim((string) $sheet->getCell("C$r")->getValue());
            $jabRaw    = trim((string) $sheet->getCell("D$r")->getValue());
            $buRaw     = trim((string) $sheet->getCell("E$r")->getValue());

            $scores = $this->readScores($sheet, $r);

            // ── Tentukan / buat kader ────────────────────────────────────────
            $key = $this->normName($nama);
            $key = self::NAME_ALIAS[$key] ?? $key;   // samakan ejaan berbeda → nama DB
            $kader = $existing[$key] ?? null;

            $companyCode = $this->mapCompany($buRaw);

            if ($batchNo === 2) {
                if (!$kader) {
                    $this->result['summary']['batch2_unmatched']++;
                    $this->result['warnings'][] = "Batch 2: kader \"$nama\" tak ditemukan di DB (dilewati, tak dibuat).";
                    $this->result['kaders'][] = [
                        'batch' => 2, 'no' => $no, 'nama' => $nama, 'action' => 'skipped-unmatched',
                        'company' => $companyCode, 'mentors' => [], 'scores' => $scores,
                    ];
                    continue;
                }
                // Company batch 2 tidak ditimpa — pakai yang sudah ada di DB.
                $companyCode  = $kader->company_code;
                $kaderId      = $kader->id;
                $kaderDivisi  = $kader->id_divisi;
                $kaderDept    = $kader->id_departemen;
                $action       = 'matched';
                $this->result['summary']['batch2_matched']++;
            } else {
                // Batch 1
                if ($buRaw !== '' && $companyCode === null) {
                    $this->result['warnings'][] = "Batch 1: BU \"$buRaw\" (kader \"$nama\") tak dikenal di mapping company.";
                }
                if ($kader) {
                    $kaderId     = $kader->id;
                    $kaderDivisi = $kader->id_divisi;
                    $kaderDept   = $kader->id_departemen;
                    $action      = 'matched';
                    $this->result['summary']['batch1_matched']++;
                    // Perbarui company bila sebelumnya kosong.
                    if ($companyCode !== null && $kader->company_code !== $companyCode) {
                        DB::table('kader')->where('id', $kaderId)->update([
                            'company_code' => $companyCode, 'updated_by' => $this->actorId, 'updated_at' => now(),
                        ]);
                    }
                } else {
                    $kaderId     = (string) Str::uuid();
                    $kaderDivisi = $ph['id_divisi'];
                    $kaderDept   = $ph['id_departemen'];
                    $nik         = 'ARS-B1-' . str_pad((string) ($no ?? $r), 3, '0', STR_PAD_LEFT);
                    DB::table('kader')->insert([
                        'id' => $kaderId, 'nik' => $nik, 'nama' => $nama,
                        'jenis_kelamin' => '-', 'iq' => '-', 'ipk' => '-',
                        'company_code' => $companyCode ?? '', 'id_divisi' => $kaderDivisi, 'id_departemen' => $kaderDept,
                        'id_batch' => $batch1Id, 'created_by' => $this->actorId,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $existing[$key] = (object) ['id' => $kaderId, 'nama' => $nama, 'company_code' => $companyCode, 'id_divisi' => $kaderDivisi, 'id_departemen' => $kaderDept];
                    $action = 'created';
                    $this->result['summary']['batch1_created']++;
                }
            }

            // ── Mentor + link ────────────────────────────────────────────────
            $mentorNames = $this->splitMulti($mentorRaw, true);   // nama boleh dipisah koma
            $jabatans    = $this->splitMulti($jabRaw, false);     // jabatan hanya dipisah "1./2." (koma bisa bagian jabatan)
            $mentorInfo  = $this->syncMentors(
                $kaderId, $mentorNames, $jabatans,
                $companyCode ?: '', $targetBatchId ?? $batch1Id, $kaderDivisi, $kaderDept
            );

            // ── Skor arsip (upsert per kader) ────────────────────────────────
            ReportArsip::updateOrCreate(
                ['kader_id' => $kaderId],
                array_merge($scores, [
                    'batch_no' => $batchNo, 'source_no' => $no,
                ])
            );
            $this->result['summary']['arsip_upserted']++;

            $this->result['kaders'][] = [
                'batch' => $batchNo, 'no' => $no, 'nama' => $nama, 'action' => $action,
                'company' => $companyCode, 'mentors' => $mentorInfo, 'scores' => $scores,
            ];
        }
    }

    /** Buat/dedup mentor + link ke kader (maks 5). Kembalikan daftar nama mentor terpasang. */
    private function syncMentors(string $kaderId, array $names, array $jabatans, string $companyCode, string $idBatch, string $idDivisi, string $idDept): array
    {
        $attached = [];
        // Mentor existing yang sudah ter-link ke kader ini (hindari dobel).
        $linkedIds = DB::table('list_kader_per_mentor')
            ->where('kader_id', $kaderId)->whereNull('deleted_at')
            ->pluck('mentor_id')->all();

        $count = count($linkedIds);
        foreach ($names as $idx => $name) {
            if ($count >= self::MAX_MENTORS) {
                $this->result['warnings'][] = "Mentor \"$name\" dilewati: kader sudah mencapai maks " . self::MAX_MENTORS . " mentor.";
                break;
            }
            $jabatan = $jabatans[$idx] ?? null;
            $mentorId = $this->firstOrCreateMentor($name, $companyCode, $jabatan);

            if (!in_array($mentorId, $linkedIds, true)) {
                DB::table('list_kader_per_mentor')->insert([
                    'id' => (string) Str::uuid(), 'kader_id' => $kaderId, 'mentor_id' => $mentorId,
                    'company_code' => $companyCode, 'id_batch' => $idBatch,
                    'id_divisi' => $idDivisi, 'id_department' => $idDept,
                    'created_by' => $this->actorId, 'created_at' => now(),
                ]);
                $linkedIds[] = $mentorId;
                $count++;
                $this->result['summary']['links_created']++;
            }
            $attached[] = $name . ($jabatan ? " ($jabatan)" : '');
        }
        return $attached;
    }

    private function firstOrCreateMentor(string $name, string $companyCode, ?string $jabatan): string
    {
        $id = DB::table('mentor')
            ->whereRaw('LOWER(TRIM(nama)) = ?', [mb_strtolower(trim($name))])
            ->where('company_code', $companyCode)
            ->whereNull('deleted_at')
            ->value('id');
        if ($id) return $id;

        $id = (string) Str::uuid();
        DB::table('mentor')->insert([
            'id' => $id, 'nama' => $name, 'company_code' => $companyCode,
            'jabatan' => $jabatan, 'created_by' => $this->actorId, 'created_at' => now(),
        ]);
        $this->result['summary']['mentors_created']++;
        return $id;
    }

    // ── Baca skor satu baris ─────────────────────────────────────────────────

    private function readScores($sheet, int $r): array
    {
        $g = $this->rawCell($sheet, "G$r"); $h = $this->rawCell($sheet, "H$r");
        $i = $this->rawCell($sheet, "I$r"); $j = $this->rawCell($sheet, "J$r");

        $ojt = array_values(array_filter(
            [$this->numOrNull($g), $this->numOrNull($h), $this->numOrNull($i), $this->numOrNull($j)],
            fn ($v) => $v !== null
        ));
        $kAvg = count($ojt) ? array_sum($ojt) / count($ojt) : null;      // 0-10
        $p    = $this->numOrNull($sheet->getCell("P$r")->getValue());     // 0-10

        $resign = false;
        foreach ([$g, $h, $i, $j] as $c) {
            if (is_string($c) && stripos($c, 'resign') !== false) $resign = true;
        }

        return [
            'learning_growth'      => $this->numOrNull($sheet->getCell("F$r")->getValue()),   // 0-100
            'development_progress' => $p    !== null ? round($p * 10, 2) : null,               // →0-100
            'fmc_avg'              => $kAvg !== null ? round($kAvg * 10, 2) : null,            // →0-100
            'ojt1' => $this->numOrNull($g), 'ojt2' => $this->numOrNull($h),
            'ojt3' => $this->numOrNull($i), 'ojt4' => $this->numOrNull($j),
            'dev_job_routine' => $this->numOrNull($sheet->getCell("L$r")->getValue()),
            'dev_assignment'  => $this->numOrNull($sheet->getCell("M$r")->getValue()),
            'dev_sop'         => $this->numOrNull($sheet->getCell("N$r")->getValue()),
            'dev_project'     => $this->numOrNull($sheet->getCell("O$r")->getValue()),
            'status'          => $resign ? 'resign' : null,
        ];
    }

    private function rawCell($sheet, string $coord)
    {
        return $sheet->getCell($coord)->getValue();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function numOrNull($v): ?float
    {
        return is_numeric($v) ? (float) $v : null;
    }

    private function normName(string $s): string
    {
        return preg_replace('/\s+/', ' ', mb_strtolower(trim($s)));
    }

    private function mapCompany(string $bu): ?string
    {
        if ($bu === '') return null;
        $canon = strtoupper(str_replace('.', '', trim($bu)));
        $canon = preg_replace('/^PT\s+/', '', $canon);
        $canon = trim(preg_replace('/\s+/', ' ', $canon));
        return self::COMPANY_MAP[$canon] ?? null;
    }

    /**
     * Pecah "1. A 2. B" (dan opsional "A, B") jadi array; buang prefiks angka.
     * $allowComma=false untuk jabatan, karena satu jabatan bisa memuat koma
     * (mis. "General Manager Finance, tax, Accounting").
     */
    private function splitMulti(string $s, bool $allowComma): array
    {
        $s = trim($s);
        if ($s === '') return [];
        if (preg_match('/\d+\.\s*/', $s)) {
            $parts = preg_split('/\s*\d+\.\s*/', $s);
        } elseif ($allowComma) {
            $parts = explode(',', $s);
        } else {
            $parts = [$s];
        }
        return array_values(array_filter(array_map('trim', $parts), fn ($p) => $p !== ''));
    }
}
