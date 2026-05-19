<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mentor extends Model
{
    use HasFactory;

    protected $table = 'mentor';
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyType = 'uuid';
    public $timestamps = false;

    public function kaders()
    {
        return $this->hasMany(ListKaderPerMentor::class, 'mentor_id', 'id')
            ->whereNull('deleted_at');
    }
}
