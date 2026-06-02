<?php

use App\Http\Controllers\Modul\JawabanController;
use App\Http\Controllers\Modul\LearningController;
use Illuminate\Support\Facades\Route;

// Modul pembelajaran, test & post-activity — semua role yang sudah login
Route::middleware(['can:isAll'])->group(function () {
    // Feedback survey (Mentor & Kader mengisi)
    Route::get('/feedback-survey', [JawabanController::class, 'feedback'])->name('feedback.index');
    Route::post('/feedback-survey/store', [JawabanController::class, 'feedback_store'])->name('feedback.store');
    Route::post('/feedback-survey-kader/store', [JawabanController::class, 'feedback_kader_store'])->name('feedback_kader.store');
    Route::post('api/fetch-weeks', [JawabanController::class, 'fetchWeek'])->name('fetch.week');

    // Detail & navigasi modul
    Route::get('/learning/{id}', [LearningController::class, 'detail'])->name('learning.detail');
    Route::get('/modul/{id}/test/{type}', [LearningController::class, 'test'])->name('learning.test');
    Route::post('/learning/test/submit', [LearningController::class, 'submitTest'])->name('learning.submitTest');
    Route::get('/learning/{id}/answers/{type}', [LearningController::class, 'myAnswers'])->name('learning.myAnswers');
    Route::post('/learning/materi/progress', [LearningController::class, 'saveReadingProgress'])->name('learning.saveReadingProgress');

    // Upload Post Activity (Kader & Mentor)
    Route::post('/learning/post-activity/upload', [LearningController::class, 'uploadPostActivity'])->name('learning.uploadPostActivity');

    Route::get('/ajax/test/{id}/{type}', [LearningController::class, 'ajax_test']);
});
