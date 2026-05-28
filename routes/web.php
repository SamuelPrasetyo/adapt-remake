<?php

use App\Http\Controllers\Approval\ApprovalController;
use App\Http\Controllers\Master\BatchController;
use App\Http\Controllers\Controller;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Master\DepartemenController;
use App\Http\Controllers\Master\DivisiController;
use App\Http\Controllers\Modul\DokumenController;
use App\Http\Controllers\Report\FeedbackMaiController;
use App\Http\Controllers\Modul\JawabanController;
use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Http\Controllers\KaderSaya\PerjanjianKerjaController;
use App\Http\Controllers\KaderSaya\KaderSayaController;
use App\Http\Controllers\KaderSaya\PenilaianOjtController;
use App\Http\Controllers\Master\KaderController;
use App\Http\Controllers\Modul\LearningController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\Master\Mentor\MentorController;
use App\Http\Controllers\Modul\MentorModulController;
use App\Http\Controllers\Modul\ModulController;
use App\Http\Controllers\Master\NilaiController;
use App\Http\Controllers\Master\PertanyaanController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Modul\SoalModulController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\WeekController;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
        Route::post('/user/change_password/{id}', [UserController::class, 'change_password'])->name('user.change_password');
    });
});

Route::middleware(['can:isKader'])->group(function () {
    Route::controller(DashboardController::class)->group(function () {
        Route::get('/dashboard-kader', 'dashboard_kader')->name('dashboard.kader');
    });

    Route::get('/my-learning', [LearningController::class, 'index'])->name('my.learning');

    Route::get('/feedback_mai-mentor', [FeedbackMaiController::class, 'fm_mentor_index'])->name('fm.mentor.index');
    Route::get('/feedback_mai-mentor/export/{id_week}/{nik_kader}', [FeedbackMaiController::class, 'fm_mentor_export'])->name('fm.mentor.export');
});
Route::middleware(['can:isMentor'])->group(function () {
    Route::get('/feedback_mai-kader', [FeedbackMaiController::class, 'fm_kader_index'])->name('fm.kader.index');
    Route::get('/feedback_mai-kader/export/{id_week}/{nik_kader}', [FeedbackMaiController::class, 'fm_kader_export'])->name('fm.kader.export');
});

// Program Saya & Modul — khusus user Mentor (learning miliknya sendiri)
Route::middleware(['can:isMentor'])->group(function () {
    Route::get('/mentor-modul', [MentorModulController::class, 'index'])->name('mentor.modul');
    Route::get('/program-saya', [MentorModulController::class, 'programSaya'])->name('mentor.programSaya');
});

