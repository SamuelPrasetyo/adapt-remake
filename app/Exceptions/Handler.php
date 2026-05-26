<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\PostTooLargeException;

class Handler extends ExceptionHandler
{
    protected $dontReport = [];

    protected $dontFlash = [
        'password',
        'password_confirmation',
    ];

    public function register()
    {
        $this->renderable(function (PostTooLargeException $e, $request) {
            $message = 'Ukuran file terlalu besar. Maksimal ukuran yang diizinkan adalah 8 MB.';

            if ($request->header('X-Inertia')) {
                return back()->withErrors(['file_materi' => $message]);
            }

            return back()->withErrors(['file_materi' => $message])->withInput();
        });
    }
}
