<?php

use App\Http\Controllers\Master\Mentor\KaderPerMentorController;
use App\Http\Controllers\Master\Mentor\MentorController;
use App\Http\Controllers\Modul\MentorModulController;
use Illuminate\Support\Facades\Route;

// Master Mentor & Assign Kader — hanya Admin MAI (021)
Route::middleware(['can:isAdmin021'])->group(function () {
    // All Mentor — monitoring progress semua Mentor (read-only)
    Route::get('/all-mentor', [MentorModulController::class, 'allMentor'])->name('mentor.all');

    // CRUD Mentor master
    Route::controller(MentorController::class)->group(function () {
        Route::get('/mentor', 'index')->name('mentor.index');
        Route::post('/mentor/store', 'store')->name('mentor.store');
        Route::put('/mentor/update/{id}', 'update')->name('mentor.update');
        Route::delete('/mentor/delete/{id}', 'destroy')->name('mentor.delete');
    });

    // Assign Kader ke Mentor
    Route::post('/mentor/assign-kader', [KaderPerMentorController::class, 'assignKader'])->name('mentor.assignKader');
});
