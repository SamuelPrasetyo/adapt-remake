<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                    'id'           => $request->user()->id,
                    'nik'          => $request->user()->nik,
                    'name'         => $request->user()->name,
                    'type'         => $request->user()->type,
                    'company_code' => $request->user()->company_code,
                ] : null,
            ],
            'inbox' => function () use ($request) {
                $user = $request->user();
                if (!$user) return ['items' => [], 'total' => 0, 'is_admin' => false, 'pending_count' => 0];

                // Admin MAI: hitung pending approval saja, tanpa detail item
                if ($user->type === 'Admin' && $user->company_code === '021') {
                    $pendingOjt = DB::table('penilaian_ojt')
                        ->where('approval_status', 'pending')
                        ->whereNotNull('final_score')
                        ->count();
                    $pendingPa = DB::table('dokumen')
                        ->where('jenis', 'POST_ACTIVITY')
                        ->where('status', 'pending')
                        ->count();
                    $pendingIdp = DB::table('dokumen')
                        ->where('jenis', 'FORM_IDP')
                        ->where('status', 'pending')
                        ->count();
                    $total = $pendingOjt + $pendingPa + $pendingIdp;
                    return [
                        'items'         => [],
                        'total'         => $total,
                        'is_admin'      => true,
                        'pending_count' => $total,
                        'pending_ojt'   => $pendingOjt,
                        'pending_pa'    => $pendingPa,
                        'pending_idp'   => $pendingIdp,
                    ];
                }

                $ojtItems = collect();
                $paItems  = collect();

                if ($user->type === 'Kader') {
                    // Kader: hanya notif Post Activity (bukan OJT)
                    $paRaw = DB::table('dokumen')
                        ->where('kader_id', $user->id)
                        ->where('jenis', 'POST_ACTIVITY')
                        ->whereIn('status', ['approved', 'rejected'])
                        ->orderBy('created_at', 'desc')
                        ->get(['id', 'nama_file', 'status', 'rejection_reason', 'modul_id', 'created_at']);
                    $modulIds   = $paRaw->pluck('modul_id')->unique()->filter()->values()->all();
                    $modulNames = $modulIds ? DB::table('modul')->whereIn('id', $modulIds)->pluck('nama_modul', 'id') : collect();
                    $paItems = $paRaw->map(fn($r) => [
                        'type'             => 'pa',
                        'fmc_number'       => null,
                        'approval_status'  => $r->status,
                        'rejection_reason' => $r->rejection_reason,
                        'final_score'      => null,
                        'updated_at'       => $r->created_at,
                        'kader_nama'       => null,
                        'modul_nama'       => $modulNames[$r->modul_id] ?? null,
                        'nama_file'        => $r->nama_file,
                    ]);

                    // Kader: notif File IDP (approved/rejected)
                    $idpRaw = DB::table('dokumen')
                        ->where('kader_id', $user->id)
                        ->where('jenis', 'FORM_IDP')
                        ->whereIn('status', ['approved', 'rejected'])
                        ->orderBy('created_at', 'desc')
                        ->get(['id', 'nama_file', 'status', 'rejection_reason', 'created_at']);
                    $idpItems = $idpRaw->map(fn($r) => [
                        'type'             => 'idp',
                        'fmc_number'       => null,
                        'approval_status'  => $r->status,
                        'rejection_reason' => $r->rejection_reason,
                        'final_score'      => null,
                        'updated_at'       => $r->created_at,
                        'kader_nama'       => null,
                        'modul_nama'       => null,
                        'nama_file'        => $r->nama_file,
                    ]);
                    $paItems = $paItems->merge($idpItems);

                } elseif ($user->type === 'Mentor') {
                    // Mentor: OJT yang di-input + Post Activity yang di-upload
                    $ojtRaw = DB::table('penilaian_ojt')
                        ->where('created_by', $user->id)
                        ->whereIn('approval_status', ['approved', 'rejected'])
                        ->orderBy('updated_at', 'desc')
                        ->get(['kader_id', 'fmc_number', 'approval_status', 'rejection_reason', 'final_score', 'updated_at']);
                    $kaderIds   = $ojtRaw->pluck('kader_id')->unique()->filter()->values()->all();
                    $kaderNames = $kaderIds ? DB::table('kader')->whereIn('id', $kaderIds)->pluck('nama', 'id') : collect();
                    $ojtItems = $ojtRaw->map(fn($r) => [
                        'type'             => 'ojt',
                        'fmc_number'       => $r->fmc_number,
                        'approval_status'  => $r->approval_status,
                        'rejection_reason' => $r->rejection_reason,
                        'final_score'      => $r->final_score,
                        'updated_at'       => $r->updated_at,
                        'kader_nama'       => $kaderNames[$r->kader_id] ?? null,
                        'modul_nama'       => null,
                        'nama_file'        => null,
                    ]);
                    $paRaw = DB::table('dokumen')
                        ->where('mentor_id', $user->id)
                        ->where('jenis', 'POST_ACTIVITY')
                        ->whereIn('status', ['approved', 'rejected'])
                        ->orderBy('created_at', 'desc')
                        ->get(['id', 'nama_file', 'status', 'rejection_reason', 'modul_id', 'created_at']);
                    $modulIds   = $paRaw->pluck('modul_id')->unique()->filter()->values()->all();
                    $modulNames = $modulIds ? DB::table('modul')->whereIn('id', $modulIds)->pluck('nama_modul', 'id') : collect();
                    $paItems = $paRaw->map(fn($r) => [
                        'type'             => 'pa',
                        'fmc_number'       => null,
                        'approval_status'  => $r->status,
                        'rejection_reason' => $r->rejection_reason,
                        'final_score'      => null,
                        'updated_at'       => $r->created_at,
                        'kader_nama'       => null,
                        'modul_nama'       => $modulNames[$r->modul_id] ?? null,
                        'nama_file'        => $r->nama_file,
                    ]);
                }

                $all = $ojtItems->merge($paItems)->sortByDesc('updated_at')->values()->all();
                return [
                    'items'         => $all,
                    'total'         => count($all),
                    'is_admin'      => false,
                    'pending_count' => 0,
                ];
            },
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
                    $msg = $request->session()->get('error');
                    if (!$msg) {
                        $alert = $request->session()->get('alert');
                        if (is_array($alert) && in_array(strtolower($alert['type'] ?? ''), ['error', 'warning'])) {
                            $msg = $alert['message'] ?? $alert['text'] ?? $alert['title'] ?? null;
                        }
                    }
                    return $msg;
                },
                'import_success' => fn () => $request->session()->get('import_success'),
                'import_errors'  => fn () => $request->session()->get('import_errors', []),
            ],
        ]);
    }
}
