<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoalModul extends Model
{
    use HasFactory;
    protected $table = 'soal_modul';
    protected $guarded = [];

    public function jawabans()
    {
        return $this->hasMany(JawabanModul::class, 'soal_id');
    }
}
