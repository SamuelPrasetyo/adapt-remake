<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Feedback mentor (nama_mentor NOT NULL) & refleksi kader (nama_mentor NULL).
 *
 * Soft delete: dipakai untuk mengarsipkan jawaban minggu ganjil saat jadwal
 * dikembalikan ke ritme dwi-mingguan — datanya tidak hilang, hanya tersembunyi
 * dari seluruh query model ini.
 *
 * CATATAN: primary key tabel ini `id_jawaban`, tapi model tidak mendeklarasikannya,
 * jadi operasi per-instance (->delete(), ->save()) tidak bisa diandalkan. Pakai
 * query builder: Jawaban::whereIn('id_jawaban', ...)->delete().
 */
class Jawaban extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'jawaban';
    protected $guarded = [];
}
