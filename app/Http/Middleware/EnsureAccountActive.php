<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Mengeluarkan sesi akun Kader yang sudah dinonaktifkan.
 *
 * Login sudah menolak akun non-Aktif, tapi sesi yang sedang berjalan tetap sah
 * sampai logout. User dimuat segar dari DB tiap request oleh guard sesi, jadi
 * mengecek status di sini tidak menambah query.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if ($user && $user->type === 'Kader' && $user->status !== 'Aktif') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $request->session()->flash('loginError', 'Akun tidak aktif');

            // Request Inertia harus full-page redirect, kalau tidak halaman login
            // dirender di dalam layout aplikasi.
            return $request->header('X-Inertia')
                ? Inertia::location(route('login.index'))
                : redirect()->route('login.index');
        }

        return $next($request);
    }
}
