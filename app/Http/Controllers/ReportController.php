<?php

namespace App\Http\Controllers;

use App\Exports\ReportFeedbackExport;
use App\Exports\ReportFeedbackKaderExport;
use App\Models\ActivityLog;
use App\Models\cr;
use App\Models\FeedbackMai;
use App\Models\FmDetail;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\PerformanceSum;
use App\Models\Pertanyaan;
use App\Models\User;
use App\Models\Week;
use App\Models\WeekKader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\Snappy\Facades\SnappyPdf;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function learning_index()
    {
        $kaders = Kader::select('kader.nama', 'kader.nik')
            ->join('jawaban', 'kader.nik', 'jawaban.nik_kader')
            ->whereNotNull('jawaban.nama_mentor')
            ->groupBy('kader.nama', 'kader.nik')
            ->orderBy('nama', 'asc')
            ->get();
        $user = Auth::user();
        if ($user->type == 'Mentor') {
            $kaders = Kader::select('kader.nik', 'kader.nama')
                ->join('jawaban', 'kader.nik', 'jawaban.nik_kader')
                ->where('jawaban.created_by', $user->id)
                ->orderBy('kader.nama', 'asc')
                ->groupBy('kader.nik', 'kader.nama')
                ->get();
        }

        $title = 'Learning Growth';

        return view('pages.report.report_index', compact('kaders', 'title'));
    }
    public function learning_growth(Request $request)
    {
        $reports = Jawaban::selectRaw("SUM(jawaban) / 4 as avg,nik_kader,weeks.angka_week as week")
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->where('nik_kader', $request->nik_kader)
            ->whereNotNull('nama_mentor')
            ->whereNotIn('id_pertanyaan', ['5', '6'])
            ->groupBy('nik_kader', 'week')
            ->get();
        $data_count = count($reports);
        $avg = [];
        $learningG = [];
        $kkm = [];
        $data_lg = [];
        $temp_avg = 0;
        $title['nama_kader'] = '';
        foreach ($reports as $val) {
            $cal = ($val->avg + $temp_avg) / $data_count;
            $temp_avg += $val->avg;

            $rounded = round($cal, 2);
            $data_lg[$val->week] =  $rounded;

            $learningG[$val->week] =  $rounded;

            $avg[$val->week] = $val->avg;

            array_push($kkm, 7);
        }
        $weeks = Week::orderBy('angka_week', 'asc')->get();
        $week = [];
        foreach ($weeks as $w) {
            array_push($week, $w->angka_week);
        }

        $avg = json_encode($avg, JSON_NUMERIC_CHECK);
        $week = json_encode($week, JSON_NUMERIC_CHECK);
        $learningG = json_encode($learningG, JSON_NUMERIC_CHECK);
        $kkm = json_encode($kkm, JSON_NUMERIC_CHECK);

        $kader = Kader::select('kader.nama as nama_kader', 'kader.nik', 'divisis.nama as nama_divisi', 'departemens.nama as nama_departemen', 'company.company_name')
            ->where('nik', $request->nik_kader)
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->first();
        $title['nama_kader'] = $kader->nama_kader;
        $title['divisi'] = $kader->nama_divisi;
        $title['departemen'] = $kader->nama_departemen;
        $title['bu'] = $kader->company_name;
        $title['nik'] = $kader->nik;


        return view('pages.report.learning_growth', compact('week', 'reports', 'avg', 'learningG', 'kkm', 'data_lg', 'title'));
    }

    public function weekly_monitoring(Request $request)
    {
        $week_arr = [];
        $week_arr_kader = [];
        $rangeMonth = '';
        $months = [];

        switch ($request->ojt) {
            case '1':
                $months = ['Jan', 'Feb', 'Mar'];
                $rangeMonth = 'Januari - Maret';
                $week_arr = ['2', '4', '6', '8', '10', '12'];
                break;
            case '2':
                $months = ['Apr', 'May', 'Jun'];
                $rangeMonth = 'April - Juni';
                $week_arr = ['14', '16', '18', '20', '22', '24'];
                break;
            case '3':
                $months = ['Jul', 'Aug', 'Sep'];
                $rangeMonth = 'Juli - September';
                $week_arr = ['26', '28', '30', '32', '34', '36'];
                break;
            case '4':
                $months = ['Okt', 'Nov', 'Dec'];
                $rangeMonth = 'Oktober - Desember';
                $week_arr = ['38', '40', '42', '44', '46', '48'];
                break;
            default:
                $week_arr = [];
                break;
        }

        switch ($request->ojt) {
            case '1':
                $week_arr_kader = range(1, 12);
                break;
            case '2':
                $week_arr_kader = range(13, 24);
                break;
            case '3':
                $week_arr_kader = range(25, 36);
                break;
            case '4':
                $week_arr_kader = range(37, 48);
                break;
            default:
                $week_arr_kader = [];
                break;
        }
        // dd($week_arr);
        $reports = Jawaban::selectRaw("pertanyaan.nama_pertanyaan,pertanyaan.id_pertanyaan,jawaban,nik_kader,weeks.angka_week as week, jawaban.nama_mentor as nama_mentor,essay_revisi")
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->join('pertanyaan', 'jawaban.id_pertanyaan', 'pertanyaan.id_pertanyaan')
            ->join('users', 'jawaban.created_by', 'users.id')
            // ->whereNotNull('nama_mentor')
            ->where('nik_kader', $request->nik_kader)
            ->where('pertanyaan.status', 'Aktif')
            ->where('pertanyaan.type', 'Mentor')
            // ->whereNotIn('jawaban.id_pertanyaan', ['6'])
            ->whereIn('weeks.angka_week', $week_arr)
            // ->groupBy('pertanyaan.nama_pertanyaan', 'nik_kader', 'week')
            ->orderBy('pertanyaan.id_pertanyaan')
            ->get();
        $pertanyaans = Pertanyaan::where('type', 'Mentor')->where('status', 'Aktif')->orderBy('id_pertanyaan', 'asc')->limit(4)->get();
        // dd($reports);
        $data_count = count($reports);
        $avg = [];
        $learningG = [];
        $kkm = [];
        $data_kkm = [];
        $data = [];
        $data2 = [];
        $data3 = [];
        $data_lg = [];
        $lg_prev = 0;
        $title['nama_kader'] = '';
        $avg_week = [];
        $avg2_week = [];
        $i = 0;
        $weeks = Week::whereIn('angka_week', $week_arr)->orderBy('angka_week', 'asc')->get();
        $week = [];
        $nama_mentor = '';

        $nama_mentors = [];
        foreach ($reports as $val) {
            $nama_mentors[] = $val->nama_mentor;

            $data[strip_tags($val->nama_pertanyaan)][$val->week] = $val->jawaban;
            if ($val->id_pertanyaan == '5') {
                $data2[$val->week] = $val->jawaban;

                if (is_numeric($val->jawaban)) {
                    $avg2_week[$val->week] = $val->jawaban / 1;
                }
            }
            if ($val->id_pertanyaan == '6') {
                $data3[$val->week] = $val->essay_revisi ?? $val->jawaban;
            } else {
                if ($val->id_pertanyaan != '5') {

                    if (is_numeric($val->jawaban)) {
                        $avg_week[$val->week] = ($avg_week[$val->week] ?? 0) + $val->jawaban / 4;
                    }
                }
            }
        }
        foreach ($weeks as $w) {
            if (!isset($avg_week[$w->angka_week])) {
                $avg_week[$w->angka_week] = 0;
                $avg2_week[$w->angka_week] = 0;
            }
            array_push($week, $w->angka_week);
            array_push($kkm, 7);
        }
        $nama_mentors = array_unique($nama_mentors); // Hapus duplikat
        if (count($nama_mentors) === 1) {
            $nama_mentor = reset($nama_mentors); // Ambil nilai pertama
        } else {
            $nama_mentor = array_values($nama_mentors); // Reset indeks array
        }
        ksort($avg_week);
        foreach ($avg_week as $key => $avw) {
            if ($avw != 0) {
                if ($key > 0) {
                    $cal = ($lg_prev * 6 + $avw) / 6;
                } else {
                    $cal = $avw / 6;
                }
                $rounded = round($cal, 2);
            } else {
                $rounded = $lg_prev;
            }
            // dd($rounded);
            $data_lg[$key] =  $rounded;
            $learningG[$key] =  $rounded;
            $data_kkm[$key] = 7;
            // $week[$key] = $key;

            $lg_prev = $rounded;
        }
        // dd($avg_week, $learningG);
        // Iterate over the data to fill missing weeks with "0"

        foreach ($data as $key => $values) {
            foreach ($week as $wk) {
                if (!isset($data[$key][$wk])) {
                    $data[$key][$wk] = "0";

                    if (!isset($data2[$wk])) {
                        $data2[$wk] = 0;
                    }

                    $data3[$wk] = "-";
                }
            }

            ksort($data[$key]);
        }

        // dd($data2, $avg2_week);

        $avg = json_encode($avg_week, JSON_NUMERIC_CHECK);
        $avg_2 = json_encode($avg2_week, JSON_NUMERIC_CHECK);
        $week = json_encode($week, JSON_NUMERIC_CHECK);
        $learningG = json_encode($learningG, JSON_NUMERIC_CHECK);
        $kkm = json_encode($kkm, JSON_NUMERIC_CHECK);


        $kader = Kader::select('kader.nama as nama_kader', 'kader.iq', 'kader.ipk', 'divisis.nama as nama_divisi', 'departemens.nama as nama_departemen', 'company.company_name', 'jawaban.nama_mentor', 'batch.nama_batch', 'batch.tahun_batch')
            ->leftJoin('jawaban', 'kader.nik', 'jawaban.nik_kader')
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
            ->where('nik', $request->nik_kader)
            // ->whereNotNull('jawaban.nama_mentor')
            ->first();

        $title['nama_mentor'] = $nama_mentor;
        $title['nama_kader'] = $kader->nama_kader;
        $title['divisi'] = $kader->nama_divisi;
        $title['departemen'] = $kader->nama_departemen;
        $title['bu'] = $kader->company_name;
        $title['iq'] = $kader->iq;
        $title['ipk'] = $kader->ipk;
        $title['ojt'] = $request->ojt;
        $title['rangeMonth'] = $rangeMonth;
        $title['batch'] = $this->ToRomawi($kader->nama_batch) . ' - ' . $kader->tahun_batch;
        $batch = $this->ToRomawi($kader->nama_batch);
        $tahun = $kader->tahun_batch;
        // dd($avg,$avg2);
        $performance_sums = PerformanceSum::where('nik_kader', $request->nik_kader)
            ->where('ojt', $request->ojt)
            ->first();
        $mentor_percent = Jawaban::select('jawaban.created_by', 'jawaban.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->where('jawaban.nik_kader', $request->nik_kader)
            ->where('users.type', 'Mentor')
            ->whereIn('weeks.angka_week', $week_arr)
            ->groupBy('jawaban.created_by', 'jawaban.id_week')
            ->get()
            ->count();
        if ($mentor_percent > 0) {
            $mentor_percent = ($mentor_percent / 6) * 100;
        }

        $kader_percent = Jawaban::select('jawaban.created_by', 'jawaban.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('weeks_kader', 'jawaban.id_week', 'weeks_kader.id_week')
            ->where('jawaban.nik_kader', $request->nik_kader)
            ->where('users.type', 'Kader')
            ->whereIn('weeks_kader.angka_week', $week_arr_kader)
            ->groupBy('jawaban.created_by', 'jawaban.id_week')
            ->get()
            ->count();
        if ($kader_percent > 0) {
            $kader_percent = ($kader_percent / 12) * 100;
        }

        $file = PerformanceSum::where('nik_kader', $request->nik_kader)
            ->where('ojt', $request->ojt)->first();

        return view('pages.report.weekly_monitoring', compact('week', 'reports', 'avg', 'learningG', 'kkm', 'data_lg', 'title', 'pertanyaans', 'data', 'week_arr', 'avg_week', 'data_kkm', 'batch', 'tahun', 'data2', 'avg_2', 'data3', 'performance_sums', 'mentor_percent', 'kader_percent', 'months', 'file'));
    }

    public function weekly_index()
    {
        $kaders = Kader::select('kader.nama', 'kader.nik')
            ->join('jawaban', 'kader.nik', 'jawaban.nik_kader')
            // ->whereNotNull('jawaban.nama_mentor')
            ->groupBy('kader.nama', 'kader.nik')
            ->orderBy('nama', 'asc')
            ->get();
        $user = Auth::user();
        if ($user->type == 'Mentor') {
            $kaders = Kader::select('kader.nik', 'kader.nama')
                ->join('jawaban', 'kader.nik', 'jawaban.nik_kader')
                ->where('jawaban.created_by', $user->id)
                ->orderBy('kader.nama', 'asc')
                ->groupBy('kader.nik', 'kader.nama')
                ->get();
        }
        $title = 'OJT Monitoring';

        return view('pages.report.report_index', compact('kaders', 'title'));
    }

    public function feedback_index()
    {
        $title = 'Report Feedback';
        return view('pages.report.report_index', compact('title'));
    }

    public function report_feedback(Request $request)
    {
        if ($request->usertype == 'Mentor') {
            $datas = Kader::select('kader.id', 'kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama as divisi', 'departemens.nama as departement', 'batch.nama_batch', 'batch.tahun_batch', 'kader.nik', 'jawaban.nik_kader')
                ->leftJoin('company', 'kader.company_code', 'company.company_code')
                ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
                ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
                ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
                ->leftJoin('jawaban', 'kader.nik', 'jawaban.nik_kader')
                ->leftJoin('feedback_mai', 'kader.nik', 'feedback_mai.nik_kader')
                // ->join('performance_summary','kader.nik','performance_summary.nik_kader')
                ->groupBy('kader.id', 'kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama', 'departemens.nama', 'jawaban.nik_kader', 'kader.nik', 'batch.nama_batch', 'batch.tahun_batch')
                ->get();
            $mentor[] = [];

            switch ($request->ojt) {
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
            $jawaban = [];

            $weeks = Week::whereIn('angka_week', $arr_week)->orderBy('angka_week', 'asc')->get();
            foreach ($datas as $value) {
                $data_mentor = Jawaban::select('jawaban.nama_mentor', 'jawaban.nik_kader')
                    ->where('jawaban.nik_kader', $value->nik)
                    ->groupBy('jawaban.nama_mentor', 'jawaban.nik_kader')
                    ->get();

                foreach ($data_mentor as $dt) {
                    if (!isset($mentor[$dt->nik_kader])) {
                        $mentor[$dt->nik_kader] = []; // Initialize as an array if not set
                    }
                    array_push($mentor[$dt->nik_kader], $dt->nama_mentor);
                    unset($mentor[$dt->nik_kader][0]);
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

            $pertanyaans = Pertanyaan::where('type', 'Mentor')->get();

            $performance_sums = PerformanceSum::where('ojt', $request->ojt)->get();

            $ojt = $request->ojt;

            $feedbacks = FeedbackMai::with('details')->get();
            $user_type = $request->usertype;
            return view('pages.report.feedback', compact('datas', 'mentor', 'jawaban', 'pertanyaans', 'weeks', 'performance_sums', 'ojt', 'feedbacks', 'user_type', 'arr_week'));
        } elseif ($request->usertype == 'Kader') {
            $datas = Kader::select('kader.id', 'kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama as divisi', 'departemens.nama as departement', 'batch.nama_batch', 'batch.tahun_batch', 'kader.nik', 'jawaban.nik_kader', 'company.company_shortname')
                ->leftJoin('company', 'kader.company_code', 'company.company_code')
                ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
                ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
                ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
                ->leftJoin('jawaban', 'kader.nik', 'jawaban.nik_kader')
                // ->leftJoin('feedback_mai', 'kader.nik', 'feedback_mai.nik_kader')
                // ->join('performance_summary','kader.nik','performance_summary.nik_kader')
                // ->where('kader.nik', 'test.kader.mai')
                // ->where('feedback_mai.user_type','!=', 'mentor')
                ->groupBy('kader.id', 'kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama', 'departemens.nama', 'jawaban.nik_kader', 'kader.nik', 'batch.nama_batch', 'batch.tahun_batch', 'company.company_shortname')
                ->get();
            // Contoh data dari controller (disederhanakan)
            $feedbacks = FeedbackMai::with('details')->get(); // dengan relasi details


            $mentor[] = [];

            switch ($request->ojt) {
                case '1':
                    $arr_week = range(1, 12);
                    break;
                case '2':
                    $arr_week = range(13, 24);
                    break;
                case '3':
                    $arr_week = range(25, 36);
                    break;
                case '4':
                    $arr_week = range(37, 48);
                    break;
                default:
                    $arr_week = [];
                    break;
            }
            $mentor = [];
            $jawaban = [];
            $weeks = WeekKader::whereIn('angka_week', $arr_week)->orderBy('angka_week', 'asc')->get();
            foreach ($datas as $value) {
                $data_mentor = Jawaban::select('jawaban.nama_mentor', 'jawaban.nik_kader')
                    ->where('jawaban.nik_kader', $value->nik)
                    ->groupBy('jawaban.nama_mentor', 'jawaban.nik_kader')
                    ->get();

                foreach ($data_mentor as $dt) {
                    if (!isset($mentor[$dt->nik_kader])) {
                        $mentor[$dt->nik_kader] = []; // Initialize as an array if not set
                    }
                    array_push($mentor[$dt->nik_kader], $dt->nama_mentor);
                    unset($mentor[$dt->nik_kader][0]);
                }

                $data_jawaban = Jawaban::select('jawaban.*', 'pertanyaan.nama_pertanyaan', 'pertanyaan.type')
                    ->where('nik_kader', $value->nik)
                    // ->where('jawaban.created_by', $data_mentor->id)
                    ->join('pertanyaan', 'jawaban.id_pertanyaan', 'pertanyaan.id_pertanyaan')
                    ->get();

                foreach ($data_jawaban as $key => $jwb) {
                    $jawaban[$jwb->id_pertanyaan][$jwb->id_week][$value->nik] = $jwb->jawaban;
                }
            }

            $pertanyaans = Pertanyaan::where('type', 'Kader')->get();

            $ojt = $request->ojt;

            $user_type = $request->usertype;
            return view('pages.report.feedbackkader', compact('datas', 'mentor', 'jawaban', 'pertanyaans', 'weeks', 'ojt', 'feedbacks', 'user_type', 'arr_week'));
        }
    }

    public function report_feedback_back($ojt)
    {
        $datas = Kader::select('kader.nama', 'kader.jenis_kelamin', 'kader.iq', 'kader.ipk', 'company.company_name', 'divisis.nama as divisi', 'departemens.nama as departement', 'batch.nama_batch', 'batch.tahun_batch', 'kader.nik', 'jawaban.nik_kader')
            ->leftJoin('company', 'kader.company_code', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
            ->leftJoin('jawaban', 'kader.nik', 'jawaban.nik_kader')
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
        $weeks = Week::whereIn('angka_week', $arr_week)->get();

        foreach ($datas as $value) {
            $data_mentor = Jawaban::select('jawaban.nama_mentor', 'jawaban.nik_kader')
                ->where('jawaban.nik_kader', $value->nik)
                ->groupBy('jawaban.nama_mentor', 'jawaban.nik_kader')
                ->get();

            foreach ($data_mentor as $dt) {
                if (!isset($mentor[$dt->nik_kader])) {
                    $mentor[$dt->nik_kader] = []; // Initialize as an array if not set
                }
                array_push($mentor[$dt->nik_kader], $dt->nama_mentor);
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
        $pertanyaans = Pertanyaan::get();
        $performance_sums = PerformanceSum::where('ojt', $ojt)->get();

        $ojt = $ojt;


        return view('pages.report.feedback', compact('datas', 'mentor', 'jawaban', 'pertanyaans', 'weeks', 'revisi', 'performance_sums', 'ojt'));
    }

    public function perform_sum_add(Request $request)
    {
        $data = [
            'desc'          => $request->perform_sum,
            'nik_kader'     => $request->nik_kader,
            'ojt'           => $request->ojt,
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ];
        PerformanceSum::create($data);

        ActivityLog::activity_log('Menambah data Performance Summary');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        // return redirect()->route('report.feedback.back', $request->ojt);
        return redirect()->route('reportfeedback.index');
    }

    public function perform_sum_edit(Request $request, $id)
    {
        $data_performsum = PerformanceSum::where('id', $id)->first();
        $data = [
            'desc'          => $request->perform_sum ?? $data_performsum->desc,
            'updated_at'    => now(),
            'updated_by'    => Auth::user()->id
        ];
        PerformanceSum::where('id', $data_performsum->id)->update($data);

        ActivityLog::activity_log('Mengubah data Performance Summary');
        Alert::success('Success', 'Data berhasil diupdate!');

        // return redirect()->route('report.feedback.back', [
        //     'ojt' => $request->ojt,
        //     'user_type' => $request->user_type
        // ]);

        return redirect()->route('reportfeedback.index');
    }

    public function export_reportfeedback($ojt)
    {
        $file_name = 'reportfeedback_mentor_ojt_' . $ojt . '_' . date('d-m-Y_H:i:s') . '.xlsx';

        return Excel::download(new ReportFeedbackExport($ojt), $file_name);
    }
    public function export_reportfeedback_kader($ojt)
    {
        $file_name = 'reportfeedback_kader_ojt_' . $ojt . '_' . date('d-m-Y_H:i:s') . '.xlsx';

        return Excel::download(new ReportFeedbackKaderExport($ojt), $file_name);
    }


    public function upload(Request $request, $id)
    {
        // $request->validate([
        //     'file_assessment' => 'required|file|max:2048'
        // ]);

        $data = PerformanceSum::findOrFail($id);

        // hapus file lama
        if ($data->file_assessment && Storage::disk('public')->exists($data->file_assessment)) {
            Storage::disk('public')->delete($data->file_assessment);
        }

        $path = $request->file('file_assessment')
            ->store('assessment_files', 'public');

        $data->update([
            'file_assessment' => $path
        ]);

        ActivityLog::activity_log('Mengupload file Assessment Point');
        Alert::success('Success', 'Data berhasil diupdate!');

        return redirect()->route('reportfeedback.index');
    }




    function ToRomawi($number)
    {
        $map = array('M' => 1000, 'CM' => 900, 'D' => 500, 'CD' => 400, 'C' => 100, 'XC' => 90, 'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9, 'V' => 5, 'IV' => 4, 'I' => 1);
        $returnValue = '';
        while ($number > 0) {
            foreach ($map as $roman => $int) {
                if ($number >= $int) {
                    $number -= $int;
                    $returnValue .= $roman;
                    break;
                }
            }
        }
        return $returnValue;
    }


    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function show()
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function edit()
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\cr  $cr
     * @return \Illuminate\Http\Response
     */
    public function destroy()
    {
        //
    }
}
