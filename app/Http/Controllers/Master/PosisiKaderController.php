<?php

namespace App\Http\Controllers\Master;

use App\Exports\PosisiKaderTemplateExport;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Batch;
use App\Models\Kader;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Menu "Posisi Kader" — khusus Admin MAI (021), route dijaga can:isAdmin021.
 *
 * Posisi awal & posisi setelah graduation program MT, per kader. Dua cara isi:
 *  - langsung di tabel (inline), disimpan sekaligus lewat bulkUpdate();
 *  - unduh template Excel (sudah berisi daftar kader + posisi saat ini), isi,
 *    lalu import(). Baris dicocokkan lewat NIK.
 */
class PosisiKaderController extends Controller
{
    private const MAX_LEN = 150;

    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        // Filter batch: default ke batch yang sedang berjalan; 'all' = semua batch.
        $batches     = Batch::newestFirst()->get(['id_batch', 'nama_batch', 'tahun_batch']);
        $batchFilter = $request->query('batch_id', optional(Batch::current())->id_batch);
        $idBatch     = ($batchFilter === 'all') ? null : $batchFilter;

        $kaders = $this->kaderQuery($idBatch)->get();

        $updaterNames = User::whereIn('id', $kaders->pluck('posisi_updated_by')->filter()->unique())
            ->pluck('name', 'id');

        $rows = $kaders->map(fn ($k) => [
            'id'                => $k->id,
            'nik'               => $k->nik,
            'nama'              => $k->nama,
            'bu'                => $k->bu,
            'dept_name'         => $k->dept_name,
            'divisi_name'       => $k->divisi_name,
            'nama_batch'        => $k->nama_batch,
            'is_nonaktif'       => $k->deactivated_at !== null,
            'posisi_awal'       => $k->posisi_awal,
            'posisi_graduate'   => $k->posisi_graduate,
            'posisi_updated_at' => $k->posisi_updated_at,
            'posisi_updated_by' => $updaterNames[$k->posisi_updated_by] ?? null,
        ])->values();

