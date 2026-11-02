<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiwayatPergantianMentor extends Model
{
    protected $table = 'riwayat_pergantian_mentor';
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyType = 'string';
    public $timestamps = false;

    public function mentor()
    {
        return $this->belongsTo(Mentor::class, 'mentor_id', 'id');
    }

    public function kader()
    {
        return $this->belongsTo(Kader::class, 'kader_id', 'id');
    }
}
