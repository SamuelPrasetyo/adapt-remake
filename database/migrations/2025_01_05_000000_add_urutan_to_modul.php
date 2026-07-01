<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kolom `urutan` = urutan tampil modul DALAM satu fase (diatur admin via drag & drop).
     * Murni untuk tampilan — tidak direferensikan FK manapun, jadi aman diubah-ubah
     * (tidak seperti `id` yang dipakai sebagai modul_id di assignment/test/dokumen/soal).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('modul', 'urutan')) {
            Schema::table('modul', function (Blueprint $table) {
                $table->unsignedInteger('urutan')->nullable()->after('fase');
            });
        }

        // Backfill: beri nomor urut awal per-fase mengikuti urutan yang ada sekarang (by id).
        $moduls = DB::table('modul')->orderBy('fase')->orderBy('id')->get(['id', 'fase']);
        $counter = [];
        foreach ($moduls as $m) {
            $key = $m->fase ?? 'null';
            $counter[$key] = ($counter[$key] ?? 0) + 1;
            DB::table('modul')->where('id', $m->id)->update(['urutan' => $counter[$key]]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('modul', 'urutan')) {
            Schema::table('modul', function (Blueprint $table) {
                $table->dropColumn('urutan');
            });
        }
    }
};
