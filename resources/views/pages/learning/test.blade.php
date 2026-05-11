@extends('app')

@section('content')

<div class="container py-4">

    <div class="card">
        <div class="card-body">

            <h4 class="mb-1">
                {{ strtoupper($type) }} TEST
            </h4>

            <p class="text-muted">
                {{ $modul->nama_modul }}
            </p>

            <form action="{{ route('learning.test.submit') }}" method="POST">
                @csrf

                <input type="hidden" name="modul_id" value="{{ $modul->id }}">
                <input type="hidden" name="type" value="{{ $type }}">

                @foreach($soals as $i => $soal)

                <div class="mb-4">

                    <h5>
                        {{ $i+1 }}.
                        {{ $soal->soal }}
                    </h5>

                    @foreach($soal->jawabans as $j)

                    <div class="form-check mt-2">
                        <input
                            class="form-check-input"
                            type="radio"
                            name="jawaban[{{ $soal->id }}]"
                            value="{{ $j->id }}"
                            required>

                        <label class="form-check-label">
                            {{ $j->jawaban }}
                        </label>
                    </div>

                    @endforeach

                </div>

                @endforeach

                <button class="btn btn-primary">
                    Submit Test
                </button>

            </form>

        </div>
    </div>

</div>

@endsection