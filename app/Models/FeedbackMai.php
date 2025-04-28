<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackMai extends Model
{
    use HasFactory;
    protected $table = 'feedback_mai';
    protected $guarded = [];

    public function details()
    {
        return $this->hasMany(FmDetail::class, 'id_feedbackmai', 'id_feedbackmai');
    }
    public function kaders()
    {
        return $this->hasMany(Kader::class, 'nik', 'nik_kader');
    }
}
