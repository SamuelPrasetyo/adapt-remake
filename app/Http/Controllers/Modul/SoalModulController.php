<?php

namespace App\Http\Controllers\Modul;

use App\Exports\SoalModulTemplateExport;
use App\Http\Controllers\Controller;
use App\Imports\SoalModulImport;
use App\Models\ActivityLog;
use App\Models\JawabanModul;
use App\Models\Modul;
use App\Models\SoalModul;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
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
            'soals'        => $soals,
            'moduls'       => $moduls,
            'importErrors' => session('import_errors', []),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'modul_id'              => 'required|exists:modul,id',
            'soal'                  => 'required|string',
            'jawabans'              => 'required|array|size:4',
            'jawabans.*.jawaban'    => 'required|string',
            'jawabans.*.is_benar'   => 'required|boolean',
        ]);

        DB::beginTransaction();

        try {
            foreach (['pre', 'post'] as $tipe) {
                $soalModul = SoalModul::create([
                    'modul_id' => $request->modul_id,
                    'soal'     => $request->soal,
                    'tipe'     => $tipe,
                ]);

                foreach ($request->jawabans as $jawaban) {
                    JawabanModul::create([
                        'soal_id'  => $soalModul->id,
                        'jawaban'  => $jawaban['jawaban'],
                        'is_benar' => $jawaban['is_benar'] ? 1 : 0,
                    ]);
                }
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
            'modul_id'              => 'required|exists:modul,id',
            'soal'                  => 'required|string',
            'jawabans'              => 'required|array|size:4',
            'jawabans.*.jawaban'    => 'required|string',
            'jawabans.*.is_benar'   => 'required|boolean',
        ]);

        $soalModul = SoalModul::findOrFail($id);
        $oldSoal   = $soalModul->soal;
        $oldModulId = $soalModul->modul_id;

        // Cari pasangan (tipe berlawanan, soal & modul sama)
        $pairedTipe   = $soalModul->tipe === 'pre' ? 'post' : 'pre';
        $pairedRecord = SoalModul::where('modul_id', $oldModulId)
            ->where('soal', $oldSoal)
            ->where('tipe', $pairedTipe)
            ->first();

        DB::beginTransaction();

        try {
            $targets = collect([$soalModul]);
            if ($pairedRecord) {
                $targets->push($pairedRecord);
            } else {
                // Pasangan belum ada, buat baru
                $pairedRecord = SoalModul::create([
                    'modul_id' => $request->modul_id,
                    'soal'     => $request->soal,
                    'tipe'     => $pairedTipe,
                ]);
                $targets->push($pairedRecord);
            }

            foreach ($targets as $target) {
                $target->update([
                    'modul_id' => $request->modul_id,
                    'soal'     => $request->soal,
                ]);

                JawabanModul::where('soal_id', $target->id)->delete();
                foreach ($request->jawabans as $jawaban) {
                    JawabanModul::create([
                        'soal_id'  => $target->id,
                        'jawaban'  => $jawaban['jawaban'],
                        'is_benar' => $jawaban['is_benar'] ? 1 : 0,
                    ]);
                }
            }

            ActivityLog::activity_log('Mengubah data Soal Modul');

            DB::commit();

            Alert::success('Success', 'Soal berhasil diupdate!');
            return redirect()->route('soal-modul.index');
        } catch (\Throwable $e) {
            DB::rollBack();

            Alert::error('Error', 'Gagal mengupdate soal!');

            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function downloadTemplate()
    {
        return Excel::download(new SoalModulTemplateExport(), 'template_soal_prepost.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'modul_id' => 'required|exists:modul,id',
            'file'     => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        $importer = new SoalModulImport((int) $request->modul_id);
        Excel::import($importer, $request->file('file'));

        ActivityLog::activity_log('Import Soal Modul via Excel');

        $msg = "{$importer->imported} soal berhasil diimport!";
        if ($importer->skipped > 0) {
            $msg .= " {$importer->skipped} soal dilewati karena sudah ada.";
        }
        if ($importer->imported > 0 || $importer->skipped > 0) {
            Alert::success('Success', $msg);
        }

        if (!empty($importer->errors)) {
            session()->flash('import_errors', $importer->errors);
        }

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
