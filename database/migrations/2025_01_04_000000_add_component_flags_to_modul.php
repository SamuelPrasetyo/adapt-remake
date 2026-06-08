<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tidak semua modul punya komponen yang sama: ada yang hanya Pre/Post Test, ada yang
 * hanya Post Activity, ada yang keduanya. Dua kolom flag ini membuat komponen modul
 * bisa dikustom per modul lewat form admin.
 *
 * Default TRUE agar modul lama tetap punya kedua komponen (perilaku tidak berubah).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modul', function (Blueprint $table) {
            if (!Schema::hasColumn('modul', 'has_test')) {
                $table->boolean('has_test')->default(true)->after('tipe')
                    ->comment('Modul memiliki komponen Pre/Post Test');
            }
            if (!Schema::hasColumn('modul', 'has_post_activity')) {
                $table->boolean('has_post_activity')->default(true)->after('has_test')
                    ->comment('Modul memiliki komponen Post Activity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('modul', function (Blueprint $table) {
            if (Schema::hasColumn('modul', 'has_post_activity')) {
                $table->dropColumn('has_post_activity');
            }
            if (Schema::hasColumn('modul', 'has_test')) {
                $table->dropColumn('has_test');
            }
        });
    }
};
