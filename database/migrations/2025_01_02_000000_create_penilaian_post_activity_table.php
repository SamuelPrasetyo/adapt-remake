<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('penilaian_post_activity')) {
            Schema::create('penilaian_post_activity', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                // dokumen.id bertipe int(11), jadi kolom FK ini ikut integer (bukan unsignedBigInteger).
                $table->integer('dokumen_id');
                $table->decimal('nilai', 5, 2)->comment('0-100, skor Post Activity dari Admin MAI');
                $table->text('catatan')->nullable();
                $table->char('dinilai_by', 36)->nullable()->comment('users.id Admin MAI');
                $table->timestamp('dinilai_at')->nullable();
                $table->timestamps();

                // Satu skor per dokumen Post Activity (relasi 1:1 ke dokumen).
                $table->unique('dokumen_id', 'uniq_pa_dokumen');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('penilaian_post_activity');
    }
};
