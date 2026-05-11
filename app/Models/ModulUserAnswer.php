<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModulUserAnswer extends Model
{
    protected $table = 'modul_user_answer';
    protected $guarded = [];

    public function answers()
    {
        return $this->hasMany(ModulTestResult::class, 'result_id');
    }
}
