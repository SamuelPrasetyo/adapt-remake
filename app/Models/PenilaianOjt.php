<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenilaianOjt extends Model
{
    use HasFactory;

    protected $table = 'penilaian_ojt';
    protected $primaryKey = 'id_penilaian_ojt';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = [];

    public function skor()
    {
        return $this->hasMany(PenilaianOjtSkor::class, 'id_penilaian_ojt', 'id_penilaian_ojt');
    }

    public function komentar()
    {
        return $this->hasMany(PenilaianOjtKomentar::class, 'id_penilaian_ojt', 'id_penilaian_ojt');
    }

    public function kader()
    {
        return $this->belongsTo(Kader::class, 'kader_id', 'id');
    }
}
