<?php

use App\Http\Controllers\BatchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\JawabanController;
use App\Http\Controllers\KaderController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\NilaiController;
use App\Http\Controllers\PertanyaanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WeekController;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('app');
});

Route::middleware(['can:isAll'])->group(function () {
    Route::controller(LoginController::class)->group(function () {
        Route::post('/logout', 'logout')->name('logout');
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
    });
});

Route::controller(LoginController::class)->group(function () {
    Route::get('/login', 'index')->name('login.index');
    Route::post('/login/store', 'store')->name('login.store');
    Route::post('/logout', 'logout')->name('logout');
});
Route::middleware(['can:isAdmin'])->group(function () {
    Route::get('/activity-log', function () {
        $activities_log = ActivityLog::select('activity_log.*', 'users.name as nama')
            ->join('users', 'activity_log.created_by', 'users.id')
            ->orderBy('created_at', 'desc')
            ->get();
        return view('pages.activity_log.index', compact('activities_log'));
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
        Route::post('/user/change_password/{id}', 'change_password')->name('user.change_password');
        Route::put('/user/update/{id}', 'update')->name('user.update');
        Route::delete('/user/delete/{id}', 'destroy')->name('user.delete');
        Route::post('/user/change_status/{id}', 'change_status')->name('change.status');
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
        Route::get('/kader/export', 'export_kader')->name('kader.exportpdf');
    });

    Route::controller(JawabanController::class)->group(function () {
        Route::get('/feedback', 'index')->name('jawaban.index');
        Route::put('/feedback/update/{id}', 'update')->name('jawaban.update');
        Route::get('/feedback_user/{week}', 'feedback_user')->name('feedback.user');
        Route::post('/feedback/store', 'store')->name('jawaban.store');
        Route::put('/feedback/update/{id}', 'update')->name('jawaban.update');
        Route::get('/feedback/detail/{week}', 'detail')->name('jawaban.detail');
    });
});
Route::middleware(['can:isAdmin&Mentor'])->group(function () {
    Route::controller(ReportController::class)->group(function () {
        Route::get('/learning-index', 'learning_index')->name('learning.index');
        Route::post('/learning-growth', 'learning_growth')->name('learning.growth');
        Route::get('/ojt-index', 'weekly_index')->name('weekly.index');
        Route::post('/ojt-monitoring', 'weekly_monitoring')->name('weekly.monitoring');

        Route::get('/learning-growth/export-pdf/{nik}', 'exportLearningGrowthPdf')->name('learning.export_pdf');
        Route::post('/export-pdf', 'exportPdf')->name('exportPdf');
        
        Route::get('/reportfeedback-index', 'feedback_index')->name('reportfeedback.index');
        Route::match(['get', 'post'],'/reportfeedback', 'report_feedback')->name('report.feedback');
        Route::match(['get', 'post'],'/reportfeedback-back/{ojt}', 'report_feedback_back')->name('report.feedback.back');

        Route::post('/performsum', 'perform_sum_add')->name('performsum.add');
        Route::put('/performsum-edit/{id}', 'perform_sum_edit')->name('performsum.edit');
    });
});

Route::middleware(['can:isUser'])->group(function () {
    Route::controller(JawabanController::class)->group(function () {
        Route::get('/feedback-survey', 'feedback')->name('feedback.index');
        Route::post('/feedback-survey/store', 'feedback_store')->name('feedback.store');
        Route::post('/feedback-survey-kader/store', 'feedback_kader_store')->name('feedback_kader.store');
        Route::post('api/fetch-weeks', 'fetchWeek')->name('fetch.week');
    });
});
