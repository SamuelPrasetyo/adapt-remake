<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Route dibagi ke dalam file-file terpisah di folder routes/web/
| berdasarkan domain/fitur untuk memudahkan pemeliharaan.
|
| routes/web/auth.php          — Login, logout
| routes/web/dashboard.php     — Dashboard semua role
| routes/web/kader.php         — Fitur khusus Kader (IDP, my-learning, feedback)
| routes/web/mentor.php        — Fitur khusus Mentor (approval IDP, program saya)
| routes/web/master.php        — Master data Admin (divisi, user, batch, modul, dll)
| routes/web/master-mentor.php — Master Mentor & assign Kader (Admin MAI)
| routes/web/kader-saya.php    — Kader Saya, perjanjian kerja & penilaian OJT
| routes/web/approval.php      — Approval OJT, Post Activity & Form IDP (Admin MAI)
| routes/web/learning.php      — Modul pembelajaran, test & post-activity
| routes/web/report.php        — Report & Feedback MAI (Admin + Mentor)
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return view('app');
});

require __DIR__ . '/web/auth.php';
require __DIR__ . '/web/dashboard.php';
require __DIR__ . '/web/kader.php';
require __DIR__ . '/web/mentor.php';
require __DIR__ . '/web/master.php';
require __DIR__ . '/web/master-mentor.php';
require __DIR__ . '/web/kader-saya.php';
require __DIR__ . '/web/approval.php';
require __DIR__ . '/web/learning.php';
require __DIR__ . '/web/report.php';
