<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\cr;
use App\Models\FeedbackMai;
use App\Models\FmDetail;
use App\Models\Jawaban;
use App\Models\Week;
use App\Models\WeekKader;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;

class FeedbackMaiController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function fm_kader_index()
    {
        $user = Auth::user();
        $feedbacks = FeedbackMai::select('feedback_mai.*', 'weeks_kader.angka_week',)
            ->join('weeks_kader', 'feedback_mai.id_week', 'weeks_kader.id_week')
            ->where('feedback_mai.nik_kader', $user->nik)
            ->where('feedback_mai.user_type', 'kader')
            ->get();

        return view('pages.feedbackmai.fm_kader', compact('feedbacks'));
    }

    public function fm_kader_export($id_week)
    {
        $user = Auth::user();
        $feedback = FeedbackMai::select('feedback_mai.*', 'company.company_name', 'departemens.nama as nama_dept', 'kader.nama as nama_kader', 'weeks_kader.angka_week', 'batch.nama_batch')
            ->join('kader', 'feedback_mai.nik_kader', 'kader.nik')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('weeks_kader', 'feedback_mai.id_week', 'weeks_kader.id_week')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->where('feedback_mai.id_week', $id_week)
            ->where('feedback_mai.nik_kader', $user->nik)
            ->where('feedback_mai.user_type', 'kader')
            // ->with(['details','kaders'])
            ->first();
        $file_name = 'fm-kader-' . $feedback->nama_kader . '-Week' . $feedback->angka_week . '-' . now() . '.pdf';
        $pdf = Pdf::loadView('pdf.feedbackmai', compact('feedback'));

        return $pdf->download($file_name);
    }

    public function fm_mentor_index()
    {
        $user = Auth::user();

        $kader = Jawaban::select('nik_kader')
            ->where('created_by', $user->id)
            ->groupBy('nik_kader')
            ->pluck('nik_kader')
            ->toArray();

        $feedbacks = FeedbackMai::select('feedback_mai.*', 'weeks.angka_week')
            ->join('weeks', 'feedback_mai.id_week', 'weeks.id_week')
            ->whereIn('feedback_mai.nik_kader', $kader)
            ->where('feedback_mai.user_type', 'mentor')
            ->get();


        return view('pages.feedbackmai.fm_mentor', compact('feedbacks'));
    }

    public function fm_mentor_export($id_week, $nik_kader)
    {
        $user = Auth::user();

        $feedback = FeedbackMai::select('feedback_mai.*', 'company.company_name', 'departemens.nama as nama_dept', 'kader.nama as nama_kader', 'weeks.angka_week', 'batch.nama_batch')
            ->join('kader', 'feedback_mai.nik_kader', 'kader.nik')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('weeks', 'feedback_mai.id_week', 'weeks.id_week')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->where('feedback_mai.id_week', $id_week)
            ->where('feedback_mai.nik_kader', $nik_kader)
            ->where('feedback_mai.user_type', 'mentor')
            // ->with(['details','kaders'])
            ->first();
        $file_name = 'fm-mentor-' . $feedback->nama_mentor . '-Week' . $feedback->angka_week . '-' . now() . '.pdf';
        $pdf = Pdf::loadView('pdf.feedbackmaiM', compact('feedback'));

        return $pdf->download($file_name);
    }

    public function feedbackmai(Request $request)
    {

        $feedbackmai = [
            'id_feedbackmai'    => Str::uuid(),
            'id_week'           => $request->id_week,
            'nik_kader'         => $request->nik_kader,
            'nama_mentor'       => $request->nama_mentor ?? null,
            'tk_keterlibatan'   => $request->tk_keterlibatan ?? null,
            'kesimpulan'        => $request->kesimpulan ?? null,
            'user_type'         => 'kader',
            'created_at'        => now()
        ];

        $id_feedbackmai = $feedbackmai['id_feedbackmai'];
        FeedbackMai::create($feedbackmai);

        $jenisInputs = [
            'keterampilan',
            'tantangan',
            'harapan'
        ];

        foreach ($jenisInputs as $jenis) {
            if (isset($request->$jenis) && count($request->$jenis) > 0) {
                foreach ($request->$jenis as $key => $val) {
                    $fm_detail = [
                        'id_fmdetail'    => Str::uuid(),
                        'id_feedbackmai' => $id_feedbackmai,
                        'no_idx'         => $key + 1,
                        'jenis'          => $jenis, // new column to identify type
                        'var'            => $val['var'] ?? null,
                        'desc'           => $val['desc'] ?? null,
                        'created_at'     => now()
                    ];
                    FmDetail::create($fm_detail);
                }
            }
        }


        ActivityLog::activity_log('Menambah data Feedback MAI pada Kader');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('reportfeedback.index');
    }

    public function feedbackmaiM(Request $request)
    {
        $feedbackmaiM = [
            'id_feedbackmai'    => Str::uuid(),
            'id_week'           => $request->id_week_add,
            'nik_kader'         => $request->nik_kader,
            'nama_mentor'       => $request->nama_mentor ?? null,
            'tk_keterlibatan'   => $request->tk_keterlibatan ?? null,
            'kesimpulan'        => $request->kesimpulan ?? null,
            'user_type'         => 'mentor',
            'created_at'        => now()
        ];
        $id_feedbackmai = $feedbackmaiM['id_feedbackmai'];
        FeedbackMai::create($feedbackmaiM);

        $jenisInputs = [
            'peningkatan',
        ];

        foreach ($jenisInputs as $jenis) {
            if (isset($request->$jenis) && count($request->$jenis) > 0) {
                foreach ($request->$jenis as $key => $val) {
                    $fm_detail = [
                        'id_fmdetail'    => Str::uuid(),
                        'id_feedbackmai' => $id_feedbackmai,
                        'no_idx'         => $key + 1,
                        'jenis'          => $jenis, // new column to identify type
                        'var'            => $val['var'] ?? null,
                        'desc'           => $val['desc'] ?? null,
                        'created_at'     => now()
                    ];
                    FmDetail::create($fm_detail);
                }
            }
        }

        ActivityLog::activity_log('Menambah data Feedback MAI pada Mentor');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('reportfeedback.index');
    }

    public function exportPdf($id)
    {
        $feedback = FeedbackMai::select('feedback_mai.*', 'company.company_name', 'departemens.nama as nama_dept', 'kader.nama as nama_kader', 'weeks_kader.angka_week', 'batch.nama_batch')
            ->join('kader', 'feedback_mai.nik_kader', 'kader.nik')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('weeks_kader', 'feedback_mai.id_week', 'weeks_kader.id_week')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->where('id_feedbackmai', $id)
            ->first();
        $file_name = 'fm-kader-' . $feedback->nama_kader . '-Week' . $feedback->angka_week . '-' . now() . '.pdf';
        $pdf = PDF::loadView('pdf.feedbackmai', compact('feedback'));

        return $pdf->download($file_name);
    }

    public function exportPdfM($id)
    {
        $feedback = FeedbackMai::select('feedback_mai.*', 'company.company_name', 'departemens.nama as nama_dept', 'kader.nama as nama_kader', 'weeks.angka_week', 'batch.nama_batch')
            ->join('kader', 'feedback_mai.nik_kader', 'kader.nik')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->join('departemens', 'kader.id_departemen', 'departemens.id')
            ->join('weeks', 'feedback_mai.id_week', 'weeks.id_week')
            ->join('batch', 'kader.id_batch', 'batch.id_batch')
            ->where('id_feedbackmai', $id)
            ->first();
        $nm_mentor = $feedback->nama_mentor ?? 'NULL';
        $file_name = 'fm-mentor-' . $nm_mentor . '-Week' . $feedback->angka_week . '-' . now() . '.pdf';

        $pdf = PDF::loadView('pdf.feedbackmaiM', compact('feedback'));

        return $pdf->download($file_name);
    }

    public function getByWeek(Request $request)
    {
        $id_week = $request->id_week;
        $id_kader = $request->id_kader;
        $feedbacks = FeedbackMai::with(['details', 'kaders'])
            ->where('user_type', 'kader')
            ->where('id_week', $id_week)
            ->where('nik_kader', $id_kader)
            ->get();

        return view('partials.feedback-modal', compact('feedbacks'))->render();
    }
    public function getByWeekM(Request $request)
    {
        $id_week = $request->id_week;
        $id_kader = $request->id_kader;
        $feedbacks = FeedbackMai::with(['details', 'kaders'])
            ->where('user_type', 'mentor')
            ->where('id_week', $id_week)
            ->where('nik_kader', $id_kader)
            ->get();
        return view('partials.feedbackM-modal', compact('feedbacks'))->render();
    }

    public function feedbackmai_update(Request $request, $id)
    {
        $feedback_mai = FeedbackMai::where('id_feedbackmai', $id)->first();
        // Update kesimpulan
        FeedbackMai::where('id_feedbackmai', $id)
            ->update([
                'kesimpulan' => $request->kesimpulan ?? $feedback_mai->kesimpulan,
                'nama_mentor' => $request->nama_mentor ?? $feedback_mai->nama_mentor,
            ]);

        // Update detail berdasarkan jenis
        foreach (['keterampilan', 'tantangan', 'harapan'] as $jenis) {
            if ($request->has($jenis)) {
                foreach ($request->$jenis as $key => $detail) {
                    $data_update = [
                        'var' => $detail['var'],
                        'desc' => $detail['desc'],
                    ];
                    // $fmdetail = FmDetail::where('id_feedbackmai', $id)
                    //                     ->where('jenis',$jenis)
                    //                     ->first();
                    FmDetail::where('id_feedbackmai', $id)
                        ->where('jenis', $jenis)->where('no_idx', $key + 1)
                        ->update($data_update);
                }
            }
        }

        ActivityLog::activity_log('Mengubah data Feedback MAI pada Kader');
        Alert::success('Success', 'Data berhasil Diupdate!');
        return redirect()->route('reportfeedback.index');
    }

    public function feedbackmai_updateM(Request $request, $id)
    {
        // Update kesimpulan
        $feedback_mai = FeedbackMai::where('id_feedbackmai', $id)->first();
        FeedbackMai::where('id_feedbackmai', $id)
            ->update([
                'tk_keterlibatan'   => $request->tk_keterlibatan ?? $feedback_mai->tk_keterlibatan,
                'kesimpulan'        => $request->kesimpulan ?? $feedback_mai->kesimpulan,
                'nama_mentor'        => $request->nama_mentor ?? $feedback_mai->nama_mentor,
            ]);

        // Update detail berdasarkan jenis
        foreach (['peningkatan'] as $jenis) {
            if ($request->has($jenis)) {
                foreach ($request->$jenis as $key => $detail) {
                    $data_update = [
                        'var' => $detail['var'],
                        'desc' => $detail['desc'],
                    ];
                    // $fmdetail = FmDetail::where('id_feedbackmai', $id)
                    //                     ->where('jenis',$jenis)
                    //                     ->first();
                    FmDetail::where('id_feedbackmai', $id)
                        ->where('jenis', $jenis)->where('no_idx', $key + 1)
                        ->update($data_update);
                }
            }
        }

        ActivityLog::activity_log('Mengubah data Feedback MAI pada Mentor');
        Alert::success('Success', 'Data berhasil Diupdate!');
        return redirect()->route('reportfeedback.index');
    }

    public function getWeeks(Request $request)
    {
        $nik_kader = $request->nik_kader;

        // Week yang sudah diambil kader ini
        $week_fm = FeedbackMai::where('user_type', 'kader')
            ->where('nik_kader', $nik_kader)
            ->pluck('id_week')
            ->toArray();

        // Semua week yang belum dipakai kader ini
        $weeks = WeekKader::whereNotIn('id_week', $week_fm)
            ->orderBy('angka_week', 'asc')
            ->pluck('angka_week', 'id_week');
        return response()->json($weeks);
    }

    public function getWeeksM(Request $request)
    {
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

        $nik_kader = $request->nik_kader;

        // Week yang sudah diambil kader ini
        $week_fm = FeedbackMai::where('user_type', 'mentor')
            ->where('nik_kader', $nik_kader)
            ->pluck('id_week')
            ->toArray();

        // Semua week yang belum dipakai kader ini
        $weeks = Week::whereNotIn('id_week', $week_fm)
            ->orderBy('angka_week', 'asc')
            ->pluck('angka_week', 'id_week');
        return response()->json($weeks);
    }

    public function getMentor(Request $request)
    {
        $nama_mentor = Jawaban::select('nama_mentor')
                                ->where('id_week',$request->id_week)
                                ->where('nik_kader',$request->id_kader)
                                ->whereNotNull('nama_mentor')
                                ->groupBy('nama_mentor')
                                ->pluck('nama_mentor');
        return response()->json($nama_mentor);
    }
}
