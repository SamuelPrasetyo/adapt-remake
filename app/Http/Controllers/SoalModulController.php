<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\JawabanModul;
use App\Models\Modul;
use App\Models\SoalModul;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Facades\DB;

class SoalModulController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $soals = SoalModul::with('jawabans')
            ->join('modul', 'soal_modul.modul_id', '=', 'modul.id')
            ->select('soal_modul.*', 'modul.nama_modul')
            ->orderBy('soal_modul.modul_id', 'asc')
            ->orderBy('soal_modul.tipe', 'asc')
            ->orderBy('soal_modul.id', 'asc')
            ->get();

        $moduls = Modul::orderBy('nama_modul', 'asc')->get(['id', 'nama_modul']);

        return Inertia::render('Modul/Soal/Index', [
            'soals'  => $soals,
            'moduls' => $moduls,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'modul_id'              => 'required|exists:modul,id',
            'soal'                  => 'required|string',
            'tipe'                  => 'required|in:pre,post',
            'jawabans'              => 'required|array|size:4',
            'jawabans.*.jawaban'    => 'required|string',
            'jawabans.*.is_benar'   => 'required|boolean',
        ]);

        // $soalModul = SoalModul::create([
        //     'modul_id' => $request->modul_id,
        //     'soal'     => $request->soal,
        //     'tipe'     => $request->tipe,
        // ]);

        // foreach ($request->jawabans as $jawaban) {
        //     JawabanModul::create([
        //         'soal_id'    => $soalModul->id,
        //         'jawaban'    => $jawaban['jawaban'],
        //         'is_benar' => $jawaban['is_benar'] ? 1 : 0,
        //     ]);
        // }

        // ActivityLog::activity_log('Menambah data Soal Modul');
        // Alert::success('Success', 'Soal berhasil ditambahkan!');
        // return redirect()->route('soal-modul.index');

        DB::beginTransaction();

        try {
            $soalModul = SoalModul::create([
                'modul_id' => $request->modul_id,
                'soal'     => $request->soal,
                'tipe'     => $request->tipe,
            ]);

            foreach ($request->jawabans as $jawaban) {
                JawabanModul::create([
                    'soal_id'  => $soalModul->id,
                    'jawaban'  => $jawaban['jawaban'],
                    'is_benar' => $jawaban['is_benar'] ? 1 : 0,
                ]);
            }

            ActivityLog::activity_log('Menambah data Soal Modul');

            DB::commit();

            Alert::success('Success', 'Soal berhasil ditambahkan!');

            return redirect()->route('soal-modul.index');
        } catch (\Throwable $e) {
            DB::rollBack();

            Alert::error('Error', 'Gagal menambahkan soal!');

            return back()->withErrors([
                'message' => $e->getMessage()
            ]);
        }
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'modul_id'     => 'required|exists:modul,id',
            'soal'         => 'required|string',
            'tipe'         => 'required|in:pre,post',
            'jawabans'     => 'required|array|size:4',
            'jawabans.*.id'         => 'nullable|exists:jawaban_modul,id',
            'jawabans.*.jawaban'    => 'required|string',
            'jawabans.*.is_benar' => 'required|boolean',
        ]);

        $soalModul = SoalModul::findOrFail($id);
        $soalModul->update([
            'modul_id' => $request->modul_id,
            'soal'     => $request->soal,
            'tipe'     => $request->tipe,
        ]);

        // delete old jawabans and recreate
        JawabanModul::where('soal_id', $id)->delete();
        foreach ($request->jawabans as $jawaban) {
            JawabanModul::create([
                'soal_id'    => $id,
                'jawaban'    => $jawaban['jawaban'],
                'is_benar' => $jawaban['is_benar'] ? 1 : 0,
            ]);
        }

        ActivityLog::activity_log('Mengubah data Soal Modul');
        Alert::success('Success', 'Soal berhasil diupdate!');
        return redirect()->route('soal-modul.index');
    }

    public function destroy(int $id)
    {
        JawabanModul::where('soal_id', $id)->delete();
        SoalModul::findOrFail($id)->delete();

        ActivityLog::activity_log('Menghapus data Soal Modul');
        Alert::success('Success', 'Soal berhasil dihapus!');
        return redirect()->route('soal-modul.index');
    }
}
