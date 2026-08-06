<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Master\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['can:isAll'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    // Detail kartu "Feedback Belum Terisi" (JSON, dimuat saat kartunya diklik).
    Route::get('/dashboard/feedback-belum', [DashboardController::class, 'feedbackBelum'])->name('dashboard.feedback-belum');
    Route::post('/user/change_password/{id}', [UserController::class, 'change_password'])->name('user.change_password');
});

Route::middleware(['can:isKader'])->group(function () {
    Route::get('/dashboard-kader', [DashboardController::class, 'dashboard_kader'])->name('dashboard.kader');
    Route::post('/dashboard-kader/refleksi', [DashboardController::class, 'storeRefleksi'])->name('dashboard.kader.refleksi');
});
