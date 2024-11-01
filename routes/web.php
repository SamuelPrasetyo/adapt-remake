<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartemenController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\LoginController;
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
