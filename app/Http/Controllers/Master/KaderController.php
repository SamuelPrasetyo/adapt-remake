<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Exports\KadersExport;
use App\Exports\KaderTemplateExport;
use App\Models\Kader;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use RealRashid\SweetAlert\Facades\Alert;
use App\Imports\KaderImport;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Company;
use App\Models\Departemen;
use App\Models\Divisi;
use App\Models\FeedbackMai;
use App\Support\KaderArchiver;
use App\Support\KaderNikSync;
use App\Support\KaderPurger;
use App\Support\KaderRelations;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Validators\ValidationException;
use Inertia\Inertia;

class KaderController extends Controller
{
    /**
     * NIK akun yang boleh HAPUS PERMANEN kader berdata. Sengaja satu akun, bukan
     * seluruh Admin MAI: ini satu-satunya aksi di aplikasi yang tidak bisa dibatalkan.
     * Melihat tab Arsip & memulihkan kader tetap terbuka untuk semua Admin MAI.
     */
    private const PURGE_ADMIN_NIK = 'itmai';

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
        // Kader aktif. Yang terarsip (deleted_at terisi) otomatis tersaring oleh
        // global scope SoftDeletes di model, jadi tidak perlu whereNull di sini.
        $kaders = $this->kaderListQuery()->get();

        // Isi tab Arsip — hanya yang terarsip, plus siapa & kapan mengarsipkan.
        // kader (utf8mb4_general_ci) vs users (utf8mb4_unicode_ci) beda collation,
        // jadi join-nya wajib di-COLLATE — sama seperti di ApprovalController.
        // Datanya tidak dikirim sama sekali ke non-Admin MAI, bukan cuma disembunyikan UI.
        $canViewArsip = $this->isAdminMai();
        $kadersArsip = $canViewArsip
            ? $this->kaderListQuery()
                ->onlyTrashed()
                ->addSelect('deleter.name as deleted_by_name')
                ->leftJoin('users as deleter',
                    DB::raw('kader.deleted_by COLLATE utf8mb4_unicode_ci'), '=', 'deleter.id')
                ->get()
            : collect();

