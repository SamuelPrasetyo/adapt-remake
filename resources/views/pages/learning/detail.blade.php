@extends('app')

@section('content')

<style>
    .learning-card {
        border-radius: 14px;
        border: none;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    }

    .learning-card .card-body {
        padding: 20px;
    }

    .check-item {
        position: relative;
        padding-left: 58px;
        padding-bottom: 28px;
    }

    .check-item:last-child {
        padding-bottom: 0;
    }

    .check-item::before {
        content: "";
        position: absolute;
        left: 19px;
        top: 42px;
        width: 2px;
        height: 100%;
        background: #e5e7eb;
    }

    .check-item:last-child::before {
        display: none;
    }

    .check-icon {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #10b981;
        color: white;
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 600;
    }

    .check-item h4 {
        font-size: 18px;
        margin-bottom: 6px;
        font-weight: 600;
    }

    .check-item p {
        font-size: 14px;
        margin-bottom: 10px;
        color: #6b7280;
    }

    .score-text {
        color: #10b981;
        font-weight: 700;
    }

    .side-btn {
        width: 100%;
        border-radius: 12px;
        padding: 12px;
        font-weight: 600;
        margin-bottom: 12px;
        border: none;
        font-size: 14px;
    }

    .btn-pre {
        background: #3157ff;
        color: white;
    }

    .btn-post {
        background: #10b981;
        color: white;
    }

    .btn-materi {
        background: #f3f4f6;
        color: #374151;
    }

    .header-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
    }

    .header-desc {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 0;
    }

    .score-box h2 {
        font-size: 34px;
        margin-bottom: 0;
    }

    .score-box small {
        font-size: 13px;
        color: #6b7280;
    }

    .btn-light {
        border: 1px solid #e5e7eb;
        font-size: 13px;
        padding: 8px 14px;
        border-radius: 10px;
    }

    .btn-success {
        font-size: 13px;
        border-radius: 10px;
        padding: 8px 14px;
    }

    .card-header h5 {
        font-size: 18px;
        font-weight: 600;
    }

    @media(max-width:768px) {
        .header-title {
            font-size: 22px;
        }

        .score-box h2 {
            font-size: 28px;
        }

        .check-item {
            padding-left: 52px;
        }
    }

    .answer-card {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        border: 1px solid #e5e7eb;
        border-radius: 14px;

        padding: 14px 16px;
        margin-bottom: 12px;

        cursor: pointer;
        transition: all 0.2s ease;
    }

    .answer-card:hover {
        background: #f8f9ff;
        border-color: #3157ff;
    }

    .answer-card input[type="radio"] {
        transform: scale(1.15);
        margin-top: 3px;
    }
</style>

