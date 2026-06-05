<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dokumen_files')) {
            Schema::create('dokumen_files', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                // dokumen.id bertipe int(11), jadi kolom FK ini ikut integer (bukan unsignedBigInteger).
                $table->integer('dokumen_id');
                $table->string('nama_file');
                $table->string('path_file');
                $table->timestamps();

                $table->index('dokumen_id', 'idx_dokumen_files_dokumen');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_files');
    }
};
