<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * kader.nik = Nomor Induk Karyawan (kode internal), BUKAN NIK KTP.
 * nik_ktp menyimpan nomor KTP (16 digit) yang dipakai untuk menautkan kader
 * ke record kandidat di database Career MAI (kandidat.ktp). Nullable karena
 * data lama belum terisi; unique agar satu KTP hanya menaut ke satu kader.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            $table->string('nik_ktp', 20)->nullable()->unique()->after('nik');
        });
    }

    public function down(): void
    {
        Schema::table('kader', function (Blueprint $table) {
            $table->dropUnique('kader_nik_ktp_unique');
            $table->dropColumn('nik_ktp');
        });
    }
};