<div class="container-xxl flex-grow-1 container-p-y container-p-x">

    {{-- HEADER --}}
    <div class="card learning-card mb-4">
        <div class="card-body">

            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">

                <div>
                    <small class="text-muted">
                        {{ $modul->kode_modul }}
                    </small>

                    <div class="header-title">
                        {{ $modul->nama_modul }}
                    </div>

                    <p class="header-desc">
                        {{ $modul->tag_kompetensi }}
                    </p>
                </div>

                <div class="text-end score-box">
                    <h2 class="score-text">
                        {{ $progress['final_score'] }}
                    </h2>

                    <small>Skor Akhir</small>
                </div>

            </div>

        </div>
    </div>

    <div class="row">

        {{-- LEFT --}}
        <div class="col-md-8">

            <div class="card learning-card">
                <div class="card-header bg-white border-0 pt-4 pb-0">
                    <h5>Checklist Pembelajaran</h5>
                </div>

                <div class="card-body pt-4">

                    {{-- PRETEST --}}
                    @if($modul->fase != 3)

                    <div class="check-item">
                        <div class="check-icon">✓</div>

                        <h4>Pre-Test</h4>

                        <p>
                            Sudah dikerjakan ·
                            <span class="score-text">
                                Skor: {{ $progress['pretest_score'] }}
                            </span>
                        </p>

                        <button class="btn btn-light">
                            Lihat Jawaban
                        </button>
                    </div>

                    @endif

                    {{-- MATERI --}}
                    <div class="check-item">
                        <div class="check-icon">✓</div>

                        <h4>Materi Pembelajaran</h4>

                        <p>
                            Progress membaca:
                            <span class="score-text">
                                {{ $progress['materi_progress'] }}%
                            </span>
                        </p>

                        <button class="btn btn-light"
                            data-bs-toggle="modal"
                            data-bs-target="#materiModal">

                            Buka Materi
                        </button>
                    </div>

                    {{-- POSTTEST --}}
                    <div class="check-item">
                        <div class="check-icon">✓</div>

                        <h4>Post-Test</h4>

                        <p>
                            Skor:
                            <span class="score-text">
                                {{ $progress['posttest_score'] }}
                            </span>
                        </p>

                        <button class="btn btn-light">
                            Lihat Jawaban
                        </button>
                    </div>

                    {{-- POST ACTIVITY --}}
                    <div class="check-item">
                        <div class="check-icon">✓</div>

                        <h4>Post Activity</h4>

                        <p class="text-success">
                            Tugas berhasil diupload
                        </p>

                        <button class="btn btn-success">
                            ✓ Uploaded
                        </button>
                    </div>

                    {{-- EVALUASI MENTOR --}}
                    @if($modul->fase == 3)

                    <div class="check-item">
                        <div class="check-icon">✓</div>

                        <h4>Evaluasi Mentor</h4>

                        <p>
                            Mentor memberikan evaluasi terhadap performa OJT.
                        </p>
                    </div>

                    @endif

                </div>
            </div>

        </div>

        {{-- RIGHT --}}
        <div class="col-md-4">

            {{-- ACTION --}}
            <div class="card learning-card mb-4">
                <div class="card-body">

                    @if($modul->fase != 3)
                    <button class="side-btn btn-pre"
                        data-bs-toggle="modal"
                        data-bs-target="#preTestModal">

                        Pre-Test
                    </button>

                    <button class="side-btn btn-post"
                        data-bs-toggle="modal"
                        data-bs-target="#postTestModal">

                        Post-Test
                    </button>


                    @endif

                    <button class="side-btn btn-materi" data-bs-toggle="modal"
                        data-bs-target="#materiModal">
                        Baca Materi
                    </button>

                </div>
            </div>

        </div>

    </div>

</div>
{{-- ================= PRE TEST MODAL ================= --}}
<div class="modal fade" id="preTestModal">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">

            <form action="{{ route('learning.submitTest') }}" method="POST">
                @csrf

                <input type="hidden" name="modul_id" value="{{ $modul->id }}">
                <input type="hidden" name="tipe" value="pre">

                <div class="modal-header">
                    <h5 class="mb-0">Pre Test</h5>
                </div>

                <div class="modal-body">

                    @foreach($pretest as $i => $soal)

                    <div class="question-page pre-question"
                        style="{{ $i != 0 ? 'display:none' : '' }}">

                        {{-- HEADER --}}
                        <div class="mb-4">

                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="text-muted">
                                    Soal {{ $i+1 }} dari {{ count($pretest) }}
                                </small>

                                <small class="text-primary">
                                    {{ round((($i+1)/count($pretest))*100) }}%
                                </small>
                            </div>

                            <div class="progress mb-3" style="height:6px;">
                                <div class="progress-bar"
                                    style="width: {{ (($i+1)/count($pretest))*100 }}%">
                                </div>
                            </div>

                            <h5 class="fw-semibold">
                                {{ $soal->soal }}
                            </h5>

                        </div>

                        {{-- JAWABAN --}}
                        @foreach($soal->jawabans as $jawaban)

                        <label class="answer-card">

                            <input type="radio"
                                name="answers[{{ $soal->id }}]"
                                value="{{ $jawaban->id }}"
                                class="form-check-input mt-1"
                                required>

                            <div>
                                {{ $jawaban->jawaban }}
                            </div>

                        </label>

                        @endforeach

                        {{-- FOOTER --}}
                        <div class="d-flex justify-content-between mt-4">

                            @if($i == 0)

                            <button type="button"
                                class="btn btn-light"
                                disabled>

                                Previous
                            </button>

                            @else

                            <button type="button"
                                class="btn btn-light prev-btn">

                                Previous
                            </button>

                            @endif


                            @if($i == count($pretest)-1)

                            <button type="submit"
                                class="btn btn-success">

                                Submit Test
                            </button>

                            @else

                            <button type="button"
                                class="btn btn-primary next-btn">

                                Next
                            </button>

                            @endif

                        </div>

                    </div>

                    @endforeach

                </div>

            </form>

        </div>
    </div>
</div>


