<?php

use App\Http\Controllers\Approval\ApprovalController;
use App\Http\Controllers\Modul\FormIdpController;
use App\Http\Controllers\Template\TemplateAdminController;
use Illuminate\Support\Facades\Route;

// Approval & manajemen Form IDP — hanya Admin MAI (021)
Route::middleware(['can:isAdmin021'])->group(function () {
    // Halaman approval utama (OJT, Post Activity, Form IDP)
    Route::get('/approval', [ApprovalController::class, 'index'])->name('approval.index');

    // Penilaian OJT
    Route::post('/approval/ojt/{kader_id}/{fmc}/approve', [ApprovalController::class, 'approveOjt'])->name('approval.ojt.approve');
    Route::post('/approval/ojt/{kader_id}/{fmc}/reject', [ApprovalController::class, 'rejectOjt'])->name('approval.ojt.reject');

    // Post Activity
    Route::post('/approval/post-activity/{dokumen}/approve', [ApprovalController::class, 'approvePostActivity'])->name('approval.pa.approve');
    Route::post('/approval/post-activity/{dokumen}/reject', [ApprovalController::class, 'rejectPostActivity'])->name('approval.pa.reject');

    // Form IDP — tahap kedua (setelah Mentor approve)
    Route::post('/approval/form-idp/{dokumen}/approve', [ApprovalController::class, 'approveIdp'])->name('approval.idp.approve');
    Route::post('/approval/form-idp/{dokumen}/reject', [ApprovalController::class, 'rejectIdp'])->name('approval.idp.reject');

    // Halaman Template terpadu (Perjanjian Kerja, Weekly Feedback, IDP)
    Route::get('/template', [TemplateAdminController::class, 'index'])->name('template.index');
    Route::post('/template-dokumen/perjanjian-kerja', [TemplateAdminController::class, 'uploadPerjanjianKerja'])->name('template.pk.upload');
    Route::post('/template-dokumen/weekly-feedback', [TemplateAdminController::class, 'uploadWeeklyFeedback'])->name('template.wf.upload');
    Route::post('/form-idp/admin/upload-template', [FormIdpController::class, 'uploadTemplate'])->name('form.idp.template.upload');
});
