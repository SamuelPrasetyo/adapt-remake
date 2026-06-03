<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Urutan: mentor → penilaian_ojt → penilaian_ojt_komentar/skor
        // list_kader_per_mentor dan modul_reading_progress tidak punya FK constraint

        if (!Schema::hasTable('mentor')) {
            Schema::create('mentor', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->char('id', 36)->primary();
                $table->string('nama');
                $table->char('user_id', 36)->nullable();
                $table->string('company_code');
                $table->string('jabatan');
                $table->char('created_by', 36);
                $table->timestamp('created_at')->useCurrent();
                $table->char('updated_by', 36)->nullable();
                $table->timestamp('updated_at')->nullable();
                $table->char('deleted_by', 36)->nullable();
                $table->timestamp('deleted_at')->nullable();
            });
        }

        if (!Schema::hasTable('list_kader_per_mentor')) {
            Schema::create('list_kader_per_mentor', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->char('id', 36)->primary();
                $table->char('kader_id', 36);
                $table->char('mentor_id', 36);
                $table->string('company_code');
                $table->char('id_batch', 36);
                $table->char('id_divisi', 36);
                $table->char('id_department', 36);
                $table->char('created_by', 36);
                $table->timestamp('created_at')->useCurrent();
                $table->char('updated_by', 36)->nullable();
                $table->timestamp('updated_at')->nullable();
                $table->char('deleted_by', 36)->nullable();
                $table->timestamp('deleted_at')->nullable();

                $table->index(['mentor_id', 'deleted_at'], 'idx_mentor_deleted');
                $table->index(['kader_id', 'mentor_id'], 'idx_kader_mentor');
            });
        }

        if (!Schema::hasTable('modul_reading_progress')) {
            Schema::create('modul_reading_progress', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                $table->string('user_id', 36);
                $table->unsignedBigInteger('modul_id');
                $table->unsignedTinyInteger('progress')->default(0);
                $table->timestamps();

                $table->unique(['user_id', 'modul_id'], 'unique_user_modul');
            });
        }

        if (!Schema::hasTable('penilaian_ojt')) {
            Schema::create('penilaian_ojt', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->char('id_penilaian_ojt', 36)->primary();
                $table->char('kader_id', 36);
                $table->unsignedTinyInteger('fmc_number')->comment('1, 2, 3');
                $table->decimal('ojt_score', 5, 2)->nullable()->comment('Cached: AVG OJT grand score');
                $table->decimal('value_score', 5, 2)->nullable()->comment('Cached: AVG Value grand score');
                $table->decimal('presentation_score', 5, 2)->nullable()->comment('Cached: AVG Presentation grand score');
                $table->decimal('final_score', 5, 2)->nullable()->comment('Cached: (ojt*0.3)+(value*0.3)+(presentation*0.4)');
                $table->text('overview')->nullable();
                $table->text('strengths')->nullable();
                $table->text('weakness')->nullable();
                $table->text('mentor_comments')->nullable();
                $table->string('final_recommendation', 20)->nullable()->comment('recommended | not_recommended | NULL');
                $table->string('approval_status', 20)->default('pending');
                $table->char('approved_by', 36)->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->char('created_by', 36)->nullable()->comment('users.id (mentor)');
                $table->timestamps();

                $table->unique(['kader_id', 'fmc_number'], 'uniq_kader_fmc');
                $table->index('kader_id', 'idx_kader');
                $table->foreign('kader_id', 'fk_po_kader')
                    ->references('id')->on('kader')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('penilaian_ojt_komentar')) {
            Schema::create('penilaian_ojt_komentar', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                $table->char('id_penilaian_ojt', 36);
                $table->string('sheet', 20)->comment('ojt | value | presentation');
                $table->string('sub_code', 60)->comment('e.g. ojt.1.a, value.1, pres.I');
                $table->text('komentar')->nullable();

                $table->unique(['id_penilaian_ojt', 'sub_code'], 'uniq_sub');
                $table->index('id_penilaian_ojt', 'idx_penilaian');
                $table->foreign('id_penilaian_ojt', 'fk_pok_penilaian')
                    ->references('id_penilaian_ojt')->on('penilaian_ojt')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('penilaian_ojt_skor')) {
            Schema::create('penilaian_ojt_skor', function (Blueprint $table) {
                $table->charset   = 'utf8mb4';
                $table->collation = 'utf8mb4_general_ci';

                $table->bigIncrements('id');
                $table->char('id_penilaian_ojt', 36);
                $table->string('sheet', 20)->comment('ojt | value | presentation');
                $table->string('item_code', 60)->comment('e.g. ojt.1.a.1, value.1.3, pres.II.2');
                $table->unsignedTinyInteger('skor')->nullable()->comment('0-100, NULL = belum dinilai');

                $table->unique(['id_penilaian_ojt', 'item_code'], 'uniq_item');
                $table->index(['id_penilaian_ojt', 'sheet'], 'idx_penilaian_sheet');
                $table->foreign('id_penilaian_ojt', 'fk_pos_penilaian')
                    ->references('id_penilaian_ojt')->on('penilaian_ojt')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('penilaian_ojt_skor');
        Schema::dropIfExists('penilaian_ojt_komentar');
        Schema::dropIfExists('penilaian_ojt');
        Schema::dropIfExists('modul_reading_progress');
        Schema::dropIfExists('list_kader_per_mentor');
        Schema::dropIfExists('mentor');
    }
};
