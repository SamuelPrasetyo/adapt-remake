<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * CATATAN: $primaryKey berupa array (composite) tidak didukung Eloquent, jadi
 * operasi berbasis instance (find(), $model->save(), $model->delete()) rusak.
 * Seluruh codebase memakai query builder — Kader::where('id', $id)->update(...).
 *
 * Trait SoftDeletes dipakai HANYA untuk global scope-nya (semua query Kader::
 * otomatis menyaring deleted_at NULL) + helper withTrashed()/onlyTrashed().
 * JANGAN panggil $kader->delete()/$kader->restore() — pakai query builder,
 * lihat App\Support\KaderArchiver.
 */
class Kader extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'kader';
    protected $guarded = [];
    public $incrementing = false;
    protected $primaryKey = ['id','nik'];
    protected $keyType = 'uuid';
}
