@extends('app')

@section('content')

<div class="container-xxl flex-grow-1 container-p-y container-p-x">

    <h3 class="mb-4">My Learning</h3>

    {{-- FASE 1 --}}
    <div class="card mb-4">
        <div class="card-header">
            <h5>Fase 1 - Onboarding</h5>
        </div>

        <div class="card-body">

            @foreach($fase1 as $m)

            <a href="{{ route('learning.detail', $m->id) }}"
                class="text-decoration-none text-dark">

                <div class="border rounded p-3 mb-3 mt-3">

                    <div class="d-flex justify-content-between">

                        <div>
                            <h6>
                                {{ $m->kode_modul }} -
                                {{ $m->nama_modul }}
                            </h6>

                            <small class="text-muted">
                                {{ $m->tag_kompetensi }}
                            </small>
                        </div>

                        <span class="badge bg-primary py-4">
                            {{ $m->fase }}
                        </span>

                    </div>

                </div>

            </a>

            @endforeach

        </div>
    </div>

</div>

@endsection