{{-- ================= POST TEST MODAL ================= --}}
<div class="modal fade" id="postTestModal">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">

            <form action="{{ route('learning.submitTest') }}" method="POST">
                @csrf

                <input type="hidden" name="modul_id" value="{{ $modul->id }}">
                <input type="hidden" name="tipe" value="post">

                <div class="modal-header">
                    <h5 class="mb-0">Post Test</h5>
                </div>

                <div class="modal-body">

                    @foreach($posttest as $i => $soal)

                    <div class="question-page post-question"
                        style="{{ $i != 0 ? 'display:none' : '' }}">

                        {{-- HEADER --}}
                        <div class="mb-4">

                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="text-muted">
                                    Soal {{ $i+1 }} dari {{ count($posttest) }}
                                </small>

                                <small class="text-success">
                                    {{ round((($i+1)/count($posttest))*100) }}%
                                </small>
                            </div>

                            <div class="progress mb-3" style="height:6px;">
                                <div class="progress-bar bg-success"
                                    style="width: {{ (($i+1)/count($posttest))*100 }}%">
                                </div>
                            </div>

                            <h5 class="fw-semibold">
                                {{ $soal->soal }}
                            </h5>

                        </div>

                        {{-- JAWABAN --}}
                        @foreach($soal->jawabans as $jawaban)

                        <label class="answer-card">

                            <input type="radio"
                                name="answers[{{ $soal->id }}]"
                                value="{{ $jawaban->id }}"
                                class="form-check-input mt-1"
                                required>

                            <div>
                                {{ $jawaban->jawaban }}
                            </div>

                        </label>

                        @endforeach

                        {{-- FOOTER --}}
                        <div class="d-flex justify-content-between mt-4">

                            @if($i == 0)

                            <button type="button"
                                class="btn btn-light"
                                disabled>

                                Previous
                            </button>

                            @else

                            <button type="button"
                                class="btn btn-light prev-btn">

                                Previous
                            </button>

                            @endif


                            @if($i == count($posttest)-1)

                            <button type="submit"
                                class="btn btn-success">

                                Submit Test
                            </button>

                            @else

                            <button type="button"
                                class="btn btn-primary next-btn">

                                Next
                            </button>

                            @endif

                        </div>

                    </div>

                    @endforeach

                </div>

            </form>

        </div>
    </div>
</div>

<!-- Materi -->
<div class="modal fade" id="materiModal">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">

            <div class="modal-header">
                <div class="w-100">

                    <div class="d-flex justify-content-between mb-2">
                        <h5 class="mb-0">
                            {{ $modul->nama_modul }}
                        </h5>

                        <span id="progressText">
                            0%
                        </span>
                    </div>

                    <!-- PROGRESS -->
                    <div class="progress" style="height:10px;">
                        <div class="progress-bar"
                            id="readingProgress"
                            style="width:0%">
                        </div>
                    </div>

                </div>
            </div>

            <div class="modal-body p-0">

                <!-- PDF VIEWER -->
                <div id="pdfContainer"
                    style="height:75vh; overflow-y:auto;">

                    <iframe
                        src="{{ asset($modul->file_materi) }}"
                        width="100%"
                        height="1000px"
                        style="border:none;">
                    </iframe>

                </div>

            </div>

            <div class="modal-footer">

                <button class="btn btn-light"
                    data-bs-dismiss="modal">

                    Tutup
                </button>

                <a href="{{ asset($modul->file_materi) }}"
                    id="downloadBtn"
                    class="btn btn-success disabled"
                    download>

                    Download Materi
                </a>

            </div>

        </div>
    </div>
</div>

@endsection
@section('addon-script')
<script>
    const pdfContainer = document.getElementById('pdfContainer');
    const progressBar = document.getElementById('readingProgress');
    const progressText = document.getElementById('progressText');
    const downloadBtn = document.getElementById('downloadBtn');

    pdfContainer.addEventListener('scroll', function() {

        const scrollTop = pdfContainer.scrollTop;

        const scrollHeight =
            pdfContainer.scrollHeight - pdfContainer.clientHeight;

        const percent =
            Math.min((scrollTop / scrollHeight) * 100, 100);

        progressBar.style.width = percent + '%';

        progressText.innerHTML =
            Math.round(percent) + '%';

        // unlock download
        if (percent >= 100) {

            downloadBtn.classList.remove('disabled');

            progressBar.classList.add('bg-success');
        }
    });

    $('.next-btn').click(function() {

        let current = $(this).closest('.question-page');

        current.hide();

        current.next('.question-page').show();
    });

    $('.prev-btn').click(function() {

        let current = $(this).closest('.question-page');

        current.hide();

        current.prev('.question-page').show();
    });
</script>
@endsection