        return Inertia::render('PosisiKader/Index', [
            'kaders'      => $rows,
            'batches'     => $batches,
            'batchFilter' => $batchFilter !== null ? (string) $batchFilter : 'all',
            'maxLength'   => self::MAX_LEN,
        ]);
    }

    /** Simpan perubahan dari tabel: hanya baris yang diubah admin yang dikirim. */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'rows'                   => 'required|array|min:1',
            'rows.*.id'              => 'required|string',
            'rows.*.posisi_awal'     => 'nullable|string|max:' . self::MAX_LEN,
            'rows.*.posisi_graduate' => 'nullable|string|max:' . self::MAX_LEN,
        ], [
            'rows.*.posisi_awal.max'     => 'Posisi Awal maksimal ' . self::MAX_LEN . ' karakter.',
            'rows.*.posisi_graduate.max' => 'Posisi After Graduate maksimal ' . self::MAX_LEN . ' karakter.',
        ]);

        $updated = $this->applyUpdates(collect($validated['rows'])->keyBy('id'), 'id');

        ActivityLog::activity_log("Update Posisi Kader ({$updated} kader)");

        return back()->with('success', "Posisi {$updated} kader berhasil disimpan.");
    }

    public function template(Request $request)
    {
        $batchFilter = $request->query('batch_id', 'all');
        $idBatch     = ($batchFilter === 'all' || $batchFilter === '') ? null : $batchFilter;

        $suffix = 'semua-batch';
        if ($idBatch !== null) {
            $batch  = Batch::where('id_batch', $idBatch)->first();
            $suffix = 'batch-' . ($batch->nama_batch ?? $idBatch);
        }

        return Excel::download(
            new PosisiKaderTemplateExport($this->kaderQuery($idBatch)->get()),
            "template_posisi_kader_{$suffix}.xlsx"
        );
    }

    /**
     * Import template. Isi sel dipakai apa adanya: template sudah memuat posisi
     * yang tersimpan, jadi sel yang dikosongkan admin berarti posisinya dihapus.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ], [
            'file.required' => 'Pilih file template untuk diimport.',
            'file.mimes'    => 'Format file harus Excel (.xlsx).',
        ]);

        try {
            $sheet = IOFactory::load($request->file('file')->getRealPath())->getSheet(0);
            // formatData=true: NIK dibaca sebagaimana tampil di Excel (string).
            $cells = $sheet->toArray(null, true, true, false);
        } catch (\Throwable) {
            return back()->with('error', 'File tidak bisa dibaca. Pastikan memakai template Posisi Kader.');
        }

        $header = array_map(fn ($h) => strtolower(trim((string) $h)), array_shift($cells) ?? []);
        $col = [
            'nik'      => array_search('nik', $header, true),
            'awal'     => array_search('posisi awal', $header, true),
            'graduate' => array_search('posisi after graduate', $header, true),
        ];
        if (in_array(false, $col, true)) {
            return back()->with('error', 'Kolom NIK, Posisi Awal, atau Posisi After Graduate tidak ditemukan. Gunakan template dari halaman ini.');
        }

        $rows    = collect();
        $tooLong = [];
        foreach ($cells as $i => $cell) {
            $nik = trim((string) ($cell[$col['nik']] ?? ''));
            if ($nik === '') continue;

            $awal     = $this->clean($cell[$col['awal']] ?? null);
            $graduate = $this->clean($cell[$col['graduate']] ?? null);
            if (mb_strlen((string) $awal) > self::MAX_LEN || mb_strlen((string) $graduate) > self::MAX_LEN) {
                $tooLong[] = $i + 2; // +1 header, +1 karena baris Excel mulai dari 1
                continue;
            }

            $rows[$nik] = ['posisi_awal' => $awal, 'posisi_graduate' => $graduate];
        }

        if ($tooLong) {
            return back()->with('error', 'Posisi maksimal ' . self::MAX_LEN . ' karakter. Periksa baris: ' . implode(', ', array_slice($tooLong, 0, 10)) . '. Import dibatalkan.');
        }
        if ($rows->isEmpty()) {
            return back()->with('error', 'Tidak ada baris data dengan NIK di file ini.');
        }

        $known    = Kader::whereIn('nik', $rows->keys())->pluck('nik')->map(fn ($n) => (string) $n);
        $notFound = $rows->keys()->diff($known)->values();
        $updated  = $this->applyUpdates($rows->only($known->all()), 'nik');

        ActivityLog::activity_log("Import Posisi Kader ({$updated} kader)");

        $msg = "Import selesai: posisi {$updated} kader diperbarui.";
        if ($notFound->isNotEmpty()) {
            $msg .= ' NIK tidak ditemukan: ' . $notFound->take(5)->implode(', ')
                . ($notFound->count() > 5 ? ' (+' . ($notFound->count() - 5) . ' lainnya)' : '') . '.';
        }

        return back()->with('success', $msg);
    }

    /** Query daftar kader (dipakai halaman & template) — urut nama seperti Dokumen Psikotest. */
    private function kaderQuery($idBatch)
    {
        return Kader::select(
                'kader.id',
                'kader.nik',
                'kader.nama',
                'kader.deactivated_at',
                'kader.posisi_awal',
                'kader.posisi_graduate',
                'kader.posisi_updated_at',
                'kader.posisi_updated_by',
                'company.company_shortname as bu',
                'divisis.nama as divisi_name',
                'departemens.nama as dept_name',
                'batch.nama_batch',
            )
            ->leftJoin('company', 'kader.company_code', '=', 'company.company_code')
            ->leftJoin('divisis', 'kader.id_divisi', '=', 'divisis.id')
            ->leftJoin('departemens', 'kader.id_departemen', '=', 'departemens.id')
            ->leftJoin('batch', 'kader.id_batch', '=', 'batch.id_batch')
            ->when($idBatch, fn ($q) => $q->where('kader.id_batch', $idBatch))
            ->orderBy('kader.nama');
    }

    /**
     * Tulis posisi untuk baris yang nilainya benar-benar berubah; jejak
     * posisi_updated_* hanya disentuh pada baris tersebut.
     *
     * @param \Illuminate\Support\Collection $rows  key = nilai $keyCol
     * @return int jumlah kader yang berubah
     */
    private function applyUpdates($rows, string $keyCol): int
    {
        if ($rows->isEmpty()) return 0;

        $current = Kader::whereIn($keyCol, $rows->keys())
            ->get([$keyCol, 'posisi_awal', 'posisi_graduate'])
            ->keyBy(fn ($k) => (string) $k->{$keyCol});

        $userId  = Auth::user()->id;
        $updated = 0;

        DB::transaction(function () use ($rows, $current, $keyCol, $userId, &$updated) {
            foreach ($rows as $key => $row) {
                $old = $current->get((string) $key);
                if (!$old) continue;

                $awal     = $this->clean($row['posisi_awal'] ?? null);
                $graduate = $this->clean($row['posisi_graduate'] ?? null);
                if ($awal === $old->posisi_awal && $graduate === $old->posisi_graduate) continue;

                Kader::where($keyCol, $key)->update([
                    'posisi_awal'       => $awal,
                    'posisi_graduate'   => $graduate,
                    'posisi_updated_at' => now(),
                    'posisi_updated_by' => $userId,
                ]);
                $updated++;
            }
        });

        return $updated;
    }

    /** Rapikan spasi; string kosong disimpan sebagai NULL. */
    private function clean($value): ?string
    {
        $value = trim(preg_replace('/\s+/u', ' ', (string) $value));
        return $value === '' ? null : $value;
    }
}
