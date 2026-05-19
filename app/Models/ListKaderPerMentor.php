<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ListKaderPerMentor extends Model
{
    use HasFactory;

    protected $table = 'list_kader_per_mentor';
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyType = 'uuid';
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
