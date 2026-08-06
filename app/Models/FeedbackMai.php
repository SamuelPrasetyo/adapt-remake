<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Feedback MAI (user_type 'kader' -> jadwal weeks_kader, 'mentor' -> weeks).
 *
 * Soft delete dipakai untuk mengarsipkan isi minggu ganjil saat jadwal kembali
 * dwi-mingguan. Primary key `id_feedbackmai` tidak dideklarasikan, jadi hapus/ubah
 * lewat query builder, bukan per-instance.
 */
class FeedbackMai extends Model
{
    use HasFactory, SoftDeletes;
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
