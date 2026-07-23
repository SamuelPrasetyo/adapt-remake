<?php

use App\Http\Controllers\KaderSaya\KaderSayaController;
use App\Http\Controllers\KaderSaya\KandidatExportController;
use App\Http\Controllers\KaderSaya\PenilaianOjtController;
use App\Http\Controllers\KaderSaya\PerjanjianKerjaController;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use Illuminate\Support\Facades\Route;

// Kader Saya, Perjanjian Kerja & Penilaian OJT — Admin MAI + Mentor
Route::middleware(['can:canMentorDashboard'])->group(function () {
    Route::get('/mentor/{mentor_id}/kaders', [KaderPerMentorController::class, 'listByMentor'])->name('mentor.listKaders');

    Route::get('/kader-saya', [KaderSayaController::class, 'index'])->name('kader.saya.index');
    // Cek keberadaan berkas kandidat (tab Kandidat) — didaftarkan sebelum route wildcard {kader_id}.
    Route::get('/kandidat/file-exists', [KaderSayaController::class, 'kandidatFileExists'])->name('kandidat.fileExists');
    // Export PDF tab Job Applicant (khusus Admin MAI 021, dicek di controller).
    Route::get('/kandidat/berkas', [KandidatExportController::class, 'berkas'])->name('kandidat.berkas');
    Route::get('/kader-saya/{kader_id}/kandidat/pdf', [KandidatExportController::class, 'pdf'])->name('kandidat.pdf');
    Route::get('/kader-saya/{kader_id}/kandidat/lampiran', [KandidatExportController::class, 'lampiran'])->name('kandidat.lampiran');
    Route::get('/kader-saya/{kader_id}', [KaderSayaController::class, 'show'])->name('kader.saya.show');
    Route::post('/kader-saya/{kader_id}/feedback', [KaderSayaController::class, 'storeFeedback'])->name('kader.saya.storeFeedback');
    Route::post('/kader-saya/{kader_id}/monthly-feedback', [KaderSayaController::class, 'storeMonthlyFeedback'])->name('kader.saya.storeMonthlyFeedback');
    // Summary Monthly Feedback — hanya Admin MAI (dicek di controller)
    Route::post('/kader-saya/{kader_id}/monthly-summary', [KaderSayaController::class, 'storeMonthlyFeedbackSummary'])->name('kader.saya.storeMonthlyFeedbackSummary');

    Route::post('/kader-saya/{kader_id}/perjanjian-kerja', [PerjanjianKerjaController::class, 'store'])->name('perjanjian.store');
    Route::delete('/perjanjian-kerja/{id}', [PerjanjianKerjaController::class, 'destroy'])->name('perjanjian.destroy');
    Route::get('/perjanjian-kerja/{id}/download', [PerjanjianKerjaController::class, 'download'])->name('perjanjian.download');

    // Penilaian OJT — write oleh Mentor, read oleh Admin021 + Mentor (cek di controller)
    Route::post('/kader-saya/{kader_id}/penilaian/{fmc}', [PenilaianOjtController::class, 'store'])->name('penilaian.store');
});
