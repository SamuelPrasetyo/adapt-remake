<?php

namespace App\Http\Controllers\KaderSaya;

use App\Http\Controllers\Controller;
use App\Models\Dokumen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Dokumen pendukung Weekly Feedback mentor (dokumen.jenis = 'FEEDBACK_MENTOR'), diupload
 * bersamaan dengan feedback di KaderSayaController::storeFeedback. Dibuka lewat route ini
 * (dicek role), bukan link langsung ke folder public.
 */
class FeedbackMentorDokumenController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * ?inline=1 menampilkan PDF di viewer browser (preview); tanpa itu mengunduh.
     */
    public function show(Request $request, $id)
    {
        $user = Auth::user();

        $isAdmin021 = $user->type === 'Admin' && $user->company_code === '021';
        $isMentor   = $user->type === 'Mentor';

        if (!$isAdmin021 && !$isMentor) {
            abort(403);
        }

        $doc  = Dokumen::where('id', $id)->where('jenis', 'FEEDBACK_MENTOR')->firstOrFail();
        $path = public_path($doc->path_file);

        if (!is_file($path)) {
            abort(404, 'File tidak ditemukan.');
        }

        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return response()->download($path, $doc->nama_file, [], $disposition);
    }
}
