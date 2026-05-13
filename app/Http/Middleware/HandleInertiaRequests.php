<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'inertia';

    /**
     * Determine the current asset version.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    public function version(Request $request)
    {
        return parent::version($request);
    }

    /**
     * Define props that are shared by default.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function share(Request $request)
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'   => $request->user()->id,
                    'nik'  => $request->user()->nik,
                    'name' => $request->user()->name,
                    'type' => $request->user()->type,
                ] : null,
            ],
            'flash' => [
                'success' => function () use ($request) {
                    $msg = $request->session()->get('success');
                    if (!$msg) {
                        $alert = $request->session()->get('alert');
                        if (is_array($alert) && strtolower($alert['type'] ?? '') === 'success') {
                            $msg = $alert['message'] ?? $alert['text'] ?? $alert['title'] ?? null;
                        }
                    }
                    return $msg;
                },
                'error' => function () use ($request) {
                    $msg = $request->session()->get('error') ?? $request->session()->get('errors');
                    if (!$msg) {
                        $alert = $request->session()->get('alert');
                        if (is_array($alert) && in_array(strtolower($alert['type'] ?? ''), ['error', 'warning'])) {
                            $msg = $alert['message'] ?? $alert['text'] ?? $alert['title'] ?? null;
                        }
                    }
                    return $msg;
                },
            ],
        ]);
    }
}
