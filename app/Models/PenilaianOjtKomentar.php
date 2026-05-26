<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenilaianOjtKomentar extends Model
{
    use HasFactory;

    protected $table = 'penilaian_ojt_komentar';
    protected $guarded = [];
    public $timestamps = false;
}
