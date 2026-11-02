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

    public static function activity_log(string $desc, string $errmsg = '')
    {
        $data = [
            // Kolom desc varchar(100) — potong agar log yang panjang (nama mentor/kader
            // dinamis) tidak menggagalkan request yang datanya sudah tersimpan.
            'desc'       => mb_strimwidth($desc, 0, 100, '…'),
            'err_msg'    => $errmsg,
            'created_at' => now(),
            'created_by' => Auth::user()->id,
        ];
        ActivityLog::insert($data);

        if ($desc == "Berhasil logout") {
            if (Auth::check()) {
                $id = Auth::user()->id;
                User::where('id', $id)->update(['last_activity' => null]);
            }
        }
    }
}
