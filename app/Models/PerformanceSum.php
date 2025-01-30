<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceSum extends Model
{
    use HasFactory;
    protected $table = 'performance_summary';
    protected $guarded = [];
}
