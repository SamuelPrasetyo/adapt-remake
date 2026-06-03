<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Company;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Nilai;
use App\Models\Pertanyaan;
use App\Models\User;
use App\Models\Week;
use App\Models\WeekKader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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
    public function index($usertype)
    {
        if ($usertype == 'Mentor') {
            $jawabans = Jawaban::select('weeks.angka_week')
                ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
                ->groupBy('weeks.angka_week')
                ->get();
            $weeks = Week::orderBy('angka_week', 'asc')->get();
        } elseif ($usertype == 'Kader') {
            $jawabans = Jawaban::select('weeks_kader.angka_week')
                ->join('weeks_kader', 'weeks_kader.id_week', 'jawaban.id_week')
                ->groupBy('weeks_kader.angka_week')
                ->get();
            $weeks = WeekKader::orderBy('angka_week', 'asc')->get();
        }

        $kaders = Kader::orderBy('nama', 'asc')->get();
        $pertanyaans = Pertanyaan::get();

        $userType = $usertype;

        return view('pages.jawaban.index', compact('jawabans', 'weeks', 'kaders', 'pertanyaans', 'userType'));
    }
    public function feedback()
    {
        $subject = Pertanyaan::where('type', 'Subject ' . $this->user->type)->where('status', 'Aktif')->first();

        $company = Company::where('company_code', $this->user->company_code)->first();
        $kaders = Kader::where('company_code', $company->company_code)
            ->orderBy('nama', 'asc')
            ->get(['nik', 'nama']);

        $pertanyaans = Pertanyaan::where('type', $this->user->type)->where('status', 'Aktif')->orderBy('id_pertanyaan', 'asc')->get();
        $pertanyaan    = [];
        $id_pertanyaan = [];
        $no = 1;
        foreach ($pertanyaans as $val) {
            $pertanyaan[$no]    = strip_tags($val->nama_pertanyaan);
            $id_pertanyaan[$no] = $val->id_pertanyaan;
            $no++;
        }

        $nilai = Nilai::orderBy('id_nilai', 'asc')->get(['nama_nilai']);

        if ($this->user->type == 'Mentor') {
            // Mentor mengisi utk kader di batch yang sedang berjalan.
            $idBatch = optional(Batch::current())->id_batch;
            $done = Jawaban::select('weeks.angka_week')
                ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
                ->where('jawaban.created_by', $this->user->id)
                ->groupBy('weeks.angka_week')
                ->pluck('weeks.angka_week')
                ->toArray();

            $weeks = Week::available()
                ->when($idBatch, fn($q) => $q->forBatch($idBatch))
                ->orderBy('angka_week', 'asc')
                ->whereNotIn('angka_week', $done)
                ->get(['id_week', 'angka_week']);
        } else {
            // Kader mengisi refleksi utk batch-nya sendiri.
            $idBatch = Kader::where('nik', $this->user->nik)->value('id_batch');
            $done = Jawaban::select('weeks_kader.angka_week')
                ->join('weeks_kader', 'jawaban.id_week', 'weeks_kader.id_week')
                ->where('jawaban.created_by', $this->user->id)
                ->groupBy('weeks_kader.angka_week')
                ->pluck('weeks_kader.angka_week')
                ->toArray();

            $weeks = WeekKader::available()
                ->when($idBatch, fn($q) => $q->forBatch($idBatch))
                ->orderBy('angka_week', 'asc')
                ->whereNotIn('angka_week', $done)
                ->get(['id_week', 'angka_week']);
        }

        return Inertia::render('FeedbackSurvey/Index', [
            'subject'      => $subject ? strip_tags($subject->nama_pertanyaan) : null,
            'weeks'        => $weeks,
            'kaders'       => $kaders,
            'pertanyaan'   => $pertanyaan,
            'idPertanyaan' => $id_pertanyaan,
            'nilai'        => $nilai,
            'userType'     => $this->user->type,
        ]);
    }
    public function feedback_user($angka_week, $usertype)
    {

        $kaders = Jawaban::select('users.name as nama', 'users.type', 'company.company_shortname as bu')
            ->where('weeks.angka_week', $angka_week)
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->join('kader', 'jawaban.nik_kader', 'kader.nik')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('company', 'kader.company_code', 'company.company_code')
            ->whereNull('jawaban.nama_mentor')
            ->where('users.type', $usertype)
            ->groupBy('users.name', 'users.type', 'company.company_shortname');
        $mentors = Jawaban::select('jawaban.nama_mentor as nama', 'users.type', 'company.company_shortname as bu')
            ->where('weeks.angka_week', $angka_week)
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('company', 'users.company_code', 'company.company_code')
            ->whereNotNull('jawaban.nama_mentor')
            ->where('users.type', $usertype)
            ->groupBy('jawaban.nama_mentor', 'users.type', 'company.company_shortname');

        $users = $kaders->unionAll($mentors)->get();
        $week = $angka_week;
        $userType = $usertype;
        return view('pages.jawaban.feedback_user', compact('users', 'week', 'userType'));
    }
    public function feedback_store(Request $request)
    {
        // Anti-fraud: week milik batch kader, sudah berjalan, & belum terisi.
        $idBatch = Kader::where('nik', $request->nik_kader)->value('id_batch');
        $valid = Week::available()->where('id_week', $request->id_week)
            ->when($idBatch, fn($q) => $q->forBatch($idBatch))->exists();
        $dup = Jawaban::where('nik_kader', $request->nik_kader)
            ->where('id_week', $request->id_week)
            ->whereNotNull('nama_mentor')->exists();
        if (!$valid || $dup) {
            Alert::warning('Failed', 'Week tidak valid, belum berjalan, atau sudah terisi.');
            return redirect()->route('feedback.index');
        }

        try {
            $jawaban_mentor['1'] = $request->pertanyaan1_mentor;

            $jawaban_mentor['2'] = $request->pertanyaan2_mentor;

            $jawaban_mentor['3'] = $request->pertanyaan3_mentor;

            $jawaban_mentor['4'] = $request->pertanyaan4_mentor;
            $jawaban_mentor['5'] = $request->pertanyaan5_mentor;
            $jawaban_mentor['6'] = $request->pertanyaan6_mentor;
            $count_pertanyaan = Pertanyaan::where('type', 'Mentor')->where('status', 'Aktif')->get()->count();
            for ($i = 1; $i <= $count_pertanyaan; $i++) {
                $jawaban = $jawaban_mentor[$i];

                if ($i == 5) {
                    switch ($jawaban_mentor[$i]) {
                        case 'Sangat Kurang':
                            $jawaban = 1;
                            break;
                        case 'Kurang':
                            $jawaban = 2;
                            break;
                        case 'Cukup':
                            $jawaban = 3;
                            break;
                        case 'Baik':
                            $jawaban = 4;
                            break;
                        case 'Sangat Baik':
                            $jawaban = 5;
                            break;
                    }
                }
                $data[$i] = [
                    'id_week'       => $request->id_week,
                    'id_pertanyaan' => $request->id_pertanyaan . $i,
                    'jawaban'       => $jawaban,
                    'nama_mentor'   => $request->nama_mentor,
                    'nik_kader'     => $request->nik_kader,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                    'created_by'    => Auth::user()->id
                ];
                Jawaban::create($data[$i]);
            }

            ActivityLog::activity_log('Mentor mengisi feedback');
            Alert::success('Terima Kasih', 'Feedback berhasil disubmit!');
            return redirect()->route('feedback.index');
        } catch (\Throwable $th) {
            $errorMessage = $th->getMessage();
            $errorMessageClean = mb_convert_encoding($errorMessage, 'UTF-8', 'UTF-8');
            $errorMessageClean = preg_replace('/[^\x20-\x7E]/', '', $errorMessage);

            ActivityLog::activity_log('Mentor gagal mengisi feedback ', $errorMessageClean);
            Alert::warning('Failed', 'Feedback gagal disubmit!');
            return redirect()->route('feedback.index');
        }
    }

    public function feedback_kader_store(Request $request)
    {
        // Anti-fraud: week milik batch kader, sudah berjalan, & belum terisi.
        $nikKader = $request->nik_kader ?? $this->user->nik;
        $idBatch  = Kader::where('nik', $nikKader)->value('id_batch');
        $valid = WeekKader::available()->where('id_week', $request->id_week)
            ->when($idBatch, fn($q) => $q->forBatch($idBatch))->exists();
        $dup = Jawaban::where('nik_kader', $nikKader)
            ->where('id_week', $request->id_week)
            ->whereNull('nama_mentor')->exists();
        if (!$valid || $dup) {
            Alert::warning('Failed', 'Week tidak valid, belum berjalan, atau sudah terisi.');
            return redirect()->route('feedback.index');
        }

        try {
            $bu = Company::where('company_code', $this->user->company_code)->first();
            $week = WeekKader::where('id_week', $request->id_week)->first();
            $name = str_replace(' ', '_', $this->user->name);
            $file = $request->file('jawaban_kader')[4]->getClientOriginalName();
            $file = explode('.', $file);
            $ext_name = end($file);
            $nama_file =  $name . '_' . $bu->company_shortname . '_' . $week->angka_week . '.' . $ext_name;
            $count_pertanyaan = Pertanyaan::where('type', 'Kader')->where('status', 'Aktif')->get()->count();

            for ($i = 1; $i <= $count_pertanyaan; $i++) {
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
            ActivityLog::activity_log('Kader mengisi feedback');
            Alert::success('Terima Kasih', 'Feedback berhasil disubmit!');
            return redirect()->route('feedback.index');
        } catch (\Throwable $th) {
            $errorMessage = $th->getMessage();
            $errorMessageClean = mb_convert_encoding($errorMessage, 'UTF-8', 'UTF-8');
            $errorMessageClean = preg_replace('/[^\x20-\x7E]/', '', $errorMessage);

            ActivityLog::activity_log('Kader gagal mengisi feedback ', $errorMessageClean);
            Alert::warning('Failed', 'Feedback gagal disubmit!');
            return redirect()->route('feedback.index');
        }
    }

    public function detail($param)
    {
        $split = explode('-', $param);
        $angka_week = $split[0];
        $user_name = str_replace('_', ' ', $split[1]);

        $jawabans = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'weeks.angka_week', 'pertanyaan.nama_pertanyaan', 'weeks.angka_week')
            ->join('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan')
            ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
            ->join('users', 'jawaban.created_by', 'users.id')
            ->join('kader', 'jawaban.nik_kader', 'kader.nik')
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

    public function fetchWeek(Request $request)
    {
        $last_week = Jawaban::select('weeks.angka_week')
            ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
            ->where('jawaban.nik_kader', $request->id_kader)
            ->whereNotNull('jawaban.nama_mentor')
            ->groupBy('weeks.angka_week')
            ->orderBy('weeks.angka_week', 'desc')
            ->get()
            ->toArray();

        $data['weeks'] = Week::orderBy('angka_week', 'asc')->whereNotIn('angka_week', $last_week)->get();

        return response()->json($data);
    }

    public function fetchUser(Request $request)
    {
        $data['users'] = User::where('type', $request->usertype)->get();
        return response()->json($data);
    }

    public function fetchWeekFeedback(Request $request)
    {
        $user = User::where('id', $request->id_user)->first();
        if ($user->type == 'Mentor') {
            $jawaban = Jawaban::select('weeks.angka_week')
                ->join('weeks', 'jawaban.id_week', 'weeks.id_week')
                ->where('jawaban.created_by', $user->id)
                ->whereNotNull('jawaban.nama_mentor')
                ->groupBy('weeks.angka_week')
                ->get();
        } elseif ($user->type == 'Kader') {
            $jawaban = Jawaban::select('weeks_kader.angka_week')
                ->join('weeks_kader', 'jawaban.id_week', 'weeks_kader.id_week')
                ->where('jawaban.created_by', $user->id)
                ->whereNull('jawaban.nama_mentor')
                ->groupBy('weeks_kader.angka_week')
                ->get();
        }

        $week = [];
        foreach ($jawaban as $j) {
            array_push($week, $j->angka_week);
        }
        if ($user->type == 'Mentor') {
            $data['weeks'] = Week::orderBy('angka_week', 'asc')->whereIn('angka_week', $week)->get();
        } elseif ($user->type == 'Kader') {
            $data['weeks'] = WeekKader::orderBy('angka_week', 'asc')->whereIn('angka_week', $week)->get();
        }

        return response()->json($data);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        Jawaban::where('id_jawaban', $id)->update(['essay_revisi' => $request->essay_revisi]);

        ActivityLog::activity_log('Admin berhasil mengubah revisi essay');
        Alert::success('Terima Kasih', 'Revisi Essay berhasil diubah!');
        return redirect()->route('feedbackadmin.index');
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

    public function feedbackadmin_index()
    {
        return Inertia::render('Feedback/Index');
    }
    public function feedbackadmin_store(Request $request)
    {
        $isUserOnly = False;
        $title = '';
        $week = '';
        if ($request->usertype == 'Mentor') {
            if (!isset($request->id_user) && !isset($request->id_week)) {
                $isUserOnly = True;
                return redirect()->route('feedbackadmin.index');
            } else {
                $user = User::where('id', $request->id_user)->first();
                $user_name = $user->name;
                $week = Week::where('id_week', $request->id_week)->first();

                $jawabans = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'weeks.angka_week', 'pertanyaan.nama_pertanyaan', 'weeks.angka_week')
                    ->join('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan')
                    ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
                    ->join('users', 'jawaban.created_by', 'users.id')
                    ->join('kader', 'jawaban.nik_kader', 'kader.nik')
                    ->where(function ($query) use ($user_name) {
                        $query->where('jawaban.nama_mentor', $user_name)
                            ->orWhere('users.name', $user_name);
                    })
                    ->where('weeks.angka_week', $week->angka_week)
                    ->get();


                $title = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'users.name as nama_mentor', 'users.type')
                    ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
                    ->join('kader', 'jawaban.nik_kader', 'kader.nik')
                    ->join('users', 'jawaban.created_by', 'users.id')
                    ->where('weeks.angka_week', $week->angka_week)
                    ->where(function ($query) use ($user_name) {
                        $query->where('jawaban.nama_mentor', $user_name)
                            ->orWhere('users.name', $user_name);
                    })
                    ->first();
                $week = $week->angka_week;
            }
        } elseif ($request->usertype == 'Kader') {
            if (!isset($request->id_user) && !isset($request->id_week)) {
                $isUserOnly = True;
                $jawabans = Jawaban::select('jawaban.jawaban', 'jawaban.nama_mentor', 'kader.nama as nama_kader', 'weeks.angka_week', 'pertanyaan.nama_pertanyaan', 'weeks.angka_week', 'jawaban.nik_kader')
                    ->join('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan')
                    ->join('weeks', 'weeks.id_week', 'jawaban.id_week')
                    ->join('users', 'jawaban.created_by', 'users.id')
                    ->join('kader', 'jawaban.nik_kader', 'kader.nik')
                    ->whereNull('jawaban.nama_mentor')
                    ->orderBy('weeks.angka_week', 'asc')
                    ->orderBy('jawaban.id_pertanyaan', 'asc')
                    ->get()
                    ->groupBy('nama_kader');
            } else {

                $user = User::where('id', $request->id_user)->first();
                $user_name = $user->name;
                $week = WeekKader::where('id_week', $request->id_week)->first();

                $jawabans = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'weeks_kader.angka_week', 'pertanyaan.nama_pertanyaan', 'weeks_kader.angka_week')
                    ->join('pertanyaan', 'pertanyaan.id_pertanyaan', 'jawaban.id_pertanyaan')
                    ->join('weeks_kader', 'weeks_kader.id_week', 'jawaban.id_week')
                    ->join('users', 'jawaban.created_by', 'users.id')
                    ->join('kader', 'jawaban.nik_kader', 'kader.nik')
                    ->where(function ($query) use ($user_name) {
                        $query->where('jawaban.nama_mentor', $user_name)
                            ->orWhere('users.name', $user_name);
                    })
                    ->where('weeks_kader.angka_week', $week->angka_week)
                    ->get();


                $title = Jawaban::select('jawaban.*', 'kader.nama as nama_kader', 'users.name as nama_mentor', 'users.type')
                    ->join('weeks_kader', 'weeks_kader.id_week', 'jawaban.id_week')
                    ->join('kader', 'jawaban.nik_kader', 'kader.nik')
                    ->join('users', 'jawaban.created_by', 'users.id')
                    ->where('weeks_kader.angka_week', $week->angka_week)
                    ->where(function ($query) use ($user_name) {
                        $query->where('jawaban.nama_mentor', $user_name)
                            ->orWhere('users.name', $user_name);
                    })
                    ->first();

                $week = $week->angka_week;
            }
        }
        $jawabansData = ($isUserOnly && $request->usertype === 'Kader')
            ? $jawabans->map(fn ($items, $nama) => ['nama' => $nama, 'items' => $items->values()])->values()
            : $jawabans->values();

        return Inertia::render('Feedback/Detail', [
            'jawabans'   => $jawabansData,
            'week'       => $week,
            'title'      => is_object($title) ? $title : null,
            'isUserOnly' => $isUserOnly,
            'userType'   => $request->usertype,
        ]);
    }
}
