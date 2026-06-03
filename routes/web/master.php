<?php

use App\Http\Controllers\Master\BatchController;
use App\Http\Controllers\Master\DepartemenController;
use App\Http\Controllers\Master\DivisiController;
use App\Http\Controllers\Master\KaderController;
use App\Http\Controllers\Master\NilaiController;
use App\Http\Controllers\Master\PertanyaanController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\WeekController;
use App\Http\Controllers\Modul\DokumenController;
use App\Http\Controllers\Modul\JawabanController;
use App\Http\Controllers\Modul\ModulController;
use App\Http\Controllers\Modul\SoalModulController;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Semua route master data — hanya Admin
Route::middleware(['can:isAdmin'])->group(function () {
    Route::get('/activity-log', function () {
        $activities_log = ActivityLog::select('activity_log.*', 'users.name as nama')
            ->join('users', 'activity_log.created_by', 'users.id')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('ActivityLog/Index', ['logs' => $activities_log]);
    })->name('activity.log');

    Route::controller(DivisiController::class)->group(function () {
        Route::get('/divisi', 'index')->name('divisi.index');
        Route::post('/divisi/store', 'store')->name('divisi.store');
        Route::post('/divisi/import', 'import')->name('divisi.import');
        Route::put('/divisi/update/{id}', 'update')->name('divisi.update');
        Route::delete('/divisi/delete/{id}', 'destroy')->name('divisi.delete');
    });

    Route::controller(DepartemenController::class)->group(function () {
        Route::get('/departemen', 'index')->name('departemen.index');
        Route::post('/departemen/store', 'store')->name('departemen.store');
        Route::post('/departemen/import', 'import')->name('departemen.import');
        Route::put('/departemen/update/{id}', 'update')->name('departemen.update');
        Route::delete('/departemen/delete/{id}', 'destroy')->name('departemen.delete');
    });

    Route::controller(UserController::class)->group(function () {
        Route::get('/user', 'index')->name('user.index');
        Route::post('/user/store', 'store')->name('user.store');
        Route::get('/user/generatekader', 'generate_kader')->name('user.generatekader');
        Route::put('/user/update/{id}', 'update')->name('user.update');
        Route::delete('/user/delete/{id}', 'destroy')->name('user.delete');
        Route::post('/user/change_status/{id}', 'change_status')->name('change.status');
        Route::post('/user/resetpassword/{id}', 'reset_password')->name('reset.password');
    });

    Route::controller(BatchController::class)->group(function () {
        Route::get('/batch', 'index')->name('batch.index');
        Route::post('/batch/store', 'store')->name('batch.store');
        Route::put('/batch/update/{id}', 'update')->name('batch.update');
        Route::delete('/batch/delete/{id}', 'destroy')->name('batch.delete');
    });

    Route::controller(NilaiController::class)->group(function () {
        Route::get('/nilai', 'index')->name('nilai.index');
        Route::post('/nilai/store', 'store')->name('nilai.store');
        Route::put('/nilai/update/{id}', 'update')->name('nilai.update');
        Route::delete('/nilai/delete/{id}', 'destroy')->name('nilai.delete');
    });

    Route::controller(PertanyaanController::class)->group(function () {
        Route::get('/pertanyaan', 'index')->name('pertanyaan.index');
        Route::post('/pertanyaan/store', 'store')->name('pertanyaan.store');
        Route::put('/pertanyaan/update/{id}', 'update')->name('pertanyaan.update');
        Route::delete('/pertanyaan/delete/{id}', 'destroy')->name('pertanyaan.delete');
    });

    Route::controller(WeekController::class)->group(function () {
        Route::get('/week', 'index')->name('week.index');
        Route::post('/week/store', 'store')->name('week.store');
        Route::put('/week/update/{id}', 'update')->name('week.update');
        Route::delete('/week/delete/{id}', 'destroy')->name('week.delete');
    });

    Route::controller(KaderController::class)->group(function () {
        Route::get('/kader', 'index')->name('kader.index');
        Route::post('/kader/store', 'store')->name('kader.store');
        Route::put('/kader/update/{id}', 'update')->name('kader.update');
        Route::delete('/kader/delete/{id}', 'destroy')->name('kader.delete');
        Route::post('/kader/import', 'import')->name('kader.import');
        Route::get('/kader/export', 'export_kader')->name('kader.exportexcel');
    });

    Route::controller(JawabanController::class)->group(function () {
        Route::get('/feedbackadmin/index', 'feedbackadmin_index')->name('feedbackadmin.index');
        Route::post('/feedbackadmin/store', 'feedbackadmin_store')->name('feedbackadmin.store');
        Route::get('/feedback/{usertype}', 'index')->name('jawaban.index');
        Route::put('/feedback/update/{id}', 'update')->name('jawaban.update');
        Route::get('/feedback_user/{week}/{usertype}', 'feedback_user')->name('feedback.user');
        Route::post('/feedback/store', 'store')->name('jawaban.store');
        Route::get('/feedback/detail/{week}', 'detail')->name('jawaban.detail');
    });

    Route::post('api/fetch-users', [JawabanController::class, 'fetchUser'])->name('fetch.user');
    Route::post('api/fetch-weekfeedback', [JawabanController::class, 'fetchWeekFeedback'])->name('fetch.weekfeedback');

    Route::controller(SoalModulController::class)->group(function () {
        Route::get('/soal-modul', 'index')->name('soal-modul.index');
        Route::post('/soal-modul/store', 'store')->name('soal-modul.store');
        Route::put('/soal-modul/update/{id}', 'update')->name('soal-modul.update');
        Route::delete('/soal-modul/delete/{id}', 'destroy')->name('soal-modul.delete');
        Route::get('/soal-modul/template', 'downloadTemplate')->name('soal-modul.template');
        Route::post('/soal-modul/import', 'import')->name('soal-modul.import');
    });

    Route::controller(ModulController::class)->group(function () {
        Route::get('/modul', 'index')->name('modul.index');
        Route::get('/modul/assign', 'assignPage')->name('modul.assignPage');
        Route::get('/modul/assign/locked', 'getLockedModuls')->name('modul.locked');
        Route::post('/modul/assign/update', 'updateAssign')->name('modul.updateAssign');
        Route::post('/modul/store', 'store')->name('modul.store');
        Route::post('/modul/update/{id}', 'update')->name('modul.update');
        Route::delete('/modul/delete/{id}', 'destroy')->name('modul.destroy');
    });
    Route::post('/modul/assign', [ModulController::class, 'assign'])->name('modul.assign');

    Route::controller(DokumenController::class)->group(function () {
        Route::get('/dokumen', 'index')->name('dokumen.index');
        Route::post('/dokumen/store', 'store')->name('dokumen.store');
        Route::put('/dokumen/update/{id}', 'update')->name('dokumen.update');
        Route::delete('/dokumen/delete/{id}', 'destroy')->name('dokumen.destroy');
    });
});