// All Mentor — Admin021 monitoring progress semua mentor (read-only list)
Route::middleware(['can:isAdmin021'])->group(function () {
    Route::get('/all-mentor', [MentorModulController::class, 'allMentor'])->name('mentor.all');
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

// Master Mentor + Assign Kader — Admin company_code 021 only
Route::middleware(['can:isAdmin021'])->group(function () {
    Route::controller(MentorController::class)->group(function () {
        Route::get('/mentor', 'index')->name('mentor.index');
        Route::post('/mentor/store', 'store')->name('mentor.store');
        Route::put('/mentor/update/{id}', 'update')->name('mentor.update');
        Route::delete('/mentor/delete/{id}', 'destroy')->name('mentor.delete');
    });
    Route::post('/mentor/assign-kader', [KaderPerMentorController::class, 'assignKader'])
        ->name('mentor.assignKader');
});

// List kader by mentor — Admin 021 + Mentor (BU filtering di controller)
Route::middleware(['can:canMentorDashboard'])->group(function () {
    Route::get('/mentor/{mentor_id}/kaders', [KaderPerMentorController::class, 'listByMentor'])
        ->name('mentor.listKaders');
    Route::get('/kader-saya', [KaderSayaController::class, 'index'])->name('kader.saya.index');
    Route::get('/kader-saya/{kader_id}', [KaderSayaController::class, 'show'])->name('kader.saya.show');
    Route::post('/kader-saya/{kader_id}/feedback', [KaderSayaController::class, 'storeFeedback'])->name('kader.saya.storeFeedback');
    Route::post('/kader-saya/{kader_id}/perjanjian-kerja', [PerjanjianKerjaController::class, 'store'])->name('perjanjian.store');
    Route::delete('/perjanjian-kerja/{id}', [PerjanjianKerjaController::class, 'destroy'])->name('perjanjian.destroy');
    Route::get('/perjanjian-kerja/{id}/download', [PerjanjianKerjaController::class, 'download'])->name('perjanjian.download');

    // Penilaian OJT — write hanya Mentor, read Admin021 + Mentor (cek di controller)
    Route::post('/kader-saya/{kader_id}/penilaian/{fmc}', [PenilaianOjtController::class, 'store'])->name('penilaian.store');
});

// Approval Admin MAI (Admin021) — approve/tolak Nilai OJT & Post Activity
Route::middleware(['can:isAdmin021'])->group(function () {
    Route::get('/approval', [ApprovalController::class, 'index'])->name('approval.index');
    Route::post('/approval/ojt/{kader_id}/{fmc}/approve', [ApprovalController::class, 'approveOjt'])->name('approval.ojt.approve');
    Route::post('/approval/ojt/{kader_id}/{fmc}/reject', [ApprovalController::class, 'rejectOjt'])->name('approval.ojt.reject');
    Route::post('/approval/post-activity/{dokumen}/approve', [ApprovalController::class, 'approvePostActivity'])->name('approval.pa.approve');
    Route::post('/approval/post-activity/{dokumen}/reject', [ApprovalController::class, 'rejectPostActivity'])->name('approval.pa.reject');
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

        Route::match(['get', 'post'], '/reportfeedback', 'report_feedback')->name('report.feedback');
        Route::match(['get', 'post'], '/reportfeedback-back/{ojt}', 'report_feedback_back')->name('report.feedback.back');
        Route::get('/reportfeedback/export/{ojt}', 'export_reportfeedback')->name('reportfeedback.exportexcel');
        Route::get('/reportfeedback-kader/export/{ojt}', 'export_reportfeedback_kader')->name('reportfeedbackkader.exportexcel');

        Route::post('/performsum', 'perform_sum_add')->name('performsum.add');
        Route::put('/performsum-edit/{id}', 'perform_sum_edit')->name('performsum.edit');
    });
    Route::post('/assessment/upload/{id}', [ReportController::class, 'upload'])
        ->name('assessment.upload');
    // FEEDBACK MAI ADMIN
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



Route::middleware(['can:isAll'])->group(function () {
    Route::controller(JawabanController::class)->group(function () {
        Route::get('/feedback-survey', 'feedback')->name('feedback.index');
        Route::post('/feedback-survey/store', 'feedback_store')->name('feedback.store');
        Route::post('/feedback-survey-kader/store', 'feedback_kader_store')->name('feedback_kader.store');
        Route::post('api/fetch-weeks', 'fetchWeek')->name('fetch.week');
    });

    // /my-learning dipindah ke grup isKader di bawah
    Route::get('/learning/{id}', [LearningController::class, 'detail'])
        ->name('learning.detail');

    Route::get('/modul/{id}/test/{type}', [LearningController::class, 'test'])
        ->name('learning.test');

    Route::post('/learning/test/submit', [LearningController::class, 'submitTest'])
        ->name('learning.submitTest');

    Route::get('/learning/{id}/answers/{type}', [LearningController::class, 'myAnswers'])
        ->name('learning.myAnswers');

    Route::post('/learning/materi/progress', [LearningController::class, 'saveReadingProgress'])
        ->name('learning.saveReadingProgress');

    Route::post('/learning/post-activity/upload', [LearningController::class, 'uploadPostActivity'])
        ->name('learning.uploadPostActivity');

    Route::get('/ajax/test/{id}/{type}', [LearningController::class, 'ajax_test']);
});

Route::get('/get-fmdetail/{id}', function ($id) {
    return \App\Models\FmDetail::where('id_feedbackmai', $id)->count();
});
