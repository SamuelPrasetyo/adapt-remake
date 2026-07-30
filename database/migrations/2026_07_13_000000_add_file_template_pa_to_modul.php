<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Template Post Activity ditempel per modul (opsional — hanya modul yang punya
 * komponen Post Activity). Diupload Admin MAI lewat modal Tambah/Edit Modul,
 * diunduh Kader/Mentor di halaman pengerjaan modul bagian Post Activity.
 * Karena melekat ke modul, template Kader vs Mentor otomatis terpisah per tipe modul.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modul', function (Blueprint $table) {
            $table->string('file_template_pa')->nullable()->after('file_materi');
        });
    }

    public function down(): void
    {
        Schema::table('modul', function (Blueprint $table) {
            $table->dropColumn('file_template_pa');
        });
    }
};
