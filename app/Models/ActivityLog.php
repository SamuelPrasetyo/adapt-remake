<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    use HasFactory;
    protected $table = 'activity_log';
    protected $guarded = [];

    public static function activity_log(string $desc)
    {
        $data = [
            'desc'       => $desc,
            'created_at' => now(),
            'created_by' => Auth::user()->id,
        ];
        ActivityLog::insert($data);
    }
}
