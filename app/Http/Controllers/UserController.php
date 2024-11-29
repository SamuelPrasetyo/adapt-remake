<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Kader;
use App\Models\User;
use Illuminate\Http\Request;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

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
            'company.company_shortname as bu'
        )
            ->leftJoin('company', function ($join) {
                $join->on(function ($join2) {
                    $join2->on('users.company_code', 'company.company_code');
                });
            })
            ->orderBy('name', 'asc')
            ->get();
        $kaders = Kader::orderBy('nik', 'asc')->get();
        $companys = Company::get();
        return view('pages.user.index', compact('users', 'kaders', 'companys'));
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
        $nama = $request->name;
        $company_code = $request->company_code;
        if ($request->nik_kader != null) {
            $kader = Kader::select('kader.nama', 'company.company_code')
                ->join('company', 'kader.company_code', 'company.company_code')
                ->where('kader.nik', $request->nik_kader)
                ->first();
            $nama = $kader->nama;
            $company_code = $kader->company_code;
        }
        $data = [
            'id'            => Str::uuid(),
            'name'          => $nama,
            'nik'           => $request->nik_mentor ?? $request->nik_kader,
            'password'      => Hash::make($request->password),
            'type'          => $request->nik_kader != null ? 'Kader' : 'Mentor',
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
                Auth::logout();
                request()->session()->invalidate();
                request()->session()->regenerateToken();
                ActivityLog::activity_log('Berhasil mengubah password');

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
        $user = User::where('id',$userId)->first();
        $status = $user->status == 'Aktif' ? 'Tidak Aktif' : 'Aktif';
        User::where('id',$userId)->update(['status' => $status]);
        
        ActivityLog::activity_log('Berhasil mengubah status user');
        Alert::success('Success', 'Status Berhasil Diubah');
        return redirect()->route('user.index');
    }
}
