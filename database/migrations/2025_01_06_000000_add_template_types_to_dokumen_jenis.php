<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `jenis` ENUM(
            'OJT_REPORT','POST_ACTIVITY','FORM_IDP','TEMPLATE_IDP',
            'PERJANJIAN_KERJA','REFLEKSI','WEEKLY_FEEDBACK',
            'TEMPLATE_PERJANJIAN_KERJA','TEMPLATE_WEEKLY_FEEDBACK'
        ) DEFAULT NULL");
    }

    public function down(): void
    {
        DB::statement("
            UPDATE `dokumen`
            SET `jenis` = NULL
            WHERE `jenis` IN ('TEMPLATE_PERJANJIAN_KERJA','TEMPLATE_WEEKLY_FEEDBACK')
        ");
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `jenis` ENUM(
            'OJT_REPORT','POST_ACTIVITY','FORM_IDP','TEMPLATE_IDP',
            'PERJANJIAN_KERJA','REFLEKSI','WEEKLY_FEEDBACK'
        ) DEFAULT NULL");
    }
};
