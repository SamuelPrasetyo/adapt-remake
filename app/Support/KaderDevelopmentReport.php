<?php

namespace App\Support;

use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\ListKaderPerMentor;
use App\Models\MonthlyFeedbackSummary;
use App\Models\ReportArsip;
use Carbon\Carbon;

/**
 * Penyusun props "Management Trainee Development Report" (kartu report per-kader).
 *
 * Dipakai bersama oleh:
 *  - Report New / Arsip (ReportController::report_new & report_arsip_show) — halaman penuh.
 *  - KaderSaya/Detail tab "Report" (KaderSayaController::show) — kartu yang sama, embedded.
 *
 * Bertumpu pada App\Support\KaderReportData untuk LGS & Penilaian OJT; kelas ini hanya
 * menambah lapisan khas report: jendela FMC, bucket skor mentor per FMC, catatan bulanan,
 * Grand Score, dan tanda tangan.
 */
class KaderDevelopmentReport
{
    public const BULAN = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    /** Aspek feedback mingguan mentor (jawaban.id_pertanyaan) → label Development Progress. */
    private const ASPEK = [1 => 'Routine Job', 2 => 'Assignment', 3 => 'SOP Understanding', 4 => 'Project Execution'];

    /** Urutan tampil aspek pada section B (sesuai mockup report). */
    private const ASPEK_URUT = [1, 3, 2, 4];

    /**
     * Props report sistem (batch 3+).
     *
     * @param  \App\Models\Kader  $kader   butuh ->id & ->nik.
     * @param  array              $report  hasil KaderReportData::build($kader).
     * @return array props siap dikirim ke komponen React DevelopmentReportCard.
     */
    public static function build($kader, array $report): array
    {
        $header  = self::header($kader);
        $windows = self::fmcWindows($header->batch_start, $header->batch_year);

        [$devByFmc, $mentorByFmc] = self::developmentByFmc($header->nik, $windows);
        [$fmcFinalScores, $fmcApproved, $grandScore] = self::ojtSummary($report['penilaianList']);

        return [
            'kader'                 => self::kaderHeader($header),
            'faseGroups'            => $report['faseGroups'],
            'penilaianList'         => $report['penilaianList'],
            'developmentByFmc'      => $devByFmc,
            'monthlySummariesByFmc' => self::monthlySummariesByFmc($header->id, $windows),
            'fmcFinalScores'        => $fmcFinalScores,
            'fmcApproved'           => $fmcApproved,
            'grandScore'            => $grandScore,
            'signatures'            => [
                'mentorByFmc'  => [
                    1       => $mentorByFmc[1],
                    2       => $mentorByFmc[2],
                    3       => $mentorByFmc[3],
                    'final' => $mentorByFmc['all'],
                ],
                'hr'           => 'HR Business Unit',
                'divisionHead' => 'MAI',
            ],
            'fmcWindows' => array_map(fn ($w) => [
                'fmc'            => $w['fmc'],
                'label'          => $w['label'],
                'penilaianLabel' => $w['penilaianLabel'],
                'start'          => $w['start']->toIso8601String(),
                'end'            => $w['end']->toIso8601String(),
            ], $windows),
            'currentFmc' => self::currentFmc($header->batch_start, $header->batch_year),
        ];
    }

    /**
     * Props report arsip (batch 1-2): skor agregat dari report_arsip, tanpa grafik /
     * filter FMC / Grand Score karena data historis tak melalui sistem.
     *
     * @return array|null null bila kader tidak punya baris arsip.
     */
    public static function arsip($kader): ?array
    {
        $header = self::header($kader);
        $arsip  = ReportArsip::where('kader_id', $header->id)->first();
        if (!$arsip) return null;

        // Skor OJT & aspek Development disimpan skala 0-10; kirim apa adanya, frontend
        // menampilkan ×10 agar seragam dengan skala 0-100 (KKM 70).
        return [
            'kader'  => self::kaderHeader($header),
            'scores' => [
                'learning_growth'      => $arsip->learning_growth,
                'development_progress' => $arsip->development_progress,
                'fmc_avg'              => $arsip->fmc_avg,
                'ojt' => [
                    ['label' => 'OJT 1', 'score' => $arsip->ojt1],
                    ['label' => 'OJT 2', 'score' => $arsip->ojt2],
                    ['label' => 'OJT 3', 'score' => $arsip->ojt3],
                    ['label' => 'OJT 4', 'score' => $arsip->ojt4],
                ],
                'dev' => [
                    ['label' => 'Job Routine',      'score' => $arsip->dev_job_routine],
                    ['label' => 'Assignment',       'score' => $arsip->dev_assignment],
                    ['label' => 'SOP Understanding','score' => $arsip->dev_sop],
                    ['label' => 'Project Execution','score' => $arsip->dev_project],
                ],
                'status'   => $arsip->status,
                'batch_no' => $arsip->batch_no,
            ],
        ];
    }

