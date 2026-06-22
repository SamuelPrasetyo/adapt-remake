<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Master\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['can:isAll'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    Route::post('/user/change_password/{id}', [UserController::class, 'change_password'])->name('user.change_password');
});

Route::middleware(['can:isKader'])->group(function () {
    Route::get('/dashboard-kader', [DashboardController::class, 'dashboard_kader'])->name('dashboard.kader');
    Route::post('/dashboard-kader/refleksi', [DashboardController::class, 'storeRefleksi'])->name('dashboard.kader.refleksi');
});
