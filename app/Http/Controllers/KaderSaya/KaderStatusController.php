<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Support\KaderDeactivator;
use Illuminate\Support\Facades\Auth;

/**
 * Nonaktifkan / aktifkan kembali kader — khusus Admin MAI (021).
 */
class KaderStatusController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function deactivate($kaderId)
    {
        $this->authorizeAdminMai();

        if (!KaderDeactivator::deactivate($kaderId, Auth::id())) {
            return back()->with('error', 'Kader tidak ditemukan, sudah nonaktif, atau sedang diarsipkan.');
        }

        ActivityLog::activity_log('Menonaktifkan kader');
        return back()->with('success', 'Kader berhasil dinonaktifkan. Akunnya tidak dapat login lagi.');
    }

    public function reactivate($kaderId)
    {
        $this->authorizeAdminMai();

        if (!KaderDeactivator::reactivate($kaderId, Auth::id())) {
            return back()->with('error', 'Kader tidak ditemukan, tidak sedang nonaktif, atau sedang diarsipkan.');
        }

        ActivityLog::activity_log('Mengaktifkan kembali kader');
        return back()->with('success', 'Kader berhasil diaktifkan kembali.');
    }

    private function authorizeAdminMai(): void
    {
        $user = Auth::user();
        abort_unless(
            $user && $user->type === 'Admin' && $user->company_code === '021',
            403,
            'Hanya Admin MAI yang dapat mengubah status kader.'
        );
    }
}
