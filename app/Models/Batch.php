<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasFactory;
    protected $table = 'batch';
    protected $primaryKey = 'id_batch';
    protected $guarded = [];

    protected $casts = [
        'tanggal_mulai'   => 'date',
        'tanggal_selesai' => 'date',
    ];

    /**
     * Batch yang rentang tanggalnya mencakup hari ini.
     */
    public function scopeActive($q)
    {
        $today = now()->toDateString();
        return $q->whereNotNull('tanggal_mulai')
                 ->whereDate('tanggal_mulai', '<=', $today)
                 ->whereDate('tanggal_selesai', '>=', $today)
                 ->orderByDesc('tanggal_mulai');
    }

    /**
     * Urutan batch terbaru → terlama untuk dropdown/daftar pilihan.
     *
     * Jangan pakai tanggal_mulai/id_batch untuk ini: batch arsip (1 & 2)
     * tanggal_mulai-nya NULL (MySQL menaruh NULL di belakang pada DESC) dan
     * id_batch mengikuti urutan input — Batch 1 justru di-input paling akhir
     * sehingga id-nya lebih besar dari Batch 2. Nomor batch dicast ke angka
     * supaya "10" tidak terurut sebelum "9" saat batch sudah dua digit.
     */
    public function scopeNewestFirst($q)
    {
        return $q->orderByDesc('tahun_batch')
                 ->orderByRaw('CAST(nama_batch AS UNSIGNED) DESC');
    }

    /**
     * Batch yang sedang berjalan. Jika hari ini tidak masuk rentang batch
     * mana pun (mis. ada jeda antar-batch), fallback ke batch terbaru.
     */
    public static function current()
    {
        return static::active()->first()
            ?? static::orderByDesc('tanggal_mulai')->orderByDesc('id_batch')->first();
    }

    /**
     * Feedback (Weekly & Monthly) masih boleh diubah selama batch belum berakhir.
     *
     * SENGAJA dihitung dari tanggal, bukan disimpan sebagai kolom `is_locked`. Tidak ada
     * cron/scheduler yang perlu "menyalakan" lock: begitu tanggal_selesai terlewat, setiap
     * pembacaan berikutnya otomatis mengembalikan false. Tidak ada jendela waktu di mana
     * data sudah lewat tapi flag-nya belum ter-update.
     *
     * Batch arsip (tanggal_selesai NULL — lihat Batch 1 & 2) dianggap sudah terkunci.
     */
    public function feedbackEditable(): bool
    {
        return $this->tanggal_selesai !== null
            && $this->tanggal_selesai->toDateString() >= now()->toDateString();
    }

    /**
     * Progres minggu kalender batch (dihitung murni dari tanggal).
     * Mengembalikan ['current' => minggu ke-N, 'total' => total minggu].
     */
    public function weekProgress(): array
    {
        if (!$this->tanggal_mulai || !$this->tanggal_selesai) {
            return ['current' => null, 'total' => null];
        }

        $start = \Carbon\Carbon::parse($this->tanggal_mulai)->startOfDay();
        $end   = \Carbon\Carbon::parse($this->tanggal_selesai)->startOfDay();
        $today = now()->startOfDay();

        $total = (int) ceil(($start->diffInDays($end) + 1) / 7);

        // Signed: negatif jika batch belum mulai.
        $daysFromStart = $start->diffInDays($today, false);
        $current = $daysFromStart < 0 ? 1 : (int) floor($daysFromStart / 7) + 1;

        return ['current' => max(1, min($current, $total)), 'total' => $total];
    }
}
