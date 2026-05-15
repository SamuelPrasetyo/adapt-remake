<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModulUserAnswers extends Model
{
    protected $table = 'modul_user_answers';
    protected $guarded = [];

    public function answers()
    {
        return $this->hasMany(ModulTestResult::class, 'result_id');
    }
}
