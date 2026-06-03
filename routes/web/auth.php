<?php

use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

// Halaman login & proses autentikasi (unauthenticated)
Route::controller(LoginController::class)->group(function () {
    Route::get('/login', 'index')->name('login.index');
    Route::post('/login/store', 'store')->name('login.store');
});

// Logout & ganti password (semua role yang sudah login)
Route::middleware(['can:isAll'])->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
});
