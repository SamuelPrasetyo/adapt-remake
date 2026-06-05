<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dokumen extends Model
{
    use HasFactory;

    protected $table = 'dokumen';
    protected $guarded = [];

    public function penilaian()
    {
        return $this->hasOne(PenilaianPostActivity::class, 'dokumen_id');
    }

    public function files()
    {
        return $this->hasMany(DokumenFile::class, 'dokumen_id');
    }
}
