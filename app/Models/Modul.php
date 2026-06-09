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
     * Skor Akhir modul berdasarkan komponen yang dimilikinya:
     * - punya keduanya  → rata-rata 50/50 post-test & Post Activity (hanya bila keduanya dinilai)
     * - hanya test      → skor post-test
     * - hanya PA        → nilai Post Activity
     * Mengembalikan null bila modul belum bisa dinilai.
     */
    public static function finalScore(bool $hasTest, bool $hasPA, $postScore, $paNilai): ?float
    {
        if ($hasTest && $hasPA) {
            return ($postScore !== null && $paNilai !== null)
                ? round(((float) $postScore + (float) $paNilai) / 2, 2)
                : null;
        }
        if ($hasTest) {
            return $postScore !== null ? (float) $postScore : null;
        }
        if ($hasPA) {
            return $paNilai !== null ? (float) $paNilai : null;
        }
        return null;
    }
}
