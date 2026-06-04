<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenilaianPostActivity extends Model
{
    use HasFactory;

    protected $table = 'penilaian_post_activity';
    protected $guarded = [];

    public function dokumen()
    {
        return $this->belongsTo(Dokumen::class, 'dokumen_id');
    }
}
