<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Dokumen;
use App\Models\FeedbackMai;
use App\Models\Jawaban;
use App\Models\Kader;
use App\Models\Week;
use App\Models\WeekKader;
use App\Services\WeekGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RealRashid\SweetAlert\Facades\Alert;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BatchController extends Controller
{
    public function __construct() {
        $this->middleware('auth');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $batchs = Batch::orderBy('nama_batch', 'asc')->get();
        return Inertia::render('Master/Batch/Index', ['batchs' => $batchs]);
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
        $batch = Batch::create([
            'nama_batch'      => $request->nama_batch,
            'tahun_batch'     => $request->tahun_batch,
            'tanggal_mulai'   => $request->tanggal_mulai ?: null,
            'tanggal_selesai' => $request->tanggal_selesai ?: null,
            'created_by'      => Auth::user()->id,
        ]);

        // Generate jadwal weeks + weeks_kader bila tanggal batch lengkap.
        WeekGenerator::syncForBatch($batch);

        ActivityLog::activity_log('Menambah data Batch');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('batch.index');
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function show(Batch $batch)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function edit(Batch $batch)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $batch = Batch::where('id_batch', $id)->first();
        if (!$batch) {
            abort(404);
        }

        $today = now()->toDateString();

        // Tanggal mulai DIKUNCI setelah pernah di-set. Mengubahnya menggeser anchor
        // sehingga SEMUA tanggal week ikut bergeser & keselarasan feedback yang sudah
        // terisi jadi kacau. Untuk mengubah tanggal mulai: hapus batch lalu buat ulang.
        // (Bila batch belum punya tanggal mulai, izinkan set pertama kali dari request.)
        $lockedStart = $batch->tanggal_mulai
            ? $batch->tanggal_mulai->toDateString()
            : ($request->tanggal_mulai ?: null);

        $oldEnd = $batch->tanggal_selesai ? $batch->tanggal_selesai->toDateString() : null;
        $newEnd = $request->tanggal_selesai ?: null;

        // Tanggal selesai tak boleh DIUBAH ke sebelum hari ini (tak bisa "memundurkan"
        // program ke masa lalu). Bila tidak diubah, nilai lama dibiarkan apa adanya
        // sehingga batch lama yang sudah selesai tetap bisa diedit field lainnya.
        if ($newEnd !== null && $newEnd !== $oldEnd && $newEnd < $today) {
            return back()->withErrors([
                'tanggal_selesai' => 'Tanggal selesai tidak boleh diubah ke tanggal sebelum hari ini.',
            ])->withInput();
        }
        // Tanggal selesai tidak boleh sebelum tanggal mulai.
        if ($newEnd !== null && $lockedStart !== null && $newEnd < $lockedStart) {
            return back()->withErrors([
                'tanggal_selesai' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
            ])->withInput();
        }

        Batch::where('id_batch', $id)->update([
            'nama_batch'      => $request->nama_batch ?? $batch->nama_batch,
            'tahun_batch'     => $request->tahun_batch ?? $batch->tahun_batch,
            'tanggal_mulai'   => $lockedStart,
            'tanggal_selesai' => $newEnd,
            'updated_at'      => now(),
            'updated_by'      => Auth::user()->id,
        ]);

        // Sinkronkan jadwal week (update tanggal di tempat, aman utk data lama).
        $updated = Batch::find($id);
        if ($updated) {
            WeekGenerator::syncForBatch($updated);
        }

        ActivityLog::activity_log('Mengedit data Batch');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('batch.index');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Batch  $batch
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        // Batch yang sudah punya week terisi TIDAK boleh dihapus: data itu di-INNER JOIN
        // ke weeks/weeks_kader saat ditampilkan, jadi menghapus week-nya akan membuat data
        // hilang dari layar & report (jadi baris yatim). Ada TEPAT 3 tabel yang menyimpan
        // weeks/weeks_kader.id_week (satu-satunya sumber data "week terisi"):
        //   1. jawaban      — feedback mentor + refleksi kader   (via nik_kader)
        //   2. feedback_mai — Feedback MAI kader + mentor        (via nik_kader)
        //   3. dokumen      — upload WEEKLY_FEEDBACK             (via id_batch)
        // Hanya batch kosong (ketiganya nihil) yang boleh dihapus + dibersihkan week-nya.
        // withTrashed: data yang diarsipkan (mis. minggu ganjil hasil revert dwi-mingguan)
        // tetap dihitung "terisi" — kalau tidak, week-nya ikut terhapus permanen dan
        // arsipnya jadi tidak bisa dipulihkan.
        $nikKader    = Kader::where('id_batch', $id)->pluck('nik');
        $hasFeedback = $nikKader->isNotEmpty()
            && Jawaban::withTrashed()->whereIn('nik_kader', $nikKader)->exists();
        $hasFmai     = $nikKader->isNotEmpty()
            && FeedbackMai::withTrashed()->whereIn('nik_kader', $nikKader)->exists();
        $hasUpload   = Dokumen::where('id_batch', $id)
            ->where('jenis', 'WEEKLY_FEEDBACK')
            ->exists();

        if ($hasFeedback || $hasFmai || $hasUpload) {
            Alert::error(
                'Tidak Bisa Dihapus',
                'Batch ini sudah memiliki feedback/refleksi/upload yang terisi, sehingga tidak dapat dihapus.'
            );
            return redirect()->route('batch.index');
        }

        // Batch kosong — bersihkan jadwal minggu supaya tabel weeks & weeks_kader tidak
        // menyimpan baris yatim (sampah), lalu hapus batch-nya. forceDelete karena
        // kedua model kini soft delete: batch tanpa isi tidak perlu diarsipkan, dan
        // baris tersembunyi tetap menghalangi generate ulang bila batch dibuat lagi.
        Week::withTrashed()->where('id_batch', $id)->forceDelete();
        WeekKader::withTrashed()->where('id_batch', $id)->forceDelete();
        Batch::where('id_batch', $id)->delete();

        ActivityLog::activity_log('Menghapus data Batch');
        Alert::success('Success', 'Data berhasil dihapus!');
        return redirect()->route('batch.index');
    }
}