    /**
     * Bungkus untuk tab "Report" di KaderSaya/Detail: pilih otomatis antara report sistem
     * (batch 3+) dan report arsip (batch 1-2). null bila tak ada data report sama sekali.
     */
    public static function forTab($kader, array $report): ?array
    {
        $header  = self::header($kader);
        $batchNo = $header->batch_name !== null ? (int) $header->batch_name : null;

        if ($batchNo !== null && $batchNo <= 2) {
            $arsip = self::arsip($kader);
            return $arsip ? ['mode' => 'arsip'] + $arsip : null;
        }

        return ['mode' => 'system'] + self::build($kader, $report);
    }

    // ── Query & bagian-bagian penyusun ───────────────────────────────────────

    /** Baris kader + BU/divisi/departemen/batch yang dibutuhkan header report. */
    private static function header($kader)
    {
        $row = Kader::select(
                'kader.id',
                'kader.nik',
                'kader.nama',
                'company.company_name as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch as batch_name',
                'batch.tahun_batch as batch_year',
                'batch.tanggal_mulai as batch_start'
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->where('kader.id', $kader->id)
            ->first();

        abort_if(!$row, 404);

        return $row;
    }

    /** Semua mentor aktif yang di-assign ke kader (bisa lebih dari satu) — nama + jabatan. */
    public static function mentors($kaderId)
    {
        return ListKaderPerMentor::join('mentor', 'list_kader_per_mentor.mentor_id', '=', 'mentor.id')
            ->where('list_kader_per_mentor.kader_id', $kaderId)
            ->whereNull('list_kader_per_mentor.deleted_at')
            ->whereNull('mentor.deleted_at')
            ->orderBy('mentor.nama', 'asc')
            ->get(['mentor.nama', 'mentor.jabatan'])
            ->unique('nama')
            ->values();
    }

    private static function kaderHeader($header): array
    {
        $mentors = self::mentors($header->id);

        return [
            'nama'        => $header->nama,
            'nik'         => $header->nik,
            'batch_name'  => $header->batch_name,
            'batch_roman' => $header->batch_name !== null ? self::toRomawi((int) $header->batch_name) : null,
            'batch_year'  => $header->batch_year,
            'bu'          => $header->bu,
            'divisi'      => $header->divisi_name,
            'departemen'  => $header->dept_name,
            'mentor'      => $mentors->isNotEmpty() ? $mentors->pluck('nama')->implode(', ') : null,
            'mentors'     => $mentors->map(fn ($m) => ['nama' => $m->nama, 'jabatan' => $m->jabatan])->values(),
        ];
    }

    /**
     * Section B — rata-rata 4 aspek feedback mentor, di-bucket per FMC berdasarkan tanggal
     * minggunya (+ bucket 'all' untuk view Final Score). Sekaligus mengembalikan nama mentor
     * dari feedback mingguan TERAKHIR tiap bucket, dipakai sebagai TTD "Mentor".
     *
     * @return array{0: array, 1: array} [devByFmc, mentorNameByBucket]
     */
    private static function developmentByFmc(?string $nik, array $windows): array
    {
        $rows = Jawaban::selectRaw('jawaban.id_pertanyaan as idp, jawaban.jawaban as val, jawaban.nama_mentor as nama_mentor, weeks.tanggal_mulai as wdate, weeks.id_week as id_week')
            ->join('weeks', 'jawaban.id_week', '=', 'weeks.id_week')
            ->where('jawaban.nik_kader', $nik)
            ->whereNotNull('jawaban.nama_mentor')
            ->whereIn('jawaban.id_pertanyaan', array_keys(self::ASPEK))
            ->get();

        $acc            = ['all' => [], 1 => [], 2 => [], 3 => []]; // [bucket][idp] => [sum, count]
        $lastMentorWeek = ['all' => null, 1 => null, 2 => null, 3 => null];
        $lastMentorName = ['all' => null, 1 => null, 2 => null, 3 => null];

        foreach ($rows as $r) {
            $buckets = ['all'];
            if ($r->wdate) {
                $d = Carbon::parse($r->wdate);
                foreach ($windows as $w) {
                    if ($d->between($w['start'], $w['end'])) { $buckets[] = $w['fmc']; break; }
                }
            }
            foreach ($buckets as $b) {
                if ($lastMentorWeek[$b] === null || $r->id_week > $lastMentorWeek[$b]) {
                    $lastMentorWeek[$b] = $r->id_week;
                    $lastMentorName[$b] = $r->nama_mentor;
                }
            }
            if (!is_numeric($r->val)) continue;
            $val = (float) $r->val;
            foreach ($buckets as $b) {
                $acc[$b][$r->idp] ??= [0, 0];
                $acc[$b][$r->idp][0] += $val;
                $acc[$b][$r->idp][1] += 1;
            }
        }

        $devByFmc = [];
        foreach (['all', 1, 2, 3] as $b) {
            $list = [];
            foreach (self::ASPEK_URUT as $idp) {
                $list[] = [
                    'label' => self::ASPEK[$idp],
                    'score' => isset($acc[$b][$idp]) && $acc[$b][$idp][1] > 0
                        ? round($acc[$b][$idp][0] / $acc[$b][$idp][1], 1)
                        : null,
                ];
            }
            $devByFmc[$b] = $list;
        }

        return [$devByFmc, $lastMentorName];
    }

    /**
     * Section D — Summary Monthly Feedback (ditulis Admin MAI atas Monthly Feedback mentor),
     * di-bucket per FMC berdasarkan bulan/tahun yang jatuh di jendela FMC.
     */
    private static function monthlySummariesByFmc($kaderId, array $windows): array
    {
        $summaries = MonthlyFeedbackSummary::where('kader_id', $kaderId)
            ->orderBy('tahun')
            ->orderBy('bulan')
            ->get(['bulan', 'tahun', 'summary']);

        $byFmc = ['all' => [], 1 => [], 2 => [], 3 => []];
        foreach ($summaries as $s) {
            $item = [
                'bulan'   => (int) $s->bulan,
                'tahun'   => (int) $s->tahun,
                'label'   => (self::BULAN[(int) $s->bulan] ?? $s->bulan) . ' ' . $s->tahun,
                'summary' => $s->summary,
            ];
            $byFmc['all'][] = $item;
            $mDate = Carbon::create((int) $s->tahun, (int) $s->bulan, 1);
            foreach ($windows as $w) {
                if ($mDate->between($w['start'], $w['end'])) {
                    $byFmc[$w['fmc']][] = $item;
                    break;
                }
            }
        }

        return $byFmc;
    }

    /**
     * Final score & status approval tiap FMC. Grand Score (rata-rata FMC 1-3) hanya valid
     * bila KETIGA FMC sudah di-APPROVE — nilai sebelum approve belum final.
     *
     * @return array{0: array, 1: array, 2: float|null}
     */
    private static function ojtSummary(array $penilaianList): array
    {
        $finalScores = [];
        $approved    = [];
        foreach ($penilaianList as $p) {
            $finalScores[$p['fmc']] = $p['final_score'];
            $approved[$p['fmc']]    = ($p['approval_status'] ?? null) === 'approved';
        }

        $allApproved = !empty($approved[1]) && !empty($approved[2]) && !empty($approved[3])
            && ($finalScores[1] ?? null) !== null
            && ($finalScores[2] ?? null) !== null
            && ($finalScores[3] ?? null) !== null;

        $grandScore = $allApproved
            ? round(($finalScores[1] + $finalScores[2] + $finalScores[3]) / 3, 1)
            : null;

        return [$finalScores, $approved, $grandScore];
    }

    // ── Jendela FMC ──────────────────────────────────────────────────────────

    public static function reportStartDate($batchStart, $batchYear): Carbon
    {
        if ($batchStart) return Carbon::parse($batchStart)->startOfMonth();
        if ($batchYear)  return Carbon::create((int) $batchYear, 1, 1);
        return now()->startOfMonth();
    }

    /**
     * 3 jendela FMC (masing-masing 4 bulan) diturunkan dari tanggal mulai batch.
     * start/end dipakai untuk: (a) memfilter titik grafik per completed_at, (b) bucket
     * skor mentor per FMC. label = rentang "Mei – Agu 2026"; penilaianLabel = bulan ke-4.
     */
    public static function fmcWindows($batchStart, $batchYear): array
    {
        $start   = self::reportStartDate($batchStart, $batchYear);
        $windows = [];
        for ($f = 1; $f <= 3; $f++) {
            $fs = (clone $start)->addMonths(($f - 1) * 4)->startOfMonth();
            $fe = (clone $start)->addMonths($f * 4 - 1)->endOfMonth();
            $windows[] = [
                'fmc'            => $f,
                'start'          => $fs,
                'end'            => $fe,
                'label'          => self::BULAN[$fs->month] . ' – ' . self::BULAN[$fe->month] . ' ' . $fe->year,
                'penilaianLabel' => self::BULAN[$fe->month] . ' ' . $fe->year,
            ];
        }

        return $windows;
    }

    public static function currentFmc($batchStart, $batchYear): int
    {
        $start = self::reportStartDate($batchStart, $batchYear);
        $diff  = (int) $start->diffInMonths(now()->startOfMonth(), false);

        return max(1, min(intdiv(max(0, $diff), 4) + 1, 3));
    }

    public static function toRomawi($number): string
    {
        $map = ['M' => 1000, 'CM' => 900, 'D' => 500, 'CD' => 400, 'C' => 100, 'XC' => 90,
                'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9, 'V' => 5, 'IV' => 4, 'I' => 1];
        $out = '';
        while ($number > 0) {
            foreach ($map as $roman => $int) {
                if ($number >= $int) {
                    $number -= $int;
                    $out .= $roman;
                    break;
                }
            }
        }

        return $out;
    }
}
