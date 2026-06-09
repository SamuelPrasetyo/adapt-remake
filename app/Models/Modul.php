<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modul extends Model
{
    use HasFactory;

    protected $table = 'modul';
    protected $guarded = [];

    protected $casts = [
        'has_test'          => 'boolean',
        'has_post_activity' => 'boolean',
    ];

    public function assignments()
    {
        return $this->hasMany(ModulAssignment::class);
    }

    /**
     * Skor Akhir modul. Rumus tunggal ada di {@see \App\Support\ModulScore::finalScore()};
     * method ini hanya delegasi agar pemanggil lama tetap jalan. Pre Test TIDAK dihitung.
     */
    public static function finalScore(bool $hasTest, bool $hasPA, $postScore, $paNilai): ?float
    {
        return \App\Support\ModulScore::finalScore($hasTest, $hasPA, $postScore, $paNilai);
    }
}
