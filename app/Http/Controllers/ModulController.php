<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Kader;
use Illuminate\Http\Request;
use App\Models\Modul;
use App\Models\KategoriModul;
use Illuminate\Support\Facades\DB;
use RealRashid\SweetAlert\Facades\Alert;

class ModulController extends Controller
{
    public function index()
    {
        $moduls = Modul::orderBy('created_at', 'desc')->get();
        $companies = Company::get();
        $users = Kader::get();
        $moduls = Modul::get();

        return view('pages.modul.index', compact('moduls', 'companies', 'users', 'moduls'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_modul' => 'required',
            'nama_modul' => 'required',
            'fase' => 'required',
            'tag_kompetensi' => 'nullable',
            'file_materi' => 'required|mimes:pdf|max:10240'
        ]);
        $fileName = time() . '_' . $request->file_materi->getClientOriginalName();
        $request->file_materi->move(public_path('uploads/modul'), $fileName);

        Modul::create([
            'kode_modul' => $request->kode_modul,
            'nama_modul' => $request->nama_modul,
            'fase' => $request->fase,
            'batch' => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi' => 'uploads/modul/' . $fileName
        ]);
        Alert::success('Success', 'Modul berhasil ditambahkan!');
        return back()->with('success', 'Modul berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $modul = Modul::findOrFail($id);

        if ($request->hasFile('file_materi')) {

            if ($modul->file_materi && file_exists(public_path($modul->file_materi))) {
                unlink(public_path($modul->file_materi));
            }

            $fileName = time() . '_' . $request->file_materi->getClientOriginalName();
            $request->file_materi->move(public_path('uploads/modul'), $fileName);

            $modul->file_materi = 'uploads/modul/' . $fileName;
        }

        $modul->update([
            'kode_modul' => $request->kode_modul,
            'nama_modul' => $request->nama_modul,
            'fase' => $request->fase,
            'batch' => $request->batch,
            'tag_kompetensi' => $request->tag_kompetensi,
            'file_materi' => $modul->file_materi
        ]);
        Alert::success('Success', 'Modul berhasil diupdate!');
        return back()->with('success', 'Modul berhasil diupdate');
    }

    public function destroy($id)
    {
        $modul = Modul::findOrFail($id);

        if ($modul->file && file_exists(public_path($modul->file))) {
            unlink(public_path($modul->file));
        }

        $modul->delete();
        Alert::success('Success', 'Modul berhasil dihapus!');
        return back()->with('success', 'Modul berhasil dihapus');
    }

    public function assign(Request $request)
    {
        $request->validate([
            'type' => 'required|in:user,company',
            'modul_id' => 'required|array'
        ]);

        $type = $request->type;
        $assignableId = $request->user_id ?? $request->company_id;
        $modulIds = $request->modul_id;

        $dataInsert = [];

        foreach ($modulIds as $modulId) {
            $dataInsert[] = [
                'modul_id' => $modulId,
                'assignable_id' => $assignableId,
                'assignable_type' => $type,
                'created_at' => now(),
                'updated_at' => now()
            ];
        }

        DB::table('modul_assignments')->insertOrIgnore($dataInsert);
        Alert::success('Success', 'Modul berhasil di-assign!');
        return back()->with('success', 'Modul berhasil di-assign');
    }
}
