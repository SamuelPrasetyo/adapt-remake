<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Skor arsip report Batch 1 & 2 (hasil impor Excel). Satu baris per kader.
 * Lihat migration create_report_arsip_table untuk arti tiap kolom.
 */
class ReportArsip extends Model
{
    protected $table = 'report_arsip';
    protected $guarded = [];

    protected $casts = [
        'batch_no'             => 'integer',
        'source_no'            => 'integer',
        'learning_growth'      => 'float',
        'development_progress' => 'float',
        'fmc_avg'              => 'float',
        'ojt1'                 => 'float',
        'ojt2'                 => 'float',
        'ojt3'                 => 'float',
        'ojt4'                 => 'float',
        'dev_job_routine'      => 'float',
        'dev_assignment'       => 'float',
        'dev_sop'              => 'float',
        'dev_project'          => 'float',
    ];
}
