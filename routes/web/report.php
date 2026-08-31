<?php

use App\Http\Controllers\Report\FeedbackMaiController;
use App\Http\Controllers\Report\ReportController;
use Illuminate\Support\Facades\Route;

// Report & Feedback MAI — Admin + Mentor (bukan Kader)
Route::middleware(['can:isAdmin&Mentor'])->group(function () {
    Route::controller(ReportController::class)->group(function () {
        Route::get('/learning-index', 'learning_index')->name('learning.index');
        Route::post('/learning-growth', 'learning_growth')->name('learning.growth');
        Route::get('/ojt-index', 'weekly_index')->name('weekly.index');
        Route::post('/ojt-monitoring', 'weekly_monitoring')->name('weekly.monitoring');

        Route::get('/learning-growth/export-pdf/{nik}', 'exportLearningGrowthPdf')->name('learning.export_pdf');
        Route::post('/export-pdf', 'exportPdf')->name('exportPdf');

        // Report New — Management Trainee Development Report (batch ke-3 ke atas)
        Route::get('/report-new', 'report_new_index')->name('report.new.index');
        Route::get('/report-new/{kader}', 'report_new')->name('report.new.show');

        // Nilai Feedback Menu
        Route::get('/kader-feedback', 'kader_feedback_index')->name('kader.feedback.index');

        // Report Arsip — Batch 1 & 2 (skor agregat, tanpa historikal sistem)
        Route::get('/report-arsip/{kader}', 'report_arsip_show')->name('report.arsip.show');
        // Rincian nilai in-class training dari dokumen arsip (baru tersedia untuk Batch 2)
        Route::get('/report-arsip/{kader}/hasil-training', 'report_arsip_training')->name('report.arsip.training');

        // Import Arsip Batch 1 & 2 (upload Excel) — Admin MAI
        Route::get('/report-import-arsip', 'import_arsip_index')->name('report.arsip.import.index');
        Route::post('/report-import-arsip', 'import_arsip_store')->name('report.arsip.import.store');

        Route::get('/reportfeedback-index', 'feedback_index')->name('reportfeedback.index');
        Route::match(['get', 'post'], '/reportfeedback', 'report_feedback')->name('report.feedback');
        Route::match(['get', 'post'], '/reportfeedback-back/{ojt}', 'report_feedback_back')->name('report.feedback.back');
        Route::get('/reportfeedback/export/{ojt}', 'export_reportfeedback')->name('reportfeedback.exportexcel');
        Route::get('/reportfeedback-kader/export/{ojt}', 'export_reportfeedback_kader')->name('reportfeedbackkader.exportexcel');

        Route::post('/performsum', 'perform_sum_add')->name('performsum.add');
        Route::put('/performsum-edit/{id}', 'perform_sum_edit')->name('performsum.edit');
    });

    Route::post('/assessment/upload/{id}', [ReportController::class, 'upload'])->name('assessment.upload');

    // Feedback MAI — Admin & Mentor
    Route::post('/feedbackmai/store', [FeedbackMaiController::class, 'feedbackmai'])->name('feedbackmai');
    Route::put('/feedbackmai/{id}', [FeedbackMaiController::class, 'feedbackmai_update'])->name('feedbackmai.update');
    Route::get('/get-feedback-by-week', [FeedbackMaiController::class, 'getByWeek'])->name('get.feedback.by.week');
    Route::get('/feedback/export-pdf/{id}', [FeedbackMaiController::class, 'exportPdf'])->name('feedbackmai.exportPdf');

    Route::post('/feedbackmai-m/store', [FeedbackMaiController::class, 'feedbackmaiM'])->name('feedbackmaiM');
    Route::put('/feedbackmai-m/{id}', [FeedbackMaiController::class, 'feedbackmai_updateM'])->name('feedbackmai.updateM');
    Route::get('/get-feedback-m-by-week', [FeedbackMaiController::class, 'getByWeekM'])->name('get.feedback.by.weekM');
    Route::get('/feedback-m/export-pdf/{id}', [FeedbackMaiController::class, 'exportPdfM'])->name('feedbackmai.exportPdfM');

    Route::get('/get-weeks', [FeedbackMaiController::class, 'getWeeks'])->name('getWeeks');
    Route::get('/get-weeksM', [FeedbackMaiController::class, 'getWeeksM'])->name('getWeeksM');
    Route::get('/get-mentor', [FeedbackMaiController::class, 'getMentor'])->name('getMentor');
    Route::get('/get-weeks-editM', [FeedbackMaiController::class, 'getWeeksEditM'])->name('getWeeksEditM');
    Route::get('/get-weeks-editK', [FeedbackMaiController::class, 'getWeeksEditK'])->name('getWeeksEditK');
});

// Endpoint publik (semua role) untuk cek jumlah feedback detail
Route::get('/get-fmdetail/{id}', function ($id) {
    return \App\Models\FmDetail::where('id_feedbackmai', $id)->count();
});
