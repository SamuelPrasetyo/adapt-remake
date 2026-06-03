<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeekKader extends Model
{
    use HasFactory;
    protected $table = 'weeks_kader';
    protected $primaryKey = 'id_week';
    protected $guarded = [];

    protected $casts = [
        'tanggal_mulai' => 'date',
    ];

    /** Week milik satu batch. */
    public function scopeForBatch($q, $idBatch)
    {
        return $q->where('id_batch', $idBatch);
    }

    /** Hanya week yang sudah berjalan (anti-fraud: tak bisa isi minggu depan). */
    public function scopeAvailable($q)
    {
        return $q->whereNotNull('tanggal_mulai')
                 ->whereDate('tanggal_mulai', '<=', now()->toDateString());
    }
}
