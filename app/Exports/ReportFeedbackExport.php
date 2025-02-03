<?php

namespace App\Exports;

use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\PerformanceSum;
use App\Models\Pertanyaan;
use App\Models\User;
use App\Models\Week;
use Maatwebsite\Excel\Concerns\FromCollection;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ReportFeedbackExport implements FromView, WithColumnWidths
{
    protected $ojt;

    public function __construct($ojt)
    {
        $this->ojt = $ojt;
    }

    public function view(): View
    {
        $ojt = $this->ojt;

        $datas = Kader::select('kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama as divisi', 'departemens.nama as departement', 'batch.nama_batch', 'batch.tahun_batch', 'kader.nik', 'jawaban.nik_kader')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->join('divisis', 'kader.id_divisi', 'divisis.id')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->join('jawaban', 'kader.nik', 'jawaban.nik_kader')
            // ->join('performance_summary','kader.nik','performance_summary.nik_kader')
            ->groupBy('kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama', 'departemens.nama', 'jawaban.nik_kader', 'kader.nik', 'batch.nama_batch', 'batch.tahun_batch')
            ->get();
        $mentor[] = [];

        switch ($ojt) {
            case '1':
                $arr_week = ['2', '4', '6', '8', '10', '12'];
                break;
            case '2':
                $arr_week = ['14', '16', '18', '20', '22', '24'];
                break;
            case '3':
                $arr_week = ['26', '28', '30', '32', '34', '36'];
                break;
            case '4':
                $arr_week = ['38', '40', '42', '44', '46', '48'];
                break;
            default:
                $arr_week = [];
                break;
        }
        $mentor = [];

        $weeks = Week::whereIn('angka_week', $arr_week)->get();
        foreach ($datas as $value) {
            $data_mentor = Jawaban::select('jawaban.nama_mentor','jawaban.nik_kader')
                ->where('jawaban.nik_kader', $value->nik)
                ->groupBy('jawaban.nama_mentor','jawaban.nik_kader')
                ->get();

                foreach($data_mentor as $dt)
                {
                    if (!isset($mentor[$dt->nik_kader])) {
                        $mentor[$dt->nik_kader] = []; // Initialize as an array if not set
                    }
                    array_push($mentor[$dt->nik_kader],$dt->nama_mentor);
                }

            $data_jawaban = Jawaban::select('jawaban.*', 'pertanyaan.nama_pertanyaan', 'pertanyaan.type')
                ->where('nik_kader', $value->nik)
                // ->where('jawaban.created_by', $data_mentor->id)
                ->join('pertanyaan', 'jawaban.id_pertanyaan', 'pertanyaan.id_pertanyaan')
                ->get();
            

            foreach ($data_jawaban as $key => $jwb) {
                $jawaban[$jwb->id_pertanyaan][$jwb->id_week][$value->nik] = $jwb->jawaban;
                $revisi[$jwb->id_pertanyaan][$jwb->id_week][$value->nik] = $jwb->essay_revisi;
            }
        }

        $pertanyaans = Pertanyaan::where('type','Mentor')->get();

        $performance_sums = PerformanceSum::where('ojt',$ojt)->get();


        return view('exports.reportfeedback_export', [
            'datas'             => $datas,
            'mentor'            => $mentor,
            'jawaban'           => $jawaban,
            'pertanyaans'       => $pertanyaans,
            'weeks'             => $weeks,
            'revisi'            => $revisi,
            'performance_sums'  => $performance_sums,
            'ojt'               => $ojt
        ]);
    }

    public function columnWidths(): array
    {
        $headers = ['No','Bisnis UnitDivisi','DepartementMentorKader','Batch','L/P','Iq','Inch','Routine Job(2)','Assignment(2)','Pemahaman SOP(2)','Project(2)','Routine Job(4)','Assignment(4)','Pemahaman SOP(4)','Project(4)','Routine Job(6)','Assignment(6)','Pemahaman SOP(6)','Project(6)','Routine Job(8)','Assignment(8)','Pemahaman SOP(8)','Project(8)','Routine Job(10)','Assignment(10)','Pemahaman SOP(10)','Project(10)','Routine Job(12)','Assignment(12)','Pemahaman SOP(12)','Project(12)','Rata-rata','I & M(2)','I & M(4)','I & M(6)','I & M(8)','I & M(10)','I & M(12)','Rata-rata','Input Week (2)','Input Week (4)','Input Week (6)','Input Week (8)','Input Week (10)','Input Week (12)','PERFORMANCE SUMMARY','AVG','GRADE','SUMMARY GRADE'
    ]; // Sesuaikan dengan header Anda
        $widths = [];

        foreach ($headers as $index => $header) {
            $columnIndex = Coordinate::stringFromColumnIndex($index + 1); // Konversi angka ke huruf kolom (1 = A, 2 = B, dst.)
            $widths[$columnIndex] = strlen($header) + 7; // Tambahkan padding untuk estetika
            if($index == 0){
                $widths[$columnIndex] = strlen($header) + 3;
            }
        }

        return $widths;
    }
}
