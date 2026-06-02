<?php

use App\Http\Controllers\Modul\FormIdpController;
use App\Http\Controllers\Modul\LearningController;
use App\Http\Controllers\Report\FeedbackMaiController;
use Illuminate\Support\Facades\Route;

// Semua route khusus role Kader
Route::middleware(['can:isKader'])->group(function () {
    Route::get('/my-learning', [LearningController::class, 'index'])->name('my.learning');

    // Upload File IDP
    Route::get('/form-idp', [FormIdpController::class, 'index'])->name('form.idp.index');
    Route::post('/form-idp/upload', [FormIdpController::class, 'store'])->name('form.idp.store');

    // Feedback MAI (Kader mengisi untuk Mentor)
    Route::get('/feedback_mai-mentor', [FeedbackMaiController::class, 'fm_mentor_index'])->name('fm.mentor.index');
    Route::get('/feedback_mai-mentor/export/{id_week}/{nik_kader}', [FeedbackMaiController::class, 'fm_mentor_export'])->name('fm.mentor.export');
});
