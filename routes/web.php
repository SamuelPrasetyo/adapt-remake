<?php

use App\Http\Controllers\BatchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\NilaiController;
use App\Http\Controllers\PertanyaanController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WeekController;
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
Route::middleware(['can:isAdmin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class,'index'])->name('dashboard.index');
});

Route::controller(LoginController::class)->group(function () {
    Route::get('/login', 'index')->name('login.index');
    Route::post('/login/store', 'store')->name('login.store');
    Route::post('/logout', 'logout')->name('logout');
});

Route::controller(DivisiController::class)->group(function () {
    Route::get('/divisi', 'index')->name('divisi.index');
    Route::post('/divisi/store', 'store')->name('divisi.store');
    Route::post('/divisi/upload', 'upload')->name('divisi.upload');
    Route::put('/divisi/update/{id}', 'update')->name('divisi.update');
    Route::delete('/divisi/delete/{id}', 'destroy')->name('divisi.delete');
});
Route::controller(DepartemenController::class)->group(function () {
    Route::get('/departemen', 'index')->name('departemen.index');
    Route::post('/departemen/store', 'store')->name('departemen.store');
    Route::post('/departemen/upload', 'upload')->name('departemen.upload');
    Route::put('/departemen/update/{id}', 'update')->name('departemen.update');
    Route::delete('/departemen/delete/{id}', 'destroy')->name('departemen.delete');
});
Route::controller(UserController::class)->group(function () {
    Route::get('/user', 'index')->name('user.index');
    Route::post('/user/store', 'store')->name('user.store');
    Route::put('/user/update/{id}', 'update')->name('user.update');
    Route::delete('/user/delete/{id}', 'destroy')->name('user.delete');
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
