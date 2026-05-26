<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenilaianOjtSkor extends Model
{
    use HasFactory;

    protected $table = 'penilaian_ojt_skor';
    protected $guarded = [];
    public $timestamps = false;
}
