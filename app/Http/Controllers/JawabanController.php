<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Pertanyaan;
use App\Models\Week;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class JawabanController extends Controller
{
    protected $user;

    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware(function ($request, $next) {
            $this->user = Auth::user();

            return $next($request);
        });
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $jawabans = Jawaban::select('weeks.angka_week')
            // ->rightJoin('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan', 'weeks.angka_week')
            ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
            ->groupBy('weeks.angka_week')
            ->get();
        $weeks = Week::orderBy('angka_week', 'asc')->get();
        $kaders = Kader::orderBy('nama', 'asc')->get();
        $pertanyaans = Pertanyaan::get();

        return view('pages.jawaban.index', compact('jawabans', 'weeks', 'kaders', 'pertanyaans'));
    }
    public function feedback()
    {
        $subject = Pertanyaan::where('type', 'Subject ' . $this->user->type)->first();
        // $subject = Pertanyaan::where('type','Subject Kader')->first();

        $weeks = Week::orderBy('angka_week', 'asc')->get();
        $company = Company::where('company_code', $this->user->company_code)->first();
        $kaders = Kader::where('company_code', $company->company_code)
            ->orderBy('nama', 'asc')
            ->get();
        $pertanyaans = Pertanyaan::where('type', $this->user->type)->orderBy('id_pertanyaan', 'asc')->get();
        $no = 1;
        foreach ($pertanyaans as $val) {
            $pertanyaan[$no] = $val->nama_pertanyaan;
            $id_pertanyaan[$no] = $val->id_pertanyaan;
            $no++;
        }
        $counts = count($pertanyaans);

        if ($this->user->type == 'Mentor') {
            return view('pages.jawaban.feedback', compact('subject', 'weeks', 'kaders', 'counts', 'pertanyaan', 'id_pertanyaan'));
        } elseif ($this->user->type == 'Kader') {
            return view('pages.jawaban.feedback_kader', compact('subject', 'weeks', 'kaders', 'counts', 'pertanyaan', 'id_pertanyaan'));
        }
    }
    public function feedback_user($angka_week)
    {
        $kaders = Jawaban::select('users.name as nama', 'users.type', 'company.company_shortname as bu')
            ->where('weeks.angka_week', $angka_week)
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->join('kader', 'jawaban.nik_kader', 'kader.nik')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->whereNull('jawaban.nama_mentor')
            ->groupBy('users.name', 'users.type', 'company.company_shortname');
        $mentors = Jawaban::select('jawaban.nama_mentor as nama', 'users.type', 'company.company_shortname as bu')
            ->where('weeks.angka_week', $angka_week)
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('company', 'users.company_code', 'company.company_code')
            ->whereNotNull('jawaban.nama_mentor')
            ->groupBy('jawaban.nama_mentor', 'users.type', 'company.company_shortname');

        $users = $kaders->unionAll($mentors)->get();
        $week = $angka_week;
        return view('pages.jawaban.feedback_user', compact('users', 'week'));
    }
    public function feedback_store(Request $request)
    {
        try {
            $jawaban_mentor['1'] = '';
            if (isset($request->pertanyaan1_mentor_1)) {
                $jawaban_mentor['1'] = '1';
            } elseif (isset($request->pertanyaan1_mentor_2)) {
                $jawaban_mentor['1'] = '2';
            } elseif (isset($request->pertanyaan1_mentor_3)) {
                $jawaban_mentor['1'] = '3';
            } elseif (isset($request->pertanyaan1_mentor_4)) {
                $jawaban_mentor['1'] = '4';
            } elseif (isset($request->pertanyaan1_mentor_5)) {
                $jawaban_mentor['1'] = '5';
            } elseif (isset($request->pertanyaan1_mentor_7)) {
                $jawaban_mentor['1'] = '7';
            } elseif (isset($request->pertanyaan1_mentor_8)) {
                $jawaban_mentor['1'] = '8';
            } elseif (isset($request->pertanyaan1_mentor_9)) {
                $jawaban_mentor['1'] = '9';
            } elseif (isset($request->pertanyaan1_mentor_10)) {
                $jawaban_mentor['1'] = '10';
            }

            $jawaban_mentor['2'] = '';
            if (isset($request->pertanyaan2_mentor_1)) {
                $jawaban_mentor['2'] = '1';
            } elseif (isset($request->pertanyaan2_mentor_2)) {
                $jawaban_mentor['2'] = '2';
            } elseif (isset($request->pertanyaan2_mentor_3)) {
                $jawaban_mentor['2'] = '3';
            } elseif (isset($request->pertanyaan2_mentor_4)) {
                $jawaban_mentor['2'] = '4';
            } elseif (isset($request->pertanyaan2_mentor_5)) {
                $jawaban_mentor['2'] = '5';
            } elseif (isset($request->pertanyaan2_mentor_7)) {
                $jawaban_mentor['2'] = '7';
            } elseif (isset($request->pertanyaan2_mentor_8)) {
                $jawaban_mentor['2'] = '8';
            } elseif (isset($request->pertanyaan2_mentor_9)) {
                $jawaban_mentor['2'] = '9';
            } elseif (isset($request->pertanyaan2_mentor_10)) {
                $jawaban_mentor['2'] = '10';
            }

            $jawaban_mentor['3'] = '';
            if (isset($request->pertanyaan3_mentor_1)) {
                $jawaban_mentor['3'] = '1';
            } elseif (isset($request->pertanyaan3_mentor_2)) {
                $jawaban_mentor['3'] = '2';
            } elseif (isset($request->pertanyaan3_mentor_3)) {
                $jawaban_mentor['3'] = '3';
            } elseif (isset($request->pertanyaan3_mentor_4)) {
                $jawaban_mentor['3'] = '4';
            } elseif (isset($request->pertanyaan3_mentor_5)) {
                $jawaban_mentor['3'] = '5';
            } elseif (isset($request->pertanyaan3_mentor_7)) {
                $jawaban_mentor['3'] = '7';
            } elseif (isset($request->pertanyaan3_mentor_8)) {
                $jawaban_mentor['3'] = '8';
            } elseif (isset($request->pertanyaan3_mentor_9)) {
                $jawaban_mentor['3'] = '9';
            } elseif (isset($request->pertanyaan3_mentor_10)) {
                $jawaban_mentor['3'] = '10';
            }

            $jawaban_mentor['4'] = '';
            if (isset($request->pertanyaan4_mentor_1)) {
                $jawaban_mentor['4'] = '1';
            } elseif (isset($request->pertanyaan4_mentor_2)) {
                $jawaban_mentor['4'] = '2';
            } elseif (isset($request->pertanyaan4_mentor_3)) {
                $jawaban_mentor['4'] = '3';
            } elseif (isset($request->pertanyaan4_mentor_4)) {
                $jawaban_mentor['4'] = '4';
            } elseif (isset($request->pertanyaan4_mentor_5)) {
                $jawaban_mentor['4'] = '5';
            } elseif (isset($request->pertanyaan4_mentor_7)) {
                $jawaban_mentor['4'] = '7';
            } elseif (isset($request->pertanyaan4_mentor_8)) {
                $jawaban_mentor['4'] = '8';
            } elseif (isset($request->pertanyaan4_mentor_9)) {
                $jawaban_mentor['4'] = '9';
            } elseif (isset($request->pertanyaan4_mentor_10)) {
                $jawaban_mentor['4'] = '10';
            }

            $count_pertanyaan = Pertanyaan::where('type', 'Mentor')->get()->count();
            // dd($request);
            for ($i = 1; $i <= $count_pertanyaan; $i++) {
                $data[$i] = [
                    'id_week'       => $request->id_week,
                    'id_pertanyaan' => $request->id_pertanyaan . $i,
                    'jawaban'       => $i <= 4 ? $jawaban_mentor[$i] : $request->pertanyaan_mentor[$i],
                    'nama_mentor'   => $request->nama_mentor,
                    'nik_kader'     => $request->nik_kader,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                    'created_by'    => Auth::user()->id
                ];
                Jawaban::create($data[$i]);
            }
            Alert::success('Success', 'Feedback berhasil disubmit!');
            return redirect()->route('feedback.index');
        } catch (\Throwable $th) {
            log::info($th);
            Alert::warning('Failed', 'Feedback gagal disubmit!');
            return redirect()->route('feedback.index');
        }
    }

    public function feedback_kader_store(Request $request)
    {
        // try {
        // dd($request);
        $bu = Company::where('company_code', $this->user->company_code)->first();
        $week = Week::where('id_week', $request->id_week)->first();
        $name = str_replace(' ', '_', $this->user->name);
        $file = $request->file('jawaban_kader')[4]->getClientOriginalName();
        $file = explode('.', $file);
        $ext_name = end($file);
        $nama_file =  $name . '_' . $bu->company_shortname . '_' . $week->angka_week . '.' . $ext_name;
        $count_pertanyaan = Pertanyaan::where('type', 'Kader')->get()->count();

        for ($i = 1; $i <= $count_pertanyaan; $i++) {
            // dd($request['id_pertanyaan'.$i]);
            if ($i == 4) {
                $request->file('jawaban_kader')[$i]->move(public_path('assets/file'), $nama_file);
            }
            $data[$i] = [
                'id_week'       => $request->id_week,
                'id_pertanyaan' => $request['id_pertanyaan' . $i],
                'jawaban'       => $i < 4 ? $request->jawaban_kader[$i] : $nama_file,
                'nama_mentor'   => $request->nama_mentor ?? null,
                'nik_kader'     => $request->nik_kader ?? Auth::user()->nik,
                'created_at'    => now(),
                'updated_at'    => now(),
                'created_by'    => Auth::user()->id
            ];

            Jawaban::create($data[$i]);
        }
        Alert::success('Success', 'Feedback berhasil disubmit!');
        return redirect()->route('feedback.index');
        // } catch (\Throwable $th) {
        //     log::info($th);
        //     Alert::warning('Failed', 'Feedback gagal disubmit!');
        //     return redirect()->route('feedback.index');
        // }
    }

    public function detail($param)
    {
        $split = explode('-', $param);
        $angka_week = $split[0];
        $user_name = str_replace('_', ' ', $split[1]);

        $jawabans = Jawaban::select('jawaban.*', 'weeks.angka_week', 'pertanyaan.nama_pertanyaan', 'weeks.angka_week')
            ->join('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan')
            ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->where(function ($query) use ($user_name) {
                $query->where('jawaban.nama_mentor', $user_name)
                    ->orWhere('users.name', $user_name);
            })
            ->where('weeks.angka_week', $angka_week)
            ->get();

        $title = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'users.name as nama_mentor', 'users.type')
            ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
            ->join('kader', 'jawaban.nik_kader', 'kader.nik')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->where('weeks.angka_week', $angka_week)
            ->where(function ($query) use ($user_name) {
                $query->where('jawaban.nama_mentor', $user_name)
                    ->orWhere('users.name', $user_name);
            })
            ->first();


        $week = $angka_week;

        return view('pages.jawaban.detail', compact('jawabans', 'week', 'title'));
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
        try {
            $data = [
                'id_week'           => $request->id_week,
                'id_pertanyaan'     => $request->id_pertanyaan,
                'nama_mentor'       => $request->nama_mentor,
                'nik_kader'         => $request->nik_kader,
                'jawaban'           => $request->jawaban,
                'created_at'        => now(),
                'updated_at'        => now(),
                'created_by'        => Auth::user()->id,
            ];
            Jawaban::create($data);

            Alert::success('Success', 'Data berhasil ditambahkan!');
            return redirect()->route('jawaban.index');
        } catch (\Throwable $th) {
            Alert::warning('Failed', 'Data gagal ditambahkan!');
            return redirect()->route('jawaban.index');
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Jawaban  $jawaban
     * @return \Illuminate\Http\Response
     */
    public function show(Jawaban $jawaban)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Jawaban  $jawaban
     * @return \Illuminate\Http\Response
     */
    public function edit(Jawaban $jawaban)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Jawaban  $jawaban
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id_jawaban)
    {
        Jawaban::where('id_jawaban', $id_jawaban)
            ->update(['essay_revisi' => $request->essay_revisi]);
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->back();
        // $jawaban = Jawaban::where('id_pertanyaan', $id_pertanyaan)->first();


        // if ($jawaban) {
        //     $data = [
        //         'id_week'           => $request->id_week ??  $jawaban->id_week,
        //         'id_pertanyaan'     => $request->id_pertanyaan ?? $jawaban->id_pertanyaan,
        //         'nama_mentor'       => $request->nama_mentor ?? $jawaban->nama_mentor,
        //         'nik_kader'         => $request->nik_kader ?? $jawaban->nik_kader,
        //         'jawaban'           => $request->jawaban ?? $jawaban->jawaban,
        //         'created_at'        => now(),
        //         'updated_at'        => now(),
        //         'created_by'        => Auth::user()->id,
        //     ];

        //     Jawaban::where('id_pertanyaan', $id_pertanyaan)
        //         ->update($data);
        // } else {
        //     $data = [
        //         'id_week'           => $jawaban->id_week ?? $request->id_week,
        //         'id_pertanyaan'     => $jawaban->id_pertanyaan ?? $request->id_pertanyaan,
        //         'nama_mentor'       => $jawaban->nama_mentor ?? $request->nama_mentor,
        //         'nik_kader'         => $jawaban->nik_kader ?? $request->nik_kader,
        //         'jawaban'           => $jawaban->jawaban ?? $request->jawaban,
        //         'created_at'        => now(),
        //         'updated_at'        => now(),
        //         'created_by'        => Auth::user()->id,
        //     ];
        //     Jawaban::create($data);
        // }


    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Jawaban  $jawaban
     * @return \Illuminate\Http\Response
     */
    public function destroy(Jawaban $jawaban)
    {
        //
    }
}
