<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Helper: cek index di tabel tertentu (compatible Laravel 8)
    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(DB::select(
            "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
            [$indexName]
        ))->isNotEmpty();
    }

    public function up(): void
    {
        // =====================================================================
        // batch: tambah tanggal_mulai & tanggal_selesai
        // =====================================================================
        Schema::table('batch', function (Blueprint $table) {
            if (!Schema::hasColumn('batch', 'tanggal_mulai')) {
                $table->date('tanggal_mulai')->nullable()->after('tahun_batch');
            }
            if (!Schema::hasColumn('batch', 'tanggal_selesai')) {
                $table->date('tanggal_selesai')->nullable()->after('tanggal_mulai');
            }
        });

        // =====================================================================
        // dokumen: tambah kolom baru, MODIFY kolom yang berubah tipe/nilai
        // =====================================================================
        Schema::table('dokumen', function (Blueprint $table) {
            if (!Schema::hasColumn('dokumen', 'approved_by')) {
                $table->char('approved_by', 36)->nullable()->after('status');
            }
            if (!Schema::hasColumn('dokumen', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('dokumen', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('dokumen', 'rejected_by_role')) {
                $table->string('rejected_by_role', 10)->nullable()->after('rejection_reason');
            }
            if (!Schema::hasColumn('dokumen', 'mentor_approved_by')) {
                $table->char('mentor_approved_by', 36)->nullable()->after('rejected_by_role');
            }
            if (!Schema::hasColumn('dokumen', 'mentor_approved_at')) {
                $table->timestamp('mentor_approved_at')->nullable()->after('mentor_approved_by');
            }
            if (!Schema::hasColumn('dokumen', 'modul_id')) {
                $table->integer('modul_id')->nullable()->after('jenis');
            }
            if (!Schema::hasColumn('dokumen', 'id_batch')) {
                $table->integer('id_batch')->nullable()->after('modul_id');
            }
        });

        // MODIFY tipe: tambah nilai 'admin', urutan baru: mentor,kader,admin
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `tipe` ENUM('mentor','kader','admin') NOT NULL");

        // MODIFY status: tambah 'mentor_approved', hapus default 'pending'
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `status` ENUM('pending','mentor_approved','approved','rejected') DEFAULT NULL");

        // MODIFY jenis: dari varchar(100) ke enum
        // Nilai lama yang tidak cocok akan di-NULL-kan terlebih dahulu agar aman di strict mode
        DB::statement("
            UPDATE `dokumen`
            SET `jenis` = NULL
            WHERE `jenis` IS NOT NULL
              AND `jenis` NOT IN ('OJT_REPORT','POST_ACTIVITY','FORM_IDP','TEMPLATE_IDP','PERJANJIAN_KERJA','REFLEKSI')
        ");
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `jenis` ENUM('OJT_REPORT','POST_ACTIVITY','FORM_IDP','TEMPLATE_IDP','PERJANJIAN_KERJA','REFLEKSI') DEFAULT NULL");

        // Tambah unique index setelah kolom id_batch tersedia
        if (!$this->hasIndex('dokumen', 'uniq_idp_per_batch')) {
            Schema::table('dokumen', function (Blueprint $table) {
                $table->unique(['kader_id', 'jenis', 'id_batch'], 'uniq_idp_per_batch');
            });
        }

        // =====================================================================
        // modul: tambah kolom tipe (NOT NULL DEFAULT 'KADER')
        // Aman: MySQL mengisi baris lama dengan nilai default 'KADER'
        // =====================================================================
        Schema::table('modul', function (Blueprint $table) {
            if (!Schema::hasColumn('modul', 'tipe')) {
                $table->enum('tipe', ['KADER', 'MENTOR'])->default('KADER')->after('nama_modul');
            }
        });

        // =====================================================================
        // weeks: tambah id_batch, tanggal_mulai, bulan, tahun + indexes
        // =====================================================================
        Schema::table('weeks', function (Blueprint $table) {
            if (!Schema::hasColumn('weeks', 'id_batch')) {
                $table->integer('id_batch')->nullable()->after('id_week');
            }
            if (!Schema::hasColumn('weeks', 'tanggal_mulai')) {
                $table->date('tanggal_mulai')->nullable()->after('angka_week');
            }
        });
        // Gunakan raw SQL agar display width cocok persis dengan adapt_nag
        if (!Schema::hasColumn('weeks', 'bulan')) {
            DB::statement("ALTER TABLE `weeks` ADD COLUMN `bulan` tinyint(2) DEFAULT NULL AFTER `tanggal_mulai`");
        }
        if (!Schema::hasColumn('weeks', 'tahun')) {
            DB::statement("ALTER TABLE `weeks` ADD COLUMN `tahun` smallint(4) DEFAULT NULL AFTER `bulan`");
        }

        if (!$this->hasIndex('weeks', 'idx_weeks_batch')) {
            Schema::table('weeks', function (Blueprint $table) {
                $table->index('id_batch', 'idx_weeks_batch');
            });
        }
        // uniq_week_batch: NULL id_batch aman di MySQL (NULL != NULL di UNIQUE)
        if (!$this->hasIndex('weeks', 'uniq_week_batch')) {
            Schema::table('weeks', function (Blueprint $table) {
                $table->unique(['id_batch', 'angka_week'], 'uniq_week_batch');
            });
        }

        // =====================================================================
        // weeks_kader: tambah id_batch, tanggal_mulai, bulan, tahun + indexes
        // =====================================================================
        Schema::table('weeks_kader', function (Blueprint $table) {
            if (!Schema::hasColumn('weeks_kader', 'id_batch')) {
                $table->integer('id_batch')->nullable()->after('id_week');
            }
            if (!Schema::hasColumn('weeks_kader', 'tanggal_mulai')) {
                $table->date('tanggal_mulai')->nullable()->after('angka_week');
            }
        });
        if (!Schema::hasColumn('weeks_kader', 'bulan')) {
            DB::statement("ALTER TABLE `weeks_kader` ADD COLUMN `bulan` tinyint(2) DEFAULT NULL AFTER `tanggal_mulai`");
        }
        if (!Schema::hasColumn('weeks_kader', 'tahun')) {
            DB::statement("ALTER TABLE `weeks_kader` ADD COLUMN `tahun` smallint(4) DEFAULT NULL AFTER `bulan`");
        }

        if (!$this->hasIndex('weeks_kader', 'idx_weekskader_batch')) {
            Schema::table('weeks_kader', function (Blueprint $table) {
                $table->index('id_batch', 'idx_weekskader_batch');
            });
        }
        if (!$this->hasIndex('weeks_kader', 'uniq_weekkader_batch')) {
            Schema::table('weeks_kader', function (Blueprint $table) {
                $table->unique(['id_batch', 'angka_week'], 'uniq_weekkader_batch');
            });
        }

        // =====================================================================
        // feedback_mai: tambah unique index
        // PERINGATAN: akan gagal jika ada baris duplikat (nik_kader, id_week, user_type)
        // Cek manual: SELECT nik_kader, id_week, user_type, COUNT(*) FROM feedback_mai
        //             GROUP BY nik_kader, id_week, user_type HAVING COUNT(*) > 1;
        // =====================================================================
        if (!$this->hasIndex('feedback_mai', 'uniq_fm_week')) {
            Schema::table('feedback_mai', function (Blueprint $table) {
                $table->unique(['nik_kader', 'id_week', 'user_type'], 'uniq_fm_week');
            });
        }
    }

    public function down(): void
    {
        // feedback_mai
        if ($this->hasIndex('feedback_mai', 'uniq_fm_week')) {
            Schema::table('feedback_mai', function (Blueprint $table) {
                $table->dropUnique('uniq_fm_week');
            });
        }

        // weeks_kader
        if ($this->hasIndex('weeks_kader', 'uniq_weekkader_batch')) {
            Schema::table('weeks_kader', function (Blueprint $table) {
                $table->dropUnique('uniq_weekkader_batch');
            });
        }
        if ($this->hasIndex('weeks_kader', 'idx_weekskader_batch')) {
            Schema::table('weeks_kader', function (Blueprint $table) {
                $table->dropIndex('idx_weekskader_batch');
            });
        }
        Schema::table('weeks_kader', function (Blueprint $table) {
            foreach (['id_batch', 'tanggal_mulai', 'bulan', 'tahun'] as $col) {
                if (Schema::hasColumn('weeks_kader', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // weeks
        if ($this->hasIndex('weeks', 'uniq_week_batch')) {
            Schema::table('weeks', function (Blueprint $table) {
                $table->dropUnique('uniq_week_batch');
            });
        }
        if ($this->hasIndex('weeks', 'idx_weeks_batch')) {
            Schema::table('weeks', function (Blueprint $table) {
                $table->dropIndex('idx_weeks_batch');
            });
        }
        Schema::table('weeks', function (Blueprint $table) {
            foreach (['id_batch', 'tanggal_mulai', 'bulan', 'tahun'] as $col) {
                if (Schema::hasColumn('weeks', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // modul
        if (Schema::hasColumn('modul', 'tipe')) {
            Schema::table('modul', function (Blueprint $table) {
                $table->dropColumn('tipe');
            });
        }

        // dokumen - balikkan MODIFY columns dan drop index + kolom baru
        if ($this->hasIndex('dokumen', 'uniq_idp_per_batch')) {
            Schema::table('dokumen', function (Blueprint $table) {
                $table->dropUnique('uniq_idp_per_batch');
            });
        }

        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `jenis` VARCHAR(100) DEFAULT NULL");
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `status` ENUM('pending','approved','rejected') DEFAULT 'pending'");
        DB::statement("ALTER TABLE `dokumen` MODIFY COLUMN `tipe` ENUM('kader','mentor') NOT NULL");

        Schema::table('dokumen', function (Blueprint $table) {
            $toDrop = ['approved_by', 'approved_at', 'rejection_reason', 'rejected_by_role',
                       'mentor_approved_by', 'mentor_approved_at', 'modul_id', 'id_batch'];
            foreach ($toDrop as $col) {
                if (Schema::hasColumn('dokumen', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        // batch
        Schema::table('batch', function (Blueprint $table) {
            foreach (['tanggal_mulai', 'tanggal_selesai'] as $col) {
                if (Schema::hasColumn('batch', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
