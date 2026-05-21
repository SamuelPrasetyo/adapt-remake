<?php

namespace App\Http\Controllers\Modul;

use App\Http\Controllers\Controller;
use App\Models\Modul;
use Inertia\Inertia;

class MentorModulController extends Controller
{
    public function index()
    {
        $moduls = Modul::orderBy('fase')->orderBy('kode_modul')->get();
        return Inertia::render('MentorModul/Index', ['moduls' => $moduls]);
    }
}
