<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Kader;
use App\Models\User;
use Illuminate\Http\Request;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
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
    public function index()
    {
        $users = User::select(
            'users.id',
            'users.nik',
            'users.name',
            'users.type',
            'users.status',
            'users.last_activity',
            'company.company_shortname as bu'
        )
            ->leftJoin('company', function ($join) {
                $join->on(function ($join2) {
                    $join2->on('users.company_code', 'company.company_code');
                });
            })
            ->orderBy('last_activity', 'desc')
            ->get();

        $kader_existing = $users->where('type', 'Kader')->pluck('nik')->toArray();
        $kaders = Kader::whereNotIn('nik', $kader_existing)->orderBy('nik', 'asc')->get();
        $kadersUnassigned = $kaders->values();

        $companys = Company::get();

        return Inertia::render('Master/User/Index', [
            'users'            => $users,
            'kaders'           => $kaders,
            'companys'         => $companys,
            'kadersUnassigned' => $kadersUnassigned,
        ]);
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
        $isKader = $request->input('type', $request->filled('nik_kader') ? 'Kader' : 'Mentor') === 'Kader';

        // Password wajib diisi (min. 6 + konfirmasi cocok); NIK wajib valid & belum
        // punya akun login (users.nik = kunci login, harus unik).
        $rules = [
            'password'  => 'required|string|min:6|same:password2',
            'password2' => 'required|string',
        ];
        if ($isKader) {
            $rules['nik_kader'] = 'required|string|exists:kader,nik|unique:users,nik';
        } else {
            $rules['nik_mentor']   = 'required|string|max:255|unique:users,nik';
            $rules['company_code'] = 'required|string';
            $rules['name']         = 'required|string|max:255';
        }

        $request->validate($rules, [
            'password.same'     => 'Konfirmasi Kata Sandi tidak cocok.',
            'nik_kader.unique'  => 'Kader ini sudah memiliki akun login.',
            'nik_mentor.unique' => 'NIK ini sudah memiliki akun login.',
        ], [
            'password'     => 'Kata Sandi',
            'password2'    => 'Konfirmasi Kata Sandi',
            'nik_kader'    => 'NIK Kader',
            'nik_mentor'   => 'NIK Mentor',
            'company_code' => 'Bisnis Unit',
            'name'         => 'Nama',
        ]);

        $nama = $request->name;
        $company_code = $request->company_code;
        if ($isKader) {
            $kader = Kader::where('nik', $request->nik_kader)->first();
            $nama = $kader->nama;
            $company_code = $kader->company_code;
        }
        $data = [
            'id'            => Str::uuid(),
            'name'          => $nama,
            'nik'           => $isKader ? $request->nik_kader : $request->nik_mentor,
            'password'      => Hash::make($request->password),
            'type'          => $isKader ? 'Kader' : 'Mentor',
            'company_code'  => $company_code,
            'status'        => 'Aktif',
            'created_at'    => now(),
            'created_by'    => Auth::user()->id
        ];

        User::insert($data);
        ActivityLog::activity_log('Menambah data User');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('user.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\Response
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\Response
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id) {}

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\User  $user
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        User::where('id', $id)->delete();
        ActivityLog::activity_log('Mengubah data User');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('user.index');
    }

    public function change_password(Request $request, $id)
    {
        if (password_verify($request->password_lama, Auth::user()->password)) {
            if ($request->password == $request->password2) {
                $data = [
                    'password'           => Hash::make($request->password),
                    'updated_at'         => now()
                ];
                User::where('id', $id)->update($data);

                Alert::success('Success', 'Password Berhasil Diubah');
                ActivityLog::activity_log('Berhasil mengubah password');
                Auth::logout();
                request()->session()->invalidate();
                request()->session()->regenerateToken();

                return redirect()->route('login.index')->with(['changes' => 'Password berhasil diubah']);
            } else {
                session()->flash('errors', 'Konfirmasi Password tidak cocok');
                return redirect()->back();
            }
        } else {
            session()->flash('errors', 'Password lama tidak cocok');
            return redirect()->back();
        }
    }

    public function change_status($userId)
    {
        $user = User::where('id', $userId)->first();
        $status = $user->status == 'Aktif' ? 'Tidak Aktif' : 'Aktif';

        // Mengaktifkan akun Kader yang data kadernya sudah diarsipkan hanya
        // menghasilkan akun yang bisa login tapi langsung 404 (DashboardController
        // ->dashboard_kader() abort saat data kader tidak ditemukan). Pemulihannya
        // harus lewat Arsip Kader, yang mengembalikan data kader + akunnya sekaligus.
        if ($status === 'Aktif' && $user->type === 'Kader') {
            $kaderTerarsip = Kader::onlyTrashed()->where('nik', $user->nik)->first();

            if ($kaderTerarsip) {
                ActivityLog::activity_log('Aktivasi akun kader diarahkan ke Arsip');
                Alert::warning(
                    'Pulihkan dari Arsip Kader',
                    'Data kader "' . $kaderTerarsip->nama . '" sedang diarsipkan, jadi akunnya belum bisa '
                        . 'diaktifkan dari sini — kader akan bisa login tapi halamannya kosong. Pulihkan '
                        . 'kadernya di Master > Kader > tab Arsip; akun loginnya otomatis ikut aktif kembali.'
                );
                return redirect()->route('kader.index', ['tab' => 'arsip']);
            }

            // Akun Kader tanpa data kader sama sekali — juga akan 404 kalau login.
            if (!Kader::where('nik', $user->nik)->exists()) {
                Alert::warning(
                    'Data Kader Tidak Ada',
                    'Akun ini bertipe Kader tapi tidak punya data kader dengan NIK ' . $user->nik
                        . '. Lengkapi dulu datanya di Master > Kader, kalau tidak kader tidak bisa memakai akunnya.'
                );
                return redirect()->route('user.index');
            }
        }

        User::where('id', $userId)->update(['status' => $status]);

        ActivityLog::activity_log('Berhasil mengubah status user');
        Alert::success('Success', 'Status Berhasil Diubah');
        return redirect()->route('user.index');
    }

    public function generate_kader()
    {
        // NIK yang sudah punya akun Kader — langsung dari users, tanpa lookup ulang
        // ke tabel kader (dulu `$kader->nik` fatal error bila ada akun lama yang
        // NIK-nya tak lagi cocok dengan data kader).
        $user_nikkader = User::where('type', 'Kader')
            ->whereNotNull('nik')
            ->pluck('nik')
            ->all();

        $kaders = Kader::whereNotIn('nik', $user_nikkader)->get();
        $total = 0;
        if ($kaders) {
        $total = $kaders->count();
            foreach ($kaders as $kader) {
                $data = [
                    'id'            => Str::uuid(),
                    'name'          => $kader->nama,
                    'nik'           => $kader->nik,
                    'password'      => Hash::make('Kader123!!'),
                    'type'          => 'Kader',
                    'company_code'  => $kader->company_code,
                    'status'        => 'Aktif',
                    'created_at'    => now(),
                    'created_by'    => Auth::user()->id
                ];

                User::insert($data);
            }
        }

        ActivityLog::activity_log('Berhasil generate akun kader');
        Alert::success('Success', $total.' Akun Kader Berhasil Dibuat! ');
        return redirect()->route('user.index');
    }

    public function reset_password($userId)
    {
        $user = User::where('id', $userId)->first();
        $new_password = '';
        if($user->type == 'Mentor'){
            $new_password = 'Mentor123!!';
        }elseif($user->type == 'Kader'){
            $new_password = 'Kader123!!';
        }

        User::where('id', $userId)->update(['password' => Hash::make($new_password)]);
        ActivityLog::activity_log('Berhasil reset password');
        Alert::success('Success', 'Status Berhasil Diubah');
        return redirect()->route('user.index');
    }
}
