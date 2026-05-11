<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modul extends Model
{
    use HasFactory;

    protected $table = 'modul';
    protected $guarded = [];

    public function assignments()
    {
        return $this->hasMany(ModulAssignment::class);
    }
}
