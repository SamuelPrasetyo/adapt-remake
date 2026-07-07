<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyFeedbackSummary extends Model
{
    use HasFactory;

    protected $table = 'monthly_feedback_summaries';
    protected $guarded = [];
}
