<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel arsip skor report Batch 1 & 2.
 *
 * Batch 1-2 TIDAK memakai sistem (tak ada data modul/test/penilaian/weekly), jadi
 * skornya tak bisa direkonstruksi lewat App\Support\KaderReportData. Skor agregat
 * hasil impor Excel arsip disimpan di sini, satu baris per kader:
 *  - learning_growth       = kolom F Excel (skala 0-100)
 *  - development_progress   = kolom P Excel (avg, disimpan 0-100 = P*10)
 *  - fmc_avg                = kolom K Excel (avg OJT 1-4, disimpan 0-100 = K*10)
 *  - ojt1..ojt4             = kolom G-J (skala 0-10, apa adanya)
 *  - dev_*                  = kolom L-O aspek Development (skala 0-10, batch 1 saja)
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('report_arsip')) {
            Schema::create('report_arsip', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                $table->char('kader_id', 36);
                $table->unsignedTinyInteger('batch_no')->comment('1 atau 2');
                $table->integer('source_no')->nullable()->comment('kolom No pada Excel, untuk telusur');

                $table->decimal('learning_growth', 6, 2)->nullable()->comment('Excel kolom F (0-100)');
                $table->decimal('development_progress', 6, 2)->nullable()->comment('Excel kolom P *10 (0-100)');
                $table->decimal('fmc_avg', 6, 2)->nullable()->comment('Excel kolom K *10 (0-100)');

                $table->decimal('ojt1', 5, 2)->nullable();
                $table->decimal('ojt2', 5, 2)->nullable();
                $table->decimal('ojt3', 5, 2)->nullable();
                $table->decimal('ojt4', 5, 2)->nullable();

                $table->decimal('dev_job_routine', 5, 2)->nullable();
                $table->decimal('dev_assignment', 5, 2)->nullable();
                $table->decimal('dev_sop', 5, 2)->nullable();
                $table->decimal('dev_project', 5, 2)->nullable();

                $table->string('status', 50)->nullable()->comment('mis. resign');
                $table->timestamps();

                $table->unique('kader_id', 'uniq_arsip_kader');
                $table->index('batch_no', 'idx_arsip_batch');
            });
        }

        // Jabatan mentor bisa kosong pada data arsip (kolom D Excel) → izinkan NULL.
        // Pakai raw SQL agar tak butuh doctrine/dbal (tidak terpasang di project ini).
        $col = DB::selectOne("SHOW COLUMNS FROM mentor WHERE Field = 'jabatan'");
        if ($col && strtoupper($col->Null) === 'NO') {
            DB::statement("ALTER TABLE `mentor` MODIFY `jabatan` VARCHAR(255) NULL");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('report_arsip');
        // Kolom jabatan sengaja dibiarkan nullable (aman, tak merusak data lama).
    }
};