        $companys = Company::get();
        $divisis = Divisi::get();
        $departemens = Departemen::get();
        $batchs = Batch::get();
        $currentBatch = Batch::current();
        return Inertia::render('Master/Kader/Index', [
            'kaders'      => $kaders,
            'kadersArsip' => $kadersArsip,
            'companys'   => $companys,
            'divisis'    => $divisis,
            'departemens'=> $departemens,
            'batchs'     => $batchs,
            'currentBatch' => $currentBatch ? [
                'id_batch'    => $currentBatch->id_batch,
                'nama_batch'  => $currentBatch->nama_batch,
                'tahun_batch' => $currentBatch->tahun_batch,
            ] : null,
            // Lihat tab Arsip + pulihkan = semua Admin MAI; hapus permanen = 1 akun.
            'canViewArsip' => $canViewArsip,
            'canPurge'     => $this->canPurgeKader(),
        ]);
    }

    /** Query dasar daftar kader (dipakai tab aktif & tab arsip). */
    private function kaderListQuery()
    {
        return Kader::select('kader.*', 'divisis.nama as divisi_name', 'departemens.nama as dept_name', 'company.company_shortname as bu', 'batch.nama_batch as batch_name','batch.tahun_batch')
            ->leftJoin('divisis', 'kader.id_divisi', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', 'batch.id_batch')
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            // Batch terbaru dulu, lalu nama A-Z di dalam tiap batch.
            // tanggal_mulai tidak dipakai: batch arsip (1 & 2) NULL. id_batch juga
            // tidak urut nomor batch. nama_batch varchar → cast agar "10" > "2".
            ->orderByDesc('batch.tahun_batch')
            ->orderByRaw('CAST(batch.nama_batch AS UNSIGNED) DESC')
            ->orderBy('kader.nama', 'asc');
    }

    /** Admin MAI (company 021) — boleh mengarsipkan kader & menghapus kader tanpa data. */
    private function isAdminMai(): bool
    {
        $user = Auth::user();
        return $user && $user->type === 'Admin' && $user->company_code === '021';
    }

    /**
     * Boleh hapus permanen kader yang sudah punya data. Lebih sempit dari
     * isAdminMai() — tombolnya juga disembunyikan di UI untuk yang tidak berhak.
     */
    private function canPurgeKader(): bool
    {
        return $this->isAdminMai() && Auth::user()->nik === self::PURGE_ADMIN_NIK;
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
        $validated = $request->validate([
            'nama'          => 'required|string|max:255',
            'nik'           => 'required|string|max:255|unique:kader,nik',
            'nik_ktp'       => 'nullable|string|max:20|unique:kader,nik_ktp',
            'jenis_kelamin' => 'required|in:L,P',
            'iq'            => 'nullable|numeric',
            'ipk'           => 'nullable|numeric',
            'company_code'  => 'required',
            'id_divisi'     => 'required',
            'id_departemen' => 'required',
            'id_batch'      => 'required',
        ], [
            'nik_ktp.unique' => 'NIK KTP sudah dipakai kader lain.',
        ], [
            'nik'           => 'NIK',
            'nik_ktp'       => 'NIK KTP',
            'jenis_kelamin' => 'Jenis Kelamin',
            'company_code'  => 'Bisnis Unit',
            'id_divisi'     => 'Divisi',
            'id_departemen' => 'Departemen',
            'id_batch'      => 'Batch',
        ]);

        Kader::insert([
            'id'            => Str::uuid(),
            'nik'           => $validated['nik'],
            'nik_ktp'       => $validated['nik_ktp'] ?: null,
            'nama'          => $validated['nama'],
            'jenis_kelamin' => $validated['jenis_kelamin'],
            'iq'            => $validated['iq'] ?? '0',
            'ipk'           => $validated['ipk'] ?? '0',
            'company_code'  => $validated['company_code'],
            'id_divisi'     => $validated['id_divisi'],
            'id_departemen' => $validated['id_departemen'],
            'id_batch'      => $validated['id_batch'],
            'created_at'    => now(),
            'created_by'    => Auth::user()->id,
        ]);

        ActivityLog::activity_log('Menambah data Kader');
        Alert::success('Success', 'Data berhasil ditambahkan!');
        return redirect()->route('kader.index');
    }

    public function export_kader(Request $request)
    {
        $idBatch = $request->query('batch');
        $idBatch = ($idBatch === null || $idBatch === '') ? null : (int) $idBatch;

        // Sisipkan label batch ke nama file agar mudah dikenali (mis. kaders_batch-3_...).
        $suffix = 'all';
        if ($idBatch !== null) {
            $batch  = Batch::where('id_batch', $idBatch)->first();
            $suffix = $batch ? 'batch-' . $batch->nama_batch : 'batch-' . $idBatch;
        }

        $file_name = 'kaders_' . $suffix . '_' . date('d-m-Y_His') . '.xlsx';

        return Excel::download(new KadersExport($idBatch), $file_name);
    }

    public function downloadTemplate()
    {
        return Excel::download(new KaderTemplateExport, 'template_import_kader.xlsx');
    }

    public function import(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|mimes:xlsx,csv'
        ]);

        try {
            $importer = new KaderImport;
            Excel::import($importer, request()->file('file'));

            if (!$importer->valid) {
                Alert::warning('Data Tidak Valid', $importer->errorMessage);
                return redirect()->route('kader.index');
            }

            Alert::success('Success', 'Import data berhasil!');
            ActivityLog::activity_log('Mengimport data Kader');
            return redirect()->route('kader.index');
        } catch (\Exception $ex) {
            Alert::warning('Failed', 'Import data gagal!');
            return redirect()->route('kader.index');
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function show(Kader $kader)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function edit(Kader $kader)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Kader  $kader
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $kader = Kader::where('id', $id)->firstOrFail();

        // NIK harus unik di kader (selain dirinya) DAN tidak boleh sudah dipakai akun
        // login lain (users.nik = kunci login); akun milik kader ini sendiri (nik lama)
        // dikecualikan karena akan ikut di-rename oleh KaderNikSync.
        $request->validate([
            'nik' => [
                'nullable', 'string', 'max:255',
                Rule::unique('kader', 'nik')->ignore($id, 'id'),
                Rule::unique('users', 'nik')->ignore($kader->nik, 'nik'),
            ],
            'nik_ktp' => [
                'nullable', 'string', 'max:20',
                Rule::unique('kader', 'nik_ktp')->ignore($id, 'id'),
            ],
        ], [
            'nik.unique'     => 'NIK sudah dipakai kader/akun lain.',
            'nik_ktp.unique' => 'NIK KTP sudah dipakai kader lain.',
        ], [
            'nik'     => 'NIK',
            'nik_ktp' => 'NIK KTP',
        ]);

        $oldNik = (string) $kader->nik;
        $newNik = (string) ($request->nik ?? $kader->nik);

        DB::transaction(function () use ($request, $id, $kader, $oldNik, $newNik) {
            Kader::where('id', $id)
                ->update([
                    'nama'              => $request->nama ?? $kader->nama,
                    'nik'               => $newNik,
                    // '' → null agar unique(nik_ktp) tidak bentrok antar kader yang sama-sama kosong.
                    'nik_ktp'           => $request->has('nik_ktp') ? ($request->input('nik_ktp') ?: null) : $kader->nik_ktp,
                    'jenis_kelamin'     => $request->jenis_kelamin ?? $kader->jenis_kelamin,
                    'iq'                => $request->iq ?? $kader->iq,
                    'ipk'               => $request->ipk ?? $kader->ipk,
                    'id_batch'          => $request->id_batch ?? $kader->id_batch,
                    'id_divisi'         => $request->id_divisi ?? $kader->id_divisi,
                    'id_departemen'     => $request->id_departemen ?? $kader->id_departemen,
                    'company_code'      => $request->company_code ?? $kader->company_code,
                    'updated_at'        => now(),
                    'updated_by'        => Auth::user()->id
                ]);

            // NIK berubah (mis. NIK sementara → NIK resmi): sinkronkan users.nik
            // (users.id dipertahankan → progress modul/test/dokumen tetap tertaut)
            // + nik_kader di jawaban & feedback_mai. Lihat App\Support\KaderNikSync.
            if ($newNik !== $oldNik) {
                KaderNikSync::rename($oldNik, $newNik);
            }
        });

        // Catatan: activity_log.desc bukan utf8mb4 — hindari karakter multibyte (mis. panah unicode).
        ActivityLog::activity_log($newNik !== $oldNik
            ? "Mengubah data Kader (NIK {$oldNik} -> {$newNik}, login & feedback tersinkron)"
            : 'Mengubah data Kader');
        Alert::success('Success', 'Data berhasil diupdate!');
        return redirect()->route('kader.index');
    }

    /**
     * Rincian dependensi seorang kader — dipanggil modal hapus sebelum admin
     * memutuskan. Dipakai juga oleh server untuk mengunci hapus permanen.
     */
    public function dependencies($id)
    {
        abort_unless($this->isAdminMai(), 403);

        $kader = Kader::withTrashed()->where('id', $id)->firstOrFail();
        $sum   = KaderRelations::summary($kader);

        return response()->json([
            'nama'      => $kader->nama,
            'nik'       => $kader->nik,
            'archived'  => $kader->deleted_at !== null,
            'total'     => $sum['total'],
            // 0 = kader bersih, boleh langsung hapus permanen oleh semua Admin MAI
            // (akun login tidak dihitung — lihat KaderRelations::summary).
            'blocking'  => $sum['blocking'],
            'files'     => $sum['files'],
            // Grup kosong disembunyikan supaya daftarnya tetap enak dibaca.
            'groups'    => array_values(array_filter($sum['groups'], fn($g) => $g['count'] > 0)),
            'can_purge' => $this->canPurgeKader(),
        ]);
    }

    /**
     * Hapus kader.
     *
     * Dua tingkat, dan tingkatnya ditentukan ulang di server — bukan dipercayakan
     * ke UI (lihat KaderRelations untuk peta dependensinya):
     *  - Kader BERSIH (belum punya jejak data apa pun): boleh langsung hilang
     *    permanen oleh Admin MAI mana pun. Ini menutup kasus salah input/duplikat.
     *  - Kader yang SUDAH punya data: hanya diarsipkan. Hapus permanennya lewat
     *    purge() dari tab Arsip, dan itu khusus akun PURGE_ADMIN_NIK.
     */
    public function destroy($id)
    {
        abort_unless($this->isAdminMai(), 403, 'Hapus kader hanya untuk Admin MAI.');

        $kader = Kader::withTrashed()->where('id', $id)->firstOrFail();

        if (KaderRelations::summary($kader)['blocking'] === 0) {
            KaderPurger::purge($kader->id);

            ActivityLog::activity_log('Hapus permanen Kader (tanpa data) ' . Str::limit($kader->nik, 30, ''));
            Alert::success('Success', 'Kader "' . $kader->nama . '" dihapus permanen (belum punya data apa pun).');
            return redirect()->route('kader.index');
        }

        if (!KaderArchiver::archive($kader->id, Auth::user()->id)) {
            Alert::warning('Failed', 'Kader sudah berada di arsip.');
            return redirect()->route('kader.index');
        }

        ActivityLog::activity_log('Mengarsipkan Kader ' . Str::limit($kader->nik, 40, ''));
        Alert::success('Success', 'Kader "' . $kader->nama . '" dipindahkan ke Arsip. Data & filenya tetap utuh.');
        return redirect()->route('kader.index');
    }

    /**
     * Kembalikan kader dari arsip + aktifkan lagi akun loginnya — satu aksi,
     * tidak perlu mengaktifkan akunnya lagi secara manual di Master User. Justru
     * sebaliknya: UserController::change_status mengarahkan admin ke sini.
     */
    public function restore($id)
    {
        abort_unless($this->isAdminMai(), 403, 'Pemulihan kader hanya untuk Admin MAI.');

        $kader = Kader::withTrashed()->where('id', $id)->firstOrFail();

        if (!KaderArchiver::restore($kader->id, Auth::user()->id)) {
            Alert::warning('Failed', 'Kader ini tidak sedang berada di arsip.');
            return redirect()->route('kader.index');
        }

        ActivityLog::activity_log('Memulihkan Kader ' . Str::limit($kader->nik, 43, ''));
        Alert::success('Success', 'Kader "' . $kader->nama . '" berhasil dipulihkan.');
        return redirect()->route('kader.index');
    }

    /**
     * Hapus PERMANEN kader beserta seluruh turunannya — tidak bisa dibatalkan.
     *
     * Berlapis dengan sengaja: khusus akun PURGE_ADMIN_NIK, hanya dari tab Arsip
     * (jadi kader wajib diarsipkan dulu oleh siapa pun Admin MAI), dan NIK kader
     * harus diketik ulang persis.
     */
    public function purge(Request $request, $id)
    {
        abort_unless($this->canPurgeKader(), 403, 'Hapus permanen kader berdata hanya untuk akun tertentu.');

        $kader = Kader::withTrashed()->where('id', $id)->firstOrFail();

        if ($kader->deleted_at === null) {
            Alert::warning('Failed', 'Arsipkan kader ini dulu sebelum menghapusnya permanen.');
            return redirect()->route('kader.index');
        }

        if (trim((string) $request->input('confirm_nik')) !== trim((string) $kader->nik)) {
            Alert::warning('Konfirmasi Salah', 'NIK yang diketik tidak cocok. Penghapusan dibatalkan.');
            return redirect()->route('kader.index');
        }

        $nama   = $kader->nama;
        $result = KaderPurger::purge($kader->id);
        $rows   = array_sum($result['deleted']);

        // activity_log.desc = varchar(100) latin1 — pesan wajib pendek & ASCII.
        ActivityLog::activity_log(
            'Hapus permanen Kader ' . Str::limit($kader->nik, 20, '') . " ({$rows} baris, {$result['files_deleted']} file)"
        );
        Alert::success(
            'Terhapus Permanen',
            "Kader \"{$nama}\" dihapus: {$rows} baris data & {$result['files_deleted']} file. "
                . "Backup tersimpan di storage/app/{$result['snapshot']}."
        );
        return redirect()->route('kader.index');
    }
}
