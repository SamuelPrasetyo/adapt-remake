<?php

use App\Http\Controllers\Approval\ApprovalController;
use App\Http\Controllers\Modul\MentorModulController;
use App\Http\Controllers\Report\FeedbackMaiController;
use Illuminate\Support\Facades\Route;

// Semua route khusus role Mentor
Route::middleware(['can:isMentor'])->group(function () {
    // Feedback MAI (Mentor mengisi untuk Kader)
    Route::get('/feedback_mai-kader', [FeedbackMaiController::class, 'fm_kader_index'])->name('fm.kader.index');
    Route::get('/feedback_mai-kader/export/{id_week}/{nik_kader}', [FeedbackMaiController::class, 'fm_kader_export'])->name('fm.kader.export');

    // Approval Form IDP tingkat pertama oleh Mentor (sebelum diteruskan ke Admin MAI)
    Route::get('/approval/idp', [ApprovalController::class, 'mentorIdp'])->name('mentor.idp.index');
    Route::post('/approval/idp/{dokumen}/approve', [ApprovalController::class, 'mentorApproveIdp'])->name('mentor.idp.approve');
    Route::post('/approval/idp/{dokumen}/reject', [ApprovalController::class, 'mentorRejectIdp'])->name('mentor.idp.reject');

    // Program Saya & Modul (learning program milik Mentor sendiri)
    Route::get('/program-saya', [MentorModulController::class, 'programSaya'])->name('mentor.programSaya');
    Route::get('/mentor-modul', [MentorModulController::class, 'index'])->name('mentor.modul');
});
